import { useCopy } from '../../hooks/useCopy';
import React from 'react';
import { CompletedWorkout, ExerciseHistory } from '../../types';
import { useLanguage } from '../../contexts/LanguageContext';
import { getExerciseTranslation } from '../../utils/exerciseData';
import { summarizeSets } from '../../utils/workoutSummary';

export function WorkoutBreakdown({ workout, previous }: { workout: CompletedWorkout; previous: Map<string, ExerciseHistory> }) {
  const { language } = useLanguage();
  const c = useCopy();
  const number = (value: number) => value.toLocaleString(language, { maximumFractionDigits: 2 });
  return <section className="workout-breakdown" aria-label={c('exercise_breakdown')}>
    <h3>{c('your_workout_exercise_by_exercise')}</h3>
    <p>{c('completed_sets_only_volume_weight_repetitions_more_volume_is_not_autom')}</p>
    {workout.exercises.map(exercise => {
      const current = summarizeSets(exercise.sets);
      if (!current.sets.length) return null;
      const history = previous.get(exercise.name);
      const last = history && summarizeSets(history.lastSets);
      const metric = current.volume > 0 ? 'volume' : current.seconds > 0 ? 'seconds' : 'reps';
      const unit = metric === 'volume' ? 'kg' : metric === 'seconds' ? c('seconds') : c('reps');
      const comparable = last && (metric === 'volume' ? last.volume > 0 : metric === 'seconds' ? last.seconds > 0 && last.volume === 0 : last.volume === 0 && last.seconds === 0);
      const delta = last ? current[metric] - last[metric] : 0;
      return <article key={exercise.name} className="web-panel workout-exercise-result">
        <h4>{getExerciseTranslation(exercise.name, language)}</h4>
        <ul>{current.sets.map((set, index) => <li key={set.id}>{index + 1}. {set.durationSeconds ? `${number(set.durationSeconds)} ${c('seconds')}` : set.weight > 0 ? `${number(set.weight)} kg × ${number(set.reps)}` : `${number(set.reps)} ${c('reps_bodyweight')}`}</li>)}</ul>
        <strong>{metric === 'volume' ? c('volume') : c('total')}: {number(current[metric])} {unit}</strong>
        {history && comparable ? <p>{c('previous_session')} ({new Date(history.lastPerformed).toLocaleDateString(language)}): {number(last![metric])} {unit} · {delta > 0 ? '+' : ''}{number(delta)} {unit}</p> : <p>{c('no_comparable_previous_session_yet')}</p>}
      </article>;
    })}
  </section>;
}
