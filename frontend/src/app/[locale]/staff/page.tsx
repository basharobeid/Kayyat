'use client';

import React, { useCallback, useEffect, useState } from 'react';
import { useLocale } from 'next-intl';
import { Link, useRouter } from '@/i18n/routing';
import { useAuth } from '@/lib/auth-context';
import { APIError } from '@/lib/api-client';
import { serverDate, staffApi, type Booking, type SupportMessage, type SupportThread } from '@/lib/api';
import { QUICK_ITEMS, serviceInfo, statusLabel } from '@/components/booking/catalog';

function StaffBookingRow({ b, isAr, onChange }: { b: Booking; isAr: boolean; onChange: (b: Booking) => void }) {
  const [assignee, setAssignee] = useState('');
  const [price, setPrice] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const info = serviceInfo(b.service_type);
  const needsAssignee = b.next_status === 'van_assigned' || b.next_status === 'tailor_assigned';

  const run = async (fn: () => Promise<Booking>) => {
    setBusy(true);
    setError('');
    try { onChange(await fn()); setAssignee(''); setPrice(''); } catch (err) {
      setError(err instanceof APIError ? err.details.detail : 'Error');
    } finally { setBusy(false); }
  };

  return (
    <div data-booking-id={b.id} className="rounded-2xl border border-line bg-white p-4 space-y-3">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="font-semibold text-[#18181B]">
            {info.icon} {isAr ? info.ar.name : info.en.name} · <span className="font-mono text-sm">{b.reference}</span>
          </p>
          <p className="text-xs text-muted">
            {b.customer_name} · {b.scheduled_date} {b.slot}
            {b.contact_phone && <> · <span dir="ltr">{b.contact_phone}</span></>}
          </p>
          {b.address_line && <p className="text-xs text-muted">📍 {b.district}، {b.address_line}</p>}
        </div>
        <span className="rounded-full bg-gold/15 px-3 py-1 text-xs font-semibold">{statusLabel(b.status, b.service_type, isAr)}</span>
      </div>
      <p className="text-sm text-[#18181B] line-clamp-2">
        {b.quick_items.map((k) => QUICK_ITEMS.find((q) => q.key === k)?.[isAr ? 'ar' : 'en']).join('، ') || b.description}
      </p>
      <div className="flex flex-wrap items-center gap-2">
        {b.next_status && (
          <>
            {needsAssignee && (
              <input id={`assign-${b.id}`} value={assignee} onChange={(e) => setAssignee(e.target.value)}
                placeholder={isAr ? 'الفان / الخيّاط' : 'Van / tailor'} className="h-9 w-40 rounded-full border border-line px-3 text-sm" />
            )}
            <button type="button" disabled={busy} onClick={() => run(() => staffApi.advance(b.id, assignee))}
              className="rounded-full bg-[#18181B] px-4 py-2 text-sm font-semibold text-white disabled:opacity-40">
              {isAr ? '← ' : '→ '}{statusLabel(b.next_status, b.service_type, isAr)}
            </button>
          </>
        )}
        {b.status !== 'cancelled' && b.payment_status !== 'paid' && (
          <span className="flex items-center gap-1">
            <input id={`price-${b.id}`} type="number" min={1} value={price} onChange={(e) => setPrice(e.target.value)}
              placeholder={b.final_price_usd ? `$${b.final_price_usd}` : (isAr ? 'السعر $' : 'Price $')} className="h-9 w-24 rounded-full border border-line px-3 text-sm" />
            <button type="button" disabled={busy || !price} onClick={() => run(() => staffApi.price(b.id, Number(price)))}
              className="rounded-full border border-line px-3 py-2 text-sm disabled:opacity-40">{isAr ? 'تحديد' : 'Set'}</button>
          </span>
        )}
        {b.status === 'completed' && b.payment_status !== 'paid' && (
          <button type="button" disabled={busy} onClick={() => run(() => staffApi.paid(b.id))}
            className="rounded-full bg-success px-4 py-2 text-sm font-semibold text-white">{isAr ? 'تم الدفع كاش' : 'Mark paid (cash)'}</button>
        )}
        {!['completed', 'cancelled'].includes(b.status) && (
          <button type="button" disabled={busy} onClick={() => run(() => staffApi.cancel(b.id))}
            className="ms-auto rounded-full px-3 py-2 text-xs text-danger hover:bg-danger/5">{isAr ? 'إلغاء' : 'Cancel'}</button>
        )}
        <Link href={`/bookings/${b.id}`} className="text-xs text-muted underline">{isAr ? 'التفاصيل' : 'Details'}</Link>
      </div>
      {error && <p className="text-xs text-danger">{error}</p>}
    </div>
  );
}

