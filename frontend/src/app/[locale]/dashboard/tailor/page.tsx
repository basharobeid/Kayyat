'use client';

import React, { useState } from 'react';
import { useLocale } from 'next-intl';
import { TailorRFQDrawer } from '@/components/sojo/TailorRFQDrawer';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';

export default function TailorDashboardPage() {
  const locale = useLocale();
  const isAr = locale === 'ar';
  const [activeTab, setActiveTab] = useState<'rfqs' | 'active' | 'earnings'>('rfqs');

  return (
    <div className="py-8 md:py-14 px-4 max-w-6xl mx-auto space-y-10 pt-28">
      
      {/* Atelier Partner Header */}
      <div className="relative rounded-3xl overflow-hidden bg-[#12141A] text-white p-8 md:p-10 border border-white/10 shadow-2xl">
        <div className="absolute inset-0 bg-gradient-to-r from-black/90 via-black/75 to-transparent z-10" />
        <img
          src="/AEfoZzbxbn68WvwFvvXQInhOs.jpeg"
          alt="Tailor Craft"
          className="absolute inset-0 w-full h-full object-cover opacity-30"
        />

        <div className="relative z-20 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <span className="px-3 py-1 rounded-full bg-emerald-500/20 text-emerald-300 text-xs font-semibold border border-emerald-500/30">
                ✓ {isAr ? 'شريك مشغل معتمد' : 'Vetted Partner Atelier'}
              </span>
              <span className="text-xs text-zinc-400">
                {isAr ? 'مشغل الخيّاط الذهبي • الرياض' : 'Golden Stitch Atelier • Riyadh'}
              </span>
            </div>

            <h1 className="text-2xl sm:text-4xl font-extrabold tracking-tight">
              {isAr ? 'بوابة شركاء الحرفية والمشاغل' : 'Partner Atelier Command Center'}
            </h1>

            <p className="text-xs sm:text-sm text-zinc-300 max-w-xl font-light">
              {isAr
                ? 'استقبل طلبات التعديل والتفصيل من عملاء منطقتك، قدّم عروض أسعار فورية، ووسّع قاعدة عملائك مع حلول الدفع والشحن اللوجستي المتكاملة.'
                : 'Receive alteration & bespoke tailoring orders in your neighborhood, submit real-time quotes, and scale your atelier revenue.'}
            </p>
          </div>

          {/* Quick Metrics Badge */}
          <div className="bg-white/10 backdrop-blur-md rounded-2xl p-4 border border-white/15 flex flex-col gap-2 min-w-[200px]">
            <div className="flex justify-between items-center text-xs text-zinc-300">
              <span>{isAr ? 'التقييم العام:' : 'Atelier Rating:'}</span>
              <span className="font-bold text-amber-300">⭐ 4.95 / 5.0</span>
            </div>
            <div className="flex justify-between items-center text-xs text-zinc-300">
              <span>{isAr ? 'أرباح الشهر:' : 'This Month:'}</span>
              <span className="font-bold text-white">4,820 SAR</span>
            </div>
            <div className="flex justify-between items-center text-xs text-zinc-300">
              <span>{isAr ? 'نسبة الالتزام:' : 'On-time Rate:'}</span>
              <span className="font-bold text-emerald-400">99.4%</span>
            </div>
          </div>
        </div>
      </div>

      {/* Tabs Navigation */}
      <div className="flex items-center gap-2 border-b border-line pb-3">
        <button
          type="button"
          onClick={() => setActiveTab('rfqs')}
          className={`px-5 py-2.5 rounded-full text-xs font-bold transition-all ${
            activeTab === 'rfqs'
              ? 'bg-black text-white shadow-sm'
              : 'text-muted hover:text-ink hover:bg-mist/60'
          }`}
        >
          ⚡ {isAr ? 'عروض الأسعار المباشرة (Live RFQs)' : 'Live RFQ Feed'}
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('active')}
          className={`px-5 py-2.5 rounded-full text-xs font-bold transition-all ${
            activeTab === 'active'
              ? 'bg-black text-white shadow-sm'
              : 'text-muted hover:text-ink hover:bg-mist/60'
          }`}
        >
          ✂️ {isAr ? 'القطع قيد التعديل (2)' : 'Garments In Progress (2)'}
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('earnings')}
          className={`px-5 py-2.5 rounded-full text-xs font-bold transition-all ${
            activeTab === 'earnings'
              ? 'bg-black text-white shadow-sm'
              : 'text-muted hover:text-ink hover:bg-mist/60'
          }`}
        >
          💳 {isAr ? 'المستحقات والتحويل البنكي' : 'Payouts & Banking'}
        </button>
      </div>

      {/* Tab Content */}
      {activeTab === 'rfqs' && (
        <div>
          <TailorRFQDrawer />
        </div>
      )}

      {activeTab === 'active' && (
        <div className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Card className="p-6 rounded-3xl border border-line shadow-sm space-y-4">
              <div className="flex justify-between items-start">
                <div>
                  <span className="text-xs font-bold text-amber-700 bg-amber-100 px-2.5 py-0.5 rounded-full border border-amber-200">
                    {isAr ? 'قيد العمل بالمشغل' : 'On Workstation'}
                  </span>
                  <h3 className="text-base font-bold text-ink mt-2">
                    {isAr ? 'تقصير بنطال جينز (ORD-2026-8841)' : 'Denim Hem Shorten (ORD-2026-8841)'}
                  </h3>
                  <p className="text-xs text-muted mt-0.5">العميل: سارة العبدالله • حي النرجس</p>
                </div>
                <span className="text-sm font-bold text-ink">45 SAR</span>
              </div>
              <div className="p-3 bg-mist/60 rounded-xl text-xs text-charcoal">
                📌 ملاحظة العميل: الحفاظ على الخياطة الأصلية للحاشية (Original Euro Hem).
              </div>
              <div className="flex gap-2 pt-2">
                <Button variant="primary" size="sm" fullWidth className="rounded-full bg-black text-white text-xs">
                  ✓ {isAr ? 'تمت الخياطة وتجهيز القطعة' : 'Mark as Ready for QC'}
                </Button>
              </div>
            </Card>

            <Card className="p-6 rounded-3xl border border-line shadow-sm space-y-4">
              <div className="flex justify-between items-start">
                <div>
                  <span className="text-xs font-bold text-blue-700 bg-blue-100 px-2.5 py-0.5 rounded-full border border-blue-200">
                    {isAr ? 'بانتظار استلام المندوب' : 'Awaiting Courier'}
                  </span>
                  <h3 className="text-base font-bold text-ink mt-2">
                    {isAr ? 'تعديل ياقة ثوب رجالي (ORD-2026-9104)' : 'Thobe Collar Adjustment (ORD-2026-9104)'}
                  </h3>
                  <p className="text-xs text-muted mt-0.5">العميل: فيصل الشمري • حي الملقا</p>
                </div>
                <span className="text-sm font-bold text-ink">60 SAR</span>
              </div>
              <div className="p-3 bg-mist/60 rounded-xl text-xs text-charcoal">
                🚚 تم إسناد المهمة للكابتن يوسف العتيبي.
              </div>
              <div className="flex gap-2 pt-2">
                <Button variant="outline" size="sm" fullWidth className="rounded-full text-xs">
                  {isAr ? 'طباعة باركود القطعة' : 'Print Garment Barcode'}
                </Button>
              </div>
            </Card>
          </div>
        </div>
      )}

      {activeTab === 'earnings' && (
        <Card className="p-8 rounded-3xl border border-line shadow-sm space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-line">
            <div>
              <span className="text-xs text-muted">{isAr ? 'الرصيد المتاح للتحويل الفوري:' : 'Available Balance:'}</span>
              <p className="text-3xl font-extrabold text-ink mt-1">4,820.00 SAR</p>
            </div>
            <Button
              variant="primary"
              size="md"
              className="rounded-full bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs"
              onClick={() => alert(isAr ? 'تم جدولة التحويل للحساب البنكي المسجل بنجاح!' : 'Payout scheduled successfully!')}
            >
              💸 {isAr ? 'طلب تحويل فوري للحساب البنكي (IBAN)' : 'Request Instant IBAN Payout'}
            </Button>
          </div>

          <div className="space-y-3">
            <h4 className="text-xs font-bold text-charcoal uppercase tracking-wider">
              {isAr ? 'سجل العمليات والتحويلات الأخيرة' : 'Recent Transactions'}
            </h4>
            <div className="divide-y divide-line/70 text-xs">
              <div className="py-3 flex justify-between items-center">
                <div>
                  <p className="font-bold text-ink">{isAr ? 'طلب ORD-2026-8841 (تقصير جينز)' : 'ORD-2026-8841'}</p>
                  <p className="text-muted text-[0.7rem]">27 سبتمبر 2026</p>
                </div>
                <span className="font-bold text-emerald-600">+45.00 SAR</span>
              </div>
              <div className="py-3 flex justify-between items-center">
                <div>
                  <p className="font-bold text-ink">{isAr ? 'تحويل أسبوعي إلى بنك الراجحي (IBAN SA44...)' : 'Bank Transfer'}</p>
                  <p className="text-muted text-[0.7rem]">20 سبتمبر 2026</p>
                </div>
                <span className="font-bold text-ink">-3,200.00 SAR</span>
              </div>
            </div>
          </div>
        </Card>
      )}

    </div>
  );
}
