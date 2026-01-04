import React, { useState, useEffect } from 'react';
import { useLanguage } from '../../contexts/LanguageContext';
import { Card } from '../ui/Card';

interface DailyLog {
  date: string;
  calories: number;
}

export const Nutrition: React.FC = () => {
  const { t } = useLanguage();

  const [dailyCalories, setDailyCalories] = useState(0);
  const [history, setHistory] = useState<DailyLog[]>([]);
  const [caloriesInput, setCaloriesInput] = useState('');

  const today = new Date().toLocaleDateString();

  useEffect(() => {
    const savedDaily = localStorage.getItem('neuroLift_daily_cal');
    const savedDate = localStorage.getItem('neuroLift_cal_date');
    const savedHistory = localStorage.getItem('neuroLift_cal_history');

    if (savedDate === today) {
      if (savedDaily) setDailyCalories(parseInt(savedDaily));
    } else if (savedDate) {
      // New day detected
      const lastDayLog = { date: savedDate, calories: parseInt(savedDaily || '0') };
      const newHistory = [lastDayLog, ...JSON.parse(savedHistory || '[]')].slice(0, 7);
      setHistory(newHistory);
      localStorage.setItem('neuroLift_cal_history', JSON.stringify(newHistory));
      localStorage.setItem('neuroLift_cal_date', today);
      localStorage.setItem('neuroLift_daily_cal', '0');
      setDailyCalories(0);
    } else {
      localStorage.setItem('neuroLift_cal_date', today);
    }

    if (savedHistory) setHistory(JSON.parse(savedHistory));
  }, [today]);

  const addCalories = () => {
    const amount = parseInt(caloriesInput);
    if (!isNaN(amount)) {
      const newVal = dailyCalories + amount;
      setDailyCalories(newVal);
      localStorage.setItem('neuroLift_daily_cal', newVal.toString());
      setCaloriesInput('');
    }
  };

  const resetDay = () => {
    setDailyCalories(0);
    localStorage.setItem('neuroLift_daily_cal', '0');
  };

  return (
    <div className="mx-auto max-w-4xl px-6 py-24 min-h-[70vh] flex flex-col items-center">
      <div className="w-full max-w-md">
        <Card className="p-8 bg-zinc-900/80 mb-8">
          <h3 className="text-2xl font-bold text-white mb-8 flex items-center justify-center gap-2">
            <span className="text-teal-400">🔥</span> {t('cal_title')}
          </h3>

          <div className="relative flex items-center justify-center py-10">
            <div className="absolute inset-0 bg-teal-500/10 rounded-full blur-2xl"></div>
            <div className="relative text-center">
              <div className="text-6xl font-mono font-bold text-white tracking-widest">{dailyCalories}</div>
              <div className="text-xs text-zinc-500 uppercase tracking-widest mt-2">{t('cal_consumed')}</div>
            </div>
          </div>

          <div className="space-y-6 mt-10">
            <div className="flex gap-2">
              <input
                type="number"
                value={caloriesInput}
                onChange={(e) => setCaloriesInput(e.target.value)}
                placeholder="0"
                className="flex-1 bg-black border border-zinc-700 rounded-lg px-4 py-3 text-white focus:border-teal-500 focus:ring-1 focus:ring-teal-500 outline-none transition-all"
              />
              <button
                onClick={addCalories}
                className="bg-teal-600 hover:bg-teal-500 text-white px-6 rounded-lg font-bold transition-all active:scale-95"
              >
                {t('cal_add')}
              </button>
            </div>

            <button
              onClick={resetDay}
              className="w-full text-xs text-zinc-500 hover:text-red-400 transition-colors uppercase tracking-widest font-medium"
            >
              {t('cal_reset')}
            </button>
          </div>
        </Card>

        {history.length > 0 && (
          <Card className="p-6 bg-zinc-900/50 border-zinc-800 animate-in fade-in slide-in-from-bottom-4">
            <h4 className="text-xs font-bold text-zinc-500 uppercase tracking-widest mb-4">{t('nutrition_history')}</h4>
            <div className="space-y-3">
              {history.map((h, i) => (
                <div key={i} className="flex justify-between items-center text-sm">
                  <span className="text-zinc-400 font-mono">{h.date}</span>
                  <span className="text-zinc-200 font-bold">{h.calories} <span className="text-[10px] text-zinc-500 font-normal">{t('nutrition_calories_unit')}</span></span>
                </div>
              ))}
            </div>
          </Card>
        )}
      </div>
    </div>
  );
};