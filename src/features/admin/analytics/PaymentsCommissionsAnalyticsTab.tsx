import { Card, Statistic, Row, Col, Spin, Table, Tag, Tooltip } from 'antd';
import { DollarSign, CreditCard, Wallet, TrendingUp, Percent, Gift } from 'lucide-react';
import dayjs from 'dayjs';
import type { ColumnsType } from 'antd/es/table';
import type { GiftListPaymentAnalytics, PaymentAnalyticsSummary } from 'services/paymentAnalytics.service';
import { stripeMexicoBreakdown, paypalMexicoBreakdown } from 'utils/feeUtils';

interface PaymentsCommissionsAnalyticsTabProps {
  summary: PaymentAnalyticsSummary | undefined;
  isSummaryLoading: boolean;
  listsData: GiftListPaymentAnalytics[] | undefined;
  isListsLoading: boolean;
}

// Fixed plan price
const FIXED_PLAN_PRICE = 2000;
const COMMISSION_RATE = 0.03;

export function PaymentsCommissionsAnalyticsTab({
  summary,
  isSummaryLoading,
  listsData,
  isListsLoading,
}: PaymentsCommissionsAnalyticsTabProps) {
  // Format currency
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('es-MX', {
      style: 'currency',
      currency: 'MXN',
    }).format(amount);
  };

  // Format date
  const formatDate = (date: string) => {
    return dayjs(date).format('DD/MMM/YYYY');
  };

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

  // Calculate MesaLista earnings for a gift list
  const calculateEarnings = (record: GiftListPaymentAnalytics) => {
    if (record.planType === 'FIXED') {
      // Fixed plan: 2000 - discount applied
      return FIXED_PLAN_PRICE - record.discountValue;
    } else if (record.planType === 'COMMISSION') {
      // Commission plan: 3% of net earnings (PayPal + Stripe)
      const netPaypal = calculateNetPaypal(record.grossPaypal, record.feePreference);
      const netStripe = calculateNetStripe(record.grossStripe, record.feePreference);
      const netTotal = netPaypal + netStripe;

      return netTotal * COMMISSION_RATE;
    }
    return 0;
  };

  // Calculate totals for summary
  const calculateTotals = () => {
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
  };

  const totals = calculateTotals();

  const columns: ColumnsType<GiftListPaymentAnalytics> = [
    // Name/Title column
    {
      title: 'Lista de Regalos',
      key: 'name',
      fixed: 'left',
      width: 200,
      render: (_, record) => (
        <div>
          <div className="font-semibold">{record.title}</div>
          <div className="text-xs text-gray-500">{record.coupleName}</div>
          {record.slug && <div className="text-xs text-blue-600">/{record.slug}</div>}
        </div>
      ),
    },
    // Plan column
    {
      title: 'Plan',
      key: 'planType',
      width: 100,
      render: (_, record) => {
        if (!record.planType) return <Tag>Sin Plan</Tag>;
        return <Tag color={record.planType === 'FIXED' ? 'green' : 'blue'}>{record.planType === 'FIXED' ? 'Fijo' : 'Comisión'}</Tag>;
      },
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
      render: (_, record) => (
        <Tag color={record.feePreference === 'couple' ? 'purple' : 'cyan'}>{record.feePreference === 'couple' ? 'Pareja' : 'Invitado'}</Tag>
      ),
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
        const netPaypal = calculateNetPaypal(record.grossPaypal, record.feePreference);
        const netStripe = calculateNetStripe(record.grossStripe, record.feePreference);
        const total = netPaypal + netStripe;
        return <div className={total > 0 ? 'font-semibold text-green-600' : 'text-gray-400'}>{formatCurrency(total)}</div>;
      },
      sorter: (a, b) => {
        const totalA = calculateNetPaypal(a.grossPaypal, a.feePreference) + calculateNetStripe(a.grossStripe, a.feePreference);
        const totalB = calculateNetPaypal(b.grossPaypal, b.feePreference) + calculateNetStripe(b.grossStripe, b.feePreference);
        return totalA - totalB;
      },
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

  return (
    <div className="space-y-6">
      {/* Summary Statistics */}
      <Card title="Resumen de Pagos y Comisiones" className="!shadow-sm">
        {isSummaryLoading ? (
          <div className="flex justify-center py-8">
            <Spin size="large" />
          </div>
        ) : summary ? (
          <>
            <Row gutter={[16, 16]}>
              <Col xs={24} sm={12} md={8} lg={6}>
                <Card className="!bg-blue-50">
                  <Statistic
                    title="Total Pagos Procesados"
                    value={summary.totalPaymentsCount}
                    prefix={<CreditCard className="text-blue-600" size={20} />}
                    valueStyle={{ color: '#1890ff' }}
                  />
                  <div className="mt-2 text-xs text-gray-600">
                    <div>PayPal: {summary.paypalPaymentsCount}</div>
                    <div>Stripe: {summary.stripePaymentsCount}</div>
                  </div>
                </Card>
              </Col>

              <Col xs={24} sm={12} md={8} lg={6}>
                <Card className="!bg-purple-50">
                  <Statistic
                    title="Bruto Total"
                    value={summary.totalGrossPayments}
                    prefix={<DollarSign className="text-purple-600" size={20} />}
                    valueStyle={{ color: '#722ed1' }}
                    formatter={(value) => formatCurrency(Number(value))}
                  />
                  <div className="mt-2 text-xs text-gray-600">
                    <div>PayPal: {formatCurrency(summary.totalGrossPaypal)}</div>
                    <div>Stripe: {formatCurrency(summary.totalGrossStripe)}</div>
                  </div>
                </Card>
              </Col>

              <Col xs={24} sm={12} md={8} lg={6}>
                <Card className="!bg-green-50">
                  <Statistic
                    title="Neto Total (Parejas)"
                    value={totals.totalNetValue}
                    prefix={<Wallet className="text-green-600" size={20} />}
                    valueStyle={{ color: '#52c41a' }}
                    formatter={(value) => formatCurrency(Number(value))}
                  />
                  <div className="mt-2 text-xs text-gray-600">
                    <div>PayPal: {formatCurrency(totals.totalNetPaypal)}</div>
                    <div>Stripe: {formatCurrency(totals.totalNetStripe)}</div>
                  </div>
                </Card>
              </Col>

              <Col xs={24} sm={12} md={8} lg={6}>
                <Card className="!bg-emerald-50">
                  <Statistic
                    title="Ganancias MesaLista"
                    value={totals.totalEarnings}
                    prefix={<TrendingUp className="text-emerald-600" size={20} />}
                    valueStyle={{ color: '#10b981', fontSize: '24px' }}
                    formatter={(value) => formatCurrency(Number(value))}
                  />
                  <div className="mt-2 text-xs text-gray-600">Planes fijos + comisiones</div>
                </Card>
              </Col>
            </Row>

            <Row gutter={[16, 16]} className="mt-4">
              <Col xs={24} sm={12} lg={8}>
                <Card className="!bg-orange-50">
                  <Statistic
                    title="Listas de Regalos"
                    value={summary.totalGiftLists}
                    prefix={<Gift className="text-orange-600" size={20} />}
                    valueStyle={{ color: '#fa8c16' }}
                  />
                  <div className="mt-2 text-xs text-gray-600">
                    <div>Plan Fijo: {summary.fixedPlanLists}</div>
                    <div>Plan Comisión: {summary.commissionPlanLists}</div>
                  </div>
                </Card>
              </Col>

              <Col xs={24} sm={12} lg={8}>
                <Card className="!bg-cyan-50">
                  <Statistic
                    title="Promedio por Pago"
                    value={summary.totalPaymentsCount > 0 ? summary.totalGrossPayments / summary.totalPaymentsCount : 0}
                    prefix={<DollarSign className="text-cyan-600" size={20} />}
                    valueStyle={{ color: '#06b6d4' }}
                    formatter={(value) => formatCurrency(Number(value))}
                  />
                </Card>
              </Col>

              <Col xs={24} sm={12} lg={8}>
                <Card className="!bg-indigo-50">
                  <Statistic
                    title="% Pagos PayPal"
                    value={summary.totalPaymentsCount > 0 ? (summary.paypalPaymentsCount / summary.totalPaymentsCount) * 100 : 0}
                    prefix={<Percent className="text-indigo-600" size={20} />}
                    valueStyle={{ color: '#6366f1' }}
                    suffix="%"
                    precision={1}
                  />
                </Card>
              </Col>
            </Row>
          </>
        ) : (
          <div className="text-center text-gray-500 py-8">No hay datos disponibles</div>
        )}
      </Card>

      {/* Gift Lists Payment Table */}
      <Card title="Detalle de Pagos por Lista de Regalos" className="!shadow-sm">
        <Table
          columns={columns}
          dataSource={listsData}
          loading={isListsLoading}
          rowKey="id"
          scroll={{ x: 1800 }}
          pagination={{
            pageSize: 10,
            showSizeChanger: true,
            showTotal: (total) => `Total: ${total} listas`,
          }}
        />
      </Card>
    </div>
  );
}
