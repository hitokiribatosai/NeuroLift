import React from 'react';
import { SpotlightButton } from './ui/SpotlightButton';
import { useLanguage } from '../contexts/LanguageContext';

interface FooterCTAProps {
  setCurrentView: (view: string) => void;
}

export const FooterCTA: React.FC<FooterCTAProps> = ({ setCurrentView }) => {
  const { t } = useLanguage();

  return (
    <section className="relative px-6 py-32 text-center">
      {/* Glow effect */}
      <div className="absolute bottom-0 left-1/2 -z-10 h-64 w-[600px] -translate-x-1/2 rounded-full bg-teal-900/20 blur-[100px]"></div>

      <h2 className="text-4xl font-bold tracking-tight text-white sm:text-5xl">
        {t('footer_title')}
      </h2>
      <p className="mx-auto mt-6 max-w-xl text-lg text-zinc-400">
        {t('footer_desc')}
      </p>
      <div className="mt-10">
        <SpotlightButton
          className="h-12 px-8 text-base"
          onClick={() => setCurrentView('tracker')}
        >
          {t('footer_btn')}
        </SpotlightButton>
      </div>

      <div className="mt-16 border-t border-zinc-900 pt-8 text-sm text-zinc-600">
        &copy; {new Date().getFullYear()} {t('footer_copy')}
      </div>
    </section>
  );
};