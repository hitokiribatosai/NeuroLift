import React, { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { SpotlightButton } from './SpotlightButton';

interface ConfirmModalProps {
    isOpen: boolean;
    title: string;
    message: string;
    confirmLabel?: string;
    cancelLabel?: string;
    onConfirm: () => void;
    onCancel: () => void;
    isDestructive?: boolean;
}

export const ConfirmModal: React.FC<ConfirmModalProps> = ({
    isOpen,
    title,
    message,
    confirmLabel = 'Confirm',
    cancelLabel = 'Cancel',
    onConfirm,
    onCancel,
    isDestructive = false
}) => {
    const [mounted, setMounted] = useState(false);

    useEffect(() => {
        setMounted(true);
        if (isOpen) {
            document.body.style.overflow = 'hidden';
        }
        return () => {
            document.body.style.overflow = 'unset';
        };
    }, [isOpen]);

    if (!mounted) return null;

    return createPortal(
        <AnimatePresence>
            {isOpen && (
                <div className="fixed inset-0 z-[999] flex items-center justify-center p-4">
                    {/* Backdrop */}
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        onClick={onCancel}
                        className="absolute inset-0 bg-black/80 backdrop-blur-md"
                        style={{ WebkitBackdropFilter: 'blur(12px)' }}
                    />

                    {/* Modal Content */}
                    <motion.div
                        initial={{ opacity: 0, scale: 0.9, y: 20 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.9, y: 20 }}
                        className="relative w-full max-w-md rounded-[3rem] border border-zinc-800 bg-zinc-950 p-10 shadow-3xl overflow-hidden"
                    >
                        {/* Top Border Accent */}
                        <div className={`absolute top-0 left-0 w-full h-1.5 ${isDestructive ? 'bg-rose-500' : 'bg-teal-500'}`}></div>

                        <div className="flex items-center gap-4 mb-6">
                            <div className={`w-3 h-10 rounded-full ${isDestructive ? 'bg-rose-500' : 'bg-teal-500'}`}></div>
                            <h3 className="text-2xl font-black text-white uppercase tracking-tighter leading-tight">
                                {title}
                            </h3>
                        </div>

                        <p className="text-zinc-400 text-sm font-medium leading-relaxed mb-10">
                            {message}
                        </p>

                        <div className="flex flex-col gap-3">
                            <SpotlightButton
                                onClick={onConfirm}
                                variant={isDestructive ? 'secondary' : 'primary'}
                                spotlightColor={isDestructive ? 'rgba(244, 63, 94, 0.2)' : 'rgba(20, 184, 166, 0.2)'}
                                className={`w-full py-4 text-xs font-black uppercase tracking-widest shadow-lg ${isDestructive
                                    ? 'bg-rose-500/10 text-rose-400 border-rose-500/20'
                                    : 'shadow-teal-500/10'
                                    }`}
                            >
                                {confirmLabel}
                            </SpotlightButton>

                            <button
                                onClick={onCancel}
                                className="w-full py-4 text-[10px] text-zinc-500 hover:text-white font-black uppercase tracking-[0.3em] transition-all bg-zinc-900/40 border border-zinc-900 rounded-2xl"
                            >
                                {cancelLabel}
                            </button>
                        </div>
                    </motion.div>
                </div>
            )}
        </AnimatePresence>,
        document.body
    );
};
