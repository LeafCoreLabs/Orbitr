import { z } from "zod";
import { otpPurposeEnum } from "./db/schema";

export const signupSchema = z
  .object({
    name: z.string().min(2, "Name must be at least 2 characters").max(100),
    handle: z
      .string()
      .min(3, "User ID must be at least 3 characters")
      .max(30, "User ID must not exceed 30 characters")
      .regex(/^[a-zA-Z0-9_-]+$/, "User ID can only contain letters, numbers, hyphens, and underscores"),
    dateOfBirth: z
      .string()
      .regex(/^\d{4}-\d{2}-\d{2}$/, "Please select a valid date of birth (YYYY-MM-DD)")
      .refine((dob) => {
        const date = new Date(dob);
        if (isNaN(date.getTime())) return false;
        const now = new Date();
        const ageYears = (now.getTime() - date.getTime()) / (365.25 * 24 * 60 * 60 * 1000);
        return ageYears >= 13 && ageYears <= 125;
      }, "You must be at least 13 years old to register"),
    email: z.string().email("Please enter a valid email address").toLowerCase(),
    password: z
      .string()
      .min(8, "Password must be at least 8 characters")
      .max(128, "Password must not exceed 128 characters")
      .regex(/[A-Z]/, "Password must contain at least one uppercase letter")
      .regex(/[a-z]/, "Password must contain at least one lowercase letter")
      .regex(/[0-9]/, "Password must contain at least one number"),
    confirmPassword: z.string().min(1, "Please confirm your password"),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Passwords do not match",
    path: ["confirmPassword"],
  });

export const loginSchema = z.object({
  email: z.string().min(1, "Email or User ID is required").toLowerCase(),
  password: z.string().optional(),
  passkeyToken: z.string().optional(),
});

export const verifyOtpSchema = z.object({
  email: z.string().email().toLowerCase(),
  code: z.string().regex(/^\d{6}$/, "Code must be exactly 6 digits"),
  purpose: z.enum(otpPurposeEnum),
});

export const resendOtpSchema = z.object({
  email: z.string().email().toLowerCase(),
  purpose: z.enum(otpPurposeEnum),
});

export const forgotPasswordSchema = z.object({
  email: z.string().email().toLowerCase(),
});

export const resetPasswordSchema = z
  .object({
    email: z.string().email().toLowerCase(),
    code: z.string().regex(/^\d{6}$/, "Code must be exactly 6 digits"),
    newPassword: z
      .string()
      .min(8, "Password must be at least 8 characters")
      .max(128)
      .regex(/[A-Z]/, "Password must contain at least one uppercase letter")
      .regex(/[a-z]/, "Password must contain at least one lowercase letter")
      .regex(/[0-9]/, "Password must contain at least one number"),
    confirmNewPassword: z.string().min(1, "Please confirm your new password"),
  })
  .refine((data) => data.newPassword === data.confirmNewPassword, {
    message: "New passwords do not match",
    path: ["confirmNewPassword"],
  });

export const createFolderSchema = z.object({
  name: z.string().trim().min(1, "Folder name is required").max(120),
  parentId: z.string().uuid().nullable().optional(),
  isVault: z.boolean().default(false),
});

export const uploadUrlSchema = z.object({
  name: z.string().trim().min(1, "Filename is required").max(255),
  sizeBytes: z.number().int().positive().max(5368709120, "File exceeds max 5 GB limit"),
  mimeType: z.string().min(1).default("application/octet-stream"),
  folderId: z.string().nullable().optional(),
  sha256: z.string().length(64, "SHA-256 hash required"),
  isEncrypted: z.boolean().default(false),
  encMeta: z.record(z.unknown()).nullable().optional(),
  expiresAt: z.string().datetime().nullable().optional(), // Auto-expiry TTL
});

export const multipartInitSchema = z.object({
  name: z.string().trim().min(1).max(255),
  sizeBytes: z.number().int().positive(),
  mimeType: z.string().min(1),
  partCount: z.number().int().min(1).max(10000),
  folderId: z.string().nullable().optional(),
  sha256: z.string().length(64),
  isEncrypted: z.boolean().default(false),
  encMeta: z.record(z.unknown()).nullable().optional(),
  expiresAt: z.string().datetime().nullable().optional(),
});

export const multipartCompleteSchema = z.object({
  fileId: z.string(),
  uploadId: z.string(),
  parts: z.array(
    z.object({
      partNumber: z.number().int().min(1),
      eTag: z.string(),
    })
  ),
});

export const createShareSchema = z.object({
  fileId: z.string(),
  password: z.string().min(4, "Password must be at least 4 chars").optional().nullable(),
  recipientEmail: z.string().email().toLowerCase().optional().nullable(),
  requireOtp: z.boolean().default(false),
  viewOnly: z.boolean().default(false),
  watermark: z.boolean().default(false),
  expiresAt: z.string().datetime().optional().nullable(),
  availableFrom: z.string().datetime().optional().nullable(), // Time Capsule
  maxViews: z.number().int().positive().optional().nullable(),
  maxDownloads: z.number().int().positive().optional().nullable(),
  burnAfterRead: z.boolean().default(false),
});

export const createDropZoneSchema = z.object({
  folderId: z.string(),
  maxFileSize: z.number().int().positive().default(104857600), // Default 100 MB
  allowedTypes: z.string().default("*/*"),
  expiresAt: z.string().datetime().optional().nullable(),
});

export const createQuickTransferSchema = z.object({
  fileId: z.string(),
});
