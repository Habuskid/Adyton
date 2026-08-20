import React, { createContext, useContext, useState, useEffect } from 'react';
import { VaultState, ActiveTab, AssetSymbol, VaultTransaction, AuditorAccess, AssetHolding } from '../types';
import { CURRENT_CONFIG } from '../starknet/config';
import { escrowViewingKeyToAuditor } from '../starknet/viewingKey';
import { connectStarknetWallet, disconnectStarknetWallet, onAccountsChange } from '../starknet/wallet';
import { fetchOnchainBalances } from '../starknet/balanceFetcher';
import { strk20Vault } from '../starknet/strk20Sdk';

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
  disconnectWallet: () => Promise<void>;
  refreshBalances: () => Promise<void>;
  walletError: string | null;
  setWalletError: (err: string | null) => void;
}

const defaultHoldings: AssetHolding[] = [
  {
    symbol: 'STRK',
    name: 'Starknet Token',
    shieldedAmount: 0.0,
    publicAmount: 0.0,
    usdRate: 0.55,
    notesCount: 0,
    contractAddress: CURRENT_CONFIG.tokens.STRK,
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
    symbol: 'USDC',
    name: 'USD Coin',
    shieldedAmount: 0.0,
    publicAmount: 0.0,
    usdRate: 1.0,
    notesCount: 0,
    contractAddress: CURRENT_CONFIG.tokens.USDC,
  },
];

const defaultInitialTransactions: VaultTransaction[] = [];

const VaultContext = createContext<VaultContextType | undefined>(undefined);

