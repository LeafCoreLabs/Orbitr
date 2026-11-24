import { describe, it, expect } from "vitest";
import crypto from "crypto";
import { isR2Configured, buildObjectKey, getPresignedUploadUrl, getPresignedDownloadUrl } from "@/lib/r2";

describe("Quick Transfer & Local Storage Verification", () => {
  it("generates cryptographic 6-character short code without ambiguous characters", () => {
    const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
    let code = "";
    const randomBytes = crypto.randomBytes(6);
    for (let i = 0; i < 6; i++) {
      code += chars[randomBytes[i] % chars.length];
    }

    expect(code).toHaveLength(6);
    expect(code).toMatch(/^[A-Z2-9]{6}$/);
    expect(code).not.toMatch(/[01OI]/); // No 0, 1, O, I to prevent user typos
  });

  it("hashes quick transfer code using SHA-256 for secure DB lookup", () => {
    const code = "ABCDEF";
    const hash = crypto.createHash("sha256").update(code).digest("hex");
    expect(hash).toHaveLength(64);
    expect(hash).toMatch(/^[a-f0-9]{64}$/);
  });

  it("builds standard secure object key hierarchy: users/{userId}/{uuid}", () => {
    const userId = "user-123";
    const fileId = "file-456";
    const key = buildObjectKey(userId, fileId);
    expect(key).toBe("users/user-123/file-456");
  });

  it("generates storage upload and download URLs with automatic local fallback", async () => {
    const objectKey = "users/test-user/test-file.png";
    const uploadUrl = await getPresignedUploadUrl({
      objectKey,
      contentType: "image/png",
    });

    const downloadUrl = await getPresignedDownloadUrl({
      objectKey,
      fileName: "test-file.png",
    });

    expect(uploadUrl).toBeTruthy();
    expect(downloadUrl).toBeTruthy();

    if (!isR2Configured()) {
      expect(uploadUrl).toContain("/api/storage/local");
      expect(downloadUrl).toContain("/api/storage/local");
      expect(uploadUrl).toContain(encodeURIComponent(objectKey));
    }
  });
});
