import React from 'react';
import { useLanguage } from '../../contexts/LanguageContext';
import { useClock } from '../../contexts/ClockContext';
import { Card } from '../ui/Card';
import { SpotlightButton } from '../ui/SpotlightButton';

export const Clock: React.FC = () => {
    const { t } = useLanguage();
    const {
        mode, setMode,
        timerActive, setTimerActive,
        duration,
        countdownRemaining,
        countdownInput, setCountdownInput,
        laps, addLap,
        resetClock,
        startTimer
    } = useClock();

    const formatTime = (secs: number) => {
        const m = Math.floor(secs / 60);
        const s = secs % 60;
        return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
    };

    const currentDisplay = mode === 'stopwatch' ? duration : (countdownRemaining !== null ? countdownRemaining : parseInt(countdownInput) || 0);

    return (
        <div className="mx-auto max-w-4xl px-6 py-24 min-h-[70vh] flex flex-col items-center">
            <div className="w-full max-w-md">
                <Card className="p-8 bg-white dark:bg-zinc-900/80 border border-zinc-200 dark:border-zinc-800 mb-8 shadow-sm rounded-[2.5rem]">
                    <div className="flex justify-center gap-4 mb-8 bg-zinc-50 dark:bg-black/40 p-1.5 rounded-2xl border border-zinc-100 dark:border-zinc-800">
                        <button
                            onClick={() => { setMode('stopwatch'); setTimerActive(false); }}
                            className={`flex-1 px-4 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${mode === 'stopwatch' ? 'bg-teal-500 text-white shadow-lg shadow-teal-500/20' : 'text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-300'}`}
                        >
                            {t('clock_stopwatch')}
                        </button>
                        <button
                            onClick={() => { setMode('timer'); setTimerActive(false); }}
                            className={`flex-1 px-4 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${mode === 'timer' ? 'bg-teal-500 text-white shadow-lg shadow-teal-500/20' : 'text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-300'}`}
                        >
                            {t('clock_timer')}
                        </button>
                    </div>

                    <div className="relative flex flex-col items-center justify-center py-12">
                        <div className="absolute inset-0 bg-teal-500/5 rounded-full blur-3xl"></div>
                        <div className="relative text-center">
                            <div className="text-8xl font-mono font-black text-zinc-900 dark:text-white tracking-tighter leading-none">
                                {formatTime(currentDisplay)}
                            </div>
                            <div className="text-[10px] text-zinc-400 dark:text-zinc-500 uppercase tracking-[0.4em] mt-6 font-black">
                                {mode === 'stopwatch' ? t('clock_stopwatch') : t('clock_timer')}
                            </div>
                        </div>
                    </div>

                    <div className="mt-10 space-y-6">
                        {mode === 'timer' && countdownRemaining === null && (
                            <div className="flex flex-col items-center gap-3">
                                <label className="text-[10px] uppercase tracking-[0.2em] text-zinc-500 font-black">
                                    {t('timer_set')} (Seconds)
                                </label>
                                <input
                                    type="number"
                                    value={countdownInput}
                                    onChange={(e) => setCountdownInput(e.target.value)}
                                    placeholder="60"
                                    className="w-full max-w-[200px] bg-zinc-50 dark:bg-black border-2 border-zinc-100 dark:border-zinc-800 rounded-2xl px-6 py-4 text-center text-2xl text-zinc-900 dark:text-white font-black font-mono focus:border-teal-500 shadow-inner outline-none transition-all"
                                />
                            </div>
                        )}

                        <div className="flex gap-3 pt-4">
                            <button
                                onClick={() => {
                                    if (mode === 'timer' && countdownRemaining === null) {
                                        startTimer(parseInt(countdownInput) || 60);
                                    } else {
                                        setTimerActive(!timerActive);
                                    }
                                }}
                                className={`flex-1 py-5 rounded-[2rem] font-black uppercase tracking-widest text-sm transition-all active:scale-95 shadow-xl ${timerActive ? 'bg-rose-500 text-white shadow-rose-500/20' : 'bg-teal-600 text-white shadow-teal-500/20'
                                    }`}
                            >
                                {timerActive ? t('timer_stop') : (mode === 'stopwatch' && duration > 0 ? t('timer_resume') : t('timer_start'))}
                            </button>

                            {mode === 'stopwatch' && (
                                <button
                                    onClick={addLap}
                                    disabled={!timerActive}
                                    className="px-8 rounded-[2rem] border-2 border-zinc-100 dark:border-zinc-800 text-zinc-500 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-white hover:bg-zinc-50 dark:hover:bg-zinc-800/50 disabled:opacity-20 transition-all font-black uppercase text-[10px] tracking-widest"
                                >
                                    {t('timer_lap')}
                                </button>
                            )}
                        </div>

                        <button
                            onClick={resetClock}
                            className="w-full text-[10px] text-zinc-400 hover:text-rose-500 uppercase tracking-[0.3em] font-black pt-6 transition-colors"
                        >
                            {t('timer_reset')}
                        </button>
                    </div>
                </Card>

                {mode === 'stopwatch' && laps.length > 0 && (
                    <Card className="p-8 bg-white dark:bg-zinc-900/50 border border-zinc-200 dark:border-zinc-800 animate-in fade-in slide-in-from-bottom-4 shadow-sm rounded-[2rem]">
                        <h4 className="text-[10px] font-black text-zinc-400 dark:text-zinc-500 uppercase tracking-[0.4em] mb-6 flex items-center gap-4">
                            Laps History
                            <div className="h-px flex-1 bg-zinc-100 dark:bg-zinc-800"></div>
                        </h4>
                        <div className="space-y-4 max-h-48 overflow-y-auto pr-3 scrollbar-thin scrollbar-thumb-zinc-200 dark:scrollbar-thumb-zinc-700">
                            {laps.map((time, i) => (
                                <div key={i} className="flex justify-between items-center text-sm border-b border-zinc-50 dark:border-zinc-800/50 pb-3 last:border-0 last:pb-0">
                                    <span className="text-zinc-400 dark:text-zinc-500 font-black text-[10px]">#{laps.length - i}</span>
                                    <span className="text-teal-600 dark:text-teal-400 font-mono font-black">{formatTime(time)}</span>
                                </div>
                            ))}
                        </div>
                    </Card>
                )}
            </div>
        </div>
    );
};
