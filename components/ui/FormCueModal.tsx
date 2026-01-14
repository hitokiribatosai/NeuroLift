import React from 'react';
import { Modal } from './Modal';
import { FormCue } from '../../utils/formCues';

interface FormCueModalProps {
    isOpen: boolean;
    onClose: () => void;
    cues: FormCue | null;
}

export const FormCueModal: React.FC<FormCueModalProps> = ({
    isOpen,
    onClose,
    cues
}) => {
    if (!cues) return null;

    return (
        <Modal isOpen={isOpen} onClose={onClose}>
            <div className="w-full max-w-lg bg-zinc-950 border border-zinc-800 rounded-3xl p-6 md:p-8 relative overflow-hidden">
                {/* Decoration */}
                <div className="absolute top-0 right-0 w-32 h-32 bg-teal-500/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2"></div>

                <div className="flex items-center justify-between mb-8 relative z-10">
                    <h2 className="text-2xl font-black text-white uppercase tracking-tighter w-3/4">
                        {cues.exerciseName}
                    </h2>
                    <button onClick={onClose} className="p-2 bg-zinc-900 rounded-full text-zinc-400 hover:text-white transition-colors">
                        <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                    </button>
                </div>

                <div className="space-y-8 relative z-10">
                    {/* Setup */}
                    <div>
                        <h3 className="text-[10px] font-black text-teal-500 uppercase tracking-widest mb-3 flex items-center gap-2">
                            <span className="w-1.5 h-1.5 rounded-full bg-teal-500"></span>
                            Setup
                        </h3>
                        <ul className="space-y-2">
                            {cues.setup.map((cue, i) => (
                                <li key={i} className="text-zinc-300 text-sm font-medium pl-4 border-l-2 border-zinc-800">
                                    {cue}
                                </li>
                            ))}
                        </ul>
                    </div>

                    {/* Execution */}
                    <div>
                        <h3 className="text-[10px] font-black text-blue-500 uppercase tracking-widest mb-3 flex items-center gap-2">
                            <span className="w-1.5 h-1.5 rounded-full bg-blue-500"></span>
                            Execution
                        </h3>
                        <ul className="space-y-2">
                            {cues.execution.map((cue, i) => (
                                <li key={i} className="text-zinc-300 text-sm font-medium pl-4 border-l-2 border-zinc-800">
                                    {cue}
                                </li>
                            ))}
                        </ul>
                    </div>

                    {/* Mistakes */}
                    <div className="bg-rose-500/5 border border-rose-500/10 rounded-2xl p-4">
                        <h3 className="text-[10px] font-black text-rose-500 uppercase tracking-widest mb-3 flex items-center gap-2">
                            <span className="w-1.5 h-1.5 rounded-full bg-rose-500"></span>
                            Common Mistakes
                        </h3>
                        <ul className="space-y-2">
                            {cues.mistakes.map((cue, i) => (
                                <li key={i} className="text-rose-200/80 text-sm font-medium flex items-start gap-2">
                                    <span className="text-rose-500 font-bold">×</span>
                                    {cue}
                                </li>
                            ))}
                        </ul>
                    </div>
                </div>

            </div>
        </Modal>
    );
};
