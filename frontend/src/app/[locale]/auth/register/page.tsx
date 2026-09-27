'use client';

import React, { useState } from 'react';
import { useLocale } from 'next-intl';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Link, useRouter } from '@/i18n/routing';
import { useAuth } from '@/lib/auth-context';
import { APIError } from '@/lib/api-client';
import { CITY_LABELS, CITY_SLUGS, CitySlug, tailorApi } from '@/lib/api';

// The backend only supports self-registration for these two roles today; fabric-seller and
// delivery onboarding are phase 2/3 (see backend/app/schemas/auth.py). Never fake acceptance
// of a role the API will reject.
type UserRole = 'customer' | 'tailor';

function normalizePhone(raw: string): string | undefined {
  const trimmed = raw.trim();
  if (!trimmed) return undefined;
  if (trimmed.startsWith('+')) return trimmed.replace(/[\s-]/g, '');
  if (trimmed.startsWith('0')) return `+966${trimmed.slice(1).replace(/[\s-]/g, '')}`;
  return `+966${trimmed.replace(/[\s-]/g, '')}`;
}

export default function RegisterPage() {
  const locale = useLocale();
  const isAr = locale === 'ar';
  const router = useRouter();
  const { register } = useAuth();

  const [role, setRole] = useState<UserRole>('customer');
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [businessName, setBusinessName] = useState('');
  const [city, setCity] = useState<CitySlug>('riyadh');
  const [termsAgreed, setTermsAgreed] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!termsAgreed) return;
    setErrorMsg('');

    if (!email.trim() && !phone.trim()) {
      setErrorMsg(isAr ? 'أدخل بريداً إلكترونياً أو رقم جوال.' : 'Provide an email or a phone number.');
      return;
    }

    setIsLoading(true);
    try {
      const user = await register({
        full_name: fullName,
        email: email.trim() || undefined,
        phone: normalizePhone(phone),
        password,
        role,
        locale: locale === 'ar' ? 'ar' : 'en',
      });
      if (role === 'tailor') {
        // /auth/register only creates the account; the business profile (name, city)
        // is a separate resource, so apply what the form collected right after.
        await tailorApi.updateMyProfile({
          business_name: businessName.trim() || undefined,
          city,
        });
      }
      setSuccess(true);
      setTimeout(() => {
        router.push(user.roles.includes('tailor') ? '/dashboard/tailor' : '/requests');
      }, 900);
    } catch (err) {
      if (err instanceof APIError) {
        const fieldErrors = err.details.errors?.map((e) => e.message).join(' ');
        setErrorMsg(fieldErrors || err.details.detail || err.message);
      } else {
        setErrorMsg(isAr ? 'تعذر الاتصال بالخادم. حاول مرة أخرى.' : 'Could not reach the server. Please try again.');
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-[90vh] flex items-center justify-center px-4 py-16 pt-28">
      <div className="w-full max-w-xl space-y-8">
        
        {/* Header */}
        <div className="text-center space-y-3">
          <div className="inline-flex items-center justify-center p-3 rounded-2xl bg-[#12141A] border border-white/10 shadow-lg">
            <img src="/logo-white.png" alt="Khayyat Logo" className="h-9 w-auto" />
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-[#18181B]">
            {isAr ? 'إنشاء حساب جديد في خيّاط' : 'Join Khayyat Platform'}
          </h1>
          <p className="text-sm text-muted max-w-md mx-auto">
            {isAr
              ? 'انضم إلى مجتمع الأناقة المستدامة والخياطة الراقية الأولى في العالم العربي'
              : 'Join the premier bespoke tailoring, alterations, and circular fashion community'}
          </p>
        </div>

        {/* Register Card */}
        <Card className="p-6 sm:p-8 rounded-3xl border border-line/80 shadow-xl space-y-6">
          
          {/* Role Selection Tabs */}
          <div>
            <label className="block text-xs font-semibold text-charcoal mb-2.5">
              {isAr ? 'اختر نوع الحساب الذي ترغب بإنشائه:' : 'Select Account Type:'}
            </label>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              <button
                type="button"
                onClick={() => setRole('customer')}
                className={`p-3 rounded-2xl border text-center transition-all flex flex-col items-center gap-1.5 ${
                  role === 'customer'
                    ? 'border-black bg-black text-white shadow-md'
                    : 'border-line/70 bg-mist/50 hover:bg-mist text-ink'
                }`}
              >
                <span className="text-lg">👤</span>
                <span className="text-xs font-bold">{isAr ? 'عميل' : 'Customer'}</span>
              </button>

              <button
                type="button"
                onClick={() => setRole('tailor')}
                className={`p-3 rounded-2xl border text-center transition-all flex flex-col items-center gap-1.5 ${
                  role === 'tailor'
                    ? 'border-black bg-black text-white shadow-md'
                    : 'border-line/70 bg-mist/50 hover:bg-mist text-ink'
                }`}
              >
                <span className="text-lg">✂️</span>
                <span className="text-xs font-bold">{isAr ? 'خيّاط / مشغل' : 'Tailor Studio'}</span>
              </button>

              <button
                type="button"
                disabled
                title={isAr ? 'تسجيل تجار الأقمشة قادم قريباً' : 'Fabric merchant onboarding is coming soon'}
                className="p-3 rounded-2xl border border-line/70 bg-mist/30 text-center flex flex-col items-center gap-1.5 opacity-50 cursor-not-allowed"
              >
                <span className="text-lg">🧵</span>
                <span className="text-xs font-bold">{isAr ? 'تاجر أقمشة' : 'Fabric Store'}</span>
                <span className="text-[0.6rem] font-semibold text-muted">{isAr ? 'قريباً' : 'Coming soon'}</span>
              </button>

              <button
                type="button"
                disabled
                title={isAr ? 'تسجيل شركاء التوصيل قادم قريباً' : 'Courier onboarding is coming soon'}
                className="p-3 rounded-2xl border border-line/70 bg-mist/30 text-center flex flex-col items-center gap-1.5 opacity-50 cursor-not-allowed"
              >
                <span className="text-lg">🛵</span>
                <span className="text-xs font-bold">{isAr ? 'شريك توصيل' : 'Courier'}</span>
                <span className="text-[0.6rem] font-semibold text-muted">{isAr ? 'قريباً' : 'Coming soon'}</span>
              </button>
            </div>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-4 pt-1">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Input
                type="text"
                label={isAr ? 'الاسم الكامل' : 'Full Name'}
                placeholder={isAr ? 'سارة العبدالله' : 'Sara Al-Abdullah'}
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                required
              />

              <Input
                type="tel"
                label={isAr ? 'رقم الجوال (اختياري إن أدخلت بريداً)' : 'Phone (optional if email is given)'}
                placeholder="05XXXXXXXX"
                helperText={isAr ? 'أو +966XXXXXXXXX' : 'Saudi format, e.g. 05XXXXXXXX'}
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
              />
            </div>

            <Input
              type="email"
              label={isAr ? 'البريد الإلكتروني (اختياري إن أدخلت جوالاً)' : 'Email (optional if phone is given)'}
              placeholder="name@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />

            {role === 'tailor' && (
              <Input
                type="text"
                label={isAr ? 'اسم المشغل أو العلامة' : 'Atelier / Brand Name'}
                placeholder="مشغل الخيّاط الذهبي"
                value={businessName}
                onChange={(e) => setBusinessName(e.target.value)}
              />
            )}

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {role === 'tailor' && (
                <div>
                  <label className="block text-xs font-semibold text-charcoal mb-1.5">
                    {isAr ? 'المدينة' : 'City'}
                  </label>
                  <select
                    value={city}
                    onChange={(e) => setCity(e.target.value as CitySlug)}
                    className="w-full h-11 px-3 rounded-xl border border-line bg-surface text-ink text-sm focus:outline-none focus:ring-2 focus:ring-black"
                  >
                    {CITY_SLUGS.map((slug) => (
                      <option key={slug} value={slug}>
                        {isAr ? CITY_LABELS[slug].ar : CITY_LABELS[slug].en}
                      </option>
                    ))}
                  </select>
                </div>
              )}

              <Input
                type="password"
                label={isAr ? 'كلمة المرور (8 أحرف على الأقل)' : 'Password (min. 8 characters)'}
                placeholder="••••••••"
                minLength={8}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
            </div>

            {errorMsg && <p className="text-xs text-danger font-medium">{errorMsg}</p>}

            {/* Terms checkbox */}
            <div className="flex items-start gap-2.5 pt-2 text-xs text-muted">
              <input
                type="checkbox"
                id="terms"
                checked={termsAgreed}
                onChange={(e) => setTermsAgreed(e.target.checked)}
                className="mt-0.5 accent-black rounded cursor-pointer"
                required
              />
              <label htmlFor="terms" className="cursor-pointer leading-relaxed">
                {isAr ? (
                  <>
                    أوافق على <Link href="/terms" className="font-semibold text-ink underline">شروط الاستخدام</Link> و <Link href="/privacy" className="font-semibold text-ink underline">سياسة الخصوصية</Link> وضمان المقاس 100%.
                  </>
                ) : (
                  <>
                    I agree to the <Link href="/terms" className="font-semibold text-ink underline">Terms of Service</Link>, <Link href="/privacy" className="font-semibold text-ink underline">Privacy Policy</Link>, and 100% Fit Guarantee.
                  </>
                )}
              </label>
            </div>

            {/* Submit Button */}
            <div className="pt-3">
              <Button
                type="submit"
                variant="primary"
                size="md"
                fullWidth
                disabled={isLoading || !termsAgreed}
                className="rounded-full py-3.5 bg-[#12141A] hover:bg-black text-white font-bold text-sm tracking-wide shadow-md"
              >
                {isLoading ? (
                  <span className="flex items-center justify-center gap-2">
                    <span className="inline-block w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    {isAr ? 'جاري تجهيز حسابك...' : 'Creating Account...'}
                  </span>
                ) : success ? (
                  <span className="text-emerald-300">✓ {isAr ? 'تم التسجيل بنجاح!' : 'Account Created Successfully!'}</span>
                ) : (
                  <span>
                    {isAr ? 'إتمام التسجيل والبدء ➔' : 'Complete Registration & Start ➔'}
                  </span>
                )}
              </Button>
            </div>
          </form>

          {/* Trust Guarantees */}
          <div className="border-t border-line/70 pt-4 grid grid-cols-3 gap-2 text-center text-[0.7rem] text-muted">
            <div className="p-2 rounded-xl bg-mist/40">
              <p className="font-bold text-ink">🛡️ {isAr ? 'ضمان 100%' : '100% Fit'}</p>
              <p className="text-[0.65rem] mt-0.5">{isAr ? 'إعادة تعديل مجانية' : 'Free re-alterations'}</p>
            </div>
            <div className="p-2 rounded-xl bg-mist/40">
              <p className="font-bold text-ink">🚚 {isAr ? 'توصيل مأمّن' : 'Insured Delivery'}</p>
              <p className="text-[0.65rem] mt-0.5">{isAr ? 'استلام وتسليم لبابك' : 'Doorstep transit'}</p>
            </div>
            <div className="p-2 rounded-xl bg-mist/40">
              <p className="font-bold text-ink">✂️ {isAr ? 'حرفيون نخبة' : 'Master Artisans'}</p>
              <p className="text-[0.65rem] mt-0.5">{isAr ? 'مشاغل مفحوصة' : 'Vetted workshops'}</p>
            </div>
          </div>
        </Card>

        {/* Footer Link */}
        <p className="text-center text-sm text-muted">
          {isAr ? 'لديك حساب بالفعل؟' : 'Already have an account?'}{' '}
          <Link href="/auth/login" className="font-bold text-ink underline hover:opacity-80">
            {isAr ? 'سجل دخولك هنا' : 'Sign in here'}
          </Link>
        </p>
      </div>
    </div>
  );
}
