"""
Script to scrape just the 2026 Indoor season data
"""
import requests
import time
import scrape as scraper

SCHOOLS = {
    "Johns_Hopkins" : "MD",
    "McDaniel" : "MD",
    "Ursinus" : "PA",
    "Dickinson_College" : "PA",
    "Franklin__Marshall" : "PA",
    "Gettysburg" : "PA",
    "Haverford" : "PA",
    "Muhlenberg" : "PA",
    "Bryn_Mawr" : "PA",
    "Swarthmore" : "PA"
}

# 2026 Indoor season IDs
LIST_HND = 5354
SEASON_HND = 697
YEAR = 2026
SEASON = "Indoor"

def get_url_html_content(url: str) -> str:
    response = requests.get(url, headers={
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36"
    })
    return response.text

def get_full_url(school: str, state: str, gender: str) -> str:
    return f"https://www.tfrrs.org/all_performances/{state}_college_{gender}_{school}.html?list_hnd={LIST_HND}&season_hnd={SEASON_HND}"

def main():
    count = 0
    total = len(SCHOOLS) * 2 - 1  # -1 for Bryn Mawr (women only)
    
    print(f"Starting scrape of {YEAR} {SEASON} season...")
    print(f"Total pages to scrape: {total}")
    print("-" * 50)
    
    for school, state in SCHOOLS.items():
        for gender in ["m", "f"]:
            # Skip Bryn Mawr men's (women's college)
            if school == "Bryn_Mawr" and gender == "m":
                continue
            
            url = get_full_url(school, state, gender)
            gender_name = "Men" if gender == "m" else "Women"
            
            print(f"\nScraping {school} {gender_name}...")
            
            # Exponential backoff for retries
            for attempt in range(1, 4):
                try:
                    html_content = get_url_html_content(url)
                    
                    # Save the HTML (optional)
                    outpath = f"pages/{YEAR}_{SEASON}_{state}_college_{gender}_{school}.html"
                    with open(outpath, 'w') as f:
                        f.write(html_content)
                    
                    # Parse and insert into database
                    scraper.scrape_file(html_content, SEASON, YEAR, gender, school)
                    
                    count += 1
                    print(f"  ✓ Done ({count}/{total})")
                    break
                    
                except requests.exceptions.RequestException as e:
                    print(f"  ✗ Attempt {attempt} failed: {e}")
                    if attempt == 3:
                        print(f"  ERROR: Failed after 3 attempts")
                    else:
                        time.sleep(0.75 * (2 ** attempt))
            
            # Rate limiting
            time.sleep(0.5)
    
    print("\n" + "=" * 50)
    print(f"Scraping complete! {count}/{total} pages scraped.")
    print("=" * 50)

if __name__ == "__main__":
    main()

