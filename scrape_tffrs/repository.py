# Repository.py
# Database connection and insert functions for TFRRS scraper

import psycopg2
from psycopg2 import sql
import os
import re
from dotenv import load_dotenv

# Load environment variables from .env file
load_dotenv()

# ============================================================
# DATABASE CONNECTION
# ============================================================

# Set your Neon connection string as an environment variable:
# export DATABASE_URL="postgresql://user:pass@host/dbname?sslmode=require"

_connection = None

def get_connection():
    global _connection
    if _connection is None or _connection.closed:
        database_url = os.environ.get("DATABASE_URL")
        if not database_url:
            raise Exception("DATABASE_URL environment variable not set!")
        _connection = psycopg2.connect(database_url)
        _connection.autocommit = True
    return _connection

def close_connection():
    global _connection
    if _connection and not _connection.closed:
        _connection.close()
        _connection = None

# ============================================================
# RESULT CONVERSION
# ============================================================

def convert_result_to_decimal(result: str) -> float:
    """
    Convert time/distance/points string to decimal.
    Examples:
        "10.52" -> 10.52
        "1:52.12" -> 112.12 (1 min 52.12 sec)
        "14:32.5" -> 872.5
        "2:03:45.2" -> 7425.2 (hours:min:sec)
        "5.67m" -> 5.67
        "45' 2.5\"" -> 13.78 (feet/inches to meters)
        "DNF", "DNS", "DQ", "FOUL", "NH", "NM" -> None
    """
    if not result:
        return None
    
    result = result.strip().upper()
    
    # Handle non-results
    if result in ("DNF", "DNS", "DQ", "FOUL", "NH", "NM", "ND", "SCR", ""):
        return None
    
    # Remove trailing 'm' or other units
    result = re.sub(r'[mM]$', '', result.strip())
    
    # Handle feet/inches format (45' 2.5")
    feet_match = re.match(r"(\d+)['\u2019]\s*(\d+\.?\d*)[\"″]?", result)
    if feet_match:
        feet = float(feet_match.group(1))
        inches = float(feet_match.group(2)) if feet_match.group(2) else 0
        return round((feet * 0.3048) + (inches * 0.0254), 2)
    
    # Handle time formats with colons
    parts = result.split(':')
    
    try:
        if len(parts) == 1:
            # Just seconds or distance: "10.52"
            return float(parts[0])
        elif len(parts) == 2:
            # Minutes:seconds: "1:52.12"
            minutes = float(parts[0])
            seconds = float(parts[1])
            return round(minutes * 60 + seconds, 2)
        elif len(parts) == 3:
            # Hours:minutes:seconds: "2:03:45.2"
            hours = float(parts[0])
            minutes = float(parts[1])
            seconds = float(parts[2])
            return round(hours * 3600 + minutes * 60 + seconds, 2)
    except ValueError:
        return None
    
    return None

def convert_wind_to_decimal(wind: str) -> float:
    """Convert wind string to decimal. Returns None if no wind data."""
    if not wind or wind.strip() == "":
        return None
    
    wind = wind.strip().replace('+', '')
    try:
        return float(wind)
    except ValueError:
        return None

# ============================================================
# EVENT TYPE / MEASURE UNIT INFERENCE
# ============================================================

def infer_event_type_and_unit(event_name: str, is_relay: bool) -> tuple:
    """
    Infer event_type and measure_unit from event name.
    Returns (event_type, measure_unit)
    
    Event Types:
    - sprints: 60m, 100m, 200m, 400m, 500m, 600m, hurdles, sprint relays
    - distance: 800m+, mile, steeplechase, distance relays (DMR, 4x800)
    - throws: shot put, discus, hammer, javelin, weight throw
    - jumps: high jump, pole vault, long jump, triple jump
    - combined: heptathlon, decathlon, pentathlon
    """
    name_lower = event_name.lower()
    
    # =====================
    # FIELD EVENTS
    # =====================
    
    # Throws
    if any(t in name_lower for t in ['shot', 'discus', 'hammer', 'javelin', 'weight throw']):
        return ('throws', 'meters')
    
    # Jumps
    if any(j in name_lower for j in ['high jump', 'pole vault', 'long jump', 'triple jump']):
        return ('jumps', 'meters')
    
    # Combined/Multi events
    if any(c in name_lower for c in ['heptathlon', 'decathlon', 'pentathlon']):
        return ('combined', 'points')
    
    # =====================
    # RELAY EVENTS
    # =====================
    
    # Distance relays
    if any(r in name_lower for r in ['distance medley', 'dmr', '4 x 800', '4x800']):
        return ('distance', 'seconds')
    
    # Sprint relays
    if any(r in name_lower for r in ['4 x 100', '4 x 200', '4 x 400', '4x100', '4x200', '4x400', '4 x 1', '4 x 2', '4 x 4', '4x1', '4x2', '4x4']):
        return ('sprints', 'seconds')
    
    # =====================
    # INDIVIDUAL RUNNING EVENTS
    # =====================
    
    # Distance events (800m and longer)
    if any(d in name_lower for d in ['800', '1000', '1500', 'mile', '3000', '5000', '10000', '10,000', 'steeplechase']):
        return ('distance', 'seconds')
    
    # Sprint events (shorter than 800m)
    if any(s in name_lower for s in ['55', '60', '100', '200', '400', '500', '600', 'hurdle', 'dash']):
        return ('sprints', 'seconds')
    
    # =====================
    # DEFAULT
    # =====================
    return ('sprints', 'seconds')

