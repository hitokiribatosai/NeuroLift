import React, { useState, useEffect } from 'react';
import { Modal } from './Modal';
import { getSubstitutions, SubstitutionOption } from '../../utils/exerciseSubstitutions';
import { useLanguage } from '../../contexts/LanguageContext';

interface SubstitutionModalProps {
    isOpen: boolean;
    onClose: () => void;
    originalExercise: string;
    onSubstitute: (newExerciseName: string) => void;
}

export const SubstitutionModal: React.FC<SubstitutionModalProps> = ({
    isOpen,
    onClose,
    originalExercise,
    onSubstitute
}) => {
    const { language } = useLanguage();
    const [options, setOptions] = useState<SubstitutionOption[]>([]);

    useEffect(() => {
        if (isOpen && originalExercise) {
            const subs = getSubstitutions(originalExercise, language);
            setOptions(subs);
        }
    }, [isOpen, originalExercise, language]);

    return (
        <Modal isOpen={isOpen} onClose={onClose}>
            <div className="w-full max-w-lg bg-zinc-900 border border-zinc-800 rounded-3xl p-6 overflow-hidden">
                <h2 className="text-xl font-black text-white mb-6 flex items-center gap-3">
                    <span className="text-zinc-500 text-sm font-normal uppercase tracking-wide">Replace</span>
                    {originalExercise}
                </h2>

                <div className="space-y-3">
                    {options.length > 0 ? (
                        options.map((opt) => (
                            <button
                                key={opt.name}
                                onClick={() => {
                                    onSubstitute(opt.name);
                                    onClose();
                                }}
                                className="w-full bg-black/40 hover:bg-zinc-800 border border-zinc-800 hover:border-teal-500/50 p-4 rounded-xl flex items-center justify-between group transition-all"
                            >
                                <div className="text-left">
                                    <div className="font-bold text-zinc-200 group-hover:text-white mb-1 transition-colors">{opt.name}</div>
                                    <div className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest">{opt.equipment}</div>
                                </div>

                                <div className="w-8 h-8 rounded-full bg-zinc-800 group-hover:bg-teal-500 group-hover:text-white flex items-center justify-center transition-all">
                                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                                    </svg>
                                </div>
                            </button>
                        ))
                    ) : (
                        <div className="text-center py-12 text-zinc-500">
                            <p>No similar exercises found.</p>
                        </div>
                    )}
                </div>

                <button
                    onClick={onClose}
                    className="w-full mt-6 py-4 bg-zinc-800 text-zinc-400 font-bold rounded-xl hover:bg-zinc-700 hover:text-white transition-all uppercase tracking-widest text-xs"
                >
                    Cancel
                </button>
            </div>
        </Modal>
    );
};
