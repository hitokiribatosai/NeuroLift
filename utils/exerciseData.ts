import { Language } from '../types';

export const getLocalizedMuscleName = (muscle: string, lang: Language): string => {
  const muscleMap: Record<string, Record<Language, string>> = {
    "Chest": { en: "Chest", fr: "Poitrine", ar: "الصدر" },
    "Back": { en: "Back", fr: "Dos", ar: "الظهر" },
    "Quads": { en: "Quads", fr: "Quadriceps", ar: "الأفخاذ الأمامية" },
    "Hamstrings": { en: "Hamstrings", fr: "Ischio-jambiers", ar: "الأفخاذ الخلفية" },
    "Calves": { en: "Calves", fr: "Mollets", ar: "السمانة" },
    "Shoulders": { en: "Shoulders", fr: "Épaules", ar: "الأكتاف" },
    "Biceps": { en: "Biceps", fr: "Biceps", ar: "البايسبس" },
    "Triceps": { en: "Triceps", fr: "Triceps", ar: "الترايسبس" },
    "Glutes": { en: "Glutes", fr: "Fessiers", ar: "العضلات الخلفية" },
    "Core": { en: "Core", fr: "Abdominaux", ar: "عضلات البطن" },
    "Full Body": { en: "Full Body", fr: "Corps Complet", ar: "كامل الجسم" }
  };

  return muscleMap[muscle]?.[lang] || muscle;
};

