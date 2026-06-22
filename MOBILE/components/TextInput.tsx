import React, { ReactNode, useCallback, useEffect, useState } from 'react';
import {
  StyleSheet,
  Pressable,
  TextInput as RNTextInput,
  TextInputProps as RNTextInputProps,
  View,
  ViewStyle,
} from 'react-native';
import Animated, {
  interpolate,
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from 'react-native-reanimated';

import { Text } from '@/components/Text';
import { useThemeColors } from '@/theme/useThemeColors';
import { duration } from '@/tokens/motion';
import { radius, space } from '@/tokens/spacing';
import { typography } from '@/tokens/typography';

const FIELD_MIN_HEIGHT = 44;
const LABEL_FLOAT_OFFSET = 26;
const LABEL_SCALE_RATIO = typography.caption.fontSize / typography.body.fontSize;

const getFontFamily = (family: string, weight: string) => {
  if (family === 'Inter') {
    switch (weight) {
      case '400':
        return 'Inter_400Regular';
      case '500':
        return 'Inter_500Medium';
      case '600':
        return 'Inter_600SemiBold';
      case '700':
        return 'Inter_700Bold';
      case '800':
        return 'Inter_800ExtraBold';
      default:
        return 'Inter_400Regular';
    }
  }
  return family;
};

const bodyFontFamily = getFontFamily(
  typography.body.fontFamily,
  typography.body.fontWeight,
);

export interface TextInputProps {
  label: string;
  value: string;
  onChangeText: (text: string) => void;
  error?: string;
  helperText?: string;
  isRequired?: boolean;
  keyboardType?: RNTextInputProps['keyboardType'];
  secureTextEntry?: boolean;
  autoCapitalize?: RNTextInputProps['autoCapitalize'];
  leadingIcon?: ReactNode;
  trailingIcon?: ReactNode;
  leadingIconAccessibilityLabel?: string;
  trailingIconAccessibilityLabel?: string;
  onTrailingIconPress?: () => void;
  multiline?: boolean;
  multilineMinHeight?: number;
  placeholder?: string;
  isDisabled?: boolean;
  confidenceWarning?: boolean;
  fieldRef?: React.RefObject<RNTextInput | null>;
  onFocus?: RNTextInputProps['onFocus'];
  onBlur?: RNTextInputProps['onBlur'];
  accessibilityLabel?: string;
  accessibilityHint?: string;
  style?: ViewStyle;
}

export function TextInput({
  label,
  value,
  onChangeText,
  error,
  helperText,
  isRequired = false,
  keyboardType,
  secureTextEntry,
  autoCapitalize,
  leadingIcon,
  trailingIcon,
  leadingIconAccessibilityLabel,
  trailingIconAccessibilityLabel,
  onTrailingIconPress,
  multiline = false,
  multilineMinHeight,
  placeholder,
  isDisabled = false,
  confidenceWarning = false,
  fieldRef,
  onFocus,
  onBlur,
  accessibilityLabel,
  accessibilityHint,
  style,
}: TextInputProps) {
  const colors = useThemeColors();
  const [isFocused, setIsFocused] = useState(false);

  const isFloated = isFocused || value.length > 0;
  const showRing = isFocused || !!error || confidenceWarning;
  const warningHelper =
    confidenceWarning && !error ? 'AI guess — tap to confirm' : undefined;
  const message = error ?? helperText ?? warningHelper;

  const labelProgress = useSharedValue(isFloated ? 1 : 0);
  const ringProgress = useSharedValue(showRing ? 1 : 0);

  useEffect(() => {
    labelProgress.value = withTiming(isFloated ? 1 : 0, {
      duration: duration.fast,
    });
  }, [isFloated, labelProgress]);

  useEffect(() => {
    ringProgress.value = withTiming(showRing ? 1 : 0, {
      duration: duration.fast,
    });
  }, [ringProgress, showRing]);

  const fieldBackground = colors.isDark
    ? colors.tokens.neutral[100]
    : colors.tokens.neutral[50];

  const ringColor = error
    ? colors.tokens.error.text
    : confidenceWarning
      ? colors.tokens.warning.text
      : colors.tokens.primary[500];

  const labelAnimatedStyle = useAnimatedStyle(() => ({
    transform: [
      {
        translateY: interpolate(
          labelProgress.value,
          [0, 1],
          [0, -LABEL_FLOAT_OFFSET],
        ),
      },
      {
        scale: interpolate(
          labelProgress.value,
          [0, 1],
          [1, LABEL_SCALE_RATIO],
        ),
      },
    ],
  }));

  const ringAnimatedStyle = useAnimatedStyle(() => ({
    opacity: ringProgress.value,
    borderColor: ringColor,
  }));

  const handleFocus = useCallback(
    (event: Parameters<NonNullable<RNTextInputProps['onFocus']>>[0]) => {
      setIsFocused(true);
      onFocus?.(event);
    },
    [onFocus],
  );

  const handleBlur = useCallback(
    (event: Parameters<NonNullable<RNTextInputProps['onBlur']>>[0]) => {
      setIsFocused(false);
      onBlur?.(event);
    },
    [onBlur],
  );

  return (
    <View style={[styles.container, style]}>
      <View
        style={[
          styles.fieldOuter,
          multiline && styles.fieldOuterMultiline,
          isDisabled && styles.disabled,
        ]}
      >
        <Animated.View
          pointerEvents="none"
          style={[styles.labelContainer, labelAnimatedStyle]}
        >
          <View style={styles.labelRow}>
            <Text
              variant="body"
              color={
                error
                  ? colors.tokens.error.text
                  : confidenceWarning
                    ? colors.tokens.warning.text
                    : isFocused
                      ? colors.tokens.primary[500]
                      : colors.muted
              }
              style={styles.labelText}
            >
              {label}
            </Text>
            {isRequired ? (
              <View
                style={[
                  styles.requiredDot,
                  { backgroundColor: colors.tokens.primary[500] },
                ]}
                accessibilityLabel="required"
              />
            ) : null}
          </View>
        </Animated.View>

        <Animated.View
          pointerEvents="none"
          style={[styles.focusRing, ringAnimatedStyle]}
        />

        <View
          style={[
            styles.field,
            {
              backgroundColor: fieldBackground,
              minHeight: multiline ? undefined : FIELD_MIN_HEIGHT,
            },
            isFloated && styles.fieldFloated,
            multiline && [
              styles.fieldMultiline,
              multilineMinHeight != null && { minHeight: multilineMinHeight },
            ],
          ]}
        >
          {leadingIcon ? (
            <View
              style={styles.leadingIcon}
              importantForAccessibility="no-hide-descendants"
              accessibilityElementsHidden={!leadingIconAccessibilityLabel}
              accessibilityRole={leadingIconAccessibilityLabel ? 'image' : undefined}
              accessibilityLabel={leadingIconAccessibilityLabel}
            >
              {leadingIcon}
            </View>
          ) : null}

          <RNTextInput
            ref={fieldRef}
            value={value}
            onChangeText={onChangeText}
            onFocus={handleFocus}
            onBlur={handleBlur}
            editable={!isDisabled}
            multiline={multiline}
            keyboardType={keyboardType}
            secureTextEntry={secureTextEntry}
            autoCapitalize={autoCapitalize}
            placeholder={isFloated ? placeholder : undefined}
            placeholderTextColor={colors.placeholder}
            accessibilityLabel={accessibilityLabel ?? label}
            accessibilityHint={accessibilityHint ?? helperText}
            accessibilityState={{ disabled: isDisabled }}
            style={[
              styles.input,
              {
                color: colors.text,
                fontFamily: bodyFontFamily,
                fontSize: typography.body.fontSize,
                lineHeight: typography.body.lineHeight,
              },
              multiline && [
                styles.inputMultiline,
                multilineMinHeight != null && { minHeight: multilineMinHeight - space[5] },
              ],
            ]}
          />

          {trailingIcon ? (
            onTrailingIconPress ? (
              <Pressable
                accessibilityRole="button"
                accessibilityLabel={
                  trailingIconAccessibilityLabel ?? 'Input action'
                }
                onPress={onTrailingIconPress}
                hitSlop={8}
                style={styles.trailingIconPressable}
              >
                {trailingIcon}
              </Pressable>
            ) : (
              <View
                style={styles.trailingIcon}
                importantForAccessibility="no-hide-descendants"
                accessibilityElementsHidden={!trailingIconAccessibilityLabel}
                accessibilityRole={
                  trailingIconAccessibilityLabel ? 'image' : undefined
                }
                accessibilityLabel={trailingIconAccessibilityLabel}
              >
                {trailingIcon}
              </View>
            )
          ) : null}
        </View>
      </View>

      {message ? (
        <Text
          variant="caption"
          color={
            error
              ? colors.tokens.error.text
              : confidenceWarning
                ? colors.tokens.warning.text
                : colors.muted
          }
          accessibilityLiveRegion={error ? 'assertive' : undefined}
          accessibilityRole={error ? 'alert' : undefined}
          style={styles.message}
        >
          {message}
        </Text>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginBottom: space[3],
  },
  fieldOuter: {
    position: 'relative',
    paddingTop: space[2],
  },
  fieldOuterMultiline: {
    paddingTop: space[3],
  },
  disabled: {
    opacity: 0.5,
  },
  labelContainer: {
    position: 'absolute',
    left: space[4],
    top: space[2] + (FIELD_MIN_HEIGHT - typography.body.lineHeight) / 2,
    zIndex: 2,
  },
  labelRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: space[1],
  },
  labelText: {
    includeFontPadding: false,
  },
  requiredDot: {
    width: 4,
    height: 4,
    borderRadius: radius.full,
  },
  focusRing: {
    ...StyleSheet.absoluteFillObject,
    top: space[2],
    borderWidth: 2,
    borderRadius: radius.md,
    zIndex: 3,
  },
  field: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: radius.md,
    paddingHorizontal: space[4],
    paddingVertical: space[2],
  },
  fieldFloated: {
    paddingTop: space[4],
    paddingBottom: space[2],
  },
  fieldMultiline: {
    alignItems: 'flex-start',
    minHeight: 78,
    paddingTop: space[5],
  },
  input: {
    flex: 1,
    padding: 0,
    margin: 0,
    minHeight: typography.body.lineHeight,
  },
  inputMultiline: {
    minHeight: 56,
    textAlignVertical: 'top',
    paddingTop: 0,
  },
  leadingIcon: {
    marginRight: space[2],
  },
  trailingIcon: {
    marginLeft: space[2],
  },
  trailingIconPressable: {
    marginLeft: space[2],
    minWidth: 44,
    minHeight: 44,
    alignItems: 'center',
    justifyContent: 'center',
  },
  message: {
    marginTop: space[1],
    marginLeft: space[1],
  },
});
