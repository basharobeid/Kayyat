'use client';

import React, { useEffect, useRef, useState } from 'react';
import { useLocale } from 'next-intl';
import { bookingsApi } from '@/lib/api';
import { useAuth } from '@/lib/auth-context';
import { APIError } from '@/lib/api-client';

interface GoogleId {
  accounts: {
    id: {
      initialize: (cfg: { client_id: string; callback: (r: { credential: string }) => void }) => void;
      renderButton: (el: HTMLElement, opts: Record<string, unknown>) => void;
    };
  };
}

declare global {
  interface Window { google?: GoogleId }
}

let scriptPromise: Promise<void> | null = null;
function loadScript(): Promise<void> {
  scriptPromise ??= new Promise((resolve, reject) => {
    const s = document.createElement('script');
    s.src = 'https://accounts.google.com/gsi/client';
    s.async = true;
    s.onload = () => resolve();
    s.onerror = () => reject(new Error('Google script failed to load'));
    document.head.appendChild(s);
  });
  return scriptPromise;
}

// Official Google Identity Services button. Google gives us a signed ID token, the backend
// verifies it; no Google password ever touches Khayyat.
export const GoogleButton: React.FC<{ onSuccess?: () => void }> = ({ onSuccess }) => {
  const isAr = useLocale() === 'ar';
  const { googleLogin } = useAuth();
  const ref = useRef<HTMLDivElement>(null);
  const [clientId, setClientId] = useState<string | null | undefined>(undefined);
  const [error, setError] = useState('');

  useEffect(() => {
    bookingsApi.options().then((o) => setClientId(o.google_client_id)).catch(() => setClientId(null));
  }, []);

  useEffect(() => {
    if (!clientId || !ref.current) return;
    let cancelled = false;
    loadScript()
      .then(() => {
        if (cancelled || !window.google || !ref.current) return;
        window.google.accounts.id.initialize({
          client_id: clientId,
          callback: async ({ credential }) => {
            setError('');
            try {
              await googleLogin(credential);
              onSuccess?.();
            } catch (err) {
              setError(err instanceof APIError ? err.details.detail : (isAr ? 'تعذر الدخول بحساب Google' : 'Google sign-in failed'));
            }
          },
        });
        window.google.accounts.id.renderButton(ref.current, {
          theme: 'outline', size: 'large', shape: 'pill', width: 320,
          text: 'continue_with', locale: isAr ? 'ar' : 'en',
        });
      })
      .catch(() => setError(isAr ? 'تعذر تحميل زر Google' : 'Could not load Google sign-in'));
    return () => { cancelled = true; };
  }, [clientId, googleLogin, isAr, onSuccess]);

  if (clientId === undefined) return <div className="h-11" />;
  if (clientId === null) return null; // Google sign-in not configured on the server yet

  return (
    <div className="flex flex-col items-center gap-2">
      <div ref={ref} />
      {error && <p className="text-xs text-danger">{error}</p>}
    </div>
  );
};
