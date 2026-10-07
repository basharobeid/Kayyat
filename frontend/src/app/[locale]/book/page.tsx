'use client';

import React, { Suspense, useCallback, useEffect, useMemo, useState } from 'react';
import { useLocale } from 'next-intl';
import { useSearchParams } from 'next/navigation';
import { Link, useRouter } from '@/i18n/routing';
import { useAuth } from '@/lib/auth-context';
import { APIError } from '@/lib/api-client';
import {
  accountApi,
  bookingsApi,
  catalogApi,
  formatPrice,
  DAMASCUS_DISTRICTS,
  type Address,
  type BookingOptions,
  type QuickItem,
  type Recommendation,
  type ServiceType,
} from '@/lib/api';
import { GARMENTS, QUICK_ITEMS, SERVICES, serviceInfo } from '@/components/booking/catalog';
import { GoogleButton } from '@/components/booking/GoogleButton';
import { SupportChat } from '@/components/booking/SupportChat';

const DRAFT_KEY = 'khayyat-booking-draft';
const SERVICE_TYPES: ServiceType[] = ['van_pickup', 'home_service', 'shop_visit', 'quick_fix'];

interface Draft {
  step: 1 | 2 | 3 | 4;
  description: string;
  quickItems: QuickItem[];
  garment: string;
  prefersHome: boolean;
  photoUrls: string[];
  recommendation: Recommendation | null;
  serviceType: ServiceType | null;
  district: string;
  addressLine: string;
  phone: string;
  date: string;
  slot: string;
}

const EMPTY: Draft = {
  step: 1, description: '', quickItems: [], garment: '', prefersHome: false, photoUrls: [],
  recommendation: null, serviceType: null, district: '', addressLine: '', phone: '', date: '', slot: '',
};

