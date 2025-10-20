import { useState, useMemo } from 'react';
import { Card, DatePicker, Select, Statistic, Row, Col, Spin, Table, Alert, Tabs } from 'antd';
import { LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, Cell } from 'recharts';
import { TrendingUp, Users, UserCheck, ShoppingCart, Gift, Clock, FileText, AlertTriangle, AlertCircle } from 'lucide-react';
import { useMetricsSummary, useTimeSeries, useFunnelBreakdown, useMetricAlerts } from 'hooks/useAnalytics';
import { useWeddingLists } from 'hooks/useWeddingList';
import dayjs, { Dayjs } from 'dayjs';

const { RangePicker } = DatePicker;
const { Option } = Select;

type DateRange = 'today' | 'last7days' | 'last30days' | 'custom';
type MetricType =
  | 'visitors'
  | 'signIns'
  | 'registryAttempts'
  | 'registryPurchases'
  | 'giftPurchases'
  | 'viewPricing'
  | 'viewRegistryBuilder'
  | 'startCheckouts';
type FunnelDimension = 'utm_source' | 'landing_page';

export function Analytics() {
  const [dateRange, setDateRange] = useState<DateRange>('last30days');
  const [customDates, setCustomDates] = useState<[Dayjs, Dayjs] | null>(null);
  const [selectedMetric, setSelectedMetric] = useState<MetricType>('visitors');
  const [funnelDimension, setFunnelDimension] = useState<FunnelDimension>('landing_page');
  const [selectedWeddingListId, setSelectedWeddingListId] = useState<number | undefined>(undefined);

  // Calculate date range - memoized to prevent infinite loops
  const { from, to } = useMemo(() => {
    const now = dayjs();
    let from: Dayjs;
    let to: Dayjs = now;

    switch (dateRange) {
      case 'today':
        from = now.startOf('day');
        break;
      case 'last7days':
        from = now.subtract(7, 'days').startOf('day');
        break;
      case 'last30days':
        from = now.subtract(30, 'days').startOf('day');
        break;
      case 'custom':
        if (customDates) {
          from = customDates[0];
          to = customDates[1];
        } else {
          from = now.subtract(30, 'days').startOf('day');
        }
        break;
      default:
        from = now.subtract(30, 'days').startOf('day');
    }

    return {
      from: from.toISOString(),
      to: to.toISOString(),
    };
  }, [dateRange, customDates]);

  // Fetch data
  const { data: weddingLists } = useWeddingLists();
  const { data: summary, isLoading: isSummaryLoading } = useMetricsSummary(from, to, selectedWeddingListId);
  const { data: timeSeriesData, isLoading: isTimeSeriesLoading } = useTimeSeries(
    selectedMetric as 'visitors' | 'signIns' | 'registryAttempts' | 'registryPurchases' | 'giftPurchases',
    from,
    to,
    'daily',
  );
  const { data: funnelBreakdown, isLoading: isFunnelLoading } = useFunnelBreakdown(funnelDimension, from, to);
  const { data: alerts } = useMetricAlerts();

  // Prepare funnel data - Split into two separate funnels
  const registryOwnerFunnel = summary
    ? [
        { name: 'Visitantes', value: summary.visitors, color: '#8884d8' },
        { name: 'Vistas de Precios', value: summary.viewPricing, color: '#a4de6c' },
        { name: 'Intentos de Registro', value: summary.registryAttempts, color: '#82ca9d' },
        { name: 'Compras de Mesa', value: summary.registryPurchases, color: '#ffc658' },
      ]
    : [];

  const giftBuyerFunnel = summary
    ? [
        { name: 'Visitantes', value: summary.visitors, color: '#8884d8' },
        { name: 'Compras de Regalos', value: summary.giftPurchases, color: '#ff7c7c' },
      ]
    : [];

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-2">Analytics Dashboard</h1>
          <p className="text-gray-600">Visualiza el embudo de conversión y métricas clave</p>
        </div>

        {/* Filters */}
        <Card className="!mb-6">
          <div className="flex flex-wrap gap-4 items-center">
            <Select
              className="!shadow-sm !rounded-md"
              value={dateRange}
              onChange={(value) => setDateRange(value as DateRange)}
              style={{ width: 200 }}>
              <Option value="today">Hoy</Option>
              <Option value="last7days">Últimos 7 días</Option>
              <Option value="last30days">Últimos 30 días</Option>
              <Option value="custom">Rango personalizado</Option>
            </Select>

            {dateRange === 'custom' && (
              <RangePicker value={customDates} onChange={(dates) => setCustomDates(dates as [Dayjs, Dayjs])} format="YYYY-MM-DD" />
            )}

            <Select
              className="!shadow-sm !rounded-md"
              value={selectedWeddingListId}
              onChange={(value) => setSelectedWeddingListId(value)}
              placeholder="Filtrar por mesa de regalos"
              allowClear
              showSearch
              filterOption={(input, option) => {
                const label = option?.children?.toString() || '';
                return label.toLowerCase().includes(input.toLowerCase());
              }}
              style={{ width: 280 }}>
              <Option value={undefined}>Todas las mesas de regalos</Option>
              {weddingLists?.map((list: any) => (
                <Option key={list.id} value={list.id}>
                  {list.coupleName}
                </Option>
              ))}
            </Select>
          </div>
        </Card>

        {isSummaryLoading ? (
          <div className="flex justify-center items-center h-64">
            <Spin size="large" />
          </div>
        ) : (
          <>
            {/* Alerts Section */}
            {alerts && alerts.alerts.length > 0 && (
              <Card className="mb-6">
                <div className="space-y-3">
                  {alerts.alerts.map((alert, index) => (
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

            {/* Summary Cards - Row 1: Core Metrics */}
            <Row gutter={[16, 16]} className="mb-6">
              <Col xs={24} sm={12} lg={6}>
                <Card>
                  <Statistic
                    title="Visitantes"
                    value={summary?.visitors || 0}
                    prefix={<Users className="text-blue-500" />}
                    valueStyle={{ color: '#3f8600' }}
                  />
                </Card>
              </Col>
              <Col xs={24} sm={12} lg={6}>
                <Card>
                  <Statistic
                    title="Inicios de Sesión"
                    value={summary?.signIns || 0}
                    prefix={<UserCheck className="text-green-500" />}
                    suffix={`(${summary?.signInRate.toFixed(1)}%)`}
                  />
                </Card>
              </Col>
              <Col xs={24} sm={12} lg={6}>
                <Card>
                  <Statistic
                    title="Compras de Mesa"
                    value={summary?.registryPurchases || 0}
                    prefix={<ShoppingCart className="text-orange-500" />}
                    suffix={`(${summary?.registryPurchaseRate.toFixed(1)}%)`}
                  />
                </Card>
              </Col>
              <Col xs={24} sm={12} lg={6}>
                <Card>
                  <Statistic
                    title="Compras de Regalos"
                    value={summary?.giftPurchases || 0}
                    prefix={<Gift className="text-red-500" />}
                    suffix={`(${summary?.giftPurchaseRate.toFixed(1)}%)`}
                  />
                </Card>
              </Col>
            </Row>

            {/* Summary Cards - Row 2: Signup Funnel Metrics */}
            <Row gutter={[16, 16]} className="mb-6">
              <Col xs={24} sm={12} lg={8}>
                <Card>
                  <Statistic
                    title="Intentos de Registro"
                    value={summary?.registryAttempts || 0}
                    prefix={<UserCheck className="text-indigo-500" />}
                    valueStyle={{ color: '#5b21b6' }}
                  />
                  <div className="text-xs text-gray-500 mt-2">Usuarios que visitaron página /registro</div>
                </Card>
              </Col>
              <Col xs={24} sm={12} lg={8}>
                <Card>
                  <Statistic
                    title="Tasa de Intento de Registro"
                    value={summary && summary.viewPricing > 0 ? ((summary.registryAttempts / summary.viewPricing) * 100).toFixed(1) : 0}
                    suffix="%"
                    prefix={<TrendingUp className="text-blue-500" />}
                    valueStyle={{ color: '#1d4ed8' }}
                  />
                  <div className="text-xs text-gray-500 mt-2">Intentos / Vistas de precios</div>
                </Card>
              </Col>
              <Col xs={24} sm={12} lg={8}>
                <Card>
                  <Statistic
                    title="Tasa de Completado de Registro"
                    value={
                      summary && summary.registryAttempts > 0
                        ? ((summary.registryPurchases / summary.registryAttempts) * 100).toFixed(1)
                        : 0
                    }
                    suffix="%"
                    prefix={<TrendingUp className="text-green-500" />}
                    valueStyle={{
                      color:
                        summary && summary.registryAttempts > 0 && (summary.registryPurchases / summary.registryAttempts) * 100 < 30
                          ? '#cf1322'
                          : '#3f8600',
                    }}
                  />
                  <div className="text-xs text-gray-500 mt-2">Compras / Intentos de registro</div>
                </Card>
              </Col>
            </Row>

            {/* Summary Cards - Row 3: Session & Checkout Metrics */}
            <Row gutter={[16, 16]} className="mb-6">
              <Col xs={24} sm={12} lg={8}>
                <Card>
                  <Statistic
                    title="Abandono de Checkout"
                    value={summary?.checkoutAbandonmentRate.toFixed(1) || 0}
                    suffix="%"
                    prefix={<AlertTriangle className="text-yellow-500" />}
                    valueStyle={{ color: summary && summary.checkoutAbandonmentRate > 50 ? '#cf1322' : '#faad14' }}
                  />
                  <div className="text-xs text-gray-500 mt-2">
                    {summary?.checkoutAbandonments || 0} abandonos de {summary?.startCheckouts || 0} inicios
                  </div>
                </Card>
              </Col>
              <Col xs={24} sm={12} lg={8}>
                <Card>
                  <Statistic
                    title="Páginas por Sesión"
                    value={summary?.avgPagesPerSession.toFixed(1) || 0}
                    prefix={<FileText className="text-purple-500" />}
                    valueStyle={{ color: '#722ed1' }}
                  />
                </Card>
              </Col>
              <Col xs={24} sm={12} lg={8}>
                <Card>
                  <Statistic
                    title="Duración Promedio"
                    value={summary ? Math.round(summary.avgSessionDurationMs / 1000 / 60) : 0}
                    suffix="min"
                    prefix={<Clock className="text-cyan-500" />}
                    valueStyle={{ color: '#13c2c2' }}
                  />
                </Card>
              </Col>
            </Row>

            {/* Funnel Visualizations - Split into two separate funnels */}
            <Row gutter={[16, 16]} className="mb-6">
              {/* Registry Owner Funnel */}
              <Col xs={24} lg={12}>
                <Card title="Creación de Mesa de Regalos" className="h-full">
                  <ResponsiveContainer width="100%" height={300}>
                    <BarChart data={registryOwnerFunnel} layout="vertical">
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis type="number" />
                      <YAxis dataKey="name" type="category" width={120} />
                      <Tooltip />
                      <Bar dataKey="value">
                        {registryOwnerFunnel.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.color} />
                        ))}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>

                  {/* Conversion Rates for Registry Owners */}
                  <div className="mt-4 space-y-2">
                    <div className="bg-blue-50 p-2 rounded-lg">
                      <div className="flex items-center gap-2 mb-1">
                        <TrendingUp className="text-blue-600" size={16} />
                        <span className="font-semibold text-gray-700 text-xs">Precios → Intento</span>
                      </div>
                      <div className="text-lg font-bold text-blue-600">
                        {summary && summary.viewPricing > 0 ? ((summary.registryAttempts / summary.viewPricing) * 100).toFixed(1) : 0}%
                      </div>
                      <div className="text-xs text-gray-600">Intentos de registro / Vistas de precios</div>
                    </div>

                    <div className="bg-green-50 p-2 rounded-lg">
                      <div className="flex items-center gap-2 mb-1">
                        <TrendingUp className="text-green-600" size={16} />
                        <span className="font-semibold text-gray-700 text-xs">Intento de registro → Compra</span>
                      </div>
                      <div className="text-lg font-bold text-green-600">
                        {summary && summary.registryAttempts > 0
                          ? ((summary.registryPurchases / summary.registryAttempts) * 100).toFixed(1)
                          : 0}
                        %
                      </div>
                      <div className="text-xs text-gray-600">Compras / Intentos de registro</div>
                    </div>

                    <div className="bg-orange-50 p-2 rounded-lg">
                      <div className="flex items-center gap-2 mb-1">
                        <TrendingUp className="text-orange-600" size={18} />
                        <span className="font-semibold text-gray-700 text-sm">Tasa de Compra de Mesa</span>
                      </div>
                      <div className="text-xs text-gray-600">Compras / Vistas de precios</div>
                    </div>
                  </div>
                </Card>
              </Col>

              {/* Gift Buyer Funnel */}
              <Col xs={24} lg={12}>
                <Card title="Compra de Regalos (Invitados)" className="h-full">
                  <ResponsiveContainer width="100%" height={300}>
                    <BarChart data={giftBuyerFunnel} layout="vertical">
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis type="number" />
                      <YAxis dataKey="name" type="category" width={120} />
                      <Tooltip />
                      <Bar dataKey="value">
                        {giftBuyerFunnel.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.color} />
                        ))}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>

                  {/* Conversion Rate for Gift Buyers */}
                  <div className="mt-4">
                    <div className="bg-red-50 p-3 rounded-lg">
                      <div className="flex items-center gap-2 mb-1">
                        <TrendingUp className="text-red-600" size={18} />
                        <span className="font-semibold text-gray-700 text-sm">Tasa de Compra de Regalos</span>
                      </div>
                      <div className="text-xl font-bold text-red-600">{summary?.giftPurchaseRate.toFixed(2)}%</div>
                      <div className="text-xs text-gray-600">Compras de regalos / Visitantes</div>
                    </div>

                    <div className="mt-3 p-3 bg-gray-50 rounded-lg">
                      <div className="text-sm text-gray-700">
                        <strong>Total de Compras:</strong> {summary?.giftPurchases.toLocaleString() || 0}
                      </div>
                      <div className="text-xs text-gray-600 mt-1">
                        Los invitados pueden comprar múltiples regalos, por lo que este número puede exceder a los visitantes.
                      </div>
                    </div>
                  </div>
                </Card>
              </Col>
            </Row>

            {/* UTM Sources & Landing Pages */}
            <Row gutter={[16, 16]} className="my-6">
              <Col xs={24} lg={12}>
                <Card title="Top Fuentes UTM" className="h-full">
                  {summary?.topUtmSources && summary.topUtmSources.length > 0 ? (
                    <Table
                      dataSource={summary.topUtmSources}
                      pagination={false}
                      size="small"
                      columns={[
                        {
                          title: 'Fuente',
                          dataIndex: 'source',
                          key: 'source',
                        },
                        {
                          title: 'Visitantes',
                          dataIndex: 'visitors',
                          key: 'visitors',
                          align: 'right',
                        },
                        {
                          title: 'Conversiones',
                          dataIndex: 'conversions',
                          key: 'conversions',
                          align: 'right',
                        },
                        {
                          title: 'Tasa',
                          dataIndex: 'conversionRate',
                          key: 'conversionRate',
                          align: 'right',
                          render: (rate: number) => `${rate.toFixed(1)}%`,
                        },
                      ]}
                    />
                  ) : (
                    <div className="text-center text-gray-500 py-8">No hay datos de UTM disponibles</div>
                  )}
                </Card>
              </Col>
              <Col xs={24} lg={12}>
                <Card title="Top Páginas de Entrada" className="h-full">
                  {summary?.topLandingPages && summary.topLandingPages.length > 0 ? (
                    <Table
                      dataSource={summary.topLandingPages}
                      pagination={false}
                      size="small"
                      columns={[
                        {
                          title: 'Página',
                          dataIndex: 'page',
                          key: 'page',
                          ellipsis: true,
                        },
                        {
                          title: 'Visitantes',
                          dataIndex: 'visitors',
                          key: 'visitors',
                          align: 'right',
                        },
                        {
                          title: 'Conversiones',
                          dataIndex: 'conversions',
                          key: 'conversions',
                          align: 'right',
                        },
                        {
                          title: 'Tasa',
                          dataIndex: 'conversionRate',
                          key: 'conversionRate',
                          align: 'right',
                          render: (rate: number) => `${rate.toFixed(1)}%`,
                        },
                      ]}
                    />
                  ) : (
                    <div className="text-center text-gray-500 py-8">No hay datos de páginas disponibles</div>
                  )}
                </Card>
              </Col>
            </Row>

            {/* Funnel Breakdown */}
            <Card
              title="Desglose del Embudo"
              className="!mb-6"
              extra={
                <Select value={funnelDimension} onChange={setFunnelDimension} style={{ width: 200 }}>
                  <Option value="utm_source">Por Fuente UTM</Option>
                  <Option value="landing_page">Por Página de Entrada</Option>
                </Select>
              }>
              {isFunnelLoading ? (
                <div className="flex justify-center items-center h-64">
                  <Spin />
                </div>
              ) : funnelBreakdown && funnelBreakdown.data.length > 0 ? (
                <div className="overflow-x-auto">
                  <Table
                    dataSource={funnelBreakdown.data}
                    pagination={false}
                    size="small"
                    scroll={{ x: 800 }}
                    columns={[
                      {
                        title: funnelDimension === 'utm_source' ? 'Fuente' : 'Página',
                        dataIndex: 'group',
                        key: 'group',
                        fixed: 'left',
                        width: 150,
                      },
                      {
                        title: 'Visitantes',
                        dataIndex: 'visitors',
                        key: 'visitors',
                        align: 'right',
                      },
                      {
                        title: 'Sign-ins',
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
                        title: 'Checkouts',
                        dataIndex: 'startCheckouts',
                        key: 'startCheckouts',
                        align: 'right',
                        render: (val: number, record: any) => (
                          <span>
                            {val} <span className="text-gray-400 text-xs">({record.checkoutRate.toFixed(1)}%)</span>
                          </span>
                        ),
                      },
                      {
                        title: 'Compras',
                        dataIndex: 'purchases',
                        key: 'purchases',
                        align: 'right',
                        render: (val: number, record: any) => (
                          <span>
                            {val} <span className="text-gray-400 text-xs">({record.purchaseRate.toFixed(1)}%)</span>
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

            {/* Time Series Chart */}
            <Card
              title="Tendencia Histórica"
              extra={
                <Select className="!shadow-sm !rounded-md" value={selectedMetric} onChange={setSelectedMetric} style={{ width: 220 }}>
                  <Option value="visitors">Visitantes</Option>
                  <Option value="signIns">Inicios de Sesión</Option>
                  <Option value="registryAttempts">Intentos de Registro</Option>
                  <Option value="registryPurchases">Compras de Mesa</Option>
                  <Option value="giftPurchases">Compras de Regalos</Option>
                  <Option value="viewPricing">Vistas de Precios</Option>
                  <Option value="viewRegistryBuilder">Vistas de Constructor</Option>
                  <Option value="startCheckouts">Inicios de Checkout</Option>
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
                    <Tooltip labelFormatter={(value: string) => dayjs(value).format('YYYY-MM-DD')} />
                    <Legend />
                    <Line type="monotone" dataKey="value" stroke="#8884d8" strokeWidth={2} name={selectedMetric} />
                  </LineChart>
                </ResponsiveContainer>
              )}
            </Card>
          </>
        )}
      </div>
    </div>
  );
}
