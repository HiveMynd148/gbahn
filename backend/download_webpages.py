import os
import sys
import json
import logging
import httpx
from bs4 import BeautifulSoup
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker

# Setup paths
BASE_DIR = os.path.dirname(os.path.abspath(__file__))
DOWNLOAD_DIR = os.path.join(BASE_DIR, "downloaded_webpages")
os.makedirs(DOWNLOAD_DIR, exist_ok=True)

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] %(message)s",
    handlers=[logging.StreamHandler(sys.stdout)]
)
logger = logging.getLogger("downloader")

# DB Setup
db_url = "postgresql://appuser:strongpassword123@db:5432/german_ms_tracker"
engine = create_engine(db_url)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

sys.path.insert(0, os.path.join(BASE_DIR, "backend"))
from app.models.programme import Programme
from app.models.university import University

def fetch_url(url: str) -> str:
    headers = {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36"
    }
    try:
        with httpx.Client(follow_redirects=True, timeout=20.0) as client:
            response = client.get(url, headers=headers)
        if response.status_code == 200:
            soup = BeautifulSoup(response.text, "html.parser")
            for el in soup(["script", "style", "noscript", "iframe", "header", "footer", "nav", "aside"]):
                el.decompose()
            text = soup.get_text(separator="\n")
            lines = (line.strip() for line in text.splitlines())
            clean_text = "\n".join(line for line in lines if line)
            return clean_text
        else:
            return f"ERROR: HTTP {response.status_code}"
    except Exception as e:
        return f"ERROR: {e}"

def run():
    db = SessionLocal()
    try:
        programmes = db.query(Programme).filter(Programme.programme_website_url != None).all()
        logger.info(f"Found {len(programmes)} programmes with URLs to check.")
        
        results = []
        for i, prog in enumerate(programmes, 1):
            logger.info(f"[{i}/{len(programmes)}] Fetching '{prog.name}' at '{prog.university.name}'...")
            url = prog.programme_website_url
            filename = f"{prog.id}.txt"
            filepath = os.path.join(DOWNLOAD_DIR, filename)
            
            # Fetch and save
            text = fetch_url(url)
            with open(filepath, "w", encoding="utf-8") as f:
                f.write(f"ID: {prog.id}\nUniversity: {prog.university.name}\nProgramme: {prog.name}\nURL: {url}\n\n")
                f.write(text)
            
            # Store program data from DB for comparison
            db_data = {
                "id": str(prog.id),
                "university": prog.university.name,
                "programme": prog.name,
                "url": url,
                "nc_status": prog.nc_status.name if prog.nc_status else "None",
                "application_route": prog.application_route,
                "application_fee_eur": float(prog.application_fee_eur) if prog.application_fee_eur is not None else None,
                "min_gpa_german_scale": float(prog.min_gpa_german_scale) if prog.min_gpa_german_scale is not None else None,
                "total_ects_required": prog.total_ects_required,
                "gre_required": prog.gre_required.name if prog.gre_required else "None",
                "required_math_ects": float(prog.required_math_ects) if prog.required_math_ects is not None else None,
                "required_cs_ects": float(prog.required_cs_ects) if prog.required_cs_ects is not None else None,
                "is_free_tuition": prog.is_free_tuition,
                "tuition_fee_per_semester": float(prog.tuition_fee_per_semester) if prog.tuition_fee_per_semester is not None else None,
                "data_source": prog.data_source.name if prog.data_source else "None"
            }
            results.append(db_data)
            
        # Save db info to a JSON file
        with open(os.path.join(BASE_DIR, "db_programmes_dump.json"), "w", encoding="utf-8") as f:
            json.dump(results, f, indent=2)
            
        logger.info("Completed downloading all webpages.")
    finally:
        db.close()

if __name__ == "__main__":
    run()
