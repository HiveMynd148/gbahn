import os
import re
import sys
import json
import time
import logging
from typing import List, Optional
from pydantic import BaseModel, Field
from pypdf import PdfReader
from google import genai
from google.genai import types

# Paths Setup
SCRAPER_DIR = os.path.dirname(os.path.abspath(__file__))
LOG_FILE_PATH = os.path.join(SCRAPER_DIR, "extraction_pipeline.log")

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] %(message)s",
    handlers=[
        logging.StreamHandler(sys.stdout),
        logging.FileHandler(LOG_FILE_PATH, encoding="utf-8")
    ]
)
logger = logging.getLogger("extract_rules")

# Add backend to path for importing resolution mapping
sys.path.insert(0, os.path.join(os.path.dirname(SCRAPER_DIR), "backend"))
from app.services.university_mapping import resolve_university_details

DOWNLOADS_DIR = os.path.join(SCRAPER_DIR, "downloads")
OUTPUT_DIR = os.path.join(SCRAPER_DIR, "extracted_rules")

# --- Pydantic Schema Definitions for Structured Gemini Response ---

class EctsThresholds(BaseModel):
    math: Optional[float] = Field(None, description="Minimum ECTS credits required in mathematics/theory/quantitative courses")
    cs: Optional[float] = Field(None, description="Minimum ECTS credits required in computer science/software engineering")
    theoretical_cs: Optional[float] = Field(None, description="Minimum ECTS credits required in theoretical computer science")
    practical_cs: Optional[float] = Field(None, description="Minimum ECTS credits required in practical computer science")

class QuantitativeRequirements(BaseModel):
    min_gpa_german_scale: Optional[float] = Field(None, description="Minimum GPA required on the German scale (1.0 is best, 4.0 is pass)")
    total_ects_required: Optional[int] = Field(None, description="Total ECTS credits required in the qualifying bachelor's degree")
    gre_required: bool = Field(False, description="Whether GRE score is strictly required (True/False)")
    ects_thresholds: EctsThresholds = Field(default_factory=EctsThresholds)

class QualitativeRequirements(BaseModel):
    has_vague_equivalence_clause: bool = Field(False, description="Does the regulation mention a vague equivalence clause (e.g. 'or equivalent')")
    equivalence_statement_raw: Optional[str] = Field(None, description="The raw statement describing equivalence of other degrees")
    core_reference_pillars: List[str] = Field(default_factory=list, description="Core pillars of the reference curriculum mentioned")

class Contingencies(BaseModel):
    allows_conditional_admission: bool = Field(False, description="Is conditional admission/enrollment allowed with missing ECTS")
    max_conditional_ects: Optional[int] = Field(None, description="Maximum missing ECTS credits allowed for conditional admission")
    notes: Optional[str] = Field(None, description="Any other admission rules, exceptions, or notes")

class StandardizedRequirements(BaseModel):
    assessment_type: str = Field("QUANTITATIVE", description="Type of assessment: QUANTITATIVE, QUALITATIVE, or HYBRID")
    quantitative: QuantitativeRequirements
    qualitative: QualitativeRequirements
    contingencies: Contingencies

class DeadlineDetail(BaseModel):
    applicant_origin: str = Field("ALL", description="Applicant origin category: EU, NON_EU, or ALL")
    semester: str = Field("WINTER", description="Semester: WINTER or SUMMER")
    portal_opens: Optional[str] = Field(None, description="Portal opening date in YYYY-MM-DD format (if found)")
    application_deadline: Optional[str] = Field(None, description="Application deadline date in YYYY-MM-DD format (if found)")

class RequiredDocumentDetail(BaseModel):
    document_name: str = Field(..., description="Name of the required document (e.g., CV, Transcript, English Certificate)")
    is_mandatory: bool = Field(True, description="Whether the document is mandatory")
    notes: Optional[str] = Field(None, description="Any specific notes or details about this document")

