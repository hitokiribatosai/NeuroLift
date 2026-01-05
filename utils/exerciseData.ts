import { Language, ExerciseDatabase } from '../types';

export const getLocalizedMuscleName = (muscle: string, lang: Language): string => {
  const muscleMap: Record<string, Record<Language, string>> = {
    "Chest": { en: "Chest", fr: "Poitrine", ar: "الصدر" },
    "Back": { en: "Back", fr: "Dos", ar: "الظهر" },
    "Shoulders": { en: "Shoulders", fr: "Épaules", ar: "الأكتاف" },
    "Legs": { en: "Legs", fr: "Jambes", ar: "الأرجل" },
    "Arms": { en: "Arms", fr: "Bras", ar: "الذراعين" },
    "Core": { en: "Core", fr: "Abdominaux", ar: "عضلات البطن" },
    "Full Body": { en: "Full Body", fr: "Corps Complet", ar: "كامل الجسم" },
    // Subcategories (for display)
    "Upper Chest": { en: "Upper Chest", fr: "Haut des Pectoraux", ar: "الصدر العلوي" },
    "Middle Chest": { en: "Middle Chest", fr: "Milieu des Pectoraux", ar: "الصدر المستوي" },
    "Lower Chest": { en: "Lower Chest", fr: "Bas des Pectoraux", ar: "الصدر السفلي" },
    "Lats": { en: "Lats (Width)", fr: "Grand Dorsal (Largeur)", ar: "المجنص (عرض)" },
    "Upper Back": { en: "Upper Back", fr: "Haut du Dos", ar: "الظهر العلوي" },
    "Mid Back": { en: "Mid Back (Thickness)", fr: "Milieu du Dos (Épaisseur)", ar: "منتصف الظهر (سمك)" },
    "Lower Back": { en: "Lower Back", fr: "Bas du Dos", ar: "الظهر السفلي" },
    "Front Delts": { en: "Front Delts", fr: "Deltoïde Antérieur", ar: "الكتف الأمامي" },
    "Side Delts": { en: "Side Delts", fr: "Deltoïde Latéral", ar: "الكتف الجانبي" },
    "Rear Delts": { en: "Rear Delts", fr: "Deltoïde Postérieur", ar: "الكتف الخلفي" },
    "Quads": { en: "Quads", fr: "Quadriceps", ar: "الأفخاذ الأمامية" },
    "Hamstrings": { en: "Hamstrings", fr: "Ischio-jambiers", ar: "الأفخاذ الخلفية" },
    "Glutes": { en: "Glutes", fr: "Fessiers", ar: "البنش" },
    "Calves": { en: "Calves", fr: "Mollets", ar: "السمانة" },
    "Biceps": { en: "Biceps", fr: "Biceps", ar: "البايسبس" },
    "Triceps": { en: "Triceps", fr: "Triceps", ar: "الترايسبس" },
    "Forearms": { en: "Forearms", fr: "Avant-bras", ar: "الساعدين" }
  };

  return muscleMap[muscle]?.[lang] || muscle;
};

