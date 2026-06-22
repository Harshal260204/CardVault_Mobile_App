import { Ionicons } from '@expo/vector-icons';
import React, { useEffect, useState } from 'react';
import {
  Pressable,
  ScrollView,
  StyleSheet,
  TextInput as RNTextInput,
  View,
} from 'react-native';
import Animated, {
  interpolate,
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from 'react-native-reanimated';

import { Text } from '@/components/Text';
import { TextInput } from '@/components/TextInput';
import { useThemeColors } from '@/theme/useThemeColors';
import { focusField } from '@/utils/a11y';
import { duration } from '@/tokens/motion';
import { space } from '@/tokens/spacing';

import { SOCIAL_SECTION_HEIGHT } from './constants';
import type {
  ContactFieldErrors,
  ContactFormField,
  ContactWizardAction,
  ContactWizardState,
} from './state';

export interface ContactInfoStepProps {
  state: ContactWizardState;
  dispatch: React.Dispatch<ContactWizardAction>;
  errors: ContactFieldErrors;
  onBlurField: (field: ContactFormField) => void;
  firstFieldRef: React.RefObject<RNTextInput | null>;
  stepActive: boolean;
}

export function ContactInfoStep({
  state,
  dispatch,
  errors,
  onBlurField,
  firstFieldRef,
  stepActive,
}: ContactInfoStepProps) {
  const colors = useThemeColors();
  const [expanded, setExpanded] = useState(false);
  const expandProgress = useSharedValue(0);

  useEffect(() => {
    expandProgress.value = withTiming(expanded ? 1 : 0, {
      duration: duration.base,
    });
  }, [expandProgress, expanded]);

  useEffect(() => {
    if (stepActive) {
      focusField(firstFieldRef);
    }
  }, [firstFieldRef, stepActive]);

  const socialStyle = useAnimatedStyle(() => ({
    height: interpolate(expandProgress.value, [0, 1], [0, SOCIAL_SECTION_HEIGHT]),
    opacity: expandProgress.value,
    overflow: 'hidden',
  }));

  return (
    <ScrollView
      style={styles.scroll}
      contentContainerStyle={styles.content}
      keyboardShouldPersistTaps="handled"
      showsVerticalScrollIndicator={false}
    >
      <Text
        variant="h3"
        color={colors.text}
        accessibilityRole="header"
        style={styles.title}
      >
        Contact info
      </Text>

      <TextInput
        fieldRef={firstFieldRef}
        label="Email"
        value={state.email}
        onChangeText={(value) =>
          dispatch({ type: 'SET_FIELD', field: 'email', value })
        }
        onBlur={() => onBlurField('email')}
        error={errors.email}
        keyboardType="email-address"
        autoCapitalize="none"
        accessibilityLabel="Email"
        accessibilityHint="Enter the contact email address"
        style={styles.field}
      />

      <TextInput
        label="Phone"
        value={state.phone}
        onChangeText={(value) =>
          dispatch({ type: 'SET_FIELD', field: 'phone', value })
        }
        onBlur={() => onBlurField('phone')}
        error={errors.phone}
        keyboardType="phone-pad"
        accessibilityLabel="Phone"
        accessibilityHint="Enter the contact phone number"
        style={styles.field}
      />

      <Pressable
        accessibilityRole="button"
        accessibilityState={{ expanded }}
        accessibilityLabel="Add social or website"
        accessibilityHint={
          expanded
            ? 'Collapse social and website fields'
            : 'Expand social and website fields'
        }
        onPress={() => setExpanded((current) => !current)}
        style={styles.toggle}
      >
        <Text variant="bodyStrong" color={colors.tokens.primary[500]}>
          Add social/website
        </Text>
        <Ionicons
          name={expanded ? 'chevron-up' : 'chevron-down'}
          size={18}
          color={colors.tokens.primary[500]}
        />
      </Pressable>

      <Animated.View style={socialStyle}>
        <TextInput
          label="Website"
          value={state.website}
          onChangeText={(value) =>
            dispatch({ type: 'SET_FIELD', field: 'website', value })
          }
          onBlur={() => onBlurField('website')}
          error={errors.website}
          autoCapitalize="none"
          accessibilityLabel="Website"
          accessibilityHint="Optional company website"
          style={styles.field}
        />
        <TextInput
          label="LinkedIn"
          value={state.linkedinUrl}
          onChangeText={(value) =>
            dispatch({ type: 'SET_FIELD', field: 'linkedinUrl', value })
          }
          onBlur={() => onBlurField('linkedinUrl')}
          error={errors.linkedinUrl}
          autoCapitalize="none"
          accessibilityLabel="LinkedIn"
          accessibilityHint="Optional LinkedIn profile URL"
          style={styles.field}
        />
      </Animated.View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  scroll: { flex: 1 },
  content: {
    paddingHorizontal: space[4],
    paddingBottom: space[6],
  },
  title: {
    marginBottom: space[4],
  },
  field: {
    marginBottom: space[1],
  },
  toggle: {
    minHeight: 44,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: space[2],
    marginBottom: space[2],
  },
});
