-- ============================================================
-- Centennial Conference Track & Field Database
-- SQL Queries (Phase 1 Requirements)
-- Authors: Mirra Klimov & Spencer Ye
-- ============================================================


-- ============================================================
-- QUERY 1: Personal Best (General)
-- What is the personal-best time for a specific athlete in a specific event?
-- Example: Spencer Ye in 400 Meters
-- ============================================================
SELECT 
    a.AthleteFirstName,
    a.AthleteLastName,
    e.EventName,
    MIN(p.ResultValue) AS PersonalBest
FROM Performance p
JOIN AthleteSeason ats ON p.AthleteSeasonID = ats.AthleteSeasonID
JOIN Athlete a ON ats.AthleteID = a.AthleteID
JOIN TrackEvent e ON p.EventID = e.EventID
WHERE a.AthleteLastName = 'Ye' 
  AND a.AthleteFirstName = 'Spencer'
  AND e.EventName LIKE '%400%'
  AND e.IsRelay = FALSE
GROUP BY a.AthleteFirstName, a.AthleteLastName, e.EventName;


-- ============================================================
-- QUERY 2: Athletes from a School in a Season
-- Which athletes from a specific school competed in a specific season?
-- Example: Johns Hopkins, 2025 Indoor
-- ============================================================
SELECT DISTINCT 
    a.AthleteFirstName,
    a.AthleteLastName,
    ats.ClassYear
FROM Athlete a
JOIN AthleteSeason ats ON a.AthleteID = ats.AthleteID
WHERE ats.SchoolID = 'Johns_Hopkins'
  AND ats.SeasonYear = 2025
  AND ats.SeasonType = 'Indoor'
ORDER BY a.AthleteLastName, a.AthleteFirstName;


-- ============================================================
-- QUERY 3: Season Bests for an Athlete
-- What are the season bests for a specific athlete in each season?
-- Example: Alex Colletti in 200 Meters
-- ============================================================
SELECT 
    ats.SeasonYear,
    ats.SeasonType,
    e.EventName,
    MIN(p.ResultValue) AS SeasonBest
FROM Performance p
JOIN AthleteSeason ats ON p.AthleteSeasonID = ats.AthleteSeasonID
JOIN Athlete a ON ats.AthleteID = a.AthleteID
JOIN TrackEvent e ON p.EventID = e.EventID
WHERE a.AthleteLastName = 'Colletti'
  AND a.AthleteFirstName = 'Alex'
  AND e.EventName LIKE '%200%'
  AND e.IsRelay = FALSE
GROUP BY ats.SeasonYear, ats.SeasonType, e.EventName
ORDER BY ats.SeasonYear DESC, ats.SeasonType;


-- ============================================================
-- QUERY 4: All Results for an Athlete in a Year
-- What are all the results for a specific athlete in a specific year?
-- Example: Spencer Ye in 2025
-- ============================================================
SELECT 
    tm.MeetName,
    tm.StartDate,
    e.EventName,
    p.ResultValue,
    p.WindGauge
FROM Performance p
JOIN AthleteSeason ats ON p.AthleteSeasonID = ats.AthleteSeasonID
JOIN Athlete a ON ats.AthleteID = a.AthleteID
JOIN TrackEvent e ON p.EventID = e.EventID
JOIN TrackMeet tm ON p.MeetID = tm.MeetID
WHERE a.AthleteLastName = 'Ye'
  AND a.AthleteFirstName = 'Spencer'
  AND ats.SeasonYear = 2025
ORDER BY tm.StartDate, e.EventName;


-- ============================================================
-- QUERY 5: Conference Championship Results
-- Who are the top performers in a specific event at Conference Championships?
-- Example: 800 Meters at 2024 CC Championships
-- ============================================================
SELECT 
    a.AthleteFirstName,
    a.AthleteLastName,
    s.SchoolName,
    p.ResultValue
FROM Performance p
JOIN AthleteSeason ats ON p.AthleteSeasonID = ats.AthleteSeasonID
JOIN Athlete a ON ats.AthleteID = a.AthleteID
JOIN School s ON ats.SchoolID = s.SchoolID
JOIN TrackEvent e ON p.EventID = e.EventID
JOIN TrackMeet tm ON p.MeetID = tm.MeetID
WHERE e.EventName LIKE '%800%'
  AND e.IsRelay = FALSE
  AND tm.MeetName ILIKE '%centennial%conference%'
  AND EXTRACT(YEAR FROM tm.StartDate) = 2024
ORDER BY p.ResultValue ASC
LIMIT 10;


