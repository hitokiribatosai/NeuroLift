import React, { useState, useEffect } from 'react';
import { useLanguage } from '../../contexts/LanguageContext';
import { SpotlightButton } from '../ui/SpotlightButton';
import { Card } from '../ui/Card';
import { CompletedWorkout, ActiveExercise } from '../../types';
import { getExerciseDatabase, getLocalizedMuscleName } from '../../utils/exerciseData';
import { useClock } from '../../contexts/ClockContext';

export const Tracker: React.FC = () => {
  const { t, language } = useLanguage();
  const [phase, setPhase] = useState<'setup' | 'active' | 'summary'>('setup');
  const [selectedMuscles, setSelectedMuscles] = useState<string[]>([]);
  const [selectedExercises, setSelectedExercises] = useState<string[]>([]);
  const [tutorialExercise, setTutorialExercise] = useState<string | null>(null);
  const [plateCalcWeight, setPlateCalcWeight] = useState<number | null>(null); // This will now represent "Per Side" input
  const [barWeight, setBarWeight] = useState<number>(20);
  const [activeSetInfo, setActiveSetInfo] = useState<{ exIdx: number, setIdx: number } | null>(null);

  // Active Session State
  const [activeExercises, setActiveExercises] = useState<ActiveExercise[]>([]);
  const [completedWorkout, setCompletedWorkout] = useState<CompletedWorkout | null>(null);
  const [restRemaining, setRestRemaining] = useState<number | null>(null);

  // Use Global Clock for Workout Session
  const {
    mode, setMode,
    timerActive, setTimerActive,
    duration, setDuration,
    countdownRemaining,
    countdownInput, setCountdownInput,
    laps, addLap,
    resetClock,
    startTimer
  } = useClock();

  // Dynamic DB
  const exercisesByMuscle = getExerciseDatabase(language);
  const selectableMuscles = Object.keys(exercisesByMuscle);

  useEffect(() => {
    let interval: any;
    if (restRemaining !== null && restRemaining > 0) {
      interval = setInterval(() => setRestRemaining(r => (r !== null ? r - 1 : null)), 1000);
    } else if (restRemaining === 0) {
      setRestRemaining(null);
    }
    return () => clearInterval(interval);
  }, [restRemaining]);

  const formatTime = (secs: number) => {
    const m = Math.floor(secs / 60);
    const s = secs % 60;
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  const toggleMuscle = (m: string) => {
    if (selectedMuscles.includes(m)) {
      setSelectedMuscles(selectedMuscles.filter(x => x !== m));
      // Optionally remove exercises if muscle deselected
    } else {
      setSelectedMuscles([...selectedMuscles, m]);
    }
  };

  const toggleExercise = (ex: string) => {
    if (selectedExercises.includes(ex)) {
      setSelectedExercises(selectedExercises.filter(i => i !== ex));
    } else {
      setSelectedExercises([...selectedExercises, ex]);
    }
  };

  const handleStartWorkout = () => {
    setPhase('active');
    setTimerActive(true);
    setMode('stopwatch');
    setDuration(0);
    setActiveExercises(selectedExercises.map(name => ({
      name,
      sets: [{ id: crypto.randomUUID(), weight: 0, reps: 0, completed: false }]
    })));
  };

  const addSet = (exerciseIndex: number) => {
    const newExs = [...activeExercises];
    newExs[exerciseIndex].sets.push({
      id: crypto.randomUUID(),
      weight: 0,
      reps: 0,
      completed: false
    });
    setActiveExercises(newExs);
  };

  const updateSet = (exIdx: number, setIdx: number, field: 'weight' | 'reps', val: string) => {
    const newExs = [...activeExercises];
    const value = parseFloat(val) || 0;
    (newExs[exIdx].sets[setIdx] as any)[field] = value;
    setActiveExercises(newExs);
  };

  const toggleSetComplete = (exIdx: number, setIdx: number) => {
    const newExs = [...activeExercises];
    const isNowCompleted = !newExs[exIdx].sets[setIdx].completed;
    newExs[exIdx].sets[setIdx].completed = isNowCompleted;
    setActiveExercises(newExs);

    if (isNowCompleted) {
      setRestRemaining(90);
    } else {
      setRestRemaining(null);
    }
  };

  const finishWorkout = () => {
    setTimerActive(false);
    setRestRemaining(null);
    const volume = activeExercises.reduce((acc, ex) => {
      return acc + ex.sets.reduce((sAcc, s) => s.completed ? sAcc + (s.weight * s.reps) : sAcc, 0);
    }, 0);

    const record: CompletedWorkout = {
      id: crypto.randomUUID(),
      date: new Date().toLocaleDateString(),
      durationSeconds: duration,
      exercises: activeExercises,
      totalVolume: volume
    };

    const history = JSON.parse(localStorage.getItem('neuroLift_history') || '[]');
    localStorage.setItem('neuroLift_history', JSON.stringify([record, ...history]));

    setCompletedWorkout(record);
    setPhase('summary');
  };

  const reset = () => {
    setPhase('setup');
    setSelectedMuscles([]);
    setSelectedExercises([]);
    setCompletedWorkout(null);
    setRestRemaining(null);
    setTimerActive(false);
  };

  const resetCurrentTimer = () => {
    if (window.confirm(t('timer_reset') + '?')) {
      resetClock();
    }
  };

  const startTimerMode = () => {
    const secs = parseInt(countdownInput);
    if (!isNaN(secs) && secs > 0) {
      startTimer(secs);
    }
  };

  const MuscleMap = () => {
    const frontMuscles = [
      { id: 'Chest', paths: ["M215.049,201.19C222.889,199.161 230.235,200.642 239.077,202.569C249.851,204.917 252.722,205.263 259.049,212.19C259.507,212.691 260.455,215.992 260.483,218.543C260.605,229.565 262.127,267.905 259.783,278.323C258.007,286.215 248.474,290.552 241.049,293.39C232.857,296.521 222.143,300.633 213.383,301.19C199.405,302.079 200.538,299.979 192.183,295.323C184.951,291.294 175.46,279.152 174.249,270.857C171.649,253.045 173.383,249.134 176.383,239.857C179.379,230.589 185.605,221.634 192.049,215.19C198.396,208.843 207.178,203.227 215.049,201.19Z", "M310.011,201.19C317.882,203.227 326.665,208.843 333.011,215.19C339.456,221.634 345.681,230.589 348.678,239.857C351.678,249.134 353.411,253.045 350.811,270.857C349.6,279.152 340.11,291.294 332.878,295.323C324.522,299.979 325.656,302.079 311.678,301.19C302.917,300.633 292.203,296.521 284.011,293.39C276.586,290.552 267.053,286.215 265.278,278.323C262.934,267.905 264.455,229.565 264.577,218.543C264.605,215.992 265.553,212.691 266.011,212.19C272.338,205.263 275.209,204.917 285.984,202.569C294.825,200.642 302.172,199.161 310.011,201.19Z"] },
      { id: 'Core', paths: ["M256.543,327.285C258.639,327.228 261.009,329.225 261.4,331.285C262.185,335.428 262.305,347.714 261.257,352.142C260.613,354.864 257.866,357.361 255.114,357.857C248.9,358.976 230.4,359.619 223.971,358.857C220.897,358.492 217.666,356.169 216.543,353.285C215.114,349.619 214.9,340.333 215.4,336.857C215.688,334.856 217.574,332.886 219.543,332.428C226.4,330.833 249.566,327.476 256.543,327.285Z", "M214.971,309.428C215.376,305.471 218.339,305.315 220.685,304.285C227.685,301.214 250.209,293.238 256.971,290.999C258.328,290.55 261.037,289.444 261.257,290.857Z", "M187.195,338.566C187.195,338.566 190.545,343.839 198.907,350.832C205.038,355.959 213.414,360.333 214.195,363.566C214.558,365.07 216.225,392.532 214.695,392.233Z", "M337.889,338.566C337.889,338.566 338.622,353.357 335.222,362.233C328.114,380.79 313.106,391.701 310.389,392.233C308.859,392.532 310.266,364.983 310.889,363.566Z"] },
      { id: 'Shoulders', paths: ["M132.791,283.407C130.402,280.795 145.235,240.073 156.791,226.407C167.933,213.229 199.735,198.795 202.124,201.407Z", "M392.097,283.407C390.256,285.419 393.975,277.013 373.763,262.99C362.139,254.926 355.354,245.857 353.764,242.073Z", "M131.458,273.74C128.459,271.788 117.871,245.04 135.124,212.407Z", "M393.756,273.74C390.757,275.692 392.018,248.324 372.095,224.118Z"] },
      { id: 'Biceps', paths: ["M168.813,254.176C168.813,254.176 177.94,306.556 151.334,347.516", "M356.511,254.176C356.511,254.176 370.322,263.69 382.923,275.786"] },
      { id: 'Forearms', paths: ["M112.242,334.286C112.554,334.841 116.618,358 117.213,365.543", "M148.799,355.931C151.71,353.934 145.287,373.696 142.799,384.931", "M413.234,334.286C414.509,332.02 424.164,347.726 427.663,355.543", "M376.677,355.931C378.384,357.102 384.762,362.619 389.545,366.52"] },
      { id: 'Quads', paths: ["M200.906,476.613C202.281,483.796 208.714,502.73 217.912,520.444", "M324.434,476.613C325.662,470.194 328.379,487.255 330.034,492.68", "M231.706,566.146C234.456,570.896 241.945,599.426 244.456,609.396", "M293.388,566.146C294.51,564.208 301.11,587.356 302.111,605.06"] },
    ];

    const rearMuscles = [
      { id: 'Back', paths: ["M694.477,371.271C698.82,374.509 713.968,412.434 713.227,414.521C712.719,415.954 704.92,415.962 700.727,418.021C696.061,420.312 687.496,428.841 686.227,428.021C684.266,426.752 685.529,411.295 688.169,394.842C689.878,384.193 690.134,368.033 694.477,371.271Z", "M832.546,367.271C836.889,364.033 836.646,384.193 838.354,394.842C840.995,411.295 842.258,426.752 840.296,428.021C839.027,428.841 830.463,420.312 825.796,418.021C821.604,415.962 814.555,415.954 814.046,414.521C813.305,412.434 828.203,370.509 832.546,367.271Z", "M761.557,335.376C749.67,324.307 741.779,307.209 735.224,294.376", "M766.698,335.376C764.575,337.353 765.358,271.473 766.32,213.079"] },
      { id: 'Glutes', paths: ["M678.057,465.437C680.798,433.892 697.31,417.252 719.057,419.771C736.743,421.819 761.727,453.061 761.391,472.104C761.164,484.95 763.204,503.507 757.04,510.028C744.554,523.239 733.897,530.139 714.391,531.437C672.426,534.231 676.411,484.394 678.057,465.437Z", "M847.951,464.437C849.597,483.394 854.249,534.231 812.284,531.437C792.778,530.139 782.121,523.239 769.635,510.028C763.471,503.507 765.511,484.95 765.284,472.104C764.948,453.061 789.932,421.819 807.617,419.771C829.364,417.252 845.21,432.892 847.951,464.437Z"] },
      { id: 'Hamstrings', paths: ["M694.065,533.279C695.412,533.077 697.304,534.35 699.581,534.878", "M712.601,537.446C712.982,535.913 718.577,536.136 721.315,535.588", "M832.712,533.279C835.66,533.721 836.232,542.039 837.045,545.612", "M814.176,537.446C815.743,543.746 817.209,560.696 817.605,572.731"] },
      { id: 'Calves', paths: ["M703.419,684.342C704.904,700.415 704.503,763.383 704.169,782.342", "M708.669,685.592C708.83,683.167 713.096,686.237 714.919,687.842", "M823.806,684.342C823.933,682.962 831.13,683.993 833.806,686.092", "M818.556,685.592C819.681,702.592 820.639,769.675 819.306,789.592"] },
      { id: 'Triceps', paths: ["M665.607,241.042C668.329,241.195 669.374,251.62 670.141,257.309", "M861.345,241.042C862.821,240.96 869.345,247.376 876.373,254.041"] },
      { id: 'Shoulders', paths: ["M718.557,411.937C716.025,410.195 709.074,383.751 693.224,357.937", "M808.445,411.937C806.193,413.487 794.671,382.819 788.111,370.604"] },
    ];

    const Skeleton = ({ muscles, label, outlinePath }: { muscles: { id: string, paths: string[] }[], label: string, outlinePath: string }) => (
      <div className="flex-1 flex flex-col items-center">
        <span className="text-[10px] text-zinc-500 uppercase tracking-[0.2em] mb-4 font-bold">{label}</span>
        <div className="relative w-full aspect-square">
          <svg viewBox="0 0 1024 1024" className="w-full h-auto drop-shadow-[0_0_20px_rgba(20,184,166,0.1)]">
            <path
              d={outlinePath}
              className="fill-zinc-900/30 stroke-zinc-700/50"
              strokeWidth="2"
            />
            {muscles.map(m => (
              <g
                key={m.id}
                onClick={() => toggleMuscle(m.id)}
                className="cursor-pointer group"
              >
                {m.paths.map((p, i) => (
                  <path
                    key={i}
                    d={p}
                    className={`transition-all duration-300 ${selectedMuscles.includes(m.id)
                      ? 'fill-teal-500 stroke-teal-400'
                      : 'fill-zinc-800/60 stroke-zinc-700 group-hover:fill-teal-500/30'
                      }`}
                    strokeWidth="1.5"
                  />
                ))}
              </g>
            ))}
          </svg>
        </div>
      </div>
    );

    const frontOutline = "M230.361,139.632C224.783,128.74 226.277,120.612 224.916,121.11C215.082,124.704 213.323,98.264 213.954,92.512C214.493,87.6 220.418,86.583 220.583,85.443C222.016,75.503 217.819,63.531 226.49,49.315C235.569,34.431 248.103,33.128 262.249,33.11C277.161,33.091 288.88,35.623 298.223,47.55C305.389,56.698 302.969,76.168 304.249,86.11C304.513,88.156 311.509,87.003 311.55,92.442C311.587,97.319 310.49,123.955 300.916,120.443C298.972,119.73 300.496,129.907 294.717,140.58C293.878,145.826 291.3,167.687 305.419,173.313C315.189,177.206 332.33,187.726 347.681,191.262C372.307,196.933 366.744,193.833 376.491,199.408C406.466,216.555 395.916,269.443 395.916,269.443C395.916,269.443 403.96,285.831 406.29,294.596C408.96,304.64 411.602,331.375 411.602,331.375C411.602,331.375 429.577,349.332 436.2,389.944C446.804,454.973 455.583,465.047 455.583,465.047C455.583,465.047 470.273,471.436 478.454,480.146C484.694,486.789 495.906,494.217 499.529,497.59C500.229,498.241 500.172,499.618 500.194,500.38C500.212,501 499.963,501.622 499.662,502.165C499.359,502.712 498.934,503.319 498.373,503.665C497.799,504.019 496.967,504.262 496.22,504.288C495.357,504.319 494.174,504.13 493.193,503.851C491.915,503.487 488.551,502.103C486.755,501.291 484.399,500.136 482.419,498.977C480.332,497.756 477.518,495.573 476.033,494.775C475.272,494.366 474.015,494.053 473.508,494.189C473.027,494.318 472.927,495.097 472.992,495.591C473.076,496.221 473.624,497.199 474.007,497.972C476.259,502.523 483.267,516.411 486.503,522.894C488.826,527.546 492.129,534.059 493.426,536.872C493.849,537.788 494.297,538.913 494.284,539.775C494.272,540.592 493.823,541.536 493.349,542.041C492.878,542.541 492.113,542.694 491.436,542.804C490.643,542.933 489.499,543.094 488.594,542.813C487.599,542.504 486.319,541.812 485.464,540.949C484.48,539.953 483.577,538.232 482.685,536.84C481.629,535.192 480.124,532.749 479.129,531.059C478.288,529.629 477.509,528.163 476.72,526.702C475.896,525.176 475.16,523.423 474.183,521.899C473.028,520.095 470.698,517.08 469.788,515.879L360.922,953.858L162.842,952.288L68.508,465.208Z";
    const backOutline = "M228.161,140.832C227.962,130.496 226.277,120.612 224.916,121.11C215.082,124.704 213.323,98.264 213.954,92.512C214.493,87.6 220.418,86.583 220.583,85.443C222.016,75.503 217.819,63.531 226.49,49.315C235.569,34.431 248.103,33.128 262.249,33.11C277.161,33.091 288.88,35.623 298.223,47.55C305.389,56.698 302.969,76.168 304.249,86.11C304.513,88.156 311.509,87.003 311.55,92.442C311.587,97.319 310.49,123.955 300.916,120.443C298.972,119.73 295.646,128.52 295.917,140.98C296.078,148.426 295.5,166.487 309.619,172.113C319.389,176.006 332.53,186.126 347.881,189.662C372.507,195.333 367.944,193.433 377.691,199.008C407.666,216.155 395.916,269.443 395.916,269.443C395.916,269.443 404.36,293.431 403.49,303.396C402.586,313.749 411.602,331.375 411.602,331.375C411.602,331.375 429.577,349.332 436.2,389.944C446.804,454.973 455.583,465.047 455.583,465.047C455.583,465.047 470.273,471.436 478.454,480.146C484.694,486.789 495.906,494.217 499.529,497.59C500.229,498.241 500.172,499.618 500.194,500.38C500.212,501 499.963,501.622 499.662,502.165C499.359,502.712 498.934,503.319 498.373,503.665C497.799,504.019 496.967,504.262 496.22,504.288C495.357,504.319 494.174,504.13 493.193,503.851C491.915,503.487 480.705,724.48 169.181,741.873C68.508,465.208 112.889,332.931 228.161,140.832Z";

    return (
      <div className="w-full max-w-4xl mx-auto mb-16 px-4">
        <div className="flex flex-col sm:flex-row gap-12 sm:gap-8 md:gap-16">
          <Skeleton muscles={frontMuscles} label={t('tracker_front')} outlinePath={frontOutline} />
          <Skeleton muscles={rearMuscles} label={t('tracker_rear')} outlinePath={backOutline} />
        </div>
      </div>
    );
  };

  if (phase === 'setup') {
    return (
      <div className="mx-auto max-w-4xl px-6 py-24 text-center">
        <div className="mb-12">
          <h2 className="text-4xl font-black text-white mb-2 uppercase tracking-tight">{t('tracker_select_muscle')}</h2>
          <div className="h-1 w-20 bg-teal-500 mx-auto rounded-full mb-8"></div>

          {selectedMuscles.length > 0 && (
            <div className="flex flex-wrap justify-center gap-2 mb-4 animate-in fade-in zoom-in duration-300">
              {selectedMuscles.map(m => (
                <span key={m} className="px-4 py-1.5 bg-teal-500/10 border border-teal-500/30 text-teal-400 text-xs font-bold rounded-full uppercase tracking-widest">
                  {getLocalizedMuscleName(m, language)}
                </span>
              ))}
            </div>
          )}
        </div>

        <MuscleMap />

        {selectedMuscles.length > 0 && (
          <div className="mt-12 animate-in slide-in-from-bottom-6 duration-500">
            <SpotlightButton onClick={() => setPhase('selection')} className="px-16 py-4 text-lg">
              {t('tracker_select_exercises')} ({selectedMuscles.length})
            </SpotlightButton>
          </div>
        )}
      </div>
    );
  }

  if (phase === 'selection') {
    return (
      <div className="mx-auto max-w-4xl px-6 py-24">
        <div className="flex justify-between items-end mb-12 border-b border-zinc-800 pb-8">
          <div>
            <h2 className="text-3xl font-black text-white uppercase tracking-tight mb-2">
              {t('tracker_select_specific')}
            </h2>
            <div className="flex gap-2">
              {selectedMuscles.map(m => (
                <span key={m} className="text-[10px] text-teal-500 font-bold uppercase tracking-widest px-2 py-0.5 bg-teal-500/10 rounded">
                  {getLocalizedMuscleName(m, language)}
                </span>
              ))}
            </div>
          </div>
          <button onClick={() => setPhase('setup')} className="text-xs text-zinc-500 hover:text-white uppercase tracking-widest font-bold flex items-center gap-2">
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" /></svg>
            {t('tracker_back')}
          </button>
        </div>

        <div className="space-y-16 mb-20">
          {selectedMuscles.map(muscle => (
            <div key={muscle} className="animate-in fade-in slide-in-from-bottom-4">
              <h3 className="text-2xl font-black text-white mb-8 uppercase tracking-widest flex items-center gap-3">
                <span className="w-2 h-8 bg-teal-500 rounded-full"></span>
                {getLocalizedMuscleName(muscle, language)}
              </h3>

              <div className="space-y-10">
                {(['weightlifting', 'cables', 'bodyweight'] as const).map(category => {
                  const exercises = exercisesByMuscle[muscle]?.[category] || [];
                  if (exercises.length === 0) return null;

                  return (
                    <div key={category}>
                      <h4 className="text-[10px] font-black text-zinc-500 uppercase tracking-[0.3em] mb-4 ml-1 flex items-center gap-2">
                        {category === 'weightlifting' ? 'Weightlifting' : category === 'cables' ? 'Cables' : 'Bodyweight'}
                        <div className="h-[1px] flex-1 bg-zinc-900"></div>
                      </h4>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                        {exercises.map(ex => (
                          <div key={ex} className="relative group">
                            <label className={`flex items-center gap-4 p-4 border rounded-xl cursor-pointer transition-all ${selectedExercises.includes(ex) ? 'bg-teal-500/10 border-teal-500/50 text-white shadow-[0_0_20px_rgba(20,184,166,0.05)]' : 'bg-zinc-900/30 border-zinc-800 text-zinc-400 hover:border-zinc-700 hover:bg-zinc-900/50'}`}>
                              <input
                                type="checkbox"
                                checked={selectedExercises.includes(ex)}
                                onChange={() => toggleExercise(ex)}
                                className="hidden"
                              />
                              <div className={`w-5 h-5 rounded-lg border flex items-center justify-center transition-all ${selectedExercises.includes(ex) ? 'bg-teal-500 border-teal-500 text-black' : 'border-zinc-700'}`}>
                                {selectedExercises.includes(ex) && <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={4} d="M5 13l4 4L19 7" /></svg>}
                              </div>
                              <span className="text-xs font-bold tracking-wide flex-1">{ex}</span>
                            </label>

                            <button
                              onClick={(e) => {
                                e.preventDefault();
                                e.stopPropagation();
                                setTutorialExercise(ex);
                              }}
                              className="absolute right-3 top-1/2 -translate-y-1/2 p-2 text-zinc-600 hover:text-teal-400 opacity-0 group-hover:opacity-100 transition-all z-10"
                              title={t('modal_watch_video')}
                            >
                              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                              </svg>
                            </button>
                          </div>
                        ))}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          ))}
        </div>

        <div className="sticky bottom-8 bg-black/90 backdrop-blur-xl p-6 rounded-3xl border border-zinc-800 shadow-2xl flex items-center justify-between">
          <div className="hidden md:block">
            <div className="text-[10px] text-zinc-500 font-bold uppercase tracking-widest mb-1">{selectedExercises.length} Exercises Picked</div>
            <div className="text-xs text-zinc-400 max-w-[300px] truncate">{selectedExercises.join(', ')}</div>
          </div>
          <SpotlightButton onClick={handleStartWorkout} disabled={selectedExercises.length === 0} className="px-12 py-4">
            {t('tracker_start')}
          </SpotlightButton>
        </div>

        {/* Tutorial Modal */}
        {tutorialExercise && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 animate-in fade-in duration-200">
            <div className="relative w-full max-w-xl rounded-[2rem] border border-zinc-800 bg-zinc-900/90 p-8 shadow-2xl backdrop-blur-xl">
              <button
                onClick={() => setTutorialExercise(null)}
                className="absolute right-6 top-6 text-zinc-500 hover:text-white transition-colors"
                title={t('modal_close')}
              >
                <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>

              <div className="flex items-center gap-3 mb-6">
                <div className="w-2 h-8 bg-teal-500 rounded-full"></div>
                <h3 className="text-xl font-black text-white uppercase tracking-tight pr-10 leading-tight">
                  {tutorialExercise}
                </h3>
              </div>

              <div className="aspect-video w-full rounded-2xl bg-black/60 mb-8 overflow-hidden relative group border border-zinc-800">
                <div className="absolute inset-0 bg-gradient-to-br from-teal-500/10 to-transparent"></div>
                <div className="absolute inset-0 flex flex-col items-center justify-center">
                  <div className="w-16 h-16 rounded-full bg-teal-500/20 border border-teal-500/30 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform duration-500 backdrop-blur-sm">
                    <svg className="h-8 w-8 text-teal-400 ml-1" fill="currentColor" viewBox="0 0 24 24"><path d="M8 5v14l11-7z" /></svg>
                  </div>
                  <p className="text-[10px] text-zinc-500 font-bold uppercase tracking-[0.2em]">{t('modal_watch_video')}</p>
                </div>
              </div>

              <div className="flex flex-col gap-3">
                <a
                  href={`https://www.youtube.com/results?search_query=${tutorialExercise}+exercise+technique`}
                  target="_blank"
                  rel="noreferrer"
                  className="w-full"
                >
                  <SpotlightButton className="w-full py-4 text-xs font-black uppercase tracking-widest">
                    {t('modal_watch_video')}
                  </SpotlightButton>
                </a>
                <button
                  onClick={() => setTutorialExercise(null)}
                  className="w-full py-3 text-[10px] text-zinc-500 hover:text-zinc-300 font-bold uppercase tracking-widest transition-colors"
                >
                  {t('modal_close')}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    );
  }

  if (phase === 'active') {
    return (
      <div className="mx-auto max-w-3xl px-6 py-20 pb-32">
        <div className="sticky top-16 z-40 bg-zinc-950/90 backdrop-blur border-b border-zinc-800 py-4 mb-8 px-4 rounded-b-2xl">
          <div className="flex justify-between items-center mb-4">
            <div className="flex flex-col">
              <div className="text-4xl font-mono font-bold text-teal-400 leading-none">
                {mode === 'stopwatch' ? formatTime(duration) : formatTime(countdownRemaining || 0)}
              </div>
              <div className="flex items-center gap-2 mt-2">
                <button
                  onClick={() => { setMode('stopwatch'); setTimerActive(false); }}
                  className={`p-1.5 rounded transition-colors ${mode === 'stopwatch' ? 'bg-teal-500/10 text-teal-500' : 'text-zinc-500'}`}
                  title={t('clock_stopwatch')}
                >
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                </button>
                <button
                  onClick={() => { setMode('timer'); setTimerActive(false); }}
                  className={`p-1.5 rounded transition-colors ${mode === 'timer' ? 'bg-teal-500/10 text-teal-500' : 'text-zinc-500'}`}
                  title={t('clock_timer')}
                >
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                </button>
                {restRemaining !== null && (
                  <div className="flex items-center gap-1 text-[10px] font-bold text-orange-400 animate-pulse bg-orange-400/10 px-2 py-0.5 rounded ml-2">
                    {t('tracker_rest_timer')}: {restRemaining}s
                  </div>
                )}
              </div>
            </div>

            <div className="flex gap-2">
              {mode === 'timer' && countdownRemaining === null && (
                <div className="flex items-center gap-2 mr-2">
                  <input
                    type="number"
                    value={countdownInput}
                    onChange={e => setCountdownInput(e.target.value)}
                    className="w-16 bg-zinc-900 border border-zinc-800 rounded px-2 py-1 text-xs text-white"
                    placeholder="Sec"
                  />
                  <button onClick={startTimerMode} className="p-1 px-3 bg-teal-600 rounded text-[10px] text-white font-bold">{t('timer_set')}</button>
                </div>
              )}

              <button
                onClick={() => setTimerActive(!timerActive)}
                className={`p-2 rounded-lg border transition-all ${timerActive
                  ? 'bg-amber-500/10 border-amber-500/50 text-amber-500'
                  : 'bg-emerald-500/10 border-emerald-500/50 text-emerald-500'
                  }`}
              >
                {timerActive ? <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24"><path d="M6 19h4V5H6v14zm8-14v14h4V5h-4z" /></svg> : <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24"><path d="M8 5v14l11-7z" /></svg>}
              </button>

              <button
                onClick={mode === 'stopwatch' ? addLap : undefined}
                disabled={!timerActive || mode !== 'stopwatch'}
                className="p-2 rounded-lg border border-zinc-700 text-zinc-400 hover:text-white disabled:opacity-30"
              >
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
              </button>

              <button onClick={resetCurrentTimer} className="p-2 rounded-lg border border-zinc-700 text-zinc-400 hover:text-red-400">
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" /></svg>
              </button>

              <SpotlightButton variant="secondary" onClick={finishWorkout} className="py-2 px-4 text-xs bg-red-900/20 text-red-200 ml-2">
                {t('tracker_finish')}
              </SpotlightButton>
            </div>
          </div>

          {mode === 'stopwatch' && laps.length > 0 && (
            <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
              {laps.map((time, i) => (
                <div key={i} className="flex-shrink-0 px-3 py-1 bg-zinc-900 border border-zinc-800 rounded-full text-[10px] text-zinc-400 font-mono">
                  <span className="text-teal-500 mr-2">L{laps.length - i}</span> {formatTime(time)}
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="space-y-8">
          {activeExercises.map((ex, exIdx) => (
            <Card key={exIdx} className="p-4 bg-zinc-900/40 border-zinc-800">
              <h3 className="text-xl font-extrabold text-white mb-4 flex items-center gap-3">
                <span className="w-1.5 h-6 bg-teal-500 rounded-full"></span>
                {ex.name}
              </h3>
              <div className="space-y-2">
                <div className="grid grid-cols-12 gap-1 sm:gap-2 text-[9px] sm:text-[10px] text-zinc-500 mb-1 px-1 sm:px-2 font-black uppercase tracking-widest">
                  <div className="col-span-2">{t('tracker_header_set')}</div>
                  <div className="col-span-4">{t('tracker_header_kg')}</div>
                  <div className="col-span-4">{t('tracker_header_reps')}</div>
                  <div className="col-span-2 text-center">✓</div>
                </div>
                {ex.sets.map((set, setIdx) => (
                  <div key={set.id} className={`grid grid-cols-12 gap-1 sm:gap-2 items-center p-1.5 sm:p-2 rounded-lg transition-all ${set.completed ? 'bg-teal-500/10 border border-teal-500/20' : 'bg-black/40 border border-zinc-800/50'}`}>
                    <div className="col-span-2 text-zinc-500 font-mono text-center text-xs">{setIdx + 1}</div>
                    <div className="col-span-4 relative group/plate">
                      <input
                        type="number"
                        placeholder="0"
                        value={set.weight || ''}
                        onChange={(e) => updateSet(exIdx, setIdx, 'weight', e.target.value)}
                        className="w-full bg-transparent text-white text-center outline-none"
                      />
                      <button
                        onClick={() => {
                          setPlateCalcWeight(0);
                          setActiveSetInfo({ exIdx, setIdx });
                        }}
                        className="absolute right-0 top-1/2 -translate-y-1/2 p-1 text-zinc-700 hover:text-teal-500 transition-colors"
                        title={t('plate_calc_title')}
                      >
                        <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><circle cx="12" cy="12" r="10" /><circle cx="12" cy="12" r="2" /></svg>
                      </button>
                    </div>
                    <div className="col-span-4">
                      <input
                        type="number"
                        placeholder="0"
                        value={set.reps || ''}
                        onChange={(e) => updateSet(exIdx, setIdx, 'reps', e.target.value)}
                        className="w-full bg-transparent text-white text-center outline-none"
                      />
                    </div>
                    <div className="col-span-2 flex justify-center">
                      <button
                        onClick={() => toggleSetComplete(exIdx, setIdx)}
                        className={`w-7 h-7 rounded-full border flex items-center justify-center transition-all ${set.completed ? 'bg-teal-500 border-teal-500 text-black shadow-[0_0_10px_rgba(20,184,166,0.5)]' : 'border-zinc-700 hover:border-teal-500/50'}`}
                      >
                        {set.completed && <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={4} d="M5 13l4 4L19 7" /></svg>}
                      </button>
                    </div>
                  </div>
                ))}
                <button
                  onClick={() => addSet(exIdx)}
                  className="w-full py-2.5 mt-2 text-[10px] text-zinc-500 hover:text-teal-400 hover:bg-teal-500/5 rounded-xl border border-dashed border-zinc-800 transition-all font-black uppercase tracking-widest"
                >
                  + {t('tracker_add_set')}
                </button>
              </div>
            </Card>
          ))}
        </div>

        {/* Plate Calculator Modal */}
        {activeSetInfo !== null && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/90 backdrop-blur-md p-4 animate-in fade-in duration-300">
            <div className="relative w-full max-w-md rounded-[2.5rem] border border-zinc-800 bg-zinc-950 p-8 shadow-[0_0_50px_rgba(20,184,166,0.1)]">
              <button
                onClick={() => setActiveSetInfo(null)}
                className="absolute right-8 top-8 text-zinc-500 hover:text-white transition-colors"
                title={t('modal_close')}
              >
                <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
              </button>

              <div className="mb-8">
                <h3 className="text-2xl font-black text-white uppercase tracking-tighter mb-2 flex items-center gap-3">
                  <div className="w-2 h-8 bg-teal-500 rounded-full"></div>
                  {t('plate_calc_title')}
                </h3>
                <div className="h-1 w-12 bg-teal-500/20 rounded-full"></div>
              </div>

              <div className="space-y-8">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-[10px] font-black text-zinc-500 uppercase tracking-widest mb-2">{t('plate_calc_barbell')} (KG)</label>
                    <input
                      type="number"
                      value={barWeight}
                      step="0.5"
                      onChange={(e) => setBarWeight(parseFloat(e.target.value) || 0)}
                      className="w-full bg-zinc-900 border border-zinc-800 rounded-2xl px-4 py-3 text-white font-mono focus:border-teal-500/50 outline-none transition-all"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-black text-zinc-500 uppercase tracking-widest mb-2">{t('plate_calc_per_side')} (KG)</label>
                    <input
                      type="number"
                      value={plateCalcWeight || 0}
                      step="0.5"
                      onChange={(e) => setPlateCalcWeight(parseFloat(e.target.value) || 0)}
                      className="w-full bg-zinc-900 border border-zinc-800 rounded-2xl px-4 py-3 text-white font-mono focus:border-teal-500/50 outline-none transition-all"
                    />
                  </div>
                </div>

                <div className="p-8 rounded-3xl bg-teal-500/5 border border-teal-500/10 text-center relative overflow-hidden group">
                  <div className="absolute inset-0 bg-teal-500/5 opacity-0 group-hover:opacity-100 transition-opacity"></div>
                  <div className="text-[10px] font-black text-teal-500/50 uppercase tracking-[0.3em] mb-2">{t('plate_calc_total')}</div>
                  <div className="text-6xl font-black text-white font-mono tracking-tighter">
                    {(plateCalcWeight || 0) * 2 + barWeight} <span className="text-lg text-teal-500 underline decoration-teal-500/30">KG</span>
                  </div>
                </div>

                <div className="flex flex-col gap-3">
                  <SpotlightButton
                    onClick={() => {
                      const total = (plateCalcWeight || 0) * 2 + barWeight;
                      updateSet(activeSetInfo.exIdx, activeSetInfo.setIdx, 'weight', total.toString());
                      setActiveSetInfo(null);
                    }}
                    className="w-full py-4 text-xs font-black uppercase tracking-widest"
                  >
                    {t('save')}
                  </SpotlightButton>
                  <button
                    onClick={() => setActiveSetInfo(null)}
                    className="w-full py-3 text-[10px] text-zinc-500 hover:text-zinc-300 font-bold uppercase tracking-widest transition-colors"
                  >
                    {t('modal_close')}
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    );
  }

  if (phase === 'summary' && completedWorkout) {
    return (
      <div className="mx-auto max-w-2xl px-6 py-24 text-center animate-in zoom-in duration-300">
        <div className="inline-flex h-20 w-20 items-center justify-center rounded-full bg-teal-500/20 mb-6 drop-shadow-[0_0_15px_rgba(20,184,166,0.3)]">
          <svg className="h-10 w-10 text-teal-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        </div>
        <h2 className="text-5xl font-black text-white mb-2 uppercase tracking-tighter">{t('tracker_summary')}</h2>
        <p className="text-zinc-500 italic mb-12 text-lg">"{t('tracker_quote')}"</p>

        <div className="grid grid-cols-2 gap-4 mb-12">
          <div className="p-8 rounded-3xl bg-zinc-900/80 border border-zinc-800 backdrop-blur">
            <div className="text-zinc-500 text-xs font-black uppercase tracking-widest mb-2">{t('tracker_duration')}</div>
            <div className="text-3xl font-mono text-teal-400">{formatTime(completedWorkout.durationSeconds)}</div>
          </div>
          <div className="p-8 rounded-3xl bg-zinc-900/80 border border-zinc-800 backdrop-blur">
            <div className="text-zinc-500 text-xs font-black uppercase tracking-widest mb-2">{t('tracker_volume')}</div>
            <div className="text-3xl font-mono text-teal-400">{completedWorkout.totalVolume} kg</div>
          </div>
        </div>

        <SpotlightButton onClick={reset} className="px-16 py-4 text-lg">
          {t('tracker_start_new')}
        </SpotlightButton>
      </div>
    );
  }

  return null;
};