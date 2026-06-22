import * as Haptics from 'expo-haptics';

import {
  getReduceHapticsPreference,
  haptics,
  setReduceHapticsPreference,
} from '@/utils/haptics';

describe('haptics utility', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    setReduceHapticsPreference(false);
  });

  it('calls the correct underlying expo-haptics APIs once per method', async () => {
    await haptics.light();
    await haptics.medium();
    await haptics.success();
    await haptics.warning();
    await haptics.error();
    await haptics.selection();

    expect(Haptics.impactAsync).toHaveBeenCalledTimes(2);
    expect(Haptics.impactAsync).toHaveBeenNthCalledWith(
      1,
      Haptics.ImpactFeedbackStyle.Light,
    );
    expect(Haptics.impactAsync).toHaveBeenNthCalledWith(
      2,
      Haptics.ImpactFeedbackStyle.Medium,
    );

    expect(Haptics.notificationAsync).toHaveBeenCalledTimes(3);
    expect(Haptics.notificationAsync).toHaveBeenNthCalledWith(
      1,
      Haptics.NotificationFeedbackType.Success,
    );
    expect(Haptics.notificationAsync).toHaveBeenNthCalledWith(
      2,
      Haptics.NotificationFeedbackType.Warning,
    );
    expect(Haptics.notificationAsync).toHaveBeenNthCalledWith(
      3,
      Haptics.NotificationFeedbackType.Error,
    );

    expect(Haptics.selectionAsync).toHaveBeenCalledTimes(1);
  });

  it('silently no-ops when expo-haptics throws', async () => {
    jest
      .mocked(Haptics.impactAsync)
      .mockRejectedValueOnce(new Error('unsupported'));

    await expect(haptics.light()).resolves.toBeUndefined();
  });

  it('does not call expo-haptics when Reduce Haptics preference is enabled', async () => {
    setReduceHapticsPreference(true);
    expect(getReduceHapticsPreference()).toBe(true);

    await haptics.light();
    await haptics.medium();
    await haptics.success();
    await haptics.warning();
    await haptics.error();
    await haptics.selection();

    expect(Haptics.impactAsync).not.toHaveBeenCalled();
    expect(Haptics.notificationAsync).not.toHaveBeenCalled();
    expect(Haptics.selectionAsync).not.toHaveBeenCalled();
  });
});
