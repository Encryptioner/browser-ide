/**
 * Web Crypto API key storage service
 *
 * Encrypts secrets with AES-GCM before storing in sessionStorage.
 * The encryption key is ephemeral (held only in JS memory), so when
 * the tab closes, stored ciphertext becomes unrecoverable. This is
 * intentional: API keys should not survive a browser restart.
 */

import { logger } from '@/utils/logger';

const ALGORITHM = 'AES-GCM';
const KEY_LENGTH = 256;
const IV_BYTES = 12; // 96-bit IV recommended for AES-GCM

/** Cached CryptoKey -- lives only in memory for the current session */
let cachedKey: CryptoKey | null = null;

/** Whether Web Crypto is available in the current context */
let cryptoAvailable: boolean | null = null;

interface EncryptedPayload {
  iv: string; // base64-encoded IV
  ct: string; // base64-encoded ciphertext
}

/**
 * Checks whether the Web Crypto API is usable.
 * Caches the result after the first probe.
 */
function isCryptoAvailable(): boolean {
  if (cryptoAvailable !== null) return cryptoAvailable;

  try {
    cryptoAvailable =
      typeof globalThis.crypto !== 'undefined' &&
      typeof globalThis.crypto.subtle !== 'undefined' &&
      typeof globalThis.crypto.getRandomValues === 'function';
  } catch {
    cryptoAvailable = false;
  }

  if (!cryptoAvailable) {
    logger.warn(
      'Web Crypto API unavailable -- secrets will be stored as plaintext in sessionStorage',
      undefined,
      'CryptoService',
    );
  }

  return cryptoAvailable;
}

/**
 * Returns (or lazily creates) the ephemeral AES-GCM key.
 */
async function getKey(): Promise<CryptoKey> {
  if (cachedKey) return cachedKey;

  cachedKey = await crypto.subtle.generateKey(
    { name: ALGORITHM, length: KEY_LENGTH },
    false, // not extractable
    ['encrypt', 'decrypt'],
  );

  logger.debug('Generated ephemeral AES-GCM encryption key', undefined, 'CryptoService');
  return cachedKey;
}

function uint8ToBase64(bytes: Uint8Array): string {
  let binary = '';
  for (let i = 0; i < bytes.byteLength; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return btoa(binary);
}

function base64ToArrayBuffer(base64: string): ArrayBuffer {
  const binary = atob(base64);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) {
    bytes[i] = binary.charCodeAt(i);
  }
  return bytes.buffer as ArrayBuffer;
}

/**
 * Encrypt a record of secrets into a storable string.
 *
 * When Web Crypto is unavailable, falls back to plain JSON
 * (matching the previous plaintext sessionStorage behaviour).
 */
export async function encryptSecrets(data: Record<string, string>): Promise<string> {
  if (!isCryptoAvailable()) {
    return JSON.stringify(data);
  }

  try {
    const key = await getKey();
    const iv = crypto.getRandomValues(new Uint8Array(IV_BYTES));
    const encoded = new TextEncoder().encode(JSON.stringify(data));

    const cipherBuffer = await crypto.subtle.encrypt(
      { name: ALGORITHM, iv: iv.buffer as ArrayBuffer },
      key,
      encoded,
    );

    const payload: EncryptedPayload = {
      iv: uint8ToBase64(iv),
      ct: uint8ToBase64(new Uint8Array(cipherBuffer)),
    };

    return JSON.stringify(payload);
  } catch (err) {
    logger.error('Failed to encrypt secrets, falling back to plaintext', err, 'CryptoService');
    return JSON.stringify(data);
  }
}

/**
 * Decrypt a previously encrypted string back into the secrets record.
 *
 * If the data is plain JSON (legacy or fallback), it is returned as-is.
 */
export async function decryptSecrets(encrypted: string): Promise<Record<string, string>> {
  const parsed: unknown = JSON.parse(encrypted);

  // Detect whether this is an encrypted payload or plain legacy JSON
  if (
    typeof parsed === 'object' &&
    parsed !== null &&
    'iv' in parsed &&
    'ct' in parsed
  ) {
    if (!isCryptoAvailable()) {
      logger.warn(
        'Found encrypted secrets but Web Crypto is unavailable -- cannot decrypt',
        undefined,
        'CryptoService',
      );
      return {};
    }

    try {
      const { iv, ct } = parsed as EncryptedPayload;
      const key = await getKey();

      const decrypted = await crypto.subtle.decrypt(
        { name: ALGORITHM, iv: base64ToArrayBuffer(iv) },
        key,
        base64ToArrayBuffer(ct),
      );

      return JSON.parse(new TextDecoder().decode(decrypted)) as Record<string, string>;
    } catch (err) {
      logger.error(
        'Failed to decrypt secrets -- key may have been lost (new session)',
        err,
        'CryptoService',
      );
      return {};
    }
  }

  // Plain JSON fallback (legacy data or crypto-unavailable write)
  if (typeof parsed === 'object' && parsed !== null) {
    return parsed as Record<string, string>;
  }

  return {};
}

/**
 * Reset internal state. Exposed only for testing.
 * @internal
 */
export function _resetForTesting(): void {
  cachedKey = null;
  cryptoAvailable = null;
}
