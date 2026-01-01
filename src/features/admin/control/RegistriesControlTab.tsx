import { useState } from 'react';
import { Table, Tag, Button, Space, Input, Modal, message, Statistic, Row, Col, Card } from 'antd';
import { Search, RefreshCw, Calendar, Gift, DollarSign, TrendingUp, Percent, ExternalLink } from 'lucide-react';
import dayjs from 'dayjs';
import type { ColumnsType } from 'antd/es/table';
import type { WeddingListAnalytics, UsersListsSummary } from 'services/usersListsAnalytics.service';
import { useUpdateUserPlanType } from 'src/hooks/useUser';

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
  const [isPlanTypeModalOpen, setIsPlanTypeModalOpen] = useState(false);
  const [selectedListForPlanUpdate, setSelectedListForPlanUpdate] = useState<WeddingListAnalytics | null>(null);
  const [newPlanType, setNewPlanType] = useState<'FIXED' | 'COMMISSION' | null>(null);
  const updatePlanTypeMutation = useUpdateUserPlanType();

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

  const handleViewPublicRegistry = (slug: string) => {
    window.open(`https://mesalista.com.mx/${slug}/regalos`, '_blank');
  };

  const handleCopyLink = (slug: string) => {
    navigator.clipboard.writeText(`https://mesalista.com.mx/${slug}/regalos`);
    message.success('Enlace copiado al portapapeles');
  };

  const handleOpenPlanTypeModal = (list: WeddingListAnalytics) => {
    setSelectedListForPlanUpdate(list);
    setNewPlanType(list.couplePlanType || null);
    setIsPlanTypeModalOpen(true);
  };

  const handleUpdatePlanType = async () => {
    if (!selectedListForPlanUpdate || !newPlanType) {
      message.error('Por favor selecciona un tipo de plan');
      return;
    }

    try {
      // We need to get the user ID from the list - it's not directly available in WeddingListAnalytics
      // We'll need to find the user from the usersData or make an API call
      // For now, let's assume we can get it from the email
      const userId = selectedListForPlanUpdate.id; // This is actually the wedding list ID

      // Since we don't have the user ID directly, we'll show a message
      message.warning('Actualizando plan...');

      // We need to pass the correct user ID - let's update this to use a different approach
      // We'll need to modify the backend or pass user ID through the analytics data
      setIsPlanTypeModalOpen(false);
      message.info('Esta funcionalidad requiere el ID del usuario. Por favor usa la pestaña de Usuarios para actualizar el plan.');
    } catch (error) {
      // Error handled by mutation hook
    }
  };

  const filteredData = listsData?.filter((list) => {
    const searchLower = searchText.toLowerCase();
    return (
      list.title.toLowerCase().includes(searchLower) ||
      list.coupleName.toLowerCase().includes(searchLower) ||
      list.coupleEmail.toLowerCase().includes(searchLower) ||
      (list.coupleSlug && list.coupleSlug.toLowerCase().includes(searchLower))
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
          {record.coupleSlug && (
            <div className="text-xs text-blue-600 mt-1 cursor-pointer hover:underline" onClick={() => handleCopyLink(record.coupleSlug!)}>
              /{record.coupleSlug}
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
      width: 100,
      align: 'center',
      render: (_, record) => record.invitationCount || 0,
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
          {record.coupleSlug && (
            <Button
              size="small"
              type="link"
              icon={<ExternalLink className="h-3 w-3" />}
              onClick={() => handleViewPublicRegistry(record.coupleSlug!)}>
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

      {/* Registry Detail Modal */}
      <Modal
        title="Detalles de la Lista de Regalos"
        open={isDetailModalOpen}
        onCancel={() => setIsDetailModalOpen(false)}
        footer={[
          <Button key="close" onClick={() => setIsDetailModalOpen(false)}>
            Cerrar
          </Button>,
          selectedList?.coupleSlug && (
            <Button
              key="view"
              type="primary"
              icon={<ExternalLink className="h-4 w-4" />}
              onClick={() => handleViewPublicRegistry(selectedList.coupleSlug!)}>
              Ver Lista Pública
            </Button>
          ),
        ]}
        width={700}>
        {selectedList && (
          <div className="space-y-4">
            <div>
              <h3 className="font-semibold text-lg mb-2">Información General</h3>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <span className="text-gray-500">Título:</span>
                  <div className="font-medium">{selectedList.title}</div>
                </div>
                <div>
                  <span className="text-gray-500">Pareja:</span>
                  <div className="font-medium">{selectedList.coupleName}</div>
                </div>
                <div>
                  <span className="text-gray-500">Email:</span>
                  <div className="font-medium">{selectedList.coupleEmail}</div>
                </div>
                <div>
                  <span className="text-gray-500">Slug:</span>
                  <div
                    className="font-medium text-blue-600 cursor-pointer hover:underline"
                    onClick={() => handleCopyLink(selectedList.coupleSlug!)}>
                    {selectedList.coupleSlug || 'N/A'}
                  </div>
                </div>
                <div>
                  <span className="text-gray-500">Plan:</span>
                  <div className="font-medium">
                    {selectedList.couplePlanType ? (
                      <Tag color={selectedList.couplePlanType === 'FIXED' ? 'green' : 'blue'}>
                        {selectedList.couplePlanType === 'FIXED' ? 'Fijo' : 'Comisión'}
                      </Tag>
                    ) : (
                      'Sin plan'
                    )}
                  </div>
                </div>
                <div>
                  <span className="text-gray-500">Fecha de Creación:</span>
                  <div className="font-medium">{formatDateTime(selectedList.createdAt)}</div>
                </div>
              </div>
            </div>

            <div>
              <h3 className="font-semibold text-lg mb-2">Fecha de Boda</h3>
              <div className="bg-purple-50 p-4 rounded-lg">
                <div className="flex items-center gap-2">
                  <Calendar className="h-5 w-5 text-purple-600" />
                  <span className="text-xl font-semibold text-purple-900">{formatDate(selectedList.weddingDate)}</span>
                </div>
              </div>
            </div>

            <div>
              <h3 className="font-semibold text-lg mb-2">Estadísticas de Regalos</h3>
              <div className="bg-gray-50 p-4 rounded-lg">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <span className="text-gray-500">Total Regalos:</span>
                    <div className="font-medium text-2xl">{selectedList.totalGifts}</div>
                  </div>
                  <div>
                    <span className="text-gray-500">Regalos Comprados:</span>
                    <div className="font-medium text-2xl text-green-600">{selectedList.purchasedGifts}</div>
                  </div>
                  <div>
                    <span className="text-gray-500">Tasa de Compra:</span>
                    <div className="font-medium">
                      <Tag
                        color={selectedList.purchaseRate > 50 ? 'green' : selectedList.purchaseRate > 25 ? 'orange' : 'red'}
                        className="text-lg">
                        {selectedList.purchaseRate.toFixed(1)}%
                      </Tag>
                    </div>
                  </div>
                  <div>
                    <span className="text-gray-500">Invitaciones:</span>
                    <div className="font-medium text-2xl">{selectedList.invitationCount || 0}</div>
                  </div>
                </div>
              </div>
            </div>

            <div>
              <h3 className="font-semibold text-lg mb-2">Información Financiera</h3>
              <div className="bg-green-50 p-4 rounded-lg">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <span className="text-gray-500">Valor Total:</span>
                    <div className="font-semibold text-2xl text-gray-900">{formatCurrency(selectedList.totalValue)}</div>
                  </div>
                  <div>
                    <span className="text-gray-500">Total Recibido:</span>
                    <div className="font-semibold text-2xl text-green-600">{formatCurrency(selectedList.totalReceived)}</div>
                  </div>
                </div>
              </div>
            </div>

            <div>
              <h3 className="font-semibold text-lg mb-2">Actividad</h3>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <span className="text-gray-500">Última Compra:</span>
                  <div className="font-medium">
                    {selectedList.lastPurchaseDate ? formatDateTime(selectedList.lastPurchaseDate) : 'Sin compras aún'}
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}