# ============================================================
# INSERT FUNCTIONS
# ============================================================

def insert_event(event_id: int, event_name: str, is_relay: bool):
    """Insert event if it doesn't already exist."""
    conn = get_connection()
    cur = conn.cursor()
    
    event_type, measure_unit = infer_event_type_and_unit(event_name, is_relay)
    
    cur.execute("""
        INSERT INTO TrackEvent (EventID, EventName, EventType, MeasureUnit, IsRelay)
        VALUES (%s, %s, %s, %s, %s)
        ON CONFLICT (EventID) DO NOTHING
    """, (event_id, event_name[:20], event_type, measure_unit, is_relay))
    
    cur.close()
    print(f"REPOSITORY: Inserted Event '{event_name}' (ID: {event_id}, Type: {event_type}, Relay: {is_relay})")


def insert_athlete(athlete_id: int, athlete_first_name: str, athlete_last_name: str, athlete_gender: str):
    """Insert athlete if they don't already exist."""
    conn = get_connection()
    cur = conn.cursor()
    
    # Normalize gender to uppercase
    gender = athlete_gender.upper() if athlete_gender else 'M'
    
    cur.execute("""
        INSERT INTO Athlete (AthleteID, AthleteFirstName, AthleteLastName, Gender)
        VALUES (%s, %s, %s, %s)
        ON CONFLICT (AthleteID) DO NOTHING
    """, (int(athlete_id), athlete_first_name[:100], athlete_last_name[:100], gender))
    
    cur.close()
    print(f"REPOSITORY: Inserted Athlete '{athlete_first_name} {athlete_last_name}' (ID: {athlete_id})")


def insert_meet(meet_id: int, meet_name: str, meet_date: str):
    """
    Insert meet if it doesn't exist, or update date range if it does.
    meet_date format expected: "Dec 7, 2024" or similar
    """
    conn = get_connection()
    cur = conn.cursor()
    
    # Parse the date
    from datetime import datetime
    date_obj = None
    for fmt in ["%b %d, %Y", "%B %d, %Y", "%m/%d/%Y", "%Y-%m-%d"]:
        try:
            date_obj = datetime.strptime(meet_date.strip(), fmt).date()
            break
        except ValueError:
            continue
    
    if date_obj is None:
        print(f"WARNING: Could not parse date '{meet_date}' for meet {meet_id}")
        return
    
    # Try to insert, or update date range if meet exists
    cur.execute("""
        INSERT INTO TrackMeet (MeetID, MeetName, StartDate, EndDate)
        VALUES (%s, %s, %s, %s)
        ON CONFLICT (MeetID) DO UPDATE SET
            StartDate = LEAST(TrackMeet.StartDate, EXCLUDED.StartDate),
            EndDate = GREATEST(TrackMeet.EndDate, EXCLUDED.EndDate)
    """, (int(meet_id), meet_name[:200], date_obj, date_obj))
    
    cur.close()
    print(f"REPOSITORY: Inserted/Updated Meet '{meet_name}' (ID: {meet_id}, Date: {date_obj})")


