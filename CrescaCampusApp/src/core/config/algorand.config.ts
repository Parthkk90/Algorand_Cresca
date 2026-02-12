/**
 * Core Configuration for Algorand Network
 * Contains deployed contract App IDs and network settings
 */

export const AlgorandConfig = {
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
} as const;

export type NetworkType = typeof AlgorandConfig.network;
