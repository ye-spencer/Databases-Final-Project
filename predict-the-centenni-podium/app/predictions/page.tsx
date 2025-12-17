'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { EventPrediction, TeamScore } from '@/app/lib/types';

interface PredictionModel {
    id: string;
    name: string;
    description: string;
}

const PREDICTION_MODELS: PredictionModel[] = [
    { id: 'season-best', name: 'Season Best', description: 'Based on current season bests' },
    { id: 'linear-regression', name: 'Linear Regression', description: 'Based on linear regression' },
    { id: 'average-season-performance', name: 'Average Season Performance', description: 'Based on average season performance' },
];

const SEASONS = [
    { year: 2026, type: 'Indoor', label: '2026 Indoor' },
    { year: 2025, type: 'Outdoor', label: '2025 Outdoor' },
    { year: 2025, type: 'Indoor', label: '2025 Indoor' },
    { year: 2024, type: 'Outdoor', label: '2024 Outdoor' },
    { year: 2024, type: 'Indoor', label: '2024 Indoor' },
];

function formatTime(seconds: number | string | null | undefined): string {
    if (seconds === null || seconds === undefined) return '-';
    const num = typeof seconds === 'string' ? parseFloat(seconds) : seconds;
    if (isNaN(num)) return '-';
    if (num >= 60) {
        const mins = Math.floor(num / 60);
        const secs = (num % 60).toFixed(2);
        return `${mins}:${secs.padStart(5, '0')}`;
    }
    return num.toFixed(2);
}

function formatDistance(meters: number | string | null | undefined): string {
    if (meters === null || meters === undefined) return '-';
    const num = typeof meters === 'string' ? parseFloat(meters) : meters;
    if (isNaN(num)) return '-';
    return num.toFixed(2);
}

async function queryPredictions(selectedModel: string, selectedSeason: string, gender: string): Promise<[EventPrediction[], TeamScore[]]> {
    try {
        const predictions = await fetch(`/api/predictions?model=${selectedModel}&season=${selectedSeason}&gender=${gender}`);
        const data = await predictions.json();
        return [data.eventPredictions, data.teamScores];
    } catch (error) {
        console.error('Error fetching predictions:', error);
        return [[], []];
    }
}