def get_or_create_athlete_season(athlete_id: int, school_id: str, season_type: str, season_year: int, class_year: str) -> int:
    """Get existing AthleteSeason ID or create new one. Returns AthleteSeasonID."""
    conn = get_connection()
    cur = conn.cursor()
    
    # Normalize class year
    class_year_clean = class_year.strip().upper()[:2] if class_year else 'FR'
    if class_year_clean not in ('FR', 'SO', 'JR', 'SR'):
        class_year_clean = 'FR'  # Default if unknown
    
    # Try to get existing
    cur.execute("""
        SELECT AthleteSeasonID, ClassYear FROM AthleteSeason
        WHERE AthleteID = %s AND SeasonType = %s AND SeasonYear = %s
    """, (int(athlete_id), season_type, season_year))
    
    row = cur.fetchone()
    if row:
        athlete_season_id, existing_class_year = row
        
        # If existing record has default 'FR' and we now have a REAL class year, update it!
        if existing_class_year == 'FR' and class_year_clean != 'FR':
            cur.execute("""
                UPDATE AthleteSeason SET ClassYear = %s
                WHERE AthleteSeasonID = %s
            """, (class_year_clean, athlete_season_id))
            print(f"REPOSITORY: Updated AthleteSeason {athlete_season_id} class year: FR -> {class_year_clean}")
        
        cur.close()
        return athlete_season_id
    
    # Create new
    cur.execute("""
        INSERT INTO AthleteSeason (AthleteID, SchoolID, SeasonType, SeasonYear, ClassYear)
        VALUES (%s, %s, %s, %s, %s)
        RETURNING AthleteSeasonID
    """, (int(athlete_id), school_id, season_type, season_year, class_year_clean))
    
    athlete_season_id = cur.fetchone()[0]
    cur.close()
    print(f"REPOSITORY: Created AthleteSeason (ID: {athlete_season_id}) for Athlete {athlete_id}, {season_type} {season_year}")
    return athlete_season_id


def insert_athlete_performance(meet_id: int, athlete_id: int, event_id: int, school_id: str, 
                                result: str, wind_info: str, season_type: str, season_year: int, class_year: str):
    """Insert an individual performance."""
    conn = get_connection()
    cur = conn.cursor()
    
    # Get or create athlete season
    athlete_season_id = get_or_create_athlete_season(athlete_id, school_id, season_type, season_year, class_year)
    
    # Convert result to decimal
    result_value = convert_result_to_decimal(result)
    if result_value is None:
        print(f"WARNING: Could not convert result '{result}' to decimal, skipping performance")
        return
    
    wind_value = convert_wind_to_decimal(wind_info)
    
    cur.execute("""
        INSERT INTO Performance (MeetID, EventID, AthleteSeasonID, RelayTeamID, ResultValue, WindGauge)
        VALUES (%s, %s, %s, NULL, %s, %s)
    """, (int(meet_id), int(event_id), athlete_season_id, result_value, wind_value))
    
    cur.close()
    print(f"REPOSITORY: Inserted Performance - Athlete {athlete_id}, Event {event_id}, Result {result_value}")


def insert_relay_team_performance(meet_id: int, athletes: tuple, event_id: int, school_id: str,
                                   result: str, wind_info: str, season_type: str, season_year: int):
    """Insert a relay team performance and its members."""
    conn = get_connection()
    cur = conn.cursor()
    
    # Convert result to decimal
    result_value = convert_result_to_decimal(result)
    if result_value is None:
        print(f"WARNING: Could not convert relay result '{result}' to decimal, skipping")
        return
    
    wind_value = convert_wind_to_decimal(wind_info)
    
    # Create relay team
    cur.execute("""
        INSERT INTO RelayTeam (SchoolID, EventID, MeetID)
        VALUES (%s, %s, %s)
        RETURNING RelayTeamID
    """, (school_id, int(event_id), int(meet_id)))
    
    relay_team_id = cur.fetchone()[0]
    
    # Insert performance
    cur.execute("""
        INSERT INTO Performance (MeetID, EventID, AthleteSeasonID, RelayTeamID, ResultValue, WindGauge)
        VALUES (%s, %s, NULL, %s, %s, %s)
    """, (int(meet_id), int(event_id), relay_team_id, result_value, wind_value))
    
    # Insert relay team members
    for leg_num, athlete_id in enumerate(athletes, start=1):
        if leg_num > 4:
            break
        
        # Get or create athlete season (class year unknown for relay members from this scrape)
        athlete_season_id = get_or_create_athlete_season(
            athlete_id, school_id, season_type, season_year, 'FR'  # Default to FR since we don't know
        )
        
        cur.execute("""
            INSERT INTO RelayTeamMembers (RelayTeamID, AthleteSeasonID, LegNum)
            VALUES (%s, %s, %s)
            ON CONFLICT DO NOTHING
        """, (relay_team_id, athlete_season_id, leg_num))
    
    cur.close()
    print(f"REPOSITORY: Inserted Relay Performance - Team {relay_team_id}, Event {event_id}, Result {result_value}")
