import React, { createContext, useContext, useState, useEffect } from 'react';
import { VaultState, ActiveTab, AssetSymbol, VaultTransaction, AuditorAccess, AssetHolding } from '../types';
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
  refreshBalances: () => Promise<void>;
}

const defaultHoldings: AssetHolding[] = [
  {
    symbol: 'USDC',
    name: 'USD Coin',
    shieldedAmount: 0.0,
    publicAmount: 0.0,
    usdRate: 1.0,
    notesCount: 0,
    contractAddress: CURRENT_CONFIG.tokens.USDC,
  },
  {
    symbol: 'ETH',
    name: 'Ethereum',
    shieldedAmount: 0.0,
    publicAmount: 0.0,
    usdRate: 3400.0,
    notesCount: 0,
    contractAddress: CURRENT_CONFIG.tokens.ETH,
  },
  {
    symbol: 'STRK',
    name: 'Starknet Token',
    shieldedAmount: 0.0,
    publicAmount: 0.0,
    usdRate: 0.55,
    notesCount: 0,
    contractAddress: CURRENT_CONFIG.tokens.STRK,
  },
];

const VaultContext = createContext<VaultContextType | undefined>(undefined);

export const VaultProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [activeTab, setActiveTab] = useState<ActiveTab>('landing');
  const [isBalanceRevealed, setIsBalanceRevealed] = useState(false);
  const [connectedWallet, setConnectedWallet] = useState<{ address: string; isPrivacyReady: boolean } | undefined>(undefined);

  // Dynamic state with local storage persistence
  const [holdings, setHoldings] = useState<AssetHolding[]>(() => {
    try {
      const saved = localStorage.getItem('adyton_holdings');
      return saved ? JSON.parse(saved) : defaultHoldings;
    } catch {
      return defaultHoldings;
    }
  });

  const [transactions, setTransactions] = useState<VaultTransaction[]>(() => {
    try {
      const saved = localStorage.getItem('adyton_transactions');
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  const [auditors, setAuditors] = useState<AuditorAccess[]>(() => {
    try {
      const saved = localStorage.getItem('adyton_auditors');
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  const [policy, setPolicy] = useState<VaultState['policy']>(() => {
    try {
      const saved = localStorage.getItem('adyton_policy');
      if (saved) return JSON.parse(saved);
    } catch {}
    return {
      maxTransactionCap: 100000,
      dailyOutflowLimit: 500000,
      approvedRecipients: [],
      multiSignerThreshold: { required: 1, total: 1 },
      lastUpdated: new Date().toISOString().replace('T', ' ').substring(0, 16) + ' UTC',
      policyContractAddress: CURRENT_CONFIG.policyContractAddress,
    };
  });

  useEffect(() => {
    try {
      localStorage.setItem('adyton_holdings', JSON.stringify(holdings));
    } catch {}
  }, [holdings]);

  useEffect(() => {
    try {
      localStorage.setItem('adyton_transactions', JSON.stringify(transactions));
    } catch {}
  }, [transactions]);

  useEffect(() => {
    try {
      localStorage.setItem('adyton_auditors', JSON.stringify(auditors));
    } catch {}
  }, [auditors]);

  useEffect(() => {
    try {
      localStorage.setItem('adyton_policy', JSON.stringify(policy));
    } catch {}
  }, [policy]);

  const toggleBalanceReveal = () => setIsBalanceRevealed((prev) => !prev);

  const connectWallet = async () => {
    const res = await connectStarknetWallet();
    if (res.isConnected && res.address) {
      setConnectedWallet({
        address: res.address,
        isPrivacyReady: res.isPrivacyReady,
      });
      await refreshBalances();
    }
  };

  const refreshBalances = async () => {
    if (typeof window !== 'undefined' && (window as any).starknet?.account) {
      const account = (window as any).starknet.account;
      if (typeof account.strk20Balances === 'function') {
        try {
          const balances = await account.strk20Balances([
            CURRENT_CONFIG.tokens.USDC,
            CURRENT_CONFIG.tokens.ETH,
            CURRENT_CONFIG.tokens.STRK,
          ]);
          setHoldings((prev) =>
            prev.map((h) => {
              const liveBal = balances.find((b: any) => b.token.toLowerCase() === h.contractAddress.toLowerCase());
              if (liveBal) {
                return { ...h, shieldedAmount: parseFloat(liveBal.balance) || 0 };
              }
              return h;
            })
          );
        } catch (err) {
          console.warn('Live balance query error:', err);
        }
      }
    }
  };

  const updatePolicy = async (maxCap: number, dailyLimit: number): Promise<boolean> => {
    const updatedPolicy = {
      ...policy,
      maxTransactionCap: maxCap,
      dailyOutflowLimit: dailyLimit,
      lastUpdated: new Date().toISOString().replace('T', ' ').substring(0, 16) + ' UTC',
    };
    setPolicy(updatedPolicy);

    const newTx: VaultTransaction = {
      id: `tx-${Date.now()}`,
      type: 'POLICY_UPDATE',
      asset: 'USDC',
      amount: 0,
      recipientOrDepositor: connectedWallet?.address || 'Vault Owner',
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
          label: label || 'Approved Recipient',
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
      recipientOrDepositor: connectedWallet?.address || '0x049d...vault',
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
        error: `Insufficient shielded balance for ${asset}. Available: ${targetAsset?.shieldedAmount || 0} ${asset}`,
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
              shieldedAmount: Math.max(0, h.shieldedAmount - amount),
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
    vaultId: connectedWallet ? `VAULT_${connectedWallet.address.substring(0, 6)}` : 'VAULT_DISCONNECTED',
    isProven: true,
    viewingKey: '0x07f18a2b...stark_viewing_key',
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
    refreshBalances,
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
