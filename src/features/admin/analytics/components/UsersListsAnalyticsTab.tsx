import { useMemo } from 'react';
import { Card, Row, Col, Spin, Table, Tag, Tooltip } from 'antd';
import { Users, DollarSign, Gift, TrendingUp, Heart, ShoppingBag, Percent } from 'lucide-react';
import dayjs from 'dayjs';
import type { ColumnsType } from 'antd/es/table';
import type { UserAnalytics, WeddingListAnalytics, UsersListsSummary } from 'services/usersListsAnalytics.service';
import { DetailList, StatCard, formatCurrency, formatDate, summaryGutter, useIsMobile } from './analyticsShared';

interface UsersListsAnalyticsTabProps {
  summary: UsersListsSummary | undefined;
  isSummaryLoading: boolean;
  usersData: UserAnalytics[] | undefined;
  isUsersLoading: boolean;
  listsData: WeddingListAnalytics[] | undefined;
  isListsLoading: boolean;
}

/**
 * A single row of the registry table: one gift list joined with the couple that
 * owns it, or a couple that registered but never created a list.
 */
interface RegistryRow {
  key: string;
  title: string;
  coupleName: string;
  email: string;
  slug: string | null;
  planType: 'FIXED' | 'COMMISSION' | null;
  discountCode: string | null;
  hasList: boolean;
  totalGifts: number;
  purchasedGifts: number;
  purchaseRate: number;
  totalValue: number;
  totalReceived: number;
  invitationCount: number;
  lastPurchaseDate: string | null;
  weddingDate: string | null;
  /** When the list was created (or when the couple registered, if there is no list). */
  createdAt: string;
  registeredAt: string | null;
}

const normalizeEmail = (email: string | null | undefined) => email?.trim().toLowerCase() ?? '';

const coupleDisplayName = (user: UserAnalytics) => {
  const name = `${user.firstName} ${user.lastName}`.trim();
  return user.spouseFirstName ? `${name} y ${user.spouseFirstName}` : name;
};

/**
 * The users endpoint returns couples (with their first list) and the lists endpoint
 * returns every list, so the two overlap almost entirely. Merge them into one row per
 * list — enriched with the owner's plan, discount code and registration date — plus a
 * row for each couple that has no list at all.
 */
function mergeRows(usersData: UserAnalytics[] | undefined, listsData: WeddingListAnalytics[] | undefined): RegistryRow[] {
  const users = usersData ?? [];
  const lists = listsData ?? [];

  const userByListId = new Map<number, UserAnalytics>();
  const userByEmail = new Map<string, UserAnalytics>();
  for (const user of users) {
    if (user.weddingList) userByListId.set(user.weddingList.id, user);
    userByEmail.set(normalizeEmail(user.email), user);
  }

  const listRows: RegistryRow[] = lists.map((list) => {
    const owner = userByListId.get(list.id) ?? userByEmail.get(normalizeEmail(list.coupleEmail));
    return {
      key: `list-${list.id}`,
      title: list.title,
      coupleName: list.coupleName,
      email: list.coupleEmail,
      slug: list.slug ?? owner?.slug ?? null,
      planType: list.couplePlanType ?? owner?.planType ?? null,
      discountCode: owner?.discountCode ?? null,
      hasList: true,
      totalGifts: list.totalGifts,
      purchasedGifts: list.purchasedGifts,
      purchaseRate: list.purchaseRate,
      totalValue: list.totalValue,
      totalReceived: list.totalReceived,
      invitationCount: list.invitationCount || 0,
      lastPurchaseDate: list.lastPurchaseDate,
      weddingDate: list.weddingDate,
      createdAt: list.createdAt,
      registeredAt: owner?.createdAt ?? null,
    };
  });

  // Couples that registered but never published a list would disappear from a
  // list-driven table, so keep them as rows without list metrics.
  const listIds = new Set(lists.map((list) => list.id));
  const emailsWithList = new Set(lists.map((list) => normalizeEmail(list.coupleEmail)).filter(Boolean));

  const userRows: RegistryRow[] = users
    .filter((user) => {
      if (user.weddingList && listIds.has(user.weddingList.id)) return false;
      return !emailsWithList.has(normalizeEmail(user.email));
    })
    .map((user) => ({
      key: `user-${user.id}`,
      title: coupleDisplayName(user),
      coupleName: user.weddingList?.coupleName ?? coupleDisplayName(user),
      email: user.email,
      slug: user.slug,
      planType: user.planType,
      discountCode: user.discountCode,
      hasList: false,
      totalGifts: user.weddingList?.totalGifts ?? 0,
      purchasedGifts: user.weddingList?.purchasedGifts ?? 0,
      purchaseRate: user.weddingList?.purchaseRate ?? 0,
      totalValue: user.weddingList?.totalValue ?? 0,
      totalReceived: user.weddingList?.totalReceived ?? 0,
      invitationCount: user.weddingList?.invitationCount ?? 0,
      lastPurchaseDate: null,
      weddingDate: user.weddingList?.weddingDate ?? null,
      createdAt: user.createdAt,
      registeredAt: user.createdAt,
    }));

  return [...listRows, ...userRows];
}

