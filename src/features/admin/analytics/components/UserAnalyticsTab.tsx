import { Card, Statistic, Row, Col, Spin, Table, Alert, Select } from 'antd';
import { LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, Cell } from 'recharts';
import { Users, UserCheck, ShoppingCart, Gift, Clock, FileText, AlertTriangle, AlertCircle } from 'lucide-react';
import dayjs from 'dayjs';

const { Option } = Select;

type MetricType =
  | 'visitors'
  | 'signIns'
  | 'registryAttempts'
  | 'registryPurchases'
  | 'giftPurchases'
  | 'viewPricing'
  | 'viewRegistryBuilder'
  | 'startCheckouts';

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
}: UserAnalyticsTabProps) {
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

  if (isSummaryLoading || !summary) {
    return (
      <div className="flex justify-center items-center h-64">
        <Spin size="large" />
      </div>
    );
  }

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
              title="Intentos de Registro"
              value={summary?.registryAttempts || 0}
              prefix={<FileText className="text-purple-500" />}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <Card>
            <Statistic
              title="Compras de Mesa"
              value={summary?.registryPurchases || 0}
              prefix={<ShoppingCart className="text-orange-500" />}
              suffix={`(${summary?.registryPurchaseRate?.toFixed(1)}%)`}
            />
          </Card>
        </Col>
      </Row>

      {/* Summary Cards - Row 2: Additional Metrics */}
      <Row gutter={[16, 16]} className="mb-6">
        <Col xs={24} sm={12} lg={6}>
          <Card>
            <Statistic
              title="Compras de Regalos"
              value={summary?.giftPurchases || 0}
              prefix={<Gift className="text-pink-500" />}
              suffix={`(${summary?.giftPurchaseRate?.toFixed(1)}%)`}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <Card>
            <Statistic
              title="Páginas por Sesión"
              value={summary?.avgPagesPerSession.toFixed(1) || '0.0'}
              prefix={<FileText className="text-indigo-500" />}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <Card>
            <Statistic
              title="Duración Promedio"
              value={Math.round((summary?.avgSessionDurationMs || 0) / 1000 / 60)}
              prefix={<Clock className="text-cyan-500" />}
              suffix="min"
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <Card>
            <Statistic
              title="Abandonos de Checkout"
              value={summary?.checkoutAbandonments || 0}
              prefix={<AlertTriangle className="text-red-500" />}
              suffix={`(${summary?.checkoutAbandonmentRate?.toFixed(1)}%)`}
              valueStyle={{ color: summary && summary.checkoutAbandonmentRate > 50 ? '#cf1322' : '#3f8600' }}
            />
          </Card>
        </Col>
      </Row>

      {/* Funnel Charts */}
      <Row gutter={[16, 16]} className="mb-6">
        <Col xs={24} lg={12}>
          <Card title="Embudo: Dueños de Mesa de Regalos">
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={registryOwnerFunnel} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis type="number" />
                <YAxis dataKey="name" type="category" width={150} />
                <Tooltip />
                <Bar dataKey="value" radius={[0, 8, 8, 0]}>
                  {registryOwnerFunnel.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </Card>
        </Col>
        <Col xs={24} lg={12}>
          <Card title="Embudo: Compradores de Regalos">
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={giftBuyerFunnel} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis type="number" />
                <YAxis dataKey="name" type="category" width={150} />
                <Tooltip />
                <Bar dataKey="value" radius={[0, 8, 8, 0]}>
                  {giftBuyerFunnel.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </Card>
        </Col>
      </Row>

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

      {/* Time Series Chart */}
      <Card
        title="Tendencia Histórica"
        extra={
          <Select className="!shadow-sm !rounded-md" value={selectedMetric} onChange={onMetricChange} style={{ width: 220 }}>
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
              <Tooltip />
              <Legend />
              <Line type="monotone" dataKey="value" stroke="#8884d8" strokeWidth={2} name={selectedMetric} />
            </LineChart>
          </ResponsiveContainer>
        )}
      </Card>
    </>
  );
}
