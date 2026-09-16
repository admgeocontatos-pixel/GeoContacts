import React, { createContext, useContext, useEffect, useState, useCallback, useRef } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Location from 'expo-location';
import { Platform } from 'react-native';
import type { LocationCoordinates } from '@/shared/types';
import { createTRPCClient } from '@/lib/trpc';

interface LocationContextType {
  currentLocation: LocationCoordinates | null;
  isLoading: boolean;
  error: string | null;
  permissionStatus: Location.PermissionStatus | 'unavailable' | null;
  updateLocation: (location: LocationCoordinates) => Promise<void>;
  refreshLocation: () => Promise<LocationCoordinates | null>;
  clearLocation: () => Promise<void>;
  trackingEnabled: boolean;
  setTrackingEnabled: (enabled: boolean) => Promise<void>;
}

const LocationContext = createContext<LocationContextType | undefined>(undefined);

function toCoordinates(location: Location.LocationObject): LocationCoordinates {
  return {
    latitude: location.coords.latitude,
    longitude: location.coords.longitude,
    accuracy: location.coords.accuracy ?? undefined,
  };
}

export function LocationProvider({ children }: { children: React.ReactNode }) {
  const [currentLocation, setCurrentLocation] = useState<LocationCoordinates | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [permissionStatus, setPermissionStatus] = useState<Location.PermissionStatus | 'unavailable' | null>(null);
  const [trackingEnabled, setTrackingEnabledState] = useState(true);
  const subscription = useRef<Location.LocationSubscription | null>(null);
  const apiClient = useRef<ReturnType<typeof createTRPCClient> | null>(null);

  const updateLocation = useCallback(async (location: LocationCoordinates) => {
    setCurrentLocation(location);
    await AsyncStorage.setItem('lastLocation', JSON.stringify(location));
    try {
      apiClient.current ??= createTRPCClient();
      await apiClient.current.location.update.mutate(location);
    } catch {
      // Usuários deslogados ainda podem usar o GPS local; a posição será publicada após o login.
    }
    setError(null);
  }, []);

  const refreshLocation = useCallback(async () => {
    if (Platform.OS === 'web') {
      setPermissionStatus('unavailable');
      setError('A localização GPS está disponível no Android e iOS.');
      return currentLocation;
    }
    const permission = await Location.requestForegroundPermissionsAsync();
    setPermissionStatus(permission.status);
    if (permission.status !== Location.PermissionStatus.GRANTED) {
      setError('Permissão de localização negada. Ative-a nas configurações do Android.');
      return null;
    }
    const location = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Balanced });
    const coordinates = toCoordinates(location);
    await updateLocation(coordinates);
    return coordinates;
  }, [currentLocation, updateLocation]);

  useEffect(() => {
    let active = true;
    const load = async () => {
      try {
        const [savedLocation, savedTracking] = await Promise.all([
          AsyncStorage.getItem('lastLocation'),
          AsyncStorage.getItem('locationTrackingEnabled'),
        ]);
        if (savedLocation && active) setCurrentLocation(JSON.parse(savedLocation));
        if (savedTracking !== null && active) setTrackingEnabledState(JSON.parse(savedTracking));
        if (active) await refreshLocation();
      } catch (err) {
        if (active) setError(err instanceof Error ? err.message : 'Não foi possível obter sua localização.');
      } finally {
        if (active) setIsLoading(false);
      }
    };
    void load();
    return () => { active = false; };
  }, [refreshLocation]);

  useEffect(() => {
    if (!trackingEnabled || Platform.OS === 'web' || permissionStatus !== Location.PermissionStatus.GRANTED) return;
    let active = true;
    Location.watchPositionAsync(
      { accuracy: Location.Accuracy.Balanced, distanceInterval: 100, timeInterval: 60_000 },
      (location) => { if (active) void updateLocation(toCoordinates(location)); },
    ).then((watch) => {
      if (active) subscription.current = watch;
      else watch.remove();
    }).catch((err) => setError(err instanceof Error ? err.message : 'Falha no rastreamento de localização.'));
    return () => { active = false; subscription.current?.remove(); subscription.current = null; };
  }, [permissionStatus, trackingEnabled, updateLocation]);

  const clearLocation = useCallback(async () => {
    setCurrentLocation(null);
    await AsyncStorage.removeItem('lastLocation');
    setError(null);
  }, []);

  const setTrackingEnabled = useCallback(async (enabled: boolean) => {
    setTrackingEnabledState(enabled);
    await AsyncStorage.setItem('locationTrackingEnabled', JSON.stringify(enabled));
    if (enabled) await refreshLocation();
    else subscription.current?.remove();
  }, [refreshLocation]);

  return (
    <LocationContext.Provider value={{ currentLocation, isLoading, error, permissionStatus, updateLocation, refreshLocation, clearLocation, trackingEnabled, setTrackingEnabled }}>
      {children}
    </LocationContext.Provider>
  );
}

export function useLocation() {
  const context = useContext(LocationContext);
  if (!context) throw new Error('useLocation must be used within LocationProvider');
  return context;
}

export default LocationProvider;
