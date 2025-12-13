'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';

interface School {
  schoolid: string;
  schoolname: string;
  enrollmentsize: number;
  hasindoorfacility: boolean;
  cityname: string;
  statecode: string;
}

export default function SchoolsPage() {
  const [schools, setSchools] = useState<School[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchSchools = async () => {
      try {
        const res = await fetch('/api/schools');
        const data = await res.json();
        setSchools(data);
      } catch (error) {
        console.error('Error fetching schools:', error);
      }
      setLoading(false);
    };
    fetchSchools();
  }, []);

  return (
    <div className="min-h-screen bg-slate-900 text-white">
      {/* Header */}
      <header className="bg-gradient-to-r from-green-900 to-green-800 py-6 px-6">
        <div className="max-w-6xl mx-auto">
          <Link href="/" className="text-green-300 hover:text-white mb-2 inline-block">← Back to Home</Link>
          <h1 className="text-3xl font-bold">🏫 Schools</h1>
          <p className="text-green-200">Centennial Conference Institutions</p>
        </div>
      </header>

      <main className="max-w-6xl mx-auto py-8 px-6">
        {loading ? (
          <div className="text-center py-12 text-slate-400">Loading schools...</div>
        ) : (
          <div className="grid md:grid-cols-2 gap-6">
            {schools.map((school) => (
              <Link key={school.schoolid} href={`/schools/${school.schoolid}`}>
                <div className="bg-slate-800 rounded-xl p-6 border border-slate-700 hover:border-green-500 transition-all cursor-pointer">
                  <h2 className="text-xl font-bold mb-2">{school.schoolname}</h2>
                  <div className="text-slate-400 mb-4">
                    📍 {school.cityname}, {school.statecode}
                  </div>
                  <div className="flex gap-4 text-sm">
                    <span className="px-3 py-1 bg-slate-700 rounded">
                      👥 {school.enrollmentsize?.toLocaleString()} students
                    </span>
                    <span className={`px-3 py-1 rounded ${school.hasindoorfacility ? 'bg-green-900 text-green-300' : 'bg-slate-700'}`}>
                      {school.hasindoorfacility ? '✓ Indoor Track' : '✗ No Indoor Track'}
                    </span>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}

