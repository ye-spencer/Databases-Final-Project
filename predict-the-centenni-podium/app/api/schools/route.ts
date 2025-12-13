// API Route: Get all schools
import { NextResponse } from 'next/server';
import { query } from '../../lib/db';

export async function GET() {
  try {
    const schools = await query(`
      SELECT 
        s.SchoolID,
        s.SchoolName,
        s.EnrollmentSize,
        s.HasIndoorFacility,
        g.CityName,
        g.StateCode
      FROM School s
      JOIN GeographicLocation g ON s.LocationID = g.LocationID
      ORDER BY s.SchoolName
    `);

    return NextResponse.json(schools);
  } catch (error) {
    console.error('Error fetching schools:', error);
    return NextResponse.json({ error: 'Failed to fetch schools' }, { status: 500 });
  }
}

