/**
 * ExpenseScreen
 * Expense Splitter feature - main screen
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
import { Button, Card, Input, Loading } from '../components/common';
import { useWalletStore, useExpenseSplitterStore } from '../stores';
import { AlgorandConfig } from '../../core/config/algorand.config';

export const ExpenseScreen: React.FC = () => {
  const { address } = useWalletStore();
  const {
    splitState,
    memberState,
    hasOptedIn,
    isLoading,
    error,
    lastTransaction,
    checkOptInStatus,
    optIn,
    addExpense,
    markSettled,
    fetchSplitState,
    fetchMemberState,
    getAppBalance,
    clearError,
  } = useExpenseSplitterStore();

  const [refreshing, setRefreshing] = useState(false);
  const [showAddExpense, setShowAddExpense] = useState(false);
  const [expenseAmount, setExpenseAmount] = useState('');
  const [expenseDescription, setExpenseDescription] = useState('');
  const [appBalance, setAppBalance] = useState(0);

  useEffect(() => {
    if (address) {
      loadData();
    }
  }, [address]);

  const loadData = async () => {
    if (!address) return;
    await checkOptInStatus(address);
    await fetchSplitState();
    await fetchMemberState(address);
    const balance = await getAppBalance();
    setAppBalance(balance);
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

  const handleAddExpense = async () => {
    const amount = parseFloat(expenseAmount);
    if (isNaN(amount) || amount <= 0) {
      Alert.alert('Error', 'Please enter a valid amount');
      return;
    }
    if (!expenseDescription.trim()) {
      Alert.alert('Error', 'Please enter a description');
      return;
    }

    try {
      // Convert ALGO to microALGO
      const microAlgos = Math.floor(amount * 1_000_000);
      const result = await addExpense(microAlgos, expenseDescription);
      Alert.alert('Success', `Expense added! TX: ${result.txId.slice(0, 12)}...`);
      setShowAddExpense(false);
      setExpenseAmount('');
      setExpenseDescription('');
    } catch (err: any) {
      Alert.alert('Error', err.message);
    }
  };

  const handleMarkSettled = async () => {
    Alert.alert(
      'Confirm Settlement',
      'Are you sure you want to mark all expenses as settled?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Settle',
          onPress: async () => {
            try {
              const result = await markSettled();
              Alert.alert('Success', `Settled! TX: ${result.txId.slice(0, 12)}...`);
            } catch (err: any) {
              Alert.alert('Error', err.message);
            }
          },
        },
      ]
    );
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
        <Text style={styles.title}>Expense Splitter</Text>
        <Text style={styles.subtitle}>
          Split expenses fairly with your group
        </Text>

        {/* Contract Info Card */}
        <Card style={styles.contractCard}>
          <Text style={styles.cardLabel}>Contract App ID</Text>
          <Text style={styles.appIdText}>
            {AlgorandConfig.contracts.expenseSplitter}
          </Text>
          <View style={styles.balanceRow}>
            <Text style={styles.cardLabel}>Escrow Balance</Text>
            <Text style={styles.balanceValue}>
              {(appBalance / 1_000_000).toFixed(4)} ALGO
            </Text>
          </View>
        </Card>

        {/* Opt-in Status */}
        {!hasOptedIn ? (
          <Card style={styles.optInCard}>
            <Text style={styles.optInTitle}>Join the Expense Pool</Text>
            <Text style={styles.optInText}>
              Opt-in to the contract to start splitting expenses with your group.
            </Text>
            <Button
              title="Opt-In to Contract"
              onPress={handleOptIn}
              loading={isLoading}
              style={styles.optInButton}
            />
          </Card>
        ) : (
          <>
            {/* Split State */}
            <Card style={styles.stateCard}>
              <Text style={styles.stateTitle}>Pool Status</Text>
              
              <View style={styles.stateRow}>
                <Text style={styles.stateLabel}>Members</Text>
                <Text style={styles.stateValue}>
                  {splitState?.memberCount || 0}
                </Text>
              </View>
              
              <View style={styles.stateRow}>
                <Text style={styles.stateLabel}>Total Expenses</Text>
                <Text style={styles.stateValue}>
                  {splitState?.expenseCount || 0}
                </Text>
              </View>
              
              <View style={styles.stateRow}>
                <Text style={styles.stateLabel}>Status</Text>
                <Text style={[
                  styles.stateValue,
                  { color: splitState?.isSettled ? theme.colors.success : theme.colors.warning }
                ]}>
                  {splitState?.isSettled ? 'Settled' : 'Active'}
                </Text>
              </View>
            </Card>

            {/* Member Balance */}
            {memberState && (
              <Card style={styles.memberCard}>
                <Text style={styles.memberTitle}>Your Balance</Text>
                <Text style={[
                  styles.memberBalance,
                  { color: memberState.isOwed ? theme.colors.success : theme.colors.error }
                ]}>
                  {memberState.isOwed ? '+' : '-'}
                  {Math.abs(memberState.netBalance / 1_000_000).toFixed(4)} ALGO
                </Text>
                <Text style={styles.memberStatus}>
                  {memberState.netBalance > 0
                    ? 'You are owed money'
                    : memberState.netBalance < 0
                    ? 'You owe money'
                    : 'All settled up'}
                </Text>
              </Card>
            )}

            {/* Actions */}
            <View style={styles.actions}>
              <Button
                title="Add Expense"
                onPress={() => setShowAddExpense(true)}
                style={styles.actionButton}
              />
              <Button
                title="Mark Settled"
                onPress={handleMarkSettled}
                variant="outline"
                disabled={splitState?.isSettled}
                style={styles.actionButton}
              />
            </View>
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

      {/* Add Expense Modal */}
      <Modal
        visible={showAddExpense}
        animationType="slide"
        transparent
        onRequestClose={() => setShowAddExpense(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Add Expense</Text>
            
            <Input
              label="Amount (ALGO)"
              placeholder="0.00"
              keyboardType="decimal-pad"
              value={expenseAmount}
              onChangeText={setExpenseAmount}
            />
            
            <Input
              label="Description"
              placeholder="What's this expense for?"
              value={expenseDescription}
              onChangeText={setExpenseDescription}
              maxLength={32}
            />
            
            <View style={styles.modalActions}>
              <Button
                title="Cancel"
                onPress={() => setShowAddExpense(false)}
                variant="ghost"
                style={styles.modalButton}
              />
              <Button
                title="Add"
                onPress={handleAddExpense}
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
  contractCard: {
    marginBottom: theme.spacing.md,
  },
  cardLabel: {
    color: theme.colors.textSecondary,
    fontSize: 12,
    marginBottom: theme.spacing.xs,
  },
  appIdText: {
    color: theme.colors.text,
    fontSize: 18,
    fontWeight: '600',
    fontFamily: 'monospace',
    marginBottom: theme.spacing.md,
  },
  balanceRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  balanceValue: {
    color: theme.colors.primary,
    fontSize: 16,
    fontWeight: '600',
  },
  optInCard: {
    backgroundColor: theme.colors.surfaceLight,
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
  stateCard: {
    marginBottom: theme.spacing.md,
  },
  stateTitle: {
    ...theme.typography.h3,
    color: theme.colors.text,
    marginBottom: theme.spacing.md,
  },
  stateRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: theme.spacing.sm,
  },
  stateLabel: {
    color: theme.colors.textSecondary,
    fontSize: 14,
  },
  stateValue: {
    color: theme.colors.text,
    fontSize: 14,
    fontWeight: '600',
  },
  memberCard: {
    marginBottom: theme.spacing.md,
    alignItems: 'center',
  },
  memberTitle: {
    color: theme.colors.textSecondary,
    fontSize: 14,
    marginBottom: theme.spacing.sm,
  },
  memberBalance: {
    fontSize: 32,
    fontWeight: '700',
  },
  memberStatus: {
    color: theme.colors.textSecondary,
    fontSize: 14,
    marginTop: theme.spacing.sm,
  },
  actions: {
    flexDirection: 'row',
    gap: theme.spacing.md,
    marginBottom: theme.spacing.lg,
  },
  actionButton: {
    flex: 1,
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
