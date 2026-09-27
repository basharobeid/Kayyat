'use client';

import React, { useState } from 'react';
import { Card } from '../ui/Card';
import { Badge } from '../ui/Badge';
import { Button } from '../ui/Button';
import { Input } from '../ui/Input';

interface RFQItem {
  id: string;
  customerName: string;
  garmentType: string;
  serviceRequested: string;
  photoUrl?: string;
  pinningGuideNotes: string;
  distanceKm: number;
  city: string;
  fulfillmentType: 'delivery' | 'dropoff';
  createdAt: string;
}

const DEMO_RFQS: RFQItem[] = [
  {
    id: 'RFQ-101',
    customerName: 'سارة العتيبي',
    garmentType: '👖 بنطال جينز',
    serviceRequested: 'تقصير الحاشية وتضييق الساقين (Hemming & Tapering)',
    pinningGuideNotes: 'تم تثبيت دبوس عند الطول المطلوب، يرجى المحافظة على خياطة الجينز الأصلية.',
    distanceKm: 3.2,
    city: 'الرياض - حي النرجس',
    fulfillmentType: 'delivery',
    createdAt: 'منذ 15 دقيقة',
  },
  {
    id: 'RFQ-102',
    customerName: 'فيصل الشمري',
    garmentType: '🥻 ثوب شتوي',
    serviceRequested: 'تقصير الأكمام 2 سم وتضييق الياقة',
    pinningGuideNotes: 'تعديل بسيط ليتناسب مع الكبك الرسمي.',
    distanceKm: 4.8,
    city: 'الرياض - حي الملقا',
    fulfillmentType: 'dropoff',
    createdAt: 'منذ 40 دقيقة',
  },
];

export const TailorRFQDrawer: React.FC = () => {
  const [selectedRfq, setSelectedRfq] = useState<RFQItem | null>(null);
  const [bidPrice, setBidPrice] = useState('');
  const [turnaroundDays, setTurnaroundDays] = useState('2');
  const [submittedBids, setSubmittedBids] = useState<string[]>([]);

  const handleSendQuote = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedRfq) return;

    setSubmittedBids((prev) => [...prev, selectedRfq.id]);
    setSelectedRfq(null);
    setBidPrice('');
  };

  return (
    <div className="space-y-6 max-w-4xl mx-auto p-4">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-line pb-4">
        <div>
          <h2 className="text-h2 font-bold text-ink">لوحة طلبات العملاء المباشرة (RFQ Feed)</h2>
          <p className="text-body-m text-muted">
            طلبات تعديل وصيانة واردة من عملاء بالقرب من مشغلك (نطاق 10 كم)
          </p>
        </div>
        <Badge variant="success">متصل الآن • تحديث فوري</Badge>
      </div>

      {/* RFQ List */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {DEMO_RFQS.map((rfq) => {
          const isSubmitted = submittedBids.includes(rfq.id);

          return (
            <Card key={rfq.id} hoverable className="space-y-3 flex flex-col justify-between">
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-ink text-body-l">{rfq.garmentType}</span>
                  <Badge variant="info">📍 {rfq.distanceKm} كم</Badge>
                </div>

                <p className="font-medium text-gold-ink text-body-m">{rfq.serviceRequested}</p>
                <p className="text-body-s text-charcoal/80 bg-mist p-2.5 rounded-md">
                  💬 &ldquo;{rfq.pinningGuideNotes}&rdquo;
                </p>

                <div className="flex items-center justify-between text-caption text-muted pt-1">
                  <span>العميل: {rfq.customerName} ({rfq.city})</span>
                  <span>{rfq.createdAt}</span>
                </div>
              </div>

              <div className="pt-3 border-t border-line">
                {isSubmitted ? (
                  <Button variant="outline" size="sm" fullWidth disabled>
                    ✓ تم إرسال عرض سعرك
                  </Button>
                ) : (
                  <Button
                    variant="primary"
                    size="sm"
                    fullWidth
                    onClick={() => setSelectedRfq(rfq)}
                  >
                    تقديم عرض سعر فوري (Quick Quote)
                  </Button>
                )}
              </div>
            </Card>
          );
        })}
      </div>

      {/* Quick Bid Modal / Drawer */}
      {selectedRfq && (
        <div className="fixed inset-0 bg-charcoal/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <Card className="max-w-md w-full p-6 space-y-5 bg-surface shadow-xl">
            <div className="flex items-center justify-between border-b border-line pb-3">
              <h3 className="text-h3 font-bold text-ink">تقديم عرض سعر فوري</h3>
              <button
                onClick={() => setSelectedRfq(null)}
                className="text-muted hover:text-charcoal font-bold text-xl"
              >
                ✕
              </button>
            </div>

            <div className="space-y-1 text-body-s">
              <p className="font-semibold text-ink">{selectedRfq.garmentType}</p>
              <p className="text-muted">{selectedRfq.serviceRequested}</p>
              <p className="text-caption text-olive">العميل: {selectedRfq.customerName} • {selectedRfq.city}</p>
            </div>

            <form onSubmit={handleSendQuote} className="space-y-4">
              <Input
                label="السعر المقترح (ريال سعودي)"
                placeholder="مثال: 35"
                type="number"
                value={bidPrice}
                onChange={(e) => setBidPrice(e.target.value)}
                required
              />

              <div className="space-y-1.5">
                <label className="block text-body-s font-semibold text-charcoal">
                  مدة التنفيذ المتوقعة
                </label>
                <select
                  value={turnaroundDays}
                  onChange={(e) => setTurnaroundDays(e.target.value)}
                  className="w-full h-11 px-3 bg-surface border border-line rounded-md text-body-m focus:outline-none focus:ring-2 focus:ring-gold"
                >
                  <option value="1">خلال 24 ساعة (عاجل)</option>
                  <option value="2">خلال يومين (48 ساعة)</option>
                  <option value="3">خلال 3 إلى 4 أيام</option>
                  <option value="5">خلال 5 إلى 7 أيام</option>
                </select>
              </div>

              <div className="flex gap-3 pt-2">
                <Button
                  type="button"
                  variant="outline"
                  size="md"
                  className="flex-1"
                  onClick={() => setSelectedRfq(null)}
                >
                  إلغاء
                </Button>
                <Button type="submit" variant="primary" size="md" className="flex-1">
                  إرسال العرض للعميل 🚀
                </Button>
              </div>
            </form>
          </Card>
        </div>
      )}
    </div>
  );
};
