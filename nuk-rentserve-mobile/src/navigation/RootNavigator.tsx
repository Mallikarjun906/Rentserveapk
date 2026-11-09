// Central Navigation Controller with Stack, Role-Based Bottom Navigation Bar & Strict RBAC Route Guards

import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  StatusBar,
  Platform,
  Alert,
  BackHandler,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import {
  Home,
  Search,
  Calendar,
  MessageSquare,
  User,
  LayoutDashboard,
  Car,
  Navigation,
  Wallet,
  Clock,
  Briefcase,
  Wrench,
  Building2,
  Inbox,
  Bell,
} from 'lucide-react-native';
import { COLORS, RADIUS, SHADOWS } from '../constants/theme';
import { useLocalization } from '../context/LocalizationContext';
import { useAuth } from '../context/AuthContext';

// Screen Imports
import { SplashScreen } from '../screens/auth/SplashScreen';
import { LanguageScreen } from '../screens/auth/LanguageScreen';
import { LoginScreen } from '../screens/auth/LoginScreen';
import { RegisterScreen } from '../screens/auth/RegisterScreen';
import { CustomerRegisterScreen } from '../screens/auth/CustomerRegisterScreen';
import { DriverRegisterScreen } from '../screens/auth/DriverRegisterScreen';
import { StudentRegisterScreen } from '../screens/auth/StudentRegisterScreen';
import { ProviderRegisterScreen } from '../screens/auth/ProviderRegisterScreen';
import { AdminLoginScreen } from '../screens/auth/AdminLoginScreen';
import { OtpScreen } from '../screens/auth/OtpScreen';
import { ForgotPasswordScreen } from '../screens/auth/ForgotPasswordScreen';

import { HomeScreen } from '../screens/home/HomeScreen';
import { ExploreScreen } from '../screens/explore/ExploreScreen';
import { BookingsScreen } from '../screens/bookings/BookingsScreen';
import { MessagesScreen } from '../screens/chat/MessagesScreen';
import { ProfileScreen } from '../screens/profile/ProfileScreen';
import { NotificationsScreen } from '../screens/notifications/NotificationsScreen';

import { AutoBookingScreen } from '../screens/transport/AutoBookingScreen';
import { ScheduledTripScreen } from '../screens/transport/ScheduledTripScreen';
import { LiveTrackingScreen } from '../screens/transport/LiveTrackingScreen';

import { PropertyDetailScreen } from '../screens/rentals/PropertyDetailScreen';
import { ProviderProfileScreen } from '../screens/services/ProviderProfileScreen';
import { ChatScreen } from '../screens/chat/ChatScreen';

import { DriverDashboardScreen } from '../screens/driver/DriverDashboardScreen';
import { DriverMyProfileScreen } from '../screens/driver/DriverMyProfileScreen';
import { DriverOnboardingScreen } from '../screens/driver/DriverOnboardingScreen';

import { ProviderDashboardScreen } from '../screens/provider/ProviderDashboardScreen';
import { ProviderMyProfileScreen } from '../screens/provider/ProviderMyProfileScreen';

import { OwnerDashboardScreen } from '../screens/owner/OwnerDashboardScreen';
import { StudentDashboardScreen } from '../screens/student/StudentDashboardScreen';
import { AdminDashboardScreen } from '../screens/admin/AdminDashboardScreen';

import { TermsViewerScreen } from '../screens/legal/TermsViewerScreen';
import { SupportTicketsScreen } from '../screens/profile/SupportTicketsScreen';
import { SavedListingsScreen } from '../screens/profile/SavedListingsScreen';

export type ScreenName =
  | 'splash'
  | 'language'
  | 'login'
  | 'register'
  | 'register-customer'
  | 'register-driver'
  | 'register-student'
  | 'register-provider'
  | 'admin-login'
  | 'otp'
  | 'forgot'
  | 'home'
  | 'explore'
  | 'bookings'
  | 'messages'
  | 'profile'
  | 'auto'
  | 'sched'
  | 'live-tracking'
  | 'property'
  | 'provider'
  | 'chat'
  | 'driver-dashboard'
  | 'driver-profile'
  | 'driver-onboarding'
  | 'provider-dashboard'
  | 'provider-profile'
  | 'owner-dashboard'
  | 'student-dashboard'
  | 'admin-dashboard'
  | 'terms'
  | 'support'
  | 'saved'
  | 'notifications';

interface NavState {
  name: ScreenName;
  params?: any;
}