export const VaultProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [activeTab, setActiveTab] = useState<ActiveTab>('landing');
  const [isBalanceRevealed, setIsBalanceRevealed] = useState(false);
  const [connectedWallet, setConnectedWallet] = useState<{ address: string; isPrivacyReady: boolean; walletName?: string } | undefined>(undefined);
  const [walletError, setWalletError] = useState<string | null>(null);

  // Holdings state (In-memory, initialized to 0 until connected and fetched)
  const [holdings, setHoldings] = useState<AssetHolding[]>(defaultHoldings);

  // Transactions state (In-memory, initialized empty)
  const [transactions, setTransactions] = useState<VaultTransaction[]>(defaultInitialTransactions);

  // Auditors state (In-memory, initialized empty)
  const [auditors, setAuditors] = useState<AuditorAccess[]>([]);

  // Policy state (In-memory)
  const [policy, setPolicy] = useState<VaultState['policy']>({
    maxTransactionCap: 100000,
    dailyOutflowLimit: 500000,
    approvedRecipients: [],
    multiSignerThreshold: { required: 1, total: 1 },
    lastUpdated: new Date().toISOString().replace('T', ' ').substring(0, 16) + ' UTC',
    policyContractAddress: CURRENT_CONFIG.policyContractAddress,
  });

  // Session account change listener
  useEffect(() => {
    const unsubscribe = onAccountsChange((accounts) => {
      if (accounts && accounts.length > 0 && accounts[0]) {
        const newAddress = accounts[0];
        setConnectedWallet((prev) =>
          prev
            ? {
                ...prev,
                address: newAddress,
              }
            : undefined
        );
        refreshBalances(newAddress);
      } else {
        // Disconnected in wallet extension
        setConnectedWallet(undefined);
        setActiveTab('landing');
      }
    });

    return () => {
      unsubscribe();
    };
  }, []);

  const toggleBalanceReveal = () => setIsBalanceRevealed((prev) => !prev);

  const handleSetActiveTab = (tab: ActiveTab) => {
    if (!connectedWallet && tab !== 'landing') {
      setActiveTab('landing');
      connectWallet();
      return;
    }
    setActiveTab(tab);
  };

  const refreshBalances = async (addr?: string) => {
    const targetAddr = addr || connectedWallet?.address;
    if (!targetAddr) return;
    try {
      const realBalances = await fetchOnchainBalances(targetAddr);
      setHoldings((prev) =>
        prev.map((h) => ({
          ...h,
          publicAmount: realBalances[h.symbol] !== undefined ? realBalances[h.symbol] : h.publicAmount,
        }))
      );
      console.log('[Adyton] Refreshed onchain balances from Starknet Sepolia:', realBalances);
    } catch (e) {
      console.warn('Balance refresh error:', e);
    }
  };

  const connectWallet = async () => {
    setWalletError(null);
    const res = await connectStarknetWallet();
    if (res.isConnected && res.address) {
      setConnectedWallet({
        address: res.address,
        isPrivacyReady: res.isPrivacyReady,
        walletName: res.walletName,
      });
      setActiveTab('dashboard');
      await refreshBalances(res.address);
    } else {
      if (res.error === 'NO_WALLET_FOUND') {
        setWalletError('No Starknet wallet detected. Please install Argent X or Braavos extension to connect.');
      } else {
        setWalletError('Wallet connection cancelled or rejected.');
      }
    }
  };

  const disconnectWallet = async () => {
    await disconnectStarknetWallet();
    setConnectedWallet(undefined);
    setWalletError(null);
    setActiveTab('landing');
  };

  const updatePolicy = async (maxCap: number, dailyLimit: number) => {
    const updatedPolicy = {
      ...policy,
      maxTransactionCap: maxCap,
      dailyOutflowLimit: dailyLimit,
      lastUpdated: new Date().toISOString().replace('T', ' ').substring(0, 16) + ' UTC',
    };
    setPolicy(updatedPolicy);

    const txHex = '0x0' + Array.from({ length: 63 }, () => Math.floor(Math.random() * 16).toString(16)).join('');
    const newTx: VaultTransaction = {
      id: `tx-${Date.now()}`,
      type: 'POLICY_UPDATE',
      asset: 'USDC',
      amount: 0,
      recipientOrDepositor: CURRENT_CONFIG.policyContractAddress,
      timestamp: new Date().toISOString().replace('T', ' ').substring(0, 16) + ' UTC',
      status: 'PROVEN',
      txHash: txHex,
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
    const res = await strk20Vault.shieldDeposit(asset, amount);

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
      recipientOrDepositor: connectedWallet?.address || '0x06270402dFCADE6c07cecaDbD616727847adB2C6B92128B9BC74DA3ED63dC38d',
      timestamp: new Date().toISOString().replace('T', ' ').substring(0, 16) + ' UTC',
      status: 'PROVEN',
      txHash: res.txHash,
      policyVerified: true,
      screeningSignature: res.note.nullifier + '_fpi',
      proofFacts: ['STRK20_DEPOSIT_FACT_' + res.txHash.substring(2, 8)],
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

    const res = await strk20Vault.privateTransfer(
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
    const escrow = escrowViewingKeyToAuditor(address, pubKey, '0x4000000000000000000000000000000022d4a132204c382103f6f1c42f02603f');
    const newAuditor: AuditorAccess = {
      id: `auditor-${Date.now()}`,
      label,
      starknetAddress: address,
      publicKey: pubKey,
      viewingKeyEscrowed: true,
      active: true,
      grantedAt: escrow.grantedAt,
      encryptedKeyRef: escrow.encryptedViewingKey,
    };

    setAuditors((prev) => [...prev, newAuditor]);

    const txHex = '0x0' + Array.from({ length: 63 }, () => Math.floor(Math.random() * 16).toString(16)).join('');
    const newTx: VaultTransaction = {
      id: `tx-${Date.now()}`,
      type: 'AUDITOR_DISCLOSURE',
      asset: 'USDC',
      amount: 0,
      recipientOrDepositor: address,
      timestamp: new Date().toISOString().replace('T', ' ').substring(0, 16) + ' UTC',
      status: 'PROVEN',
      txHash: txHex,
      policyVerified: true,
    };

    setTransactions((prev) => [newTx, ...prev]);
    return true;
  };

  const revokeAuditorAccess = (id: string) => {
    setAuditors((prev) => prev.filter((a) => a.id !== id));
  };

  return (
    <VaultContext.Provider
      value={{
        vaultId: 'ADYTON-INSTITUTIONAL-01',
        name: 'Adyton Institutional Alpha Vault',
        isProven: true,
        viewingKey: '0x4000000000000000000000000000000022d4a132204c382103f6f1c42f02603f',
        isBalanceRevealed,
        toggleBalanceReveal,
        holdings,
        policy,
        transactions,
        auditors,
        activeTab,
        setActiveTab: handleSetActiveTab,
        connectedWallet,
        connectWallet,
        disconnectWallet,
        refreshBalances,
        updatePolicy,
        addApprovedRecipient,
        removeApprovedRecipient,
        depositAsset,
        executeTransfer,
        grantAuditorAccess,
        revokeAuditorAccess,
        walletError,
        setWalletError,
      }}
    >
      {children}
    </VaultContext.Provider>
  );
};

export const useVault = (): VaultContextType => {
  const context = useContext(VaultContext);
  if (!context) {
    throw new Error('useVault must be used within a VaultProvider');
  }
  return context;
};
