import { expect, test } from 'vitest';
import { workoutNotice } from '../../utils/androidWorkoutNotification';
const data = {
  neuroLift_tracker_phase: 'active',
  neuroLift_tracker_active_exercises: JSON.stringify([
    { name: 'Incline Dumbbell Press', sets: [{ completed: true }, { completed: false }] },
    { name: 'Pull-ups', sets: [{ completed: false }] },
  ]),
  neuroLift_rest_end_time: '2000',
};
test('notice follows selected exercise, next set and absolute rest deadline', () => {
  expect(workoutNotice(data, 'en', 1000)).toMatchObject({ title: 'Incline Dumbbell Press', body: 'Chest · Set 2 of 2', restEnd: 2000 });
  expect(workoutNotice({ ...data, ui_session_exercise: '"Pull-ups"' }, 'en', 1000)?.title).toBe('Pull-ups');
  expect(workoutNotice(data, 'en', 3000)?.restEnd).toBe(0);
  expect(workoutNotice({ ...data, neuroLift_rest_end_time: 'NaN' }, 'en', 1000)?.restEnd).toBe(0);
});
test('finished, reset and empty drafts never retain a notification', () => {
  expect(workoutNotice({ ...data, neuroLift_tracker_phase: 'summary' }, 'en')).toBeNull();
  expect(workoutNotice({ ...data, neuroLift_tracker_phase: 'setup' }, 'en')).toBeNull();
  expect(workoutNotice({ ...data, neuroLift_tracker_active_exercises: '[]' }, 'en')).toBeNull();
  expect(workoutNotice({ ...data, neuroLift_tracker_active_exercises: 'invalid' }, 'en')).toBeNull();
});
