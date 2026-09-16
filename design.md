# GeoContacts - Mobile App Design

## Design Philosophy
- **Orientation:** Portrait (9:16) - one-handed usage
- **Platform:** iOS-first design following Apple Human Interface Guidelines
- **Theme:** Modern, clean, location-focused with vibrant accent colors

## Screen List

### 1. Onboarding & Authentication
- **Purpose:** Welcome new users and handle login/signup
- **Content:** Logo, welcome message, login/signup buttons, social login options
- **Actions:** Navigate to Home after authentication

### 2. Home Screen - Nearby Contacts Discovery
- **Purpose:** Display nearby contacts and ads based on location
- **Content:**
  - User's current location badge
  - List of nearby contacts with distance
  - Featured ads carousel
  - Quick action buttons (refresh, filters)
- **Functionality:**
  - Real-time location tracking
  - Distance calculation (Haversine)
  - Pull-to-refresh for updates
  - Filter by distance/subscription status

### 3. Contact Sync Screen
- **Purpose:** Selective import of phone contacts
- **Content:**
  - Permission request UI
  - Contact list with checkboxes
  - Search/filter functionality
  - Sync progress indicator
- **Functionality:**
  - Request phone contacts permission
  - Display all contacts
  - Allow user selection
  - Sync selected contacts to backend

### 4. Ads Management Screen
- **Purpose:** View and manage location-based advertisements
- **Content:**
  - Active ads list
  - Ad performance metrics (impressions, clicks)
  - Create new ad button
  - Ad detail cards
- **Functionality:**
  - Display ads by location
  - Track impressions and clicks
  - Show CTR (click-through rate)
  - Edit/delete ads

### 5. User Profile Screen
- **Purpose:** Display and edit user profile
- **Content:**
  - Profile picture
  - User name and bio
  - Current subscription status
  - Location privacy settings
  - Favorite contacts list
- **Functionality:**
  - Edit profile information
  - Upgrade subscription
  - Manage privacy settings
  - View subscription details

### 6. Subscription & Upgrade Screen
- **Purpose:** Display subscription plans and enable upgrades
- **Content:**
  - Free plan features
  - Premium plan features
  - Advertiser plan features
  - Pricing information
  - Upgrade buttons
- **Functionality:**
  - Show current subscription
  - Enable subscription upgrade
  - Process payments (Stripe)
  - Display benefits

### 7. Settings Screen
- **Purpose:** App configuration and preferences
- **Content:**
  - Language selection (PT-BR/EN)
  - Location tracking toggle
  - Notification preferences
  - Privacy policy link
  - About app section
- **Functionality:**
  - Change language
  - Toggle background location tracking
  - Manage notification settings
  - View app version

## Color Palette

| Token | Light | Dark | Usage |
|-------|-------|------|-------|
| Primary | #0a7ea4 | #0a7ea4 | Location/discovery accent |
| Background | #ffffff | #151718 | Screen background |
| Surface | #f5f5f5 | #1e2022 | Cards and elevated surfaces |
| Foreground | #11181C | #ECEDEE | Primary text |
| Muted | #687076 | #9BA1A6 | Secondary text |
| Border | #E5E7EB | #334155 | Dividers and borders |
| Success | #22C55E | #4ADE80 | Positive actions |
| Warning | #F59E0B | #FBBF24 | Alerts and warnings |
| Error | #EF4444 | #F87171 | Error states |

## Key User Flows

### Flow 1: Discover Nearby Contacts
1. User opens app → Home screen loads
2. App requests location permission
3. User's location is captured
4. Backend calculates nearby contacts (Haversine)
5. List displays contacts with distance badges
6. User taps contact → View profile or add to favorites

### Flow 2: Sync Phone Contacts
1. User navigates to Contact Sync screen
2. App requests contacts permission
3. All phone contacts load in a list
4. User selects contacts to sync (checkboxes)
5. User taps "Sync" button
6. Selected contacts sync to backend
7. Success message displays

### Flow 3: Upgrade Subscription
1. User taps "Upgrade" button on Home or Profile
2. Subscription screen displays plans
3. User selects Premium plan
4. Payment flow initiates (Stripe)
5. After successful payment, subscription activates
6. Premium features unlock (hide location, no ads)

### Flow 4: Create Advertisement
1. User navigates to Ads screen
2. User taps "Create Ad" button
3. Ad creation form displays (title, description, image, location, radius)
4. User fills form and submits
5. Ad is created and becomes visible to nearby users
6. User can view ad metrics (impressions, clicks)

## Responsive Considerations
- All screens optimized for portrait orientation (9:16)
- One-handed usage: critical buttons positioned in lower half
- Safe area handling for notch and home indicator
- Tab bar navigation at bottom
- Scrollable content for longer lists

## Accessibility
- Sufficient color contrast (WCAG AA)
- Touch targets minimum 44pt
- Clear hierarchy and labels
- Support for system text size adjustments
