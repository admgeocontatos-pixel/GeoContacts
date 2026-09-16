import { Redirect, useRouter } from 'expo-router';
import { useState } from 'react';
import { ActivityIndicator, Pressable, Text, View } from 'react-native';
import { ScreenContainer } from '@/components/screen-container';
import { useAuth } from '@/hooks/use-auth';
import { startOAuthLogin } from '@/constants/oauth';
import { useColors } from '@/hooks/use-colors';

export default function LoginScreen() {
  const colors = useColors();
  const router = useRouter();
  const { isAuthenticated, loading } = useAuth();
  const [isStarting, setIsStarting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!loading && isAuthenticated) return <Redirect href="/(tabs)" />;

  const login = async () => {
    setIsStarting(true);
    setError(null);
    try {
      const result = await startOAuthLogin();
      if (result) router.replace(result as never);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Não foi possível iniciar o login.');
    } finally {
      setIsStarting(false);
    }
  };

  return (
    <ScreenContainer className="flex-1">
      <View className="flex-1 justify-center px-6">
        <Text className="text-4xl font-bold text-foreground mb-3">GeoContacts</Text>
        <Text className="text-base text-muted mb-10">Entre para encontrar contatos próximos com segurança e controle de privacidade.</Text>
        <Pressable onPress={login} disabled={isStarting || loading} style={{ backgroundColor: colors.primary, paddingVertical: 16, borderRadius: 12, opacity: isStarting ? 0.7 : 1 }}>
          {isStarting ? <ActivityIndicator color={colors.background} /> : <Text className="text-base font-bold text-background text-center">Entrar com Google, Facebook ou Outlook</Text>}
        </Pressable>
        {error && <Text className="text-sm text-error text-center mt-4">{error}</Text>}
        <Text className="text-xs text-muted text-center mt-6">Você será direcionado ao login seguro e retornará automaticamente ao aplicativo.</Text>
      </View>
    </ScreenContainer>
  );
}
