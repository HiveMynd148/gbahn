import os
import re
import sys
import json
import logging
import time
import httpx
from bs4 import BeautifulSoup
from google import genai
from google.genai import types
from pydantic import BaseModel, Field
from typing import List, Optional, Tuple, Dict, Any
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker

# Setup Paths
BACKEND_DIR = os.path.dirname(os.path.abspath(__file__))
LOG_FILE_PATH = os.path.join(BACKEND_DIR, "website_audit.log")

# Configure Logging
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] %(message)s",
    handlers=[
        logging.StreamHandler(sys.stdout),
        logging.FileHandler(LOG_FILE_PATH, encoding="utf-8")
    ]
)
logger = logging.getLogger("website_auditor")

# Manually load environment variables from .env if running on host
env_path = os.path.join(os.path.dirname(BACKEND_DIR), ".env")
if os.path.exists(env_path):
    logger.info(f"Loading environment variables from {env_path}")
    with open(env_path, "r", encoding="utf-8") as f:
        for line in f:
            line = line.strip()
            if line and not line.startswith("#") and "=" in line:
                key, val = line.split("=", 1)
                os.environ[key.strip()] = val.strip().strip("'").strip('"')

# Database connection setup
db_url = os.environ.get("DATABASE_URL")
if not db_url:
    logger.error("DATABASE_URL not found in environment variables.")
    sys.exit(1)

# If running on the host system, map container host 'db' to 'localhost'
# If running in Docker container, it remains '@db:' and resolves correctly
if "@db:" in db_url and not os.path.exists("/.dockerenv") and not os.environ.get("AM_I_IN_DOCKER"):
    # Check if we can connect to localhost instead (in case host postgres is binding loopback)
    db_url = db_url.replace("@db:", "@localhost:")
    logger.info("Translated database host 'db' to 'localhost' for host system execution.")

# Setup SQLAlchemy engine and session
engine = create_engine(db_url)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

# Add backend directory to sys.path
sys.path.insert(0, BACKEND_DIR)
from app.models.programme import Programme, Deadline, RequiredDocument, DataSource
from app.models.university import University

# --- Schema Definitions for Website Scraping Analysis ---

class WebsiteDeadline(BaseModel):
    semester: str = Field(..., description="The intake semester: 'WINTER' or 'SUMMER'")
    application_deadline: Optional[str] = Field(None, description="Application deadline date in YYYY-MM-DD format (if exact date is found), or description e.g. 'July 15'")

class WebsiteRequirements(BaseModel):
    name: Optional[str] = Field(None, description="Official name of the master program")
    nc_status: Optional[str] = Field(None, description="Admission status: 'LOCAL_NC', 'NC_FREE' or 'None'")
    application_route: Optional[str] = Field(None, description="Method of application: 'uni-assist' or 'Direct'")
    application_fee_eur: Optional[float] = Field(None, description="Application or processing fee in EUR")
    min_gpa_german_scale: Optional[float] = Field(None, description="Minimum bachelor grade required in German scale (e.g. 2.5)")
    total_ects_required: Optional[int] = Field(None, description="Total ECTS credits of the qualifying bachelor degree (e.g. 180)")
    gre_required: Optional[str] = Field(None, description="Is GRE score required: 'Not Required', 'Advisable', 'Recommended', 'Mandatory'")
    ects_math: Optional[float] = Field(None, description="Minimum ECTS required in Mathematics/Theory/Quantitative methods")
    ects_cs: Optional[float] = Field(None, description="Minimum ECTS required in Computer Science")
    ects_theoretical_cs: Optional[float] = Field(None, description="Minimum ECTS required in Theoretical Computer Science")
    ects_practical_cs: Optional[float] = Field(None, description="Minimum ECTS required in Practical Computer Science")
    min_english_level: Optional[str] = Field(None, description="English proficiency level required (e.g. B2, C1)")
    min_ielts_score: Optional[float] = Field(None, description="Minimum IELTS score required (e.g. 6.5, 7.0)")
    deadlines: List[WebsiteDeadline] = Field(default_factory=list, description="Application deadlines found on the webpage")

# --- Scraper Helper Functions ---

def scrape_webpage(url: str) -> Optional[str]:
    """
    Fetches the HTML content of the program page and extracts clean text.
    """
    logger.info(f"Scraping webpage: {url}")
    headers = {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36"
    }
    try:
        with httpx.Client(follow_redirects=True, timeout=15.0) as client:
            response = client.get(url, headers=headers)
        
        if response.status_code != 200:
            logger.error(f"Failed to fetch {url}: HTTP {response.status_code}")
            return None
            
        soup = BeautifulSoup(response.text, "html.parser")
        
        # Remove interactive/styling elements to keep text clean and reduce tokens
        for el in soup(["script", "style", "meta", "noscript", "header", "footer", "nav", "aside"]):
            el.decompose()
            
        text = soup.get_text(separator="\n")
        
        # Strip excessive blank lines and spaces
        lines = (line.strip() for line in text.splitlines())
        chunks = (phrase for line in lines for phrase in line.split("  "))
        text_clean = "\n".join(chunk for chunk in chunks if chunk)
        
        return text_clean[:100000] # Limit to 100k characters
    except Exception as e:
        logger.error(f"Error scraping {url}: {e}")
        return None

