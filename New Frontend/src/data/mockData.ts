import type { PricingPlan } from '@/types/cloud';

/** Exact 2 GB Testing-Phase Default Quota (2,147,483,648 bytes) per lib/db/schema.ts */
export const DEFAULT_QUOTA_BYTES = 2_147_483_648;

export const UNIVERSAL_PLATFORMS = [
  'Windows (Hello PIN)',
  'Android (Fingerprint)',
  'macOS & iOS',
  'Linux',
  'Any Browser & PWA',
] as const;

export const PRICING_PLANS: PricingPlan[] = [
  {
    id: 'testing-free',
    name: 'Testing Phase',
    storageBadge: '2 GB Free for Everyone',
    tagline:
      'Aether Cloud+ is currently in public testing—every account receives 2 GB of zero-knowledge cloud storage free.',
    monthlyPrice: 0,
    yearlyPrice: 0,
    featured: true,
    availableNow: true,
    ctaLabel: 'Claim 2 GB Free Storage',
    highlights: [
      '2 GB (2,147,483,648 bytes) encrypted cloud storage',
      'Universal Web & installable PWA (Windows, Android, macOS, iOS, Linux)',
      'Client-side AES-256-GCM Vault (PBKDF2 100,000 iterations)',
      'WebAuthn / FIDO2 Passkeys (Windows Hello PIN & Android Fingerprint)',
      'Protected Shares (Burn-After-Read, Time Capsule, Email OTP, Watermark)',
      'Anonymous Drop Zones & 6-Digit Ephemeral Quick Transfers',
    ],
  },
  {
    id: 'plus-upcoming',
    name: 'Expanded Personal',
    storageBadge: 'Larger Quota',
    tagline:
      'Higher personal storage limits for large media libraries, encrypted archives, and extended transfer retention.',
    monthlyPrice: null,
    yearlyPrice: null,
    statusLabel: 'Soon to be updated',
    availableNow: false,
    ctaLabel: 'Available After Testing Phase',
    highlights: [
      'Expanded Cloudflare R2 multipart storage capacity',
      'Pricing & exact storage tiers will be updated soon',
      'Extended Time Capsule & Quick Transfer windows',
      'Higher per-file limits on incoming Anonymous Drop Zones',
      'Priority edge bandwidth across all devices & browsers',
    ],
  },
  {
    id: 'pro-upcoming',
    name: 'Pro & Power Vault',
    storageBadge: 'High-Capacity Tier',
    tagline:
      'Maximum zero-knowledge storage capacity with advanced audit retention and custom sharing policies.',
    monthlyPrice: null,
    yearlyPrice: null,
    statusLabel: 'Soon to be updated',
    availableNow: false,
    ctaLabel: 'Pricing Updated Soon',
    highlights: [
      'High-capacity zero-knowledge personal vaults',
      'Pricing & tier specifications will be updated soon',
      'Unlimited active Drop Zone portals & custom MIME rules',
      'Extended security audit trail & multi-device session controls',
      'Seamless instant upgrade from your 2 GB testing account',
    ],
  },
];

export const LOCALE_OPTIONS = [
  { code: 'global-en', country: 'Global Edge', language: 'English', regionNode: 'Cloudflare R2 Auto' },
  { code: 'us-en', country: 'North America', language: 'English (US)', regionNode: 'US-East / West' },
  { code: 'eu-en', country: 'Europe', language: 'English / EU', regionNode: 'EU-Central' },
  { code: 'ap-en', country: 'Asia-Pacific', language: 'English / APAC', regionNode: 'AP-South / East' },
] as const;
