/**
 * Haptic feedback utilities for better mobile UX in bar environment
 * Uses Vibration API when available
 */

export const haptics = {
  light: () => {
    if ('vibrate' in navigator) {
      navigator.vibrate(10);
    }
  },
  
  medium: () => {
    if ('vibrate' in navigator) {
      navigator.vibrate(20);
    }
  },
  
  heavy: () => {
    if ('vibrate' in navigator) {
      navigator.vibrate(30);
    }
  },
  
  success: () => {
    if ('vibrate' in navigator) {
      navigator.vibrate([10, 50, 10]);
    }
  },
  
  error: () => {
    if ('vibrate' in navigator) {
      navigator.vibrate([20, 30, 20, 30, 20]);
    }
  },
};

/**
 * Add haptic feedback to button clicks
 */
export function withHaptic<T extends (...args: any[]) => any>(
  callback: T,
  intensity: 'light' | 'medium' | 'heavy' = 'light'
): T {
  return ((...args: any[]) => {
    haptics[intensity]();
    return callback(...args);
  }) as T;
}
