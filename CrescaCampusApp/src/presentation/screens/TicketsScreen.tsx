/**
 * TicketsScreen
 * Soulbound event tickets feature
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
  TouchableOpacity,
  FlatList,
} from 'react-native';
import { theme } from '../theme';
import { Button, Card, Input } from '../components/common';
import { useWalletStore, useSoulboundTicketStore } from '../stores';
import { ALGORAND_CONFIG } from '../../core/config/algorand.config';
import { Event, Ticket } from '../../domain/models';

export const TicketsScreen: React.FC = () => {
  const { address } = useWalletStore();
  const {
    events,
    userTickets,
    hasOptedIn,
    isLoading,
    lastTransaction,
    checkOptInStatus,
    optIn,
    createEvent,
    purchaseTicket,
    checkIn,
    fetchContractState,
    fetchUserTickets,
  } = useSoulboundTicketStore();

  const [refreshing, setRefreshing] = useState(false);
  const [showCreateEvent, setShowCreateEvent] = useState(false);
  const [activeTab, setActiveTab] = useState<'events' | 'myTickets'>('events');

  // Create event form state
  const [eventName, setEventName] = useState('');
  const [eventPrice, setEventPrice] = useState('');
  const [eventMaxTickets, setEventMaxTickets] = useState('');
  const [eventVenue, setEventVenue] = useState('');
  const [eventDate, setEventDate] = useState('');

  useEffect(() => {
    if (address) {
      loadData();
    }
  }, [address]);

  const loadData = async () => {
    if (!address) return;
    await checkOptInStatus(address);
    await fetchContractState();
    await fetchUserTickets(address);
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

  const handleCreateEvent = async () => {
    const price = parseFloat(eventPrice);
    const maxTickets = parseInt(eventMaxTickets);
    
    if (!eventName.trim()) {
      Alert.alert('Error', 'Please enter an event name');
      return;
    }
    if (isNaN(price) || price < 0) {
      Alert.alert('Error', 'Please enter a valid price');
      return;
    }
    if (isNaN(maxTickets) || maxTickets <= 0) {
      Alert.alert('Error', 'Please enter a valid max tickets number');
      return;
    }
    if (!eventVenue.trim()) {
      Alert.alert('Error', 'Please enter a venue');
      return;
    }

    try {
      const microAlgos = Math.floor(price * 1_000_000);
      const eventTimestamp = Math.floor(Date.now() / 1000) + (7 * 24 * 60 * 60); // Default to 1 week from now
      
      const result = await createEvent(
        eventName,
        microAlgos,
        maxTickets,
        eventTimestamp,
        eventVenue
      );
      
      Alert.alert('Success', `Event created! TX: ${result.txId.slice(0, 12)}...`);
      setShowCreateEvent(false);
      resetEventForm();
      await loadData();
    } catch (err: any) {
      Alert.alert('Error', err.message);
    }
  };

  const resetEventForm = () => {
    setEventName('');
    setEventPrice('');
    setEventMaxTickets('');
    setEventVenue('');
    setEventDate('');
  };

  const handlePurchaseTicket = async (event: Event) => {
    Alert.alert(
      'Purchase Ticket',
      `Buy ticket for "${event.name}" for ${(event.price / 1_000_000).toFixed(4)} ALGO?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Purchase',
          onPress: async () => {
            try {
              const result = await purchaseTicket(event.id);
              Alert.alert('Success', `Ticket purchased! TX: ${result.txId.slice(0, 12)}...`);
              await loadData();
            } catch (err: any) {
              Alert.alert('Error', err.message);
            }
          },
        },
      ]
    );
  };

  const handleCheckIn = async (ticket: Ticket) => {
    try {
      const result = await checkIn(ticket.eventId);
      Alert.alert('Success', `Checked in! TX: ${result.txId.slice(0, 12)}...`);
      await loadData();
    } catch (err: any) {
      Alert.alert('Error', err.message);
    }
  };

  const renderEventCard = ({ item }: { item: Event }) => (
    <Card style={styles.eventCard}>
      <Text style={styles.eventEmoji}>🎫</Text>
      <Text style={styles.eventName}>{item.name || 'Unnamed Event'}</Text>
      <Text style={styles.eventVenue}>📍 {item.venue || 'TBA'}</Text>
      <View style={styles.eventDetails}>
        <View style={styles.eventDetail}>
          <Text style={styles.detailLabel}>Price</Text>
          <Text style={styles.detailValue}>
            {(item.price / 1_000_000).toFixed(4)} ALGO
          </Text>
        </View>
        <View style={styles.eventDetail}>
          <Text style={styles.detailLabel}>Tickets</Text>
          <Text style={styles.detailValue}>
            {item.soldTickets}/{item.maxTickets}
          </Text>
        </View>
      </View>
      <Button
        title="Buy Ticket"
        onPress={() => handlePurchaseTicket(item)}
        disabled={item.soldTickets >= item.maxTickets}
        size="sm"
        style={styles.buyButton}
      />
    </Card>
  );

  const renderTicketCard = ({ item }: { item: Ticket }) => (
    <Card style={styles.ticketCard}>
      <View style={styles.ticketHeader}>
        <Text style={styles.ticketEmoji}>🎟️</Text>
        <View style={[
          styles.ticketStatus,
          item.checkedIn && styles.checkedInStatus
        ]}>
          <Text style={styles.ticketStatusText}>
            {item.checkedIn ? 'Checked In' : 'Valid'}
          </Text>
        </View>
      </View>
      <Text style={styles.ticketEvent}>Event #{item.eventId}</Text>
      <Text style={styles.ticketDate}>
        Purchased: {new Date(item.purchaseDate * 1000).toLocaleDateString()}
      </Text>
      {!item.checkedIn && (
        <Button
          title="Check In"
          onPress={() => handleCheckIn(item)}
          size="sm"
          variant="outline"
          style={styles.checkInButton}
        />
      )}
    </Card>
  );

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
        <Text style={styles.title}>Event Tickets</Text>
        <Text style={styles.subtitle}>
          Soulbound NFT tickets for campus events
        </Text>

        {/* Contract Info */}
        <Card style={styles.infoCard}>
          <Text style={styles.infoLabel}>App ID</Text>
          <Text style={styles.infoValue}>
            {ALGORAND_CONFIG.contracts.soulboundTicket}
          </Text>
          <Text style={styles.arcBadge}>ARC-71 Compliant</Text>
        </Card>

        {/* Opt-in Status */}
        {!hasOptedIn ? (
          <Card style={styles.optInCard}>
            <Text style={styles.optInTitle}>Get Started</Text>
            <Text style={styles.optInText}>
              Opt-in to purchase and hold soulbound tickets
            </Text>
            <Button
              title="Opt-In"
              onPress={handleOptIn}
              loading={isLoading}
            />
          </Card>
        ) : (
          <>
            {/* Tab Switcher */}
            <View style={styles.tabs}>
              <TouchableOpacity
                style={[styles.tab, activeTab === 'events' && styles.activeTab]}
                onPress={() => setActiveTab('events')}
              >
                <Text style={[
                  styles.tabText,
                  activeTab === 'events' && styles.activeTabText
                ]}>
                  Events ({events.length})
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.tab, activeTab === 'myTickets' && styles.activeTab]}
                onPress={() => setActiveTab('myTickets')}
              >
                <Text style={[
                  styles.tabText,
                  activeTab === 'myTickets' && styles.activeTabText
                ]}>
                  My Tickets ({userTickets.length})
                </Text>
              </TouchableOpacity>
            </View>

            {/* Content */}
            {activeTab === 'events' ? (
              <>
                <Button
                  title="Create Event"
                  onPress={() => setShowCreateEvent(true)}
                  variant="outline"
                  style={styles.createButton}
                />
                {events.length === 0 ? (
                  <Card style={styles.emptyCard}>
                    <Text style={styles.emptyText}>No events yet</Text>
                    <Text style={styles.emptySubtext}>
                      Create the first event!
                    </Text>
                  </Card>
                ) : (
                  events.map((event) => (
                    <View key={event.id}>
                      {renderEventCard({ item: event })}
                    </View>
                  ))
                )}
              </>
            ) : (
              <>
                {userTickets.length === 0 ? (
                  <Card style={styles.emptyCard}>
                    <Text style={styles.emptyText}>No tickets yet</Text>
                    <Text style={styles.emptySubtext}>
                      Purchase a ticket to get started
                    </Text>
                  </Card>
                ) : (
                  userTickets.map((ticket) => (
                    <View key={`${ticket.eventId}-${ticket.purchaseDate}`}>
                      {renderTicketCard({ item: ticket })}
                    </View>
                  ))
                )}
              </>
            )}
          </>
        )}

        {/* Last Transaction */}
        {lastTransaction && (
          <Card style={styles.txCard}>
            <Text style={styles.txTitle}>Last Transaction</Text>
            <Text style={styles.txId}>{lastTransaction.txId}</Text>
          </Card>
        )}
      </ScrollView>

      {/* Create Event Modal */}
      <Modal
        visible={showCreateEvent}
        animationType="slide"
        transparent
        onRequestClose={() => setShowCreateEvent(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Create Event</Text>
            
            <Input
              label="Event Name"
              placeholder="Annual Tech Fest"
              value={eventName}
              onChangeText={setEventName}
              maxLength={32}
            />
            
            <Input
              label="Ticket Price (ALGO)"
              placeholder="0.00 (free)"
              keyboardType="decimal-pad"
              value={eventPrice}
              onChangeText={setEventPrice}
            />
            
            <Input
              label="Max Tickets"
              placeholder="100"
              keyboardType="number-pad"
              value={eventMaxTickets}
              onChangeText={setEventMaxTickets}
            />
            
            <Input
              label="Venue"
              placeholder="Main Auditorium"
              value={eventVenue}
              onChangeText={setEventVenue}
              maxLength={32}
            />
            
            <View style={styles.modalActions}>
              <Button
                title="Cancel"
                onPress={() => {
                  setShowCreateEvent(false);
                  resetEventForm();
                }}
                variant="ghost"
                style={styles.modalButton}
              />
              <Button
                title="Create"
                onPress={handleCreateEvent}
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
    paddingBottom: theme.spacing.xxl,
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
  infoCard: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: theme.spacing.md,
  },
  infoLabel: {
    color: theme.colors.textSecondary,
    fontSize: 12,
    marginRight: theme.spacing.sm,
  },
  infoValue: {
    color: theme.colors.text,
    fontSize: 14,
    fontFamily: 'monospace',
    flex: 1,
  },
  arcBadge: {
    backgroundColor: theme.colors.secondary,
    color: '#000',
    fontSize: 10,
    fontWeight: '600',
    paddingHorizontal: theme.spacing.sm,
    paddingVertical: 2,
    borderRadius: theme.borderRadius.sm,
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
    marginBottom: theme.spacing.lg,
  },
  tabs: {
    flexDirection: 'row',
    marginBottom: theme.spacing.md,
    backgroundColor: theme.colors.surface,
    borderRadius: theme.borderRadius.md,
    padding: 4,
  },
  tab: {
    flex: 1,
    paddingVertical: theme.spacing.sm,
    alignItems: 'center',
    borderRadius: theme.borderRadius.sm,
  },
  activeTab: {
    backgroundColor: theme.colors.primary,
  },
  tabText: {
    color: theme.colors.textSecondary,
    fontSize: 14,
    fontWeight: '500',
  },
  activeTabText: {
    color: '#fff',
  },
  createButton: {
    marginBottom: theme.spacing.md,
  },
  emptyCard: {
    alignItems: 'center',
    paddingVertical: theme.spacing.xl,
  },
  emptyText: {
    color: theme.colors.text,
    fontSize: 16,
    fontWeight: '500',
  },
  emptySubtext: {
    color: theme.colors.textSecondary,
    fontSize: 14,
    marginTop: theme.spacing.xs,
  },
  eventCard: {
    marginBottom: theme.spacing.md,
    alignItems: 'center',
  },
  eventEmoji: {
    fontSize: 48,
    marginBottom: theme.spacing.sm,
  },
  eventName: {
    ...theme.typography.h3,
    color: theme.colors.text,
    marginBottom: theme.spacing.xs,
  },
  eventVenue: {
    color: theme.colors.textSecondary,
    fontSize: 14,
    marginBottom: theme.spacing.md,
  },
  eventDetails: {
    flexDirection: 'row',
    width: '100%',
    justifyContent: 'space-around',
    marginBottom: theme.spacing.md,
  },
  eventDetail: {
    alignItems: 'center',
  },
  detailLabel: {
    color: theme.colors.textSecondary,
    fontSize: 12,
  },
  detailValue: {
    color: theme.colors.text,
    fontSize: 16,
    fontWeight: '600',
  },
  buyButton: {
    minWidth: 150,
  },
  ticketCard: {
    marginBottom: theme.spacing.md,
  },
  ticketHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: theme.spacing.sm,
  },
  ticketEmoji: {
    fontSize: 32,
  },
  ticketStatus: {
    backgroundColor: theme.colors.success,
    paddingHorizontal: theme.spacing.sm,
    paddingVertical: 2,
    borderRadius: theme.borderRadius.sm,
  },
  checkedInStatus: {
    backgroundColor: theme.colors.textSecondary,
  },
  ticketStatusText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '600',
  },
  ticketEvent: {
    color: theme.colors.text,
    fontSize: 16,
    fontWeight: '600',
  },
  ticketDate: {
    color: theme.colors.textSecondary,
    fontSize: 12,
    marginTop: theme.spacing.xs,
  },
  checkInButton: {
    marginTop: theme.spacing.md,
  },
  txCard: {
    marginTop: theme.spacing.md,
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