def extract_website_requirements(client: genai.Client, text: str, prog_name: str, uni_name: str) -> Optional[WebsiteRequirements]:
    """
    Sends the cleaned webpage text to Gemini to extract structured admission requirements.
    """
    logger.info(f"Querying Gemini for '{prog_name}' at '{uni_name}'...")
    prompt = (
        f"Extract the official admission criteria and requirements for this university programme:\n"
        f"University Name: {uni_name}\n"
        f"Programme Title: {prog_name}\n\n"
        f"Here is the text extracted from the programme's official webpage:\n"
        f"========================================================================\n"
        f"{text}\n"
        f"========================================================================\n"
    )
    try:
        response = client.models.generate_content(
            model='gemini-2.5-flash',
            contents=prompt,
            config=types.GenerateContentConfig(
                system_instruction=(
                    "You are a precise academic data extractor. Extract admission criteria "
                    "from the provided webpage text. Map them strictly to the response schema. "
                    "If a value is not mentioned or cannot be inferred, leave it as null/empty. "
                    "Be especially precise about ECTS thresholds, IELTS/English scores, and deadlines."
                ),
                response_mime_type="application/json",
                response_schema=WebsiteRequirements,
            ),
        )
        response_text = response.text.strip()
        if response_text.startswith("```"):
            response_text = re.sub(r"^```[a-zA-Z]*\n", "", response_text)
            response_text = re.sub(r"\n```$", "", response_text)
            response_text = response_text.strip()
            
        return WebsiteRequirements.model_validate_json(response_text)
    except Exception as e:
        logger.error(f"Gemini extraction failed: {e}")
        return None

# --- Comparison Engine ---

def audit_field(field_name: str, db_val: Any, web_val: Any) -> Tuple[Optional[str], Optional[str]]:
    """
    Compares a single database value with a scraped website value.
    Returns (status_type, log_message) or (None, None).
    """
    db_is_empty = db_val is None or (isinstance(db_val, str) and db_val.strip() == "")
    web_is_empty = web_val is None or (isinstance(web_val, str) and web_val.strip() == "")
    
    if db_is_empty and web_is_empty:
        return None, None
        
    if db_is_empty and not web_is_empty:
        return "MISSING_IN_DB", f"[MISSING IN DB] Field '{field_name}': DB is missing, Website='{web_val}'"
        
    if not db_is_empty and web_is_empty:
        return "MISSING_ON_WEBSITE", f"[MISSING ON WEBSITE] Field '{field_name}': DB='{db_val}', Website is missing/silent"
        
    # Match normalization for floats/numbers
    if isinstance(db_val, (int, float)) or isinstance(web_val, (int, float)):
        try:
            if abs(float(db_val) - float(web_val)) > 0.01:
                return "MISMATCH", f"[MISMATCH] Field '{field_name}': DB='{db_val}', Website='{web_val}'"
            return None, None
        except ValueError:
            pass
            
    # Match normalization for strings (case-insensitive)
    db_str = str(db_val).strip().lower()
    web_str = str(web_val).strip().lower()
    
    if db_str != web_str:
        # Route normalization (uni-assist vs Direct)
        if field_name == "application_route":
            db_norm = "uni-assist" if "uni" in db_str else "Direct"
            web_norm = "uni-assist" if "uni" in web_str else "Direct"
            if db_norm == web_norm:
                return None, None
        # NC status normalization
        if field_name == "nc_status":
            db_norm = "NC" if ("local" in db_str or "nc" in db_str) and "free" not in db_str else "NC Free"
            web_norm = "NC" if ("local" in web_str or "nc" in web_str) and "free" not in web_str else "NC Free"
            if db_norm == web_norm:
                return None, None
        # GRE status normalization
        if field_name == "gre_required":
            db_norm = "mandatory" if "mandatory" in db_str or "yes" in db_str else "not required"
            web_norm = "mandatory" if "mandatory" in web_str or "yes" in web_str else "not required"
            if db_norm == web_norm:
                return None, None
                
        return "MISMATCH", f"[MISMATCH] Field '{field_name}': DB='{db_val}', Website='{web_val}'"
        
    return None, None