class ProgramDetails(BaseModel):
    name: str = Field(..., description="Name of the programme as written in the regulations")
    degree_type: str = Field("M.Sc.", description="Type of degree, e.g. M.Sc., M.Eng., etc.")
    nc_status: str = Field("NC_FREE", description="NC status: 'NC_FREE' or 'LOCAL_NC'")
    application_route: str = Field("DIRECT", description="Application route: 'DIRECT' or 'UNI_ASSIST'")
    application_fee_eur: Optional[float] = Field(None, description="Application fee in EUR (if any)")
    primary_teaching_language: Optional[str] = Field(None, description="Primary teaching language: English, German, or both")
    min_english_level: Optional[str] = Field(None, description="Minimum English language level, e.g. C1, B2")
    min_ielts_score: Optional[float] = Field(None, description="Minimum IELTS score required")
    min_german_level: Optional[str] = Field(None, description="Minimum German language level, e.g. None, A1, B2, C1")
    total_ects_required: Optional[int] = Field(None, description="Total ECTS credits required for graduation or admission")
    min_gpa_german_scale: Optional[float] = Field(None, description="Minimum GPA on the German scale")
    gre_required: str = Field("Not Required", description="GRE requirement: 'Required', 'Not Required', or 'Recommended'")
    is_free_tuition: bool = Field(True, description="Whether tuition is free (except administrative fees)")
    tuition_fee_per_semester: Optional[float] = Field(None, description="Tuition fee per semester in EUR (if not free)")
    requirements: StandardizedRequirements
    deadlines: List[DeadlineDetail] = Field(default_factory=list)
    required_documents: List[RequiredDocumentDetail] = Field(default_factory=list)

class AdmissionRequirementsPayload(BaseModel):
    university_name: str = Field(..., description="Name of the university as written in the regulations")
    university_location: str = Field(..., description="City or location of the university")
    university_federal_state: Optional[str] = Field(None, description="Federal state of the university in Germany (if known)")
    university_institution_type: str = Field("University", description="Institution type: 'University', 'Technical University', or 'University of Applied Sciences'")
    university_website_url: Optional[str] = Field(None, description="Official university website URL (if found)")
    program: ProgramDetails
    data_source: Optional[str] = Field(None, description="Data provenance: GEMINI_EXTRACTED or FALLBACK_GENERATED", alias="_data_source")



# --- Helper Functions ---

def load_env_manually():
    """
    Manually parses the root .env file and sets environment variables.
    This guarantees that the GEMINI_API_KEY is available even if python-dotenv is not installed.
    """
    env_path = os.path.join(os.path.dirname(SCRAPER_DIR), ".env")
    if os.path.exists(env_path):
        logger.info(f"Loading environment variables manually from {env_path}")
        with open(env_path, "r", encoding="utf-8") as f:
            for line in f:
                line = line.strip()
                if line and not line.startswith("#") and "=" in line:
                    key, val = line.split("=", 1)
                    # Strip quotes around value if they exist
                    val_str = val.strip().strip("'").strip('"')
                    os.environ[key.strip()] = val_str
    else:
        logger.warning(f"No .env file found at {env_path}")

def extract_pdf_text(pdf_path: str) -> str:
    """
    Phase 1: Local Text Extraction
    Step 2: extracts the raw string character arrays per page slice.
    Step 3: Malformed characters and space fragments are captured into an active string container.
    """
    filename = os.path.basename(pdf_path)
    logger.info(f"Step 2 & 3: Extracting and normalizing text from {filename}...")
    
    reader = PdfReader(pdf_path)
    extracted_slices = []
    
    for i, page in enumerate(reader.pages):
        page_text = page.extract_text()
        if page_text:
            # Step 3: Remove malformed control character bytes, keeping printable characters and standard whitespace
            page_text = re.sub(r'[\x00-\x08\x0b\x0c\x0e-\x1f\x7f]', '', page_text)
            extracted_slices.append(page_text)
        else:
            logger.warning(f"Page {i+1} in {filename} returned no text.")
            
    # Concatenate page slices with page break markers
    raw_full_text = "\n\n--- PAGE BREAK ---\n\n".join(extracted_slices)
    char_count = len(raw_full_text)
    logger.info(f"Successfully extracted {char_count} characters across {len(reader.pages)} pages from {filename}.")
    return raw_full_text

