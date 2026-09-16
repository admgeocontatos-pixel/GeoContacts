import React, { useState } from 'react';
import { ScrollView, Text, View, Pressable, Image, TextInput } from 'react-native';
import { ScreenContainer } from '@/components/screen-container';
import { useSettings } from '@/lib/settings-context';
import { getTranslations } from '@/lib/i18n';
import { useColors } from '@/hooks/use-colors';
import type { User, UserSubscriptionPlan } from '@/shared/types';

// Mock user data
const MOCK_USER: User = {
  id: 'user123',
  email: 'user@example.com',
  name: 'João Silva',
  avatar: 'https://i.pravatar.cc/150?img=1',
  bio: 'Desenvolvedor apaixonado por tecnologia',
  subscriptionPlan: 'premium',
  createdAt: new Date(),
  updatedAt: new Date(),
};

const SUBSCRIPTION_FEATURES = {
  free: [
    'Descobrir contatos próximos',
    'Sincronizar contatos do telefone',
    'Ver anúncios básicos',
    'Limite de 10 contatos/dia',
  ],
  premium: [
    'Descobrir contatos próximos',
    'Sincronizar contatos do telefone',
    'Sem anúncios',
    'Contatos ilimitados',
    'Ocultar localização',
    'Filtros avançados',
  ],
  advertiser: [
    'Criar e gerenciar anúncios',
    'Analytics detalhados',
    'Segmentação por localização',
    'Múltiplos anúncios simultâneos',
    'Suporte prioritário',
  ],
};

