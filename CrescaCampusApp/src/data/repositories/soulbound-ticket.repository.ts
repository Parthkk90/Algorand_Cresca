/**
 * SoulboundTicketRepository
 * Repository for interacting with the Soulbound Ticket smart contract
 * App ID: 755399774 (Testnet)
 * 
 * Implements ARC-71 for non-transferable event tickets
 */

import algosdk from 'algosdk';
import { algorandClientService } from '../../core/services/algorand-client.service';
import { walletService } from '../../core/services/wallet.service';
import { ALGORAND_CONFIG } from '../../core/config/algorand.config';
import { Event, Ticket, TransactionResult } from '../../domain/models';

class SoulboundTicketRepository {
  private readonly appId: number;
  private readonly client: algosdk.Algodv2;

  constructor() {
    this.appId = ALGORAND_CONFIG.contracts.soulboundTicket;
    this.client = algorandClientService.getAlgodClient();
  }

  /**
   * Opt-in to the Soulbound Ticket application
   * Required before purchasing tickets
   */
  async optIn(): Promise<TransactionResult> {
    const wallet = await walletService.loadWallet();
    if (!wallet) {
      throw new Error('No wallet found. Please create or import a wallet first.');
    }

    const suggestedParams = await this.client.getTransactionParams().do();
    
    const optInTxn = algosdk.makeApplicationOptInTxn(
      wallet.address,
      suggestedParams,
      this.appId
    );

    const signedTxn = await walletService.signTransaction(optInTxn);
    const txId = await algorandClientService.sendTransaction(signedTxn);
    const confirmed = await algorandClientService.waitForConfirmation(txId);

    return {
      txId,
      confirmed: confirmed !== null,
      appId: this.appId,
    };
  }

  /**
   * Create a new event
   * @param name Event name (max 32 chars)
   * @param price Ticket price in microAlgos
   * @param maxTickets Maximum number of tickets
   * @param eventDate Unix timestamp of the event
   * @param venue Event venue (max 32 chars)
   */
  async createEvent(
    name: string,
    price: number,
    maxTickets: number,
    eventDate: number,
    venue: string
  ): Promise<TransactionResult> {
    const wallet = await walletService.loadWallet();
    if (!wallet) {
      throw new Error('No wallet found. Please create or import a wallet first.');
    }

    const suggestedParams = await this.client.getTransactionParams().do();
    
    const appArgs = [
      new TextEncoder().encode('create_event'),
      new TextEncoder().encode(name.slice(0, 32)),
      algosdk.encodeUint64(price),
      algosdk.encodeUint64(maxTickets),
      algosdk.encodeUint64(eventDate),
      new TextEncoder().encode(venue.slice(0, 32)),
    ];

    const appCallTxn = algosdk.makeApplicationNoOpTxn(
      wallet.address,
      suggestedParams,
      this.appId,
      appArgs
    );

    const signedTxn = await walletService.signTransaction(appCallTxn);
    const txId = await algorandClientService.sendTransaction(signedTxn);
    const confirmed = await algorandClientService.waitForConfirmation(txId);

    return {
      txId,
      confirmed: confirmed !== null,
      appId: this.appId,
    };
  }

  /**
   * Purchase a soulbound ticket for an event
   * @param eventId The event ID to purchase ticket for
   */
  async purchaseTicket(eventId: number): Promise<TransactionResult> {
    const wallet = await walletService.loadWallet();
    if (!wallet) {
      throw new Error('No wallet found. Please create or import a wallet first.');
    }

    // Get event details to determine price
    const event = await this.getEvent(eventId);
    if (!event) {
      throw new Error('Event not found');
    }

    const suggestedParams = await this.client.getTransactionParams().do();
    const appAddress = this.getAppAddress();

    // Create atomic transaction group: payment + app call
    const paymentTxn = algosdk.makePaymentTxnWithSuggestedParamsFromObject({
      from: wallet.address,
      to: appAddress,
      amount: event.price,
      suggestedParams,
    });

    const appArgs = [
      new TextEncoder().encode('purchase_ticket'),
      algosdk.encodeUint64(eventId),
    ];

    const appCallTxn = algosdk.makeApplicationNoOpTxn(
      wallet.address,
      suggestedParams,
      this.appId,
      appArgs
    );

    // Group transactions
    algosdk.assignGroupID([paymentTxn, appCallTxn]);

    // Sign both transactions
    const signedPayment = await walletService.signTransaction(paymentTxn);
    const signedAppCall = await walletService.signTransaction(appCallTxn);

    // Send as atomic group
    const txId = await algorandClientService.sendTransaction([signedPayment, signedAppCall]);
    const confirmed = await algorandClientService.waitForConfirmation(txId);

    return {
      txId,
      confirmed: confirmed !== null,
      appId: this.appId,
    };
  }

