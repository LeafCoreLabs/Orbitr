import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { files, users, otpCodes } from "@/lib/db/schema";
import { and, lt, isNull, isNotNull, eq } from "drizzle-orm";
import { deleteR2Object } from "@/lib/r2";

export async function GET(req: NextRequest) {
  // Verify Cron Secret if configured
  const authHeader = req.headers.get("authorization");
  const cronSecret = process.env.CRON_SECRET;

  if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
    return NextResponse.json({ error: "Unauthorized cron execution." }, { status: 401 });
  }

  const now = new Date();
  const twentyFourHoursAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000);
  const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);

  const report = {
    purgedTrashFiles: 0,
    purgedAbandonedUploads: 0,
    purgedUnverifiedUsers: 0,
    purgedAutoExpiredFiles: 0,
    purgedExpiredOtps: 0,
  };

  try {
    // 1. Purge unverified accounts older than 24 hours
    const unverifiedUsers = await db
      .select({ id: users.id })
      .from(users)
      .where(and(isNull(users.emailVerifiedAt), lt(users.createdAt, twentyFourHoursAgo)));

    for (const u of unverifiedUsers) {
      await db.delete(users).where(eq(users.id, u.id));
      report.purgedUnverifiedUsers += 1;
    }

    // 2. Purge Trash older than 30 days
    const expiredTrash = await db
      .select()
      .from(files)
      .where(and(isNotNull(files.deletedAt), lt(files.deletedAt, thirtyDaysAgo)));

    for (const f of expiredTrash) {
      await deleteR2Object(f.objectKey);
      await db.delete(files).where(eq(files.id, f.id));
      report.purgedTrashFiles += 1;
    }

    // 3. Purge abandoned pending uploads older than 24 hours
    const abandoned = await db
      .select()
      .from(files)
      .where(and(eq(files.status, "pending"), lt(files.createdAt, twentyFourHoursAgo)));

    for (const f of abandoned) {
      await deleteR2Object(f.objectKey);
      await db.delete(files).where(eq(files.id, f.id));
      report.purgedAbandonedUploads += 1;
    }

    // 4. Purge files with auto-expiry TTL (Feature F)
    const autoExpired = await db
      .select()
      .from(files)
      .where(and(isNotNull(files.expiresAt), lt(files.expiresAt, now)));

    for (const f of autoExpired) {
      await deleteR2Object(f.objectKey);
      await db.delete(files).where(eq(files.id, f.id));
      report.purgedAutoExpiredFiles += 1;
    }

    // 5. Purge expired OTP codes
    await db.delete(otpCodes).where(lt(otpCodes.expiresAt, now));

    return NextResponse.json({
      success: true,
      timestamp: now.toISOString(),
      report,
    });
  } catch (err) {
    console.error("[Cron Cleanup Error]", err);
    return NextResponse.json({ error: "Cron maintenance failed" }, { status: 500 });
  }
}
