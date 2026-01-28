import { useState } from 'react';
import { Table, Tag, Button, Space, Input, message, Statistic, Row, Col, Card } from 'antd';
import { Search, RefreshCw, Calendar, Gift, DollarSign, TrendingUp, Percent, ExternalLink } from 'lucide-react';
import dayjs from 'dayjs';
import type { ColumnsType } from 'antd/es/table';
import type { WeddingListAnalytics, UsersListsSummary } from 'services/usersListsAnalytics.service';
import { RegistryDetailModal } from './index';

interface RegistriesControlTabProps {
  summary: UsersListsSummary | undefined;
  listsData: WeddingListAnalytics[] | undefined;
  isListsLoading: boolean;
  onRefresh: () => void;
}

export function RegistriesControlTab({ summary, listsData, isListsLoading, onRefresh }: RegistriesControlTabProps) {
  const [searchText, setSearchText] = useState('');
  const [selectedList, setSelectedList] = useState<WeddingListAnalytics | null>(null);
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);

  const formatDate = (date: string) => {
    return dayjs(date).format('DD/MMM/YYYY');
  };

  const formatDateTime = (date: string) => {
    return dayjs(date).format('DD/MMM/YYYY HH:mm');
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('es-MX', {
      style: 'currency',
      currency: 'MXN',
    }).format(amount);
  };

  const handleViewDetails = (list: WeddingListAnalytics) => {
    setSelectedList(list);
    setIsDetailModalOpen(true);
  };

  const handleViewPublicRegistry = (slug: string, listId: number) => {
    window.open(`https://mesalista.com.mx/${slug}/regalos?listId=${listId}`, '_blank');
  };

  const handleCopyLink = (slug: string, listId: number) => {
    navigator.clipboard.writeText(`https://mesalista.com.mx/${slug}/regalos?listId=${listId}`);
    message.success('Enlace copiado al portapapeles');
  };

  const filteredData = listsData?.filter((list) => {
    const searchLower = searchText.toLowerCase();
    return (
      list.title.toLowerCase().includes(searchLower) ||
      list.coupleName.toLowerCase().includes(searchLower) ||
      list.coupleEmail.toLowerCase().includes(searchLower) ||
      (list.slug && list.slug.toLowerCase().includes(searchLower))
    );
  });

  const columns: ColumnsType<WeddingListAnalytics> = [
    {
      title: 'Lista de Regalos',
      key: 'list',
      fixed: 'left',
      width: 250,
      render: (_, record) => (
        <div>
          <div className="font-semibold text-gray-900">{record.title}</div>
          <div className="text-xs text-gray-600 mt-1">{record.coupleName}</div>
          <div className="text-xs text-gray-500 mt-1">{record.coupleEmail}</div>
          {record.slug && (
            <div
              className="text-xs text-blue-600 mt-1 cursor-pointer hover:underline"
              onClick={() => handleCopyLink(record.slug!, record.id)}>
              /{record.slug}
            </div>
          )}
        </div>
      ),
    },
    {
      title: 'Plan',
      key: 'planType',
      width: 120,
      render: (_, record) => {
        if (!record.couplePlanType) return <Tag>Sin Plan</Tag>;
        return (
          <Tag color={record.couplePlanType === 'FIXED' ? 'green' : 'blue'}>{record.couplePlanType === 'FIXED' ? 'Fijo' : 'Comisión'}</Tag>
        );
      },
      filters: [
        { text: 'Fijo', value: 'FIXED' },
        { text: 'Comisión', value: 'COMMISSION' },
        { text: 'Sin Plan', value: 'none' },
      ],
      onFilter: (value, record) => {
        if (value === 'none') return !record.couplePlanType;
        return record.couplePlanType === value;
      },
    },
    {
      title: 'Regalos',
      key: 'gifts',
      width: 120,
      align: 'center',
      render: (_, record) => (
        <div>
          <div className="font-semibold text-gray-900">{record.totalGifts}</div>
          <div className="text-xs text-green-600">{record.purchasedGifts} comprados</div>
        </div>
      ),
      sorter: (a, b) => a.totalGifts - b.totalGifts,
    },
    {
      title: '% Compra',
      key: 'purchaseRate',
      width: 100,
      align: 'center',
      render: (_, record) => {
        const rate = record.purchaseRate;
        return <Tag color={rate > 50 ? 'green' : rate > 25 ? 'orange' : 'red'}>{rate.toFixed(1)}%</Tag>;
      },
      sorter: (a, b) => a.purchaseRate - b.purchaseRate,
    },
    {
      title: 'Valor Total',
      key: 'totalValue',
      width: 130,
      align: 'right',
      render: (_, record) => <div className="text-gray-700">{formatCurrency(record.totalValue)}</div>,
      sorter: (a, b) => a.totalValue - b.totalValue,
    },
    {
      title: 'Recibido',
      key: 'totalReceived',
      width: 130,
      align: 'right',
      render: (_, record) => <div className="font-semibold text-green-600">{formatCurrency(record.totalReceived)}</div>,
      sorter: (a, b) => a.totalReceived - b.totalReceived,
    },
    {
      title: 'Invitaciones',
      key: 'invitationCount',
      width: 120,
      align: 'center',
      render: (_, record) => (
        <div>
          <div className="font-semibold text-gray-900">{record.invitationCount || 0}</div>
          <div className="text-xs text-green-600">{record.invitationsAccepted || 0} aceptadas</div>
          <div className="text-xs text-red-600">{record.invitationsRejected || 0} rechazadas</div>
        </div>
      ),
      sorter: (a, b) => (a.invitationCount || 0) - (b.invitationCount || 0),
    },
    {
      title: 'Fecha Boda',
      key: 'weddingDate',
      width: 130,
      render: (_, record) => (
        <div className="text-xs flex items-center gap-1">
          <Calendar className="h-3 w-3" />
          {formatDate(record.weddingDate)}
        </div>
      ),
      sorter: (a, b) => new Date(a.weddingDate).getTime() - new Date(b.weddingDate).getTime(),
    },
    {
      title: 'Última Compra',
      key: 'lastPurchaseDate',
      width: 130,
      render: (_, record) =>
        record.lastPurchaseDate ? (
          <div className="text-xs">{formatDate(record.lastPurchaseDate)}</div>
        ) : (
          <span className="text-gray-400">-</span>
        ),
      sorter: (a, b) => {
        if (!a.lastPurchaseDate) return 1;
        if (!b.lastPurchaseDate) return -1;
        return new Date(a.lastPurchaseDate).getTime() - new Date(b.lastPurchaseDate).getTime();
      },
    },
    {
      title: 'Acciones',
      key: 'actions',
      fixed: 'right',
      width: 180,
      render: (_, record) => (
        <Space size="small">
          <Button size="small" type="link" onClick={() => handleViewDetails(record)}>
            Ver Detalles
          </Button>
          {record.slug && (
            <Button
              size="small"
              type="link"
              icon={<ExternalLink className="h-3 w-3" />}
              onClick={() => handleViewPublicRegistry(record.slug!, record.id)}>
              Ver Lista
            </Button>
          )}
        </Space>
      ),
    },
  ];

  return (
    <div>
      {/* Summary Cards */}
      <Row gutter={16} className="mb-6">
        <Col xs={24} sm={12} lg={6}>
          <Card>
            <Statistic
              title="Total Listas"
              value={summary?.totalWeddingLists || 0}
              prefix={<Gift className="h-4 w-4" />}
              valueStyle={{ color: '#1890ff' }}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <Card>
            <Statistic
              title="Regalos Creados"
              value={summary?.totalGiftsCreated || 0}
              prefix={<Gift className="h-4 w-4" />}
              valueStyle={{ color: '#722ed1' }}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <Card>
            <Statistic
              title="Regalos Comprados"
              value={summary?.totalGiftsPurchased || 0}
              prefix={<TrendingUp className="h-4 w-4" />}
              valueStyle={{ color: '#52c41a' }}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <Card>
            <Statistic
              title="Tasa Promedio"
              value={summary?.averagePurchaseRate.toFixed(1) || 0}
              suffix="%"
              prefix={<Percent className="h-4 w-4" />}
              valueStyle={{ color: '#13c2c2' }}
            />
          </Card>
        </Col>
      </Row>

      <Row gutter={16} className="mb-6">
        <Col xs={24} sm={12}>
          <Card>
            <Statistic
              title="Ingresos Totales"
              value={summary?.totalRevenue || 0}
              prefix={<DollarSign className="h-4 w-4" />}
              valueStyle={{ color: '#52c41a' }}
              formatter={(value) => formatCurrency(Number(value))}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12}>
          <Card>
            <Statistic
              title="Promedio por Lista"
              value={summary?.averageRevenuePerList || 0}
              prefix={<DollarSign className="h-4 w-4" />}
              valueStyle={{ color: '#1890ff' }}
              formatter={(value) => formatCurrency(Number(value))}
            />
          </Card>
        </Col>
      </Row>

      {/* Search and Actions */}
      <div className="mb-4 flex justify-between items-center">
        <Input
          placeholder="Buscar por título, pareja, email o slug..."
          prefix={<Search className="h-4 w-4 text-gray-400" />}
          value={searchText}
          onChange={(e) => setSearchText(e.target.value)}
          style={{ width: 400 }}
          allowClear
        />
        <Button icon={<RefreshCw className="h-4 w-4" />} onClick={onRefresh} loading={isListsLoading}>
          Actualizar
        </Button>
      </div>

      {/* Registries Table */}
      <Table
        columns={columns}
        dataSource={filteredData}
        rowKey="id"
        loading={isListsLoading}
        scroll={{ x: 1600 }}
        pagination={{
          pageSize: 20,
          showSizeChanger: true,
          showTotal: (total) => `Total: ${total} listas`,
        }}
      />

      <RegistryDetailModal
        isOpen={isDetailModalOpen}
        onClose={() => setIsDetailModalOpen(false)}
        registry={selectedList}
        formatDate={formatDate}
        formatDateTime={formatDateTime}
        formatCurrency={formatCurrency}
        onViewPublicRegistry={handleViewPublicRegistry}
        onCopyLink={handleCopyLink}
      />
    </div>
  );
}
