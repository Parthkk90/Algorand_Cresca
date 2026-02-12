/**
 * Soulbound Ticket Store (ViewModel)
 * Manages event tickets state and operations
 */

import { create } from 'zustand';
import { soulboundTicketRepository } from '../../data/repositories';
import { Event, Ticket, TransactionResult } from '../../domain/models';

interface SoulboundTicketState {
  // State
  events: Event[];
  userTickets: Ticket[];
  selectedEvent: Event | null;
  hasOptedIn: boolean;
  isLoading: boolean;
  error: string | null;
  lastTransaction: TransactionResult | null;

  // Actions
  checkOptInStatus: (address: string) => Promise<void>;
  optIn: () => Promise<TransactionResult>;
  createEvent: (
    name: string,
    price: number,
    maxTickets: number,
    eventDate: number,
    venue: string
  ) => Promise<TransactionResult>;
  purchaseTicket: (eventId: number) => Promise<TransactionResult>;
  checkIn: (eventId: number) => Promise<TransactionResult>;
  verifyTicket: (eventId: number, holderAddress: string) => Promise<boolean>;
  fetchEvent: (eventId: number) => Promise<void>;
  fetchUserTickets: (address: string) => Promise<void>;
  fetchContractState: () => Promise<void>;
  selectEvent: (event: Event | null) => void;
  clearError: () => void;
}

export const useSoulboundTicketStore = create<SoulboundTicketState>((set, get) => ({
  // Initial state
  events: [],
  userTickets: [],
  selectedEvent: null,
  hasOptedIn: false,
  isLoading: false,
  error: null,
  lastTransaction: null,

  // Check opt-in status
  checkOptInStatus: async (address: string) => {
    try {
      const hasOptedIn = await soulboundTicketRepository.hasOptedIn(address);
      set({ hasOptedIn });
    } catch (error: any) {
      console.error('Failed to check opt-in status:', error);
    }
  },

  // Opt-in to the contract
  optIn: async () => {
    set({ isLoading: true, error: null });
    try {
      const result = await soulboundTicketRepository.optIn();
      set({ 
        lastTransaction: result,
        hasOptedIn: result.confirmed 
      });
      return result;
    } catch (error: any) {
      const errorMsg = error.message || 'Failed to opt-in';
      set({ error: errorMsg });
      throw new Error(errorMsg);
    } finally {
      set({ isLoading: false });
    }
  },

  // Create a new event
  createEvent: async (name, price, maxTickets, eventDate, venue) => {
    set({ isLoading: true, error: null });
    try {
      const result = await soulboundTicketRepository.createEvent(
        name,
        price,
        maxTickets,
        eventDate,
        venue
      );
      set({ lastTransaction: result });
      
      // Refresh events
      await get().fetchContractState();
      
      return result;
    } catch (error: any) {
      const errorMsg = error.message || 'Failed to create event';
      set({ error: errorMsg });
      throw new Error(errorMsg);
    } finally {
      set({ isLoading: false });
    }
  },

  // Purchase a ticket
  purchaseTicket: async (eventId: number) => {
    set({ isLoading: true, error: null });
    try {
      const result = await soulboundTicketRepository.purchaseTicket(eventId);
      set({ lastTransaction: result });
      
      // Refresh event and user tickets
      await get().fetchEvent(eventId);
      
      return result;
    } catch (error: any) {
      const errorMsg = error.message || 'Failed to purchase ticket';
      set({ error: errorMsg });
      throw new Error(errorMsg);
    } finally {
      set({ isLoading: false });
    }
  },

  // Check-in to an event
  checkIn: async (eventId: number) => {
    set({ isLoading: true, error: null });
    try {
      const result = await soulboundTicketRepository.checkIn(eventId);
      set({ lastTransaction: result });
      return result;
    } catch (error: any) {
      const errorMsg = error.message || 'Failed to check-in';
      set({ error: errorMsg });
      throw new Error(errorMsg);
    } finally {
      set({ isLoading: false });
    }
  },

  // Verify a ticket
  verifyTicket: async (eventId: number, holderAddress: string) => {
    try {
      return await soulboundTicketRepository.verifyTicket(eventId, holderAddress);
    } catch (error: any) {
      console.error('Failed to verify ticket:', error);
      return false;
    }
  },

  // Fetch a specific event
  fetchEvent: async (eventId: number) => {
    try {
      const event = await soulboundTicketRepository.getEvent(eventId);
      if (event) {
        const { events } = get();
        const existingIndex = events.findIndex(e => e.id === eventId);
        if (existingIndex >= 0) {
          events[existingIndex] = event;
        } else {
          events.push(event);
        }
        set({ events: [...events] });
      }
    } catch (error: any) {
      console.error('Failed to fetch event:', error);
    }
  },

  // Fetch user's tickets
  fetchUserTickets: async (address: string) => {
    set({ isLoading: true });
    try {
      const userTickets = await soulboundTicketRepository.getUserTickets(address);
      set({ userTickets });
    } catch (error: any) {
      set({ error: error.message || 'Failed to fetch tickets' });
    } finally {
      set({ isLoading: false });
    }
  },

  // Fetch contract state (event count)
  fetchContractState: async () => {
    set({ isLoading: true });
    try {
      const state = await soulboundTicketRepository.getContractState();
      if (state) {
        // Fetch all events
        const events: Event[] = [];
        for (let i = 0; i < state.eventCount; i++) {
          const event = await soulboundTicketRepository.getEvent(i);
          if (event) {
            events.push(event);
          }
        }
        set({ events });
      }
    } catch (error: any) {
      set({ error: error.message || 'Failed to fetch contract state' });
    } finally {
      set({ isLoading: false });
    }
  },

  // Select an event
  selectEvent: (event: Event | null) => set({ selectedEvent: event }),

  // Clear error
  clearError: () => set({ error: null }),
}));