export const RootNavigator: React.FC = () => {
  const { t } = useLocalization();
  const { user } = useAuth();
  const insets = useSafeAreaInsets();

  const [stack, setStack] = useState<NavState[]>([{ name: 'splash' }]);
  const [activeTab, setActiveTab] = useState<ScreenName>('home');

  const current = stack[stack.length - 1];

  const go = (name: ScreenName, params?: any) => {
    // 1. Strict RBAC Navigation Guards
    if (name === 'admin-dashboard' && user?.role !== 'admin') {
      Alert.alert(
        t('Access Denied', 'ಪ್ರವೇಶ ನಿರಾಕರಿಸಲಾಗಿದೆ'),
        t('Only system administrators can access the admin console.', 'ಕೇವಲ ನಿರ್ವಾಹಕರು ಮಾತ್ರ ಪ್ರವೇಶಿಸಬಹುದು.')
      );
      return;
    }
    if ((name === 'driver-dashboard' || name === 'driver-profile') && user?.role !== 'driver' && user?.role !== 'admin') {
      Alert.alert(
        t('Access Denied', 'ಪ್ರವೇಶ ನಿರಾಕರಿಸಲಾಗಿದೆ'),
        t('Only registered drivers can access the driver workspace.', 'ಕೇವಲ ಚಾಲಕರು ಮಾತ್ರ ಪ್ರವೇಶಿಸಬಹುದು.')
      );
      return;
    }
    if ((name === 'provider-dashboard' || name === 'provider-profile') && user?.role !== 'provider' && user?.role !== 'admin') {
      Alert.alert(
        t('Access Denied', 'ಪ್ರವೇಶ ನಿರಾಕರಿಸಲಾಗಿದೆ'),
        t('Only registered service providers can access the provider workspace.', 'ಕೇವಲ ನೋಂದಾಯಿತ ಸೇವಾ ಪೂರೈಕೆದಾರರು ಮಾತ್ರ ಪ್ರವೇಶಿಸಬಹುದು.')
      );
      return;
    }
    if (name === 'student-dashboard' && user?.role !== 'student' && user?.role !== 'admin') {
      Alert.alert(
        t('Access Denied', 'ಪ್ರವೇಶ ನಿರಾಕರಿಸಲಾಗಿದೆ'),
        t('Only student partners can access the student dashboard.', 'ಕೇವಲ ವಿದ್ಯಾರ್ಥಿಗಳು ಮಾತ್ರ ಪ್ರವೇಶಿಸಬಹುದು.')
      );
      return;
    }
    if (name === 'owner-dashboard' && user?.role !== 'owner' && user?.role !== 'admin') {
      Alert.alert(
        t('Access Denied', 'ಪ್ರವೇಶ ನಿರಾಕರಿಸಲಾಗಿದೆ'),
        t('Only property owners can access this portal.', 'ಕೇವಲ ಆಸ್ತಿ ಮಾಲೀಕರು ಮಾತ್ರ ಪ್ರವೇಶಿಸಬಹುದು.')
      );
      return;
    }

    setStack((prev) => [...prev, { name, params }]);
  };

  const back = () => {
    if (stack.length > 1) {
      if (Platform.OS === 'web' && typeof globalThis !== 'undefined' && (globalThis as any).window?.history) {
        try {
          (globalThis as any).window.history.back();
        } catch {}
      }
      setStack((prev) => prev.slice(0, -1));
    } else if (stack.length === 1 && stack[0].name === 'provider-profile') {
      switchTab('provider-dashboard');
    } else if (stack.length === 1 && stack[0].name === 'driver-profile') {
      switchTab('driver-dashboard');
    }
  };

  const reset = (name: ScreenName, params?: any) => {
    setActiveTab(name);
    setStack([{ name, params }]);
  };

  const switchTab = (tab: ScreenName) => {
    setActiveTab(tab);
    reset(tab);
  };

  // Android Hardware Back Button handling: Pops secondary screen, returns from profile to dashboard, or exits
  useEffect(() => {
    const handleHardwareBack = () => {
      if (stack.length > 1) {
        setStack((prev) => prev.slice(0, -1));
        return true;
      }
      if (stack.length === 1 && stack[0].name === 'provider-profile') {
        switchTab('provider-dashboard');
        return true;
      }
      if (stack.length === 1 && stack[0].name === 'driver-profile') {
        switchTab('driver-dashboard');
        return true;
      }
      return false;
    };

    const sub = BackHandler.addEventListener('hardwareBackPress', handleHardwareBack);
    return () => sub.remove();
  }, [stack]);

  // Web Browser Back Button (popstate) handling
  useEffect(() => {
    if (Platform.OS === 'web' && typeof globalThis !== 'undefined' && (globalThis as any).window) {
      const win = (globalThis as any).window;
      const handlePop = () => {
        setStack((prev) => {
          if (prev.length > 1) {
            return prev.slice(0, -1);
          }
          if (prev.length === 1 && prev[0].name === 'provider-profile') {
            return [{ name: 'provider-dashboard' }];
          }
          if (prev.length === 1 && prev[0].name === 'driver-profile') {
            return [{ name: 'driver-dashboard' }];
          }
          return prev;
        });
      };
      win.addEventListener('popstate', handlePop);
      return () => win.removeEventListener('popstate', handlePop);
    }
  }, []);

  // Strict RBAC safety guard: Dedicated roles are never placed on Customer Home
  useEffect(() => {
    if (user?.role === 'provider') {
      if (['home', 'explore', 'bookings'].includes(current.name)) {
        reset('provider-dashboard');
      }
    } else if (user?.role === 'driver') {
      if (['home', 'explore', 'bookings'].includes(current.name)) {
        reset('driver-dashboard');
      }
    } else if (user?.role === 'student') {
      if (['home', 'explore', 'bookings'].includes(current.name)) {
        reset('student-dashboard');
      }
    } else if (user?.role === 'owner') {
      if (['home', 'explore', 'bookings'].includes(current.name)) {
        reset('owner-dashboard');
      }
    }
  }, [user?.role, current.name]);

  // URL path synchronization for web browser
  useEffect(() => {
    if (Platform.OS === 'web' && typeof globalThis !== 'undefined' && (globalThis as any).window?.location) {
      const path = String((globalThis as any).window.location.pathname || '').toLowerCase();
      if (path.includes('/register/customer')) {
        reset('register-customer');
      } else if (path.includes('/register/driver')) {
        reset('register-driver');
      } else if (path.includes('/register/student')) {
        reset('register-student');
      } else if (path.includes('/register/provider')) {
        reset('register-provider');
      } else if (path.includes('/admin/login')) {
        reset('admin-login');
      } else if (path.includes('/login')) {
        reset('login');
      }
    }
  }, []);

  // Determine which bottom navigation bar to display based on user role
  const isProvider = user?.role === 'provider';
  const isDriver = user?.role === 'driver';
  const isStudent = user?.role === 'student';
  const isOwner = user?.role === 'owner';
  const isAdmin = user?.role === 'admin';
  const isCustomer = !isProvider && !isDriver && !isStudent && !isOwner && !isAdmin;

  const showCustomerTabs = (isCustomer || !user) && ['home', 'explore', 'bookings', 'messages', 'profile'].includes(current.name);
  const showDriverTabs = isDriver && ['driver-dashboard', 'driver-profile', 'messages'].includes(current.name);
  const showProviderTabs = isProvider && ['provider-dashboard', 'provider-profile', 'messages'].includes(current.name);
  const showStudentTabs = isStudent && ['student-dashboard', 'messages', 'profile'].includes(current.name);
  const showOwnerTabs = isOwner && ['owner-dashboard', 'messages', 'profile'].includes(current.name);

  // Render active screen
  const renderScreen = () => {
    switch (current.name) {
      case 'splash':
        return (
          <SplashScreen
            onFinish={() => {
              if (user) {
                if (user.role === 'provider') reset('provider-dashboard');
                else if (user.role === 'driver') reset('driver-dashboard');
                else if (user.role === 'admin') reset('admin-dashboard');
                else reset('home');
              } else {
                go('language');
              }
            }}
          />
        );
      case 'language':
        return <LanguageScreen onContinue={() => go('login')} />;
      case 'login':
        return (
          <LoginScreen
            onRegisterCustomer={() => go('register-customer')}
            onRegisterProvider={() => go('register-provider')}
            onRegisterDriver={() => go('register-driver')}
            onRegisterStudent={() => go('register-student')}
            onAdminLogin={() => go('admin-login')}
            onForgotPassword={() => go('forgot')}
            onSuccess={(loggedInUser) => {
              const u = loggedInUser || user;
              if (u?.role === 'provider') reset('provider-dashboard');
              else if (u?.role === 'driver') reset('driver-dashboard');
              else if (u?.role === 'admin') reset('admin-dashboard');
              else reset('home');
            }}
          />
        );
      case 'register-customer':
        return (
          <CustomerRegisterScreen
            onLogin={() => go('login')}
            onReadTerms={() => go('terms', { role: 'Customer' })}
            onSuccess={() => reset('home')}
            onBack={back}
          />
        );
      case 'register-driver':
        return (
          <DriverRegisterScreen
            onLogin={() => go('login')}
            onReadTerms={() => go('terms', { role: 'Auto/Car Driver' })}
            onSuccess={() => reset('driver-dashboard')}
            onBack={back}
          />
        );
      case 'register-student':
        return (
          <StudentRegisterScreen
            onLogin={() => go('login')}
            onReadTerms={() => go('terms', { role: 'Student Rental Partner' })}
            onSuccess={() => reset('student-dashboard')}
            onBack={back}
          />
        );
      case 'register-provider':
        return (
          <ProviderRegisterScreen
            onLogin={() => go('login')}
            onReadTerms={() => go('terms', { role: 'Service Provider' })}
            onSuccess={() => reset('provider-dashboard')}
            onBack={back}
          />
        );
      case 'admin-login':
        return (
          <AdminLoginScreen
            onBackToApp={back}
            onSuccess={() => reset('admin-dashboard')}
          />
        );
      case 'register':
        return (
          <RegisterScreen
            onLogin={() => go('login')}
            onReadTerms={(role) => go('terms', { role })}
            onSuccess={() => reset('home')}
            onBack={back}
          />
        );
      case 'otp':
        return (
          <OtpScreen
            phone={current.params?.phone || '9845012345'}
            onSuccess={() => reset('home')}
            onBack={back}
          />
        );
      case 'forgot':
        return <ForgotPasswordScreen onBack={back} />;

      // Customer Tabs (5 destinations)
      case 'home':
        return (
          <HomeScreen
            onNavigateAuto={() => go('auto')}
            onNavigateCarTrips={() => go('sched', { kind: 'car' })}
            onNavigateGoodsVan={() => go('sched', { kind: 'van' })}
            onNavigateRentals={() => switchTab('explore')}
            onNavigateServices={() => switchTab('explore')}
            onSelectProperty={(id) => go('property', { id })}
            onSelectProvider={(id) => go('provider', { id })}
            onNavigateProfile={() => switchTab('profile')}
            onNavigateBookings={() => switchTab('bookings')}
            onNavigateMessages={() => switchTab('messages')}
            onNavigateNotifications={() => go('notifications')}
          />
        );
      case 'explore':
        return (
          <ExploreScreen
            initialSegment="rentals"
            onSelectProperty={(id) => go('property', { id })}
            onSelectProvider={(id) => go('provider', { id })}
          />
        );
      case 'bookings':
        return (
          <BookingsScreen
            onTrackRide={() => go('live-tracking')}
            onExplore={() => switchTab('explore')}
          />
        );
      case 'messages':
        return (
          <MessagesScreen
            onOpenChat={(thread) =>
              go('chat', {
                bookingId: thread.bookingId || thread.id,
                name: thread.name,
                role: thread.role,
                phone: thread.phone,
              })
            }
          />
        );
      case 'profile':
        return (
          <ProfileScreen
            onNavigateProviderDashboard={() => go('provider-dashboard')}
            onNavigateDriverDashboard={() => go('driver-dashboard')}
            onNavigateDriverOnboarding={() => go('driver-onboarding')}
            onNavigateOwnerDashboard={() => go('owner-dashboard')}
            onNavigateStudentDashboard={() => go('student-dashboard')}
            onNavigateAdminDashboard={() => go('admin-dashboard')}
            onNavigateSaved={() => go('saved')}
            onNavigateSupport={() => go('support')}
            onNavigateTerms={(role) => go('terms', { role })}
            onLogout={() => reset('login')}
          />
        );

      // Dedicated Workflows
      case 'auto':
        return (
          <AutoBookingScreen
            onBack={back}
            onOpenChat={(driver) =>
              go('chat', {
                bookingId: driver?.bookingId || driver?._id,
                name: driver?.name || 'Driver',
                role: driver?.vehicleModel || 'Auto Driver',
                phone: driver?.phone,
              })
            }
          />
        );
      case 'sched':
        return (
          <ScheduledTripScreen
            initialKind={current.params?.kind || 'car'}
            onBack={back}
            onSuccess={() => {
              switchTab('bookings');
            }}
          />
        );
      case 'live-tracking':
        return (
          <LiveTrackingScreen
            onBack={back}
            onOpenChat={(params?: any) =>
              go('chat', {
                bookingId: params?.bookingId || current.params?.bookingId,
                name: params?.name || 'Auto Driver',
                role: params?.role || 'Driver',
                phone: params?.phone || '+919845012345',
              })
            }
            onFinishRide={back}
          />
        );
      case 'property':
        return (
          <PropertyDetailScreen
            propertyId={current.params?.id || 'p1'}
            onBack={back}
            onOpenChat={(params) =>
              go('chat', {
                bookingId: params.bookingId,
                name: params.name,
                role: params.role,
                phone: params.phone,
              })
            }
          />
        );
      case 'provider':
        return (
          <ProviderProfileScreen
            providerId={current.params?.id || 's1'}
            onBack={back}
            onOpenChat={(params) =>
              go('chat', {
                bookingId: params.bookingId,
                name: params.name,
                role: params.role,
                phone: params.phone,
              })
            }
          />
        );
      case 'chat':
        return (
          <ChatScreen
            bookingId={current.params?.bookingId || current.params?.id}
            recipientName={current.params?.name || 'Driver / Provider'}
            recipientRole={current.params?.role || 'Service'}
            recipientPhone={current.params?.phone}
            onBack={back}
          />
        );

      // Driver Role Pages (2 main destinations + subviews)
      case 'driver-dashboard':
        return (
          <DriverDashboardScreen
            onBack={stack.length > 1 ? back : undefined}
            onNavigateOnboarding={() => go('driver-onboarding')}
            onOpenChat={(params) => go('chat', params)}
            onLogout={() => reset('login')}
          />
        );
      case 'driver-profile':
        return (
          <DriverMyProfileScreen
            onBack={() => {
              if (stack.length > 1) back();
              else switchTab('driver-dashboard');
            }}
            onLogout={() => reset('login')}
          />
        );
      case 'driver-onboarding':
        return (
          <DriverOnboardingScreen
            onBack={back}
            onSuccess={() => reset('driver-dashboard')}
          />
        );

      // Provider Role Pages (2 main destinations + subviews)
      case 'provider-dashboard':
        return (
          <ProviderDashboardScreen
            onBack={stack.length > 1 ? back : undefined}
            onOpenChat={(params) => go('chat', params)}
            onLogout={() => reset('login')}
          />
        );
      case 'provider-profile':
        return (
          <ProviderMyProfileScreen
            onBack={() => {
              if (stack.length > 1) back();
              else switchTab('provider-dashboard');
            }}
            onLogout={() => reset('login')}
            onNavigateTerms={(role) => go('terms', { role })}
            onNavigateSupport={() => go('support')}
          />
        );

      // Additional Roles
      case 'owner-dashboard':
        return <OwnerDashboardScreen onBack={back} onLogout={() => reset('login')} />;
      case 'student-dashboard':
        return (
          <StudentDashboardScreen
            onBack={back}
            onAddProperty={() => go('owner-dashboard')}
            onLogout={() => reset('login')}
          />
        );
      case 'admin-dashboard':
        return <AdminDashboardScreen onBack={back} onLogout={() => reset('login')} />;
      case 'terms':
        return (
          <TermsViewerScreen
            initialRole={current.params?.role || 'Customer'}
            onBack={back}
          />
        );
      case 'support':
        return <SupportTicketsScreen onBack={back} />;
      case 'saved':
        return (
          <SavedListingsScreen
            onBack={back}
            onSelectProperty={(id) => go('property', { id })}
            onExplore={() => switchTab('explore')}
          />
        );
      case 'notifications':
        return (
          <NotificationsScreen
            onBack={back}
            onNavigate={(screen, params) => go(screen as ScreenName, params)}
          />
        );
      default:
        return (
          <HomeScreen
            onNavigateAuto={() => go('auto')}
            onNavigateCarTrips={() => go('sched', { kind: 'car' })}
            onNavigateGoodsVan={() => go('sched', { kind: 'van' })}
            onNavigateRentals={() => switchTab('explore')}
            onNavigateServices={() => switchTab('explore')}
            onSelectProperty={(id) => go('property', { id })}
            onSelectProvider={(id) => go('provider', { id })}
          />
        );
    }
  };

  return (
    <View style={styles.root}>
      <StatusBar barStyle="dark-content" backgroundColor="transparent" translucent />
      {isProvider && ['provider-dashboard', 'provider-profile', 'chat', 'terms', 'support'].includes(current.name) ? (
        <View style={styles.screenContainer}>
          <View
            style={[
              StyleSheet.absoluteFill,
              {
                display: current.name === 'provider-dashboard' ? 'flex' : 'none',
              },
            ]}
          >
            <ProviderDashboardScreen
              onBack={stack.length > 1 ? back : undefined}
              onOpenChat={(params) => go('chat', params)}
              onLogout={() => reset('login')}
            />
          </View>

          <View
            style={[
              StyleSheet.absoluteFill,
              {
                display: current.name === 'provider-profile' ? 'flex' : 'none',
              },
            ]}
          >
            <ProviderMyProfileScreen
              onBack={() => {
                if (stack.length > 1) back();
                else switchTab('provider-dashboard');
              }}
              onLogout={() => reset('login')}
              onNavigateTerms={(role) => go('terms', { role })}
              onNavigateSupport={() => go('support')}
            />
          </View>

          {/* Secondary screen overlay (chat, terms, support) preserves Provider Dashboard state */}
          {!['provider-dashboard', 'provider-profile'].includes(current.name) && (
            <View style={[StyleSheet.absoluteFill, { backgroundColor: COLORS.paper }]}>
              {renderScreen()}
            </View>
          )}
        </View>
      ) : isDriver && ['driver-dashboard', 'driver-profile', 'driver-onboarding', 'chat', 'terms', 'support'].includes(current.name) ? (
        <View style={styles.screenContainer}>
          <View
            style={[
              StyleSheet.absoluteFill,
              {
                display: current.name === 'driver-dashboard' ? 'flex' : 'none',
              },
            ]}
          >
            <DriverDashboardScreen
              onBack={stack.length > 1 ? back : undefined}
              onNavigateOnboarding={() => go('driver-onboarding')}
              onOpenChat={(params) => go('chat', params)}
              onLogout={() => reset('login')}
            />
          </View>

          <View
            style={[
              StyleSheet.absoluteFill,
              {
                display: current.name === 'driver-profile' ? 'flex' : 'none',
              },
            ]}
          >
            <DriverMyProfileScreen
              onBack={() => {
                if (stack.length > 1) back();
                else switchTab('driver-dashboard');
              }}
              onLogout={() => reset('login')}
            />
          </View>

          {/* Secondary screen overlay (driver-onboarding, chat, terms, support) */}
          {!['driver-dashboard', 'driver-profile'].includes(current.name) && (
            <View style={[StyleSheet.absoluteFill, { backgroundColor: COLORS.paper }]}>
              {renderScreen()}
            </View>
          )}
        </View>
      ) : (
        <View style={styles.screenContainer}>{renderScreen()}</View>
      )}

      {/* Customer 5-Tab Navigation Bar */}
      {showCustomerTabs && (
        <View style={[styles.bottomNav, { paddingBottom: Math.max(insets.bottom, 8) }]}>
          <TouchableOpacity
            style={styles.navTab}
            onPress={() => switchTab('home')}
            accessibilityRole="tab"
            activeOpacity={0.7}
          >
            <View style={[styles.iconBubble, activeTab === 'home' && styles.iconBubbleActive]}>
              <Home
                size={20}
                color={activeTab === 'home' ? COLORS.brand : COLORS.mute}
                strokeWidth={activeTab === 'home' ? 2.4 : 1.8}
              />
            </View>
            <Text style={[styles.tabLabel, activeTab === 'home' && styles.tabLabelActive]}>
              {t('tabHome', 'ಮುಖಪುಟ')}
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.navTab}
            onPress={() => switchTab('explore')}
            accessibilityRole="tab"
            activeOpacity={0.7}
          >
            <View style={[styles.iconBubble, activeTab === 'explore' && styles.iconBubbleActive]}>
              <Search
                size={20}
                color={activeTab === 'explore' ? COLORS.brand : COLORS.mute}
                strokeWidth={activeTab === 'explore' ? 2.4 : 1.8}
              />
            </View>
            <Text style={[styles.tabLabel, activeTab === 'explore' && styles.tabLabelActive]}>
              {t('tabExplore', 'ಶೋಧಿಸಿ')}
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.navTab}
            onPress={() => switchTab('bookings')}
            accessibilityRole="tab"
            activeOpacity={0.7}
          >
            <View style={[styles.iconBubble, activeTab === 'bookings' && styles.iconBubbleActive]}>
              <Calendar
                size={20}
                color={activeTab === 'bookings' ? COLORS.brand : COLORS.mute}
                strokeWidth={activeTab === 'bookings' ? 2.4 : 1.8}
              />
            </View>
            <Text style={[styles.tabLabel, activeTab === 'bookings' && styles.tabLabelActive]}>
              {t('tabBookings', 'ಬುಕಿಂಗ್')}
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.navTab}
            onPress={() => switchTab('messages')}
            accessibilityRole="tab"
            activeOpacity={0.7}
          >
            <View style={[styles.iconBubble, activeTab === 'messages' && styles.iconBubbleActive]}>
              <MessageSquare
                size={20}
                color={activeTab === 'messages' ? COLORS.brand : COLORS.mute}
                strokeWidth={activeTab === 'messages' ? 2.4 : 1.8}
              />
            </View>
            <Text style={[styles.tabLabel, activeTab === 'messages' && styles.tabLabelActive]}>
              {t('tabChat', 'ಸಂದೇಶ')}
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.navTab}
            onPress={() => switchTab('profile')}
            accessibilityRole="tab"
            activeOpacity={0.7}
          >
            <View style={[styles.iconBubble, activeTab === 'profile' && styles.iconBubbleActive]}>
              <User
                size={20}
                color={activeTab === 'profile' ? COLORS.brand : COLORS.mute}
                strokeWidth={activeTab === 'profile' ? 2.4 : 1.8}
              />
            </View>
            <Text style={[styles.tabLabel, activeTab === 'profile' && styles.tabLabelActive]}>
              {t('tabProfile', 'ಪ್ರೊಫೈಲ್')}
            </Text>
          </TouchableOpacity>
        </View>
      )}

      {/* Driver 5-Tab Navigation Bar */}
      {showDriverTabs && (
        <View style={[styles.bottomNav, { paddingBottom: Math.max(insets.bottom, 8) }]}>
          <TouchableOpacity
            style={styles.navTab}
            onPress={() => switchTab('driver-dashboard')}
            accessibilityRole="tab"
            activeOpacity={0.7}
          >
            <View style={[styles.iconBubble, current.name === 'driver-dashboard' && styles.iconBubbleActive]}>
              <LayoutDashboard
                size={20}
                color={current.name === 'driver-dashboard' ? COLORS.brand : COLORS.mute}
                strokeWidth={current.name === 'driver-dashboard' ? 2.4 : 1.8}
              />
            </View>
            <Text style={[styles.tabLabel, current.name === 'driver-dashboard' && styles.tabLabelActive]}>
              {t('tabHome', 'ಮುಖಪುಟ')}
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.navTab}
            onPress={() => go('driver-dashboard', { view: 'requests' })}
            accessibilityRole="tab"
            activeOpacity={0.7}
          >
            <View style={styles.iconBubble}>
              <Navigation size={20} color={COLORS.mute} strokeWidth={1.8} />
            </View>
            <Text style={styles.tabLabel}>
              {t('tabRequests', 'ವಿನಂತಿಗಳು')}
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.navTab}
            onPress={() => go('driver-dashboard', { view: 'earnings' })}
            accessibilityRole="tab"
            activeOpacity={0.7}
          >
            <View style={styles.iconBubble}>
              <Wallet size={20} color={COLORS.mute} strokeWidth={1.8} />
            </View>
            <Text style={styles.tabLabel}>
              {t('tabEarnings', 'ಗಳಿಕೆ')}
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.navTab}
            onPress={() => go('driver-dashboard', { view: 'history' })}
            accessibilityRole="tab"
            activeOpacity={0.7}
          >
            <View style={styles.iconBubble}>
              <Clock size={20} color={COLORS.mute} strokeWidth={1.8} />
            </View>
            <Text style={styles.tabLabel}>
              {t('tabHistory', 'ಇತಿಹಾಸ')}
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.navTab}
            onPress={() => switchTab('driver-profile')}
            accessibilityRole="tab"
            activeOpacity={0.7}
          >
            <View style={[styles.iconBubble, current.name === 'driver-profile' && styles.iconBubbleActive]}>
              <User
                size={20}
                color={current.name === 'driver-profile' ? COLORS.brand : COLORS.mute}
                strokeWidth={current.name === 'driver-profile' ? 2.4 : 1.8}
              />
            </View>
            <Text style={[styles.tabLabel, current.name === 'driver-profile' && styles.tabLabelActive]}>
              {t('tabProfile', 'ಪ್ರೊಫೈಲ್')}
            </Text>
          </TouchableOpacity>
        </View>
      )}

      {/* Provider 5-Tab Navigation Bar */}
      {showProviderTabs && (
        <View style={[styles.bottomNav, { paddingBottom: Math.max(insets.bottom, 8) }]}>
          <TouchableOpacity
            style={styles.navTab}
            onPress={() => switchTab('provider-dashboard')}
            accessibilityRole="tab"
            activeOpacity={0.7}
          >
            <View style={[styles.iconBubble, current.name === 'provider-dashboard' && styles.iconBubbleActive]}>
              <LayoutDashboard
                size={20}
                color={current.name === 'provider-dashboard' ? COLORS.brand : COLORS.mute}
                strokeWidth={current.name === 'provider-dashboard' ? 2.4 : 1.8}
              />
            </View>
            <Text style={[styles.tabLabel, current.name === 'provider-dashboard' && styles.tabLabelActive]}>
              {t('tabDashboard', 'ಡ್ಯಾಶ್‌ಬೋರ್ಡ್')}
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.navTab}
            onPress={() => go('provider-dashboard', { view: 'jobs' })}
            accessibilityRole="tab"
            activeOpacity={0.7}
          >
            <View style={styles.iconBubble}>
              <Briefcase size={20} color={COLORS.mute} strokeWidth={1.8} />
            </View>
            <Text style={styles.tabLabel}>
              {t('tabJobs', 'ಉದ್ಯೋಗಗಳು')}
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.navTab}
            onPress={() => go('messages')}
            accessibilityRole="tab"
            activeOpacity={0.7}
          >
            <View style={[styles.iconBubble, current.name === 'messages' && styles.iconBubbleActive]}>
              <MessageSquare
                size={20}
                color={current.name === 'messages' ? COLORS.brand : COLORS.mute}
                strokeWidth={current.name === 'messages' ? 2.4 : 1.8}
              />
            </View>
            <Text style={[styles.tabLabel, current.name === 'messages' && styles.tabLabelActive]}>
              {t('tabChat', 'ಸಂದೇಶ')}
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.navTab}
            onPress={() => go('provider-dashboard', { view: 'services' })}
            accessibilityRole="tab"
            activeOpacity={0.7}
          >
            <View style={styles.iconBubble}>
              <Wrench size={20} color={COLORS.mute} strokeWidth={1.8} />
            </View>
            <Text style={styles.tabLabel}>
              {t('tabServices', 'ಸೇವೆಗಳು')}
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.navTab}
            onPress={() => switchTab('provider-profile')}
            accessibilityRole="tab"
            activeOpacity={0.7}
          >
            <View style={[styles.iconBubble, current.name === 'provider-profile' && styles.iconBubbleActive]}>
              <User
                size={20}
                color={current.name === 'provider-profile' ? COLORS.brand : COLORS.mute}
                strokeWidth={current.name === 'provider-profile' ? 2.4 : 1.8}
              />
            </View>
            <Text style={[styles.tabLabel, current.name === 'provider-profile' && styles.tabLabelActive]}>
              {t('tabProfile', 'ಪ್ರೊಫೈಲ್')}
            </Text>
          </TouchableOpacity>
        </View>
      )}

      {/* Student Partner 5-Tab Navigation Bar */}
      {showStudentTabs && (
        <View style={[styles.bottomNav, { paddingBottom: Math.max(insets.bottom, 8) }]}>
          <TouchableOpacity
            style={styles.navTab}
            onPress={() => switchTab('student-dashboard')}
            accessibilityRole="tab"
            activeOpacity={0.7}
          >
            <View style={[styles.iconBubble, current.name === 'student-dashboard' && styles.iconBubbleActive]}>
              <LayoutDashboard
                size={20}
                color={current.name === 'student-dashboard' ? COLORS.brand : COLORS.mute}
                strokeWidth={current.name === 'student-dashboard' ? 2.4 : 1.8}
              />
            </View>
            <Text style={[styles.tabLabel, current.name === 'student-dashboard' && styles.tabLabelActive]}>
              {t('tabDashboard', 'ಡ್ಯಾಶ್‌ಬೋರ್ಡ್')}
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.navTab}
            onPress={() => go('student-dashboard', { view: 'properties' })}
            accessibilityRole="tab"
            activeOpacity={0.7}
          >
            <View style={styles.iconBubble}>
              <Building2 size={20} color={COLORS.mute} strokeWidth={1.8} />
            </View>
            <Text style={styles.tabLabel}>
              {t('tabProperties', 'ಆಸ್ತಿಗಳು')}
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.navTab}
            onPress={() => go('student-dashboard', { view: 'enquiries' })}
            accessibilityRole="tab"
            activeOpacity={0.7}
          >
            <View style={styles.iconBubble}>
              <Inbox size={20} color={COLORS.mute} strokeWidth={1.8} />
            </View>
            <Text style={styles.tabLabel}>
              {t('tabEnquiries', 'ವಿಚಾರಣೆ')}
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.navTab}
            onPress={() => go('messages')}
            accessibilityRole="tab"
            activeOpacity={0.7}
          >
            <View style={[styles.iconBubble, current.name === 'messages' && styles.iconBubbleActive]}>
              <MessageSquare
                size={20}
                color={current.name === 'messages' ? COLORS.brand : COLORS.mute}
                strokeWidth={current.name === 'messages' ? 2.4 : 1.8}
              />
            </View>
            <Text style={[styles.tabLabel, current.name === 'messages' && styles.tabLabelActive]}>
              {t('tabChat', 'ಸಂದೇಶ')}
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.navTab}
            onPress={() => switchTab('profile')}
            accessibilityRole="tab"
            activeOpacity={0.7}
          >
            <View style={[styles.iconBubble, current.name === 'profile' && styles.iconBubbleActive]}>
              <User
                size={20}
                color={current.name === 'profile' ? COLORS.brand : COLORS.mute}
                strokeWidth={current.name === 'profile' ? 2.4 : 1.8}
              />
            </View>
            <Text style={[styles.tabLabel, current.name === 'profile' && styles.tabLabelActive]}>
              {t('tabProfile', 'ಪ್ರೊಫೈಲ್')}
            </Text>
          </TouchableOpacity>
        </View>
      )}

      {/* Property Owner 5-Tab Navigation Bar */}
      {showOwnerTabs && (
        <View style={[styles.bottomNav, { paddingBottom: Math.max(insets.bottom, 8) }]}>
          <TouchableOpacity
            style={styles.navTab}
            onPress={() => switchTab('owner-dashboard')}
            accessibilityRole="tab"
            activeOpacity={0.7}
          >
            <View style={[styles.iconBubble, current.name === 'owner-dashboard' && styles.iconBubbleActive]}>
              <LayoutDashboard
                size={20}
                color={current.name === 'owner-dashboard' ? COLORS.brand : COLORS.mute}
                strokeWidth={current.name === 'owner-dashboard' ? 2.4 : 1.8}
              />
            </View>
            <Text style={[styles.tabLabel, current.name === 'owner-dashboard' && styles.tabLabelActive]}>
              {t('tabDashboard', 'ಡ್ಯಾಶ್‌ಬೋರ್ಡ್')}
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.navTab}
            onPress={() => go('owner-dashboard', { view: 'properties' })}
            accessibilityRole="tab"
            activeOpacity={0.7}
          >
            <View style={styles.iconBubble}>
              <Building2 size={20} color={COLORS.mute} strokeWidth={1.8} />
            </View>
            <Text style={styles.tabLabel}>
              {t('tabProperties', 'ಆಸ್ತಿಗಳು')}
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.navTab}
            onPress={() => go('owner-dashboard', { view: 'enquiries' })}
            accessibilityRole="tab"
            activeOpacity={0.7}
          >
            <View style={styles.iconBubble}>
              <Inbox size={20} color={COLORS.mute} strokeWidth={1.8} />
            </View>
            <Text style={styles.tabLabel}>
              {t('tabEnquiries', 'ವಿಚಾರಣೆ')}
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.navTab}
            onPress={() => go('messages')}
            accessibilityRole="tab"
            activeOpacity={0.7}
          >
            <View style={[styles.iconBubble, current.name === 'messages' && styles.iconBubbleActive]}>
              <MessageSquare
                size={20}
                color={current.name === 'messages' ? COLORS.brand : COLORS.mute}
                strokeWidth={current.name === 'messages' ? 2.4 : 1.8}
              />
            </View>
            <Text style={[styles.tabLabel, current.name === 'messages' && styles.tabLabelActive]}>
              {t('tabChat', 'ಸಂದೇಶ')}
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.navTab}
            onPress={() => switchTab('profile')}
            accessibilityRole="tab"
            activeOpacity={0.7}
          >
            <View style={[styles.iconBubble, current.name === 'profile' && styles.iconBubbleActive]}>
              <User
                size={20}
                color={current.name === 'profile' ? COLORS.brand : COLORS.mute}
                strokeWidth={current.name === 'profile' ? 2.4 : 1.8}
              />
            </View>
            <Text style={[styles.tabLabel, current.name === 'profile' && styles.tabLabelActive]}>
              {t('tabProfile', 'ಪ್ರೊಫೈಲ್')}
            </Text>
          </TouchableOpacity>
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: COLORS.paper,
  },
  screenContainer: {
    flex: 1,
  },
  bottomNav: {
    flexDirection: 'row',
    backgroundColor: COLORS.white,
    borderTopWidth: 1,
    borderColor: COLORS.line,
    paddingTop: 6,
    paddingHorizontal: 8,
  },
  roleNav: {
    justifyContent: 'space-around',
    paddingHorizontal: 32,
  },
  navTab: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 2,
  },
  iconBubble: {
    width: 36,
    height: 32,
    borderRadius: RADIUS.md,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 2,
  },
  iconBubbleActive: {
    backgroundColor: COLORS.brandTint,
  },
  tabLabel: {
    fontSize: 10,
    fontWeight: '700',
    color: COLORS.mute,
  },
  tabLabelActive: {
    color: COLORS.brand,
    fontWeight: '800',
  },
});
