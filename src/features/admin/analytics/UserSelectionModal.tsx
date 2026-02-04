import { useState, useMemo } from 'react';
import { Modal, Table, Input, Tag, Button } from 'antd';
import { Search, Users, Calendar, Mail } from 'lucide-react';
import { CommissionUser } from 'src/services/email.service';
import dayjs from 'dayjs';

interface UserSelectionModalProps {
  isOpen: boolean;
  onClose: () => void;
  users: CommissionUser[];
  onConfirm: (selectedUserIds: number[]) => void;
  isLoading?: boolean;
}

export function UserSelectionModal({ isOpen, onClose, users, onConfirm, isLoading }: UserSelectionModalProps) {
  const [selectedRowKeys, setSelectedRowKeys] = useState<number[]>([]);
  const [searchTerm, setSearchTerm] = useState('');

  const filteredUsers = useMemo(() => {
    if (!searchTerm) return users;

    const search = searchTerm.toLowerCase();
    return users.filter(
      (user) =>
        user.firstName.toLowerCase().includes(search) ||
        user.lastName.toLowerCase().includes(search) ||
        user.email.toLowerCase().includes(search) ||
        (user.spouseFirstName && user.spouseFirstName.toLowerCase().includes(search)) ||
        (user.spouseLastName && user.spouseLastName.toLowerCase().includes(search)),
    );
  }, [users, searchTerm]);

  const handleConfirm = () => {
    onConfirm(selectedRowKeys);
    setSelectedRowKeys([]);
    setSearchTerm('');
  };

  const handleCancel = () => {
    onClose();
    setSelectedRowKeys([]);
    setSearchTerm('');
  };

  const columns = [
    {
      title: 'Pareja',
      dataIndex: 'firstName',
      key: 'couple',
      render: (_: string, record: CommissionUser) => {
        const coupleName = record.spouseFirstName ? `${record.firstName} y ${record.spouseFirstName}` : record.firstName;
        return (
          <div>
            <div className="font-semibold text-gray-900">{coupleName}</div>
            <div className="text-sm text-gray-500">
              {record.lastName}
              {record.spouseLastName && ` / ${record.spouseLastName}`}
            </div>
          </div>
        );
      },
    },
    {
      title: 'Email',
      dataIndex: 'email',
      key: 'email',
      render: (email: string) => (
        <div className="flex items-center gap-2">
          <Mail className="h-4 w-4 text-gray-400" />
          <span className="text-sm">{email}</span>
        </div>
      ),
    },
    {
      title: 'Plan',
      dataIndex: 'planType',
      key: 'planType',
      width: 120,
      align: 'center' as const,
      render: (planType: string) => (
        <Tag color={planType === 'COMMISSION' ? 'green' : 'blue'}>{planType === 'COMMISSION' ? 'Comisión' : 'Fijo'}</Tag>
      ),
    },
    {
      title: 'Listas',
      dataIndex: 'giftListCount',
      key: 'giftListCount',
      width: 100,
      align: 'center' as const,
      render: (count: number) => (
        <Tag color={count > 0 ? 'purple' : 'default'}>
          {count} {count === 1 ? 'lista' : 'listas'}
        </Tag>
      ),
    },
    {
      title: 'Registro',
      dataIndex: 'createdAt',
      key: 'createdAt',
      width: 150,
      render: (date: string) => (
        <div className="flex items-center gap-2 text-sm text-gray-600">
          <Calendar className="h-4 w-4" />
          {dayjs(date).format('DD/MM/YYYY')}
        </div>
      ),
    },
  ];

  const rowSelection = {
    selectedRowKeys,
    onChange: (selectedKeys: React.Key[]) => {
      setSelectedRowKeys(selectedKeys as number[]);
    },
  };

  return (
    <Modal
      title={
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-blue-500 to-purple-500 flex items-center justify-center">
            <Users className="h-5 w-5 text-white" />
          </div>
          <div>
            <h3 className="text-lg font-semibold text-gray-900 m-0">Seleccionar Usuarios</h3>
            <p className="text-sm text-gray-500 m-0">Elige a quién enviar el email de marketing</p>
          </div>
        </div>
      }
      open={isOpen}
      onCancel={handleCancel}
      width={900}
      footer={[
        <Button key="cancel" onClick={handleCancel}>
          Cancelar
        </Button>,
        <Button key="confirm" type="primary" onClick={handleConfirm} disabled={selectedRowKeys.length === 0} loading={isLoading}>
          Enviar a {selectedRowKeys.length} {selectedRowKeys.length === 1 ? 'usuario' : 'usuarios'}
        </Button>,
      ]}>
      <div className="space-y-4">
        {/* Search Bar */}
        <Input
          placeholder="Buscar por nombre, apellido o email..."
          prefix={<Search className="h-4 w-4 text-gray-400" />}
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          size="large"
          allowClear
        />

        {/* Stats */}
        <div className="flex items-center justify-between p-3 bg-blue-50 rounded-lg">
          <div className="flex items-center gap-2">
            <Users className="h-5 w-5 text-blue-600" />
            <span className="text-sm font-medium text-blue-900">{filteredUsers.length} usuarios con plan de comisión</span>
          </div>
          {selectedRowKeys.length > 0 && (
            <Tag color="blue" className="m-0">
              {selectedRowKeys.length} seleccionados
            </Tag>
          )}
        </div>

        {/* Table */}
        <Table
          rowSelection={rowSelection}
          columns={columns}
          dataSource={filteredUsers}
          rowKey="id"
          pagination={{
            pageSize: 10,
            showSizeChanger: false,
            showTotal: (total, range) => `${range[0]}-${range[1]} de ${total} usuarios`,
          }}
          scroll={{ y: 400 }}
        />
      </div>
    </Modal>
  );
}
