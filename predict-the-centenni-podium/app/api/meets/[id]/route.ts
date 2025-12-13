// API Route: Get meet details and results
import { NextRequest, NextResponse } from 'next/server';
import { query } from '../../../lib/db';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  try {
    // Get meet info
    const meetInfo = await query(`
      SELECT 
        tm.MeetID,
        tm.MeetName,
        tm.StartDate,
        tm.EndDate
      FROM TrackMeet tm
      WHERE tm.MeetID = $1
    `, [id]);

    if (meetInfo.length === 0) {
      return NextResponse.json({ error: 'Meet not found' }, { status: 404 });
    }

    // Get individual results by event (includes gender)
    const individualResults = await query(`
      SELECT 
        e.EventID,
        e.EventName,
        e.EventType,
        e.MeasureUnit,
        a.AthleteID,
        a.AthleteFirstName,
        a.AthleteLastName,
        a.Gender,
        s.SchoolName,
        p.ResultValue,
        p.WindGauge,
        ROW_NUMBER() OVER (
          PARTITION BY e.EventID, a.Gender 
          ORDER BY 
            CASE WHEN e.MeasureUnit = 'seconds' THEN p.ResultValue END ASC,
            CASE WHEN e.MeasureUnit != 'seconds' THEN p.ResultValue END DESC
        ) AS Place
      FROM Performance p
      JOIN AthleteSeason ats ON p.AthleteSeasonID = ats.AthleteSeasonID
      JOIN Athlete a ON ats.AthleteID = a.AthleteID
      JOIN School s ON ats.SchoolID = s.SchoolID
      JOIN TrackEvent e ON p.EventID = e.EventID
      WHERE p.MeetID = $1
        AND p.AthleteSeasonID IS NOT NULL
      ORDER BY a.Gender, e.EventType, e.EventName, Place
    `, [id]);

    // Get relay results (determine gender from first relay member)
    const relayResults = await query(`
      SELECT DISTINCT ON (p.PerformanceID)
        e.EventID,
        e.EventName,
        s.SchoolName,
        p.ResultValue,
        a.Gender,
        ROW_NUMBER() OVER (
          PARTITION BY e.EventID, a.Gender 
          ORDER BY p.ResultValue ASC
        ) AS Place
      FROM Performance p
      JOIN RelayTeam rt ON p.RelayTeamID = rt.RelayTeamID
      JOIN School s ON rt.SchoolID = s.SchoolID
      JOIN TrackEvent e ON p.EventID = e.EventID
      JOIN RelayTeamMembers rtm ON rt.RelayTeamID = rtm.RelayTeamID
      JOIN AthleteSeason ats ON rtm.AthleteSeasonID = ats.AthleteSeasonID
      JOIN Athlete a ON ats.AthleteID = a.AthleteID
      WHERE p.MeetID = $1
        AND p.RelayTeamID IS NOT NULL
      ORDER BY p.PerformanceID, a.Gender, e.EventName, Place
    `, [id]);

    // Get team scores by gender
    const teamScores = await query(`
      WITH RankedPerformances AS (
        SELECT 
          COALESCE(ats.SchoolID, rt.SchoolID) AS SchoolID,
          a.Gender,
          e.EventID,
          e.MeasureUnit,
          ROW_NUMBER() OVER (
            PARTITION BY e.EventID, a.Gender
            ORDER BY 
              CASE WHEN e.MeasureUnit = 'seconds' THEN p.ResultValue END ASC,
              CASE WHEN e.MeasureUnit != 'seconds' THEN p.ResultValue END DESC
          ) AS Place
        FROM Performance p
        JOIN TrackEvent e ON p.EventID = e.EventID
        LEFT JOIN AthleteSeason ats ON p.AthleteSeasonID = ats.AthleteSeasonID
        LEFT JOIN RelayTeam rt ON p.RelayTeamID = rt.RelayTeamID
        LEFT JOIN Athlete a ON ats.AthleteID = a.AthleteID
        WHERE p.MeetID = $1
      )
      SELECT 
        s.SchoolName,
        rp.Gender,
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
      GROUP BY s.SchoolID, s.SchoolName, rp.Gender
      ORDER BY rp.Gender, TotalPoints DESC
    `, [id]);

    return NextResponse.json({
      meet: meetInfo[0],
      individualResults,
      relayResults,
      teamScores
    });
  } catch (error) {
    console.error('Error fetching meet details:', error);
    return NextResponse.json({ error: 'Failed to fetch meet details' }, { status: 500 });
  }
}
