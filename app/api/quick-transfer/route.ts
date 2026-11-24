import { NextRequest, NextResponse } from "next/server";
import crypto from "crypto";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { quickTransfers, files } from "@/lib/db/schema";
import { eq, and } from "drizzle-orm";
import { getPresignedDownloadUrl } from "@/lib/r2";

function generateShortCode(): string {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789"; // Omits ambiguous chars like 0, O, 1, I
  let code = "";
  const randomBytes = crypto.randomBytes(6);
  for (let i = 0; i < 6; i++) {
    code += chars[randomBytes[i] % chars.length];
  }
  return code;
}

// POST: Create Quick Transfer 6-character code
export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const userId = session.user.id;

  try {
    const body = await req.json();
    const { fileId } = body;

    if (!fileId) {
      return NextResponse.json({ error: "File ID is required" }, { status: 400 });
    }

    // Verify ownership
    const fileRes = await db
      .select()
      .from(files)
      .where(and(eq(files.id, fileId), eq(files.userId, userId)))
      .limit(1);

    if (fileRes.length === 0) {
      return NextResponse.json({ error: "File not found or unauthorized" }, { status: 404 });
    }

    const code = generateShortCode();
    const codeHash = crypto.createHash("sha256").update(code).digest("hex");
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes

    await db.insert(quickTransfers).values({
      id: crypto.randomUUID(),
      userId,
      fileId,
      codeHash,
      expiresAt,
      createdAt: new Date(),
    });

    const appUrl = process.env.APP_URL || "http://localhost:3000";
    const transferUrl = `${appUrl}/t/${code}`;

    return NextResponse.json({
      success: true,
      code,
      expiresAt,
      transferUrl,
      fileName: fileRes[0].name,
    });
  } catch (err) {
    console.error("[Quick Transfer Error]", err);
    return NextResponse.json({ error: "Could not create quick transfer" }, { status: 500 });
  }
}

// GET: Claim Quick Transfer by 6-char code (no login required)
export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const code = searchParams.get("code")?.trim().toUpperCase();

  if (!code || code.length !== 6) {
    return NextResponse.json({ error: "Invalid 6-character transfer code." }, { status: 400 });
  }

  try {
    const codeHash = crypto.createHash("sha256").update(code).digest("hex");

    const record = await db
      .select({
        transfer: quickTransfers,
        file: files,
      })
      .from(quickTransfers)
      .innerJoin(files, eq(quickTransfers.fileId, files.id))
      .where(eq(quickTransfers.codeHash, codeHash))
      .limit(1);

    if (record.length === 0) {
      return NextResponse.json({ error: "Transfer code not found or invalid." }, { status: 404 });
    }

    const { transfer, file } = record[0];

    const now = new Date();
    if (transfer.consumedAt) {
      // Allow a 5-minute active window if claimed recently so browser refreshes / retries succeed
      const elapsedSinceConsumed = now.getTime() - new Date(transfer.consumedAt).getTime();
      if (elapsedSinceConsumed > 5 * 60 * 1000) {
        return NextResponse.json(
          { error: "This quick transfer has already been claimed." },
          { status: 410 }
        );
      }
    }

    if (now > new Date(transfer.expiresAt)) {
      return NextResponse.json(
        { error: "This quick transfer code has expired (10-minute limit)." },
        { status: 410 }
      );
    }

    // Mark as consumed
    await db
      .update(quickTransfers)
      .set({ consumedAt: now })
      .where(eq(quickTransfers.id, transfer.id));

    // Generate 60-second presigned GET URL
    const downloadUrl = await getPresignedDownloadUrl({
      objectKey: file.objectKey,
      fileName: file.name,
      expiresIn: 60,
      disposition: "attachment",
    });

    return NextResponse.json({
      success: true,
      fileName: file.name,
      sizeBytes: file.sizeBytes,
      mimeType: file.mimeType,
      downloadUrl,
    });
  } catch (err) {
    console.error("[Claim Quick Transfer Error]", err);
    return NextResponse.json({ error: "Could not claim transfer" }, { status: 500 });
  }
}
