import React, { createContext, useContext, useState, useEffect } from 'react';
import { VaultState, ActiveTab, AssetSymbol, VaultTransaction, AuditorAccess } from '../types';
import { CURRENT_CONFIG } from '../starknet/config';
import { shieldTokens, executePrivateTransfer } from '../starknet/strk20';
import { verifyPolicyPredicate } from '../starknet/policyVerifier';
import { escrowViewingKeyToAuditor } from '../starknet/viewingKey';
import { connectStarknetWallet } from '../starknet/wallet';

interface VaultContextType extends VaultState {
  activeTab: ActiveTab;
  setActiveTab: (tab: ActiveTab) => void;
  toggleBalanceReveal: () => void;
  updatePolicy: (maxCap: number, dailyLimit: number) => Promise<boolean>;
  addApprovedRecipient: (address: string, label: string) => void;
  removeApprovedRecipient: (address: string) => void;
  depositAsset: (asset: AssetSymbol, amount: number) => Promise<{ success: boolean; txHash: string }>;
  executeTransfer: (
    asset: AssetSymbol,
    amount: number,
    recipient: string
  ) => Promise<{ success: boolean; txHash?: string; error?: string }>;
  grantAuditorAccess: (label: string, address: string, pubKey: string) => Promise<boolean>;
  revokeAuditorAccess: (id: string) => void;
  connectWallet: () => Promise<void>;
}

const initialHoldings = [
  {
    symbol: 'USDC' as AssetSymbol,
    name: 'USD Coin',
    shieldedAmount: 1250000.0,
    publicAmount: 250000.0,
    usdRate: 1.0,
    notesCount: 4,
    contractAddress: CURRENT_CONFIG.tokens.USDC,
  },
  {
    symbol: 'ETH' as AssetSymbol,
    name: 'Ethereum',
    shieldedAmount: 142.5,
    publicAmount: 12.0,
    usdRate: 3400.0,
    notesCount: 3,
    contractAddress: CURRENT_CONFIG.tokens.ETH,
  },
  {
    symbol: 'STRK' as AssetSymbol,
    name: 'Starknet Token',
    shieldedAmount: 48500.0,
    publicAmount: 5000.0,
    usdRate: 0.55,
    notesCount: 2,
    contractAddress: CURRENT_CONFIG.tokens.STRK,
  },
];

const initialTransactions: VaultTransaction[] = [
  {
    id: 'tx-001',
    type: 'DEPOSIT_SHIELD',
    asset: 'USDC',
    amount: 500000,
    recipientOrDepositor: '0x049d36570d4e46f48e99674bd3fcc84644ddd6b96f7c741b1562b82f9e004dc7',
    timestamp: '2026-08-16 19:42 UTC',
    status: 'PROVEN',
    txHash: '0x07f4a2189d2c1e8b76a5e12f8319e5d481b0a9437e28b12f6a9e1d827f3b145a',
    policyVerified: true,
    screeningSignature: '0x992b...fpi_screened',
    proofFacts: ['VIRTUAL_SNOS_FACT_0x8f21'],
  },
  {
    id: 'tx-002',
    type: 'PRIVATE_TRANSFER',
    asset: 'ETH',
    amount: 15.0,
    recipientOrDepositor: '0x02a24c562bfcb3b0f5cd3e14df1a41db89b251b14ea17dc4dbed4b3d73b069d5',
    timestamp: '2026-08-16 16:15 UTC',
    status: 'PROVEN',
    txHash: '0x018b45f18c21a4e9b817d23a54b918f0c3d9a1b8e4f1a2d7c9e0a1f2b3c4d5e6',
    policyVerified: true,
    proofFacts: ['VIRTUAL_SNOS_FACT_0x3e19', 'STWO_NOTE_SPEND_FACT_0x7b11'],
  },
  {
    id: 'tx-003',
    type: 'POLICY_UPDATE',
    asset: 'USDC',
    amount: 0,
    recipientOrDepositor: 'Adyton Governance Threshold (2/3)',
    timestamp: '2026-08-15 11:20 UTC',
    status: 'PROVEN',
    txHash: '0x03d8a9f2b1e7c4a0d9b8e1f2c3a4b5d6e7f8a9b0c1d2e3f4a5b6c7d8e9f0a1b2',
    policyVerified: true,
  },
];