export const getExerciseDatabase = (lang: Language): ExerciseDatabase => {
  type Translation = { [key in Language]: string };

  const db: Record<string, Record<string, { weightlifting: Translation[], cables: Translation[], bodyweight: Translation[] }>> = {
    "Chest": {
      "Upper Chest": {
        weightlifting: [
          { en: "Incline Barbell Bench Press", fr: "Développé Incliné Barre", ar: "بنش برس مائل بالبار" },
          { en: "Incline Dumbbell Press", fr: "Développé Incliné Haltères", ar: "بنش برس مائل بالدمبل" },
          { en: "Smith Machine Incline Press", fr: "Développé Incliné Smith", ar: "ضغط مائل سميث" }
        ],
        cables: [
          { en: "Cable Crossover (Low to High)", fr: "Poulie Vis-à-vis (Bas en Haut)", ar: "تجميع كابل من الأسفل" }
        ],
        bodyweight: [
          { en: "Decline Push-ups", fr: "Pompes Déclinées", ar: "ضغط مائل للأسفل" }
        ]
      },
      "Middle Chest": {
        weightlifting: [
          { en: "Flat Barbell Bench Press", fr: "Développé Couché Barre", ar: "بنش برس مستوي بالبار" },
          { en: "Flat Dumbbell Press", fr: "Développé Couché Haltères", ar: "بنش برس مستوي بالدمبل" },
          { en: "Hammer Strength Chest Press", fr: "Presse Poitrine Hammer", ar: "ضغط صدر هامر" },
          { en: "Pec Deck Machine", fr: "Pec Deck", ar: "جهاز الفراشة" }
        ],
        cables: [
          { en: "Middle Cable Fly", fr: "Ecartés Poulie Milieu", ar: "تجميع كابل مستوي" }
        ],
        bodyweight: [
          { en: "Push-ups", fr: "Pompes", ar: "تمرين الضغط" }
        ]
      },
      "Lower Chest": {
        weightlifting: [
          { en: "Decline Barbell Bench Press", fr: "Développé Décliné Barre", ar: "بنش برس مائل للأسفل بالبار" },
          { en: "Weighted Dips (Chest Focus)", fr: "Dips Lestés (Poitrine)", ar: "متوازي بأوزان للصدر" }
        ],
        cables: [
          { en: "Cable Crossover (High to Low)", fr: "Poulie Vis-à-vis (Haut en Bas)", ar: "تجميع كابل من الأعلى" }
        ],
        bodyweight: [
          { en: "Incline Push-ups", fr: "Pompes Inclinées", ar: "ضغط مائل" }
        ]
      }
    },
    "Back": {
      "Lats": {
        weightlifting: [],
        cables: [
          { en: "Lat Pulldowns", fr: "Tirage Poitrine", ar: "سحب عالي للظهر" },
          { en: "Straight Arm Pulldown", fr: "Pull-over Poulie Haute", ar: "سحب ذراع مستقيم" },
          { en: "Single Arm Lat Pulldown", fr: "Tirage Unilatéral", ar: "سحب عالي فردي" }
        ],
        bodyweight: [
          { en: "Pull-ups", fr: "Tractions", ar: "عقلة" },
          { en: "Chin-ups", fr: "Tractions Supination", ar: "عقلة قبضة معكوسة" }
        ]
      },
      "Upper Back": {
        weightlifting: [
          { en: "Meadows Rows", fr: "Rowing Meadows", ar: "تجديف ميدوز" },
          { en: "One-Arm Dumbbell Row", fr: "Rowing Unilatéral Haltère", ar: "تجديف دمبل فردي" }
        ],
        cables: [
          { en: "Face Pulls", fr: "Face Pulls", ar: "سحب للوجه" }
        ],
        bodyweight: [
          { en: "Scapular Pull-ups", fr: "Tractions Scapulaires", ar: "عقلة لوح الكتف" }
        ]
      },
      "Mid Back": {
        weightlifting: [
          { en: "Barbell Rows", fr: "Rowing Barre", ar: "تجديف بالبار" },
          { en: "T-Bar Rows", fr: "Rowing T-Bar", ar: "تجديف تي بار" },
          { en: "Machine Seated Row", fr: "Rowing Machine Assis", ar: "تجديف ماكينة جالس" }
        ],
        cables: [
          { en: "Seated Cable Rows", fr: "Rowing Poulie Basse", ar: "تجديف كابل جالس" }
        ],
        bodyweight: [
          { en: "Inverted Rows", fr: "Tractions Australiennes", ar: "تجديف مقلوب" }
        ]
      },
      "Lower Back": {
        weightlifting: [
          { en: "Deadlifts", fr: "Soulevé de Terre", ar: "رفعة مميتة" },
          { en: "Rack Pulls", fr: "Rack Pulls", ar: "راك بول" }
        ],
        cables: [],
        bodyweight: [
          { en: "Superman", fr: "Superman", ar: "تمرين سوبرمان" }
        ]
      }
    },
    "Shoulders": {
      "Front Delts": {
        weightlifting: [
          { en: "Barbell Overhead Press", fr: "Développé Militaire Barre", ar: "ضغط أكتاف بالبار" },
          { en: "Dumbbell Shoulder Press", fr: "Développé Épaules Haltères", ar: "ضغط أكتاف بالدمبل" },
          { en: "Arnold Press", fr: "Développé Arnold", ar: "ضغط أرنولد" },
          { en: "Dumbbell Front Raise", fr: "Élévations Frontales Haltères", ar: "رفرفة أمامي بالدمبل" }
        ],
        cables: [
          { en: "Cable Front Raise", fr: "Élévations Frontales Poulie", ar: "رفرفة أمامي كابل" }
        ],
        bodyweight: [
          { en: "Handstand Push-ups", fr: "Pompes en Équilibre", ar: "ضغط وقوفاً على اليد" }
        ]
      },
      "Side Delts": {
        weightlifting: [
          { en: "Dumbbell Lateral Raise", fr: "Élévations Latérales Haltères", ar: "رفرفة جانبي بالدمبل" },
          { en: "Machine Lateral Raise", fr: "Élévations Latérales Machine", ar: "رفرفة جانبي ماكينة" }
        ],
        cables: [
          { en: "Cable Lateral Raise", fr: "Élévations Latérales Poulie", ar: "رفرفة جانبي كابل" },
          { en: "Cable Upright Row", fr: "Tirage Menton Poulie", ar: "سحب للذقن كابل" }
        ],
        bodyweight: [
          { en: "Pike Push-ups", fr: "Pompes Pike", ar: "ضغط بايك" }
        ]
      },
      "Rear Delts": {
        weightlifting: [
          { en: "Reverse Dumbbell Fly", fr: "Oiseau Haltères", ar: "رفرفة خلفي بالدمبل" }
        ],
        cables: [
          { en: "Cable Face Pull", fr: "Tirage Visage Poulie", ar: "سحب للوجه كابل" },
          { en: "Single Arm Cable Rear Delt Fly", fr: "Oiseau Unilatéral Poulie", ar: "رفرفة خلفي فردي كابل" }
        ],
        bodyweight: []
      }
    },
    "Legs": {
      "Quads": {
        weightlifting: [
          { en: "Back Squat", fr: "Squat Arrière", ar: "سكوات خلفي" },
          { en: "Front Squat", fr: "Squat Avant", ar: "سكوات أمامي" },
          { en: "Leg Press", fr: "Presse à Cuisses", ar: "ضغط الساق" },
          { en: "Leg Extension", fr: "Leg Extension", ar: "رفرفة رجل أمامي" }
        ],
        cables: [],
        bodyweight: [
          { en: "Bodyweight Squats", fr: "Squats Corps de Poids", ar: "سكوات بوزن الجسم" },
          { en: "Pistol Squats", fr: "Squat Unilatéral", ar: "سكوات فردي" }
        ]
      },
      "Hamstrings": {
        weightlifting: [
          { en: "Romanian Deadlift", fr: "Soulevé de Terre Roumain", ar: "رفعة مميتة رومانية" },
          { en: "Lying Leg Curl", fr: "Leg Curl Allongé", ar: "رفرفة رجل خلفي نائم" },
          { en: "Seated Leg Curl", fr: "Leg Curl Assis", ar: "رفرفة رجل خلفي جالس" }
        ],
        cables: [
          { en: "Cable Pull Through", fr: "Pull Through Poulie", ar: "سحب كابل خلفي" }
        ],
        bodyweight: [
          { en: "Nordic Curls", fr: "Nordic Curl", ar: "نورديك كيرل" }
        ]
      },
      "Glutes": {
        weightlifting: [
          { en: "Barbell Hip Thrust", fr: "Hip Thrust Barre", ar: "دفع الحوض بالبار" },
          { en: "Machine Abduction", fr: "Abduction Machine", ar: "ابعاد الأرجل ماكينة" }
        ],
        cables: [
          { en: "Cable Kickback", fr: "Kickback Poulie", ar: "ركلة كابل خلفية" }
        ],
        bodyweight: [
          { en: "Glute Bridge", fr: "Pont de Fessiers", ar: "جسر الألوية" }
        ]
      },
      "Calves": {
        weightlifting: [
          { en: "Standing Calf Raise", fr: "Extensions Debout", ar: "رفع السمانة واقف" },
          { en: "Seated Calf Raise", fr: "Extensions Assis", ar: "رفع السمانة جالس" }
        ],
        cables: [],
        bodyweight: [
          { en: "Bodyweight Calf Raises", fr: "Extensions Corps de Poids", ar: "رفع سمانة وزن جسم" }
        ]
      }
    },
    "Arms": {
      "Biceps": {
        weightlifting: [
          { en: "Barbell Curls", fr: "Curl Barre", ar: "تبادل بايسبس بار" },
          { en: "Dumbbell Curls", fr: "Curl Haltères", ar: "تبادل بايسبس دمبل" },
          { en: "Preacher Curls", fr: "Curl Pupitre", ar: "بايسبس ارتكاز" }
        ],
        cables: [
          { en: "Standing Cable Curl", fr: "Curl Poulie Debout", ar: "تبادل كابل واقف" }
        ],
        bodyweight: [
          { en: "Chin-ups", fr: "Tractions Supination", ar: "عقلة بايسبس" }
        ]
      },
      "Triceps": {
        weightlifting: [
          { en: "Close Grip Bench Press", fr: "DC Serré", ar: "بنش برس ضيق" },
          { en: "Skull Crushers", fr: "Skull Crushers", ar: "طحن الجمجمة" }
        ],
        cables: [
          { en: "Tricep Pushdown", fr: "Extension Poulie Barre", ar: "سحب كابل مستقيم" },
          { en: "Rope Pushdown", fr: "Extension Poulie Corde", ar: "سحب كابل حبل" }
        ],
        bodyweight: [
          { en: "Dips", fr: "Dips", ar: "غطس" }
        ]
      },
      "Forearms": {
        weightlifting: [
          { en: "Barbell Wrist Curls", fr: "Flexion Poignets Barre", ar: "ثني الرسغ بالبار" }
        ],
        cables: [],
        bodyweight: [
          { en: "Dead hang", fr: "Suspension", ar: "تعليق حر" }
        ]
      }
    },
    "Core": {
      "Abs": {
        weightlifting: [
          { en: "Weighted Crunches", fr: "Crunch Lesté", ar: "طحن بوزن" }
        ],
        cables: [
          { en: "Cable Crunches", fr: "Crunch Poulie", ar: "طحن كابل" }
        ],
        bodyweight: [
          { en: "Plank", fr: "Gainage", ar: "بلانك" },
          { en: "Hanging Leg Raises", fr: "Relevés de Jambes Suspendus", ar: "رفع الأرجل معلق" }
        ]
      }
    }
  };

  const localizedDB: ExerciseDatabase = {};

  Object.keys(db).forEach(majorCategory => {
    localizedDB[majorCategory] = {};
    Object.keys(db[majorCategory]).forEach(subCategory => {
      localizedDB[majorCategory][subCategory] = {
        weightlifting: db[majorCategory][subCategory].weightlifting.map(ex => ex[lang] || ex['en']),
        cables: db[majorCategory][subCategory].cables.map(ex => ex[lang] || ex['en']),
        bodyweight: db[majorCategory][subCategory].bodyweight.map(ex => ex[lang] || ex['en'])
      };
    });
  });

  return localizedDB;
};