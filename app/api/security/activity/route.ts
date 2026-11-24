import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { activityLog, files } from "@/lib/db/schema";
import { eq, desc } from "drizzle-orm";

export async function GET(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const userId = session.user.id;
  const { searchParams } = new URL(req.url);
  const limit = Math.min(100, parseInt(searchParams.get("limit") || "50", 10));

  try {
    const logs = await db
      .select({
        log: activityLog,
        fileName: files.name,
      })
      .from(activityLog)
      .leftJoin(files, eq(activityLog.fileId, files.id))
      .where(eq(activityLog.userId, userId))
      .orderBy(desc(activityLog.createdAt))
      .limit(limit);

    return NextResponse.json({ logs });
  } catch (err) {
    console.error("[Get Activity Error]", err);
    return NextResponse.json({ error: "Could not retrieve activity logs" }, { status: 500 });
  }
}
