import { NextRequest, NextResponse } from "next/server";
import crypto from "crypto";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { shares, files, users } from "@/lib/db/schema";
import { eq, and, desc } from "drizzle-orm";
import { createShareSchema } from "@/lib/validators";
import { hash } from "@node-rs/argon2";
import { mailer } from "@/lib/mailer";

export async function GET() {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const userId = session.user.id;

  try {
    const userShares = await db
      .select({
        share: shares,
        file: files,
      })
      .from(shares)
      .innerJoin(files, eq(shares.fileId, files.id))
      .where(eq(files.userId, userId))
      .orderBy(desc(shares.createdAt));

    return NextResponse.json({ shares: userShares });
  } catch (err) {
    console.error("[Get Shares Error]", err);
    return NextResponse.json({ error: "Could not fetch shares" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const userId = session.user.id;

  try {
    const body = await req.json();
    const parsed = createShareSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.issues[0]?.message || "Invalid share options" },
        { status: 400 }
      );
    }

    const {
      fileId,
      password,
      recipientEmail,
      requireOtp,
      viewOnly,
      watermark,
      expiresAt,
      availableFrom,
      maxViews,
      maxDownloads,
      burnAfterRead,
    } = parsed.data;

    // Verify ownership of the file
    const fileRes = await db
      .select()
      .from(files)
      .where(and(eq(files.id, fileId), eq(files.userId, userId)))
      .limit(1);

    if (fileRes.length === 0) {
      return NextResponse.json({ error: "File not found or unauthorized" }, { status: 404 });
    }

    const file = fileRes[0];

    // Generate 32 cryptographically secure random bytes
    const token = crypto.randomBytes(32).toString("hex");
    // Store ONLY SHA-256 hash in database
    const tokenHash = crypto.createHash("sha256").update(token).digest("hex");

    let passwordHash: string | null = null;
    if (password && password.trim().length > 0) {
      passwordHash = await hash(password.trim());
    }

    const shareId = crypto.randomUUID();

    await db.insert(shares).values({
      id: shareId,
      fileId,
      tokenHash,
      passwordHash,
      recipientEmail: recipientEmail || null,
      requireOtp: Boolean(requireOtp),
      viewOnly: Boolean(viewOnly),
      watermark: Boolean(watermark),
      expiresAt: expiresAt ? new Date(expiresAt) : null,
      availableFrom: availableFrom ? new Date(availableFrom) : null,
      maxViews: maxViews || null,
      maxDownloads: maxDownloads || null,
      viewCount: 0,
      downloadCount: 0,
      burnAfterRead: Boolean(burnAfterRead),
      revokedAt: null,
      createdAt: new Date(),
    });

    const appUrl = process.env.APP_URL || "http://localhost:3000";
    const shareUrl = `${appUrl}/s/${token}`;

    // If recipient email is specified, dispatch invite email via Module 1 Mailer
    if (recipientEmail) {
      const senderName = session.user.name || "A Vaulta user";
      await mailer.sendShareInvite(recipientEmail, {
        senderName,
        fileName: file.name,
        shareUrl,
        expiresAt: expiresAt ? new Date(expiresAt).toLocaleDateString() : undefined,
        requiresOtp: Boolean(requireOtp),
      });
    }

    return NextResponse.json({
      success: true,
      shareId,
      token,
      shareUrl,
    });
  } catch (err) {
    console.error("[Create Share Error]", err);
    return NextResponse.json({ error: "Could not create share link" }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(req.url);
  const shareId = searchParams.get("id");

  if (!shareId) {
    return NextResponse.json({ error: "Missing share ID" }, { status: 400 });
  }

  // Revoke share
  await db
    .update(shares)
    .set({ revokedAt: new Date() })
    .where(eq(shares.id, shareId));

  return NextResponse.json({ success: true, message: "Share revoked" });
}
