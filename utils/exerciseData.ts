import { Language, ExerciseDatabase } from '../types';

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
    "Glutes": { en: "Glutes", fr: "Fessiers", ar: "البنش" },
    "Core": { en: "Core", fr: "Abdominaux", ar: "عضلات البطن" },
    "Full Body": { en: "Full Body", fr: "Corps Complet", ar: "كامل الجسم" }
  };

  return muscleMap[muscle]?.[lang] || muscle;
};

// Returns the full database of exercises translated
export const getExerciseDatabase = (lang: Language): ExerciseDatabase => {
  type Translation = { [key in Language]: string };

  const db: Record<string, { weightlifting: Translation[], cables: Translation[], bodyweight: Translation[] }> = {
    "Chest": {
      weightlifting: [
        { en: "Flat Barbell Bench Press", fr: "Développé Couché Barre", ar: "بنش برس مستوي بالبار" },
        { en: "Incline Barbell Bench Press", fr: "Développé Incliné Barre", ar: "بنش برس مائل بالبار" },
        { en: "Decline Barbell Bench Press", fr: "Développé Décliné Barre", ar: "بنش برس مائل للأسفل بالبار" },
        { en: "Flat Dumbbell Press", fr: "Développé Couché Haltères", ar: "بنش برس مستوي بالدمبل" },
        { en: "Incline Dumbbell Press", fr: "Développé Incliné Haltères", ar: "بنش برس مائل بالدمبل" },
        { en: "Dumbbell Pullover", fr: "Pull-over Haltère", ar: "بلوفر دمبل" },
        { en: "Hammer Strength Chest Press", fr: "Presse Poitrine Hammer", ar: "ضغط صدر هامر" },
        { en: "Smith Machine Incline Press", fr: "Développé Incliné Smith", ar: "ضغط مائل سميث" },
        { en: "Pec Deck Machine", fr: "Pec Deck", ar: "جهاز الفراشة" },
        { en: "Weighted Dips (Chest Focus)", fr: "Dips Lestés (Poitrine)", ar: "متوازي بأوزان للصدر" }
      ],
      cables: [
        { en: "Cable Crossover (High to Low)", fr: "Poulie Vis-à-vis (Haut en Bas)", ar: "تجميع كابل من الأعلى" },
        { en: "Cable Crossover (Low to High)", fr: "Poulie Vis-à-vis (Bas en Haut)", ar: "تجميع كابل من الأسفل" },
        { en: "Middle Cable Fly", fr: "Ecartés Poulie Milieu", ar: "تجميع كابل مستوي" },
        { en: "Single Arm Cable Press", fr: "Développé Unilatéral Poulie", ar: "ضغط كابل فردي" },
        { en: "Standing Cable Chest Press", fr: "Développé Couché Debout Poulie", ar: "ضغط صدر كابل واقف" }
      ],
      bodyweight: [
        { en: "Push-ups", fr: "Pompes", ar: "تمرين الضغط" },
        { en: "Diamond Push-ups", fr: "Pompes Diamant", ar: "ضغط ماسي" },
        { en: "Wide Grip Push-ups", fr: "Pompes Prise Large", ar: "ضغط قبضة واسعة" },
        { en: "Incline Push-ups", fr: "Pompes Inclinées", ar: "ضغط مائل" },
        { en: "Decline Push-ups", fr: "Pompes Déclinées", ar: "ضغط مائل للأسفل" }
      ]
    },
    "Back": {
      weightlifting: [
        { en: "Barbell Rows", fr: "Rowing Barre", ar: "تجديف بالبار" },
        { en: "Deadlifts", fr: "Soulevé de Terre", ar: "رفعة مميتة" },
        { en: "Dumbbell Rows", fr: "Rowing Haltère", ar: "تجديف بالدمبل" },
        { en: "T-Bar Rows", fr: "Rowing T-Bar", ar: "تجديف تي بار" },
        { en: "Rack Pulls", fr: "Rack Pulls", ar: "راك بول" },
        { en: "Meadows Rows", fr: "Rowing Meadows", ar: "تجديف ميدوز" },
        { en: "One-Arm Dumbbell Row", fr: "Rowing Unilatéral Haltère", ar: "تجديف دمبل فردي" },
        { en: "Seal Row", fr: "Rowing Seal", ar: "تجديف سيل" },
        { en: "Smith Machine Rows", fr: "Rowing Smith", ar: "تجديف سميث" },
        { en: "Machine Seated Row", fr: "Rowing Machine Assis", ar: "تجديف ماكينة جالس" }
      ],
      cables: [
        { en: "Lat Pulldowns", fr: "Tirage Poitrine", ar: "سحب عالي للظهر" },
        { en: "Seated Cable Rows", fr: "Rowing Poulie Basse", ar: "تجديف كابل جالس" },
        { en: "Straight Arm Pulldown", fr: "Pull-over Poulie Haute", ar: "سحب ذراع مستقيم" },
        { en: "Single Arm Lat Pulldown", fr: "Tirage Unilatéral", ar: "سحب عالي فردي" },
        { en: "Face Pulls", fr: "Face Pulls", ar: "سحب للوجه" }
      ],
      bodyweight: [
        { en: "Pull-ups", fr: "Tractions", ar: "عقلة" },
        { en: "Chin-ups", fr: "Tractions Supination", ar: "عقلة قبضة معكوسة" },
        { en: "Inverted Rows", fr: "Tractions Australiennes", ar: "تجديف مقلوب" },
        { en: "Superman", fr: "Superman", ar: "تمرين سوبرمان" },
        { en: "Scapular Pull-ups", fr: "Tractions Scapulaires", ar: "عقلة لوح الكتف" }
      ]
    },
    "Shoulders": {
      weightlifting: [
        { en: "Barbell Overhead Press", fr: "Développé Militaire Barre", ar: "ضغط أكتاف بالبار" },
        { en: "Dumbbell Shoulder Press", fr: "Développé Épaules Haltères", ar: "ضغط أكتاف بالدمبل" },
        { en: "Arnold Press", fr: "Développé Arnold", ar: "ضغط أرنولد" },
        { en: "Dumbbell Lateral Raise", fr: "Élévations Latérales Haltères", ar: "رفرفة جانبي بالدمبل" },
        { en: "Barbell Upright Row", fr: "Tirage Menton Barre", ar: "سحب للذقن بالبار" },
        { en: "Dumbbell Front Raise", fr: "Élévations Frontales Haltères", ar: "رفرفة أمامي بالدمبل" },
        { en: "Reverse Dumbbell Fly", fr: "Oiseau Haltères", ar: "رفرفة خلفي بالدمبل" },
        { en: "Smith Machine Press", fr: "Développé Smith Épaules", ar: "ضغط أكتاف سميث" },
        { en: "Machine Lateral Raise", fr: "Élévations Latérales Machine", ar: "رفرفة جانبي ماكينة" },
        { en: "Seated Dumbbell Press", fr: "Développé Assis Haltères", ar: "ضغط أكتاف جالس بالدمبل" }
      ],
      cables: [
        { en: "Cable Lateral Raise", fr: "Élévations Latérales Poulie", ar: "رفرفة جانبي كابل" },
        { en: "Cable Front Raise", fr: "Élévations Frontales Poulie", ar: "رفرفة أمامي كابل" },
        { en: "Cable Face Pull", fr: "Tirage Visage Poulie", ar: "سحب للوجه كابل" },
        { en: "Single Arm Cable Rear Delt Fly", fr: "Oiseau Unilatéral Poulie", ar: "رفرفة خلفي فردي كابل" },
        { en: "Cable Upright Row", fr: "Tirage Menton Poulie", ar: "سحب للذقن كابل" }
      ],
      bodyweight: [
        { en: "Handstand Push-ups", fr: "Pompes en Équilibre", ar: "ضغط وقوفاً على اليد" },
        { en: "Pike Push-ups", fr: "Pompes Pike", ar: "ضغط بايك" },
        { en: "Scapular Shrugs", fr: "Haussements Scapulaires", ar: "هزات لوح الكتف" },
        { en: "Decline Pike Push-ups", fr: "Pompes Pike Déclinées", ar: "ضغط بايك مائل" },
        { en: "Shoulder Taps", fr: "Touches d'Épaules", ar: "لمس الأكتاف" }
      ]
    },
    "Quads": {
      weightlifting: [
        { en: "Back Squat", fr: "Squat Arrière", ar: "سكوات خلفي" },
        { en: "Front Squat", fr: "Squat Avant", ar: "سكوات أمامي" },
        { en: "Leg Press", fr: "Presse à Cuisses", ar: "ضغط الساق" },
        { en: "Hack Squat", fr: "Hack Squat", ar: "هاك سكوات" },
        { en: "Bulgarian Split Squat", fr: "Squat Bulgare", ar: "سكوات بلغاري" },
        { en: "Goblet Squat", fr: "Goblet Squat", ar: "جوبلت سكوات" },
        { en: "Leg Extension", fr: "Leg Extension", ar: "رفرفة رجل أمامي" },
        { en: "Smith Machine Squat", fr: "Squat Smith", ar: "سكوات سميث" },
        { en: "Dumbbell Lunges", fr: "Fentes Haltères", ar: "طعن بالدمبل" },
        { en: "Jefferson Squat", fr: "Jefferson Squat", ar: "جيفيرسون سكوات" }
      ],
      cables: [
        { en: "Cable Squat", fr: "Squat Poulie", ar: "سكوات كابل" },
        { en: "Cable Pull Through", fr: "Cable Pull Through", ar: "سحب كابل بين الأرجل" },
        { en: "Cable Step Up", fr: "Montée sur Banc Poulie", ar: "صعود الدرج كابل" },
        { en: "Cable Lunge", fr: "Fentes Poulie", ar: "طعن كابل" },
        { en: "Cable Leg Extension", fr: "Leg Extension Poulie", ar: "رفرفة رجل كابل" }
      ],
      bodyweight: [
        { en: "Bodyweight Squats", fr: "Squats Corps de Poids", ar: "سكوات بوزن الجسم" },
        { en: "Pistol Squats", fr: "Squat Unilatéral", ar: "سكوات فردي" },
        { en: "Sissy Squats", fr: "Sissy Squat", ar: "سيسي سكوات" },
        { en: "Walking Lunges", fr: "Fentes Marchées", ar: "طعن بالمشي" },
        { en: "Wall Sit", fr: "La Chaise", ar: "جلسة الحائط" }
      ]
    },
    "Hamstrings": {
      weightlifting: [
        { en: "Romanian Deadlift", fr: "Soulevé de Terre Roumain", ar: "رفعة مميتة رومانية" },
        { en: "Stiff Leg Deadlift", fr: "Soulevé de Terre Jambes Tendues", ar: "رفعة مميتة أرجل مستقيمة" },
        { en: "Lying Leg Curl", fr: "Leg Curl Allongé", ar: "رفرفة رجل خلفي نائم" },
        { en: "Seated Leg Curl", fr: "Leg Curl Assis", ar: "رفرفة رجل خلفي جالس" },
        { en: "Good Mornings", fr: "Good Mornings", ar: "جود مورنينج" },
        { en: "Dumbbell RDL", fr: "RDL Haltères", ar: "رفعة رومانية بالدمبل" },
        { en: "Glute Ham Raise", fr: "Glute Ham Raise", ar: "جي إتش آر" },
        { en: "Single Leg RDL", fr: "RDL Unilatéral", ar: "رفعة رومانية فردية" },
        { en: "Sumo Deadlift", fr: "Soulevé de Terre Sumo", ar: "رفعة مميتة سومو" },
        { en: "Machine Hamstring Curl", fr: "Leg Curl Machine", ar: "رفرفة أرجل خلفي ماكينة" }
      ],
      cables: [
        { en: "Cable Pull Through", fr: "Pull Through Poulie", ar: "سحب كابل خلفي" },
        { en: "Cable SLDL", fr: "Soulevé de Terre Unilatéral Poulie", ar: "سحب كابل أرجل مستقيمة" },
        { en: "Single Leg Cable Curl", fr: "Leg Curl Unilatéral Poulie", ar: "رفرفة فردية كابل" },
        { en: "Cable Glute Kickback (Ham)", fr: "Kickback Poulie (Ischio)", ar: "ركلة كابل خلفية" },
        { en: "Cable Good Morning", fr: "Good Morning Poulie", ar: "جود مورنينج كابل" }
      ],
      bodyweight: [
        { en: "Nordic Curls", fr: "Nordic Curl", ar: "نورديك كيرل" },
        { en: "Glute Bridges", fr: "Pont de Fessiers", ar: "جسر الألوية" },
        { en: "Sliding Leg Curls", fr: "Leg Curl Glissé", ar: "سحب الأرجل المنزلق" },
        { en: "Single Leg Glute Bridge", fr: "Pont Fessier Unilatéral", ar: "جسر ألوية فردي" },
        { en: "Hamstring Walkouts", fr: "Marche Ischio", ar: "مشي الهمسترينج" }
      ]
    },
    "Glutes": {
      weightlifting: [
        { en: "Barbell Hip Thrust", fr: "Hip Thrust Barre", ar: "دفع الحوض بالبار" },
        { en: "Dumbbell Hip Thrust", fr: "Hip Thrust Haltère", ar: "دفع الحوض بالدمبل" },
        { en: "Glute Bridge", fr: "Pont de Fessiers", ar: "جسر الألوية" },
        { en: "Sumo Squat", fr: "Squat Sumo", ar: "سكوات سومو" },
        { en: "Romanian Deadlift", fr: "Soulevé de Terre Roumain", ar: "رفعة رومانية للظهر" },
        { en: "Bulgarian Split Squat", fr: "Squat Bulgare", ar: "سكوات بلغاري" },
        { en: "Step Ups", fr: "Montée sur Banc", ar: "صعود الدرج" },
        { en: "Machine Abduction", fr: "Abduction Machine", ar: "ابعاد الأرجل ماكينة" },
        { en: "Smith Machine Thrust", fr: "Hip Thrust Smith", ar: "دفع حوض سميث" },
        { en: "Frog Pumps", fr: "Frog Pumps", ar: "ضخ الضفدع" }
      ],
      cables: [
        { en: "Cable Kickback", fr: "Kickback Poulie", ar: "ركلة كابل خلفية" },
        { en: "Cable Abduction", fr: "Abduction Poulie", ar: "ابعاد الأرجل كابل" },
        { en: "Cable Pull Through", fr: "Cable Pull Through", ar: "سحب كابل خلفي" },
        { en: "Cable Squat", fr: "Squat Poulie", ar: "سكوات كابل" },
        { en: "Cable Curtsy Lunge", fr: "Fentes Croisées Poulie", ar: "طعن منحني كابل" }
      ],
      bodyweight: [
        { en: "Donkey Kicks", fr: "Donkey Kicks", ar: "ركلة الحمار" },
        { en: "Fire Hydrants", fr: "Fire Hydrants", ar: "هيدرنتس النار" },
        { en: "Glute Bridge", fr: "Pont de Fessiers", ar: "جسر الألوية" },
        { en: "Curtsy Lunge", fr: "Fentes Croisée", ar: "طعن منحني" },
        { en: "Lateral Leg Raises", fr: "Élévations Latérales Jambes", ar: "رفع الأرجل جانبي" }
      ]
    },
    "Biceps": {
      weightlifting: [
        { en: "Barbell Curls", fr: "Curl Barre", ar: "تبادل بايسبس بار" },
        { en: "Dumbbell Curls", fr: "Curl Haltères", ar: "تبادل بايسبس دمبل" },
        { en: "Hammer Curls", fr: "Curl Marteau", ar: "بايسبس مطرقة" },
        { en: "Preacher Curls", fr: "Curl Pupitre", ar: "بايسبس ارتكاز" },
        { en: "Concentration Curls", fr: "Curl Concentré", ar: "بايسبس تركيز" },
        { en: "Incline Dumbbell Curls", fr: "Curl Incliné Haltères", ar: "بايسبس مائل دمبل" },
        { en: "EZ Bar Curls", fr: "Curl Barre EZ", ar: "بايسبس بار متعرج" },
        { en: "Spider Curls", fr: "Spider Curl", ar: "سبايدر كيرل" },
        { en: "Zottman Curls", fr: "Zottman Curl", ar: "زوتمان كيرل" },
        { en: "Machine Bicep Curl", fr: "Curl Machine", ar: "بايسبس ماكينة" }
      ],
      cables: [
        { en: "Standing Cable Curl", fr: "Curl Poulie Debout", ar: "تبادل كابل واقف" },
        { en: "Rope Hammer Curl", fr: "Curl Marteau Corde", ar: "بايسبس مطرقة حبل" },
        { en: "Cable Preacher Curl", fr: "Curl Pupitre Poulie", ar: "بايسبس ارتكاز كابل" },
        { en: "Single Arm Cable Curl", fr: "Curl Unilatéral Poulie", ar: "تبادل كابل فردي" },
        { en: "Overhead Cable Curl", fr: "Curl Poulie Haute", ar: "بايسبس كابل علوي" }
      ],
      bodyweight: [
        { en: "Chin-ups", fr: "Tractions Supination", ar: "عقلة بايسبس" },
        { en: "Inverted Rows (Underhand)", fr: "Traction Australienne Supination", ar: "تجديف مقلوب معكوس" },
        { en: "Headbangers", fr: "Headbangers", ar: "هيدبانجرز" },
        { en: "Commando Pull-ups", fr: "Tractions Commando", ar: "عقلة كوماندوز" },
        { en: "Table Rows", fr: "Rowing Table", ar: "تجديف طاولة" }
      ]
    },
    "Triceps": {
      weightlifting: [
        { en: "Close Grip Bench Press", fr: "DC Serré", ar: "بنش برس ضيق" },
        { en: "Skull Crushers", fr: "Skull Crushers", ar: "طحن الجمجمة" },
        { en: "Overhead Dumbbell Extension", fr: "Extension Nuque Haltère", ar: "تراي خلف الرأس دمبل" },
        { en: "Tricep Dips", fr: "Dips", ar: "غطس ترايسبس" },
        { en: "JM Press", fr: "JM Press", ar: "جي إم برس" },
        { en: "Dumbbell Kickback", fr: "Kickback Haltère", ar: "ركلة خلفية بالدمبل" },
        { en: "EZ Bar Extension", fr: "Extension Barre EZ", ar: "تراي بار متعرج" },
        { en: "Diamond Push-ups (Tricep)", fr: "Pompes Diamant (Triceps)", ar: "ضغط ماسي تراي" },
        { en: "Bench Dips", fr: "Dips Banc", ar: "غطس بنش" },
        { en: "Smith Machine CGBP", fr: "DC Serré Smith", ar: "ضغط ضيق سميث" }
      ],
      cables: [
        { en: "Tricep Pushdown (Straight Bar)", fr: "Extension Poulie Barre", ar: "سحب كابل مستقيم" },
        { en: "Rope Pushdown", fr: "Extension Poulie Corde", ar: "سحب كابل حبل" },
        { en: "Single Arm Cable Extension", fr: "Extension Unilatérale Poulie", ar: "سحب كابل فردي" },
        { en: "Overhead Cable Extension", fr: "Extension Nuque Poulie", ar: "تراي كابل خلف الرأس" },
        { en: "Cable Kickback", fr: "Kickback Poulie", ar: "ركلة كابل" }
      ],
      bodyweight: [
        { en: "Dips", fr: "Dips", ar: "غطس" },
        { en: "Diamond Push-ups", fr: "Pompes Diamant", ar: "ضغط ماسي" },
        { en: "Bench Dips", fr: "Dips Banc", ar: "غطس بنش" },
        { en: "Tiger Bend Push-ups", fr: "Tiger Bend Push-ups", ar: "ضغط تايجر بند" },
        { en: "Tricep Extensions (Floor)", fr: "Extension Sol", ar: "تراي أرضي" }
      ]
    },
    "Calves": {
      weightlifting: [
        { en: "Standing Calf Raise", fr: "Extensions Debout", ar: "رفع السمانة واقف" },
        { en: "Seated Calf Raise", fr: "Extensions Assis", ar: "رفع السمانة جالس" },
        { en: "Leg Press Calf Raise", fr: "Extensions Presse", ar: "سمانة جهاز الضغط" },
        { en: "Donkey Calf Raise", fr: "Extensions Dos d'Âne", ar: "سمانة دونكي" },
        { en: "Smith Machine Calf Raise", fr: "Extensions Smith", ar: "سمانة سميث" },
        { en: "Dumbbell Standing Calf Raise", fr: "Extensions Haltères Debout", ar: "رفع سمانة دمبل" },
        { en: "Hack Squat Calf Raise", fr: "Extensions Hack Squat", ar: "سمانة هاك سكوات" },
        { en: "Barbell Calf Raise", fr: "Extensions Barre", ar: "سمانة بالبار" },
        { en: "Single Leg Calf Raise (DB)", fr: "Extensions Unilatérale Haltère", ar: "سمانة فردية دمبل" },
        { en: "Machine Calf Raise", fr: "Machine Mollets", ar: "ماكينة سمانة" }
      ],
      cables: [
        { en: "Cable Standing Calf Raise", fr: "Extensions Debout Poulie", ar: "سمانة كابل واقف" },
        { en: "Cable Seated Calf Raise", fr: "Extensions Assis Poulie", ar: "سمانة كابل جالس" },
        { en: "Cable Single Leg Calf Raise", fr: "Extensions Unilatérale Poulie", ar: "سمانة فردية كابل" },
        { en: "Cable Glute-Calf Extension", fr: "Extension Poulie Mollet", ar: "تمديد سمانة كابل" },
        { en: "Cable Pull Calf Stretch", fr: "Stretch Mollet Poulie", ar: "تمديد سمانة كابل" }
      ],
      bodyweight: [
        { en: "Bodyweight Calf Raises", fr: "Extensions Corps de Poids", ar: "رفع سمانة وزن جسم" },
        { en: "Single Leg Calf Raises", fr: "Extensions Unilatérale", ar: "رفع سمانة فردي" },
        { en: "Jumping Jacks", fr: "Jumping Jacks", ar: "جامبينج جاكس" },
        { en: "Box Jumps", fr: "Sauts sur Boîte", ar: "قفز الصندوق" },
        { en: "Wall Calf Raises", fr: "Extensions Mur", ar: "سمانة حائط" }
      ]
    },
    "Core": {
      weightlifting: [
        { en: "Weighted Crunches", fr: "Crunch Lesté", ar: "طحن بوزن" },
        { en: "Weighted Leg Raises", fr: "Relevés de Jambes Lestés", ar: "رفع الأرجل بوزن" },
        { en: "Weighted Russian Twists", fr: "Twist Russe Lesté", ar: "التواء روسي بوزن" },
        { en: "Landmine Rotations", fr: "Landmine Rotation", ar: "دوران لاندماين" },
        { en: "Machine Crunches", fr: "Machine Crunch", ar: "طحن ماكينة" },
        { en: "Weighted Planks", fr: "Planche Lestée", ar: "بلانك بوزن" },
        { en: "Dumbbell Side Bends", fr: "Flexion Latérale Haltère", ar: "ميل جانبي دمبل" },
        { en: "Weighted Decline Crunches", fr: "Crunch Décliné Lesté", ar: "طحن مائل بوزن" },
        { en: "Weighted Knee Raises", fr: "Relevés de Genoux Lestés", ar: "رفع الركب بوزن" },
        { en: "Smith Machine Crunches", fr: "Crunch Smith Machine", ar: "طحن سميث" }
      ],
      cables: [
        { en: "Cable Crunches", fr: "Crunch Poulie", ar: "طحن كابل" },
        { en: "Standing Cable Woodchops", fr: "Bûcheron Poulie Debout", ar: "تحطيب كابل واقف" },
        { en: "Kneeling Cable Woodchops", fr: "Bûcheron Poulie Genou", ar: "تحطيب كابل راكع" },
        { en: "Cable Reverse Crunches", fr: "Crunch Inversé Poulie", ar: "طحن معكوس كابل" },
        { en: "Cable Core Press", fr: "Pallof Press", ar: "ضغط بالوف" }
      ],
      bodyweight: [
        { en: "Hanging Leg Raises", fr: "Relevés de Jambes Suspendus", ar: "رفع الأرجل معلق" },
        { en: "Plank", fr: "Gainage", ar: "بلانك" },
        { en: "Ab Wheel Rollouts", fr: "Roulette Abdo", ar: "عجلة البطن" },
        { en: "Dragon Flags", fr: "Drapeau Dragon", ar: "دراغون فلاج" },
        { en: "Dead Bugs", fr: "Dead Bugs", ar: "ديد بج" }
      ]
    }
  };

  const localizedDB: ExerciseDatabase = {};

  Object.keys(db).forEach(muscle => {
    localizedDB[muscle] = {
      weightlifting: db[muscle].weightlifting.map(ex => ex[lang] || ex['en']),
      cables: db[muscle].cables.map(ex => ex[lang] || ex['en']),
      bodyweight: db[muscle].bodyweight.map(ex => ex[lang] || ex['en'])
    };
  });

  return localizedDB;
};