export default function ProfileScreen() {
  const colors = useColors();
  const { settings } = useSettings();
  const t = getTranslations(settings.language);

  const [user, setUser] = useState<User>(MOCK_USER);
  const [isEditing, setIsEditing] = useState(false);
  const [editedName, setEditedName] = useState(user.name);
  const [editedBio, setEditedBio] = useState(user.bio || '');

  const handleSaveProfile = () => {
    setUser({
      ...user,
      name: editedName,
      bio: editedBio,
      updatedAt: new Date(),
    });
    setIsEditing(false);
  };

  const handleUpgradeSubscription = (plan: UserSubscriptionPlan) => {
    console.log('Upgrade to plan:', plan);
    // Navigate to subscription/payment screen
  };

  const subscriptionPlanLabel = {
    free: 'Gratuito',
    premium: 'Premium',
    advertiser: 'Anunciante',
  };

  const subscriptionPlanColor = {
    free: colors.muted,
    premium: colors.primary,
    advertiser: colors.warning,
  };

  return (
    <ScreenContainer className="flex-1">
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingHorizontal: 0 }}
      >
        {/* Profile Header */}
        <View className="px-4 py-6 border-b" style={{ borderBottomColor: colors.border }}>
          {/* Avatar */}
          <View className="items-center mb-4">
            {user.avatar ? (
              <Image
                source={{ uri: user.avatar }}
                style={{
                  width: 100,
                  height: 100,
                  borderRadius: 50,
                  backgroundColor: colors.border,
                }}
              />
            ) : (
              <View
                style={{
                  width: 100,
                  height: 100,
                  borderRadius: 50,
                  backgroundColor: colors.primary,
                  justifyContent: 'center',
                  alignItems: 'center',
                }}
              >
                <Text className="text-4xl font-bold text-background">
                  {user.name.charAt(0).toUpperCase()}
                </Text>
              </View>
            )}
          </View>

          {/* Edit Mode */}
          {isEditing ? (
            <View className="gap-4">
              <View>
                <Text className="text-xs font-semibold text-muted mb-2">
                  {t.name}
                </Text>
                <TextInput
                  value={editedName}
                  onChangeText={setEditedName}
                  placeholder={t.name}
                  placeholderTextColor={colors.muted}
                  className="border rounded-lg p-3 text-foreground"
                  style={{
                    borderColor: colors.border,
                    color: colors.foreground,
                  }}
                />
              </View>

              <View>
                <Text className="text-xs font-semibold text-muted mb-2">
                  {t.bio}
                </Text>
                <TextInput
                  value={editedBio}
                  onChangeText={setEditedBio}
                  placeholder={t.bio}
                  placeholderTextColor={colors.muted}
                  multiline
                  numberOfLines={3}
                  className="border rounded-lg p-3 text-foreground"
                  style={{
                    borderColor: colors.border,
                    color: colors.foreground,
                  }}
                />
              </View>

              <View className="flex-row gap-2">
                <Pressable
                  onPress={handleSaveProfile}
                  style={({ pressed }) => [
                    {
                      flex: 1,
                      backgroundColor: colors.primary,
                      paddingVertical: 12,
                      borderRadius: 8,
                      opacity: pressed ? 0.8 : 1,
                    },
                  ]}
                >
                  <Text className="text-sm font-semibold text-background text-center">
                    {t.save}
                  </Text>
                </Pressable>

                <Pressable
                  onPress={() => {
                    setIsEditing(false);
                    setEditedName(user.name);
                    setEditedBio(user.bio || '');
                  }}
                  style={({ pressed }) => [
                    {
                      flex: 1,
                      backgroundColor: colors.surface,
                      paddingVertical: 12,
                      borderRadius: 8,
                      borderColor: colors.border,
                      borderWidth: 1,
                      opacity: pressed ? 0.8 : 1,
                    },
                  ]}
                >
                  <Text className="text-sm font-semibold text-foreground text-center">
                    {t.cancel}
                  </Text>
                </Pressable>
              </View>
            </View>
          ) : (
            <>
              {/* Profile Info */}
              <View className="items-center mb-4">
                <Text className="text-2xl font-bold text-foreground mb-1">
                  {user.name}
                </Text>
                <Text className="text-sm text-muted mb-3">
                  {user.email}
                </Text>
                {user.bio && (
                  <Text className="text-sm text-foreground text-center mb-4">
                    {user.bio}
                  </Text>
                )}
              </View>

              {/* Edit Button */}
              <Pressable
                onPress={() => setIsEditing(true)}
                style={({ pressed }) => [
                  {
                    backgroundColor: colors.primary,
                    paddingVertical: 12,
                    borderRadius: 8,
                    opacity: pressed ? 0.8 : 1,
                  },
                ]}
              >
                <Text className="text-sm font-semibold text-background text-center">
                  {t.editProfile}
                </Text>
              </Pressable>
            </>
          )}
        </View>

        {/* Subscription Section */}
        <View className="px-4 py-6 border-b" style={{ borderBottomColor: colors.border }}>
          <Text className="text-lg font-bold text-foreground mb-4">
            {t.subscription}
          </Text>

          {/* Current Plan */}
          <View
            className="p-4 rounded-lg mb-4 flex-row items-center justify-between"
            style={{
              backgroundColor: subscriptionPlanColor[user.subscriptionPlan] + '20',
              borderColor: subscriptionPlanColor[user.subscriptionPlan],
              borderWidth: 1,
            }}
          >
            <View>
              <Text className="text-xs text-muted mb-1">
                {t.currentPlan}
              </Text>
              <Text
                className="text-lg font-bold"
                style={{ color: subscriptionPlanColor[user.subscriptionPlan] }}
              >
                {subscriptionPlanLabel[user.subscriptionPlan]}
              </Text>
            </View>
            <Text className="text-3xl">
              {user.subscriptionPlan === 'free' && '🆓'}
              {user.subscriptionPlan === 'premium' && '⭐'}
              {user.subscriptionPlan === 'advertiser' && '📢'}
            </Text>
          </View>

          {/* Features */}
          <View className="mb-4">
            <Text className="text-sm font-semibold text-foreground mb-3">
              {t.features}
            </Text>
            {SUBSCRIPTION_FEATURES[user.subscriptionPlan].map((feature, index) => (
              <View key={index} className="flex-row items-center gap-2 mb-2">
                <Text className="text-lg">✓</Text>
                <Text className="text-sm text-foreground flex-1">
                  {feature}
                </Text>
              </View>
            ))}
          </View>

          {/* Upgrade Options */}
          {user.subscriptionPlan !== 'premium' && (
            <Pressable
              onPress={() => handleUpgradeSubscription('premium')}
              style={({ pressed }) => [
                {
                  backgroundColor: colors.primary,
                  paddingVertical: 12,
                  borderRadius: 8,
                  marginBottom: 8,
                  opacity: pressed ? 0.8 : 1,
                },
              ]}
            >
              <Text className="text-sm font-semibold text-background text-center">
                Atualizar para Premium
              </Text>
            </Pressable>
          )}

          {user.subscriptionPlan !== 'advertiser' && (
            <Pressable
              onPress={() => handleUpgradeSubscription('advertiser')}
              style={({ pressed }) => [
                {
                  backgroundColor: colors.warning,
                  paddingVertical: 12,
                  borderRadius: 8,
                  opacity: pressed ? 0.8 : 1,
                },
              ]}
            >
              <Text className="text-sm font-semibold text-background text-center">
                Atualizar para Anunciante
              </Text>
            </Pressable>
          )}
        </View>

        {/* Favorite Contacts */}
        <View className="px-4 py-6 border-b" style={{ borderBottomColor: colors.border }}>
          <Text className="text-lg font-bold text-foreground mb-4">
            {t.favoriteContacts}
          </Text>
          <View
            className="p-4 rounded-lg items-center justify-center"
            style={{ backgroundColor: colors.surface, borderColor: colors.border, borderWidth: 1 }}
          >
            <Text className="text-4xl mb-2">🤍</Text>
            <Text className="text-sm text-muted">
              {t.noFavorites}
            </Text>
          </View>
        </View>

        {/* Account Info */}
        <View className="px-4 py-6">
          <Text className="text-lg font-bold text-foreground mb-4">
            {t.about}
          </Text>
          <View className="gap-3">
            <View
              className="p-3 rounded-lg"
              style={{ backgroundColor: colors.surface, borderColor: colors.border, borderWidth: 1 }}
            >
              <Text className="text-xs text-muted mb-1">ID da Conta</Text>
              <Text className="text-sm font-mono text-foreground">
                {user.id}
              </Text>
            </View>
            <View
              className="p-3 rounded-lg"
              style={{ backgroundColor: colors.surface, borderColor: colors.border, borderWidth: 1 }}
            >
              <Text className="text-xs text-muted mb-1">Membro desde</Text>
              <Text className="text-sm text-foreground">
                {user.createdAt.toLocaleDateString('pt-BR')}
              </Text>
            </View>
          </View>
        </View>
      </ScrollView>
    </ScreenContainer>
  );
}
