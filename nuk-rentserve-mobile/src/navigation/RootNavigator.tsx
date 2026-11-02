// Central Navigation Controller with Stack, Bottom Navigation Bar & Strict RBAC Route Guards

import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  SafeAreaView,
  StatusBar,
  Platform,
  Alert,
} from 'react-native';
import { COLORS, RADIUS } from '../constants/theme';
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

import { AutoBookingScreen } from '../screens/transport/AutoBookingScreen';
import { ScheduledTripScreen } from '../screens/transport/ScheduledTripScreen';
import { LiveTrackingScreen } from '../screens/transport/LiveTrackingScreen';

import { PropertyDetailScreen } from '../screens/rentals/PropertyDetailScreen';
import { ProviderProfileScreen } from '../screens/services/ProviderProfileScreen';
import { ChatScreen } from '../screens/chat/ChatScreen';

import { DriverDashboardScreen } from '../screens/driver/DriverDashboardScreen';
import { DriverOnboardingScreen } from '../screens/driver/DriverOnboardingScreen';
import { ProviderDashboardScreen } from '../screens/provider/ProviderDashboardScreen';
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
  | 'driver-onboarding'
  | 'provider-dashboard'
  | 'owner-dashboard'
  | 'student-dashboard'
  | 'admin-dashboard'
  | 'terms'
  | 'support'
  | 'saved';

interface NavState {
  name: ScreenName;
  params?: any;
}

