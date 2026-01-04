import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';

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
    countdownInput: string;
    setCountdownInput: (input: string) => void;
    laps: number[];
    addLap: () => void;
    resetClock: () => void;
    startTimer: (secs: number) => void;
}

const ClockContext = createContext<ClockContextType | undefined>(undefined);

export const ClockProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
    const [mode, setMode] = useState<ClockMode>('stopwatch');
    const [timerActive, setTimerActive] = useState(false);
    const [duration, setDuration] = useState(0);
    const [countdownRemaining, setCountdownRemaining] = useState<number | null>(null);
    const [countdownInput, setCountdownInput] = useState('60');
    const [laps, setLaps] = useState<number[]>([]);

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
                    alert("Time's up!");
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

    const startTimer = (secs: number) => {
        setCountdownRemaining(secs);
        setTimerActive(true);
        setMode('timer');
    };

    return (
        <ClockContext.Provider value={{
            mode, setMode,
            timerActive, setTimerActive,
            duration, setDuration,
            countdownRemaining, setCountdownRemaining,
            countdownInput, setCountdownInput,
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
