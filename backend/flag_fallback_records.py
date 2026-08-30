"""
flag_fallback_records.py

Scans all extracted JSON rule files and tags them with _data_source metadata.
Detects fallback-generated files using the known signature patterns from
generate_fallback_payload() in extract_rules.py.

Usage:
    python flag_fallback_records.py [--json-dir PATH]
"""

import os
import sys
import json
import logging
import argparse

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] %(message)s",
    handlers=[logging.StreamHandler(sys.stdout)]
)
logger = logging.getLogger("flag_fallback")

# Fingerprints of the fallback generator function
FALLBACK_CONTINGENCY_NOTE = "Missing admission requirements can be completed within the first two semesters."
FALLBACK_EQUIVALENCE_RAW = "Or an equivalent degree in computer science, mathematics, or closely related quantitative fields."
FALLBACK_DOCUMENTS = [
    "Bachelor's Degree Certificate",
    "Transcript of Records",
    "CV / Resume",
    "English Language Certificate"
]
FALLBACK_EU_DEADLINE = {"applicant_origin": "EU", "semester": "WINTER", "portal_opens": "2026-05-01", "application_deadline": "2026-07-15"}
FALLBACK_NON_EU_DEADLINE = {"applicant_origin": "NON_EU", "semester": "WINTER", "portal_opens": "2026-03-01", "application_deadline": "2026-05-31"}


def is_fallback_generated(payload: dict) -> bool:
    """
    Detects whether a JSON file was produced by generate_fallback_payload()
    by checking for the characteristic signatures that appear in ALL fallback files.
    """
    program = payload.get("program", {})
    req = program.get("requirements", {})
    
    # Check contingency note
    contingencies = req.get("contingencies", {})
    if contingencies.get("notes") != FALLBACK_CONTINGENCY_NOTE:
        return False
    
    # Check equivalence statement
    qualitative = req.get("qualitative", {})
    if qualitative.get("equivalence_statement_raw") != FALLBACK_EQUIVALENCE_RAW:
        return False
    
    # Check for identical ECTS thresholds pattern (cs=30, theoretical_cs=12, practical_cs=18)
    quantitative = req.get("quantitative", {})
    thresholds = quantitative.get("ects_thresholds", {})
    if thresholds.get("cs") != 30.0 or thresholds.get("theoretical_cs") != 12.0 or thresholds.get("practical_cs") != 18.0:
        return False
    
    # Check for identical deadline structure
    deadlines = program.get("deadlines", [])
    if len(deadlines) == 2:
        dl_origins = {d.get("applicant_origin") for d in deadlines}
        dl_dates = {d.get("application_deadline") for d in deadlines}
        if dl_origins == {"EU", "NON_EU"} and dl_dates == {"2026-07-15", "2026-05-31"}:
            return True
    
    # If we got past contingency + equivalence checks, it's very likely fallback
    return True


def is_empty_extraction(payload: dict) -> bool:
    """
    Detects if a file was extracted by Gemini but the source PDF was wrong/empty,
    resulting in null values for all important fields.
    """
    program = payload.get("program", {})
    important_fields = [
        program.get("min_english_level"),
        program.get("min_ielts_score"),
        program.get("primary_teaching_language"),
        program.get("min_gpa_german_scale"),
        program.get("total_ects_required"),
    ]
    return all(v is None for v in important_fields)


def flag_files(json_dir: str, dry_run: bool = False):
    if not os.path.exists(json_dir):
        logger.error(f"Directory not found: {json_dir}")
        sys.exit(1)
    
    json_files = [f for f in os.listdir(json_dir) if f.lower().endswith(".json")]
    logger.info(f"Scanning {len(json_files)} JSON files in {json_dir}...")
    
    stats = {"fallback": 0, "gemini_extracted": 0, "empty_extraction": 0, "already_tagged": 0, "errors": 0}
    
    for filename in sorted(json_files):
        filepath = os.path.join(json_dir, filename)
        try:
            with open(filepath, "r", encoding="utf-8") as f:
                payload = json.load(f)
            
            # Check if already tagged
            existing_source = payload.get("_data_source")
            if existing_source:
                logger.info(f"  [{filename}] Already tagged as: {existing_source}")
                stats["already_tagged"] += 1
                continue
            
            # Determine source
            if is_fallback_generated(payload):
                data_source = "FALLBACK_GENERATED"
                stats["fallback"] += 1
                logger.warning(f"  [WARNING] [{filename}] -> FALLBACK_GENERATED (fabricated data)")
            elif is_empty_extraction(payload):
                data_source = "FALLBACK_GENERATED"  # Treat empty extractions as unreliable too
                stats["empty_extraction"] += 1
                logger.warning(f"  [WARNING] [{filename}] -> FALLBACK_GENERATED (empty/failed extraction)")
            else:
                data_source = "GEMINI_EXTRACTED"
                stats["gemini_extracted"] += 1
                logger.info(f"  [OK] [{filename}] -> GEMINI_EXTRACTED (appears genuine)")
            
            # Write the tag
            if not dry_run:
                payload["_data_source"] = data_source
                with open(filepath, "w", encoding="utf-8") as f:
                    json.dump(payload, f, indent=2, ensure_ascii=False)
                logger.info(f"     Tagged {filename} with _data_source={data_source}")
            else:
                logger.info(f"     [DRY RUN] Would tag {filename} with _data_source={data_source}")
                
        except Exception as e:
            logger.error(f"  ❌ [{filename}] Error: {e}")
            stats["errors"] += 1
    
    logger.info(f"\n{'='*60}")
    logger.info(f"Flagging Summary:")
    logger.info(f"  Fallback-generated:  {stats['fallback']}")
    logger.info(f"  Empty extractions:   {stats['empty_extraction']}")
    logger.info(f"  Gemini-extracted:    {stats['gemini_extracted']}")
    logger.info(f"  Already tagged:      {stats['already_tagged']}")
    logger.info(f"  Errors:              {stats['errors']}")
    logger.info(f"{'='*60}")


if __name__ == "__main__":
    parser = argparse.ArgumentParser(description="Flag fallback-generated JSON files with _data_source metadata")
    parser.add_argument("--json-dir", type=str, 
                        default=os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), "Scraper", "extracted_rules"),
                        help="Directory containing extracted JSON rules")
    parser.add_argument("--dry-run", action="store_true", help="Preview changes without writing to disk")
    args = parser.parse_args()
    
    flag_files(args.json_dir, args.dry_run)
