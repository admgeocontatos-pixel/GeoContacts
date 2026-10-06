import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { ActivityIndicator, Alert, Pressable, ScrollView, Share, Text, TextInput, View } from 'react-native';
import * as Contacts from 'expo-contacts';
import { router } from 'expo-router';
import { ScreenContainer } from '@/components/screen-container';
import { useSettings } from '@/lib/settings-context';
import { getTranslations } from '@/lib/i18n';
import { useColors } from '@/hooks/use-colors';
import { apiCall } from '@/lib/_core/api';
import type { Contact as AppContact } from '@/shared/types';

type MatchedUser = { id: number; name: string | null; email: string | null; phone: string | null; latitude: number | null; longitude: number | null; lastLocationUpdate: string | null };

function normalizePhone(value?: string | null) { return (value ?? '').replace(/[^0-9+]/g, ''); }
function normalizeContact(contact: Contacts.ExistingContact): AppContact { return { id: contact.id ?? `${contact.name}-${contact.phoneNumbers?.[0]?.number ?? ''}`, userId: '', name: contact.name || 'Contato sem nome', phone: contact.phoneNumbers?.[0]?.number, email: contact.emails?.[0]?.email, avatar: contact.image?.uri, isFavorite: false, createdAt: new Date(), updatedAt: new Date() }; }

export default function ContactsScreen() {
  const colors = useColors(); const { settings } = useSettings(); const t = getTranslations(settings.language);
  const [contacts, setContacts] = useState<AppContact[]>([]); const [matched, setMatched] = useState<MatchedUser[]>([]); const [searchQuery, setSearchQuery] = useState('');
  const [isLoading, setIsLoading] = useState(true); const [permission, setPermission] = useState<Contacts.PermissionStatus | null>(null); const [matchError, setMatchError] = useState<string | null>(null);

  const loadContacts = useCallback(async () => {
    setIsLoading(true); setMatchError(null);
    try {
      const current = await Contacts.getPermissionsAsync();
      const granted = current.status === Contacts.PermissionStatus.GRANTED ? current : await Contacts.requestPermissionsAsync();
      setPermission(granted.status);
      if (granted.status !== Contacts.PermissionStatus.GRANTED) { setContacts([]); setMatched([]); return; }
      const result = await Contacts.getContactsAsync({ fields: [Contacts.Fields.Name, Contacts.Fields.PhoneNumbers, Contacts.Fields.Emails, Contacts.Fields.Image], sort: Contacts.SortTypes.FirstName });
      const loaded = result.data.map(normalizeContact); setContacts(loaded);
      const match = await apiCall<{ users: MatchedUser[] }>('/api/contacts/match', { method: 'POST', body: JSON.stringify({ emails: loaded.map((c) => c.email).filter(Boolean), phones: loaded.map((c) => normalizePhone(c.phone)).filter(Boolean) }) });
      setMatched(match.users);
    } catch (error) { console.error('[Contacts] Failed:', error); setMatchError(error instanceof Error ? error.message : 'Não foi possível cruzar os contatos.'); }
    finally { setIsLoading(false); }
  }, []);
  useEffect(() => { void loadContacts(); }, [loadContacts]);

  const filtered = useMemo(() => contacts.filter((c) => { const q = searchQuery.toLowerCase(); return c.name.toLowerCase().includes(q) || c.email?.toLowerCase().includes(q) || c.phone?.includes(searchQuery); }), [contacts, searchQuery]);
  const registered = useMemo(() => filtered.filter((contact) => matched.some((user) => (contact.email && user.email?.toLowerCase() === contact.email.toLowerCase()) || (contact.phone && normalizePhone(user.phone) === normalizePhone(contact.phone)))), [filtered, matched]);
  const invited = useMemo(() => filtered.filter((contact) => !registered.some((item) => item.id === contact.id)), [filtered, registered]);
  const findMatch = (contact: AppContact) => matched.find((user) => (contact.email && user.email?.toLowerCase() === contact.email.toLowerCase()) || (contact.phone && normalizePhone(user.phone) === normalizePhone(contact.phone)));

  const invite = async (contact: AppContact) => { await Share.share({ title: 'Convite GeoContacts', message: `Olá ${contact.name}, encontre seus contatos próximos no GeoContacts: https://geocontacts-dn1j.onrender.com` }); };
  const registeredSection = registered.map((contact) => { const user = findMatch(contact); return <View key={contact.id} style={{ backgroundColor: colors.surface, borderColor: colors.border, borderWidth: 1, borderRadius: 12, padding: 12, marginBottom: 8 }}><Text className="text-base font-semibold text-foreground">{contact.name}</Text><Text className="text-xs text-muted mt-1">{contact.email || contact.phone}</Text><Pressable onPress={() => router.push('/(tabs)')} style={{ backgroundColor: colors.primary, borderRadius: 8, paddingVertical: 9, marginTop: 10 }}><Text className="text-center text-background font-semibold">Ver no mapa{user?.latitude ? ` · ${user.latitude.toFixed(3)}, ${user.longitude?.toFixed(3)}` : ''}</Text></Pressable></View>; });
  const inviteSection = invited.map((contact) => <View key={contact.id} style={{ backgroundColor: colors.surface, borderColor: colors.border, borderWidth: 1, borderRadius: 12, padding: 12, marginBottom: 8 }}><Text className="text-base font-semibold text-foreground">{contact.name}</Text><Text className="text-xs text-muted mt-1">{contact.email || contact.phone || 'Sem telefone ou e-mail'}</Text><Pressable onPress={() => void invite(contact)} style={{ borderColor: colors.primary, borderWidth: 1, borderRadius: 8, paddingVertical: 9, marginTop: 10 }}><Text className="text-center text-primary font-semibold">Enviar convite por SMS/WhatsApp</Text></Pressable></View>);

  return <ScreenContainer className="flex-1"><ScrollView contentContainerStyle={{ padding: 16 }} refreshControl={undefined}><Text className="text-3xl font-bold text-foreground mb-4">{t.syncContacts}</Text><TextInput placeholder={t.search} placeholderTextColor={colors.muted} value={searchQuery} onChangeText={setSearchQuery} className="border border-border rounded-xl px-4 py-3 mb-4 text-foreground" style={{ color: colors.foreground }} />{permission !== Contacts.PermissionStatus.GRANTED && !isLoading && <Text className="text-sm text-warning mb-3">Permita o acesso aos contatos para carregar a agenda do celular.</Text>}{isLoading ? <ActivityIndicator color={colors.primary} /> : <><Text className="text-sm text-muted mb-5">{contacts.length} contatos reais carregados do telefone.</Text>{matchError && <Text className="text-sm text-warning mb-4">Agenda carregada, mas o cruzamento ainda não foi possível: {matchError}</Text>}<Text className="text-xl font-bold text-foreground mb-3">Usuários no GeoContacts ({registered.length})</Text>{registeredSection.length ? registeredSection : <Text className="text-sm text-muted mb-6">Nenhum contato da agenda está cadastrado.</Text>}<Text className="text-xl font-bold text-foreground mt-4 mb-3">Convidar para o GeoContacts ({invited.length})</Text>{inviteSection.length ? inviteSection : <Text className="text-sm text-muted">Nenhum convite pendente.</Text>}<Pressable onPress={() => void loadContacts()} style={{ backgroundColor: colors.primary, borderRadius: 12, paddingVertical: 14, marginTop: 20 }}><Text className="text-center text-background font-bold">Atualizar agenda</Text></Pressable></>}</ScrollView></ScreenContainer>;
}
