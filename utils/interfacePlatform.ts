import { Capacitor } from '@capacitor/core';

// Presentation only: native plugins, storage, authentication and networking
// must continue using Capacitor's real platform detection.
export const usesModernInterface = () => ['web', 'android', 'ios'].includes(Capacitor.getPlatform());
