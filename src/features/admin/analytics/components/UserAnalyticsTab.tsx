import { Card, Statistic, Row, Col, Spin, Table, Alert, Select, Tag, Tooltip as AntTooltip } from 'antd';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { Users, UserCheck, ShoppingCart, Gift, FileText, AlertTriangle, AlertCircle, Eye, Send, Wallet, Info } from 'lucide-react';
import dayjs from 'dayjs';

const { Option } = Select;

type MetricType =
  | 'visitors'
  | 'signIns'
  | 'registryAttempts'
  | 'signupsCompleted'
  | 'draftsCreated'
  | 'giftsAdded'
  | 'registriesPublished'
  | 'cartsWithItems'
  | 'startCheckouts'
  | 'giftPurchases';

const METRIC_LABELS: Record<MetricType, string> = {
  visitors: 'Visitantes',
  signIns: 'Inicios de sesión',
  registryAttempts: 'Intentos de registro',
  signupsCompleted: 'Registros completados',
  draftsCreated: 'Mesas creadas',
  giftsAdded: 'Regalos agregados',
  registriesPublished: 'Mesas publicadas',
  cartsWithItems: 'Carritos con regalos',
  startCheckouts: 'Checkouts iniciados',
  giftPurchases: 'Regalos comprados',
};

interface UserAnalyticsTabProps {
  summary: any;
  isSummaryLoading: boolean;
  timeSeriesData: any;
  isTimeSeriesLoading: boolean;
  funnelBreakdown: any;
  isFunnelLoading: boolean;
  alerts: any;
  selectedMetric: MetricType;
  onMetricChange: (metric: MetricType) => void;
  /** When a single mesa is selected the couple-side funnel is site-wide noise, so it is hidden. */
  isListFiltered?: boolean;
}

interface FunnelStep {
  name: string;
  hint: string;
  value: number;
  color: string;
}

const formatCurrency = (amount: number) =>
  new Intl.NumberFormat('es-MX', {
    style: 'currency',
    currency: 'MXN',
    maximumFractionDigits: 0,
  }).format(amount || 0);

/**
 * A funnel step: absolute count, share of the step above it, and how many were
 * lost there. The drop between two steps is the number worth acting on.
 */
