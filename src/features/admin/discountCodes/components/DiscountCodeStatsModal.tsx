import { Modal, Card, Table, Spin } from 'antd';
import { DiscountCode, DiscountCodeWithUsers } from 'services/discountCode.service';
import dayjs from 'dayjs';

interface DiscountCodeStatsModalProps {
  open: boolean;
  discountCode: DiscountCode | null;
  stats: DiscountCodeWithUsers | undefined;
  isLoading: boolean;
  onCancel: () => void;
}

export const DiscountCodeStatsModal = ({ open, discountCode, stats, isLoading, onCancel }: DiscountCodeStatsModalProps) => {
  const columns = [
    { title: 'Email', dataIndex: 'email', key: 'email' },
    {
      title: 'Nombre',
      key: 'name',
      render: (_: any, record: any) => `${record.firstName} ${record.lastName}`,
    },
    {
      title: 'Fecha de Registro',
      dataIndex: 'createdAt',
      key: 'createdAt',
      render: (date: string) => dayjs(date).format('DD/MM/YYYY HH:mm'),
    },
  ];

  return (
    <Modal
      title={`Estadísticas: ${discountCode?.code}`}
      open={open}
      onCancel={onCancel}
      footer={null}
      width={800}>
      {isLoading ? (
        <div className="text-center py-8">
          <Spin />
        </div>
      ) : stats ? (
        <div>
          <div className="grid grid-cols-2 gap-4 mb-6">
            <Card size="small">
              <p className="text-gray-600 text-sm">Usos Totales</p>
              <p className="text-2xl font-bold">{stats.usageCount}</p>
            </Card>
            <Card size="small">
              <p className="text-gray-600 text-sm">Usos Restantes</p>
              <p className="text-2xl font-bold">{stats.usageLimit - stats.usageCount}</p>
            </Card>
          </div>

          <h3 className="text-lg font-semibold mb-4">Usuarios que usaron este código</h3>
          <Table dataSource={stats.users} rowKey="id" pagination={{ pageSize: 5 }} columns={columns} />
        </div>
      ) : null}
    </Modal>
  );
};
