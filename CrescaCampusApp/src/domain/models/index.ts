/**
 * Domain Models for Cresca Campus
 * These represent the business entities in the application
 */

// ============= EXPENSE SPLITTER MODELS =============

export interface ExpenseSplit {
  appId: number;
  creator: string;
  memberCount: number;
  expenseCount: number;
  isSettled: boolean;
  totalPool: number; // in microAlgos
}

export interface ExpenseMember {
  address: string;
  netBalance: number; // positive = owed money, negative = owes money
  isOwed: boolean;
  hasOptedIn: boolean;
}

export interface Expense {
  id: number;
  payer: string;
  amount: number;
  description: string;
  timestamp: number;
}

// ============= DAO TREASURY MODELS =============

export interface DAOTreasury {
  appId: number;
  creator: string;
  threshold: number;
  signerCount: number;
  proposalCount: number;
  balance: number;
}

export interface TreasurySigner {
  address: string;
  isSigner: boolean;
}

export interface TreasuryProposal {
  id: number;
  creator: string;
  recipient: string;
  amount: number;
  description: string;
  status: ProposalStatus;
  approvalCount: number;
}

export enum ProposalStatus {
  PENDING = 0,
  APPROVED = 1,
  EXECUTED = 2,
  REJECTED = 3,
}

// ============= SOULBOUND TICKET MODELS =============

export interface Event {
  id: number;
  assetId: number;
  name: string;
  price: number;
  maxTickets: number;
  soldTickets: number;
  eventDate: number;
  venue: string;
  creator: string;
}

export interface Ticket {
  assetId: number;
  eventId: number;
  holder: string;
  purchaseDate: number;
  checkedIn: boolean;
  checkInTime?: number;
}

// ============= FUNDRAISING MODELS =============

export interface Campaign {
  id: number;
  creator: string;
  beneficiary: string;
  title: string;
  description: string;
  goal: number;
  raised: number;
  deadline: number;
  status: CampaignStatus;
  milestoneCount: number;
  donationCount: number;
}

export enum CampaignStatus {
  ACTIVE = 0,
  SUCCESSFUL = 1,
  FAILED = 2,
  CANCELLED = 3,
}

export interface Milestone {
  id: number;
  campaignId: number;
  description: string;
  amount: number;
  released: number;
  isCompleted: boolean;
}

export interface Donation {
  id: number;
  campaignId: number;
  donor: string;
  amount: number;
  timestamp: number;
  isAnonymous: boolean;
}

// ============= WALLET / ACCOUNT MODELS =============

export interface AccountInfo {
  address: string;
  balance: number; // in microAlgos
  balanceAlgo: number;
  minBalance: number;
  assets: AssetHolding[];
  appsOptedIn: number[];
}

export interface AssetHolding {
  assetId: number;
  amount: number;
  isFrozen: boolean;
}

// ============= TRANSACTION MODELS =============

export interface TransactionResult {
  txId: string;
  confirmed: boolean;
  appId?: number;
  assetId?: number;
}

export interface TransactionError {
  code: string;
  message: string;
  details?: any;
}
