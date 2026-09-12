import { useState, useMemo } from 'react';
import { Card, Row, Col, Spin, Table, Tag, Tooltip, Dropdown, Button } from 'antd';
import { DollarSign, CreditCard, Wallet, TrendingUp, Percent, Gift, EllipsisVertical } from 'lucide-react';
import dayjs from 'dayjs';
import type { ColumnsType } from 'antd/es/table';
import type { GiftListPaymentAnalytics, PaymentAnalyticsSummary } from 'services/paymentAnalytics.service';
import { stripeMexicoBreakdown, paypalMexicoBreakdown } from 'utils/feeUtils';
import { GiftPaymentsReportModal } from './GiftPaymentsReportModal';
import { DetailList, StatCard, formatCurrency, formatDate, summaryGutter, useIsMobile } from './analyticsShared';

interface PaymentsCommissionsAnalyticsTabProps {
  summary: PaymentAnalyticsSummary | undefined;
  isSummaryLoading: boolean;
  listsData: GiftListPaymentAnalytics[] | undefined;
  isListsLoading: boolean;
}

// Fixed plan price
const FIXED_PLAN_PRICE = 2000;
const COMMISSION_RATE = 0.03;

// Calculate net amounts based on fee preference
const calculateNetPaypal = (gross: number, feePreference: 'couple' | 'guest') => {
  if (gross === 0) return 0;
  if (feePreference === 'guest') {
    // Guest pays fees, couple receives the full amount
    return gross;
  } else {
    // Couple absorbs fees
    const breakdown = paypalMexicoBreakdown(gross);
    return breakdown.net;
  }
};

const calculateNetStripe = (gross: number, feePreference: 'couple' | 'guest') => {
  if (gross === 0) return 0;
  if (feePreference === 'guest') {
    // Guest pays fees, couple receives the full amount
    return gross;
  } else {
    // Couple absorbs fees
    const breakdown = stripeMexicoBreakdown(gross);
    return breakdown.net;
  }
};

const calculateNetTotal = (record: GiftListPaymentAnalytics) =>
  calculateNetPaypal(record.grossPaypal, record.feePreference) + calculateNetStripe(record.grossStripe, record.feePreference);

// Calculate MesaLista earnings for a gift list
const calculateEarnings = (record: GiftListPaymentAnalytics) => {
  if (record.planType === 'FIXED') {
    // Fixed plan: 2000 - discount applied
    return FIXED_PLAN_PRICE - record.discountValue;
  } else if (record.planType === 'COMMISSION') {
    // Commission plan: 3% of net earnings (PayPal + Stripe)
    return calculateNetTotal(record) * COMMISSION_RATE;
  }
  return 0;
};

const renderPlan = (planType: GiftListPaymentAnalytics['planType']) => {
  if (!planType) return <Tag>Sin Plan</Tag>;
  return <Tag color={planType === 'FIXED' ? 'green' : 'blue'}>{planType === 'FIXED' ? 'Fijo' : 'Comisión'}</Tag>;
};

const renderFeePreference = (feePreference: GiftListPaymentAnalytics['feePreference']) => (
  <Tag color={feePreference === 'couple' ? 'purple' : 'cyan'}>{feePreference === 'couple' ? 'Pareja' : 'Invitado'}</Tag>
);

