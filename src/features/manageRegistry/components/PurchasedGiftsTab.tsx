import { Table, Tag, Typography, Empty, Spin } from 'antd';
import type { ColumnsType } from 'antd/es/table';
import { usePurchasedGiftsByWeddingList } from 'src/hooks/usePayment';
import type { PurchasedGift } from 'src/services/payment.service';
import { useDeviceType } from 'src/hooks/useDeviceType';

const { Text } = Typography;

interface PurchasedGiftsTabProps {
  weddingListId?: number;
}

export const PurchasedGiftsTab: React.FC<PurchasedGiftsTabProps> = ({ weddingListId }) => {
  const { data, isLoading, error } = usePurchasedGiftsByWeddingList(weddingListId);
  const deviceType = useDeviceType();

  const columns: ColumnsType<PurchasedGift> = [
    {
      title: 'Regalo',
      dataIndex: 'giftTitle',
      key: 'giftTitle',
      width: 200,
      fixed: ['mobile', 'small-tablet'].includes(deviceType) ? false : 'left',
      render: (text: string) => <Text strong>{text}</Text>,
    },
    {
      title: 'Invitado',
      dataIndex: 'guestName',
      key: 'guestName',
      width: 150,
    },
    {
      title: 'RSVP',
      dataIndex: 'rsvpInvitee',
      key: 'rsvpInvitee',
      width: 150,
      render: (_: any, record: PurchasedGift) => {
        if (record.rsvpInvitee) {
          const statusColor =
            record.rsvpInvitee.status === 'CONFIRMED' ? 'green' : record.rsvpInvitee.status === 'REJECTED' ? 'red' : 'orange';
          return (
            <div className="flex flex-col gap-1">
              <Text strong>{`${record.rsvpInvitee.firstName} ${record.rsvpInvitee.lastName}`}</Text>
              <Tag color={statusColor} className="w-fit">
                {record.rsvpInvitee.status}
              </Tag>
            </div>
          );
        }
        return <Text type="secondary">Sin RSVP</Text>;
      },
    },
    {
      title: 'Mensaje',
      dataIndex: 'message',
      key: 'message',
      width: 250,
      ellipsis: true,
      render: (text: string) => text || <Text type="secondary">Sin mensaje</Text>,
    },
    {
      title: 'Cantidad',
      dataIndex: 'quantity',
      key: 'quantity',
      width: 100,
      align: 'center',
    },
    {
      title: 'Precio Unitario',
      dataIndex: 'price',
      key: 'price',
      width: 130,
      align: 'right',
      render: (price: number, record: PurchasedGift) => (
        <Text>
          {new Intl.NumberFormat('es-MX', {
            style: 'currency',
            currency: record.currency.toUpperCase(),
          }).format(price)}
        </Text>
      ),
    },
    {
      title: 'Total',
      dataIndex: 'totalPrice',
      key: 'totalPrice',
      width: 130,
      align: 'right',
      render: (totalPrice: number, record: PurchasedGift) => (
        <Text strong>
          {new Intl.NumberFormat('es-MX', {
            style: 'currency',
            currency: record.currency.toUpperCase(),
          }).format(totalPrice)}
        </Text>
      ),
    },
    {
      title: 'Categoría',
      dataIndex: 'categories',
      key: 'categories',
      width: 150,
      render: (categories: string) => {
        const categoryList = categories.split(', ').filter(Boolean);
        return (
          <div className="flex flex-wrap gap-1">
            {categoryList.map((category, index) => (
              <Tag key={index} color="blue">
                {category}
              </Tag>
            ))}
          </div>
        );
      },
    },
    {
      title: 'Método de Pago',
      dataIndex: 'paymentType',
      key: 'paymentType',
      width: 130,
      align: 'center',
      render: (paymentType: string) => {
        const color = paymentType === 'STRIPE' ? 'purple' : paymentType === 'PAYPAL' ? 'blue' : 'green';
        return <Tag color={color}>{paymentType}</Tag>;
      },
    },
    {
      title: 'Fecha de Pago',
      dataIndex: 'paymentDate',
      key: 'paymentDate',
      width: 150,
      render: (date: string) =>
        new Date(date).toLocaleDateString('es-MX', {
          year: 'numeric',
          month: 'short',
          day: 'numeric',
        }),
    },
  ];

  if (isLoading) {
    return (
      <div className="flex justify-center items-center py-12">
        <Spin size="large" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex justify-center items-center py-12">
        <Text type="danger">Error al cargar los regalos comprados</Text>
      </div>
    );
  }

  const purchasedGifts = data?.data || [];

  if (purchasedGifts.length === 0) {
    return <Empty description="Aún no hay regalos comprados" image={Empty.PRESENTED_IMAGE_SIMPLE} />;
  }

  // Calculate totals
  const totalAmount = purchasedGifts.reduce((sum: number, gift: PurchasedGift) => sum + gift.totalPrice, 0);
  const totalGifts = purchasedGifts.length;
  const currency = purchasedGifts[0]?.currency || 'MXN';

  return (
    <div className="space-y-4">
      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-blue-50 p-4 rounded-lg">
          <Text type="secondary" className="block text-sm">
            Total de Regalos Comprados
          </Text>
          <Text className="text-2xl font-bold">{totalGifts}</Text>
        </div>
        <div className="bg-green-50 p-4 rounded-lg">
          <Text type="secondary" className="block text-sm">
            Monto Total Recibido
          </Text>
          <Text className="text-2xl font-bold">
            {new Intl.NumberFormat('es-MX', {
              style: 'currency',
              currency: currency.toUpperCase(),
            }).format(totalAmount)}
          </Text>
        </div>
        <div className="bg-purple-50 p-4 rounded-lg">
          <Text type="secondary" className="block text-sm">
            Promedio por Regalo
          </Text>
          <Text className="text-2xl font-bold">
            {new Intl.NumberFormat('es-MX', {
              style: 'currency',
              currency: currency.toUpperCase(),
            }).format(totalAmount / totalGifts)}
          </Text>
        </div>
      </div>

      {/* Table */}
      <Table
        columns={columns}
        dataSource={purchasedGifts}
        rowKey="id"
        scroll={{ x: 1550 }}
        pagination={{
          pageSize: 10,
          showSizeChanger: true,
          showTotal: (total) => `Total: ${total} regalos comprados`,
        }}
      />
    </div>
  );
};
