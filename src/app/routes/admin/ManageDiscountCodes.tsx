import { useState } from 'react';
import { Card, Table, Button, message, Spin, Tag, Popconfirm } from 'antd';
import { PlusOutlined, EditOutlined, DeleteOutlined, EyeOutlined } from '@ant-design/icons';
import { Shield, Tag as TagIcon } from 'lucide-react';
import { useCurrentUser } from 'hooks/useUser';
import {
  useDiscountCodes,
  useCreateDiscountCode,
  useUpdateDiscountCode,
  useDeleteDiscountCode,
  useDiscountCodeStats,
} from 'hooks/useDiscountCode';
import type { DiscountCode, CreateDiscountCodeRequest, UpdateDiscountCodeRequest } from 'services/discountCode.service';
import { CreateDiscountCodeModal } from 'features/admin/discountCodes/components/CreateDiscountCodeModal';
import { EditDiscountCodeModal } from 'features/admin/discountCodes/components/EditDiscountCodeModal';
import { DiscountCodeStatsModal } from 'features/admin/discountCodes/components/DiscountCodeStatsModal';
import dayjs from 'dayjs';

export function ManageDiscountCodes() {
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isStatsModalOpen, setIsStatsModalOpen] = useState(false);
  const [selectedCode, setSelectedCode] = useState<DiscountCode | null>(null);

  // Auth check
  const { data: user, isLoading: isUserLoading } = useCurrentUser();

  // Data fetching
  const { data: discountCodes, isLoading: isCodesLoading } = useDiscountCodes();
  const { data: codeStats, isLoading: isStatsLoading } = useDiscountCodeStats(selectedCode?.id || 0);

  // Mutations
  const createMutation = useCreateDiscountCode();
  const updateMutation = useUpdateDiscountCode();
  const deleteMutation = useDeleteDiscountCode();

  // Check admin access
  if (isUserLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Spin size="large" />
      </div>
    );
  }

  if (!user || user.role !== 'ADMIN') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <Card className="max-w-md">
          <div className="text-center">
            <Shield className="w-16 h-16 text-red-500 mx-auto mb-4" />
            <h2 className="text-2xl font-bold mb-2">Acceso Denegado</h2>
            <p className="text-gray-600">No tienes permisos para acceder a esta página.</p>
          </div>
        </Card>
      </div>
    );
  }

  const handleCreate = async (data: CreateDiscountCodeRequest) => {
    try {
      await createMutation.mutateAsync(data);
      message.success('Código de descuento creado exitosamente');
      setIsCreateModalOpen(false);
    } catch (error: any) {
      message.error(error.response?.data?.message || 'Error al crear código de descuento');
      throw error;
    }
  };

  const handleEdit = async (id: number, data: UpdateDiscountCodeRequest) => {
    try {
      await updateMutation.mutateAsync({ id, data });
      message.success('Código de descuento actualizado exitosamente');
      setIsEditModalOpen(false);
      setSelectedCode(null);
    } catch (error: any) {
      message.error(error.response?.data?.message || 'Error al actualizar código de descuento');
      throw error;
    }
  };

  const handleDelete = async (id: number) => {
    try {
      await deleteMutation.mutateAsync(id);
      message.success('Código de descuento eliminado exitosamente');
    } catch (error: any) {
      message.error(error.response?.data?.message || 'Error al eliminar código de descuento');
    }
  };

  const openEditModal = (code: DiscountCode) => {
    setSelectedCode(code);
    setIsEditModalOpen(true);
  };

  const openStatsModal = (code: DiscountCode) => {
    setSelectedCode(code);
    setIsStatsModalOpen(true);
  };

  const columns = [
    {
      title: 'Código',
      dataIndex: 'code',
      key: 'code',
      render: (code: string) => <span className="font-mono font-bold">{code}</span>,
    },
    {
      title: 'Tipo',
      dataIndex: 'discountType',
      key: 'discountType',
      render: (type: string) => (
        <Tag color={type === 'PERCENTAGE' ? 'blue' : 'green'}>
          {type === 'PERCENTAGE' ? 'Porcentaje' : 'Cantidad Fija'}
        </Tag>
      ),
    },
    {
      title: 'Valor',
      dataIndex: 'discountValue',
      key: 'discountValue',
      render: (value: number, record: DiscountCode) =>
        record.discountType === 'PERCENTAGE' ? `${value}%` : `$${value} MXN`,
    },
    {
      title: 'Uso',
      key: 'usage',
      render: (_: any, record: DiscountCode) => (
        <span>
          {record.usageCount} / {record.usageLimit}
        </span>
      ),
    },
    {
      title: 'Estado',
      dataIndex: 'isActive',
      key: 'isActive',
      render: (isActive: boolean, record: DiscountCode) => {
        const isExpired = record.expiresAt && new Date(record.expiresAt) < new Date();
        const isExhausted = record.usageCount >= record.usageLimit;

        if (isExpired) return <Tag color="red">Expirado</Tag>;
        if (isExhausted) return <Tag color="orange">Agotado</Tag>;
        if (!isActive) return <Tag color="default">Inactivo</Tag>;
        return <Tag color="green">Activo</Tag>;
      },
    },
    {
      title: 'Expira',
      dataIndex: 'expiresAt',
      key: 'expiresAt',
      render: (date: string | null) => (date ? dayjs(date).format('DD/MM/YYYY') : 'Sin expiración'),
    },
    {
      title: 'Acciones',
      key: 'actions',
      render: (_: any, record: DiscountCode) => (
        <div className="flex gap-2">
          <Button size="small" icon={<EyeOutlined />} onClick={() => openStatsModal(record)}>
            Ver
          </Button>
          <Button size="small" icon={<EditOutlined />} onClick={() => openEditModal(record)}>
            Editar
          </Button>
          <Popconfirm
            title="¿Eliminar código?"
            description="Esta acción no se puede deshacer"
            onConfirm={() => handleDelete(record.id)}
            okText="Sí"
            cancelText="No">
            <Button size="small" danger icon={<DeleteOutlined />}>
              Eliminar
            </Button>
          </Popconfirm>
        </div>
      ),
    },
  ];

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8 flex justify-between items-center">
          <div>
            <h1 className="text-4xl font-bold text-gray-900 mb-2">Códigos de Descuento</h1>
            <p className="text-gray-600">Administra los códigos de descuento para nuevos registros</p>
          </div>
          <Button type="primary" icon={<PlusOutlined />} onClick={() => setIsCreateModalOpen(true)} size="large">
            Crear Código
          </Button>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
          <Card>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-600 text-sm">Total Códigos</p>
                <p className="text-2xl font-bold">{discountCodes?.length || 0}</p>
              </div>
              <TagIcon className="w-8 h-8 text-blue-500" />
            </div>
          </Card>
          <Card>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-600 text-sm">Códigos Activos</p>
                <p className="text-2xl font-bold text-green-600">
                  {discountCodes?.filter((c) => c.isActive && c.usageCount < c.usageLimit).length || 0}
                </p>
              </div>
              <TagIcon className="w-8 h-8 text-green-500" />
            </div>
          </Card>
          <Card>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-600 text-sm">Total Usos</p>
                <p className="text-2xl font-bold">{discountCodes?.reduce((sum, c) => sum + c.usageCount, 0) || 0}</p>
              </div>
              <TagIcon className="w-8 h-8 text-purple-500" />
            </div>
          </Card>
          <Card>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-600 text-sm">Códigos Agotados</p>
                <p className="text-2xl font-bold text-orange-600">
                  {discountCodes?.filter((c) => c.usageCount >= c.usageLimit).length || 0}
                </p>
              </div>
              <TagIcon className="w-8 h-8 text-orange-500" />
            </div>
          </Card>
        </div>

        {/* Table */}
        <Card>
          <Table
            columns={columns}
            dataSource={discountCodes}
            rowKey="id"
            loading={isCodesLoading}
            pagination={{ pageSize: 10 }}
          />
        </Card>

        {/* Modals */}
        <CreateDiscountCodeModal
          open={isCreateModalOpen}
          onCancel={() => setIsCreateModalOpen(false)}
          onSubmit={handleCreate}
          isLoading={createMutation.isPending}
        />

        <EditDiscountCodeModal
          open={isEditModalOpen}
          discountCode={selectedCode}
          onCancel={() => {
            setIsEditModalOpen(false);
            setSelectedCode(null);
          }}
          onSubmit={handleEdit}
          isLoading={updateMutation.isPending}
        />

        <DiscountCodeStatsModal
          open={isStatsModalOpen}
          discountCode={selectedCode}
          stats={codeStats}
          isLoading={isStatsLoading}
          onCancel={() => {
            setIsStatsModalOpen(false);
            setSelectedCode(null);
          }}
        />
      </div>
    </div>
  );
}