def run_audit():
    """
    Main runner for auditing all programs with website URLs against the database content.
    """
    logger.info("="*60)
    logger.info("STARTING WEBSITE AUDIT SCRAPER IN CONTAINER")
    logger.info("="*60)
    
    api_key = os.environ.get("GEMINI_API_KEY")
    if not api_key:
        logger.error("GEMINI_API_KEY not found in environment. Exiting.")
        sys.exit(1)
        
    client = genai.Client(api_key=api_key)
    db = SessionLocal()
    
    try:
        # Fetch all programs with a valid website URL
        programmes = db.query(Programme).filter(Programme.programme_website_url != None).all()
        logger.info(f"Found {len(programmes)} programs in DB with website URLs to audit.")
        
        audit_results = {
            "mismatch": 0,
            "missing_on_website": 0,
            "missing_in_db": 0,
            "total_audited": 0,
            "errors": 0
        }
        
        for index, prog in enumerate(programmes, 1):
            logger.info(f"\n[{index}/{len(programmes)}] Auditing program: '{prog.name}' at '{prog.university.name}'")
            logger.info(f"URL: {prog.programme_website_url}")
            
            # Scrape
            html_text = scrape_webpage(prog.programme_website_url)
            if not html_text:
                logger.warning(f"Could not retrieve webpage text for '{prog.name}'. Skipping.")
                audit_results["errors"] += 1
                continue
                
            # Extract via Gemini
            web_req = extract_website_requirements(client, html_text, prog.name, prog.university.name)
            if not web_req:
                logger.warning(f"Could not parse requirements for '{prog.name}' using Gemini. Skipping.")
                audit_results["errors"] += 1
                continue
                
            # Perform comparisons on individual fields
            logger.info(f"--- Comparison Log for '{prog.name}' ---")
            mismatches_found = 0
            missing_website = 0
            missing_db = 0
            
            comparisons = [
                ("nc_status", prog.nc_status, web_req.nc_status),
                ("application_route", prog.application_route, web_req.application_route),
                ("application_fee_eur", prog.application_fee_eur, web_req.application_fee_eur),
                ("min_gpa_german_scale", prog.min_gpa_german_scale, web_req.min_gpa_german_scale),
                ("total_ects_required", prog.total_ects_required, web_req.total_ects_required),
                ("gre_required", prog.gre_required, web_req.gre_required),
                ("required_math_ects", prog.required_math_ects, web_req.ects_math),
                ("required_cs_ects", prog.required_cs_ects, web_req.ects_cs),
                ("min_english_level", prog.min_english_level if hasattr(prog, 'min_english_level') else None, web_req.min_english_level),
                ("min_ielts_score", prog.min_ielts_score if hasattr(prog, 'min_ielts_score') else None, web_req.min_ielts_score),
            ]
            
            for field, db_val, web_val in comparisons:
                status, log_msg = audit_field(field, db_val, web_val)
                if status == "MISMATCH":
                    logger.warning(log_msg)
                    mismatches_found += 1
                elif status == "MISSING_ON_WEBSITE":
                    logger.info(log_msg)
                    missing_website += 1
                elif status == "MISSING_IN_DB":
                    logger.info(log_msg)
                    missing_db += 1
                    
            # Audit Deadlines
            db_deadlines = {d.semester: d.application_deadline.strftime("%Y-%m-%d") if d.application_deadline else None for d in prog.deadlines}
            web_deadlines = {wd.semester: wd.application_deadline for wd in web_req.deadlines}
            
            for sem in ["WINTER", "SUMMER"]:
                db_d = db_deadlines.get(sem)
                web_d = web_deadlines.get(sem)
                
                db_empty = db_d is None
                web_empty = web_d is None
                
                if db_empty and not web_empty:
                    logger.info(f"[MISSING IN DB] Deadline for {sem}: DB is missing, Website='{web_d}'")
                    missing_db += 1
                elif not db_empty and web_empty:
                    logger.info(f"[MISSING ON WEBSITE] Deadline for {sem}: DB='{db_d}', Website is missing/silent")
                    missing_website += 1
                elif not db_empty and not web_empty:
                    # Basic match comparison (e.g. check if the day and month match or simple string equal)
                    if str(db_d)[5:] != str(web_d)[5:] and str(db_d) != str(web_d):
                        logger.warning(f"[MISMATCH] Deadline for {sem}: DB='{db_d}', Website='{web_d}'")
                        mismatches_found += 1
            
            audit_results["mismatch"] += mismatches_found
            audit_results["missing_on_website"] += missing_website
            audit_results["missing_in_db"] += missing_db
            audit_results["total_audited"] += 1
            
            logger.info(f"Finished audit for '{prog.name}'. Mismatches: {mismatches_found}, Missing on Website: {missing_website}, Missing in DB: {missing_db}")
            
            # Throttling delay to protect Gemini API RPM limits
            if index < len(programmes):
                time.sleep(4.5)
                
        # Final Summary
        logger.info("\n" + "="*60)
        logger.info("WEBSITE AUDIT COMPLETE SUMMARY")
        logger.info("="*60)
        logger.info(f"Total Programs Audited:         {audit_results['total_audited']}")
        logger.info(f"Total Data Mismatches:          {audit_results['mismatch']}")
        logger.info(f"Total Data Missing on Website:  {audit_results['missing_on_website']}")
        logger.info(f"Total Data Missing in Database: {audit_results['missing_in_db']}")
        logger.info(f"Failed / Connection Errors:     {audit_results['errors']}")
        logger.info(f"Full audit details saved to: {LOG_FILE_PATH}")
        logger.info("="*60)
        
    except Exception as e:
        logger.error(f"Audit run failed with error: {e}", exc_info=True)
    finally:
        db.close()

if __name__ == "__main__":
    run_audit()