def generate_fallback_payload(uni_name: str, prog_name: str) -> AdmissionRequirementsPayload:
    """
    Fallback method to generate a highly realistic, schema-compliant mock JSON payload
    when Gemini API quota is exhausted, ensuring the database hydrator can be fully tested.
    """
    uni_lower = uni_name.lower()
    # Deduce location, state and type from university name using resolution mapping
    loc, state, inst_type = resolve_university_details(uni_name)
    
    # Fallbacks if mapping fails
    if not loc:
        loc = "Germany"
    if not state:
        state = "Germany"
    if not inst_type:
        if "technische" in uni_lower or "technical" in uni_lower or "tu" in uni_lower:
            inst_type = "Technical University"
        elif "applied" in uni_lower or "hochschule" in uni_lower or "fh" in uni_lower:
            inst_type = "University of Applied Sciences"
        else:
            inst_type = "University"
        
    has_math = any(w in prog_name.lower() for w in ["computational", "science", "math", "econometrics"])
    
    return AdmissionRequirementsPayload(
        university_name=uni_name,
        university_location=loc,
        university_federal_state=state,
        university_institution_type=inst_type,
        university_website_url=f"https://www.{uni_name.lower().replace(' ', '-').replace('ü', 'u').replace('ö', 'o').replace('ä', 'a')}.de",
        program=ProgramDetails(
            name=prog_name,
            degree_type="M.Sc.",
            nc_status="NC_FREE" if "intelligence" in prog_name.lower() or "computing" in prog_name.lower() else "LOCAL_NC",
            application_route="UNI_ASSIST" if "technische" in uni_lower or "applied" in uni_lower else "DIRECT",
            application_fee_eur=75.0 if ("applied" in uni_lower or "technische" in uni_lower) else None,
            primary_teaching_language="English",
            min_english_level="C1" if "data" in prog_name.lower() or "artificial" in prog_name.lower() else "B2",
            min_ielts_score=7.0 if "data" in prog_name.lower() or "artificial" in prog_name.lower() else 6.5,
            min_german_level="None" if "english" in prog_name.lower() or "intelligence" in prog_name.lower() or "data" in prog_name.lower() else "A1",
            total_ects_required=120,
            min_gpa_german_scale=2.5,
            gre_required="Recommended" if "darmstadt" in uni_lower or "kit" in uni_lower else "Not Required",
            is_free_tuition=True,
            tuition_fee_per_semester=None,
            requirements=StandardizedRequirements(
                assessment_type="HYBRID",
                quantitative=QuantitativeRequirements(
                    min_gpa_german_scale=2.5,
                    total_ects_required=180,
                    gre_required=False,
                    ects_thresholds=EctsThresholds(
                        math=24.0 if has_math else 12.0,
                        cs=30.0,
                        theoretical_cs=12.0,
                        practical_cs=18.0
                    )
                ),
                qualitative=QualitativeRequirements(
                    has_vague_equivalence_clause=True,
                    equivalence_statement_raw="Or an equivalent degree in computer science, mathematics, or closely related quantitative fields.",
                    core_reference_pillars=["Mathematics", "Computer Science", "Programming"]
                ),
                contingencies=Contingencies(
                    allows_conditional_admission=True,
                    max_conditional_ects=30,
                    notes="Missing admission requirements can be completed within the first two semesters."
                )
            ),
            deadlines=[
                DeadlineDetail(applicant_origin="EU", semester="WINTER", portal_opens="2026-05-01", application_deadline="2026-07-15"),
                DeadlineDetail(applicant_origin="NON_EU", semester="WINTER", portal_opens="2026-03-01", application_deadline="2026-05-31")
            ],
            required_documents=[
                RequiredDocumentDetail(document_name="Bachelor's Degree Certificate", is_mandatory=True, notes="With certified English or German translation"),
                RequiredDocumentDetail(document_name="Transcript of Records", is_mandatory=True, notes="Showing all completed semesters and grades"),
                RequiredDocumentDetail(document_name="CV / Resume", is_mandatory=True),
                RequiredDocumentDetail(document_name="English Language Certificate", is_mandatory=True, notes="TOEFL (min 88), IELTS (min 6.5) or equivalent")
            ]
        )
    )

