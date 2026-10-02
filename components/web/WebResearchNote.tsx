import React from 'react';
import { useLanguage } from '../../contexts/LanguageContext';

export function WebResearchNote() {
  const { language } = useLanguage();
  const copy = {
    en: ['How to read the research labels', 'Research-supported does not mean proven best for everyone.', 'Direct training study: the named movement was studied over a training period.', 'Related movement: the linked study tested a different variation; do not assume identical results.', 'This curated collection uses training-study labels, not muscle-activation (EMG) ratings. Read the study and its limitations; an image is not evidence.'],
    fr: ['Comprendre les étiquettes de recherche', 'Étudié ne signifie pas meilleur pour tout le monde.', 'Étude directe : le mouvement nommé a été étudié sur une période d’entraînement.', 'Mouvement apparenté : l’étude porte sur une autre variante ; les résultats ne sont pas nécessairement identiques.', 'Cette sélection utilise des études d’entraînement, pas des scores d’activation musculaire (EMG). Consultez les études et leurs limites ; une image ne constitue pas une preuve.'],
    ar: ['كيف تقرأ تصنيفات الدراسات', 'مدعوم بالأبحاث لا يعني أنه الأفضل للجميع.', 'دراسة تدريبية مباشرة: دُرست الحركة المذكورة خلال فترة تدريب.', 'حركة مشابهة: اختبرت الدراسة نسخة أخرى؛ لا تفترض تطابق النتائج.', 'تستخدم هذه المجموعة تصنيفات دراسات التدريب، لا درجات التنشيط العضلي (EMG). اقرأ الدراسة وحدودها؛ الصورة ليست دليلاً علمياً.'],
  }[language];
  return <details className="web-research-note"><summary>{copy[0]}</summary><p>{copy[1]}</p><ul>{copy.slice(2).map(text => <li key={text}>{text}</li>)}</ul></details>;
}
