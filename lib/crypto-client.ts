/**
 * Vaulta Client-Side Zero-Knowledge Cryptography Engine
 * Built entirely on the native W3C Web Crypto API.
 * Keys and passphrases never leave the client's device.
 */

const PBKDF2_ITERATIONS = 100000;

export function generateRandomBytes(length = 16): Uint8Array {
  const bytes = new Uint8Array(length);
  crypto.getRandomValues(bytes);
  return bytes;
}

export function bufferToBase64(buf: ArrayBuffer | Uint8Array): string {
  const bytes = buf instanceof Uint8Array ? buf : new Uint8Array(buf);
  let binary = "";
  for (let i = 0; i < bytes.byteLength; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return btoa(binary);
}

export function base64ToBuffer(base64: string): Uint8Array {
  const binary = atob(base64);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) {
    bytes[i] = binary.charCodeAt(i);
  }
  return bytes;
}

/**
 * Derive an AES-256-GCM symmetric key from a user passphrase and a unique salt.
 */
export async function deriveKeyFromPassphrase(
  passphrase: string,
  salt: Uint8Array
): Promise<CryptoKey> {
  const enc = new TextEncoder();
  const keyMaterial = await crypto.subtle.importKey(
    "raw",
    enc.encode(passphrase),
    { name: "PBKDF2" },
    false,
    ["deriveKey"]
  );

  return crypto.subtle.deriveKey(
    {
      name: "PBKDF2",
      salt: salt as BufferSource,
      iterations: PBKDF2_ITERATIONS,
      hash: "SHA-256",
    },
    keyMaterial,
    { name: "AES-GCM", length: 256 },
    true,
    ["encrypt", "decrypt"]
  );
}

/**
 * Encrypt arbitrary binary file data with AES-256-GCM.
 */
export async function encryptFileBuffer(
  fileBuffer: ArrayBuffer,
  key: CryptoKey
): Promise<{ encryptedBuffer: ArrayBuffer; iv: Uint8Array }> {
  const iv = generateRandomBytes(12); // Standard 96-bit IV for AES-GCM
  const ciphertext = await crypto.subtle.encrypt(
    {
      name: "AES-GCM",
      iv: iv as BufferSource,
    },
    key,
    fileBuffer
  );

  return {
    encryptedBuffer: ciphertext,
    iv,
  };
}

/**
 * Decrypt ciphertext buffer back into original file ArrayBuffer.
 */
export async function decryptFileBuffer(
  encryptedBuffer: ArrayBuffer,
  key: CryptoKey,
  iv: Uint8Array
): Promise<ArrayBuffer> {
  return crypto.subtle.decrypt(
    {
      name: "AES-GCM",
      iv: iv as BufferSource,
    },
    key,
    encryptedBuffer
  );
}

/**
 * Encrypt a text string (such as the secret filename in the vault).
 */
export async function encryptText(
  text: string,
  key: CryptoKey
): Promise<{ ciphertext: string; iv: string }> {
  const enc = new TextEncoder();
  const encoded = enc.encode(text);
  const iv = generateRandomBytes(12);

  const encrypted = await crypto.subtle.encrypt(
    {
      name: "AES-GCM",
      iv: iv as BufferSource,
    },
    key,
    encoded
  );

  return {
    ciphertext: bufferToBase64(encrypted),
    iv: bufferToBase64(iv),
  };
}

/**
 * Decrypt a text string.
 */
export async function decryptText(
  ciphertextBase64: string,
  key: CryptoKey,
  ivBase64: string
): Promise<string> {
  const ciphertext = base64ToBuffer(ciphertextBase64);
  const iv = base64ToBuffer(ivBase64);

  const decrypted = await crypto.subtle.decrypt(
    {
      name: "AES-GCM",
      iv: iv as BufferSource,
    },
    key,
    ciphertext as BufferSource
  );

  const dec = new TextDecoder();
  return dec.decode(decrypted);
}

/**
 * Generate a 32-character recovery key for the Private Vault
 * Format: VAULT-XXXX-XXXX-XXXX-XXXX
 */
export function generateRecoveryKey(): string {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  const segments: string[] = [];
  const randomBytes = generateRandomBytes(16);

  for (let s = 0; s < 4; s++) {
    let seg = "";
    for (let c = 0; c < 4; c++) {
      seg += chars[randomBytes[s * 4 + c] % chars.length];
    }
    segments.push(seg);
  }

  return `VAULT-${segments.join("-")}`;
}

/**
 * Client-side SHA-256 hashing for instant deduplication (Smart Storage).
 */
export async function calculateFileSha256(file: File | Blob): Promise<string> {
  const buffer = await file.arrayBuffer();
  const hashBuffer = await crypto.subtle.digest("SHA-256", buffer);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map((b) => b.toString(16).padStart(2, "0")).join("");
}
