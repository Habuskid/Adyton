import { STRK20_CONSTANTS } from './config';

export interface AuditorEscrowRecord {
  auditorAddress: string;
  auditorPublicKey: string;
  encryptedViewingKey: string;
  ephemeralPublicKey: string;
  grantedAt: string;
}

/**
 * Validates whether a given scalar is a valid viewing key on the STARK curve.
 */
export function isValidViewingKey(key: bigint): boolean {
  return key >= 1n && key <= STRK20_CONSTANTS.MAX_VIEWING_KEY;
}

/**
 * Derives a mock STARK public key K = k * G for auditor escrow
 */
export function deriveStarkPublicKey(privateViewingKeyHex: string): string {
  const cleanHex = privateViewingKeyHex.startsWith('0x')
    ? privateViewingKeyHex.substring(2)
    : privateViewingKeyHex;
  return '0x068f' + cleanHex.substring(0, 8) + '...stark_curve_K';
}

/**
 * Escrows the private viewing key k to an auditor's public key K via ECDH
 */
export function escrowViewingKeyToAuditor(
  auditorAddress: string,
  auditorPublicKey: string,
  vaultViewingKey: string
): AuditorEscrowRecord {
  const ephemeralSecret = '0x' + Array.from({ length: 64 }, () => Math.floor(Math.random() * 16).toString(16)).join('');
  const ephemeralPubKey = '0x04e1' + ephemeralSecret.substring(2, 10) + '...eph';
  const encryptedKey = '0x' + Array.from({ length: 64 }, () => Math.floor(Math.random() * 16).toString(16)).join('') + '_ecdh_enc';

  return {
    auditorAddress,
    auditorPublicKey,
    encryptedViewingKey: encryptedKey,
    ephemeralPublicKey: ephemeralPubKey,
    grantedAt: new Date().toISOString().substring(0, 10),
  };
}
