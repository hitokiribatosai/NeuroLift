import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { useLanguage } from '../../contexts/LanguageContext';
import { SpotlightButton } from '../ui/SpotlightButton';
import { Card } from '../ui/Card';

interface GoalSettingProps {
  onComplete: (goal: string | null) => void;
}

type Goal = 'strength' | 'hypertrophy' | 'endurance';

export const GoalSetting: React.FC<GoalSettingProps> = ({ onComplete }) => {
  const { t } = useLanguage();
  const [selectedGoal, setSelectedGoal] = useState<Goal | null>(null);

  const goals: Array<{ id: Goal; icon: string; title: string; desc: string; color: string }> = [
    {
      id: 'strength',
      icon: '💪',
      title: t('goal_strength_title'),
      desc: t('goal_strength_desc'),
      color: 'from-orange-500/20 to-rose-500/20'
    },
    {
      id: 'hypertrophy',
      icon: '🏋️',
      title: t('goal_hypertrophy_title'),
      desc: t('goal_hypertrophy_desc'),
      color: 'from-teal-500/20 to-cyan-500/20'
    },
    {
      id: 'endurance',
      icon: '🏃',
      title: t('goal_endurance_title'),
      desc: t('goal_endurance_desc'),
      color: 'from-purple-500/20 to-pink-500/20'
    }
  ];

  const handleComplete = () => {
    if (selectedGoal) {
      localStorage.setItem('neuroLift_userGoal', selectedGoal);
    }
    onComplete(selectedGoal);
  };

  return (
    <div className="min-h-screen bg-zinc-950 flex items-center justify-center px-6 py-12">
      <div className="max-w-4xl w-full">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-12"
        >
          <h1 className="text-4xl md:text-5xl font-black text-white uppercase tracking-tight mb-4">
            {t('goal_setting_title')}
          </h1>
          <p className="text-zinc-400 text-lg font-medium max-w-2xl mx-auto">
            {t('goal_setting_subtitle')}
          </p>
        </motion.div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          {goals.map((goal, index) => (
            <motion.div
              key={goal.id}
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: index * 0.1 }}
            >
              <Card
                className={`p-8 cursor-pointer transition-all ${
                  selectedGoal === goal.id
                    ? 'border-teal-500 bg-teal-500/10 shadow-xl shadow-teal-500/20'
                    : 'border-zinc-800 bg-zinc-900/40 hover:border-zinc-700'
                }`}
                onClick={() => setSelectedGoal(goal.id)}
              >
                <div className={`relative bg-gradient-to-br ${goal.color} rounded-2xl p-6 mb-6`}>
                  <div className="text-6xl text-center">{goal.icon}</div>
                  {selectedGoal === goal.id && (
                    <div className="absolute top-2 right-2 w-6 h-6 bg-teal-500 rounded-full flex items-center justify-center">
                      <svg className="w-4 h-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                      </svg>
                    </div>
                  )}
                </div>

                <h3 className="text-xl font-black text-white uppercase tracking-tight mb-2 text-center">
                  {goal.title}
                </h3>
                <p className="text-zinc-400 text-xs font-medium text-center">
                  {goal.desc}
                </p>
              </Card>
            </motion.div>
          ))}
        </div>

        <div className="flex flex-col items-center gap-4">
          <SpotlightButton
            onClick={handleComplete}
            disabled={!selectedGoal}
            className="px-16 py-5 text-lg font-black uppercase tracking-widest shadow-2xl disabled:opacity-50"
          >
            {t('goal_setting_continue')}
          </SpotlightButton>

          <button
            onClick={() => onComplete(null)}
            className="text-zinc-500 hover:text-white text-sm font-black uppercase tracking-widest transition-colors"
          >
            {t('goal_setting_skip')}
          </button>
        </div>
      </div>
    </div>
  );
};