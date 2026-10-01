import React from 'react';
import { motion } from 'framer-motion';
import { useLanguage } from '../../contexts/LanguageContext';

export const Privacy = () => {
    const { t, language } = useLanguage();
    const isRTL = language === 'ar';

    return (
        <div className="min-h-screen bg-black pb-24 pt-24 px-6 md:px-12" dir={isRTL ? 'rtl' : 'ltr'}>
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="max-w-3xl mx-auto space-y-8"
            >
                <div className="space-y-4">
                    <h1 className="text-4xl md:text-5xl font-black text-white uppercase tracking-tighter">
                        {t('privacy_policy')}
                    </h1>
                    <p className="text-zinc-400 text-sm font-bold uppercase tracking-widest">
                        {t('privacy_last_updated')}: 2026-10-01
                    </p>
                </div>

                <div className="prose prose-invert prose-zinc max-w-none space-y-8 text-zinc-300">
                    {/* 1. Introduction */}
                    <section>
                        <h2 className="text-2xl font-bold text-white mb-4">1. {t('privacy_intro_title')}</h2>
                        <p className="leading-relaxed">
                            {t('privacy_intro_text')}
                        </p>
                    </section>

                    {/* 2. Information We Collect */}
                    <section>
                        <h2 className="text-2xl font-bold text-white mb-4">2. {t('privacy_collection_title')}</h2>
                        <p className="leading-relaxed mb-4">
                            {t('privacy_collection_intro')}
                        </p>
                        <ul className="list-disc pl-5 space-y-2 marker:text-teal-500">
                            <li>
                                <strong className="text-white">{t('privacy_collection_personal')}:</strong> {t('privacy_collection_personal_desc')}
                            </li>
                            <li>
                                <strong className="text-white">{t('privacy_collection_workout')}:</strong> {t('privacy_collection_workout_desc')}
                            </li>
                            <li>
                                <strong className="text-white">{t('privacy_collection_preferences')}:</strong> {t('privacy_collection_preferences_desc')}
                            </li>
                        </ul>
                    </section>

                    {/* 3. Data Storage & Security */}
                    <section>
                        <h2 className="text-2xl font-bold text-white mb-4">3. {t('privacy_storage_title')}</h2>
                        <p className="leading-relaxed">
                            {t('privacy_storage_text').split(t('privacy_storage_local')).map((part, i, arr) => (
                                <React.Fragment key={i}>
                                    {part}
                                    {i < arr.length - 1 && <strong className="text-teal-400">{t('privacy_storage_local')}</strong>}
                                </React.Fragment>
                            ))}
                        </p>
                    </section>

                    {/* 4. Data Sharing */}
                    <section>
                        <h2 className="text-2xl font-bold text-white mb-4">4. {t('privacy_sharing_title')}</h2>
                        <p className="leading-relaxed">
                            {t('privacy_sharing_text')}
                        </p>
                    </section>

                    {/* 5. Your Rights */}
                    <section>
                        <h2 className="text-2xl font-bold text-white mb-4">5. {t('privacy_rights_title')}</h2>
                        <p className="leading-relaxed">
                            {t('privacy_rights_intro')}
                        </p>
                        <ul className="list-disc pl-5 space-y-2 marker:text-teal-500 mt-4">
                            <li>{t('privacy_rights_access')}</li>
                            <li>{t('privacy_rights_delete')}</li>
                            <li>{t('privacy_rights_correct')}</li>
                        </ul>
                    </section>

                    {/* 6. Changes to This Policy */}
                    <section>
                        <h2 className="text-2xl font-bold text-white mb-4">6. {t('privacy_changes_title')}</h2>
                        <p className="leading-relaxed">
                            {t('privacy_changes_text')}
                        </p>
                    </section>

                    {/* 7. Contact Us */}
                    <section>
                        <h2 className="text-2xl font-bold text-white mb-4">7. {t('privacy_contact_title')}</h2>
                        <p className="leading-relaxed">
                            {t('privacy_contact_text')}
                        </p>
                        <a
                            href="mailto:neuroliftapp@gmail.com"
                            className="inline-block mt-4 text-teal-400 font-bold hover:text-teal-300 transition-colors"
                        >
                            neuroliftapp@gmail.com
                        </a>
                    </section>
                </div>
            </motion.div>
        </div>
    );
};
