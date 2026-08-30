import argparse
import asyncio
import csv
import json
import logging
import os
import random
import sys
import time
import urllib.parse
import httpx
from bs4 import BeautifulSoup
from playwright.async_api import async_playwright
from duckduckgo_search import DDGS

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] %(message)s",
    handlers=[
        logging.StreamHandler(sys.stdout)
    ]
)
logger = logging.getLogger("po_scraper")

# Paths setup
SCRAPER_DIR = os.path.dirname(os.path.abspath(__file__))
WORKSPACE_DIR = os.path.dirname(SCRAPER_DIR)
JSON_INPUT_PATH = os.path.join(SCRAPER_DIR, "scraped_programmes.json")
CSV_INPUT_PATH = os.path.join(SCRAPER_DIR, "scraped_programmes_raw.csv")
CSV_OUTPUT_PATH = os.path.join(SCRAPER_DIR, "scraped_po_links.csv")

# Polite Per-Domain Delays Tracking
domain_locks = {}
domain_last_request = {}

# Set of rotated User-Agents for browser layout diversity
USER_AGENTS = [
    "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
    "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Safari/605.1.15",
    "Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:121.0) Gecko/20100101 Firefox/121.0",
    "Mozilla/5.0 (Macintosh; Intel Mac OS X 10.15; rv:121.0) Gecko/20100101 Firefox/121.0",
    "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36 Edg/120.0.0.0"
]

async def polite_delay(url: str):
    """
    Enforces a polite 2–3 seconds delay between requests to the SAME domain.
    Serializes concurrent requests per domain using domain-specific asyncio locks.
    """
    parsed = urllib.parse.urlparse(url)
    domain = parsed.netloc
    if not domain:
        return
        
    if domain not in domain_locks:
        domain_locks[domain] = asyncio.Lock()
        
    async with domain_locks[domain]:
        now = time.time()
        last_time = domain_last_request.get(domain, 0.0)
        delay = random.uniform(2.0, 3.0)
        elapsed = now - last_time
        if elapsed < delay:
            sleep_needed = delay - elapsed
            await asyncio.sleep(sleep_needed)
        domain_last_request[domain] = time.time()

def convert_csv_to_json_if_needed():
    """
    Bootstrap utility to convert scraped CSV into standard JSON format if needed.
    """
    if not os.path.exists(JSON_INPUT_PATH) and os.path.exists(CSV_INPUT_PATH):
        logger.info(f"JSON input not found. Bootstrapping from CSV at {CSV_INPUT_PATH}...")
        programmes = []
        try:
            with open(CSV_INPUT_PATH, "r", encoding="utf-8", newline="") as f:
                reader = csv.DictReader(f)
                for row in reader:
                    programmes.append({
                        "programme_id": row.get("programme_id"),
                        "university_name": row.get("university_name"),
                        "programme_title": row.get("programme_title")
                    })
            os.makedirs(os.path.dirname(JSON_INPUT_PATH), exist_ok=True)
            with open(JSON_INPUT_PATH, "w", encoding="utf-8") as f:
                json.dump(programmes, f, indent=2, ensure_ascii=False)
            logger.info(f"Created JSON input at {JSON_INPUT_PATH} with {len(programmes)} programmes.")
        except Exception as e:
            logger.error(f"Failed to bootstrap JSON file: {e}")

def parse_outbound_university_link(html_content: str) -> str:
    """
    BeautifulSoup parser to extract the outbound university course webpage link from DAAD detail page.
    Filters out social media, common sharing resources, and returns the first organic link.
    """
    soup = BeautifulSoup(html_content, "lxml")
    external_links = []
    
    for a in soup.find_all("a", href=True):
        href = a["href"].strip()
        text = a.get_text(strip=True)
        
        # We need an outbound link that goes to the university site (starts with http, not daad.de)
        if href.startswith("http") and "daad.de" not in href:
            # Skip social links and non-academic general domains
            if any(sm in href.lower() for sm in ["facebook", "twitter", "instagram", "youtube", "linkedin", "threads", "bsky", "pinterest", "reddit", "google"]):
                continue
            # Give higher preference if the text or link mentions website or course
            if any(kw in text.lower() or kw in href.lower() for kw in ["course", "website", "studiengang", "programm", "universit", "visit"]):
                return href
            external_links.append(href)
            
    if external_links:
        return external_links[0]
    return ""

