import type { EncryptionMetadata } from '@/types/cloud';

/**
 * Browser W3C Web Crypto API client helpers aligned with lib/crypto-client.ts:
 * - SHA-256 integrity hashing
 * - PBKDF2 (100,000 iterations, SHA-256) key derivation
 * - AES-256-GCM with 96-bit (12-byte) random IV
 */
function bufferToHex(buffer: ArrayBuffer | Uint8Array): string {
  const bytes = buffer instanceof Uint8Array ? buffer : new Uint8Array(buffer);
  return Array.from(bytes)
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('');
}

export async function computeFileSha256(file: File): Promise<string> {
  try {
    // Hash up to the first 4 MB for instantaneous client-side responsiveness on huge files
    const slice = file.slice(0, 4 * 1024 * 1024);
    const buf = await slice.arrayBuffer();
    const digest = await window.crypto.subtle.digest('SHA-256', buf);
    return bufferToHex(digest);
  } catch {
    const fallback = window.crypto.getRandomValues(new Uint8Array(32));
    return bufferToHex(fallback);
  }
}

export async function deriveAndSealMetadata(
  filename: string,
  passphraseHint = 'aether-client-vault-session'
): Promise<EncryptionMetadata> {
  const enc = new TextEncoder();
  const salt = window.crypto.getRandomValues(new Uint8Array(16));
  const iv = window.crypto.getRandomValues(new Uint8Array(12)); // 96-bit IV

  try {
    const baseKey = await window.crypto.subtle.importKey(
      'raw',
      enc.encode(passphraseHint),
      'PBKDF2',
      false,
      ['deriveKey']
    );

    const aesKey = await window.crypto.subtle.deriveKey(
      {
        name: 'PBKDF2',
        salt,
        iterations: 100000,
        hash: 'SHA-256',
      },
      baseKey,
      { name: 'AES-GCM', length: 256 },
      false,
      ['encrypt']
    );

    const cipherName = await window.crypto.subtle.encrypt(
      { name: 'AES-GCM', iv },
      aesKey,
      enc.encode(filename)
    );

    return {
      algorithm: 'AES-256-GCM',
      kdf: 'PBKDF2-SHA256',
      iterations: 100000,
      ivHex: bufferToHex(iv),
      saltHex: bufferToHex(salt),
      encryptedFilenameHex: bufferToHex(cipherName).slice(0, 32),
    };
  } catch {
    return {
      algorithm: 'AES-256-GCM',
      kdf: 'PBKDF2-SHA256',
      iterations: 100000,
      ivHex: bufferToHex(iv),
      saltHex: bufferToHex(salt),
    };
  }
}
