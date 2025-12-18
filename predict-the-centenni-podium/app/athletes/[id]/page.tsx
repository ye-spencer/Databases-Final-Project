'use client';

import { useState, useEffect, use } from 'react';
import Link from 'next/link';

interface AthleteData {
  athlete: {
    athleteid: number;
    athletefirstname: string;
    athletelastname: string;
    gender: string;
  };
  seasons: Array<{
    athleteseasonid: number;
    seasontype: string;
    seasonyear: number;
    classyear: string;
    schoolname: string;
  }>;
  personalBests: Array<{
    eventid: number;
    eventname: string;
    eventtype: string;
    seasontype: string;
    personalbest: number;
    pbmeet: string;
    pbdate: string;
  }>;
  seasonBests: Array<{
    seasonyear: number;
    seasontype: string;
    eventname: string;
    seasonbest: number;
  }>;
  performanceHistory: Array<{
    performanceid: number;
    eventname: string;
    resultvalue: number;
    windgauge: number | null;
    meetname: string;
    startdate: string;
  }>;
  trendData: Array<{
    eventname: string;
    seasontype: string;
    resultvalue: number;
    startdate: string;
  }>;
  relayPersonalBests: Array<{
    eventid: number;
    eventname: string;
    eventtype: string;
    seasontype: string;
    personalbest: number;
    pbmeet: string;
    pbdate: string;
    schoolname: string;
  }>;
  relaySeasonBests: Array<{
    seasonyear: number;
    seasontype: string;
    eventname: string;
    seasonbest: number;
    schoolname: string;
  }>;
  relayHistory: Array<{
    performanceid: number;
    eventname: string;
    eventtype: string;
    resultvalue: number;
    meetname: string;
    startdate: string;
    seasonyear: number;
    seasontype: string;
    schoolname: string;
  }>;
  relayTrendData: Array<{
    eventname: string;
    seasontype: string;
    resultvalue: number;
    startdate: string;
  }>;
}