-- ============================================================
-- QUERY 6: Team Scoring at Conference Championships
-- Calculate team points using 10-8-6-5-4-3-2-1 scoring
-- Example: 2024 Outdoor Conference Championships
-- ============================================================
WITH RankedPerformances AS (
    SELECT 
        p.PerformanceID,
        e.EventID,
        e.EventName,
        COALESCE(ats.SchoolID, rt.SchoolID) AS SchoolID,
        p.ResultValue,
        -- Rank by result (lower is better for time events, higher for field)
        CASE 
            WHEN e.MeasureUnit = 'seconds' THEN 
                ROW_NUMBER() OVER (PARTITION BY e.EventID ORDER BY p.ResultValue ASC)
            ELSE 
                ROW_NUMBER() OVER (PARTITION BY e.EventID ORDER BY p.ResultValue DESC)
        END AS Place
    FROM Performance p
    JOIN TrackEvent e ON p.EventID = e.EventID
    JOIN TrackMeet tm ON p.MeetID = tm.MeetID
    LEFT JOIN AthleteSeason ats ON p.AthleteSeasonID = ats.AthleteSeasonID
    LEFT JOIN RelayTeam rt ON p.RelayTeamID = rt.RelayTeamID
    WHERE tm.MeetName ILIKE '%centennial%conference%outdoor%'
      AND EXTRACT(YEAR FROM tm.StartDate) = 2024
)
SELECT 
    s.SchoolName,
    SUM(
        CASE Place
            WHEN 1 THEN 10
            WHEN 2 THEN 8
            WHEN 3 THEN 6
            WHEN 4 THEN 5
            WHEN 5 THEN 4
            WHEN 6 THEN 3
            WHEN 7 THEN 2
            WHEN 8 THEN 1
            ELSE 0
        END
    ) AS TotalPoints
FROM RankedPerformances rp
JOIN School s ON rp.SchoolID = s.SchoolID
WHERE rp.Place <= 8
GROUP BY s.SchoolName
ORDER BY TotalPoints DESC;


-- ============================================================
-- QUERY 7: Top Performers by Event Across Conference
-- Who are the top 5 performers in each event this season?
-- Example: 2025 Indoor Season
-- ============================================================
WITH RankedAthletes AS (
    SELECT 
        a.AthleteFirstName,
        a.AthleteLastName,
        s.SchoolName,
        e.EventName,
        MIN(p.ResultValue) AS BestMark,
        ROW_NUMBER() OVER (
            PARTITION BY e.EventID 
            ORDER BY MIN(p.ResultValue) ASC
        ) AS ConferenceRank
    FROM Performance p
    JOIN AthleteSeason ats ON p.AthleteSeasonID = ats.AthleteSeasonID
    JOIN Athlete a ON ats.AthleteID = a.AthleteID
    JOIN School s ON ats.SchoolID = s.SchoolID
    JOIN TrackEvent e ON p.EventID = e.EventID
    WHERE ats.SeasonYear = 2025
      AND ats.SeasonType = 'Indoor'
      AND e.IsRelay = FALSE
      AND e.MeasureUnit = 'seconds'  -- Only time events for this example
    GROUP BY a.AthleteID, a.AthleteFirstName, a.AthleteLastName, s.SchoolName, e.EventID, e.EventName
)
SELECT EventName, AthleteFirstName, AthleteLastName, SchoolName, BestMark, ConferenceRank
FROM RankedAthletes
WHERE ConferenceRank <= 5
ORDER BY EventName, ConferenceRank;


-- ============================================================
-- QUERY 8: Athletes Who Competed in Multiple Events at Same Meet
-- Find athletes who ran both individual and relay at Penn Relays
-- ============================================================
SELECT DISTINCT
    a.AthleteFirstName,
    a.AthleteLastName,
    s.SchoolName
FROM Athlete a
JOIN AthleteSeason ats ON a.AthleteID = ats.AthleteID
JOIN School s ON ats.SchoolID = s.SchoolID
WHERE 
    -- Ran an individual event
    EXISTS (
        SELECT 1 FROM Performance p
        JOIN TrackMeet tm ON p.MeetID = tm.MeetID
        WHERE p.AthleteSeasonID = ats.AthleteSeasonID
          AND tm.MeetName ILIKE '%penn relays%'
    )
    AND
    -- Was on a relay team
    EXISTS (
        SELECT 1 FROM RelayTeamMembers rtm
        JOIN RelayTeam rt ON rtm.RelayTeamID = rt.RelayTeamID
        JOIN TrackMeet tm ON rt.MeetID = tm.MeetID
        WHERE rtm.AthleteSeasonID = ats.AthleteSeasonID
          AND tm.MeetName ILIKE '%penn relays%'
    );


