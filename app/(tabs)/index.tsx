import React, { useCallback, useEffect, useState } from 'react';
import { ActivityIndicator, FlatList, Pressable, RefreshControl, Text, View } from 'react-native';
import { ScreenContainer } from '@/components/screen-container';
import { NearbyContactCard } from '@/components/nearby-contact-card';
import { useLocation } from '@/lib/location-context';
import { useSettings } from '@/lib/settings-context';
import { getTranslations } from '@/lib/i18n';
import { useColors } from '@/hooks/use-colors';
import { trpc } from '@/lib/trpc';
import type { NearbyContact } from '@/shared/types';

export default function HomeScreen() {
  const colors = useColors();
  const { currentLocation, refreshLocation } = useLocation();
  const { settings } = useSettings();
  const t = getTranslations(settings.language);
  const [selectedRadius, setSelectedRadius] = useState(5);
  const [nearbyContacts, setNearbyContacts] = useState<NearbyContact[]>([]);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const nearbyQuery = trpc.location.nearby.useQuery(
    { latitude: currentLocation?.latitude ?? 0, longitude: currentLocation?.longitude ?? 0, radiusKm: selectedRadius },
    { enabled: !!currentLocation, staleTime: 30_000 },
  );

  const loadNearby = useCallback(async () => {
    await refreshLocation();
    await nearbyQuery.refetch();
  }, [nearbyQuery, refreshLocation]);

  useEffect(() => {
    const users = nearbyQuery.data ?? [];
    setNearbyContacts(users.map((user) => ({
      distance: Number(user.distance ?? 0),
      contact: { id: String(user.id), userId: String(user.id), name: user.name || 'Usuário GeoContacts', email: user.email ?? undefined, isFavorite: false, createdAt: new Date(), updatedAt: new Date() },
      user: { id: String(user.id), name: user.name || 'Usuário GeoContacts', email: user.email || '', subscriptionPlan: 'free', latitude: user.latitude, longitude: user.longitude, locationUpdatedAt: new Date(user.lastSeen), createdAt: new Date(), updatedAt: new Date() },
    })));
  }, [nearbyQuery.data]);

  const handleRefresh = async () => {
    setIsRefreshing(true);
    try { await loadNearby(); } finally { setIsRefreshing(false); }
  };

  const radiusOptions = [1, 5, 10, 20];
  const isLoading = nearbyQuery.isLoading || nearbyQuery.isFetching;
  const errorMessage = nearbyQuery.error?.message;

  return (
    <ScreenContainer className="flex-1 bg-background">
      <FlatList
        data={nearbyContacts}
        keyExtractor={(item) => item.contact.id}
        renderItem={({ item }) => <NearbyContactCard contact={item} onPress={() => undefined} onAddFavorite={() => undefined} distanceUnit={settings.distanceUnit} />}
        ListHeaderComponent={<View className="px-4 py-4">
          <Text className="text-3xl font-bold text-foreground mb-2">{t.nearbyContacts}</Text>
          {currentLocation ? <Text className="text-sm text-muted mb-5">📍 {currentLocation.latitude.toFixed(5)}, {currentLocation.longitude.toFixed(5)}</Text> : <Pressable onPress={() => { void refreshLocation(); }}><Text className="text-sm text-warning mb-5">⚠️ Toque para permitir sua localização</Text></Pressable>}
          <Text className="text-sm font-semibold text-foreground mb-3">Raio de busca: {selectedRadius} km</Text>
          <View className="flex-row gap-2 mb-6">{radiusOptions.map((radius) => <Pressable key={radius} onPress={() => setSelectedRadius(radius)} style={{ paddingHorizontal: 12, paddingVertical: 8, borderRadius: 20, backgroundColor: selectedRadius === radius ? colors.primary : colors.surface, borderColor: colors.border, borderWidth: 1 }}><Text style={{ color: selectedRadius === radius ? colors.background : colors.foreground, fontWeight: '600' }}>{radius} km</Text></Pressable>)}</View>
          <View className="p-4 rounded-lg mb-5" style={{ backgroundColor: colors.surface, borderColor: colors.border, borderWidth: 1 }}><Text className="text-xs text-muted mb-1">Usuários logados próximos</Text><Text className="text-2xl font-bold text-foreground">{nearbyContacts.length}</Text></View>
          {errorMessage && <Text className="text-sm text-error mb-3">{errorMessage}</Text>}
          <Text className="text-sm font-semibold text-muted mb-3">{nearbyContacts.length} usuários encontrados</Text>
        </View>}
        ListEmptyComponent={!isLoading ? <View className="items-center justify-center py-12 px-4"><Text className="text-4xl mb-3">🔍</Text><Text className="text-lg font-semibold text-foreground mb-2">{currentLocation ? t.noContactsNearby : 'Ative a localização para começar'}</Text><Text className="text-sm text-muted text-center">Somente usuários autenticados que atualizaram a localização nos últimos 15 minutos aparecem aqui.</Text></View> : <View className="py-12 items-center"><ActivityIndicator color={colors.primary} /></View>}
        refreshControl={<RefreshControl refreshing={isRefreshing} onRefresh={handleRefresh} tintColor={colors.primary} />}
        showsVerticalScrollIndicator={false}
      />
    </ScreenContainer>
  );
}
