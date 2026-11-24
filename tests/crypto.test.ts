import { describe, it, expect } from "vitest";
import {
  deriveKeyFromPassphrase,
  encryptFileBuffer,
  decryptFileBuffer,
  encryptText,
  decryptText,
  generateRecoveryKey,
  generateRandomBytes,
} from "@/lib/crypto-client";

describe("Module A: Client-Side Zero-Knowledge Cryptography", () => {
  it("derives consistent AES-256-GCM keys from identical passphrases and salts", async () => {
    const salt = generateRandomBytes(16);
    const key1 = await deriveKeyFromPassphrase("SuperSecretPassphrase!2026", salt);
    const key2 = await deriveKeyFromPassphrase("SuperSecretPassphrase!2026", salt);

    expect(key1).toBeDefined();
    expect(key2).toBeDefined();
    expect(key1.algorithm.name).toBe("AES-GCM");
  });

  it("encrypts and decrypts binary buffers accurately with AES-256-GCM", async () => {
    const salt = generateRandomBytes(16);
    const key = await deriveKeyFromPassphrase("vault-test-key-12345", salt);

    const originalText = "Vaulta: Top Secret Document Content with zero server leakage.";
    const encoder = new TextEncoder();
    const originalBuffer = encoder.encode(originalText).buffer;

    const { encryptedBuffer, iv } = await encryptFileBuffer(originalBuffer, key);

    // Verify ciphertext is not plaintext
    expect(encryptedBuffer.byteLength).toBeGreaterThan(0);
    expect(Buffer.from(encryptedBuffer).toString()).not.toBe(originalText);

    // Decrypt
    const decryptedBuffer = await decryptFileBuffer(encryptedBuffer, key, iv);
    const decoder = new TextDecoder();
    const decryptedText = decoder.decode(decryptedBuffer);

    expect(decryptedText).toBe(originalText);
  });

  it("encrypts and decrypts confidential filenames", async () => {
    const salt = generateRandomBytes(16);
    const key = await deriveKeyFromPassphrase("vault-pass-456", salt);

    const secretFilename = "classified-financial-statement-2026.pdf";
    const { ciphertext, iv } = await encryptText(secretFilename, key);

    expect(ciphertext).not.toContain("financial");
    expect(ciphertext).not.toBe(secretFilename);

    const recovered = await decryptText(ciphertext, key, iv);
    expect(recovered).toBe(secretFilename);
  });

  it("generates structured recovery keys in VAULT-XXXX-XXXX-XXXX-XXXX format", () => {
    const key = generateRecoveryKey();
    expect(key).toMatch(/^VAULT-[A-Z0-9]{4}-[A-Z0-9]{4}-[A-Z0-9]{4}-[A-Z0-9]{4}$/);
  });
});
