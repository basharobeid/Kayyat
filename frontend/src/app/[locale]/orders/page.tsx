'use client';

import React, { useState } from 'react';
import { useLocale } from 'next-intl';
import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { Link } from '@/i18n/routing';
import { TimelineMilestone } from '@/components/sojo/VisualOrderTracker';

interface MockOrder {
  id: string;
  garmentNameAr: string;
  garmentNameEn: string;
  tailorNameAr: string;
  tailorNameEn: string;
  tailorPhone: string;
  courierNameAr: string;
  courierNameEn: string;
  milestone: TimelineMilestone;
  estimatedDeliveryAr: string;
  estimatedDeliveryEn: string;
  price: string;
  image: string;
  notesAr: string;
  notesEn: string;
}

const MOCK_ORDERS: MockOrder[] = [
  {
    id: 'ORD-2026-8841',
    garmentNameAr: 'تعديل وتقصير بنطال جينز (تضييق ساقين + حاشية مخفية)',
    garmentNameEn: 'Shorten & Taper Denim Jeans (Hemming & Inseam)',
    tailorNameAr: 'مشغل الخيّاط الذهبي (أحمد محمود)',
    tailorNameEn: 'Golden Stitch Atelier (Ahmad Mahmoud)',
    tailorPhone: '+966 50 123 4567',
    courierNameAr: 'يوسف العتيبي (كابتن خيّاط)',
    courierNameEn: 'Yousef Al-Otaibi (Khayyat Courier)',
    milestone: 'in_progress',
    estimatedDeliveryAr: 'غداً، بين 4:00 و 8:00 مساءً',
    estimatedDeliveryEn: 'Tomorrow, between 4:00 & 8:00 PM',
    price: '65 SAR',
    image: '/KHAYAT.png',
    notesAr: 'تم تثبيت دبابيس القياس على بعد 2 سم من الحاشية السفلية.',
    notesEn: 'Measurement pins placed 2cm from bottom hem.'
  },
  {
    id: 'ORD-2026-9104',
    garmentNameAr: 'تعديل وتضييق ثوب رجالي رسمي (ياقة وأكمام)',
    garmentNameEn: 'Bespoke Thobe Adjustment (Collar & Cuffs)',
    tailorNameAr: 'دار الإبرة الأنيقة (خالد السعيد)',
    tailorNameEn: 'Elegant Needle Atelier (Khaled Al-Saeed)',
    tailorPhone: '+966 55 987 6543',
    courierNameAr: 'سعد القحطاني',
    courierNameEn: 'Saad Al-Qahtani',
    milestone: 'out_for_delivery',
    estimatedDeliveryAr: 'اليوم خلال ساعتين (السائق في الطريق إليك)',
    estimatedDeliveryEn: 'Today within 2 hours (Driver en route)',
    price: '85 SAR',
    image: '/AEfoZzbxbn68WvwFvvXQInhOs.jpeg',
    notesAr: 'تم استبدال الياقة القلاب وحياكة خياطة مخفية مطابقة للقماش الأصلي.',
    notesEn: 'Collar replaced and hand-finished blind hem tailored.'
  },
  {
    id: 'ORD-2026-7520',
    garmentNameAr: 'تضييق خصر فستان سهرة كريب حرير',
    garmentNameEn: 'Silk Crepe Evening Gown Waist Alteration',
    tailorNameAr: 'أتيليه فيري للفساتين الراقية',
    tailorNameEn: 'Fairy Haute Couture Atelier',
    tailorPhone: '+966 54 333 2211',
    courierNameAr: 'يوسف العتيبي',
    courierNameEn: 'Yousef Al-Otaibi',
    milestone: 'completed',
    estimatedDeliveryAr: 'تم التسليم بنجاح (تم تقييم المشغل 5 نجوم)',
    estimatedDeliveryEn: 'Delivered & Completed (5-star rated)',
    price: '110 SAR',
    image: '/4ELzdJRzQ5VXQAPbmICpr3joms.png',
    notesAr: 'تم ضبط السحاب المخفي وتضييق الخصر 3 سم.',
    notesEn: 'Invisible zip adjusted and waist taken in by 3cm.'
  }
];

