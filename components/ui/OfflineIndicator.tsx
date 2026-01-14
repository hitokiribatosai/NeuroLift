import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

export const OfflineIndicator: React.FC = () => {
    const [isOnline, setIsOnline] = useState(navigator.onLine);
    const [showNotification, setShowNotification] = useState(false);

    useEffect(() => {
        const handleOnline = () => {
            setIsOnline(true);
            setShowNotification(true);
            setTimeout(() => setShowNotification(false), 3000);
        };

        const handleOffline = () => {
            setIsOnline(false);
            setShowNotification(true);
        };

        window.addEventListener('online', handleOnline);
        window.addEventListener('offline', handleOffline);

        return () => {
            window.removeEventListener('online', handleOnline);
            window.removeEventListener('offline', handleOffline);
        };
    }, []);

    return (
        <AnimatePresence>
            {showNotification && (
                <motion.div
                    initial={{ y: -100, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    exit={{ y: -100, opacity: 0 }}
                    className={`fixed top-20 left-1/2 -translate-x-1/2 z-50 px-6 py-3 rounded-full font-bold text-sm shadow-lg ${isOnline
                            ? 'bg-green-500 text-white'
                            : 'bg-orange-500 text-white'
                        }`}
                >
                    {isOnline ? '🌐 Back Online' : '📴 Offline Mode - Your data is safe'}
                </motion.div>
            )}

            {!isOnline && !showNotification && (
                <div className="fixed bottom-4 right-4 z-40 px-3 py-2 bg-zinc-800 border border-zinc-700 rounded-lg text-xs text-zinc-400 flex items-center gap-2">
                    <div className="w-2 h-2 bg-orange-500 rounded-full animate-pulse"></div>
                    Offline
                </div>
            )}
        </AnimatePresence>
    );
};
