import i18n from '$lib/i18n';
import { DateFormatter } from '@internationalized/date';

export class DateUtils {
  static isSameDay(date1: Date, date2: Date): boolean {
    return (
      date1.getFullYear() === date2.getFullYear() &&
      date1.getMonth() === date2.getMonth() &&
      date1.getDate() === date2.getDate()
    );
  }

  static isToday(date: Date): boolean {
    return this.isSameDay(date, new Date());
  }

  static isInFuture(date: Date): boolean {
    const today = new Date();
    return (
      date.getFullYear() > today.getFullYear() ||
      (date.getFullYear() === today.getFullYear() &&
        (date.getMonth() > today.getMonth() ||
          (date.getMonth() === today.getMonth() && date.getDate() > today.getDate())))
    );
  }

  static distance(
    date1: Date,
    date2: Date,
    unit: 'days' | 'hours' | 'minutes' | 'seconds'
  ): number {
    const diff = date2.getTime() - date1.getTime();
    switch (unit) {
      case 'days':
        return Math.ceil(diff / (1000 * 60 * 60 * 24));
      case 'hours':
        return Math.ceil(diff / (1000 * 60 * 60));
      case 'minutes':
        return Math.ceil(diff / (1000 * 60));
      case 'seconds':
        return Math.ceil(diff / 1000);
      default:
        throw new Error('Invalid unit for distance calculation');
    }
  }

  static formatDate = (date: Date, { allowDistance = true }: { allowDistance?: boolean } = {}) => {
    if (allowDistance) {
      const distanceInDays = DateUtils.distance(new Date(), date, 'days');
      if (distanceInDays === 0) {
        return i18n.t('date.today');
      }
      if (distanceInDays === 1) return i18n.t('date.tomorrow');
      if (distanceInDays === -1) return i18n.t('date.yesterday');

      if (distanceInDays < 6)
        return new DateFormatter(i18n.locale, { weekday: 'long' }).format(date);
    }
    return new DateFormatter(i18n.locale, { day: '2-digit', month: 'short' }).format(date);
  };
}
