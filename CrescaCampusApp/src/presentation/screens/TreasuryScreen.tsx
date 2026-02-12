/**
 * TreasuryScreen
 * DAO Treasury multisig management
 */

import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  RefreshControl,
  Alert,
  Modal,
} from 'react-native';
import { theme } from '../theme';
import { Button, Card, Input } from '../components/common';
import { useWalletStore, useDAOTreasuryStore } from '../stores';
import { AlgorandConfig } from '../../core/config/algorand.config';

export const TreasuryScreen: React.FC = () => {
  const { address } = useWalletStore();
  const {
    treasuryState,
    proposals,
    isSigner,
    hasOptedIn,
    isLoading,
    lastTransaction,
    checkOptInStatus,
    checkSignerStatus,
    optIn,
    addSigner,
    createProposal,
    approveProposal,
    executeProposal,
    deposit,
    fetchTreasuryState,
    getTreasuryBalance,
  } = useDAOTreasuryStore();

  const [refreshing, setRefreshing] = useState(false);
  const [showCreateProposal, setShowCreateProposal] = useState(false);
  const [showDeposit, setShowDeposit] = useState(false);
  const [treasuryBalance, setTreasuryBalance] = useState(0);

  // Proposal form state
  const [proposalRecipient, setProposalRecipient] = useState('');
  const [proposalAmount, setProposalAmount] = useState('');
  const [proposalDescription, setProposalDescription] = useState('');

  // Deposit form state
  const [depositAmount, setDepositAmount] = useState('');

  useEffect(() => {
    if (address) {
      loadData();
    }
  }, [address]);

  const loadData = async () => {
    if (!address) return;
    await checkOptInStatus(address);
    await checkSignerStatus(address);
    await fetchTreasuryState();
    const balance = await getTreasuryBalance();
    setTreasuryBalance(balance);
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadData();
    setRefreshing(false);
  };

  const handleOptIn = async () => {
    try {
      const result = await optIn();
      Alert.alert('Success', `Opted in! TX: ${result.txId.slice(0, 12)}...`);
      await loadData();
    } catch (err: any) {
      Alert.alert('Error', err.message);
    }
  };

  const handleDeposit = async () => {
    const amount = parseFloat(depositAmount);
    if (isNaN(amount) || amount <= 0) {
      Alert.alert('Error', 'Please enter a valid amount');
      return;
    }

    try {
      const microAlgos = Math.floor(amount * 1_000_000);
      const result = await deposit(microAlgos);
      Alert.alert('Success', `Deposited! TX: ${result.txId.slice(0, 12)}...`);
      setShowDeposit(false);
      setDepositAmount('');
      await loadData();
    } catch (err: any) {
      Alert.alert('Error', err.message);
    }
  };

  const handleCreateProposal = async () => {
    const amount = parseFloat(proposalAmount);
    if (isNaN(amount) || amount <= 0) {
      Alert.alert('Error', 'Please enter a valid amount');
      return;
    }
    if (proposalRecipient.length !== 58) {
      Alert.alert('Error', 'Please enter a valid Algorand address (58 characters)');
      return;
    }
    if (!proposalDescription.trim()) {
      Alert.alert('Error', 'Please enter a description');
      return;
    }

    try {
      const microAlgos = Math.floor(amount * 1_000_000);
      const result = await createProposal(proposalRecipient, microAlgos, proposalDescription);
      Alert.alert('Success', `Proposal created! TX: ${result.txId.slice(0, 12)}...`);
      setShowCreateProposal(false);
      setProposalRecipient('');
      setProposalAmount('');
      setProposalDescription('');
    } catch (err: any) {
      Alert.alert('Error', err.message);
    }
  };

  if (!address) {
    return (
      <View style={styles.container}>
        <View style={styles.centerContent}>
          <Text style={styles.noWallet}>Please connect your wallet first</Text>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <ScrollView
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
        <Text style={styles.title}>DAO Treasury</Text>
        <Text style={styles.subtitle}>
          Multisig treasury for club/org funds
        </Text>

        {/* Treasury Balance Card */}
        <Card variant="elevated" style={styles.balanceCard}>
          <Text style={styles.balanceLabel}>Treasury Balance</Text>
          <Text style={styles.balanceAmount}>
            {(treasuryBalance / 1_000_000).toFixed(4)} ALGO
          </Text>
          <Text style={styles.contractId}>
            App ID: {AlgorandConfig.contracts.daoTreasury}
          </Text>
        </Card>

        {/* Opt-in Status */}
        {!hasOptedIn ? (
          <Card style={styles.optInCard}>
            <Text style={styles.optInTitle}>Join the DAO</Text>
            <Text style={styles.optInText}>
              Opt-in to participate in treasury governance
            </Text>
            <Button
              title="Opt-In to Treasury"
              onPress={handleOptIn}
              loading={isLoading}
              style={styles.optInButton}
            />
          </Card>
        ) : (
          <>
            {/* Your Status */}
            <Card style={styles.statusCard}>
              <View style={styles.statusRow}>
                <Text style={styles.statusLabel}>Your Role</Text>
                <View style={[
                  styles.roleBadge,
                  isSigner && styles.signerBadge
                ]}>
                  <Text style={styles.roleText}>
                    {isSigner ? '✓ Signer' : 'Member'}
                  </Text>
                </View>
              </View>
              
              {treasuryState && (
                <>
                  <View style={styles.statusRow}>
                    <Text style={styles.statusLabel}>Required Signatures</Text>
                    <Text style={styles.statusValue}>
                      {treasuryState.threshold}
                    </Text>
                  </View>
                  <View style={styles.statusRow}>
                    <Text style={styles.statusLabel}>Total Signers</Text>
                    <Text style={styles.statusValue}>
                      {treasuryState.signerCount}
                    </Text>
                  </View>
                  <View style={styles.statusRow}>
                    <Text style={styles.statusLabel}>Proposals Created</Text>
                    <Text style={styles.statusValue}>
                      {treasuryState.proposalCount}
                    </Text>
                  </View>
                </>
              )}
            </Card>

            {/* Actions */}
            <View style={styles.actions}>
              <Button
                title="Deposit"
                onPress={() => setShowDeposit(true)}
                style={styles.actionButton}
              />
              {isSigner && (
                <Button
                  title="Create Proposal"
                  onPress={() => setShowCreateProposal(true)}
                  variant="outline"
                  style={styles.actionButton}
                />
              )}
            </View>

            {/* How it works */}
            <Card style={styles.infoCard}>
              <Text style={styles.infoTitle}>How it works</Text>
              <Text style={styles.infoText}>
                1. Signers create spending proposals{'\n'}
                2. Other signers approve or reject{'\n'}
                3. Once threshold is met, funds are released{'\n'}
                4. All transactions are on-chain and transparent
              </Text>
            </Card>
          </>
        )}

        {/* Last Transaction */}
        {lastTransaction && (
          <Card style={styles.txCard}>
            <Text style={styles.txTitle}>Last Transaction</Text>
            <Text style={styles.txId}>{lastTransaction.txId}</Text>
            <Text style={styles.txStatus}>
              {lastTransaction.confirmed ? '✓ Confirmed' : '⏳ Pending'}
            </Text>
          </Card>
        )}
      </ScrollView>

      {/* Deposit Modal */}
      <Modal
        visible={showDeposit}
        animationType="slide"
        transparent
        onRequestClose={() => setShowDeposit(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Deposit to Treasury</Text>
            
            <Input
              label="Amount (ALGO)"
              placeholder="0.00"
              keyboardType="decimal-pad"
              value={depositAmount}
              onChangeText={setDepositAmount}
            />
            
            <View style={styles.modalActions}>
              <Button
                title="Cancel"
                onPress={() => setShowDeposit(false)}
                variant="ghost"
                style={styles.modalButton}
              />
              <Button
                title="Deposit"
                onPress={handleDeposit}
                loading={isLoading}
                style={styles.modalButton}
              />
            </View>
          </View>
        </View>
      </Modal>

      {/* Create Proposal Modal */}
      <Modal
        visible={showCreateProposal}
        animationType="slide"
        transparent
        onRequestClose={() => setShowCreateProposal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Create Proposal</Text>
            
            <Input
              label="Recipient Address"
              placeholder="ALGO address (58 chars)..."
              value={proposalRecipient}
              onChangeText={setProposalRecipient}
              autoCapitalize="characters"
            />
            
            <Input
              label="Amount (ALGO)"
              placeholder="0.00"
              keyboardType="decimal-pad"
              value={proposalAmount}
              onChangeText={setProposalAmount}
            />
            
            <Input
              label="Description"
              placeholder="What is this proposal for?"
              value={proposalDescription}
              onChangeText={setProposalDescription}
              maxLength={32}
            />
            
            <View style={styles.modalActions}>
              <Button
                title="Cancel"
                onPress={() => setShowCreateProposal(false)}
                variant="ghost"
                style={styles.modalButton}
              />
              <Button
                title="Create"
                onPress={handleCreateProposal}
                loading={isLoading}
                style={styles.modalButton}
              />
            </View>
          </View>
        </View>
      </Modal>
    </View>
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
  centerContent: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  noWallet: {
    color: theme.colors.textSecondary,
    fontSize: 16,
  },
  title: {
    ...theme.typography.h1,
    color: theme.colors.text,
    marginBottom: theme.spacing.xs,
  },
  subtitle: {
    ...theme.typography.body,
    color: theme.colors.textSecondary,
    marginBottom: theme.spacing.lg,
  },
  balanceCard: {
    backgroundColor: theme.colors.primary,
    alignItems: 'center',
    paddingVertical: theme.spacing.xl,
    marginBottom: theme.spacing.md,
  },
  balanceLabel: {
    color: 'rgba(255,255,255,0.7)',
    fontSize: 14,
  },
  balanceAmount: {
    color: '#FFFFFF',
    fontSize: 36,
    fontWeight: '700',
    marginVertical: theme.spacing.sm,
  },
  contractId: {
    color: 'rgba(255,255,255,0.7)',
    fontSize: 12,
    fontFamily: 'monospace',
  },
  optInCard: {
    alignItems: 'center',
    paddingVertical: theme.spacing.xl,
  },
  optInTitle: {
    ...theme.typography.h3,
    color: theme.colors.text,
    marginBottom: theme.spacing.sm,
  },
  optInText: {
    color: theme.colors.textSecondary,
    textAlign: 'center',
    marginBottom: theme.spacing.lg,
  },
  optInButton: {
    minWidth: 200,
  },
  statusCard: {
    marginBottom: theme.spacing.md,
  },
  statusRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: theme.spacing.sm,
  },
  statusLabel: {
    color: theme.colors.textSecondary,
    fontSize: 14,
  },
  statusValue: {
    color: theme.colors.text,
    fontSize: 14,
    fontWeight: '600',
  },
  roleBadge: {
    backgroundColor: theme.colors.surfaceLight,
    paddingHorizontal: theme.spacing.sm,
    paddingVertical: theme.spacing.xs,
    borderRadius: theme.borderRadius.sm,
  },
  signerBadge: {
    backgroundColor: theme.colors.success,
  },
  roleText: {
    color: theme.colors.text,
    fontSize: 12,
    fontWeight: '600',
  },
  actions: {
    flexDirection: 'row',
    gap: theme.spacing.md,
    marginBottom: theme.spacing.lg,
  },
  actionButton: {
    flex: 1,
  },
  infoCard: {
    backgroundColor: theme.colors.surfaceLight,
    marginBottom: theme.spacing.md,
  },
  infoTitle: {
    color: theme.colors.text,
    fontSize: 16,
    fontWeight: '600',
    marginBottom: theme.spacing.sm,
  },
  infoText: {
    color: theme.colors.textSecondary,
    fontSize: 14,
    lineHeight: 22,
  },
  txCard: {
    backgroundColor: theme.colors.surfaceLight,
  },
  txTitle: {
    color: theme.colors.textSecondary,
    fontSize: 12,
    marginBottom: theme.spacing.xs,
  },
  txId: {
    color: theme.colors.text,
    fontSize: 12,
    fontFamily: 'monospace',
  },
  txStatus: {
    color: theme.colors.success,
    fontSize: 12,
    marginTop: theme.spacing.xs,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.8)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: theme.colors.surface,
    borderTopLeftRadius: theme.borderRadius.xl,
    borderTopRightRadius: theme.borderRadius.xl,
    padding: theme.spacing.lg,
    paddingBottom: theme.spacing.xxl,
  },
  modalTitle: {
    ...theme.typography.h2,
    color: theme.colors.text,
    marginBottom: theme.spacing.lg,
  },
  modalActions: {
    flexDirection: 'row',
    gap: theme.spacing.md,
    marginTop: theme.spacing.md,
  },
  modalButton: {
    flex: 1,
  },
});
