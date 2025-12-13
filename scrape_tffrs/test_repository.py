#!/usr/bin/env python3
"""
Test script for repository.py
Run this to verify database connection and basic operations work.

Before running:
1. Set your Neon connection string:
   export DATABASE_URL="postgresql://user:pass@host/dbname?sslmode=require"

2. Make sure the tables exist (run table_generation.sql and add_manual_info.sql first)
"""

import repository as repo

def test_result_conversion():
    """Test the result conversion function."""
    print("\n=== Testing Result Conversion ===")
    
    test_cases = [
        ("10.52", 10.52),           # Simple seconds
        ("1:52.12", 112.12),        # Min:sec
        ("14:32.5", 872.5),         # Min:sec (distance)
        ("2:03:45", 7425.0),        # Hour:min:sec
        ("5.67m", 5.67),            # Meters with unit
        ("DNF", None),              # Did not finish
        ("DNS", None),              # Did not start
        ("", None),                 # Empty
    ]
    
    all_passed = True
    for input_val, expected in test_cases:
        result = repo.convert_result_to_decimal(input_val)
        status = "✓" if result == expected else "✗"
        if result != expected:
            all_passed = False
        print(f"  {status} '{input_val}' -> {result} (expected {expected})")
    
    return all_passed


def test_event_type_inference():
    """Test event type inference."""
    print("\n=== Testing Event Type Inference ===")
    
    test_cases = [
        ("100 Meters", False, ("sprints", "seconds")),
        ("800 Meters", False, ("distance", "seconds")),
        ("Shot Put", False, ("throws", "meters")),
        ("Long Jump", False, ("jumps", "meters")),
        ("4x400 Meter Relay", True, ("sprints", "seconds")),
        ("Heptathlon", False, ("combined", "points")),
    ]
    
    all_passed = True
    for event_name, is_relay, expected in test_cases:
        result = repo.infer_event_type_and_unit(event_name, is_relay)
        status = "✓" if result == expected else "✗"
        if result != expected:
            all_passed = False
        print(f"  {status} '{event_name}' -> {result} (expected {expected})")
    
    return all_passed


def test_database_connection():
    """Test that we can connect to the database."""
    print("\n=== Testing Database Connection ===")
    
    try:
        conn = repo.get_connection()
        cur = conn.cursor()
        cur.execute("SELECT 1")
        result = cur.fetchone()
        cur.close()
        
        if result and result[0] == 1:
            print("  ✓ Database connection successful!")
            return True
        else:
            print("  ✗ Unexpected result from database")
            return False
    except Exception as e:
        print(f"  ✗ Database connection failed: {e}")
        return False


def test_insert_operations():
    """Test insert operations (will actually insert test data!)"""
    print("\n=== Testing Insert Operations ===")
    print("  WARNING: This will insert test data into your database!")
    
    response = input("  Continue? (y/n): ")
    if response.lower() != 'y':
        print("  Skipped.")
        return True
    
    try:
        # Test inserting an event
        repo.insert_event(99999, "Test Event 100m", False)
        print("  ✓ insert_event works")
        
        # Test inserting an athlete
        repo.insert_athlete(99999, "Test", "Athlete", "M")
        print("  ✓ insert_athlete works")
        
        # Test inserting a meet
        repo.insert_meet(99999, "Test Meet 2024", "Dec 7, 2024")
        print("  ✓ insert_meet works")
        
        # Test getting/creating athlete season
        athlete_season_id = repo.get_or_create_athlete_season(99999, "Johns_Hopkins", "Indoor", 2024, "JR")
        print(f"  ✓ get_or_create_athlete_season works (ID: {athlete_season_id})")
        
        # Test inserting a performance
        repo.insert_athlete_performance(99999, 99999, 99999, "Johns_Hopkins", "10.52", "+1.2", "Indoor", 2024, "JR")
        print("  ✓ insert_athlete_performance works")
        
        print("\n  All insert tests passed! You may want to delete test data (IDs with 99999)")
        return True
        
    except Exception as e:
        print(f"  ✗ Insert test failed: {e}")
        return False


if __name__ == "__main__":
    print("=" * 50)
    print("Repository Test Suite")
    print("=" * 50)
    
    # Run tests that don't need DB
    test_result_conversion()
    test_event_type_inference()
    
    # Run DB tests
    if test_database_connection():
        test_insert_operations()
    
    # Cleanup
    repo.close_connection()
    print("\n" + "=" * 50)
    print("Tests complete!")

