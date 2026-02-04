import React from 'react';
import { motion } from 'framer-motion';

export const Privacy = () => {
    return (
        <div className="min-h-screen bg-black pb-24 pt-24 px-6 md:px-12">
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="max-w-3xl mx-auto space-y-8"
            >
                <div className="space-y-4">
                    <h1 className="text-4xl md:text-5xl font-black text-white uppercase tracking-tighter">
                        Privacy <span className="text-teal-500">Policy</span>
                    </h1>
                    <p className="text-zinc-400 text-sm font-bold uppercase tracking-widest">
                        Last Updated: {new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}
                    </p>
                </div>

                <div className="prose prose-invert prose-zinc max-w-none space-y-8 text-zinc-300">
                    <section>
                        <h2 className="text-2xl font-bold text-white mb-4">1. Introduction</h2>
                        <p className="leading-relaxed">
                            Welcome to NeuroLift. We respect your privacy and are committed to protecting your personal data.
                            This privacy policy explains how we handle your data when you use our mobile application.
                        </p>
                    </section>

                    <section>
                        <h2 className="text-2xl font-bold text-white mb-4">2. Information We Collect</h2>
                        <p className="leading-relaxed mb-4">
                            We collect minimal data to function effectively. This includes:
                        </p>
                        <ul className="list-disc pl-5 space-y-2 marker:text-teal-500">
                            <li>
                                <strong className="text-white">Personal Information:</strong> Name, age, weight, and height (used for calculating fitness metrics).
                            </li>
                            <li>
                                <strong className="text-white">Workout Data:</strong> Exercises performed, sets, reps, weight, and workout logs.
                            </li>
                            <li>
                                <strong className="text-white">App Preferences:</strong> Theme settings, language selection, and gym modes.
                            </li>
                        </ul>
                    </section>

                    <section>
                        <h2 className="text-2xl font-bold text-white mb-4">3. Data Storage & Security</h2>
                        <p className="leading-relaxed">
                            NeuroLift is a <strong className="text-teal-400">local-first application</strong>. All your personal information and workout history are stored locally on your device using IndexedDB and LocalStorage. We do not upload your data to any external servers, cloud storage, or third-party databases. You have full control over your data.
                        </p>
                    </section>

                    <section>
                        <h2 className="text-2xl font-bold text-white mb-4">4. Data Sharing</h2>
                        <p className="leading-relaxed">
                            Since we do not transmit your data to the cloud, we do not share, sell, or disclose your personal information to any third parties.
                        </p>
                    </section>

                    <section>
                        <h2 className="text-2xl font-bold text-white mb-4">5. Your Rights</h2>
                        <p className="leading-relaxed">
                            Because your data is stored locally, you have the right to:
                        </p>
                        <ul className="list-disc pl-5 space-y-2 marker:text-teal-500 mt-4">
                            <li>Access your data at any time by opening the app.</li>
                            <li>Delete your data by using the "Reset Data" options in the Settings menu or by uninstalling the app.</li>
                            <li>Correction of data by editing your profile or logs directly within the app.</li>
                        </ul>
                    </section>

                    <section>
                        <h2 className="text-2xl font-bold text-white mb-4">6. Changes to This Policy</h2>
                        <p className="leading-relaxed">
                            We may update our Privacy Policy from time to time. We will notify you of any changes by posting the new Privacy Policy on this page and updating the "Last Updated" date.
                        </p>
                    </section>

                    <section>
                        <h2 className="text-2xl font-bold text-white mb-4">7. Contact Us</h2>
                        <p className="leading-relaxed">
                            If you have any questions about this Privacy Policy, please contact us at:
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
