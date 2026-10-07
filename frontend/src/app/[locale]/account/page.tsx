'use client';

import React, { Suspense, useEffect, useState } from 'react';
import { useLocale } from 'next-intl';
import { useSearchParams } from 'next/navigation';
import { Link, useRouter } from '@/i18n/routing';
import { useAuth } from '@/lib/auth-context';
import {
  accountApi,
  bookingsApi,
  notificationsApi,
  serverDate,
  DAMASCUS_DISTRICTS,
  type Address,
  type AppNotification,
  type Booking,
} from '@/lib/api';
import { serviceInfo, statusLabel } from '@/components/booking/catalog';
import { SupportChat } from '@/components/booking/SupportChat';

type Tab = 'bookings' | 'messages' | 'notifications' | 'profile';
const TABS: Tab[] = ['bookings', 'messages', 'notifications', 'profile'];

function BookingCard({ b, isAr }: { b: Booking; isAr: boolean }) {
  const info = serviceInfo(b.service_type);
  const tone = b.status === 'cancelled' ? 'bg-danger/10 text-danger'
    : b.status === 'completed' ? 'bg-success/10 text-success' : 'bg-gold/15 text-[#18181B]';
  return (
    <Link href={`/bookings/${b.id}`}
      className="flex items-center gap-4 rounded-2xl border border-line bg-white p-4 hover:border-[#18181B]/30 transition-colors">
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src={info.image} alt="" className="h-14 w-14 shrink-0 rounded-xl object-cover bg-cream" />
      <div className="min-w-0 flex-1">
        <p className="font-semibold text-[#18181B] truncate">{isAr ? info.ar.name : info.en.name}</p>
        <p className="text-xs text-muted">
          {new Date(b.scheduled_date + 'T00:00').toLocaleDateString(isAr ? 'ar-SY' : 'en-GB', { day: 'numeric', month: 'short' })} · {b.slot} · <span className="font-mono">{b.reference}</span>
        </p>
      </div>
      <span className={`shrink-0 rounded-full px-3 py-1 text-xs font-semibold ${tone}`}>{statusLabel(b.status, b.service_type, isAr)}</span>
    </Link>
  );
}

