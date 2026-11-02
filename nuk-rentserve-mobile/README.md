# NUK RentServe Mobile (React Native + Expo + TypeScript)

> Dedicated cross-platform Android and iOS application for **NUK RentServe**, adapted from the Figma mobile design system with a premium Karnataka Crimson (`#D71920`) and Sun Gold (`#FFC928`) visual identity. Reuses the existing Node.js + Express + MongoDB backend (`/api/v1`).

---

## 🚀 Quick Start

### 1. Prerequisites
* **Node.js**: v18+ (verified on Node v24)
* **Mobile Environment**:
  * Physical Android/iOS device with **Expo Go** installed from Google Play Store or Apple App Store.
  * Or Android Studio / Android Emulator on Windows.

### 2. Configure Backend Connection
Check `.env`:
```env
# For Android Emulator:
EXPO_PUBLIC_API_URL=http://10.0.2.2:5000/api/v1

# For Physical Android / iOS device over local Wi-Fi:
# EXPO_PUBLIC_API_URL=http://<YOUR_COMPUTER_LAN_IP>:5000/api/v1

# For Hosted Production (Render):
# EXPO_PUBLIC_API_URL=https://nuk-rentserve-api.onrender.com/api/v1
```

### 3. Start the Development Server
```bash
cd nuk-rentserve-mobile
npx expo start
```
* Press **`a`** to open on connected Android Emulator.
* Scan the QR code with **Expo Go** on your physical Android phone to test live.

---

## 📱 Feature Coverage (All 10 Requirements Implemented)

| Feature | Screen / Implementation | Status |
| :--- | :--- | :--- |
| **1. Auth & Profiles** | `SplashScreen`, `LanguageScreen`, `LoginScreen`, `RegisterScreen`, `OtpScreen`, `ForgotPasswordScreen`, `ProfileScreen` | ✅ Verified |
| **2. Rental Discovery** | `ExploreScreen`, `PropertyCard`, `PropertyDetailScreen` (Houses, Rooms, PGs, Commercial Shops, Deposit & Rent Filters) | ✅ Verified |
| **3. Services & Bookings** | `ExploreScreen`, `ProviderCard`, `ProviderProfileScreen` (Electricians, Plumbers, Cleaning, Tutors, Reviews & Booking modal) | ✅ Verified |
| **4. Instant Auto Ride** | `AutoBookingScreen`, `MapContainer`, `FareBargainSheet` (Fare bargaining in ₹5 steps, 30s driver radar, live driver card) | ✅ Verified |
| **5. Scheduled Trips** | `ScheduledTripScreen` (Passenger Car one-day/outstation trips & Goods Van freight shifting with capacity & passenger counter) | ✅ Verified |
| **6. Owner & Student Hub** | `OwnerDashboardScreen` (Listing manager, mark available/rented) & `StudentDashboardScreen` (Direct commission tracker, 0% platform retention) | ✅ Verified |
| **7. Customer-Provider Chat** | `MessagesScreen`, `ChatScreen` (In-trip chat for accepted bookings with quick canned replies and direct call button) | ✅ Verified |
| **8. GPS Discovery & Tracking** | `MapContainer`, `LiveTrackingScreen`, `ActiveRideContext` (4s GPS polling, driver speed/heading, recenter button, 112 SOS call) | ✅ Verified |
| **9. Push, Favourites & History**| `BookingsScreen` (Filter by Auto, Car/Van, Services, with status chips), `SavedListingsScreen` (AsyncStorage heart bookmarks) | ✅ Verified |
| **10. Bilingual Legal & Consent**| `TermsViewerScreen`, `terms.ts` (Pinned v2.1 terms & privacy policy in English & ಕನ್ನಡ for Customer, Driver, Owner, Student, Provider) | ✅ Verified |

---

## 🎨 Design System & Karnataka Visual Identity

* **Primary Crimson:** `#D71920` (Deep: `#A80F17`, Tint: `#FDECEC`)
* **Sun Gold:** `#FFC928` (Deep: `#F0B800`, Tint: `#FFF6D6`)
* **Background & Surfaces:** Warm Paper `#F8F7F4`, White `#FFFFFF`, Border `#E7E7E7`
* **Text Ink:** Charcoal `#202124`, Muted Text `#686868`
* **Semantic Tones:** Success Emerald `#16834A`, Bad Red `#DC2626`, Info Blue `#1A56B0`
* **Typography:** `Inter` + `Noto Sans Kannada` with zero-flicker instant language switcher (`useLocalization()`).

