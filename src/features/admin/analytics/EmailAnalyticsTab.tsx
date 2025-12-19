import { Card, Statistic, Row, Col, Spin } from 'antd';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { Mail, Send, MailOpen, MousePointerClick, AlertTriangle, AlertOctagon } from 'lucide-react';
import dayjs from 'dayjs';

interface EmailAnalyticsTabProps {
  emailSummary: any;
  isEmailSummaryLoading: boolean;
  emailTimeSeries: any;
  isEmailTimeSeriesLoading: boolean;
}

export function EmailAnalyticsTab({
  emailSummary,
  isEmailSummaryLoading,
  emailTimeSeries,
  isEmailTimeSeriesLoading,
}: EmailAnalyticsTabProps) {
  if (isEmailSummaryLoading) {
    return (
      <div className="flex justify-center items-center h-64">
        <Spin size="large" />
      </div>
    );
  }

  return (
    <>
      {/* Email Summary Cards */}
      <Row gutter={[16, 16]} className="mb-6">
        <Col xs={24} sm={12} lg={6}>
          <Card>
            <Statistic title="Emails Enviados" value={emailSummary?.sent || 0} prefix={<Send className="text-blue-500" size={20} />} />
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <Card>
            <Statistic
              title="Entregados"
              value={emailSummary?.delivered || 0}
              prefix={<Mail className="text-green-500" size={20} />}
              suffix={`(${emailSummary?.deliveryRate.toFixed(1)}%)`}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <Card>
            <Statistic
              title="Abiertos"
              value={emailSummary?.opened || 0}
              prefix={<MailOpen className="text-purple-500" size={20} />}
              suffix={`(${emailSummary?.openRate.toFixed(1)}%)`}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <Card>
            <Statistic
              title="Clicks"
              value={emailSummary?.clicked || 0}
              prefix={<MousePointerClick className="text-orange-500" size={20} />}
              suffix={`(${emailSummary?.clickRate.toFixed(1)}%)`}
            />
          </Card>
        </Col>
      </Row>

      {/* Email Issues Cards */}
      <Row gutter={[16, 16]} className="mb-6">
        <Col xs={24} sm={12}>
          <Card>
            <Statistic
              title="Rebotes"
              value={emailSummary?.bounced || 0}
              prefix={<AlertTriangle className="text-red-500" size={20} />}
              suffix={`(${emailSummary?.bounceRate.toFixed(1)}%)`}
              valueStyle={{ color: emailSummary && emailSummary.bounceRate > 5 ? '#ef4444' : '#3f8600' }}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12}>
          <Card>
            <Statistic
              title="Quejas de Spam"
              value={emailSummary?.spamComplaints || 0}
              prefix={<AlertOctagon className="text-red-600" size={20} />}
              valueStyle={{ color: emailSummary && emailSummary.spamComplaints > 0 ? '#dc2626' : '#3f8600' }}
            />
          </Card>
        </Col>
      </Row>

      {/* Email Time Series Chart */}
      <Card title="Tendencia de Emails">
        {isEmailTimeSeriesLoading ? (
          <div className="flex justify-center items-center h-64">
            <Spin />
          </div>
        ) : (
          <ResponsiveContainer width="100%" height={400}>
            <LineChart data={emailTimeSeries || []}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="date" tickFormatter={(value: string) => dayjs(value).format('MMM DD')} />
              <YAxis />
              <Tooltip labelFormatter={(value: string) => dayjs(value).format('YYYY-MM-DD')} />
              <Legend />
              <Line type="monotone" dataKey="sent" stroke="#3b82f6" strokeWidth={2} name="Enviados" />
              <Line type="monotone" dataKey="delivered" stroke="#10b981" strokeWidth={2} name="Entregados" />
              <Line type="monotone" dataKey="opened" stroke="#8b5cf6" strokeWidth={2} name="Abiertos" />
              <Line type="monotone" dataKey="clicked" stroke="#f59e0b" strokeWidth={2} name="Clicks" />
            </LineChart>
          </ResponsiveContainer>
        )}
      </Card>

      {/* Email Performance Metrics */}
      <Card title="Métricas de Rendimiento" className="mt-6">
        <Row gutter={[16, 16]}>
          <Col xs={24} md={8}>
            <div className="text-center p-4 bg-green-50 rounded-lg">
              <div className="text-3xl font-bold text-green-600">{emailSummary?.deliveryRate.toFixed(1)}%</div>
              <div className="text-gray-600 mt-2">Tasa de Entrega</div>
              <div className="text-sm text-gray-500 mt-1">Meta: &gt;95%</div>
            </div>
          </Col>
          <Col xs={24} md={8}>
            <div className="text-center p-4 bg-purple-50 rounded-lg">
              <div className="text-3xl font-bold text-purple-600">{emailSummary?.openRate.toFixed(1)}%</div>
              <div className="text-gray-600 mt-2">Tasa de Apertura</div>
              <div className="text-sm text-gray-500 mt-1">Meta: &gt;20%</div>
            </div>
          </Col>
          <Col xs={24} md={8}>
            <div className="text-center p-4 bg-orange-50 rounded-lg">
              <div className="text-3xl font-bold text-orange-600">{emailSummary?.clickRate.toFixed(1)}%</div>
              <div className="text-gray-600 mt-2">Tasa de Clicks</div>
              <div className="text-sm text-gray-500 mt-1">Meta: &gt;3%</div>
            </div>
          </Col>
        </Row>
      </Card>
    </>
  );
}
