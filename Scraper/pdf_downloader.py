import os
import re
import csv
import sys
import time
import random
import asyncio
import logging
import urllib.parse
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
logger = logging.getLogger("pdf_downloader")

# Paths Setup
SCRAPER_DIR = os.path.dirname(os.path.abspath(__file__))
CSV_INPUT_PATH = os.path.join(SCRAPER_DIR, "scraped_po_links.csv")
DOWNLOADS_DIR = os.path.join(SCRAPER_DIR, "downloads")

# Rotated User-Agents for polite HTTP requests
USER_AGENTS = [
    "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
    "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Safari/605.1.15",
    "Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:121.0) Gecko/20100101 Firefox/121.0",
    "Mozilla/5.0 (Macintosh; Intel Mac OS X 10.15; rv:121.0) Gecko/20100101 Firefox/121.0"
]

# Polite Throttling Maps
domain_locks = {}
domain_last_request = {}

async def polite_delay(url: str):
    """
    Ensures a polite 2.0-3.0s randomized delay between requests to the SAME domain.
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

def sanitize_filename(name: str) -> str:
    """
    Sanitizes string for safe file name usage across OS file systems.
    """
    # Replace non-alphanumeric/spaces with underscores
    name = re.sub(r"[^\w\s-]", "", name)
    # Replace whitespace/tabs with single underscores
    name = re.sub(r"[\s_]+", "_", name)
    return name.strip("_")

def is_direct_pdf(url: str) -> bool:
    """
    Checks if a URL points directly to a PDF resource based on suffix/pathing.
    """
    parsed = urllib.parse.urlparse(url)
    path = parsed.path.lower()
    return path.endswith(".pdf") or ".pdf?" in url.lower() or "/pdf/" in url.lower()

async def find_pdf_on_webpage(httpx_client, page_url: str) -> str:
    """
    Fetches an HTML webpage and searches for the most relevant PDF anchor link.
    """
    try:
        await polite_delay(page_url)
        headers = {"User-Agent": random.choice(USER_AGENTS)}
        
        logger.info(f"Resolving webpage to find PDF: {page_url}")
        r = await httpx_client.get(page_url, headers=headers, follow_redirects=True)
        if r.status_code != 200:
            return ""
            
        soup = BeautifulSoup(r.text, "lxml")
        keywords = ["Prüfungsordnung", "Studienordnung", "SPO", "Amtsblatt", "ordnung", "pdf"]
        scored_links = []
        
        for a in soup.find_all("a", href=True):
            href = a["href"].strip()
            text = a.get_text(strip=True)
            
            # Check if href is a PDF
            if href.lower().endswith(".pdf") or ".pdf?" in href.lower() or "/pdf/" in href.lower():
                score = 5
                # Match keywords in text or href
                if any(kw.lower() in text.lower() or kw.lower() in href.lower() for kw in keywords):
                    score = 10
                full_url = urllib.parse.urljoin(page_url, href)
                scored_links.append((score, full_url))
                
        if scored_links:
            # Sort by score descending
            scored_links.sort(key=lambda x: x[0], reverse=True)
            return scored_links[0][1]
            
    except Exception as e:
        logger.warning(f"Failed to scan webpage {page_url} for PDF links: {e}")
    return ""

async def download_file(sem, httpx_client, programme_id, university_name, programme_title, po_url):
    """
    Downloads the binary PDF and streams it directly to local disk.
    Concurrently limited by the Semaphore.
    """
    async with sem:
        if not po_url:
            logger.info(f"ID {programme_id}: Skipped (No URL found)")
            return
            
        target_url = po_url.strip()
        
        # Step 1: If it's a webpage, attempt to resolve it to a direct PDF link
        if not is_direct_pdf(target_url):
            resolved_url = await find_pdf_on_webpage(httpx_client, target_url)
            if resolved_url:
                logger.info(f"ID {programme_id}: Resolved webpage URL to PDF -> {resolved_url}")
                target_url = resolved_url
            else:
                logger.warning(f"ID {programme_id}: URL is a webpage and could not resolve to a direct PDF. Skipping download to prevent saving HTML as PDF.")
                return
        
        # Step 2: Download the binary stream
        try:
            # Enforce polite per-domain delay
            await polite_delay(target_url)
            
            headers = {"User-Agent": random.choice(USER_AGENTS)}
            logger.info(f"ID {programme_id}: Downloading PDF from {target_url}...")
            
            async with httpx_client.stream("GET", target_url, headers=headers, follow_redirects=True) as response:
                content_type = response.headers.get("content-type", "").lower()
                if "text/html" in content_type:
                    logger.warning(f"ID {programme_id}: Target URL returned an HTML page (not a PDF). Skipping saving to disk.")
                    return
                if response.status_code == 200:
                    # Construct sanitized safe filename
                    safe_uni = sanitize_filename(university_name)
                    safe_title = sanitize_filename(programme_title)
                    filename = f"{programme_id}_{safe_uni}_{safe_title}.pdf"
                    filepath = os.path.join(DOWNLOADS_DIR, filename)
                    
                    # Stream write to disk
                    with open(filepath, "wb") as f:
                        async for chunk in response.aiter_bytes(chunk_size=8192):
                            f.write(chunk)
                    logger.info(f"ID {programme_id}: Successfully downloaded -> {filename}")
                else:
                    logger.error(f"ID {programme_id}: Download failed with status code {response.status_code}")
        except Exception as e:
            logger.error(f"ID {programme_id}: Error downloading {target_url}: {e}")

async def main():
    if not os.path.exists(CSV_INPUT_PATH):
        logger.error(f"Input CSV file not found at {CSV_INPUT_PATH}. Please run the scraper first.")
        sys.exit(1)
        
    os.makedirs(DOWNLOADS_DIR, exist_ok=True)
    
    # Parse CSV inputs
    programmes_to_download = []
    try:
        try:
            with open(CSV_INPUT_PATH, "r", encoding="utf-8-sig") as f:
                rows = list(csv.DictReader(f))
        except UnicodeDecodeError:
            logger.info("UTF-8 decoding failed. Falling back to cp1252 encoding...")
            with open(CSV_INPUT_PATH, "r", encoding="cp1252") as f:
                rows = list(csv.DictReader(f))
                
        for row in rows:
            status = row.get("status", "")
            po_url = row.get("po_url", "")
            if status in ["found_direct", "found_fallback"] and po_url:
                programmes_to_download.append(row)
    except Exception as e:
        logger.error(f"Failed to read CSV at {CSV_INPUT_PATH}: {e}")
        sys.exit(1)
        
    total_count = len(programmes_to_download)
    logger.info(f"Found {total_count} programmes with valid examination regulation URLs to download.")
    
    if total_count == 0:
        logger.info("Nothing to download. Exiting.")
        return
        
    # Set concurrency semaphore
    sem = asyncio.Semaphore(5)
    
    # Initialize httpx AsyncClient with follow_redirects
    timeout = httpx.Timeout(30.0, connect=10.0)
    async with httpx.AsyncClient(timeout=timeout, follow_redirects=True) as httpx_client:
        tasks = [
            download_file(
                sem,
                httpx_client,
                prog.get("programme_id"),
                prog.get("university_name"),
                prog.get("programme_title"),
                prog.get("po_url")
            )
            for prog in programmes_to_download
        ]
        
        # Execute concurrent batch downloads
        await asyncio.gather(*tasks)
        
    logger.info(f"PDF Ingestion Pipeline complete. Downloads saved to {DOWNLOADS_DIR}")

if __name__ == "__main__":
    asyncio.run(main())
