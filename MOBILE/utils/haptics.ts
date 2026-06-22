import * as Haptics from 'expo-haptics';

let reduceHapticsEnabled = false;

export function setReduceHapticsPreference(enabled: boolean): void {
  reduceHapticsEnabled = enabled;
}

export function getReduceHapticsPreference(): boolean {
  return reduceHapticsEnabled;
}

async function runHaptic(action: () => Promise<void>): Promise<void> {
  if (reduceHapticsEnabled) {
    return;
  }

  try {
    await action();
  } catch {
    // Haptics can throw on unsupported devices/web.
  }
}

export const haptics = {
  light: (): Promise<void> =>
    runHaptic(() =>
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light),
    ),
  medium: (): Promise<void> =>
    runHaptic(() =>
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium),
    ),
  success: (): Promise<void> =>
    runHaptic(() =>
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success),
    ),
  warning: (): Promise<void> =>
    runHaptic(() =>
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning),
    ),
  error: (): Promise<void> =>
    runHaptic(() =>
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error),
    ),
  selection: (): Promise<void> => runHaptic(() => Haptics.selectionAsync()),
};
