import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { playNotificationSound } from '../utils/audio';
import { safeStorage } from '../utils/storage';

type ClockMode = 'stopwatch' | 'timer';

interface ClockContextType {
    // Workout Timer
    workoutDuration: number;
    setWorkoutDuration: React.Dispatch<React.SetStateAction<number>>;
    isWorkoutActive: boolean;
    setIsWorkoutActive: (active: boolean) => void;
    resetWorkout: () => void;

    // Utility Clock
    mode: ClockMode;
    setMode: (mode: ClockMode) => void;
    timerActive: boolean;
    setTimerActive: (active: boolean) => void;
    duration: number; // For stopwatch (counts up)
    setDuration: React.Dispatch<React.SetStateAction<number>>;
    countdownRemaining: number | null; // For timer (counts down)
    setCountdownRemaining: React.Dispatch<React.SetStateAction<number | null>>;

    // Shared / Helpers
    countdownMinutes: string;
    setCountdownMinutes: (mins: string) => void;
    countdownSeconds: string;
    setCountdownSeconds: (secs: string) => void;
    laps: number[];
    addLap: () => void;
    resetClock: () => void;
    startTimer: (mins: number, secs: number) => void;
    startRestTimer: (seconds: number) => void;
    stopRestTimer: () => void;
    restRemaining: number | null;
    setRestRemaining: (seconds: number | null) => void;
}

const ClockContext = createContext<ClockContextType | undefined>(undefined);

