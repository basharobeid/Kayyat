'use client';

import React, { useState } from 'react';
import { useLocale } from 'next-intl';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Link, useRouter } from '@/i18n/routing';
import { useAuth } from '@/lib/auth-context';
import { APIError } from '@/lib/api-client';

export default function LoginPage() {
  const locale = useLocale();
  const isAr = locale === 'ar';
  const router = useRouter();
  const { login } = useAuth();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setErrorMsg('');

    try {
      const user = await login({ identifier: email, password });
      router.push(user.roles.includes('tailor') ? '/dashboard/tailor' : '/requests');
    } catch (err) {
      if (err instanceof APIError) {
        setErrorMsg(
          err.status === 401
            ? (isAr ? 'البريد الإلكتروني أو كلمة المرور غير صحيحة.' : 'Incorrect email or password.')
            : err.details.detail || err.message
        );
      } else {
        setErrorMsg(isAr ? 'تعذر الاتصال بالخادم. حاول مرة أخرى.' : 'Could not reach the server. Please try again.');
      }
    } finally {
      setIsLoading(false);
    }
  };

  const fillDemo = (demoEmail: string) => {
    setEmail(demoEmail);
    setPassword('demo1234');
  };

  return (
    <div className="min-h-[85vh] flex items-center justify-center px-4 py-16 pt-28">
      <div className="w-full max-w-md space-y-8">
        
        {/* Header */}
        <div className="text-center space-y-3">
          <div className="inline-flex items-center justify-center p-3 rounded-2xl bg-zinc-900 border border-white/10 shadow-md">
            <img src="/logo-white.png" alt="Khayyat Logo" className="h-9 w-auto" />
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-[#18181B]">
            {isAr ? 'تسجيل الدخول إلى حسابك' : 'Sign in to your account'}
          </h1>
          <p className="text-sm text-muted">
            {isAr
              ? 'مرحباً بك مجدداً في منصة خيّاط للعناية بالملابس'
              : 'Welcome back to the modern clothing care platform'}
          </p>
        </div>

        {/* Login Card */}
        <Card className="p-8 rounded-3xl border border-line/80 shadow-lg space-y-6">
          <form onSubmit={handleLogin} className="space-y-4">
            <Input
              type="email"
              label={isAr ? 'البريد الإلكتروني' : 'Email address'}
              placeholder="sara@demo.khayyat"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />

            <Input
              type="password"
              label={isAr ? 'كلمة المرور' : 'Password'}
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />

            {errorMsg && (
              <p className="text-xs text-danger font-medium">{errorMsg}</p>
            )}

            <div className="flex items-center justify-between text-xs text-muted pt-1">
              <label className="flex items-center gap-2 cursor-pointer">
                <input type="checkbox" defaultChecked className="accent-black rounded" />
                <span>{isAr ? 'تذكرني' : 'Remember me'}</span>
              </label>
              <Link href="/auth/forgot-password" className="hover:text-ink font-medium">
                {isAr ? 'نسيت كلمة المرور؟' : 'Forgot password?'}
              </Link>
            </div>

            <div className="pt-2">
              <Button
                type="submit"
                variant="primary"
                size="md"
                fullWidth
                disabled={isLoading}
                className="rounded-full py-3 bg-[#18181B] hover:bg-black text-white font-bold"
              >
                {isLoading
                  ? (isAr ? 'جاري التحقق...' : 'Signing in...')
                  : (isAr ? 'تسجيل الدخول ➔' : 'Sign In ➔')}
              </Button>
            </div>
          </form>

          {/* Quick 1-Click Demo Logins */}
          <div className="border-t border-line pt-5 space-y-3">
            <p className="text-xs font-semibold text-charcoal text-center">
              {isAr ? '⚡ حسابات تجريبية سريعة (اضغط للملء):' : '⚡ 1-Click Demo Accounts:'}
            </p>
            <div className="grid grid-cols-2 gap-2 text-xs">
              <button
                type="button"
                onClick={() => fillDemo('sara@demo.khayyat')}
                className="p-2 rounded-xl bg-mist hover:bg-zinc-200 text-ink font-medium text-center transition-colors"
              >
                👤 {isAr ? 'سارة (عميل)' : 'Sara (Customer)'}
              </button>
              <button
                type="button"
                onClick={() => fillDemo('ahmad@demo.khayyat')}
                className="p-2 rounded-xl bg-mist hover:bg-zinc-200 text-ink font-medium text-center transition-colors"
              >
                ✂️ {isAr ? 'أحمد (خيّاط)' : 'Ahmad (Tailor)'}
              </button>
              <button
                type="button"
                onClick={() => fillDemo('mohammed@demo.khayyat')}
                className="p-2 rounded-xl bg-mist hover:bg-zinc-200 text-ink font-medium text-center transition-colors"
              >
                🛍️ {isAr ? 'محمد (بائع قماش)' : 'Mohammed (Seller)'}
              </button>
              <button
                type="button"
                onClick={() => fillDemo('admin@demo.khayyat')}
                className="p-2 rounded-xl bg-mist hover:bg-zinc-200 text-ink font-medium text-center transition-colors"
              >
                🛡️ {isAr ? 'نورة (إدارة)' : 'Noura (Admin)'}
              </button>
            </div>
          </div>
        </Card>

        {/* Footer Link */}
        <p className="text-center text-sm text-muted">
          {isAr ? 'ليس لديك حساب بعد؟' : "Don't have an account yet?"}{' '}
          <Link href="/auth/register" className="font-bold text-ink underline hover:opacity-80">
            {isAr ? 'سجل الآن مجاناً' : 'Create an account'}
          </Link>
        </p>
      </div>
    </div>
  );
}
