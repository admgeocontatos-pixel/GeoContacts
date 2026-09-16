import React, { useState, useCallback } from 'react';
import { ScrollView, Text, View, Pressable, FlatList } from 'react-native';
import { ScreenContainer } from '@/components/screen-container';
import { AdCard } from '@/components/ad-card';
import { useSettings } from '@/lib/settings-context';
import { getTranslations } from '@/lib/i18n';
import { useColors } from '@/hooks/use-colors';
import type { Advertisement } from '@/shared/types';

// Mock ads data
const MOCK_ADS: Advertisement[] = [
  {
    id: '1',
    advertiserId: 'adv1',
    title: 'Café Premium - Desconto 20%',
    description: 'Venha conhecer nosso novo café premium com 20% de desconto para os primeiros clientes',
    imageUrl: 'https://images.unsplash.com/photo-1495521821757-a1efb6729352?w=400&h=300&fit=crop',
    latitude: -23.5505,
    longitude: -46.6333,
    radiusKm: 2,
    plan: 'premium',
    impressions: 1250,
    clicks: 87,
    createdAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000),
    updatedAt: new Date(),
  },
  {
    id: '2',
    advertiserId: 'adv2',
    title: 'Academia FitLife - Promoção',
    description: 'Matricule-se agora e ganhe 3 meses grátis em qualquer plano',
    imageUrl: 'https://images.unsplash.com/photo-1534438327276-14e5300c3a48?w=400&h=300&fit=crop',
    latitude: -23.5505,
    longitude: -46.6333,
    radiusKm: 5,
    plan: 'featured',
    impressions: 3420,
    clicks: 342,
    createdAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000),
    updatedAt: new Date(),
  },
  {
    id: '3',
    advertiserId: 'adv3',
    title: 'Restaurante Italiano',
    description: 'Comida autêntica italiana. Delivery disponível',
    imageUrl: 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=400&h=300&fit=crop',
    latitude: -23.5505,
    longitude: -46.6333,
    radiusKm: 1.5,
    plan: 'basic',
    impressions: 567,
    clicks: 23,
    createdAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000),
    updatedAt: new Date(),
  },
];

type SortOption = 'recent' | 'impressions' | 'clicks' | 'ctr';

