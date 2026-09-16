import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import type { AppSettings } from '@/shared/types';

const DEFAULT_SETTINGS: AppSettings = {
  language: 'pt-BR',
  theme: 'auto',
  locationTrackingEnabled: true,
  notificationsEnabled: true,
  distanceUnit: 'km',
  privacyLevel: 'friends_only',
};

interface SettingsContextType {
  settings: AppSettings;
  isLoading: boolean;
  updateSettings: (updates: Partial<AppSettings>) => Promise<void>;
  resetSettings: () => Promise<void>;
}

const SettingsContext = createContext<SettingsContextType | undefined>(undefined);

export function SettingsProvider({ children }: { children: React.ReactNode }) {
  const [settings, setSettings] = useState<AppSettings>(DEFAULT_SETTINGS);
  const [isLoading, setIsLoading] = useState(true);

  // Load settings on mount
  useEffect(() => {
    const loadSettings = async () => {
      try {
        const savedSettings = await AsyncStorage.getItem('appSettings');
        if (savedSettings) {
          setSettings(JSON.parse(savedSettings));
        }
      } catch (err) {
        console.error('Failed to load app settings:', err);
      } finally {
        setIsLoading(false);
      }
    };

    loadSettings();
  }, []);

  const updateSettings = useCallback(async (updates: Partial<AppSettings>) => {
    try {
      const newSettings = { ...settings, ...updates };
      setSettings(newSettings);
      await AsyncStorage.setItem('appSettings', JSON.stringify(newSettings));
    } catch (err) {
      console.error('Failed to update app settings:', err);
      // Revert on error
      setSettings(settings);
    }
  }, [settings]);

  const resetSettings = useCallback(async () => {
    try {
      setSettings(DEFAULT_SETTINGS);
      await AsyncStorage.removeItem('appSettings');
    } catch (err) {
      console.error('Failed to reset app settings:', err);
    }
  }, []);

  const value: SettingsContextType = {
    settings,
    isLoading,
    updateSettings,
    resetSettings,
  };

  return (
    <SettingsContext.Provider value={value}>
      {children}
    </SettingsContext.Provider>
  );
}

export function useSettings() {
  const context = useContext(SettingsContext);
  if (!context) {
    throw new Error('useSettings must be used within SettingsProvider');
  }
  return context;
}