-- ============================================================
-- QUERY 9: Athlete with Most Relay Appearances
-- Which athletes have competed in the most relays?
-- ============================================================
SELECT 
    a.AthleteFirstName,
    a.AthleteLastName,
    s.SchoolName,
    COUNT(DISTINCT rtm.RelayTeamID) AS RelayCount
FROM RelayTeamMembers rtm
JOIN AthleteSeason ats ON rtm.AthleteSeasonID = ats.AthleteSeasonID
JOIN Athlete a ON ats.AthleteID = a.AthleteID
JOIN School s ON ats.SchoolID = s.SchoolID
GROUP BY a.AthleteID, a.AthleteFirstName, a.AthleteLastName, s.SchoolName
ORDER BY RelayCount DESC
LIMIT 10;


-- ============================================================
-- QUERY 10: Seniors by School
-- How many seniors does each school have this year?
-- ============================================================
SELECT 
    s.SchoolName,
    COUNT(DISTINCT a.AthleteID) AS SeniorCount
FROM AthleteSeason ats
JOIN School s ON ats.SchoolID = s.SchoolID
JOIN Athlete a ON ats.AthleteID = a.AthleteID
WHERE ats.ClassYear = 'SR'
  AND ats.SeasonYear = 2025
GROUP BY s.SchoolID, s.SchoolName
ORDER BY SeniorCount DESC;


-- ============================================================
-- QUERY 11: School Roster
-- Get the full roster for a school in a season
-- ============================================================
SELECT 
    a.AthleteFirstName,
    a.AthleteLastName,
    ats.ClassYear,
    a.Gender
FROM Athlete a
JOIN AthleteSeason ats ON a.AthleteID = ats.AthleteID
WHERE ats.SchoolID = 'Johns_Hopkins'
  AND ats.SeasonYear = 2025
  AND ats.SeasonType = 'Indoor'
ORDER BY a.AthleteLastName, a.AthleteFirstName;


-- ============================================================
-- QUERY 12: Meet Results by Event
-- Get all results for a specific event at a specific meet
-- ============================================================
SELECT 
    a.AthleteFirstName,
    a.AthleteLastName,
    s.SchoolName,
    p.ResultValue,
    p.WindGauge
FROM Performance p
JOIN AthleteSeason ats ON p.AthleteSeasonID = ats.AthleteSeasonID
JOIN Athlete a ON ats.AthleteID = a.AthleteID
JOIN School s ON ats.SchoolID = s.SchoolID
JOIN TrackEvent e ON p.EventID = e.EventID
JOIN TrackMeet tm ON p.MeetID = tm.MeetID
WHERE e.EventName LIKE '%60 Meters%'
  AND tm.MeetName ILIKE '%black%blue%'
ORDER BY p.ResultValue ASC;


-- ============================================================
-- QUERY 13: Personal Best Progression
-- Track how an athlete's PB has improved over seasons
-- ============================================================
SELECT 
    ats.SeasonYear,
    ats.SeasonType,
    ats.ClassYear,
    MIN(p.ResultValue) AS SeasonBest
FROM Performance p
JOIN AthleteSeason ats ON p.AthleteSeasonID = ats.AthleteSeasonID
JOIN Athlete a ON ats.AthleteID = a.AthleteID
JOIN TrackEvent e ON p.EventID = e.EventID
WHERE a.AthleteLastName = 'Colletti'
  AND a.AthleteFirstName = 'Alex'
  AND e.EventName LIKE '%60 Meters%'
  AND e.IsRelay = FALSE
GROUP BY ats.SeasonYear, ats.SeasonType, ats.ClassYear
ORDER BY ats.SeasonYear, ats.SeasonType;


-- ============================================================
-- QUERY 14: Event Records by School
-- What is the best performance in each event for a school?
-- ============================================================
SELECT 
    e.EventName,
    a.AthleteFirstName,
    a.AthleteLastName,
    MIN(p.ResultValue) AS SchoolRecord
FROM Performance p
JOIN AthleteSeason ats ON p.AthleteSeasonID = ats.AthleteSeasonID
JOIN Athlete a ON ats.AthleteID = a.AthleteID
JOIN TrackEvent e ON p.EventID = e.EventID
WHERE ats.SchoolID = 'Johns_Hopkins'
  AND e.IsRelay = FALSE
  AND e.MeasureUnit = 'seconds'
GROUP BY e.EventID, e.EventName, a.AthleteID, a.AthleteFirstName, a.AthleteLastName
ORDER BY e.EventName;


-- ============================================================
-- QUERY 15: Meets Attended by School
-- Which meets did a school attend in a season?
-- ============================================================
SELECT DISTINCT
    tm.MeetName,
    tm.StartDate,
    tm.EndDate,
    COUNT(DISTINCT p.PerformanceID) AS PerformanceCount
