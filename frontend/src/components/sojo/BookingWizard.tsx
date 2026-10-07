'use client';

import React, { useEffect, useState } from 'react';
import { useLocale } from 'next-intl';
import { Card } from '../ui/Card';
import { Button } from '../ui/Button';
import { Badge } from '../ui/Badge';
import { Link } from '@/i18n/routing';
import { useAuth } from '@/lib/auth-context';
import { APIError } from '@/lib/api-client';
import {
  catalogApi,
  requestsApi,
  CITY_LABELS,
  CITY_SLUGS,
  CitySlug,
  RequestItem,
  ServiceCategory,
  ServiceItem,
} from '@/lib/api';

const CATEGORY_ICON: Record<string, string> = {
  alteration: '✂️',
  repair: '🧵',
  custom: '👗',
};

export const BookingWizard: React.FC = () => {
  const locale = useLocale();
  const isAr = locale === 'ar';
  const { user, isLoading: authLoading } = useAuth();

  const [step, setStep] = useState<1 | 2 | 3 | 4>(1);
  const [categories, setCategories] = useState<ServiceCategory[] | null>(null);
  const [catalogError, setCatalogError] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<ServiceCategory | null>(null);
  const [selectedService, setSelectedService] = useState<ServiceItem | null>(null);
  const [notes, setNotes] = useState('');
  const [photoUrls, setPhotoUrls] = useState<string[]>([]);
  const [isUploading, setIsUploading] = useState(false);
  const [city, setCity] = useState<CitySlug>('damascus');
  const [fulfillment, setFulfillment] = useState<'delivery' | 'dropoff' | 'van_visit'>('delivery');
  const [preferredDate, setPreferredDate] = useState('');
  const [budget, setBudget] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState('');
  const [createdRequest, setCreatedRequest] = useState<RequestItem | null>(null);

  useEffect(() => {
    catalogApi
      .services()
      .then((cats) => {
        setCategories(cats);
        setSelectedCategory(cats[0] ?? null);
      })
      .catch(() =>
        setCatalogError(
          isAr ? 'تعذر تحميل قائمة الخدمات. حدّث الصفحة وحاول مجدداً.' : 'Could not load services. Please refresh and try again.'
        )
      );
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handlePhotoSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file || photoUrls.length >= 6) return;
    setIsUploading(true);
    setSubmitError('');
    try {
      const { url } = await catalogApi.uploadImage(file);
      setPhotoUrls((prev) => [...prev, url]);
    } catch {
      setSubmitError(isAr ? 'تعذر رفع الصورة. جرّب صورة أصغر حجماً.' : 'Photo upload failed. Try a smaller image.');
    } finally {
      setIsUploading(false);
    }
  };

  const removePhoto = (url: string) => setPhotoUrls((prev) => prev.filter((u) => u !== url));

  const handleComplete = async () => {
    if (!selectedCategory || !selectedService) return;
    setIsSubmitting(true);
    setSubmitError('');
    try {
      const categoryName = isAr ? selectedCategory.name_ar : selectedCategory.name_en;
      const serviceName = isAr ? selectedService.name_ar : selectedService.name_en;
      const title = `${categoryName} — ${serviceName}`.slice(0, 120);
      const vanNote = isAr
        ? ' [طلب زيارة الخيّاط المتنقل: القياس شخصياً في المنزل]'
        : ' [Mobile tailor van requested: in-person home measurement]';
      let description = notes.trim() || `${serviceName} (${categoryName})`;
      if (fulfillment === 'van_visit') description += vanNote;
      const request = await requestsApi.create({
        service_id: selectedService.id,
        title,
        description: description.length >= 10 ? description : description.padEnd(10, '.'),
        city,
        needs_pickup: fulfillment !== 'dropoff',
        needs_delivery: fulfillment !== 'dropoff',
        photo_urls: photoUrls,
        preferred_date: preferredDate || undefined,
        budget_max: budget ? Number(budget) : undefined,
      });
      setCreatedRequest(request);
    } catch (err) {
      if (err instanceof APIError) {
        const fieldErrors = err.details.errors?.map((e) => e.message).join(' ');
        setSubmitError(fieldErrors || err.details.detail || err.message);
      } else {
        setSubmitError(isAr ? 'تعذر إرسال الطلب. حاول مرة أخرى.' : 'Could not submit the request. Please try again.');
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const resetWizard = () => {
    setCreatedRequest(null);
    setStep(1);
    setSelectedService(null);
    setNotes('');
    setPhotoUrls([]);
    setPreferredDate('');
    setBudget('');
  };

  // --- Auth gate: submitting a request requires a signed-in customer account ------------------
  if (!authLoading && !user) {
    return (
      <Card className="max-w-xl mx-auto p-8 text-center space-y-4 shadow-md" id="booking">
        <div className="w-16 h-16 bg-mist text-3xl rounded-full flex items-center justify-center mx-auto">🔒</div>
        <h2 className="text-h2 font-bold text-ink">
          {isAr ? 'سجّل دخولك لإرسال طلب تعديل' : 'Sign in to submit an alteration request'}
        </h2>
        <p className="text-body-m text-muted">
          {isAr
            ? 'لإرسال طلبك للخيّاطين المعتمدين ومتابعته، تحتاج حساب عميل في خيّاط.'
            : 'To send your request to verified tailors and track it, you need a Khayyat customer account.'}
        </p>
        <div className="flex items-center justify-center gap-3 pt-2">
          <Link href="/auth/login"><Button variant="primary">{isAr ? 'تسجيل الدخول' : 'Sign In'}</Button></Link>
          <Link href="/auth/register"><Button variant="outline">{isAr ? 'إنشاء حساب' : 'Create account'}</Button></Link>
        </div>
      </Card>
    );
  }

  if (!authLoading && user && !user.roles.includes('customer')) {
    return (
      <Card className="max-w-xl mx-auto p-8 text-center space-y-4 shadow-md" id="booking">
        <div className="w-16 h-16 bg-mist text-3xl rounded-full flex items-center justify-center mx-auto">ℹ️</div>
        <h2 className="text-h2 font-bold text-ink">
          {isAr ? 'هذا الحساب ليس حساب عميل' : 'This account is not a customer account'}
        </h2>
        <p className="text-body-m text-muted">
          {isAr
            ? 'حسابك مسجّل كخيّاط. لإرسال طلب تعديل، سجّل دخولك بحساب عميل.'
            : 'Your account is registered as a tailor. Sign in with a customer account to submit a request.'}
        </p>
      </Card>
    );
  }

  if (createdRequest) {
    return (
      <Card className="max-w-xl mx-auto p-8 text-center space-y-5 shadow-lg" id="booking">
        <div className="w-16 h-16 bg-success/15 text-success text-3xl rounded-full flex items-center justify-center mx-auto">
          ✓
        </div>
        <h2 className="text-h2 font-bold text-ink">
          {isAr ? 'تم إرسال طلبك بنجاح!' : 'Your request has been sent!'}
        </h2>
        <p className="text-body-m text-muted">
          {isAr
            ? 'تم نشر طلبك للخيّاطين المعتمدين في مدينتك، وستصلك العروض قريباً.'
            : 'Your request is now visible to verified tailors in your city. Quotes will start arriving shortly.'}
        </p>
        <div className="p-4 bg-mist rounded-lg text-start space-y-1.5 text-body-s">
          <p className="font-semibold text-ink">{isAr ? 'تفاصيل الطلب:' : 'Request details:'}</p>
          <p className="text-charcoal">• {createdRequest.title}</p>
          <p className="text-charcoal">
            {isAr ? '• الحالة:' : '• Status:'} <Badge variant="info">{createdRequest.status}</Badge>
          </p>
          <p className="text-charcoal">
            • {isAr ? 'المدينة:' : 'City:'} {isAr ? CITY_LABELS[city].ar : CITY_LABELS[city].en}
          </p>
        </div>
        <div className="flex items-center justify-center gap-3">
          <Link href="/requests/mine"><Button variant="primary">{isAr ? 'عرض طلباتي' : 'View my requests'}</Button></Link>
          <Button variant="outline" onClick={resetWizard}>
            {isAr ? 'طلب تعديل قطعة أخرى' : 'Request another alteration'}
          </Button>
        </div>
      </Card>
    );
  }

  if (catalogError) {
    return (
      <Card className="max-w-xl mx-auto p-8 text-center space-y-3 shadow-md" id="booking">
        <p className="text-danger font-semibold">{catalogError}</p>
      </Card>
    );
  }

  if (!categories || !selectedCategory) {
    return (
      <Card className="max-w-3xl mx-auto p-8 text-center text-muted shadow-md" id="booking">
        {isAr ? 'جاري تحميل الخدمات...' : 'Loading services...'}
      </Card>
    );
  }

  return (
    <Card className="max-w-3xl mx-auto p-6 md:p-8 space-y-8 shadow-md" id="booking">
      {/* Progress header */}
      <div>
        <div className="flex items-center justify-between text-body-s font-semibold text-muted mb-2">
          <span>{isAr ? 'خطوات حجز التعديل' : 'Booking steps'}</span>
          <span className="text-gold-ink font-bold">{isAr ? `الخطوة ${step} من 4` : `Step ${step} of 4`}</span>
        </div>
        <div className="w-full bg-line h-2 rounded-full overflow-hidden">
          <div className="bg-gold h-full transition-all duration-300" style={{ width: `${(step / 4) * 100}%` }} />
        </div>
      </div>

      {/* Step 1: Category */}
      {step === 1 && (
        <div className="space-y-6">
          <div>
            <h2 className="text-h2 font-bold text-ink">
              {isAr ? '1. اختر نوع القطعة المراد تعديلها' : '1. Choose the type of alteration'}
            </h2>
            <p className="text-body-m text-muted mt-1">
              {isAr
                ? 'تحديد الفئة يساعدنا في عرض الخدمات المناسبة.'
                : 'Picking a category narrows down the exact services on offer.'}
            </p>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
            {categories.map((cat) => (
              <button
                type="button"
                key={cat.id}
                onClick={() => {
                  setSelectedCategory(cat);
                  setSelectedService(null);
                }}
                className={`p-5 rounded-xl border flex flex-col items-center justify-center gap-2 text-center transition-all ${
                  selectedCategory.id === cat.id
                    ? 'border-gold bg-gold/15 text-ink ring-2 ring-gold/40 shadow-sm'
                    : 'border-line hover:bg-mist text-charcoal'
                }`}
              >
                <span className="text-4xl">{CATEGORY_ICON[cat.slug] ?? '🧵'}</span>
                <span className="font-semibold text-body-m">{isAr ? cat.name_ar : cat.name_en}</span>
              </button>
            ))}
          </div>

          <div className="flex justify-end pt-4">
            <Button variant="primary" size="md" onClick={() => setStep(2)}>
              {isAr ? 'المتابعة لاختيار الخدمة ➔' : 'Continue to pick a service ➔'}
            </Button>
          </div>
        </div>
      )}

      {/* Step 2: Service */}
      {step === 2 && (
        <div className="space-y-6">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="text-2xl">{CATEGORY_ICON[selectedCategory.slug] ?? '🧵'}</span>
              <h2 className="text-h2 font-bold text-ink">
                {isAr
                  ? `2. ما الخدمة المطلوبة ضمن (${selectedCategory.name_ar})؟`
                  : `2. Which ${selectedCategory.name_en} service do you need?`}
              </h2>
            </div>
            <p className="text-body-m text-muted">
              {isAr
                ? 'اختر خدمة واحدة تصف طلبك بدقة؛ يمكنك إضافة تفاصيل إضافية في الخطوة التالية.'
                : 'Pick the one service that best matches your need — add extra detail in the next step.'}
            </p>
          </div>

          <div className="space-y-3">
            {selectedCategory.services.map((srv) => {
              const isChecked = selectedService?.id === srv.id;
              return (
                <div
                  key={srv.id}
                  onClick={() => setSelectedService(srv)}
                  className={`p-4 rounded-lg border flex items-center justify-between cursor-pointer transition-all ${
                    isChecked ? 'border-gold bg-gold/10 ring-1 ring-gold shadow-xs' : 'border-line hover:bg-mist'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <input type="radio" checked={isChecked} onChange={() => {}} className="w-5 h-5 accent-gold cursor-pointer" />
                    <div>
                      <p className="font-semibold text-ink text-body-m">{isAr ? srv.name_ar : srv.name_en}</p>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          <div className="flex justify-between pt-4">
            <Button variant="outline" size="md" onClick={() => setStep(1)}>
              {isAr ? 'السابق' : 'Back'}
            </Button>
            <Button variant="primary" size="md" disabled={!selectedService} onClick={() => setStep(3)}>
              {isAr ? 'متابعة للتفاصيل والصور ➔' : 'Continue to details & photos ➔'}
            </Button>
          </div>
        </div>
      )}

      {/* Step 3: Notes & photo */}
      {step === 3 && (
        <div className="space-y-6">
          <div>
            <h2 className="text-h2 font-bold text-ink">
              {isAr ? '3. صف طلبك وأرفق صورة' : '3. Describe your request and attach a photo'}
            </h2>
            <p className="text-body-m text-muted mt-1">
              {isAr
                ? 'كلما كانت التفاصيل أدق، كانت عروض الخيّاطين أقرب لتوقعك.'
                : 'The more precise your description, the closer the tailors’ quotes will match your expectation.'}
            </p>
          </div>

          <div className="space-y-1.5">
            <label className="block text-body-s font-semibold text-charcoal">
              {isAr ? 'وصف التعديل المطلوب (10 أحرف على الأقل)' : 'Describe what you need (min. 10 characters)'}
            </label>
            <textarea
              rows={4}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder={
                isAr
                  ? 'مثال: تقصير بنطال الجينز بمقدار 4 سم مع المحافظة على الحاشية الأصلية...'
                  : 'e.g. Shorten these jeans by 4cm, keep the original hem style...'
              }
              className="w-full p-3 text-body-m bg-surface border border-line rounded-md focus:outline-none focus:ring-2 focus:ring-gold"
            />
          </div>

          <div className="space-y-2">
            <label className="block text-body-s font-semibold text-charcoal">
              {isAr ? 'صور القطعة (اختياري، حتى 6 صور)' : 'Photos of the garment (optional, up to 6)'}
            </label>
            <div className="flex flex-wrap gap-3">
              {photoUrls.map((url) => (
                <div key={url} className="relative w-20 h-20 rounded-lg overflow-hidden border border-line group">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={url} alt="" className="w-full h-full object-cover" />
                  <button
                    type="button"
                    onClick={() => removePhoto(url)}
                    className="absolute inset-0 bg-black/60 text-white opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center text-xs font-bold"
                  >
                    {isAr ? 'إزالة' : 'Remove'}
                  </button>
                </div>
              ))}
              {photoUrls.length < 6 && (
                <label
                  className={`w-20 h-20 rounded-lg border-2 border-dashed flex items-center justify-center cursor-pointer text-xs text-muted transition-colors ${
                    isUploading ? 'opacity-50 pointer-events-none' : 'border-line hover:border-gold'
                  }`}
                >
                  {isUploading ? '…' : '+ ' + (isAr ? 'صورة' : 'Photo')}
                  <input type="file" accept="image/*" className="hidden" onChange={handlePhotoSelect} disabled={isUploading} />
                </label>
              )}
            </div>
          </div>

          {submitError && <p className="text-xs text-danger font-medium">{submitError}</p>}

          <div className="flex justify-between pt-4">
            <Button variant="outline" size="md" onClick={() => setStep(2)}>
              {isAr ? 'السابق' : 'Back'}
            </Button>
            <Button variant="primary" size="md" disabled={notes.trim().length < 10} onClick={() => setStep(4)}>
              {isAr ? 'متابعة لطريقة الاستلام ➔' : 'Continue to fulfillment ➔'}
            </Button>
          </div>
        </div>
      )}

      {/* Step 4: City + fulfillment */}
      {step === 4 && (
        <div className="space-y-6">
          <div>
            <h2 className="text-h2 font-bold text-ink">
              {isAr ? '4. المدينة وطريقة الاستلام والتسليم' : '4. City and fulfillment method'}
            </h2>
          </div>

          <div className="space-y-1.5">
            <label className="block text-body-s font-semibold text-charcoal">{isAr ? 'المدينة' : 'City'}</label>
            <select
              value={city}
              onChange={(e) => setCity(e.target.value as CitySlug)}
              className="w-full h-11 px-3 rounded-md border border-line bg-surface text-ink text-sm focus:outline-none focus:ring-2 focus:ring-gold"
            >
              {CITY_SLUGS.map((slug) => (
                <option key={slug} value={slug}>
                  {isAr ? CITY_LABELS[slug].ar : CITY_LABELS[slug].en}
                </option>
              ))}
            </select>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div
              onClick={() => setFulfillment('delivery')}
              className={`p-5 rounded-xl border cursor-pointer transition-all flex flex-col justify-between ${
                fulfillment === 'delivery' ? 'border-gold bg-gold/15 ring-2 ring-gold/40 shadow-sm' : 'border-line hover:bg-mist'
              }`}
            >
              <div className="space-y-2">
                <span className="text-2xl">🚚</span>
                <h3 className="font-bold text-h3 text-ink">{isAr ? 'توصيل واستلام من الباب' : 'Doorstep pickup & return'}</h3>
                <p className="text-body-s text-muted">
                  {isAr
                    ? 'مندوب يستلم القطعة منك ويوصلها بعد الانتهاء.'
                    : 'A courier picks up the item and returns it once the work is done.'}
                </p>
              </div>
            </div>

            <div
              onClick={() => setFulfillment('van_visit')}
              className={`p-5 rounded-xl border cursor-pointer transition-all flex flex-col justify-between ${
                fulfillment === 'van_visit' ? 'border-gold bg-gold/15 ring-2 ring-gold/40 shadow-sm' : 'border-line hover:bg-mist'
              }`}
            >
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-2xl">🚐</span>
                  <Badge variant="gold">{isAr ? 'جديد' : 'New'}</Badge>
                </div>
                <h3 className="font-bold text-h3 text-ink">{isAr ? 'الخيّاط المتنقل (فان)' : 'Mobile tailor van'}</h3>
                <p className="text-body-s text-muted">
                  {isAr
                    ? 'الخيّاط يأتي لبيتك بالفان ويأخذ قياسك شخصياً، ثم يفصّل القطعة في الفان أو يأخذها للمشغل ويعيدها.'
                    : 'The tailor drives to you, measures you in person, then either alters it on the spot or takes it to the workshop and returns it.'}
                </p>
              </div>
            </div>

            <div
              onClick={() => setFulfillment('dropoff')}
              className={`p-5 rounded-xl border cursor-pointer transition-all flex flex-col justify-between ${
                fulfillment === 'dropoff' ? 'border-gold bg-gold/15 ring-2 ring-gold/40 shadow-sm' : 'border-line hover:bg-mist'
              }`}
            >
              <div className="space-y-2">
                <span className="text-3xl">🏪</span>
                <h3 className="font-bold text-h3 text-ink">{isAr ? 'تسليم مباشر بالمشغل' : 'Drop off yourself'}</h3>
                <p className="text-body-s text-muted">
                  {isAr ? 'تقوم بتسليم القطعة بنفسك واستلامها من المشغل.' : 'You deliver and collect the item at the workshop.'}
                </p>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="block text-body-s font-semibold text-charcoal">
                {isAr ? 'التاريخ المفضّل (اختياري)' : 'Preferred date (optional)'}
              </label>
              <input
                type="date"
                value={preferredDate}
                min={new Date().toISOString().slice(0, 10)}
                onChange={(e) => setPreferredDate(e.target.value)}
                className="w-full h-11 px-3 rounded-md border border-line bg-surface text-ink text-sm focus:outline-none focus:ring-2 focus:ring-gold"
              />
            </div>
            <div className="space-y-1.5">
              <label className="block text-body-s font-semibold text-charcoal">
                {isAr ? 'ميزانيتك القصوى بالريال (اختياري)' : 'Max budget in SAR (optional)'}
              </label>
              <input
                type="number"
                min={1}
                inputMode="numeric"
                value={budget}
                onChange={(e) => setBudget(e.target.value)}
                placeholder={isAr ? 'مثال: 80' : 'e.g. 80'}
                className="w-full h-11 px-3 rounded-md border border-line bg-surface text-ink text-sm focus:outline-none focus:ring-2 focus:ring-gold"
              />
            </div>
          </div>

          {submitError && <p className="text-xs text-danger font-medium">{submitError}</p>}

          <div className="flex justify-between pt-4">
            <Button variant="outline" size="md" onClick={() => setStep(3)}>
              {isAr ? 'السابق' : 'Back'}
            </Button>
            <Button variant="primary" size="lg" onClick={handleComplete} disabled={isSubmitting}>
              {isSubmitting
                ? (isAr ? 'جاري الإرسال...' : 'Sending...')
                : (isAr ? 'تأكيد وإرسال للخيّاطين 🚀' : 'Confirm & send to tailors 🚀')}
            </Button>
          </div>
        </div>
      )}
    </Card>
  );
};
