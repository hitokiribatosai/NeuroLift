import { Capacitor } from '@capacitor/core';

let context: AudioContext | undefined;
export function primeNotificationAudio() {
    const Audio = window.AudioContext || (window as Window & { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
    if (!Audio) return;
    context ??= new Audio();
    if (context.state === 'suspended') void context.resume().catch(() => {});
}

export const playNotificationSound = async (nativeRestAlert = false) => {
    // Background native alerts use the bundled three-tone sound instead.
    if (nativeRestAlert && Capacitor.isNativePlatform() && document.visibilityState === 'hidden') return;
    try {
        primeNotificationAudio();
        if (!context) return;
        await context.resume();
        for (let i = 0; i < 3; i++) {
            const start = context.currentTime + 0.02 + i * 0.35;
            const osc = context.createOscillator();
            const gain = context.createGain();
            osc.type = 'sine';
            osc.frequency.setValueAtTime(880, start);
            gain.gain.setValueAtTime(0, start);
            gain.gain.linearRampToValueAtTime(0.3, start + 0.02);
            gain.gain.linearRampToValueAtTime(0, start + 0.2);
            osc.connect(gain); gain.connect(context.destination);
            osc.onended = () => { osc.disconnect(); gain.disconnect(); };
            osc.start(start); osc.stop(start + 0.2);
        }
    } catch { /* Sound must never interrupt logging. */ }
};