FROM TrackMeet tm
JOIN Performance p ON tm.MeetID = p.MeetID
JOIN AthleteSeason ats ON p.AthleteSeasonID = ats.AthleteSeasonID
WHERE ats.SchoolID = 'Johns_Hopkins'
  AND ats.SeasonYear = 2025
GROUP BY tm.MeetID, tm.MeetName, tm.StartDate, tm.EndDate
ORDER BY tm.StartDate;


-- ============================================================
-- QUERY 16: Head-to-Head Comparison
-- Compare two athletes in the same event
-- ============================================================
SELECT 
    a.AthleteFirstName || ' ' || a.AthleteLastName AS Athlete,
    tm.MeetName,
    tm.StartDate,
    p.ResultValue
FROM Performance p
JOIN AthleteSeason ats ON p.AthleteSeasonID = ats.AthleteSeasonID
JOIN Athlete a ON ats.AthleteID = a.AthleteID
JOIN TrackEvent e ON p.EventID = e.EventID
JOIN TrackMeet tm ON p.MeetID = tm.MeetID
WHERE (a.AthleteLastName = 'Colletti' OR a.AthleteLastName = 'Ye')
  AND e.EventName LIKE '%60 Meters%'
  AND e.IsRelay = FALSE
ORDER BY tm.StartDate, p.ResultValue;


-- ============================================================
-- QUERY 17: Best Relay Teams
-- Rank relay teams by performance
-- ============================================================
SELECT 
    s.SchoolName,
    e.EventName,
    tm.MeetName,
    p.ResultValue
FROM Performance p
JOIN RelayTeam rt ON p.RelayTeamID = rt.RelayTeamID
JOIN School s ON rt.SchoolID = s.SchoolID
JOIN TrackEvent e ON p.EventID = e.EventID
JOIN TrackMeet tm ON p.MeetID = tm.MeetID
WHERE e.EventName LIKE '%4 x 400%'
ORDER BY p.ResultValue ASC
LIMIT 10;


-- ============================================================
-- QUERY 18: Athletes with Most Performances
-- Who has competed the most this season?
-- ============================================================
SELECT 
    a.AthleteFirstName,
    a.AthleteLastName,
    s.SchoolName,
    COUNT(*) AS PerformanceCount
FROM Performance p
JOIN AthleteSeason ats ON p.AthleteSeasonID = ats.AthleteSeasonID
JOIN Athlete a ON ats.AthleteID = a.AthleteID
JOIN School s ON ats.SchoolID = s.SchoolID
WHERE ats.SeasonYear = 2025
  AND ats.SeasonType = 'Indoor'
GROUP BY a.AthleteID, a.AthleteFirstName, a.AthleteLastName, s.SchoolName
ORDER BY PerformanceCount DESC
LIMIT 20;


-- ============================================================
-- QUERY 19: Multi-Event Athletes
-- Athletes who compete in 3+ different events
-- ============================================================
SELECT 
    a.AthleteFirstName,
    a.AthleteLastName,
    s.SchoolName,
    COUNT(DISTINCT e.EventID) AS EventCount,
    STRING_AGG(DISTINCT e.EventName, ', ') AS Events
FROM Performance p
JOIN AthleteSeason ats ON p.AthleteSeasonID = ats.AthleteSeasonID
JOIN Athlete a ON ats.AthleteID = a.AthleteID
JOIN School s ON ats.SchoolID = s.SchoolID
JOIN TrackEvent e ON p.EventID = e.EventID
WHERE ats.SeasonYear = 2025
  AND e.IsRelay = FALSE
GROUP BY a.AthleteID, a.AthleteFirstName, a.AthleteLastName, s.SchoolName
HAVING COUNT(DISTINCT e.EventID) >= 3
ORDER BY EventCount DESC;


-- ============================================================
-- QUERY 20: Average Performance by Event Type
-- What's the average time/distance by event type for each school?
-- ============================================================
SELECT 
    s.SchoolName,
    e.EventType,
    COUNT(*) AS PerformanceCount,
    ROUND(AVG(p.ResultValue), 2) AS AvgResult
FROM Performance p
JOIN AthleteSeason ats ON p.AthleteSeasonID = ats.AthleteSeasonID
JOIN School s ON ats.SchoolID = s.SchoolID
JOIN TrackEvent e ON p.EventID = e.EventID
WHERE ats.SeasonYear = 2025
GROUP BY s.SchoolID, s.SchoolName, e.EventType
ORDER BY s.SchoolName, e.EventType;

