import React from 'react';
import { View, Text, Pressable, Image } from 'react-native';
import { useColors } from '@/hooks/use-colors';
import type { Advertisement } from '@/shared/types';

interface AdCardProps {
  ad: Advertisement;
  onPress?: () => void;
  onViewDetails?: () => void;
}

export function AdCard({
  ad,
  onPress,
  onViewDetails,
}: AdCardProps) {
  const colors = useColors();
  const ctr = ad.impressions > 0 ? ((ad.clicks / ad.impressions) * 100).toFixed(2) : '0.00';
  const planColors = {
    basic: colors.muted,
    premium: colors.primary,
    featured: colors.warning,
  };

  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [
        {
          backgroundColor: colors.surface,
          borderColor: colors.border,
          borderWidth: 1,
          borderRadius: 12,
          overflow: 'hidden',
          marginVertical: 8,
          opacity: pressed ? 0.7 : 1,
        },
      ]}
    >
      {/* Ad Image */}
      {ad.imageUrl && (
        <Image
          source={{ uri: ad.imageUrl }}
          style={{
            width: '100%',
            height: 160,
            backgroundColor: colors.border,
          }}
        />
      )}

      {/* Ad Content */}
      <View className="p-3">
        {/* Header */}
        <View className="flex-row items-start justify-between gap-2 mb-2">
          <View className="flex-1">
            <Text
              className="text-base font-bold text-foreground"
              numberOfLines={2}
            >
              {ad.title}
            </Text>
          </View>
          <Text
            className="text-xs font-semibold px-2 py-1 rounded-full text-background"
            style={{ backgroundColor: planColors[ad.plan] }}
          >
            {ad.plan.toUpperCase()}
          </Text>
        </View>

        {/* Description */}
        <Text
          className="text-sm text-muted mb-3"
          numberOfLines={2}
        >
          {ad.description}
        </Text>

        {/* Metrics */}
        <View className="flex-row gap-3 mb-3 pb-3 border-t border-border pt-3">
          <View className="flex-1">
            <Text className="text-xs text-muted">Impressões</Text>
            <Text className="text-sm font-semibold text-foreground">
              {ad.impressions.toLocaleString()}
            </Text>
          </View>
          <View className="flex-1">
            <Text className="text-xs text-muted">Cliques</Text>
            <Text className="text-sm font-semibold text-foreground">
              {ad.clicks.toLocaleString()}
            </Text>
          </View>
          <View className="flex-1">
            <Text className="text-xs text-muted">CTR</Text>
            <Text className="text-sm font-semibold text-foreground">
              {ctr}%
            </Text>
          </View>
        </View>

        {/* View Details Button */}
        {onViewDetails && (
          <Pressable
            onPress={onViewDetails}
            style={({ pressed }) => [
              {
                backgroundColor: colors.primary,
                paddingVertical: 8,
                paddingHorizontal: 12,
                borderRadius: 8,
                opacity: pressed ? 0.8 : 1,
              },
            ]}
          >
            <Text className="text-sm font-semibold text-background text-center">
              Ver Detalhes
            </Text>
          </Pressable>
        )}
      </View>
    </Pressable>
  );
}
