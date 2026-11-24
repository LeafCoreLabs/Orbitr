import type { PGlite } from "@electric-sql/pglite";

export async function initLocalSchema(client: PGlite) {
  const sql = `
    CREATE TABLE IF NOT EXISTS users (
      id TEXT PRIMARY KEY,
      email TEXT NOT NULL UNIQUE,
      handle TEXT UNIQUE,
      name TEXT NOT NULL,
      date_of_birth TEXT,
      password_hash TEXT,
      email_verified_at TIMESTAMP WITH TIME ZONE,
      quota_bytes BIGINT NOT NULL DEFAULT 2147483648,
      used_bytes BIGINT NOT NULL DEFAULT 0,
      totp_secret_enc TEXT,
      created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
    );

    ALTER TABLE users ADD COLUMN IF NOT EXISTS handle TEXT;
    ALTER TABLE users ADD COLUMN IF NOT EXISTS date_of_birth TEXT;

    CREATE TABLE IF NOT EXISTS authenticators (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      credential_public_key TEXT NOT NULL,
      counter BIGINT NOT NULL DEFAULT 0,
      credential_device_type TEXT NOT NULL DEFAULT 'singleDevice',
      credential_backed_up BOOLEAN NOT NULL DEFAULT FALSE,
      transports TEXT,
      created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
    );

    CREATE TABLE IF NOT EXISTS passkey_challenges (
      id TEXT PRIMARY KEY,
      challenge TEXT NOT NULL,
      user_id TEXT,
      expires_at TIMESTAMP WITH TIME ZONE NOT NULL
    );

    CREATE TABLE IF NOT EXISTS otp_codes (
      id TEXT PRIMARY KEY,
      email TEXT NOT NULL,
      user_id TEXT,
      purpose TEXT NOT NULL,
      code_hash TEXT NOT NULL,
      expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
      attempts INTEGER NOT NULL DEFAULT 0,
      consumed_at TIMESTAMP WITH TIME ZONE,
      created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
      ip TEXT,
      user_agent TEXT
    );

    CREATE TABLE IF NOT EXISTS sessions_devices (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL,
      device_label TEXT NOT NULL,
      ip TEXT,
      last_seen_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
      revoked_at TIMESTAMP WITH TIME ZONE
    );

    CREATE TABLE IF NOT EXISTS folders (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL,
      parent_id TEXT,
      name TEXT NOT NULL,
      is_vault BOOLEAN NOT NULL DEFAULT FALSE,
      created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
      deleted_at TIMESTAMP WITH TIME ZONE
    );

    CREATE TABLE IF NOT EXISTS files (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL,
      folder_id TEXT,
      name TEXT NOT NULL,
      size_bytes BIGINT NOT NULL,
      mime_type TEXT NOT NULL,
      object_key TEXT NOT NULL UNIQUE,
      sha256 TEXT NOT NULL,
      is_encrypted BOOLEAN NOT NULL DEFAULT FALSE,
      enc_meta JSONB,
      expires_at TIMESTAMP WITH TIME ZONE,
      status TEXT NOT NULL DEFAULT 'pending',
      created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
      deleted_at TIMESTAMP WITH TIME ZONE
    );

    CREATE TABLE IF NOT EXISTS shares (
      id TEXT PRIMARY KEY,
      file_id TEXT NOT NULL,
      token_hash TEXT NOT NULL UNIQUE,
      password_hash TEXT,
      recipient_email TEXT,
      require_otp BOOLEAN NOT NULL DEFAULT FALSE,
      view_only BOOLEAN NOT NULL DEFAULT FALSE,
      watermark BOOLEAN NOT NULL DEFAULT FALSE,
      expires_at TIMESTAMP WITH TIME ZONE,
      available_from TIMESTAMP WITH TIME ZONE,
      max_views INTEGER,
      max_downloads INTEGER,
      view_count INTEGER NOT NULL DEFAULT 0,
      download_count INTEGER NOT NULL DEFAULT 0,
      burn_after_read BOOLEAN NOT NULL DEFAULT FALSE,
      revoked_at TIMESTAMP WITH TIME ZONE,
      created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
    );

    CREATE TABLE IF NOT EXISTS drop_zones (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL,
      folder_id TEXT NOT NULL,
      token_hash TEXT NOT NULL UNIQUE,
      max_file_size BIGINT NOT NULL,
      allowed_types TEXT NOT NULL DEFAULT '*/*',
      expires_at TIMESTAMP WITH TIME ZONE,
      revoked_at TIMESTAMP WITH TIME ZONE,
      created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
    );

    CREATE TABLE IF NOT EXISTS quick_transfers (
      id TEXT PRIMARY KEY,
      user_id TEXT,
      file_id TEXT NOT NULL,
      code_hash TEXT NOT NULL,
      expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
      consumed_at TIMESTAMP WITH TIME ZONE,
      created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
    );

    CREATE TABLE IF NOT EXISTS tags (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL,
      name TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS file_tags (
      file_id TEXT NOT NULL,
      tag_id TEXT NOT NULL,
      PRIMARY KEY (file_id, tag_id)
    );

    CREATE TABLE IF NOT EXISTS activity_log (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL,
      file_id TEXT,
      share_id TEXT,
      action TEXT NOT NULL,
      ip TEXT,
      user_agent TEXT,
      geo TEXT,
      created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
    );
  `;

  await client.exec(sql);
}
