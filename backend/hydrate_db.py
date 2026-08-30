import os
import sys
import json
import argparse
import logging
from typing import List, Optional
from datetime import datetime, timezone
from uuid import uuid4

# Add the backend directory to the system path to allow app imports
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from sqlalchemy import func
from app.database import SessionLocal, engine
from app.models.university import University, InstitutionType
from app.models.programme import Programme, Deadline, RequiredDocument, ApplicantOrigin, DataSource
from app.services.university_mapping import resolve_university_details, resolve_canonical_university_name

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] %(message)s",
    handlers=[
        logging.StreamHandler(sys.stdout)
    ]
)
logger = logging.getLogger("hydrate_db")

def parse_args():
    parser = argparse.ArgumentParser(description="Hydrate PostgreSQL database with university admission regulations.")
    parser.add_argument(
        "--overwrite",
        action="store_true",
        help="Overwrite existing university and programme data if they already exist in the database."
    )
    parser.add_argument(
        "--json-dir",
        type=str,
        default=os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), "Scraper", "extracted_rules"),
        help="Directory containing the extracted structured JSON rules."
    )
    return parser.parse_args()

def map_institution_type(inst_type_str: str) -> InstitutionType:
    """
    Safely maps the institution type string to the InstitutionType enum.
    """
    type_lower = inst_type_str.lower()
    if "technical" in type_lower or "tu" in type_lower:
        return InstitutionType.TU
    elif "applied" in type_lower or "fh" in type_lower or "hochschule" in type_lower:
        return InstitutionType.FH
    else:
        return InstitutionType.UNI

def map_application_route(route_str: str) -> str:
    """
    Maps upper-case strings or other forms of routes to standard user-readable strings:
    - 'uni-assist'
    - 'Direct'
    """
    route_lower = route_str.lower()
    if "uni" in route_lower or "assist" in route_lower:
        return "uni-assist"
    else:
        return "Direct"

def map_gre_requirement(gre_val) -> str:
    """
    Ensures the GRE requirement string is strictly mapped to one of the four valid values:
    - 'Not Required'
    - 'Advisable'
    - 'Recommended'
    - 'Mandatory'
    """
    if not gre_val:
        return "Not Required"
    gre_str = str(gre_val).strip()
    gre_lower = gre_str.lower()
    if gre_lower in ("false", "no", "not required", "not_required"):
        return "Not Required"
    elif gre_lower in ("true", "yes", "mandatory"):
        return "Mandatory"
    elif "advisable" in gre_lower:
        return "Advisable"
    elif "recommend" in gre_lower:
        return "Recommended"
    else:
        return "Not Required"

def map_data_source(payload: dict) -> DataSource:
    """
    Reads the _data_source metadata field from the JSON payload to determine provenance.
    Falls back to heuristic detection if the field is missing (for pre-tagged files).
    """
    raw = payload.get("_data_source", "").strip().upper()
    if raw == "GEMINI_EXTRACTED":
        return DataSource.GEMINI_EXTRACTED
    elif raw == "FALLBACK_GENERATED":
        return DataSource.FALLBACK_GENERATED
    elif raw == "MANUAL":
        return DataSource.MANUAL
    elif raw:
        return DataSource.UNVERIFIED
    
    # Heuristic detection for files without the _data_source tag:
    # All fallback files have this identical contingency note
    program = payload.get("program", {})
    req = program.get("requirements", {})
    contingencies = req.get("contingencies", {})
    notes = contingencies.get("notes", "")
    eq_raw = req.get("qualitative", {}).get("equivalence_statement_raw", "")
    
    fallback_note = "Missing admission requirements can be completed within the first two semesters."
    fallback_eq = "Or an equivalent degree in computer science, mathematics, or closely related quantitative fields."
    
    if notes == fallback_note and eq_raw == fallback_eq:
        return DataSource.FALLBACK_GENERATED
    
    return DataSource.UNVERIFIED

def parse_date(date_str: Optional[str]) -> Optional[datetime]:
    """
    Attempts to parse date string in ISO or standard format resiliently and return a UTC timezone-aware datetime.
    """
    if not date_str:
        return None
    date_str = date_str.strip()
    # Normalize ISO formatting
    normalized = date_str.replace("Z", "")
    for fmt in ("%Y-%m-%d", "%Y-%m-%dT%H:%M:%S", "%Y-%m-%dT%H:%M:%S.%f"):
        try:
            dt = datetime.strptime(normalized, fmt)
            return dt.replace(tzinfo=timezone.utc)
        except ValueError:
            continue
    logger.warning(f"Could not parse date string: '{date_str}'")
    return None