async def get_po_link_from_university_page(browser, url: str) -> str:
    """
    Loads dynamic university webpage using Playwright, waits for dynamically loaded
    scripts, and searches all anchor links for PO keywords, preferring direct PDF files.
    """
    page = await browser.new_page()
    try:
        # User-Agent rotation for browser diversity
        headers = {
            "User-Agent": random.choice(USER_AGENTS)
        }
        await page.set_extra_http_headers(headers)
        
        # Enforce polite delay
        await polite_delay(url)
        
        logger.info(f"Navigating to university page: {url}")
        # wait_until="domcontentloaded" is fast and robust for HTML anchor extraction
        await page.goto(url, timeout=30000, wait_until="domcontentloaded")
        
        # Wait slightly for dynamic JS elements to render anchors
        await asyncio.sleep(2.0)
        
        content = await page.content()
        soup = BeautifulSoup(content, "lxml")
        
        keywords = ["Prüfungsordnung", "Studienordnung", "SPO", "Amtsblatt", "PO 20", "ordnung"]
        scored_links = []
        
        for a in soup.find_all("a", href=True):
            href = a["href"].strip()
            text = a.get_text(strip=True)
            
            # Skip sports, transport, or social media links
            if any(skip_word in text.lower() or skip_word in href.lower() for skip_word in ["sport", "transport", "facebook", "twitter", "instagram", "youtube", "linkedin"]):
                continue
                
            # Check if text or href contains PO keywords
            matched_kw = None
            for kw in keywords:
                if kw == "SPO":
                    # Match SPO case-sensitively to avoid matching sport/transport
                    if "SPO" in text or "SPO" in href:
                        matched_kw = kw
                        break
                else:
                    if kw.lower() in text.lower() or kw.lower() in href.lower():
                        matched_kw = kw
                        break
                    
            if matched_kw:
                # Score link preference
                score = 5 # base match score
                # Check if it has PDF extension or download pattern
                if href.lower().endswith(".pdf") or ".pdf?" in href.lower() or "/pdf/" in href.lower():
                    score = 10 # high score for direct PDF
                    
                # Resolve relative url addresses
                full_url = urllib.parse.urljoin(url, href)
                scored_links.append((score, full_url))
                
        if scored_links:
            # Sort by score in descending order
            scored_links.sort(key=lambda x: x[0], reverse=True)
            return scored_links[0][1]
            
    except Exception as e:
        logger.warning(f"Failed to crawl university page {url} via Playwright: {e}")
    finally:
        await page.close()
    return ""

