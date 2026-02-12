# Cresca Campus 

> **Decentralized Campus Finance Built on Algorand**  
> Peer payments, smart splits, soulbound tickets, DAO treasuries, transparent fundraising, and fee-sponsored onboarding.  
> *No bank. No middlemen. No friction.*

[![Algorand](https://img.shields.io/badge/Algorand-Powered-blue?logo=algorand)](https://algorand.com)
[![AlgoKit](https://img.shields.io/badge/AlgoKit-3.0+-green)](https://developer.algorand.org/algokit/)
[![Track](https://img.shields.io/badge/Track%201-Future%20of%20Finance-orange)]()

---

##  Table of Contents

- [Overview](#overview)
- [Features](#features)
- [Architecture](#architecture)
- [Tech Stack](#tech-stack)
- [Project Structure](#project-structure)
- [Smart Contracts](#smart-contracts)
- [Getting Started](#getting-started)
- [User Flow in Nutshell](#user-flow-in-nutshell)
- [Contributing](#contributing)

---

## Overview

**Cresca Campus** is not just another wallet adapter project - it's a **native Algorand wallet built from the ground up for campus ecosystems**. Unlike generic wallet solutions like Pera or Algo Wallet that are designed for general crypto users, Cresca Campus is purpose-built with campus-specific features deeply integrated at the protocol level.

**Why not just use Pera Wallet?** Because students don't need another generic crypto wallet - they need a **campus finance super-app** that understands their daily workflows: splitting dinner bills, managing club funds, buying fest tickets, and crowdfunding for causes. Cresca Campus delivers all of this with Algorand-native primitives, not bolted-on features.

### What Makes This Different

- **Native Wallet Experience** - No third-party wallet adapters, no external dependencies
- **Campus-First Design** - Every feature solves a real student pain point
- **Protocol-Level Security** - Soulbound tickets, atomic settlements, multi-sig treasuries
- **Zero-Friction Onboarding** - Fee sponsorship means students start transacting immediately

### Why Algorand?

| Campus Need | Traditional Pain | Algorand's Native Solution |
|-------------|------------------|---------------------------|
| P2P Payments | UPI downtime, T+1 settlement | 0.001 ALGO fee, 2.85s finality |
| Expense Splitting | Trust disputes, no atomicity | Atomic Groups: 16 txns succeed or all fail |
| Club Treasury | One person holds bank access | AVM multi-sig: no single key controls funds |
| Event Tickets | Fake tickets, scalping | ARC-71 Soulbound: protocol-enforced non-transfer |
| Fundraising | Organizers disappear with funds | Escrow with milestone-based release |
| Student Onboarding | Seed phrases, gas confusion | Fee Pooling + Liquid Auth passkeys |

---

## Features

###  1. P2P Campus Payments (Core)
- **ALGO transfers** via simple QR scan
- Wallet = Identity (no phone numbers, no sign-up forms)
- **~$0.0003 per transaction** (0.001 ALGO fixed fee)
- 2.85-second finality, never reverts

**Algorand Primitive:** `PaymentTxn` + ASA Transfer

###  2. Smart Expense Splitting (Core)
- Create split contracts with member list
- On-chain state tracks who paid what
- "Settle All" via **Atomic Transfer** - up to 16 members settle in one block
- Disputes impossible: blockchain is the source of truth

**Algorand Primitive:** AVM App + Atomic Group (up to 16 txns)

###  3. Club DAO Treasury (Power)
- Multi-sig smart contract wallet (M-of-N approval)
- Spending proposals visible to all members on-chain
- Funds move only after on-chain approval
- Transparent history - no trust required

**Algorand Primitive:** AVM App + LogicSig

###  4. Soulbound Event Tickets (WOW Factor)
- Each ticket = **ARC-71 Non-Transferable ASA**
- Freeze address prevents secondary sale at protocol level
- QR scan → on-chain wallet verification at event gate
- Clawback enables revocation (no-show refunds)

**Algorand Primitive:** ARC-71 NTA + ARC-69 On-chain Metadata

###  5. Transparent Campaign Fundraising (Power)
- Smart contract escrow - nobody holds the money
- Milestone-based release: funds unlock only when goals are met
- All donations visible on-chain with donor address + amount
- Auto-refund if campaign fails (contract-enforced)
- **Anonymous donor mode** via note-field encryption

**Algorand Primitive:** AVM App + Escrow Pattern + Inner Transactions

###  Bonus: Gasless Onboarding
- **Atomic Fee Pooling**: App sponsors first transactions
- **Native Wallet**: Built-in passkey authentication, no seed phrase hassle
- New students transact on day one with zero crypto knowledge

---

## Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                        MOBILE APP LAYER                         │
│                    (React Native + Expo)                        │
├─────────────────────────────────────────────────────────────────┤
│                     NATIVE WALLET LAYER                         │
│         Built-in Wallet • Passkey Auth • Fee Sponsorship        │
├─────────────────────────────────────────────────────────────────┤
│                    APPLICATION LAYER                            │
│  ┌─────────────┐ ┌─────────────┐ ┌─────────────┐ ┌───────────┐ │
│  │   P2P Pay   │ │ Expense     │ │    DAO      │ │ Soulbound │ │
│  │   Contract  │ │ Splitter    │ │  Treasury   │ │  Tickets  │ │
│  └─────────────┘ └─────────────┘ └─────────────┘ └───────────┘ │
│  ┌─────────────────────────────────────────────────────────────┐│
│  │              Fundraising Escrow Contract                    ││
│  └─────────────────────────────────────────────────────────────┘│
├─────────────────────────────────────────────────────────────────┤
│                     ALGORAND LAYER                              │
│         Testnet/Mainnet • Indexer v2 • AlgoKit 3.x             │
└─────────────────────────────────────────────────────────────────┘
```

---

## Tech Stack

| Layer | Technology |
|-------|------------|
| **Blockchain** | Algorand (Testnet/Mainnet) |
| **Smart Contracts** | PyTeal + AlgoKit 3.x |
| **Mobile App** | React Native + Expo |
| **NFT Standard** | ARC-71 (Soulbound) + ARC-69 |
| **Fee Sponsorship** | Atomic Fee Pooling |

---

## Project Structure

```
crescacam/
├── README.md
├── .algokit.toml                    # AlgoKit project config
├── .env.example                     # Environment template
│
├── contracts/                       # Smart contracts (Python/Puya)
│   ├── __init__.py
│   ├── p2p_payment/                 # P2P payment utilities
│   │   ├── __init__.py
│   │   └── contract.py
│   │
│   ├── expense_splitter/            # Expense splitting contract
│   │   ├── __init__.py
│   │   └── contract.py
│   │
│   ├── dao_treasury/                # DAO multi-sig treasury
│   │   ├── __init__.py
│   │   └── contract.py
│   │
│   ├── soulbound_ticket/            # ARC-71 soulbound NFT tickets
│   │   ├── __init__.py
│   │   └── contract.py
│   │
│   └── fundraising/                 # Escrow fundraising contract
│       ├── __init__.py
│       └── contract.py
│
├── tests/                           # Contract tests
│   ├── __init__.py
│   ├── test_expense_splitter.py
│   ├── test_dao_treasury.py
│   ├── test_soulbound_ticket.py
│   └── test_fundraising.py
│
├── frontend/                        # Next.js frontend
│   ├── package.json
│   ├── next.config.js
│   ├── tailwind.config.js
│   ├── app/
│   │   ├── layout.tsx
│   │   ├── page.tsx
│   │   ├── payments/
│   │   ├── splits/
│   │   ├── treasury/
│   │   ├── tickets/
│   │   └── fundraising/
│   ├── components/
│   │   ├── ui/
│   │   ├── wallet/
│   │   ├── qr/
│   │   └── shared/
│   ├── lib/
│   │   ├── algorand.ts
│   │   ├── contracts.ts
│   │   └── utils.ts
│   └── hooks/
│       ├── useWallet.ts
│       └── useContracts.ts
│
├── scripts/                         # Deployment & utility scripts
│   ├── deploy.py
│   ├── fund_sponsor.py
│   └── mint_test_tickets.py
│
└── docs/                            # Additional documentation
    ├── API.md
    ├── CONTRACTS.md
    └── DEPLOYMENT.md
```

---

## Smart Contracts

### Deployed on Algorand Testnet

| Contract | App ID | Explorer |
|----------|--------|----------|
| **DAO Treasury** | `755399773` | [View on Lora](https://lora.algokit.io/testnet/application/755399773) |
| **Soulbound Ticket** | `755399774` | [View on Lora](https://lora.algokit.io/testnet/application/755399774) |
| **Fundraising** | `755399775` | [View on Lora](https://lora.algokit.io/testnet/application/755399775) |

---

### 1. Expense Splitter (`contracts/expense_splitter/contract.py`)

**State Schema:**
- Global: `creator`, `total_members`, `total_expenses`, `settled`
- Local: `balance_owed`, `has_paid`

**Methods:**
- `create_split(members: list[Address])` - Initialize split group
- `add_expense(payer: Address, amount: uint64, description: bytes)` - Log expense
- `get_balance(member: Address) -> int64` - Check what member owes/is owed
- `settle_all()` - Execute atomic settlement (up to 16 members)

### 2. DAO Treasury (`contracts/dao_treasury/contract.py`)

**State Schema:**
- Global: `threshold`, `total_signers`, `proposal_count`
- Box: Proposals, Signer list

**Methods:**
- `initialize(signers: list[Address], threshold: uint64)` - Setup M-of-N
- `create_proposal(recipient: Address, amount: uint64, description: bytes)` - Propose spend
- `approve(proposal_id: uint64)` - Sign proposal
- `execute(proposal_id: uint64)` - Release funds if threshold met

### 3. Soulbound Ticket (`contracts/soulbound_ticket/contract.py`)

**ARC-71 Implementation:**
- ASA with `freeze_address` = contract address
- Metadata follows ARC-69 standard

**Methods:**
- `create_event(name: bytes, max_tickets: uint64, price: uint64)` - Create event
- `mint_ticket(buyer: Address)` - Mint frozen NFT to buyer
- `verify_ticket(holder: Address, ticket_id: uint64) -> bool` - Gate verification
- `revoke_ticket(ticket_id: uint64)` - Clawback for refunds

### 4. Fundraising Escrow (`contracts/fundraising/contract.py`)

**State Schema:**
- Global: `beneficiary`, `goal`, `deadline`, `raised`, `milestone_count`
- Box: Milestones, Donations

**Methods:**
- `create_campaign(beneficiary: Address, goal: uint64, deadline: uint64)` - Start campaign
- `donate(amount: uint64, anonymous: bool)` - Contribute to escrow
- `add_milestone(description: bytes, amount: uint64)` - Define release milestone
- `complete_milestone(milestone_id: uint64)` - Mark milestone complete
- `release_funds(milestone_id: uint64)` - Beneficiary claim via inner txn
- `refund()` - Claim refund if campaign failed

---

## Getting Started

### Prerequisites

- Python 3.12+
- Node.js 18+
- [AlgoKit CLI](https://developer.algorand.org/docs/get-started/algokit/) 3.x
- [Pera Wallet](https://perawallet.app/) (mobile or web)

### Installation

```bash
# Clone the repository
git clone https://github.com/your-username/crescacam.git
cd crescacam

# Install AlgoKit and start local network
algokit localnet start

# Install Python dependencies
cd contracts
python -m venv .venv
.venv\Scripts\activate     # Windows
pip install -r requirements.txt

# Build and deploy contracts
algokit project run build
algokit project run deploy

# Install frontend dependencies
cd ../frontend
npm install

# Start development server
npm run dev
```

---

## User Flow in Nutshell

<div style="overflow-x: auto; white-space: nowrap;">

```
┌─────────────┐    ┌─────────────┐    ┌─────────────┐    ┌─────────────┐    ┌─────────────┐
│  DOWNLOAD   │    │   CREATE    │    │    FEE      │    │   START     │    │    USE      │
│    APP      │ -> │   WALLET    │ -> │  SPONSORED  │ -> │ TRANSACTING │ -> │  FEATURES   │
│             │    │  (Passkey)  │    │   FUNDING   │    │             │    │             │
└─────────────┘    └─────────────┘    └─────────────┘    └─────────────┘    └─────────────┘
        │                 │                 │                 │                   │
        v                 v                 v                 v                   v
   React Native      No seed phrase     Zero gas fees    Send/Receive      Split expenses
   Expo App          Just biometrics    to start         ALGO instantly    DAO Treasury
                                                                           Buy tickets
                                                                           Fundraise
```

</div>

### Core User Flows

<div style="overflow-x: auto;">

| Flow | User Action | What Happens On-Chain |
|------|-------------|----------------------|
| **Pay a Friend** | Scan QR → Enter amount → Confirm | `PaymentTxn` settles in 2.85s |
| **Split Expenses** | Create group → Add expenses → "Settle All" | Atomic group of up to 16 payments in 1 block |
| **Club Treasury** | Create proposal → Members vote → Execute | Multi-sig release via inner transaction |
| **Buy Ticket** | Select event → Pay → Receive NFT | ARC-71 soulbound NFT minted (non-transferable) |
| **Donate** | Choose campaign → Contribute → Track | Escrow holds funds until milestone met |

</div>

### Security Model

- **No custody risk**: Funds never held by any individual
- **Atomic guarantees**: Multi-party transactions succeed or fail together
- **On-chain transparency**: All actions auditable via Algorand Indexer
- **Protocol-level enforcement**: Soulbound tickets cannot be transferred by design

---

## Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

Please ensure all smart contracts have corresponding tests and follow the ARC-4 ABI standard.

---

## Acknowledgments

- [Algorand Foundation](https://algorand.foundation/) - For the hackathon opportunity
- [AlgoKit](https://developer.algorand.org/algokit/) - Modern Algorand development
- VIT Campus - Real-world inspiration

---

<div align="center">

**Built for Algorand Track 1: Future of Finance**

*Cresca Campus - Finance for students, by students, on-chain.*

</div>
