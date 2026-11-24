import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { files, users, activityLog } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { verifyObjectExists } from "@/lib/r2";

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id: fileId } = await params;
  const userId = session.user.id;

  try {
    const fileRes = await db
      .select()
      .from(files)
      .where(eq(files.id, fileId))
      .limit(1);

    if (fileRes.length === 0) {
      return NextResponse.json({ error: "File record not found" }, { status: 404 });
    }

    const file = fileRes[0];

    // Ownership check (IDOR prevention)
    if (file.userId !== userId) {
      return NextResponse.json({ error: "Forbidden: Access denied" }, { status: 403 });
    }

    if (file.status === "ready") {
      return NextResponse.json({ success: true, file });
    }

    // Verify object on Cloudflare R2
    const verifyRes = await verifyObjectExists(file.objectKey);
    if (!verifyRes.exists) {
      return NextResponse.json(
        { error: "File upload not detected on storage. Please try again." },
        { status: 400 }
      );
    }

    // Mark as ready
    await db
      .update(files)
      .set({ status: "ready" })
      .where(eq(files.id, fileId));

    // Update user quota used_bytes
    const user = await db
      .select({ usedBytes: users.usedBytes })
      .from(users)
      .where(eq(users.id, userId))
      .limit(1);

    if (user.length > 0) {
      await db
        .update(users)
        .set({ usedBytes: user[0].usedBytes + file.sizeBytes })
        .where(eq(users.id, userId));
    }

    // Activity log
    const ip = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "127.0.0.1";
    const userAgent = req.headers.get("user-agent") || "Web Browser";

    await db.insert(activityLog).values({
      id: crypto.randomUUID(),
      userId,
      fileId: file.id,
      action: "upload",
      ip,
      userAgent,
      createdAt: new Date(),
    });

    return NextResponse.json({
      success: true,
      file: { ...file, status: "ready" },
    });
  } catch (err) {
    console.error("[Complete Upload Error]", err);
    return NextResponse.json(
      { error: "Could not finalize file upload." },
      { status: 500 }
    );
  }
}
