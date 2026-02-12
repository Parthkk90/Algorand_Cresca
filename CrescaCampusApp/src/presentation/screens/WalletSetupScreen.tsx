/**
 * WalletSetupScreen
 * Create a new wallet and show mnemonic
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

  // Show mnemonic - after wallet creation
  if (!confirmed) {
    const words = mnemonic.split(' ');

    return (
      <View style={styles.container}>
        <ScrollView contentContainerStyle={styles.content}>
          <Text style={styles.title}>Your Recovery Phrase</Text>
          <Text style={styles.description}>
            Write down these 25 words in order. This is the ONLY way to recover
            your wallet.
          </Text>

          <Card style={styles.mnemonicCard}>
            <View style={styles.wordsGrid}>
              {words.map((word, index) => (
                <View key={index} style={styles.wordContainer}>
                  <Text style={styles.wordNumber}>{index + 1}</Text>
                  <Text style={styles.wordText}>{word}</Text>
                </View>
              ))}
            </View>
          </Card>

          <TouchableOpacity onPress={copyMnemonic} style={styles.copyButton}>
            <Text style={styles.copyText}>📋 Tap to copy</Text>
          </TouchableOpacity>

          <Card style={styles.warningCard}>
            <Text style={styles.warningText}>
              ⚠️ Never share this phrase. Anyone with these words can steal your
              funds.
            </Text>
          </Card>

          <Button
            title="I've Written It Down"
            onPress={handleConfirm}
            style={styles.confirmButton}
          />
        </ScrollView>
      </View>
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
  mnemonicCard: {
    backgroundColor: theme.colors.surfaceLight,
    marginBottom: theme.spacing.md,
  },
  wordsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  wordContainer: {
    width: '30%',
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: theme.spacing.sm,
    backgroundColor: theme.colors.surface,
    borderRadius: theme.borderRadius.sm,
    padding: theme.spacing.sm,
  },
  wordNumber: {
    color: theme.colors.textMuted,
    fontSize: 10,
    width: 18,
  },
  wordText: {
    color: theme.colors.text,
    fontSize: 12,
    fontFamily: 'monospace',
  },
  copyButton: {
    alignSelf: 'center',
    marginBottom: theme.spacing.lg,
  },
  copyText: {
    color: theme.colors.primary,
    fontSize: 14,
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
