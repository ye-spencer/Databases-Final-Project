#!/usr/bin/env python3
"""
Test script: Scrape ONE page and insert into database.
This verifies the entire pipeline works before running the full scraper.
"""

import requests
import scrape as scraper
import repository as repo

# Test with Johns Hopkins Men, 2025 Indoor
SCHOOL = "Johns_Hopkins"
STATE = "MD"
GENDER = "m"
SEASON_TYPE = "Indoor"
SEASON_YEAR = 2025
LST_HND = 4874
SEASON_HND = 661

def main():
    # Build URL
    url = f"https://www.tfrrs.org/all_performances/{STATE}_college_{GENDER}_{SCHOOL}.html?list_hnd={LST_HND}&season_hnd={SEASON_HND}"
    
    print("=" * 60)
    print("SINGLE PAGE SCRAPE TEST")
    print("=" * 60)
    print(f"\nSchool: {SCHOOL}")
    print(f"Gender: {GENDER.upper()}")
    print(f"Season: {SEASON_TYPE} {SEASON_YEAR}")
    print(f"URL: {url}")
    print()
    
    # Download page
    print("Downloading page...")
    response = requests.get(url, headers={
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36"
    })
    
    if response.status_code != 200:
        print(f"ERROR: Got status code {response.status_code}")
        return
    
    print(f"Downloaded {len(response.text)} characters")
    print()
    
    # Parse and insert
    print("Parsing and inserting into database...")
    print("-" * 60)
    
    try:
        scraper.scrape_file(response.text, SEASON_TYPE, SEASON_YEAR, GENDER, SCHOOL)
        print("-" * 60)
        print("\n✅ Scrape complete!")
    except Exception as e:
        print(f"\n❌ Error during scrape: {e}")
        import traceback
        traceback.print_exc()
        return
    
    # Show what's in the database now
    print("\n" + "=" * 60)
    print("DATABASE CONTENTS AFTER SCRAPE")
    print("=" * 60)
    
    conn = repo.get_connection()
    cur = conn.cursor()
    
    # Count records
    tables = ['Athlete', 'AthleteSeason', 'TrackEvent', 'TrackMeet', 'Performance', 'RelayTeam']
    for table in tables:
        cur.execute(f"SELECT COUNT(*) FROM {table}")
        count = cur.fetchone()[0]
        print(f"  {table}: {count} records")
    
    # Show sample athletes
    print("\nSample Athletes:")
    cur.execute("SELECT AthleteID, AthleteFirstName, AthleteLastName FROM Athlete LIMIT 5")
    for row in cur.fetchall():
        print(f"  {row[0]}: {row[1]} {row[2]}")
    
    # Show sample events
    print("\nEvents Found:")
    cur.execute("SELECT EventID, EventName, EventType FROM TrackEvent")
    for row in cur.fetchall():
        print(f"  {row[0]}: {row[1]} ({row[2]})")
    
    # Show sample performances
    print("\nSample Performances:")
    cur.execute("""
        SELECT a.AthleteFirstName, a.AthleteLastName, e.EventName, p.ResultValue
        FROM Performance p
        JOIN AthleteSeason ats ON p.AthleteSeasonID = ats.AthleteSeasonID
        JOIN Athlete a ON ats.AthleteID = a.AthleteID
        JOIN TrackEvent e ON p.EventID = e.EventID
        LIMIT 10
    """)
    for row in cur.fetchall():
        print(f"  {row[0]} {row[1]} - {row[2]}: {row[3]}")
    
    cur.close()
    print("\n" + "=" * 60)
    print("TEST COMPLETE!")
    print("=" * 60)

if __name__ == "__main__":
    main()