export default function AdsScreen() {
  const colors = useColors();
  const { settings } = useSettings();
  const t = getTranslations(settings.language);

  const [ads, setAds] = useState<Advertisement[]>(MOCK_ADS);
  const [sortBy, setSortBy] = useState<SortOption>('recent');
  const [selectedPlan, setSelectedPlan] = useState<'all' | 'basic' | 'premium' | 'featured'>('all');

  // Filter and sort ads
  const filteredAds = ads
    .filter(ad => selectedPlan === 'all' || ad.plan === selectedPlan)
    .sort((a, b) => {
      switch (sortBy) {
        case 'impressions':
          return b.impressions - a.impressions;
        case 'clicks':
          return b.clicks - a.clicks;
        case 'ctr':
          const ctrA = a.impressions > 0 ? a.clicks / a.impressions : 0;
          const ctrB = b.impressions > 0 ? b.clicks / b.impressions : 0;
          return ctrB - ctrA;
        case 'recent':
        default:
          return b.createdAt.getTime() - a.createdAt.getTime();
      }
    });

  const handleCreateAd = () => {
    console.log('Create new ad');
    // Navigate to ad creation screen
  };

  const handleViewDetails = (adId: string) => {
    console.log('View ad details:', adId);
    // Navigate to ad details screen
  };

  const planColors = {
    all: colors.foreground,
    basic: colors.muted,
    premium: colors.primary,
    featured: colors.warning,
  };

  const renderAdItem = ({ item }: { item: Advertisement }) => (
    <AdCard
      ad={item}
      onViewDetails={() => handleViewDetails(item.id)}
    />
  );

  return (
    <ScreenContainer className="flex-1">
      <FlatList
        data={filteredAds}
        keyExtractor={(item) => item.id}
        renderItem={renderAdItem}
        ListHeaderComponent={
          <View className="px-4 py-4">
            {/* Header */}
            <View className="flex-row items-center justify-between mb-6">
              <Text className="text-3xl font-bold text-foreground">
                {t.advertisements}
              </Text>
              <Pressable
                onPress={handleCreateAd}
                style={({ pressed }) => [
                  {
                    backgroundColor: colors.primary,
                    width: 44,
                    height: 44,
                    borderRadius: 22,
                    justifyContent: 'center',
                    alignItems: 'center',
                    opacity: pressed ? 0.8 : 1,
                  },
                ]}
              >
                <Text className="text-2xl">+</Text>
              </Pressable>
            </View>

            {/* Plan Filter */}
            <View className="mb-4">
              <Text className="text-sm font-semibold text-muted mb-2">
                Filtrar por Plano
              </Text>
              <View className="flex-row gap-2 flex-wrap">
                {(['all', 'basic', 'premium', 'featured'] as const).map((plan) => (
                  <Pressable
                    key={plan}
                    onPress={() => setSelectedPlan(plan)}
                    style={({ pressed }) => [
                      {
                        paddingHorizontal: 12,
                        paddingVertical: 8,
                        borderRadius: 20,
                        backgroundColor:
                          selectedPlan === plan ? planColors[plan] : colors.surface,
                        borderColor: planColors[plan],
                        borderWidth: 1,
                        opacity: pressed ? 0.8 : 1,
                      },
                    ]}
                  >
                    <Text
                      className={`text-xs font-semibold ${
                        selectedPlan === plan
                          ? 'text-background'
                          : 'text-foreground'
                      }`}
                    >
                      {plan === 'all' ? 'Todos' : plan.toUpperCase()}
                    </Text>
                  </Pressable>
                ))}
              </View>
            </View>

            {/* Sort Options */}
            <View className="mb-6">
              <Text className="text-sm font-semibold text-muted mb-2">
                Ordenar por
              </Text>
              <View className="flex-row gap-2 flex-wrap">
                {(['recent', 'impressions', 'clicks', 'ctr'] as const).map((option) => (
                  <Pressable
                    key={option}
                    onPress={() => setSortBy(option)}
                    style={({ pressed }) => [
                      {
                        paddingHorizontal: 12,
                        paddingVertical: 8,
                        borderRadius: 20,
                        backgroundColor:
                          sortBy === option ? colors.primary : colors.surface,
                        borderColor: colors.border,
                        borderWidth: 1,
                        opacity: pressed ? 0.8 : 1,
                      },
                    ]}
                  >
                    <Text
                      className={`text-xs font-semibold ${
                        sortBy === option
                          ? 'text-background'
                          : 'text-foreground'
                      }`}
                    >
                      {option === 'recent' && 'Recentes'}
                      {option === 'impressions' && 'Impressões'}
                      {option === 'clicks' && 'Cliques'}
                      {option === 'ctr' && 'CTR'}
                    </Text>
                  </Pressable>
                ))}
              </View>
            </View>

            {/* Stats */}
            <View className="flex-row gap-3 mb-6">
              <View
                className="flex-1 p-3 rounded-lg"
                style={{ backgroundColor: colors.surface, borderColor: colors.border, borderWidth: 1 }}
              >
                <Text className="text-xs text-muted mb-1">Total de Anúncios</Text>
                <Text className="text-2xl font-bold text-foreground">
                  {filteredAds.length}
                </Text>
              </View>
              <View
                className="flex-1 p-3 rounded-lg"
                style={{ backgroundColor: colors.surface, borderColor: colors.border, borderWidth: 1 }}
              >
                <Text className="text-xs text-muted mb-1">Total de Impressões</Text>
                <Text className="text-2xl font-bold text-foreground">
                  {filteredAds.reduce((sum, ad) => sum + ad.impressions, 0).toLocaleString()}
                </Text>
              </View>
              <View
                className="flex-1 p-3 rounded-lg"
                style={{ backgroundColor: colors.surface, borderColor: colors.border, borderWidth: 1 }}
              >
                <Text className="text-xs text-muted mb-1">Total de Cliques</Text>
                <Text className="text-2xl font-bold text-foreground">
                  {filteredAds.reduce((sum, ad) => sum + ad.clicks, 0).toLocaleString()}
                </Text>
              </View>
            </View>

            <Text className="text-sm font-semibold text-muted mb-3">
              {filteredAds.length} {filteredAds.length === 1 ? 'anúncio' : 'anúncios'}
            </Text>
          </View>
        }
        ListEmptyComponent={
          <View className="items-center justify-center py-12 px-4">
            <Text className="text-4xl mb-3">📢</Text>
            <Text className="text-lg font-semibold text-foreground mb-2">
              Nenhum anúncio encontrado
            </Text>
            <Text className="text-sm text-muted text-center">
              Crie seu primeiro anúncio para começar
            </Text>
            <Pressable
              onPress={handleCreateAd}
              style={({ pressed }) => [
                {
                  marginTop: 16,
                  backgroundColor: colors.primary,
                  paddingHorizontal: 24,
                  paddingVertical: 12,
                  borderRadius: 8,
                  opacity: pressed ? 0.8 : 1,
                },
              ]}
            >
              <Text className="text-sm font-semibold text-background">
                {t.createAd}
              </Text>
            </Pressable>
          </View>
        }
        scrollEnabled={true}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingHorizontal: 0 }}
      />
    </ScreenContainer>
  );
}
