'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';

interface Athlete {
  athleteid: number;
  athletefirstname: string;
  athletelastname: string;
  gender: string;
  schoolname: string;
  schoolid: string;
}

export default function AthletesPage() {
  const [athletes, setAthletes] = useState<Athlete[]>([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(false);

  const searchAthletes = async () => {
    if (search.length < 2) return;
    setLoading(true);
    try {
      const res = await fetch(`/api/athletes?search=${encodeURIComponent(search)}`);
      const data = await res.json();
      setAthletes(data);
    } catch (error) {
      console.error('Error searching athletes:', error);
    }
    setLoading(false);
  };

  useEffect(() => {
    const timer = setTimeout(() => {
      if (search.length >= 2) {
        searchAthletes();
      }
    }, 300);
    return () => clearTimeout(timer);
  }, [search]);

  return (
    <div className="min-h-screen bg-slate-900 text-white">
      {/* Header */}
      <header className="bg-gradient-to-r from-blue-900 to-blue-800 py-6 px-6">
        <div className="max-w-6xl mx-auto">
          <Link href="/" className="text-blue-300 hover:text-white mb-2 inline-block">← Back to Home</Link>
          <h1 className="text-3xl font-bold">👤 Athlete Lookup</h1>
        </div>
      </header>

      <main className="max-w-6xl mx-auto py-8 px-6">
        {/* Search */}
        <div className="mb-8">
          <input
            type="text"
            placeholder="Search athletes by name..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full md:w-96 px-4 py-3 rounded-lg bg-slate-800 border border-slate-700 focus:border-blue-500 focus:outline-none text-white placeholder-slate-500"
          />
          {loading && <span className="ml-4 text-slate-400">Searching...</span>}
        </div>

        {/* Results */}
        {athletes.length > 0 ? (
          <div className="bg-slate-800 rounded-xl overflow-hidden">
            <table className="w-full">
              <thead className="bg-slate-700">
                <tr>
                  <th className="px-6 py-3 text-left">Name</th>
                  <th className="px-6 py-3 text-left">Gender</th>
                  <th className="px-6 py-3 text-left">School</th>
                  <th className="px-6 py-3 text-left">Action</th>
                </tr>
              </thead>
              <tbody>
                {athletes.map((athlete) => (
                  <tr key={athlete.athleteid} className="border-t border-slate-700 hover:bg-slate-750">
                    <td className="px-6 py-4 font-medium">
                      {athlete.athletefirstname} {athlete.athletelastname}
                    </td>
                    <td className="px-6 py-4">
                      <span className={`px-2 py-1 rounded text-sm ${athlete.gender === 'M' ? 'bg-blue-900 text-blue-300' : 'bg-pink-900 text-pink-300'}`}>
                        {athlete.gender === 'M' ? 'Men' : 'Women'}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-slate-400">{athlete.schoolname}</td>
                    <td className="px-6 py-4">
                      <Link 
                        href={`/athletes/${athlete.athleteid}`}
                        className="text-blue-400 hover:text-blue-300"
                      >
                        View Profile →
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : search.length >= 2 && !loading ? (
          <div className="text-slate-500 text-center py-12">
            No athletes found matching "{search}"
          </div>
        ) : (
          <div className="text-slate-500 text-center py-12">
            Enter at least 2 characters to search
          </div>
        )}
      </main>
    </div>
  );
}

