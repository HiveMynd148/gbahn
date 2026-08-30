import os
import glob
import json
import csv

def cross_reference():
    json_path = r"d:\Gradbahn\Scraper\scraped_programmes.json"
    downloads_dir = r"d:\Gradbahn\Scraper\downloads"
    csv_path = r"d:\Gradbahn\Scraper\scraped_po_links.csv"
    
    # 1. Load Scraped Programmes
    if not os.path.exists(json_path):
        print(f"Error: Scraped programmes JSON not found at {json_path}")
        return
        
    with open(json_path, "r", encoding="utf-8") as f:
        programmes = json.load(f)
        
    # 2. Get Downloaded PDFs Map
    downloaded_ids = set()
    pdf_files = glob.glob(os.path.join(downloads_dir, "*.pdf"))
    for pdf in pdf_files:
        basename = os.path.basename(pdf)
        # ID is the first token before underscore
        prog_id = basename.split("_")[0]
        downloaded_ids.add(prog_id)
        
    # 3. Analyze University Statistics
    uni_stats = {}
    for prog in programmes:
        pid = prog.get("programme_id")
        uni = prog.get("university_name", "Unknown").strip()
        title = prog.get("programme_title", "Unknown").strip()
        
        if uni not in uni_stats:
            uni_stats[uni] = {
                "total_programmes": 0,
                "downloaded_pdfs": 0,
                "programmes": []
            }
            
        uni_stats[uni]["total_programmes"] += 1
        has_pdf = pid in downloaded_ids
        if has_pdf:
            uni_stats[uni]["downloaded_pdfs"] += 1
            
        uni_stats[uni]["programmes"].append({
            "id": pid,
            "title": title,
            "downloaded": "Yes" if has_pdf else "No"
        })

    # Sort universities by total programmes descending
    sorted_unis = sorted(uni_stats.items(), key=lambda x: x[1]["total_programmes"], reverse=True)
    
    print("==========================================================================")
    print("                 CROSS-REFERENCE & COVERAGE ANALYSIS                     ")
    print("==========================================================================")
    print(f"Total Scraped Programmes (in JSON):  {len(programmes)}")
    print(f"Total Unique Universities:           {len(uni_stats)}")
    print(f"Total Downloaded Regulation PDFs:    {len(downloaded_ids)}")
    print(f"Overall Ingestion Success Rate:      {len(downloaded_ids) / len(programmes) * 100:.1f}%")
    print("==========================================================================\n")
    
    # Print Markdown Table
    print("| University Name | Total Programmes | Downloaded PDFs | Download Rate |")
    print("|---|---|---|---|")
    for uni, stats in sorted_unis:
        total = stats["total_programmes"]
        downloaded = stats["downloaded_pdfs"]
        rate = (downloaded / total) * 100
        print(f"| {uni} | {total} | {downloaded} | {rate:.1f}% |")

if __name__ == "__main__":
    cross_reference()