export const ClockProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
    // --- WORKOUT TIMER STATE (Tracker) ---
    const [workoutStartTime, setWorkoutStartTime] = useState<number | null>(() => {
        const saved = safeStorage.getItem('neuroLift_workout_start_time');
        return saved ? parseInt(saved) : null;
    });
    const [pausedDuration, setPausedDuration] = useState(() => {
        const saved = safeStorage.getItem('neuroLift_workout_paused_duration');
        return saved ? parseInt(saved) : 0;
    });
    // We still expose a duration number for UI, but it's derived/updated via effect
    const [workoutDuration, setWorkoutDuration] = useState(0);

    const [isWorkoutActive, setIsWorkoutActive] = useState(() => {
        const active = safeStorage.getItem('neuroLift_workout_active') === 'true';
        // If active on load, restore start time if missing (fallback)
        if (active && !safeStorage.getItem('neuroLift_workout_start_time')) {
            // If we lost the start time but think we are active, reset to avoid bugs
            return false;
        }
        return active;
    });

    // --- UTILITY CLOCK STATE (Clock Tab) ---
    const [utilityMode, setUtilityMode] = useState<ClockMode>(() => {
        return (safeStorage.getItem('neuroLift_clock_mode') as ClockMode) || 'stopwatch';
    });
    const [isUtilityActive, setIsUtilityActive] = useState(() => {
        return safeStorage.getItem('neuroLift_clock_active') === 'true';
    });
    const [utilityDuration, setUtilityDuration] = useState(() => { // Stopwatch
        const saved = safeStorage.getItem('neuroLift_clock_duration');
        return saved ? parseInt(saved) : 0;
    });
    const [utilityCountdown, setUtilityCountdown] = useState<number | null>(() => { // Timer
        const saved = safeStorage.getItem('neuroLift_clock_countdown');
        return saved ? parseInt(saved) : null;
    });

    // UI Helpers for Timer Input
    const [countdownMinutes, setCountdownMinutes] = useState(() => {
        return safeStorage.getItem('neuroLift_clock_mins') || '01';
    });
    const [countdownSeconds, setCountdownSeconds] = useState(() => {
        return safeStorage.getItem('neuroLift_clock_secs') || '00';
    });
    const [laps, setLaps] = useState<number[]>(() => {
        return safeStorage.getParsed<number[]>('neuroLift_clock_laps', []);
    });

    // Rest Timer State (Missing previously)
    const [restEndTime, setRestEndTime] = useState<number | null>(() => {
        const saved = safeStorage.getItem('neuroLift_rest_end_time');
        return saved ? parseInt(saved) : null;
    });
    const [restRemaining, setRestRemaining] = useState<number | null>(null);

    // Initial Registration
    useEffect(() => {
        // Platform check removed
    }, []);

    // Persistence
    useEffect(() => {
        if (workoutStartTime) {
            safeStorage.setItem('neuroLift_workout_start_time', workoutStartTime.toString());
        } else {
            safeStorage.removeItem('neuroLift_workout_start_time');
        }
        safeStorage.setItem('neuroLift_workout_paused_duration', pausedDuration.toString());
        safeStorage.setItem('neuroLift_workout_active', isWorkoutActive.toString());

        safeStorage.setItem('neuroLift_clock_mode', utilityMode);
        safeStorage.setItem('neuroLift_clock_active', isUtilityActive.toString());
        safeStorage.setItem('neuroLift_clock_duration', utilityDuration.toString());
        safeStorage.setItem('neuroLift_clock_countdown', utilityCountdown?.toString() || '');

        safeStorage.setItem('neuroLift_clock_mins', countdownMinutes);
        safeStorage.setItem('neuroLift_clock_secs', countdownSeconds);
        safeStorage.setItem('neuroLift_clock_laps', JSON.stringify(laps));

        if (restEndTime) {
            safeStorage.setItem('neuroLift_rest_end_time', restEndTime.toString());
        } else {
            safeStorage.removeItem('neuroLift_rest_end_time');
        }
    }, [workoutStartTime, pausedDuration, isWorkoutActive, utilityMode, isUtilityActive, utilityDuration, utilityCountdown, countdownMinutes, countdownSeconds, laps, restEndTime]);

    // Visibility Change Handler (for background resume)
    useEffect(() => {
        const handleVisibilityChange = () => {
            if (document.visibilityState === 'visible') {
                const now = Date.now();
                // Workout update
                if (isWorkoutActive && workoutStartTime) {
                    const totalElapsed = Math.floor((now - workoutStartTime) / 1000);
                    setWorkoutDuration(pausedDuration + totalElapsed);
                }
                // Rest timer update
                if (restEndTime) {
                    const remaining = Math.max(0, Math.ceil((restEndTime - now) / 1000));
                    setRestRemaining(remaining > 0 ? remaining : null);
                    if (remaining <= 0) setRestEndTime(null);
                }
            }
        };
        document.addEventListener('visibilitychange', handleVisibilityChange);
        return () => document.removeEventListener('visibilitychange', handleVisibilityChange);
    }, [isWorkoutActive, workoutStartTime, pausedDuration, restEndTime]);

    // Timer Logic
    useEffect(() => {
        let interval: any;
        const anyTimerActive = (isWorkoutActive && workoutStartTime) ||
            isUtilityActive ||
            (restEndTime !== null);

        if (anyTimerActive) {
            interval = setInterval(() => {
                const now = Date.now();

                // Workout Timer (Timestamp based)
                if (isWorkoutActive && workoutStartTime) {
                    const totalElapsed = Math.floor((now - workoutStartTime) / 1000);
                    setWorkoutDuration(pausedDuration + totalElapsed);
                }

                // Utility Clock
                if (isUtilityActive) {
                    if (utilityMode === 'stopwatch') {
                        setUtilityDuration(d => d + 1);
                    } else if (utilityCountdown !== null && utilityCountdown > 0) {
                        setUtilityCountdown(r => (r !== null ? r - 1 : 0));
                    } else if (utilityCountdown === 0) {
                        setIsUtilityActive(false);
                        setUtilityCountdown(null);
                        playNotificationSound();
                    }
                }

                // Rest Timer
                if (restEndTime) {
                    const remaining = Math.max(0, Math.ceil((restEndTime - now) / 1000));
                    if (remaining > 0) {
                        setRestRemaining(remaining);
                    } else {
                        setRestRemaining(null);
                        setRestEndTime(null);
                        playNotificationSound();
                    }
                }
            }, 1000);
        }
        return () => clearInterval(interval);
    }, [isWorkoutActive, workoutStartTime, pausedDuration, isUtilityActive, utilityMode, utilityCountdown, restEndTime]);

    const addLap = () => {
        if (utilityMode === 'stopwatch') {
            setLaps(prev => [utilityDuration, ...prev]);
        }
    };

    const resetClock = () => { // Resets Utility Clock
        setUtilityDuration(0);
        setLaps([]);
        setUtilityCountdown(null);
        setIsUtilityActive(false);
    };

    const resetWorkout = () => {
        setWorkoutDuration(0);
        setPausedDuration(0);
        setWorkoutStartTime(null);
        setIsWorkoutActive(false);
        safeStorage.removeItem('neuroLift_workout_start_time');
        safeStorage.removeItem('neuroLift_workout_paused_duration');
    };

    const startTimer = (mins: number, secs: number) => {
        const totalSecs = (mins * 60) + secs;
        if (totalSecs > 0) {
            setUtilityCountdown(totalSecs);
            setIsUtilityActive(true);
            setUtilityMode('timer');
        }
    };

    const startRestTimer = (seconds: number) => {
        const now = Date.now();
        const endTime = now + (seconds * 1000);
        setRestEndTime(endTime);
        setRestRemaining(seconds);
    };

    const stopRestTimer = () => {
        setRestEndTime(null);
        setRestRemaining(null);
        safeStorage.removeItem('neuroLift_rest_end_time');
    };

    const handleSetIsWorkoutActive = (active: boolean) => {
        if (active) {
            if (!workoutStartTime) {
                setWorkoutStartTime(Date.now());
            } else {
                // Resuming? (If you had pause logic, you'd adjust start time here. 
                // For now assuming simple start/stop means reset or continue)
            }
        }
        // Current logic seems to be start = active=true. 
        // If we STOP, do we reset? The original code had resetWorkout separately.
        setIsWorkoutActive(active);
    };

    return (
        <ClockContext.Provider value={{
            // Workout State
            workoutDuration,
            setWorkoutDuration, // exposed but mostly managed internally
            isWorkoutActive,
            setIsWorkoutActive: handleSetIsWorkoutActive,
            resetWorkout,

            // Utility Clock State
            mode: utilityMode, setMode: setUtilityMode,
            timerActive: isUtilityActive, setTimerActive: setIsUtilityActive,
            duration: utilityDuration, setDuration: setUtilityDuration,
            countdownRemaining: utilityCountdown, setCountdownRemaining: setUtilityCountdown,

            // Shared/UI
            countdownMinutes, setCountdownMinutes,
            countdownSeconds, setCountdownSeconds,
            laps, addLap,
            resetClock,
            startTimer,

            // Rest Timer
            restRemaining,
            setRestRemaining,
            startRestTimer,
            stopRestTimer
        }}>
            {children}
        </ClockContext.Provider>
    );
};

export const useClock = () => {
    const context = useContext(ClockContext);
    if (context === undefined) {
        throw new Error('useClock must be used within a ClockProvider');
    }
    return context;
};
