import React from 'react';
import { useTranslations } from 'next-intl';
import { Card } from '../ui/Card';
import { Badge } from '../ui/Badge';
import { Button } from '../ui/Button';
import { Link } from '@/i18n/routing';
import { TailorProfile } from '@/types';

export interface TailorCardProps {
  tailor: TailorProfile;
}

export const TailorCard: React.FC<TailorCardProps> = ({ tailor }) => {
  const t = useTranslations('tailors');

  return (
    <Card hoverable className="flex flex-col justify-between h-full">
      <div className="space-y-4">
        {/* Header avatar + info */}
        <div className="flex items-start gap-3.5">
          <div className="w-14 h-14 bg-mist rounded-full flex items-center justify-center text-h2 font-bold text-ink border border-line flex-shrink-0 overflow-hidden">
            {tailor.user_avatar ? (
              <img
                src={tailor.user_avatar}
                alt={tailor.user_name}
                className="w-full h-full object-cover"
              />
            ) : (
              tailor.user_name.charAt(0)
            )}
          </div>

          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2">
              <h3 className="text-h3 font-semibold text-ink truncate">
                {tailor.shop_name || tailor.user_name}
              </h3>
              {tailor.is_verified && (
                <Badge variant="success">{t('verified')}</Badge>
              )}
            </div>

            <p className="text-body-s text-muted mt-0.5">
              📍 {tailor.city}
            </p>

            {/* Rating */}
            <div className="flex items-center gap-1.5 mt-1 text-body-s">
              <span className="text-gold font-bold">★ {tailor.rating.toFixed(1)}</span>
              <span className="text-muted">({tailor.reviews_count} {t('rating')})</span>
              <span className="text-muted">• {tailor.completed_orders} {t('ordersCompleted')}</span>
            </div>
          </div>
        </div>

        {/* Bio */}
        {tailor.bio && (
          <p className="text-body-s text-charcoal/80 line-clamp-2">
            {tailor.bio}
          </p>
        )}

        {/* Specialties Badges */}
        <div className="flex flex-wrap gap-1.5 pt-1">
          {tailor.specialties.map((spec, idx) => (
            <Badge key={idx} variant="ink">
              {spec}
            </Badge>
          ))}
        </div>
      </div>

      {/* Action Footer */}
      <div className="pt-5 mt-4 border-t border-line flex gap-2.5">
        <Link href={`/tailors/${tailor.id}`} className="flex-1">
          <Button variant="outline" size="sm" fullWidth>
            {t('viewProfile')}
          </Button>
        </Link>
        <Link href="/book" className="flex-1">
          <Button variant="primary" size="sm" fullWidth>
            {t('requestQuote')}
          </Button>
        </Link>
      </div>
    </Card>
  );
};