def hydrate_database(json_dir: str, overwrite: bool):
    if not os.path.exists(json_dir):
        logger.error(f"JSON rules directory does not exist: {json_dir}")
        sys.exit(1)
        
    json_files = [f for f in os.listdir(json_dir) if f.lower().endswith(".json")]
    logger.info(f"Found {len(json_files)} extracted JSON files in {json_dir} for database hydration.")
    
    if not json_files:
        logger.info("No JSON files found. Exiting.")
        return
        
    # Load scraped programme websites if available
    programme_websites = {}
    websites_json_path = os.path.join(os.path.dirname(os.path.abspath(__file__)), "Scraper 2", "programme_websites.json")
    if os.path.exists(websites_json_path):
        try:
            with open(websites_json_path, "r", encoding="utf-8") as f:
                programme_websites = json.load(f)
            logger.info(f"Loaded {len(programme_websites)} programme website URLs for hydration.")
        except Exception as e:
            logger.warning(f"Failed to load programme websites JSON for hydration: {e}")

    db = SessionLocal()
    
    try:
        success_count = 0
        skip_count = 0
        error_count = 0
        
        for index, filename in enumerate(json_files, 1):
            logger.info(f"\nHydrating [{index}/{len(json_files)}]: {filename}...")
            filepath = os.path.join(json_dir, filename)
            
            try:
                with open(filepath, "r", encoding="utf-8") as f:
                    payload = json.load(f)
                    
                # Extract details from payload
                uni_name = payload["university_name"].strip()
                uni_loc = payload["university_location"].strip()
                uni_state = payload.get("university_federal_state")
                uni_web = payload.get("university_website_url")
                inst_type = map_institution_type(payload["university_institution_type"])
                
                # Resolve correct location and state from mapping service
                # Resolve correct location and state from mapping service
                resolved_city, resolved_state, resolved_type = resolve_university_details(uni_name)
                if resolved_city and resolved_state:
                    uni_loc = resolved_city
                    uni_state = resolved_state
                    if resolved_type:
                        inst_type = map_institution_type(resolved_type)
                
                # Resolve canonical name using the mapping service
                canonical_uni_name = resolve_canonical_university_name(uni_name)
                
                # Step 10: Query live PostgreSQL database for University using strict case-insensitive exact matching
                db_uni = db.query(University).filter(
                    func.lower(University.name) == func.lower(canonical_uni_name)
                ).first()
                
                if db_uni:
                    logger.info(f"Matched existing University in DB: '{db_uni.name}' (ID: {db_uni.id})")
                    if overwrite:
                        logger.info(f"Overwriting details for university: '{db_uni.name}'")
                        db_uni.location = uni_loc
                        if uni_state:
                            db_uni.federal_state = uni_state
                        db_uni.institution_type = inst_type
                        if uni_web:
                            db_uni.website_url = uni_web
                        db.commit()
                else:
                    # Concern 2: Create new University row if missing
                    logger.info(f"No match for '{uni_name}'. Dynamically creating new University row.")
                    db_uni = University(
                        id=uuid4(),
                        name=canonical_uni_name,
                        location=uni_loc,
                        federal_state=uni_state,
                        country="Germany",
                        institution_type=inst_type,
                        website_url=uni_web
                    )
                    db.add(db_uni)
                    db.commit()
                    db.refresh(db_uni)
                    logger.info(f"Created new University row with ID: {db_uni.id}")
                    
                # Extract programme details
                prog_data = payload["program"]
                prog_name = prog_data["name"].strip()
                
                # Extract structured ECTS requirements if present
                req = prog_data.get("requirements")
                req_math = None
                req_cs = None
                if req and isinstance(req, dict):
                    quant = req.get("quantitative")
                    if quant and isinstance(quant, dict):
                        thresholds = quant.get("ects_thresholds")
                        if thresholds and isinstance(thresholds, dict):
                            req_math = thresholds.get("math")
                            req_cs = thresholds.get("cs")
                
                # Determine data source provenance before programme query
                data_source_enum = map_data_source(payload)
                if data_source_enum == DataSource.FALLBACK_GENERATED:
                    logger.warning(f"⚠️  Programme '{prog_name}' at '{uni_name}' uses FALLBACK-GENERATED data — NOT verified!")
                
                # Step 10: Query live PostgreSQL database for Programme using strict case-insensitive exact matching
                db_prog = db.query(Programme).filter(
                    Programme.university_id == db_uni.id,
                    func.lower(Programme.name) == func.lower(prog_name)
                ).first()
                
                if db_prog:
                    logger.info(f"Matched existing Programme in DB: '{db_prog.name}' (ID: {db_prog.id})")
                    if not overwrite:
                        logger.info(f"Overwrite flag disabled. Skipping updates for programme '{db_prog.name}'.")
                        skip_count += 1
                        continue
                    else:
                        # Concern 1: Overwrite existing programme data in the database
                        logger.info(f"Overwrite flag enabled. Overwriting programme details for '{db_prog.name}'.")
                        db_prog.degree_type = prog_data.get("degree_type", "M.Sc.")
                        db_prog.nc_status = prog_data.get("nc_status", "NC_FREE")
                        db_prog.application_route = map_application_route(prog_data.get("application_route", "DIRECT"))
                        db_prog.application_fee_eur = prog_data.get("application_fee_eur")
                        db_prog.primary_teaching_language = prog_data.get("primary_teaching_language")
                        db_prog.min_english_level = prog_data.get("min_english_level")
                        db_prog.min_ielts_score = prog_data.get("min_ielts_score")
                        db_prog.min_german_level = prog_data.get("min_german_level")
                        db_prog.total_ects_required = prog_data.get("total_ects_required")
                        db_prog.min_gpa_german_scale = prog_data.get("min_gpa_german_scale")
                        db_prog.gre_required = map_gre_requirement(prog_data.get("gre_required", "Not Required"))
                        db_prog.is_free_tuition = prog_data.get("is_free_tuition", True)
                        db_prog.tuition_fee_per_semester = prog_data.get("tuition_fee_per_semester")
                        db_prog.required_math_ects = req_math
                        db_prog.required_cs_ects = req_cs
                        db_prog.requirements = prog_data.get("requirements")
                        db_prog.programme_website_url = programme_websites.get(filename[:-5])
                        db_prog.data_source = data_source_enum
                        db.commit()
                        
                        # Delete existing Deadlines and RequiredDocuments to avoid duplicate relations
                        db.query(Deadline).filter(Deadline.programme_id == db_prog.id).delete()
                        db.query(RequiredDocument).filter(RequiredDocument.programme_id == db_prog.id).delete()
                        db.commit()
                else:
                    # Concern 2: Create new Programme row if missing
                    logger.info(f"No match for '{prog_name}'. Dynamically creating new Programme row.")
                    
                    db_prog = Programme(
                        id=uuid4(),
                        university_id=db_uni.id,
                        name=prog_name,
                        degree_type=prog_data.get("degree_type", "M.Sc."),
                        nc_status=prog_data.get("nc_status", "NC_FREE"),
                        application_route=map_application_route(prog_data.get("application_route", "DIRECT")),
                        application_fee_eur=prog_data.get("application_fee_eur"),
                        primary_teaching_language=prog_data.get("primary_teaching_language"),
                        min_english_level=prog_data.get("min_english_level"),
                        min_ielts_score=prog_data.get("min_ielts_score"),
                        min_german_level=prog_data.get("min_german_level"),
                        total_ects_required=prog_data.get("total_ects_required"),
                        min_gpa_german_scale=prog_data.get("min_gpa_german_scale"),
                        gre_required=map_gre_requirement(prog_data.get("gre_required", "Not Required")),
                        is_free_tuition=prog_data.get("is_free_tuition", True),
                        tuition_fee_per_semester=prog_data.get("tuition_fee_per_semester"),
                        required_math_ects=req_math,
                        required_cs_ects=req_cs,
                        requirements=prog_data.get("requirements"),
                        programme_website_url=programme_websites.get(filename[:-5]),
                        data_source=data_source_enum
                    )
                    db.add(db_prog)
                    db.commit()
                    db.refresh(db_prog)
                    logger.info(f"Created new Programme row with ID: {db_prog.id}")
                    
                # Hydrate Deadlines (Step 11)
                for dl_data in prog_data.get("deadlines", []):
                    # Safely map applicant origin string to ApplicantOrigin enum
                    origin_str = dl_data.get("applicant_origin", "ALL").upper()
                    if "NON" in origin_str:
                        origin_enum = ApplicantOrigin.NON_EU
                    elif "EU" in origin_str:
                        origin_enum = ApplicantOrigin.EU
                    else:
                        origin_enum = ApplicantOrigin.ALL
                        
                    db_dl = Deadline(
                        id=uuid4(),
                        programme_id=db_prog.id,
                        applicant_origin=origin_enum,
                        semester=dl_data.get("semester", "WINTER").upper(),
                        portal_opens=parse_date(dl_data.get("portal_opens")),
                        application_deadline=parse_date(dl_data.get("application_deadline"))
                    )
                    db.add(db_dl)
                    
                # Hydrate Required Documents (Step 11)
                for doc_data in prog_data.get("required_documents", []):
                    db_doc = RequiredDocument(
                        id=uuid4(),
                        programme_id=db_prog.id,
                        document_name=doc_data["document_name"].strip(),
                        is_mandatory=doc_data.get("is_mandatory", True),
                        notes=doc_data.get("notes")
                    )
                    db.add(db_doc)
                    
                db.commit()
                logger.info(f"Successfully Hydrated program '{db_prog.name}' and all associated deadlines/required documents.")
                success_count += 1
                
            except Exception as e:
                db.rollback()
                logger.error(f"Error hydrating program rules from {filename}: {e}", exc_info=True)
                error_count += 1
                
        logger.info(f"\nDatabase Hydration Summary:")
        logger.info(f" - Successfully hydrated: {success_count} programmes")
        logger.info(f" - Skipped (already existed): {skip_count} programmes")
        logger.info(f" - Failed with errors: {error_count} programmes")
        
    finally:
        db.close()

if __name__ == "__main__":
    args = parse_args()
    logger.info(f"Starting Database Hydrator. Overwrite: {args.overwrite}, Source JSON Dir: {args.json_dir}")
    hydrate_database(args.json_dir, args.overwrite)