async def search_bing_fallback(browser, programme_title: str, university_name: str) -> str:
    """
    Fall back query using Playwright to query Bing search.
    Query format: "{programme_title}" Prüfungsordnung {university_name}
    Extracts the direct URL of the first non-commercial organic search result.
    If Playwright gets blocked by Cloudflare Turnstile, it seamlessly falls back
    to a DuckDuckGo search (which query indexes Bing under the hood) via ddgs text.
    """
    # Clean the programme title slightly for higher-yield search results (removing long parenthetical qualifiers)
    cleaned_title = programme_title.split("(")[0].strip()
    for suffix in ["m.sc.", "b.sc.", "m.a.", "b.a."]:
        if cleaned_title.lower().endswith(suffix):
            cleaned_title = cleaned_title[:-len(suffix)].strip()
    cleaned_title = cleaned_title.strip(" -–—,.")
    
    query = f'"{cleaned_title}" Prüfungsordnung {university_name}'
    logger.info(f"Triggering Bing Search Fallback: {query}")
    
    # 1. Try Playwright Bing crawl first
    page = await browser.new_page()
    try:
        headers = {
            "User-Agent": random.choice(USER_AGENTS)
        }
        await page.set_extra_http_headers(headers)
        
        search_url = f"https://www.bing.com/search?q={urllib.parse.quote(query)}"
        
        # Enforce polite delay
        await polite_delay(search_url)
        
        await page.goto(search_url, timeout=30000, wait_until="commit")
        
        # Robust wait for organic results selector
        try:
            await page.wait_for_selector("li.b_algo", timeout=5000)
        except Exception:
            logger.warning("Timeout waiting for 'li.b_algo' selector on Bing search page.")
            
        content = await page.content()
        soup = BeautifulSoup(content, "lxml")
        
        # Extract the first organic search link on Bing (inside li.b_algo)
        for li in soup.find_all("li", class_="b_algo"):
            a = li.find("a", href=True)
            if a:
                href = a["href"]
                # Skip Bing Internal URLs
                if href.startswith("http") and "bing.com" not in href:
                    logger.info(f"Successfully extracted fallback URL from Bing Playwright crawl: {href}")
                    return href
                    
        # Fallback to any h2 link on the search result
        for h2 in soup.find_all("h2"):
            a = h2.find("a", href=True)
            if a:
                href = a["href"]
                if href.startswith("http") and "bing.com" not in href:
                    logger.info(f"Successfully extracted fallback URL from Bing Playwright H2 crawl: {href}")
                    return href
                    
    except Exception as e:
        logger.warning(f"Playwright Bing search query failed: {e}")
    finally:
        await page.close()
        
    # 2. Resilient Second Layer Fallback: DuckDuckGo Search (impersonates JA3 browser TLS fingerprint)
    logger.info("Playwright Bing crawl yielded no results (blocked). Running DDG Bing-index fallback search...")
    try:
        # Enforce polite delay
        await polite_delay("https://duckduckgo.com/")
        
        with DDGS() as ddgs:
            # backend="lite" is Turnstile-immune and extremely robust
            results = list(ddgs.text(query, backend="lite", max_results=3))
            if results:
                href = results[0].get("href", "")
                if href:
                    logger.info(f"Successfully harvested fallback URL from DDG Lite search: {href}")
                    return href
    except Exception as e:
        logger.error(f"DDG Lite fallback search failed: {e}")
        
    return ""


async def process_programme(sem, browser, httpx_client, prog, total_count, index, csv_writer, csv_file):
    """
    Aggregates details for a single programme following the Ingestion Pipeline sequence.
    Concurrently limited by the Semaphore.
    """
    async with sem:
        programme_id = str(prog.get("programme_id"))
        university_name = prog.get("university_name", "Unknown")
        programme_title = prog.get("programme_title", "Unknown")
        
        logger.info(f"[{index}/{total_count}] Ingesting ID: {programme_id} - {programme_title} at {university_name}...")
        
        po_url = ""
        status = "not_found"
        university_page_url = ""
        
        # --- pipeline Stage 1: Hit DAAD detail page to extract outbound link ---
        daad_url = f"https://www.daad.de/en/studying-in-germany/universities/all-degree-programmes/detail/program-{programme_id}/?hec-id={programme_id}"
        try:
            # Enforce polite delay
            await polite_delay(daad_url)
            
            headers = {
                "User-Agent": random.choice(USER_AGENTS)
            }
            response = await httpx_client.get(daad_url, headers=headers)
            
            if response.status_code == 200:
                university_page_url = parse_outbound_university_link(response.text)
                if university_page_url:
                    logger.info(f"ID {programme_id}: Extracted university page URL -> {university_page_url}")
            else:
                logger.warning(f"ID {programme_id}: DAAD detail page returned status code {response.status_code}")
        except Exception as e:
            logger.warning(f"ID {programme_id}: Failed to fetch/parse DAAD detail page: {e}")
            
        # --- pipeline Stage 2: Crawl university programme page using Playwright ---
        if university_page_url:
            try:
                po_url = await get_po_link_from_university_page(browser, university_page_url)
                if po_url:
                    status = "found_direct"
                    logger.info(f"ID {programme_id}: Found direct PO link -> {po_url}")
            except Exception as e:
                logger.warning(f"ID {programme_id}: Error scraping university page: {e}")
                
        # --- pipeline Stage 3: Bing Search Fallback ---
        if not po_url:
            try:
                po_url = await search_bing_fallback(browser, programme_title, university_name)
                if po_url:
                    status = "found_fallback"
                    logger.info(f"ID {programme_id}: Found fallback PO link -> {po_url}")
            except Exception as e:
                logger.warning(f"ID {programme_id}: Error performing Bing fallback search: {e}")
                
        if not po_url:
            logger.warning(f"ID {programme_id}: No Prüfungsordnung URL discovered.")
            status = "not_found"
            po_url = ""
            
        # --- pipeline Stage 4: Record Results to Output CSV ---
        row = [programme_id, university_name, programme_title, po_url, status]
        csv_writer.writerow(row)
        csv_file.flush() # immediate flush to disk

