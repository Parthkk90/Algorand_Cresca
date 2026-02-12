/**
 * HomeScreen
 * Main dashboard showing wallet balance and quick actions
 */

import React, { useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { theme } from '../theme';
import { Card, Button, Loading } from '../components/common';
import { useWalletStore } from '../stores';
import { ALGORAND_CONFIG } from '../../core/config/algorand.config';

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
    return `${addr.slice(0, 8)}...${addr.slice(-8)}`;
  };

  const openExplorer = () => {
    if (address) {
      const explorerUrl = `${ALGORAND_CONFIG.explorerUrl}/address/${address}`;
      // In production, use Linking.openURL(explorerUrl)
      console.log('Open explorer:', explorerUrl);
    }
  };

  if (!address) {
    return (
      <View style={styles.container}>
        <View style={styles.noWalletContainer}>
          <Text style={styles.title}>Welcome to Cresca Campus</Text>
          <Text style={styles.subtitle}>
            Decentralized campus finance on Algorand
          </Text>
          <Button
            title="Create Wallet"
            onPress={() => navigation.navigate('WalletSetup' as never)}
            style={styles.createButton}
          />
          <Button
            title="Import Wallet"
            onPress={() => navigation.navigate('ImportWallet' as never)}
            variant="outline"
          />
        </View>
      </View>
    );
  }

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.content}
      refreshControl={
        <RefreshControl
          refreshing={refreshing}
          onRefresh={onRefresh}
          tintColor={theme.colors.primary}
        />
      }
    >
      {/* Wallet Card */}
      <Card variant="elevated" style={styles.walletCard}>
        <Text style={styles.walletLabel}>Your Balance</Text>
        <Text style={styles.balanceText}>{balanceAlgo.toFixed(4)} ALGO</Text>
        <Text style={styles.balanceMicro}>{balance.toLocaleString()} microALGO</Text>
        
        <TouchableOpacity onPress={openExplorer} style={styles.addressContainer}>
          <Text style={styles.addressLabel}>Address</Text>
          <Text style={styles.addressText}>{formatAddress(address)}</Text>
        </TouchableOpacity>
      </Card>

      {/* Network Info */}
      <Card style={styles.networkCard}>
        <Text style={styles.networkLabel}>Network</Text>
        <View style={styles.networkInfo}>
          <View style={styles.networkDot} />
          <Text style={styles.networkText}>
            {ALGORAND_CONFIG.network.charAt(0).toUpperCase() + ALGORAND_CONFIG.network.slice(1)}
          </Text>
        </View>
      </Card>

      {/* Quick Actions */}
      <Text style={styles.sectionTitle}>Features</Text>
      
      <View style={styles.featuresGrid}>
        <TouchableOpacity
          style={styles.featureCard}
          onPress={() => navigation.navigate('Expenses' as never)}
        >
          <Text style={styles.featureEmoji}>💸</Text>
          <Text style={styles.featureTitle}>Split Expenses</Text>
          <Text style={styles.featureDesc}>Split bills with friends</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.featureCard}
          onPress={() => navigation.navigate('Treasury' as never)}
        >
          <Text style={styles.featureEmoji}>🏛️</Text>
          <Text style={styles.featureTitle}>DAO Treasury</Text>
          <Text style={styles.featureDesc}>Manage club funds</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.featureCard}
          onPress={() => navigation.navigate('Tickets' as never)}
        >
          <Text style={styles.featureEmoji}>🎫</Text>
          <Text style={styles.featureTitle}>Event Tickets</Text>
          <Text style={styles.featureDesc}>Soulbound NFT tickets</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.featureCard}
          onPress={() => navigation.navigate('Fundraise' as never)}
        >
          <Text style={styles.featureEmoji}>🎯</Text>
          <Text style={styles.featureTitle}>Fundraising</Text>
          <Text style={styles.featureDesc}>Crowdfund projects</Text>
        </TouchableOpacity>
      </View>

      {/* Account Info */}
      {accountInfo && (
        <Card style={styles.infoCard}>
          <Text style={styles.infoTitle}>Account Details</Text>
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Min Balance</Text>
            <Text style={styles.infoValue}>
              {(accountInfo.minBalance / 1_000_000).toFixed(4)} ALGO
            </Text>
          </View>
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Apps Opted In</Text>
            <Text style={styles.infoValue}>{accountInfo.appsOptedIn.length}</Text>
          </View>
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Assets Held</Text>
            <Text style={styles.infoValue}>{accountInfo.assets.length}</Text>
          </View>
        </Card>
      )}

      {/* Disconnect Button */}
      <Button
        title="Disconnect Wallet"
        onPress={disconnect}
        variant="ghost"
        style={styles.disconnectButton}
      />
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  content: {
    padding: theme.spacing.md,
  },
  noWalletContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: theme.spacing.xl,
  },
  title: {
    ...theme.typography.h1,
    color: theme.colors.text,
    textAlign: 'center',
    marginBottom: theme.spacing.sm,
  },
  subtitle: {
    ...theme.typography.body,
    color: theme.colors.textSecondary,
    textAlign: 'center',
    marginBottom: theme.spacing.xl,
  },
  createButton: {
    marginBottom: theme.spacing.md,
    width: '100%',
  },
  walletCard: {
    alignItems: 'center',
    paddingVertical: theme.spacing.xl,
    marginBottom: theme.spacing.md,
    backgroundColor: theme.colors.primary,
  },
  walletLabel: {
    color: 'rgba(255,255,255,0.7)',
    fontSize: 14,
    marginBottom: theme.spacing.xs,
  },
  balanceText: {
    color: '#FFFFFF',
    fontSize: 36,
    fontWeight: '700',
  },
  balanceMicro: {
    color: 'rgba(255,255,255,0.7)',
    fontSize: 14,
    marginTop: theme.spacing.xs,
  },
  addressContainer: {
    marginTop: theme.spacing.lg,
    alignItems: 'center',
  },
  addressLabel: {
    color: 'rgba(255,255,255,0.7)',
    fontSize: 12,
    marginBottom: theme.spacing.xs,
  },
  addressText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontFamily: 'monospace',
  },
  networkCard: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: theme.spacing.lg,
  },
  networkLabel: {
    color: theme.colors.textSecondary,
    fontSize: 14,
  },
  networkInfo: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  networkDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: theme.colors.success,
    marginRight: theme.spacing.xs,
  },
  networkText: {
    color: theme.colors.text,
    fontSize: 14,
    fontWeight: '500',
  },
  sectionTitle: {
    ...theme.typography.h3,
    color: theme.colors.text,
    marginBottom: theme.spacing.md,
  },
  featuresGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    marginBottom: theme.spacing.lg,
  },
  featureCard: {
    width: '48%',
    backgroundColor: theme.colors.card,
    borderRadius: theme.borderRadius.lg,
    padding: theme.spacing.md,
    marginBottom: theme.spacing.md,
    alignItems: 'center',
  },
  featureEmoji: {
    fontSize: 32,
    marginBottom: theme.spacing.sm,
  },
  featureTitle: {
    color: theme.colors.text,
    fontSize: 14,
    fontWeight: '600',
    marginBottom: theme.spacing.xs,
  },
  featureDesc: {
    color: theme.colors.textSecondary,
    fontSize: 12,
    textAlign: 'center',
  },
  infoCard: {
    marginBottom: theme.spacing.md,
  },
  infoTitle: {
    color: theme.colors.text,
    fontSize: 16,
    fontWeight: '600',
    marginBottom: theme.spacing.md,
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: theme.spacing.sm,
  },
  infoLabel: {
    color: theme.colors.textSecondary,
    fontSize: 14,
  },
  infoValue: {
    color: theme.colors.text,
    fontSize: 14,
    fontWeight: '500',
  },
  disconnectButton: {
    marginTop: theme.spacing.md,
    marginBottom: theme.spacing.xxl,
  },
});