const initialAuditors: AuditorAccess[] = [
  {
    id: 'aud-1',
    label: 'Ernst & Young Audit Node A',
    starknetAddress: '0x049d36570d4e46f48e99674bd3fcc84644ddd6b96f7c741b1562b82f9e004dc7',
    publicKey: '0x068f21a9e8b7c4d1...stark_curve_K',
    grantedAt: '2026-08-10',
    active: true,
  },
  {
    id: 'aud-2',
    label: 'Internal Compliance & Risk Dept',
    starknetAddress: '0x02a24c562bfcb3b0f5cd3e14df1a41db89b251b14ea17dc4dbed4b3d73b069d5',
    publicKey: '0x041b89f2d1e3a5c7...stark_curve_K',
    grantedAt: '2026-08-14',
    active: true,
  },
];

const VaultContext = createContext<VaultContextType | undefined>(undefined);

export const VaultProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [activeTab, setActiveTab] = useState<ActiveTab>('landing');
  const [isBalanceRevealed, setIsBalanceRevealed] = useState(false);
  const [holdings, setHoldings] = useState(initialHoldings);
  const [transactions, setTransactions] = useState(initialTransactions);
  const [auditors, setAuditors] = useState(initialAuditors);
  const [connectedWallet, setConnectedWallet] = useState<{ address: string; isPrivacyReady: boolean } | undefined>({
    address: '0x07f12a3b8c4d5e6f7a8b9c0d1e2f3a4b5c6d7e8f9a0b1c2d3e4f5a6b7c8d9e0f',
    isPrivacyReady: true,
  });

  const [policy, setPolicy] = useState<VaultState['policy']>({
    maxTransactionCap: 500000,
    dailyOutflowLimit: 2000000,
    approvedRecipients: [
      {
        address: '0x049d36570d4e46f48e99674bd3fcc84644ddd6b96f7c741b1562b82f9e004dc7',
        label: 'Institutional Payroll Node',
        addedAt: '2026-08-12',
      },
      {
        address: '0x02a24c562bfcb3b0f5cd3e14df1a41db89b251b14ea17dc4dbed4b3d73b069d5',
        label: 'Treasury Reserve Multisig',
        addedAt: '2026-08-14',
      },
    ],
    multiSignerThreshold: { required: 2, total: 3 },
    lastUpdated: '2026-08-15 11:20 UTC',
    policyContractAddress: CURRENT_CONFIG.policyContractAddress,
  });

  const toggleBalanceReveal = () => setIsBalanceRevealed((prev) => !prev);

  const connectWallet = async () => {
    const res = await connectStarknetWallet();
    if (res.isConnected && res.address) {
      setConnectedWallet({
        address: res.address,
        isPrivacyReady: res.isPrivacyReady,
      });
    }
  };

  const updatePolicy = async (maxCap: number, dailyLimit: number): Promise<boolean> => {
    setPolicy((prev) => ({
      ...prev,
      maxTransactionCap: maxCap,
      dailyOutflowLimit: dailyLimit,
      lastUpdated: new Date().toISOString().replace('T', ' ').substring(0, 16) + ' UTC',
    }));

    const newTx: VaultTransaction = {
      id: `tx-${Date.now()}`,
      type: 'POLICY_UPDATE',
      asset: 'USDC',
      amount: 0,
      recipientOrDepositor: 'Adyton Governance Threshold',
      timestamp: new Date().toISOString().replace('T', ' ').substring(0, 16) + ' UTC',
      status: 'PROVEN',
      txHash: '0x' + Array.from({ length: 64 }, () => Math.floor(Math.random() * 16).toString(16)).join(''),
      policyVerified: true,
    };
    setTransactions((prev) => [newTx, ...prev]);
    return true;
  };

  const addApprovedRecipient = (address: string, label: string) => {
    setPolicy((prev) => ({
      ...prev,
      approvedRecipients: [
        ...prev.approvedRecipients,
        {
          address,
          label: label || 'Custom Approved Recipient',
          addedAt: new Date().toISOString().substring(0, 10),
        },
      ],
    }));
  };

  const removeApprovedRecipient = (address: string) => {
    setPolicy((prev) => ({
      ...prev,
      approvedRecipients: prev.approvedRecipients.filter((r) => r.address.toLowerCase() !== address.toLowerCase()),
    }));
  };

  const depositAsset = async (asset: AssetSymbol, amount: number) => {
    const res = await shieldTokens((window as any)?.starknet?.account, asset, amount);

    setHoldings((prev) =>
      prev.map((h) =>
        h.symbol === asset
          ? {
              ...h,
              shieldedAmount: h.shieldedAmount + amount,
              publicAmount: Math.max(0, h.publicAmount - amount),
              notesCount: h.notesCount + 1,
            }
          : h
      )
    );

    const newTx: VaultTransaction = {
      id: `tx-${Date.now()}`,
      type: 'DEPOSIT_SHIELD',
      asset,
      amount,
      recipientOrDepositor: connectedWallet?.address || '0x049d3657...',
      timestamp: new Date().toISOString().replace('T', ' ').substring(0, 16) + ' UTC',
      status: 'PROVEN',
      txHash: res.txHash,
      policyVerified: true,
      screeningSignature: res.screeningSignature,
      proofFacts: ['VIRTUAL_SNOS_FACT_' + res.txHash.substring(2, 8)],
    };

    setTransactions((prev) => [newTx, ...prev]);
    return { success: true, txHash: res.txHash };
  };

  const executeTransfer = async (asset: AssetSymbol, amount: number, recipient: string) => {
    const targetAsset = holdings.find((h) => h.symbol === asset);
    const usdRate = targetAsset?.usdRate || 1;

    if (!targetAsset || targetAsset.shieldedAmount < amount) {
      return {
        success: false,
        error: `Insufficient shielded balance in vault for ${asset}. Available: ${targetAsset?.shieldedAmount || 0} ${asset}`,
      };
    }

    const res = await executePrivateTransfer(
      (window as any)?.starknet?.account,
      asset,
      amount,
      usdRate,
      recipient,
      policy
    );

    if (!res.success || !res.txHash) {
      return { success: false, error: res.error || 'Transfer failed' };
    }

    setHoldings((prev) =>
      prev.map((h) =>
        h.symbol === asset
          ? {
              ...h,
              shieldedAmount: h.shieldedAmount - amount,
            }
          : h
      )
    );

    const newTx: VaultTransaction = {
      id: `tx-${Date.now()}`,
      type: 'PRIVATE_TRANSFER',
      asset,
      amount,
      recipientOrDepositor: recipient,
      timestamp: new Date().toISOString().replace('T', ' ').substring(0, 16) + ' UTC',
      status: 'PROVEN',
      txHash: res.txHash,
      policyVerified: true,
      proofFacts: res.proofFacts || ['STWO_ZK_FACT_' + res.txHash.substring(2, 8), 'POLICY_PREDICATE_CAP_VALID'],
    };

    setTransactions((prev) => [newTx, ...prev]);
    return { success: true, txHash: res.txHash };
  };

  const grantAuditorAccess = async (label: string, address: string, pubKey: string) => {
    const escrow = escrowViewingKeyToAuditor(address, pubKey, '0x07f18a2b...');
    const newAuditor: AuditorAccess = {
      id: `aud-${Date.now()}`,
      label,
      starknetAddress: address,
      publicKey: pubKey || escrow.auditorPublicKey,
      grantedAt: escrow.grantedAt,
      active: true,
    };
    setAuditors((prev) => [newAuditor, ...prev]);
    return true;
  };

  const revokeAuditorAccess = (id: string) => {
    setAuditors((prev) => prev.filter((a) => a.id !== id));
  };

  const value: VaultContextType = {
    vaultId: 'VAULT_0x42',
    isProven: true,
    viewingKey: '0x07f18a2b...stark_viewing_key_k',
    isBalanceRevealed,
    holdings,
    policy,
    transactions,
    auditors,
    connectedWallet,
    activeTab,
    setActiveTab,
    toggleBalanceReveal,
    updatePolicy,
    addApprovedRecipient,
    removeApprovedRecipient,
    depositAsset,
    executeTransfer,
    grantAuditorAccess,
    revokeAuditorAccess,
    connectWallet,
  };

  return <VaultContext.Provider value={value}>{children}</VaultContext.Provider>;
};

export const useVault = () => {
  const context = useContext(VaultContext);
  if (!context) {
    throw new Error('useVault must be used within a VaultProvider');
  }
  return context;
};