function calculateTrend(performances: number[]): { trend: string; color: string } {
  if (performances.length < 3) return { trend: 'Not enough data', color: 'text-slate-400' };
  
  const recent = performances.slice(0, 3).reduce((a, b) => a + b, 0) / 3;
  const older = performances.slice(-3).reduce((a, b) => a + b, 0) / 3;
  const diff = ((older - recent) / older) * 100;
  
  if (diff > 2) return { trend: '📈 Improving', color: 'text-green-400' };
  if (diff < -2) return { trend: '📉 Declining', color: 'text-red-400' };
  return { trend: '➡️ Consistent', color: 'text-yellow-400' };
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

function formatEventName(eventName: string): string {
    // Convert full relay names to abbreviations
    if (eventName === 'Sprint Medley Relay') return 'SMR';
    if (eventName === 'Distance Medley Relay' || eventName === 'Distance Medley Rela') return 'DMR';
    return eventName;
}

export default function AthleteDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const [data, setData] = useState<AthleteData | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'pbs' | 'seasonbests' | 'history' | 'trends'>('pbs');

  useEffect(() => {
    const fetchData = async () => {
      try {
        const res = await fetch(`/api/athletes/${id}`);
        const json = await res.json();
        setData(json);
      } catch (error) {
        console.error('Error fetching athlete:', error);
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

  if (!data || !data.athlete) {
    return (
      <div className="min-h-screen bg-slate-900 text-white flex items-center justify-center">
        <div className="text-xl">Athlete not found</div>
      </div>
    );
  }

  const { athlete, seasons, personalBests, seasonBests, performanceHistory, trendData, 
          relayPersonalBests, relaySeasonBests, relayHistory, relayTrendData } = data;

  // Group trend data by event AND season type for analysis
  // Key format: "EventName|SeasonType" to separate Indoor/Outdoor
  // Store both values and dates for graphing
  const trendByEvent: Record<string, { 
    performances: number[]; 
    dates: string[];
    seasonType: string;
    eventName: string;
  }> = {};
  trendData?.forEach(t => {
    const key = `${t.eventname}|${t.seasontype}`;
    if (!trendByEvent[key]) {
      trendByEvent[key] = { 
        performances: [], 
        dates: [],
        seasonType: t.seasontype,
        eventName: t.eventname
      };
    }
    trendByEvent[key].performances.push(t.resultvalue);
    trendByEvent[key].dates.push(t.startdate);
  });

  // Group relay trend data similarly
  relayTrendData?.forEach(t => {
    const key = `${t.eventname}|${t.seasontype}`;
    if (!trendByEvent[key]) {
      trendByEvent[key] = { 
        performances: [], 
        dates: [],
        seasonType: t.seasontype,
        eventName: t.eventname
      };
    }
    trendByEvent[key].performances.push(t.resultvalue);
    trendByEvent[key].dates.push(t.startdate);
  });

  return (
    <div className="min-h-screen bg-slate-900 text-white">
      {/* Header */}
      <header className="bg-gradient-to-r from-blue-900 to-purple-900 py-8 px-6">
        <div className="max-w-6xl mx-auto">
          <Link href="/athletes" className="text-blue-300 hover:text-white mb-2 inline-block">← Back to Search</Link>
          <h1 className="text-4xl font-bold">
            {athlete.athletefirstname} {athlete.athletelastname}
          </h1>
          <div className="flex gap-4 mt-2">
            <span className={`px-3 py-1 rounded ${athlete.gender === 'M' ? 'bg-blue-800' : 'bg-pink-800'}`}>
              {athlete.gender === 'M' ? "Men's" : "Women's"}
            </span>
            {seasons?.[0] && (
              <>
                <span className="text-slate-300">{seasons[0].schoolname}</span>
                <span className="text-slate-400">{seasons[0].classyear}</span>
              </>
            )}
          </div>
        </div>
      </header>

      <main className="max-w-6xl mx-auto py-8 px-6">
        {/* Tabs */}
        <div className="flex gap-4 mb-8">
          {(['pbs', 'seasonbests', 'history', 'trends'] as const).map(tab => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`px-6 py-2 rounded-lg font-medium transition-colors ${
                activeTab === tab 
                  ? 'bg-blue-600 text-white' 
                  : 'bg-slate-800 text-slate-400 hover:text-white'
              }`}
            >
              {tab === 'pbs' ? '🏆 Personal Bests' : 
               tab === 'seasonbests' ? '📅 Season Bests' :
               tab === 'history' ? '📋 History' : 
               '📈 Trends'}
            </button>
          ))}
        </div>

        {/* Personal Bests Tab */}
        {activeTab === 'pbs' && (() => {
          // Group PBs by season type
          const indoorPBs = personalBests?.filter(pb => pb.seasontype === 'Indoor') || [];
          const outdoorPBs = personalBests?.filter(pb => pb.seasontype === 'Outdoor') || [];
          const indoorRelayPBs = relayPersonalBests?.filter(pb => pb.seasontype === 'Indoor') || [];
          const outdoorRelayPBs = relayPersonalBests?.filter(pb => pb.seasontype === 'Outdoor') || [];

          return (
            <div className="space-y-8">
              {/* Indoor Personal Bests */}
              {indoorPBs.length > 0 && (
                <div>
                  <h3 className="text-2xl font-bold mb-4 text-blue-400">🏠 Indoor Personal Bests</h3>
                  <div className="grid md:grid-cols-2 gap-6">
                    {indoorPBs.map(pb => (
                      <div key={`indoor-${pb.eventid}`} className="bg-slate-800 rounded-xl p-6 border border-slate-700">
                        <div className="text-slate-400 text-sm mb-1">{pb.eventtype}</div>
                        <div className="text-xl font-bold mb-2">{formatEventName(pb.eventname)}</div>
                        <div className="text-3xl font-bold text-blue-400 mb-2">
                          {formatTime(pb.personalbest)}
                        </div>
                        <div className="text-slate-500 text-sm">
                          {pb.pbmeet} • {new Date(pb.pbdate).toLocaleDateString()}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Indoor Relay Personal Bests */}
              {indoorRelayPBs.length > 0 && (
                <div>
                  <h3 className="text-2xl font-bold mb-4 text-blue-400">🏠 Indoor Relay Personal Bests</h3>
                  <div className="grid md:grid-cols-2 gap-6">
                    {indoorRelayPBs.map(pb => (
                      <div key={`indoor-relay-${pb.eventid}`} className="bg-slate-800 rounded-xl p-6 border border-slate-700 border-l-4 border-l-purple-500">
                        <div className="text-slate-400 text-sm mb-1">Relay • {pb.eventtype}</div>
                        <div className="text-xl font-bold mb-2">{formatEventName(pb.eventname)}</div>
                        <div className="text-3xl font-bold text-purple-400 mb-2">
                          {formatTime(pb.personalbest)}
                        </div>
                        <div className="text-slate-500 text-sm">
                          {pb.pbmeet} • {new Date(pb.pbdate).toLocaleDateString()}
                        </div>
                        <div className="text-slate-400 text-xs mt-2">
                          {pb.schoolname}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Outdoor Personal Bests */}
              {outdoorPBs.length > 0 && (
                <div>
                  <h3 className="text-2xl font-bold mb-4 text-green-400">☀️ Outdoor Personal Bests</h3>
                  <div className="grid md:grid-cols-2 gap-6">
                    {outdoorPBs.map(pb => (
                      <div key={`outdoor-${pb.eventid}`} className="bg-slate-800 rounded-xl p-6 border border-slate-700">
                        <div className="text-slate-400 text-sm mb-1">{pb.eventtype}</div>
                        <div className="text-xl font-bold mb-2">{formatEventName(pb.eventname)}</div>
                        <div className="text-3xl font-bold text-green-400 mb-2">
                          {formatTime(pb.personalbest)}
                        </div>
                        <div className="text-slate-500 text-sm">
                          {pb.pbmeet} • {new Date(pb.pbdate).toLocaleDateString()}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Outdoor Relay Personal Bests */}
              {outdoorRelayPBs.length > 0 && (
                <div>
                  <h3 className="text-2xl font-bold mb-4 text-green-400">☀️ Outdoor Relay Personal Bests</h3>
                  <div className="grid md:grid-cols-2 gap-6">
                    {outdoorRelayPBs.map(pb => (
                      <div key={`outdoor-relay-${pb.eventid}`} className="bg-slate-800 rounded-xl p-6 border border-slate-700 border-l-4 border-l-purple-500">
                        <div className="text-slate-400 text-sm mb-1">Relay • {pb.eventtype}</div>
                        <div className="text-xl font-bold mb-2">{formatEventName(pb.eventname)}</div>
                        <div className="text-3xl font-bold text-purple-400 mb-2">
                          {formatTime(pb.personalbest)}
                        </div>
                        <div className="text-slate-500 text-sm">
                          {pb.pbmeet} • {new Date(pb.pbdate).toLocaleDateString()}
                        </div>
                        <div className="text-slate-400 text-xs mt-2">
                          {pb.schoolname}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {indoorPBs.length === 0 && outdoorPBs.length === 0 && indoorRelayPBs.length === 0 && outdoorRelayPBs.length === 0 && (
                <div className="text-center py-12 text-slate-500">
                  No personal bests recorded
                </div>
              )}
            </div>
          );
        })()}

        {/* History Tab */}
        {activeTab === 'history' && (() => {
          // Combine individual and relay history, sort by date
          const allHistory = [
            ...(performanceHistory?.map(p => ({ ...p, isRelay: false })) || []),
            ...(relayHistory?.map(p => ({ ...p, isRelay: true, windgauge: null })) || [])
          ].sort((a, b) => new Date(b.startdate).getTime() - new Date(a.startdate).getTime());

          return (
            <div className="bg-slate-800 rounded-xl overflow-hidden">
              <table className="w-full">
                <thead className="bg-slate-700">
                  <tr>
                    <th className="px-4 py-3 text-left">Date</th>
                    <th className="px-4 py-3 text-left">Meet</th>
                    <th className="px-4 py-3 text-left">Event</th>
                    <th className="px-4 py-3 text-right">Result</th>
                    <th className="px-4 py-3 text-right">Wind</th>
                  </tr>
                </thead>
                <tbody>
                  {allHistory.slice(0, 50).map(p => (
                    <tr key={`${p.isRelay ? 'relay-' : ''}${p.performanceid}`} className={`border-t border-slate-700 ${p.isRelay ? 'bg-slate-750' : ''}`}>
                      <td className="px-4 py-3 text-slate-400">
                        {new Date(p.startdate).toLocaleDateString()}
                      </td>
                      <td className="px-4 py-3">{p.meetname}</td>
                      <td className="px-4 py-3">
                        {formatEventName(p.eventname)}
                      </td>
                      <td className="px-4 py-3 text-right font-mono text-blue-400">
                        {formatTime(p.resultvalue)}
                      </td>
                      <td className="px-4 py-3 text-right text-slate-500">
                        {p.windgauge ? `${p.windgauge > 0 ? '+' : ''}${p.windgauge}` : '-'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          );
        })()}

        {/* Trends Tab */}
        {activeTab === 'trends' && (
          <div className="space-y-6">
            {Object.entries(trendByEvent).map(([key, data]) => {
              const { trend, color } = calculateTrend(data.performances);
              const seasonColor = data.seasonType === 'Indoor' ? 'text-blue-400' : 'text-green-400';
              const seasonIcon = data.seasonType === 'Indoor' ? '🏠' : '☀️';
              
              return (
                <div key={key} className="bg-slate-800 rounded-xl p-6 border border-slate-700">
                  <div className="flex justify-between items-center mb-4">
                    <div>
                      <h3 className="text-xl font-bold">{formatEventName(data.eventName)}</h3>
                      <span className={`text-sm ${seasonColor}`}>
                        {seasonIcon} {data.seasonType}
                      </span>
                    </div>
                    <span className={`text-lg font-medium ${color}`}>{trend}</span>
                  </div>
                  
                  {/* All performances in chronological order */}
                  <div className="mt-4">
                    <h4 className="text-sm font-semibold text-slate-400 mb-3">All Performances (Chronological)</h4>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-2 max-h-60 overflow-y-auto">
                      {data.performances.map((p, i) => (
                        <div key={i} className="bg-slate-700 rounded px-3 py-2 text-sm">
                          <div className="font-mono text-blue-400">{formatTime(p)}</div>
                          <div className="text-xs text-slate-400 mt-1">
                            {new Date(data.dates[i]).toLocaleDateString()}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              );
            })}
            {Object.keys(trendByEvent).length === 0 && (
              <div className="text-slate-500 text-center py-12">
                Not enough performance data for trend analysis
              </div>
            )}
          </div>
        )}

        {/* Season Bests Tab */}
        {activeTab === 'seasonbests' && (() => {
          // Group season bests by season type
          const indoorBests = seasonBests?.filter(sb => sb.seasontype === 'Indoor') || [];
          const outdoorBests = seasonBests?.filter(sb => sb.seasontype === 'Outdoor') || [];
          const indoorRelayBests = relaySeasonBests?.filter(sb => sb.seasontype === 'Indoor') || [];
          const outdoorRelayBests = relaySeasonBests?.filter(sb => sb.seasontype === 'Outdoor') || [];
          
          // Group by year within each season type
          const indoorByYear: Record<number, typeof indoorBests> = {};
          indoorBests.forEach(sb => {
            if (!indoorByYear[sb.seasonyear]) indoorByYear[sb.seasonyear] = [];
            indoorByYear[sb.seasonyear].push(sb);
          });
          
          const outdoorByYear: Record<number, typeof outdoorBests> = {};
          outdoorBests.forEach(sb => {
            if (!outdoorByYear[sb.seasonyear]) outdoorByYear[sb.seasonyear] = [];
            outdoorByYear[sb.seasonyear].push(sb);
          });

          const indoorRelayByYear: Record<number, typeof indoorRelayBests> = {};
          indoorRelayBests.forEach(sb => {
            if (!indoorRelayByYear[sb.seasonyear]) indoorRelayByYear[sb.seasonyear] = [];
            indoorRelayByYear[sb.seasonyear].push(sb);
          });

          const outdoorRelayByYear: Record<number, typeof outdoorRelayBests> = {};
          outdoorRelayBests.forEach(sb => {
            if (!outdoorRelayByYear[sb.seasonyear]) outdoorRelayByYear[sb.seasonyear] = [];
            outdoorRelayByYear[sb.seasonyear].push(sb);
          });

          return (
            <div className="space-y-8">
              {/* Indoor Season Bests */}
              {indoorBests.length > 0 && (
                <div>
                  <h3 className="text-2xl font-bold mb-4 text-blue-400">🏠 Indoor Season Bests</h3>
                  {Object.keys(indoorByYear).sort((a, b) => Number(b) - Number(a)).map(year => (
                    <div key={year} className="mb-6">
                      <h4 className="text-lg font-semibold mb-3 text-slate-300">{year} Indoor</h4>
                      <div className="bg-slate-800 rounded-xl overflow-hidden">
                        <table className="w-full">
                          <thead className="bg-slate-700">
                            <tr>
                              <th className="px-4 py-3 text-left">Event</th>
                              <th className="px-4 py-3 text-right">Best</th>
                            </tr>
                          </thead>
                          <tbody>
                            {indoorByYear[Number(year)].map((sb, i) => (
                              <tr key={i} className="border-t border-slate-700">
                                <td className="px-4 py-3">{formatEventName(sb.eventname)}</td>
                                <td className="px-4 py-3 text-right font-mono text-blue-400">
                                  {formatTime(sb.seasonbest)}
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {/* Indoor Relay Season Bests */}
              {indoorRelayBests.length > 0 && (
                <div>
                  <h3 className="text-2xl font-bold mb-4 text-blue-400">🏠 Indoor Relay Season Bests</h3>
                  {Object.keys(indoorRelayByYear).sort((a, b) => Number(b) - Number(a)).map(year => (
                    <div key={year} className="mb-6">
                      <h4 className="text-lg font-semibold mb-3 text-slate-300">{year} Indoor</h4>
                      <div className="bg-slate-800 rounded-xl overflow-hidden border-l-4 border-l-purple-500">
                        <table className="w-full">
                          <thead className="bg-slate-700">
                            <tr>
                              <th className="px-4 py-3 text-left">Event</th>
                              <th className="px-4 py-3 text-right">Best</th>
                              <th className="px-4 py-3 text-left">School</th>
                            </tr>
                          </thead>
                          <tbody>
                            {indoorRelayByYear[Number(year)].map((sb, i) => (
                              <tr key={i} className="border-t border-slate-700">
                                <td className="px-4 py-3">
                                  {formatEventName(sb.eventname)}
                                </td>
                                <td className="px-4 py-3 text-right font-mono text-purple-400">
                                  {formatTime(sb.seasonbest)}
                                </td>
                                <td className="px-4 py-3 text-slate-400 text-sm">{sb.schoolname}</td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {/* Outdoor Season Bests */}
              {outdoorBests.length > 0 && (
                <div>
                  <h3 className="text-2xl font-bold mb-4 text-green-400">☀️ Outdoor Season Bests</h3>
                  {Object.keys(outdoorByYear).sort((a, b) => Number(b) - Number(a)).map(year => (
                    <div key={year} className="mb-6">
                      <h4 className="text-lg font-semibold mb-3 text-slate-300">{year} Outdoor</h4>
                      <div className="bg-slate-800 rounded-xl overflow-hidden">
                        <table className="w-full">
                          <thead className="bg-slate-700">
                            <tr>
                              <th className="px-4 py-3 text-left">Event</th>
                              <th className="px-4 py-3 text-right">Best</th>
                            </tr>
                          </thead>
                          <tbody>
                            {outdoorByYear[Number(year)].map((sb, i) => (
                              <tr key={i} className="border-t border-slate-700">
                                <td className="px-4 py-3">{formatEventName(sb.eventname)}</td>
                                <td className="px-4 py-3 text-right font-mono text-green-400">
                                  {formatTime(sb.seasonbest)}
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {/* Outdoor Relay Season Bests */}
              {outdoorRelayBests.length > 0 && (
                <div>
                  <h3 className="text-2xl font-bold mb-4 text-green-400">☀️ Outdoor Relay Season Bests</h3>
                  {Object.keys(outdoorRelayByYear).sort((a, b) => Number(b) - Number(a)).map(year => (
                    <div key={year} className="mb-6">
                      <h4 className="text-lg font-semibold mb-3 text-slate-300">{year} Outdoor</h4>
                      <div className="bg-slate-800 rounded-xl overflow-hidden border-l-4 border-l-purple-500">
                        <table className="w-full">
                          <thead className="bg-slate-700">
                            <tr>
                              <th className="px-4 py-3 text-left">Event</th>
                              <th className="px-4 py-3 text-right">Best</th>
                              <th className="px-4 py-3 text-left">School</th>
                            </tr>
                          </thead>
                          <tbody>
                            {outdoorRelayByYear[Number(year)].map((sb, i) => (
                              <tr key={i} className="border-t border-slate-700">
                                <td className="px-4 py-3">
                                  {formatEventName(sb.eventname)}
                                </td>
                                <td className="px-4 py-3 text-right font-mono text-purple-400">
                                  {formatTime(sb.seasonbest)}
                                </td>
                                <td className="px-4 py-3 text-slate-400 text-sm">{sb.schoolname}</td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {indoorBests.length === 0 && outdoorBests.length === 0 && indoorRelayBests.length === 0 && outdoorRelayBests.length === 0 && (
                <div className="text-center py-12 text-slate-500">
                  No season bests recorded
                </div>
              )}
            </div>
          );
        })()}
      </main>
    </div>
  );
}

