import React, { useState } from 'react';
import { useLanguage } from '../../contexts/LanguageContext';
import { Card } from '../ui/Card';
import { SpotlightButton } from '../ui/SpotlightButton';
import { getExerciseDatabase, getLocalizedMuscleName } from '../../utils/exerciseData';

export const ProgramPlanner: React.FC = () => {
  const { t, language } = useLanguage();
  const [selectedMuscle, setSelectedMuscle] = useState<string | null>(null);
  const [selectedExercise, setSelectedExercise] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');

  const exerciseDB = getExerciseDatabase(language);
  const muscleList = Object.keys(exerciseDB);

  const filteredExercises = searchQuery
    ? Object.entries(exerciseDB).flatMap(([muscle, exs]) =>
      exs.filter(ex => ex.toLowerCase().includes(searchQuery.toLowerCase()))
        .map(ex => ({ name: ex, muscle }))
    )
    : [];

  return (
    <div className="mx-auto max-w-7xl px-6 py-24 min-h-screen">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-8">
        <div>
          <h2 className="text-3xl font-bold text-white mb-2">{t('planner_title')}</h2>
          <p className="text-zinc-400">{t('planner_desc')}</p>
        </div>
        <div className="relative w-full md:w-64">
          <svg className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
          <input
            type="text"
            placeholder={t('planner_search_placeholder')}
            value={searchQuery}
            onChange={(e) => {
              setSearchQuery(e.target.value);
              if (e.target.value) setSelectedMuscle(null);
            }}
            className="w-full bg-zinc-900 border border-zinc-800 rounded-xl pl-10 pr-4 py-2 text-sm text-white focus:outline-none focus:border-teal-500/50 transition-all"
          />
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-12">
        {/* Muscle Selection Sidebar */}
        <div className="lg:col-span-3 flex flex-col gap-2">
          {muscleList.map(muscleKey => (
            <button
              key={muscleKey}
              onClick={() => {
                setSelectedMuscle(muscleKey);
                setSearchQuery('');
              }}
              className={`text-left px-4 py-3 rounded-lg border transition-all ${selectedMuscle === muscleKey
                  ? 'bg-teal-500/10 border-teal-500 text-teal-400'
                  : 'bg-zinc-900/50 border-zinc-800 text-zinc-400 hover:bg-zinc-800'
                }`}
            >
              {getLocalizedMuscleName(muscleKey, language)}
            </button>
          ))}
        </div>

        {/* Exercise List */}
        <div className="lg:col-span-9">
          {searchQuery ? (
            <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
              <h3 className="text-xl font-bold text-teal-400 mb-6 flex items-center gap-2">
                {filteredExercises.length} results for "{searchQuery}"
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {filteredExercises.map((feat, i) => (
                  <Card
                    key={i}
                    className="p-4 flex flex-col gap-4 hover:bg-zinc-800 cursor-pointer group"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-zinc-800 flex items-center justify-center text-zinc-500 font-mono text-xs border border-zinc-700">
                          {i + 1}
                        </div>
                        <div className="flex flex-col">
                          <span className="text-zinc-200 font-medium">{feat.name}</span>
                          <span className="text-[10px] text-zinc-500 uppercase tracking-wider">{getLocalizedMuscleName(feat.muscle, language)}</span>
                        </div>
                      </div>
                    </div>

                    <SpotlightButton
                      variant="secondary"
                      className="w-full text-xs py-2 mt-2 opacity-0 group-hover:opacity-100 transition-opacity"
                      onClick={(e) => {
                        e.stopPropagation();
                        setSelectedExercise(feat.name);
                      }}
                    >
                      {t('btn_learn')}
                    </SpotlightButton>
                  </Card>
                ))}
              </div>
            </div>
          ) : selectedMuscle ? (
            <div className="animate-in slide-in-from-right-8 duration-500">
              <h3 className="text-2xl font-bold text-teal-400 mb-6 flex items-center gap-2">
                <span className="w-2 h-8 bg-teal-500 rounded-full"></span>
                {getLocalizedMuscleName(selectedMuscle, language)}
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {exerciseDB[selectedMuscle]?.map((ex, i) => (
                  <Card
                    key={i}
                    className="p-4 flex flex-col gap-4 hover:bg-zinc-800 cursor-pointer group"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-zinc-800 flex items-center justify-center text-zinc-500 font-mono text-xs border border-zinc-700">
                          {i + 1}
                        </div>
                        <span className="text-zinc-200 font-medium">{ex}</span>
                      </div>
                    </div>

                    <SpotlightButton
                      variant="secondary"
                      className="w-full text-xs py-2 mt-2 opacity-0 group-hover:opacity-100 transition-opacity"
                      onClick={(e) => {
                        e.stopPropagation();
                        setSelectedExercise(ex);
                      }}
                    >
                      {t('btn_learn')}
                    </SpotlightButton>
                  </Card>
                ))}
              </div>
            </div>
          ) : (
            <div className="h-[400px] flex items-center justify-center text-zinc-600 border-2 border-dashed border-zinc-800 rounded-2xl bg-zinc-900/20">
              <p>{t('planner_desc')}</p>
            </div>
          )}
        </div>
      </div>

      {/* Video/Image Modal */}
      {selectedExercise && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 animate-in fade-in duration-200">
          <div className="relative w-full max-w-2xl rounded-2xl border border-zinc-700 bg-zinc-900 p-6 shadow-2xl">
            <button
              onClick={() => setSelectedExercise(null)}
              className="absolute right-4 top-4 text-zinc-400 hover:text-white"
            >
              <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>

            <h3 className="text-2xl font-bold text-white mb-6 pr-8">{selectedExercise}</h3>

            <div className="aspect-video w-full rounded-xl bg-zinc-800 mb-6 overflow-hidden relative group">
              {/* Placeholder visual simulation */}
              <div className="absolute inset-0 bg-gradient-to-br from-teal-900/20 to-zinc-900 flex items-center justify-center">
                <div className="text-center">
                  <div className="mx-auto mb-4 h-16 w-16 rounded-full border-2 border-white/20 bg-white/10 flex items-center justify-center backdrop-blur-md">
                    <svg className="h-8 w-8 text-white ml-1" fill="currentColor" viewBox="0 0 24 24"><path d="M8 5v14l11-7z" /></svg>
                  </div>
                  <p className="text-sm text-zinc-400">Click below to search tutorial</p>
                </div>
              </div>
            </div>

            <div className="flex justify-end gap-4">
              <SpotlightButton variant="secondary" onClick={() => setSelectedExercise(null)}>
                {t('modal_close')}
              </SpotlightButton>
              <a
                href={`https://www.youtube.com/results?search_query=${selectedExercise}+technique`}
                target="_blank"
                rel="noreferrer"
                className="no-underline"
              >
                <SpotlightButton>
                  {t('modal_watch_video')}
                </SpotlightButton>
              </a>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};