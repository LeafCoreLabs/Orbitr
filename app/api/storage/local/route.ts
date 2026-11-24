import { NextRequest, NextResponse } from "next/server";
import fs from "fs";
import path from "path";

const STORAGE_DIR = path.join(process.cwd(), ".orbitr_storage");

function getStoragePath(key: string): string {
  // Sanitize key to prevent path traversal
  const safeKey = key.replace(/\\/g, "/").replace(/\.\./g, "");
  return path.join(STORAGE_DIR, safeKey);
}

// PUT: Direct upload endpoint used when R2 is not configured in local dev
export async function PUT(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const key = searchParams.get("key");

  if (!key) {
    return NextResponse.json({ error: "Storage key required" }, { status: 400 });
  }

  try {
    const filePath = getStoragePath(key);
    const dir = path.dirname(filePath);

    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }

    const arrayBuffer = await req.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);
    fs.writeFileSync(filePath, buffer);

    return new NextResponse(null, {
      status: 200,
      headers: {
        ETag: `"${Date.now()}"`,
      },
    });
  } catch (err) {
    console.error("[Local Storage PUT Error]", err);
    return NextResponse.json({ error: "Failed to store file" }, { status: 500 });
  }
}

// GET: Secure download endpoint used when R2 is not configured in local dev
export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const key = searchParams.get("key");
  const filename = searchParams.get("filename") || "download";
  const disposition = searchParams.get("disposition") || "attachment";

  if (!key) {
    return NextResponse.json({ error: "Storage key required" }, { status: 400 });
  }

  try {
    const filePath = getStoragePath(key);

    if (!fs.existsSync(filePath)) {
      return NextResponse.json({ error: "Object not found in storage" }, { status: 404 });
    }

    const stat = fs.statSync(filePath);
    const fileStream = fs.createReadStream(filePath);

    // Node readable to Web ReadableStream
    const webStream = new ReadableStream({
      start(controller) {
        fileStream.on("data", (chunk) => controller.enqueue(chunk));
        fileStream.on("end", () => controller.close());
        fileStream.on("error", (err) => controller.error(err));
      },
    });

    return new NextResponse(webStream, {
      status: 200,
      headers: {
        "Content-Length": stat.size.toString(),
        "Content-Type": "application/octet-stream",
        "Content-Disposition": `${disposition}; filename="${encodeURIComponent(filename)}"`,
        "Cache-Control": "private, max-age=60",
      },
    });
  } catch (err) {
    console.error("[Local Storage GET Error]", err);
    return NextResponse.json({ error: "Failed to read file from storage" }, { status: 500 });
  }
}

// HEAD: Verify existence and size
export async function HEAD(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const key = searchParams.get("key");

  if (!key) {
    return new NextResponse(null, { status: 400 });
  }

  const filePath = getStoragePath(key);
  if (!fs.existsSync(filePath)) {
    return new NextResponse(null, { status: 404 });
  }

  const stat = fs.statSync(filePath);
  return new NextResponse(null, {
    status: 200,
    headers: {
      "Content-Length": stat.size.toString(),
      ETag: `"${Date.now()}"`,
    },
  });
}
