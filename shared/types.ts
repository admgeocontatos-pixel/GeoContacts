// Shared types for GeoContacts application

export type UserSubscriptionPlan = 'free' | 'premium' | 'advertiser';

export interface User {
  id: string;
  email: string;
  name: string;
  avatar?: string;
  bio?: string;
  subscriptionPlan: UserSubscriptionPlan;
  latitude?: number;
  longitude?: number;
  locationUpdatedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

export interface Contact {
  id: string;
  userId: string;
  name: string;
  phone?: string;
  email?: string;
  instagramHandle?: string;
  avatar?: string;
  isFavorite: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface UserLocation {
  id: string;
  userId: string;
  latitude: number;
  longitude: number;
  accuracy?: number;
  altitude?: number;
  heading?: number;
  speed?: number;
  timestamp: Date;
}

export interface Advertisement {
  id: string;
  advertiserId: string;
  title: string;
  description: string;
  imageUrl?: string;
  latitude: number;
  longitude: number;
  radiusKm: number;
  plan: 'basic' | 'premium' | 'featured';
  impressions: number;
  clicks: number;
  createdAt: Date;
  updatedAt: Date;
  expiresAt?: Date;
}

export interface AdImpression {
  id: string;
  adId: string;
  userId: string;
  timestamp: Date;
}

export interface AdClick {
  id: string;
  adId: string;
  userId: string;
  timestamp: Date;
}

export interface Subscription {
  id: string;
  userId: string;
  plan: UserSubscriptionPlan;
  stripeCustomerId?: string;
  stripeSubscriptionId?: string;
  status: 'active' | 'canceled' | 'past_due';
  currentPeriodStart?: Date;
  currentPeriodEnd?: Date;
  canceledAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

export interface NearbyContact {
  contact: Contact;
  distance: number; // in kilometers
  user: User;
}

export interface LocationCoordinates {
  latitude: number;
  longitude: number;
  accuracy?: number;
}

export interface DistanceResult {
  distance: number; // in kilometers
  bearing?: number; // in degrees
}

export interface ContactSyncStatus {
  total: number;
  synced: number;
  failed: number;
  inProgress: boolean;
}

export interface AppSettings {
  language: 'pt-BR' | 'en';
  theme: 'light' | 'dark' | 'auto';
  locationTrackingEnabled: boolean;
  notificationsEnabled: boolean;
  distanceUnit: 'km' | 'mi';
  privacyLevel: 'public' | 'friends_only' | 'private';
}

export interface AuthResponse {
  token: string;
  user: User;
}

export interface PaginationParams {
  page: number;
  limit: number;
}

export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  limit: number;
  hasMore: boolean;
}
