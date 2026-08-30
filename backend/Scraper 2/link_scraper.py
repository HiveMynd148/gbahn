import argparse
import asyncio
import csv
import json
import logging
import os
import sys
import random
import time
from typing import Dict, Optional, Set
from html.parser import HTMLParser

# Add the parent directory of Scraper 2 (the backend root) to the system path to allow app imports
BACKEND_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
sys.path.insert(0, BACKEND_DIR)

import httpx
from app.database import SessionLocal
from app.models.university import University
from app.models.programme import Programme

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] %(message)s",
    handlers=[
        logging.StreamHandler(sys.stdout)
    ]
)
logger = logging.getLogger("link_scraper")

# Modern desktop browser User-Agents and HTTP/2 profile headers
USER_AGENTS = [
    "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36",
    "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36",
    "Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:123.0) Gecko/20100101 Firefox/123.0"
]

class DAADLinkParser(HTMLParser):
    """
    Standard library-based HTML parser to extract all anchor links and their text.
    Ensures zero external dependency requirements for beautifulsoup/lxml.
    """
    def __init__(self):
        super().__init__()
        self.links = []
        self.current_href = None
        self.current_text = []
        self.in_a = False

    def handle_starttag(self, tag, attrs):
        if tag == "a":
            self.in_a = True
            for attr, val in attrs:
                if attr == "href":
                    self.current_href = val.strip()

    def handle_endtag(self, tag):
        if tag == "a":
            if self.current_href:
                text = "".join(self.current_text).strip()
                self.links.append((self.current_href, text))
            self.current_href = None
            self.current_text = []
            self.in_a = False

    def handle_data(self, data):
        if self.in_a:
            self.current_text.append(data)

def parse_outbound_university_link(html_content: str) -> str:
    """
    Parses DAAD detail page HTML and extracts the first organic outbound university website link.
    """
    parser = DAADLinkParser()
    try:
        parser.feed(html_content)
    except Exception as e:
        logger.warning(f"Error parsing HTML: {e}")
        return ""

    external_links = []
    for href, text in parser.links:
        if href.startswith("http") and "daad.de" not in href:
            # Skip common social links and non-academic general domains
            if any(sm in href.lower() for sm in ["facebook", "twitter", "instagram", "youtube", "linkedin", "threads", "bsky", "pinterest", "reddit", "google"]):
                continue
            # Prioritize links matching course website keywords
            if any(kw in text.lower() or kw in href.lower() for kw in ["course", "website", "studiengang", "programm", "universit", "visit", "webpage"]):
                return href
            external_links.append(href)

    if external_links:
        return external_links[0]
    return ""

def clean_string(s: str) -> str:
    """Cleans names to facilitate resilient case-insensitive and structural matching."""
    if not s:
        return ""
    s = s.lower().strip()
    
    # Custom University Abbreviations and spelling normalizations
    uni_mappings = {
        "rptu": "rhinelandpalatinate",
        "utn": "technology",
        "tum": "munich",
        "fau": "erlangen",
        "btu": "brandenburg",
        "brandenburgische": "brandenburg",
        "ovgu": "magdeburg",
        "kit": "karlsruhe",
        "hhu": "dusseldorf"
    }
    for abb, full in uni_mappings.items():
        s = s.replace(abb, full)
        
    s = s.replace("artificial intelligence", "ai")
    s = s.replace("computer science", "computerscience")
    s = s.replace("informatik", "computerscience")
    s = s.replace("&", " ")
    s = s.replace("nurnberg", "nuremberg")
    s = s.replace("nürnberg", "nuremberg")
    s = s.replace("modeling", "modelling")
    
    # Remove common degrees/qualifiers
    for suffix in ["(m.sc.)", "m.sc.", "(master)", "master", "(m.eng.)", "m.eng.", "(m.a.)", "m.a.", "b.sc.", "(b.sc.)", "(mdke)", "mdke", "msc"]:
        s = s.replace(suffix, " ")
        
    # Split into words to filter stop-words and generic terms safely
    words = s.split()
    stop_words = {
        "of", "in", "der", "the", "university", "applied", "sciences", 
        "technical", "technische", "hochschule", "technology", "and", "tu", 
        "universitat", "universität", "for"
    }
    
    clean_words = []
    for w in words:
        cw = "".join(c for c in w if c.isalnum())
        if cw and cw not in stop_words:
            clean_words.append(cw)
            
    return " ".join(clean_words)

