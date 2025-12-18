// API Route: Get athlete details, PBs, season bests, and history
import { NextRequest, NextResponse } from 'next/server';
import { query } from '../../../lib/db';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  try {
    // Get athlete info
    const athleteInfo = await query(`
      SELECT 
        a.AthleteID,
        a.AthleteFirstName,
        a.AthleteLastName,
        a.Gender
      FROM Athlete a
      WHERE a.AthleteID = $1
    `, [id]);

    if (athleteInfo.length === 0) {
      return NextResponse.json({ error: 'Athlete not found' }, { status: 404 });
    }

    // Get seasons
    const seasons = await query(`
      SELECT 
        ats.AthleteSeasonID,
        ats.SeasonType,
        ats.SeasonYear,
        ats.ClassYear,
        s.SchoolName,
        s.SchoolID
      FROM AthleteSeason ats
      JOIN School s ON ats.SchoolID = s.SchoolID
      WHERE ats.AthleteID = $1
      ORDER BY ats.SeasonYear DESC, ats.SeasonType
    `, [id]);

    // Get personal bests (all-time best per event, separated by Indoor/Outdoor)
    // Use DISTINCT ON to get only one row per event per season type (the best one)
    // For throws/jumps/combined: higher is better (DESC), for sprints/distance: lower is better (ASC)
    const personalBests = await query(`
      SELECT DISTINCT ON (e.EventID, ats.SeasonType)
        e.EventID,
        e.EventName,
        e.EventType,
        e.MeasureUnit,
        ats.SeasonType,
        p.ResultValue AS PersonalBest,
        tm.MeetName AS PBMeet,
        tm.StartDate AS PBDate
      FROM Performance p
      JOIN AthleteSeason ats ON p.AthleteSeasonID = ats.AthleteSeasonID
      JOIN TrackEvent e ON p.EventID = e.EventID
      JOIN TrackMeet tm ON p.MeetID = tm.MeetID
      WHERE ats.AthleteID = $1
        AND e.IsRelay = FALSE
        AND p.ResultValue IS NOT NULL
      ORDER BY e.EventID, ats.SeasonType, 
        CASE WHEN e.EventType IN ('throws', 'jumps', 'combined') THEN -p.ResultValue ELSE p.ResultValue END ASC, 
        tm.StartDate DESC
    `, [id]);

    // Get season bests (best per event per season)
    // For throws/jumps/combined: higher is better (DESC), for sprints/distance: lower is better (ASC)
    const seasonBests = await query(`
      SELECT DISTINCT ON (ats.SeasonYear, ats.SeasonType, e.EventID)
        ats.SeasonYear,
        ats.SeasonType,
        e.EventName,
        p.ResultValue AS SeasonBest
      FROM Performance p
      JOIN AthleteSeason ats ON p.AthleteSeasonID = ats.AthleteSeasonID
      JOIN TrackEvent e ON p.EventID = e.EventID
      WHERE ats.AthleteID = $1
        AND e.IsRelay = FALSE
        AND p.ResultValue IS NOT NULL
      ORDER BY ats.SeasonYear DESC, ats.SeasonType, e.EventID, 
        CASE WHEN e.EventType IN ('throws', 'jumps', 'combined') THEN -p.ResultValue ELSE p.ResultValue END ASC
    `, [id]);

    // Get full performance history
    const performanceHistory = await query(`
      SELECT 
        p.PerformanceID,
        e.EventName,
        e.EventType,
        p.ResultValue,
        p.WindGauge,
        tm.MeetName,
        tm.StartDate,
        ats.SeasonYear,
        ats.SeasonType
      FROM Performance p
      JOIN AthleteSeason ats ON p.AthleteSeasonID = ats.AthleteSeasonID
      JOIN TrackEvent e ON p.EventID = e.EventID
      JOIN TrackMeet tm ON p.MeetID = tm.MeetID
      WHERE ats.AthleteID = $1
        AND e.IsRelay = FALSE
      ORDER BY tm.StartDate DESC
    `, [id]);

    // Get all performance data for trends (all times, not just last 10)
    // Separate by both event name AND season type (Indoor vs Outdoor)
    const trendData = await query(`
      SELECT 
        e.EventName,
        ats.SeasonType,
        p.ResultValue,
        tm.StartDate
      FROM Performance p
      JOIN AthleteSeason ats ON p.AthleteSeasonID = ats.AthleteSeasonID
      JOIN TrackEvent e ON p.EventID = e.EventID
      JOIN TrackMeet tm ON p.MeetID = tm.MeetID
      WHERE ats.AthleteID = $1
        AND e.IsRelay = FALSE
        AND p.ResultValue IS NOT NULL
      ORDER BY e.EventName, ats.SeasonType, tm.StartDate ASC
    `, [id]);

    return NextResponse.json({
      athlete: athleteInfo[0],
      seasons,
      personalBests,
      seasonBests,
      performanceHistory,
      trendData
    });
  } catch (error) {
    console.error('Error fetching athlete details:', error);
    return NextResponse.json({ error: 'Failed to fetch athlete details' }, { status: 500 });
  }
}

