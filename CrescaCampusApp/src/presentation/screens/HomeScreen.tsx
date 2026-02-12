/**
 * HomeScreen
 * Main dashboard showing wallet balance and quick actions - Matches design mockup
 */

import React, { useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
  SafeAreaView,
  Image,
  Clipboard,
  Alert,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { theme } from '../theme';
import { Card, Button, Loading } from '../components/common';
import { useWalletStore } from '../stores';
import { AlgorandConfig } from '../../core/config/algorand.config';

// Feature icons as emoji (in production, use proper icons)
const FEATURES = [
  {
    id: 'expenses',
    title: 'Split Expenses',
    description: 'Instantly divide bills with campus peers.',
    icon: '💸',
    route: 'Expenses',
    color: '#2D7A4F',
  },
  {
    id: 'treasury',
    title: 'DAO Treasury',
    description: 'Govern student council funds on-chain.',
    icon: '🏛️',
    route: 'Treasury',
    color: '#4A3F8C',
  },
  {
    id: 'tickets',
    title: 'Event Tickets',
    description: 'Secure NFT tickets for campus events.',
    icon: '🎫',
    route: 'Tickets',
    color: '#8C3F5E',
  },
  {
    id: 'fundraise',
    title: 'Fundraising',
    description: 'Back student projects and startups.',
    icon: '🚀',
    route: 'Fundraise',
    color: '#8C6B3F',
  },
];

// Mock recent activity data
const RECENT_ACTIVITY = [
  {
    id: '1',
    type: 'send',
    label: 'To: Campus Cafe',
    date: 'Today, 11:24 AM',
    amount: -12.50,
    status: 'Confirmed',
  },
  {
    id: '2',
    type: 'receive',
    label: 'From: DAO Rewards',
    date: 'Yesterday, 04:12 PM',
    amount: 50.00,
    status: 'Confirmed',
  },
];

export const HomeScreen: React.FC = () => {
  const navigation = useNavigation();
  const {
    address,
    balance,
    balanceAlgo,
    isLoading,
    accountInfo,
    refreshBalance,
    getAccountInfo,
    disconnect,
  } = useWalletStore();

  const [refreshing, setRefreshing] = React.useState(false);

  useEffect(() => {
    if (address) {
      getAccountInfo();
    }
  }, [address]);

  const onRefresh = async () => {
    setRefreshing(true);
    await refreshBalance();
    await getAccountInfo();
    setRefreshing(false);
  };

  const formatAddress = (addr: string) => {
    return `${addr.slice(0, 4)}...${addr.slice(-4)}`;
  };

  const copyAddress = () => {
    if (address) {
      Clipboard.setString(address);
      Alert.alert('Copied', 'Address copied to clipboard');
    }
  };

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good Morning,';
    if (hour < 17) return 'Good Afternoon,';
    return 'Good Evening,';
  };

  // Welcome screen (no wallet connected) - matching design
  if (!address) {
    return (
      <SafeAreaView style={styles.welcomeContainer}>
        {/* Diagonal stripe background effect */}
        <View style={styles.stripeBackground}>
          {[...Array(10)].map((_, i) => (
            <View key={i} style={[styles.stripe, { top: i * 80 - 200, left: -100 + i * 40 }]} />
          ))}
        </View>

        <View style={styles.welcomeContent}>
          {/* Logo */}
          <View style={styles.logoContainer}>
            <View style={styles.logoBox}>
              <Text style={styles.logoIcon}>💳</Text>
            </View>
          </View>

          {/* Title with gradient effect */}
          <Text style={styles.welcomeTitle}>
            Welcome to{'\n'}
            <Text style={styles.welcomeTitleWhite}>Cresca </Text>
            <Text style={styles.welcomeTitlePurple}>Campus</Text>
          </Text>

          {/* Subtitle */}
          <Text style={styles.welcomeSubtitle}>
            Decentralized campus finance{'\n'}on <Text style={styles.algorandText}>Algorand</Text>
          </Text>

          {/* Feature badges */}
          <View style={styles.badgesRow}>
            <View style={styles.badge}>
              <Text style={styles.badgeIcon}>⚡</Text>
              <Text style={styles.badgeText}>INSTANT</Text>
            </View>
            <View style={styles.badge}>
              <Text style={styles.badgeIcon}>🛡️</Text>
              <Text style={styles.badgeText}>SECURE</Text>
            </View>
            <View style={styles.badge}>
              <Text style={styles.badgeIcon}>💎</Text>
              <Text style={styles.badgeText}>DEFI</Text>
            </View>
          </View>

          {/* Buttons */}
          <TouchableOpacity
            style={styles.createWalletButton}
            onPress={() => navigation.navigate('WalletSetup' as never)}
          >
            <Text style={styles.createWalletText}>Create Wallet</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.importWalletButton}
            onPress={() => navigation.navigate('ImportWallet' as never)}
          >
            <Text style={styles.importWalletText}>Import Wallet</Text>
          </TouchableOpacity>

          {/* Terms */}
          <Text style={styles.termsText}>
            By creating or importing a wallet, you agree to the{'\n'}
            <Text style={styles.termsLink}>Terms of Service</Text> & <Text style={styles.termsLink}>Privacy Policy</Text>
          </Text>
        </View>
      </SafeAreaView>
    );
  }

  // Main dashboard (wallet connected) - matching design
  return (
    <SafeAreaView style={styles.container}>
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.content}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor={theme.colors.primary}
          />
        }
      >
        {/* Header */}
        <View style={styles.header}>
          <View>
            <Text style={styles.greeting}>{getGreeting()}</Text>
            <Text style={styles.userName}>User</Text>
          </View>
          <View style={styles.headerRight}>
            <TouchableOpacity style={styles.notificationButton}>
              <Text style={styles.notificationIcon}>🔔</Text>
            </TouchableOpacity>
            <View style={styles.avatarContainer}>
              <Text style={styles.avatarText}>👤</Text>
            </View>
          </View>
        </View>

        {/* Balance Card */}
        <View style={styles.balanceCard}>
          <View style={styles.balanceHeader}>
            <Text style={styles.balanceLabel}>CURRENT BALANCE</Text>
            <TouchableOpacity style={styles.addressPill} onPress={copyAddress}>
              <Text style={styles.addressText}>{formatAddress(address)}</Text>
              <Text style={styles.copyIcon}>📋</Text>
            </TouchableOpacity>
          </View>
          
          <Text style={styles.balanceAmount}>
            {balanceAlgo.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            <Text style={styles.balanceCurrency}> ALGO</Text>
          </Text>

          <View style={styles.balanceFooter}>
            <View style={styles.tokenIcons}>
              <View style={[styles.tokenIcon, { backgroundColor: '#FFD700' }]} />
              <View style={[styles.tokenIcon, { backgroundColor: '#FFA500', marginLeft: -8 }]} />
              {accountInfo && accountInfo.assets.length > 0 && (
                <Text style={styles.tokenCount}>+{accountInfo.assets.length}</Text>
              )}
            </View>
            <View style={styles.networkBadge}>
              <Text style={styles.networkLabel}>NETWORK</Text>
              <View style={styles.networkValue}>
                <View style={styles.networkDot} />
                <Text style={styles.networkText}>
                  Algorand {AlgorandConfig.network.charAt(0).toUpperCase() + AlgorandConfig.network.slice(1)}
                </Text>
              </View>
            </View>
          </View>
        </View>

        {/* Feature Cards Grid */}
        <View style={styles.featuresGrid}>
          {FEATURES.map((feature) => (
            <TouchableOpacity
              key={feature.id}
              style={styles.featureCard}
              onPress={() => navigation.navigate(feature.route as never)}
            >
              <View style={[styles.featureIconContainer, { backgroundColor: feature.color + '30' }]}>
                <Text style={styles.featureIcon}>{feature.icon}</Text>
              </View>
              <Text style={styles.featureTitle}>{feature.title}</Text>
              <Text style={styles.featureDesc}>{feature.description}</Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Recent Activity */}
        <View style={styles.activitySection}>
          <View style={styles.activityHeader}>
            <Text style={styles.activityTitle}>Recent Activity</Text>
            <TouchableOpacity>
              <Text style={styles.seeAllText}>SEE ALL</Text>
            </TouchableOpacity>
          </View>

          {RECENT_ACTIVITY.map((activity) => (
            <View key={activity.id} style={styles.activityItem}>
              <View style={[
                styles.activityIcon,
                { backgroundColor: activity.type === 'send' ? '#FF525220' : '#00E67620' }
              ]}>
                <Text style={styles.activityIconText}>
                  {activity.type === 'send' ? '↗' : '↙'}
                </Text>
              </View>
              <View style={styles.activityInfo}>
                <Text style={styles.activityLabel}>{activity.label}</Text>
                <Text style={styles.activityDate}>{activity.date}</Text>
              </View>
              <View style={styles.activityAmountContainer}>
                <Text style={[
                  styles.activityAmount,
                  { color: activity.amount < 0 ? '#FF5252' : '#00E676' }
                ]}>
                  {activity.amount < 0 ? '' : '+'}{activity.amount.toFixed(2)} ALGO
                </Text>
                <Text style={styles.activityStatus}>{activity.status}</Text>
              </View>
            </View>
          ))}
        </View>

        {/* Disconnect Button */}
        <TouchableOpacity style={styles.disconnectButton} onPress={disconnect}>
          <Text style={styles.disconnectText}>Disconnect Wallet</Text>
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  // Welcome screen styles
  welcomeContainer: {
    flex: 1,
    backgroundColor: '#0D0D0D',
  },
  stripeBackground: {
    ...StyleSheet.absoluteFillObject,
    overflow: 'hidden',
  },
  stripe: {
    position: 'absolute',
    width: 500,
    height: 1,
    backgroundColor: '#1A1A2E',
    transform: [{ rotate: '-45deg' }],
  },
  welcomeContent: {
    flex: 1,
    paddingHorizontal: 24,
    justifyContent: 'center',
    alignItems: 'center',
  },
  logoContainer: {
    marginBottom: 32,
  },
  logoBox: {
    width: 80,
    height: 80,
    borderRadius: 20,
    backgroundColor: '#1A1A2E',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: theme.colors.primary + '40',
  },
  logoIcon: {
    fontSize: 36,
  },
  welcomeTitle: {
    fontSize: 36,
    fontWeight: '700',
    textAlign: 'center',
    marginBottom: 16,
    lineHeight: 44,
  },
  welcomeTitleWhite: {
    color: '#FFFFFF',
  },
  welcomeTitlePurple: {
    color: theme.colors.primary,
  },
  welcomeSubtitle: {
    fontSize: 18,
    color: theme.colors.textSecondary,
    textAlign: 'center',
    marginBottom: 40,
    lineHeight: 26,
  },
  algorandText: {
    color: theme.colors.primary,
    fontWeight: '500',
  },
  badgesRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginBottom: 40,
    gap: 12,
  },
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#1A1A2E',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#2A2A3E',
  },
  badgeIcon: {
    fontSize: 14,
    marginRight: 6,
  },
  badgeText: {
    color: theme.colors.textSecondary,
    fontSize: 12,
    fontWeight: '600',
    letterSpacing: 0.5,
  },
  createWalletButton: {
    width: '100%',
    backgroundColor: theme.colors.primary,
    paddingVertical: 18,
    borderRadius: 16,
    marginBottom: 12,
    shadowColor: theme.colors.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 12,
    elevation: 8,
  },
  createWalletText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
    textAlign: 'center',
  },
  importWalletButton: {
    width: '100%',
    backgroundColor: 'transparent',
    paddingVertical: 18,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#3A3A4E',
    marginBottom: 24,
  },
  importWalletText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
    textAlign: 'center',
  },
  termsText: {
    color: theme.colors.textMuted,
    fontSize: 12,
    textAlign: 'center',
    lineHeight: 18,
  },
  termsLink: {
    color: theme.colors.textSecondary,
    textDecorationLine: 'underline',
  },

  // Dashboard styles
  container: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  scrollView: {
    flex: 1,
  },
  content: {
    padding: 16,
    paddingBottom: 100,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  greeting: {
    color: theme.colors.primary,
    fontSize: 14,
    fontWeight: '500',
  },
  userName: {
    color: '#FFFFFF',
    fontSize: 24,
    fontWeight: '700',
  },
  headerRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  notificationButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#1A1A2E',
    justifyContent: 'center',
    alignItems: 'center',
  },
  notificationIcon: {
    fontSize: 20,
  },
  avatarContainer: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#2A2A3E',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: theme.colors.primary,
  },
  avatarText: {
    fontSize: 20,
  },

  // Balance Card
  balanceCard: {
    backgroundColor: theme.colors.primary,
    borderRadius: 20,
    padding: 20,
    marginBottom: 20,
    shadowColor: theme.colors.primary,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.3,
    shadowRadius: 16,
    elevation: 8,
  },
  balanceHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  balanceLabel: {
    color: 'rgba(255,255,255,0.7)',
    fontSize: 11,
    fontWeight: '600',
    letterSpacing: 0.5,
  },
  addressPill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.2)',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
  },
  addressText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontFamily: 'monospace',
    marginRight: 6,
  },
  copyIcon: {
    fontSize: 12,
  },
  balanceAmount: {
    color: '#FFFFFF',
    fontSize: 40,
    fontWeight: '700',
    marginBottom: 16,
  },
  balanceCurrency: {
    fontSize: 18,
    fontWeight: '500',
    color: 'rgba(255,255,255,0.8)',
  },
  balanceFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
  },
  tokenIcons: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  tokenIcon: {
    width: 28,
    height: 28,
    borderRadius: 14,
    borderWidth: 2,
    borderColor: theme.colors.primary,
  },
  tokenCount: {
    color: 'rgba(255,255,255,0.7)',
    fontSize: 12,
    marginLeft: 8,
  },
  networkBadge: {
    alignItems: 'flex-end',
  },
  networkLabel: {
    color: 'rgba(255,255,255,0.6)',
    fontSize: 10,
    fontWeight: '600',
    letterSpacing: 0.5,
    marginBottom: 4,
  },
  networkValue: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  networkDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#00E676',
    marginRight: 6,
  },
  networkText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '500',
  },

  // Feature Cards
  featuresGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    marginBottom: 24,
  },
  featureCard: {
    width: '48%',
    backgroundColor: '#1A1A2E',
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
  },
  featureIconContainer: {
    width: 48,
    height: 48,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
  },
  featureIcon: {
    fontSize: 24,
  },
  featureTitle: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 4,
  },
  featureDesc: {
    color: theme.colors.textSecondary,
    fontSize: 12,
    lineHeight: 16,
  },

  // Recent Activity
  activitySection: {
    marginBottom: 24,
  },
  activityHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  activityTitle: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: '600',
  },
  seeAllText: {
    color: theme.colors.primary,
    fontSize: 12,
    fontWeight: '600',
  },
  activityItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#1A1A2E',
    borderRadius: 12,
    padding: 14,
    marginBottom: 10,
  },
  activityIcon: {
    width: 40,
    height: 40,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  activityIconText: {
    fontSize: 18,
    color: '#FFFFFF',
  },
  activityInfo: {
    flex: 1,
  },
  activityLabel: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '500',
    marginBottom: 2,
  },
  activityDate: {
    color: theme.colors.textSecondary,
    fontSize: 12,
  },
  activityAmountContainer: {
    alignItems: 'flex-end',
  },
  activityAmount: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 2,
  },
  activityStatus: {
    color: theme.colors.textSecondary,
    fontSize: 11,
  },

  // Disconnect
  disconnectButton: {
    paddingVertical: 16,
    alignItems: 'center',
  },
  disconnectText: {
    color: theme.colors.textMuted,
    fontSize: 14,
  },
});
