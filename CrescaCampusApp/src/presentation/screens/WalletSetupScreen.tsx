/**
 * WalletSetupScreen
 * Create a new wallet and show mnemonic - Matches design mockup
 */

import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Alert,
  TouchableOpacity,
  Clipboard,
  SafeAreaView,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { theme } from '../theme';
import { Button, Card } from '../components/common';
import { useWalletStore } from '../stores';

export const WalletSetupScreen: React.FC = () => {
  const navigation = useNavigation();
  const { createWallet, isLoading, error } = useWalletStore();
  
  const [mnemonic, setMnemonic] = useState<string | null>(null);
  const [confirmed, setConfirmed] = useState(false);

  const handleCreateWallet = async () => {
    try {
      const newMnemonic = await createWallet();
      setMnemonic(newMnemonic);
    } catch (err: any) {
      Alert.alert('Error', err.message || 'Failed to create wallet');
    }
  };

  const copyMnemonic = () => {
    if (mnemonic) {
      Clipboard.setString(mnemonic);
      Alert.alert('Copied', 'Mnemonic copied to clipboard');
    }
  };

  const handleConfirm = () => {
    setConfirmed(true);
  };

  const handleDone = () => {
    navigation.goBack();
  };

  // Initial state - before wallet creation
  if (!mnemonic) {
    return (
      <View style={styles.container}>
        <ScrollView contentContainerStyle={styles.content}>
          <Text style={styles.title}>Create New Wallet</Text>
          <Text style={styles.description}>
            You are about to create a new Algorand wallet. This will generate a
            25-word recovery phrase that you MUST save securely.
          </Text>

          <Card style={styles.warningCard}>
            <Text style={styles.warningTitle}>⚠️ Important</Text>
            <Text style={styles.warningText}>
              • Write down your recovery phrase on paper{'\n'}
              • Never share it with anyone{'\n'}
              • Store it in a safe place{'\n'}
              • If you lose it, you lose access to your funds
            </Text>
          </Card>

          <Button
            title="Create Wallet"
            onPress={handleCreateWallet}
            loading={isLoading}
            style={styles.createButton}
          />
          
          <Button
            title="Go Back"
            onPress={() => navigation.goBack()}
            variant="ghost"
          />
        </ScrollView>
      </View>
    );
  }

  // Show mnemonic - after wallet creation (matching design)
  if (!confirmed) {
    const words = mnemonic.split(' ');
    // Split into two columns: 1-13 left, 14-25 right
    const leftColumn = words.slice(0, 13);
    const rightColumn = words.slice(13);

    return (
      <SafeAreaView style={styles.container}>
        <ScrollView contentContainerStyle={styles.mnemonicContent}>
          {/* Header */}
          <View style={styles.header}>
            <TouchableOpacity 
              onPress={() => navigation.goBack()} 
              style={styles.backButton}
            >
              <Text style={styles.backArrow}>‹</Text>
            </TouchableOpacity>
            <Text style={styles.headerLabel}>SECURITY STEP</Text>
            <View style={styles.headerSpacer} />
          </View>

          {/* Title */}
          <Text style={styles.mnemonicTitle}>Your Recovery Phrase</Text>
          <Text style={styles.mnemonicDescription}>
            Write down these 25 words in the exact order and keep them in a safe place. Anyone with this phrase can access your funds.
          </Text>

          {/* Two-column word grid */}
          <View style={styles.columnsContainer}>
            {/* Left Column (1-13) */}
            <View style={styles.column}>
              {leftColumn.map((word, index) => (
                <View key={index} style={styles.wordPill}>
                  <Text style={styles.wordNumber}>
                    {String(index + 1).padStart(2, '0')}
                  </Text>
                  <Text style={styles.wordText}>{word}</Text>
                </View>
              ))}
            </View>

            {/* Right Column (14-25) */}
            <View style={styles.column}>
              {rightColumn.map((word, index) => (
                <View key={index + 13} style={styles.wordPill}>
                  <Text style={styles.wordNumber}>
                    {String(index + 14).padStart(2, '0')}
                  </Text>
                  <Text style={styles.wordText}>{word}</Text>
                </View>
              ))}
            </View>
          </View>

          {/* Copy button */}
          <TouchableOpacity onPress={copyMnemonic} style={styles.copyButton}>
            <Text style={styles.copyIcon}>📋</Text>
            <Text style={styles.copyText}>Tap to copy</Text>
          </TouchableOpacity>

          {/* Warning banner */}
          <View style={styles.warningBanner}>
            <Text style={styles.warningEmoji}>⚠️</Text>
            <Text style={styles.warningBannerText}>
              Do not take a screenshot. Digital copies can be compromised.
            </Text>
          </View>

          {/* Confirm button */}
          <TouchableOpacity style={styles.gradientButton} onPress={handleConfirm}>
            <View style={styles.gradientButtonInner}>
              <Text style={styles.gradientButtonText}>I've Written It Down</Text>
            </View>
          </TouchableOpacity>
        </ScrollView>
      </SafeAreaView>
    );
  }

  // Confirmed - wallet ready
  return (
    <View style={styles.container}>
      <View style={styles.successContainer}>
        <Text style={styles.successEmoji}>✅</Text>
        <Text style={styles.title}>Wallet Created!</Text>
        <Text style={styles.description}>
          Your wallet is ready to use. Make sure you've stored your recovery
          phrase safely.
        </Text>
        
        <Button
          title="Get Started"
          onPress={handleDone}
          style={styles.doneButton}
        />
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  content: {
    padding: theme.spacing.lg,
  },
  title: {
    ...theme.typography.h1,
    color: theme.colors.text,
    textAlign: 'center',
    marginBottom: theme.spacing.md,
  },
  description: {
    ...theme.typography.body,
    color: theme.colors.textSecondary,
    textAlign: 'center',
    marginBottom: theme.spacing.lg,
  },
  warningCard: {
    backgroundColor: 'rgba(255, 178, 0, 0.1)',
    borderColor: theme.colors.warning,
    borderWidth: 1,
    marginBottom: theme.spacing.lg,
  },
  warningTitle: {
    color: theme.colors.warning,
    fontSize: 16,
    fontWeight: '600',
    marginBottom: theme.spacing.sm,
  },
  warningText: {
    color: theme.colors.warning,
    fontSize: 14,
    lineHeight: 22,
  },
  createButton: {
    marginBottom: theme.spacing.md,
  },
  
  // Mnemonic screen styles (matching design)
  mnemonicContent: {
    padding: theme.spacing.lg,
    paddingBottom: theme.spacing.xxl,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: theme.spacing.lg,
  },
  backButton: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  backArrow: {
    color: theme.colors.text,
    fontSize: 32,
    fontWeight: '300',
  },
  headerLabel: {
    color: theme.colors.primary,
    fontSize: 12,
    fontWeight: '600',
    letterSpacing: 1,
  },
  headerSpacer: {
    width: 40,
  },
  mnemonicTitle: {
    fontSize: 28,
    fontWeight: '700',
    color: theme.colors.text,
    marginBottom: theme.spacing.sm,
  },
  mnemonicDescription: {
    fontSize: 14,
    color: theme.colors.textSecondary,
    lineHeight: 20,
    marginBottom: theme.spacing.lg,
  },
  columnsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: theme.spacing.lg,
  },
  column: {
    width: '48%',
  },
  wordPill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#1E1E2E',
    borderRadius: 8,
    paddingVertical: 12,
    paddingHorizontal: 14,
    marginBottom: 8,
  },
  wordNumber: {
    color: theme.colors.primary,
    fontSize: 12,
    fontWeight: '600',
    width: 24,
    marginRight: 8,
  },
  wordText: {
    color: theme.colors.text,
    fontSize: 14,
    fontWeight: '500',
  },
  copyButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: theme.spacing.sm,
    marginBottom: theme.spacing.lg,
  },
  copyIcon: {
    fontSize: 16,
    marginRight: 6,
  },
  copyText: {
    color: theme.colors.primary,
    fontSize: 14,
    fontWeight: '500',
  },
  warningBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 178, 0, 0.1)',
    borderRadius: 12,
    padding: theme.spacing.md,
    marginBottom: theme.spacing.lg,
  },
  warningEmoji: {
    fontSize: 18,
    marginRight: 10,
  },
  warningBannerText: {
    flex: 1,
    color: theme.colors.warning,
    fontSize: 13,
    lineHeight: 18,
  },
  gradientButton: {
    borderRadius: 16,
    overflow: 'hidden',
  },
  gradientButtonInner: {
    backgroundColor: theme.colors.primary,
    paddingVertical: 18,
    alignItems: 'center',
    borderRadius: 16,
  },
  gradientButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  confirmButton: {
    marginTop: theme.spacing.md,
  },
  successContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: theme.spacing.xl,
  },
  successEmoji: {
    fontSize: 64,
    marginBottom: theme.spacing.lg,
  },
  doneButton: {
    marginTop: theme.spacing.xl,
    width: '100%',
  },
});
