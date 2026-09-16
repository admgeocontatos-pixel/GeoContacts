# GeoContacts - Plataforma de Descoberta de Contatos Baseada em Localização

Um aplicativo móvel React Native/Expo que permite aos usuários descobrir contatos próximos, gerenciar anúncios geolocalizados e sincronizar contatos de forma seletiva.

## 🎯 Funcionalidades Principais

### 1. **Descoberta de Contatos Próximos**
- Localização em tempo real do usuário
- Cálculo de distância usando fórmula Haversine
- Filtro por raio de busca (1, 5, 10, 20 km)
- Exibição de contatos com distância e informações do perfil
- Sistema de favoritos

### 2. **Sincronização de Contatos**
- Sincronização seletiva de contatos do telefone
- Busca e filtro de contatos
- Indicador de progresso de sincronização
- Suporte para múltiplas seleções

### 3. **Gerenciamento de Anúncios**
- Visualização de anúncios geolocalizados
- Filtro por plano (básico, premium, destaque)
- Ordenação por impressões, cliques e CTR
- Métricas em tempo real (impressões, cliques, CTR)
- Criação de novos anúncios

### 4. **Perfil do Usuário**
- Edição de informações pessoais
- Gerenciamento de assinatura
- Visualização de recursos do plano
- Upgrade de plano
- Lista de contatos favoritos

### 5. **Configurações**
- Seleção de idioma (PT-BR/EN)
- Tema (claro/escuro/automático)
- Rastreamento de localização
- Nível de privacidade
- Unidade de distância (km/mi)
- Gerenciamento de notificações

### 6. **Internacionalização**
- Suporte para Português Brasileiro (PT-BR)
- Suporte para Inglês (EN)
- Troca de idioma em tempo real

## 📁 Estrutura do Projeto

```
geocontacts/
├── app/
│   ├── (tabs)/
│   │   ├── _layout.tsx          # Configuração de abas
│   │   ├── index.tsx            # Tela Home
│   │   ├── contacts.tsx         # Tela de Contatos
│   │   ├── ads.tsx              # Tela de Anúncios
│   │   ├── profile.tsx          # Tela de Perfil
│   │   └── settings.tsx         # Tela de Configurações
│   ├── _layout.tsx              # Layout raiz
│   └── oauth/callback.tsx       # Callback OAuth
├── components/
│   ├── nearby-contact-card.tsx  # Card de contato próximo
│   ├── ad-card.tsx              # Card de anúncio
│   ├── screen-container.tsx     # Container com SafeArea
│   └── ...
├── lib/
│   ├── location-utils.ts        # Utilitários de localização
│   ├── location-context.tsx     # Contexto de localização
│   ├── settings-context.tsx     # Contexto de configurações
│   ├── i18n.ts                  # Internacionalização
│   ├── trpc.ts                  # Cliente tRPC
│   └── ...
├── shared/
│   └── types.ts                 # Tipos TypeScript compartilhados
├── app.config.ts                # Configuração Expo
├── package.json                 # Dependências
└── README.md                    # Este arquivo
```

## 🛠️ Instalação e Setup

### Pré-requisitos
- Node.js 18+ e npm/pnpm
- Expo CLI
- iOS/Android SDK (para compilação nativa)

### Instalação

```bash
# Instalar dependências
pnpm install

# Iniciar o servidor de desenvolvimento
pnpm dev

# Ou iniciar apenas o Metro bundler
pnpm dev:metro

# Ou iniciar apenas o servidor backend
pnpm dev:server
```

### Executar em Dispositivo

```bash
# iOS
pnpm ios

# Android
pnpm android

# Web
pnpm dev:metro
```

## 📱 Telas do Aplicativo

### Home (Descoberta de Contatos)
- Exibe contatos próximos com distância
- Filtro por raio de busca
- Estatísticas de contatos e favoritos
- Pull-to-refresh para atualizar

### Contatos (Sincronização)
- Lista de contatos disponíveis
- Busca e filtro
- Seleção múltipla com checkboxes
- Botão de sincronização
- Status de sincronização

### Anúncios
- Lista de anúncios geolocalizados
- Filtro por plano
- Ordenação por métricas
- Estatísticas de impressões e cliques
- Botão para criar novo anúncio

### Perfil
- Informações do usuário
- Edição de perfil
- Plano de assinatura atual
- Recursos do plano
- Contatos favoritos
- Informações da conta

