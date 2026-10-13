import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { ActivityIndicator, Pressable, ScrollView, Share, Text, TextInput, View } from 'react-native';
import * as Contacts from 'expo-contacts';
import { router } from 'expo-router';
import { ScreenContainer } from '@/components/screen-container';
import { useSettings } from '@/lib/settings-context';
import { getTranslations } from '@/lib/i18n';
import { useColors } from '@/hooks/use-colors';
import { apiCall } from '@/lib/_core/api';
import type { Contact as AppContact } from '@/shared/types';

type MatchedUser = { id: number; name: string | null; email: string | null; phone: string | null; latitude: number | null; longitude: number | null; lastLocationUpdate: string | null };
const PAGE_SIZE = 200;

function normalizePhone(value?: string | null) { return (value ?? '').replace(/[^0-9+]/g, ''); }
function normalizeContact(contact?: Contacts.ExistingContact | null): AppContact | null {
  if (!contact) return null;
  const phone = contact.phoneNumbers?.find((item) => typeof item?.number === 'string' && item.number.trim())?.number;
  const email = contact.emails?.find((item) => typeof item?.email === 'string' && item.email.trim())?.email;
  const name = typeof contact.name === 'string' && contact.name.trim() ? contact.name.trim() : 'Contato sem nome';
  return { id: contact.id || `${name}-${phone ?? email ?? Math.random().toString(36).slice(2)}`, userId: '', name, phone, email, avatar: contact.image?.uri, isFavorite: false, createdAt: new Date(), updatedAt: new Date() };
}

