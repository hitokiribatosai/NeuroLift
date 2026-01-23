import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useLanguage } from '../../contexts/LanguageContext';
import { SpotlightButton } from '../ui/SpotlightButton';
import { Card } from '../ui/Card';
import { authService, AuthUser } from '../../utils/authService';
import { safeStorage } from '../../utils/storage';
import { CompletedWorkout } from '../../types';

interface ProfileProps {
  user: AuthUser;
  onSignOut: () => void;
}

export const Profile: React.FC<ProfileProps> = ({ user, onSignOut }) => {
  const { t, language, setLanguage } = useLanguage();
  const [workouts, setWorkouts] = useState<CompletedWorkout[]>([]);
  const [isDeletingAccount, setIsDeletingAccount] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  useEffect(() => {
    const history = safeStorage.getParsed<CompletedWorkout[]>('neuroLift_history', []);
    setWorkouts(history);
  }, []);

  const handleSignOut = async () => {
    try {
      await authService.signOut();
      onSignOut();
    } catch (error) {
      console.error('Error signing out:', error);
    }
  };

  const handleDeleteAccount = async () => {
    setIsDeletingAccount(true);
    try {
      // TODO: Implement account deletion with Firebase
      // This would require additional Firebase setup and data cleanup
      alert('Account deletion not yet implemented. Please contact support.');
    } catch (error) {
      console.error('Error deleting account:', error);
    } finally {
      setIsDeletingAccount(false);
      setShowDeleteConfirm(false);
    }
  };

  const totalWorkouts = workouts.length;
  const totalVolume = workouts.reduce((sum, workout) => sum + workout.totalVolume, 0);
  const avgVolume = totalWorkouts > 0 ? Math.round(totalVolume / totalWorkouts) : 0;

  return (
    <div className="min-h-screen bg-zinc-950 py-24 px-6">
      <div className="max-w-4xl mx-auto space-y-8">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center"
        >
          <div className="w-24 h-24 bg-teal-500 rounded-full flex items-center justify-center mx-auto mb-6">
            {user.photoURL ? (
              <img
                src={user.photoURL}
                alt="Profile"
                className="w-full h-full rounded-full object-cover"
              />
            ) : (
              <span className="text-3xl font-black text-white">
                {user.displayName?.charAt(0).toUpperCase() || user.email?.charAt(0).toUpperCase() || 'U'}
              </span>
            )}
          </div>
          <h1 className="text-3xl font-black text-white uppercase tracking-tight mb-2">
            {user.displayName || t('profile_title')}
          </h1>
          <p className="text-zinc-400 text-sm font-medium">{user.email}</p>
        </motion.div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Card className="p-6 bg-zinc-900/40 border-zinc-800 text-center">
            <div className="text-3xl font-black font-mono text-teal-400 mb-2">{totalWorkouts}</div>
            <div className="text-xs font-bold text-zinc-500 uppercase tracking-widest">
              {t('profile_total_workouts')}
            </div>
          </Card>

          <Card className="p-6 bg-zinc-900/40 border-zinc-800 text-center">
            <div className="text-3xl font-black font-mono text-teal-400 mb-2">{totalVolume.toLocaleString()}</div>
            <div className="text-xs font-bold text-zinc-500 uppercase tracking-widest">
              {t('profile_total_volume')}
            </div>
          </Card>

          <Card className="p-6 bg-zinc-900/40 border-zinc-800 text-center">
            <div className="text-3xl font-black font-mono text-teal-400 mb-2">{avgVolume.toLocaleString()}</div>
            <div className="text-xs font-bold text-zinc-500 uppercase tracking-widest">
              {t('profile_avg_volume')}
            </div>
          </Card>
        </div>

        {/* Settings */}
        <Card className="p-8 bg-zinc-900/40 border-zinc-800">
          <h2 className="text-xl font-black text-white uppercase tracking-tight mb-6">
            {t('profile_settings')}
          </h2>

          <div className="space-y-6">
            {/* Language Setting */}
            <div>
              <label className="block text-sm font-bold text-zinc-400 uppercase tracking-widest mb-3">
                {t('profile_language')}
              </label>
              <select
                value={language}
                onChange={(e) => setLanguage(e.target.value as 'en' | 'fr' | 'ar')}
                className="w-full px-4 py-3 bg-zinc-800 border border-zinc-700 rounded-lg text-white focus:border-teal-500 focus:outline-none transition-colors"
              >
                <option value="en">English</option>
                <option value="fr">Français</option>
                <option value="ar">العربية</option>
              </select>
            </div>

            {/* Units Setting */}
            <div>
              <label className="block text-sm font-bold text-zinc-400 uppercase tracking-widest mb-3">
                {t('profile_units')}
              </label>
              <select
                value={safeStorage.getItem('neuroLift_units') || 'metric'}
                onChange={(e) => safeStorage.setItem('neuroLift_units', e.target.value)}
                className="w-full px-4 py-3 bg-zinc-800 border border-zinc-700 rounded-lg text-white focus:border-teal-500 focus:outline-none transition-colors"
              >
                <option value="metric">Metric (kg)</option>
                <option value="imperial">Imperial (lbs)</option>
              </select>
            </div>
          </div>
        </Card>

        {/* Actions */}
        <div className="space-y-4">
          <SpotlightButton
            onClick={handleSignOut}
            variant="secondary"
            className="w-full py-4 text-lg font-black uppercase tracking-widest"
          >
            {t('profile_sign_out')}
          </SpotlightButton>

          <button
            onClick={() => setShowDeleteConfirm(true)}
            className="w-full py-4 bg-rose-500/10 border border-rose-500/20 rounded-lg text-rose-400 hover:bg-rose-500/20 transition-colors text-sm font-black uppercase tracking-widest"
          >
            {t('profile_delete_account')}
          </button>
        </div>

        {/* Delete Account Confirmation */}
        {showDeleteConfirm && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 backdrop-blur-md p-6"
          >
            <Card className="p-8 bg-zinc-950 border border-zinc-900 max-w-md w-full">
              <div className="text-center mb-6">
                <div className="w-16 h-16 bg-rose-500/10 rounded-full flex items-center justify-center mx-auto mb-4">
                  <svg className="w-8 h-8 text-rose-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
                  </svg>
                </div>
                <h3 className="text-xl font-black text-white uppercase tracking-tight mb-2">
                  {t('profile_delete_confirm_title')}
                </h3>
                <p className="text-zinc-400 text-sm">
                  {t('profile_delete_confirm_desc')}
                </p>
              </div>

              <div className="flex gap-3">
                <button
                  onClick={() => setShowDeleteConfirm(false)}
                  className="flex-1 py-4 bg-zinc-900 border border-zinc-800 rounded-2xl text-zinc-400 hover:text-white font-black uppercase tracking-widest transition-colors"
                >
                  {t('confirm_cancel')}
                </button>
                <button
                  onClick={handleDeleteAccount}
                  disabled={isDeletingAccount}
                  className="flex-1 py-4 bg-rose-500 hover:bg-rose-600 text-white font-black uppercase tracking-widest rounded-2xl transition-colors disabled:opacity-50"
                >
                  {isDeletingAccount ? t('auth_loading') : t('confirm_yes')}
                </button>
              </div>
            </Card>
          </motion.div>
        )}
      </div>
    </div>
  );
};