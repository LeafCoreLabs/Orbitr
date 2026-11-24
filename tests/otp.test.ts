import { describe, it, expect } from "vitest";
import { generateOtp, hashOtp, verifyOtpHash } from "@/lib/otp";

describe("Module 1: OTP Cryptographic Engine", () => {
  it("generates a cryptographically secure 6-digit numeric string", () => {
    for (let i = 0; i < 50; i++) {
      const otp = generateOtp();
      expect(otp).toHaveLength(6);
      expect(/^\d{6}$/.test(otp)).toBe(true);
      const num = parseInt(otp, 10);
      expect(num).toBeGreaterThanOrEqual(100000);
      expect(num).toBeLessThanOrEqual(999999);
    }
  });

  it("hashes OTP using HMAC-SHA256 deterministically with pepper", () => {
    const code = "739201";
    const hash1 = hashOtp(code);
    const hash2 = hashOtp(code);

    expect(hash1).toBe(hash2);
    expect(hash1).toHaveLength(64); // SHA256 hex length
    expect(hash1).not.toBe(code);
  });

  it("validates correct OTP code using constant-time verification", () => {
    const code = "849204";
    const hash = hashOtp(code);

    expect(verifyOtpHash(code, hash)).toBe(true);
    expect(verifyOtpHash("000000", hash)).toBe(false);
    expect(verifyOtpHash("849203", hash)).toBe(false);
  });

  it("handles malformed hashes gracefully without throwing", () => {
    expect(verifyOtpHash("123456", "short")).toBe(false);
    expect(verifyOtpHash("123456", "")).toBe(false);
  });
});
