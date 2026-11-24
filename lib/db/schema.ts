import {
  pgTable,
  text,
  timestamp,
  bigint,
  boolean,
  integer,
  jsonb,
  index,
  primaryKey,
} from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";

export const users = pgTable("users", {
  id: text("id").primaryKey(),
  email: text("email").notNull().unique(),
  handle: text("handle").unique(), // Unique User ID / handle
  name: text("name").notNull(),
  dateOfBirth: text("date_of_birth"), // YYYY-MM-DD
  passwordHash: text("password_hash"),
  emailVerifiedAt: timestamp("email_verified_at", { withTimezone: true }),
  quotaBytes: bigint("quota_bytes", { mode: "number" }).notNull().default(2147483648), // 2 GB default
  usedBytes: bigint("used_bytes", { mode: "number" }).notNull().default(0),
  totpSecretEnc: text("totp_secret_enc"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const otpPurposeEnum = [
  "signup",
  "login_new_device",
  "password_reset",
  "share_access",
  "sensitive_action",
] as const;

export type OtpPurpose = (typeof otpPurposeEnum)[number];

export const otpCodes = pgTable(
  "otp_codes",
  {
    id: text("id").primaryKey(),
    email: text("email").notNull(),
    userId: text("user_id").references(() => users.id, { onDelete: "cascade" }),
    purpose: text("purpose").notNull(), // 'signup' | 'login_new_device' | 'password_reset' | 'share_access' | 'sensitive_action'
    codeHash: text("code_hash").notNull(),
    expiresAt: timestamp("expires_at", { withTimezone: true }).notNull(),
    attempts: integer("attempts").notNull().default(0),
    consumedAt: timestamp("consumed_at", { withTimezone: true }),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    ip: text("ip"),
    userAgent: text("user_agent"),
  },
  (table) => [
    index("otp_email_purpose_idx").on(table.email, table.purpose),
  ]
);

export const sessionsDevices = pgTable("sessions_devices", {
  id: text("id").primaryKey(),
  userId: text("user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  deviceLabel: text("device_label").notNull(),
  ip: text("ip"),
  lastSeenAt: timestamp("last_seen_at", { withTimezone: true }).notNull().defaultNow(),
  revokedAt: timestamp("revoked_at", { withTimezone: true }),
});

export const authenticators = pgTable("authenticators", {
  id: text("id").primaryKey(), // base64url credential ID
  userId: text("user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  credentialPublicKey: text("credential_public_key").notNull(), // base64url or hex
  counter: bigint("counter", { mode: "number" }).notNull().default(0),
  credentialDeviceType: text("credential_device_type").notNull().default("singleDevice"),
  credentialBackedUp: boolean("credential_backed_up").notNull().default(false),
  transports: text("transports"), // JSON array string
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const passkeyChallenges = pgTable("passkey_challenges", {
  id: text("id").primaryKey(),
  challenge: text("challenge").notNull(),
  userId: text("user_id"),
  expiresAt: timestamp("expires_at", { withTimezone: true }).notNull(),
});

export const folders = pgTable("folders", {
  id: text("id").primaryKey(),
  userId: text("user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  parentId: text("parent_id"),
  name: text("name").notNull(),
  isVault: boolean("is_vault").notNull().default(false),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  deletedAt: timestamp("deleted_at", { withTimezone: true }),
});

export const fileStatusEnum = ["pending", "ready"] as const;
export type FileStatus = (typeof fileStatusEnum)[number];

export const files = pgTable(
  "files",
  {
    id: text("id").primaryKey(),
    userId: text("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    folderId: text("folder_id").references(() => folders.id, {
      onDelete: "set null",
    }),
    name: text("name").notNull(),
    sizeBytes: bigint("size_bytes", { mode: "number" }).notNull(),
    mimeType: text("mime_type").notNull(),
    objectKey: text("object_key").notNull().unique(),
    sha256: text("sha256").notNull(),
    isEncrypted: boolean("is_encrypted").notNull().default(false),
    encMeta: jsonb("enc_meta"),
    expiresAt: timestamp("expires_at", { withTimezone: true }),
    status: text("status").notNull().default("pending"),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    deletedAt: timestamp("deleted_at", { withTimezone: true }),
  },
  (table) => [
    index("files_user_folder_deleted_idx").on(
      table.userId,
      table.folderId,
      table.deletedAt
    ),
    index("files_sha256_idx").on(table.sha256),
  ]
);

export const shares = pgTable(
  "shares",
  {
    id: text("id").primaryKey(),
    fileId: text("file_id")
      .notNull()
      .references(() => files.id, { onDelete: "cascade" }),
    tokenHash: text("token_hash").notNull().unique(),
    passwordHash: text("password_hash"),
    recipientEmail: text("recipient_email"),
    requireOtp: boolean("require_otp").notNull().default(false),
    viewOnly: boolean("view_only").notNull().default(false),
    watermark: boolean("watermark").notNull().default(false),
    expiresAt: timestamp("expires_at", { withTimezone: true }),
    availableFrom: timestamp("available_from", { withTimezone: true }),
    maxViews: integer("max_views"),
    maxDownloads: integer("max_downloads"),
    viewCount: integer("view_count").notNull().default(0),
    downloadCount: integer("download_count").notNull().default(0),
    burnAfterRead: boolean("burn_after_read").notNull().default(false),
    revokedAt: timestamp("revoked_at", { withTimezone: true }),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [
    index("shares_token_hash_idx").on(table.tokenHash),
  ]
);

export const dropZones = pgTable("drop_zones", {
  id: text("id").primaryKey(),
  userId: text("user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  folderId: text("folder_id")
    .notNull()
    .references(() => folders.id, { onDelete: "cascade" }),
  tokenHash: text("token_hash").notNull().unique(),
  maxFileSize: bigint("max_file_size", { mode: "number" }).notNull(),
  allowedTypes: text("allowed_types").notNull().default("*/*"),
  expiresAt: timestamp("expires_at", { withTimezone: true }),
  revokedAt: timestamp("revoked_at", { withTimezone: true }),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const quickTransfers = pgTable("quick_transfers", {
  id: text("id").primaryKey(),
  userId: text("user_id").references(() => users.id, { onDelete: "set null" }),
  fileId: text("file_id")
    .notNull()
    .references(() => files.id, { onDelete: "cascade" }),
  codeHash: text("code_hash").notNull(),
  expiresAt: timestamp("expires_at", { withTimezone: true }).notNull(),
  consumedAt: timestamp("consumed_at", { withTimezone: true }),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const tags = pgTable("tags", {
  id: text("id").primaryKey(),
  userId: text("user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  name: text("name").notNull(),
});

export const fileTags = pgTable(
  "file_tags",
  {
    fileId: text("file_id")
      .notNull()
      .references(() => files.id, { onDelete: "cascade" }),
    tagId: text("tag_id")
      .notNull()
      .references(() => tags.id, { onDelete: "cascade" }),
  },
  (table) => [
    primaryKey({ columns: [table.fileId, table.tagId] }),
  ]
);

export const activityLog = pgTable(
  "activity_log",
  {
    id: text("id").primaryKey(),
    userId: text("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    fileId: text("file_id").references(() => files.id, { onDelete: "set null" }),
    shareId: text("share_id").references(() => shares.id, { onDelete: "set null" }),
    action: text("action").notNull(), // 'view', 'download', 'upload', 'share_open', 'failed_otp', 'delete', 'restore', etc.
    ip: text("ip"),
    userAgent: text("user_agent"),
    geo: text("geo"),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [
    index("activity_log_user_created_idx").on(table.userId, table.createdAt),
  ]
);

// Relations
export const usersRelations = relations(users, ({ many }) => ({
  folders: many(folders),
  files: many(files),
  dropZones: many(dropZones),
  activityLogs: many(activityLog),
  sessions: many(sessionsDevices),
}));

export const foldersRelations = relations(folders, ({ one, many }) => ({
  user: one(users, { fields: [folders.userId], references: [users.id] }),
  parent: one(folders, { fields: [folders.parentId], references: [folders.id] }),
  files: many(files),
}));

export const filesRelations = relations(files, ({ one, many }) => ({
  user: one(users, { fields: [files.userId], references: [users.id] }),
  folder: one(folders, { fields: [files.folderId], references: [folders.id] }),
  shares: many(shares),
  fileTags: many(fileTags),
}));

export const sharesRelations = relations(shares, ({ one }) => ({
  file: one(files, { fields: [shares.fileId], references: [files.id] }),
}));

export const fileTagsRelations = relations(fileTags, ({ one }) => ({
  file: one(files, { fields: [fileTags.fileId], references: [files.id] }),
  tag: one(tags, { fields: [fileTags.tagId], references: [tags.id] }),
}));
