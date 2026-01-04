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
                <Card className="p-8 bg-zinc-900/80 mb-8">
                    <div className="flex justify-center gap-4 mb-8">
                        <button
                            onClick={() => { setMode('stopwatch'); setTimerActive(false); }}
                            className={`px-4 py-2 rounded-lg text-xs font-bold uppercase tracking-widest transition-all ${mode === 'stopwatch' ? 'bg-teal-500 text-black' : 'bg-zinc-800 text-zinc-500 hover:text-white'}`}
                        >
                            {t('clock_stopwatch')}
                        </button>
                        <button
                            onClick={() => { setMode('timer'); setTimerActive(false); }}
                            className={`px-4 py-2 rounded-lg text-xs font-bold uppercase tracking-widest transition-all ${mode === 'timer' ? 'bg-teal-500 text-black' : 'bg-zinc-800 text-zinc-500 hover:text-white'}`}
                        >
                            {t('clock_timer')}
                        </button>
                    </div>

                    <div className="relative flex flex-col items-center justify-center py-10">
                        <div className="absolute inset-0 bg-teal-500/5 rounded-full blur-3xl"></div>
                        <div className="relative text-center">
                            <div className="text-7xl font-mono font-bold text-white tracking-widest">
                                {formatTime(currentDisplay)}
                            </div>
                            <div className="text-[10px] text-zinc-500 uppercase tracking-[0.3em] mt-4 font-bold">
                                {mode === 'stopwatch' ? t('clock_stopwatch') : t('clock_timer')}
                            </div>
                        </div>
                    </div>

                    <div className="mt-10 space-y-6">
                        {mode === 'timer' && countdownRemaining === null && (
                            <div className="flex gap-2">
                                <input
                                    type="number"
                                    value={countdownInput}
                                    onChange={(e) => setCountdownInput(e.target.value)}
                                    placeholder="Seconds"
                                    className="flex-1 bg-black border border-zinc-700 rounded-lg px-4 py-3 text-white focus:border-teal-500 outline-none"
                                />
                                <SpotlightButton onClick={() => startTimer(parseInt(countdownInput))} disabled={!countdownInput}>
                                    {t('timer_set')}
                                </SpotlightButton>
                            </div>
                        )}

                        <div className="flex gap-3">
                            <button
                                onClick={() => setTimerActive(!timerActive)}
                                className={`flex-1 py-4 rounded-xl font-bold transition-all active:scale-95 ${timerActive ? 'bg-amber-500/20 text-amber-500 border border-amber-500/50' : 'bg-emerald-500/20 text-emerald-500 border border-emerald-500/50'
                                    }`}
                            >
                                {timerActive ? t('timer_stop') : (mode === 'stopwatch' && duration > 0 ? t('timer_resume') : t('timer_start'))}
                            </button>

                            {mode === 'stopwatch' && (
                                <button
                                    onClick={addLap}
                                    disabled={!timerActive}
                                    className="px-6 rounded-xl border border-zinc-700 text-zinc-400 hover:text-white disabled:opacity-20 translate-y-0 active:translate-y-1"
                                >
                                    {t('timer_lap')}
                                </button>
                            )}
                        </div>

                        <button
                            onClick={resetClock}
                            className="w-full text-xs text-zinc-500 hover:text-red-400 uppercase tracking-widest font-bold pt-4"
                        >
                            {t('timer_reset')}
                        </button>
                    </div>
                </Card>

                {mode === 'stopwatch' && laps.length > 0 && (
                    <Card className="p-6 bg-zinc-900/50 border-zinc-800 animate-in fade-in slide-in-from-bottom-4">
                        <h4 className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest mb-4">Laps History</h4>
                        <div className="space-y-2 max-h-48 overflow-y-auto pr-2 scrollbar-thin scrollbar-thumb-zinc-700">
                            {laps.map((time, i) => (
                                <div key={i} className="flex justify-between items-center text-sm border-b border-zinc-800/50 pb-2">
                                    <span className="text-zinc-500 font-mono">#{laps.length - i}</span>
                                    <span className="text-teal-400 font-mono font-bold">{formatTime(time)}</span>
                                </div>
                            ))}
                        </div>
                    </Card>
                )}
            </div>
        </div>
    );
};
