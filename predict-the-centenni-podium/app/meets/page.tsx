'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';

interface Meet {
  meetid: number;
  meetname: string;
  startdate: string;
  enddate: string;
  performancecount: number;
  athletecount: number;
}

// Generate season options from 2026 Indoor back to 2010 Outdoor
const SEASONS = [
  { year: 2026, type: 'Indoor', label: '2026 Indoor' },
  { year: 2025, type: 'Outdoor', label: '2025 Outdoor' },
  { year: 2025, type: 'Indoor', label: '2025 Indoor' },
  { year: 2024, type: 'Outdoor', label: '2024 Outdoor' },
  { year: 2024, type: 'Indoor', label: '2024 Indoor' },
  { year: 2023, type: 'Outdoor', label: '2023 Outdoor' },
  { year: 2023, type: 'Indoor', label: '2023 Indoor' },
  { year: 2022, type: 'Outdoor', label: '2022 Outdoor' },
  { year: 2022, type: 'Indoor', label: '2022 Indoor' },
  { year: 2021, type: 'Outdoor', label: '2021 Outdoor' },
  { year: 2021, type: 'Indoor', label: '2021 Indoor' },
  { year: 2020, type: 'Outdoor', label: '2020 Outdoor' },
  { year: 2020, type: 'Indoor', label: '2020 Indoor' },
  { year: 2019, type: 'Outdoor', label: '2019 Outdoor' },
  { year: 2019, type: 'Indoor', label: '2019 Indoor' },
  { year: 2018, type: 'Outdoor', label: '2018 Outdoor' },
  { year: 2018, type: 'Indoor', label: '2018 Indoor' },
  { year: 2017, type: 'Outdoor', label: '2017 Outdoor' },
  { year: 2017, type: 'Indoor', label: '2017 Indoor' },
  { year: 2016, type: 'Outdoor', label: '2016 Outdoor' },
  { year: 2016, type: 'Indoor', label: '2016 Indoor' },
  { year: 2015, type: 'Outdoor', label: '2015 Outdoor' },
  { year: 2015, type: 'Indoor', label: '2015 Indoor' },
  { year: 2014, type: 'Outdoor', label: '2014 Outdoor' },
  { year: 2014, type: 'Indoor', label: '2014 Indoor' },
  { year: 2013, type: 'Outdoor', label: '2013 Outdoor' },
  { year: 2013, type: 'Indoor', label: '2013 Indoor' },
  { year: 2012, type: 'Outdoor', label: '2012 Outdoor' },
  { year: 2012, type: 'Indoor', label: '2012 Indoor' },
  { year: 2011, type: 'Outdoor', label: '2011 Outdoor' },
  { year: 2011, type: 'Indoor', label: '2011 Indoor' },
  { year: 2010, type: 'Outdoor', label: '2010 Outdoor' },
  { year: 2010, type: 'Indoor', label: '2010 Indoor' },
];

export default function MeetsPage() {
  const [meets, setMeets] = useState<Meet[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedSeason, setSelectedSeason] = useState('2026-Indoor');
  const [search, setSearch] = useState('');

  useEffect(() => {
    const fetchMeets = async () => {
      setLoading(true);
      try {
        const [year, type] = selectedSeason.split('-');
        let url = `/api/meets?year=${year}&type=${type}`;
        if (search) url += `&search=${encodeURIComponent(search)}`;
        const res = await fetch(url);
        const data = await res.json();
        setMeets(data);
      } catch (error) {
        console.error('Error fetching meets:', error);
      }
      setLoading(false);
    };
    fetchMeets();
  }, [selectedSeason, search]);

  const currentSeason = SEASONS.find(s => `${s.year}-${s.type}` === selectedSeason);

  return (
    <div className="min-h-screen bg-slate-900 text-white">
      {/* Header */}
      <header className="bg-gradient-to-r from-orange-900 to-orange-800 py-6 px-6">
        <div className="max-w-6xl mx-auto">
          <Link href="/" className="text-orange-300 hover:text-white mb-2 inline-block">← Back to Home</Link>
          <h1 className="text-3xl font-bold">🏆 Meets</h1>
          <p className="text-orange-200">Track & Field Competitions</p>
        </div>
      </header>

      <main className="max-w-6xl mx-auto py-8 px-6">
        {/* Filters */}
        <div className="flex gap-4 mb-8 flex-wrap items-center">
          <select
            value={selectedSeason}
            onChange={(e) => setSelectedSeason(e.target.value)}
            className="px-4 py-2 rounded-lg bg-slate-800 border border-slate-700 font-medium"
          >
            {SEASONS.map(s => (
              <option key={`${s.year}-${s.type}`} value={`${s.year}-${s.type}`}>
                {s.label}
              </option>
            ))}
          </select>
          <input
            type="text"
            placeholder="Search meets..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="px-4 py-2 rounded-lg bg-slate-800 border border-slate-700 flex-1 max-w-md"
          />
          {currentSeason && (
            <span className={`px-3 py-1 rounded-full text-sm ${
              currentSeason.type === 'Indoor' ? 'bg-blue-900 text-blue-200' : 'bg-green-900 text-green-200'
            }`}>
              {currentSeason.type === 'Indoor' ? '🏠 Indoor' : '☀️ Outdoor'}
            </span>
          )}
        </div>

        {loading ? (
          <div className="text-center py-12 text-slate-400">Loading meets...</div>
        ) : meets.length === 0 ? (
          <div className="text-center py-12 text-slate-400">No meets found for {currentSeason?.label}</div>
        ) : (
          <div className="space-y-4">
            <div className="text-slate-400 mb-4">{meets.length} meets found</div>
            {meets.map((meet) => (
              <Link key={meet.meetid} href={`/meets/${meet.meetid}`}>
                <div className="bg-slate-800 rounded-xl p-6 border border-slate-700 hover:border-orange-500 transition-all cursor-pointer">
                  <div className="flex justify-between items-start">
                    <div>
                      <h2 className="text-xl font-bold mb-2">{meet.meetname}</h2>
                      <div className="text-slate-400">
                        📅 {new Date(meet.startdate).toLocaleDateString()}
                        {meet.startdate !== meet.enddate && ` - ${new Date(meet.enddate).toLocaleDateString()}`}
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-2xl font-bold text-orange-400">{meet.performancecount}</div>
                      <div className="text-slate-500 text-sm">performances</div>
                    </div>
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
