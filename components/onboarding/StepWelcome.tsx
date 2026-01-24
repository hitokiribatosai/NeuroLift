import React from 'react';
import { SpotlightButton } from '../ui/SpotlightButton';
import { useLanguage } from '../../contexts/LanguageContext';

interface StepWelcomeProps {
    onNext: () => void;
}

export const StepWelcome: React.FC<StepWelcomeProps> = ({ onNext }) => {
    const { t, language, setLanguage } = useLanguage();

    return (
        <div className="flex flex-col items-center justify-center h-full text-center px-6 animate-in fade-in duration-700">
            <div className="w-24 h-24 bg-teal-500 rounded-full flex items-center justify-center mb-8 shadow-[0_0_50px_rgba(20,184,166,0.5)]">
                <svg className="w-12 h-12 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M13 10V3L4 14h7v7l9-11h-7z" />
                </svg>
            </div>

            <h1 className="text-4xl md:text-5xl font-black text-white uppercase tracking-tighter mb-6">
                {t('onboarding_welcome_title_1')} <span className="text-transparent bg-clip-text bg-gradient-to-r from-teal-400 to-teal-200">{t('onboarding_welcome_title_2')}</span>
            </h1>

            <p className="text-xl text-zinc-400 max-w-md mb-12 leading-relaxed">
                {t('onboarding_welcome_subtitle')}
            </p>

            <div className="flex gap-3 mb-12">
                <button
                    onClick={() => {
                        setLanguage('en');
                        document.documentElement.dir = 'ltr';
                        document.documentElement.lang = 'en';
                    }}
                    className={`px-4 py-2 rounded-xl text-sm font-bold uppercase tracking-wider transition-all border-2 ${language === 'en' ? 'bg-teal-500 border-teal-500 text-white shadow-lg shadow-teal-500/20' : 'border-zinc-800 text-zinc-500 hover:text-white hover:border-zinc-700'}`}
                >
                    English
                </button>
                <button
                    onClick={() => {
                        setLanguage('fr');
                        document.documentElement.dir = 'ltr';
                        document.documentElement.lang = 'fr';
                    }}
                    className={`px-4 py-2 rounded-xl text-sm font-bold uppercase tracking-wider transition-all border-2 ${language === 'fr' ? 'bg-teal-500 border-teal-500 text-white shadow-lg shadow-teal-500/20' : 'border-zinc-800 text-zinc-500 hover:text-white hover:border-zinc-700'}`}
                >
                    Français
                </button>
                <button
                    onClick={() => {
                        setLanguage('ar');
                        document.documentElement.dir = 'rtl';
                        document.documentElement.lang = 'ar';
                    }}
                    className={`px-4 py-2 rounded-xl text-sm font-bold uppercase tracking-wider transition-all border-2 ${language === 'ar' ? 'bg-teal-500 border-teal-500 text-white shadow-lg shadow-teal-500/20' : 'border-zinc-800 text-zinc-500 hover:text-white hover:border-zinc-700'}`}
                >
                    العربية
                </button>
            </div>

            <SpotlightButton onClick={onNext} className="w-full max-w-xs py-5 text-lg font-black uppercase tracking-[0.2em]">
                {t('onboarding_get_started')}
            </SpotlightButton>

            <p className="text-xs text-zinc-600 mt-8 font-mono">
                {t('onboarding_time_estimate')}
            </p>
        </div>
    );
};
