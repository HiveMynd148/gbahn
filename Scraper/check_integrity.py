import os
import glob

def check_integrity():
    downloads_dir = r"d:\Gradbahn\Scraper\downloads"
    files = glob.glob(os.path.join(downloads_dir, "*"))
    
    total = len(files)
    valid_pdfs = 0
    html_wrappers = []
    other_formats = []
    empty_files = []
    
    for f in files:
        basename = os.path.basename(f)
        size = os.path.getsize(f)
        
        if size == 0:
            empty_files.append(basename)
            continue
            
        try:
            with open(f, "rb") as fh:
                head = fh.read(1024)
                
            if b"%PDF-" in head:
                valid_pdfs += 1
            elif b"<html" in head.lower() or b"<!doc" in head.lower() or b"<script" in head.lower():
                html_wrappers.append((basename, size))
            else:
                other_formats.append((basename, size, head[:30]))
        except Exception as e:
            other_formats.append((basename, size, str(e).encode()))

    print("=========================================")
    print("      PDF INTEGRITY CHECK RESULTS        ")
    print("=========================================")
    print(f"Total Files Checked:       {total}")
    print(f"Valid Binary PDFs:         {valid_pdfs}")
    print(f"Empty Files (0 bytes):     {len(empty_files)}")
    print(f"HTML Wrappers/Redirects:   {len(html_wrappers)}")
    print(f"Other Invalid Formats:     {len(other_formats)}")
    print("=========================================")
    
    if empty_files:
        print("\n[EMPTY] EMPTY FILES (0 Bytes):")
        for f in empty_files:
            print(f"  - {f}")
            
    if html_wrappers:
        print("\n[HTML] HTML WRAPPERS / REDIRECTS (Not direct PDFs):")
        for f, size in html_wrappers:
            print(f"  - {f} (size: {size} bytes)")
            
    if other_formats:
        print("\n[OTHER] OTHER FORMATS / ERRORS:")
        for f, size, head in other_formats:
            print(f"  - {f} (size: {size} bytes) -> Header: {head}")

if __name__ == "__main__":
    check_integrity()
