import React from 'react';
import { useLanguage } from '../../contexts/LanguageContext';
import { TRAINING_SOURCES } from '../../utils/trainingEvidence';

const copy = {
  en: { title: 'Plan a sustainable routine', points: [
    'Train all major muscle groups across your week. Two or more resistance-training sessions are a useful starting structure for healthy adults.',
    'Choose movements that suit your equipment, experience and comfortable range of motion. Muscle-group labels describe an emphasis, not isolation.',
    'Build muscle with challenging, recoverable sets. Multiple rep ranges can work; reaching failure on every set is not required.',
    'Record reps and load for the same exercise. Increase gradually when you can meet your chosen rep target with controlled technique; repeating or reducing a session can be appropriate.',
    'Rest long enough to perform the next set well. Adapt volume and rest to your recovery. Stop if you experience sharp pain and seek appropriate advice.',
  ] },
  fr: { title: 'Construire une routine durable', points: [
    'Travaillez les principaux groupes musculaires au cours de la semaine. Deux séances de musculation ou plus sont un point de départ pour les adultes en bonne santé.',
    'Choisissez selon votre matériel, expérience et amplitude confortable. Les catégories musculaires indiquent une priorité, pas une isolation.',
    'Plusieurs plages de répétitions peuvent développer les muscles. L’échec à chaque série n’est pas obligatoire.',
    'Comparez le même exercice. Augmentez progressivement lorsque votre objectif est atteint avec une technique contrôlée. Répéter ou réduire une séance peut être adapté.',
    'Reposez-vous assez pour la série suivante et adaptez le volume à la récupération. Arrêtez en cas de douleur vive et demandez conseil.',
  ] },
  ar: { title: 'خطط لروتين قابل للاستمرار', points: [
    'درّب المجموعات العضلية الرئيسية خلال الأسبوع. حصتان أو أكثر من تمارين المقاومة نقطة بداية مفيدة للبالغين الأصحاء.',
    'اختر الحركات حسب المعدات والخبرة ومدى الحركة المريح. تصنيفات العضلات توضح التركيز ولا تعني العزل الكامل.',
    'يمكن بناء العضلات بنطاقات مختلفة من التكرارات. الوصول إلى الفشل في كل مجموعة ليس ضرورياً.',
    'قارن الوزن والتكرارات لنفس التمرين. زد تدريجياً عند تحقيق هدفك بتقنية متحكم بها؛ وقد يناسبك تكرار الحصة أو تخفيفها.',
    'استرح بما يكفي لأداء المجموعة التالية وعدّل الحجم حسب التعافي. توقف عند الألم الحاد واطلب النصيحة المناسبة.',
  ] },
};

export function TrainingGuidance() {
  const { language } = useLanguage();
  const content = copy[language];
  return <section className="mx-auto max-w-5xl px-6 py-8 text-zinc-800 dark:text-zinc-200">
    <h2 className="text-xl font-bold mb-4">{content.title}</h2>
    <ul className="list-disc ps-5 space-y-3 text-sm leading-relaxed">{content.points.map(p => <li key={p}>{p}</li>)}</ul>
    <div className="flex flex-wrap gap-4 mt-5">{TRAINING_SOURCES.map(s => <a className="text-teal-600 dark:text-teal-400 underline" key={s.url} href={s.url} target="_blank" rel="noreferrer">{s.name}</a>)}</div>
  </section>;
}
