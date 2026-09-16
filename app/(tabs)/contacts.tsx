import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { ActivityIndicator, Alert, FlatList, Pressable, Text, TextInput, View } from 'react-native';
import * as Contacts from 'expo-contacts';
import { ScreenContainer } from '@/components/screen-container';
import { useSettings } from '@/lib/settings-context';
import { getTranslations } from '@/lib/i18n';
import { useColors } from '@/hooks/use-colors';
import type { Contact as AppContact } from '@/shared/types';

function normalizeContact(contact: Contacts.ExistingContact): AppContact {
  return {
    id: contact.id ?? `${contact.name}-${contact.phoneNumbers?.[0]?.number ?? ''}`,
    userId: '',
    name: contact.name || 'Contato sem nome',
    phone: contact.phoneNumbers?.[0]?.number,
    email: contact.emails?.[0]?.email,
    avatar: contact.image?.uri,
    isFavorite: false,
    createdAt: new Date(),
    updatedAt: new Date(),
  };
}

export default function ContactsScreen() {
  const colors = useColors();
  const { settings } = useSettings();
  const t = getTranslations(settings.language);
  const [contacts, setContacts] = useState<AppContact[]>([]);
  const [selectedContacts, setSelectedContacts] = useState<Set<string>>(new Set());
  const [searchQuery, setSearchQuery] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [isSyncing, setIsSyncing] = useState(false);
  const [syncStatus, setSyncStatus] = useState<'idle' | 'syncing' | 'success' | 'error'>('idle');
  const [permission, setPermission] = useState<Contacts.PermissionStatus | null>(null);

  const loadContacts = useCallback(async () => {
    setIsLoading(true);
    try {
      const current = await Contacts.getPermissionsAsync();
      const granted = current.status === Contacts.PermissionStatus.GRANTED
        ? current
        : await Contacts.requestPermissionsAsync();
      setPermission(granted.status);
      if (granted.status !== Contacts.PermissionStatus.GRANTED) {
        setContacts([]);
        return;
      }
      const result = await Contacts.getContactsAsync({
        fields: [Contacts.Fields.Name, Contacts.Fields.PhoneNumbers, Contacts.Fields.Emails, Contacts.Fields.Image],
        sort: Contacts.SortTypes.FirstName,
      });
      setContacts(result.data.map(normalizeContact));
    } catch (error) {
      console.error('[Contacts] Failed to load contacts:', error);
      Alert.alert('Contatos', 'Não foi possível acessar a agenda do celular.');
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => { void loadContacts(); }, [loadContacts]);

  const filteredContacts = useMemo(() => contacts.filter((contact) => {
    const query = searchQuery.toLowerCase();
    return contact.name.toLowerCase().includes(query) || contact.email?.toLowerCase().includes(query) || contact.phone?.includes(searchQuery);
  }), [contacts, searchQuery]);

  const toggleContact = (id: string) => {
    setSelectedContacts((previous) => {
      const next = new Set(previous);
      if (next.has(id)) next.delete(id); else next.add(id);
      return next;
    });
  };

  const selectAll = () => setSelectedContacts((previous) => previous.size === filteredContacts.length ? new Set() : new Set(filteredContacts.map((contact) => contact.id)));

  const syncSelected = async () => {
    if (!selectedContacts.size) {
      Alert.alert('Sincronização', 'Selecione pelo menos um contato.');
      return;
    }
    setIsSyncing(true);
    setSyncStatus('syncing');
    try {
      // O envio para a API será conectado quando as tabelas de contatos forem ativadas no backend.
      await new Promise((resolve) => setTimeout(resolve, 500));
      setSyncStatus('success');
      setSelectedContacts(new Set());
    } catch {
      setSyncStatus('error');
    } finally {
      setIsSyncing(false);
    }
  };

  const renderContact = ({ item }: { item: AppContact }) => {
    const selected = selectedContacts.has(item.id);
    return (
      <Pressable onPress={() => toggleContact(item.id)} style={{ backgroundColor: selected ? `${colors.primary}20` : colors.surface, borderColor: selected ? colors.primary : colors.border, borderWidth: 1, borderRadius: 12, padding: 12, marginVertical: 6, flexDirection: 'row', alignItems: 'center', gap: 12 }}>
        <View style={{ width: 24, height: 24, borderRadius: 6, borderWidth: 2, borderColor: selected ? colors.primary : colors.border, backgroundColor: selected ? colors.primary : 'transparent', justifyContent: 'center', alignItems: 'center' }}>
          {selected && <Text style={{ color: colors.background, fontWeight: '700' }}>✓</Text>}
        </View>
        <View className="flex-1">
          <Text className="text-base font-semibold text-foreground">{item.name}</Text>
          {!!item.email && <Text className="text-xs text-muted mt-1">{item.email}</Text>}
          {!!item.phone && <Text className="text-xs text-muted">{item.phone}</Text>}
        </View>
      </Pressable>
    );
  };

  return (
    <ScreenContainer className="flex-1">
      <FlatList
        data={filteredContacts}
        keyExtractor={(item) => item.id}
        renderItem={renderContact}
        refreshing={isLoading}
        onRefresh={loadContacts}
        ListHeaderComponent={<View className="px-4 py-4">
          <Text className="text-3xl font-bold text-foreground mb-4">{t.syncContacts}</Text>
          <View className="flex-row items-center px-3 py-2 rounded-lg mb-4" style={{ backgroundColor: colors.surface, borderColor: colors.border, borderWidth: 1 }}>
            <Text className="text-lg mr-2">🔍</Text>
            <TextInput placeholder={t.search} placeholderTextColor={colors.muted} value={searchQuery} onChangeText={setSearchQuery} className="flex-1 text-foreground" style={{ color: colors.foreground }} />
          </View>
          {permission !== Contacts.PermissionStatus.GRANTED && !isLoading && <Text className="text-sm text-warning mb-3">Permita o acesso aos contatos para carregar a agenda do celular.</Text>}
          <View className="flex-row items-center justify-between mb-4">
            <Text className="text-sm font-semibold text-muted">{selectedContacts.size} de {filteredContacts.length} selecionados</Text>
            <Pressable onPress={selectAll} style={{ paddingHorizontal: 12, paddingVertical: 6, borderRadius: 6, backgroundColor: colors.primary }}><Text className="text-xs font-semibold text-background">{selectedContacts.size === filteredContacts.length ? 'Desselecionar' : 'Selecionar tudo'}</Text></Pressable>
          </View>
          {syncStatus !== 'idle' && <Text className="text-sm font-semibold text-foreground mb-3">{syncStatus === 'syncing' ? 'Sincronizando...' : syncStatus === 'success' ? 'Contatos selecionados prontos para sincronização.' : t.error}</Text>}
          <Text className="text-sm font-semibold text-muted mb-3">{contacts.length} contatos encontrados no celular</Text>
        </View>}
        ListEmptyComponent={<View className="items-center justify-center py-12 px-4">{isLoading ? <ActivityIndicator color={colors.primary} /> : <><Text className="text-4xl mb-3">📭</Text><Text className="text-lg font-semibold text-foreground mb-2">Nenhum contato encontrado</Text><Text className="text-sm text-muted text-center">Verifique a permissão de contatos e tente novamente.</Text></>}</View>}
        showsVerticalScrollIndicator={false}
      />
      {selectedContacts.size > 0 && <View className="px-4 py-4 border-t" style={{ borderTopColor: colors.border }}><Pressable onPress={syncSelected} disabled={isSyncing} style={{ backgroundColor: isSyncing ? colors.muted : colors.primary, paddingVertical: 14, borderRadius: 12 }}><Text className="text-base font-bold text-background text-center">{isSyncing ? 'Sincronizando...' : `Sincronizar (${selectedContacts.size})`}</Text></Pressable></View>}
    </ScreenContainer>
  );
}
