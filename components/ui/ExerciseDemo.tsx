import React, { useEffect, useState } from 'react';
import media from '../../utils/exerciseMedia.json';
import { getEnglishExerciseName, getExerciseTranslation } from '../../utils/exerciseData';
import { useLanguage } from '../../contexts/LanguageContext';
const labels = {
 en: ['No matching demonstration is bundled for this exercise.', 'Play two-frame demo', 'Pause', 'Two reference positions; not a continuous demonstration.', 'Source', 'Source movement'],
 fr: ['Aucune démonstration correspondante disponible.', 'Animer les deux images', 'Pause', 'Deux positions de référence ; pas une démonstration continue.', 'Source', 'Mouvement de la source'],
 ar: ['لا توجد صور مطابقة لهذا التمرين حالياً.', 'تشغيل الصورتين', 'إيقاف', 'وضعيتان مرجعيتان وليستا عرضاً متصلاً للحركة.', 'المصدر', 'التمرين في المصدر'],
};
export function ExerciseDemo({ name }: { name: string }) {
 const { language } = useLanguage();
 const [playing, setPlaying] = useState(false), [frame, setFrame] = useState(0), [failed, setFailed] = useState(false);
 const entry = (media as Record<string, { sourceId: string; sourceName: string; images: string[]; revision: string }>)[getEnglishExerciseName(name)];
 const text = labels[language];
 useEffect(() => { setPlaying(false); setFrame(0); setFailed(false); }, [name]);
 useEffect(() => {
  if (!playing) return;
  const timer = window.setInterval(() => setFrame(f => 1 - f), 1200);
  return () => window.clearInterval(timer);
 }, [playing]);
 if (!entry || failed) return <p className="my-4 text-sm text-zinc-500" role="status">{text[0]}</p>;
 return <figure className="my-5 space-y-3">
  <div className="flex gap-2 bg-white rounded-xl overflow-hidden">
   {entry.images.map((src, i) => <img key={src} src={src} alt={getExerciseTranslation(name, language) + ' — ' + (i + 1) + '/2'} onError={() => setFailed(true)} style={{ display: playing && i !== frame ? 'none' : 'block', width: playing ? '100%' : '50%' }} className="object-contain max-h-72" />)}
  </div>
  <button type="button" className="px-4 py-2 border rounded-lg" onClick={() => setPlaying(p => !p)}>{playing ? text[2] : text[1]}</button>
  <figcaption className="text-xs text-zinc-500">{text[3]} {entry.sourceName !== getEnglishExerciseName(name) && <span>{text[5]}: {entry.sourceName}. </span>}<a className="underline" href={'https://github.com/yuhonas/free-exercise-db/blob/' + entry.revision + '/exercises/' + entry.sourceId + '.json'} target="_blank" rel="noreferrer">{text[4]}: free-exercise-db (Unlicense)</a></figcaption>
 </figure>;
}
