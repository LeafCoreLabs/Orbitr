# 🚀 Deploying Orbitr 100% Free Forever

Orbitr is built on **Next.js 15 App Router** and designed to run completely free of charge on production-grade serverless cloud infrastructure:

| Component | Free Cloud Provider | Free Tier Allowance | Monthly Cost |
| :--- | :--- | :--- | :--- |
| **Full-Stack App & API** | **Vercel** (Hobby) | Unlimited deployments, Edge Network, Global CDN, SSL | **$0.00** |
| **Database** | **Neon Postgres** | 0.5 GB storage, serverless autoscaling | **$0.00** |
| **Object Storage** | **Cloudflare R2** | **10 GB free storage/month, $0 egress fees** | **$0.00** |
| **Email SMTP (OTP)** | **Gmail SMTP** | 500 emails / day via Gmail App Password | **$0.00** |
| **Rate Limiting** | **Upstash Redis** | 10,000 commands / day | **$0.00** |
| **Google Sign-In** | **Google Cloud** | Free OAuth 2.0 Web Client | **$0.00** |

---

## 5-Minute Step-by-Step Deployment Guide

### Step 1: Create a Free Neon Serverless Postgres Database
1. Go to [neon.tech](https://neon.tech) and sign up for a free account.
2. Click **"New Project"** and name it `orbitr-db`.
3. Copy the **Connection String** (e.g. `postgresql://user:pass@ep-sample.us-east-2.aws.neon.tech/orbitr?sslmode=require`).
4. This is your `DATABASE_URL`.

### Step 2: (Optional) Create Free Cloudflare R2 Bucket
> *Note: If omitted, Orbitr automatically falls back to its built-in local streaming storage engine.*
1. Go to [cloudflare.com](https://dash.cloudflare.com) and navigate to **R2**.
2. Click **"Create bucket"** and name it `orbitr-storage`.
3. Click **"Manage R2 API Tokens"** -> **"Create API Token"** (Permissions: *Object Read & Write*).
4. Copy the **Account ID**, **Access Key ID**, and **Secret Access Key**.
5. Your endpoint will be: `https://<ACCOUNT_ID>.r2.cloudflarestorage.com`.

### Step 3: Push Your Code to GitHub
Open your local PowerShell terminal and run:
```bash
git init
git add .
git commit -m "Orbitr Personal Cloud Drive"
git branch -M main
git remote add origin https://github.com/<your-username>/orbitr.git
git push -u origin main
```

### Step 4: Deploy to Vercel in 1 Click
1. Go to [vercel.com](https://vercel.com) and log in with GitHub.
2. Click **"Add New..."** -> **"Project"** and import your `orbitr` repository.
3. Under **Environment Variables**, paste the following keys:

```env
# Production URL (replace with your Vercel deployment URL or custom domain)
APP_URL=https://your-orbitr.vercel.app
NODE_ENV=production

# Database (From Step 1 - Neon Postgres)
DATABASE_URL=postgresql://user:password@ep-sample.us-east-2.aws.neon.tech/orbitr?sslmode=require

# Authentication Secrets (generate random 32-byte hex)
AUTH_SECRET=f3b5849dfb2ad46dfb4c7349ab8df4ec8234857b29a0de5984723908fde34921
OTP_PEPPER=e78a69d9c6c547849e3590924b175dc89d2c47941031985473859238e9184719
CRON_SECRET=orbitr-cron-secret-key-prod

# Google OAuth (Optional: for Google Sign In)
AUTH_GOOGLE_ID=your-google-client-id.apps.googleusercontent.com
AUTH_GOOGLE_SECRET=your-google-client-secret

# Cloudflare R2 Storage (Optional: 10GB free on Cloudflare)
R2_ACCOUNT_ID=your-cloudflare-account-id
R2_ACCESS_KEY_ID=your-r2-access-key-id
R2_SECRET_ACCESS_KEY=your-r2-secret-access-key
R2_BUCKET=orbitr-storage
R2_ENDPOINT=https://your-cloudflare-account-id.r2.cloudflarestorage.com

# Gmail SMTP Email for OTP (Optional: 500 emails/day free)
GMAIL_USER=your-email@gmail.com
GMAIL_APP_PASSWORD=your-16-character-gmail-app-password
MAIL_FROM_NAME="Orbitr Cloud Security"
```

4. Click **Deploy**. Vercel will build and deploy your app in ~45 seconds.

### Step 5: Update Google OAuth Redirect URI
Once Vercel gives you your live URL (e.g. `https://orbitr.vercel.app`):
1. In [Google Cloud Console Credentials](https://console.cloud.google.com/apis/credentials), click on your **Web client**.
2. Under **Authorized JavaScript origins**, add:
   `https://your-orbitr.vercel.app`
3. Under **Authorized redirect URIs**, add:
   `https://your-orbitr.vercel.app/api/auth/callback/google`
4. Click **Save**.

Your Orbitr Drive is now live, secure, and running 100% free!
