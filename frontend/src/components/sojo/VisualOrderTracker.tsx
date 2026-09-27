'use client';

import React from 'react';
import { Card } from '../ui/Card';
import { Badge } from '../ui/Badge';
import { Button } from '../ui/Button';

export type TimelineMilestone =
  | 'placed'
  | 'tailor_selected'
  | 'picked_up'
  | 'in_progress'
  | 'ready'
  | 'out_for_delivery'
  | 'completed';

interface VisualOrderTrackerProps {
  orderId?: string;
  garmentName?: string;
  tailorName?: string;
  currentMilestone?: TimelineMilestone;
}

const MILESTONES = [
  { id: 'placed', labelAr: 'تم تقديم الطلب', labelEn: 'Request Placed', icon: '📝' },
  { id: 'tailor_selected', labelAr: 'اختيار الخيّاط وقبول العرض', labelEn: 'Quote Accepted', icon: '🤝' },
  { id: 'picked_up', labelAr: 'تم استلام القطعة', labelEn: 'Item Picked Up', icon: '📦' },
  { id: 'in_progress', labelAr: 'قيد الخياطة بالمشغل', labelEn: 'At Workshop / In Progress', icon: '✂️' },
  { id: 'ready', labelAr: 'فحص الجودة والجهوزية', labelEn: 'Quality Check & Ready', icon: '✨' },
  { id: 'out_for_delivery', labelAr: 'جاري التوصيل للباب', labelEn: 'Out for Delivery', icon: '🚚' },
  { id: 'completed', labelAr: 'مكتمل ومسلَّم', labelEn: 'Completed & Reviewed', icon: '🎉' },
];

export const VisualOrderTracker: React.FC<VisualOrderTrackerProps> = ({
  orderId = 'ORD-2026-8841',
  garmentName = 'تعديل وتقصير بنطال جينز (تضييق ساقين + حاشية)',
  tailorName = 'مشغل الخيّاط الذهبي (أحمد محمود)',
  currentMilestone = 'in_progress',
}) => {
  const currentIndex = MILESTONES.findIndex((m) => m.id === currentMilestone);

  return (
    <Card className="max-w-2xl mx-auto p-6 md:p-8 space-y-6 shadow-md border-line">
      {/* Header Info */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 border-b border-line gap-2">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-h3 font-bold text-ink">متابعة حالة الطلب</span>
            <Badge variant="gold">مباشر</Badge>
          </div>
          <p className="text-caption text-muted mt-0.5">رقم الطلب: {orderId}</p>
        </div>
        <div className="text-start sm:text-end">
          <p className="text-body-s font-semibold text-ink">{tailorName}</p>
          <p className="text-caption text-olive">موعد التسليم المتوقع: خلال 48 ساعة</p>
        </div>
      </div>

      {/* Garment Summary with Photo */}
      <div className="p-4 bg-mist/70 rounded-2xl flex items-center gap-4 border border-line/60">
        <div className="w-16 h-16 rounded-xl overflow-hidden bg-white flex-shrink-0 shadow-xs border border-line">
          <img
            src="/KHAYAT.png"
            alt={garmentName}
            className="w-full h-full object-cover"
          />
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-body-m font-bold text-ink truncate">{garmentName}</p>
          <p className="text-caption text-muted mt-0.5">نوع الخدمة: تعديل دقيق حسب دبابيس العميل (Sojo Standard) • خياطة مخفية</p>
        </div>
      </div>

      {/* Timeline Steps */}
      <div className="py-4 space-y-6">
        {MILESTONES.map((step, idx) => {
          const isPassed = idx < currentIndex;
          const isCurrent = idx === currentIndex;

          return (
            <div key={step.id} className="relative flex items-start gap-4">
              {/* Vertical connector line */}
              {idx < MILESTONES.length - 1 && (
                <div
                  className={`absolute top-8 right-4 w-0.5 h-10 -mr-[1px] transition-colors ${
                    idx < currentIndex ? 'bg-gold' : 'bg-line'
                  }`}
                />
              )}

              {/* Status Circle */}
              <div
                className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold transition-all z-10 ${
                  isPassed
                    ? 'bg-success text-surface shadow-xs'
                    : isCurrent
                    ? 'bg-gold text-ink ring-4 ring-gold/25 shadow-sm'
                    : 'bg-surface border border-line text-muted'
                }`}
              >
                {isPassed ? '✓' : step.icon}
              </div>

              {/* Step info */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between">
                  <p
                    className={`text-body-m font-semibold ${
                      isCurrent
                        ? 'text-gold-ink font-bold'
                        : isPassed
                        ? 'text-ink'
                        : 'text-muted'
                    }`}
                  >
                    {step.labelAr}
                  </p>
                  {isCurrent && (
                    <Badge variant="warning">المرحلة الحالية</Badge>
                  )}
                </div>
                <p className="text-caption text-muted">{step.labelEn}</p>
              </div>
            </div>
          );
        })}
      </div>

      {/* Action Footer */}
      <div className="pt-4 border-t border-line flex flex-col sm:flex-row gap-3">
        <Button variant="outline" size="sm" className="flex-1">
          💬 محادثة الخيّاط مباشرة
        </Button>
        <Button variant="secondary" size="sm" className="flex-1">
          📍 تفاصيل موقع الاستلام والتوصيل
        </Button>
      </div>
    </Card>
  );
};
