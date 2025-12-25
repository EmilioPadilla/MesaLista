import { useState } from 'react';
import { Card, Statistic, Row, Col, Spin, Table, Tag, Tooltip, Radio } from 'antd';
import { Users, DollarSign, Gift, TrendingUp, Heart, ShoppingBag, Percent } from 'lucide-react';
import dayjs from 'dayjs';
import type { ColumnsType } from 'antd/es/table';
import type { UserAnalytics, WeddingListAnalytics, UsersListsSummary } from 'services/usersListsAnalytics.service';

interface UsersListsAnalyticsTabProps {
  summary: UsersListsSummary | undefined;
  isSummaryLoading: boolean;
  usersData: UserAnalytics[] | undefined;
  isUsersLoading: boolean;
  listsData: WeddingListAnalytics[] | undefined;
  isListsLoading: boolean;
}

type TableView = 'users' | 'lists';

export function UsersListsAnalyticsTab({
  summary,
  isSummaryLoading,
  usersData,
  isUsersLoading,
  listsData,
  isListsLoading,
}: UsersListsAnalyticsTabProps) {
  const [tableView, setTableView] = useState<TableView>('users');

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

  // Combined table columns - adapts based on view
  type CombinedDataType = UserAnalytics | WeddingListAnalytics;

  const getColumns = (): ColumnsType<CombinedDataType> => {
    const isUsersView = tableView === 'users';

    return [
      // Name/Title column
      {
        title: isUsersView ? 'Pareja' : 'Lista de Regalos',
        key: 'name',
        fixed: 'left',
        width: 200,
        render: (_, record) => {
          if (isUsersView) {
            const user = record as UserAnalytics;
            return (
              <div>
                <div className="font-semibold">
                  {user.firstName} {user.lastName}
                  {user.spouseFirstName && ` y ${user.spouseFirstName}`}
                </div>
                <div className="text-xs text-gray-500">{user.email}</div>
                {user.coupleSlug && <div className="text-xs text-blue-600">/{user.coupleSlug}</div>}
              </div>
            );
          } else {
            const list = record as WeddingListAnalytics;
            return (
              <div>
                <div className="font-semibold">{list.title}</div>
                <div className="text-xs text-gray-500">{list.coupleName}</div>
                {list.coupleSlug && <div className="text-xs text-blue-600">/{list.coupleSlug}</div>}
              </div>
            );
          }
        },
      },
      // Email column (only for lists view)
      ...(isUsersView
        ? []
        : [
            {
              title: 'Email',
              key: 'email',
              width: 180,
              render: (_: any, record: CombinedDataType) => {
                const list = record as WeddingListAnalytics;
                return <div className="text-xs text-gray-600">{list.coupleEmail}</div>;
              },
            },
          ]),
      // Plan column
      {
        title: 'Plan',
        key: 'planType',
        width: 120,
        render: (_, record) => {
          const planType = isUsersView ? (record as UserAnalytics).planType : (record as WeddingListAnalytics).couplePlanType;
          if (!planType) return <Tag>Sin Plan</Tag>;
          return <Tag color={planType === 'FIXED' ? 'green' : 'blue'}>{planType === 'FIXED' ? 'Fijo' : 'Comisión'}</Tag>;
        },
      },
      // Discount code (only for users view)
      ...(isUsersView
        ? [
            {
              title: 'Código Desc.',
              key: 'discountCode',
              width: 120,
              render: (_: any, record: CombinedDataType) => {
                const user = record as UserAnalytics;
                return user.discountCode ? <Tag color="orange">{user.discountCode}</Tag> : '-';
              },
            },
          ]
        : []),
      // Gifts column
      {
        title: 'Regalos',
        key: 'gifts',
        width: 100,
        align: 'center' as const,
        render: (_, record) => {
          const data = isUsersView ? (record as UserAnalytics).weddingList : (record as WeddingListAnalytics);
          if (!data) return '-';
          return (
            <Tooltip title={`${data.purchasedGifts} comprados de ${data.totalGifts}`}>
              <div>
                <div className="font-semibold">{data.totalGifts}</div>
                <div className="text-xs text-gray-500">{data.purchasedGifts} comprados</div>
              </div>
            </Tooltip>
          );
        },
      },
      // Purchase rate column
      {
        title: '% Compra',
        key: 'purchaseRate',
        width: 100,
        align: 'center' as const,
        render: (_, record) => {
          const data = isUsersView ? (record as UserAnalytics).weddingList : (record as WeddingListAnalytics);
          if (!data) return '-';
          const rate = data.purchaseRate;
          return <Tag color={rate > 50 ? 'green' : rate > 25 ? 'orange' : 'red'}>{rate.toFixed(1)}%</Tag>;
        },
        sorter: (a, b) => {
          const rateA = isUsersView ? (a as UserAnalytics).weddingList?.purchaseRate || 0 : (a as WeddingListAnalytics).purchaseRate;
          const rateB = isUsersView ? (b as UserAnalytics).weddingList?.purchaseRate || 0 : (b as WeddingListAnalytics).purchaseRate;
          return rateA - rateB;
        },
      },
      // Total value column
      {
        title: 'Valor Total',
        key: 'totalValue',
        width: 120,
        align: 'right' as const,
        render: (_, record) => {
          const data = isUsersView ? (record as UserAnalytics).weddingList : (record as WeddingListAnalytics);
          if (!data) return '-';
          return <div className="text-gray-700">{formatCurrency(data.totalValue)}</div>;
        },
        sorter: (a, b) => {
          const valueA = isUsersView ? (a as UserAnalytics).weddingList?.totalValue || 0 : (a as WeddingListAnalytics).totalValue;
          const valueB = isUsersView ? (b as UserAnalytics).weddingList?.totalValue || 0 : (b as WeddingListAnalytics).totalValue;
          return valueA - valueB;
        },
      },
      // Total received column
      {
        title: 'Recibido',
        key: 'totalReceived',
        width: 120,
        align: 'right' as const,
        render: (_, record) => {
          const data = isUsersView ? (record as UserAnalytics).weddingList : (record as WeddingListAnalytics);
          if (!data) return '-';
          return <div className="font-semibold text-green-600">{formatCurrency(data.totalReceived)}</div>;
        },
        sorter: (a, b) => {
          const receivedA = isUsersView ? (a as UserAnalytics).weddingList?.totalReceived || 0 : (a as WeddingListAnalytics).totalReceived;
          const receivedB = isUsersView ? (b as UserAnalytics).weddingList?.totalReceived || 0 : (b as WeddingListAnalytics).totalReceived;
          return receivedA - receivedB;
        },
      },
      // Invitations column
      {
        title: 'Invitaciones',
        key: 'invitationCount',
        width: 100,
        align: 'center' as const,
        render: (_, record) => {
          const data = isUsersView ? (record as UserAnalytics).weddingList : (record as WeddingListAnalytics);
          if (!data) return '-';
          return data.invitationCount || 0;
        },
      },
      // Last purchase date (only for lists view)
      ...(isUsersView
        ? []
        : [
            {
              title: 'Última Compra',
              key: 'lastPurchaseDate',
              width: 120,
              render: (_: any, record: CombinedDataType) => {
                const list = record as WeddingListAnalytics;
                return list.lastPurchaseDate ? formatDate(list.lastPurchaseDate) : '-';
              },
              sorter: (a: CombinedDataType, b: CombinedDataType) => {
                const listA = a as WeddingListAnalytics;
                const listB = b as WeddingListAnalytics;
                if (!listA.lastPurchaseDate) return 1;
                if (!listB.lastPurchaseDate) return -1;
                return dayjs(listA.lastPurchaseDate).unix() - dayjs(listB.lastPurchaseDate).unix();
              },
            },
          ]),
      // Wedding date column
      {
        title: 'Fecha Boda',
        key: 'weddingDate',
        width: 120,
        render: (_, record) => {
          const data = isUsersView ? (record as UserAnalytics).weddingList : (record as WeddingListAnalytics);
          if (!data) return '-';
          return formatDate(data.weddingDate);
        },
        sorter: (a, b) => {
          const dateA = isUsersView ? (a as UserAnalytics).weddingList?.weddingDate : (a as WeddingListAnalytics).weddingDate;
          const dateB = isUsersView ? (b as UserAnalytics).weddingList?.weddingDate : (b as WeddingListAnalytics).weddingDate;
          if (!dateA || !dateB) return 0;
          return dayjs(dateA).unix() - dayjs(dateB).unix();
        },
      },
      // Created date column
      {
        title: isUsersView ? 'Fecha Registro' : 'Creada',
        key: 'createdAt',
        width: 120,
        render: (_, record) => formatDate(record.createdAt),
        sorter: (a, b) => dayjs(a.createdAt).unix() - dayjs(b.createdAt).unix(),
      },
    ];
  };

  // Get current data and loading state based on view
  const currentData = tableView === 'users' ? usersData : listsData;
  const isLoading = tableView === 'users' ? isUsersLoading : isListsLoading;
  const totalLabel = tableView === 'users' ? 'usuarios' : 'listas';

  return (
    <div className="space-y-6">
      {/* Summary Statistics */}
      <Card title="Resumen General" className="!shadow-sm">
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
                    title="Total Usuarios"
                    value={summary.totalUsers}
                    prefix={<Users className="text-blue-600" size={20} />}
                    valueStyle={{ color: '#1890ff' }}
                  />
                  <div className="mt-2 text-xs text-gray-600">
                    <div>Parejas: {summary.totalCouples}</div>
                    <div>Invitados: {summary.totalGuests}</div>
                    <div>Admins: {summary.totalAdmins}</div>
                  </div>
                </Card>
              </Col>

              <Col xs={24} sm={12} md={8} lg={6}>
                <Card className="!bg-green-50">
                  <Statistic
                    title="Planes Activos"
                    value={summary.fixedPlanUsers + summary.commissionPlanUsers}
                    prefix={<TrendingUp className="text-green-600" size={20} />}
                    valueStyle={{ color: '#52c41a' }}
                  />
                  <div className="mt-2 text-xs text-gray-600">
                    <div>Plan Fijo: {summary.fixedPlanUsers}</div>
                    <div>Plan Comisión: {summary.commissionPlanUsers}</div>
                  </div>
                </Card>
              </Col>

              <Col xs={24} sm={12} md={8} lg={6}>
                <Card className="!bg-purple-50">
                  <Statistic
                    title="Listas de Regalos"
                    value={summary.totalWeddingLists}
                    prefix={<Heart className="text-purple-600" size={20} />}
                    valueStyle={{ color: '#722ed1' }}
                  />
                  <div className="mt-2 text-xs text-gray-600">
                    <div>Promedio regalos: {summary.averageGiftsPerList.toFixed(1)}</div>
                  </div>
                </Card>
              </Col>

              <Col xs={24} sm={12} md={8} lg={6}>
                <Card className="!bg-orange-50">
                  <Statistic
                    title="Regalos Totales"
                    value={summary.totalGiftsCreated}
                    prefix={<Gift className="text-orange-600" size={20} />}
                    valueStyle={{ color: '#fa8c16' }}
                  />
                  <div className="mt-2 text-xs text-gray-600">
                    <div>Comprados: {summary.totalGiftsPurchased}</div>
                    <div>Tasa: {summary.averagePurchaseRate.toFixed(1)}%</div>
                  </div>
                </Card>
              </Col>
            </Row>

            <Row gutter={[16, 16]} className="mt-4">
              <Col xs={24} sm={12} lg={8}>
                <Card className="!bg-emerald-50">
                  <Statistic
                    title="Ingresos Totales"
                    value={summary.totalRevenue}
                    prefix={<DollarSign className="text-emerald-600" size={20} />}
                    valueStyle={{ color: '#10b981', fontSize: '24px' }}
                    formatter={(value) => formatCurrency(Number(value))}
                  />
                </Card>
              </Col>

              <Col xs={24} sm={12} lg={8}>
                <Card className="!bg-cyan-50">
                  <Statistic
                    title="Promedio por Lista"
                    value={summary.averageRevenuePerList}
                    prefix={<ShoppingBag className="text-cyan-600" size={20} />}
                    valueStyle={{ color: '#06b6d4' }}
                    formatter={(value) => formatCurrency(Number(value))}
                  />
                </Card>
              </Col>

              <Col xs={24} sm={12} lg={8}>
                <Card className="!bg-indigo-50">
                  <Statistic
                    title="Tasa de Compra"
                    value={summary.averagePurchaseRate}
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

      {/* Combined Table with View Toggle */}
      <Card
        title={
          <div className="flex items-center justify-between">
            <span>{tableView === 'users' ? 'Usuarios y sus Listas' : 'Todas las Listas de Regalos'}</span>
            <Radio.Group value={tableView} onChange={(e) => setTableView(e.target.value)} buttonStyle="solid">
              <Radio.Button value="users">Usuarios</Radio.Button>
              <Radio.Button value="lists">Listas</Radio.Button>
            </Radio.Group>
          </div>
        }
        className="!shadow-sm">
        <Table
          columns={getColumns()}
          dataSource={currentData}
          loading={isLoading}
          rowKey="id"
          scroll={{ x: 1500 }}
          pagination={{
            pageSize: 10,
            showSizeChanger: true,
            showTotal: (total) => `Total: ${total} ${totalLabel}`,
          }}
        />
      </Card>
    </div>
  );
}
