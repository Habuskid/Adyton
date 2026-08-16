/**
 * Core Data Types for Adyton - Confidential Treasury Vault on Starknet (STRK20)
 */

export type AssetSymbol = 'ETH' | 'STRK' | 'USDC';

export interface AssetHolding {
  symbol: AssetSymbol;
  name: string;
  shieldedAmount: number;
  publicAmount: number;
  usdRate: number;
  notesCount: number;
  contractAddress: string;
}

export interface SpendingPolicy {
  maxTransactionCap: number; // in USD equivalent
  dailyOutflowLimit: number; // 24-hour rolling cap
  approvedRecipients: {
    address: string;
    label: string;
    addedAt: string;
  }[];
  multiSignerThreshold: {
    required: number;
    total: number;
  };
  lastUpdated: string;
  policyContractAddress: string;
}

export interface ShieldedNote {
  noteId: string;
  token: AssetSymbol;
  amount: number;
  salt: number;
  createdBlock: number;
  isSpent: boolean;
  channelKey: string;
  nullifier?: string;
}

export interface VaultTransaction {
  id: string;
  type: 'DEPOSIT_SHIELD' | 'PRIVATE_TRANSFER' | 'WITHDRAW_UNSHIELD' | 'POLICY_UPDATE';
  asset: AssetSymbol;
  amount: number;
  recipientOrDepositor: string;
  timestamp: string;
  status: 'PROVEN' | 'SUBMITTED' | 'REJECTED';
  txHash: string;
  proofFacts?: string[];
  policyVerified: boolean;
  screeningSignature?: string;
}

export interface AuditorAccess {
  id: string;
  label: string;
  publicKey: string;
  starknetAddress: string;
  grantedAt: string;
  active: boolean;
}

export type ActiveTab = 'landing' | 'dashboard' | 'deposit' | 'policy' | 'transfer' | 'audit';

export interface VaultState {
  vaultId: string;
  isProven: boolean;
  viewingKey: string;
  isBalanceRevealed: boolean;
  holdings: AssetHolding[];
  policy: SpendingPolicy;
  transactions: VaultTransaction[];
  auditors: AuditorAccess[];
  connectedWallet?: {
    address: string;
    isPrivacyReady: boolean;
  };
}
