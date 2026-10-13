import React, { Component, useCallback, useEffect, useRef, useState } from 'react';
import { ActivityIndicator, FlatList, Pressable, RefreshControl, Text, View } from 'react-native';
import MapView, { Marker, type Region } from 'react-native-maps';
import { ScreenContainer } from '@/components/screen-container';
import { NearbyContactCard } from '@/components/nearby-contact-card';
import { useLocation } from '@/lib/location-context';
import { useSettings } from '@/lib/settings-context';
import { getTranslations } from '@/lib/i18n';
import { useColors } from '@/hooks/use-colors';
import { useAuth } from '@/hooks/use-auth';
import { trpc } from '@/lib/trpc';
import type { NearbyContact } from '@/shared/types';

type MapBoundaryProps = { children: React.ReactNode; fallback: React.ReactNode };
type MapBoundaryState = { hasError: boolean };

class MapBoundary extends Component<MapBoundaryProps, MapBoundaryState> {
  state: MapBoundaryState = { hasError: false };

  static getDerivedStateFromError(): MapBoundaryState {
    return { hasError: true };
  }

  componentDidCatch(error: unknown) {
    console.error('[MapView] Native map failed to initialize:', error);
  }

  render() {
    return this.state.hasError ? this.props.fallback : this.props.children;
  }
}

const fallbackRegion: Region = {
  latitude: -23.55052,
  longitude: -46.633308,
  latitudeDelta: 0.08,
  longitudeDelta: 0.08,
};

function isValidCoordinate(latitude: unknown, longitude: unknown): latitude is number {
  return typeof latitude === 'number' && Number.isFinite(latitude) && latitude >= -90 && latitude <= 90 &&
    typeof longitude === 'number' && Number.isFinite(longitude) && longitude >= -180 && longitude <= 180;
}