function AccountView() {
  const isAr = useLocale() === 'ar';
  const router = useRouter();
  const params = useSearchParams();
  const { user, isLoading, refreshUser } = useAuth();
  const initial = params.get('tab') as Tab | null;
  const [tab, setTab] = useState<Tab>(initial && TABS.includes(initial) ? initial : 'bookings');
  const [bookings, setBookings] = useState<Booking[] | null>(null);
  const [notes, setNotes] = useState<AppNotification[] | null>(null);
  const [addresses, setAddresses] = useState<Address[]>([]);
  const [nameDraft, setName] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);
  const [newAddr, setNewAddr] = useState({ label: '', district: '', line1: '' });

  useEffect(() => {
    if (!isLoading && !user) router.push(`/auth/login?next=${encodeURIComponent('/account')}`);
  }, [isLoading, user, router]);

  useEffect(() => {
    if (!user) return;
    bookingsApi.mine().then(setBookings).catch(() => setBookings([]));
    accountApi.addresses().then(setAddresses).catch(() => {});
  }, [user]);

  useEffect(() => {
    if (tab !== 'notifications' || !user) return;
    notificationsApi.list().then((p) => setNotes(p.items)).catch(() => setNotes([]));
    notificationsApi.readAll().catch(() => {});
  }, [tab, user]);

  if (!user) return <div className="min-h-screen bg-cream" />;
  const name = nameDraft ?? user.full_name;

  const active = bookings?.filter((b) => !['completed', 'cancelled'].includes(b.status)) ?? [];
  const past = bookings?.filter((b) => ['completed', 'cancelled'].includes(b.status)) ?? [];

  const label: Record<Tab, string> = isAr
    ? { bookings: 'حجوزاتي', messages: 'الرسائل', notifications: 'الإشعارات', profile: 'الملف الشخصي' }
    : { bookings: 'Bookings', messages: 'Messages', notifications: 'Notifications', profile: 'Profile' };

  const noteText = (n: AppNotification) => {
    if (n.type === 'booking_status') {
      const s = statusLabel(n.data.status, (n.data.service_type || 'van_pickup') as Booking['service_type'], isAr);
      return `${n.data.reference}: ${s}`;
    }
    if (n.type === 'support_reply') return `${isAr ? 'رد من فريق خيّاط' : 'Reply from the Khayyat team'}: ${n.data.preview}`;
    if (n.type === 'booking_price') return `${n.data.reference}: ${isAr ? 'تم تحديد السعر' : 'price confirmed'} ($${n.data.price_usd})`;
    if (n.type === 'booking_paid') return `${n.data.reference}: ${isAr ? 'تم استلام الدفع' : 'payment received'}`;
    return n.type;
  };

  return (
    <div className="min-h-screen bg-cream pt-28 pb-20 px-4">
      <div className="max-w-4xl mx-auto space-y-6">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <p className="text-sm text-muted">{isAr ? 'أهلاً' : 'Welcome'},</p>
            <h1 className="text-3xl font-bold text-[#18181B]">{user.full_name}</h1>
          </div>
          <Link href="/book" className="rounded-full bg-[#18181B] px-6 py-3 text-sm font-bold text-white">
            {isAr ? '+ حجز جديد' : '+ New booking'}
          </Link>
        </div>

        <nav className="flex gap-1 overflow-x-auto rounded-full bg-white border border-line p-1 w-fit max-w-full">
          {TABS.map((t) => (
            <button key={t} type="button" onClick={() => setTab(t)}
              className={`whitespace-nowrap rounded-full px-4 py-2 text-sm font-medium ${tab === t ? 'bg-[#18181B] text-white' : 'text-muted hover:text-[#18181B]'}`}>
              {label[t]}
            </button>
          ))}
        </nav>

        {tab === 'bookings' && (
          <div className="space-y-6">
            {bookings === null && <p className="text-muted">{isAr ? 'عم نحمّل…' : 'Loading…'}</p>}
            {bookings?.length === 0 && (
              <div className="rounded-3xl border border-line bg-white p-10 text-center space-y-3">
                <p className="text-lg font-semibold">{isAr ? 'ما عندك حجوزات لسا' : 'No bookings yet'}</p>
                <Link href="/book" className="inline-block rounded-full bg-[#18181B] px-6 py-3 text-sm font-bold text-white">{isAr ? 'احجز أول خدمة' : 'Book your first service'}</Link>
              </div>
            )}
            {active.length > 0 && (
              <section className="space-y-3">
                <h2 className="text-sm font-bold uppercase tracking-wider text-muted">{isAr ? 'نشطة وقادمة' : 'Active & upcoming'}</h2>
                {active.map((b) => <BookingCard key={b.id} b={b} isAr={isAr} />)}
              </section>
            )}
            {past.length > 0 && (
              <section className="space-y-3">
                <h2 className="text-sm font-bold uppercase tracking-wider text-muted">{isAr ? 'السابقة' : 'History'}</h2>
                {past.map((b) => <BookingCard key={b.id} b={b} isAr={isAr} />)}
              </section>
            )}
          </div>
        )}

        {tab === 'messages' && (
          <SupportChat intro={isAr ? 'اكتبلنا أي سؤال قبل أو أثناء الخدمة.' : 'Ask us anything before or during a service.'} />
        )}

        {tab === 'notifications' && (
          <ul className="space-y-2">
            {notes === null && <li className="text-muted">{isAr ? 'عم نحمّل…' : 'Loading…'}</li>}
            {notes?.length === 0 && <li className="rounded-2xl bg-white border border-line p-6 text-center text-muted">{isAr ? 'ما في إشعارات' : 'No notifications'}</li>}
            {notes?.map((n) => (
              <li key={n.id}>
                <Link href={n.link || '/account'} className={`block rounded-2xl border bg-white p-4 text-sm hover:border-[#18181B]/30 ${n.read_at ? 'border-line' : 'border-gold'}`}>
                  <p className="text-[#18181B]">{noteText(n)}</p>
                  <p className="mt-1 text-xs text-muted">{serverDate(n.created_at).toLocaleString(isAr ? 'ar-SY' : 'en-GB')}</p>
                </Link>
              </li>
            ))}
          </ul>
        )}

        {tab === 'profile' && (
          <div className="grid gap-6 md:grid-cols-2">
            <section className="rounded-3xl bg-white border border-line p-6 space-y-4">
              <h2 className="text-lg font-bold">{isAr ? 'معلوماتي' : 'My details'}</h2>
              <div className="space-y-1.5">
                <label htmlFor="acc-name" className="text-sm font-semibold">{isAr ? 'الاسم' : 'Name'}</label>
                <input id="acc-name" value={name} onChange={(e) => { setName(e.target.value); setSaved(false); }}
                  className="h-11 w-full rounded-xl border border-line px-3 text-sm focus:outline-none focus:ring-2 focus:ring-gold" />
              </div>
              <p className="text-sm text-muted">{user.email ?? user.phone}</p>
              <button type="button" disabled={name.trim().length < 2}
                onClick={async () => { await accountApi.update({ full_name: name.trim() }); await refreshUser(); setSaved(true); }}
                className="rounded-full bg-[#18181B] px-5 py-2.5 text-sm font-bold text-white disabled:opacity-40">
                {saved ? (isAr ? '✓ انحفظ' : '✓ Saved') : (isAr ? 'حفظ' : 'Save')}
              </button>
            </section>

            <section className="rounded-3xl bg-white border border-line p-6 space-y-4">
              <h2 className="text-lg font-bold">{isAr ? 'عناويني' : 'My addresses'}</h2>
              <ul className="space-y-2">
                {addresses.map((a) => (
                  <li key={a.id} className="flex items-center justify-between gap-3 rounded-xl bg-mist/50 px-3 py-2 text-sm">
                    <span><b>{a.label}</b> · {a.district}، {a.line1}</span>
                    <button type="button" className="text-xs text-danger"
                      onClick={() => accountApi.deleteAddress(a.id).then(() => setAddresses((x) => x.filter((y) => y.id !== a.id)))}>
                      {isAr ? 'حذف' : 'Delete'}
                    </button>
                  </li>
                ))}
              </ul>
              <form className="grid gap-2" onSubmit={async (e) => {
                e.preventDefault();
                const a = await accountApi.addAddress({ ...newAddr, city: 'damascus' });
                setAddresses((x) => [...x, a]);
                setNewAddr({ label: '', district: '', line1: '' });
              }}>
                <input id="addr-label" required value={newAddr.label} onChange={(e) => setNewAddr({ ...newAddr, label: e.target.value })}
                  placeholder={isAr ? 'التسمية (البيت، الشغل)' : 'Label (Home, Work)'} className="h-10 rounded-xl border border-line px-3 text-sm" />
                <select id="addr-district" required value={newAddr.district} onChange={(e) => setNewAddr({ ...newAddr, district: e.target.value })}
                  className="h-10 rounded-xl border border-line bg-white px-3 text-sm">
                  <option value="">{isAr ? 'المنطقة' : 'District'}</option>
                  {DAMASCUS_DISTRICTS.map((d) => <option key={d.en} value={isAr ? d.ar : d.en}>{isAr ? d.ar : d.en}</option>)}
                </select>
                <input id="addr-line" required value={newAddr.line1} onChange={(e) => setNewAddr({ ...newAddr, line1: e.target.value })}
                  placeholder={isAr ? 'الشارع والبناء' : 'Street and building'} className="h-10 rounded-xl border border-line px-3 text-sm" />
                <button type="submit" className="rounded-full border border-line px-4 py-2 text-sm font-semibold hover:bg-mist">{isAr ? '+ إضافة عنوان' : '+ Add address'}</button>
              </form>
            </section>
          </div>
        )}
      </div>
    </div>
  );
}

export default function AccountPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-cream" />}>
      <AccountView />
    </Suspense>
  );
}
