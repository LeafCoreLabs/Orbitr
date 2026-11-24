export type AppStage = 'landing' | 'login' | 'signup';

export interface EncryptionMetadata {
  algorithm: 'AES-256-GCM';
  kdf: 'PBKDF2-SHA256';
  iterations: 100000;
  ivHex: string;
  saltHex: string;
  encryptedFilenameHex?: string;
}

export interface PricingPlan {
  id: string;
  name: string;
  storageBadge: string;
  tagline: string;
  monthlyPrice: number | null;
  yearlyPrice: number | null;
  statusLabel?: string;
  featured?: boolean;
  ctaLabel: string;
  availableNow: boolean;
  highlights: string[];
}
