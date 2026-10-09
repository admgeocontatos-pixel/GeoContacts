import { Redirect } from 'expo-router';
import { useState } from 'react';
import { ActivityIndicator, Pressable, Text, TextInput, View } from 'react-native';
import { ScreenContainer } from '@/components/screen-container';
import { useAuth } from '@/hooks/use-auth';
import { startOAuthLogin } from '@/constants/oauth';
import { useColors } from '@/hooks/use-colors';
import * as Auth from '@/lib/_core/auth';
import * as Api from '@/lib/_core/api';
import * as Contacts from 'expo-contacts';
import * as Location from 'expo-location';
import { Platform } from 'react-native';

export default function LoginScreen() {
  const colors = useColors();
  const { isAuthenticated, loading, signIn } = useAuth();
  const [mode, setMode] = useState<'login' | 'register'>('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [busy, setBusy] = useState(false);
  const [oauthBusy, setOauthBusy] = useState(false);
  const [recoveryMode, setRecoveryMode] = useState(false);
  const [recoveryBusy, setRecoveryBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!loading && isAuthenticated) return <Redirect href="/(tabs)" />;

  const clearStaleSession = async () => {
    await Auth.removeSessionToken();
    await Auth.clearUserInfo();
  };

  const submitEmail = async () => {
    setBusy(true);
    setError(null);
    try {
      await clearStaleSession();
      const result = await Api.apiCall<{ sessionToken: string; user: Auth.User }>(
        mode === 'register' ? '/api/auth/email/register' : '/api/auth/email/login',
        { method: 'POST', body: JSON.stringify({ email: email.trim(), password, name: name.trim() || undefined }) },
      );
      await signIn(result.sessionToken, { ...result.user, lastSignedIn: new Date(result.user.lastSignedIn) });
      await requestDevicePermissions();
    } catch (err) {
      await clearStaleSession();
      const code = err instanceof Error ? err.message : '';
      const messages: Record<string, string> = {
        EMAIL_EXISTS: 'Este e-mail já está cadastrado. Escolha outro ou entre com sua conta.',
        INVALID_CREDENTIALS: 'E-mail ou senha inválidos.',
        INVALID_INPUT: 'Informe um e-mail válido e uma senha com pelo menos 8 caracteres.',
        DATABASE_UNAVAILABLE: 'Servidor em inicialização. Tente novamente em alguns segundos.',
        EMAIL_SERVICE_NOT_CONFIGURED: 'A recuperação por e-mail está desativada na versão de testes. Poderá continuar a utilizar o login normal.',
        PASSWORD_RESET_PROVIDER_PENDING: 'A recuperação por e-mail está temporariamente indisponível na versão de testes.',
        SESSION_PERSISTENCE_FAILED: 'Não foi possível salvar a sessão. Tente novamente.',
        SESSION_TOKEN_PERSISTENCE_FAILED: 'Não foi possível salvar a sessão. Tente novamente.',
        USER_INFO_PERSISTENCE_FAILED: 'Não foi possível salvar a sessão. Tente novamente.',
      };
      setError(messages[code] ?? (err instanceof Error ? err.message : 'Não foi possível concluir o acesso.'));
    } finally {
      setBusy(false);
    }
  };

  const requestDevicePermissions = async () => {
    if (Platform.OS === 'web') return;
    try {
      await Promise.all([
        Contacts.requestPermissionsAsync(),
        Location.requestForegroundPermissionsAsync(),
      ]);
    } catch (permissionError) {
      console.warn('[Permissions] Could not request contacts/location permissions:', permissionError);
    }
  };

  const requestRecovery = async () => {
    setRecoveryBusy(true);
    setError(null);
    try {
      const result = await Api.requestPasswordReset(email);
      setError(result.message);
      setRecoveryMode(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Não foi possível solicitar a recuperação.');
    } finally {
      setRecoveryBusy(false);
    }
  };

  const loginGoogle = async () => {
    setOauthBusy(true);
    setError(null);
    try {
      await startOAuthLogin();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Não foi possível iniciar o Google.');
    } finally {
      setOauthBusy(false);
    }
  };

  return (
    <ScreenContainer className="flex-1">
      <View className="flex-1 justify-center px-6">
        <Text className="text-4xl font-bold text-foreground mb-3">GeoContacts</Text>
        <Text className="text-base text-muted mb-7">Entre para encontrar contatos próximos com segurança e controle de privacidade.</Text>
        <Pressable onPress={loginGoogle} disabled={oauthBusy || busy} style={{ backgroundColor: colors.primary, paddingVertical: 15, borderRadius: 12, opacity: oauthBusy ? 0.7 : 1 }}>
          {oauthBusy ? <ActivityIndicator color={colors.background} /> : <Text className="text-base font-bold text-background text-center">Entrar com Google</Text>}
        </Pressable>
        <Text className="text-center text-muted my-5">ou use seu e-mail</Text>
        {recoveryMode ? <>
          <Text className="text-base text-foreground mb-3">Informe seu e-mail para receber as instruções de recuperação.</Text>
          <TextInput value={email} onChangeText={setEmail} placeholder="E-mail" placeholderTextColor={colors.muted} keyboardType="email-address" autoCapitalize="none" className="border border-border rounded-xl px-4 py-3 mb-3 text-foreground" />
          <Pressable onPress={requestRecovery} disabled={recoveryBusy} style={{ backgroundColor: colors.primary, paddingVertical: 14, borderRadius: 12 }}>
            {recoveryBusy ? <ActivityIndicator color={colors.background} /> : <Text className="text-base font-bold text-background text-center">Enviar instruções</Text>}
          </Pressable>
          <Pressable onPress={() => { setRecoveryMode(false); setError(null); }} className="mt-4"><Text className="text-center text-primary">Voltar ao login</Text></Pressable>
        </> : <>
          {mode === 'register' && <TextInput value={name} onChangeText={setName} placeholder="Nome" placeholderTextColor={colors.muted} autoCapitalize="words" className="border border-border rounded-xl px-4 py-3 mb-3 text-foreground" />}
          <TextInput value={email} onChangeText={setEmail} placeholder="E-mail" placeholderTextColor={colors.muted} keyboardType="email-address" autoCapitalize="none" className="border border-border rounded-xl px-4 py-3 mb-3 text-foreground" />
          <TextInput value={password} onChangeText={setPassword} placeholder="Senha (mínimo 8 caracteres)" placeholderTextColor={colors.muted} secureTextEntry className="border border-border rounded-xl px-4 py-3 mb-3 text-foreground" />
          <Pressable onPress={submitEmail} disabled={busy || oauthBusy} style={{ backgroundColor: colors.background, paddingVertical: 14, borderRadius: 12 }}>
            {busy ? <ActivityIndicator color={colors.foreground} /> : <Text className="text-base font-bold text-foreground text-center">{mode === 'register' ? 'Criar conta' : 'Entrar com e-mail'}</Text>}
          </Pressable>
          <Pressable onPress={() => { void clearStaleSession(); setMode(mode === 'login' ? 'register' : 'login'); setError(null); }} className="mt-4">
            <Text className="text-center text-primary">{mode === 'login' ? 'Ainda não tenho conta' : 'Já tenho uma conta'}</Text>
          </Pressable>
          {mode === 'login' && <Pressable onPress={() => { setRecoveryMode(true); setError(null); }} className="mt-3"><Text className="text-center text-primary">Esqueci a minha senha</Text></Pressable>}
        </>}
        {error && <Text className="text-sm text-error text-center mt-4">{error}</Text>}
        <Text className="text-xs text-muted text-center mt-6">Seus contatos e sua localização só serão acessados com sua autorização.</Text>
      </View>
    </ScreenContainer>
  );
}