export function PaymentsCommissionsAnalyticsTab({
  summary,
  isSummaryLoading,
  listsData,
  isListsLoading,
}: PaymentsCommissionsAnalyticsTabProps) {
  const [selectedGiftList, setSelectedGiftList] = useState<GiftListPaymentAnalytics | null>(null);
  const [isPaymentsModalOpen, setIsPaymentsModalOpen] = useState(false);
  const isMobile = useIsMobile();

  // Calculate totals for summary
  const totals = useMemo(() => {
    if (!listsData) return { totalNetPaypal: 0, totalNetStripe: 0, totalNetValue: 0, totalEarnings: 0 };

    let totalNetPaypal = 0;
    let totalNetStripe = 0;
    let totalEarnings = 0;

    for (const list of listsData) {
      totalNetPaypal += calculateNetPaypal(list.grossPaypal, list.feePreference);
      totalNetStripe += calculateNetStripe(list.grossStripe, list.feePreference);
      totalEarnings += calculateEarnings(list);
    }

    return {
      totalNetPaypal,
      totalNetStripe,
      totalNetValue: totalNetPaypal + totalNetStripe,
      totalEarnings,
    };
  }, [listsData]);

  // Gross totals derived from listsData so they're consistent with the detail table.
  // The summary endpoint queries the Payment table directly which can include payments
  // that aren't attributable to any list (orphaned carts), causing a mismatch.
  const grossFromLists = useMemo(() => {
    if (!listsData) return { paypal: 0, stripe: 0, total: 0 };
    return listsData.reduce(
      (acc, l) => ({
        paypal: acc.paypal + l.grossPaypal,
        stripe: acc.stripe + l.grossStripe,
        total: acc.total + l.grossTotal,
      }),
      { paypal: 0, stripe: 0, total: 0 },
    );
  }, [listsData]);

  const openPaymentsReport = (record: GiftListPaymentAnalytics) => {
    setSelectedGiftList(record);
    setIsPaymentsModalOpen(true);
  };

  const actionsColumn = {
    title: '',
    key: 'actions',
    fixed: isMobile ? undefined : ('left' as const),
    width: 40,
    align: 'center' as const,
    render: (_: unknown, record: GiftListPaymentAnalytics) => (
      <Dropdown
        trigger={['click']}
        menu={{
          items: [{ key: 'view-payments', label: 'View payments' }],
          onClick: ({ key }) => {
            if (key === 'view-payments') {
              openPaymentsReport(record);
            }
          },
        }}>
        <Button type="text" size="small" icon={<EllipsisVertical className="h-4 w-4" />} onClick={(e) => e.stopPropagation()} />
      </Dropdown>
    ),
  };

  const nameCell = (record: GiftListPaymentAnalytics) => (
    <div className="min-w-0">
      <div className="break-words font-semibold">{record.title}</div>
      <div className="break-words text-xs text-gray-500">{record.coupleName}</div>
      {record.slug && <div className="text-xs text-blue-600">/{record.slug}</div>}
    </div>
  );

  const desktopColumns: ColumnsType<GiftListPaymentAnalytics> = [
    actionsColumn,
    // Name/Title column
    {
      title: 'Lista de Regalos',
      key: 'name',
      fixed: 'left',
      width: 200,
      render: (_, record) => nameCell(record),
    },
    // Plan column
    {
      title: 'Plan',
      key: 'planType',
      width: 100,
      render: (_, record) => renderPlan(record.planType),
    },
    // Discount code column
    {
      title: 'Código Desc.',
      key: 'discountCode',
      width: 120,
      render: (_, record) => {
        if (!record.discountCode) return '-';
        return (
          <Tooltip title={`Descuento: ${formatCurrency(record.discountValue)}`}>
            <Tag color="orange">{record.discountCode}</Tag>
          </Tooltip>
        );
      },
    },
    // Gifts column
    {
      title: 'Regalos',
      key: 'gifts',
      width: 100,
      align: 'center' as const,
      render: (_, record) => (
        <Tooltip title={`${record.purchasedGifts} comprados de ${record.totalGifts}`}>
          <div>
            <div className="font-semibold">{record.totalGifts}</div>
            <div className="text-xs text-gray-500">{record.purchasedGifts} comprados</div>
          </div>
        </Tooltip>
      ),
    },
    // Fee preference column
    {
      title: 'Comisión Pago',
      key: 'feePreference',
      width: 120,
      render: (_, record) => renderFeePreference(record.feePreference),
    },
    // Gross PayPal column
    {
      title: 'Bruto PayPal',
      key: 'grossPaypal',
      width: 120,
      align: 'right' as const,
      render: (_, record) => (
        <div className={record.grossPaypal > 0 ? 'text-blue-600' : 'text-gray-400'}>{formatCurrency(record.grossPaypal)}</div>
      ),
      sorter: (a, b) => a.grossPaypal - b.grossPaypal,
    },
    // Gross Stripe column
    {
      title: 'Bruto Stripe',
      key: 'grossStripe',
      width: 120,
      align: 'right' as const,
      render: (_, record) => (
        <div className={record.grossStripe > 0 ? 'text-purple-600' : 'text-gray-400'}>{formatCurrency(record.grossStripe)}</div>
      ),
      sorter: (a, b) => a.grossStripe - b.grossStripe,
    },
    // Net PayPal column
    {
      title: 'Neto PayPal',
      key: 'netPaypal',
      width: 120,
      align: 'right' as const,
      render: (_, record) => {
        const net = calculateNetPaypal(record.grossPaypal, record.feePreference);
        return <div className={net > 0 ? 'text-blue-700 font-medium' : 'text-gray-400'}>{formatCurrency(net)}</div>;
      },
      sorter: (a, b) => calculateNetPaypal(a.grossPaypal, a.feePreference) - calculateNetPaypal(b.grossPaypal, b.feePreference),
    },
    // Net Stripe column
    {
      title: 'Neto Stripe',
      key: 'netStripe',
      width: 120,
      align: 'right' as const,
      render: (_, record) => {
        const net = calculateNetStripe(record.grossStripe, record.feePreference);
        return <div className={net > 0 ? 'text-purple-700 font-medium' : 'text-gray-400'}>{formatCurrency(net)}</div>;
      },
      sorter: (a, b) => calculateNetStripe(a.grossStripe, a.feePreference) - calculateNetStripe(b.grossStripe, b.feePreference),
    },
    // Total Net Value column
    {
      title: 'Valor Neto',
      key: 'totalNetValue',
      width: 130,
      align: 'right' as const,
      render: (_, record) => {
        const total = calculateNetTotal(record);
        return <div className={total > 0 ? 'font-semibold text-green-600' : 'text-gray-400'}>{formatCurrency(total)}</div>;
      },
      sorter: (a, b) => calculateNetTotal(a) - calculateNetTotal(b),
    },
    // MesaLista Earnings column
    {
      title: 'Ganancias',
      key: 'earnings',
      width: 130,
      align: 'right' as const,
      render: (_, record) => {
        const earnings = calculateEarnings(record);
        return (
          <Tooltip
            title={
              record.planType === 'FIXED'
                ? `Plan Fijo: ${formatCurrency(FIXED_PLAN_PRICE)} - Descuento: ${formatCurrency(record.discountValue)}`
                : 'Comisiones de procesamiento de pagos'
            }>
            <div className={earnings > 0 ? 'font-semibold text-emerald-600' : 'text-gray-400'}>{formatCurrency(earnings)}</div>
          </Tooltip>
        );
      },
      sorter: (a, b) => calculateEarnings(a) - calculateEarnings(b),
    },
    // Created date column
    {
      title: 'Creada',
      key: 'createdAt',
      width: 110,
      render: (_, record) => formatDate(record.createdAt),
      sorter: (a, b) => dayjs(a.createdAt).unix() - dayjs(b.createdAt).unix(),
    },
  ];

  // On phones the row keeps only identity + earnings; the rest of the money columns
  // move into the expandable detail panel so the table never scrolls sideways.
  const mobileColumns: ColumnsType<GiftListPaymentAnalytics> = [
    actionsColumn,
    {
      title: 'Lista de Regalos',
      key: 'name',
      render: (_, record) => nameCell(record),
    },
    {
      title: 'Ganancias',
      key: 'earnings',
      width: 96,
      align: 'right' as const,
      render: (_, record) => {
        const earnings = calculateEarnings(record);
        return (
          <div>
            <div className={earnings > 0 ? 'font-semibold text-emerald-600' : 'text-gray-400'}>{formatCurrency(earnings)}</div>
            <div className="mt-1">{renderPlan(record.planType)}</div>
          </div>
        );
      },
      sorter: (a, b) => calculateEarnings(a) - calculateEarnings(b),
    },
  ];

  const mobileDetails = (record: GiftListPaymentAnalytics) => (
    <DetailList
      items={[
        { label: 'Bruto PayPal', value: formatCurrency(record.grossPaypal) },
        { label: 'Bruto Stripe', value: formatCurrency(record.grossStripe) },
        { label: 'Neto PayPal', value: formatCurrency(calculateNetPaypal(record.grossPaypal, record.feePreference)) },
        { label: 'Neto Stripe', value: formatCurrency(calculateNetStripe(record.grossStripe, record.feePreference)) },
        { label: 'Valor Neto', value: formatCurrency(calculateNetTotal(record)) },
        { label: 'Comisión Pago', value: renderFeePreference(record.feePreference) },
        { label: 'Regalos', value: `${record.purchasedGifts} / ${record.totalGifts}` },
        {
          label: 'Código Desc.',
          value: record.discountCode ? (
            <Tooltip title={`Descuento: ${formatCurrency(record.discountValue)}`}>
              <Tag color="orange">{record.discountCode}</Tag>
            </Tooltip>
          ) : (
            '-'
          ),
        },
        { label: 'Creada', value: formatDate(record.createdAt) },
      ]}
    />
  );

  return (
    <div className="space-y-4 sm:space-y-6">
      {/* Summary Statistics */}
      <Card title="Resumen de Pagos y Comisiones" className="!shadow-sm" size={isMobile ? 'small' : 'default'}>
        {isSummaryLoading ? (
          <div className="flex justify-center py-8">
            <Spin size="large" />
          </div>
        ) : summary ? (
          <>
            <Row gutter={summaryGutter}>
              <Col xs={12} md={8} lg={6}>
                <StatCard
                  title="Total Pagos Procesados"
                  value={summary.totalPaymentsCount}
                  icon={<CreditCard className="text-blue-600" size={20} />}
                  color="#1890ff"
                  background="!bg-blue-50"
                  footer={
                    <>
                      <div>PayPal: {summary.paypalPaymentsCount}</div>
                      <div>Stripe: {summary.stripePaymentsCount}</div>
                    </>
                  }
                />
              </Col>

              <Col xs={12} md={8} lg={6}>
                <StatCard
                  title="Bruto Total"
                  value={grossFromLists.total}
                  icon={<DollarSign className="text-purple-600" size={20} />}
                  color="#722ed1"
                  background="!bg-purple-50"
                  currency
                  footer={
                    <>
                      <div>PayPal: {formatCurrency(grossFromLists.paypal)}</div>
                      <div>Stripe: {formatCurrency(grossFromLists.stripe)}</div>
                    </>
                  }
                />
              </Col>

              <Col xs={12} md={8} lg={6}>
                <StatCard
                  title="Neto Total (Parejas)"
                  value={totals.totalNetValue}
                  icon={<Wallet className="text-green-600" size={20} />}
                  color="#52c41a"
                  background="!bg-green-50"
                  currency
                  footer={
                    <>
                      <div>PayPal: {formatCurrency(totals.totalNetPaypal)}</div>
                      <div>Stripe: {formatCurrency(totals.totalNetStripe)}</div>
                    </>
                  }
                />
              </Col>

              <Col xs={12} md={8} lg={6}>
                <StatCard
                  title="Ganancias MesaLista"
                  value={totals.totalEarnings}
                  icon={<TrendingUp className="text-emerald-600" size={20} />}
                  color="#10b981"
                  background="!bg-emerald-50"
                  currency
                  footer="Planes fijos + comisiones"
                />
              </Col>
            </Row>

            <Row gutter={summaryGutter} className="mt-2 sm:mt-4">
              <Col xs={12} lg={8}>
                <StatCard
                  title="Listas de Regalos"
                  value={summary.totalGiftLists}
                  icon={<Gift className="text-orange-600" size={20} />}
                  color="#fa8c16"
                  background="!bg-orange-50"
                  footer={
                    <>
                      <div>Plan Fijo: {summary.fixedPlanLists}</div>
                      <div>Plan Comisión: {summary.commissionPlanLists}</div>
                    </>
                  }
                />
              </Col>

              <Col xs={12} lg={8}>
                <StatCard
                  title="Promedio por Pago"
                  value={summary.totalPaymentsCount > 0 ? grossFromLists.total / summary.totalPaymentsCount : 0}
                  icon={<DollarSign className="text-cyan-600" size={20} />}
                  color="#06b6d4"
                  background="!bg-cyan-50"
                  currency
                />
              </Col>

              <Col xs={12} lg={8}>
                <StatCard
                  title="% Pagos PayPal"
                  value={summary.totalPaymentsCount > 0 ? (summary.paypalPaymentsCount / summary.totalPaymentsCount) * 100 : 0}
                  icon={<Percent className="text-indigo-600" size={20} />}
                  color="#6366f1"
                  background="!bg-indigo-50"
                  suffix="%"
                  precision={1}
                />
              </Col>
            </Row>
          </>
        ) : (
          <div className="text-center text-gray-500 py-8">No hay datos disponibles</div>
        )}
      </Card>

      {/* Gift Lists Payment Table */}
      <Card
        title="Detalle de Pagos por Lista de Regalos"
        className="!shadow-sm"
        size={isMobile ? 'small' : 'default'}
        styles={isMobile ? { body: { padding: 8 } } : undefined}>
        <Table
          columns={isMobile ? mobileColumns : desktopColumns}
          dataSource={listsData}
          loading={isListsLoading}
          rowKey="id"
          size={isMobile ? 'small' : 'middle'}
          scroll={isMobile ? undefined : { x: 1900 }}
          expandable={isMobile ? { expandedRowRender: mobileDetails, expandRowByClick: true } : undefined}
          pagination={{
            pageSize: 10,
            size: isMobile ? 'small' : 'default',
            showSizeChanger: !isMobile,
            showTotal: isMobile ? undefined : (total) => `Total: ${total} listas`,
          }}
        />
      </Card>

      <GiftPaymentsReportModal
        open={isPaymentsModalOpen}
        selectedGiftList={selectedGiftList}
        onClose={() => {
          setIsPaymentsModalOpen(false);
          setSelectedGiftList(null);
        }}
      />
    </div>
  );
}
