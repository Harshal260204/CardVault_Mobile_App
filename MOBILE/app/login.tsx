import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import React, { useCallback, useRef, useState } from 'react';
import {
  KeyboardAvoidingView,
  NativeScrollEvent,
  NativeSyntheticEvent,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  View,
  useWindowDimensions,
} from 'react-native';
import Animated, {
  interpolate,
  useAnimatedStyle,
  useSharedValue,
  withSpring,
  withTiming,
} from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { SuccessCheckmarkOverlay } from '@/components/auth/SuccessCheckmarkOverlay';
import { Button } from '@/components/Button';
import { getElevationStyle } from '@/components/Card';
import {
  EnrichIllustration,
  ScanIllustration,
  SyncIllustration,
} from '@/components/onboarding/illustrations';
import { PageIndicator } from '@/components/onboarding/PageIndicator';
import { Text } from '@/components/Text';
import { TextInput } from '@/components/TextInput';
import { useThemeColors } from '@/theme/useThemeColors';
import { api, persistAuth } from '@/lib/api';
import { getApiErrorMessage, login, register } from '@/lib/api-client';
import { isMobileAppRole } from '@/lib/roles';
import { useAuthStore } from '@/stores/auth-store';
import { duration, springs } from '@/tokens/motion';
import { radius, space } from '@/tokens/spacing';
import { useAccessibilityFocus } from '@/utils/a11y';

const ONBOARDING_PAGES = [
  {
    key: 'scan',
    headline: 'Scan any card',
    body: 'Point your camera at a business card and capture contact details in seconds.',
    Illustration: ScanIllustration,
  },
  {
    key: 'enrich',
    headline: 'Enrich every lead',
    body: 'Review OCR results, qualify leads, and add context before you leave the booth.',
    Illustration: EnrichIllustration,
  },
  {
    key: 'sync',
    headline: 'Sync with your team',
    body: 'Contacts flow to CardVault in real time so your pipeline stays up to date.',
    Illustration: SyncIllustration,
  },
] as const;

const AUTH_CARD_HEIGHT_RATIO = 0.65;
const REGISTER_SECTION_HEIGHT = 88;
const SUCCESS_OVERLAY_MS = 600;

type AuthMode = 'login' | 'register';

