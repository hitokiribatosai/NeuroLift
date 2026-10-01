import { LocalNotifications } from '@capacitor/local-notifications';
import { Capacitor } from '@capacitor/core';

export const requestNotificationPermissions = async () => {
    if (!Capacitor.isNativePlatform()) return false;
    try {
        const status = await LocalNotifications.checkPermissions();
        if (status.display !== 'granted') {
            const result = await LocalNotifications.requestPermissions();
            return result.display === 'granted';
        }
        return true;
    } catch (e) {
        console.warn("Notification permissions check failed (likely helper web)", e);
        return false;
    }
};

export const scheduleRestNotification = async (seconds: number) => {
    try {
        const hasPerm = await requestNotificationPermissions();
        if (!hasPerm) return;

        // Cancel any existing rest notifications
        await LocalNotifications.cancel({ notifications: [{ id: 1 }] });

        const triggerDate = new Date(Date.now() + seconds * 1000);

        await LocalNotifications.schedule({
            notifications: [
                {
                    title: 'Rest Finished',
                    body: 'Time to get back to work! 💪',
                    id: 1,
                    schedule: { at: triggerDate },
                    actionTypeId: '',
                    extra: null,
                    smallIcon: 'ic_stat_neurolift' // Default resource name often used
                }
            ]
        });
    } catch (e) {
        console.error("Failed to schedule notification", e);
    }
};

export const cancelRestNotification = async () => {
    try {
        await LocalNotifications.cancel({ notifications: [{ id: 1 }] });
    } catch (e) {
        console.error("Failed to cancel notification", e);
    }
};

export const registerWorkoutActionTypes = async () => {
    try {
        if (Capacitor.getPlatform() === 'android') {
            await LocalNotifications.createChannel({
                id: 'workout_timer',
                name: 'Workout Tracker',
                description: 'Active workout and rest timer notifications',
                importance: 5,
                visibility: 1,
                vibration: false
            });
        }
        await LocalNotifications.registerActionTypes({
            types: [
                {
                    id: 'WORKOUT_ACTIONS',
                    actions: [
                        { id: 'PAUSE', title: 'Pause', foreground: false },
                        { id: 'RESET', title: 'Reset', foreground: false, destructive: true }
                    ]
                }
            ]
        });
    } catch (e) {
        console.error("Failed to register action types", e);
    }
};

export const updateWorkoutNotification = async (timeText: string, isPaused: boolean, restText?: string) => {
    try {
        const hasPerm = await requestNotificationPermissions();
        if (!hasPerm) return;

        await LocalNotifications.schedule({
            notifications: [
                {
                    title: isPaused ? 'Workout Paused' : 'Workout in Progress',
                    body: restText ? `Rest: ${restText} | Time: ${timeText}` : `Current Time: ${timeText}`,
                    id: 2,
                    ongoing: true,
                    autoCancel: false,
                    onlyAlertOnce: true,
                    actionTypeId: 'WORKOUT_ACTIONS',
                    channelId: 'workout_timer',
                    smallIcon: 'ic_stat_neurolift'
                } as any
            ]
        });
    } catch (e) {
        console.error("Failed to update workout notification", e);
    }
};

export const cancelWorkoutNotification = async () => {
    try {
        await LocalNotifications.cancel({ notifications: [{ id: 2 }] });
    } catch (e) {
        console.error("Failed to cancel workout notification", e);
    }
};
