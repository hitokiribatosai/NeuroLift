import React, { useState } from 'react';
import { calculatePlates, DEFAULT_PLATE_CONFIGS, PlateConfig } from '../../utils/plateCalculator';
import { Modal } from './Modal';

interface PlateCalculatorProps {
    isOpen: boolean;
    onClose: () => void;
    initialWeight?: number;
}

const PlateVisual = ({ weight }: { weight: number }) => {
    const colors: Record<number, string> = {
        25: 'bg-red-500',
        20: 'bg-blue-500',
        15: 'bg-yellow-500',
        10: 'bg-green-500',
        5: 'bg-white',
        2.5: 'bg-zinc-400',
        1.25: 'bg-zinc-600',
        45: 'bg-blue-600', // lbs standard
        35: 'bg-yellow-500',
    };

    // Scale height based on weight
    const height = Math.max(40, Math.min(weight * 3 + 20, 100));

    return (
        <div
            className={`${colors[weight] || 'bg-zinc-500'} rounded-sm border-2 border-zinc-900 flex items-center justify-center text-[10px] md:text-xs font-black text-zinc-900 shadow-xl`}
            style={{ width: '24px', height: `${height}px` }}
        >
            <span className="-rotate-90">{weight}</span>
        </div>
    );
};

export const PlateCalculator: React.FC<PlateCalculatorProps> = ({
    isOpen,
    onClose,
    initialWeight = 0
}) => {
    const [targetWeight, setTargetWeight] = useState(initialWeight || 60);
    const [unit, setUnit] = useState<'kg' | 'lbs'>('kg');
    const config = DEFAULT_PLATE_CONFIGS[unit];
    const solution = calculatePlates(targetWeight, config);

    return (
        <Modal isOpen={isOpen} onClose={onClose}>
            <div className="w-full max-w-2xl bg-zinc-950 border border-zinc-800 rounded-3xl p-6 md:p-8 relative overflow-hidden">
                {/* Background Accent */}
                <div className="absolute top-0 left-0 w-full h-2 bg-teal-500"></div>

                <div className="flex items-center justify-between mb-8">
                    <h2 className="text-2xl font-black text-white uppercase tracking-tighter flex items-center gap-3">
                        <span className="w-2 h-8 bg-teal-500 rounded-full"></span>
                        Plate Calculator
                    </h2>
                    <button onClick={onClose} className="text-zinc-400 hover:text-white transition-colors">
                        <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                    </button>
                </div>

                {/* Input */}
                <div className="mb-10">
                    <label className="text-[10px] font-black text-zinc-500 uppercase tracking-widest block mb-3">Target Weight</label>
                    <div className="flex gap-4">
                        <input
                            type="number"
                            value={targetWeight || ''}
                            onChange={(e) => setTargetWeight(Number(e.target.value))}
                            placeholder="0"
                            className="flex-1 bg-zinc-900 border border-zinc-800 rounded-2xl px-6 py-4 text-white text-4xl font-black focus:border-teal-500 outline-none transition-all placeholder-zinc-800"
                            step={unit === 'kg' ? 2.5 : 5}
                        />
                        <div className="flex bg-zinc-900 border border-zinc-800 rounded-2xl overflow-hidden p-1">
                            <button
                                onClick={() => setUnit('kg')}
                                className={`px-6 py-2 rounded-xl font-black text-sm uppercase tracking-wider transition-all ${unit === 'kg' ? 'bg-teal-500 text-white shadow-lg shadow-teal-500/20' : 'text-zinc-500 hover:text-white'
                                    }`}
                            >
                                KG
                            </button>
                            <button
                                onClick={() => setUnit('lbs')}
                                className={`px-6 py-2 rounded-xl font-black text-sm uppercase tracking-wider transition-all ${unit === 'lbs' ? 'bg-teal-500 text-white shadow-lg shadow-teal-500/20' : 'text-zinc-500 hover:text-white'
                                    }`}
                            >
                                LBS
                            </button>
                        </div>
                    </div>
                </div>

                {/* Visual representation */}
                {targetWeight > 0 && (
                    <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
                        <div className="mb-8">
                            <div className="flex items-center justify-center gap-1 min-h-[140px] px-2 py-8 bg-zinc-900/50 rounded-3xl border border-zinc-800/50 relative">
                                {/* Bar Center Line */}
                                <div className="absolute top-1/2 left-0 w-full h-3 bg-zinc-700 -z-10 rounded-full"></div>
                                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-4 h-4 rounded-full bg-zinc-600 border-2 border-zinc-500 z-0"></div>

                                {/* Left side plates */}
                                <div className="flex gap-1 items-center flex-row-reverse mx-2 md:mx-4">
                                    {solution.platesPerSide.map((plate, i) => (
                                        <PlateVisual key={`left-${i}`} weight={plate} />
                                    ))}
                                </div>

                                {/* Center Gap for Barbell Text */}
                                <div className="w-16 md:w-24 text-center z-10 bg-zinc-800 px-2 py-1 rounded-lg border border-zinc-700">
                                    <span className="text-[10px] font-black text-zinc-400 uppercase tracking-widest block">Bar</span>
                                    <span className="text-sm font-black text-white">{config.barWeight}{unit}</span>
                                </div>

                                {/* Right side plates */}
                                <div className="flex gap-1 items-center mx-2 md:mx-4">
                                    {solution.platesPerSide.slice().reverse().map((plate, i) => (
                                        <PlateVisual key={`right-${i}`} weight={plate} />
                                    ))}
                                </div>
                            </div>
                        </div>

                        {/* Instructions */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                            <div className="bg-zinc-900/50 border border-zinc-800 rounded-2xl p-5">
                                <p className="text-[10px] font-black text-zinc-500 uppercase tracking-widest mb-2">Load per side</p>
                                <p className="text-white font-mono text-lg font-bold flex flex-wrap gap-2">
                                    {solution.platesPerSide.length === 0
                                        ? <span className="text-zinc-600">Empty bar</span>
                                        : solution.platesPerSide.map((p, i) => (
                                            <span key={i} className="inline-block px-2 py-1 bg-zinc-800 rounded-md border border-zinc-700">{p}</span>
                                        ))}
                                </p>
                            </div>
                            <div className="bg-teal-500/5 border border-teal-500/20 rounded-2xl p-5 flex flex-col justify-center">
                                <p className="text-[10px] font-black text-teal-600/70 uppercase tracking-widest mb-1">Total Weight</p>
                                <p className="text-3xl font-black text-white tracking-tight">{solution.totalWeight}{unit}</p>
                                {solution.message && (
                                    <p className="text-[10px] text-orange-400 mt-1 font-bold">{solution.message}</p>
                                )}
                            </div>
                        </div>
                    </div>
                )}

                {/* Quick presets */}
                <div className="mt-8">
                    <p className="text-[10px] font-black text-zinc-600 uppercase tracking-widest mb-3">Quick Presets</p>
                    <div className="grid grid-cols-4 md:grid-cols-8 gap-2">
                        {(unit === 'kg'
                            ? [40, 60, 80, 100, 120, 140, 160, 180]
                            : [95, 135, 185, 225, 275, 315, 365, 405]
                        ).map((preset) => (
                            <button
                                key={preset}
                                onClick={() => setTargetWeight(preset)}
                                className="px-2 py-3 bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 hover:border-teal-500/50 rounded-xl text-xs font-bold text-zinc-400 hover:text-white transition-all"
                            >
                                {preset}
                            </button>
                        ))}
                    </div>
                </div>
            </div>
        </Modal>
    );
};