function StaffInbox({ isAr }: { isAr: boolean }) {
  const [threads, setThreads] = useState<SupportThread[]>([]);
  const [open, setOpen] = useState<SupportThread | null>(null);
  const [messages, setMessages] = useState<SupportMessage[]>([]);
  const [text, setText] = useState('');

  const loadThreads = useCallback(() => { staffApi.threads().then(setThreads).catch(() => {}); }, []);
  useEffect(() => { loadThreads(); const t = setInterval(loadThreads, 15000); return () => clearInterval(t); }, [loadThreads]);
  useEffect(() => { if (open) staffApi.thread(open.customer_id).then(setMessages); }, [open]);

  return (
    <div className="grid gap-4 md:grid-cols-[260px_1fr]">
      <ul className="space-y-2">
        {threads.length === 0 && <li className="text-sm text-muted">{isAr ? 'ما في محادثات' : 'No conversations'}</li>}
        {threads.map((t) => (
          <li key={t.customer_id}>
            <button type="button" onClick={() => setOpen(t)}
              className={`w-full rounded-2xl border p-3 text-start ${open?.customer_id === t.customer_id ? 'border-[#18181B]' : 'border-line bg-white'}`}>
              <p className="flex items-center gap-2 text-sm font-semibold">
                {!t.last_from_staff && <span className="h-2 w-2 rounded-full bg-gold" title={isAr ? 'بانتظار الرد' : 'Awaiting reply'} />}
                {t.customer_name}
              </p>
              <p className="truncate text-xs text-muted">{t.last_message}</p>
            </button>
          </li>
        ))}
      </ul>
      {open ? (
        <div className="flex flex-col rounded-2xl border border-line bg-white">
          <div className="max-h-[420px] flex-1 space-y-2 overflow-y-auto p-4">
            {messages.map((m) => (
              <div key={m.id} className={`flex ${m.from_staff ? 'justify-end' : 'justify-start'}`}>
                <div className={`max-w-[80%] rounded-2xl px-3 py-2 text-sm ${m.from_staff ? 'bg-[#18181B] text-white' : 'bg-mist'}`}>
                  {m.photo_url && (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={m.photo_url} alt="" className="mb-1 max-h-40 rounded-lg" />
                  )}
                  <p className="whitespace-pre-wrap">{m.body}</p>
                  <p className="mt-0.5 text-[10px] opacity-60">{serverDate(m.created_at).toLocaleString(isAr ? 'ar-SY' : 'en-GB')}</p>
                </div>
              </div>
            ))}
          </div>
          <form className="flex gap-2 border-t border-line p-3" onSubmit={async (e) => {
            e.preventDefault();
            if (!text.trim()) return;
            const m = await staffApi.reply(open.customer_id, text.trim());
            setMessages((x) => [...x, m]); setText(''); loadThreads();
          }}>
            <input id="staff-reply" value={text} onChange={(e) => setText(e.target.value)} placeholder={isAr ? 'الرد…' : 'Reply…'}
              className="h-10 flex-1 rounded-full border border-line px-4 text-sm" />
            <button type="submit" className="rounded-full bg-[#18181B] px-4 text-sm font-semibold text-white">{isAr ? 'إرسال' : 'Send'}</button>
          </form>
        </div>
      ) : (
        <p className="rounded-2xl border border-dashed border-line p-8 text-center text-sm text-muted">{isAr ? 'اختار محادثة' : 'Pick a conversation'}</p>
      )}
    </div>
  );
}

export default function StaffPage() {
  const isAr = useLocale() === 'ar';
  const router = useRouter();
  const { user, isLoading } = useAuth();
  const [tab, setTab] = useState<'bookings' | 'inbox'>('bookings');
  const [showAll, setShowAll] = useState(false);
  const [bookings, setBookings] = useState<Booking[] | null>(null);

  const isStaff = !!user?.roles.includes('admin');
  const load = useCallback(() => {
    staffApi.bookings(!showAll).then((p) => setBookings(p.items)).catch(() => setBookings([]));
  }, [showAll]);

  useEffect(() => { if (!isLoading && !isStaff) router.push('/'); }, [isLoading, isStaff, router]);
  useEffect(() => {
    if (!isStaff) return;
    load();
    const t = setInterval(load, 20000);
    return () => clearInterval(t);
  }, [isStaff, load]);

  if (!isStaff) return <div className="min-h-screen bg-cream" />;

  return (
    <div className="min-h-screen bg-cream pt-28 pb-20 px-4">
      <div className="max-w-5xl mx-auto space-y-6">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h1 className="text-3xl font-bold text-[#18181B]">{isAr ? 'لوحة الفريق' : 'Staff console'}</h1>
          <nav className="flex gap-1 rounded-full border border-line bg-white p-1">
            {(['bookings', 'inbox'] as const).map((t) => (
              <button key={t} type="button" onClick={() => setTab(t)}
                className={`rounded-full px-4 py-2 text-sm ${tab === t ? 'bg-[#18181B] text-white' : 'text-muted'}`}>
                {t === 'bookings' ? (isAr ? 'الحجوزات' : 'Bookings') : (isAr ? 'الرسائل' : 'Inbox')}
              </button>
            ))}
          </nav>
        </div>

        {tab === 'bookings' ? (
          <div className="space-y-3">
            <label className="flex items-center gap-2 text-sm text-muted">
              <input id="show-all" type="checkbox" checked={showAll} onChange={(e) => setShowAll(e.target.checked)} />
              {isAr ? 'عرض المنتهية والملغاة كمان' : 'Include finished and cancelled'}
            </label>
            {bookings === null && <p className="text-muted">{isAr ? 'عم نحمّل…' : 'Loading…'}</p>}
            {bookings?.length === 0 && <p className="rounded-2xl border border-line bg-white p-8 text-center text-muted">{isAr ? 'ما في حجوزات' : 'No bookings'}</p>}
            {bookings?.map((b) => (
              <StaffBookingRow key={b.id} b={b} isAr={isAr}
                onChange={(nb) => setBookings((xs) => xs?.map((x) => (x.id === nb.id ? nb : x)) ?? null)} />
            ))}
          </div>
        ) : (
          <StaffInbox isAr={isAr} />
        )}
      </div>
    </div>
  );
}