const compareDates = (a: string | null, b: string | null) => {
  if (!a && !b) return 0;
  if (!a) return 1;
  if (!b) return -1;
  return dayjs(a).unix() - dayjs(b).unix();
};

const renderPlan = (planType: RegistryRow['planType']) => {
  if (!planType) return <Tag>Sin Plan</Tag>;
  return <Tag color={planType === 'FIXED' ? 'green' : 'blue'}>{planType === 'FIXED' ? 'Fijo' : 'Comisión'}</Tag>;
};

const renderPurchaseRate = (row: RegistryRow) => {
  if (!row.hasList) return '-';
  return <Tag color={row.purchaseRate > 50 ? 'green' : row.purchaseRate > 25 ? 'orange' : 'red'}>{row.purchaseRate.toFixed(1)}%</Tag>;
};

export function UsersListsAnalyticsTab({
  summary,
  isSummaryLoading,
  usersData,
  isUsersLoading,
  listsData,
  isListsLoading,
}: UsersListsAnalyticsTabProps) {
  const isMobile = useIsMobile();
  const rows = useMemo(() => mergeRows(usersData, listsData), [usersData, listsData]);

  const nameCell = (row: RegistryRow) => (
    <div className="min-w-0">
      <div className="break-words font-semibold">{row.title}</div>
      {row.coupleName !== row.title && <div className="break-words text-xs text-gray-500">{row.coupleName}</div>}
      <div className="break-all text-xs text-gray-500">{row.email}</div>
      {row.slug && <div className="text-xs text-blue-600">/{row.slug}</div>}
      {!row.hasList && (
        <Tag className="mt-1" color="default">
          Sin lista
        </Tag>
      )}
    </div>
  );

  const desktopColumns: ColumnsType<RegistryRow> = [
    {
      title: 'Lista de Regalos',
      key: 'name',
      fixed: 'left',
      width: 220,
      render: (_, row) => nameCell(row),
    },
    {
      title: 'Plan',
      key: 'planType',
      width: 110,
      render: (_, row) => renderPlan(row.planType),
    },
    {
      title: 'Código Desc.',
      key: 'discountCode',
      width: 120,
      render: (_, row) => (row.discountCode ? <Tag color="orange">{row.discountCode}</Tag> : '-'),
    },
    {
      title: 'Regalos',
      key: 'gifts',
      width: 100,
      align: 'center' as const,
      render: (_, row) =>
        row.hasList ? (
          <Tooltip title={`${row.purchasedGifts} comprados de ${row.totalGifts}`}>
            <div>
              <div className="font-semibold">{row.totalGifts}</div>
              <div className="text-xs text-gray-500">{row.purchasedGifts} comprados</div>
            </div>
          </Tooltip>
        ) : (
          '-'
        ),
      sorter: (a, b) => a.totalGifts - b.totalGifts,
    },
    {
      title: '% Compra',
      key: 'purchaseRate',
      width: 100,
      align: 'center' as const,
      render: (_, row) => renderPurchaseRate(row),
      sorter: (a, b) => a.purchaseRate - b.purchaseRate,
    },
    {
      title: 'Valor Total',
      key: 'totalValue',
      width: 120,
      align: 'right' as const,
      render: (_, row) => (row.hasList ? <div className="text-gray-700">{formatCurrency(row.totalValue)}</div> : '-'),
      sorter: (a, b) => a.totalValue - b.totalValue,
    },
    {
      title: 'Recibido',
      key: 'totalReceived',
      width: 120,
      align: 'right' as const,
      render: (_, row) => (row.hasList ? <div className="font-semibold text-green-600">{formatCurrency(row.totalReceived)}</div> : '-'),
      sorter: (a, b) => a.totalReceived - b.totalReceived,
    },
    {
      title: 'Invitaciones',
      key: 'invitationCount',
      width: 110,
      align: 'center' as const,
      render: (_, row) => (row.hasList ? row.invitationCount : '-'),
      sorter: (a, b) => a.invitationCount - b.invitationCount,
    },
    {
      title: 'Última Compra',
      key: 'lastPurchaseDate',
      width: 130,
      render: (_, row) => (row.lastPurchaseDate ? formatDate(row.lastPurchaseDate) : '-'),
      sorter: (a, b) => compareDates(a.lastPurchaseDate, b.lastPurchaseDate),
    },
    {
      title: 'Fecha Boda',
      key: 'weddingDate',
      width: 120,
      render: (_, row) => (row.weddingDate ? formatDate(row.weddingDate) : '-'),
      sorter: (a, b) => compareDates(a.weddingDate, b.weddingDate),
    },
    {
      title: 'Creada',
      key: 'createdAt',
      width: 110,
      render: (_, row) => (row.hasList ? formatDate(row.createdAt) : '-'),
      sorter: (a, b) => compareDates(a.createdAt, b.createdAt),
    },
    {
      title: 'Registro',
      key: 'registeredAt',
      width: 110,
      render: (_, row) => (row.registeredAt ? formatDate(row.registeredAt) : '-'),
      sorter: (a, b) => compareDates(a.registeredAt, b.registeredAt),
    },
  ];

  // On phones the row collapses to identity + the headline number; everything else
  // moves into the expandable detail panel so nothing scrolls sideways.
  const mobileColumns: ColumnsType<RegistryRow> = [
    {
      title: 'Lista',
      key: 'name',
      render: (_, row) => nameCell(row),
    },
    {
      title: 'Recibido',
      key: 'totalReceived',
      width: 96,
      align: 'right' as const,
      render: (_, row) => (
        <div>
          <div className="font-semibold text-green-600">{row.hasList ? formatCurrency(row.totalReceived) : '-'}</div>
          <div className="mt-1">{renderPurchaseRate(row)}</div>
        </div>
      ),
      sorter: (a, b) => a.totalReceived - b.totalReceived,
    },
  ];

  const mobileDetails = (row: RegistryRow) => (
    <DetailList
      items={[
        { label: 'Plan', value: renderPlan(row.planType) },
        { label: 'Código Desc.', value: row.discountCode ? <Tag color="orange">{row.discountCode}</Tag> : '-' },
        { label: 'Regalos', value: row.hasList ? `${row.purchasedGifts} / ${row.totalGifts}` : '-' },
        { label: 'Valor Total', value: row.hasList ? formatCurrency(row.totalValue) : '-' },
        { label: 'Invitaciones', value: row.hasList ? row.invitationCount : '-' },
        { label: 'Última Compra', value: row.lastPurchaseDate ? formatDate(row.lastPurchaseDate) : '-' },
        { label: 'Fecha Boda', value: row.weddingDate ? formatDate(row.weddingDate) : '-' },
        { label: 'Creada', value: row.hasList ? formatDate(row.createdAt) : '-' },
        { label: 'Registro', value: row.registeredAt ? formatDate(row.registeredAt) : '-' },
      ]}
    />
  );

  return (
    <div className="space-y-4 sm:space-y-6">
      {/* Summary Statistics */}
      <Card title="Resumen General" className="!shadow-sm" size={isMobile ? 'small' : 'default'}>
        {isSummaryLoading ? (
          <div className="flex justify-center py-8">
            <Spin size="large" />
          </div>
        ) : summary ? (
          <>
            <Row gutter={summaryGutter}>
              <Col xs={12} md={8} lg={6}>
                <StatCard
                  title="Total Usuarios"
                  value={summary.totalUsers}
                  icon={<Users className="text-blue-600" size={20} />}
                  color="#1890ff"
                  background="!bg-blue-50"
                  footer={
                    <>
                      <div>Parejas: {summary.totalCouples}</div>
                      <div>Invitados: {summary.totalGuests}</div>
                      <div>Admins: {summary.totalAdmins}</div>
                    </>
                  }
                />
              </Col>

              <Col xs={12} md={8} lg={6}>
                <StatCard
                  title="Planes Activos"
                  value={summary.fixedPlanUsers + summary.commissionPlanUsers}
                  icon={<TrendingUp className="text-green-600" size={20} />}
                  color="#52c41a"
                  background="!bg-green-50"
                  footer={
                    <>
                      <div>Plan Fijo: {summary.fixedPlanUsers}</div>
                      <div>Plan Comisión: {summary.commissionPlanUsers}</div>
                    </>
                  }
                />
              </Col>

              <Col xs={12} md={8} lg={6}>
                <StatCard
                  title="Listas de Regalos"
                  value={summary.totalWeddingLists}
                  icon={<Heart className="text-purple-600" size={20} />}
                  color="#722ed1"
                  background="!bg-purple-50"
                  footer={<div>Promedio regalos: {summary.averageGiftsPerList.toFixed(1)}</div>}
                />
              </Col>

              <Col xs={12} md={8} lg={6}>
                <StatCard
                  title="Regalos Totales"
                  value={summary.totalGiftsCreated}
                  icon={<Gift className="text-orange-600" size={20} />}
                  color="#fa8c16"
                  background="!bg-orange-50"
                  footer={
                    <>
                      <div>Comprados: {summary.totalGiftsPurchased}</div>
                      <div>Tasa: {summary.averagePurchaseRate.toFixed(1)}%</div>
                    </>
                  }
                />
              </Col>
            </Row>

            <Row gutter={summaryGutter} className="mt-2 sm:mt-4">
              <Col xs={12} lg={8}>
                <StatCard
                  title="Ingresos Totales"
                  value={summary.totalRevenue}
                  icon={<DollarSign className="text-emerald-600" size={20} />}
                  color="#10b981"
                  background="!bg-emerald-50"
                  currency
                />
              </Col>

              <Col xs={12} lg={8}>
                <StatCard
                  title="Promedio por Lista"
                  value={summary.averageRevenuePerList}
                  icon={<ShoppingBag className="text-cyan-600" size={20} />}
                  color="#06b6d4"
                  background="!bg-cyan-50"
                  currency
                />
              </Col>

              <Col xs={12} lg={8}>
                <StatCard
                  title="Tasa de Compra"
                  value={summary.averagePurchaseRate}
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

      {/* Registries and their couples */}
      <Card
        title="Listas de Regalos y Parejas"
        className="!shadow-sm"
        size={isMobile ? 'small' : 'default'}
        styles={isMobile ? { body: { padding: 8 } } : undefined}>
        <Table
          columns={isMobile ? mobileColumns : desktopColumns}
          dataSource={rows}
          loading={isUsersLoading || isListsLoading}
          rowKey="key"
          size={isMobile ? 'small' : 'middle'}
          scroll={isMobile ? undefined : { x: 1560 }}
          expandable={isMobile ? { expandedRowRender: mobileDetails, expandRowByClick: true } : undefined}
          pagination={{
            pageSize: 10,
            size: isMobile ? 'small' : 'default',
            showSizeChanger: !isMobile,
            showTotal: isMobile ? undefined : (total) => `Total: ${total} listas`,
          }}
        />
      </Card>
    </div>
  );
}
