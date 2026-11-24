import { describe, it, expect } from "vitest";

describe("Smart Storage Cleaner Logic", () => {
  it("identifies duplicate files sharing identical SHA-256 hashes", () => {
    const files = [
      { id: "1", name: "report.pdf", sizeBytes: 1024, sha256: "hash-a" },
      { id: "2", name: "report_copy.pdf", sizeBytes: 1024, sha256: "hash-a" },
      { id: "3", name: "report_backup.pdf", sizeBytes: 1024, sha256: "hash-a" },
      { id: "4", name: "unique_photo.jpg", sizeBytes: 2048, sha256: "hash-b" },
    ];

    const shaMap = new Map<string, typeof files>();
    for (const f of files) {
      const group = shaMap.get(f.sha256) || [];
      group.push(f);
      shaMap.set(f.sha256, group);
    }

    const duplicateCopies: typeof files = [];
    for (const [, group] of shaMap) {
      if (group.length > 1) {
        duplicateCopies.push(...group.slice(1));
      }
    }

    expect(duplicateCopies).toHaveLength(2);
    expect(duplicateCopies.map((f) => f.id)).toEqual(["2", "3"]);
    // Original copy remains protected
    expect(duplicateCopies.map((f) => f.id)).not.toContain("1");
  });

  it("filters large files above 5MB threshold", () => {
    const files = [
      { id: "1", name: "small.txt", sizeBytes: 500 },
      { id: "2", name: "large_video.mp4", sizeBytes: 50 * 1024 * 1024 },
      { id: "3", name: "medium.pdf", sizeBytes: 2 * 1024 * 1024 },
    ];

    const threshold = 5 * 1024 * 1024;
    const large = files.filter((f) => f.sizeBytes > threshold);
    expect(large).toHaveLength(1);
    expect(large[0].name).toBe("large_video.mp4");
  });
});
