import { useEffect } from 'react';
import {
  AccessibilityInfo,
  findNodeHandle,
  TextInput,
  View,
} from 'react-native';

export const MIN_TOUCH_TARGET = 44;

export type FocusableRef =
  | React.RefObject<View | null>
  | React.RefObject<TextInput | null>;

export function setAccessibilityFocus(ref: FocusableRef): void {
  const node = findNodeHandle(ref.current);
  if (node != null) {
    AccessibilityInfo.setAccessibilityFocus(node);
  }
}

export function useAccessibilityFocus(
  ref: FocusableRef,
  enabled: boolean,
  delayMs = 250,
): void {
  useEffect(() => {
    if (!enabled) {
      return undefined;
    }

    const timer = setTimeout(() => {
      setAccessibilityFocus(ref);
    }, delayMs);

    return () => {
      clearTimeout(timer);
    };
  }, [delayMs, enabled, ref]);
}

export function focusField(
  ref: React.RefObject<TextInput | null>,
  delayMs = 250,
): void {
  setTimeout(() => {
    ref.current?.focus();
    setAccessibilityFocus(ref);
  }, delayMs);
}

export function focusFieldForStep(
  step: number,
  refs: Array<React.RefObject<TextInput | null>>,
  activeStep: number,
  delayMs = 250,
): void {
  if (step !== activeStep) {
    return;
  }

  const ref = refs[step];
  if (ref) {
    focusField(ref, delayMs);
  }
}
