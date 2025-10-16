import { useState, useMemo } from 'react';
import { Card, DatePicker, Select, Statistic, Row, Col, Spin } from 'antd';
import { LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { TrendingUp, Users, UserCheck, ShoppingCart, Gift } from 'lucide-react';
import { useMetricsSummary, useTimeSeries } from 'hooks/useAnalytics';
import dayjs, { Dayjs } from 'dayjs';

const { RangePicker } = DatePicker;
const { Option } = Select;

type DateRange = 'today' | 'last7days' | 'last30days' | 'custom';

export function Analytics() {
  const [dateRange, setDateRange] = useState<DateRange>('last30days');
  const [customDates, setCustomDates] = useState<[Dayjs, Dayjs] | null>(null);
  const [selectedMetric, setSelectedMetric] = useState<'visitors' | 'signIns' | 'registryPurchases' | 'giftPurchases'>('visitors');

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
  const { data: summary, isLoading: isSummaryLoading } = useMetricsSummary(from, to);
  const { data: timeSeriesData, isLoading: isTimeSeriesLoading } = useTimeSeries(selectedMetric, from, to, 'daily');

  // Prepare funnel data
  const funnelData = summary
    ? [
        { name: 'Visitantes', value: summary.visitors, color: '#8884d8' },
        { name: 'Inicios de Sesión', value: summary.signIns, color: '#82ca9d' },
        { name: 'Compras de Mesa', value: summary.registryPurchases, color: '#ffc658' },
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

        {/* Date Range Selector */}
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
          </div>
        </Card>

        {isSummaryLoading ? (
          <div className="flex justify-center items-center h-64">
            <Spin size="large" />
          </div>
        ) : (
          <>
            {/* Summary Cards */}
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

            {/* Funnel Visualization */}
            <Card title="Embudo de Conversión" className="mb-6">
              <ResponsiveContainer width="100%" height={400}>
                <BarChart data={funnelData} layout="vertical">
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis type="number" />
                  <YAxis dataKey="name" type="category" width={150} />
                  <Tooltip />
                  <Bar dataKey="value" fill="#8884d8">
                    {funnelData.map((entry, index) => (
                      <Bar key={`bar-${index}`} dataKey="value" fill={entry.color} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>

              {/* Conversion Rates */}
              <div className="mt-6 grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="bg-blue-50 p-4 rounded-lg">
                  <div className="flex items-center gap-2 mb-2">
                    <TrendingUp className="text-blue-600" size={20} />
                    <span className="font-semibold text-gray-700">Tasa de Inicio de Sesión</span>
                  </div>
                  <div className="text-2xl font-bold text-blue-600">{summary?.signInRate.toFixed(2)}%</div>
                  <div className="text-sm text-gray-600">Inicios de sesión / Visitantes</div>
                </div>

                <div className="bg-orange-50 p-4 rounded-lg">
                  <div className="flex items-center gap-2 mb-2">
                    <TrendingUp className="text-orange-600" size={20} />
                    <span className="font-semibold text-gray-700">Tasa de Compra de Mesa</span>
                  </div>
                  <div className="text-2xl font-bold text-orange-600">{summary?.registryPurchaseRate.toFixed(2)}%</div>
                  <div className="text-sm text-gray-600">Compras de mesa / Inicios de sesión</div>
                </div>

                <div className="bg-red-50 p-4 rounded-lg">
                  <div className="flex items-center gap-2 mb-2">
                    <TrendingUp className="text-red-600" size={20} />
                    <span className="font-semibold text-gray-700">Tasa de Compra de Regalos</span>
                  </div>
                  <div className="text-2xl font-bold text-red-600">{summary?.giftPurchaseRate.toFixed(2)}%</div>
                  <div className="text-sm text-gray-600">Compras de regalos / Visitantes</div>
                </div>
              </div>
            </Card>

            {/* Time Series Chart */}
            <Card
              title="Tendencia Histórica"
              extra={
                <Select className="!shadow-sm !rounded-md" value={selectedMetric} onChange={setSelectedMetric} style={{ width: 200 }}>
                  <Option value="visitors">Visitantes</Option>
                  <Option value="signIns">Inicios de Sesión</Option>
                  <Option value="registryPurchases">Compras de Mesa</Option>
                  <Option value="giftPurchases">Compras de Regalos</Option>
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
