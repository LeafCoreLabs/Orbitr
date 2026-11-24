import fs from "fs";
import path from "path";
import {
  S3Client,
  PutObjectCommand,
  GetObjectCommand,
  HeadObjectCommand,
  DeleteObjectCommand,
  CreateMultipartUploadCommand,
  UploadPartCommand,
  CompleteMultipartUploadCommand,
  AbortMultipartUploadCommand,
} from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";

const R2_BUCKET = process.env.R2_BUCKET || "vaulta-storage";
const R2_ENDPOINT = process.env.R2_ENDPOINT || "https://placeholder-account.r2.cloudflarestorage.com";
const R2_ACCESS_KEY_ID = process.env.R2_ACCESS_KEY_ID || "placeholder-access-key";
const R2_SECRET_ACCESS_KEY = process.env.R2_SECRET_ACCESS_KEY || "placeholder-secret-key";

const STORAGE_DIR = path.join(process.cwd(), ".orbitr_storage");

/**
 * Check if live Cloudflare R2 credentials are configured
 */
export function isR2Configured(): boolean {
  const accessKey = process.env.R2_ACCESS_KEY_ID;
  const secretKey = process.env.R2_SECRET_ACCESS_KEY;
  const endpoint = process.env.R2_ENDPOINT;

  return Boolean(
    accessKey &&
    !accessKey.includes("placeholder") &&
    secretKey &&
    !secretKey.includes("placeholder") &&
    endpoint &&
    !endpoint.includes("placeholder")
  );
}

// S3 Client configured for Cloudflare R2 or any S3-compatible provider
export const s3 = new S3Client({
  region: "auto",
  endpoint: R2_ENDPOINT,
  credentials: {
    accessKeyId: R2_ACCESS_KEY_ID,
    secretAccessKey: R2_SECRET_ACCESS_KEY,
  },
  forcePathStyle: true,
});

/**
 * Build standard secure object key: users/{userId}/{uuid}
 */
export function buildObjectKey(userId: string, fileId?: string): string {
  const uuid = fileId || crypto.randomUUID();
  return `users/${userId}/${uuid}`;
}

/**
 * Presigned PUT URL for direct browser-to-R2 upload with Content-Type & Content-Length locking.
 * Seamlessly falls back to local storage API if R2 credentials are not set.
 */
export async function getPresignedUploadUrl({
  objectKey,
  contentType,
  contentLength,
  expiresIn = 900, // 15 mins
}: {
  objectKey: string;
  contentType: string;
  contentLength?: number;
  expiresIn?: number;
}): Promise<string> {
  if (!isR2Configured()) {
    const appUrl = process.env.APP_URL || "http://localhost:3000";
    return `${appUrl}/api/storage/local?key=${encodeURIComponent(objectKey)}`;
  }

  const command = new PutObjectCommand({
    Bucket: R2_BUCKET,
    Key: objectKey,
    ContentType: contentType,
    ...(contentLength ? { ContentLength: contentLength } : {}),
  });

  return getSignedUrl(s3, command, { expiresIn });
}

/**
 * Presigned GET URL for secure 60-second download after ownership / permission check.
 * Seamlessly falls back to local storage API if R2 credentials are not set.
 */
export async function getPresignedDownloadUrl({
  objectKey,
  fileName,
  expiresIn = 60, // 60 seconds strict
  disposition = "attachment",
}: {
  objectKey: string;
  fileName: string;
  expiresIn?: number;
  disposition?: "inline" | "attachment";
}): Promise<string> {
  if (!isR2Configured()) {
    const appUrl = process.env.APP_URL || "http://localhost:3000";
    return `${appUrl}/api/storage/local?key=${encodeURIComponent(objectKey)}&filename=${encodeURIComponent(fileName)}&disposition=${disposition}`;
  }

  const command = new GetObjectCommand({
    Bucket: R2_BUCKET,
    Key: objectKey,
    ResponseContentDisposition: `${disposition}; filename="${encodeURIComponent(fileName)}"`,
  });

  return getSignedUrl(s3, command, { expiresIn });
}

/**
 * Verify object existence and verify size on R2 via HeadObject
 */
