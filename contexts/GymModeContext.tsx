import React, { createContext, useContext, useState, useEffect } from 'react';
import { KeepAwake } from '@capacitor-community/keep-awake';
import { Capacitor } from '@capacitor/core';

interface GymModeContextType {
    isGymMode: boolean;
    enableGymMode: () => Promise<void>;
    disableGymMode: () => Promise<void>;
    toggleGymMode: () => void;
}

const GymModeContext = createContext<GymModeContextType | undefined>(undefined);

export const GymModeProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const [isGymMode, setIsGymMode] = useState(false);

    const enableGymMode = async () => {
        setIsGymMode(true);

        // Keep screen awake (mobile only)
        if (Capacitor.isNativePlatform()) {
            try {
                await KeepAwake.keepAwake();
                console.log('Screen will stay awake');
            } catch (error) {
                console.error('Failed to keep screen awake:', error);
            }
        }
    };

    const disableGymMode = async () => {
        setIsGymMode(false);

        // Allow screen to sleep
        if (Capacitor.isNativePlatform()) {
            try {
                await KeepAwake.allowSleep();
                console.log('Screen can now sleep');
            } catch (error) {
                console.error('Failed to allow screen sleep:', error);
            }
        }
    };

    const toggleGymMode = () => {
        if (isGymMode) {
            disableGymMode();
        } else {
            enableGymMode();
        }
    };

    return (
        <GymModeContext.Provider value={{ isGymMode, enableGymMode, disableGymMode, toggleGymMode }}>
            {children}
        </GymModeContext.Provider>
    );
};

export const useGymMode = () => {
    const context = useContext(GymModeContext);
    if (!context) {
        throw new Error('useGymMode must be used within GymModeProvider');
    }
    return context;
};
