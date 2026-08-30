import asyncio
import csv
import datetime
import json
import logging
import os
import random
import signal
import sys
import httpx
from bs4 import BeautifulSoup

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] %(message)s",
    handlers=[
        logging.StreamHandler(sys.stdout)
    ]
)
logger = logging.getLogger("daad_scraper")

# Constants & Paths
SCRAPER_DIR = os.path.dirname(os.path.abspath(__file__))
CACHE_PATH = os.path.join(SCRAPER_DIR, "discovery_cache.json")
CSV_PATH = os.path.join(SCRAPER_DIR, "scraped_programmes_raw.csv")

BASE_URL = "https://www.daad.de/en/studying-in-germany/universities/all-degree-programmes/"
PARAMS = {
    "hec-degreeType": "37",
    "hec-subjectGroup": "2-547",
    "hec-teachingLanguage": "2",
    "hec-degreeProgrammeType": "w",
    "hec-studyType": "v,i",
    "hec-limit": "100"
}

# User-Agent representing a modern desktop browser
USER_AGENT = "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36"

# Global shutdown flag
shutdown_requested = False

def signal_handler(signum, frame):
    """
    Handles SIGINT and SIGTERM to request graceful shutdown.
    Allows the active page processing to complete, then flushes cache and exits.
    """
    global shutdown_requested
    sig_name = "SIGINT" if signum == signal.SIGINT else "SIGTERM"
    logger.info(f"Received signal {sig_name}. Requesting graceful shutdown...")
    shutdown_requested = True

# Register signal handlers
signal.signal(signal.SIGINT, signal_handler)
signal.signal(signal.SIGTERM, signal_handler)

def load_cache() -> dict:
    """
    Loads cache from disk. Returns default cache structure if file doesn't exist or is invalid.
    """
    if os.path.exists(CACHE_PATH):
        try:
            with open(CACHE_PATH, "r", encoding="utf-8") as f:
                cache_data = json.load(f)
                # Validate expected keys are present
                if all(k in cache_data for k in ["last_run_timestamp", "scraped_pages", "total_records_discovered"]):
                    logger.info(f"Loaded existing cache. Scraped pages count: {len(cache_data['scraped_pages'])}")
                    return cache_data
        except Exception as e:
            logger.warning(f"Failed to read cache file at {CACHE_PATH} ({e}). Starting fresh.")
    
    return {
        "last_run_timestamp": "",
        "scraped_pages": [],
        "total_records_discovered": 0
    }

def save_cache_atomically(cache_data: dict):
    """
    Atomically flushes the cache dictionary to disk by writing to a temp file and replacing the old one.
    """
    temp_path = CACHE_PATH + ".tmp"
    try:
        with open(temp_path, "w", encoding="utf-8") as f:
            json.dump(cache_data, f, indent=2, ensure_ascii=False)
        os.replace(temp_path, CACHE_PATH)
    except Exception as e:
        logger.error(f"Error saving cache atomically to {CACHE_PATH}: {e}")
        if os.path.exists(temp_path):
            try:
                os.remove(temp_path)
            except Exception:
                pass

def get_existing_programme_ids() -> set:
    """
    Reads already scraped programmes from the raw CSV file to build an in-memory deduplication set.
    """
    existing_ids = set()
    if os.path.exists(CSV_PATH):
        try:
            with open(CSV_PATH, "r", encoding="utf-8", newline="") as f:
                reader = csv.DictReader(f)
                if reader.fieldnames and "programme_id" in reader.fieldnames:
                    for row in reader:
                        pid = row.get("programme_id")
                        if pid:
                            existing_ids.add(pid)
            logger.info(f"Loaded {len(existing_ids)} existing programme IDs from CSV for deduplication.")
        except Exception as e:
            logger.error(f"Error reading CSV file at {CSV_PATH} for deduplication: {e}")
    return existing_ids

def append_to_csv(programmes: list):
    """
    Appends list of scraped programmes to the CSV file. Writes headers if the file does not exist.
    """
    if not programmes:
        return
        
    file_exists = os.path.exists(CSV_PATH)
    headers = ["programme_id", "university_name", "programme_title"]
    
    try:
        with open(CSV_PATH, "a", encoding="utf-8", newline="") as f:
            writer = csv.DictWriter(f, fieldnames=headers)
            if not file_exists:
                writer.writeheader()
            for prog in programmes:
                writer.writerow(prog)
    except Exception as e:
        logger.error(f"Error writing to CSV at {CSV_PATH}: {e}")

