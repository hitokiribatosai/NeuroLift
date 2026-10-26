import { Language } from '../types';

// Shared interface copy. Preserve placeholder numbers across all languages.
export const interfaceCopy = {
  "storage_startup_failed": { "en": "Your saved data needs attention", "fr": "Vos données enregistrées nécessitent une vérification", "ar": "تحتاج بياناتك المحفوظة إلى مراجعة" },
  "storage_startup_help": { "en": "The app could not safely open your saved data. Nothing has been deleted or replaced. Export a recovery copy before clearing storage or reinstalling. If another tab is open, close it and retry.", "fr": "L’application n’a pas pu ouvrir vos données en toute sécurité. Rien n’a été supprimé ni remplacé. Exportez une copie de récupération avant d’effacer le stockage ou de réinstaller. Fermez les autres onglets et réessayez.", "ar": "تعذر فتح بياناتك بأمان. لم يُحذف أو يُستبدل أي شيء. صدّر نسخة استرداد قبل مسح التخزين أو إعادة التثبيت. أغلق علامات التبويب الأخرى وحاول مجددًا." },
  "storage_retry": { "en": "Retry opening", "fr": "Réessayer l’ouverture", "ar": "إعادة محاولة الفتح" },
  "storage_saving": { "en": "Saving on this device…", "fr": "Enregistrement sur cet appareil…", "ar": "جارٍ الحفظ على هذا الجهاز…" },
  "storage_failed": { "en": "Changes could not be saved", "fr": "Les modifications n’ont pas pu être enregistrées", "ar": "تعذر حفظ التغييرات" },
  "storage_recovery_help": { "en": "Stop editing. Keep this page open and export a recovery copy before reloading. It includes saved data and pending changes; it is not a normal backup for automatic import.", "fr": "Arrêtez les modifications. Gardez cette page ouverte et exportez une copie de récupération avant de la recharger. Elle contient les données enregistrées et les modifications en attente ; ce n’est pas une sauvegarde pour importation automatique.", "ar": "توقف عن التعديل. أبقِ هذه الصفحة مفتوحة وصدّر نسخة استرداد قبل إعادة تحميلها. تتضمن البيانات المحفوظة والتغييرات المعلقة؛ وليست نسخة احتياطية للاستيراد التلقائي." },
  "storage_export_recovery": { "en": "Export recovery copy", "fr": "Exporter une copie de récupération", "ar": "تصدير نسخة استرداد" },
  "storage_export_failed": { "en": "Export failed. Keep this page open and free device storage before trying again.", "fr": "Échec de l’exportation. Gardez cette page ouverte et libérez de l’espace avant de réessayer.", "ar": "فشل التصدير. أبقِ هذه الصفحة مفتوحة ووفر مساحة تخزين قبل المحاولة مجددًا." },
  "workout_save_failed": {
    "en": "Workout could not be saved. Your session has not been discarded. Check device storage and try again; if this continues, export a backup before making changes.",
    "fr": "La séance n’a pas pu être enregistrée. Elle n’a pas été supprimée. Vérifiez le stockage et réessayez ; si le problème persiste, exportez une sauvegarde avant toute modification.",
    "ar": "تعذر حفظ التمرين. لم يتم حذف جلستك. تحقق من مساحة التخزين وحاول مجدداً؛ إذا استمرت المشكلة، صدّر نسخة احتياطية قبل إجراء تغييرات."
  },
  "help_tour": {
    "en": "Help & tour",
    "fr": "Aide et visite",
    "ar": "المساعدة والدليل"
  },
  "app_overview": {
    "en": "App overview",
    "fr": "Visite de l’application",
    "ar": "جولة التطبيق"
  },
  "workout_walkthrough": {
    "en": "Workout walkthrough",
    "fr": "Guide de séance",
    "ar": "دليل الحصة"
  },
  "demo_available": {
    "en": "Demo available",
    "fr": "Démo disponible",
    "ar": "عرض متاح"
  },
  "images_not_yet_available": {
    "en": "Images not yet available",
    "fr": "Images non disponibles",
    "ar": "الصور غير متاحة بعد"
  },
  "research_supported": {
    "en": "Research-supported",
    "fr": "Avec études",
    "ar": "مدعومة بالأبحاث"
  },
  "clear_search": {
    "en": "Clear search",
    "fr": "Effacer la recherche",
    "ar": "مسح البحث"
  },
  "show_exercises": {
    "en": "Show exercises",
    "fr": "Afficher les exercices",
    "ar": "عرض التمارين"
  },
  "review": {
    "en": "Review",
    "fr": "Vérifier",
    "ar": "مراجعة"
  },
  "drag": {
    "en": "Drag",
    "fr": "Déplacer",
    "ar": "اسحب"
  },
  "move_up": {
    "en": "Move up",
    "fr": "Monter",
    "ar": "نقل لأعلى"
  },
  "move_down": {
    "en": "Move down",
    "fr": "Descendre",
    "ar": "نقل لأسفل"
  },
  "position": {
    "en": "position",
    "fr": "position",
    "ar": "الموضع"
  },
  "workout_notification": {
    "en": "Workout notification",
    "fr": "Notification de séance",
    "ar": "إشعار التمرين"
  },
  "turn_off_workout_notification": {
    "en": "Turn off workout notification",
    "fr": "Désactiver la notification",
    "ar": "إيقاف إشعار التمرين"
  },
  "enable_workout_notification": {
    "en": "Enable workout notification",
    "fr": "Activer la notification",
    "ar": "تفعيل إشعار التمرين"
  },
  "notifications_are_optional_your_workout_still_works_without_them": {
    "en": "Notifications are optional. Your workout still works without them.",
    "fr": "Les notifications sont facultatives. La séance fonctionne sans elles.",
    "ar": "الإشعارات اختيارية. يمكنك متابعة التمرين بدونها."
  },
  "android_settings": {
    "en": "Android settings",
    "fr": "Réglages Android",
    "ar": "إعدادات Android"
  },
  "android_may_delay_rest_alerts_while_asleep_allow_alarms_reminders_for_": {
    "en": "Android may delay rest alerts while asleep. Allow Alarms & reminders for more precise timing.",
    "fr": "Android peut retarder les alertes en veille. Autorisez Alarmes et rappels pour plus de précision.",
    "ar": "قد يؤخر Android تنبيه الراحة أثناء السكون. اسمح بالمنبهات والتذكيرات لتحسين الدقة."
  },
  "timer_permissions": {
    "en": "Timer permissions",
    "fr": "Autorisations du minuteur",
    "ar": "أذونات المؤقت"
  },
  "notification_unavailable_your_in_app_timer_still_works": {
    "en": "Notification unavailable. Your in-app timer still works.",
    "fr": "Notification indisponible. Le minuteur reste disponible.",
    "ar": "الإشعار غير متاح. المؤقت داخل التطبيق يعمل."
  },
  "welcome_to_neurolift": {
    "en": "Welcome to NeuroLift",
    "fr": "Bienvenue sur NeuroLift",
    "ar": "مرحباً بك في NeuroLift"
  },
  "build_your_workouts_log_your_sets_and_see_your_progress_one_session_at": {
    "en": "Build your workouts, log your sets, and see your progress—one session at a time. Train without an account; sign in when you want to sync.",
    "fr": "Créez vos séances, notez vos séries et suivez vos progrès. Entraînez-vous sans compte ; connectez-vous pour synchroniser.",
    "ar": "خطط لتمارينك وسجل مجموعاتك وتابع تقدمك، حصة بعد حصة. تمرّن دون حساب وسجّل الدخول للمزامنة."
  },
  "your_workout_your_choices": {
    "en": "Your workout, your choices",
    "fr": "Votre séance, vos choix",
    "ar": "حصتك، اختياراتك"
  },
  "choose_several_muscle_groups_add_exercises_then_record_the_sets_you_ac": {
    "en": "Choose several muscle groups, add exercises, then record the sets you actually complete. Nothing is logged for you by the tour.",
    "fr": "Choisissez plusieurs groupes musculaires et exercices, puis notez vos séries réalisées. Le guide ne crée aucune séance à votre place.",
    "ar": "اختر عدة مجموعات عضلية وتمارين ثم سجل المجموعات التي تنجزها. الدليل لا يسجل أي تمرين نيابة عنك."
  },
  "explore_movements": {
    "en": "Explore movements",
    "fr": "Explorez les mouvements",
    "ar": "اكتشف الحركات"
  },
  "filter_exercises_by_muscle_and_area_open_exercise_details_for_availabl": {
    "en": "Filter Exercises by muscle and area. Open exercise details for available images, demonstrations, YouTube links and research references. Video links open outside the app and need internet.",
    "fr": "Filtrez les exercices par muscle et zone. Les détails proposent les images, démonstrations, liens YouTube et études disponibles. Les vidéos externes nécessitent internet.",
    "ar": "صفّح التمارين حسب العضلة والمنطقة. افتح التفاصيل للصور والشروحات وروابط YouTube والدراسات المتاحة. روابط الفيديو خارج التطبيق وتحتاج الإنترنت."
  },
  "see_your_progress": {
    "en": "See your progress",
    "fr": "Suivez vos progrès",
    "ar": "شاهد تقدمك"
  },
  "completed_workouts_appear_in_progress_review_your_sets_training_volume": {
    "en": "Completed workouts appear in Progress. Review your sets, training volume and body measurements here.",
    "fr": "Les séances terminées apparaissent dans Progrès : séries, volume et mensurations.",
    "ar": "تظهر الحصص المكتملة في التقدم. راجع مجموعاتك وحجم التدريب وقياسات الجسم هنا."
  },
  "make_it_yours": {
    "en": "Make it yours",
    "fr": "À votre image",
    "ar": "خصص تجربتك"
  },
  "more_contains_extra_tools_and_your_account_on_phones_use_the_settings_": {
    "en": "More contains extra tools and your account on phones. Use the settings gear for language, appearance and Help & tour. Ready to build a real workout?",
    "fr": "Sur téléphone, Plus contient les outils et le compte. La roue des réglages propose langue, apparence et Aide et visite. Prêt pour une vraie séance ?",
    "ar": "في الهاتف، «المزيد» يضم الأدوات والحساب. إعدادات الترس تضم اللغة والمظهر والمساعدة والدليل. هل أنت جاهز لحصتك؟"
  },
  "welcome_find_your_way_around": {
    "en": "Welcome. Find your way around.",
    "fr": "Bienvenue. Prenez vos repères.",
    "ar": "مرحباً. تعرف على التطبيق."
  },
  "a_quick_introduction_then_guidance_through_your_own_workout": {
    "en": "A quick introduction, then guidance through your own workout.",
    "fr": "Une courte visite, puis un guide pour votre séance.",
    "ar": "جولة سريعة ثم إرشادات أثناء حصتك الخاصة."
  },
  "take_a_quick_tour": {
    "en": "Take a quick tour",
    "fr": "Faire une visite rapide",
    "ar": "ابدأ جولة سريعة"
  },
  "resume_workout_guide": {
    "en": "Resume workout guide",
    "fr": "Reprendre le guide",
    "ar": "استأنف دليل التمرين"
  },
  "explore_on_my_own": {
    "en": "Explore on my own",
    "fr": "Explorer librement",
    "ar": "أستكشف بنفسي"
  },
  "back": {
    "en": "Back",
    "fr": "Retour",
    "ar": "رجوع"
  },
  "next": {
    "en": "Next",
    "fr": "Suivant",
    "ar": "التالي"
  },
  "build_your_first_workout": {
    "en": "Build your first workout",
    "fr": "Créer votre première séance",
    "ar": "أنشئ حصتك الأولى"
  },
  "skip_tour": {
    "en": "Skip tour",
    "fr": "Passer la visite",
    "ar": "تخطي الجولة"
  },
  "choose_your_muscle_groups": {
    "en": "Choose your muscle groups",
    "fr": "Choisissez vos groupes musculaires",
    "ar": "اختر المجموعات العضلية"
  },
  "select_one_or_several_groups_below_then_choose_select_exercises_your_c": {
    "en": "Select one or several groups below, then choose Select Exercises. Your choices stay selected as you build the session.",
    "fr": "Sélectionnez un ou plusieurs groupes, puis choisissez les exercices. Vos choix restent sélectionnés.",
    "ar": "اختر مجموعة عضلية أو أكثر ثم اختر التمارين. تبقى اختياراتك محفوظة أثناء بناء الحصة."
  },
  "add_the_movements_you_want": {
    "en": "Add the movements you want",
    "fr": "Ajoutez vos exercices",
    "ar": "أضف التمارين التي تريدها"
  },
  "select_an_exercise_then_use_the_muscle_selector_to_switch_areas_or_gro": {
    "en": "Select an exercise, then use the muscle selector to switch areas or groups and add more. Try one or two to get familiar. Review your selection, then start when ready.",
    "fr": "Choisissez un exercice, puis changez de zone ou de groupe avec le sélecteur pour en ajouter. Un ou deux suffisent pour découvrir. Vérifiez votre sélection et démarrez quand vous êtes prêt.",
    "ar": "اختر تمريناً ثم بدّل المنطقة أو المجموعة من محدد العضلات لإضافة المزيد. يمكنك البدء بتمرين أو اثنين للتعرف على التطبيق. راجع اختيارك وابدأ عندما تكون جاهزاً."
  },
  "record_a_real_set": {
    "en": "Record a real set",
    "fr": "Notez une série réelle",
    "ar": "سجل مجموعة فعلية"
  },
  "enter_the_weight_in_kg_and_the_reps_you_performed_for_bodyweight_work_": {
    "en": "Enter the weight in kg and the reps you performed. For bodyweight work without added weight, leave kg at zero. Tap Done only after completing the set.",
    "fr": "Saisissez le poids en kg et les répétitions réalisées. Sans charge ajoutée, laissez zéro kg. Validez uniquement une série terminée.",
    "ar": "أدخل الوزن بالكيلوغرام والتكرارات التي أنجزتها. لتمارين وزن الجسم دون حمل إضافي اترك الوزن صفراً. اضغط تم فقط بعد إكمال المجموعة."
  },
  "rest_add_sets_finish_when_ready": {
    "en": "Rest, add sets, finish when ready",
    "fr": "Reposez-vous, puis continuez",
    "ar": "استرح وأضف المجموعات وأكمل عندما تكون جاهزاً"
  },
  "the_rest_timer_starts_after_a_completed_set_add_another_set_or_switch_": {
    "en": "The rest timer starts after a completed set. Add another set or switch exercises as needed. Finish Workout saves the session; only completed sets count toward volume.",
    "fr": "Le repos démarre après chaque série validée. Ajoutez des séries ou changez d’exercice. Terminer enregistre la séance ; seules les séries validées comptent dans le volume.",
    "ar": "يبدأ مؤقت الراحة بعد إكمال المجموعة. أضف مجموعة أو بدّل التمرين حسب حاجتك. إنهاء التمرين يحفظ الحصة؛ المجموعات المكتملة فقط تحتسب في الحجم."
  },
  "your_effort_is_saved": {
    "en": "Your effort is saved",
    "fr": "Vos efforts sont enregistrés",
    "ar": "تم حفظ جهدك"
  },
  "open_progress_to_review_your_workout_sets_and_volume_you_can_replay_th": {
    "en": "Open Progress to review your workout, sets and volume. You can replay this guide anytime from Settings → Help & tour.",
    "fr": "Ouvrez Progrès pour revoir votre séance. Retrouvez ce guide dans Réglages → Aide et visite.",
    "ar": "افتح التقدم لمراجعة الحصة والمجموعات والحجم. يمكنك إعادة الدليل من الإعدادات ← المساعدة والدليل."
  },
  "finish_guide": {
    "en": "Finish guide",
    "fr": "Terminer le guide",
    "ar": "إنهاء الدليل"
  },
  "skip_guidance": {
    "en": "Skip guidance",
    "fr": "Passer le guide",
    "ar": "تخطي الإرشادات"
  },
  "rest_alerts": {
    "en": "Rest alerts",
    "fr": "Alertes de repos",
    "ar": "تنبيهات الراحة"
  },
  "turn_off_rest_alerts": {
    "en": "Turn off rest alerts",
    "fr": "Désactiver les alertes de repos",
    "ar": "إيقاف تنبيهات الراحة"
  },
  "enable_rest_alerts": {
    "en": "Enable rest alerts",
    "fr": "Activer les alertes de repos",
    "ar": "تفعيل تنبيهات الراحة"
  },
  "optional_alert_when_rest_finishes_focus_and_iphone_notification_settin": {
    "en": "Optional alert when rest finishes. Focus and iPhone notification settings may silence it.",
    "fr": "Alerte facultative à la fin du repos. Concentration et les réglages iPhone peuvent la rendre silencieuse.",
    "ar": "تنبيه اختياري عند انتهاء الراحة. قد يسكت وضع التركيز وإعدادات iPhone التنبيه."
  },
  "if_permission_was_denied_enable_notifications_for_neurolift_in_iphone_": {
    "en": "If permission was denied, enable notifications for NeuroLift in iPhone Settings.",
    "fr": "Si l’autorisation a été refusée, activez les notifications NeuroLift dans Réglages sur iPhone.",
    "ar": "إذا رُفض الإذن، فعّل إشعارات NeuroLift في إعدادات iPhone."
  },
  "rest_alert_unavailable_your_in_app_timer_still_works": {
    "en": "Rest alert unavailable. Your in-app timer still works.",
    "fr": "Alerte indisponible. Le minuteur reste disponible.",
    "ar": "تنبيه الراحة غير متاح. المؤقت داخل التطبيق يعمل."
  },
  "recovery": {
    "en": "RECOVERY",
    "fr": "RÉCUPÉRATION",
    "ar": "الراحة"
  },
  "choose_your_default_rest_after_each_set": {
    "en": "Choose your default rest after each set.",
    "fr": "Choisissez votre repos par défaut après chaque série.",
    "ar": "اختر مدة الراحة الافتراضية بعد كل مجموعة."
  },
  "seconds": {
    "en": "seconds",
    "fr": "secondes",
    "ar": "ثانية"
  },
  "progress": {
    "en": "Progress",
    "fr": "Progrès",
    "ar": "التقدم"
  },
  "nutrition": {
    "en": "Nutrition",
    "fr": "Nutrition",
    "ar": "التغذية"
  },
  "account": {
    "en": "Account",
    "fr": "Compte",
    "ar": "الحساب"
  },
  "skip_to_content": {
    "en": "Skip to content",
    "fr": "Aller au contenu",
    "ar": "انتقل إلى المحتوى"
  },
  "your_training_space": {
    "en": "Your training space",
    "fr": "Votre espace sportif",
    "ar": "مساحتك للتدريب"
  },
  "main_navigation": {
    "en": "Main navigation",
    "fr": "Navigation principale",
    "ar": "التنقل الرئيسي"
  },
  "more": {
    "en": "More",
    "fr": "Plus",
    "ar": "المزيد"
  },
  "your_pace_your_progress": {
    "en": "Your pace. Your progress.",
    "fr": "Votre rythme. Vos progrès.",
    "ar": "وتيرتك. تقدمك."
  },
  "one_session_at_a_time": {
    "en": "One session at a time.",
    "fr": "Une séance à la fois.",
    "ar": "حصة واحدة في كل مرة."
  },
  "workspace": {
    "en": "WORKSPACE",
    "fr": "ESPACE",
    "ar": "مساحة العمل"
  },
  "workout_in_progress_resume_workout": {
    "en": "Workout in progress · Resume workout",
    "fr": "Séance en cours · Reprendre",
    "ar": "حصة جارية · استئناف التمرين"
  },
  "built_for_the_long_run": {
    "en": "Built for the long run.",
    "fr": "Pensé pour durer.",
    "ar": "مصمم للاستمرار."
  },
  "close": {
    "en": "Close",
    "fr": "Fermer",
    "ar": "إغلاق"
  },
  "settings": {
    "en": "Settings",
    "fr": "Réglages",
    "ar": "الإعدادات"
  },
  "show_up_build_up": {
    "en": "SHOW UP. BUILD UP.",
    "fr": "PRÉSENT. PLUS FORT.",
    "ar": "ابدأ. ثم تقدّم."
  },
  "a_little_stronger": {
    "en": "A little stronger.",
    "fr": "Un peu plus fort.",
    "ar": "أقوى قليلاً."
  },
  "every_session": {
    "en": "Every session.",
    "fr": "À chaque séance.",
    "ar": "في كل حصة."
  },
  "training_summary": {
    "en": "Training summary",
    "fr": "Bilan sportif",
    "ar": "ملخص التدريب"
  },
  "sessions_logged": {
    "en": "Sessions logged",
    "fr": "Séances enregistrées",
    "ar": "حصص مسجلة"
  },
  "minutes_of_training": {
    "en": "Minutes of training",
    "fr": "Minutes de sport",
    "ar": "دقائق التدريب"
  },
  "in_progress": {
    "en": "In progress",
    "fr": "En cours",
    "ar": "قيد التنفيذ"
  },
  "ready_when_you_are": {
    "en": "Ready when you are",
    "fr": "À votre rythme",
    "ar": "ابدأ حين تكون جاهزاً"
  },
  "your_next_session": {
    "en": "Your next session",
    "fr": "Votre prochaine séance",
    "ar": "حصتك القادمة"
  },
  "view_workout_plan": {
    "en": "View workout plan",
    "fr": "Voir le programme",
    "ar": "عرض خطة التدريب"
  },
  "movement_library": {
    "en": "MOVEMENT LIBRARY",
    "fr": "BIBLIOTHÈQUE",
    "ar": "مكتبة التمارين"
  },
  "find_your_next_move": {
    "en": "Find your next move.",
    "fr": "Trouvez votre mouvement.",
    "ar": "اكتشف تمرينك القادم."
  },
  "explore_the_library": {
    "en": "Explore the library",
    "fr": "Explorer la bibliothèque",
    "ar": "استكشف المكتبة"
  },
  "push": {
    "en": "Push",
    "fr": "Pousser",
    "ar": "دفع"
  },
  "pull": {
    "en": "Pull",
    "fr": "Tirer",
    "ar": "سحب"
  },
  "legs": {
    "en": "Legs",
    "fr": "Jambes",
    "ar": "أرجل"
  },
  "explore_by_muscle_see_the_movement_read_the_evidence": {
    "en": "Explore by muscle. See the movement. Read the evidence.",
    "fr": "Explorez par muscle. Visualisez le mouvement. Consultez les études.",
    "ar": "تصفح حسب العضلة. شاهد الحركة. اقرأ الدراسات."
  },
  "your_journal": {
    "en": "YOUR JOURNAL",
    "fr": "VOTRE JOURNAL",
    "ar": "سجلّك"
  },
  "the_work_you_put_in": {
    "en": "The work you put in.",
    "fr": "Le travail accompli.",
    "ar": "الجهد الذي بذلته."
  },
  "your_story_starts_here": {
    "en": "Your story starts here.",
    "fr": "Votre histoire commence ici.",
    "ar": "قصتك تبدأ هنا."
  },
  "complete_a_workout_to_see_your_sessions_here_no_rush_just_progress": {
    "en": "Complete a workout to see your sessions here. No rush. Just progress.",
    "fr": "Terminez une séance pour la retrouver ici. Chaque effort compte.",
    "ar": "أكمل تمريناً لتظهر حصصك هنا. كل خطوة مهمة."
  },
  "make_every_minute_count": {
    "en": "Make every minute count.",
    "fr": "Chaque minute compte.",
    "ar": "استفد من كل دقيقة."
  },
  "timer_stopwatch": {
    "en": "Timer & stopwatch",
    "fr": "Minuteur et chronomètre",
    "ar": "المؤقت وساعة الإيقاف"
  },
  "fuel_the_effort": {
    "en": "Fuel the effort.",
    "fr": "Nourrissez vos efforts.",
    "ar": "غذِّ مجهودك."
  },
  "daily_calorie_log": {
    "en": "Daily calorie log",
    "fr": "Journal calorique",
    "ar": "سجل السعرات اليومية"
  },
  "informed_by_research": {
    "en": "INFORMED BY RESEARCH",
    "fr": "ÉCLAIRÉ PAR LA RECHERCHE",
    "ar": "مسترشد بالأبحاث"
  },
  "research_supported_training": {
    "en": "Research-supported training",
    "fr": "Entraînement éclairé par la recherche",
    "ar": "تدريب مسترشد بالأبحاث"
  },
  "your_next_chapter": {
    "en": "YOUR NEXT CHAPTER",
    "fr": "VOTRE PROCHAIN CHAPITRE",
    "ar": "فصلك القادم"
  },
  "built_by_you": {
    "en": "Built by you.",
    "fr": "Construit par vous.",
    "ar": "بجهدك."
  },
  "one_rep_at_a_time": {
    "en": "One rep at a time.",
    "fr": "Une répétition à la fois.",
    "ar": "تكراراً بعد تكرار."
  },
  "a_focused_space_to_plan_your_training_log_your_effort_and_watch_your_p": {
    "en": "A focused space to plan your training, log your effort, and watch your progress. Start locally. Create an account when you want to sync.",
    "fr": "Un espace pour planifier, enregistrer vos efforts et suivre vos progrès. Commencez en local. Créez un compte pour synchroniser.",
    "ar": "مساحة لتخطيط تمارينك وتسجيل جهدك ومتابعة تقدمك. ابدأ محلياً وأنشئ حساباً حين ترغب بالمزامنة."
  },
  "let_s_get_started": {
    "en": "Let’s get started",
    "fr": "Commençons",
    "ar": "لنبدأ"
  },
  "01_plan_your_session": {
    "en": "01 / Plan your session",
    "fr": "01 / Planifier",
    "ar": "01 / خطط لحصتك"
  },
  "02_put_in_the_work": {
    "en": "02 / Put in the work",
    "fr": "02 / S’entraîner",
    "ar": "02 / تمرّن"
  },
  "03_see_your_progress": {
    "en": "03 / See your progress",
    "fr": "03 / Progresser",
    "ar": "03 / شاهد تقدمك"
  },
  "make_it_yours_2": {
    "en": "MAKE IT YOURS",
    "fr": "À VOTRE IMAGE",
    "ar": "اجعلها مساحتك"
  },
  "enter_your_workspace": {
    "en": "Enter your workspace",
    "fr": "Ouvrir mon espace",
    "ar": "افتح مساحتك"
  },
  "switch_exercise": {
    "en": "Switch exercise",
    "fr": "Changer d’exercice",
    "ar": "تغيير التمرين"
  },
  "previous": {
    "en": "Previous",
    "fr": "Précédent",
    "ar": "السابق"
  },
  "session_in_progress": {
    "en": "SESSION IN PROGRESS",
    "fr": "SÉANCE EN COURS",
    "ar": "الحصة جارية"
  },
  "sets_completed": {
    "en": "sets completed",
    "fr": "séries terminées",
    "ar": "مجموعات مكتملة"
  },
  "pause_timer": {
    "en": "Pause timer",
    "fr": "Pause chrono",
    "ar": "أوقف المؤقت مؤقتاً"
  },
  "resume_timer": {
    "en": "Resume timer",
    "fr": "Reprendre le chrono",
    "ar": "استأنف المؤقت"
  },
  "session_progress": {
    "en": "Session progress",
    "fr": "Progression de la séance",
    "ar": "تقدم الحصة"
  },
  "session_exercises": {
    "en": "Session exercises",
    "fr": "Exercices de la séance",
    "ar": "تمارين الحصة"
  },
  "ready_for_your_next_set": {
    "en": "Ready for your next set",
    "fr": "Prêt pour la prochaine série",
    "ar": "جاهز للمجموعة التالية"
  },
  "previous_session": {
    "en": "Previous session",
    "fr": "Séance précédente",
    "ar": "الحصة السابقة"
  },
  "use_previous_values": {
    "en": "Use previous values",
    "fr": "Utiliser les valeurs précédentes",
    "ar": "استخدم القيم السابقة"
  },
  "no_previous_completed_sets_for_this_exercise": {
    "en": "No previous completed sets for this exercise.",
    "fr": "Aucune série terminée pour cet exercice.",
    "ar": "لا توجد مجموعات مكتملة سابقة لهذا التمرين."
  },
  "enter_reps_then_mark_the_set_done_weight_is_optional_for_bodyweight_ex": {
    "en": "Enter reps, then mark the set done. Weight is optional for bodyweight exercises.",
    "fr": "Saisissez les répétitions, puis validez la série. La charge est facultative au poids du corps.",
    "ar": "أدخل التكرارات ثم أكمل المجموعة. الوزن اختياري لتمارين وزن الجسم."
  },
  "set_value_options": {
    "en": "Set {0} options",
    "fr": "Options série {0}",
    "ar": "خيارات المجموعة {0}"
  },
  "remove_set": {
    "en": "Remove set",
    "fr": "Supprimer la série",
    "ar": "احذف المجموعة"
  },
  "no_matching_set": {
    "en": "No matching set",
    "fr": "Aucune série correspondante",
    "ar": "لا توجد مجموعة مطابقة"
  },
  "use_previous_values_for_set_value": {
    "en": "Use previous values for set {0}",
    "fr": "Utiliser les valeurs précédentes pour la série {0}",
    "ar": "استخدم القيم السابقة للمجموعة {0}"
  },
  "use_previous": {
    "en": "Use previous",
    "fr": "Utiliser",
    "ar": "استخدم السابق"
  },
  "add_an_exercise_to_begin": {
    "en": "Add an exercise to begin.",
    "fr": "Ajoutez un exercice pour commencer.",
    "ar": "أضف تمريناً للبدء."
  },
  "reset_session": {
    "en": "Reset session",
    "fr": "Réinitialiser la séance",
    "ar": "إعادة ضبط الحصة"
  },
  "finish_now_only_completed_sets_count_toward_training_volume": {
    "en": "Finish now? Only completed sets count toward training volume.",
    "fr": "Terminer ? Seules les séries terminées comptent dans le volume.",
    "ar": "إنهاء الآن؟ تُحتسب المجموعات المكتملة فقط ضمن حجم التدريب."
  },
  "syncing_account_data": {
    "en": "Syncing account data…",
    "fr": "Synchronisation du compte…",
    "ar": "مزامنة بيانات الحساب…"
  },
  "account_data_synced": {
    "en": "Account data synced",
    "fr": "Données du compte synchronisées",
    "ar": "تمت مزامنة بيانات الحساب"
  },
  "sync_needs_attention": {
    "en": "Sync needs attention",
    "fr": "Synchronisation à vérifier",
    "ar": "المزامنة تحتاج مراجعة"
  },
  "saved_on_this_device": {
    "en": "Saved on this device",
    "fr": "Enregistré sur cet appareil",
    "ar": "محفوظ على هذا الجهاز"
  },
  "account_connected": {
    "en": "Account connected",
    "fr": "Compte connecté",
    "ar": "الحساب متصل"
  },
  "could_not_save_locally_export_a_backup": {
    "en": "Could not save locally. Export a backup.",
    "fr": "Échec de sauvegarde locale. Exportez une copie.",
    "ar": "تعذر الحفظ محلياً. صدّر نسخة احتياطية."
  },
  "offline_data_stays_on_this_device": {
    "en": "Offline · data stays on this device",
    "fr": "Hors ligne · données sur cet appareil",
    "ar": "غير متصل · البيانات على هذا الجهاز"
  },
  "sign_in_to_sync": {
    "en": "Sign in to sync",
    "fr": "Se connecter pour synchroniser",
    "ar": "سجّل الدخول للمزامنة"
  },
  "open_account": {
    "en": "Open Account",
    "fr": "Ouvrir le compte",
    "ar": "افتح الحساب"
  },
  "exercise_breakdown": {
    "en": "Exercise breakdown",
    "fr": "Bilan par exercice",
    "ar": "ملخص التمارين"
  },
  "your_workout_exercise_by_exercise": {
    "en": "Your workout, exercise by exercise",
    "fr": "Votre séance, exercice par exercice",
    "ar": "حصتك تمريناً بتمرين"
  },
  "completed_sets_only_volume_weight_repetitions_more_volume_is_not_autom": {
    "en": "Completed sets only. Volume = weight × repetitions. More volume is not automatically a better workout.",
    "fr": "Séries terminées uniquement. Volume = charge × répétitions. Plus de volume ne signifie pas forcément une meilleure séance.",
    "ar": "المجموعات المكتملة فقط. الحجم = الوزن × التكرارات. الحجم الأكبر لا يعني بالضرورة حصة أفضل."
  },
  "reps": {
    "en": "reps",
    "fr": "répétitions",
    "ar": "تكرارات"
  },
  "reps_bodyweight": {
    "en": "reps · bodyweight",
    "fr": "répétitions · poids du corps",
    "ar": "تكرارات · وزن الجسم"
  },
  "volume": {
    "en": "Volume",
    "fr": "Volume",
    "ar": "الحجم"
  },
  "total": {
    "en": "Total",
    "fr": "Total",
    "ar": "المجموع"
  },
  "no_comparable_previous_session_yet": {
    "en": "No comparable previous session yet.",
    "fr": "Pas encore de séance précédente comparable.",
    "ar": "لا توجد حصة سابقة قابلة للمقارنة بعد."
  }
} as const;

export type InterfaceCopyKey = keyof typeof interfaceCopy;

export function translateInterface(language: Language, key: InterfaceCopyKey, ...values: (string | number)[]) {
  return interfaceCopy[key][language].replace(/\{(\d+)\}/g, (placeholder, index) => values[Number(index)] === undefined ? placeholder : String(values[Number(index)]));
}
