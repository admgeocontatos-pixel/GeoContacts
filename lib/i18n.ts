/**
 * Internationalization (i18n) for GeoContacts
 * Supports Portuguese (PT-BR) and English (EN)
 */

type Language = 'pt-BR' | 'en';

interface TranslationStrings {
  // Navigation & Tabs
  home: string;
  contacts: string;
  ads: string;
  profile: string;
  settings: string;

  // Home Screen
  nearbyContacts: string;
  noContactsNearby: string;
  discoverNearby: string;
  refreshing: string;
  km: string;
  distance: string;

  // Contact Sync
  syncContacts: string;
  selectContacts: string;
  syncSelected: string;
  syncing: string;
  syncComplete: string;
  permissionDenied: string;
  requestPermission: string;

  // Ads
  advertisements: string;
  createAd: string;
  adTitle: string;
  adDescription: string;
  adLocation: string;
  adRadius: string;
  impressions: string;
  clicks: string;
  ctr: string;

  // Subscription
  subscription: string;
  free: string;
  premium: string;
  advertiser: string;
  upgrade: string;
  currentPlan: string;
  features: string;
  upgradeNow: string;

  // Profile
  myProfile: string;
  editProfile: string;
  name: string;
  email: string;
  bio: string;
  location: string;
  favoriteContacts: string;
  noFavorites: string;

  // Settings
  language: string;
  theme: string;
  notifications: string;
  locationTracking: string;
  privacyLevel: string;
  about: string;
  version: string;
  logout: string;

  // Common
  loading: string;
  error: string;
  success: string;
  cancel: string;
  save: string;
  delete: string;
  edit: string;
  close: string;
  retry: string;
  tryAgain: string;
  noData: string;
  search: string;
  filter: string;
  sort: string;

  // Error Messages
  errorLoadingData: string;
  errorSavingData: string;
  errorNetwork: string;
  errorPermission: string;
  errorLocation: string;

  // Auth
  login: string;
  signup: string;
  signupSuccess: string;
  loginSuccess: string;
  logoutSuccess: string;
  invalidCredentials: string;
  emailRequired: string;
  passwordRequired: string;
}