def load_po_links_metadata() -> dict:
    """
    Reads scraped_po_links.csv to fetch the exact, unsanitized university names and programme titles
    for each programme_id, preventing underscore splitting errors.
    """
    metadata = {}
    csv_path = os.path.join(SCRAPER_DIR, "scraped_po_links.csv")
    if os.path.exists(csv_path):
        import csv
        logger.info(f"Loading metadata from CSV file at {csv_path}...")
        try:
            try:
                with open(csv_path, "r", encoding="utf-8-sig") as f:
                    reader = csv.DictReader(f)
                    for row in reader:
                        pid = row.get("programme_id")
                        if pid:
                            metadata[pid] = {
                                "university_name": row.get("university_name", "Unknown University").strip(),
                                "programme_title": row.get("programme_title", "Unknown Programme").strip()
                            }
            except UnicodeDecodeError:
                with open(csv_path, "r", encoding="cp1252") as f:
                    reader = csv.DictReader(f)
                    for row in reader:
                        pid = row.get("programme_id")
                        if pid:
                            metadata[pid] = {
                                "university_name": row.get("university_name", "Unknown University").strip(),
                                "programme_title": row.get("programme_title", "Unknown Programme").strip()
                            }
            logger.info(f"Successfully loaded {len(metadata)} metadata entries from CSV.")
        except Exception as e:
            logger.error(f"Failed to read CSV for metadata lookup: {e}")
    else:
        logger.warning(f"Metadata CSV not found at {csv_path}. Splitting names from filenames as fallback.")
    return metadata

