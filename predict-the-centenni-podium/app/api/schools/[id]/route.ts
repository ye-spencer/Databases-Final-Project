// API Route: Get school details, records, roster, rankings
import { NextRequest, NextResponse } from 'next/server';
import { query } from '../../../lib/db';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const searchParams = request.nextUrl.searchParams;
  const seasonYear = searchParams.get('year') || '2026';
  const seasonType = searchParams.get('type') || 'Indoor';
  const gender = searchParams.get('gender') || 'M'; // M or F

  // Calculate date range for the season
  // Indoor: December 1 of previous year through mid-March (NCAA Indoors)
  // Outdoor: mid-March through June (NCAA Outdoors)
  const seasonStartDate = seasonType === 'Indoor' 
    ? `${Number(seasonYear) - 1}-12-01`  // Dec 1 of previous year
    : `${seasonYear}-03-15`;              // Mid-March
  const seasonEndDate = seasonType === 'Indoor' 
    ? `${seasonYear}-03-15`               // Mid-March (NCAA Indoors)
    : `${seasonYear}-06-30`;              // End of June (NCAA Outdoors)

  try {
    // Get school info
    const schoolInfo = await query(`
      SELECT 
        s.SchoolID,
        s.SchoolName,
        s.EnrollmentSize,
        s.HasIndoorFacility,
        s.StreetAddress,
        g.CityName,
        g.StateCode
      FROM School s
      JOIN GeographicLocation g ON s.LocationID = g.LocationID
      WHERE s.SchoolID = $1
    `, [id]);

    if (schoolInfo.length === 0) {
      return NextResponse.json({ error: 'School not found' }, { status: 404 });
    }

    // Get roster for current season (filtered by gender)
    const roster = await query(`
      SELECT 
        a.AthleteID,
        a.AthleteFirstName,
        a.AthleteLastName,
        a.Gender,
        ats.ClassYear
      FROM Athlete a
      JOIN AthleteSeason ats ON a.AthleteID = ats.AthleteID
      WHERE ats.SchoolID = $1
        AND ats.SeasonYear = $2
        AND ats.SeasonType = $3
        AND a.Gender = $4
      ORDER BY a.AthleteLastName, a.AthleteFirstName
    `, [id, seasonYear, seasonType, gender]);

    // Get school records - TOP 5 per event (filtered by gender and season type)
    // Records are ALL-TIME for this school/gender/season type combo
    // For throws/jumps/combined: higher is better (DESC), for sprints/distance: lower is better (ASC)
    const records = await query(`
      WITH RankedPerformances AS (
        SELECT 
          e.EventID,
          e.EventName,
          e.EventType,
          e.MeasureUnit,
          p.ResultValue AS SchoolRecord,
          a.AthleteID,
          a.AthleteFirstName,
          a.AthleteLastName,
          ats.SeasonYear,
          ROW_NUMBER() OVER (
            PARTITION BY e.EventID 
            ORDER BY 
              CASE WHEN e.EventType IN ('throws', 'jumps', 'combined') THEN -p.ResultValue ELSE p.ResultValue END ASC
          ) AS rank
        FROM Performance p
        JOIN AthleteSeason ats ON p.AthleteSeasonID = ats.AthleteSeasonID
        JOIN Athlete a ON ats.AthleteID = a.AthleteID
        JOIN TrackEvent e ON p.EventID = e.EventID
        WHERE ats.SchoolID = $1
          AND e.IsRelay = FALSE
          AND p.ResultValue IS NOT NULL
          AND a.Gender = $2
          AND ats.SeasonType = $3
      )
      SELECT 
        EventID,
        EventName,
        EventType,
        MeasureUnit,
        SchoolRecord,
        AthleteID,
        AthleteFirstName,
        AthleteLastName,
        SeasonYear
      FROM RankedPerformances
      WHERE rank <= 5
      ORDER BY EventType, EventName, rank
    `, [id, gender, seasonType]);

    // Get season bests for CURRENT season only - TOP 5 per event
    // Filter by BOTH AthleteSeason AND Meet date to ensure it's from this season
    // For throws/jumps/combined: higher is better (DESC), for sprints/distance: lower is better (ASC)
    const seasonBests = await query(`
      WITH RankedSeasonPerformances AS (
        SELECT 
          e.EventID,
          e.EventName,
          e.EventType,
          p.ResultValue AS SeasonBest,
          a.AthleteID,
          a.AthleteFirstName,
          a.AthleteLastName,
          m.MeetName,
          m.StartDate,
          ROW_NUMBER() OVER (
            PARTITION BY e.EventID 
            ORDER BY 
              CASE WHEN e.EventType IN ('throws', 'jumps', 'combined') THEN -p.ResultValue ELSE p.ResultValue END ASC
          ) AS rank
        FROM Performance p
        JOIN AthleteSeason ats ON p.AthleteSeasonID = ats.AthleteSeasonID
        JOIN Athlete a ON ats.AthleteID = a.AthleteID
        JOIN TrackEvent e ON p.EventID = e.EventID
        JOIN TrackMeet m ON p.MeetID = m.MeetID
        WHERE ats.SchoolID = $1
          AND ats.SeasonYear = $2
          AND ats.SeasonType = $3
          AND e.IsRelay = FALSE
          AND p.ResultValue IS NOT NULL
          AND a.Gender = $4
          AND m.StartDate >= $5::date
          AND m.StartDate <= $6::date
      )
      SELECT 
        EventID,
        EventName,
        EventType,
        SeasonBest,
        AthleteID,
        AthleteFirstName,
        AthleteLastName,
        MeetName,
        StartDate
      FROM RankedSeasonPerformances
      WHERE rank <= 5
      ORDER BY EventType, EventName, rank
    `, [id, seasonYear, seasonType, gender, seasonStartDate, seasonEndDate]);

    // Get class breakdown (filtered by gender)
    const classBreakdown = await query(`
      SELECT 
        ats.ClassYear,
        COUNT(DISTINCT a.AthleteID) AS Count
      FROM AthleteSeason ats
      JOIN Athlete a ON ats.AthleteID = a.AthleteID
      WHERE ats.SchoolID = $1
        AND ats.SeasonYear = $2
        AND ats.SeasonType = $3
        AND a.Gender = $4
      GROUP BY ats.ClassYear
      ORDER BY ats.ClassYear
    `, [id, seasonYear, seasonType, gender]);

    return NextResponse.json({
      school: schoolInfo[0],
      roster,
      records,
      seasonBests,
      classBreakdown
    });
  } catch (error) {
    console.error('Error fetching school details:', error);
    return NextResponse.json({ error: 'Failed to fetch school details' }, { status: 500 });
  }
}