function FunnelChart({ steps }: { steps: FunnelStep[] }) {
  const top = steps[0]?.value || 0;

  return (
    <div className="space-y-4">
      {steps.map((step, index) => {
        const previous = index === 0 ? step.value : steps[index - 1].value;
        const stepRate = previous > 0 ? (step.value / previous) * 100 : 0;
        const overallRate = top > 0 ? (step.value / top) * 100 : 0;
        const lost = Math.max(0, previous - step.value);

        return (
          <div key={step.name}>
            <div className="flex justify-between items-baseline mb-1">
              <span className="text-sm font-medium text-gray-700">
                {step.name}
                <AntTooltip title={step.hint}>
                  <Info className="inline ml-1 text-gray-300" size={12} />
                </AntTooltip>
              </span>
              <span className="text-sm">
                <span className="font-semibold text-gray-900">{step.value.toLocaleString('es-MX')}</span>
                {index > 0 && <span className="text-gray-400 ml-2 text-xs">{stepRate.toFixed(1)}% del paso anterior</span>}
              </span>
            </div>
            <div className="h-7 w-full bg-gray-100 rounded-md overflow-hidden">
              <div
                className="h-full rounded-md transition-all duration-500"
                style={{ width: `${Math.max(overallRate, step.value > 0 ? 2 : 0)}%`, backgroundColor: step.color }}
              />
            </div>
            {index > 0 && lost > 0 && (
              <div className="text-xs text-red-500 mt-1">
                −{lost.toLocaleString('es-MX')} se perdieron aquí ({(100 - stepRate).toFixed(1)}%)
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}

export function UserAnalyticsTab({
  summary,
  isSummaryLoading,
  timeSeriesData,
  isTimeSeriesLoading,
  funnelBreakdown,
  isFunnelLoading,
  alerts,
  selectedMetric,
  onMetricChange,
  isListFiltered = false,
}: UserAnalyticsTabProps) {
  if (isSummaryLoading || !summary) {
    return (
      <div className="flex justify-center items-center h-64">
        <Spin size="large" />
      </div>
    );
  }

  // Couple side: from landing on the site to a published mesa that can take money.
  const coupleFunnel: FunnelStep[] = [
    { name: 'Visitantes', hint: 'Sesiones únicas con al menos una vista de página.', value: summary.visitors || 0, color: '#8884d8' },
    {
      name: 'Vieron precios',
      hint: 'Sesiones que abrieron la página de precios.',
      value: summary.viewPricing || 0,
      color: '#a4a0e8',
    },
    {
      name: 'Intentaron crear mesa',
      hint: 'Sesiones que enviaron el primer paso del formulario de registro.',
      value: summary.registryAttempts || 0,
      color: '#82ca9d',
    },
    {
      name: 'Completaron el registro',
      hint: 'Cuentas de pareja creadas en el período (tabla users). El registro crea la mesa en la misma transacción.',
      value: summary.signupsCompleted || 0,
      color: '#6dc48a',
    },
    {
      name: 'Agregaron al menos 1 regalo',
      hint: 'Mesas creadas en el período que ya tienen regalos. Una mesa vacía nunca se publica.',
      value: summary.draftsWithGifts || 0,
      color: '#ffc658',
    },
    {
      name: 'Publicaron la mesa',
      hint: 'Mesas con published_at en el período. Es el momento en que la mesa puede recibir dinero.',
      value: summary.registriesPublished || 0,
      color: '#ff9f40',
    },
  ];

  // Guest side: from opening someone's mesa to money actually collected.
  const guestFunnel: FunnelStep[] = [
    {
      name: 'Vieron una mesa',
      hint: 'Sesiones únicas que abrieron una mesa pública o su página de regalos.',
      value: summary.registryViewers || 0,
      color: '#8884d8',
    },
    {
      name: 'Agregaron al carrito',
      hint: 'Carritos que recibieron al menos un regalo en el período (tabla cart_items).',
      value: summary.cartsWithItems || 0,
      color: '#4dabf7',
    },
    {
      name: 'Iniciaron checkout',
      hint: 'Carritos únicos que llegaron a la pantalla de pago (evento START_CHECKOUT).',
      value: summary.startCheckouts || 0,
      color: '#38d9a9',
    },
    {
      name: 'Compraron',
      hint: 'Pagos liquidados en el período (payments con status PAID).',
      value: summary.giftPurchases || 0,
      color: '#ff7c7c',
    },
  ];

  return (
    <>
      {/* Alerts Section */}
      {alerts && alerts.alerts.length > 0 && (
        <Card className="mb-6">
          <div className="space-y-3">
            {alerts.alerts.map((alert: any, index: number) => (
              <Alert
                key={index}
                message={alert.message}
                type={alert.severity === 'critical' ? 'error' : 'warning'}
                icon={alert.severity === 'critical' ? <AlertCircle /> : <AlertTriangle />}
                showIcon
              />
            ))}
          </div>
        </Card>
      )}

      {/* Row 1: the couple side — does the product get mesas built and published? */}
      <div className="text-xs uppercase tracking-wide text-gray-400 mb-2 font-semibold">Parejas</div>
      <Row gutter={[16, 16]} className="mb-6">
        <Col xs={24} sm={12} lg={6}>
          <Card>
            <Statistic title="Visitantes" value={summary.visitors || 0} prefix={<Users className="text-blue-500" />} />
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <Card>
            <Statistic
              title="Intentaron crear mesa"
              value={summary.registryAttempts || 0}
              prefix={<FileText className="text-purple-500" />}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <Card>
            <Statistic
              title="Completaron el registro"
              value={summary.signupsCompleted || 0}
              prefix={<UserCheck className="text-green-500" />}
              suffix={<span className="text-sm text-gray-400">({(summary.attemptToSignupRate || 0).toFixed(1)}%)</span>}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <Card>
            <Statistic
              title="Mesas publicadas"
              value={summary.registriesPublished || 0}
              prefix={<Send className="text-orange-500" />}
              suffix={<span className="text-sm text-gray-400">({(summary.draftToPublishRate || 0).toFixed(1)}%)</span>}
            />
            <div className="mt-2 flex gap-2">
              <Tag color="gold">Fijo: {summary.publishedFixed || 0}</Tag>
              <Tag color="blue">Comisión: {summary.publishedCommission || 0}</Tag>
            </div>
          </Card>
        </Col>
      </Row>

      {/* Row 2: the guest side — does the mesa actually collect money? */}
      <div className="text-xs uppercase tracking-wide text-gray-400 mb-2 font-semibold">Invitados</div>
      <Row gutter={[16, 16]} className="mb-6">
        <Col xs={24} sm={12} lg={6}>
          <Card>
            <Statistic title="Vieron una mesa" value={summary.registryViewers || 0} prefix={<Eye className="text-indigo-500" />} />
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <Card>
            <Statistic
              title="Carritos con regalos"
              value={summary.cartsWithItems || 0}
              prefix={<ShoppingCart className="text-cyan-500" />}
              suffix={<span className="text-sm text-gray-400">({(summary.cartToPurchaseRate || 0).toFixed(1)}% compra)</span>}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <Card>
            <Statistic
              title="Regalos comprados"
              value={summary.giftPurchases || 0}
              prefix={<Gift className="text-pink-500" />}
              suffix={<span className="text-sm text-gray-400">({summary.giftsSold || 0} regalos)</span>}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <Card>
            <Statistic
              title="Monto recaudado"
              value={formatCurrency(summary.giftPurchaseAmount || 0)}
              prefix={<Wallet className="text-emerald-500" />}
              valueStyle={{ color: '#3f8600' }}
            />
          </Card>
        </Col>
      </Row>

      {/* Row 3: where the money leaks out */}
      <Row gutter={[16, 16]} className="mb-6">
        <Col xs={24} sm={12} lg={8}>
          <Card>
            <Statistic
              title="Checkouts abandonados"
              value={summary.checkoutAbandonments || 0}
              prefix={<AlertTriangle className="text-red-500" />}
              suffix={<span className="text-sm text-gray-400">({(summary.checkoutAbandonmentRate || 0).toFixed(1)}%)</span>}
              valueStyle={{ color: (summary.checkoutAbandonmentRate || 0) > 50 ? '#cf1322' : '#3f8600' }}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={8}>
          <Card>
            <Statistic
              title="Errores de checkout"
              value={summary.checkoutErrors || 0}
              prefix={<AlertCircle className="text-red-400" />}
              valueStyle={{ color: (summary.checkoutErrors || 0) > 0 ? '#cf1322' : undefined }}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={8}>
          <Card>
            <Statistic
              title="Regalos agregados a mesas"
              value={summary.giftsAdded || 0}
              prefix={<Gift className="text-amber-500" />}
              suffix={<span className="text-sm text-gray-400">({(summary.draftActivationRate || 0).toFixed(1)}% de mesas activas)</span>}
            />
          </Card>
        </Col>
      </Row>

      {/* Funnels */}
      <Row gutter={[16, 16]} className="mb-6">
        {!isListFiltered && (
          <Col xs={24} lg={12}>
            <Card title="Embudo de parejas: de visita a mesa publicada">
              <FunnelChart steps={coupleFunnel} />
            </Card>
          </Col>
        )}
        <Col xs={24} lg={isListFiltered ? 24 : 12}>
          <Card title="Embudo de invitados: de ver la mesa a pagar">
            <FunnelChart steps={guestFunnel} />
          </Card>
        </Col>
      </Row>

      {/* Time Series Chart */}
      <Card
        title="Tendencia Histórica"
        extra={
          <Select className="!shadow-sm !rounded-md" value={selectedMetric} onChange={onMetricChange} style={{ width: 240 }}>
            {(Object.keys(METRIC_LABELS) as MetricType[]).map((metric) => (
              <Option key={metric} value={metric}>
                {METRIC_LABELS[metric]}
              </Option>
            ))}
          </Select>
        }>
        {isTimeSeriesLoading ? (
          <div className="flex justify-center items-center h-64">
            <Spin />
          </div>
        ) : (
          <ResponsiveContainer width="100%" height={400}>
            <LineChart data={timeSeriesData?.data || []}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="date" tickFormatter={(value: string) => dayjs(value).format('MMM DD')} />
              <YAxis />
              <Tooltip />
              <Legend />
              <Line type="monotone" dataKey="value" stroke="#8884d8" strokeWidth={2} name={METRIC_LABELS[selectedMetric]} />
            </LineChart>
          </ResponsiveContainer>
        )}
      </Card>

      {/* Funnel Breakdown Table */}
      <Card title="Desglose del Embudo por Fuente" className="mb-6">
        {isFunnelLoading ? (
          <div className="flex justify-center items-center h-64">
            <Spin />
          </div>
        ) : funnelBreakdown && funnelBreakdown.breakdown?.length > 0 ? (
          <div className="overflow-x-auto">
            <Table
              dataSource={funnelBreakdown.breakdown}
              pagination={false}
              rowKey={(record: any) => record.dimension}
              columns={[
                {
                  title: funnelBreakdown.dimension === 'utm_source' ? 'Fuente UTM' : 'Página de Aterrizaje',
                  dataIndex: 'dimension',
                  key: 'dimension',
                  render: (val: string) => <span className="font-medium">{val || '(directo)'}</span>,
                },
                {
                  title: 'Visitantes',
                  dataIndex: 'visitors',
                  key: 'visitors',
                  align: 'right',
                },
                {
                  title: 'Inicios de Sesión',
                  dataIndex: 'signIns',
                  key: 'signIns',
                  align: 'right',
                  render: (val: number, record: any) => (
                    <span>
                      {val} <span className="text-gray-400 text-xs">({record.signInRate.toFixed(1)}%)</span>
                    </span>
                  ),
                },
                {
                  title: 'Intentos de Registro',
                  dataIndex: 'registryAttempts',
                  key: 'registryAttempts',
                  align: 'right',
                  render: (val: number, record: any) => (
                    <span>
                      {val} <span className="text-gray-400 text-xs">({record.registryAttemptRate.toFixed(1)}%)</span>
                    </span>
                  ),
                },
                {
                  title: 'Compras de Mesa',
                  dataIndex: 'registryPurchases',
                  key: 'registryPurchases',
                  align: 'right',
                  render: (val: number, record: any) => (
                    <span className="font-semibold text-green-600">
                      {val} <span className="text-gray-400 text-xs">({record.registryConversionRate.toFixed(1)}%)</span>
                    </span>
                  ),
                },
                {
                  title: 'Compras de Regalos',
                  dataIndex: 'giftPurchases',
                  key: 'giftPurchases',
                  align: 'right',
                  render: (val: number, record: any) => (
                    <span className="font-semibold text-pink-600">
                      {val} <span className="text-gray-400 text-xs">({record.giftConversionRate.toFixed(1)}%)</span>
                    </span>
                  ),
                },
                {
                  title: 'Abandonos',
                  dataIndex: 'checkoutAbandonments',
                  key: 'checkoutAbandonments',
                  align: 'right',
                  render: (val: number, record: any) => (
                    <span className={record.abandonmentRate > 50 ? 'text-red-600 font-semibold' : ''}>
                      {val} <span className="text-gray-400 text-xs">({record.abandonmentRate.toFixed(1)}%)</span>
                    </span>
                  ),
                },
              ]}
            />
          </div>
        ) : (
          <div className="text-center text-gray-500 py-8">No hay datos de embudo disponibles</div>
        )}
      </Card>
    </>
  );
}
