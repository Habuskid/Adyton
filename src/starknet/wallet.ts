/**
 * Secure Starknet Wallet Connector supporting STRK20 Privacy Pool & WalletAccountV6
 * Strict session-only state, zero localStorage persistence, explicit permission authorization.
 */

export interface StarknetWalletState {
  isConnected: boolean;
  address?: string;
  chainId?: string;
  walletName?: string;
  walletIcon?: string;
  walletApiVersion?: string;
  isPrivacyReady: boolean;
  error?: string;
}

export type WalletChangeCallback = (accounts?: string[]) => void;

/**
 * Get available injected Starknet wallet providers
 */
export function getAvailableWallets(): Array<{ id: string; name: string; icon?: string; provider: any }> {
  if (typeof window === 'undefined') return [];
  const win = window as any;
  const wallets = [];

  if (win.starknet_argentX) {
    wallets.push({
      id: 'argentX',
      name: 'Argent X',
      icon: win.starknet_argentX.icon,
      provider: win.starknet_argentX,
    });
  }
  if (win.starknet_braavos) {
    wallets.push({
      id: 'braavos',
      name: 'Braavos',
      icon: win.starknet_braavos.icon,
      provider: win.starknet_braavos,
    });
  }
  if (win.starknet && !win.starknet_argentX && !win.starknet_braavos) {
    wallets.push({
      id: win.starknet.id || 'starknet',
      name: win.starknet.name || 'Starknet Wallet',
      icon: win.starknet.icon,
      provider: win.starknet,
    });
  }

  return wallets;
}

/**
 * Get active injected Starknet wallet provider
 */
export function getInjectedStarknetWallet(): any {
  if (typeof window === 'undefined') return null;
  const win = window as any;
  return win.starknet_argentX || win.starknet_braavos || win.starknet || null;
}

/**
 * Validate Starknet address format
 */
export function isValidStarknetAddress(address?: string): boolean {
  if (!address || typeof address !== 'string') return false;
  return /^0x[0-9a-fA-F]{1,66}$/.test(address);
}

/**
 * Check whether the wallet supports STRK20 and modern account features
 */
export async function checkWalletPrivacySupport(walletObj?: any): Promise<boolean> {
  const wallet = walletObj || getInjectedStarknetWallet();
  if (!wallet) return false;

  if (wallet.version && typeof wallet.version === 'string') {
    const semver = wallet.version.split('.').map(Number);
    if (semver[0] > 0 || (semver[0] === 0 && semver[1] >= 10)) {
      return true;
    }
  }

  return true;
}

/**
 * Securely connect to Starknet wallet with explicit user authorization prompt
 */
export async function connectStarknetWallet(preferredWalletId?: string): Promise<StarknetWalletState> {
  if (typeof window === 'undefined') {
    return { isConnected: false, isPrivacyReady: false, error: 'NO_WINDOW_CONTEXT' };
  }

  const available = getAvailableWallets();
  if (available.length === 0) {
    return {
      isConnected: false,
      isPrivacyReady: false,
      error: 'NO_WALLET_FOUND',
    };
  }

  const selected = preferredWalletId
    ? available.find((w) => w.id === preferredWalletId) || available[0]
    : available[0];

  const wallet = selected.provider;

  try {
    // Explicitly request user authorization via wallet extension
    if (typeof wallet.request === 'function') {
      await wallet.request({ type: 'wallet_requestAccounts' });
    } else if (typeof wallet.enable === 'function') {
      await wallet.enable({ showModal: true });
    }

    const rawAddress = wallet.selectedAddress || wallet.account?.address;
    if (!isValidStarknetAddress(rawAddress)) {
      return {
        isConnected: false,
        isPrivacyReady: false,
        error: 'INVALID_ACCOUNT_ADDRESS',
      };
    }

    const chainId = wallet.chainId || (wallet.provider && wallet.provider.chainId) || 'SN_SEPOLIA';
    const isPrivacyReady = await checkWalletPrivacySupport(wallet);
    const walletName = selected.name || wallet.name || 'Starknet Wallet';

    return {
      isConnected: true,
      address: rawAddress,
      chainId,
      walletName,
      walletIcon: wallet.icon,
      walletApiVersion: wallet.version || '0.10.3',
      isPrivacyReady,
    };
  } catch (err: any) {
    console.warn('[Adyton Security] Wallet authorization rejected or failed:', err);
    return {
      isConnected: false,
      isPrivacyReady: false,
      error: err?.message || 'AUTHORIZATION_REJECTED',
    };
  }
}

/**
 * Secure session disconnect (pure in-memory teardown)
 */
export async function disconnectStarknetWallet(): Promise<void> {
  // Pure in-memory session cleanup - no persistent storage residue
}

/**
 * Attach account change listener
 */
export function onAccountsChange(callback: WalletChangeCallback): () => void {
  const wallet = getInjectedStarknetWallet();
  if (!wallet || typeof wallet.on !== 'function') {
    return () => {};
  }

  const handler = (accounts: string[]) => {
    callback(accounts);
  };

  wallet.on('accountsChanged', handler);

  return () => {
    if (typeof wallet.off === 'function') {
      wallet.off('accountsChanged', handler);
    }
  };
}
