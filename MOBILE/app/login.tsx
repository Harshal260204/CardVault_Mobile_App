import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useState } from 'react';
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';

import { useThemeColors } from '@/hooks/useThemeColors';
import { api, getApiBaseUrl, persistAuth } from '@/lib/api';
import { getApiErrorMessage, login, register } from '@/lib/api-client';
import { isMobileAppRole } from '@/lib/roles';
import { useAuthStore } from '@/stores/auth-store';

export default function LoginScreen() {
  const router = useRouter();
  const colors = useThemeColors();
  const setSession = useAuthStore((s) => s.setSession);
  const [email, setEmail] = useState('employee@cardvault.local');
  const [password, setPassword] = useState('Password123!');
  const [fullName, setFullName] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [isRegistering, setIsRegistering] = useState(false);

  const onSubmit = async () => {
    setError(null);
    setLoading(true);
    try {
      const { user, tokens } = isRegistering
        ? await register(api, email.trim(), password, fullName.trim())
        : await login(api, email.trim(), password);

      if (!isMobileAppRole(user.role)) {
        setError('This account must use the CardVault admin console.');
        return;
      }
      await persistAuth(tokens.accessToken, tokens.refreshToken, user);
      setSession(user, tokens.accessToken, tokens.refreshToken);
      router.replace('/(tabs)/home');
    } catch (e) {
      setError(getApiErrorMessage(e));
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView
      style={[styles.root, { backgroundColor: colors.primary }]}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <View
        style={[
          styles.card,
          { backgroundColor: colors.surface, borderColor: colors.cardBorder },
        ]}
      >
        <View style={styles.logoRow}>
          <Ionicons name="card-outline" size={28} color={colors.accent} />
          <Text style={[styles.title, { color: colors.text }]}>CardVault</Text>
        </View>
        <Text style={[styles.subtitle, { color: colors.muted }]}>
          {isRegistering ? 'Create your account' : 'Field sales — sign in'}
        </Text>
        {error ? <Text style={styles.error}>{error}</Text> : null}

        {isRegistering && (
          <>
            <Text style={[styles.label, { color: colors.text }]}>
              Full Name
            </Text>
            <TextInput
              style={[
                styles.input,
                {
                  backgroundColor: colors.inputBg,
                  borderColor: colors.border,
                  color: colors.text,
                },
              ]}
              autoCapitalize="words"
              placeholderTextColor={colors.placeholder}
              value={fullName}
              onChangeText={setFullName}
            />
          </>
        )}

        <Text style={[styles.label, { color: colors.text }]}>Email</Text>
        <TextInput
          style={[
            styles.input,
            {
              backgroundColor: colors.inputBg,
              borderColor: colors.border,
              color: colors.text,
            },
          ]}
          autoCapitalize="none"
          keyboardType="email-address"
          placeholderTextColor={colors.placeholder}
          value={email}
          onChangeText={setEmail}
        />
        <Text style={[styles.label, { color: colors.text }]}>Password</Text>
        <TextInput
          style={[
            styles.input,
            {
              backgroundColor: colors.inputBg,
              borderColor: colors.border,
              color: colors.text,
            },
          ]}
          secureTextEntry
          placeholderTextColor={colors.placeholder}
          value={password}
          onChangeText={setPassword}
        />
        <Pressable style={styles.button} onPress={onSubmit} disabled={loading}>
          {loading ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text style={styles.buttonText}>
              {isRegistering ? 'Sign up' : 'Sign in'}
            </Text>
          )}
        </Pressable>

        <Pressable
          style={{ marginTop: 16, alignItems: 'center' }}
          onPress={() => setIsRegistering(!isRegistering)}
        >
          <Text style={{ color: colors.accent, fontWeight: '500' }}>
            {isRegistering
              ? 'Already have an account? Sign in'
              : 'Need an account? Sign up'}
          </Text>
        </Pressable>

        <Text style={[styles.hint, { color: colors.muted }]}>
          Demo: employee@cardvault.local / Password123!
        </Text>
        <Text style={[styles.apiHint, { color: colors.muted }]}>
          API: {getApiBaseUrl()}
        </Text>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, justifyContent: 'center', padding: 24 },
  card: { borderRadius: 20, padding: 24, borderWidth: 1 },
  logoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    marginBottom: 4,
  },
  title: { fontSize: 28, fontWeight: '800', textAlign: 'center' },
  subtitle: {
    fontSize: 14,
    textAlign: 'center',
    marginTop: 4,
    marginBottom: 20,
  },
  label: { fontSize: 13, fontWeight: '600', marginBottom: 6 },
  input: {
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 12,
    marginBottom: 14,
    fontSize: 16,
  },
  button: {
    backgroundColor: '#1E2D4A',
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: 'center',
    marginTop: 4,
  },
  buttonText: { color: '#fff', fontWeight: '600', fontSize: 16 },
  error: { color: '#DC2626', marginBottom: 12, textAlign: 'center' },
  hint: { marginTop: 16, fontSize: 11, textAlign: 'center' },
  apiHint: { marginTop: 8, fontSize: 10, textAlign: 'center' },
});