  /**
   * Check-in to an event using your ticket
   * @param eventId The event to check into
   */
  async checkIn(eventId: number): Promise<TransactionResult> {
    const wallet = await walletService.loadWallet();
    if (!wallet) {
      throw new Error('No wallet found. Please create or import a wallet first.');
    }

    const suggestedParams = await this.client.getTransactionParams().do();
    
    const appArgs = [
      new TextEncoder().encode('check_in'),
      algosdk.encodeUint64(eventId),
    ];

    const appCallTxn = algosdk.makeApplicationNoOpTxn(
      wallet.address,
      suggestedParams,
      this.appId,
      appArgs
    );

    const signedTxn = await walletService.signTransaction(appCallTxn);
    const txId = await algorandClientService.sendTransaction(signedTxn);
    const confirmed = await algorandClientService.waitForConfirmation(txId);

    return {
      txId,
      confirmed: confirmed !== null,
      appId: this.appId,
    };
  }

  /**
   * Verify a ticket holder (for event organizers)
   * @param eventId The event ID
   * @param holderAddress The address to verify
   */
  async verifyTicket(eventId: number, holderAddress: string): Promise<boolean> {
    try {
      const localState = await algorandClientService.getAppLocalState(
        this.appId,
        holderAddress
      );

      if (!localState) return false;

      // Check if the user has a ticket for this event
      const ticketKey = `ticket_${eventId}`;
      return localState[ticketKey] !== undefined;
    } catch {
      return false;
    }
  }

  /**
   * Get event details
   * @param eventId The event ID
   */
  async getEvent(eventId: number): Promise<Event | null> {
    try {
      const globalState = await algorandClientService.getAppGlobalState(this.appId);
      
      if (!globalState) return null;

      // Parse event data from global state
      // Events are stored with keys like event_0_name, event_0_price, etc.
      const eventName = globalState[`event_${eventId}_name`];
      
      if (!eventName) return null;

      return {
        id: eventId,
        assetId: Number(globalState[`event_${eventId}_asset`] || 0),
        name: String(eventName),
        price: Number(globalState[`event_${eventId}_price`] || 0),
        maxTickets: Number(globalState[`event_${eventId}_max`] || 0),
        soldTickets: Number(globalState[`event_${eventId}_sold`] || 0),
        eventDate: Number(globalState[`event_${eventId}_date`] || 0),
        venue: String(globalState[`event_${eventId}_venue`] || ''),
        creator: String(globalState['creator'] || ''),
      };
    } catch (error) {
      console.error('Failed to get event:', error);
      return null;
    }
  }

  /**
   * Get global state showing total events
   */
  async getContractState(): Promise<{ eventCount: number; creator: string } | null> {
    try {
      const globalState = await algorandClientService.getAppGlobalState(this.appId);
      
      if (!globalState) return null;

      return {
        eventCount: Number(globalState['event_count'] || 0),
        creator: String(globalState['creator'] || ''),
      };
    } catch (error) {
      console.error('Failed to get contract state:', error);
      return null;
    }
  }

  /**
   * Get user's tickets
   * @param address User's address
   */
  async getUserTickets(address: string): Promise<Ticket[]> {
    try {
      const localState = await algorandClientService.getAppLocalState(this.appId, address);
      
      if (!localState) return [];

      const tickets: Ticket[] = [];
      
      // Parse ticket data from local state
      for (const key of Object.keys(localState)) {
        if (key.startsWith('ticket_')) {
          const eventId = parseInt(key.split('_')[1]);
          tickets.push({
            assetId: 0, // ASA ID if using ASA-based tickets
            eventId,
            holder: address,
            purchaseDate: Number(localState[`${key}_date`] || Date.now() / 1000),
            checkedIn: Boolean(localState[`${key}_checked_in`]),
            checkInTime: localState[`${key}_checkin_time`] 
              ? Number(localState[`${key}_checkin_time`]) 
              : undefined,
          });
        }
      }

      return tickets;
    } catch (error) {
      console.error('Failed to get user tickets:', error);
      return [];
    }
  }

  /**
   * Get the application address
   */
  getAppAddress(): string {
    return algosdk.getApplicationAddress(this.appId);
  }

  /**
   * Check if an address has opted into the contract
   * @param address The address to check
   */
  async hasOptedIn(address: string): Promise<boolean> {
    const accountInfo = await algorandClientService.getAccountInfo(address);
    
    if (!accountInfo || !accountInfo['apps-local-state']) {
      return false;
    }

    return accountInfo['apps-local-state'].some(
      (app: any) => app.id === this.appId
    );
  }
}

export const soulboundTicketRepository = new SoulboundTicketRepository();
