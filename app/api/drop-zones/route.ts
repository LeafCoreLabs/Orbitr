import { NextRequest, NextResponse } from "next/server";
import crypto from "crypto";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { dropZones, folders } from "@/lib/db/schema";
import { eq, desc } from "drizzle-orm";
import { createDropZoneSchema } from "@/lib/validators";

export async function GET() {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const userId = session.user.id;

  try {
    const list = await db
      .select({
        dropZone: dropZones,
        folder: folders,
      })
      .from(dropZones)
      .innerJoin(folders, eq(dropZones.folderId, folders.id))
      .where(eq(dropZones.userId, userId))
      .orderBy(desc(dropZones.createdAt));

    return NextResponse.json({ dropZones: list });
  } catch (err) {
    console.error("[Get Drop Zones Error]", err);
    return NextResponse.json({ error: "Could not fetch drop zones" }, { status: 500 });
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
    const parsed = createDropZoneSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.issues[0]?.message || "Invalid drop zone details" },
        { status: 400 }
      );
    }

    const { folderId, maxFileSize, allowedTypes, expiresAt } = parsed.data;

    // Verify folder ownership
    const folderRes = await db
      .select()
      .from(folders)
      .where(eq(folders.id, folderId))
      .limit(1);

    if (folderRes.length === 0 || folderRes[0].userId !== userId) {
      return NextResponse.json({ error: "Folder not found or unauthorized" }, { status: 404 });
    }

    // Generate 32-byte token and store ONLY SHA-256 hash
    const token = crypto.randomBytes(32).toString("hex");
    const tokenHash = crypto.createHash("sha256").update(token).digest("hex");
    const dropZoneId = crypto.randomUUID();

    await db.insert(dropZones).values({
      id: dropZoneId,
      userId,
      folderId,
      tokenHash,
      maxFileSize,
      allowedTypes: allowedTypes || "*/*",
      expiresAt: expiresAt ? new Date(expiresAt) : null,
      createdAt: new Date(),
    });

    const appUrl = process.env.APP_URL || "http://localhost:3000";
    const dropZoneUrl = `${appUrl}/d/${token}`;

    return NextResponse.json({
      success: true,
      dropZoneId,
      token,
      dropZoneUrl,
    });
  } catch (err) {
    console.error("[Create Drop Zone Error]", err);
    return NextResponse.json({ error: "Could not create drop zone" }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(req.url);
  const id = searchParams.get("id");

  if (!id) {
    return NextResponse.json({ error: "Missing drop zone ID" }, { status: 400 });
  }

  await db
    .update(dropZones)
    .set({ revokedAt: new Date() })
    .where(eq(dropZones.id, id));

  return NextResponse.json({ success: true, message: "Drop zone revoked" });
}
