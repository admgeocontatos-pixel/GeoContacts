import React from 'react';
import { View, Text, Pressable, Image } from 'react-native';
import { cn } from '@/lib/utils';
import { useColors } from '@/hooks/use-colors';
import { formatDistance } from '@/lib/location-utils';
import type { NearbyContact } from '@/shared/types';

interface NearbyContactCardProps {
  contact: NearbyContact;
  onPress?: () => void;
  onAddFavorite?: () => void;
  distanceUnit?: 'km' | 'mi';
}

export function NearbyContactCard({
  contact,
  onPress,
  onAddFavorite,
  distanceUnit = 'km',
}: NearbyContactCardProps) {
  const colors = useColors();
  const displayDistance = formatDistance(contact.distance, distanceUnit);

  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [
        {
          backgroundColor: colors.surface,
          borderColor: colors.border,
          borderWidth: 1,
          borderRadius: 12,
          padding: 12,
          marginVertical: 8,
          opacity: pressed ? 0.7 : 1,
        },
      ]}
    >
      <View className="flex-row items-center gap-3">
        {/* Avatar */}
        {contact.user.avatar ? (
          <Image
            source={{ uri: contact.user.avatar }}
            style={{
              width: 56,
              height: 56,
              borderRadius: 28,
              backgroundColor: colors.border,
            }}
          />
        ) : (
          <View
            style={{
              width: 56,
              height: 56,
              borderRadius: 28,
              backgroundColor: colors.primary,
              justifyContent: 'center',
              alignItems: 'center',
            }}
          >
            <Text className="text-lg font-bold text-background">
              {contact.user.name.charAt(0).toUpperCase()}
            </Text>
          </View>
        )}

        {/* Contact Info */}
        <View className="flex-1">
          <Text
            className="text-base font-semibold text-foreground"
            numberOfLines={1}
          >
            {contact.user.name}
          </Text>
          {contact.user.bio && (
            <Text
              className="text-sm text-muted mt-1"
              numberOfLines={1}
            >
              {contact.user.bio}
            </Text>
          )}
          <View className="flex-row items-center gap-2 mt-2">
            <Text
              className="text-xs font-semibold px-2 py-1 rounded-full"
              style={{
                backgroundColor: colors.primary,
                color: colors.background,
              }}
            >
              📍 {displayDistance}
            </Text>
          </View>
        </View>

        {/* Favorite Button */}
        {onAddFavorite && (
          <Pressable
            onPress={onAddFavorite}
            style={({ pressed }) => [
              {
                opacity: pressed ? 0.6 : 1,
              },
            ]}
          >
            <Text className="text-2xl">
              {contact.contact.isFavorite ? '❤️' : '🤍'}
            </Text>
          </Pressable>
        )}
      </View>
    </Pressable>
  );
}
