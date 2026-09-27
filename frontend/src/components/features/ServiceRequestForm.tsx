'use client';

import React, { useState } from 'react';
import { useTranslations } from 'next-intl';
import { Input } from '../ui/Input';
import { Button } from '../ui/Button';
import { Card } from '../ui/Card';

export const ServiceRequestForm: React.FC = () => {
  const t = useTranslations('requests');
  const tCat = useTranslations('categories');

  const [category, setCategory] = useState('alteration');
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [budget, setBudget] = useState('');
  const [needsDelivery, setNeedsDelivery] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    // Simulate request creation
    setTimeout(() => {
      setIsSubmitting(false);
      setSubmitted(true);
    }, 1000);
  };

  if (submitted) {
    return (
      <Card className="text-center py-10 px-6 space-y-4 max-w-lg mx-auto">
        <div className="w-16 h-16 bg-success/15 text-success text-3xl rounded-full flex items-center justify-center mx-auto">
          ✓
        </div>
        <h2 className="text-h2 font-bold text-ink">تم نشر طلبك بنجاح!</h2>
        <p className="text-body-m text-muted">
          نقوم الان بإشعال الخيّاطين المناسبين بالقرب منك. ستتلقى عروض الأسعار في أقرب وقت.
        </p>
        <Button variant="primary" onClick={() => setSubmitted(false)}>
          تقديم طلب آخر
        </Button>
      </Card>
    );
  }

  return (
    <Card className="max-w-2xl mx-auto p-6 md:p-8 space-y-6">
      <div className="border-b border-line pb-4">
        <h2 className="text-h2 font-bold text-ink">{t('title')}</h2>
        <p className="text-body-m text-muted mt-1">{t('subtitle')}</p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Category Selection */}
        <div className="space-y-2">
          <label className="block text-body-s font-medium text-charcoal">
            {t('category')}
          </label>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {[
              { id: 'alteration', label: tCat('alteration'), icon: '✂️' },
              { id: 'repair', label: tCat('repair'), icon: '🧵' },
              { id: 'custom', label: tCat('custom'), icon: '👔' },
              { id: 'fabric', label: tCat('fabric'), icon: '🛍️' },
            ].map((cat) => (
              <button
                type="button"
                key={cat.id}
                onClick={() => setCategory(cat.id)}
                className={`flex flex-col items-center justify-center p-3.5 rounded-lg border transition-all text-center ${
                  category === cat.id
                    ? 'border-gold bg-gold/10 text-ink font-semibold shadow-sm'
                    : 'border-line hover:bg-mist text-charcoal'
                }`}
              >
                <span className="text-2xl mb-1">{cat.icon}</span>
                <span className="text-caption">{cat.label}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Title */}
        <Input
          label={t('titleLabel')}
          placeholder={t('titlePlaceholder')}
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          required
        />

        {/* Details / Description */}
        <div className="space-y-1.5">
          <label className="block text-body-s font-medium text-charcoal">
            {t('descriptionLabel')}
          </label>
          <textarea
            rows={4}
            className="w-full px-3.5 py-2.5 text-body-m bg-surface border border-line rounded-md focus:outline-none focus:ring-2 focus:ring-gold focus:border-gold"
            placeholder={t('descriptionPlaceholder')}
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            required
          />
        </div>

        {/* Budget */}
        <Input
          type="number"
          label={t('budgetLabel')}
          placeholder="50"
          value={budget}
          onChange={(e) => setBudget(e.target.value)}
        />

        {/* Delivery choice */}
        <div className="space-y-2">
          <label className="block text-body-s font-medium text-charcoal">
            {t('deliveryLabel')}
          </label>
          <div className="flex gap-4">
            <label className="flex items-center gap-2 cursor-pointer text-body-m">
              <input
                type="radio"
                name="delivery"
                checked={needsDelivery}
                onChange={() => setNeedsDelivery(true)}
                className="accent-gold w-4 h-4"
              />
              {t('yes')}
            </label>
            <label className="flex items-center gap-2 cursor-pointer text-body-m">
              <input
                type="radio"
                name="delivery"
                checked={!needsDelivery}
                onChange={() => setNeedsDelivery(false)}
                className="accent-gold w-4 h-4"
              />
              {t('no')}
            </label>
          </div>
        </div>

        <Button
          type="submit"
          variant="primary"
          size="lg"
          fullWidth
          disabled={isSubmitting}
        >
          {isSubmitting ? 'جاري نشر الطلب...' : t('submit')}
        </Button>
      </form>
    </Card>
  );
};