const MILESTONES: { id: TimelineMilestone; labelAr: string; labelEn: string; icon: string; descAr: string; descEn: string }[] = [
  { id: 'placed', labelAr: 'تم تقديم الطلب', labelEn: 'Request Placed', icon: '📝', descAr: 'تم تسجيل تفاصيل التعديل وطلب المندوب', descEn: 'Alteration details recorded' },
  { id: 'tailor_selected', labelAr: 'اختيار الخيّاط وقبول العرض', labelEn: 'Quote Accepted', icon: '🤝', descAr: 'المشغل المعتمد قبل المواصفات', descEn: 'Vetted atelier confirmed specs' },
  { id: 'picked_up', labelAr: 'تم استلام القطعة', labelEn: 'Item Picked Up', icon: '📦', descAr: 'استلم المندوب القطعة بكيس خيّاط المأمّن', descEn: 'Courier collected in Khayyat sealed bag' },
  { id: 'in_progress', labelAr: 'قيد الخياطة والتعديل', labelEn: 'At Workshop / In Progress', icon: '✂️', descAr: 'المشغل يباشر العمل الدقيق حسب الدبابيس', descEn: 'Master tailor working on exact pins' },
  { id: 'ready', labelAr: 'فحص الجودة والكي بالبخار', labelEn: 'Quality Check & Steam', icon: '✨', descAr: 'اجتياز معايير الجودة والكي الفاخر', descEn: 'Passed 100% fit QC & luxury pressing' },
  { id: 'out_for_delivery', labelAr: 'جاري التوصيل لباب بيتك', labelEn: 'Out for Delivery', icon: '🚚', descAr: 'المندوب في طريقه لعنوانك المسجل', descEn: 'Courier on the way to your door' },
  { id: 'completed', labelAr: 'تم التسليم بنجاح', labelEn: 'Delivered & Completed', icon: '🎉', descAr: 'جاهز لارتدائه مع ضمان المقاس 100%', descEn: 'Ready to wear with 100% Fit Guarantee' },
];

