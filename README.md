# Vaulta - Security-First Personal Cloud Drive

> **Tagline:** *"Your files. Your rules."*  
> Vaulta is an uncompromising, modern, security-first personal cloud drive built as a single unified Next.js 15 application. It combines direct-to-storage presigned uploads, client-side zero-knowledge encryption, burn-after-read share links, recipient email OTP verification, and instant cross-device handoffs.

---

## ✦ Key Features

- **Module 1: Gmail SMTP OTP Verification Engine**
  - Cryptographically secure 6-digit numeric codes generated with `crypto.randomInt`.
  - Peppered HMAC-SHA256 hashed storage in database — never stored in plaintext.
  - 10-minute expiry, single-use consumption, max 5 attempts before destruction, 60s cooldown, rate limited via Upstash Redis.
  - Constant-time comparison (`crypto.timingSafeEqual`) preventing timing attacks.
  - 6-box OTP auto-advancing interface with paste support, mobile `autocomplete="one-time-code"`, and live countdown timer.
  - Reused for signup activation, new-device login alerts, password resets, sensitive actions, and recipient-verified sharing.

- **Private Vault (Zero-Knowledge AES-256-GCM)**
  - Optional confidential space where file payloads and file names are encrypted directly in the user's browser before upload.
  - Keys derived via PBKDF2 (100,000 iterations) from user passphrase. The server and storage provider only ever receive ciphertext.
  - Downloadable offline recovery key in `VAULT-XXXX-XXXX-XXXX-XXXX` format.

- **Direct-to-R2 / S3 Presigned Uploads**
  - Files go directly from the browser to Cloudflare R2 using presigned `PUT` URLs with signed `Content-Length` and `Content-Type`. Completely bypasses serverless payload limits.
  - Support for files up to 5 GB with multipart chunking (>20 MB).
  - Server-side `HeadObject` integrity verification before quota commitment.

- **Burn-After-Read & Self-Destructing Shares**
  - Configure links to self-destruct after $N$ views, $N$ downloads, or a set expiration date.
  - File can optionally be auto-purged from storage once consumed.

- **Recipient-Verified Sharing**
  - Require the recipient to verify their identity via a 6-digit email OTP sent to their address before viewing or downloading.
  - Optional password protection and instant revocation.

- **Secure View-Only Mode & Dynamic Watermarking**
  - Inline viewing for PDFs and images with downloads disabled and right-click copying restricted.
  - Dynamic diagonal watermark overlay stamping the recipient's identity and live UTC timestamp across documents.

- **Drop Zones (Anonymous File Requests)**
  - Public upload-only links with size/type limits and expiry.
  - External collaborators can upload files into your folder without seeing existing folder contents.

- **Quick Transfer (PC ⇄ Phone)**
  - Instant file handoff between desktop and mobile with a short 6-character code or QR code scan.
  - No login required on the receiving side; automatically expires in 10 minutes.

- **Smart Storage Engine**
  - Client-side SHA-256 deduplication: identical files already uploaded by the user trigger instant zero-network deduplication.
  - Per-file auto-expiry TTL ("Delete this in 7 days").
  - Automated cron cleanup (`/api/cron/cleanup`) purging trash older than 30 days and abandoned uploads.

- **Security Center & Audit Log**
  - Active device sessions with remote "Sign Out Everywhere" revocation.
  - Activity audit log recording IP, device label, and timestamps.
  - Optional TOTP Two-Factor Authentication with QR code setup.

- **Mobile-First PWA Shell**
  - 44px+ touch targets, bottom navigation, floating upload button, and camera capture.
  - Offline app shell caching powered by Serwist.

---

## 🛠 Tech Stack

- **Framework:** Next.js 15 (App Router), React 19, TypeScript (strict mode)
- **Styling & Motion:** Tailwind CSS v4, Lucide Icons, Framer Motion
- **Storage:** Cloudflare R2 (S3-compatible) via `@aws-sdk/client-s3` and `@aws-sdk/s3-request-presigner`
- **Database & ORM:** Neon Serverless Postgres + Drizzle ORM
- **Auth:** Auth.js v5 (Credentials with Argon2id via `@node-rs/argon2`, plus Google OAuth)
- **Email:** Nodemailer pooled over Gmail SMTP (SSL 465) with generic `Mailer` interface
- **Rate Limiting:** Upstash Redis (`@upstash/ratelimit`) with in-memory dev fallback
- **Validation:** Zod schemas on all server endpoints
- **Client Cryptography:** W3C Web Crypto API (AES-256-GCM, PBKDF2-SHA256)
- **Testing:** Vitest (unit tests) + Playwright (desktop & mobile viewport e2e)

---

## 🚀 Getting Started

### 1. Clone & Install Dependencies

```bash
git clone https://github.com/your-username/vaulta.git
cd vaulta
npm install
```

### 2. Configure Environment Variables

Copy `.env.example` to `.env.local`:

```bash
cp .env.example .env.local
```

Fill in the required credentials:

