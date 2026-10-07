'use client';

import React, { useCallback, useEffect, useRef, useState } from 'react';
import { useLocale } from 'next-intl';
import { catalogApi, serverDate, supportApi, SupportMessage } from '@/lib/api';
import { APIError } from '@/lib/api-client';

interface Props {
  bookingId?: string;
  intro?: string;
  className?: string;
}

// The customer's single support thread. Polls so staff replies appear without a reload.
export const SupportChat: React.FC<Props> = ({ bookingId, intro, className = '' }) => {
  const isAr = useLocale() === 'ar';
  const [messages, setMessages] = useState<SupportMessage[] | null>(null);
  const [text, setText] = useState('');
  const [sending, setSending] = useState(false);
  const [error, setError] = useState('');
  const endRef = useRef<HTMLDivElement>(null);

  const load = useCallback(() => {
    supportApi.messages().then(setMessages).catch(() => setMessages((m) => m ?? []));
  }, []);

  useEffect(() => {
    load();
    const t = setInterval(load, 10000);
    return () => clearInterval(t);
  }, [load]);

  useEffect(() => {
    endRef.current?.scrollIntoView({ block: 'nearest' });
  }, [messages?.length]);

  const send = async (body: string, photoUrl?: string) => {
    if (!body.trim()) return;
    setSending(true);
    setError('');
    try {
      const msg = await supportApi.send(body.trim(), bookingId, photoUrl);
      setMessages((m) => [...(m ?? []), msg]);
      setText('');
    } catch (err) {
      setError(err instanceof APIError ? err.details.detail : (isAr ? 'ما انبعتت الرسالة' : 'Message not sent'));
    } finally {
      setSending(false);
    }
  };

  const onPhoto = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file) return;
    setSending(true);
    try {
      const { url } = await catalogApi.uploadImage(file);
      await send(text.trim() || (isAr ? 'صورة' : 'Photo'), url);
    } catch {
      setError(isAr ? 'ما انرفعت الصورة' : 'Photo upload failed');
      setSending(false);
    }
  };

  const time = (iso: string) =>
    serverDate(iso).toLocaleTimeString(isAr ? 'ar-SY' : 'en-GB', {
      hour: '2-digit', minute: '2-digit',
    });

  return (
    <div className={`flex flex-col rounded-2xl border border-line bg-white overflow-hidden ${className}`}>
      <div className="px-4 py-3 border-b border-line flex items-center gap-2">
        <span className="h-2 w-2 rounded-full bg-success" />
        <p className="text-sm font-semibold text-[#18181B]">{isAr ? 'فريق خيّاط' : 'Khayyat team'}</p>
      </div>
      <div className="flex-1 min-h-[220px] max-h-[380px] overflow-y-auto p-4 space-y-3 bg-cream/50">
        {intro && (messages?.length ?? 0) === 0 && (
          <p className="text-xs text-muted text-center py-6">{intro}</p>
        )}
        {messages?.map((m) => (
          <div key={m.id} className={`flex ${m.from_staff ? 'justify-start' : 'justify-end'}`}>
            <div
              className={`max-w-[80%] rounded-2xl px-3.5 py-2 text-sm ${
                m.from_staff ? 'bg-white border border-line text-[#18181B]' : 'bg-[#18181B] text-white'
              }`}
            >
              {m.photo_url && (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={m.photo_url} alt="" className="mb-1.5 max-h-48 rounded-lg" />
              )}
              <p className="whitespace-pre-wrap break-words">{m.body}</p>
              <p className={`mt-1 text-[10px] ${m.from_staff ? 'text-muted' : 'text-white/60'}`}>{time(m.created_at)}</p>
            </div>
          </div>
        ))}
        <div ref={endRef} />
      </div>
      {error && <p className="px-4 pt-2 text-xs text-danger">{error}</p>}
      <form
        className="flex items-center gap-2 p-3 border-t border-line"
        onSubmit={(e) => { e.preventDefault(); send(text); }}
      >
        <label className="cursor-pointer rounded-full p-2 text-lg hover:bg-mist" title={isAr ? 'أرسل صورة' : 'Send a photo'}>
          📷
          <input type="file" accept="image/*" className="hidden" onChange={onPhoto} disabled={sending} />
        </label>
        <input
          id={`chat-input-${bookingId ?? 'general'}`}
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder={isAr ? 'اكتب رسالتك…' : 'Write a message…'}
          className="flex-1 h-10 rounded-full border border-line bg-cream/60 px-4 text-sm focus:outline-none focus:ring-2 focus:ring-gold"
        />
        <button
          type="submit"
          disabled={sending || !text.trim()}
          className="h-10 rounded-full bg-[#18181B] px-4 text-sm font-semibold text-white disabled:opacity-40"
        >
          {isAr ? 'إرسال' : 'Send'}
        </button>
      </form>
    </div>
  );
};
