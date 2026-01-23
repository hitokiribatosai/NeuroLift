import React, { useMemo, useState, useRef } from 'react';
import { motion } from 'framer-motion';
import { useLanguage } from '../contexts/LanguageContext';
import { SpotlightButton } from './ui/SpotlightButton';
import { Card } from './ui/Card';
import { Modal } from './ui/Modal';
import { safeStorage } from '../utils/storage';
import { CompletedWorkout } from '../types';
import { getMuscleForExercise, getLocalizedMuscleName, getSubMuscleForExercise } from '../utils/exerciseData';
import { Tooltip } from './ui/Tooltip';
import { useTooltip } from '../hooks/useTooltip';
import { hasRealWorkouts } from '../utils/demoData';

interface DashboardProps {
    setCurrentView: (view: string) => void;
}

export const Dashboard: React.FC<DashboardProps> = ({ setCurrentView }) => {
    const { t, language } = useLanguage();
    const [showStreakInfo, setShowStreakInfo] = useState(false);
    const [showScientificInfo, setShowScientificInfo] = useState(false);
    const [selectedMuscle, setSelectedMuscle] = useState('Total');
    const [activeIndex, setActiveIndex] = useState(0);
    const [hasRealWorkoutsState, setHasRealWorkoutsState] = useState(hasRealWorkouts());

    // Tooltip hooks
    const volumeChartTooltip = useTooltip('dashboard_volume_chart');
    const chartRef = useRef<HTMLDivElement>(null);

    const muscleGroups = ['Total', 'Chest', 'Back', 'Shoulders', 'Legs', 'Biceps', 'Triceps', 'Forearms', 'Core', 'Cardio'];

    const history = useMemo(() =>
        safeStorage.getParsed<CompletedWorkout[]>('neuroLift_history', []),
        []);

    const lastWorkout = history[0];

    // Calculate Streak
    const streak = useMemo(() => {
        if (history.length === 0) return 0;

        let count = 0;
        const today = new Date();
        today.setHours(0, 0, 0, 0);

        const timestamps: number[] = history.map(w => {
            const d = new Date(w.date);
            d.setHours(0, 0, 0, 0);
            return d.getTime();
        });

        const sortedDates: number[] = Array.from(new Set(timestamps)).sort((a, b) => b - a);

        if (sortedDates.length === 0) return 0;

        const todayTimestamp = today.getTime();
        const latestTimestamp = sortedDates[0];
        const diffDays = Math.floor((todayTimestamp - latestTimestamp) / (1000 * 60 * 60 * 24));

        // If gap since last workout is more than 3 days, streak resets
        if (diffDays > 3) return 0;

        count = 1;
        for (let i = 0; i < sortedDates.length - 1; i++) {
            const current = sortedDates[i];
            const next = sortedDates[i + 1];
            // Streak continues if workouts are within 3 days of each other
            if (current - next <= 86400000 * 3) {
                count++;
            } else {
                break;
            }
        }
        return count;
    }, [history]);

    // Chart Data (Last 7 workouts or days)
    const chartData = useMemo(() => {
        const data = [...history].reverse().slice(-7);
        if (data.length < 2) return null;

        const volumes = data.map(d => {
            if (selectedMuscle === 'Total') return d.totalVolume;
            return (d.exercises || []).reduce((acc, ex) => {
                const muscle = getMuscleForExercise(ex.name);
                const subMuscle = getSubMuscleForExercise(ex.name);
                if (muscle === selectedMuscle || subMuscle === selectedMuscle) {
                    return acc + (ex.sets || []).reduce((sAcc, s) => s.completed ? sAcc + (s.weight * s.reps) : sAcc, 0);
                }
                return acc;
            }, 0);
        });
        const maxVolume = Math.max(...volumes, 1);

        return { data, volumes, maxVolume };
    }, [history, selectedMuscle]);

    /* 
     * Scientific Score Logic (0-100):
     * 1. Consistency (30%): Based on the current streak. 4+ day streak = 30 points.
     * 2. Frequency (30%): Workouts in the last week. 5 sessions = 30 points.
     * 3. Progression (40%): Comparing last volume to previous average. 
     *    Progression is key to "Scientific Training" (Overload Principle).
     */
    const scientificScore = useMemo(() => {
        if (history.length === 0) return 0;

        // 1. Consistency Score (max 30)
        const consistencyScore = Math.min(streak * 7.5, 30);

        // 2. Frequency Score (max 30)
        const aWeekAgo = new Date();
        aWeekAgo.setDate(aWeekAgo.getDate() - 7);
        const recentWorkouts = history.filter(w => new Date(w.date) >= aWeekAgo).length;
        const frequencyScore = Math.min(recentWorkouts * 6, 30);

        // 3. Progression Score (max 40)
        let progressionScore = 20; // Base/Neutral
        if (history.length >= 2) {
            const lastVolume = history[0].totalVolume;
            const prevWorkouts = history.slice(1, 4);
            const avgPrevVolume = prevWorkouts.reduce((acc, w) => acc + w.totalVolume, 0) / prevWorkouts.length;

            if (lastVolume > avgPrevVolume) progressionScore = 40;
            else if (lastVolume >= avgPrevVolume * 0.9) progressionScore = 25;
            else progressionScore = 15;
        }

        return Math.round(consistencyScore + frequencyScore + progressionScore);
    }, [history, streak]);

    const handleScroll = (e: React.UIEvent<HTMLDivElement>) => {
        const scrollLeft = e.currentTarget.scrollLeft;
        const width = e.currentTarget.offsetWidth;
        const index = Math.round(scrollLeft / (width * 0.85)); // 0.85 matches the 85vw width
        setActiveIndex(index);
    };

    const handleQuickStart = (workoutType: 'push' | 'pull' | 'legs') => {
        // Pre-select exercises based on workout type and navigate to tracker
        const muscleGroups = {
            push: ['Chest', 'Shoulders', 'Triceps'],
            pull: ['Back', 'Biceps', 'Forearms'],
            legs: ['Quads', 'Hamstrings', 'Calves']
        };

        // Store the selected muscle groups in session storage for the tracker to pick up
        sessionStorage.setItem('quickStartMuscles', JSON.stringify(muscleGroups[workoutType]));
        setCurrentView('tracker');
    };

    const renderRecentSessionCard = () => {
        if (!lastWorkout) return (
            <Card className="p-8 bg-zinc-900/20 border-dashed border-zinc-800 rounded-[3rem] flex flex-col items-center justify-center text-center space-y-4 h-full">
                <div className="w-12 h-12 rounded-full bg-zinc-800/50 flex items-center justify-center text-zinc-600">
                    <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                </div>
                <p className="text-[10px] font-black text-zinc-500 uppercase tracking-widest whitespace-normal">No recent sessions found. Start training to see your stats!</p>
            </Card>
        );

        return (
            <Card className="p-8 bg-zinc-900/40 border-zinc-800 rounded-[3rem] shadow-sm flex flex-col justify-between h-full group hover:border-teal-500/30 transition-all">
                <div>
                    <h3 className="text-[10px] font-black text-zinc-400 uppercase tracking-[0.3em] mb-8">Recent Session</h3>
                    <h4 className="text-2xl font-black text-white uppercase tracking-tighter mb-2 line-clamp-1">
                        {lastWorkout.name || "Workout"}
                    </h4>
                    <div className="flex items-center gap-4 text-xs font-bold text-teal-400">
                        <span>{lastWorkout.date}</span>
                        <span className="w-1 h-1 bg-zinc-700 rounded-full"></span>
                        <span className="text-zinc-500 uppercase tracking-widest text-[10px]">
                            {Math.floor(lastWorkout.durationSeconds / 60)}m {lastWorkout.durationSeconds % 60}s
                        </span>
                    </div>
                </div>
                <div className="mt-8 pt-6 border-t border-zinc-800 flex justify-between items-end">
                    <div>
                        <div className="text-[9px] text-zinc-500 font-black uppercase tracking-widest mb-1">Volume</div>
                        <div className="text-2xl font-black font-mono text-white">{lastWorkout.totalVolume} <span className="text-xs text-teal-500">KG</span></div>
                    </div>
                    <button
                        onClick={() => setCurrentView('journal')}
                        className="text-[9px] font-black text-zinc-400 hover:text-white transition-colors uppercase tracking-[0.2em] mb-1"
                    >
                        View Journal →
                    </button>
                </div>
            </Card>
        );
    };

    const renderInsightsCard = () => (
        <Card className="p-8 bg-zinc-900/40 border-zinc-800 rounded-[3rem] shadow-sm overflow-hidden relative h-full">
            <h3 className="text-[10px] font-black text-zinc-400 uppercase tracking-[0.3em] mb-8">Insights</h3>
            <div className="space-y-6">
                <div className="flex justify-between items-center group">
                    <div className="flex items-center gap-2">
                        <span className="text-[11px] font-bold text-zinc-400 group-hover:text-white transition-colors uppercase tracking-widest">Scientific Score</span>
                        <button
                            onClick={() => setShowScientificInfo(true)}
                            className="p-1 rounded-full bg-zinc-800/50 text-zinc-500 hover:text-teal-400 transition-colors"
                        >
                            <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                        </button>
                    </div>
                    <span className="text-lg font-black font-mono text-teal-400">{scientificScore}%</span>
                </div>
                <div className="h-px bg-zinc-800"></div>
                <div className="flex justify-between items-center group">
                    <span className="text-[11px] font-bold text-zinc-400 group-hover:text-white transition-colors uppercase tracking-widest">Consistency</span>
                    <span className="text-lg font-black font-mono text-white">{streak > 5 ? 'Elite' : 'Targeting'}</span>
                </div>
            </div>
            {/* Aesthetic Glow */}
            <div className="absolute -bottom-20 -right-20 w-40 h-40 bg-teal-500/5 blur-3xl rounded-full"></div>
        </Card>
    );

    const renderVolumeChartCard = () => {
        if (!chartData) return null;
    return (
      <Card className="p-8 bg-zinc-900/40 border-zinc-800 rounded-[3rem] shadow-sm h-full">
        <div ref={chartRef} className="flex justify-between items-center mb-10">
          <div>
            <h3 className="text-[10px] font-black text-zinc-400 uppercase tracking-[0.4em]">Volume Progress</h3>
            <div className="text-[9px] text-teal-500 font-bold uppercase tracking-widest mt-1 opacity-70">7 Sessions</div>
          </div>
          <select
            value={selectedMuscle}
            onChange={(e) => setSelectedMuscle(e.target.value)}
            className="bg-zinc-800/50 border border-zinc-800 rounded-xl px-4 py-2 text-[10px] font-black uppercase tracking-widest text-teal-400 outline-none focus:border-teal-500 transition-all cursor-pointer"
          >
            {muscleGroups.map(m => (
              <option key={m} value={m}>{m === 'Total' ? 'Overall' : getLocalizedMuscleName(m, language)}</option>
            ))}
          </select>
        </div>

                <div className="relative h-48 w-full group">
                    <svg viewBox="0 0 300 100" className="w-full h-full drop-shadow-[0_10px_15px_rgba(0,0,0,0.5)]">
                        {/* Horizontal Lines */}
                        {[0, 0.5, 1].map(v => (
                            <line
                                key={v}
                                x1="0" y1={10 + v * 80} x2="300" y2={10 + v * 80}
                                stroke="#ffffff08" strokeWidth="0.5" strokeDasharray="4 4"
                            />
                        ))}

                        {/* Main Path */}
                        <motion.path
                            initial={{ pathLength: 0, opacity: 0 }}
                            animate={{ pathLength: 1, opacity: 1 }}
                            transition={{ duration: 1.5, ease: "easeInOut" }}
                            d={`M ${chartData.volumes.map((v, i) =>
                                `${(i / (chartData.volumes.length - 1)) * 280 + 10},${90 - (v / chartData.maxVolume) * 70}`
                            ).join(' L ')}`}
                            fill="none"
                            stroke="url(#chartGradient)"
                            strokeWidth="4"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                        />

                        {/* Dots */}
                        {chartData.volumes.map((v, i) => {
                            const x = (i / (chartData.volumes.length - 1)) * 280 + 10;
                            const y = 90 - (v / chartData.maxVolume) * 70;
                            return (
                                <motion.circle
                                    key={i}
                                    initial={{ scale: 0 }}
                                    animate={{ scale: 1 }}
                                    transition={{ delay: i * 0.1 }}
                                    cx={x} cy={y} r="3"
                                    fill="#14b8a6"
                                    className="shadow-lg"
                                />
                            );
                        })}

                        <defs>
                            <linearGradient id="chartGradient" x1="0" y1="0" x2="1" y2="0">
                                <stop offset="0%" stopColor="#14b8a6" />
                                <stop offset="100%" stopColor="#2dd4bf" />
                            </linearGradient>
                        </defs>
                    </svg>

                    <div className="flex justify-between mt-6 text-[9px] text-zinc-600 font-black uppercase tracking-widest px-2">
                        <span>{chartData.data[0].date}</span>
                        <span>{chartData.data[chartData.data.length - 1].date}</span>
          </div>
        </div>

        <Tooltip
          id="dashboard_volume_chart"
          isOpen={volumeChartTooltip.isOpen}
          onDismiss={volumeChartTooltip.dismiss}
          position="top"
          targetRef={chartRef}
        >
          <p className="text-sm font-bold mb-1">{t('tooltip_volume_chart_title')}</p>
          <p className="text-xs opacity-90">{t('tooltip_volume_chart_desc')}</p>
        </Tooltip>
      </Card>
    );
  };

    const renderQuickStartCard = () => {
        if (!hasRealWorkoutsState) {
            // Show workout quick start for new users
            return (
                <Card className="p-8 bg-zinc-900/40 border-zinc-800 rounded-[3rem] group hover:border-teal-500/50 transition-all shadow-sm">
                    <h3 className="text-[10px] font-black text-zinc-400 uppercase tracking-[0.3em] mb-6">{t('quick_start_title')}</h3>
                    <p className="text-zinc-500 text-xs font-bold uppercase tracking-wide mb-6">{t('quick_start_subtitle')}</p>
                    <div className="space-y-3">
                        <SpotlightButton
                            onClick={() => handleQuickStart('push')}
                            className="w-full justify-between py-4 text-xs font-black uppercase tracking-widest"
                        >
                            <div className="flex flex-col items-start">
                                <span>{t('quick_start_push_day')}</span>
                                <span className="text-[9px] text-zinc-400 font-medium normal-case">{t('quick_start_push_desc')}</span>
                            </div>
                            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                            </svg>
                        </SpotlightButton>
                        <SpotlightButton
                            onClick={() => handleQuickStart('pull')}
                            className="w-full justify-between py-4 text-xs font-black uppercase tracking-widest"
                        >
                            <div className="flex flex-col items-start">
                                <span>{t('quick_start_pull_day')}</span>
                                <span className="text-[9px] text-zinc-400 font-medium normal-case">{t('quick_start_pull_desc')}</span>
                            </div>
                            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                            </svg>
                        </SpotlightButton>
                        <SpotlightButton
                            onClick={() => handleQuickStart('legs')}
                            className="w-full justify-between py-4 text-xs font-black uppercase tracking-widest"
                        >
                            <div className="flex flex-col items-start">
                                <span>{t('quick_start_leg_day')}</span>
                                <span className="text-[9px] text-zinc-400 font-medium normal-case">{t('quick_start_leg_desc')}</span>
                            </div>
                            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                            </svg>
                        </SpotlightButton>
                    </div>
                </Card>
            );
        }

        // Show regular quick start for existing users
        return (
            <Card className="p-8 bg-zinc-900/40 border-zinc-800 rounded-[3rem] group hover:border-teal-500/50 transition-all shadow-sm">
                <h3 className="text-[10px] font-black text-zinc-400 uppercase tracking-[0.3em] mb-8">Quick Start</h3>
                <div className="space-y-4">
                    <SpotlightButton
                        onClick={() => setCurrentView('tracker')}
                        className="w-full justify-center py-5 text-xs font-black uppercase tracking-widest shadow-xl shadow-teal-500/10"
                    >
                        Start Workout
                        <svg className="w-4 h-4 ml-2 rtl:rotate-180" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M13 10V3L4 14h7v7l9-11h-7z" />
                        </svg>
                    </SpotlightButton>
                    <SpotlightButton
                        variant="secondary"
                        onClick={() => setCurrentView('planner')}
                        className="w-full justify-center py-4 text-[10px] font-black uppercase tracking-[0.2em]"
                    >
                        Plan Exercises
                    </SpotlightButton>
                </div>
            </Card>
        );
    };

    return (
        <section className="relative min-h-screen py-24 px-6 overflow-hidden">
            {/* Background Glow */}
            <div className="absolute inset-0 -z-10 grid-bg opacity-30"></div>
            <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full h-[500px] bg-gradient-to-b from-teal-500/10 to-transparent blur-3xl -z-10"></div>

            <div className="max-w-6xl mx-auto space-y-12">
                {/* Header Section */}
                <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
                    <motion.div
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        className="space-y-2"
                    >
                        <h1 className="text-4xl md:text-6xl font-black text-white tracking-tighter uppercase italic">
                            Welcome <span className="text-teal-500">Back.</span>
                        </h1>
                        <p className="text-zinc-500 font-bold uppercase tracking-widest text-xs">
                            NeuroLift Personal Dashboard
                        </p>
                    </motion.div>

                    {/* Streak Indicator */}
                    <motion.div
                        initial={{ opacity: 0, scale: 0.9 }}
                        animate={{ opacity: 1, scale: 1 }}
                        className="bg-zinc-900/50 backdrop-blur-xl border border-zinc-800 p-6 rounded-[2.5rem] flex items-center gap-6 shadow-2xl"
                        style={{ WebkitBackdropFilter: 'blur(24px)' }}
                    >
                        <div className={`relative flex items-center justify-center ${streak > 0 ? 'text-orange-500' : 'text-zinc-700'}`}>
                            <svg className="w-10 h-10" fill="currentColor" viewBox="0 0 20 20">
                                <path fillRule="evenodd" d="M12.395 2.553a1 1 0 00-1.45-.385c-.345.23-.614.558-.822.88-.214.33-.403.713-.57 1.116-.334.804-.614 1.768-.84 2.734a31.365 31.365 0 00-.613 3.58 2.64 2.64 0 01-.945-1.067c-.328-.68-.398-1.534-.398-2.654A1 1 0 005.05 6.05 6.981 6.981 0 003 11a7 7 0 1014 0c0-1.187-.268-2.312-.733-3.32a1 1 0 00-.671-.563 1 1 0 00-1.207.306 4.415 4.415 0 01-.584.548c-.015.011-.03.023-.044.034a10.02 10.02 0 00-1.39-2.912c-.272-.397-.599-.79-.944-1.14a1 1 0 00-.032-1.402z" clipRule="evenodd" />
                            </svg>
                            {streak > 0 && <div className="absolute inset-0 bg-orange-500/20 blur-xl rounded-full"></div>}
                        </div>
                        <div>
                            <div className="text-3xl font-black font-mono text-white leading-none">{streak}</div>
                            <div className="flex items-center gap-2 mt-1">
                                <div className="text-[10px] text-zinc-500 font-black uppercase tracking-widest">Day Streak</div>
                                <button
                                    onClick={() => setShowStreakInfo(true)}
                                    className="p-1 rounded-full bg-zinc-800/50 text-zinc-500 hover:text-teal-400 transition-colors"
                                >
                                    <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                                    </svg>
                                </button>
                            </div>
                        </div>
                    </motion.div>
                </div>

                 {/* Actionable Sections */}
                 <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                     {/* Quick Start - Primary Action (Always Top/Left) */}
                     {renderQuickStartCard()}

                    {/* Desktop View: Grid Layout for other cards */}
                    <div className="hidden md:contents">
                        {renderRecentSessionCard()}
                        {renderInsightsCard()}
                    </div>
                </div>

                {/* Mobile View: Swipable Carousel for Insights & History */}
                <div className="md:hidden">
                    <div
                        onScroll={handleScroll}
                        className="flex overflow-x-auto snap-x snap-mandatory scrollbar-hide -mx-6 px-6 gap-6 h-full pb-8"
                    >
                        <div className="snap-center shrink-0 w-[85vw]">
                            {renderRecentSessionCard()}
                        </div>
                        <div className="snap-center shrink-0 w-[85vw]">
                            {renderInsightsCard()}
                        </div>
                        {chartData && (
                            <div className="snap-center shrink-0 w-[85vw]">
                                {renderVolumeChartCard()}
                            </div>
                        )}
                    </div>
                    {/* Carousel Indicators */}
                    <div className="flex justify-center gap-2 -mt-4 mb-8">
                        {[0, 1, chartData ? 2 : null].filter(x => x !== null).map((i) => (
                            <motion.div
                                key={i}
                                animate={{
                                    width: activeIndex === i ? 24 : 6,
                                    backgroundColor: activeIndex === i ? '#14b8a6' : '#27272a'
                                }}
                                className="h-1.5 rounded-full"
                            />
                        ))}
                    </div>
                </div>

                {/* Desktop View: Volume Progression Chart */}
                <div className="hidden md:block">
                    {chartData && renderVolumeChartCard()}
                </div>

                {/* Info Modals */}
                <Modal isOpen={showStreakInfo} onClose={() => setShowStreakInfo(false)}>
                    <div className="p-10 bg-zinc-950 border border-zinc-900 rounded-[3rem] text-center space-y-6 relative overflow-hidden">
                        <div className="absolute top-0 left-0 w-full h-2 bg-gradient-to-r from-orange-500 to-rose-500"></div>
                        <div className="w-16 h-16 bg-orange-500/10 rounded-full flex items-center justify-center mx-auto text-orange-500 mb-4">
                            <svg className="w-8 h-8" fill="currentColor" viewBox="0 0 20 20">
                                <path fillRule="evenodd" d="M12.395 2.553a1 1 0 00-1.45-.385c-.345.23-.614.558-.822.88-.214.33-.403.713-.57 1.116-.334.804-.614 1.768-.84 2.734a31.365 31.365 0 00-.613 3.58 2.64 2.64 0 01-.945-1.067c-.328-.68-.398-1.534-.398-2.654A1 1 0 005.05 6.05 6.981 6.981 0 003 11a7 7 0 1014 0c0-1.187-.268-2.312-.733-3.32a1 1 0 00-.671-.563 1 1 0 00-1.207.306 4.415 4.415 0 01-.584.548c-.015.011-.03.023-.044.034a10.02 10.02 0 00-1.39-2.912c-.272-.397-.599-.79-.944-1.14a1 1 0 00-.032-1.402z" clipRule="evenodd" />
                            </svg>
                        </div>
                        <h3 className="text-2xl font-black text-white uppercase italic tracking-tight">{t('streak_info_title')}</h3>
                        <p className="text-zinc-400 font-bold text-sm leading-relaxed uppercase tracking-wide">
                            {t('streak_info_desc')}
                        </p>
                        <button
                            onClick={() => setShowStreakInfo(false)}
                            className="w-full py-4 bg-zinc-900 border border-zinc-800 rounded-2xl text-[10px] font-black uppercase tracking-widest text-white hover:bg-zinc-800 transition-colors"
                        >
                            {t('modal_close')}
                        </button>
                    </div>
                </Modal>

                <Modal isOpen={showScientificInfo} onClose={() => setShowScientificInfo(false)}>
                    <div className="p-10 bg-zinc-950 border border-zinc-900 rounded-[3rem] space-y-8 relative overflow-hidden">
                        <div className="absolute top-0 left-0 w-full h-2 bg-teal-500"></div>
                        <div className="text-center">
                            <h3 className="text-2xl font-black text-white uppercase italic tracking-tight mb-2">{t('sci_score_title')}</h3>
                            <p className="text-[10px] text-zinc-500 font-black uppercase tracking-widest">Scientific Training Protocol</p>
                        </div>

                        <div className="space-y-6">
                            <div className="p-4 bg-zinc-900/50 border border-zinc-800 rounded-2xl">
                                <h4 className="text-xs font-black text-teal-400 uppercase tracking-widest mb-2">Consistency</h4>
                                <p className="text-[10px] text-zinc-400 font-bold uppercase leading-relaxed">{t('sci_score_consistency')}</p>
                            </div>
                            <div className="p-4 bg-zinc-900/50 border border-zinc-800 rounded-2xl">
                                <h4 className="text-xs font-black text-teal-400 uppercase tracking-widest mb-2">Frequency</h4>
                                <p className="text-[10px] text-zinc-400 font-bold uppercase leading-relaxed">{t('sci_score_frequency')}</p>
                            </div>
                            <div className="p-4 bg-zinc-900/50 border border-zinc-800 rounded-2xl">
                                <h4 className="text-xs font-black text-teal-400 uppercase tracking-widest mb-2">Progression</h4>
                                <p className="text-[10px] text-zinc-400 font-bold uppercase leading-relaxed">{t('sci_score_progression')}</p>
                            </div>
                        </div>

                        <button
                            onClick={() => setShowScientificInfo(false)}
                            className="w-full py-4 bg-zinc-900 border border-zinc-800 rounded-2xl text-[10px] font-black uppercase tracking-widest text-white hover:bg-zinc-800 transition-colors"
                        >
                            {t('modal_close')}
                        </button>
                    </div>
                </Modal>
            </div>
        </section>
    );
};