const isoDate = (d: Date) =>
  `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;

function BookingFlow() {
  const isAr = useLocale() === 'ar';
  const router = useRouter();
  const params = useSearchParams();
  const { user } = useAuth();

  const presetService = params.get('service') as ServiceType | null;
  const [draft, setDraft] = useState<Draft>(EMPTY);
  const [options, setOptions] = useState<BookingOptions | null>(null);
  const [slotState, setSlotState] = useState<{ key: string; slots: { slot: string; available: boolean }[] } | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [showChat, setShowChat] = useState(false);
  const [saved, setSaved] = useState<Address[]>([]);

  useEffect(() => {
    if (user) accountApi.addresses().then(setSaved).catch(() => {});
  }, [user]);

  const set = useCallback((patch: Partial<Draft>) => setDraft((d) => ({ ...d, ...patch })), []);

  // Restore a draft saved before a sign-in redirect, or start from URL hints.
  useEffect(() => {
    let restored: Draft | null = null;
    try {
      if (params.get('resume')) restored = JSON.parse(sessionStorage.getItem(DRAFT_KEY) || 'null');
    } catch { /* storage unavailable */ }
    if (restored) {
      // Restoring from sessionStorage must wait for the client (SSR has no storage), so this
      // can't be a lazy initial state without a hydration mismatch.
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setDraft(restored);
    } else {
      const preset = presetService && SERVICE_TYPES.includes(presetService) ? presetService : null;
      setDraft({ ...EMPTY, description: params.get('describe') ?? '', serviceType: preset });
    }
    bookingsApi.options().then(setOptions).catch(() => setError(
      isAr ? 'الخادم عم يصحى، حدّث الصفحة بعد لحظات.' : 'The server is waking up, refresh in a moment.'));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    try { sessionStorage.setItem(DRAFT_KEY, JSON.stringify(draft)); } catch { /* ignore */ }
  }, [draft]);

  const service = draft.serviceType;
  const needsAddress = service !== null && service !== 'shop_visit';

  const days = useMemo(() => {
    if (!options) return [];
    const closedJs = (options.closed_weekday + 1) % 7; // Python Monday=0 -> JS Sunday=0
    const out: Date[] = [];
    for (let i = 0; i <= options.horizon_days && out.length < 10; i++) {
      const d = new Date();
      d.setDate(d.getDate() + i);
      if (d.getDay() !== closedJs) out.push(d);
    }
    return out;
  }, [options]);

  const slotKey = `${service}|${draft.date}`;
  const slots = slotState?.key === slotKey ? slotState.slots : null;
  const loadSlots = useCallback(() => {
    if (!service || !draft.date) return;
    const key = `${service}|${draft.date}`;
    bookingsApi.availability(service, draft.date)
      .then((s) => setSlotState({ key, slots: s }))
      .catch(() => setSlotState({ key, slots: [] }));
  }, [service, draft.date]);
  useEffect(loadSlots, [loadSlots]);

  const price = (usd: number) => formatPrice(usd, options?.usd_to_syp ?? 0, isAr);

  const quickEstimate = useMemo(() => {
    if (!options || draft.quickItems.length === 0) return null;
    const lo = draft.quickItems.reduce((s, k) => s + options.quick_items_usd[k][0], 0);
    const hi = draft.quickItems.reduce((s, k) => s + options.quick_items_usd[k][1], 0);
    return [lo, hi] as const;
  }, [options, draft.quickItems]);

  const toggleItem = (k: QuickItem) =>
    set({ quickItems: draft.quickItems.includes(k) ? draft.quickItems.filter((x) => x !== k) : [...draft.quickItems, k] });

  const goRecommend = async () => {
    setBusy(true);
    setError('');
    try {
      const rec = await bookingsApi.recommend(draft.description, draft.quickItems, draft.prefersHome);
      set({ recommendation: rec, serviceType: presetService ?? rec.service_type, step: 2 });
    } catch {
      setError(isAr ? 'تعذر الاتصال بالخادم، جرّب مرة تانية.' : 'Could not reach the server, try again.');
    } finally {
      setBusy(false);
    }
  };

  const onPhoto = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file || draft.photoUrls.length >= 6) return;
    setBusy(true);
    try {
      const { url } = await catalogApi.uploadImage(file);
      set({ photoUrls: [...draft.photoUrls, url] });
    } catch {
      setError(isAr ? 'ما انرفعت الصورة، جرّب صورة أصغر.' : 'Upload failed, try a smaller photo.');
    } finally {
      setBusy(false);
    }
  };

  const confirm = async () => {
    if (!service) return;
    setBusy(true);
    setError('');
    try {
      const booking = await bookingsApi.create({
        service_type: service,
        description: draft.description,
        garment: draft.garment || undefined,
        quick_items: service === 'quick_fix' ? draft.quickItems : [],
        photo_urls: draft.photoUrls,
        city: 'damascus',
        district: needsAddress ? draft.district : undefined,
        address_line: needsAddress ? draft.addressLine : undefined,
        contact_phone: draft.phone || undefined,
        scheduled_date: draft.date,
        slot: draft.slot,
        followed_recommendation: draft.recommendation?.service_type === service,
      });
      try { sessionStorage.removeItem(DRAFT_KEY); } catch { /* ignore */ }
      router.push(`/bookings/${booking.id}`);
    } catch (err) {
      if (err instanceof APIError && err.status === 409) {
        set({ slot: '', step: 3 });
        loadSlots();
      }
      setError(err instanceof APIError
        ? (err.details.errors?.map((e) => e.message).join(' ') || err.details.detail)
        : (isAr ? 'ما زبط الحجز، جرّب مرة تانية.' : 'Booking failed, please try again.'));
      setBusy(false);
    }
  };

  const step1Valid = service === 'quick_fix' && !draft.recommendation
    ? draft.quickItems.length > 0 || draft.description.trim().length >= 3
    : draft.description.trim().length >= 3 || draft.quickItems.length > 0;
  const step2Valid = !!service && (service !== 'quick_fix' || draft.quickItems.length > 0)
    && (service === 'quick_fix' || draft.description.trim().length >= 10);
  const step3Valid = !!draft.date && !!draft.slot
    && (!needsAddress || (draft.district && draft.addressLine.trim().length >= 3 && draft.phone.replace(/\D/g, '').length >= 7));

  const steps = isAr
    ? ['اشرح طلبك', 'الخدمة', 'المكان والوقت', 'التأكيد']
    : ['Your request', 'Service', 'Place & time', 'Confirm'];

  return (
    <div className="min-h-screen bg-cream pt-32 pb-20 px-4">
      <div className="max-w-3xl mx-auto space-y-6">
        {/* Progress */}
        <ol className="grid grid-cols-4 gap-2">
          {steps.map((label, i) => {
            const n = (i + 1) as Draft['step'];
            const active = draft.step === n;
            const done = draft.step > n;
            return (
              <li key={label}>
                <button
                  type="button"
                  disabled={!done}
                  onClick={() => set({ step: n })}
                  className="w-full text-start disabled:cursor-default"
                >
                  <span className={`block h-1.5 rounded-full ${done || active ? 'bg-[#18181B]' : 'bg-line'}`} />
                  <span className={`mt-2 block text-xs font-medium ${active ? 'text-[#18181B]' : 'text-muted'}`}>{label}</span>
                </button>
              </li>
            );
          })}
        </ol>

        {error && <p className="rounded-xl bg-danger/10 px-4 py-3 text-sm text-danger">{error}</p>}

        {/* STEP 1: describe */}
        {draft.step === 1 && (
          <section className="rounded-3xl bg-white border border-line/80 shadow-sm p-6 sm:p-8 space-y-6">
            <div className="space-y-1.5">
              <h1 className="text-2xl sm:text-3xl font-bold text-[#18181B] tracking-tight">
                {service === 'quick_fix'
                  ? (isAr ? 'شو بدك نصلّح؟' : 'What needs fixing?')
                  : (isAr ? 'احكيلنا شو بدك' : 'Tell us what you need')}
              </h1>
              <p className="text-sm text-muted">
                {isAr ? 'اكتب بكلماتك، ونحن منقترح الخدمة الأنسب.' : 'Describe it in your own words and we’ll suggest the right service.'}
              </p>
            </div>

            <div className="space-y-2">
              <p className="text-sm font-semibold text-[#18181B]">{isAr ? 'تصليحات سريعة' : 'Quick repairs'}</p>
              <div className="flex flex-wrap gap-2">
                {QUICK_ITEMS.map((q) => {
                  const on = draft.quickItems.includes(q.key);
                  return (
                    <button
                      key={q.key}
                      type="button"
                      onClick={() => toggleItem(q.key)}
                      className={`inline-flex items-center gap-1.5 rounded-full border px-3.5 py-2 text-sm transition-colors ${
                        on ? 'border-[#18181B] bg-[#18181B] text-white' : 'border-line bg-white hover:bg-mist'
                      }`}
                    >
                      <span>{q.icon}</span>{isAr ? q.ar : q.en}
                      {options && (
                        <span className={`text-xs ${on ? 'text-white/70' : 'text-muted'}`}>
                          · ${options.quick_items_usd[q.key][0]}–{options.quick_items_usd[q.key][1]}
                        </span>
                      )}
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="space-y-1.5">
              <label htmlFor="book-description" className="text-sm font-semibold text-[#18181B]">
                {isAr ? 'وصف الطلب' : 'Description'}
              </label>
              <textarea
                id="book-description"
                rows={4}
                value={draft.description}
                onChange={(e) => set({ description: e.target.value })}
                placeholder={isAr
                  ? 'مثلاً: بدي قصّر بنطلون الجينز 3 سانتي وضيّق الخصر شوي'
                  : 'e.g. Shorten my jeans by 3 cm and take the waist in a little'}
                className="w-full rounded-2xl border border-line bg-cream/50 p-4 text-sm focus:outline-none focus:ring-2 focus:ring-gold"
              />
            </div>

            <div className="space-y-2">
              <p className="text-sm font-semibold text-[#18181B]">{isAr ? 'نوع القطعة (اختياري)' : 'Garment (optional)'}</p>
              <div className="flex flex-wrap gap-2">
                {GARMENTS.map((g) => (
                  <button
                    key={g.key}
                    type="button"
                    onClick={() => set({ garment: draft.garment === g.key ? '' : g.key })}
                    className={`rounded-full border px-3.5 py-1.5 text-sm ${
                      draft.garment === g.key ? 'border-gold bg-gold/15 text-[#18181B]' : 'border-line hover:bg-mist'
                    }`}
                  >
                    {isAr ? g.ar : g.en}
                  </button>
                ))}
              </div>
            </div>

            <div className="space-y-2">
              <p className="text-sm font-semibold text-[#18181B]">{isAr ? 'صور (اختياري)' : 'Photos (optional)'}</p>
              {user ? (
                <div className="flex flex-wrap gap-3">
                  {draft.photoUrls.map((u) => (
                    <button key={u} type="button" onClick={() => set({ photoUrls: draft.photoUrls.filter((x) => x !== u) })}
                      className="relative h-20 w-20 overflow-hidden rounded-xl border border-line" title={isAr ? 'إزالة' : 'Remove'}>
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img src={u} alt="" className="h-full w-full object-cover" />
                    </button>
                  ))}
                  {draft.photoUrls.length < 6 && (
                    <label className="flex h-20 w-20 cursor-pointer items-center justify-center rounded-xl border-2 border-dashed border-line text-xs text-muted hover:border-gold">
                      {busy ? '…' : `+ ${isAr ? 'صورة' : 'Photo'}`}
                      <input type="file" accept="image/*" className="hidden" onChange={onPhoto} disabled={busy} />
                    </label>
                  )}
                </div>
              ) : (
                <p className="text-xs text-muted">{isAr ? 'سجّل دخولك بالخطوة الأخيرة لتضيف صور، أو ابعتها بالمحادثة بعد الحجز.' : 'Sign in at the last step to add photos, or send them in the chat after booking.'}</p>
              )}
            </div>

            <label className="flex items-center gap-3 rounded-2xl bg-mist/60 px-4 py-3 cursor-pointer">
              <input
                id="prefers-home"
                type="checkbox"
                checked={draft.prefersHome}
                onChange={(e) => set({ prefersHome: e.target.checked })}
                className="h-5 w-5 accent-[#18181B]"
              />
              <span className="text-sm text-[#18181B]">{isAr ? 'بفضّل ما اطلع من البيت' : 'I’d rather not leave home'}</span>
            </label>

            <div className="flex justify-end">
              <button
                type="button"
                onClick={goRecommend}
                disabled={!step1Valid || busy}
                className="btn-shine rounded-full bg-[#18181B] px-7 py-3 text-sm font-bold text-white disabled:opacity-40"
              >
                {busy ? (isAr ? 'عم نفكّر…' : 'Thinking…') : (isAr ? 'اقترحلي الخدمة ←' : 'Suggest a service →')}
              </button>
            </div>
          </section>
        )}

        {/* STEP 2: recommendation + service choice */}
        {draft.step === 2 && draft.recommendation && (
          <section className="space-y-5">
            <div className="rounded-3xl bg-[#18181B] text-white p-6 sm:p-8 space-y-3">
              <p className="text-xs font-bold uppercase tracking-widest text-gold">{isAr ? 'اقتراحنا لطلبك' : 'Our recommendation'}</p>
              <h2 className="text-2xl font-bold">
                {isAr
                  ? `بناءً على طلبك، منقترح: ${serviceInfo(draft.recommendation.service_type).ar.name}`
                  : `Based on your request, we recommend our ${serviceInfo(draft.recommendation.service_type).en.name} service.`}
              </h2>
              <p className="text-sm text-white/70">{isAr ? draft.recommendation.reason_ar : draft.recommendation.reason_en}</p>
              {service !== draft.recommendation.service_type && (
                <button type="button" onClick={() => set({ serviceType: draft.recommendation!.service_type })}
                  className="rounded-full bg-gold px-4 py-2 text-sm font-bold text-[#18181B]">
                  {isAr ? 'اختار الخدمة المقترحة' : 'Use the recommended service'}
                </button>
              )}
            </div>

            <div className="grid gap-3 sm:grid-cols-2">
              {SERVICES.map((s) => {
                const on = service === s.type;
                const rec = draft.recommendation?.service_type === s.type;
                const fee = options?.visit_fees_usd[s.type];
                return (
                  <button
                    key={s.type}
                    type="button"
                    onClick={() => set({ serviceType: s.type })}
                    className={`relative overflow-hidden rounded-2xl border bg-white text-start transition-all ${
                      on ? 'border-[#18181B] ring-2 ring-[#18181B]' : 'border-line hover:border-[#18181B]/40'
                    }`}
                  >
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={s.image} alt="" className="h-28 w-full object-cover bg-cream" />
                    {rec && (
                      <span className="absolute top-2 start-2 rounded-full bg-gold px-2.5 py-1 text-[11px] font-bold text-[#18181B]">
                        {isAr ? 'مقترح لك' : 'Recommended'}
                      </span>
                    )}
                    <div className="p-4 space-y-1">
                      <p className="font-bold text-[#18181B]">{s.icon} {isAr ? s.ar.name : s.en.name}</p>
                      <p className="text-xs text-muted">{isAr ? s.ar.short : s.en.short}</p>
                      {fee !== undefined && (
                        <p className="text-xs font-semibold text-[#18181B] pt-1">
                          {fee > 0 ? `${isAr ? 'رسم الزيارة' : 'Visit fee'}: ${price(fee)}` : (isAr ? 'بدون رسم زيارة' : 'No visit fee')}
                        </p>
                      )}
                    </div>
                  </button>
                );
              })}
            </div>

            {service === 'quick_fix' && draft.quickItems.length === 0 && (
              <p className="text-sm text-danger">{isAr ? 'اختار تصليح واحد على الأقل من الخطوة الأولى.' : 'Pick at least one repair in step 1.'}</p>
            )}
            {service && service !== 'quick_fix' && draft.description.trim().length < 10 && (
              <p className="text-sm text-danger">{isAr ? 'زيد شوي على الوصف (10 أحرف على الأقل) بالخطوة الأولى.' : 'Add a bit more to the description (10+ characters) in step 1.'}</p>
            )}

            {service === 'shop_visit' && (
              <div className="rounded-2xl border border-line bg-white p-4 space-y-3">
                <div className="flex items-center justify-between gap-3">
                  <p className="text-sm text-[#18181B]">{isAr ? 'بدك تحكي مع الخيّاط قبل الزيارة؟' : 'Want to talk to the tailor before your visit?'}</p>
                  <button type="button" onClick={() => setShowChat((v) => !v)} className="rounded-full border border-line px-4 py-2 text-sm font-semibold hover:bg-mist">
                    {showChat ? (isAr ? 'إخفاء' : 'Hide') : (isAr ? '💬 محادثة' : '💬 Chat')}
                  </button>
                </div>
                {showChat && (user
                  ? <SupportChat intro={isAr ? 'اشرح شو بدك، وابعت صور إذا في. منرد عليك بأسرع وقت.' : 'Explain what you need and send photos. We’ll reply shortly.'} />
                  : <div className="text-center space-y-2 py-2"><p className="text-xs text-muted">{isAr ? 'سجّل دخولك لتبدأ المحادثة' : 'Sign in to start chatting'}</p><GoogleButton /></div>)}
              </div>
            )}

            <div className="flex justify-between">
              <button type="button" onClick={() => set({ step: 1 })} className="rounded-full border border-line bg-white px-6 py-3 text-sm font-semibold">
                {isAr ? '→ رجوع' : '← Back'}
              </button>
              <button type="button" disabled={!step2Valid} onClick={() => set({ step: 3, slot: '' })}
                className="rounded-full bg-[#18181B] px-7 py-3 text-sm font-bold text-white disabled:opacity-40">
                {isAr ? 'التالي ←' : 'Next →'}
              </button>
            </div>
          </section>
        )}

        {/* STEP 3: where and when */}
        {draft.step === 3 && service && (
          <section className="rounded-3xl bg-white border border-line/80 shadow-sm p-6 sm:p-8 space-y-7">
            <h2 className="text-2xl font-bold text-[#18181B]">{isAr ? 'وين ووقتيش؟' : 'Where and when?'}</h2>

            {needsAddress && saved.length > 0 && (
              <div className="flex flex-wrap gap-2">
                {saved.map((a) => (
                  <button key={a.id} type="button" onClick={() => set({ district: a.district ?? '', addressLine: a.line1 })}
                    className={`rounded-full border px-3.5 py-1.5 text-sm ${draft.addressLine === a.line1 ? 'border-[#18181B] bg-[#18181B] text-white' : 'border-line hover:bg-mist'}`}>
                    📍 {a.label}
                  </button>
                ))}
              </div>
            )}

            {needsAddress ? (
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-1.5">
                  <label htmlFor="book-district" className="text-sm font-semibold">{isAr ? 'المنطقة (دمشق)' : 'District (Damascus)'}</label>
                  <select id="book-district" value={draft.district} onChange={(e) => set({ district: e.target.value })}
                    className="h-11 w-full rounded-xl border border-line bg-white px-3 text-sm focus:outline-none focus:ring-2 focus:ring-gold">
                    <option value="">{isAr ? 'اختار المنطقة' : 'Choose a district'}</option>
                    {DAMASCUS_DISTRICTS.map((d) => <option key={d.en} value={isAr ? d.ar : d.en}>{isAr ? d.ar : d.en}</option>)}
                  </select>
                </div>
                <div className="space-y-1.5">
                  <label htmlFor="book-phone" className="text-sm font-semibold">{isAr ? 'رقم الموبايل' : 'Mobile number'}</label>
                  <input id="book-phone" type="tel" inputMode="tel" dir="ltr" value={draft.phone} onChange={(e) => set({ phone: e.target.value })}
                    placeholder="09XX XXX XXX" className="h-11 w-full rounded-xl border border-line px-3 text-sm focus:outline-none focus:ring-2 focus:ring-gold" />
                </div>
                <div className="space-y-1.5 sm:col-span-2">
                  <label htmlFor="book-address" className="text-sm font-semibold">{isAr ? 'العنوان بالتفصيل' : 'Street and building'}</label>
                  <input id="book-address" value={draft.addressLine} onChange={(e) => set({ addressLine: e.target.value })}
                    placeholder={isAr ? 'الشارع، البناء، الطابق، علامة مميزة' : 'Street, building, floor, landmark'}
                    className="h-11 w-full rounded-xl border border-line px-3 text-sm focus:outline-none focus:ring-2 focus:ring-gold" />
                </div>
              </div>
            ) : (
              <p className="rounded-2xl bg-mist/60 px-4 py-3 text-sm text-[#18181B]">
                📍 {options?.shop_address || (isAr ? 'منبعتلك عنوان المحل مع تأكيد الموعد.' : 'We’ll send the shop address with your confirmation.')}
              </p>
            )}

            <div className="space-y-2">
              <p className="text-sm font-semibold">{isAr ? 'اليوم' : 'Day'}</p>
              <div className="flex gap-2 overflow-x-auto pb-1">
                {days.map((d) => {
                  const iso = isoDate(d);
                  const on = draft.date === iso;
                  return (
                    <button key={iso} type="button" onClick={() => set({ date: iso, slot: '' })}
                      className={`shrink-0 rounded-2xl border px-4 py-2.5 text-center ${on ? 'border-[#18181B] bg-[#18181B] text-white' : 'border-line bg-white hover:bg-mist'}`}>
                      <span className="block text-[11px] opacity-70">{d.toLocaleDateString(isAr ? 'ar-SY' : 'en-GB', { weekday: 'short' })}</span>
                      <span className="block text-lg font-bold">{d.getDate()}</span>
                    </button>
                  );
                })}
              </div>
              <p className="text-xs text-muted">{isAr ? 'الجمعة عطلة. الأوقات بتوقيت دمشق.' : 'Closed Fridays. Times are Damascus time.'}</p>
            </div>

            {draft.date && (
              <div className="space-y-2">
                <p className="text-sm font-semibold">
                  {service === 'shop_visit' ? (isAr ? 'الوقت' : 'Time') : (isAr ? 'نافذة الوصول (ساعتين)' : 'Arrival window (2 hours)')}
                </p>
                {slots === null ? (
                  <p className="text-sm text-muted">{isAr ? 'عم نشوف المواعيد المتاحة…' : 'Checking availability…'}</p>
                ) : (
                  <div className="grid grid-cols-3 sm:grid-cols-5 gap-2">
                    {slots.map((s) => (
                      <button key={s.slot} type="button" disabled={!s.available} onClick={() => set({ slot: s.slot })}
                        className={`rounded-xl border py-2.5 text-sm font-semibold tabular-nums ${
                          draft.slot === s.slot ? 'border-[#18181B] bg-[#18181B] text-white'
                            : s.available ? 'border-line bg-white hover:bg-mist' : 'border-line bg-line/40 text-muted line-through'
                        }`}>
                        {s.slot}
                      </button>
                    ))}
                  </div>
                )}
                {slots && slots.every((s) => !s.available) && (
                  <p className="text-xs text-muted">{isAr ? 'هاليوم مليان، جرّب يوم تاني.' : 'This day is full, try another one.'}</p>
                )}
              </div>
            )}

            <div className="flex justify-between">
              <button type="button" onClick={() => set({ step: 2 })} className="rounded-full border border-line bg-white px-6 py-3 text-sm font-semibold">
                {isAr ? '→ رجوع' : '← Back'}
              </button>
              <button type="button" disabled={!step3Valid} onClick={() => set({ step: 4 })}
                className="rounded-full bg-[#18181B] px-7 py-3 text-sm font-bold text-white disabled:opacity-40">
                {isAr ? 'مراجعة الحجز ←' : 'Review booking →'}
              </button>
            </div>
          </section>
        )}

        {/* STEP 4: confirm */}
        {draft.step === 4 && service && (
          <section className="rounded-3xl bg-white border border-line/80 shadow-sm overflow-hidden">
            <div className="flex items-center gap-4 border-b border-line p-6">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={serviceInfo(service).image} alt="" className="h-16 w-16 rounded-2xl object-cover bg-cream" />
              <div>
                <p className="text-xs text-muted">{isAr ? 'الخدمة' : 'Service'}</p>
                <p className="text-lg font-bold text-[#18181B]">{isAr ? serviceInfo(service).ar.name : serviceInfo(service).en.name}</p>
                <p className="text-xs text-muted">{isAr ? serviceInfo(service).ar.steps : serviceInfo(service).en.steps}</p>
              </div>
            </div>
            <dl className="divide-y divide-line text-sm">
              {[
                [isAr ? 'الطلب' : 'Request', draft.description || draft.quickItems.map((k) => {
                  const q = QUICK_ITEMS.find((x) => x.key === k)!; return isAr ? q.ar : q.en; }).join('، ')],
                [isAr ? 'الموعد' : 'When', `${new Date(draft.date + 'T00:00').toLocaleDateString(isAr ? 'ar-SY' : 'en-GB', { weekday: 'long', day: 'numeric', month: 'long' })} · ${draft.slot}`],
                [isAr ? 'المكان' : 'Where', needsAddress ? `${draft.district}، ${draft.addressLine}` : (options?.shop_address || (isAr ? 'محل خيّاط، دمشق' : 'Khayyat shop, Damascus'))],
              ].map(([k, v]) => (
                <div key={k} className="flex gap-4 px-6 py-3.5">
                  <dt className="w-24 shrink-0 text-muted">{k}</dt>
                  <dd className="text-[#18181B] break-words">{v}</dd>
                </div>
              ))}
              <div className="flex gap-4 px-6 py-3.5 bg-cream/50">
                <dt className="w-24 shrink-0 text-muted">{isAr ? 'السعر' : 'Price'}</dt>
                <dd className="space-y-1 text-[#18181B]">
                  {options && options.visit_fees_usd[service] > 0 && (
                    <p>{isAr ? 'رسم الزيارة' : 'Visit fee'}: <b>{price(options.visit_fees_usd[service])}</b></p>
                  )}
                  {service === 'quick_fix' && quickEstimate ? (
                    <p>{isAr ? 'التصليح' : 'Repair'}: <b>{price(quickEstimate[0])} – {price(quickEstimate[1])}</b></p>
                  ) : (
                    <p>{isAr ? 'سعر الشغل بيتحدد بعد القياس، وبيوصلك قبل ما نبلّش.' : 'The work is priced after measuring; you’ll see it before we start.'}</p>
                  )}
                  <p className="text-xs text-muted">{isAr ? 'الدفع كاش بعد ما تخلص الخدمة.' : 'Pay in cash once the service is complete.'}</p>
                </dd>
              </div>
            </dl>

            <div className="p-6 space-y-4 border-t border-line">
              {user ? (
                <button type="button" onClick={confirm} disabled={busy}
                  className="btn-shine w-full rounded-full bg-[#18181B] py-4 text-base font-bold text-white disabled:opacity-50">
                  {busy ? (isAr ? 'عم نأكد…' : 'Confirming…') : (isAr ? 'تأكيد الحجز' : 'Confirm booking')}
                </button>
              ) : (
                <div className="space-y-3 text-center">
                  <p className="text-sm font-semibold text-[#18181B]">{isAr ? 'آخر خطوة: سجّل دخولك لنأكد حجزك' : 'Last step: sign in to confirm'}</p>
                  <GoogleButton />
                  <p className="text-xs text-muted">
                    {isAr ? 'أو ' : 'or '}
                    <Link href={`/auth/login?next=${encodeURIComponent('/book?resume=1')}`} className="font-semibold text-[#18181B] underline">
                      {isAr ? 'سجّل بالإيميل' : 'sign in with email'}
                    </Link>
                  </p>
                </div>
              )}
              <button type="button" onClick={() => set({ step: 3 })} className="w-full text-sm text-muted hover:text-[#18181B]">
                {isAr ? 'تعديل الموعد أو المكان' : 'Change time or place'}
              </button>
            </div>
          </section>
        )}
      </div>
    </div>
  );
}

export default function BookPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-cream" />}>
      <BookingFlow />
    </Suspense>
  );
}
