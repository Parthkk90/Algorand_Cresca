/**
 * Core Configuration for Algorand Network
 * Contains deployed contract App IDs and network settings
 */

export const AlgorandConfig = {
  // App Info
  appName: 'CrescaCampus',
  appVersion: '1.0.0',
  
  // Network Configuration
  network: 'testnet' as const,
  
  // Algorand Node (Algonode - free, no API key needed)
  algodServer: 'https://testnet-api.algonode.cloud',
  algodPort: '',
  algodToken: '',
  
  // Indexer
  indexerServer: 'https://testnet-idx.algonode.cloud',
  indexerPort: '',
  indexerToken: '',
  
  // Deployed Contract App IDs (Testnet - Feb 12, 2026)
  contracts: {
    expenseSplitter: 755399831,
    daoTreasury: 755399773,
    soulboundTicket: 755399774,
    fundraising: 755399775,
  },
  
  // Transaction defaults
  defaultTxnFee: 1000, // microAlgos
  minBalance: 100000, // 0.1 ALGO minimum balance
  confirmationRounds: 4,
} as const;

export type NetworkType = typeof AlgorandConfig.network;

// Helper to format microAlgos to ALGO
export const microAlgosToAlgo = (microAlgos: number): number => microAlgos / 1_000_000;

// Helper to format ALGO to microAlgos  
export const algoToMicroAlgos = (algo: number): number => Math.floor(algo * 1_000_000);

// Explorer URLs
export const getExplorerUrl = (txId: string): string => 
  `https://testnet.algoexplorer.io/tx/${txId}`;

export const getAddressExplorerUrl = (address: string): string =>
  `https://testnet.algoexplorer.io/address/${address}`;
