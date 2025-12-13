'use client';

import { useState, useEffect, use } from 'react';
import Link from 'next/link';

interface SchoolData {
  school: {
    schoolid: string;
    schoolname: string;
    enrollmentsize: number;
    hasindoorfacility: boolean;
    streetaddress: string;
    cityname: string;
    statecode: string;
  };
  roster: Array<{
    athleteid: number;
    athletefirstname: string;
    athletelastname: string;
    gender: string;
    classyear: string;
  }>;
  records: Array<{
    eventname: string;
    eventtype: string;
    schoolrecord: number;
    athletefirstname: string;
    athletelastname: string;
    seasonyear: number;
  }>;
  seasonBests: Array<{
    eventname: string;
    seasonbest: number;
    athletefirstname: string;
    athletelastname: string;
  }>;
  classBreakdown: Array<{
    classyear: string;
    count: number;
  }>;
}

function formatTime(seconds: number | string | null | undefined): string {
  if (seconds === null || seconds === undefined) return '-';
  
  // Convert to number if it's a string
  const num = typeof seconds === 'string' ? parseFloat(seconds) : seconds;
  
  if (isNaN(num)) return '-';
  
  if (num >= 60) {
    const mins = Math.floor(num / 60);
    const secs = (num % 60).toFixed(2);
    return `${mins}:${secs.padStart(5, '0')}`;
  }
  return num.toFixed(2);
}

// Event order: shortest to longest (sprints, middle distance, distance, relays, field events)
const EVENT_ORDER: Record<string, number> = {
  // Sprints (shortest to longest)
  '55 Meters': 1,
  '60 Meters': 2,
  '100 Meters': 3,
  '200 Meters': 4,
  '300 Meters': 5,
  '400 Meters': 6,
  '500 Meters': 7,
  '600 Meters': 8,
  // Hurdles
  '55 Hurdles': 10,
  '60 Hurdles': 11,
  '100 Hurdles': 12,
  '110 Hurdles': 13,
  '400 Hurdles': 14,
  // Middle Distance
  '800 Meters': 20,
  '1000 Meters': 21,
  '1500 Meters': 22,
  'Mile': 23,
  // Distance
  '3000 Meters': 30,
  '3000 Steeplechase': 31,
  '5000 Meters': 32,
  '10000 Meters': 33,
  // Relays
  '4x100 Relay': 40,
  '4x200 Relay': 41,
  '4x400 Relay': 42,
  '4x800 Relay': 43,
  'Distance Medley Relay': 44,
  'DMR': 44,
  // Jumps
  'High Jump': 50,
  'Pole Vault': 51,
  'Long Jump': 52,
  'Triple Jump': 53,
  // Throws
  'Shot Put': 60,
  'Weight Throw': 61,
  'Discus': 62,
  'Hammer': 63,
  'Javelin': 64,
  // Combined
  'Pentathlon': 70,
  'Heptathlon': 71,
  'Decathlon': 72,
};

function getEventOrder(eventName: string): number {
  // Try exact match first
  if (EVENT_ORDER[eventName] !== undefined) return EVENT_ORDER[eventName];
  
  // Try partial match
  const lowerName = eventName.toLowerCase();
  for (const [key, order] of Object.entries(EVENT_ORDER)) {
    if (lowerName.includes(key.toLowerCase()) || key.toLowerCase().includes(lowerName)) {
      return order;
    }
  }
  
  // Default to end
  return 999;
}

function sortEventNames(events: string[]): string[] {
  return [...events].sort((a, b) => getEventOrder(a) - getEventOrder(b));
}

