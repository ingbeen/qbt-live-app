import React, { useCallback, useState } from 'react';
import {
  View,
  Text,
  TextInput,
  StyleSheet,
  Pressable,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { COLORS } from '../utils/colors';
import { MARGIN_MD, MARGIN_SM, RADIUS_MD } from '../utils/constants';
import { signIn } from '../services/auth';

export const LoginScreen: React.FC = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const onSubmit = useCallback(async () => {
    setError(null);
    setLoading(true);
    try {
      await signIn(email.trim(), password);
    } catch (e) {
      console.error('[auth] signIn failed:', e);
      setError('이메일 또는 비밀번호가 올바르지 않습니다.');
    } finally {
      setLoading(false);
    }
  }, [email, password]);

  const disabled =
    loading || email.trim().length === 0 || password.length === 0;

  return (
    <SafeAreaView style={styles.safe}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={styles.flex}
      >
        <View style={styles.inner}>
          <Text style={styles.title}>QBT Live</Text>

          <TextInput
            style={styles.input}
            placeholder="이메일"
            placeholderTextColor={COLORS.sub}
            autoCapitalize="none"
            autoCorrect={false}
            keyboardType="email-address"
            value={email}
            onChangeText={setEmail}
            editable={!loading}
          />

          <TextInput
            style={styles.input}
            placeholder="비밀번호"
            placeholderTextColor={COLORS.sub}
            autoCapitalize="none"
            autoCorrect={false}
            secureTextEntry
            value={password}
            onChangeText={setPassword}
            editable={!loading}
          />

          {error ? <Text style={styles.error}>{error}</Text> : null}

          <Pressable
            style={({ pressed }) => [
              styles.button,
              disabled ? styles.buttonDisabled : null,
              pressed && !disabled && { opacity: 0.7 },
            ]}
            onPress={onSubmit}
            disabled={disabled}
          >
            {loading ? (
              <ActivityIndicator color={COLORS.text} />
            ) : (
              <Text style={styles.buttonText}>로그인</Text>
            )}
          </Pressable>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: COLORS.bg,
  },
  flex: {
    flex: 1,
  },
  inner: {
    flex: 1,
    justifyContent: 'center',
    paddingHorizontal: 24,
  },
  title: {
    color: COLORS.text,
    fontSize: 28,
    fontWeight: '700',
    textAlign: 'center',
    marginBottom: 32,
  },
  input: {
    backgroundColor: COLORS.card,
    borderColor: COLORS.border,
    borderWidth: 1,
    borderRadius: RADIUS_MD,
    paddingVertical: 12,
    paddingHorizontal: 14,
    color: COLORS.text,
    marginBottom: MARGIN_MD,
    fontSize: 16,
  },
  error: {
    color: COLORS.red,
    fontSize: 14,
    marginBottom: MARGIN_SM,
    textAlign: 'center',
  },
  button: {
    backgroundColor: COLORS.accent,
    borderRadius: RADIUS_MD,
    paddingVertical: 14,
    alignItems: 'center',
    marginTop: 8,
  },
  buttonDisabled: {
    opacity: 0.4,
  },
  buttonText: {
    color: COLORS.text,
    fontSize: 16,
    fontWeight: '600',
  },
});
