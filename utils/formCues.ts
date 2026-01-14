export interface FormCue {
    id: string;
    exerciseName: string;
    setup: string[];
    execution: string[];
    mistakes: string[];
}

// In a real app, this would be fetched or more extensive.
// We serve a handful of common movements for the MVP.
export const formCueDatabase: Record<string, FormCue> = {
    'Bench Press (Barbell)': {
        id: 'bench_press_barbell',
        exerciseName: 'Bench Press (Barbell)',
        setup: [
            'Eyes directly under the bar',
            'Retract scapula (pinch shoulder blades together)',
            'Plant feet firmly on the ground',
            'Grip slightly wider than shoulder width'
        ],
        execution: [
            'Row the bar out of the rack',
            'Lower bar to mid-chest/sternum',
            'Keep elbows tucked at ~45 degree angle',
            'Drive up while pushing feet into floor'
        ],
        mistakes: [
            'Flaring elbows out too wide (shoulder risk)',
            'Bouncing bar off chest',
            'Lifting butt off the bench'
        ]
    },
    'Squat (Barbell)': {
        id: 'squat_barbell',
        exerciseName: 'Squat (Barbell)',
        setup: [
            'Bar rests on traps (high or low bar)',
            'Feet shoulder-width apart, toes slightly out',
            'Brace core (expand belt) before descent'
        ],
        execution: [
            'Break at hips and knees simultaneously',
            'Keep chest up and knees tracking over toes',
            'Hit depth (hip crease below knee)',
            'Drive hips up to starting position'
        ],
        mistakes: [
            'Knees caving inward (valgus)',
            'Heels lifting off the ground',
            'Rounded lower back (butt wink)'
        ]
    },
    'Deadlift (Barbell)': {
        id: 'deadlift_barbell',
        exerciseName: 'Deadlift (Barbell)',
        setup: [
            'Mid-foot under the bar',
            'Grip bar just outside legs',
            'Bring shins to bar without moving bar',
            'Squeeze chest up to flatten back'
        ],
        execution: [
            'Push the floor away (leg press)',
            'Keep bar close to body throughout',
            'Lock out hips at the top',
            'Return weight with controlled eccentrics'
        ],
        mistakes: [
            'Rounding the lower back (spinal flexion)',
            'Jerking the bar off the floor',
            'Hyperextending back at the top'
        ]
    },
    'Overhead Press (Barbell)': {
        id: 'ohp_barbell',
        exerciseName: 'Overhead Press (Barbell)',
        setup: [
            'Grip just outside shoulders',
            'Elbows slightly forward of the bar',
            'Squeeze glutes and brace core'
        ],
        execution: [
            'Move head back to clear path',
            'Press strictly vertically',
            'Lock out overhead with head through window',
            'Shrug shoulders at the top'
        ],
        mistakes: [
            'Arching lower back excessively',
            'Using leg drive (push press)',
            'Bar path curving forward'
        ]
    }
};

export const getFormCues = (exerciseName: string): FormCue | null => {
    // Normalize checking
    return formCueDatabase[exerciseName] || null;
};
