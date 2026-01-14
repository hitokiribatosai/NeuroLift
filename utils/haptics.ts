import { Haptics, ImpactStyle, NotificationType } from '@capacitor/haptics';
import { Capacitor } from '@capacitor/core';

export const hapticFeedback = {
    async light() {
        if (Capacitor.isNativePlatform()) {
            try {
                await Haptics.impact({ style: ImpactStyle.Light });
            } catch (error) {
                console.error('Haptic feedback failed:', error);
            }
        }
    },

    async medium() {
        if (Capacitor.isNativePlatform()) {
            try {
                await Haptics.impact({ style: ImpactStyle.Medium });
            } catch (error) {
                console.error('Haptic feedback failed:', error);
            }
        }
    },

    async heavy() {
        if (Capacitor.isNativePlatform()) {
            try {
                await Haptics.impact({ style: ImpactStyle.Heavy });
            } catch (error) {
                console.error('Haptic feedback failed:', error);
            }
        }
    },

    async success() {
        if (Capacitor.isNativePlatform()) {
            try {
                await Haptics.notification({ type: NotificationType.Success });
            } catch (error) {
                console.error('Haptic feedback failed:', error);
            }
        }
    }
};
