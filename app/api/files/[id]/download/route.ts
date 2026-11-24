import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { files, activityLog } from "@/lib/db/schema";
import { eq, and, isNull } from "drizzle-orm";
import { getPresignedDownloadUrl } from "@/lib/r2";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id: fileId } = await params;
  const userId = session.user.id;
  const { searchParams } = new URL(req.url);
  const inline = searchParams.get("inline") === "true";

  try {
    const fileRes = await db
      .select()
      .from(files)
      .where(
        and(
          eq(files.id, fileId),
          isNull(files.deletedAt)
        )
      )
      .limit(1);

    if (fileRes.length === 0) {
      return NextResponse.json({ error: "File not found" }, { status: 404 });
    }

    const file = fileRes[0];

    // Ownership check (Prevents IDOR)
    if (file.userId !== userId) {
      return NextResponse.json({ error: "Forbidden: Access denied" }, { status: 403 });
    }

    // Generate strict 60-second presigned GET URL
    const downloadUrl = await getPresignedDownloadUrl({
      objectKey: file.objectKey,
      fileName: file.name,
      expiresIn: 60, // 60 seconds strict
      disposition: inline ? "inline" : "attachment",
    });

    // Activity Log
    const ip = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "127.0.0.1";
    const userAgent = req.headers.get("user-agent") || "Web Browser";

    await db.insert(activityLog).values({
      id: crypto.randomUUID(),
      userId,
      fileId: file.id,
      action: inline ? "view" : "download",
      ip,
      userAgent,
      createdAt: new Date(),
    });

    return NextResponse.json({
      downloadUrl,
      fileName: file.name,
      mimeType: file.mimeType,
      sizeBytes: file.sizeBytes,
      isEncrypted: file.isEncrypted,
      encMeta: file.encMeta,
      expiresIn: 60,
    });
  } catch (err) {
    console.error("[Download Error]", err);
    return NextResponse.json(
      { error: "Could not generate download access." },
      { status: 500 }
    );
  }
}
