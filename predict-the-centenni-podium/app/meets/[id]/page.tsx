'use client';

import { useState, useEffect, use } from 'react';
import Link from 'next/link';

interface MeetData {
  meet: {
    meetid: number;
    meetname: string;
    startdate: string;
    enddate: string;
  };
  individualResults: Array<{
    eventid: number;
    eventname: string;
    eventtype: string;
    athleteid: number;
    athletefirstname: string;
    athletelastname: string;
    gender: string;
    schoolname: string;
    resultvalue: number;
    windgauge: number | null;
    place: number;
  }>;
  relayResults: Array<{
    eventid: number;
    eventname: string;
    schoolname: string;
    gender: string;
    resultvalue: number;
    place: number;
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

// Event order: shortest to longest
const EVENT_ORDER: Record<string, number> = {
  '55 Meters': 1, '60 Meters': 2, '100 Meters': 3, '200 Meters': 4,
  '300 Meters': 5, '400 Meters': 6, '500 Meters': 7, '600 Meters': 8,
  '55 Hurdles': 10, '60 Hurdles': 11, '100 Hurdles': 12, '110 Hurdles': 13, '400 Hurdles': 14,
  '800 Meters': 20, '1000 Meters': 21, '1500 Meters': 22, 'Mile': 23,
  '3000 Meters': 30, '3000 Steeplechase': 31, '5000 Meters': 32, '10000 Meters': 33,
  '4x100 Relay': 40, '4x200 Relay': 41, '4x400 Relay': 42, '4x800 Relay': 43,
  'Distance Medley Relay': 44, 'DMR': 44,
  'High Jump': 50, 'Pole Vault': 51, 'Long Jump': 52, 'Triple Jump': 53,
  'Shot Put': 60, 'Weight Throw': 61, 'Discus': 62, 'Hammer': 63, 'Javelin': 64,
  'Pentathlon': 70, 'Heptathlon': 71, 'Decathlon': 72,
};

function getEventOrder(eventName: string): number {
  if (EVENT_ORDER[eventName] !== undefined) return EVENT_ORDER[eventName];
  const lowerName = eventName.toLowerCase();
  for (const [key, order] of Object.entries(EVENT_ORDER)) {
    if (lowerName.includes(key.toLowerCase())) return order;
  }
  return 999;
}

export default function MeetDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const [data, setData] = useState<MeetData | null>(null);
  const [loading, setLoading] = useState(true);
  const [gender, setGender] = useState<'M' | 'F'>('M');
  const [selectedEvent, setSelectedEvent] = useState<string | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const res = await fetch(`/api/meets/${id}`);
        const json = await res.json();
        setData(json);
      } catch (error) {
        console.error('Error fetching meet:', error);
      }
      setLoading(false);
    };
    fetchData();
  }, [id]);

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-900 text-white flex items-center justify-center">
        <div className="text-xl">Loading...</div>
      </div>
    );
  }

  if (!data || !data.meet) {
    return (
      <div className="min-h-screen bg-slate-900 text-white flex items-center justify-center">
        <div className="text-xl">Meet not found</div>
      </div>
    );
  }

  const { meet, individualResults, relayResults } = data;

  // Filter results by gender
  const filteredIndividual = individualResults?.filter(r => r.gender === gender) || [];
  const filteredRelay = relayResults?.filter(r => r.gender === gender) || [];

  // Group results by event
  const eventGroups: Record<string, typeof filteredIndividual> = {};
  filteredIndividual.forEach(r => {
    if (!eventGroups[r.eventname]) eventGroups[r.eventname] = [];
    eventGroups[r.eventname].push(r);
  });

  // Sort events from shortest to longest
  const events = Object.keys(eventGroups).sort((a, b) => getEventOrder(a) - getEventOrder(b));

  // Relay events
  const relayEventGroups: Record<string, typeof filteredRelay> = {};
  filteredRelay.forEach(r => {
    if (!relayEventGroups[r.eventname]) relayEventGroups[r.eventname] = [];
    relayEventGroups[r.eventname].push(r);
  });
  const relayEvents = Object.keys(relayEventGroups).sort((a, b) => getEventOrder(a) - getEventOrder(b));

  return (
    <div className="min-h-screen bg-slate-900 text-white">
      {/* Header */}
      <header className="bg-gradient-to-r from-orange-900 to-red-900 py-8 px-6">
        <div className="max-w-6xl mx-auto">
          <Link href="/meets" className="text-orange-300 hover:text-white mb-2 inline-block">← Back to Meets</Link>
          <h1 className="text-4xl font-bold">{meet.meetname}</h1>
          <p className="text-slate-300 mt-2">
            📅 {new Date(meet.startdate).toLocaleDateString()}
            {meet.startdate !== meet.enddate && ` - ${new Date(meet.enddate).toLocaleDateString()}`}
          </p>
        </div>
      </header>

      <main className="max-w-6xl mx-auto py-8 px-6">
        {/* Gender Toggle */}
        <div className="flex justify-center mb-6">
          <div className="flex rounded-lg overflow-hidden border border-slate-700">
            <button
              onClick={() => { setGender('M'); setSelectedEvent(null); }}
              className={`px-6 py-3 font-medium transition-colors ${
                gender === 'M' 
                  ? 'bg-blue-600 text-white' 
                  : 'bg-slate-800 text-slate-400 hover:text-white'
              }`}
            >
              👨 Men's Results
            </button>
            <button
              onClick={() => { setGender('F'); setSelectedEvent(null); }}
              className={`px-6 py-3 font-medium transition-colors ${
                gender === 'F' 
                  ? 'bg-pink-600 text-white' 
                  : 'bg-slate-800 text-slate-400 hover:text-white'
              }`}
            >
              👩 Women's Results
            </button>
          </div>
        </div>

        {/* Results */}
        {(
          <div className="grid md:grid-cols-4 gap-6">
            {/* Event List */}
            <div className="md:col-span-1">
              <h3 className="font-bold mb-4 text-slate-400">
                {gender === 'M' ? "Men's" : "Women's"} Events
              </h3>
              <div className="space-y-1 max-h-[600px] overflow-y-auto">
                {events.length === 0 && relayEvents.length === 0 ? (
                  <div className="text-slate-500 text-sm">No events found</div>
                ) : (
                  <>
                    {events.map(event => (
                      <button
                        key={event}
                        onClick={() => setSelectedEvent(event)}
                        className={`w-full text-left px-3 py-2 rounded text-sm ${
                          selectedEvent === event ? 'bg-orange-600' : 'bg-slate-800 hover:bg-slate-700'
                        }`}
                      >
                        {event}
                      </button>
                    ))}
                    {relayEvents.length > 0 && (
                      <>
                        <div className="text-slate-500 text-xs mt-4 mb-2 uppercase tracking-wide">Relays</div>
                        {relayEvents.map(event => (
                          <button
                            key={event}
                            onClick={() => setSelectedEvent(event)}
                            className={`w-full text-left px-3 py-2 rounded text-sm ${
                              selectedEvent === event ? 'bg-orange-600' : 'bg-slate-800 hover:bg-slate-700'
                            }`}
                          >
                            {event}
                          </button>
                        ))}
                      </>
                    )}
                  </>
                )}
              </div>
            </div>

            {/* Results for Selected Event */}
            <div className="md:col-span-3">
              {selectedEvent ? (
                <div className="bg-slate-800 rounded-xl overflow-hidden">
                  <div className={`px-6 py-4 ${gender === 'M' ? 'bg-blue-900' : 'bg-pink-900'}`}>
                    <h3 className="text-xl font-bold">{selectedEvent}</h3>
                    <p className="text-sm text-slate-300">{gender === 'M' ? "Men's" : "Women's"}</p>
                  </div>
                  <table className="w-full">
                    <thead className="bg-slate-750">
                      <tr>
                        <th className="px-4 py-3 text-left w-16">Pl</th>
                        <th className="px-4 py-3 text-left">Athlete</th>
                        <th className="px-4 py-3 text-left">School</th>
                        <th className="px-4 py-3 text-right">Result</th>
                      </tr>
                    </thead>
                    <tbody>
                      {(eventGroups[selectedEvent] || relayEventGroups[selectedEvent])?.map((r: any, i: number) => (
                        <tr key={i} className="border-t border-slate-700 hover:bg-slate-750">
                          <td className="px-4 py-3 font-bold">
                            {r.place === 1 ? '🥇' : r.place === 2 ? '🥈' : r.place === 3 ? '🥉' : r.place}
                          </td>
                          <td className="px-4 py-3">
                            {r.athletefirstname ? (
                              <Link href={`/athletes/${r.athleteid}`} className="hover:text-orange-400">
                                {r.athletefirstname} {r.athletelastname}
                              </Link>
                            ) : (
                              <span className="text-slate-400">Relay Team</span>
                            )}
                          </td>
                          <td className="px-4 py-3 text-slate-400">{r.schoolname}</td>
                          <td className="px-4 py-3 text-right font-mono text-orange-400">
                            {formatTime(r.resultvalue)}
                            {r.windgauge && <span className="text-slate-500 ml-2">({r.windgauge > 0 ? '+' : ''}{r.windgauge})</span>}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <div className="bg-slate-800 rounded-xl p-12 text-center text-slate-500">
                  <div className="text-4xl mb-4">👈</div>
                  Select an event to view {gender === 'M' ? "men's" : "women's"} results
                </div>
              )}
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
