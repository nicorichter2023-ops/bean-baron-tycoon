export type FeedbackKind = 'click' | 'success' | 'error' | 'week';
export interface FeedbackPreferences { sound?: boolean; haptics?: boolean }
let audio: AudioContext | undefined;

/** Browser-only, opt-in feedback; unavailable hardware must never block a game action. */
export function playFeedback(kind: FeedbackKind, preferences: FeedbackPreferences) {
  if (typeof window === 'undefined') return;
  try {
    if (preferences.haptics && typeof navigator.vibrate === 'function') navigator.vibrate(kind === 'error' ? [12, 25, 12] : kind === 'week' ? [10, 30, 18] : 8);
    if (!preferences.sound || !window.AudioContext) return;
    audio ??= new window.AudioContext();
    const context = audio;
    void context.resume().then(() => {
      const frequencies = kind === 'week' ? [523, 659, 784] : kind === 'success' ? [659, 880] : kind === 'error' ? [220] : [440];
      frequencies.forEach((frequency, i) => {
        const oscillator = context.createOscillator(), gain = context.createGain();
        const start = context.currentTime + i * .075;
        oscillator.type = 'sine'; oscillator.frequency.value = frequency;
        gain.gain.setValueAtTime(0, start);
        gain.gain.linearRampToValueAtTime(.035, start + .008);
        gain.gain.exponentialRampToValueAtTime(.001, start + .12);
        oscillator.connect(gain); gain.connect(context.destination);
        oscillator.start(start); oscillator.stop(start + .13);
        oscillator.onended = () => { oscillator.disconnect(); gain.disconnect(); };
      });
    }).catch(() => undefined);
  } catch { /* Sound and vibration are optional browser capabilities. */ }
}