import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { playNotificationSound } from '../utils/audio';
import { safeStorage } from '../utils/storage';

type ClockMode = 'stopwatch' | 'timer';

interface ClockContextType {
    mode: ClockMode;
    setMode: (mode: ClockMode) => void;
    timerActive: boolean;
    setTimerActive: (active: boolean) => void;
    duration: number; // For stopwatch (counts up)
    setDuration: React.Dispatch<React.SetStateAction<number>>;
    countdownRemaining: number | null; // For timer (counts down)
    setCountdownRemaining: React.Dispatch<React.SetStateAction<number | null>>;
    countdownMinutes: string;
    setCountdownMinutes: (mins: string) => void;
    countdownSeconds: string;
    setCountdownSeconds: (secs: string) => void;
    laps: number[];
    addLap: () => void;
    resetClock: () => void;
    startTimer: (mins: number, secs: number) => void;
}

const ClockContext = createContext<ClockContextType | undefined>(undefined);

export const ClockProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
    const [mode, setMode] = useState<ClockMode>(() => {
        return (safeStorage.getItem('neuroLift_clock_mode') as ClockMode) || 'stopwatch';
    });
    const [timerActive, setTimerActive] = useState(() => {
        return safeStorage.getItem('neuroLift_clock_active') === 'true';
    });
    const [duration, setDuration] = useState(() => {
        const saved = safeStorage.getItem('neuroLift_clock_duration');
        return saved ? parseInt(saved) : 0;
    });
    const [countdownRemaining, setCountdownRemaining] = useState<number | null>(() => {
        const saved = safeStorage.getItem('neuroLift_clock_countdown');
        return saved ? parseInt(saved) : null;
    });
    const [countdownMinutes, setCountdownMinutes] = useState(() => {
        return safeStorage.getItem('neuroLift_clock_mins') || '01';
    });
    const [countdownSeconds, setCountdownSeconds] = useState(() => {
        return safeStorage.getItem('neuroLift_clock_secs') || '00';
    });
    const [laps, setLaps] = useState<number[]>(() => {
        return safeStorage.getParsed<number[]>('neuroLift_clock_laps', []);
    });

    useEffect(() => {
        safeStorage.setItem('neuroLift_clock_mode', mode);
        safeStorage.setItem('neuroLift_clock_active', timerActive.toString());
        safeStorage.setItem('neuroLift_clock_duration', duration.toString());
        safeStorage.setItem('neuroLift_clock_countdown', countdownRemaining?.toString() || '');
        safeStorage.setItem('neuroLift_clock_mins', countdownMinutes);
        safeStorage.setItem('neuroLift_clock_secs', countdownSeconds);
        safeStorage.setItem('neuroLift_clock_laps', JSON.stringify(laps));
    }, [mode, timerActive, duration, countdownRemaining, countdownMinutes, countdownSeconds, laps]);

    useEffect(() => {
        let interval: any;
        if (timerActive) {
            interval = setInterval(() => {
                if (mode === 'stopwatch') {
                    setDuration(d => d + 1);
                } else if (countdownRemaining !== null && countdownRemaining > 0) {
                    setCountdownRemaining(r => (r !== null ? r - 1 : 0));
                } else if (countdownRemaining === 0) {
                    setTimerActive(false);
                    setCountdownRemaining(null);
                    playNotificationSound();
                }
            }, 1000);
        }
        return () => clearInterval(interval);
    }, [timerActive, mode, countdownRemaining]);

    const addLap = () => {
        if (mode === 'stopwatch') {
            setLaps(prev => [duration, ...prev]);
        }
    };

    const resetClock = () => {
        setDuration(0);
        setLaps([]);
        setCountdownRemaining(null);
        setTimerActive(false);
    };

    const startTimer = (mins: number, secs: number) => {
        const totalSecs = (mins * 60) + secs;
        if (totalSecs > 0) {
            setCountdownRemaining(totalSecs);
            setTimerActive(true);
            setMode('timer');
        }
    };

    return (
        <ClockContext.Provider value={{
            mode, setMode,
            timerActive, setTimerActive,
            duration, setDuration,
            countdownRemaining, setCountdownRemaining,
            countdownMinutes, setCountdownMinutes,
            countdownSeconds, setCountdownSeconds,
            laps, addLap,
            resetClock,
            startTimer
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
