import { useState } from 'react';
import { Table, Tag, Button, Space, Input, Modal, message, Statistic, Row, Col, Card } from 'antd';
import { Search, RefreshCw, Mail, Phone, Calendar, Users, DollarSign, UserCheck, UserX, Trash2, Edit } from 'lucide-react';
import dayjs from 'dayjs';
import type { ColumnsType } from 'antd/es/table';
import type { UserAnalytics, UsersListsSummary } from 'services/usersListsAnalytics.service';
import { useDeleteUser, useUpdateUserPlanType } from 'src/hooks/useUser';
import { UserDetailModal, PlanTypeUpdateModal } from './index';

interface UsersControlTabProps {
  summary: UsersListsSummary | undefined;
  usersData: UserAnalytics[] | undefined;
  isUsersLoading: boolean;
  onRefresh: () => void;
}

export function UsersControlTab({ summary, usersData, isUsersLoading, onRefresh }: UsersControlTabProps) {
  const [searchText, setSearchText] = useState('');
  const [selectedUser, setSelectedUser] = useState<UserAnalytics | null>(null);
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);
  const [isPlanTypeModalOpen, setIsPlanTypeModalOpen] = useState(false);
  const [editingPlanUser, setEditingPlanUser] = useState<UserAnalytics | null>(null);
  const [newPlanType, setNewPlanType] = useState<'FIXED' | 'COMMISSION' | null>(null);
  const deleteUserMutation = useDeleteUser();
  const updatePlanTypeMutation = useUpdateUserPlanType();

  const formatDate = (date: string) => {
    return dayjs(date).format('DD/MMM/YYYY HH:mm');
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('es-MX', {
      style: 'currency',
      currency: 'MXN',
    }).format(amount);
  };

  const handleViewDetails = (user: UserAnalytics) => {
    setSelectedUser(user);
    setIsDetailModalOpen(true);
  };

  const handleCopySlug = (slug: string, listId: number) => {
    navigator.clipboard.writeText(`https://mesalista.com.mx/${slug}/regalos?listId=${listId}`);
    message.success('Enlace copiado al portapapeles');
  };

  const handleDeleteUser = (user: UserAnalytics) => {
    Modal.confirm({
      title: '¿Eliminar usuario?',
      content: (
        <div>
          <p>
            ¿Estás seguro de que deseas eliminar a{' '}
            <strong>
              {user.firstName} {user.lastName}
            </strong>
            ?
          </p>
          <p className="text-red-600 font-semibold mt-2">Esta acción eliminará permanentemente:</p>
          <ul className="list-disc ml-5 mt-2">
            <li>El usuario y toda su información</li>
            {user.weddingList && <li>Su lista de regalos y todos los regalos ({user.weddingList.totalGifts} regalos)</li>}
            <li>Todas las sesiones y datos relacionados</li>
          </ul>
          <p className="text-red-600 font-semibold mt-2">Esta acción no se puede deshacer.</p>
        </div>
      ),
      okText: 'Sí, eliminar',
      okType: 'danger',
      cancelText: 'Cancelar',
      onOk: async () => {
        try {
          await deleteUserMutation.mutateAsync(user.id);
          onRefresh();
        } catch (error) {
          // Error is already handled by the mutation hook
        }
      },
    });
  };

  const handleOpenPlanTypeModal = (user: UserAnalytics) => {
    setEditingPlanUser(user);
    setNewPlanType(user.planType || null);
    setIsPlanTypeModalOpen(true);
  };

  const handleUpdatePlanType = async () => {
    if (!editingPlanUser || !newPlanType) {
      message.error('Por favor selecciona un tipo de plan');
      return;
    }

    try {
      await updatePlanTypeMutation.mutateAsync({ userId: editingPlanUser.id, planType: newPlanType });
      setIsPlanTypeModalOpen(false);
      setEditingPlanUser(null);
      setNewPlanType(null);
      onRefresh();
    } catch (error) {
      // Error is already handled by the mutation hook
    }
  };

  const filteredData = usersData?.filter((user) => {
    const searchLower = searchText.toLowerCase();
    return (
      user.email.toLowerCase().includes(searchLower) ||
      user.firstName.toLowerCase().includes(searchLower) ||
      user.lastName.toLowerCase().includes(searchLower) ||
      (user.spouseFirstName && user.spouseFirstName.toLowerCase().includes(searchLower)) ||
      (user.slug && user.slug.toLowerCase().includes(searchLower))
    );
  });

  const columns: ColumnsType<UserAnalytics> = [
    {
      title: 'Usuario',
      key: 'user',
      fixed: 'left',
      width: 250,
      render: (_, record) => (
        <div>
          <div className="font-semibold text-gray-900">
            {record.firstName} {record.lastName}
            {record.spouseFirstName && ` y ${record.spouseFirstName}`}
          </div>
          <div className="text-xs text-gray-500 flex items-center gap-1 mt-1">
            <Mail className="h-3 w-3" />
            {record.email}
          </div>
          {record.slug && record.weddingList && (
            <div
              className="text-xs text-blue-600 mt-1 cursor-pointer hover:underline"
              onClick={() => handleCopySlug(record.slug!, record.weddingList!.id)}>
              /{record.slug}
            </div>
          )}
        </div>
      ),
    },
    {
      title: 'Rol',
      key: 'role',
      width: 100,
      render: (_, record) => {
        const hasWeddingList = !!record.weddingList;
        return hasWeddingList ? <Tag color="purple">PAREJA</Tag> : <Tag color="default">INVITADO</Tag>;
      },
      filters: [
        { text: 'Pareja', value: 'couple' },
        { text: 'Invitado', value: 'guest' },
      ],
      onFilter: (value, record) => {
        if (value === 'couple') return !!record.weddingList;
        return !record.weddingList;
      },
    },
    {
      title: 'Plan',
      key: 'planType',
      width: 120,
      render: (_, record) => {
        if (!record.planType) return <Tag>Sin Plan</Tag>;
        return <Tag color={record.planType === 'FIXED' ? 'green' : 'blue'}>{record.planType === 'FIXED' ? 'Fijo' : 'Comisión'}</Tag>;
      },
      filters: [
        { text: 'Fijo', value: 'FIXED' },
        { text: 'Comisión', value: 'COMMISSION' },
        { text: 'Sin Plan', value: 'none' },
      ],
      onFilter: (value, record) => {
        if (value === 'none') return !record.planType;
        return record.planType === value;
      },
    },
    {
      title: 'Código Desc.',
      key: 'discountCode',
      width: 120,
      render: (_, record) => {
        return record.discountCode ? <Tag color="orange">{record.discountCode}</Tag> : '-';
      },
    },
    {
      title: 'Lista de Regalos',
      key: 'weddingList',
      width: 180,
      render: (_, record) => {
        if (!record.weddingList) return <span className="text-gray-400">Sin lista</span>;
        return (
          <div>
            <div className="text-sm font-medium">{record.weddingList.title}</div>
            <div className="text-xs text-gray-500">
              {record.weddingList.totalGifts} regalos • {record.weddingList.purchasedGifts} comprados
            </div>
            <div className="text-xs text-green-600 font-semibold">{formatCurrency(record.weddingList.totalReceived)}</div>
          </div>
        );
      },
    },
    {
      title: 'Teléfono',
      key: 'phone',
      width: 130,
      render: (_, record) => {
        return record.phoneNumber ? (
          <div className="flex items-center gap-1 text-xs">
            <Phone className="h-3 w-3" />
            {record.phoneNumber}
          </div>
        ) : (
          '-'
        );
      },
    },
    {
      title: 'Fecha Registro',
      key: 'createdAt',
      width: 150,
      render: (_, record) => (
        <div className="text-xs">
          <div className="flex items-center gap-1">
            <Calendar className="h-3 w-3" />
            {formatDate(record.createdAt)}
          </div>
        </div>
      ),
      sorter: (a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime(),
      defaultSortOrder: 'descend',
    },
    {
      title: 'Acciones',
      key: 'actions',
      fixed: 'right',
      width: 250,
      render: (_, record) => (
        <Space size="small" wrap>
          <Button size="small" type="primary" onClick={() => handleViewDetails(record)}>
            Ver Detalles
          </Button>
          {record.planType && (
            <Button size="small" type="default" icon={<Edit className="h-3 w-3" />} onClick={() => handleOpenPlanTypeModal(record)}>
              Editar Plan
            </Button>
          )}
          <Button
            size="small"
            type="default"
            danger
            icon={<Trash2 className="h-3 w-3" />}
            onClick={() => handleDeleteUser(record)}
            loading={deleteUserMutation.isPending}>
            Eliminar
          </Button>
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
              title="Total Usuarios"
              value={summary?.totalUsers || 0}
              prefix={<Users className="h-4 w-4" />}
              valueStyle={{ color: '#1890ff' }}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <Card>
            <Statistic
              title="Parejas"
              value={summary?.totalCouples || 0}
              prefix={<UserCheck className="h-4 w-4" />}
              valueStyle={{ color: '#722ed1' }}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <Card>
            <Statistic
              title="Invitados"
              value={summary?.totalGuests || 0}
              prefix={<UserX className="h-4 w-4" />}
              valueStyle={{ color: '#52c41a' }}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <Card>
            <Statistic
              title="Plan Fijo"
              value={summary?.fixedPlanUsers || 0}
              prefix={<DollarSign className="h-4 w-4" />}
              valueStyle={{ color: '#13c2c2' }}
            />
          </Card>
        </Col>
      </Row>

      {/* Search and Actions */}
      <div className="mb-4 flex justify-between items-center">
        <Input
          placeholder="Buscar por nombre, email o slug..."
          prefix={<Search className="h-4 w-4 text-gray-400" />}
          value={searchText}
          onChange={(e) => setSearchText(e.target.value)}
          style={{ width: 400 }}
          allowClear
        />
        <Button icon={<RefreshCw className="h-4 w-4" />} onClick={onRefresh} loading={isUsersLoading}>
          Actualizar
        </Button>
      </div>

      {/* Users Table */}
      <Table
        columns={columns}
        dataSource={filteredData}
        rowKey="id"
        loading={isUsersLoading}
        scroll={{ x: 1400 }}
        pagination={{
          pageSize: 20,
          showSizeChanger: true,
          showTotal: (total) => `Total: ${total} usuarios`,
        }}
      />

      <UserDetailModal
        isOpen={isDetailModalOpen}
        onClose={() => setIsDetailModalOpen(false)}
        user={selectedUser}
        formatDate={formatDate}
        formatCurrency={formatCurrency}
      />

      <PlanTypeUpdateModal
        isOpen={isPlanTypeModalOpen}
        onClose={() => {
          setIsPlanTypeModalOpen(false);
          setEditingPlanUser(null);
          setNewPlanType(null);
        }}
        onUpdate={handleUpdatePlanType}
        user={editingPlanUser}
        newPlanType={newPlanType}
        onPlanTypeChange={setNewPlanType}
        isLoading={updatePlanTypeMutation.isPending}
      />
    </div>
  );
}