### Configurações
- Seleção de idioma
- Tema (claro/escuro/automático)
- Rastreamento de localização
- Nível de privacidade
- Unidade de distância
- Notificações
- Informações sobre o app
- Logout

## 🔧 Utilitários Principais

### Location Utils (`lib/location-utils.ts`)
- `calculateHaversineDistance()` - Calcula distância entre dois pontos
- `getDistance()` - Obtém distância entre coordenadas
- `calculateBearing()` - Calcula direção entre pontos
- `isWithinRadius()` - Verifica se ponto está dentro de raio
- `filterByRadius()` - Filtra locais por raio
- `sortByDistance()` - Ordena locais por distância
- `formatDistance()` - Formata distância para exibição

### Contextos

#### LocationContext
Gerencia estado de localização do usuário:
- `currentLocation` - Localização atual
- `updateLocation()` - Atualiza localização
- `trackingEnabled` - Status de rastreamento
- `setTrackingEnabled()` - Ativa/desativa rastreamento

#### SettingsContext
Gerencia configurações do aplicativo:
- `settings` - Objeto de configurações
- `updateSettings()` - Atualiza configurações
- `resetSettings()` - Reseta para padrão

### Internacionalização (`lib/i18n.ts`)
- `getTranslation()` - Obtém tradução para chave
- `getTranslations()` - Obtém objeto de traduções completo
- Suporte para PT-BR e EN

## 📊 Tipos de Dados

Todos os tipos estão definidos em `shared/types.ts`:

- `User` - Dados do usuário
- `Contact` - Dados de contato
- `UserLocation` - Localização do usuário
- `Advertisement` - Dados de anúncio
- `Subscription` - Dados de assinatura
- `NearbyContact` - Contato próximo com distância
- `LocationCoordinates` - Coordenadas geográficas
- `AppSettings` - Configurações do aplicativo

## 🎨 Tema e Cores

O aplicativo usa um sistema de cores configurável em `theme.config.js`:

| Token | Light | Dark | Uso |
|-------|-------|------|-----|
| `primary` | #0a7ea4 | #0a7ea4 | Cor de destaque |
| `background` | #ffffff | #151718 | Fundo |
| `surface` | #f5f5f5 | #1e2022 | Superfícies elevadas |
| `foreground` | #11181C | #ECEDEE | Texto principal |
| `muted` | #687076 | #9BA1A6 | Texto secundário |
| `border` | #E5E7EB | #334155 | Bordas |
| `success` | #22C55E | #4ADE80 | Sucesso |
| `warning` | #F59E0B | #FBBF24 | Aviso |
| `error` | #EF4444 | #F87171 | Erro |

## 🔐 Autenticação e Autorização

O aplicativo usa OAuth para autenticação. Os tokens são gerenciados automaticamente pelo cliente tRPC.

## 📦 Dependências Principais

- **React Native 0.81** - Framework móvel
- **Expo 54** - Plataforma de desenvolvimento
- **Expo Router 6** - Roteamento
- **NativeWind 4** - Tailwind CSS para React Native
- **TypeScript 5.9** - Tipagem estática
- **tRPC** - API type-safe
- **TanStack Query** - Gerenciamento de estado do servidor
- **AsyncStorage** - Armazenamento local
- **React Native Reanimated 4** - Animações

## 🚀 Deployment

### Compilar para iOS/Android

```bash
# Configurar EAS Build
eas build:configure

# Compilar para Android
eas build --platform android

# Compilar para iOS
eas build --platform ios
```

### Publicar nas App Stores

1. Criar contas de desenvolvedor (Apple Developer, Google Play)
2. Preparar screenshots e descrições
3. Configurar privacidade e termos
4. Submeter para revisão

## 📝 Notas de Desenvolvimento

- O aplicativo usa dados mock para demonstração
- Integração com backend real requer configuração de API
- Localização em tempo real requer permissões do dispositivo
- Sincronização de contatos disponível apenas em iOS/Android

## 🐛 Troubleshooting

### Erro de compilação TypeScript
```bash
pnpm check
```

### Limpar cache
```bash
rm -rf node_modules .expo
pnpm install
```

### Resetar projeto
```bash
node scripts/reset-project.js
```

## 📄 Licença

© 2026 GeoContacts. Todos os direitos reservados.

## 👥 Suporte

Para suporte e dúvidas, consulte a documentação ou abra uma issue no repositório.