def is_fuzzy_match(db_uni: str, db_prog: str, map_uni: str, map_prog: str) -> bool:
    """
    Performs token-based and structural matching of DB values to scraped values.
    """
    db_uni_words = set(clean_string(db_uni).split())
    map_uni_words = set(clean_string(map_uni).split())
    
    uni_matches = (db_uni_words == map_uni_words) or (db_uni_words.issubset(map_uni_words)) or (map_uni_words.issubset(db_uni_words))
    if not uni_matches:
        return False
        
    # Filter out generic words for programme match
    generic_words = {"science", "engineering", "applied", "study", "degree", "programme", "systems", "system", "master", "msc"}
    db_prog_words = set(clean_string(db_prog).split()) - generic_words
    map_prog_words = set(clean_string(map_prog).split()) - generic_words
    
    return db_prog_words == map_prog_words

def load_cached_websites() -> Dict[str, str]:
    """
    Loads scraped programme website links from csv as starting cache.
    """
    cache = {}
    csv_path = os.path.join(BACKEND_DIR, "scraped_programme_websites.csv")
    if os.path.exists(csv_path):
        try:
            with open(csv_path, "r", encoding="utf-8") as f:
                reader = csv.DictReader(f)
                for row in reader:
                    pid = row.get("programme_id")
                    url = row.get("programme_website_url")
                    status = row.get("status")
                    if pid and url and status == "found":
                        cache[pid] = url
            logger.info(f"Loaded {len(cache)} cached program websites from {csv_path}")
        except Exception as e:
            logger.warning(f"Failed to load cache CSV from {csv_path}: {e}")
    return cache

def load_daad_id_mappings() -> Dict[str, str]:
    """
    Scans the scraped_programmes.json and extracted_rules JSONs to construct a lookup
    mapping of clean key (university_name + programme_name) -> DAAD programme_id.
    """
    mappings = {}
    
    # Check scraped_programmes.json
    sp_path = os.path.join(BACKEND_DIR, "scraped_programmes.json")
    if os.path.exists(sp_path):
        try:
            with open(sp_path, "r", encoding="utf-8") as f:
                data = json.load(f)
                for item in data:
                    pid = item.get("programme_id")
                    uni = item.get("university_name")
                    prog = item.get("programme_title")
                    if pid and uni and prog:
                        key = f"{clean_string(uni)}_{clean_string(prog)}"
                        mappings[key] = pid
        except Exception as e:
            logger.warning(f"Failed to parse mappings from {sp_path}: {e}")
            
    # Check extracted_rules JSON files as a fallback / primary source
    rules_dir = os.path.join(BACKEND_DIR, "extracted_rules")
    if os.path.exists(rules_dir):
        try:
            for filename in os.listdir(rules_dir):
                if filename.lower().endswith(".json"):
                    filepath = os.path.join(rules_dir, filename)
                    with open(filepath, "r", encoding="utf-8") as f:
                        data = json.load(f)
                        pid = filename[:-5]  # e.g., 'w67521'
                        uni = data.get("university_name")
                        prog = data.get("program", {}).get("name")
                        if pid and uni and prog:
                            key = f"{clean_string(uni)}_{clean_string(prog)}"
                            mappings[key] = pid
        except Exception as e:
            logger.warning(f"Failed to parse mappings from {rules_dir}: {e}")
            
    logger.info(f"Resolved {len(mappings)} program name -> DAAD ID mappings.")
    return mappings

