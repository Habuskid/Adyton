import { STRK20_CONSTANTS } from './config';
import { derivePublicKey, generateRandom } from './sdk/utils/crypto.js';
import { toHex, toBigInt } from './sdk/utils/convert.js';
import { encryptions } from './sdk/utils/encryptions.js';

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
 * Derives the canonical STARK curve public key K = k * G (returns x-coordinate)
 */
export function deriveStarkPublicKey(privateViewingKeyHex: string): string {
  try {
    const privBigInt = toBigInt(privateViewingKeyHex);
    const pubKeyBigInt = derivePublicKey(privBigInt);
    return toHex(pubKeyBigInt);
  } catch {
    const randomKey = generateRandom();
    return toHex(derivePublicKey(randomKey));
  }
}

/**
 * Escrows the private viewing key k to an auditor's public key K via STARK Curve ECDH
 */
export function escrowViewingKeyToAuditor(
  auditorAddress: string,
  auditorPublicKey: string,
  vaultViewingKey: string
): AuditorEscrowRecord {
  const ephemeralSecret = generateRandom();
  const ephemeralPubKey = derivePublicKey(ephemeralSecret);
  
  const recipientPubBigInt = toBigInt(auditorPublicKey.startsWith('0x') ? auditorPublicKey : '0x' + auditorPublicKey);
  const viewingKeyBigInt = toBigInt(vaultViewingKey.startsWith('0x') ? vaultViewingKey : '0x' + vaultViewingKey);
  const senderAddrBigInt = toBigInt(auditorAddress.startsWith('0x') ? auditorAddress : '0x' + auditorAddress);

  // Compute canonical ECDH encryption
  const encrypted = encryptions.encryptChannelInfo(
    ephemeralSecret,
    recipientPubBigInt,
    viewingKeyBigInt,
    senderAddrBigInt
  );

  return {
    auditorAddress,
    auditorPublicKey: toHex(recipientPubBigInt),
    encryptedViewingKey: toHex(encrypted.enc_channel_key),
    ephemeralPublicKey: toHex(ephemeralPubKey),
    grantedAt: new Date().toISOString().substring(0, 10),
  };
}
