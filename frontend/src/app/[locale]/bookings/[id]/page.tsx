'use client';

import React, { useCallback, useEffect, useState } from 'react';
import { useLocale } from 'next-intl';
import { useParams } from 'next/navigation';
import { Link } from '@/i18n/routing';
import { useAuth } from '@/lib/auth-context';
import { APIError } from '@/lib/api-client';
import { bookingsApi, formatPrice, type Booking, type BookingOptions } from '@/lib/api';
import { QUICK_ITEMS, serviceInfo, statusLabel } from '@/components/booking/catalog';
import { StatusTimeline } from '@/components/booking/StatusTimeline';
import { SupportChat } from '@/components/booking/SupportChat';

export default function BookingTrackingPage() {
  const isAr = useLocale() === 'ar';
  const { id } = useParams<{ id: string }>();
  const { user, isLoading } = useAuth();
  const [booking, setBooking] = useState<Booking | null>(null);
  const [options, setOptions] = useState<BookingOptions | null>(null);
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const [rating, setRating] = useState(0);
  const [comment, setComment] = useState('');

  const load = useCallback(() => {
    bookingsApi.get(id).then(setBooking).catch((err) => {
      if (err instanceof APIError && err.status === 404) setError(isAr ? 'الحجز مو موجود.' : 'Booking not found.');
    });
  }, [id, isAr]);

  useEffect(() => {
    if (!user) return;
    load();
    bookingsApi.options().then(setOptions).catch(() => {});
    const t = setInterval(load, 15000); // live status without a reload
    return () => clearInterval(t);
  }, [user, load]);

  if (isLoading) return <div className="min-h-screen bg-cream" />;
  if (!user) {
    return (
      <div className="min-h-[70vh] flex flex-col items-center justify-center gap-4 pt-28 px-4 text-center">
        <p className="text-lg font-semibold">{isAr ? 'سجّل دخولك لتتابع حجزك' : 'Sign in to track your booking'}</p>
        <Link href={`/auth/login?next=${encodeURIComponent(`/bookings/${id}`)}`}
          className="rounded-full bg-[#18181B] px-6 py-3 text-sm font-bold text-white">{isAr ? 'تسجيل الدخول' : 'Sign in'}</Link>
      </div>
    );
  }
  if (error) return <div className="min-h-[70vh] pt-32 text-center text-muted">{error}</div>;
  if (!booking) return <div className="min-h-[70vh] pt-32 text-center text-muted">{isAr ? 'عم نحمّل…' : 'Loading…'}</div>;

  const info = serviceInfo(booking.service_type);
  const price = (usd: number) => formatPrice(usd, options?.usd_to_syp ?? 0, isAr);
  const when = `${new Date(booking.scheduled_date + 'T00:00').toLocaleDateString(isAr ? 'ar-SY' : 'en-GB', { weekday: 'long', day: 'numeric', month: 'long' })} · ${booking.slot}`;
  const done = booking.status === 'completed';
  const cancelled = booking.status === 'cancelled';

  const act = async (fn: () => Promise<Booking>) => {
    setBusy(true);
    setError('');
    try { setBooking(await fn()); } catch (err) {
      setError(err instanceof APIError ? err.details.detail : (isAr ? 'ما زبطت العملية' : 'That didn’t work'));
    } finally { setBusy(false); }
  };

  return (
    <div className="min-h-screen bg-cream pt-28 pb-20 px-4">
      <div className="max-w-5xl mx-auto space-y-6">
        <Link href="/account" className="text-sm text-muted hover:text-[#18181B]">{isAr ? '→ كل حجوزاتي' : '← All my bookings'}</Link>

        {/* Header */}
        <header className="rounded-3xl bg-[#18181B] text-white p-6 sm:p-8 flex flex-wrap items-center gap-5 justify-between">
          <div className="flex items-center gap-4">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={info.image} alt="" className="h-16 w-16 rounded-2xl object-cover bg-cream" />
            <div>
              <p className="text-xs text-white/60 font-mono tracking-wider">{booking.reference}</p>
              <h1 className="text-2xl font-bold">{isAr ? info.ar.name : info.en.name}</h1>
              <p className="text-sm text-white/70">{when}</p>
            </div>
          </div>
          <span className={`rounded-full px-4 py-2 text-sm font-bold ${cancelled ? 'bg-danger text-white' : done ? 'bg-success text-white' : 'bg-gold text-[#18181B]'}`}>
            {statusLabel(booking.status, booking.service_type, isAr)}
          </span>
        </header>

        <div className="grid gap-6 lg:grid-cols-[1fr_380px]">
          <div className="space-y-6">
            {/* Timeline */}
            <section className="rounded-3xl bg-white border border-line/80 p-6 sm:p-8">
              <div className="flex items-center justify-between mb-5">
                <h2 className="text-lg font-bold text-[#18181B]">{isAr ? 'حالة الطلب' : 'Status'}</h2>
                {!done && !cancelled && (
                  <span className="flex items-center gap-1.5 text-xs text-muted">
                    <span className="h-2 w-2 rounded-full bg-success animate-pulse" />{isAr ? 'تحديث مباشر' : 'Live'}
                  </span>
                )}
              </div>
              {booking.assignee_name && (
                <p className="mb-5 rounded-2xl bg-mist/60 px-4 py-3 text-sm">
                  {booking.service_type === 'home_service' ? '👤' : '🚐'} {booking.assignee_name}
                </p>
              )}
              <StatusTimeline booking={booking} isAr={isAr} />
            </section>

            {/* Details */}
            <section className="rounded-3xl bg-white border border-line/80 p-6 sm:p-8 space-y-4 text-sm">
              <h2 className="text-lg font-bold text-[#18181B]">{isAr ? 'تفاصيل الطلب' : 'Request details'}</h2>
              {booking.quick_items.length > 0 && (
                <div className="flex flex-wrap gap-2">
                  {booking.quick_items.map((k) => {
                    const q = QUICK_ITEMS.find((x) => x.key === k);
                    return <span key={k} className="rounded-full bg-mist px-3 py-1">{q?.icon} {isAr ? q?.ar : q?.en}</span>;
                  })}
                </div>
              )}
              <p className="whitespace-pre-wrap text-[#18181B]">{booking.description}</p>
              {booking.address_line && <p className="text-muted">📍 {booking.district}، {booking.address_line}</p>}
              {booking.shop_address && <p className="text-muted">📍 {booking.shop_address}</p>}
              {booking.photo_urls.length > 0 && (
                <div className="flex flex-wrap gap-2">
                  {booking.photo_urls.map((u) => (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img key={u} src={u} alt="" className="h-20 w-20 rounded-xl object-cover" />
                  ))}
                </div>
              )}
              {booking.can_cancel && (
                <button type="button" disabled={busy}
                  onClick={() => act(() => bookingsApi.cancel(booking.id))}
                  className="rounded-full border border-danger/40 px-4 py-2 text-sm font-semibold text-danger hover:bg-danger/5">
                  {isAr ? 'إلغاء الحجز' : 'Cancel booking'}
                </button>
              )}
            </section>
          </div>

          <div className="space-y-6">
            {/* Payment */}
            <section className="rounded-3xl bg-white border border-line/80 p-6 space-y-3 text-sm">
              <h2 className="text-lg font-bold text-[#18181B]">{isAr ? 'الدفع' : 'Payment'}</h2>
              {booking.visit_fee_usd > 0 && (
                <div className="flex justify-between"><span className="text-muted">{isAr ? 'رسم الزيارة' : 'Visit fee'}</span><span>{price(booking.visit_fee_usd)}</span></div>
              )}
              {booking.final_price_usd != null ? (
                <div className="flex justify-between font-semibold"><span>{isAr ? 'سعر الشغل' : 'Work'}</span><span>{price(booking.final_price_usd)}</span></div>
              ) : booking.estimate_min_usd != null && booking.estimate_max_usd != null ? (
                <div className="flex justify-between"><span className="text-muted">{isAr ? 'تقدير' : 'Estimate'}</span><span>{price(booking.estimate_min_usd)} – {price(booking.estimate_max_usd)}</span></div>
              ) : (
                <p className="text-muted">{isAr ? 'سعر الشغل بيوصلك بعد القياس.' : 'You’ll get the work price after measuring.'}</p>
              )}
              <p className={`rounded-xl px-3 py-2 text-center font-semibold ${booking.payment_status === 'paid' ? 'bg-success/10 text-success' : 'bg-mist/70 text-[#18181B]'}`}>
                {booking.payment_status === 'paid'
                  ? (isAr ? '✓ تم الدفع' : '✓ Paid')
                  : done ? (isAr ? 'الدفع كاش عند التسليم' : 'Pay in cash on delivery') : (isAr ? 'الدفع كاش بعد الخدمة' : 'Cash after the service')}
              </p>
            </section>

            {/* Review */}
            {(booking.can_review || booking.rating) && (
              <section className="rounded-3xl bg-white border border-line/80 p-6 space-y-3">
                <h2 className="text-lg font-bold text-[#18181B]">{isAr ? 'قيّم الخدمة' : 'Rate the service'}</h2>
                {booking.rating ? (
                  <div>
                    <p className="text-2xl text-gold">{'★'.repeat(booking.rating)}<span className="text-line">{'★'.repeat(5 - booking.rating)}</span></p>
                    {booking.review_comment && <p className="text-sm text-muted mt-1">{booking.review_comment}</p>}
                    <p className="text-xs text-muted mt-2">{isAr ? 'شكراً لتقييمك!' : 'Thanks for your review!'}</p>
                  </div>
                ) : (
                  <>
                    <div className="flex gap-1 text-3xl" role="radiogroup" aria-label={isAr ? 'التقييم' : 'Rating'}>
                      {[1, 2, 3, 4, 5].map((n) => (
                        <button key={n} type="button" role="radio" aria-checked={rating === n} onClick={() => setRating(n)}
                          className={n <= rating ? 'text-gold' : 'text-line hover:text-gold/50'}>★</button>
                      ))}
                    </div>
                    <textarea id="review-comment" rows={3} value={comment} onChange={(e) => setComment(e.target.value)}
                      placeholder={isAr ? 'كيف كانت التجربة؟ (اختياري)' : 'How was it? (optional)'}
                      className="w-full rounded-xl border border-line p-3 text-sm focus:outline-none focus:ring-2 focus:ring-gold" />
                    <button type="button" disabled={!rating || busy}
                      onClick={() => act(() => bookingsApi.review(booking.id, rating, comment || undefined))}
                      className="w-full rounded-full bg-[#18181B] py-3 text-sm font-bold text-white disabled:opacity-40">
                      {isAr ? 'إرسال التقييم' : 'Send review'}
                    </button>
                  </>
                )}
              </section>
            )}

            {/* Chat */}
            <SupportChat bookingId={booking.id}
              intro={isAr ? 'عندك سؤال أو تعديل على الطلب؟ اكتبلنا هون وابعت صور.' : 'Questions or changes? Write to us here and send photos.'} />
            {error && <p className="text-sm text-danger">{error}</p>}
          </div>
        </div>
      </div>
    </div>
  );
}
