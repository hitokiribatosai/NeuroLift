import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useLanguage } from '../../contexts/LanguageContext';
import { SpotlightButton } from '../ui/SpotlightButton';
import { Card } from '../ui/Card';
import { authService, AuthUser } from '../../utils/authService';

interface AuthProps {
  onAuthSuccess: (user: AuthUser) => void;
  onSkip?: () => void;
}

type AuthMode = 'login' | 'signup';

export const Auth: React.FC<AuthProps> = ({ onAuthSuccess, onSkip }) => {
  const { t } = useLanguage();
  const [mode, setMode] = useState<AuthMode>('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showVerificationMessage, setShowVerificationMessage] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsLoading(true);

    try {
      let user: AuthUser;

      if (mode === 'signup') {
        if (password !== confirmPassword) {
          throw new Error('Passwords do not match');
        }
        user = await authService.signUp(email, password);
        setShowVerificationMessage(true);
        return; // Don't call onAuthSuccess for signup, user needs to verify email first
      } else {
        user = await authService.signIn(email, password);
      }

      onAuthSuccess(user);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An unexpected error occurred');
    } finally {
      setIsLoading(false);
    }
  };

  const handleGoogleSignIn = async () => {
    setError(null);
    setIsLoading(true);

    try {
      const user = await authService.signInWithGoogle();
      onAuthSuccess(user);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An unexpected error occurred');
    } finally {
      setIsLoading(false);
    }
  };

  const toggleMode = () => {
    setMode(mode === 'login' ? 'signup' : 'login');
    setError(null);
    setPassword('');
    setConfirmPassword('');
    setShowVerificationMessage(false);
  };

  return (
    <div className="min-h-screen bg-zinc-950 flex items-center justify-center px-6 py-12">
      <div className="w-full max-w-md">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-8"
        >
          <div className="w-20 h-20 bg-teal-500 rounded-full flex items-center justify-center mx-auto mb-6">
            <span className="text-3xl font-black text-white">NL</span>
          </div>
          <h1 className="text-3xl font-black text-white uppercase tracking-tight mb-2">
            {mode === 'login' ? t('auth_sign_in') : t('auth_sign_up')}
          </h1>
          <p className="text-zinc-400 text-sm font-medium">
            {mode === 'login' ? t('auth_sign_in_subtitle') : t('auth_sign_up_subtitle')}
          </p>
        </motion.div>

        <Card className="p-8 bg-zinc-900/40 border-zinc-800">
          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label htmlFor="email" className="block text-sm font-bold text-zinc-400 uppercase tracking-widest mb-2">
                {t('auth_email')}
              </label>
              <input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full px-4 py-3 bg-zinc-800 border border-zinc-700 rounded-lg text-white placeholder-zinc-500 focus:border-teal-500 focus:outline-none transition-colors"
                placeholder="your@email.com"
                required
              />
            </div>

            <div>
              <label htmlFor="password" className="block text-sm font-bold text-zinc-400 uppercase tracking-widest mb-2">
                {t('auth_password')}
              </label>
              <input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full px-4 py-3 bg-zinc-800 border border-zinc-700 rounded-lg text-white placeholder-zinc-500 focus:border-teal-500 focus:outline-none transition-colors"
                placeholder="••••••••"
                required
                minLength={6}
              />
            </div>

            <AnimatePresence>
              {mode === 'signup' && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  className="overflow-hidden"
                >
                  <div>
                    <label htmlFor="confirmPassword" className="block text-sm font-bold text-zinc-400 uppercase tracking-widest mb-2">
                      {t('auth_confirm_password')}
                    </label>
                    <input
                      id="confirmPassword"
                      type="password"
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      className="w-full px-4 py-3 bg-zinc-800 border border-zinc-700 rounded-lg text-white placeholder-zinc-500 focus:border-teal-500 focus:outline-none transition-colors"
                      placeholder="••••••••"
                      required
                      minLength={6}
                    />
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            <AnimatePresence>
              {error && (
                <motion.div
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  className="p-4 bg-rose-500/10 border border-rose-500/20 rounded-lg"
                >
                  <p className="text-rose-400 text-sm font-medium">{error}</p>
                </motion.div>
              )}
            </AnimatePresence>

            <SpotlightButton
              type="submit"
              disabled={isLoading}
              className="w-full py-4 text-lg font-black uppercase tracking-widest"
            >
              {isLoading ? t('auth_loading') : (mode === 'login' ? t('auth_sign_in') : t('auth_sign_up'))}
            </SpotlightButton>

            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-zinc-700"></div>
              </div>
              <div className="relative flex justify-center text-sm">
                <span className="px-4 bg-zinc-950 text-zinc-500 font-bold uppercase tracking-widest">
                  {t('auth_or')}
                </span>
              </div>
            </div>

            <button
              type="button"
              onClick={handleGoogleSignIn}
              disabled={isLoading}
              className="w-full flex items-center justify-center gap-3 px-4 py-4 bg-white/5 border border-zinc-700 rounded-lg text-white hover:bg-white/10 transition-colors disabled:opacity-50"
            >
              <svg className="w-5 h-5" viewBox="0 0 24 24">
                <path fill="currentColor" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                <path fill="currentColor" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                <path fill="currentColor" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                <path fill="currentColor" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
              </svg>
              {t('auth_continue_with_google')}
            </button>

            {onSkip && (
              <button
                type="button"
                onClick={onSkip}
                className="w-full py-3 px-4 bg-zinc-800 border border-zinc-600 rounded-lg text-zinc-300 hover:bg-zinc-700 hover:text-white transition-colors text-sm font-bold uppercase tracking-widest"
              >
                Skip / Continue as Guest
              </button>
            )}

            <div className="text-center">
              <button
                type="button"
                onClick={toggleMode}
                className="text-zinc-500 hover:text-white text-sm font-bold uppercase tracking-widest transition-colors"
              >
                {mode === 'login' ? t('auth_need_account') : t('auth_have_account')}
              </button>
            </div>
          </form>

          <AnimatePresence>
            {showVerificationMessage && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                className="mt-6 p-4 bg-teal-500/10 border border-teal-500/20 rounded-lg"
              >
                <p className="text-teal-400 text-sm font-medium text-center">
                  Check your email for verification. Verify your email before signing in.
                </p>
                <button
                  onClick={() => setShowVerificationMessage(false)}
                  className="mt-2 text-xs text-zinc-400 hover:text-white underline"
                >
                  Back to sign in
                </button>
              </motion.div>
            )}
          </AnimatePresence>
        </Card>
      </div>
    </div>
  );
};