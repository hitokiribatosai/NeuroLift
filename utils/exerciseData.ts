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
    // Subcategories
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
    "Glutes": { en: "Glutes", fr: "Fessiers", ar: "الأرداف" },
    "Calves": { en: "Calves", fr: "Mollets", ar: "السمانة" },
    "Biceps": { en: "Biceps", fr: "Biceps", ar: "البايسبس" },
    "Triceps": { en: "Triceps", fr: "Triceps", ar: "الترايسبس" },
    "Forearms": { en: "Forearms", fr: "Avant-bras", ar: "الساعدين" },
    "Abs": { en: "Abs", fr: "Abdominaux", ar: "عضلات البطن" }
  };

  return muscleMap[muscle]?.[lang] || muscle;
};

export const getExerciseDatabase = (lang: Language): ExerciseDatabase => {
  type Translation = { [key in Language]: string };

  const db: Record<string, Record<string, { weightlifting: Translation[], cables: Translation[], bodyweight: Translation[], machines: Translation[] }>> = {
    "Chest": {
      "Upper Chest": {
        weightlifting: [
          { en: "Incline Barbell Bench Press", fr: "DC Incliné Barre", ar: "بنش برس مائل بالبار" },
          { en: "Incline Dumbbell Press", fr: "DC Incliné Haltères", ar: "بنش برس مائل بالدمبل" },
          { en: "Dumbbell Incline Fly", fr: "Écarté Incliné Haltères", ar: "تجميع مائل بالدمبل" },
          { en: "Incline Hammer Strength Press", fr: "Presse Inclinée Hammer", ar: "ضغط مائل هامر" },
          { en: "Reverse Grip BB Bench Press", fr: "DC Prise Inversée", ar: "بنش برس قبضة معكوسة" }
        ],
        cables: [
          { en: "Low-to-High Cable Fly", fr: "Poulie Bas en Haut", ar: "تجميع كابل من الأسفل" },
          { en: "Single Arm Low Cable Fly", fr: "Poulie Unilatérale Bas", ar: "تجميع كابل فردي من الأسفل" },
          { en: "Incline Cable Press", fr: "DC Incliné Poulie", ar: "ضغط مائل كابل" },
          { en: "Cable Incline Fly", fr: "Écarté Incliné Poulie", ar: "تجميع مائل كابل" },
          { en: "Cable Y-Raise (Upper Chest Focus)", fr: "Élévations en Y", ar: "رفرفة كابل Y" }
        ],
        bodyweight: [
          { en: "Decline Pushups", fr: "Pompes Déclinées", ar: "ضغط مائل للأسفل" },
          { en: "Feet Elevated Pushups", fr: "Pompes Pieds Surélevés", ar: "ضغط قدم مرفوعة" },
          { en: "Archer Pushups (Incline focus)", fr: "Pompes Archer", ar: "ضغط آرتشر" }
        ],
        machines: [
          { en: "Incline Machine Press", fr: "Presse Poitrine Inclinée", ar: "ماكينة ضغط مائل" },
          { en: "Machine Incline Fly", fr: "Écarté Machine Incliné", ar: "ماكينة تجميع مائل" },
          { en: "Smith Machine Incline Press", fr: "DC Incliné Smith", ar: "ضغط مائل سميث" }
        ]
      },
      "Middle Chest": {
        weightlifting: [
          { en: "Flat Barbell Bench Press", fr: "DC Barre", ar: "بنش برس مستوي بالبار" },
          { en: "Flat Dumbbell Press", fr: "DC Haltères", ar: "بنش برس مستوي بالدمبل" },
          { en: "Dumbbell Flat Fly", fr: "Écarté Couché", ar: "تجميع مستوي بالدمبل" },
          { en: "Hammer Strength Chest Press", fr: "Presse Poitrine Hammer", ar: "ضغط صدر هامر" },
          { en: "Floor Press (Dumbbell)", fr: "Floor Press Haltères", ar: "ضغط أرضي بالدمبل" }
        ],
        cables: [
          { en: "Middle Cable Fly", fr: "Écarté Poulie Vis-à-vis", ar: "تجميع كابل مستوي" },
          { en: "Single Arm Cable Press", fr: "DC Unilatéral Poulie", ar: "ضغط كابل فردي" },
          { en: "Standing Cable Chest Press", fr: "DC Debout Poulie", ar: "ضغط صدر كابل واقف" },
          { en: "Cable Crossover (Middle)", fr: "Crossover Poulie", ar: "تجميع كابل متوسط" },
          { en: "Flat Cable Bench Press", fr: "DC Couché Poulie", ar: "بنش برس كابل مستوي" }
        ],
        bodyweight: [
          { en: "Standard Push-ups", fr: "Pompes Classiques", ar: "تمرين الضغط" },
          { en: "Diamond Push-ups", fr: "Pompes Diamant", ar: "ضغط ماسي" },
          { en: "Wide Grip Push-ups", fr: "Pompes Prise Large", ar: "ضغط قبضة واسعة" }
        ],
        machines: [
          { en: "Pec Deck Machine", fr: "Machine à Pectoraux", ar: "جهاز الفراشة" },
          { en: "Chest Press Machine", fr: "Presse Poitrine", ar: "ماكينة ضغط الصدر" },
          { en: "Lever Chest Press", fr: "Presse à Levier", ar: "ضغط صدر رافعة" }
        ]
      },
      "Lower Chest": {
        weightlifting: [
          { en: "Decline Barbell Bench Press", fr: "DC Décliné Barre", ar: "بنش برس مائل للأسفل بالبار" },
          { en: "Decline Dumbbell Press", fr: "DC Décliné Haltères", ar: "بنش برس مائل للأسفل دمبل" },
          { en: "Weighted Dips (Chest Focus)", fr: "Dips Lestés", ar: "متوازي بأوزان للصدر" },
          { en: "Dumbbell Pullover", fr: "Pull-over Haltère", ar: "بلوفر دمبل" },
          { en: "Decline Hammer Strength Press", fr: "Presse Déclinée Hammer", ar: "ضغط مائل للأسفل هامر" }
        ],
        cables: [
          { en: "High-to-Low Cable Fly", fr: "Poulie Haut en Bas", ar: "تجميع كابل من الأعلى" },
          { en: "Single Arm High Cable Fly", fr: "Poulie Unilatérale Haut", ar: "تجميع كابل فردي علوي" },
          { en: "Decline Cable Fly", fr: "Écarté Décliné Poulie", ar: "تجميع مائل للأسفل كابل" },
          { en: "Standing Decline Cable Press", fr: "Presse Déclinée Debout", ar: "ضغط مائل للأسفل كابل واقف" },
          { en: "Cable Pullover (Lower Chest)", fr: "Pull-over Poulie", ar: "بلوفر كابل" }
        ],
        bodyweight: [
          { en: "Incline Push-ups", fr: "Pompes Inclinées", ar: "ضغط مائل" },
          { en: "Parallel Bar Dips", fr: "Dips Barres Parallèles", ar: "متوازي" },
          { en: "Bench Dips", fr: "Dips Banc", ar: "غطس بنش" }
        ],
        machines: [
          { en: "Decline Chest Press Machine", fr: "Presse Déclinée Machine", ar: "ماكينة ضغط مائل للأسفل" },
          { en: "Machine Dip Station", fr: "Machine à Dips", ar: "ماكينة المتوازي" }
        ]
      }
    },
    "Back": {
      "Lats": {
        weightlifting: [
          { en: "Barbell Rows (Underhand)", fr: "Rowing Barre Supination", ar: "تجديف بالبار قبضة معكوسة" },
          { en: "Bent Over BB Row", fr: "Rowing Barre Pronation", ar: "تجديف بالبار" },
          { en: "DB Pullover (Lat Focus)", fr: "Pull-over Haltère", ar: "بلوفر دمبل للمجنص" },
          { en: "One-Arm Dumbbell Row", fr: "Rowing Unilatéral Haltère", ar: "تجديف دمبل فردي" },
          { en: "Meadows Rows", fr: "Rowing Meadows", ar: "تجديف ميدوز" }
        ],
        cables: [
          { en: "Wide Grip Lat Pulldown", fr: "Tirage Large", ar: "سحب عالي قبضة واسعة" },
          { en: "Straight Arm Pulldown", fr: "Pull-over Poulie Haute", ar: "سحب ذراع مستقيم" },
          { en: "Single Arm Lat Pulldown", fr: "Tirage Unilatéral", ar: "سحب عالي فردي" },
          { en: "Underhand Cable Row", fr: "Rowing Bas Supination", ar: "تجديف كابل معكوس" },
          { en: "V-Bar Lat Pulldown", fr: "Tirage Triangle", ar: "سحب عالي قبضة ضيقة" }
        ],
        bodyweight: [
          { en: "Wide Grip Pull-ups", fr: "Tractions Prise Large", ar: "عقلة قبضة واسعة" },
          { en: "Chin-ups", fr: "Tractions Supination", ar: "عقلة قبضة معكوسة" },
          { en: "Neutral Grip Pull-ups", fr: "Tractions Prise Neutre", ar: "عقلة قبضة متوازية" }
        ],
        machines: [
          { en: "Assisted Pull-up Machine", fr: "Tractions Assistées", ar: "ماكينة مساعدة العقلة" },
          { en: "Lat Pulldown Machine", fr: "Machine Tirage Haut", ar: "ماكينة سحب عالي" }
        ]
      },
      "Upper Back": {
        weightlifting: [
          { en: "Barbell Shrugs", fr: "Haussements d'Épaules Barre", ar: "هزات أكتاف بالبار" },
          { en: "Dumbbell Shrugs", fr: "Haussements d'Épaules Haltères", ar: "هزات أكتاف بالدمبل" },
          { en: "Snatch Grip High Pull", fr: "Tirage Haut Prise Large", ar: "سحب عالي قبضة واسعة" },
          { en: "Barbell Upright Row", fr: "Tirage Menton Barre", ar: "سحب للذقن بالبار" },
          { en: "Behind the Back Shrugs", fr: "Shrugs Derrière Dos", ar: "هزات أكتاف خلفية" }
        ],
        cables: [
          { en: "Face Pulls", fr: "Face Pulls", ar: "سحب للوجه" },
          { en: "Single Arm Rear Delt Fly", fr: "Oiseau Unilatéral Poulie", ar: "رفرفة خلفي فردي" },
          { en: "Rope Face Pull", fr: "Face Pull Corde", ar: "سحب للوجه بالحبل" },
          { en: "Overhead Cable Face Pull", fr: "Face Pull Over-head", ar: "سحب للوجه علوي" },
          { en: "Cable Shrugs", fr: "Shrugs Poulie", ar: "هزات أكتاف كابل" }
        ],
        bodyweight: [
          { en: "Scapular Pull-ups", fr: "Tractions Scapulaires", ar: "عقلة لوح الكتف" },
          { en: "Inverted Rows (Wide)", fr: "Tractions Australiennes Large", ar: "تجديف مقلوب واسع" },
          { en: "Rear Delt Pushups", fr: "Pompes Deltoïde Postérieur", ar: "ضغط كتف خلفي" }
        ],
        machines: [
          { en: "Upper Back Row Machine", fr: "Machine Rowing Haut", ar: "ماكينة تجديف علوي" },
          { en: "Rear Delt Machine", fr: "Machine Oiseau", ar: "ماكينة كتف خلفي" }
        ]
      },
      "Mid Back": {
        weightlifting: [
          { en: "T-Bar Rows", fr: "Rowing T-Bar", ar: "تجديف تي بار" },
          { en: "Pendlay Rows", fr: "Rowing Pendlay", ar: "تجديف بيندلاي" },
          { en: "Yates Rows", fr: "Rowing Yates", ar: "تجديف ييتس" },
          { en: "Seal Row", fr: "Rowing Seal", ar: "تجديف سيل" },
          { en: "Dumbbell Seated Row", fr: "Rowing Haltères Assis", ar: "تجديف بالدمبل جالس" }
        ],
        cables: [
          { en: "Seated Cable Rows", fr: "Rowing Poulie Basse", ar: "تجديف كابل جالس" },
          { en: "Single Arm Seated Row", fr: "Rowing Unilatéral Poulie", ar: "تجديف كابل فردي جالس" },
          { en: "Neutral Grip Cable Row", fr: "Rowing Prise Neutre", ar: "تجديف كابل قبضة متوازية" },
          { en: "Standing Cable Row", fr: "Rowing Debout Poulie", ar: "تجديف كابل واقف" },
          { en: "Cable Face Away Row", fr: "Rowing Inversé Poulie", ar: "تجديف كابل عكسي" }
        ],
        bodyweight: [
          { en: "Inverted Rows", fr: "Tractions Australiennes", ar: "تجديف مقلوب" },
          { en: "Superman", fr: "Superman", ar: "تمرين سوبرمان" },
          { en: "Bodyweight Row (Rings)", fr: "Traction Anneaux", ar: "تجديف بوزن الجسم حلقات" }
        ],
        machines: [
          { en: "Seated Row Machine", fr: "Machine Rowing Assis", ar: "ماكينة تجديف جالس" },
          { en: "Chest Supported Row Machine", fr: "Rowing Appui Thoracique", ar: "ماكينة تجديف مسنود الصدر" }
        ]
      },
      "Lower Back": {
        weightlifting: [
          { en: "Deadlifts", fr: "Soulevé de Terre", ar: "رفعة مميتة" },
          { en: "Rack Pulls", fr: "Rack Pulls", ar: "راك بول" },
          { en: "Good Mornings", fr: "Good Mornings", ar: "جود مورنينج" },
          { en: "Straight Leg Deadlift", fr: "Soulevé de Terre Jambes Tendues", ar: "رفعة مميتة أرجل مستقيمة" },
          { en: "Snatch Grip DL", fr: "Deadlift Prise Large", ar: "رفعة مميتة قبضة واسعة" }
        ],
        cables: [
          { en: "Cable Good Morning", fr: "Good Morning Poulie", ar: "جود مورنينج كابل" },
          { en: "Cable Deadlift", fr: "Deadlift Poulie", ar: "رفعة مميتة كابل" },
          { en: "Cable Pull-through", fr: "Pull-through Poulie", ar: "سحب كابل خلفي" },
          { en: "Single Leg Cable DL", fr: "Deadlift Unilatéral Poulie", ar: "رفعة مميتة فردية كابل" },
          { en: "Cable Back Extension", fr: "Banc à Lombaire Poulie", ar: "تمديد الظهر كابل" }
        ],
        bodyweight: [
          { en: "Hyper-extensions", fr: "Extensions au Banc", ar: "تمديد الظهر" },
          { en: "Bird-Dog", fr: "Bird-Dog", ar: "بيرد دوج" },
          { en: "Bridges", fr: "Pont", ar: "كوبري" }
        ],
        machines: [
          { en: "Back Extension Machine", fr: "Machine à Lombaire", ar: "ماكينة تمديد الظهر" },
          { en: "Hyperextension Station", fr: "Banc Lombaire 45°", ar: "جهاز فير اريا" }
        ]
      }
    },
    "Shoulders": {
      "Front Delts": {
        weightlifting: [
          { en: "Barbell Overhead Press", fr: "Overhead Press Barre", ar: "ضغط أكتاف بالبار" },
          { en: "Dumbbell Shoulder Press", fr: "Overhead Press Haltères", ar: "ضغط أكتاف بالدمبل" },
          { en: "Arnold Press", fr: "Développé Arnold", ar: "ضغط أرنولد" },
          { en: "Dumbbell Front Raise", fr: "Élévations Frontales Haltères", ar: "رفرفة أمامي بالدمبل" },
          { en: "Smith Machine Press", fr: "Shoulder Press Smith", ar: "ضغط أكتاف سميث" }
        ],
        cables: [
          { en: "Cable Front Raise", fr: "Élévations Frontales Poulie", ar: "رفرفة أمامي كابل" },
          { en: "Single Arm Cable Press", fr: "Shoulder Press Poulie", ar: "ضغط أكتاف كابل فردي" },
          { en: "Cable Y-Raise (Front Delt)", fr: "Élévations en Y", ar: "رفرفة كابل Y" },
          { en: "Cable Face Away Press", fr: "Presse Inversée Poulie", ar: "ضغط كابل عكسي" }
        ],
        bodyweight: [
          { en: "Handstand Push-ups", fr: "Pompes en Équilibre", ar: "ضغط وقوفاً على اليد" },
          { en: "Pike Push-ups", fr: "Pompes Pike", ar: "ضغط بايك" }
        ],
        machines: [
          { en: "Shoulder Press Machine", fr: "Machine à Épaules", ar: "ماكينة ضغط الأكتاف" },
          { en: "Chest-Supported Press", fr: "Shoulder Press Machine", ar: "ماكينة ضغط أكتاف مسنودة" }
        ]
      },
      "Side Delts": {
        weightlifting: [
          { en: "Dumbbell Lateral Raise", fr: "Élévations Latérales Haltères", ar: "رفرفة جانبي بالدمبل" },
          { en: "Barbell Upright Row", fr: "Tirage Menton Barre", ar: "سحب للذقن بالبار" },
          { en: "Behind the Back Raise", fr: "Élévations Arrière Dos", ar: "رفرفة خلف الظهر" },
          { en: "Lean-Away DB Raise", fr: "Élévations Latérales Appui", ar: "رفرفة جانبي مائل" }
        ],
        cables: [
          { en: "Cable Lateral Raise", fr: "Élévations Latérales Poulie", ar: "رفرفة جانبي كابل" },
          { en: "Cable Upright Row", fr: "Tirage Menton Poulie", ar: "سحب للذقن كابل" },
          { en: "Single Arm Cable Lateral", fr: "Poulie Unilatérale Latérale", ar: "رفرفة جانبي فردي كابل" },
          { en: "Behind the Back Cable Raise", fr: "Poulie Arrière Dos", ar: "رفرفة جانبي خلف الظهر كابل" }
        ],
        bodyweight: [
          { en: "Side Plank Raise", fr: "Élévations Gainage Latéral", ar: "رفرفة بلانك جانبي" },
          { en: "Shoulder Taps", fr: "Touches d'Épaules", ar: "لمس الأكتاف" }
        ],
        machines: [
          { en: "Machine Lateral Raise", fr: "Machine Élévations Latérales", ar: "ماكينة رفرفة جانبي" }
        ]
      },
      "Rear Delts": {
        weightlifting: [
          { en: "Reverse Dumbbell Fly", fr: "Oiseau Haltères", ar: "رفرفة خلفي بالدمبل" },
          { en: "Chest Supported Rear Fly", fr: "Oiseau Appui Thoracique", ar: "رفرفة خلفي مسنود الصدر" },
          { en: "Face Pull (DB)", fr: "Face Pull Haltères", ar: "سحب للوجه دمبل" }
        ],
        cables: [
          { en: "Cable Face Pull", fr: "Face Pull Poulie", ar: "سحب للوجه كابل" },
          { en: "Single Arm Rear Delt Fly", fr: "Oiseau Unilatéral Poulie", ar: "رفرفة خلفي فردي كابل" },
          { en: "Reverse Cable Crossover", fr: "Écarté Inversé Poulie", ar: "تجميع خلفي كابل" }
        ],
        bodyweight: [
          { en: "Scapular Shrugs", fr: "Haussements Scapulaires", ar: "هزات لوح الكتف" }
        ],
        machines: [
          { en: "Rear Delt Pec Deck", fr: "Machine Oiseau/Rear Delt", ar: "ماكينة كتف خلفي" }
        ]
      }
    },
    "Legs": {
      "Quads": {
        weightlifting: [
          { en: "Back Squat", fr: "Squat Arrière", ar: "سكوات خلفي" },
          { en: "Front Squat", fr: "Squat Avant", ar: "سكوات أمامي" },
          { en: "Bulgarian Split Squat", fr: "Squat Bulgare", ar: "سكوات بلغاري" },
          { en: "Goblet Squat", fr: "Goblet Squat", ar: "جوبلت سكوات" },
          { en: "Walking Lunges (DB)", fr: "Fentes Marchées", ar: "طعن بالمشي" }
        ],
        cables: [
          { en: "Cable Squat", fr: "Squat Poulie", ar: "سكوات كابل" },
          { en: "Cable Leg Extension", fr: "Extension Poulie Jambe", ar: "رفرفة رجل كابل" },
          { en: "Cable Lunge", fr: "Fentes Poulie", ar: "طعن كابل" },
          { en: "Cable Step Up", fr: "Step-up Poulie", ar: "صعود الدرج كابل" },
          { en: "Cable Sissy Squat", fr: "Sissy Squat Poulie", ar: "سيسي سكوات كابل" }
        ],
        bodyweight: [
          { en: "Bodyweight Squats", fr: "Squats Poids de Corps", ar: "سكوات بوزن الجسم" },
          { en: "Pistol Squats", fr: "Squat Unilatéral", ar: "سكوات فردي" },
          { en: "Sissy Squats", fr: "Sissy Squat", ar: "سيسي سكوات" }
        ],
        machines: [
          { en: "Leg Press Machine", fr: "Presse à Cuisses", ar: "ماكينة ضغط الساق" },
          { en: "Hack Squat Machine", fr: "Hack Squat", ar: "ماكينة هاك سكوات" }
        ]
      },
      "Hamstrings": {
        weightlifting: [
          { en: "Romanian Deadlift", fr: "Soulevé de Terre Roumain", ar: "رفعة رومانية" },
          { en: "Stiff Leg Deadlift", fr: "DL Jambes Tendues", ar: "رفعة أرجل مستقيمة" },
          { en: "Lying Leg Curl (DB)", fr: "Leg Curl Haltère", ar: "رفرفة أرجل خلفي دمبل" },
          { en: "Sumo Deadlift", fr: "Deadlift Sumo", ar: "رفعة مميتة سومو" },
          { en: "DB RDL", fr: "RDL Haltères", ar: "رفعة رومانية دمبل" }
        ],
        cables: [
          { en: "Cable Pull Through", fr: "Pull Through Poulie", ar: "سحب كابل خلفي" },
          { en: "Cable SLDL", fr: "DL Unilatéral Poulie", ar: "سحب كابل أرجل مستقيمة" },
          { en: "Single Leg Cable Curl", fr: "Leg Curl Unilatéral Poulie", ar: "رفرفة فردية كابل" },
          { en: "Cable Hamstring Walkout", fr: "Marche Ischio Poulie", ar: "مشي الهمسترينج كابل" },
          { en: "Cable Glute-Ham Raise", fr: "Glute-Ham Raise Poulie", ar: "جي إتش آر كابل" }
        ],
        bodyweight: [
          { en: "Nordic Curls", fr: "Nordic Curl", ar: "نورديك كيرل" },
          { en: "Sliding Leg Curls", fr: "Leg Curl Glissé", ar: "سحب الأرجل المنزلق" },
          { en: "Single Leg Glute Bridge", fr: "Pont Fessier Unilatéral", ar: "جسر ألوية فردي" }
        ],
        machines: [
          { en: "Lying Leg Curl Machine", fr: "Machine Leg Curl Couché", ar: "ماكينة رفرفة خلفي نائم" },
          { en: "Seated Leg Curl Machine", fr: "Machine Leg Curl Assis", ar: "ماكينة رفرفة خلفي جالس" }
        ]
      },
      "Glutes": {
        weightlifting: [
          { en: "Barbell Hip Thrust", fr: "Hip Thrust Barre", ar: "دفع الحوض بالبار" },
          { en: "Barbell Glute Bridge", fr: "Pont de Fessiers Barre", ar: "جسر الألوية بالبار" },
          { en: "Sumo Squat (DB)", fr: "Squat Sumo Haltère", ar: "سكوات سومو دمبل" },
          { en: "Weighted Step Ups", fr: "Step-ups Lestés", ar: "صعود الدرج بأوزان" },
          { en: "Weighted Lunges", fr: "Fentes Lestées", ar: "طعن بأوزان" }
        ],
        cables: [
          { en: "Cable Glute Kickback", fr: "Kickback Poulie", ar: "ركلة كابل خلفية" },
          { en: "Cable Abduction", fr: "Abduction Poulie", ar: "ابعاد الأرجل كابل" },
          { en: "Cable Pull Through", fr: "Cable Pull Through", ar: "سحب كابل خلفي" },
          { en: "Cable Squat (Wide)", fr: "Squat Large Poulie", ar: "سكوات كابل واسع" },
          { en: "Cable Curtsy Lunge", fr: "Fentes Croisées Poulie", ar: "طعن منحني كابل" }
        ],
        bodyweight: [
          { en: "Glute Bridges", fr: "Pont de Fessiers", ar: "جسر الألوية" },
          { en: "Donkey Kicks", fr: "Donkey Kicks", ar: "ركلة الحمار" },
          { en: "Fire Hydrants", fr: "Fire Hydrants", ar: "هيدرنتس النار" }
        ],
        machines: [
          { en: "Hip Thrust Machine", fr: "Machine Hip Thrust", ar: "ماكينة دفع الحوض" },
          { en: "Glute Kickback Machine", fr: "Machine Glute Kickback", ar: "ماكينة ركلة الألوية" }
        ]
      },
      "Calves": {
        weightlifting: [
          { en: "Standing Calf Raise", fr: "Extensions Debout", ar: "رفع السمانة واقف" },
          { en: "Seated Calf Raise", fr: "Extensions Assis", ar: "رفع السمانة جالس" },
          { en: "Dumbbell Calf Raise", fr: "Extensions Haltères", ar: "رفع السمانة بالدمبل" },
          { en: "Barbell Calf Raise", fr: "Extensions Barre", ar: "رفع السمانة بالبار" },
          { en: "One Leg DB Calf Raise", fr: "Extensions Unilatérale", ar: "رفع سمانة فردي دمبل" }
        ],
        cables: [
          { en: "Cable Standing Calf Raise", fr: "Extensions Debout Poulie", ar: "سمانة كابل واقف" },
          { en: "Cable Seated Calf Raise", fr: "Extensions Assis Poulie", ar: "سمانة كابل جالس" },
          { en: "Cable Single Leg Raise", fr: "Extensions Unilatérale Poulie", ar: "سمانة فردية كابل" },
          { en: "Cable Leg Press Calf Raise", fr: "Extensions Presse Poulie", ar: "سمانة ضغط كابل" },
          { en: "Cable Calf Stretch", fr: "Stretch Mollet Poulie", ar: "تمديد سمانة كابل" }
        ],
        bodyweight: [
          { en: "Bodyweight Calf Raise", fr: "Extensions Corps de Poids", ar: "رفع سمانة وزن الجسم" },
          { en: "Single Leg BW Raise", fr: "Extensions Unilatérale Poids", ar: "رفع سمانة فردي وزن جسم" },
          { en: "Jumping Jacks", fr: "Jumping Jacks", ar: "جامبينج جاكس" }
        ],
        machines: [
          { en: "Seated Calf Machine", fr: "Machine Mollets Assis", ar: "ماكينة سمانة جالس" },
          { en: "Rotary Calf Machine", fr: "Machine Mollets Rotation", ar: "ماكينة سمانة روتاري" }
        ]
      }
    },
    "Arms": {
      "Biceps": {
        weightlifting: [
          { en: "Barbell Curls", fr: "Curl Barre", ar: "تبادل بايسبس بار" },
          { en: "Dumbbell Curls", fr: "Curl Haltères", ar: "تبادل بايسبس دمبل" },
          { en: "Hammer Curls", fr: "Curl Marteau", ar: "بايسبس مطرقة" }
        ],
        cables: [
          { en: "Standing Cable Curl", fr: "Curl Poulie Debout", ar: "تبادل كابل واقف" }
        ],
        bodyweight: [
          { en: "Chin-ups", fr: "Tractions Supination", ar: "عقلة بايسبس" }
        ],
        machines: [
          { en: "Preacher Curl Machine", fr: "Machine Curl Pupitre", ar: "ماكينة بايسبس ارتكاز" },
          { en: "Bicep Curl Machine", fr: "Machine Bicep Curl", ar: "ماكينة البايسبس" }
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
        ],
        machines: [
          { en: "Tricep Extension Machine", fr: "Machine Tricep Extension", ar: "ماكينة ترايسبس" },
          { en: "Dip Machine", fr: "Machine à Dips", ar: "ماكينة المتوازي" }
        ]
      },
      "Forearms": {
        weightlifting: [
          { en: "Barbell Wrist Curls", fr: "Flexion Poignets Barre", ar: "ثني الرسغ بالبار" }
        ],
        cables: [],
        bodyweight: [
          { en: "Dead Hang", fr: "Suspension", ar: "تعليق حر" }
        ],
        machines: [
          { en: "Wrist Curl Machine", fr: "Machine Poignets", ar: "ماكينة الرسغ" }
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
          { en: "Hanging Leg Raises", fr: "Relevés de Jambes", ar: "رفع الأرجل معلق" },
          { en: "Ab Wheel Rollouts", fr: "Roulette Abdo", ar: "عجلة البطن" }
        ],
        machines: [
          { en: "Ab Crunch Machine", fr: "Machine Abdominaux", ar: "ماكينة البطن" }
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
        bodyweight: db[majorCategory][subCategory].bodyweight.map(ex => ex[lang] || ex['en']),
        machines: db[majorCategory][subCategory].machines.map(ex => ex[lang] || ex['en'])
      };
    });
  });

  return localizedDB;
};