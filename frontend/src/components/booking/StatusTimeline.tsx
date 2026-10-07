'use client';

import React from 'react';
import { serverDate, type Booking } from '@/lib/api';
import { statusLabel } from './catalog';

const fmt = (iso: string, isAr: boolean) =>
  serverDate(iso).toLocaleString(isAr ? 'ar-SY' : 'en-GB', {
    day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit',
  });

export const StatusTimeline: React.FC<{ booking: Booking; isAr: boolean }> = ({ booking, isAr }) => {
  const cancelled = booking.status === 'cancelled';
  const steps = booking.pipeline;
  const currentIdx = steps.findIndex((s) => s.current);

  return (
    <ol className="relative space-y-0">
      {steps.map((step, idx) => {
        const done = !!step.reached_at && !step.current;
        const current = step.current && !cancelled;
        const last = idx === steps.length - 1;
        const finishedAll = booking.status === 'completed';
        return (
          <li key={step.status} className="relative flex gap-4 pb-6 last:pb-0">
            {!last && (
              <span
                className={`absolute top-8 bottom-0 start-[15px] w-0.5 ${
                  idx < currentIdx || finishedAll ? 'bg-gold' : 'bg-line'
                }`}
                aria-hidden="true"
              />
            )}
            <span
              className={`relative z-10 mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-sm font-bold ${
                done || (current && finishedAll)
                  ? 'bg-gold text-[#18181B]'
                  : current
                  ? 'bg-[#18181B] text-white ring-4 ring-gold/30'
                  : 'border border-line bg-white text-muted'
              }`}
            >
              {done || (current && finishedAll) ? '✓' : idx + 1}
              {current && !finishedAll && (
                <span className="absolute inset-0 rounded-full ring-2 ring-gold animate-ping opacity-40" />
              )}
            </span>
            <div className="min-w-0 pt-1">
              <p className={`text-sm font-semibold ${step.reached_at ? 'text-[#18181B]' : 'text-muted'}`}>
                {statusLabel(step.status, booking.service_type, isAr)}
              </p>
              {step.reached_at && <p className="text-xs text-muted mt-0.5">{fmt(step.reached_at, isAr)}</p>}
            </div>
          </li>
        );
      })}
      {cancelled && (
        <li className="flex gap-4 pt-2">
          <span className="flex h-8 w-8 items-center justify-center rounded-full bg-danger/15 text-danger font-bold">✕</span>
          <p className="pt-1 text-sm font-semibold text-danger">
            {statusLabel('cancelled', booking.service_type, isAr)}
            {booking.cancel_reason ? ` · ${booking.cancel_reason}` : ''}
          </p>
        </li>
      )}
    </ol>
  );
};