export default function OrdersPage() {
  const locale = useLocale();
  const isAr = locale === 'ar';

  const [selectedOrderId, setSelectedOrderId] = useState<string>(MOCK_ORDERS[0].id);
  const selectedOrder = MOCK_ORDERS.find((o) => o.id === selectedOrderId) || MOCK_ORDERS[0];

  // Interactive milestone state for live simulation
  const [currentMilestone, setCurrentMilestone] = useState<TimelineMilestone>(selectedOrder.milestone);

  const handleSelectOrder = (order: MockOrder) => {
    setSelectedOrderId(order.id);
    setCurrentMilestone(order.milestone);
  };

  const currentIndex = MILESTONES.findIndex((m) => m.id === currentMilestone);

  return (
    <div className="py-8 md:py-14 px-4 max-w-5xl mx-auto space-y-10 pt-28">
      
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-zinc-900 text-white text-xs font-semibold mb-2">
            <span>⚡ {isAr ? 'تتبع لحظي للطلبات' : 'Real-time Order Tracker'}</span>
          </div>
          <h1 className="text-2xl sm:text-4xl font-extrabold text-ink tracking-tight">
            {isAr ? 'متابعة وتفاصيل طلباتي' : 'Track Your Alteration Orders'}
          </h1>
          <p className="text-sm text-muted mt-1">
            {isAr
              ? 'تتبع مسار ملابسك من الاستلام حتى الخياطة والتوصيل لباب بيتك'
              : 'Monitor your garments from courier pickup through atelier tailoring to delivery'}
          </p>
        </div>

        <Link href="/book">
          <Button variant="primary" size="md" className="rounded-full bg-black hover:bg-zinc-800 text-white font-bold text-xs">
            + {isAr ? 'طلب تعديل جديد' : 'New Alteration Order'}
          </Button>
        </Link>
      </div>

      {/* Orders Switcher Tabs */}
      <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-none">
        {MOCK_ORDERS.map((order) => {
          const isSelected = order.id === selectedOrderId;
          return (
            <button
              key={order.id}
              onClick={() => handleSelectOrder(order)}
              className={`flex-shrink-0 text-start p-4 rounded-2xl border transition-all ${
                isSelected
                  ? 'border-black bg-zinc-950 text-white shadow-md ring-2 ring-black/20'
                  : 'border-line bg-white hover:bg-mist/60 text-ink'
              }`}
            >
              <div className="flex items-center justify-between gap-3 text-xs mb-1">
                <span className="font-bold">{order.id}</span>
                <span className={`px-2 py-0.5 rounded-full text-[0.65rem] font-bold ${
                  isSelected ? 'bg-white/20 text-white' : 'bg-mist text-charcoal'
                }`}>
                  {order.price}
                </span>
              </div>
              <p className={`text-xs font-medium truncate max-w-[200px] ${isSelected ? 'text-zinc-300' : 'text-muted'}`}>
                {isAr ? order.garmentNameAr : order.garmentNameEn}
              </p>
            </button>
          );
        })}
      </div>

      {/* Interactive Milestone Simulator Controls */}
      <Card className="p-4 bg-mist/60 border border-line rounded-2xl">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold text-ink">
              🎮 {isAr ? 'محاكي مراحل الطلب (انقر لتجربة التحديث المباشر):' : 'Interactive Status Simulator:'}
            </span>
          </div>
          <div className="flex flex-wrap gap-1.5">
            {MILESTONES.map((m) => (
              <button
                key={m.id}
                type="button"
                onClick={() => setCurrentMilestone(m.id)}
                className={`px-2.5 py-1 rounded-full text-[0.7rem] font-semibold transition-all ${
                  currentMilestone === m.id
                    ? 'bg-black text-white shadow-xs'
                    : 'bg-white border border-line text-charcoal hover:bg-zinc-100'
                }`}
              >
                {m.icon} {isAr ? m.labelAr.split(' ')[0] : m.labelEn.split(' ')[0]}
              </button>
            ))}
          </div>
        </div>
      </Card>

      {/* Main Order Card */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* Left 2 Cols: Timeline and Garment Details */}
        <div className="lg:col-span-2 space-y-6">
          <Card className="p-6 sm:p-8 rounded-3xl border border-line shadow-md space-y-6">
            
            {/* Top status banner */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-6 border-b border-line gap-3">
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-xl font-bold text-ink">{selectedOrder.id}</span>
                  <Badge variant={currentMilestone === 'completed' ? 'success' : 'gold'}>
                    {MILESTONES[currentIndex]?.icon} {isAr ? MILESTONES[currentIndex]?.labelAr : MILESTONES[currentIndex]?.labelEn}
                  </Badge>
                </div>
                <p className="text-xs text-muted mt-1">
                  {isAr ? selectedOrder.notesAr : selectedOrder.notesEn}
                </p>
              </div>
              <div className="text-start sm:text-end">
                <span className="text-xs text-muted">{isAr ? 'الموعد المتوقع للتسليم:' : 'Estimated Delivery:'}</span>
                <p className="text-xs font-bold text-emerald-600">
                  {isAr ? selectedOrder.estimatedDeliveryAr : selectedOrder.estimatedDeliveryEn}
                </p>
              </div>
            </div>

            {/* Garment Preview Bar */}
            <div className="p-4 bg-mist/60 rounded-2xl flex items-center gap-4 border border-line/60">
              <div className="w-16 h-16 rounded-xl overflow-hidden bg-white flex-shrink-0 shadow-xs border border-line">
                <img
                  src={selectedOrder.image}
                  alt="Garment Preview"
                  className="w-full h-full object-cover"
                />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-bold text-ink truncate">
                  {isAr ? selectedOrder.garmentNameAr : selectedOrder.garmentNameEn}
                </p>
                <p className="text-xs text-muted mt-0.5">
                  {isAr ? 'خياطة دقيقة حسب دبابيس العميل • ضمان المقاس 100%' : 'Precision alteration via pins • 100% Fit Guarantee'}
                </p>
              </div>
              <div className="text-end">
                <span className="text-base font-bold text-ink">{selectedOrder.price}</span>
                <span className="block text-[0.65rem] text-muted">{isAr ? 'شامل الضريبة' : 'VAT incl.'}</span>
              </div>
            </div>

            {/* Vertical Milestone Progress */}
            <div className="py-2 space-y-6">
              <h3 className="text-xs font-bold text-charcoal uppercase tracking-wider">
                {isAr ? 'مسار الخياطة والتوصيل' : 'Fulfillment Journey'}
              </h3>

              <div className="space-y-6">
                {MILESTONES.map((step, idx) => {
                  const isPassed = idx < currentIndex;
                  const isCurrent = idx === currentIndex;

                  return (
                    <div key={step.id} className="relative flex items-start gap-4">
                      {/* Vertical line */}
                      {idx < MILESTONES.length - 1 && (
                        <div
                          className={`absolute top-8 ${isAr ? 'right-4 -mr-[1px]' : 'left-4 -ml-[1px]'} w-0.5 h-12 transition-colors ${
                            idx < currentIndex ? 'bg-emerald-500' : 'bg-line'
                          }`}
                        />
                      )}

                      {/* Dot icon */}
                      <div
                        className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold transition-all z-10 ${
                          isPassed
                            ? 'bg-emerald-500 text-white shadow-xs'
                            : isCurrent
                            ? 'bg-black text-white ring-4 ring-black/15 shadow-sm scale-110'
                            : 'bg-surface border border-line text-muted'
                        }`}
                      >
                        {isPassed ? '✓' : step.icon}
                      </div>

                      {/* Content */}
                      <div className="flex-1 min-w-0 pt-0.5">
                        <div className="flex items-center justify-between">
                          <p className={`text-sm font-bold ${isCurrent ? 'text-ink' : isPassed ? 'text-charcoal' : 'text-muted'}`}>
                            {isAr ? step.labelAr : step.labelEn}
                          </p>
                          {isCurrent && (
                            <span className="inline-block px-2 py-0.5 rounded-full text-[0.65rem] font-bold bg-amber-100 text-amber-900 border border-amber-200">
                              {isAr ? 'المرحلة الحالية' : 'Current Stage'}
                            </span>
                          )}
                        </div>
                        <p className="text-xs text-muted mt-0.5">
                          {isAr ? step.descAr : step.descEn}
                        </p>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

          </Card>
        </div>

        {/* Right Col: Logistics, Courier & Atelier Info */}
        <div className="space-y-6">
          
          {/* Courier Card with Logistics Photo */}
          <Card className="p-6 rounded-3xl border border-line shadow-sm space-y-4 overflow-hidden">
            <div className="relative rounded-2xl overflow-hidden h-32 bg-mist border border-line/70">
              <img
                src="/AGI6JHG4ojGjbREnbz8H9K897g.png"
                alt="Courier Transit"
                className="w-full h-full object-cover"
              />
              <div className="absolute top-2 left-2 bg-black/80 backdrop-blur-md px-2.5 py-1 rounded-full text-[0.65rem] font-bold text-white">
                🚚 {isAr ? 'شحن مأمّن' : 'Insured Transit'}
              </div>
            </div>

            <div>
              <span className="text-[0.7rem] uppercase tracking-wider text-muted font-bold">
                {isAr ? 'مندوب التوصيل المسؤول' : 'Assigned Courier'}
              </span>
              <p className="text-sm font-bold text-ink mt-0.5">
                {isAr ? selectedOrder.courierNameAr : selectedOrder.courierNameEn}
              </p>
              <p className="text-xs text-muted">
                {isAr ? 'كابتن معتمد لدى منصة خيّاط' : 'Vetted Khayyat Courier Captain'}
              </p>
            </div>

            <div className="pt-1 flex gap-2">
              <button
                type="button"
                onClick={() => alert(isAr ? 'جاري الاتصال بمندوب التوصيل...' : 'Connecting to courier...')}
                className="flex-1 py-2 px-3 rounded-xl bg-mist hover:bg-zinc-200 text-xs font-bold text-ink transition-colors flex items-center justify-center gap-1.5"
              >
                📞 {isAr ? 'اتصال بالمندوب' : 'Call Courier'}
              </button>
              <button
                type="button"
                onClick={() => alert(isAr ? 'جاري فتح المحادثة الفورية...' : 'Opening instant chat...')}
                className="py-2 px-3 rounded-xl bg-mist hover:bg-zinc-200 text-xs font-bold text-ink transition-colors"
                title="Chat"
              >
                💬
              </button>
            </div>
          </Card>

          {/* Master Atelier Card */}
          <Card className="p-6 rounded-3xl border border-line shadow-sm space-y-4">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-2xl bg-black text-white flex items-center justify-center text-xl font-bold">
                ✂️
              </div>
              <div className="flex-1 min-w-0">
                <span className="text-[0.65rem] font-bold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                  ✓ {isAr ? 'مشغل معتمد ومفحوص' : 'Vetted Atelier'}
                </span>
                <p className="text-sm font-bold text-ink mt-1 truncate">
                  {isAr ? selectedOrder.tailorNameAr : selectedOrder.tailorNameEn}
                </p>
                <p className="text-xs text-muted">
                  ⭐⭐⭐⭐⭐ (4.9 / 5.0)
                </p>
              </div>
            </div>

            <div className="p-3 bg-mist/60 rounded-xl text-xs space-y-1">
              <div className="flex justify-between text-muted">
                <span>{isAr ? 'رقم الهاتف:' : 'Contact:'}</span>
                <span className="font-semibold text-ink">{selectedOrder.tailorPhone}</span>
              </div>
              <div className="flex justify-between text-muted">
                <span>{isAr ? 'الضمان:' : 'Guarantee:'}</span>
                <span className="font-semibold text-emerald-600">{isAr ? '100% ضبط مجاني' : '100% Free Fit'}</span>
              </div>
            </div>

            <button
              type="button"
              onClick={() => alert(isAr ? 'تم تحميل الفاتورة الإلكترونية الضريبية بنجاح!' : 'Tax invoice downloaded successfully!')}
              className="w-full py-2.5 rounded-full border border-line hover:bg-mist text-xs font-bold text-ink transition-colors flex items-center justify-center gap-2"
            >
              📄 {isAr ? 'تحميل الفاتورة الضريبية (PDF)' : 'Download Tax Invoice (PDF)'}
            </button>
          </Card>

        </div>

      </div>

    </div>
  );
}