// Returns the full database of exercises translated
export const getExerciseDatabase = (lang: Language): Record<string, string[]> => {
  type ExerciseTranslation = { [key in Language]: string };

  const db: Record<string, ExerciseTranslation[]> = {
    "Chest": [
      { en: "Incline Dumbbell Press", fr: "Développé Incliné Haltères", ar: "ضغط مائل بالدمبل" },
      { en: "Flat Barbell Bench Press", fr: "Développé Couché Barre", ar: "بنش برس مستوي" },
      { en: "Weighted Dips", fr: "Dips Lestés", ar: "متوازي بأوزان" },
      { en: "Cable Flyes (Stretched)", fr: "Ecartés à la Poulie", ar: "تجميع بالكابل" },
      { en: "Machine Chest Press", fr: "Développé Machine", ar: "ضغط صدر بالماكينة" },
      { en: "Deficit Push-ups", fr: "Pompes Surélevées", ar: "تمرين الضغط" },
      { en: "Pec Deck Machine", fr: "Pec Deck", ar: "جهاز الفراشة" },
      { en: "Landmine Press", fr: "Landmine Press", ar: "ضغط لاندماين" },
      { en: "Svend Press", fr: "Presse Svend", ar: "ضغط سفيند" },
      { en: "Decline Dumbbell Press", fr: "Développé Décliné", ar: "ضغط مائل للأسفل" },
      { en: "Low Cable Crossover", fr: "Poulie Vis-à-vis Basse", ar: "تجميع كابل سفلي" },
      { en: "Guillotine Press", fr: "Développé Guillotine", ar: "ضغط المقصلة" },
      { en: "Dumbbell Pullover", fr: "Pull-over Haltère", ar: "بلوفر دمبل" },
      { en: "Smith Machine Press", fr: "Développé Smith", ar: "ضغط سميث" },
      { en: "Wide Grip Dips", fr: "Dips Prise Large", ar: "متوازي واسع" }
    ],
    "Back": [
      { en: "Weighted Pull-ups", fr: "Tractions Lestées", ar: "عقلة بأوزان" },
      { en: "Barbell Bent-Over Rows", fr: "Rowing Barre", ar: "تجديف بالبار" },
      { en: "Meadows Row", fr: "Rowing Meadows", ar: "تجديف ميدوز" },
      { en: "Neutral Grip Lat Pulldown", fr: "Tirage Poitrine Neutre", ar: "سحب عالي قبضة محايدة" },
      { en: "Chest-Supported T-Bar Row", fr: "Rowing T-Bar", ar: "تجديف تي بار" },
      { en: "Rack Pulls", fr: "Rack Pulls", ar: "راك بول" },
      { en: "Single-Arm Cable Row", fr: "Tirage Unilatéral Poulie", ar: "سحب كابل فردي" },
      { en: "Face Pulls", fr: "Face Pulls", ar: "سحب للوجه" },
      { en: "Straight-Arm Pulldown", fr: "Pull-over Poulie", ar: "سحب ذراع مستقيم" },
      { en: "Seal Rows", fr: "Rowing Seal", ar: "تجديف سيل" },
      { en: "Pendlay Row", fr: "Rowing Pendlay", ar: "تجديف بندلاي" },
      { en: "Lat Prayers (Cable)", fr: "Extension Bras Tendus", ar: "صلاة الظهر" },
      { en: "Kroc Rows", fr: "Kroc Rows", ar: "تجديف كروك" },
      { en: "Kelso Shrugs", fr: "Shrugs Kelso", ar: "هزات كيلسو" },
      { en: "Inverted Rows", fr: "Traction Australienne", ar: "تجديف مقلوب" }
    ],
    "Quads": [
      { en: "High-Bar Squat", fr: "Squat Barre Haute", ar: "سكوات بار عالي" },
      { en: "Bulgarian Split Squat", fr: "Fentes Bulgares", ar: "تمرين الطحن البلغاري" },
      { en: "Leg Press", fr: "Presse à Cuisses", ar: "ضغط الساق" },
      { en: "Leg Extensions", fr: "Leg Extension", ar: "رفرفة رجل أمامي" },
      { en: "Walking Lunges", fr: "Fentes Marchées", ar: "طعن بالمشي" },
      { en: "Hack Squat", fr: "Hack Squat", ar: "هاك سكوات" },
      { en: "Front Squat", fr: "Squat Avant", ar: "سكوات أمامي" },
      { en: "Sissy Squat", fr: "Sissy Squat", ar: "سيسي سكوات" },
      { en: "Goblet Squat", fr: "Goblet Squat", ar: "جوبلت سكوات" },
      { en: "Step Ups", fr: "Montées sur Banc", ar: "صعود الدرج" },
    ],
    "Hamstrings": [
      { en: "Romanian Deadlift (RDL)", fr: "Soulevé de Terre Roumain", ar: "رفعة مميتة رومانية" },
      { en: "Lying Leg Curls", fr: "Leg Curl Allongé", ar: "رفرفة رجل خلفي نائم" },
      { en: "Seated Leg Curls", fr: "Leg Curl Assis", ar: "رفرفة رجل خلفي جالس" },
      { en: "Glute-Ham Raise", fr: "Glute-Ham Raise", ar: "GHR تمرين" },
      { en: "Nordic Hamstring Curl", fr: "Nordic Curl", ar: "نورديك كيرل" },
      { en: "Good Mornings", fr: "Good Mornings", ar: "جود مورنينج" },
      { en: "Stiff-Leg Deadlift", fr: "Soulevé de Terre Jambes Tendues", ar: "رفعة مميتة أرجل مستقيمة" },
      { en: "Single-Leg RDL", fr: "RDL Unilatéral", ar: "رفعة مميتة رومانية فردية" },
      { en: "Kettlebell Swings", fr: "Swing Kettlebell", ar: "أرجحة الكيتل بيل" },
      { en: "Slider Leg Curls", fr: "Leg Curl Glissé", ar: "تمرين سحب الأرجل" },
    ],
    "Glutes": [
      { en: "Hip Thrusts", fr: "Hip Thrust", ar: "دفع الحوض" },
      { en: "Glute Bridge", fr: "Pont de Fessiers", ar: "جسر الألوية" },
      { en: "Cable Kickbacks", fr: "Kickback Poulie", ar: "ركلة كابل خلفية" },
      { en: "Hyperextensions", fr: "Extensions au Banc", ar: "تمديد الظهر" },
      { en: "Sumo Deadlift", fr: "Soulevé de Terre Sumo", ar: "رفعة مميتة سومو" }
    ],
    "Calves": [
      { en: "Standing Calf Raises", fr: "Extensions Debout", ar: "رفع السمانة واقف" },
      { en: "Seated Calf Raises", fr: "Extensions Assis", ar: "رفع السمانة جالس" },
      { en: "Leg Press Calf Raises", fr: "Extensions Presse", ar: "سمانة على جهاز الضغط" },
      { en: "Donkey Calf Raises", fr: "Extensions Dos d'Âne", ar: "سمانة دونكي" },
      { en: "Single-Leg Calf Raises", fr: "Extensions Unilatérales", ar: "سمانة رجل واحدة" },
      { en: "Tibialis Raises", fr: "Relevés Tibial", ar: "رفع الساق الأمامية" },
      { en: "Smith Machine Calf Raises", fr: "Extensions Smith", ar: "سمانة سميث" },
      { en: "Jump Rope", fr: "Corde à Sauter", ar: "نط الحبل" },
      { en: "Farmer's Walk on Toes", fr: "Marche Fermier Pointes", ar: "مشي المزارع على الأصابع" },
      { en: "Box Jumps", fr: "Sauts sur Boîte", ar: "قفز الصندوق" },
    ],
    "Shoulders": [
      { en: "Overhead Press", fr: "Développé Militaire", ar: "ضغط أكتاف واقف" },
      { en: "Egyptian Lateral Raises", fr: "Élévations Latérales", ar: "رفرفة جانبي" },
      { en: "Reverse Pec Deck", fr: "Oiseau Machine", ar: "فراشة خلفي" },
      { en: "Seated Dumbbell Press", fr: "Développé Assis Haltères", ar: "ضغط أكتاف جالس" },
      { en: "Upright Rows", fr: "Tirage Menton", ar: "سحب للذقن" },
      { en: "Face Pulls", fr: "Face Pulls", ar: "سحب للوجه" },
      { en: "Front Raises", fr: "Élévations Frontales", ar: "رفرفة أمامي" },
      { en: "Arnold Press", fr: "Développé Arnold", ar: "ضغط أرنولد" },
      { en: "Cable Lateral Raises", fr: "Élévations Latérales Poulie", ar: "رفرفة جانبي كابل" },
      { en: "Rear Delt Flyes", fr: "Oiseau Haltères", ar: "رفرفة خلفي دمبل" },
    ],
    "Biceps": [
      { en: "Incline Dumbbell Curls", fr: "Curl Incliné", ar: "بايسبس مائل" },
      { en: "Hammer Curls", fr: "Curl Marteau", ar: "بايسبس المطرقة" },
      { en: "Preacher Curls", fr: "Curl Pupitre", ar: "بايسبس ارتكاز" },
      { en: "Bayesian Cable Curl", fr: "Curl Poulie Dos", ar: "بايسبس كابل خلفي" },
      { en: "Spider Curls", fr: "Spider Curl", ar: "سبايدر كيرل" },
    ],
    "Triceps": [
      { en: "Skullcrushers", fr: "Barre au Front", ar: "طحن الجمجمة" },
      { en: "Tricep Pushdowns", fr: "Extension Poulie", ar: "ترايسبس كابل" },
      { en: "Overhead Cable Extensions", fr: "Extension Nuque", ar: "ترايسبس خلف الرأس" },
      { en: "Close-Grip Bench", fr: "Développé Couché Serré", ar: "بنش برس ضيق" },
      { en: "Weighted Bench Dips", fr: "Dips Banc", ar: "متوازي بنش" },
    ],
    "Core": [
      { en: "Hanging Leg Raises", fr: "Relevés de Jambes", ar: "رفع الأرجل معلق" },
      { en: "Cable Crunches", fr: "Crunch Poulie", ar: "طحن بالكابل" },
      { en: "Ab Wheel Rollouts", fr: "Roulette Abdo", ar: "عجلة البطن" },
      { en: "Plank", fr: "Gainage", ar: "بلانك" },
      { en: "Woodchoppers", fr: "Bûcheron", ar: "تمرين الحطاب" },
      { en: "Dragon Flags", fr: "Drapeau Dragon", ar: "علم التنين" },
      { en: "Russian Twists", fr: "Russian Twist", ar: "التواء روسي" },
      { en: "Dead Bugs", fr: "Dead Bugs", ar: "ديد بج" },
      { en: "L-Sit", fr: "L-Sit", ar: "الجلوس حرف L" },
      { en: "Vacuum", fr: "Vacuum", ar: "فراغ المعدة" },
    ]
  };

  // Transform internal structure to simple string arrays based on language
  const localizedDB: Record<string, string[]> = {};

  Object.keys(db).forEach(muscleKey => {
    localizedDB[muscleKey] = db[muscleKey].map(exObj => exObj[lang] || exObj['en']);
  });

  return localizedDB;
};