async def scrape_daad():
    """
    Main orchestrator for discovering and aggregating German university Master's degree programs.
    """
    logger.info("Initializing DAAD Master's Degree discovery scraper...")
    
    # 1. Pre-check: Load Cache and existing CSV ids
    cache = load_cache()
    scraped_pages = set(cache.get("scraped_pages", []))
    in_memory_ids = get_existing_programme_ids()
    
    headers = {
        "User-Agent": USER_AGENT,
        "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8",
        "Accept-Language": "en-US,en;q=0.5"
    }
    
    page = 1
    consecutive_empty_pages = 0
    max_consecutive_empty = 2 # If we hit empty pages repeatedly, stop.
    
    async with httpx.AsyncClient(timeout=30.0, follow_redirects=True) as client:
        while True:
            # 2. Check for shutdown signal
            if shutdown_requested:
                logger.info("Graceful shutdown flag is active. Stopping pagination loop.")
                break
                
            # 3. Check cache to see if page index was already scraped
            if page in scraped_pages:
                logger.info(f"[Page {page}] Already scraped in previous run. Skipping...")
                page += 1
                continue
                
            logger.info(f"[Page {page}] Fetching programmes from DAAD...")
            
            # Prepare search parameters for the page
            page_params = PARAMS.copy()
            page_params["page"] = str(page)
            page_params["hec-p"] = str(page)
            
            try:
                response = await client.get(BASE_URL, params=page_params, headers=headers)
                
                # Check HTTP response status
                if response.status_code != 200:
                    logger.error(f"[Page {page}] Received non-200 status code: {response.status_code}")
                    break
                    
                # Parse HTML content using BeautifulSoup with the lxml parser
                soup = BeautifulSoup(response.text, "lxml")
                articles = soup.find_all("article", class_="result")
                
                # Stop if no elements are found (reached end of pagination)
                if not articles:
                    consecutive_empty_pages += 1
                    logger.info(f"[Page {page}] No programme cards found on page.")
                    if consecutive_empty_pages >= max_consecutive_empty:
                        logger.info("Reached end of pagination (multiple consecutive empty pages). Ending scrape.")
                        break
                    page += 1
                    continue
                
                consecutive_empty_pages = 0 # Reset empty counter since we found elements
                new_programmes = []
                
                # 4. Extract data from each result article
                for article in articles:
                    prog_id = article.get("id")
                    
                    # Extract university and title
                    spans = article.find_all("span", class_="result__headline-content")
                    if len(spans) >= 2:
                        university = spans[0].get_text(strip=True)
                        title = spans[1].get_text(strip=True)
                    elif len(spans) == 1:
                        # Fallback if only 1 span
                        university = "Unknown"
                        title = spans[0].get_text(strip=True)
                    else:
                        university = "Unknown"
                        title = "Unknown"
                    
                    # If ID is missing, fall back to hashing the program details
                    if not prog_id:
                        import hashlib
                        prog_id = "h_" + hashlib.md5(f"{university}-{title}".encode("utf-8")).hexdigest()[:8]
                        
                    # Deduplicate in-memory to prevent duplicates inside CSV/output
                    if prog_id not in in_memory_ids:
                        in_memory_ids.add(prog_id)
                        new_programmes.append({
                            "programme_id": prog_id,
                            "university_name": university,
                            "programme_title": title
                        })
                
                # 5. Append records to flat CSV file
                if new_programmes:
                    append_to_csv(new_programmes)
                    
                # 6. Atomic State Flush
                scraped_pages.add(page)
                cache["scraped_pages"] = sorted(list(scraped_pages))
                cache["total_records_discovered"] = len(in_memory_ids)
                cache["last_run_timestamp"] = datetime.datetime.now(datetime.timezone.utc).isoformat()
                save_cache_atomically(cache)
                
                logger.info(f"[Page {page}] Successfully extracted {len(new_programmes)} new programmes (Total unique: {len(in_memory_ids)})")
                
            except Exception as e:
                logger.exception(f"[Page {page}] Exception occurred during scraping cycle: {e}")
                # We do NOT add this page to scraped_pages, so it will be retried on next execution
                break
                
            # Move to next page
            page += 1
            
            # Evasion sleep delay
            if not shutdown_requested:
                sleep_duration = random.uniform(2.0, 5.0)
                logger.info(f"Sleeping for {sleep_duration:.2f} seconds before requesting the next page index...")
                await asyncio.sleep(sleep_duration)

    # 7. Final status log and exit logic
    logger.info(f"Scrape run completed. Discovered {len(in_memory_ids)} total records.")
    if shutdown_requested:
        logger.info("Graceful shutdown completed successfully. Exiting.")
        sys.exit(0)

if __name__ == "__main__":
    asyncio.run(scrape_daad())