export default function HomeScreen() {
  const colors = useColors();
  const { currentLocation, refreshLocation } = useLocation();
  const { isAuthenticated, loading: authLoading, logout } = useAuth();
  const { settings } = useSettings();
  const t = getTranslations(settings.language);
  const [selectedRadius, setSelectedRadius] = useState(5);
  const [nearbyContacts, setNearbyContacts] = useState<NearbyContact[]>([]);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [view, setView] = useState<'list' | 'map'>('list');
  const [region, setRegion] = useState<Region>(fallbackRegion);
  const [mapLoading, setMapLoading] = useState(true);
  const [mapFailed, setMapFailed] = useState(false);
  const gpsRequested = useRef(false);

  const nearbyQuery = trpc.location.nearby.useQuery(
    { latitude: currentLocation?.latitude ?? 0, longitude: currentLocation?.longitude ?? 0, radiusKm: selectedRadius },
    { enabled: isAuthenticated && !authLoading && !!currentLocation, staleTime: 30_000 },
  );

  useEffect(() => {
    if (!isAuthenticated || authLoading) {
      gpsRequested.current = false;
      return;
    }
    if (!gpsRequested.current) {
      gpsRequested.current = true;
      void refreshLocation();
    }
  }, [isAuthenticated, authLoading, refreshLocation]);

  useEffect(() => {
    if (currentLocation && isValidCoordinate(currentLocation.latitude, currentLocation.longitude)) {
      setRegion({ latitude: currentLocation.latitude, longitude: currentLocation.longitude, latitudeDelta: 0.08, longitudeDelta: 0.08 });
    }
  }, [currentLocation]);

  const loadNearby = useCallback(async () => {
    await refreshLocation();
    await nearbyQuery.refetch();
  }, [nearbyQuery, refreshLocation]);

  useEffect(() => {
    const users = nearbyQuery.data ?? [];
    setNearbyContacts(users.filter((user) => isValidCoordinate(user.latitude, user.longitude)).map((user) => ({
      distance: Number(user.distance ?? 0),
      contact: { id: String(user.id), userId: String(user.id), name: user.name || 'Usuário GeoContacts', email: user.email ?? undefined, isFavorite: false, createdAt: new Date(), updatedAt: new Date() },
      user: { id: String(user.id), name: user.name || 'Usuário GeoContacts', email: user.email || '', subscriptionPlan: 'free', latitude: user.latitude, longitude: user.longitude, locationUpdatedAt: new Date(user.lastSeen), createdAt: new Date(), updatedAt: new Date() },
    })));
  }, [nearbyQuery.data]);

  useEffect(() => {
    if (/Please login|10001|UNAUTHORIZED/i.test(nearbyQuery.error?.message ?? '')) void logout();
  }, [nearbyQuery.error, logout]);

  const handleRefresh = async () => {
    setIsRefreshing(true);
    try { await loadNearby(); } finally { setIsRefreshing(false); }
  };

  const mapCoordinate = currentLocation && isValidCoordinate(currentLocation.latitude, currentLocation.longitude)
    ? { latitude: currentLocation.latitude, longitude: currentLocation.longitude }
    : { latitude: fallbackRegion.latitude, longitude: fallbackRegion.longitude };
  const markers = nearbyContacts.filter((item) => isValidCoordinate(Number(item.user.latitude), Number(item.user.longitude)));
  const mapFallback = (
    <View style={{ height: 260, borderRadius: 16, backgroundColor: colors.surface, alignItems: 'center', justifyContent: 'center', padding: 20 }}>
      <Text className="text-base font-semibold text-foreground text-center">Mapa indisponível neste dispositivo</Text>
      <Text className="text-sm text-muted text-center mt-2">A lista de contatos continua disponível. Verifique o GPS ou tente novamente.</Text>
    </View>
  );
  const map = mapFailed ? mapFallback : (
    <MapBoundary fallback={mapFallback}>
      <View style={{ height: 360, width: '100%', borderRadius: 16, overflow: 'hidden', backgroundColor: colors.surface }}>
        {mapLoading && <View style={{ position: 'absolute', zIndex: 2, top: 0, right: 0, bottom: 0, left: 0, alignItems: 'center', justifyContent: 'center' }}><ActivityIndicator color={colors.primary} size="large" /><Text className="text-sm text-muted mt-2">A carregar o mapa…</Text></View>}
        <MapView
          style={{ flex: 1 }}
          region={region}
          onMapReady={() => setMapLoading(false)}
          onRegionChangeComplete={(nextRegion) => {
            if (isValidCoordinate(nextRegion.latitude, nextRegion.longitude)) setRegion(nextRegion);
          }}
          showsUserLocation={Boolean(currentLocation)}
          loadingEnabled
          onLayout={() => setMapLoading((loading) => loading)}
        >
          <Marker coordinate={mapCoordinate} title="Minha localização" pinColor={colors.primary} />
          {markers.map((item) => <Marker key={item.contact.id} coordinate={{ latitude: Number(item.user.latitude), longitude: Number(item.user.longitude) }} title={item.user.name} description={`${Number(item.distance).toFixed(1)} km`} />)}
        </MapView>
      </View>
    </MapBoundary>
  );

  const radiusOptions = [1, 5, 10, 20];
  const isLoading = nearbyQuery.isLoading || nearbyQuery.isFetching;
  const errorMessage = nearbyQuery.error && !/Please login|10001|UNAUTHORIZED/i.test(nearbyQuery.error.message) ? 'Não foi possível consultar usuários próximos. Tente atualizar novamente.' : null;

  return (
    <ScreenContainer className="flex-1 bg-background">
      <FlatList
        data={view === 'list' ? nearbyContacts : []}
        keyExtractor={(item) => item.contact.id}
        renderItem={({ item }) => <NearbyContactCard contact={item} onPress={() => setView('map')} onAddFavorite={() => undefined} distanceUnit={settings.distanceUnit} />}
        ListHeaderComponent={<View className="px-4 py-4">
          <Text className="text-3xl font-bold text-foreground mb-2">{t.nearbyContacts}</Text>
          {currentLocation && isValidCoordinate(currentLocation.latitude, currentLocation.longitude) ? <Text className="text-sm text-muted mb-4">📍 {currentLocation.latitude.toFixed(5)}, {currentLocation.longitude.toFixed(5)}</Text> : <Pressable onPress={() => void refreshLocation()}><Text className="text-sm text-warning mb-4">⚠️ Toque para permitir sua localização</Text></Pressable>}
          <View className="flex-row gap-2 mb-4"><Pressable onPress={() => setView('list')} style={{ flex: 1, paddingVertical: 10, borderRadius: 10, backgroundColor: view === 'list' ? colors.primary : colors.surface }}><Text style={{ color: view === 'list' ? colors.background : colors.foreground, textAlign: 'center', fontWeight: '700' }}>Lista</Text></Pressable><Pressable onPress={() => { setMapLoading(true); setMapFailed(false); setView('map'); }} style={{ flex: 1, paddingVertical: 10, borderRadius: 10, backgroundColor: view === 'map' ? colors.primary : colors.surface }}><Text style={{ color: view === 'map' ? colors.background : colors.foreground, textAlign: 'center', fontWeight: '700' }}>Mapa</Text></Pressable></View>
          {view === 'map' && <View className="mb-5">{map}</View>}
          <Text className="text-sm font-semibold text-foreground mb-3">Raio de busca: {selectedRadius} km</Text>
          <View className="flex-row gap-2 mb-5">{radiusOptions.map((radius) => <Pressable key={radius} onPress={() => setSelectedRadius(radius)} style={{ paddingHorizontal: 12, paddingVertical: 8, borderRadius: 20, backgroundColor: selectedRadius === radius ? colors.primary : colors.surface, borderColor: colors.border, borderWidth: 1 }}><Text style={{ color: selectedRadius === radius ? colors.background : colors.foreground, fontWeight: '600' }}>{radius} km</Text></Pressable>)}</View>
          {errorMessage && <Text className="text-sm text-error mb-3">{errorMessage}</Text>}
          <Text className="text-sm font-semibold text-muted mb-3">{nearbyContacts.length} usuários autenticados encontrados</Text>
        </View>}
        ListEmptyComponent={view === 'list' ? (!isLoading ? <View className="items-center justify-center py-12 px-4"><Text className="text-4xl mb-3">🔍</Text><Text className="text-lg font-semibold text-foreground mb-2">{currentLocation ? t.noContactsNearby : 'Ative a localização para começar'}</Text><Text className="text-sm text-muted text-center">Somente usuários que atualizaram o GPS nos últimos 15 minutos aparecem aqui.</Text></View> : <View className="py-12 items-center"><ActivityIndicator color={colors.primary} /></View>) : null}
        refreshControl={<RefreshControl refreshing={isRefreshing} onRefresh={handleRefresh} tintColor={colors.primary} />}
        showsVerticalScrollIndicator={false}
      />
    </ScreenContainer>
  );
}
