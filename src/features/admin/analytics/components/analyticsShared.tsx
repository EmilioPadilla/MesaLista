import type { ReactNode } from 'react';
import { Card, Grid, Statistic } from 'antd';
import dayjs from 'dayjs';

const { useBreakpoint } = Grid;

export const formatCurrency = (amount: number) => {
  return new Intl.NumberFormat('es-MX', {
    style: 'currency',
    currency: 'MXN',
  }).format(amount);
};

export const formatDate = (date: string) => {
  return dayjs(date).format('DD/MMM/YYYY');
};

/**
 * Phones sit below antd's `md` breakpoint (768px) — an iPhone 15 Pro Max is 430px
 * wide, so the analytics tabs swap to their stacked/expandable layout there.
 */
export function useIsMobile() {
  const screens = useBreakpoint();
  return !screens.md;
}

/** Shared responsive gutter for the summary card grids. */
export const summaryGutter: [{ xs: number; sm: number }, { xs: number; sm: number }] = [
  { xs: 8, sm: 16 },
  { xs: 8, sm: 16 },
];

interface StatCardProps {
  title: string;
  value: number;
  icon: ReactNode;
  color: string;
  /** Tailwind background class, e.g. `!bg-blue-50` */
  background: string;
  footer?: ReactNode;
  currency?: boolean;
  suffix?: string;
  precision?: number;
}

export function StatCard({ title, value, icon, color, background, footer, currency, suffix, precision }: StatCardProps) {
  const isMobile = useIsMobile();

  return (
    <Card className={`h-full ${background}`} size={isMobile ? 'small' : 'default'}>
      <Statistic
        title={<span className="text-xs sm:text-sm">{title}</span>}
        value={value}
        prefix={icon}
        valueStyle={{ color, fontSize: isMobile ? 18 : 24 }}
        formatter={currency ? (val) => formatCurrency(Number(val)) : undefined}
        suffix={suffix}
        precision={precision}
      />
      {footer && <div className="mt-2 text-[11px] leading-tight text-gray-600 sm:text-xs">{footer}</div>}
    </Card>
  );
}

export interface DetailItem {
  label: string;
  value: ReactNode;
}

/** Key/value grid used as the expanded row content on phones. */
export function DetailList({ items }: { items: DetailItem[] }) {
  return (
    <dl className="m-0 grid grid-cols-2 gap-x-3 gap-y-2 text-xs">
      {items.map((item) => (
        <div key={item.label} className="min-w-0">
          <dt className="text-gray-500">{item.label}</dt>
          <dd className="m-0 mt-0.5 break-words font-medium text-gray-800">{item.value}</dd>
        </div>
      ))}
    </dl>
  );
}
