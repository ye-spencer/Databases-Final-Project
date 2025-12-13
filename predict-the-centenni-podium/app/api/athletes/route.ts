// API Route: Get all athletes or search athletes
import { NextRequest, NextResponse } from 'next/server';
import { query } from '../../lib/db';

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const search = searchParams.get('search');
  const schoolId = searchParams.get('school');

  try {
    let sql = `
      SELECT DISTINCT
        a.AthleteID,
        a.AthleteFirstName,
        a.AthleteLastName,
        a.Gender,
        s.SchoolName,
        s.SchoolID
      FROM Athlete a
      JOIN AthleteSeason ats ON a.AthleteID = ats.AthleteID
      JOIN School s ON ats.SchoolID = s.SchoolID
    `;
    const params: any[] = [];

    if (search) {
      // Handle different search patterns:
      // "Smith" - search last name
      // "John Smith" - search first AND last name
      // "John" - search first name
      const searchTerm = search.trim();
      const parts = searchTerm.split(/\s+/);
      
      if (parts.length >= 2) {
        // Two or more words: assume "FirstName LastName"
        sql += ` WHERE (
          (a.AthleteFirstName ILIKE $1 AND a.AthleteLastName ILIKE $2)
          OR a.AthleteLastName ILIKE $3
          OR a.AthleteFirstName ILIKE $3
        )`;
        params.push(`%${parts[0]}%`, `%${parts.slice(1).join(' ')}%`, `%${searchTerm}%`);
      } else {
        // Single word: search both first and last name
        sql += ` WHERE (a.AthleteFirstName ILIKE $1 OR a.AthleteLastName ILIKE $1)`;
        params.push(`%${searchTerm}%`);
      }
    }

    if (schoolId) {
      const paramNum = params.length + 1;
      sql += search ? ` AND ats.SchoolID = $${paramNum}` : ` WHERE ats.SchoolID = $1`;
      params.push(schoolId);
    }

    sql += ` ORDER BY a.AthleteLastName, a.AthleteFirstName LIMIT 100`;

    const athletes = await query(sql, params);
    return NextResponse.json(athletes);
  } catch (error) {
    console.error('Error fetching athletes:', error);
    return NextResponse.json({ error: 'Failed to fetch athletes' }, { status: 500 });
  }
}

