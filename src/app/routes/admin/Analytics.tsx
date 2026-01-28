import { useState, useMemo } from 'react';
import { Card, DatePicker, Select, Tabs } from 'antd';
import { TrendingUp, Users } from 'lucide-react';
import { useMetricsSummary, useTimeSeries, useFunnelBreakdown, useMetricAlerts } from 'hooks/useAnalytics';
import { useUsersListsSummary, useUsersAnalytics, useWeddingListsAnalytics } from 'hooks/useUsersListsAnalytics';
import { UserAnalyticsTab, UsersListsAnalyticsTab } from 'src/features/admin/analytics';
import dayjs, { Dayjs } from 'dayjs';
import { useGiftLists } from 'src/hooks/useGiftList';

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
  const { data: weddingLists } = useGiftLists();
  const { data: summary, isLoading: isSummaryLoading } = useMetricsSummary(from, to, selectedWeddingListId);
  const { data: timeSeriesData, isLoading: isTimeSeriesLoading } = useTimeSeries(
    selectedMetric as 'visitors' | 'signIns' | 'registryAttempts' | 'registryPurchases' | 'giftPurchases',
    from,
    to,
    'daily',
  );
  const { data: funnelBreakdown, isLoading: isFunnelLoading } = useFunnelBreakdown(funnelDimension, from, to);
  const { data: alerts } = useMetricAlerts();

  // Users and lists analytics data
  const { data: usersListsSummary, isLoading: isUsersListsSummaryLoading } = useUsersListsSummary(from, to);
  const { data: usersData, isLoading: isUsersDataLoading } = useUsersAnalytics(from, to);
  const { data: listsData, isLoading: isListsDataLoading } = useWeddingListsAnalytics(from, to);

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

        {/* Tabs for different analytics sections */}
        <Tabs defaultActiveKey="user" className="mb-6">
          <Tabs.TabPane
            tab={
              <span>
                <TrendingUp className="inline mr-2" size={16} />
                Analíticas de Usuario
              </span>
            }
            key="user">
            <UserAnalyticsTab
              summary={summary}
              isSummaryLoading={isSummaryLoading}
              timeSeriesData={timeSeriesData}
              isTimeSeriesLoading={isTimeSeriesLoading}
              funnelBreakdown={funnelBreakdown}
              isFunnelLoading={isFunnelLoading}
              alerts={alerts}
              selectedMetric={selectedMetric}
              onMetricChange={setSelectedMetric}
            />
          </Tabs.TabPane>

          <Tabs.TabPane
            tab={
              <span>
                <Users className="inline mr-2" size={16} />
                Usuarios y Listas
              </span>
            }
            key="users-lists">
            <UsersListsAnalyticsTab
              summary={usersListsSummary}
              isSummaryLoading={isUsersListsSummaryLoading}
              usersData={usersData}
              isUsersLoading={isUsersDataLoading}
              listsData={listsData}
              isListsLoading={isListsDataLoading}
            />
          </Tabs.TabPane>
        </Tabs>
      </div>
    </div>
  );
}
