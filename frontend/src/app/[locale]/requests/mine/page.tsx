'use client';

import React, { useEffect, useState } from 'react';
import { useLocale } from 'next-intl';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { Link } from '@/i18n/routing';
import { useAuth } from '@/lib/auth-context';
import { APIError } from '@/lib/api-client';
import { requestsApi, quotesApi, catalogApi, RequestItem, RequestStatus, CITY_LABELS, CitySlug } from '@/lib/api';

const STATUS_LABEL: Record<RequestStatus, { ar: string; en: string; variant: 'gold' | 'info' | 'success' | 'danger' | 'muted' }> = {
  draft: { ar: 'مسودة', en: 'Draft', variant: 'muted' },
  open: { ar: 'بانتظار العروض', en: 'Awaiting quotes', variant: 'info' },
  quotes_received: { ar: 'وصلت عروض', en: 'Quotes received', variant: 'gold' },
  tailor_selected: { ar: 'تم اختيار الخيّاط', en: 'Tailor selected', variant: 'success' },
  in_progress: { ar: 'قيد التنفيذ', en: 'In progress', variant: 'success' },
  completed: { ar: 'مكتمل', en: 'Completed', variant: 'success' },
  cancelled: { ar: 'ملغى', en: 'Cancelled', variant: 'danger' },
  expired: { ar: 'منتهي', en: 'Expired', variant: 'muted' },
};

export default function MyRequestsPage() {
  const locale = useLocale();
  const isAr = locale === 'ar';
  const { user, isLoading: authLoading } = useAuth();

  const [requests, setRequests] = useState<RequestItem[] | null>(null);
  const [currency, setCurrency] = useState('SAR');
  const [loadError, setLoadError] = useState('');
  const [busyId, setBusyId] = useState<string | null>(null);
  const [actionError, setActionError] = useState('');

  const load = () => {
    requestsApi
      .list()
      .then((page) => setRequests(page.items))
      .catch(() =>
        setLoadError(isAr ? 'تعذر تحميل طلباتك. حدّث الصفحة.' : 'Could not load your requests. Please refresh.')
      );
    catalogApi.meta().then((meta) => setCurrency(meta.currency)).catch(() => {});
  };

  useEffect(() => {
    if (user) load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user]);

  const handleAccept = async (quoteId: string) => {
    setBusyId(quoteId);
    setActionError('');
    try {
      await quotesApi.accept(quoteId);
      load();
    } catch (err) {
      setActionError(err instanceof APIError ? err.details.detail || err.message : (isAr ? 'فشل قبول العرض.' : 'Failed to accept the quote.'));
    } finally {
      setBusyId(null);
    }
  };

  const handleCancel = async (requestId: string) => {
    setBusyId(requestId);
    setActionError('');
    try {
      await requestsApi.cancel(requestId);
      load();
    } catch (err) {
      setActionError(err instanceof APIError ? err.details.detail || err.message : (isAr ? 'فشل إلغاء الطلب.' : 'Failed to cancel the request.'));
    } finally {
      setBusyId(null);
    }
  };

  if (authLoading) return null;

  if (!user) {
    return (
      <div className="max-w-xl mx-auto px-4 py-24 pt-32 text-center space-y-4">
        <h1 className="text-2xl font-bold text-ink">{isAr ? 'سجّل دخولك لعرض طلباتك' : 'Sign in to view your requests'}</h1>
        <Link href="/auth/login"><Button variant="primary">{isAr ? 'تسجيل الدخول' : 'Sign In'}</Button></Link>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto px-4 py-16 pt-28 space-y-8">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold text-ink">{isAr ? 'طلباتي' : 'My Requests'}</h1>
        <Link href="/requests"><Button variant="outline" size="sm">{isAr ? '+ طلب جديد' : '+ New request'}</Button></Link>
      </div>

      {loadError && <p className="text-danger text-sm">{loadError}</p>}
      {actionError && <p className="text-danger text-sm">{actionError}</p>}

      {requests === null && !loadError && (
        <p className="text-muted text-center py-12">{isAr ? 'جاري التحميل...' : 'Loading...'}</p>
      )}

      {requests && requests.length === 0 && (
        <Card className="p-10 text-center space-y-3">
          <p className="text-4xl">📋</p>
          <p className="font-semibold text-ink">{isAr ? 'لا توجد طلبات بعد' : 'No requests yet'}</p>
          <Link href="/requests"><Button variant="primary" size="sm">{isAr ? 'أرسل أول طلب تعديل' : 'Send your first request'}</Button></Link>
        </Card>
      )}

      <div className="space-y-6">
        {requests?.map((req) => {
          const status = STATUS_LABEL[req.status];
          return (
            <Card key={req.id} className="p-6 space-y-4">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <h2 className="font-bold text-ink text-lg">{req.title}</h2>
                  <p className="text-sm text-muted mt-1">
                    📍 {isAr ? CITY_LABELS[req.city as CitySlug]?.ar ?? req.city : CITY_LABELS[req.city as CitySlug]?.en ?? req.city}
                    {' • '}
                    {new Date(req.created_at).toLocaleDateString(isAr ? 'ar-SA' : 'en-US')}
                  </p>
                </div>
                <Badge variant={status.variant}>{isAr ? status.ar : status.en}</Badge>
              </div>

              <p className="text-sm text-charcoal">{req.description}</p>

              {(req.status === 'open' || req.status === 'quotes_received') && (
                <Button
                  variant="outline"
                  size="sm"
                  disabled={busyId === req.id}
                  onClick={() => handleCancel(req.id)}
                >
                  {busyId === req.id ? (isAr ? 'جاري الإلغاء...' : 'Cancelling...') : (isAr ? 'إلغاء الطلب' : 'Cancel request')}
                </Button>
              )}

              {req.quotes && req.quotes.length > 0 && (
                <div className="border-t border-line pt-4 space-y-3">
                  <p className="text-xs font-semibold text-charcoal">
                    {isAr ? `العروض المستلمة (${req.quotes.length})` : `Quotes received (${req.quotes.length})`}
                  </p>
                  {req.quotes.map((q) => (
                    <div key={q.id} className="p-4 rounded-lg border border-line flex items-center justify-between gap-4 flex-wrap">
                      <div>
                        <p className="font-semibold text-ink text-sm">{q.tailor.business_name}</p>
                        <p className="text-xs text-muted">
                          {q.price} {currency} • {isAr ? `${q.duration_days} يوم` : `${q.duration_days} days`}
                          {q.tailor.rating_count > 0 && ` • ★ ${q.tailor.rating_avg}`}
                        </p>
                        {q.message && <p className="text-xs text-charcoal mt-1">{q.message}</p>}
                      </div>
                      {q.status === 'pending' && req.status !== 'tailor_selected' && (
                        <Button
                          variant="primary"
                          size="sm"
                          disabled={busyId === q.id}
                          onClick={() => handleAccept(q.id)}
                        >
                          {busyId === q.id ? (isAr ? 'جاري القبول...' : 'Accepting...') : (isAr ? 'قبول العرض' : 'Accept quote')}
                        </Button>
                      )}
                      {q.status !== 'pending' && <Badge variant="muted">{q.status}</Badge>}
                    </div>
                  ))}
                </div>
              )}

              {req.status === 'open' && req.quote_count === 0 && (
                <p className="text-xs text-muted italic">
                  {isAr ? 'لم يصل أي عرض بعد. عادة ما تصل أول العروض خلال ساعات.' : 'No quotes yet. Tailors usually respond within a few hours.'}
                </p>
              )}
            </Card>
          );
        })}
      </div>
    </div>
  );
}