export const RootNavigator: React.FC = () => {
  const { t } = useLocalization();
  const { user } = useAuth();

  const [stack, setStack] = useState<NavState[]>([{ name: 'splash' }]);
  const [activeTab, setActiveTab] = useState<'home' | 'explore' | 'bookings' | 'messages' | 'profile'>('home');

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
    if (name === 'driver-dashboard' && user?.role !== 'driver' && user?.role !== 'admin') {
      Alert.alert(
        t('Access Denied', 'ಪ್ರವೇಶ ನಿರಾಕರಿಸಲಾಗಿದೆ'),
        t('Only registered drivers can access the driver dashboard.', 'ಕೇವಲ ಚಾಲಕರು ಮಾತ್ರ ಪ್ರವೇಶಿಸಬಹುದು.')
      );
      return;
    }
    if (name === 'provider-dashboard' && user?.role !== 'provider' && user?.role !== 'admin') {
      Alert.alert(
        t('Access Denied', 'ಪ್ರವೇಶ ನಿರಾಕರಿಸಲಾಗಿದೆ'),
        t('Only registered service providers can access the provider dashboard.', 'ಕೇವಲ ನೋಂದಾಯಿತ ಸೇವಾ ಪೂರೈಕೆದಾರರು ಮಾತ್ರ ಪ್ರವೇಶಿಸಬಹುದು.')
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
      setStack((prev) => prev.slice(0, -1));
    }
  };

  const reset = (name: ScreenName, params?: any) => {
    setStack([{ name, params }]);
  };

  const switchTab = (tab: 'home' | 'explore' | 'bookings' | 'messages' | 'profile') => {
    setActiveTab(tab);
    reset(tab);
  };

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

  const isTabScreen = ['home', 'explore', 'bookings', 'messages', 'profile'].includes(current.name);

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
            onOtpLogin={(phone) => go('otp', { phone })}
            onSuccess={() => {
              if (user?.role === 'provider') reset('provider-dashboard');
              else if (user?.role === 'driver') reset('driver-dashboard');
              else if (user?.role === 'admin') reset('admin-dashboard');
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
          />
        );
      case 'register-driver':
        return (
          <DriverRegisterScreen
            onLogin={() => go('login')}
            onReadTerms={() => go('terms', { role: 'Auto/Car Driver' })}
            onSuccess={() => reset('driver-dashboard')}
          />
        );
      case 'register-student':
        return (
          <StudentRegisterScreen
            onLogin={() => go('login')}
            onReadTerms={() => go('terms', { role: 'Student Rental Partner' })}
            onSuccess={() => reset('student-dashboard')}
          />
        );
      case 'register-provider':
        return (
          <ProviderRegisterScreen
            onLogin={() => go('login')}
            onReadTerms={() => go('terms', { role: 'Service Provider' })}
            onSuccess={() => reset('provider-dashboard')}
          />
        );
      case 'admin-login':
        return (
          <AdminLoginScreen
            onBackToApp={() => go('login')}
            onSuccess={() => reset('admin-dashboard')}
          />
        );
      case 'register':
        return (
          <RegisterScreen
            onLogin={() => go('login')}
            onReadTerms={(role) => go('terms', { role })}
            onSuccess={() => reset('home')}
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

      // 5 Main Tabs
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
                name: driver.name,
                role: driver.vehicleModel,
                phone: driver.phone,
              })
            }
          />
        );
      case 'sched':
        return (
          <ScheduledTripScreen
            initialKind={current.params?.kind || 'car'}
            onBack={back}
            onSuccess={(ref) => {
              switchTab('bookings');
            }}
          />
        );
      case 'live-tracking':
        return (
          <LiveTrackingScreen
            onBack={back}
            onOpenChat={() =>
              go('chat', {
                name: 'Ravi Kumar',
                role: 'Auto Driver · KA 29 B 4821',
                phone: '+919845012345',
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
            onOpenChat={() =>
              go('chat', {
                name: 'Suresh Hiremath',
                role: 'Property Owner',
                phone: '+919845012345',
              })
            }
          />
        );
      case 'provider':
        return (
          <ProviderProfileScreen
            providerId={current.params?.id || 's1'}
            onBack={back}
            onOpenChat={() =>
              go('chat', {
                name: 'Manjunath Electricals',
                role: 'Electrician',
                phone: '+919845012345',
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
      case 'driver-dashboard':
        return (
          <DriverDashboardScreen
            onBack={back}
            onNavigateOnboarding={() => go('driver-onboarding')}
          />
        );
      case 'driver-onboarding':
        return (
          <DriverOnboardingScreen
            onBack={back}
            onSuccess={() => reset('driver-dashboard')}
          />
        );
      case 'provider-dashboard':
        return (
          <ProviderDashboardScreen
            onBack={back}
            onOpenChat={(params) => go('chat', params)}
          />
        );
      case 'owner-dashboard':
        return <OwnerDashboardScreen onBack={back} />;
      case 'student-dashboard':
        return (
          <StudentDashboardScreen
            onBack={back}
            onAddProperty={() => go('owner-dashboard')}
          />
        );
      case 'admin-dashboard':
        return <AdminDashboardScreen onBack={back} />;
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
    <SafeAreaView style={styles.safe}>
      <StatusBar barStyle="dark-content" backgroundColor={COLORS.white} />
      <View style={styles.screenContainer}>{renderScreen()}</View>

      {/* Bottom Navigation Bar */}
      {isTabScreen && (
        <View style={styles.bottomNav}>
          <TouchableOpacity
            style={styles.navTab}
            onPress={() => switchTab('home')}
            accessibilityRole="tab"
          >
            <View style={[styles.iconBubble, activeTab === 'home' && styles.iconBubbleActive]}>
              <Text style={styles.tabEmoji}>🏠</Text>
            </View>
            <Text style={[styles.tabLabel, activeTab === 'home' && styles.tabLabelActive]}>
              {t('tabHome', 'ಮುಖಪುಟ')}
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.navTab}
            onPress={() => switchTab('explore')}
            accessibilityRole="tab"
          >
            <View style={[styles.iconBubble, activeTab === 'explore' && styles.iconBubbleActive]}>
              <Text style={styles.tabEmoji}>🔍</Text>
            </View>
            <Text style={[styles.tabLabel, activeTab === 'explore' && styles.tabLabelActive]}>
              {t('tabExplore', 'ಶೋಧಿಸಿ')}
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.navTab}
            onPress={() => switchTab('bookings')}
            accessibilityRole="tab"
          >
            <View style={[styles.iconBubble, activeTab === 'bookings' && styles.iconBubbleActive]}>
              <Text style={styles.tabEmoji}>📅</Text>
            </View>
            <Text style={[styles.tabLabel, activeTab === 'bookings' && styles.tabLabelActive]}>
              {t('tabBookings', 'ಬುಕಿಂಗ್')}
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.navTab}
            onPress={() => switchTab('messages')}
            accessibilityRole="tab"
          >
            <View style={[styles.iconBubble, activeTab === 'messages' && styles.iconBubbleActive]}>
              <Text style={styles.tabEmoji}>💬</Text>
            </View>
            <Text style={[styles.tabLabel, activeTab === 'messages' && styles.tabLabelActive]}>
              {t('tabChat', 'ಸಂದೇಶ')}
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.navTab}
            onPress={() => switchTab('profile')}
            accessibilityRole="tab"
          >
            <View style={[styles.iconBubble, activeTab === 'profile' && styles.iconBubbleActive]}>
              <Text style={styles.tabEmoji}>👤</Text>
            </View>
            <Text style={[styles.tabLabel, activeTab === 'profile' && styles.tabLabelActive]}>
              {t('tabProfile', 'ಪ್ರೊಫೈಲ್')}
            </Text>
          </TouchableOpacity>
        </View>
      )}
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: COLORS.paper,
  },
  screenContainer: {
    flex: 1,
  },
  bottomNav: {
    flexDirection: 'row',
    backgroundColor: COLORS.white,
    borderTopWidth: 1.5,
    borderColor: COLORS.line,
    paddingVertical: 8,
    paddingHorizontal: 8,
  },
  navTab: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconBubble: {
    width: 36,
    height: 36,
    borderRadius: RADIUS.full,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 2,
  },
  iconBubbleActive: {
    backgroundColor: COLORS.brandTint,
  },
  tabEmoji: {
    fontSize: 18,
  },
  tabLabel: {
    fontSize: 11,
    fontWeight: '700',
    color: COLORS.mute,
  },
  tabLabelActive: {
    color: COLORS.brand,
    fontWeight: '900',
  },
});
