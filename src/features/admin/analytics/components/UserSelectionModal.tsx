import { useState, useMemo } from 'react';
import { Modal, Table, Input, Tag, Button } from 'antd';
import { Search, Users, Calendar, Mail } from 'lucide-react';
import { CommissionUser } from 'src/services/email.service';
import { SignupEmail } from 'src/services/signupEmail.service';
import dayjs from 'dayjs';

export interface UnifiedRow {
  rowKey: string;
  type: 'user' | 'lead';
  email: string;
  firstName: string;
  lastName: string;
  spouseFirstName?: string;
  spouseLastName?: string;
  planType?: string;
  giftListCount?: number;
  source?: string;
  convertedToUser?: boolean;
  createdAt: string;
  userId?: number;
}

interface UserSelectionModalProps {
  isOpen: boolean;
  onClose: () => void;
  users: CommissionUser[];
  leads?: SignupEmail[];
  onConfirm: (selectedUserIds: number[], selectedLeads: { email: string; firstName?: string | null }[]) => void;
  isLoading?: boolean;
}

function buildUnifiedRows(users: CommissionUser[], leads: SignupEmail[]): UnifiedRow[] {
  const userRows: UnifiedRow[] = users.map((u) => ({
    rowKey: `user-${u.id}`,
    type: 'user' as const,
    email: u.email,
    firstName: u.firstName,
    lastName: u.lastName,
    spouseFirstName: u.spouseFirstName || undefined,
    spouseLastName: u.spouseLastName || undefined,
    planType: u.planType,
    giftListCount: u.giftListCount,
    createdAt: u.createdAt,
    userId: u.id,
  }));

  const leadRows: UnifiedRow[] = leads.map((l) => ({
    rowKey: `lead-${l.id}`,
    type: 'lead',
    email: l.email,
    firstName: l.firstName || '',
    lastName: l.lastName || '',
    source: l.source,
    convertedToUser: l.convertedToUser,
    createdAt: l.createdAt,
  }));

  return [...userRows, ...leadRows];
}

export function UserSelectionModal({ isOpen, onClose, users, leads = [], onConfirm, isLoading }: UserSelectionModalProps) {
  const [selectedRowKeys, setSelectedRowKeys] = useState<string[]>([]);
  const [searchTerm, setSearchTerm] = useState('');

  const allRows = useMemo(() => buildUnifiedRows(users, leads), [users, leads]);

  const filteredRows = useMemo(() => {
    if (!searchTerm) return allRows;

    const search = searchTerm.toLowerCase();
    return allRows.filter(
      (row) =>
        row.firstName.toLowerCase().includes(search) ||
        row.lastName.toLowerCase().includes(search) ||
        row.email.toLowerCase().includes(search) ||
        (row.spouseFirstName && row.spouseFirstName.toLowerCase().includes(search)) ||
        (row.spouseLastName && row.spouseLastName.toLowerCase().includes(search)),
    );
  }, [allRows, searchTerm]);

  const handleConfirm = () => {
    const selectedUserIds: number[] = [];
    const selectedLeads: { email: string; firstName?: string | null }[] = [];

    for (const key of selectedRowKeys) {
      const row = allRows.find((r) => r.rowKey === key);
      if (!row) continue;
      if (row.type === 'user' && row.userId) {
        selectedUserIds.push(row.userId);
      } else if (row.type === 'lead') {
        selectedLeads.push({ email: row.email, firstName: row.firstName || null });
      }
    }

    onConfirm(selectedUserIds, selectedLeads);
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
      title: 'Nombre',
      dataIndex: 'firstName',
      key: 'name',
      render: (_: string, record: UnifiedRow) => {
        if (record.type === 'user') {
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
        }
        const name = [record.firstName, record.lastName].filter(Boolean).join(' ');
        return (
          <div>
            <div className="font-semibold text-gray-900">{name || <span className="text-gray-400">Sin nombre</span>}</div>
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
      title: 'Tipo',
      key: 'type',
      width: 120,
      align: 'center' as const,
      render: (_: any, record: UnifiedRow) => {
        if (record.type === 'lead') {
          return <Tag color="orange">Lead</Tag>;
        }
        return (
          <Tag color={record.planType === 'COMMISSION' ? 'green' : 'blue'}>{record.planType === 'COMMISSION' ? 'Comisión' : 'Fijo'}</Tag>
        );
      },
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
      setSelectedRowKeys(selectedKeys as string[]);
    },
  };

  const userCount = filteredRows.filter((r) => r.type === 'user').length;
  const leadCount = filteredRows.filter((r) => r.type === 'lead').length;

  return (
    <Modal
      title={
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-blue-500 to-purple-500 flex items-center justify-center">
            <Users className="h-5 w-5 text-white" />
          </div>
          <div>
            <h3 className="text-lg font-semibold text-gray-900 m-0">Seleccionar Destinatarios</h3>
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
          Enviar a {selectedRowKeys.length} {selectedRowKeys.length === 1 ? 'destinatario' : 'destinatarios'}
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
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <Users className="h-5 w-5 text-blue-600" />
              <span className="text-sm font-medium text-blue-900">
                {userCount > 0 && `${userCount} usuarios`}
                {userCount > 0 && leadCount > 0 && ', '}
                {leadCount > 0 && `${leadCount} leads`}
              </span>
            </div>
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
          dataSource={filteredRows}
          rowKey="rowKey"
          pagination={{
            pageSize: 10,
            showSizeChanger: false,
            showTotal: (total, range) => `${range[0]}-${range[1]} de ${total}`,
          }}
          scroll={{ y: 400 }}
        />
      </div>
    </Modal>
  );
}