export default function PredictionsPage() {
    const [selectedModel, setSelectedModel] = useState<string>('season-best');
    const [selectedSeason, setSelectedSeason] = useState<string>('2026-Indoor');
    const [gender, setGender] = useState<'M' | 'F'>('M');
    const [predictions, setPredictions] = useState<EventPrediction[]>([]);
    const [teamScores, setTeamScores] = useState<TeamScore[]>([]);
    const [loading, setLoading] = useState(false);
    const [metaInfo, setMetaInfo] = useState<{ title: string; description: string }>({
        title: 'Championship Predictions',
        description: 'Based on current season data'
    });

    useEffect(() => {
        setLoading(true);
        const fetchPredictions = async () => {
            const [predictions, teamScores] = await queryPredictions(selectedModel, selectedSeason, gender);
            setPredictions(predictions);
            setTeamScores(teamScores);
            setLoading(false);
        };
        fetchPredictions();
    }, [selectedModel, selectedSeason, gender]);

    const currentSeason = SEASONS.find(s => `${s.year}-${s.type}` === selectedSeason);
    const selectedModelData = PREDICTION_MODELS.find(m => m.id === selectedModel);

    // Group predictions by event
    const eventGroups: Record<string, EventPrediction> = {};
    predictions.forEach(p => {
        const key = `${p.eventname}-${p.gender}`;
        if (!eventGroups[key]) eventGroups[key] = p;
    });

    const filteredEvents = Object.values(eventGroups).filter(e => e.gender === gender);

    return (
        <div className="min-h-screen bg-slate-900 text-white">
            {/* Header */}
            <header className="bg-gradient-to-r from-yellow-900 to-yellow-800 py-6 px-6">
                <div className="max-w-7xl mx-auto">
                    <Link href="/" className="text-yellow-300 hover:text-white mb-2 inline-block">← Back to Home</Link>
                    <h1 className="text-3xl font-bold">🔮 Predictions</h1>
                    <p className="text-yellow-200">Championship Performance Projections</p>
                </div>
            </header>

            <main className="max-w-7xl mx-auto py-8 px-6">
                {/* Filters */}
                <div className="flex gap-4 mb-6 flex-wrap items-center">
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
                    <div className="flex rounded-lg overflow-hidden border border-slate-700">
                        <button
                            onClick={() => setGender('M')}
                            className={`px-4 py-2 font-medium transition-colors ${gender === 'M'
                                ? 'bg-blue-600 text-white'
                                : 'bg-slate-800 text-slate-400 hover:text-white'
                                }`}
                        >
                            Men
                        </button>
                        <button
                            onClick={() => setGender('F')}
                            className={`px-4 py-2 font-medium transition-colors ${gender === 'F'
                                ? 'bg-pink-600 text-white'
                                : 'bg-slate-800 text-slate-400 hover:text-white'
                                }`}
                        >
                            Women
                        </button>
                    </div>
                </div>

                {/* Three Column Layout */}
                <div className="grid grid-cols-12 gap-6">
                    {/* Left Column: Model Selection */}
                    <div className="col-span-12 md:col-span-2">
                        <div className="bg-slate-800 rounded-xl p-4 border border-slate-700">
                            <h3 className="font-bold mb-4 text-slate-300">Prediction Model</h3>
                            <div className="space-y-2">
                                {PREDICTION_MODELS.map(model => (
                                    <button
                                        key={model.id}
                                        onClick={() => setSelectedModel(model.id)}
                                        className={`w-full text-left px-3 py-2 rounded text-sm transition-colors ${selectedModel === model.id
                                            ? 'bg-yellow-600 text-white'
                                            : 'bg-slate-700 hover:bg-slate-600 text-slate-300'
                                            }`}
                                    >
                                        <div className="font-medium">{model.name}</div>
                                        <div className="text-xs mt-1 opacity-75">{model.description}</div>
                                    </button>
                                ))}
                            </div>
                        </div>
                    </div>

                    {/* Middle Column: Predictions (Larger) */}
                    <div className="col-span-12 md:col-span-7">
                        <div className="bg-slate-800 rounded-xl p-6 border border-slate-700">
                            {/* Title and Meta Info */}
                            <div className="mb-6">
                                <h2 className="text-2xl font-bold mb-2">{metaInfo.title}</h2>
                                <p className="text-slate-400 mb-4">{metaInfo.description}</p>
                                <div className="flex gap-4 text-sm text-slate-500">
                                    <span>Model: {selectedModelData?.name}</span>
                                    <span>•</span>
                                    <span>{currentSeason?.label}</span>
                                    <span>•</span>
                                    <span>{gender === 'M' ? "Men's" : "Women's"} Events</span>
                                </div>
                            </div>

                            {/* Event Predictions */}
                            {loading ? (
                                <div className="text-center py-12 text-slate-400">Loading predictions...</div>
                            ) : filteredEvents.length === 0 ? (
                                <div className="text-center py-12 text-slate-500">
                                    <div className="text-4xl mb-4">📊</div>
                                    <p>No predictions available</p>
                                    <p className="text-sm mt-2">Select a model and season to generate predictions</p>
                                </div>
                            ) : (
                                <div className="space-y-6">
                                    {filteredEvents.map((event) => (
                                        <div key={`${event.eventid}-${event.gender}`} className="bg-slate-700 rounded-lg overflow-hidden">
                                            <div className={`px-4 py-3 ${gender === 'M' ? 'bg-blue-900' : 'bg-pink-900'}`}>
                                                <h3 className="font-bold text-lg">{event.eventname}</h3>
                                            </div>
                                            <div className="overflow-x-auto">
                                                <table className="w-full">
                                                    <thead className="bg-slate-750">
                                                        <tr>
                                                            <th className="px-4 py-2 text-left w-12">Pl</th>
                                                            <th className="px-4 py-2 text-left">Athlete</th>
                                                            <th className="px-4 py-2 text-left">School</th>
                                                            <th className="px-4 py-2 text-right">Predicted Result</th>
                                                        </tr>
                                                    </thead>
                                                    <tbody>
                                                        {event.predictions.map((pred, idx) => (
                                                            <tr key={idx} className="border-t border-slate-600 hover:bg-slate-650">
                                                                <td className="px-4 py-3 font-bold">
                                                                    {pred.place === 1 ? '🥇' : pred.place === 2 ? '🥈' : pred.place === 3 ? '🥉' : pred.place}
                                                                </td>
                                                                <td className="px-4 py-3">
                                                                    {pred.athleteid ? (
                                                                        <Link
                                                                            href={`/athletes/${pred.athleteid}`}
                                                                            className="hover:text-yellow-400"
                                                                        >
                                                                            {pred.athletefirstname} {pred.athletelastname}
                                                                        </Link>
                                                                    ) : (
                                                                        <span className="text-slate-400">TBD</span>
                                                                    )}
                                                                </td>
                                                                <td className="px-4 py-3 text-slate-400">{pred.schoolname}</td>
                                                                <td className="px-4 py-3 text-right font-mono text-yellow-400">
                                                                    {event.eventtype === 'sprints' || event.eventtype === 'distance'
                                                                        ? formatTime(pred.predictedresult)
                                                                        : formatDistance(pred.predictedresult)}
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
                        </div>
                    </div>

                    {/* Right Column: Team Scores */}
                    <div className="col-span-12 md:col-span-3">
                        <div className="bg-slate-800 rounded-xl p-4 border border-slate-700">
                            <h3 className="font-bold mb-4 text-slate-300">Team Projected Scores</h3>
                            {loading ? (
                                <div className="text-center py-8 text-slate-500 text-sm">Loading...</div>
                            ) : teamScores.length === 0 ? (
                                <div className="text-center py-8 text-slate-500 text-sm">
                                    <div className="text-2xl mb-2">🏆</div>
                                    <p>No team scores available</p>
                                </div>
                            ) : (
                                <div className="space-y-3">
                                    {teamScores
                                        .sort((a, b) => b.totalscore - a.totalscore)
                                        .map((team, idx) => (
                                            <div
                                                key={team.schoolid}
                                                className="bg-slate-700 rounded-lg p-3 border border-slate-600"
                                            >
                                                <div className="flex items-center justify-between mb-2">
                                                    <div className="flex items-center gap-2">
                                                        <span className="text-small font-bold text-slate-400">#{idx + 1}</span>
                                                        <Link href={`/schools/${team.schoolid}`} className="font-small hover:text-yellow-400">{team.schoolname}</Link>
                                                    </div>
                                                    <div className="text-medium font-bold text-yellow-400">
                                                        {team.totalscore}
                                                    </div>
                                                </div>
                                                <div className="text-xs text-slate-500">
                                                    {Object.keys(team.eventbreakdown).length} events
                                                </div>
                                            </div>
                                        ))}
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </main>
        </div>
    );
}