import mockAsyncStorage from '@react-native-async-storage/async-storage/jest/async-storage-mock';

jest.mock('@react-native-async-storage/async-storage', () => mockAsyncStorage);

jest.mock('react-native-worklets-core', () => ({
  Worklets: {
    createRunInContextFn: jest.fn(),
  },
}));

jest.mock('react-native-reanimated', () => {
  const { View } = require('react-native');

  return {
    __esModule: true,
    default: {
      View,
      createAnimatedComponent: (Component) => Component,
    },
    useSharedValue: (initial) => ({ value: initial }),
    useAnimatedStyle: (factory) => factory(),
    withTiming: (value) => value,
    interpolate: (_value, _inputRange, outputRange) =>
      outputRange[outputRange.length - 1],
  };
});

jest.mock('expo-haptics', () => ({
  impactAsync: jest.fn().mockResolvedValue(undefined),
  notificationAsync: jest.fn().mockResolvedValue(undefined),
  selectionAsync: jest.fn().mockResolvedValue(undefined),
  ImpactFeedbackStyle: {
    Light: 'light',
    Medium: 'medium',
  },
  NotificationFeedbackType: {
    Success: 'success',
    Warning: 'warning',
    Error: 'error',
  },
}));

jest.mock('@/theme/useThemeColors', () => {
  const { lightColors } = require('./tokens/colors');

  return {
    useThemeColors: () => ({
      isDark: false,
      primary: lightColors.primary[900],
      text: lightColors.neutral[900],
      background: lightColors.neutral[50],
      surface: lightColors.neutral[0],
      border: lightColors.neutral[200],
      muted: lightColors.neutral[600],
      accent: lightColors.accent[500],
      error: lightColors.error.text,
      success: lightColors.success.text,
      warning: lightColors.warning.text,
      placeholder: lightColors.neutral[400],
      tokens: lightColors,
    }),
  };
});
