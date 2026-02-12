/**
 * ImportWalletScreen
 * Import an existing wallet using mnemonic - Matches design mockup
 */

import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Alert,
  TextInput,
  TouchableOpacity,
  SafeAreaView,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { theme } from '../theme';
import { Button, Card } from '../components/common';
import { useWalletStore } from '../stores';

export const ImportWalletScreen: React.FC = () => {
  const navigation = useNavigation();
  const { importWallet, isLoading, error } = useWalletStore();
  
  const [mnemonic, setMnemonic] = useState('');

  const wordCount = mnemonic.trim() ? mnemonic.trim().split(/\s+/).length : 0;

  const handleImport = async () => {
    const cleanedMnemonic = mnemonic.trim().toLowerCase();
    const words = cleanedMnemonic.split(/\s+/);

    if (words.length !== 25) {
      Alert.alert(
        'Invalid Mnemonic',
        'Please enter all 25 words of your recovery phrase.'
      );
      return;
    }

    try {
      await importWallet(cleanedMnemonic);
      Alert.alert('Success', 'Wallet imported successfully!', [
        { text: 'OK', onPress: () => navigation.goBack() },
      ]);
    } catch (err: any) {
      Alert.alert('Error', err.message || 'Failed to import wallet');
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.content}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity 
            onPress={() => navigation.goBack()} 
            style={styles.backButton}
          >
            <Text style={styles.backArrow}>‹</Text>
          </TouchableOpacity>
          <Text style={styles.headerLabel}>IMPORT</Text>
          <View style={styles.headerSpacer} />
        </View>

        <Text style={styles.title}>Import Wallet</Text>
        <Text style={styles.description}>
          Enter your 25-word recovery phrase to restore your wallet.
        </Text>

        {/* Input Card */}
        <View style={styles.inputCard}>
          <TextInput
            style={styles.mnemonicInput}
            placeholder="Enter your 25-word recovery phrase..."
            placeholderTextColor={theme.colors.textMuted}
            multiline
            numberOfLines={5}
            value={mnemonic}
            onChangeText={setMnemonic}
            autoCapitalize="none"
            autoCorrect={false}
            textAlignVertical="top"
          />
          <Text style={styles.wordCounter}>
            {wordCount}/25 words
          </Text>
        </View>

        <Text style={styles.hint}>
          Separate each word with a space. Words are case-insensitive.
        </Text>

        {/* Warning */}
        <View style={styles.warningBanner}>
          <Text style={styles.warningEmoji}>⚠️</Text>
          <Text style={styles.warningText}>
            Only import wallets on trusted devices. Never enter your recovery phrase on websites or share it with anyone.
          </Text>
        </View>

        {/* Import Button */}
        <TouchableOpacity
          style={[
            styles.importButton,
            wordCount !== 25 && styles.importButtonDisabled
          ]}
          onPress={handleImport}
          disabled={wordCount !== 25 || isLoading}
        >
          <Text style={[
            styles.importButtonText,
            wordCount !== 25 && styles.importButtonTextDisabled
          ]}>
            {isLoading ? 'Importing...' : 'Import Wallet'}
          </Text>
        </TouchableOpacity>

        {/* Cancel */}
        <TouchableOpacity 
          style={styles.cancelButton}
          onPress={() => navigation.goBack()}
        >
          <Text style={styles.cancelText}>Cancel</Text>
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
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
  title: {
    fontSize: 28,
    fontWeight: '700',
    color: theme.colors.text,
    marginBottom: theme.spacing.sm,
  },
  description: {
    fontSize: 14,
    color: theme.colors.textSecondary,
    lineHeight: 20,
    marginBottom: theme.spacing.lg,
  },
  inputCard: {
    backgroundColor: '#1E1E2E',
    borderRadius: 12,
    padding: theme.spacing.md,
    marginBottom: theme.spacing.sm,
  },
  mnemonicInput: {
    color: theme.colors.text,
    fontSize: 16,
    minHeight: 120,
    lineHeight: 24,
  },
  wordCounter: {
    color: theme.colors.textMuted,
    fontSize: 12,
    textAlign: 'right',
    marginTop: theme.spacing.sm,
  },
  hint: {
    color: theme.colors.textSecondary,
    fontSize: 12,
    marginBottom: theme.spacing.lg,
  },
  warningBanner: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: 'rgba(255, 178, 0, 0.1)',
    borderRadius: 12,
    padding: theme.spacing.md,
    marginBottom: theme.spacing.xl,
  },
  warningEmoji: {
    fontSize: 18,
    marginRight: 10,
  },
  warningText: {
    flex: 1,
    color: theme.colors.warning,
    fontSize: 13,
    lineHeight: 18,
  },
  importButton: {
    backgroundColor: theme.colors.primary,
    paddingVertical: 18,
    borderRadius: 16,
    marginBottom: theme.spacing.md,
  },
  importButtonDisabled: {
    backgroundColor: '#2A2A3E',
  },
  importButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
    textAlign: 'center',
  },
  importButtonTextDisabled: {
    color: theme.colors.textMuted,
  },
  cancelButton: {
    paddingVertical: 16,
    alignItems: 'center',
  },
  cancelText: {
    color: theme.colors.textSecondary,
    fontSize: 14,
  },
});
