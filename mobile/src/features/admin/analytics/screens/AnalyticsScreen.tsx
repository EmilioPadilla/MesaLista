import { useMemo, useState } from 'react';
import { ActivityIndicator, RefreshControl, ScrollView, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { useMetricsSummary } from 'hooks/useAnalytics';
import { useUsersListsSummary } from 'hooks/useUsersListsAnalytics';
import { usePaymentAnalyticsSummary } from 'hooks/usePaymentAnalytics';

import { AdminHeader } from '../../components/AdminHeader';
import { SegmentedControl } from '../../components/SegmentedControl';
import { StatTile } from '../../components/StatTile';
import {
  AdminDateRange,
  DATE_RANGE_LABELS,
  dateRangeBounds,
  formatCurrency,
  formatDurationMs,
  formatNumber,
  formatRate,
} from '../../utils';

type Section = 'funnel' | 'usersLists' | 'payments';

const SECTIONS: Array<{ key: Section; label: string }> = [
  { key: 'funnel', label: 'Embudo' },
  { key: 'usersLists', label: 'Usuarios y listas' },
  { key: 'payments', label: 'Pagos' },
];

const RANGE_OPTIONS = (Object.keys(DATE_RANGE_LABELS) as AdminDateRange[]).map((key) => ({
  key,
  label: DATE_RANGE_LABELS[key],
}));

export function AnalyticsScreen() {
  const [section, setSection] = useState<Section>('funnel');
  const [range, setRange] = useState<AdminDateRange>('last7days');

  const { from, to } = useMemo(() => dateRangeBounds(range), [range]);

  const metrics = useMetricsSummary(from, to);
  const usersLists = useUsersListsSummary();
  const payments = usePaymentAnalyticsSummary();

  const active =
    section === 'funnel' ? metrics : section === 'usersLists' ? usersLists : payments;

  return (
    <SafeAreaView className="flex-1 bg-background" edges={['top']}>
      <AdminHeader title="Analíticas" subtitle="Métricas clave de la plataforma" />

      <View className="px-6 pb-3">
        <SegmentedControl options={SECTIONS} value={section} onChange={setSection} />
      </View>

      <ScrollView
        contentContainerClassName="px-6 pb-10"
        refreshControl={
          <RefreshControl
            refreshing={active.isRefetching}
            onRefresh={active.refetch}
            tintColor="#d4704a"
          />
        }
      >
        {section === 'funnel' && (
          <View className="mb-4">
            <SegmentedControl options={RANGE_OPTIONS} value={range} onChange={setRange} />
          </View>
        )}

        {active.isLoading ? (
          <View className="items-center py-16">
            <ActivityIndicator color="#d4704a" />
          </View>
        ) : active.isError ? (
          <ErrorState onRetry={active.refetch} />
        ) : section === 'funnel' ? (
          <FunnelSection summary={metrics.data} />
        ) : section === 'usersLists' ? (
          <UsersListsSection summary={usersLists.data} />
        ) : (
          <PaymentsSection summary={payments.data} />
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

function SectionTitle({ children }: { children: string }) {
  return <Text className="mb-2 mt-4 text-sm font-semibold uppercase tracking-wide text-mutedForeground">{children}</Text>;
}

function TileGrid({ children }: { children: React.ReactNode }) {
  return <View className="flex-row flex-wrap gap-3">{children}</View>;
}

function FunnelSection({ summary }: { summary: ReturnType<typeof useMetricsSummary>['data'] }) {
  if (!summary) return null;
  return (
    <View>
      <SectionTitle>Tráfico</SectionTitle>
      <TileGrid>
        <StatTile label="Visitantes" value={formatNumber(summary.visitors)} accent />
        <StatTile label="Inicios de sesión" value={formatNumber(summary.signIns)} hint={formatRate(summary.signInRate)} />
        <StatTile label="Inicios de checkout" value={formatNumber(summary.startCheckouts)} />
        <StatTile label="Compras de regalo" value={formatNumber(summary.giftPurchases)} hint={formatRate(summary.giftPurchaseRate)} />
      </TileGrid>

      <SectionTitle>Registro de mesas</SectionTitle>
      <TileGrid>
        <StatTile label="Intentos de registro" value={formatNumber(summary.registryAttempts)} />
        <StatTile label="Mesas creadas" value={formatNumber(summary.registryPurchases)} hint={formatRate(summary.registryPurchaseRate)} />
        <StatTile label="Vio precios" value={formatNumber(summary.viewPricing)} />
        <StatTile label="Vio constructor" value={formatNumber(summary.viewRegistryBuilder)} />
      </TileGrid>

      <SectionTitle>Calidad de sesión</SectionTitle>
      <TileGrid>
        <StatTile label="Páginas por sesión" value={summary.avgPagesPerSession.toFixed(1)} />
        <StatTile label="Duración media" value={formatDurationMs(summary.avgSessionDurationMs)} />
        <StatTile label="Errores de checkout" value={formatNumber(summary.checkoutErrors)} />
        <StatTile label="Abandono de checkout" value={formatRate(summary.checkoutAbandonmentRate)} hint={`${formatNumber(summary.checkoutAbandonments)} abandonos`} />
      </TileGrid>
    </View>
  );
}

function UsersListsSection({ summary }: { summary: ReturnType<typeof useUsersListsSummary>['data'] }) {
  if (!summary) return null;
  return (
    <View>
      <SectionTitle>Usuarios</SectionTitle>
      <TileGrid>
        <StatTile label="Usuarios totales" value={formatNumber(summary.totalUsers)} accent />
        <StatTile label="Parejas" value={formatNumber(summary.totalCouples)} />
        <StatTile label="Invitados" value={formatNumber(summary.totalGuests)} />
        <StatTile label="Admins" value={formatNumber(summary.totalAdmins)} />
        <StatTile label="Plan fijo" value={formatNumber(summary.fixedPlanUsers)} />
        <StatTile label="Plan comisión" value={formatNumber(summary.commissionPlanUsers)} />
      </TileGrid>

      <SectionTitle>Listas</SectionTitle>
      <TileGrid>
        <StatTile label="Mesas de regalos" value={formatNumber(summary.totalWeddingLists)} accent />
        <StatTile label="Regalos creados" value={formatNumber(summary.totalGiftsCreated)} />
        <StatTile label="Regalos comprados" value={formatNumber(summary.totalGiftsPurchased)} />
        <StatTile label="Ingresos totales" value={formatCurrency(summary.totalRevenue)} />
        <StatTile label="Ingreso medio / lista" value={formatCurrency(summary.averageRevenuePerList)} />
        <StatTile label="Regalos medios / lista" value={summary.averageGiftsPerList.toFixed(1)} />
        <StatTile label="Tasa de compra media" value={formatRate(summary.averagePurchaseRate)} />
      </TileGrid>
    </View>
  );
}

function PaymentsSection({ summary }: { summary: ReturnType<typeof usePaymentAnalyticsSummary>['data'] }) {
  if (!summary) return null;
  return (
    <View>
      <SectionTitle>Volumen bruto</SectionTitle>
      <TileGrid>
        <StatTile label="Total bruto" value={formatCurrency(summary.totalGrossPayments)} accent />
        <StatTile label="Stripe" value={formatCurrency(summary.totalGrossStripe)} hint={`${formatNumber(summary.stripePaymentsCount)} pagos`} />
        <StatTile label="PayPal" value={formatCurrency(summary.totalGrossPaypal)} hint={`${formatNumber(summary.paypalPaymentsCount)} pagos`} />
        <StatTile label="Pagos totales" value={formatNumber(summary.totalPaymentsCount)} />
      </TileGrid>

      <SectionTitle>Mesas por plan</SectionTitle>
      <TileGrid>
        <StatTile label="Mesas con pagos" value={formatNumber(summary.totalGiftLists)} />
        <StatTile label="Plan fijo" value={formatNumber(summary.fixedPlanLists)} />
        <StatTile label="Plan comisión" value={formatNumber(summary.commissionPlanLists)} />
      </TileGrid>
    </View>
  );
}

function ErrorState({ onRetry }: { onRetry: () => void }) {
  return (
    <View className="items-center rounded-ml border border-dashed border-gray-300 bg-white px-6 py-12">
      <Text className="text-base font-semibold text-ink">No se pudieron cargar las métricas</Text>
      <Text className="mt-1 text-center text-sm text-mutedForeground">Desliza hacia abajo para reintentar.</Text>
      <Text onPress={onRetry} className="mt-3 text-sm font-medium text-oak">
        Reintentar
      </Text>
    </View>
  );
}