export default function LoginScreen() {
  const router = useRouter();
  const colors = useThemeColors();
  const insets = useSafeAreaInsets();
  const { width: screenWidth, height: screenHeight } = useWindowDimensions();
  const setSession = useAuthStore((s) => s.setSession);

  const carouselRef = useRef<ScrollView>(null);
  const authTitleRef = useRef<View>(null);
  const [page, setPage] = useState(0);
  const [authRevealed, setAuthRevealed] = useState(false);
  const [authMode, setAuthMode] = useState<AuthMode>('login');
  const [email, setEmail] = useState('employee@cardvault.local');
  const [password, setPassword] = useState('Password123!');
  const [fullName, setFullName] = useState('');
  const [emailError, setEmailError] = useState<string | undefined>();
  const [passwordError, setPasswordError] = useState<string | undefined>();
  const [fullNameError, setFullNameError] = useState<string | undefined>();
  const [loading, setLoading] = useState(false);
  const [successVisible, setSuccessVisible] = useState(false);

  const authProgress = useSharedValue(0);
  const registerProgress = useSharedValue(0);

  const authCardHeight = screenHeight * AUTH_CARD_HEIGHT_RATIO;
  const lastPageIndex = ONBOARDING_PAGES.length - 1;

  useAccessibilityFocus(authTitleRef, authRevealed);

  const illustrationColor = colors.text;
  const illustrationAccent = colors.tokens.primary[500];

  const revealAuth = useCallback(() => {
    setAuthRevealed(true);
    authProgress.value = withSpring(1, springs.fluid);
  }, [authProgress]);

  const handleCarouselScrollEnd = useCallback(
    (event: NativeSyntheticEvent<NativeScrollEvent>) => {
      const nextPage = Math.round(event.nativeEvent.contentOffset.x / screenWidth);
      setPage(nextPage);
    },
    [screenWidth],
  );

  const goToPage = useCallback(
    (nextPage: number) => {
      carouselRef.current?.scrollTo({
        x: nextPage * screenWidth,
        animated: true,
      });
      setPage(nextPage);
    },
    [screenWidth],
  );

  const handleNext = useCallback(() => {
    if (page < lastPageIndex) {
      goToPage(page + 1);
      return;
    }
    revealAuth();
  }, [goToPage, lastPageIndex, page, revealAuth]);

  const toggleAuthMode = useCallback(() => {
    setAuthMode((current) => {
      const next: AuthMode = current === 'login' ? 'register' : 'login';
      registerProgress.value = withTiming(next === 'register' ? 1 : 0, {
        duration: duration.base,
      });
      return next;
    });
    setEmailError(undefined);
    setPasswordError(undefined);
    setFullNameError(undefined);
  }, [registerProgress]);

  const clearFieldErrors = useCallback(() => {
    setEmailError(undefined);
    setPasswordError(undefined);
    setFullNameError(undefined);
  }, []);

  const mapSubmitError = useCallback(
    (message: string) => {
      const lower = message.toLowerCase();
      if (lower.includes('email')) {
        setEmailError(message);
        return;
      }
      if (lower.includes('password')) {
        setPasswordError(message);
        return;
      }
      if (lower.includes('name')) {
        setFullNameError(message);
        return;
      }
      setPasswordError(message);
    },
    [],
  );

  const onSubmit = useCallback(async () => {
    clearFieldErrors();

    const trimmedEmail = email.trim();
    const trimmedPassword = password.trim();
    const trimmedFullName = fullName.trim();
    let hasValidationError = false;

    if (!trimmedEmail) {
      setEmailError('Email is required.');
      hasValidationError = true;
    }
    if (!trimmedPassword) {
      setPasswordError('Password is required.');
      hasValidationError = true;
    }
    if (authMode === 'register' && !trimmedFullName) {
      setFullNameError('Full name is required.');
      hasValidationError = true;
    }
    if (hasValidationError) {
      return;
    }

    setLoading(true);
    try {
      const { user, tokens } =
        authMode === 'register'
          ? await register(api, trimmedEmail, trimmedPassword, trimmedFullName)
          : await login(api, trimmedEmail, trimmedPassword);

      if (!isMobileAppRole(user.role)) {
        setEmailError('This account must use the CardVault admin console.');
        return;
      }

      await persistAuth(tokens.accessToken, tokens.refreshToken, user);
      setSuccessVisible(true);

      await new Promise<void>((resolve) => {
        setTimeout(resolve, SUCCESS_OVERLAY_MS);
      });

      setSession(user, tokens.accessToken, tokens.refreshToken);
      router.replace('/(tabs)/home');
    } catch (error) {
      mapSubmitError(getApiErrorMessage(error));
    } finally {
      setLoading(false);
    }
  }, [
    authMode,
    clearFieldErrors,
    email,
    fullName,
    mapSubmitError,
    password,
    router,
    setSession,
  ]);

  const onSocialPress = useCallback((provider: 'Apple' | 'Google') => {
    clearFieldErrors();
    setEmailError(`${provider} sign-in is not available yet. Use email instead.`);
  }, [clearFieldErrors]);

  const authSheetStyle = useAnimatedStyle(() => ({
    transform: [
      {
        translateY: interpolate(authProgress.value, [0, 1], [authCardHeight, 0]),
      },
    ],
  }));

  const registerSectionStyle = useAnimatedStyle(() => ({
    height: interpolate(
      registerProgress.value,
      [0, 1],
      [0, REGISTER_SECTION_HEIGHT],
    ),
    opacity: registerProgress.value,
    overflow: 'hidden',
  }));

  const loginTitleStyle = useAnimatedStyle(() => ({
    opacity: 1 - registerProgress.value,
  }));

  const registerTitleStyle = useAnimatedStyle(() => ({
    opacity: registerProgress.value,
  }));

  const authSurfaceStyle = getElevationStyle(colors.isDark, 3, colors.surface);

  return (
    <View style={[styles.root, { backgroundColor: colors.primary }]}>
      <View
        style={[
          styles.topBar,
          { paddingTop: insets.top + space[2], paddingHorizontal: space[4] },
        ]}
      >
        {!authRevealed ? (
          <Button
            variant="ghost"
            size="md"
            label="Skip"
            onPress={revealAuth}
            accessibilityLabel="Skip onboarding"
            style={styles.skipButton}
          />
        ) : (
          <View style={styles.skipPlaceholder} />
        )}
      </View>

      <View style={styles.carouselSection}>
        <ScrollView
          ref={carouselRef}
          horizontal
          pagingEnabled
          showsHorizontalScrollIndicator={false}
          onMomentumScrollEnd={handleCarouselScrollEnd}
          scrollEnabled={!authRevealed}
          bounces={false}
        >
          {ONBOARDING_PAGES.map((panel) => {
            const Illustration = panel.Illustration;
            return (
              <View
                key={panel.key}
                style={[styles.panel, { width: screenWidth }]}
              >
                <View style={styles.illustrationWrap}>
                  <Illustration
                    color={illustrationColor}
                    accent={illustrationAccent}
                  />
                </View>
                <Text
                  variant="display"
                  color={colors.tokens.neutral[0]}
                  accessibilityRole="header"
                  style={styles.panelHeadline}
                >
                  {panel.headline}
                </Text>
                <Text
                  variant="body"
                  color={colors.tokens.neutral[200]}
                  style={styles.panelBody}
                >
                  {panel.body}
                </Text>
              </View>
            );
          })}
        </ScrollView>

        <PageIndicator count={ONBOARDING_PAGES.length} activeIndex={page} />

        {!authRevealed ? (
          <View style={[styles.carouselControls, { paddingHorizontal: space[4] }]}>
            <Button
              variant="primary"
              size="lg"
              fullWidth
              label={page === lastPageIndex ? 'Get Started' : 'Next'}
              onPress={handleNext}
              accessibilityLabel={
                page === lastPageIndex
                  ? 'Get started with sign in'
                  : `Go to page ${page + 2}`
              }
            />
          </View>
        ) : null}
      </View>

      <Animated.View
        pointerEvents={authRevealed ? 'auto' : 'none'}
        style={[
          styles.authSheet,
          authSurfaceStyle,
          {
            height: authCardHeight,
            paddingBottom: insets.bottom + space[4],
          },
          authSheetStyle,
        ]}
      >
        <View
          style={[
            styles.authHandle,
            { backgroundColor: colors.tokens.neutral[200] },
          ]}
        />

        <KeyboardAvoidingView
          style={styles.authKeyboard}
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        >
          <ScrollView
            keyboardShouldPersistTaps="handled"
            showsVerticalScrollIndicator={false}
            contentContainerStyle={styles.authContent}
          >
            <View
              ref={authTitleRef}
              accessible
              accessibilityRole="header"
              accessibilityLabel={
                authMode === 'register' ? 'Create account' : 'Sign in'
              }
              style={styles.authTitleWrap}
            >
              <Animated.View style={[styles.authTitleLayer, loginTitleStyle]}>
                <Text variant="h2" color={colors.text}>
                  Sign in
                </Text>
              </Animated.View>
              <Animated.View style={[styles.authTitleLayer, registerTitleStyle]}>
                <Text variant="h2" color={colors.text}>
                  Create account
                </Text>
              </Animated.View>
            </View>

            <Animated.View style={registerSectionStyle}>
              <TextInput
                label="Full name"
                value={fullName}
                onChangeText={(text) => {
                  setFullName(text);
                  if (fullNameError) setFullNameError(undefined);
                }}
                autoCapitalize="words"
                isRequired
                error={fullNameError}
                accessibilityLabel="Full name"
                accessibilityHint="Enter your full name to create an account"
                style={styles.compactField}
              />
            </Animated.View>

            <TextInput
              label="Email"
              value={email}
              onChangeText={(text) => {
                setEmail(text);
                if (emailError) setEmailError(undefined);
              }}
              autoCapitalize="none"
              keyboardType="email-address"
              isRequired
              error={emailError}
              accessibilityLabel="Email"
              accessibilityHint="Enter your work email address"
              style={styles.compactField}
            />

            <TextInput
              label="Password"
              value={password}
              onChangeText={(text) => {
                setPassword(text);
                if (passwordError) setPasswordError(undefined);
              }}
              secureTextEntry
              isRequired
              error={passwordError}
              accessibilityLabel="Password"
              accessibilityHint="Enter your account password"
              style={styles.compactField}
            />

            <Button
              variant="primary"
              size="lg"
              fullWidth
              label={authMode === 'register' ? 'Create account' : 'Sign In'}
              onPress={onSubmit}
              isLoading={loading}
              accessibilityLabel={
                authMode === 'register' ? 'Create account' : 'Sign in'
              }
              style={styles.submitButton}
            />

            <View style={styles.dividerRow}>
              <View
                style={[styles.dividerLine, { backgroundColor: colors.divider }]}
              />
              <Text variant="micro" color={colors.muted} style={styles.dividerText}>
                or continue with
              </Text>
              <View
                style={[styles.dividerLine, { backgroundColor: colors.divider }]}
              />
            </View>

            <Button
              variant="secondary"
              size="lg"
              fullWidth
              label="Continue with Apple"
              icon={<Ionicons name="logo-apple" size={18} color={colors.text} />}
              onPress={() => onSocialPress('Apple')}
              accessibilityLabel="Continue with Apple"
              style={styles.socialButton}
            />
            <Button
              variant="secondary"
              size="lg"
              fullWidth
              label="Continue with Google"
              icon={<Ionicons name="logo-google" size={18} color={colors.text} />}
              onPress={() => onSocialPress('Google')}
              accessibilityLabel="Continue with Google"
              style={styles.socialButton}
            />

            <Pressable
              accessibilityRole="link"
              accessibilityLabel={
                authMode === 'login'
                  ? 'Create account'
                  : 'Sign in'
              }
              accessibilityHint={
                authMode === 'login'
                  ? 'Switch to the account registration form'
                  : 'Switch to the sign in form'
              }
              onPress={toggleAuthMode}
              style={styles.toggleLink}
            >
              <Text variant="body" color={colors.tokens.primary[500]}>
                {authMode === 'login'
                  ? 'Need an account? Create one'
                  : 'Already have an account? Sign in'}
              </Text>
            </Pressable>
          </ScrollView>
        </KeyboardAvoidingView>
      </Animated.View>

      <SuccessCheckmarkOverlay visible={successVisible} />
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
  },
  topBar: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    alignItems: 'center',
    minHeight: 44,
  },
  skipButton: {
    minHeight: 44,
  },
  skipPlaceholder: {
    minHeight: 44,
  },
  carouselSection: {
    flex: 1,
  },
  panel: {
    paddingHorizontal: space[6],
    alignItems: 'center',
    justifyContent: 'center',
    paddingBottom: space[4],
  },
  illustrationWrap: {
    marginBottom: space[6],
    minHeight: 180,
    alignItems: 'center',
    justifyContent: 'center',
  },
  panelHeadline: {
    textAlign: 'center',
    marginBottom: space[3],
  },
  panelBody: {
    textAlign: 'center',
    maxWidth: 320,
  },
  carouselControls: {
    paddingBottom: space[4],
    marginTop: space[2],
  },
  authSheet: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    borderTopLeftRadius: radius.xl,
    borderTopRightRadius: radius.xl,
    paddingTop: space[3],
  },
  authHandle: {
    alignSelf: 'center',
    width: 40,
    height: 4,
    borderRadius: radius.full,
    marginBottom: space[3],
  },
  authKeyboard: {
    flex: 1,
  },
  authContent: {
    paddingHorizontal: space[4],
    paddingBottom: space[4],
  },
  authTitleWrap: {
    minHeight: 40,
    marginBottom: space[4],
    justifyContent: 'center',
  },
  authTitleLayer: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'center',
  },
  compactField: {
    marginBottom: space[2],
  },
  submitButton: {
    marginTop: space[2],
  },
  dividerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: space[4],
    gap: space[2],
  },
  dividerLine: {
    flex: 1,
    height: 1,
  },
  dividerText: {
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  socialButton: {
    marginBottom: space[2],
  },
  toggleLink: {
    minHeight: 44,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: space[2],
  },
});