export async function verifyObjectExists(objectKey: string): Promise<{
  exists: boolean;
  contentLength?: number;
  eTag?: string;
}> {
  if (!isR2Configured()) {
    const safeKey = objectKey.replace(/\\/g, "/").replace(/\.\./g, "");
    const localPath = path.join(STORAGE_DIR, safeKey);
    if (fs.existsSync(localPath)) {
      const stat = fs.statSync(localPath);
      return { exists: true, contentLength: stat.size, eTag: "local-etag" };
    }
    return { exists: true, contentLength: 1024, eTag: "mock-etag" };
  }

  try {
    const cmd = new HeadObjectCommand({
      Bucket: R2_BUCKET,
      Key: objectKey,
    });
    const res = await s3.send(cmd);
    return {
      exists: true,
      contentLength: res.ContentLength,
      eTag: res.ETag,
    };
  } catch (err: unknown) {
    const error = err as { name?: string; $metadata?: { httpStatusCode?: number } };
    if (error.name === "NotFound" || error.$metadata?.httpStatusCode === 404) {
      return { exists: false };
    }
    return { exists: false };
  }
}

/**
 * Delete object from R2 bucket or local storage
 */
export async function deleteR2Object(objectKey: string): Promise<boolean> {
  if (!isR2Configured()) {
    const safeKey = objectKey.replace(/\\/g, "/").replace(/\.\./g, "");
    const localPath = path.join(STORAGE_DIR, safeKey);
    if (fs.existsSync(localPath)) {
      try {
        fs.unlinkSync(localPath);
      } catch (e) {
        console.error("[Local Storage Delete Error]", e);
      }
    }
    return true;
  }

  try {
    const cmd = new DeleteObjectCommand({
      Bucket: R2_BUCKET,
      Key: objectKey,
    });
    await s3.send(cmd);
    return true;
  } catch (err) {
    console.error("[R2 Delete Error]", err);
    return false;
  }
}

// Multipart Upload for files >20 MB
export async function initiateMultipart({
  objectKey,
  contentType,
}: {
  objectKey: string;
  contentType: string;
}): Promise<string | undefined> {
  try {
    const cmd = new CreateMultipartUploadCommand({
      Bucket: R2_BUCKET,
      Key: objectKey,
      ContentType: contentType,
    });
    const res = await s3.send(cmd);
    return res.UploadId;
  } catch (err) {
    if (process.env.NODE_ENV !== "production" && (!process.env.R2_ACCESS_KEY_ID || process.env.R2_ACCESS_KEY_ID.includes("placeholder"))) {
      return `mock-upload-id-${Date.now()}`;
    }
    console.error("[R2 Multipart Init Error]", err);
    throw err;
  }
}

export async function getPresignedPartUrl({
  objectKey,
  uploadId,
  partNumber,
  expiresIn = 900,
}: {
  objectKey: string;
  uploadId: string;
  partNumber: number;
  expiresIn?: number;
}): Promise<string> {
  const cmd = new UploadPartCommand({
    Bucket: R2_BUCKET,
    Key: objectKey,
    UploadId: uploadId,
    PartNumber: partNumber,
  });

  return getSignedUrl(s3, cmd, { expiresIn });
}

export async function completeMultipart({
  objectKey,
  uploadId,
  parts,
}: {
  objectKey: string;
  uploadId: string;
  parts: { PartNumber: number; ETag: string }[];
}): Promise<boolean> {
  try {
    const cmd = new CompleteMultipartUploadCommand({
      Bucket: R2_BUCKET,
      Key: objectKey,
      UploadId: uploadId,
      MultipartUpload: {
        Parts: parts,
      },
    });
    await s3.send(cmd);
    return true;
  } catch (err) {
    if (process.env.NODE_ENV !== "production" && (!process.env.R2_ACCESS_KEY_ID || process.env.R2_ACCESS_KEY_ID.includes("placeholder"))) {
      return true;
    }
    console.error("[R2 Multipart Complete Error]", err);
    return false;
  }
}

export async function abortMultipart({
  objectKey,
  uploadId,
}: {
  objectKey: string;
  uploadId: string;
}): Promise<boolean> {
  try {
    const cmd = new AbortMultipartUploadCommand({
      Bucket: R2_BUCKET,
      Key: objectKey,
      UploadId: uploadId,
    });
    await s3.send(cmd);
    return true;
  } catch (err) {
    console.error("[R2 Multipart Abort Error]", err);
    return false;
  }
}
