import React from 'react';
import { CompletedWorkout, ExerciseHistory } from '../../types';
import { useLanguage } from '../../contexts/LanguageContext';
import { getExerciseTranslation } from '../../utils/exerciseData';
import { summarizeSets } from '../../utils/workoutSummary';

export function WorkoutBreakdown({ workout, previous }: { workout: CompletedWorkout; previous: Map<string, ExerciseHistory> }) {
  const { language } = useLanguage();
  const c = (en: string, fr: string, ar: string) => language === 'fr' ? fr : language === 'ar' ? ar : en;
  const number = (value: number) => value.toLocaleString(language, { maximumFractionDigits: 2 });
  return <section className="workout-breakdown" aria-label={c('Exercise breakdown', 'Bilan par exercice', 'ملخص التمارين')}>
    <h3>{c('Your workout, exercise by exercise', 'Votre séance, exercice par exercice', 'حصتك تمريناً بتمرين')}</h3>
    <p>{c('Completed sets only. Volume = weight × repetitions. More volume is not automatically a better workout.', 'Séries terminées uniquement. Volume = charge × répétitions. Plus de volume ne signifie pas forcément une meilleure séance.', 'المجموعات المكتملة فقط. الحجم = الوزن × التكرارات. الحجم الأكبر لا يعني بالضرورة حصة أفضل.')}</p>
    {workout.exercises.map(exercise => {
      const current = summarizeSets(exercise.sets);
      if (!current.sets.length) return null;
      const history = previous.get(exercise.name);
      const last = history && summarizeSets(history.lastSets);
      const metric = current.volume > 0 ? 'volume' : current.seconds > 0 ? 'seconds' : 'reps';
      const unit = metric === 'volume' ? 'kg' : metric === 'seconds' ? c('seconds', 'secondes', 'ثانية') : c('reps', 'répétitions', 'تكرارات');
      const comparable = last && (metric === 'volume' ? last.volume > 0 : metric === 'seconds' ? last.seconds > 0 && last.volume === 0 : last.volume === 0 && last.seconds === 0);
      const delta = last ? current[metric] - last[metric] : 0;
      return <article key={exercise.name} className="web-panel workout-exercise-result">
        <h4>{getExerciseTranslation(exercise.name, language)}</h4>
        <ul>{current.sets.map((set, index) => <li key={set.id}>{index + 1}. {set.durationSeconds ? `${number(set.durationSeconds)} ${c('seconds', 'secondes', 'ثانية')}` : set.weight > 0 ? `${number(set.weight)} kg × ${number(set.reps)}` : `${number(set.reps)} ${c('reps · bodyweight', 'répétitions · poids du corps', 'تكرارات · وزن الجسم')}`}</li>)}</ul>
        <strong>{metric === 'volume' ? c('Volume', 'Volume', 'الحجم') : c('Total', 'Total', 'المجموع')}: {number(current[metric])} {unit}</strong>
        {history && comparable ? <p>{c('Previous session', 'Séance précédente', 'الحصة السابقة')} ({new Date(history.lastPerformed).toLocaleDateString(language)}): {number(last![metric])} {unit} · {delta > 0 ? '+' : ''}{number(delta)} {unit}</p> : <p>{c('No comparable previous session yet.', 'Pas encore de séance précédente comparable.', 'لا توجد حصة سابقة قابلة للمقارنة بعد.')}</p>}
      </article>;
    })}
  </section>;
}
