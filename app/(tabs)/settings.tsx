import React from 'react';
import { ScrollView, Text, View, Pressable, Switch } from 'react-native';
import { ScreenContainer } from '@/components/screen-container';
import { useSettings } from '@/lib/settings-context';
import { useLocation } from '@/lib/location-context';
import { getTranslations } from '@/lib/i18n';
import { useColors } from '@/hooks/use-colors';
import type { Language } from '@/lib/i18n';
import { useAuth } from '@/hooks/use-auth';

export default function SettingsScreen() {
  const colors = useColors();
  const { settings, updateSettings } = useSettings();
  const { trackingEnabled, setTrackingEnabled } = useLocation();
  const { logout } = useAuth();
  const t = getTranslations(settings.language);

  const handleLanguageChange = async (language: Language) => {
    await updateSettings({ language });
  };

  const handleThemeChange = (theme: 'light' | 'dark' | 'auto') => {
    updateSettings({ theme });
  };

  const handleDistanceUnitChange = (unit: 'km' | 'mi') => {
    updateSettings({ distanceUnit: unit });
  };

  const handlePrivacyLevelChange = (level: 'public' | 'friends_only' | 'private') => {
    updateSettings({ privacyLevel: level });
  };

  const handleLocationTrackingChange = async (value: boolean) => {
    await setTrackingEnabled(value);
  };

  const handleNotificationsChange = async (value: boolean) => {
    await updateSettings({ notificationsEnabled: value });
  };

  const SettingRow = ({
    label,
    value,
    onPress,
  }: {
    label: string;
    value: string;
    onPress: () => void;
  }) => (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [
        {
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: 'space-between',
          paddingVertical: 12,
          paddingHorizontal: 12,
          borderBottomColor: colors.border,
          borderBottomWidth: 1,
          opacity: pressed ? 0.7 : 1,
        },
      ]}
    >
      <Text className="text-base text-foreground">{label}</Text>
      <Text className="text-sm text-muted">{value}</Text>
    </Pressable>
  );

  const ToggleRow = ({
    label,
    value,
    onToggle,
  }: {
    label: string;
    value: boolean;
    onToggle: (value: boolean) => void;
  }) => (
    <View
      style={{
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingVertical: 12,
        paddingHorizontal: 12,
        borderBottomColor: colors.border,
        borderBottomWidth: 1,
      }}
    >
      <Text className="text-base text-foreground">{label}</Text>
      <Switch
        value={value}
        onValueChange={onToggle}
        trackColor={{ false: colors.border, true: colors.primary + '80' }}
        thumbColor={value ? colors.primary : colors.muted}
      />
    </View>
  );

  return (
    <ScreenContainer className="flex-1">
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingHorizontal: 0 }}
      >
        {/* Header */}
        <View className="px-4 py-6">
          <Text className="text-3xl font-bold text-foreground">
            {t.settings}
          </Text>
        </View>

        {/* Appearance Section */}
        <View className="mb-6">
          <Text className="text-sm font-bold text-muted px-4 py-2 uppercase">
            Aparência
          </Text>
          <View
            style={{
              backgroundColor: colors.surface,
              borderTopColor: colors.border,
              borderTopWidth: 1,
              borderBottomColor: colors.border,
              borderBottomWidth: 1,
            }}
          >
            <SettingRow
              label={t.language}
              value={settings.language === 'pt-BR' ? 'Português' : 'English'}
              onPress={() => {
                const newLang: Language = settings.language === 'pt-BR' ? 'en' : 'pt-BR';
                handleLanguageChange(newLang);
              }}
            />
            <SettingRow
              label={t.theme}
              value={settings.theme === 'light' ? 'Claro' : settings.theme === 'dark' ? 'Escuro' : 'Automático'}
              onPress={() => {
                const themes: Array<'light' | 'dark' | 'auto'> = ['light', 'dark', 'auto'];
                const currentIndex = themes.indexOf(settings.theme);
                const nextTheme = themes[(currentIndex + 1) % themes.length];
                handleThemeChange(nextTheme);
              }}
            />
          </View>
        </View>

        {/* Location & Privacy Section */}
        <View className="mb-6">
          <Text className="text-sm font-bold text-muted px-4 py-2 uppercase">
            Localização e Privacidade
          </Text>
          <View
            style={{
              backgroundColor: colors.surface,
              borderTopColor: colors.border,
              borderTopWidth: 1,
              borderBottomColor: colors.border,
              borderBottomWidth: 1,
            }}
          >
            <ToggleRow
              label={t.locationTracking}
              value={trackingEnabled}
              onToggle={handleLocationTrackingChange}
            />
            <SettingRow
              label={t.privacyLevel}
              value={
                settings.privacyLevel === 'public'
                  ? 'Público'
                  : settings.privacyLevel === 'friends_only'
                    ? 'Apenas Amigos'
                    : 'Privado'
              }
              onPress={() => {
                const levels: Array<'public' | 'friends_only' | 'private'> = [
                  'public',
                  'friends_only',
                  'private',
                ];
                const currentIndex = levels.indexOf(settings.privacyLevel);
                const nextLevel = levels[(currentIndex + 1) % levels.length];
                handlePrivacyLevelChange(nextLevel);
              }}
            />
            <SettingRow
              label="Unidade de Distância"
              value={settings.distanceUnit === 'km' ? 'Quilômetros' : 'Milhas'}
              onPress={() => {
                const unit = settings.distanceUnit === 'km' ? 'mi' : 'km';
                handleDistanceUnitChange(unit);
              }}
            />
          </View>
        </View>

        {/* Notifications Section */}
        <View className="mb-6">
          <Text className="text-sm font-bold text-muted px-4 py-2 uppercase">
            Notificações
          </Text>
          <View
            style={{
              backgroundColor: colors.surface,
              borderTopColor: colors.border,
              borderTopWidth: 1,
              borderBottomColor: colors.border,
              borderBottomWidth: 1,
            }}
          >
            <ToggleRow
              label={t.notifications}
              value={settings.notificationsEnabled}
              onToggle={handleNotificationsChange}
            />
          </View>
        </View>

        {/* About Section */}
        <View className="mb-6">
          <Text className="text-sm font-bold text-muted px-4 py-2 uppercase">
            Sobre
          </Text>
          <View
            style={{
              backgroundColor: colors.surface,
              borderTopColor: colors.border,
              borderTopWidth: 1,
              borderBottomColor: colors.border,
              borderBottomWidth: 1,
            }}
          >
            <SettingRow
              label="Versão do App"
              value="1.0.0"
              onPress={() => {}}
            />
            <Pressable
              style={({ pressed }) => [
                {
                  flexDirection: 'row',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  paddingVertical: 12,
                  paddingHorizontal: 12,
                  opacity: pressed ? 0.7 : 1,
                },
              ]}
            >
              <Text className="text-base text-foreground">Política de Privacidade</Text>
              <Text className="text-lg text-muted">→</Text>
            </Pressable>
          </View>
        </View>

        {/* Logout Section */}
        <View className="px-4 mb-6">
          <Pressable
            onPress={() => { void logout(); }}
            style={({ pressed }) => [
              {
                backgroundColor: colors.error,
                paddingVertical: 14,
                borderRadius: 12,
                opacity: pressed ? 0.8 : 1,
              },
            ]}
          >
            <Text className="text-base font-bold text-background text-center">
              {t.logout}
            </Text>
          </Pressable>
        </View>

        {/* Footer */}
        <View className="px-4 py-6 items-center">
          <Text className="text-xs text-muted">
            GeoContacts v1.0.0
          </Text>
          <Text className="text-xs text-muted mt-1">
            © 2026 GeoContacts. Todos os direitos reservados.
          </Text>
        </View>
      </ScrollView>
    </ScreenContainer>
  );
}
