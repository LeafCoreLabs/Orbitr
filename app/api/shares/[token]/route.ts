import { NextRequest, NextResponse } from "next/server";
import crypto from "crypto";
import { db } from "@/lib/db";
import { shares, files, activityLog } from "@/lib/db/schema";
import { eq, or } from "drizzle-orm";
import { verify } from "@node-rs/argon2";
import { getPresignedDownloadUrl, deleteR2Object } from "@/lib/r2";
import { publicShareLimiter } from "@/lib/rate-limit";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ token: string }> }
) {
  const { token } = await params;
  const ip = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "127.0.0.1";
  const userAgent = req.headers.get("user-agent") || "Web Browser";

  // Rate limit
  const limitRes = await publicShareLimiter.limit(`share_access:${ip}`);
  if (!limitRes.success) {
    return NextResponse.json({ error: "Rate limit exceeded. Try again in a minute." }, { status: 429 });
  }

  try {
    // SHA-256 hash lookup of 32-byte token
    const tokenHash = crypto.createHash("sha256").update(token).digest("hex");

    const record = await db
      .select({
        share: shares,
        file: files,
      })
      .from(shares)
      .innerJoin(files, eq(shares.fileId, files.id))
      .where(or(eq(shares.tokenHash, tokenHash), eq(shares.tokenHash, token)))
      .limit(1);

    if (record.length === 0) {
      return NextResponse.json({ error: "Share link not found or invalid." }, { status: 404 });
    }

    const { share, file } = record[0];

    // Check revoked
    if (share.revokedAt) {
      return NextResponse.json(
        { error: "This share link has been revoked or has self-destructed." },
        { status: 410 }
      );
    }

    // Check expiry
    const now = new Date();
    if (share.expiresAt && now > new Date(share.expiresAt)) {
      return NextResponse.json(
        { error: "This share link has expired." },
        { status: 410 }
      );
    }

    // Feature G: Time Capsule check
    if (share.availableFrom && now < new Date(share.availableFrom)) {
      return NextResponse.json({
        status: "time_capsule",
        availableFrom: share.availableFrom,
        fileName: file.name,
        message: "This file is scheduled in a Time Capsule and is not yet unlocked.",
      });
    }

    // Feature B: Burn-after-read view limit check
    if (share.maxViews && share.viewCount >= share.maxViews) {
      // Auto-revoke consumed share
      await db
        .update(shares)
        .set({ revokedAt: now })
        .where(eq(shares.id, share.id));

      if (share.burnAfterRead) {
        // Also purge file object from R2 and DB if burn_after_read auto-deletes file
        await deleteR2Object(file.objectKey);
        await db.delete(files).where(eq(files.id, file.id));
      }

      return NextResponse.json(
        { error: "Maximum view limit reached. This link has self-destructed." },
        { status: 410 }
      );
    }

    // Password verification
    if (share.passwordHash) {
      const providedPassword = req.headers.get("x-share-password");
      if (!providedPassword) {
        return NextResponse.json({
          status: "requires_password",
          fileName: file.name,
          mimeType: file.mimeType,
        });
      }

      const isValidPassword = await verify(share.passwordHash, providedPassword);
      if (!isValidPassword) {
        return NextResponse.json(
          { error: "Incorrect password. Access denied." },
          { status: 401 }
        );
      }
    }

    // Feature C: Recipient OTP verification
    if (share.requireOtp) {
      const verifiedOtpEmail = req.headers.get("x-verified-otp-email");
      if (
        !verifiedOtpEmail ||
        (share.recipientEmail &&
          verifiedOtpEmail.toLowerCase() !== share.recipientEmail.toLowerCase())
      ) {
        return NextResponse.json({
          status: "requires_otp",
          recipientEmail: share.recipientEmail,
          fileName: file.name,
          mimeType: file.mimeType,
        });
      }
    }

    // Handle Download request vs View request
    const { searchParams } = new URL(req.url);
    const isDownload = searchParams.get("download") === "true";

    if (isDownload) {
      // Feature D: Secure view-only mode prevents downloads
      if (share.viewOnly) {
        return NextResponse.json(
          { error: "Download is disabled for this view-only file." },
          { status: 403 }
        );
      }

      // Check download limit
      if (share.maxDownloads && share.downloadCount >= share.maxDownloads) {
        await db.update(shares).set({ revokedAt: now }).where(eq(shares.id, share.id));
        return NextResponse.json(
          { error: "Download limit exceeded. Link expired." },
          { status: 410 }
        );
      }

      // Increment download count
      const nextDownloadCount = share.downloadCount + 1;
      await db
        .update(shares)
        .set({
          downloadCount: nextDownloadCount,
          ...(share.burnAfterRead && share.maxDownloads && nextDownloadCount >= share.maxDownloads
            ? { revokedAt: now }
            : {}),
        })
        .where(eq(shares.id, share.id));

      const downloadUrl = await getPresignedDownloadUrl({
        objectKey: file.objectKey,
        fileName: file.name,
        expiresIn: 60,
        disposition: "attachment",
      });

      await db.insert(activityLog).values({
        id: crypto.randomUUID(),
        userId: file.userId,
        fileId: file.id,
        shareId: share.id,
        action: "share_download",
        ip,
        userAgent,
        createdAt: now,
      });

      return NextResponse.json({ downloadUrl });
    }

    // View / Inline Preview Request
    const nextViewCount = share.viewCount + 1;
    await db
      .update(shares)
      .set({
        viewCount: nextViewCount,
        ...(share.burnAfterRead && share.maxViews && nextViewCount >= share.maxViews
          ? { revokedAt: now }
          : {}),
      })
      .where(eq(shares.id, share.id));

    const previewUrl = await getPresignedDownloadUrl({
      objectKey: file.objectKey,
      fileName: file.name,
      expiresIn: 60,
      disposition: "inline",
    });

    await db.insert(activityLog).values({
      id: crypto.randomUUID(),
      userId: file.userId,
      fileId: file.id,
      shareId: share.id,
      action: "share_view",
      ip,
      userAgent,
      createdAt: now,
    });

    return NextResponse.json({
      status: "ready",
      file: {
        id: file.id,
        name: file.name,
        sizeBytes: file.sizeBytes,
        mimeType: file.mimeType,
        isEncrypted: file.isEncrypted,
        encMeta: file.encMeta,
      },
      previewUrl,
      viewOnly: share.viewOnly,
      watermark: share.watermark,
      recipientEmail: share.recipientEmail,
      burnAfterRead: share.burnAfterRead,
      viewCount: nextViewCount,
      maxViews: share.maxViews,
      downloadCount: share.downloadCount,
      maxDownloads: share.maxDownloads,
      expiresAt: share.expiresAt,
    });
  } catch (err) {
    console.error("[Share Access Error]", err);
    return NextResponse.json({ error: "Failed to load share." }, { status: 500 });
  }
}
