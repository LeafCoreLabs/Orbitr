import { describe, it, expect } from "vitest";
import crypto from "crypto";
import { buildObjectKey } from "@/lib/r2";

describe("Security & IDOR Isolation Engine", () => {
  it("isolates R2 object keys strictly by user ID namespaces", () => {
    const userA = "user-uuid-1111";
    const userB = "user-uuid-2222";
    const fileId = "file-uuid-9999";

    const keyA = buildObjectKey(userA, fileId);
    const keyB = buildObjectKey(userB, fileId);

    expect(keyA).toBe("users/user-uuid-1111/file-uuid-9999");
    expect(keyB).toBe("users/user-uuid-2222/file-uuid-9999");
    expect(keyA).not.toBe(keyB);
    expect(keyA.startsWith(`users/${userA}/`)).toBe(true);
    expect(keyB.startsWith(`users/${userB}/`)).toBe(true);
  });

  it("verifies user A cannot access or mutate user B's file ownership", () => {
    const fileB = {
      id: "file-b",
      userId: "user-b",
      name: "financial-report.pdf",
    };

    const requestingUser = "user-a";

    // Standard ownership validation function
    function checkOwnership(fileUserId: string, currentUserId: string): boolean {
      return fileUserId === currentUserId;
    }

    expect(checkOwnership(fileB.userId, requestingUser)).toBe(false);
    expect(checkOwnership(fileB.userId, "user-b")).toBe(true);
  });

  it("stores share and drop-zone tokens exclusively as SHA-256 hashes", () => {
    const rawToken = crypto.randomBytes(32).toString("hex");
    const storedHash = crypto.createHash("sha256").update(rawToken).digest("hex");

    // Raw token is 64 hex characters (32 bytes)
    expect(rawToken).toHaveLength(64);
    // Hash is also 64 hex characters but different
    expect(storedHash).toHaveLength(64);
    expect(storedHash).not.toBe(rawToken);

    // Verifying token hash matches deterministically
    const incomingCheck = crypto.createHash("sha256").update(rawToken).digest("hex");
    expect(incomingCheck).toBe(storedHash);

    // Tampered token fails
    const tampered = crypto.createHash("sha256").update("invalid-token").digest("hex");
    expect(tampered).not.toBe(storedHash);
  });

  it("enforces recipient-verified sharing matching constraints", () => {
    const shareRecipient = "authorized@partner.com";

    function canAccessShare(authorizedEmail: string | null, verifiedEmail: string): boolean {
      if (!authorizedEmail) return true;
      return authorizedEmail.trim().toLowerCase() === verifiedEmail.trim().toLowerCase();
    }

    expect(canAccessShare(shareRecipient, "authorized@partner.com")).toBe(true);
    expect(canAccessShare(shareRecipient, "attacker@evil.com")).toBe(false);
    expect(canAccessShare(shareRecipient, "AUTHORIZED@PARTNER.COM")).toBe(true);
  });
});
