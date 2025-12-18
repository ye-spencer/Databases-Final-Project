'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';

interface Stats {
    schools: number;
    athletes: number;
    performances: number;
    events: number;
    meets: number;
    minYear: number;
    maxYear: number;
}

export default function Home() {
    const [stats, setStats] = useState<Stats | null>(null);
    const [loading, setLoading] = useState(true);

    const [randomStat, setRandomStat] = useState<any>(null);
    const [loadingRandomStat, setLoadingRandomStat] = useState(true);
    const [showSql, setShowSql] = useState(false);

    const fetchRandomStat = async () => {
        setLoadingRandomStat(true);
        const randomId = Math.floor(Math.random() * 10000);
        try {
            const res = await fetch(`/api/randomStat?randomId=${randomId}`);
            const data = await res.json();
            setRandomStat(data);
        } catch (error) {
            console.error('Error fetching random stat:', error);
        }
        setLoadingRandomStat(false);
    };

    useEffect(() => {
        const fetchStats = async () => {
            try {
                const res = await fetch('/api/stats');
                const data = await res.json();
                setStats(data);
            } catch (error) {
                console.error('Error fetching stats:', error);
            }
            setLoading(false);
        };
        fetchStats();
        fetchRandomStat();
    }, []);

    const renderRandomStatResult = () => {
        if (!randomStat || !randomStat.result) return null;

        const result = randomStat.result;

        if (Array.isArray(result)) {
            if (result.length === 0) return <div className="text-xl font-bold text-white">No results found</div>;
            // If array of objects, try to find a relevant value
            const firstItem = result[0];
            if (typeof firstItem === 'object') {
                // Try to grab the first value of the object
                const keys = Object.keys(firstItem);
                if (keys.length > 0) {
                    return (
                        <div className="max-h-60 overflow-y-auto custom-scrollbar">
                            <ul className="space-y-1">
                                {result.map((item, idx) => (
                                    <li key={idx} className="text-xl font-bold text-white border-b border-slate-700 pb-1 last:border-0">
                                        {String(item[keys[0]])}
                                    </li>
                                ))}
                            </ul>
                        </div>
                    )
                }
            }
            return <div className="text-xl font-bold text-white">{String(result[0])}</div>;
        }
        return <div className="text-4xl font-bold text-white">{String(result)}</div>;
    };

    return (
        <div className="min-h-screen bg-slate-900 text-white">
            {/* Header */}
            <header className="bg-gradient-to-r from-blue-900 to-purple-900 py-8 px-6">
                <div className="max-w-6xl mx-auto">
                    <h1 className="text-4xl font-bold mb-2">🏃 CC Track & Field Database</h1>
                    <p className="text-blue-200">Centennial Conference Performance Analytics</p>
                </div>
            </header>

            {/* Navigation Cards */}
            <main className="max-w-6xl mx-auto py-12 px-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">

                    {/* Athletes Card */}
                    <Link href="/athletes" className="group">
                        <div className="bg-slate-800 rounded-xl p-8 border border-slate-700 hover:border-blue-500 transition-all hover:shadow-lg hover:shadow-blue-500/20">
                            <div className="text-5xl mb-4">👤</div>
                            <h2 className="text-2xl font-bold mb-3 group-hover:text-blue-400">Athletes</h2>
                            <ul className="text-slate-400 space-y-2">
                                <li>• Personal Bests</li>
                                <li>• Season Bests</li>
                                <li>• Performance History</li>
                                <li>• Trend Analysis</li>
                                <li>• Conference Rankings</li>
                            </ul>
                        </div>
                    </Link>

                    {/* Schools Card */}
                    <Link href="/schools" className="group">
                        <div className="bg-slate-800 rounded-xl p-8 border border-slate-700 hover:border-green-500 transition-all hover:shadow-lg hover:shadow-green-500/20">
                            <div className="text-5xl mb-4">🏫</div>
                            <h2 className="text-2xl font-bold mb-3 group-hover:text-green-400">Schools</h2>
                            <ul className="text-slate-400 space-y-2">
                                <li>• Team Rosters</li>
                                <li>• School Records</li>
                                <li>• Season Bests</li>
                                <li>• Class Breakdown</li>
                                <li>• Historical Trends</li>
                            </ul>
                        </div>
                    </Link>

                    {/* Meets Card */}
                    <Link href="/meets" className="group">
                        <div className="bg-slate-800 rounded-xl p-8 border border-slate-700 hover:border-orange-500 transition-all hover:shadow-lg hover:shadow-orange-500/20">
                            <div className="text-5xl mb-4">🏆</div>
                            <h2 className="text-2xl font-bold mb-3 group-hover:text-orange-400">Meets</h2>
                            <ul className="text-slate-400 space-y-2">
                                <li>• Event Results</li>
                                <li>• Team Scores</li>
                                <li>• Head-to-Head</li>
                                <li>• Meet Records</li>
                                <li>• Championships</li>
                            </ul>
                        </div>
                    </Link>

                    {/* Predictions Card */}
                    <Link href="/predictions" className="group">
                        <div className="bg-slate-800 rounded-xl p-8 border border-slate-700 hover:border-yellow-500 transition-all hover:shadow-lg hover:shadow-yellow-500/20">
                            <div className="text-5xl mb-4">🔮</div>
                            <h2 className="text-2xl font-bold mb-3 group-hover:text-yellow-400">Predictions</h2>
                            <ul className="text-slate-400 space-y-2">
                                <li>• Championship Predictions</li>
                                <li>• Individual Championship Predictions</li>
                                <li>• Scoring Projections</li>
                                <li>• Performance Predictions</li>
                                <li>• Relay Predictions</li>
                            </ul>
                        </div>
                    </Link>

                </div>

                {/* Random Stat Section */}
                <div className="mt-16 bg-slate-800 rounded-xl p-8 border border-slate-700">
                    <div className="flex justify-between items-start mb-6">
                        <h2 className="text-2xl font-bold">🎲 Random Stat</h2>
                        <button
                            onClick={fetchRandomStat}
                            disabled={loadingRandomStat}
                            className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed text-sm font-medium"
                        >
                            {loadingRandomStat ? 'Loading...' : 'New Stat'}
                        </button>
                    </div>

                    {loadingRandomStat ? (
                        <div className="text-center py-8 text-slate-400">Loading random stat...</div>
                    ) : randomStat ? (
                        <div className="space-y-6">
                            <div>
                                <h3 className="text-slate-400 text-sm uppercase tracking-wider mb-2">Caption</h3>
                                <p className="text-xl text-blue-300">{randomStat.caption}</p>
                            </div>

                            <div>
                                <h3 className="text-slate-400 text-sm uppercase tracking-wider mb-2">Result</h3>
                                <div className="bg-slate-900/50 rounded-lg p-6 border border-slate-700/50">
                                    {renderRandomStatResult()}
                                </div>
                            </div>

                            <div>
                                <button
                                    onClick={() => setShowSql(!showSql)}
                                    className="text-sm text-slate-500 hover:text-slate-300 transition-colors flex items-center gap-2"
                                >
                                    {showSql ? 'Hide SQL Query' : 'Show SQL Query'}
                                    <span className="text-xs">▼</span>
                                </button>

                                {showSql && (
                                    <div className="mt-4 bg-slate-950 rounded-lg p-4 font-mono text-xs text-green-400 overflow-x-auto">
                                        {randomStat.query}
                                    </div>
                                )}
                            </div>
                        </div>
                    ) : (
                        <div className="text-center py-8 text-slate-500">Failed to load random stat</div>
                    )}
                </div>

                {/* Quick Stats */}
                <div className="mt-16 bg-slate-800 rounded-xl p-8 border border-slate-700">
                    <h2 className="text-2xl font-bold mb-6">📊 Database Overview</h2>
                    {loading ? (
                        <div className="text-center py-8 text-slate-400">Loading stats...</div>
                    ) : stats ? (
                        <div className="grid grid-cols-2 md:grid-cols-5 gap-6 text-center">
                            <div>
                                <div className="text-3xl font-bold text-blue-400">{stats.schools}</div>
                                <div className="text-slate-400">Schools</div>
                            </div>
                            <div>
                                <div className="text-3xl font-bold text-green-400">
                                    {stats.minYear}-{stats.maxYear}
                                </div>
                                <div className="text-slate-400">Seasons</div>
                            </div>
                            <div>
                                <div className="text-3xl font-bold text-purple-400">{stats.events}</div>
                                <div className="text-slate-400">Events</div>
                            </div>
                            <div>
                                <div className="text-3xl font-bold text-orange-400">
                                    {stats.athletes >= 1000 ? `${(stats.athletes / 1000).toFixed(1)}k` : stats.athletes.toLocaleString()}
                                </div>
                                <div className="text-slate-400">Athletes</div>
                            </div>
                            <div>
                                <div className="text-3xl font-bold text-pink-400">
                                    {stats.performances >= 100000 ? `${(stats.performances / 1000).toFixed(0)}k` : stats.performances.toLocaleString()}
                                </div>
                                <div className="text-slate-400">Performances</div>
                            </div>
                        </div>
                    ) : (
                        <div className="text-center py-8 text-slate-500">Failed to load stats</div>
                    )}
                </div>

                {/* Conference Schools */}
                <div className="mt-8 text-center text-slate-500">
                    <p className="text-sm">
                        Johns Hopkins • Ursinus • Dickinson • Franklin & Marshall • Gettysburg •
                        Haverford • McDaniel • Muhlenberg • Bryn Mawr • Swarthmore
                    </p>
                </div>
            </main>

            {/* Footer */}
            <footer className="bg-slate-950 py-6 px-6 mt-12">
                <div className="max-w-6xl mx-auto text-center text-slate-500">
                    <p>Created by Mirra Klimov & Spencer Ye • JHU Databases 2025</p>
                </div>
            </footer>
        </div>
    );
}