def run_extraction_pipeline():
    # 1. Load environment and verify GEMINI_API_KEY
    load_env_manually()
    api_key = os.environ.get("GEMINI_API_KEY")
    if not api_key:
        logger.error("GEMINI_API_KEY not found in environment variables. Please check your .env file.")
        sys.exit(1)
        
    # 2. Establish authorized genai.Client (Step 4)
    logger.info("Step 4: Establishing authorized genai.Client channel...")
    client = genai.Client(api_key=api_key)
    
    # 3. Load PO links CSV metadata for accurate naming
    po_metadata = load_po_links_metadata()
    
    # 4. Scan Gradbahn/Scraper/downloads/ for matching .pdf files (Step 1)
    if not os.path.exists(DOWNLOADS_DIR):
        logger.error(f"Downloads directory not found at {DOWNLOADS_DIR}")
        sys.exit(1)
        
    os.makedirs(OUTPUT_DIR, exist_ok=True)
    pdf_files = [f for f in os.listdir(DOWNLOADS_DIR) if f.lower().endswith(".pdf")]
    logger.info(f"Step 1: Found {len(pdf_files)} PDF files in downloads folder.")
    
    if not pdf_files:
        logger.info("No PDF files found to extract rules from. Exiting.")
        return

    # Loop through each PDF file sequentially
    for index, filename in enumerate(pdf_files, 1):
        # Extract metadata from filename (format: <programme_id>_<uni>_<title>.pdf)
        parts = filename.replace(".pdf", "").split("_", 2)
        programme_id = parts[0] if parts else f"unknown_{index}"
        
        # Lookup exact name from CSV if available, otherwise fallback to filename split
        if programme_id in po_metadata:
            uni_context = po_metadata[programme_id]["university_name"]
            prog_context = po_metadata[programme_id]["programme_title"]
        else:
            uni_context = parts[1].replace("_", " ") if len(parts) > 1 else "Unknown University"
            prog_context = parts[2].replace("_", " ") if len(parts) > 2 else "Unknown Programme"
        
        output_file_path = os.path.join(OUTPUT_DIR, f"{programme_id}.json")
        
        # Skip if already extracted to avoid duplicate API usage (can delete to force re-run)
        if os.path.exists(output_file_path):
            logger.info(f"[{index}/{len(pdf_files)}] File {programme_id}.json already exists. Skipping extraction.")
            continue
            
        logger.info(f"\n--- Processing [{index}/{len(pdf_files)}]: {filename} (ID: {programme_id}) ---")
        pdf_path = os.path.join(DOWNLOADS_DIR, filename)
        
        try:
            # Phase 1: Local Text Extraction (Steps 2 and 3)
            raw_text = extract_pdf_text(pdf_path)
            
            # Phase 2: Structural AI Orchestration (Steps 5 and 6)
            logger.info(f"Step 5: Constructing structured payload for {programme_id}...")
            
            prompt = (
                f"Identify and extract the admission criteria for the following university programme:\n"
                f"University Context: {uni_context}\n"
                f"Programme Context: {prog_context}\n\n"
                f"Below is the raw text extracted page-by-page from the official examination regulation/SPO document:\n"
                f"========================================================================\n"
                f"{raw_text}\n"
                f"========================================================================\n"
            )
            
            logger.info(f"Step 6: Querying gemini-2.5-flash with structured response schema...")
            
            # Requesting JSON structure directly from the Gemini API
            response = client.models.generate_content(
                model='gemini-2.5-flash',
                contents=prompt,
                config=types.GenerateContentConfig(
                    system_instruction=(
                        "You are a precise academic data extractor. Your job is to extract admission and "
                        "entry requirements from the provided university examination regulations. "
                        "Ensure your focus is SOLELY on admission entries (e.g. required degree, min grade/GPA, "
                        "language thresholds, ECTS required in specific subject categories like Maths, Theoretical CS, "
                        "deadlines, and list of required documents).\n\n"
                        "CRITICAL: Do NOT extract graduation quotas, study plans, internal module structures, "
                        "or graduation criteria. ONLY admission/entrance criteria count."
                    ),
                    response_mime_type="application/json",
                    response_schema=AdmissionRequirementsPayload,
                ),
            )
            
            # Phase 3: Serialization & Validation (Step 8)
            response_text = response.text.strip()
            
            # Strip markdown block formatting if present
            if response_text.startswith("```"):
                response_text = re.sub(r"^```[a-zA-Z]*\n", "", response_text)
                response_text = re.sub(r"\n```$", "", response_text)
                response_text = response_text.strip()
                
            logger.info("Step 8: Validating response against Pydantic schema...")
            # Validates that the returned JSON string complies perfectly with the schema
            validated_payload = AdmissionRequirementsPayload.model_validate_json(response_text)
            
            # Save the formatted pretty-printed validated JSON to disk, tagged as genuinely extracted
            output_data = validated_payload.model_dump()
            output_data["_data_source"] = "GEMINI_EXTRACTED"
            with open(output_file_path, "w", encoding="utf-8") as out_f:
                json.dump(output_data, out_f, indent=2, ensure_ascii=False)
                
            logger.info(f"Step 8 Success: Validated and serialized GEMINI_EXTRACTED rules to {output_file_path}")
            
        except Exception as e:
            logger.error(f"ERROR: Failed to extract rules for {filename}: {e}", exc_info=True)
            
        # Phase 3 Throttling (Step 7)
        # Stay completely safe within developer free-tier threshold limits (15 RPM -> 4s sleep minimum, 4.5s recommended)
        if index < len(pdf_files):
            logger.info(f"Step 7 Throttling: Sleeping for 4.5 seconds to protect API rate limits...")
            time.sleep(4.5)

    logger.info("\nRule Extraction Pipeline completed successfully.")

if __name__ == "__main__":
    run_extraction_pipeline()
