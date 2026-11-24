import React, { createContext, useCallback, useContext, useMemo, useState } from 'react';
import type { AppStage } from '@/types/cloud';

export interface ToastMessage {
  id: string;
  title: string;
  subtitle?: string;
}

interface CloudStoreValue {
  stage: AppStage;
  setStage: (stage: AppStage) => void;
  spotlightOpen: boolean;
  setSpotlightOpen: (open: boolean) => void;
  toasts: ToastMessage[];
  pushToast: (title: string, subtitle?: string) => void;
  authenticateUser: (payload: {
    name?: string;
    handle?: string;
    email: string;
    dob?: string;
    viaPasskey?: boolean;
  }) => void;
}

const CloudStoreContext = createContext<CloudStoreValue | null>(null);

export function CloudStoreProvider({ children }: { children: React.ReactNode }) {
  const [stage, setStageState] = useState<AppStage>('landing');
  const [spotlightOpen, setSpotlightOpen] = useState(false);
  const [toasts, setToasts] = useState<ToastMessage[]>([]);

  const pushToast = useCallback((title: string, subtitle?: string) => {
    const id = `toast-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`;
    setToasts((prev) => [...prev.slice(-2), { id, title, subtitle }]);
    window.setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 3400);
  }, []);

  const setStage = useCallback((nextStage: AppStage) => {
    setStageState(nextStage);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, []);

  const authenticateUser = useCallback(
    ({
      handle,
      email,
      viaPasskey,
    }: {
      name?: string;
      handle?: string;
      email: string;
      dob?: string;
      viaPasskey?: boolean;
    }) => {
      const label = handle
        ? handle.startsWith('@')
          ? handle
          : `@${handle}`
        : email;
      pushToast(
        viaPasskey ? 'Passkey Handshake Ready' : `Credentials Validated (${label})`,
        'Connect to your /api/auth endpoint to redirect into /drive.'
      );
    },
    [pushToast]
  );

  const value = useMemo<CloudStoreValue>(
    () => ({
      stage,
      setStage,
      spotlightOpen,
      setSpotlightOpen,
      toasts,
      pushToast,
      authenticateUser,
    }),
    [stage, setStage, spotlightOpen, toasts, pushToast, authenticateUser]
  );

  return <CloudStoreContext.Provider value={value}>{children}</CloudStoreContext.Provider>;
}

export function useCloudStore(): CloudStoreValue {
  const ctx = useContext(CloudStoreContext);
  if (!ctx) {
    throw new Error('useCloudStore must be used within a CloudStoreProvider');
  }
  return ctx;
}
