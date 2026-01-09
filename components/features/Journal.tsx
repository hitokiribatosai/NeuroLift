import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useLanguage } from '../../contexts/LanguageContext';
import { JournalEntry, CustomMeasurement, CompletedWorkout, ActiveExercise, WorkoutSet } from '../../types';
import { Card } from '../ui/Card';
import { SpotlightButton } from '../ui/SpotlightButton';
import { getMuscleForExercise, getLocalizedMuscleName } from '../../utils/exerciseData';
import { ConfirmModal } from '../ui/ConfirmModal';
import { generateId } from '../../utils/id';
import { safeStorage } from '../../utils/storage';

export const Journal: React.FC = () => {
  const { t, language } = useLanguage();
  const [entries, setEntries] = useState<JournalEntry[]>([]);
  const [formData, setFormData] = useState<Partial<JournalEntry>>({});
  const [customFields, setCustomFields] = useState<CustomMeasurement[]>([]);
  const [showCustomInput, setShowCustomInput] = useState(false);
  const [newCustomField, setNewCustomField] = useState({ name: '', value: '', unit: 'cm' });
  const [editingId, setEditingId] = useState<string | null>(null);
  const [history, setHistory] = useState<CompletedWorkout[]>([]);
  const [editingWorkoutId, setEditingWorkoutId] = useState<string | null>(null);
  const [selectedMuscleChart, setSelectedMuscleChart] = useState<string>('Total');
  const [deleteConfirm, setDeleteConfirm] = useState<{ id: string, type: 'entry' | 'workout' } | null>(null);
  const [shareFeedback, setShareFeedback] = useState(false);

  useEffect(() => {
    setEntries(safeStorage.getParsed<JournalEntry[]>('neuroLift_journal', []));
    setHistory(safeStorage.getParsed<CompletedWorkout[]>('neuroLift_history', []));
  }, []);

  const resetFormContent = () => {
    setFormData({});
    setCustomFields([]);
    setEditingId(null);
  };

  const handleSelectEntry = (entry: JournalEntry) => {
    setEditingId(entry.id);
    const { id, date, customMeasurements, ...rest } = entry;
    setFormData(rest);
    setCustomFields(customMeasurements || []);
  };

  const handleDeleteEntry = (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    setDeleteConfirm({ id, type: 'entry' });
  };

  const performDeleteEntry = (id: string) => {
    const updated = entries.filter(ent => ent.id !== id);
    setEntries(updated);
    safeStorage.setItem('neuroLift_journal', JSON.stringify(updated));
    if (editingId === id) resetFormContent();
    setDeleteConfirm(null);
  };

  const handleSave = () => {
    if (editingId) {
      const updatedEntries = entries.map(ent => {
        if (ent.id === editingId) {
          return {
            ...ent,
            ...formData,
            customMeasurements: customFields
          };
        }
        return ent;
      });
      setEntries(updatedEntries);
      safeStorage.setItem('neuroLift_journal', JSON.stringify(updatedEntries));
    } else {
      const newEntry: JournalEntry = {
        id: generateId(),
        date: new Date().toLocaleDateString(),
        ...formData,
        customMeasurements: customFields
      } as JournalEntry;

      const updated = [newEntry, ...entries];
      setEntries(updated);
      safeStorage.setItem('neuroLift_journal', JSON.stringify(updated));
    }
    resetFormContent();
  };

  const handleChange = (field: keyof JournalEntry, value: string) => {
    setFormData(prev => ({ ...prev, [field]: parseFloat(value) || 0 }));
  };

  const addCustomField = () => {
    if (newCustomField.name && newCustomField.value) {
      setCustomFields([...customFields, {
        id: generateId(),
        name: newCustomField.name,
        value: parseFloat(newCustomField.value),
        unit: newCustomField.unit
      }]);
      setNewCustomField({ name: '', value: '', unit: 'cm' });
      setShowCustomInput(false);
    }
  };

  const handleDeleteWorkout = (id: string) => {
    setDeleteConfirm({ id, type: 'workout' });
  };

  const performDeleteWorkout = (id: string) => {
    const updated = history.filter(w => w.id !== id);
    setHistory(updated);
    safeStorage.setItem('neuroLift_history', JSON.stringify(updated));
    setDeleteConfirm(null);
  };

  const handleUpdateWorkoutSet = (workoutId: string, exIdx: number, setIdx: number, field: keyof WorkoutSet, val: number) => {
    const updatedHistory = history.map(w => {
      if (w.id === workoutId) {
        if (!w.exercises[exIdx]?.sets[setIdx]) return w;
        const newExs = [...w.exercises];
        const newSets = [...newExs[exIdx].sets];
        (newSets[setIdx] as any)[field] = val;
        const updatedEx = { ...newExs[exIdx], sets: newSets };
        newExs[exIdx] = updatedEx;

        const newVolume = newExs.reduce((acc, ex) => {
          return acc + (ex?.sets || []).reduce((sAcc, s) => s.completed ? sAcc + (s.weight * s.reps) : sAcc, 0);
        }, 0);

        return { ...w, exercises: newExs, totalVolume: newVolume };
      }
      return w;
    });
    setHistory(updatedHistory);
    safeStorage.setItem('neuroLift_history', JSON.stringify(updatedHistory));
  };

  const handleShareWorkout = (exercises: ActiveExercise[]) => {
    try {
      const exerciseNames = exercises.map(ex => ex.name);
      const encoded = btoa(JSON.stringify(exerciseNames));
      const shareUrl = `${window.location.origin}${window.location.pathname}?share=${encoded}${window.location.hash}`;
      navigator.clipboard.writeText(shareUrl);
      setShareFeedback(true);
      setTimeout(() => setShareFeedback(false), 2000);
    } catch (e) {
      console.error("Failed to generate share link", e);
    }
  };

  const WorkoutHistory = () => {
    if (history.length === 0) return (
      <div className="text-zinc-400 dark:text-zinc-600 text-center py-20 border-2 border-dashed border-zinc-100 dark:border-zinc-800 rounded-[3rem] bg-zinc-50/50 dark:bg-zinc-900/10">
        <div className="text-[10px] font-black uppercase tracking-[0.4em] mb-2 text-zinc-300 dark:text-zinc-800">No History Found</div>
        <p className="text-xs font-bold px-10">Complete a workout in the Tracker to see it here.</p>
      </div>
    );

    return (
      <div className="space-y-6">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-xl font-black text-zinc-900 dark:text-white uppercase tracking-tight flex items-center gap-3">
            <span className="w-2 h-6 bg-teal-500 rounded-full"></span>
            Workout Sessions
          </h3>
        </div>
        {history.map((workout) => (
          <Card key={workout.id} className="p-8 bg-white dark:bg-zinc-900/60 border-zinc-200 dark:border-zinc-800 rounded-[2.5rem] shadow-sm hover:shadow-md transition-all group overflow-hidden relative">
            <div className="absolute top-6 right-6 flex gap-2 md:opacity-0 md:group-hover:opacity-100 opacity-100 transition-all z-10">
              <button
                onClick={() => setEditingWorkoutId(editingWorkoutId === workout.id ? null : workout.id)}
                className="p-2.5 rounded-xl bg-zinc-100 dark:bg-zinc-800/80 text-zinc-400 hover:text-teal-500 transition-colors shadow-sm backdrop-blur-sm"
                style={{ WebkitBackdropFilter: 'blur(8px)' }}
                title="Edit workout"
              >
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                </svg>
              </button>
              <button
                onClick={() => handleDeleteWorkout(workout.id)}
                className="p-2.5 rounded-xl bg-zinc-100 dark:bg-zinc-800/80 text-zinc-400 hover:text-rose-500 transition-colors shadow-sm backdrop-blur-sm"
                style={{ WebkitBackdropFilter: 'blur(8px)' }}
                title="Delete workout"
              >
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                </svg>
              </button>
            </div>

            <div className="flex justify-between items-start mb-6 pb-4 border-b border-zinc-100 dark:border-zinc-800">
              <div>
                <h4 className="text-2xl font-black text-zinc-900 dark:text-white uppercase tracking-tighter mb-1 pr-20">
                  {workout.name || t('tracker_summary')}
                </h4>
                <div className="flex gap-4 items-center">
                  <span className="text-teal-600 dark:text-teal-400 font-black text-[10px] uppercase tracking-widest">{workout.date}</span>
                  <span className="text-zinc-200 dark:text-zinc-200 font-bold text-[10px] uppercase tracking-widest">
                    {Math.floor(workout.durationSeconds / 60)}m {workout.durationSeconds % 60}s
                  </span>
                </div>
              </div>
              <div className="text-right">
                <div className="text-[10px] text-zinc-300 uppercase tracking-widest mb-1 font-black">Total Volume</div>
                <div className="text-2xl font-black font-mono text-zinc-900 dark:text-white">{workout.totalVolume} <span className="text-xs font-bold text-teal-600">KG</span></div>
              </div>
            </div>

            <div className="space-y-6 mb-8">
              {workout.exercises.map((ex, exIdx) => (
                <div key={exIdx} className="bg-zinc-50 dark:bg-zinc-950/40 p-5 rounded-3xl border border-zinc-100 dark:border-zinc-800/50">
                  <div className="text-xs font-black text-teal-600 dark:text-teal-400 uppercase tracking-widest mb-3 flex items-center gap-2">
                    <span className="w-1 h-1 bg-teal-500 rounded-full"></span>
                    {ex.name}
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {ex.sets.filter(s => s.completed).map((set, sIdx) => {
                      const isCardio = getMuscleForExercise(ex.name) === 'Cardio';

                      return (
                        <div key={set.id} className="px-3 py-1.5 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl text-[10px] font-bold shadow-sm flex items-center gap-1">
                          <span className="text-zinc-300 dark:text-zinc-600 mr-1">S{sIdx + 1}:</span>
                          {editingWorkoutId === workout.id ? (
                            <div className="flex items-center gap-1">
                              {isCardio ? (
                                <>
                                  <input
                                    type="number"
                                    inputMode="decimal"
                                    onClick={(e) => e.stopPropagation()}
                                    className="w-10 bg-zinc-100 dark:bg-black rounded px-1 outline-none text-teal-500"
                                    value={set.durationSeconds ? Math.floor(set.durationSeconds / 60) : 0}
                                    onChange={(e) => {
                                      const mins = parseInt(e.target.value) || 0;
                                      const currentSeconds = (set.durationSeconds || 0) % 60;
                                      handleUpdateWorkoutSet(workout.id, exIdx, sIdx, 'durationSeconds', mins * 60 + currentSeconds);
                                    }}
                                  />
                                  <span>min</span>
                                  <input
                                    type="number"
                                    inputMode="decimal"
                                    step="0.1"
                                    onClick={(e) => e.stopPropagation()}
                                    className="w-10 bg-zinc-100 dark:bg-black rounded px-1 outline-none text-teal-500"
                                    value={set.distanceKm || 0}
                                    onChange={(e) => handleUpdateWorkoutSet(workout.id, exIdx, sIdx, 'distanceKm', parseFloat(e.target.value) || 0)}
                                  />
                                  <span>km</span>
                                </>
                              ) : (
                                <>
                                  <input
                                    type="number"
                                    inputMode="decimal"
                                    onClick={(e) => e.stopPropagation()}
                                    className="w-10 bg-zinc-100 dark:bg-black rounded px-1 outline-none text-teal-500"
                                    value={set.weight}
                                    onChange={(e) => handleUpdateWorkoutSet(workout.id, exIdx, sIdx, 'weight', parseInt(e.target.value) || 0)}
                                  />
                                  <span>kg ×</span>
                                  <input
                                    type="number"
                                    inputMode="decimal"
                                    onClick={(e) => e.stopPropagation()}
                                    className="w-8 bg-zinc-100 dark:bg-black rounded px-1 outline-none text-teal-500"
                                    value={set.reps}
                                    onChange={(e) => handleUpdateWorkoutSet(workout.id, exIdx, sIdx, 'reps', parseInt(e.target.value) || 0)}
                                  />
                                </>
                              )}
                            </div>
                          ) : (
                            <span className="text-zinc-900 dark:text-white">
                              {isCardio
                                ? `${set.durationSeconds ? Math.floor(set.durationSeconds / 60) : 0}m | ${set.distanceKm || 0}km`
                                : `${set.weight}kg × ${set.reps}`
                              }
                            </span>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>

            <SpotlightButton
              onClick={() => handleShareWorkout(workout.exercises)}
              className="w-full justify-center py-4 text-[10px] font-black uppercase tracking-[0.3em] bg-teal-500/10 text-teal-600 dark:text-teal-400 border-teal-500/20 shadow-lg shadow-teal-500/5"
            >
              Share This Plan
            </SpotlightButton>
          </Card>
        ))}
      </div>
    );
  };

  return (
    <div className="mx-auto max-w-6xl px-6 pt-4 pb-32">
      <h2 className="text-4xl font-black text-zinc-900 dark:text-white mb-8 uppercase tracking-tight">{t('journal_title')}</h2>

      <VolumeChart
        history={history}
        t={t}
        selectedMuscle={selectedMuscleChart}
        onMuscleChange={setSelectedMuscleChart}
        language={language}
      />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-12">
        <div className="lg:col-span-1 space-y-8">
          <Card className={`p-8 space-y-6 rounded-[2.5rem] shadow-sm transition-all duration-300 ${editingId ? 'bg-teal-500/5 border-teal-500 shadow-teal-500/10' : 'bg-white dark:bg-zinc-900/80 border-zinc-200 dark:border-zinc-800'}`}>
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-xl font-black text-zinc-900 dark:text-white uppercase tracking-tight">
                  {editingId ? 'Edit Entry' : t('journal_add_entry')}
                </h3>
                {editingId && (
                  <button
                    onClick={resetFormContent}
                    className="text-[10px] text-teal-600 dark:text-teal-400 hover:underline font-black uppercase tracking-widest mt-1"
                  >
                    + Create New
                  </button>
                )}
              </div>
              <span className="text-[10px] font-black uppercase tracking-widest text-zinc-300 dark:text-zinc-200">
                {editingId ? entries.find(e => e.id === editingId)?.date : new Date().toLocaleDateString()}
              </span>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <InputField label={t('field_weight')} field="weight" formData={formData} handleChange={handleChange} />
              <InputField label={t('field_neck')} field="neck" formData={formData} handleChange={handleChange} />
              <InputField label={t('field_shoulders')} field="shoulders" formData={formData} handleChange={handleChange} />
              <InputField label={t('field_chest')} field="chest" formData={formData} handleChange={handleChange} />
              <InputField label="Biceps (L)" field="biceps_left" formData={formData} handleChange={handleChange} />
              <InputField label="Biceps (R)" field="biceps_right" formData={formData} handleChange={handleChange} />
              <InputField label={t('field_forearms')} field="forearms" formData={formData} handleChange={handleChange} />
              <InputField label={t('field_waist')} field="waist" formData={formData} handleChange={handleChange} />
              <InputField label={t('field_hips')} field="hips" formData={formData} handleChange={handleChange} />
              <InputField label="Thigh (L)" field="thigh_left" formData={formData} handleChange={handleChange} />
              <InputField label="Thigh (R)" field="thigh_right" formData={formData} handleChange={handleChange} />
              <InputField label={t('field_calves')} field="calves" formData={formData} handleChange={handleChange} />
            </div>

            {customFields.length > 0 && (
              <div className="space-y-3 pt-4 border-t border-zinc-100 dark:border-zinc-800">
                {customFields.map(f => (
                  <div key={f.id} className="flex justify-between items-center text-xs text-zinc-300 dark:text-zinc-200 bg-zinc-50 dark:bg-zinc-900 p-3 rounded-xl border border-zinc-100 dark:border-zinc-800 group">
                    <span className="font-bold uppercase tracking-widest text-[9px]">{f.name}</span>
                    <div className="flex items-center gap-3">
                      <span className="font-black text-zinc-900 dark:text-white">{f.value} {f.unit}</span>
                      <button
                        onClick={() => setCustomFields(customFields.filter(cf => cf.id !== f.id))}
                        className="text-zinc-300 hover:text-rose-500 transition-colors"
                      >
                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {showCustomInput ? (
              <div className="p-6 bg-zinc-50 dark:bg-zinc-800/50 rounded-3xl space-y-4 border border-zinc-200 dark:border-zinc-700 shadow-inner">
                <input
                  placeholder="Measure Name (e.g. Wrist)"
                  value={newCustomField.name}
                  onChange={e => setNewCustomField({ ...newCustomField, name: e.target.value })}
                  className="w-full bg-white dark:bg-black text-xs p-3 rounded-xl border border-zinc-200 dark:border-zinc-700 text-zinc-900 dark:text-white outline-none focus:border-teal-500 font-bold"
                />
                <div className="flex gap-2">
                  <input
                    placeholder="Value"
                    type="number"
                    value={newCustomField.value}
                    onChange={e => setNewCustomField({ ...newCustomField, value: e.target.value })}
                    className="w-2/3 bg-white dark:bg-black text-xs p-3 rounded-xl border border-zinc-200 dark:border-zinc-700 text-zinc-900 dark:text-white outline-none focus:border-teal-500 font-bold"
                  />
                  <select
                    value={newCustomField.unit}
                    onChange={e => setNewCustomField({ ...newCustomField, unit: e.target.value })}
                    className="w-1/3 bg-white dark:bg-black text-xs rounded-xl border border-zinc-200 dark:border-zinc-700 text-zinc-900 dark:text-white font-bold outline-none"
                  >
                    <option value="cm">cm</option>
                    <option value="kg">kg</option>
                    <option value="in">in</option>
                  </select>
                </div>
                <div className="flex gap-2 pt-2">
                  <button onClick={addCustomField} className="flex-1 bg-teal-600 text-white text-[10px] font-black uppercase tracking-widest py-3 rounded-xl shadow-lg shadow-teal-500/20 active:scale-95 transition-all">Add</button>
                  <button onClick={() => setShowCustomInput(false)} className="flex-1 bg-white dark:bg-zinc-700 text-zinc-300 dark:text-white text-[10px] font-black uppercase tracking-widest py-3 rounded-xl border border-zinc-200 dark:border-zinc-600 active:scale-95 transition-all">Cancel</button>
                </div>
              </div>
            ) : (
              <button
                onClick={() => setShowCustomInput(true)}
                className="w-full py-4 border-2 border-dashed border-zinc-100 dark:border-zinc-800 text-zinc-300 dark:text-zinc-200 text-[10px] font-black uppercase tracking-[0.3em] rounded-2xl hover:border-teal-500/50 hover:text-teal-600 transition-all flex items-center justify-center gap-2"
              >
                <span>+</span> {t('add_custom')}
              </button>
            )}

            <div className="flex justify-center pt-4">
              <SpotlightButton
                onClick={handleSave}
                className="px-12 py-4 text-xs font-black uppercase tracking-widest shadow-xl shadow-teal-500/20"
              >
                {editingId ? 'Update Entry' : t('save')}
              </SpotlightButton>
            </div>
          </Card>
        </div>

        <div className="lg:col-span-2 space-y-12">
          <WorkoutHistory />

          <div className="pt-8 border-t border-zinc-100 dark:border-zinc-800">
            <h3 className="text-xl font-black text-zinc-900 dark:text-white uppercase tracking-tight mb-8 flex items-center gap-3">
              <span className="w-2 h-6 bg-teal-500 rounded-full"></span>
              Body Metrics
            </h3>
            <div className="space-y-6">
              {entries.length === 0 ? (
                <div className="text-zinc-300 dark:text-zinc-200 text-center py-32 border-2 border-dashed border-zinc-100 dark:border-zinc-800 rounded-[3rem] bg-zinc-50/50 dark:bg-zinc-900/10">
                  <div className="text-[10px] font-black uppercase tracking-[0.4em] mb-2 text-zinc-200 dark:text-zinc-100">No Entries Found</div>
                  <p className="text-xs font-bold px-10">Start tracking your comprehensive metrics today.</p>
                </div>
              ) : (
                entries.map(entry => (
                  <div
                    key={entry.id}
                    onClick={() => handleSelectEntry(entry)}
                    className={`p-8 rounded-[2.5rem] border transition-all duration-500 cursor-pointer group relative shadow-sm ${editingId === entry.id
                      ? 'border-teal-500 bg-teal-500/5 shadow-teal-500/10'
                      : 'border-zinc-100 dark:border-zinc-800 bg-white dark:bg-zinc-900/30 hover:bg-white dark:hover:bg-zinc-900 hover:border-zinc-200 dark:hover:border-zinc-700 hover:shadow-md'
                      }`}
                  >
                    <button
                      onClick={(e) => handleDeleteEntry(e, entry.id)}
                      className="absolute top-6 right-6 p-3 rounded-2xl bg-zinc-50 dark:bg-zinc-800 text-zinc-300 hover:bg-rose-500 hover:text-white md:opacity-0 group-hover:opacity-100 transition-all z-10 shadow-sm border border-zinc-100 dark:border-zinc-700"
                      title="Delete entry"
                    >
                      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                      </svg>
                    </button>

                    <div className="flex justify-between items-center mb-6 border-b border-zinc-50 dark:border-zinc-800 pb-4">
                      <span className="text-teal-600 dark:text-teal-400 font-black text-xs uppercase tracking-widest">{entry.date}</span>
                      {entry.weight && <span className="text-zinc-900 dark:text-white font-black text-xl font-mono tracking-tighter">{entry.weight} <span className="text-[10px] text-zinc-200 dark:text-zinc-300">KG</span></span>}
                    </div>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-6 text-xs text-zinc-300 dark:text-zinc-200">
                      {entry.chest && <div className="flex flex-col gap-1"><span className="text-[8px] font-black uppercase tracking-widest text-zinc-400">Chest</span> <span className="text-zinc-900 dark:text-zinc-200 font-bold">{entry.chest} cm</span></div>}
                      {entry.waist && <div className="flex flex-col gap-1"><span className="text-[8px] font-black uppercase tracking-widest text-zinc-400">Waist</span> <span className="text-zinc-900 dark:text-zinc-200 font-bold">{entry.waist} cm</span></div>}
                      {entry.biceps_right && <div className="flex flex-col gap-1"><span className="text-[8px] font-black uppercase tracking-widest text-zinc-400">Arms</span> <span className="text-zinc-900 dark:text-zinc-200 font-bold">{entry.biceps_right} cm</span></div>}
                      {entry.thigh_right && <div className="flex flex-col gap-1"><span className="text-[8px] font-black uppercase tracking-widest text-zinc-400">Legs</span> <span className="text-zinc-900 dark:text-zinc-200 font-bold">{entry.thigh_right} cm</span></div>}

                      {entry.customMeasurements?.map(c => (
                        <div key={c.id} className="flex flex-col gap-1">
                          <span className="text-[8px] font-black uppercase tracking-widest text-teal-600/50 dark:text-teal-500/50">{c.name}</span>
                          <span className="text-teal-600 dark:text-teal-400 font-bold">{c.value} {c.unit}</span>
                        </div>
                      ))}
                    </div>
                    {editingId === entry.id && (
                      <div className="mt-6 flex items-center justify-center gap-3 text-[9px] text-teal-600 dark:text-teal-400 font-black uppercase tracking-[0.4em] bg-teal-500/5 py-2 rounded-xl">
                        <div className="w-1.5 h-1.5 rounded-full bg-teal-500 animate-pulse"></div>
                        Currently Editing
                      </div>
                    )}
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </div>
      <ConfirmModal
        isOpen={deleteConfirm !== null}
        title={t('confirm_title')}
        message={deleteConfirm?.type === 'workout' ? t('confirm_delete_workout') : t('confirm_delete_entry')}
        confirmLabel={t('confirm_yes')}
        cancelLabel={t('confirm_cancel')}
        onConfirm={() => {
          if (deleteConfirm?.type === 'workout') performDeleteWorkout(deleteConfirm.id);
          else if (deleteConfirm?.type === 'entry') performDeleteEntry(deleteConfirm.id);
        }}
        onCancel={() => setDeleteConfirm(null)}
        isDestructive={true}
      />

      <AnimatePresence>
        {shareFeedback && (
          <div className="fixed bottom-32 left-1/2 -translate-x-1/2 z-[300] pointer-events-none">
            <div className="bg-teal-500 text-white px-8 py-4 rounded-2xl font-black uppercase tracking-widest text-[10px] shadow-2xl shadow-teal-500/40 animate-in fade-in slide-in-from-bottom-4">
              {t('save')}!
            </div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};

// Extracted VolumeChart for cleaner organization
const VolumeChart = ({ history, t, selectedMuscle, onMuscleChange, language }: { history: CompletedWorkout[], t: any, selectedMuscle: string, onMuscleChange: (m: string) => void, language: any }) => {
  const muscleGroups = ['Total', 'Chest', 'Back', 'Shoulders', 'Legs', 'Arms', 'Core', 'Cardio'];

  const getVolumeForPoint = (workout: CompletedWorkout) => {
    if (selectedMuscle === 'Total') return workout.totalVolume;

    return (workout.exercises || []).reduce((acc, ex) => {
      const muscle = getMuscleForExercise(ex.name);
      if (muscle === selectedMuscle) {
        return acc + (ex.sets || []).reduce((sAcc, s) => s.completed ? sAcc + (s.weight * s.reps) : sAcc, 0);
      }
      return acc;
    }, 0);
  };

  const data = [...history].reverse().slice(-10);
  if (data.length < 2) return null;

  const chartData = data.map(d => getVolumeForPoint(d));
  const maxVolume = Math.max(...chartData, 1);
  const chartHeight = 100;
  const chartWidth = 300;
  const padding = 20;

  const points = chartData.map((v, i) => ({
    x: (i / (data.length - 1)) * (chartWidth - padding * 2) + padding,
    y: chartHeight - (v / maxVolume) * (chartHeight - padding * 2) - padding
  }));

  const pathData = `M ${points.map(p => `${p.x},${p.y}`).join(' L ')}`;

  return (
    <Card className="p-8 bg-zinc-900/40 border-zinc-800 rounded-[2.5rem] shadow-sm mb-12 backdrop-blur-xl" style={{ WebkitBackdropFilter: 'blur(24px)' }}>
      <div className="flex justify-between items-center mb-8">
        <h3 className="text-[10px] font-black text-zinc-300 uppercase tracking-[0.3em]">Volume Progression</h3>
        <select
          value={selectedMuscle}
          onChange={(e) => onMuscleChange(e.target.value)}
          className="bg-black/40 border border-zinc-800 rounded-xl px-4 py-2 text-[10px] font-black uppercase tracking-widest text-teal-400 outline-none focus:border-teal-500 transition-all"
        >
          {muscleGroups.map(m => (
            <option key={m} value={m}>{m === 'Total' ? 'Overall Volume' : getLocalizedMuscleName(m, language)}</option>
          ))}
        </select>
      </div>

      <div className="relative w-full overflow-hidden">
        <svg viewBox={`0 0 ${chartWidth} ${chartHeight}`} className="w-full h-32 drop-shadow-[0_0_8px_rgba(20,184,166,0.2)]">
          {[0, 0.5, 1].map(v => (
            <line
              key={v}
              x1="0"
              y1={padding + v * (chartHeight - padding * 2)}
              x2={chartWidth}
              y2={padding + v * (chartHeight - padding * 2)}
              stroke="#27272a"
              strokeWidth="0.5"
              strokeDasharray="4 4"
            />
          ))}
          <path
            d={pathData}
            fill="none"
            stroke="#14b8a6"
            strokeWidth="3"
            strokeLinecap="round"
            strokeLinejoin="round"
            className="animate-in fade-in duration-1000"
          />
          {points.map((p, i) => (
            <circle
              key={i}
              cx={p.x}
              cy={p.y}
              r="3"
              fill="#14b8a6"
              className="animate-pulse"
            />
          ))}
        </svg>
        <div className="flex justify-between mt-6 text-[10px] text-zinc-300 font-black uppercase tracking-widest opacity-70">
          <span>{data[0].date}</span>
          <span>{data[data.length - 1].date}</span>
        </div>
      </div>
    </Card>
  );
};

const InputField = ({ label, field, formData, handleChange }: { label: string, field: keyof JournalEntry, formData: Partial<JournalEntry>, handleChange: (field: keyof JournalEntry, value: string) => void }) => (
  <div>
    <label className="text-xs text-zinc-200 block mb-1">{label}</label>
    <input
      type="number"
      inputMode="decimal"
      value={formData[field] || ''}
      onChange={e => handleChange(field, e.target.value)}
      onClick={(e) => e.stopPropagation()}
      className="w-full bg-black border border-zinc-700 rounded px-3 py-2 text-white focus:border-teal-500 outline-none"
    />
  </div>
);