export default function SchoolDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const [data, setData] = useState<SchoolData | null>(null);
  const [loading, setLoading] = useState(true);
  const [seasonYear, setSeasonYear] = useState(2026);
  const [seasonType, setSeasonType] = useState<'Indoor' | 'Outdoor'>('Indoor');
  const [gender, setGender] = useState<'M' | 'F'>('M');
  const [activeTab, setActiveTab] = useState<'roster' | 'records' | 'bests'>('roster');

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        // Bryn Mawr is women-only, always use 'F'
        const effectiveGender = id === 'Bryn_Mawr' ? 'F' : gender;
        const res = await fetch(`/api/schools/${id}?year=${seasonYear}&type=${seasonType}&gender=${effectiveGender}`);
        const json = await res.json();
        setData(json);
      } catch (error) {
        console.error('Error fetching school:', error);
      }
      setLoading(false);
    };
    fetchData();
  }, [id, seasonYear, seasonType, gender]);

  // Set gender to Women for Bryn Mawr on mount
  useEffect(() => {
    if (id === 'Bryn_Mawr') {
      setGender('F');
    }
  }, [id]);

  if (loading && !data) {
    return (
      <div className="min-h-screen bg-slate-900 text-white flex items-center justify-center">
        <div className="text-xl">Loading...</div>
      </div>
    );
  }

  if (!data || !data.school) {
    return (
      <div className="min-h-screen bg-slate-900 text-white flex items-center justify-center">
        <div className="text-xl">School not found</div>
      </div>
    );
  }

  const { school, roster, records, seasonBests, classBreakdown } = data;

  return (
    <div className="min-h-screen bg-slate-900 text-white">
      {/* Header */}
      <header className="bg-gradient-to-r from-green-900 to-teal-900 py-8 px-6">
        <div className="max-w-6xl mx-auto">
          <Link href="/schools" className="text-green-300 hover:text-white mb-2 inline-block">← Back to Schools</Link>
          <h1 className="text-4xl font-bold">{school.schoolname}</h1>
          <p className="text-slate-300 mt-2">
            📍 {school.streetaddress}, {school.cityname}, {school.statecode}
          </p>
          <div className="flex gap-4 mt-4">
            <span className="px-3 py-1 bg-slate-800 rounded">
              👥 {school.enrollmentsize?.toLocaleString()} students
            </span>
            <span className={`px-3 py-1 rounded ${school.hasindoorfacility ? 'bg-green-800' : 'bg-slate-800'}`}>
              {school.hasindoorfacility ? '✓ Indoor Facility' : '✗ No Indoor Facility'}
            </span>
          </div>
        </div>
      </header>

      <main className="max-w-6xl mx-auto py-8 px-6">
        {/* Season & Gender Selector */}
        <div className="flex flex-wrap gap-4 mb-8 items-center">
          <select
            value={seasonYear}
            onChange={(e) => setSeasonYear(Number(e.target.value))}
            className="px-4 py-2 rounded-lg bg-slate-800 border border-slate-700"
          >
            {[2026, 2025, 2024, 2023, 2022, 2021, 2020, 2019, 2018, 2017, 2016, 2015, 2014, 2013, 2012, 2011, 2010].map(year => (
              <option key={year} value={year}>{year}</option>
            ))}
          </select>
          
          {/* Indoor/Outdoor Toggle */}
          <div className="flex rounded-lg overflow-hidden border border-slate-700">
            {(['Indoor', 'Outdoor'] as const).map(type => (
              <button
                key={type}
                onClick={() => setSeasonType(type)}
                className={`px-4 py-2 font-medium transition-colors ${
                  seasonType === type 
                    ? 'bg-green-600 text-white' 
                    : 'bg-slate-800 text-slate-400 hover:text-white'
                }`}
              >
                {type}
              </button>
            ))}
          </div>

          {/* Men/Women Toggle */}
          {/* Hide Men's button for Bryn Mawr (women's college) */}
          {school.schoolid !== 'Bryn_Mawr' && (
            <div className="flex rounded-lg overflow-hidden border border-slate-700">
              <button
                onClick={() => setGender('M')}
                className={`px-4 py-2 font-medium transition-colors ${
                  gender === 'M' 
                    ? 'bg-blue-600 text-white' 
                    : 'bg-slate-800 text-slate-400 hover:text-white'
                }`}
              >
                👨 Men
              </button>
              <button
                onClick={() => setGender('F')}
                className={`px-4 py-2 font-medium transition-colors ${
                  gender === 'F' 
                    ? 'bg-pink-600 text-white' 
                    : 'bg-slate-800 text-slate-400 hover:text-white'
                }`}
              >
                👩 Women
              </button>
            </div>
          )}
          {school.schoolid === 'Bryn_Mawr' && (
            <div className="px-4 py-2 bg-pink-600 text-white rounded-lg font-medium">
              👩 Women's College
            </div>
          )}

          {loading && <span className="text-slate-400 animate-pulse">Loading...</span>}
        </div>

        {/* Class Breakdown */}
        <div className="grid grid-cols-4 gap-4 mb-8">
          {['FR', 'SO', 'JR', 'SR'].map(year => {
            const count = classBreakdown?.find(c => c.classyear === year)?.count || 0;
            return (
              <div key={year} className="bg-slate-800 rounded-xl p-4 text-center">
                <div className="text-2xl font-bold text-green-400">{count}</div>
                <div className="text-slate-400">{year === 'FR' ? 'Freshmen' : year === 'SO' ? 'Sophomores' : year === 'JR' ? 'Juniors' : 'Seniors'}</div>
              </div>
            );
          })}
        </div>

        {/* Tabs */}
        <div className="flex gap-4 mb-8">
          {(['roster', 'records', 'bests'] as const).map(tab => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`px-6 py-2 rounded-lg font-medium transition-colors ${
                activeTab === tab 
                  ? 'bg-green-600 text-white' 
                  : 'bg-slate-800 text-slate-400 hover:text-white'
              }`}
            >
              {tab === 'roster' ? '👥 Roster' : tab === 'records' ? '🏆 Top Performances' : '📊 Season Bests'}
            </button>
          ))}
        </div>

        {/* Roster Tab */}
        {activeTab === 'roster' && (
          <div>
            <h3 className={`text-xl font-bold mb-4 ${gender === 'M' ? 'text-blue-400' : 'text-pink-400'}`}>
              {gender === 'M' ? "Men's" : "Women's"} Team ({roster?.length || 0})
            </h3>
            <div className="bg-slate-800 rounded-xl overflow-hidden">
              <table className="w-full">
                <thead className="bg-slate-700">
                  <tr>
                    <th className="px-4 py-3 text-left">Name</th>
                    <th className="px-4 py-3 text-left">Year</th>
                  </tr>
                </thead>
                <tbody>
                  {roster?.length === 0 && (
                    <tr>
                      <td colSpan={2} className="px-4 py-8 text-center text-slate-500">
                        No athletes found for this season
                      </td>
                    </tr>
                  )}
                  {roster?.map(a => (
                    <tr key={a.athleteid} className="border-t border-slate-700 hover:bg-slate-750">
                      <td className="px-4 py-3">
                        <Link 
                          href={`/athletes/${a.athleteid}`} 
                          className={`hover:${gender === 'M' ? 'text-blue-400' : 'text-pink-400'}`}
                        >
                          {a.athletefirstname} {a.athletelastname}
                        </Link>
                      </td>
                      <td className="px-4 py-3 text-slate-400">{a.classyear}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Records Tab */}
        {activeTab === 'records' && (() => {
          // Group records by event and take top 5 per event
          const recordsByEvent: Record<string, typeof records> = {};
          records?.forEach(r => {
            if (!recordsByEvent[r.eventname]) recordsByEvent[r.eventname] = [];
            if (recordsByEvent[r.eventname].length < 5) {
              recordsByEvent[r.eventname].push(r);
            }
          });
          
          // Group events by type
          const eventsByType: Record<string, string[]> = {};
          Object.keys(recordsByEvent).forEach(eventName => {
            const eventType = recordsByEvent[eventName][0]?.eventtype || 'other';
            if (!eventsByType[eventType]) eventsByType[eventType] = [];
            eventsByType[eventType].push(eventName);
          });

          // Sort events within each type from shortest to longest
          Object.keys(eventsByType).forEach(type => {
            eventsByType[type] = sortEventNames(eventsByType[type]);
          });

          const typeOrder = ['sprints', 'distance', 'jumps', 'throws', 'combined'];
          const typeLabels: Record<string, string> = {
            sprints: '🏃 Sprints & Hurdles',
            distance: '🏃‍♂️ Distance',
            jumps: '🦘 Jumps',
            throws: '💪 Throws',
            combined: '🏅 Combined Events'
          };

          return (
            <div className="space-y-8">
              {typeOrder.map(eventType => {
                const events = eventsByType[eventType];
                if (!events || events.length === 0) return null;
                
                return (
                  <div key={eventType}>
                    <h3 className="text-xl font-bold mb-4 text-yellow-400">{typeLabels[eventType] || eventType}</h3>
                    <div className="grid md:grid-cols-2 gap-4">
                      {events.map(eventName => (
                        <div key={eventName} className="bg-slate-800 rounded-xl overflow-hidden border border-slate-700">
                          <div className="bg-slate-700 px-4 py-2 font-bold">{eventName}</div>
                          <table className="w-full">
                            <thead className="bg-slate-750 text-sm text-slate-400">
                              <tr>
                                <th className="px-3 py-2 text-left">#</th>
                                <th className="px-3 py-2 text-left">Athlete</th>
                                <th className="px-3 py-2 text-right">Time</th>
                                <th className="px-3 py-2 text-right">Year</th>
                              </tr>
                            </thead>
                            <tbody>
                              {recordsByEvent[eventName]?.map((r, i) => (
                                <tr key={i} className="border-t border-slate-700">
                                  <td className="px-3 py-2 text-slate-500">{i + 1}</td>
                                  <td className="px-3 py-2">
                                    <Link href={`/athletes/${r.athleteid || ''}`} className="hover:text-yellow-400">
                                      {r.athletefirstname} {r.athletelastname}
                                    </Link>
                                  </td>
                                  <td className="px-3 py-2 text-right font-mono text-yellow-400">
                                    {formatTime(r.schoolrecord)}
                                  </td>
                                  <td className="px-3 py-2 text-right text-slate-500">{r.seasonyear}</td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>
          );
        })()}

        {/* Season Bests Tab */}
        {activeTab === 'bests' && (() => {
          // Group bests by event and take top 5 per event
          const bestsByEvent: Record<string, typeof seasonBests> = {};
          seasonBests?.forEach(sb => {
            if (!bestsByEvent[sb.eventname]) bestsByEvent[sb.eventname] = [];
            if (bestsByEvent[sb.eventname].length < 5) {
              bestsByEvent[sb.eventname].push(sb);
            }
          });
          
          // Group events by type
          const eventsByType: Record<string, string[]> = {};
          Object.keys(bestsByEvent).forEach(eventName => {
            const eventType = bestsByEvent[eventName][0]?.eventtype || 'other';
            if (!eventsByType[eventType]) eventsByType[eventType] = [];
            eventsByType[eventType].push(eventName);
          });

          // Sort events within each type from shortest to longest
          Object.keys(eventsByType).forEach(type => {
            eventsByType[type] = sortEventNames(eventsByType[type]);
          });

          const typeOrder = ['sprints', 'distance', 'jumps', 'throws', 'combined'];
          const typeLabels: Record<string, string> = {
            sprints: '🏃 Sprints & Hurdles',
            distance: '🏃‍♂️ Distance',
            jumps: '🦘 Jumps',
            throws: '💪 Throws',
            combined: '🏅 Combined Events'
          };

          return (
            <div className="space-y-8">
              <div className="text-sm text-slate-400 mb-4">
                Showing top 5 performances per event for {seasonYear} {seasonType} season
              </div>
              {typeOrder.map(eventType => {
                const events = eventsByType[eventType];
                if (!events || events.length === 0) return null;
                
                return (
                  <div key={eventType}>
                    <h3 className="text-xl font-bold mb-4 text-green-400">{typeLabels[eventType] || eventType}</h3>
                    <div className="grid md:grid-cols-2 gap-4">
                      {events.map(eventName => (
                        <div key={eventName} className="bg-slate-800 rounded-xl overflow-hidden border border-slate-700">
                          <div className="bg-slate-700 px-4 py-2 font-bold">{eventName}</div>
                          <table className="w-full">
                            <thead className="bg-slate-750 text-sm text-slate-400">
                              <tr>
                                <th className="px-3 py-2 text-left">#</th>
                                <th className="px-3 py-2 text-left">Athlete</th>
                                <th className="px-3 py-2 text-right">Time</th>
                              </tr>
                            </thead>
                            <tbody>
                              {bestsByEvent[eventName]?.map((sb, i) => (
                                <tr key={i} className="border-t border-slate-700">
                                  <td className="px-3 py-2 text-slate-500">{i + 1}</td>
                                  <td className="px-3 py-2">
                                    <Link href={`/athletes/${sb.athleteid || ''}`} className="hover:text-green-400">
                                      {sb.athletefirstname} {sb.athletelastname}
                                    </Link>
                                  </td>
                                  <td className="px-3 py-2 text-right font-mono text-green-400">
                                    {formatTime(sb.seasonbest)}
                                  </td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>
          );
        })()}
      </main>
    </div>
  );
}