export default function ContactsScreen() {
  const colors = useColors();
  const { settings } = useSettings();
  const t = getTranslations(settings.language);
  const [contacts, setContacts] = useState<AppContact[]>([]);
  const [matched, setMatched] = useState<MatchedUser[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [permission, setPermission] = useState<Contacts.PermissionStatus | null>(null);
  const [matchError, setMatchError] = useState<string | null>(null);
  const [hasMore, setHasMore] = useState(false);
  const [offset, setOffset] = useState(0);

  const loadContacts = useCallback(async (nextOffset = 0) => {
    if (nextOffset === 0) setIsLoading(true); else setIsLoadingMore(true);
    setMatchError(null);
    try {
      const current = await Contacts.getPermissionsAsync();
      const granted = current.status === Contacts.PermissionStatus.GRANTED ? current : await Contacts.requestPermissionsAsync();
      setPermission(granted.status);
      if (granted.status !== Contacts.PermissionStatus.GRANTED) { setContacts([]); setMatched([]); setHasMore(false); return; }
      const result = await Contacts.getContactsAsync({ fields: [Contacts.Fields.Name, Contacts.Fields.PhoneNumbers, Contacts.Fields.Emails, Contacts.Fields.Image], sort: Contacts.SortTypes.FirstName, pageSize: PAGE_SIZE, pageOffset: nextOffset });
      const loaded = result.data.map(normalizeContact).filter((contact): contact is AppContact => Boolean(contact));
      const merged = nextOffset === 0 ? loaded : [...contacts, ...loaded];
      setContacts(merged);
      setOffset(nextOffset + loaded.length);
      setHasMore(loaded.length === PAGE_SIZE);
      const match = await apiCall<{ users: MatchedUser[] }>('/api/contacts/match', { method: 'POST', body: JSON.stringify({ emails: merged.map((c) => c.email).filter((value): value is string => Boolean(value)), phones: merged.map((c) => normalizePhone(c.phone)).filter(Boolean) }) });
      setMatched(match.users ?? []);
    } catch (error) {
      console.error('[Contacts] Failed:', error);
      setMatchError(error instanceof Error ? error.message : 'Não foi possível cruzar os contatos.');
    } finally { setIsLoading(false); setIsLoadingMore(false); }
  }, [contacts]);

  useEffect(() => { void loadContacts(0); }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const filtered = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    if (!q) return contacts;
    return contacts.filter((contact) => contact.name.toLowerCase().includes(q) || contact.email?.toLowerCase().includes(q) || contact.phone?.includes(searchQuery));
  }, [contacts, searchQuery]);
  const registered = useMemo(() => filtered.filter((contact) => matched.some((user) => (contact.email && user.email?.toLowerCase() === contact.email.toLowerCase()) || (contact.phone && normalizePhone(user.phone) === normalizePhone(contact.phone)))), [filtered, matched]);
  const invited = useMemo(() => filtered.filter((contact) => !registered.some((item) => item.id === contact.id)), [filtered, registered]);
  const findMatch = (contact: AppContact) => matched.find((user) => (contact.email && user.email?.toLowerCase() === contact.email.toLowerCase()) || (contact.phone && normalizePhone(user.phone) === normalizePhone(contact.phone)));
  const invite = async (contact: AppContact) => { await Share.share({ title: 'Convite GeoContacts', message: `Olá ${contact.name}, encontre seus contatos próximos no GeoContacts: https://geocontacts-dn1j.onrender.com` }); };

  return <ScreenContainer className="flex-1"><ScrollView contentContainerStyle={{ padding: 16 }}><Text className="text-3xl font-bold text-foreground mb-4">{t.syncContacts}</Text><TextInput placeholder={t.search} placeholderTextColor={colors.muted} value={searchQuery} onChangeText={setSearchQuery} className="border border-border rounded-xl px-4 py-3 mb-4 text-foreground" style={{ color: colors.foreground }} />{permission !== Contacts.PermissionStatus.GRANTED && !isLoading && <Text className="text-sm text-warning mb-3">Permita o acesso aos contatos para carregar a agenda do celular.</Text>}{isLoading ? <ActivityIndicator color={colors.primary} /> : <><Text className="text-sm text-muted mb-5">{contacts.length} contatos carregados nesta página.</Text>{matchError && <Text className="text-sm text-warning mb-4">Agenda carregada, mas o cruzamento ainda não foi possível. Tente novamente.</Text>}<Text className="text-xl font-bold text-foreground mb-3">Usuários no GeoContacts ({registered.length})</Text>{registered.length ? registered.map((contact) => { const user = findMatch(contact); const coords = typeof user?.latitude === 'number' && typeof user?.longitude === 'number' ? ` · ${user.latitude.toFixed(3)}, ${user.longitude.toFixed(3)}` : ''; return <View key={contact.id} style={{ backgroundColor: colors.surface, borderColor: colors.border, borderWidth: 1, borderRadius: 12, padding: 12, marginBottom: 8 }}><Text className="text-base font-semibold text-foreground">{contact.name}</Text><Text className="text-xs text-muted mt-1">{contact.email || contact.phone || 'Sem identificador'} </Text><Pressable onPress={() => router.push('/(tabs)')} style={{ backgroundColor: colors.primary, borderRadius: 8, paddingVertical: 9, marginTop: 10 }}><Text className="text-center text-background font-semibold">Ver no mapa{coords}</Text></Pressable></View>; }) : <Text className="text-sm text-muted mb-6">Nenhum contato da agenda está cadastrado.</Text>}<Text className="text-xl font-bold text-foreground mt-4 mb-3">Convidar para o GeoContacts ({invited.length})</Text>{invited.map((contact) => <View key={contact.id} style={{ backgroundColor: colors.surface, borderColor: colors.border, borderWidth: 1, borderRadius: 12, padding: 12, marginBottom: 8 }}><Text className="text-base font-semibold text-foreground">{contact.name}</Text><Text className="text-xs text-muted mt-1">{contact.email || contact.phone || 'Sem telefone ou e-mail'}</Text><Pressable onPress={() => void invite(contact)} style={{ borderColor: colors.primary, borderWidth: 1, borderRadius: 8, paddingVertical: 9, marginTop: 10 }}><Text className="text-center text-primary font-semibold">Enviar convite por SMS/WhatsApp</Text></Pressable></View>)}{hasMore && <Pressable disabled={isLoadingMore} onPress={() => void loadContacts(offset)} style={{ backgroundColor: colors.surface, borderColor: colors.primary, borderWidth: 1, borderRadius: 12, paddingVertical: 14, marginTop: 12 }}>{isLoadingMore ? <ActivityIndicator color={colors.primary} /> : <Text className="text-center text-primary font-bold">Carregar mais contatos</Text>}</Pressable>}<Pressable onPress={() => void loadContacts(0)} style={{ backgroundColor: colors.primary, borderRadius: 12, paddingVertical: 14, marginTop: 20 }}><Text className="text-center text-background font-bold">Atualizar agenda</Text></Pressable></>}</ScrollView></ScreenContainer>;
}
