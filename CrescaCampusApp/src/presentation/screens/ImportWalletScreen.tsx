/**
 * ImportWalletScreen
 * Import an existing wallet using mnemonic
 */

import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Alert,
  TextInput,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { theme } from '../theme';
import { Button, Card } from '../components/common';
import { useWalletStore } from '../stores';

export const ImportWalletScreen: React.FC = () => {
  const navigation = useNavigation();
  const { importWallet, isLoading, error } = useWalletStore();
  
  const [mnemonic, setMnemonic] = useState('');

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
    <View style={styles.container}>
      <ScrollView contentContainerStyle={styles.content}>
        <Text style={styles.title}>Import Wallet</Text>
        <Text style={styles.description}>
          Enter your 25-word recovery phrase to restore your wallet.
        </Text>

        <Card style={styles.inputCard}>
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
        </Card>

        <Text style={styles.hint}>
          Separate each word with a space. Words are case-insensitive.
        </Text>

        <Card style={styles.warningCard}>
          <Text style={styles.warningText}>
            ⚠️ Only import wallets on trusted devices. Never enter your recovery
            phrase on websites or share it with anyone.
          </Text>
        </Card>

        <Button
          title="Import Wallet"
          onPress={handleImport}
          loading={isLoading}
          disabled={mnemonic.trim().split(/\s+/).length !== 25}
          style={styles.importButton}
        />

        <Button
          title="Cancel"
          onPress={() => navigation.goBack()}
          variant="ghost"
        />
      </ScrollView>
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
  inputCard: {
    marginBottom: theme.spacing.md,
  },
  mnemonicInput: {
    color: theme.colors.text,
    fontSize: 16,
    minHeight: 120,
    fontFamily: 'monospace',
  },
  hint: {
    color: theme.colors.textSecondary,
    fontSize: 12,
    textAlign: 'center',
    marginBottom: theme.spacing.lg,
  },
  warningCard: {
    backgroundColor: 'rgba(255, 178, 0, 0.1)',
    borderColor: theme.colors.warning,
    borderWidth: 1,
    marginBottom: theme.spacing.lg,
  },
  warningText: {
    color: theme.colors.warning,
    fontSize: 14,
    lineHeight: 22,
  },
  importButton: {
    marginBottom: theme.spacing.md,
  },
});
