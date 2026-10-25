import React, { useState, useEffect } from 'react';
import { useLanguage } from '../../contexts/LanguageContext';
import { Card } from '../ui/Card';
import { safeStorage } from '../../utils/storage';
import { usePersistenceAction } from '../../hooks/usePersistenceAction';

interface DailyLog {
  date: string;
  calories: number;
}

export const Nutrition: React.FC = () => {
  const persist = usePersistenceAction();
  const { t } = useLanguage();

  const [dailyCalories, setDailyCalories] = useState(0);
  const [history, setHistory] = useState<DailyLog[]>([]);
  const [caloriesInput, setCaloriesInput] = useState('');

  const today = new Date().toLocaleDateString();

  useEffect(() => {
    const savedDaily = safeStorage.getItem('neuroLift_daily_cal');
    const savedDate = safeStorage.getItem('neuroLift_cal_date');
    const savedHistory = safeStorage.getParsed<DailyLog[]>('neuroLift_cal_history', []);

    if (savedDate === today) {
      if (savedDaily) setDailyCalories(parseInt(savedDaily));
      setHistory(savedHistory);
    } else if (savedDate) {
      // New day detected
      const lastDayLog = { date: savedDate, calories: parseInt(savedDaily || '0') };
      const newHistory = [lastDayLog, ...savedHistory].slice(0, 7);
      setHistory(newHistory);
      safeStorage.setItems({ neuroLift_cal_history: JSON.stringify(newHistory), neuroLift_cal_date: today, neuroLift_daily_cal: '0' });
      setDailyCalories(0);
    } else {
      safeStorage.setItem('neuroLift_cal_date', today);
      setHistory(savedHistory);
    }
  }, [today]);

  const addCalories = () => persist(async () => {
    const amount = parseInt(caloriesInput);
    if (Number.isFinite(amount) && amount > 0) {
      const newVal = dailyCalories + amount;
      await safeStorage.setItem('neuroLift_daily_cal', newVal.toString());
      setDailyCalories(newVal);
      setCaloriesInput('');
    }
  });

  const resetDay = () => persist(async () => {
    await safeStorage.setItem('neuroLift_daily_cal', '0');
    setDailyCalories(0);
  });

  return (
    <div className="mx-auto max-w-4xl px-6 py-24 min-h-[70vh] flex flex-col items-center">
      <div className="w-full max-w-md">
        <Card className="p-8 bg-white dark:bg-zinc-900/80 surface-paper border border-zinc-200 surface-border dark:border-zinc-800 surface-border mb-8 shadow-sm surface-flat">
          <h3 className="text-2xl font-black text-zinc-900 surface-ink dark:text-white mb-8 flex items-center justify-center gap-3">
            <span className="text-teal-600 surface-green dark:text-teal-400 surface-green">🔥</span> {t('cal_title')}
          </h3>

          <div className="relative flex items-center justify-center py-10">
            <div className="absolute inset-0 bg-teal-500/10 surface-accent rounded-full blur-3xl"></div>
            <div className="relative text-center">
              <div className="text-7xl font-mono font-black text-zinc-900 surface-ink dark:text-white tracking-tighter">{dailyCalories}</div>
              <div className="text-[10px] text-zinc-500 surface-muted surface-ink font-black uppercase tracking-[0.3em] mt-2">{t('cal_consumed')}</div>
            </div>
          </div>

          <div className="space-y-6 mt-10">
            <div className="flex gap-2">
              <input
                type="number"
                value={caloriesInput}
                onChange={(e) => setCaloriesInput(e.target.value)}
                placeholder="0"
                className="min-w-0 flex-1 bg-zinc-50 surface-paper dark:bg-black surface-canvas border border-zinc-200 surface-border dark:border-zinc-700 surface-border rounded-xl px-4 py-3 text-zinc-900 surface-ink dark:text-white font-bold focus:border-teal-500 focus:ring-1 focus:ring-teal-500 outline-none transition-all"
              />
              <button
                onClick={addCalories}
                className="shrink-0 bg-teal-600 surface-accent hover:bg-teal-500 surface-accent text-white surface-ink px-6 rounded-xl font-black uppercase text-[10px] tracking-widest transition-all active:scale-95 shadow-lg surface-flat shadow-teal-500/20 surface-flat"
              >
                {t('cal_add')}
              </button>
            </div>

            <button
              onClick={resetDay}
              className="w-full text-[10px] text-zinc-400 surface-muted surface-ink hover:text-rose-500 transition-colors uppercase tracking-[0.3em] font-black"
            >
              {t('cal_reset')}
            </button>
          </div>
        </Card>

        {history.length > 0 && (
          <Card className="p-8 bg-white dark:bg-zinc-900/50 surface-paper border border-zinc-200 surface-border dark:border-zinc-800 surface-border animate-in fade-in slide-in-from-bottom-4 shadow-sm surface-flat">
            <h4 className="text-[10px] font-black text-zinc-400 surface-muted surface-ink dark:text-zinc-500 surface-ink uppercase tracking-[0.4em] mb-6 flex items-center gap-4">
              {t('nutrition_history')}
              <div className="h-px flex-1 bg-zinc-100 surface-paper dark:bg-zinc-800 surface-paper"></div>
            </h4>
            <div className="space-y-4">
              {history.map((h, i) => (
                <div key={i} className="flex justify-between items-center text-sm">
                  <span className="text-zinc-500 surface-muted surface-ink dark:text-zinc-400 surface-ink font-mono text-xs">{h.date}</span>
                  <span className="text-zinc-900 surface-ink dark:text-zinc-200 surface-ink font-black">{h.calories} <span className="text-[10px] text-zinc-400 surface-muted surface-ink dark:text-zinc-500 surface-ink font-black ml-1 uppercase">{t('nutrition_calories_unit')}</span></span>
                </div>
              ))}
            </div>
          </Card>
        )}
      </div>
    </div>
  );
};