```env
APP_URL=http://localhost:3000
DATABASE_URL=postgresql://user:password@ep-sample-12345.us-east-2.aws.neon.tech/vaulta?sslmode=require
AUTH_SECRET=your-32-byte-hex-or-base64-secret

# Cloudflare R2
R2_ACCOUNT_ID=your-cloudflare-account-id
R2_ACCESS_KEY_ID=your-r2-access-key-id
R2_SECRET_ACCESS_KEY=your-r2-secret-access-key
R2_BUCKET=vaulta-storage
R2_ENDPOINT=https://your-cloudflare-account-id.r2.cloudflarestorage.com

# Email (Gmail SMTP)
GMAIL_USER=your-email@gmail.com
GMAIL_APP_PASSWORD=your-16-char-app-password
MAIL_FROM_NAME="Vaulta Security"

# Security & Secrets
OTP_PEPPER=your-secure-otp-pepper-string
CRON_SECRET=your-cron-secret-token

# Rate Limiting (Upstash Redis)
UPSTASH_REDIS_REST_URL=https://your-instance.upstash.io
UPSTASH_REDIS_REST_TOKEN=your-upstash-token
```

---

## 📧 Gmail SMTP Setup Guide

Vaulta uses Gmail SMTP over SSL (`port 465`) to dispatch branded security OTPs, new device alerts, and share invitations.

### Step-by-Step Configuration:
1. Log into your Google Account.
2. Go to **Google Account Settings** → **Security**.
3. Under *"How you sign in to Google"*, ensure **2-Step Verification** is turned **ON**.
4. Search for **"App passwords"** (or visit `https://myaccount.google.com/apppasswords`).
5. Create a new app password named `"Vaulta"`.
6. Google will generate a **16-character password** (e.g. `abcd efgh ijkl mnop`).
7. Paste this into your `.env.local` as `GMAIL_APP_PASSWORD` (remove spaces) and set `GMAIL_USER` to your Gmail address.

> ⚠️ **Development Fallback:** If `GMAIL_USER` or `GMAIL_APP_PASSWORD` are left unconfigured in development, Vaulta gracefully logs the OTP code and formatted email preview directly to the server terminal.

> ⚠️ **Known Limitation:** Standard Gmail accounts have a sending limit of approximately **500 emails per 24 hours**. For large-scale multi-tenant production deployments, swap the `lib/mailer.ts` implementation to Amazon SES, Resend, or SendGrid without touching business logic.

---

## ☁ Cloudflare R2 & CORS Setup

Vaulta uploads files directly from the browser to Cloudflare R2 using presigned `PUT` URLs. This requires CORS permissions configured on your R2 bucket.

### 1. Bucket Creation
1. In Cloudflare Dashboard, go to **R2** → **Create bucket**.
2. Name the bucket `vaulta-storage` and keep access **Private**.
3. Under **R2 Manage API Tokens**, create an API token with **Object Read & Write** permissions.

### 2. CORS Policy Configuration
Under your bucket's **Settings** tab → **CORS Policy**, add the following JSON configuration:

```json
[
  {
    "AllowedOrigins": [
      "https://your-vaulta-domain.vercel.app",
      "http://localhost:3000"
    ],
    "AllowedMethods": [
      "GET",
      "PUT",
      "HEAD"
    ],
    "AllowedHeaders": [
      "*"
    ],
    "ExposeHeaders": [
      "ETag"
    ],
    "MaxAgeSeconds": 3000
  }
]
```

> **Why Expose ETag?** The ETag header is required for multipart upload part assembly and storage integrity verification.

---

## 🐘 Neon Serverless Postgres Setup

1. Create a free PostgreSQL database at [neon.tech](https://neon.tech).
2. Copy your pooled connection string into `DATABASE_URL` in `.env.local`.
3. Push the Drizzle schema to your database:

```bash
npm run db:push
```

---

## 🧪 Testing

### Run Vitest Unit Tests
Tests OTP generation, HMAC-SHA256 hashing, constant-time verification, client-side AES-256-GCM encryption/decryption, PBKDF2 key derivation, and IDOR access control isolation:

```bash
npm test
```

### Run Playwright E2E Tests
Runs automated user flows on desktop and mobile viewports (375px width):

```bash
npm run test:e2e
```

---

## ▲ Deploying to Vercel

1. Push your repository to GitHub.
2. Import your repository into the [Vercel Dashboard](https://vercel.com).
3. Add all environment variables from `.env.example` in **Project Settings** → **Environment Variables**.
4. The deployment will automatically recognize `vercel.json` and schedule the hourly maintenance cron (`/api/cron/cleanup`) to purge trash older than 30 days, abandoned pending uploads, and expired unverified accounts.
5. Deploy!

---

## 🛡 Security Architecture Highlights

1. **IDOR Prevention:** Every route and API verifies database ownership before returning presigned URLs or altering records.
2. **Zero-Knowledge Privacy:** In the Private Vault, files are encrypted with AES-256-GCM using Web Crypto prior to network transmission. The server receives only ciphertext.
3. **Token Hashing:** Share tokens and Drop Zone tokens are 32 random cryptographically secure bytes, stored in the database exclusively as deterministic SHA-256 hashes.
4. **Rate Limiting:** Authentication, upload initiation, OTP dispatch, and public share accesses are throttled with sliding-window rate limiters.
5. **No Secrets on Client:** Storage credentials and peppers remain strictly on the server; clients interact only through presigned S3 URLs and JWT sessions.

---

**License:** MIT  
**Vaulta** — *Your files. Your rules.*
