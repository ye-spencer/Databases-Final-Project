"""
Script to scrape Franklin & Marshall data for all seasons
"""
import requests
import time
import scrape as scraper

# Franklin & Marshall only
SCHOOLS = {
    "Franklin__Marshall": "PA"
}

# All seasons from the main scraper
SEASONS = {
    (2010, "Indoor"): (601, 132),
    (2010, "Outdoor"): (600, 131),
    (2011, "Indoor"): (611, 138),
    (2011, "Outdoor"): (695, 158),
    (2012, "Indoor"): (773, 167),
    (2012, "Outdoor"): (863, 191),
    (2013, "Indoor"): (948, 202),
    (2013, "Outdoor"): (1047, 221),
    (2014, "Indoor"): (1148, 236),
    (2014, "Outdoor"): (1251, 256),
    (2015, "Indoor"): (1429, 276),
    (2015, "Outdoor"): (1552, 303),
    (2016, "Indoor"): (1587, 309),
    (2016, "Outdoor"): (1683, 336),
    (2017, "Indoor"): (1793, 346),
    (2017, "Outdoor"): (1915, 377),
    (2018, "Indoor"): (2120, 388),
    (2018, "Outdoor"): (2278, 414),
    (2019, "Indoor"): (2330, 429),
    (2019, "Outdoor"): (2573, 453),
    (2020, "Indoor"): (2776, 474),
    (2020, "Outdoor"): (2906, 496),
    (2021, "Indoor"): (3167, 519),
    (2021, "Outdoor"): (3200, 530),
    (2022, "Indoor"): (3501, 548),
    (2022, "Outdoor"): (3730, 568),
    (2023, "Indoor"): (3909, 584),
    (2023, "Outdoor"): (4153, 608),
    (2024, "Indoor"): (4466, 627),
    (2024, "Outdoor"): (4541, 645),
    (2025, "Indoor"): (4874, 661),
    (2025, "Outdoor"): (5027, 681),
    (2026, "Indoor"): (5354, 697)
}

def get_url_html_content(url: str) -> str:
    response = requests.get(url, headers={
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36"
    })
    return response.text

def get_full_url(school: str, state: str, gender: str, lst_hnd: int, season_hnd: int) -> str:
    return f"https://www.tfrrs.org/all_performances/{state}_college_{gender}_{school}.html?list_hnd={lst_hnd}&season_hnd={season_hnd}"

def main():
    count = 0
    total = len(SCHOOLS) * len(SEASONS) * 2  # 2 genders
    
    print(f"Starting scrape of Franklin & Marshall for all seasons...")
    print(f"Total pages to scrape: {total}")
    print("=" * 60)
    
    for (year, season), (lst_hnd, season_hnd) in SEASONS.items():
        for school, state in SCHOOLS.items():
            for gender in ["m", "f"]:
                url = get_full_url(school, state, gender, lst_hnd, season_hnd)
                gender_name = "Men" if gender == "m" else "Women"
                
                print(f"\n[{count+1}/{total}] {year} {season} - {gender_name}...")
                
                # Exponential backoff for retries
                success = False
                for attempt in range(1, 4):
                    try:
                        html_content = get_url_html_content(url)
                        
                        # Save the HTML (optional)
                        outpath = f"pages/{year}_{season}_{state}_college_{gender}_{school}.html"
                        with open(outpath, 'w') as f:
                            f.write(html_content)
                        
                        # Parse and insert into database
                        scraper.scrape_file(html_content, season, year, gender, school)
                        
                        count += 1
                        print(f"  ✓ Done")
                        success = True
                        break
                        
                    except requests.exceptions.RequestException as e:
                        print(f"  ✗ Attempt {attempt} failed: {e}")
                        if attempt == 3:
                            print(f"  ERROR: Failed after 3 attempts")
                        else:
                            time.sleep(0.75 * (2 ** attempt))
                
                if not success:
                    print(f"  ⚠ Skipping {year} {season} {gender_name}")
                
                # Rate limiting
                time.sleep(0.5)
    
    print("\n" + "=" * 60)
    print(f"Scraping complete! {count}/{total} pages scraped successfully.")
    print("=" * 60)

if __name__ == "__main__":
    main()