async def scrape_programme_link(client: httpx.AsyncClient, programme_id: str) -> Optional[str]:
    """
    Fetches the DAAD detail page for a given programme_id and extracts the outbound link.
    Employs robust browser emulation headers, HTTP/2, and exponential backoff retry cycles.
    """
    url = f"https://www.daad.de/en/studying-in-germany/universities/all-degree-programmes/detail/program-{programme_id}/?hec-id={programme_id}"
    
    # Advanced browser emulation headers to circumvent Akamai/Cloudflare TLS/User-Agent filters
    ua = random.choice(USER_AGENTS)
    headers = {
        "User-Agent": ua,
        "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8",
        "Accept-Language": "en-US,en;q=0.9",
        "Referer": "https://www.daad.de/en/studying-in-germany/universities/all-degree-programmes/",
        "Sec-Ch-Ua": '"Chromium";v="122", "Not(A:Brand";v="24", "Google Chrome";v="122"',
        "Sec-Ch-Ua-Mobile": "?0",
        "Sec-Ch-Ua-Platform": '"Windows"',
        "Sec-Fetch-Dest": "document",
        "Sec-Fetch-Mode": "navigate",
        "Sec-Fetch-Site": "same-origin",
        "Sec-Fetch-User": "?1",
        "Upgrade-Insecure-Requests": "1"
    }
    
    max_retries = 1
    for attempt in range(1, max_retries + 1):
        try:
            # Politeness delays between attempts
            delay = random.uniform(1.0, 2.0) * attempt
            await asyncio.sleep(delay)
            
            response = await client.get(url, headers=headers, timeout=10.0)
            if response.status_code == 200:
                link = parse_outbound_university_link(response.text)
                if link:
                    return link
                else:
                    logger.warning(f"Attempt {attempt}/{max_retries}: No university link found on page for program ID: {programme_id}")
            elif response.status_code == 403:
                logger.warning(f"Attempt {attempt}/{max_retries}: DAAD returned 403 Forbidden. Throttling requests...")
            else:
                logger.warning(f"Attempt {attempt}/{max_retries}: DAAD returned status: {response.status_code}")
        except Exception as e:
            logger.error(f"Attempt {attempt}/{max_retries}: Connection error to DAAD for ID {programme_id}: {e}")
            
    return None

