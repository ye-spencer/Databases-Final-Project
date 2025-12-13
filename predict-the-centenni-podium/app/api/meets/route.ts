// API Route: Get all meets or search meets
import { NextRequest, NextResponse } from 'next/server';
import { query } from '../../lib/db';

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const year = searchParams.get('year');
  const seasonType = searchParams.get('type'); // Indoor or Outdoor
  const search = searchParams.get('search');

  try {
    let sql = `
      SELECT 
        tm.MeetID,
        tm.MeetName,
        tm.StartDate,
        tm.EndDate,
        COUNT(DISTINCT p.PerformanceID) AS PerformanceCount,
        COUNT(DISTINCT ats.AthleteID) AS AthleteCount
      FROM TrackMeet tm
      LEFT JOIN Performance p ON tm.MeetID = p.MeetID
      LEFT JOIN AthleteSeason ats ON p.AthleteSeasonID = ats.AthleteSeasonID
    `;
    const params: any[] = [];
    const conditions: string[] = [];

    // Filter by season (year + type)
    if (year && seasonType) {
      if (seasonType === 'Indoor') {
        // Indoor season: December of previous year through mid-March
        // e.g., 2026 Indoor = Dec 2025 - Mar 2026
        // e.g., 2025 Indoor = Dec 2024 - Mar 2025
        conditions.push(`(
          tm.StartDate >= $${params.length + 1}::date AND tm.StartDate <= $${params.length + 2}::date
        )`);
        params.push(`${Number(year) - 1}-12-01`); // Dec 1 of previous year
        params.push(`${year}-03-15`); // Mid-March (NCAA Indoors)
      } else {
        // Outdoor season: mid-March through June
        // e.g., 2025 Outdoor = Mar 2025 - Jun 2025
        conditions.push(`(
          tm.StartDate >= $${params.length + 1}::date AND tm.StartDate <= $${params.length + 2}::date
        )`);
        params.push(`${year}-03-15`); // Mid-March
        params.push(`${year}-06-30`); // End of June
      }
    } else if (year) {
      // Just filter by calendar year if no type specified
      conditions.push(`EXTRACT(YEAR FROM tm.StartDate) = $${params.length + 1}`);
      params.push(year);
    }

    if (search) {
      conditions.push(`tm.MeetName ILIKE $${params.length + 1}`);
      params.push(`%${search}%`);
    }

    if (conditions.length > 0) {
      sql += ` WHERE ${conditions.join(' AND ')}`;
    }

    sql += ` GROUP BY tm.MeetID, tm.MeetName, tm.StartDate, tm.EndDate`;
    sql += ` ORDER BY tm.StartDate DESC LIMIT 100`;

    const meets = await query(sql, params);
    return NextResponse.json(meets);
  } catch (error) {
    console.error('Error fetching meets:', error);
    return NextResponse.json({ error: 'Failed to fetch meets' }, { status: 500 });
  }
}
