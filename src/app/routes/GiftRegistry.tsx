import React from 'react';
import { Typography, Button, Table, Tag, Input, Space } from 'antd';
import { PlusOutlined, EditOutlined, DeleteOutlined, SearchOutlined } from '@ant-design/icons';
import { useQuery } from '@tanstack/react-query';
import { useOutletContext } from 'react-router-dom';
import type { Gift } from '@prisma/client';
import type { DashboardUserData } from 'services/user.service';
import { giftService } from 'services/gift.service';
import { CreateWeddingGift } from 'components/CreateWeddingGift';

const { Title, Paragraph } = Typography;

interface GiftRegistryProps {
  userData?: DashboardUserData;
}

type OutletContextType = {
  userData?: DashboardUserData;
  isLoading: boolean;
  isCouple: boolean;
};

// Using Gift type from giftService

// Removed mock gifts - using real data from backend

const GiftRegistry: React.FC<GiftRegistryProps> = (props) => {
  // Use props if provided directly, otherwise use context from Outlet
  const contextData = useOutletContext<OutletContextType>();
  const userData = props.userData || contextData?.userData;
  const [isModalVisible, setIsModalVisible] = React.useState(false);

  // Fetch wedding list for the couple
  const {
    data: weddingList,
    isLoading: isLoadingWeddingList,
    error: weddingListError,
  } = useQuery({
    queryKey: ['weddingList', userData?.id],
    queryFn: () => giftService.getWeddingListByCouple(userData?.id as number),
    enabled: !!userData?.id && userData?.role === 'COUPLE',
  });

  // Fetch gifts for the wedding list
  const {
    data: gifts = [],
    isLoading: isLoadingGifts,
    error: giftsError,
  } = useQuery({
    queryKey: ['gifts', weddingList?.id],
    queryFn: () => giftService.getGiftsByWeddingList(weddingList?.id),
    enabled: !!weddingList?.id,
  });

  // Handle loading and error states
  const isLoading = isLoadingWeddingList || isLoadingGifts;
  const error = weddingListError || giftsError;

  const showModal = () => {
    setIsModalVisible(true);
  };

  const columns = [
    {
      title: 'Regalo',
      dataIndex: 'title',
      key: 'title',
      render: (text: string, record: Gift) => (
        <div>
          <div className="font-medium">{text}</div>
          <div className="text-xs text-gray-500">{record.description}</div>
        </div>
      ),
    },
    {
      title: 'Precio',
      dataIndex: 'price',
      key: 'price',
      render: (price: number) => `$${price.toFixed(2)}`,
    },
    {
      title: 'Categoría',
      dataIndex: 'category',
      key: 'category',
    },
    {
      title: 'Estado',
      dataIndex: 'isPurchased',
      key: 'status',
      render: (isPurchased: boolean) => {
        const color = isPurchased ? 'blue' : 'green';
        const text = isPurchased ? 'Comprado' : 'Disponible';

        return <Tag color={color}>{text}</Tag>;
      },
    },
    {
      title: 'Acciones',
      key: 'actions',
      render: (_: any, _record: Gift) => (
        <Space size="middle">
          <Button type="text" icon={<EditOutlined />} />
          <Button type="text" danger icon={<DeleteOutlined />} />
        </Space>
      ),
    },
  ];

  return (
    <div className="m-6">
      <div className="p-6 bg-white rounded-lg shadow">
        <div className="flex justify-between items-center mb-6">
          <div>
            <Title level={2}>Mesa de Regalos</Title>
            <Paragraph>Gestiona los regalos que deseas recibir en tu boda. Puedes agregar, editar o eliminar regalos.</Paragraph>
          </div>
          {userData?.role === 'COUPLE' && (
            <Button type="primary" icon={<PlusOutlined />} onClick={showModal}>
              Agregar Regalo
            </Button>
          )}
        </div>

        <div className="mb-4">
          <Input.Search
            placeholder="Buscar regalos"
            allowClear
            enterButton={<SearchOutlined />}
            size="large"
            onSearch={(value) => console.log(value)}
          />
        </div>

        {isLoading ? (
          <div className="flex justify-center items-center h-64">
            <Typography.Text>Cargando regalos...</Typography.Text>
          </div>
        ) : error ? (
          <div className="flex justify-center items-center h-64">
            <Typography.Text type="danger">Error al cargar los regalos. Por favor, intente de nuevo.</Typography.Text>
          </div>
        ) : gifts.length === 0 ? (
          <div className="flex justify-center items-center h-64">
            <Typography.Text>No hay regalos disponibles.</Typography.Text>
          </div>
        ) : (
          <Table dataSource={gifts} columns={columns} rowKey="id" pagination={false} />
        )}
      </div>
      <CreateWeddingGift isModalVisible={isModalVisible} setIsModalVisible={setIsModalVisible} />
    </div>
  );
};

export default GiftRegistry;