const translations: Record<Language, TranslationStrings> = {
  'pt-BR': {
    // Navigation & Tabs
    home: 'Início',
    contacts: 'Contatos',
    ads: 'Anúncios',
    profile: 'Perfil',
    settings: 'Configurações',

    // Home Screen
    nearbyContacts: 'Contatos Próximos',
    noContactsNearby: 'Nenhum contato próximo',
    discoverNearby: 'Descobrir contatos próximos',
    refreshing: 'Atualizando...',
    km: 'km',
    distance: 'Distância',

    // Contact Sync
    syncContacts: 'Sincronizar Contatos',
    selectContacts: 'Selecione os contatos',
    syncSelected: 'Sincronizar Selecionados',
    syncing: 'Sincronizando...',
    syncComplete: 'Sincronização concluída',
    permissionDenied: 'Permissão negada',
    requestPermission: 'Solicitar permissão',

    // Ads
    advertisements: 'Anúncios',
    createAd: 'Criar Anúncio',
    adTitle: 'Título do Anúncio',
    adDescription: 'Descrição',
    adLocation: 'Localização',
    adRadius: 'Raio (km)',
    impressions: 'Impressões',
    clicks: 'Cliques',
    ctr: 'CTR',

    // Subscription
    subscription: 'Assinatura',
    free: 'Gratuito',
    premium: 'Premium',
    advertiser: 'Anunciante',
    upgrade: 'Atualizar',
    currentPlan: 'Plano Atual',
    features: 'Recursos',
    upgradeNow: 'Atualizar Agora',

    // Profile
    myProfile: 'Meu Perfil',
    editProfile: 'Editar Perfil',
    name: 'Nome',
    email: 'E-mail',
    bio: 'Biografia',
    location: 'Localização',
    favoriteContacts: 'Contatos Favoritos',
    noFavorites: 'Nenhum favorito',

    // Settings
    language: 'Idioma',
    theme: 'Tema',
    notifications: 'Notificações',
    locationTracking: 'Rastreamento de Localização',
    privacyLevel: 'Nível de Privacidade',
    about: 'Sobre',
    version: 'Versão',
    logout: 'Sair',

    // Common
    loading: 'Carregando...',
    error: 'Erro',
    success: 'Sucesso',
    cancel: 'Cancelar',
    save: 'Salvar',
    delete: 'Deletar',
    edit: 'Editar',
    close: 'Fechar',
    retry: 'Tentar Novamente',
    tryAgain: 'Tente Novamente',
    noData: 'Sem dados',
    search: 'Pesquisar',
    filter: 'Filtrar',
    sort: 'Ordenar',

    // Error Messages
    errorLoadingData: 'Erro ao carregar dados',
    errorSavingData: 'Erro ao salvar dados',
    errorNetwork: 'Erro de conexão',
    errorPermission: 'Permissão negada',
    errorLocation: 'Erro ao obter localização',

    // Auth
    login: 'Entrar',
    signup: 'Criar Conta',
    signupSuccess: 'Conta criada com sucesso',
    loginSuccess: 'Login realizado com sucesso',
    logoutSuccess: 'Logout realizado com sucesso',
    invalidCredentials: 'Credenciais inválidas',
    emailRequired: 'E-mail é obrigatório',
    passwordRequired: 'Senha é obrigatória',
  },
  en: {
    // Navigation & Tabs
    home: 'Home',
    contacts: 'Contacts',
    ads: 'Ads',
    profile: 'Profile',
    settings: 'Settings',

    // Home Screen
    nearbyContacts: 'Nearby Contacts',
    noContactsNearby: 'No contacts nearby',
    discoverNearby: 'Discover nearby contacts',
    refreshing: 'Refreshing...',
    km: 'km',
    distance: 'Distance',

    // Contact Sync
    syncContacts: 'Sync Contacts',
    selectContacts: 'Select contacts',
    syncSelected: 'Sync Selected',
    syncing: 'Syncing...',
    syncComplete: 'Sync complete',
    permissionDenied: 'Permission denied',
    requestPermission: 'Request permission',

    // Ads
    advertisements: 'Advertisements',
    createAd: 'Create Ad',
    adTitle: 'Ad Title',
    adDescription: 'Description',
    adLocation: 'Location',
    adRadius: 'Radius (km)',
    impressions: 'Impressions',
    clicks: 'Clicks',
    ctr: 'CTR',

    // Subscription
    subscription: 'Subscription',
    free: 'Free',
    premium: 'Premium',
    advertiser: 'Advertiser',
    upgrade: 'Upgrade',
    currentPlan: 'Current Plan',
    features: 'Features',
    upgradeNow: 'Upgrade Now',

    // Profile
    myProfile: 'My Profile',
    editProfile: 'Edit Profile',
    name: 'Name',
    email: 'Email',
    bio: 'Bio',
    location: 'Location',
    favoriteContacts: 'Favorite Contacts',
    noFavorites: 'No favorites',

    // Settings
    language: 'Language',
    theme: 'Theme',
    notifications: 'Notifications',
    locationTracking: 'Location Tracking',
    privacyLevel: 'Privacy Level',
    about: 'About',
    version: 'Version',
    logout: 'Logout',

    // Common
    loading: 'Loading...',
    error: 'Error',
    success: 'Success',
    cancel: 'Cancel',
    save: 'Save',
    delete: 'Delete',
    edit: 'Edit',
    close: 'Close',
    retry: 'Retry',
    tryAgain: 'Try Again',
    noData: 'No data',
    search: 'Search',
    filter: 'Filter',
    sort: 'Sort',

    // Error Messages
    errorLoadingData: 'Error loading data',
    errorSavingData: 'Error saving data',
    errorNetwork: 'Network error',
    errorPermission: 'Permission denied',
    errorLocation: 'Error getting location',

    // Auth
    login: 'Login',
    signup: 'Sign Up',
    signupSuccess: 'Account created successfully',
    loginSuccess: 'Login successful',
    logoutSuccess: 'Logout successful',
    invalidCredentials: 'Invalid credentials',
    emailRequired: 'Email is required',
    passwordRequired: 'Password is required',
  },
};

export function getTranslation(language: Language, key: keyof TranslationStrings): string {
  return translations[language]?.[key] || key;
}

export function getTranslations(language: Language): TranslationStrings {
  return translations[language] || translations['en'];
}

export type { Language, TranslationStrings };