async def main():
    parser = argparse.ArgumentParser(description="Prüfungsordnung (PO) PDF URL ingestion scraper.")
    parser.add_argument("--dry-run", action="store_true", help="Process only the first 5 entries for testing.")
    args = parser.parse_args()
    
    # 1. Seeding Bootstrap check
    convert_csv_to_json_if_needed()
    
    # Load input JSON
    if not os.path.exists(JSON_INPUT_PATH):
        logger.error(f"Input JSON file not found at {JSON_INPUT_PATH}. Please run stage 1 discovery first.")
        sys.exit(1)
        
    try:
        with open(JSON_INPUT_PATH, "r", encoding="utf-8") as f:
            programmes = json.load(f)
    except Exception as e:
        logger.error(f"Failed to load programmes input JSON: {e}")
        sys.exit(1)
        
    # Apply dry-run limit
    if args.dry_run:
        logger.info("Executing in DRY-RUN mode. Limiting ingestion to the first 5 programmes...")
        programmes = programmes[:5]
        
    total_count = len(programmes)
    logger.info(f"Starting ingestion pipeline for {total_count} programmes...")
    
    # Setup CSV output
    file_exists = os.path.exists(CSV_OUTPUT_PATH)
    try:
        csv_file = open(CSV_OUTPUT_PATH, "a", encoding="utf-8", newline="")
        csv_writer = csv.writer(csv_file)
        if not file_exists:
            csv_writer.writerow(["programme_id", "university_name", "programme_title", "po_url", "status"])
            csv_file.flush()
    except Exception as e:
        logger.error(f"Failed to open output CSV at {CSV_OUTPUT_PATH}: {e}")
        sys.exit(1)
        
    # Concurrency and clients initialization
    sem = asyncio.Semaphore(5)
    
    # Initialize httpx AsyncClient for static/Solr checks
    timeout = httpx.Timeout(20.0, connect=10.0)
    async with httpx.AsyncClient(timeout=timeout, follow_redirects=True) as httpx_client:
        # Initialize async playwright Chromium headless instance
        async with async_playwright() as p:
            logger.info("Starting headless Playwright Chromium instance...")
            browser = await p.chromium.launch(headless=True)
            
            # Formulate the task list
            tasks = [
                process_programme(
                    sem, browser, httpx_client, prog, total_count, index, csv_writer, csv_file
                )
                for index, prog in enumerate(programmes, 1)
            ]
            
            # Execute all tasks concurrently (respecting semaphore=5)
            await asyncio.gather(*tasks)
            
            # Clean up browser
            await browser.close()
            
    csv_file.close()
    logger.info(f"Pipeline execution completed successfully. Results saved to {CSV_OUTPUT_PATH}")

if __name__ == "__main__":
    asyncio.run(main())