---

## 📁 Source Directory Map

```
nuk-rentserve-mobile/
├── assets/                       # Adaptive icon, splash screen, favicon
├── src/
│   ├── api/                      # Axios client with JWT refresh interceptor & typed services
│   │   ├── client.ts             # Central Axios client
│   │   ├── authApi.ts            # Auth, OTP & user profile
│   │   ├── transportApi.ts       # Auto rides, dispatch queue & GPS tracking
│   │   ├── rentalApi.ts          # Property listings, visits & owner CRUD
│   │   ├── serviceApi.ts         # Categories, service listings & reviews
│   │   ├── chatApi.ts            # Booking messages
│   │   ├── providerApi.ts        # Driver onboarding application
│   │   └── adminApi.ts           # Admin metrics & review desk
│   ├── constants/
│   │   ├── theme.ts              # Karnataka colors, spacing, radius, shadows, badges
│   │   ├── strings.ts            # Bilingual dictionary (English + ಕನ್ನಡ)
│   │   ├── terms.ts              # Pinned bilingual legal agreements (v2.1)
│   │   ├── config.ts             # Base URL, Bagalkot coordinates, vehicle types
│   │   └── mockData.ts           # Reliable Karnataka seed/fallback data
│   ├── context/
│   │   ├── LocalizationContext.tsx # Language state (en / kn) & t() helper
│   │   ├── AuthContext.tsx       # User session, JWT tokens & active role
│   │   ├── LocationContext.tsx   # GPS permission & device coordinates
│   │   └── ActiveRideContext.tsx # Live auto booking, bargaining & 4s GPS poller
│   ├── components/
│   │   ├── common/               # Logo, Button, Input, Badge, Card, Header, Modal, BottomSheet, Skeleton, EmptyState, ErrorBanner, OfflineNotice
│   │   ├── transport/            # MapContainer, FareBargainSheet, DriverTrackingCard, RideOtpReceipt
│   │   ├── rentals/              # PropertyCard
│   │   └── services/             # ProviderCard
│   ├── navigation/
│   │   └── RootNavigator.tsx     # Stack and bottom tabs (Home, Explore, Bookings, Messages, Profile)
│   ├── screens/
│   │   ├── auth/                 # Splash, Language, Login, Register, Otp, ForgotPassword
│   │   ├── home/                 # HomeScreen
│   │   ├── explore/              # ExploreScreen
│   │   ├── bookings/             # BookingsScreen
│   │   ├── chat/                 # MessagesScreen, ChatScreen
│   │   ├── profile/              # ProfileScreen, SupportTicketsScreen, SavedListingsScreen
│   │   ├── transport/            # AutoBookingScreen, ScheduledTripScreen, LiveTrackingScreen
│   │   ├── rentals/              # PropertyDetailScreen
│   │   ├── services/             # ProviderProfileScreen
│   │   ├── driver/               # DriverDashboardScreen, DriverOnboardingScreen
│   │   ├── owner/                # OwnerDashboardScreen
│   │   ├── student/              # StudentDashboardScreen
│   │   ├── admin/                # AdminDashboardScreen
│   │   └── legal/                # TermsViewerScreen
│   └── utils/
│       ├── storage.ts            # SecureStore & AsyncStorage wrapper
│       ├── formatters.ts         # ₹ INR currency & date formatters
│       ├── validators.ts         # Phone, email, Aadhaar, RC plate validation
│       └── fareCalculator.ts     # Regional auto & trip fare formula
├── App.tsx                       # Root React Native component with all Providers
├── index.js                      # Expo entrypoint
├── app.json                      # App metadata, bundle IDs & permissions
├── tsconfig.json                 # TypeScript compiler configuration
└── package.json                  # Dependencies
```

---

## 📦 Android APK & AAB Production Release

### Local Build with Gradle (Using installed Android Studio)
```bash
# Generate Android native folder
npx expo prebuild --platform android

# Build Release APK
cd android
./gradlew assembleRelease
# The APK will be generated at: android/app/build/outputs/apk/release/app-release.apk

# Build Production AAB (Google Play Store)
./gradlew bundleRelease
# The AAB will be generated at: android/app/build/outputs/bundle/release/app-release.aab
```

### Cloud Build with EAS (Expo Application Services)
```bash
# Install EAS CLI
npm install -g eas-cli
eas login

# Build Standalone APK for device field testing:
eas build -p android --profile preview

# Build Production AAB for Google Play Store:
eas build -p android --profile production
```