async def main():
    parser = argparse.ArgumentParser(description="DAAD university program website scraper (Scraper 2)")
    parser.add_argument("--update-db", action="store_true", help="Populate scraped links into PostgreSQL database.")
    parser.add_argument("--fresh", action="store_true", help="Ignore CSV caches and scrape everything from scratch.")
    parser.add_argument("--dry-run", action="store_true", help="Only process the first 3 items for testing.")
    args = parser.parse_args()
    
    logger.info("Initializing DAAD University Program Webpage Scraper (Scraper 2)...")
    
    # 1. Load data mappings and original cache (which serves as a fallback safety layer)
    id_mappings = load_daad_id_mappings()
    old_cache = load_cached_websites()
    
    # Reset/load cache for active mapping
    cache = {} if args.fresh else old_cache.copy()
    if args.fresh:
        logger.info("Fresh run requested. Cache will be fully bypassed for active scraper requests but preserved as fallback.")
    
    # 2. Query database for all programs
    db = SessionLocal()
    try:
        db_programmes = db.query(Programme).all()
        logger.info(f"Loaded {len(db_programmes)} programmes from database.")
        
        matched_count = 0
        programmes_to_scrape = []
        programme_results = {}
        db_id_to_pid = {}
        
        # Build mapping of db_programme -> DAAD ID and load cache
        for db_prog in db_programmes:
            uni = db.query(University).filter(University.id == db_prog.university_id).first()
            uni_name = uni.name if uni else ""
            
            # Resilient structural/fuzzy matching
            pid = None
            db_uni_clean = clean_string(uni_name)
            db_prog_clean = clean_string(db_prog.name)
            
            # Exact clean match check
            key = f"{db_uni_clean}_{db_prog_clean}"
            if key in id_mappings:
                pid = id_mappings[key]
            else:
                # Advanced fuzzy substring and token matching check
                for m_key, m_pid in id_mappings.items():
                    parts = m_key.split("_")
                    if not parts or len(parts) < 2:
                        continue
                    map_uni_clean = parts[0]
                    map_prog_clean = parts[1]
                    
                    if is_fuzzy_match(uni_name, db_prog.name, map_uni_clean, map_prog_clean):
                        pid = m_pid
                        logger.info(f"Fuzzy Matched DB '{db_prog.name}' at '{uni_name}' to DAAD ID: {pid}")
                        break
            
            if pid:
                matched_count += 1
                db_id_to_pid[db_prog.id] = pid
                # If cached and not fresh, reuse
                if not args.fresh and pid in cache:
                    programme_results[db_prog.id] = cache[pid]
                else:
                    programmes_to_scrape.append((db_prog.id, pid, db_prog.name, uni_name))
            else:
                logger.warning(f"Could not map DB Programme '{db_prog.name}' at '{uni_name}' to a DAAD ID!")
                
        logger.info(f"Successfully matched {matched_count}/{len(db_programmes)} DB programmes to DAAD IDs.")
        logger.info(f"Cached links: {len(programme_results)}. Missing/Requested links to scrape: {len(programmes_to_scrape)}.")
        
        # Dry-run limit
        if args.dry_run:
            logger.info("Running in DRY-RUN mode. Limiting scraping queue to 3 items.")
            programmes_to_scrape = programmes_to_scrape[:3]
            
        # 3. Scrape missing links
        if programmes_to_scrape:
            logger.info("Starting scraper pagination queue with HTTP/2 and realistic user profiles...")
            # Enforce HTTP/2 to bypass server HTTP/1.1 fingerprint blocks
            async with httpx.AsyncClient(http2=True, follow_redirects=True) as client:
                for db_id, pid, prog_name, uni_name in programmes_to_scrape:
                    logger.info(f"Scraping link for: '{prog_name}' at '{uni_name}' (ID: {pid})...")
                    link = await scrape_programme_link(client, pid)
                    if link:
                        logger.info(f" -> Found link: {link}")
                        programme_results[db_id] = link
                        # Add to active cache
                        cache[pid] = link
                    else:
                        logger.warning(f" -> Could not find link for ID {pid}")
                        # SAFETY FALLBACK: If fresh attempt failed, restore previously validated URL
                        if pid in old_cache and old_cache[pid]:
                            logger.info(f" -> SAFETY: Restored previously verified cached link: {old_cache[pid]}")
                            programme_results[db_id] = old_cache[pid]
                            cache[pid] = old_cache[pid]
                        
            # Save updated cache to CSV
            csv_path = os.path.join(BACKEND_DIR, "scraped_programme_websites.csv")
            try:
                with open(csv_path, "w", encoding="utf-8", newline="") as f:
                    writer = csv.writer(f)
                    writer.writerow(["programme_id", "university_name", "programme_title", "programme_website_url", "status"])
                    for m_key, m_pid in id_mappings.items():
                        url = cache.get(m_pid, "")
                        status = "found" if url else "not_found"
                        parts = m_key.split("_")
                        uni_part = parts[0] if parts else ""
                        prog_part = parts[1] if len(parts) > 1 else ""
                        writer.writerow([m_pid, uni_part, prog_part, url, status])
                logger.info(f"Saved updated scraper CSV cache to {csv_path}")
            except Exception as e:
                logger.error(f"Failed to write CSV cache: {e}")
                
        # 4. Save results to programme_websites.json
        output_json_path = os.path.join(BACKEND_DIR, "Scraper 2", "programme_websites.json")
        try:
            # Map programme_id -> URL for absolute portability across resets
            daad_results = {}
            for db_id, url in programme_results.items():
                if db_id in db_id_to_pid:
                    daad_results[db_id_to_pid[db_id]] = url
            with open(output_json_path, "w", encoding="utf-8") as f:
                json.dump(daad_results, f, indent=2, ensure_ascii=False)
            logger.info(f"Saved {len(daad_results)} links to JSON file: {output_json_path}")
        except Exception as e:
            logger.error(f"Failed to save JSON output: {e}")
            
        # 5. Optional DB update
        if args.update_db:
            logger.info("Applying scraped webpage links to PostgreSQL database programmes table...")
            updated_count = 0
            for db_prog in db_programmes:
                if db_prog.id in programme_results:
                    db_prog.programme_website_url = programme_results[db_prog.id]
                    updated_count += 1
            db.commit()
            logger.info(f"Successfully updated {updated_count} programmes with website links in the database!")
            
    finally:
        db.close()

if __name__ == "__main__":
    asyncio.run(main())
