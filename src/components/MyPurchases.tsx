import React from 'react';
import { Typography, Table, Card, Row, Col, Tag, Space, Avatar, Tooltip, Empty, Spin, Button, Statistic } from 'antd';
import { ShoppingOutlined, GiftOutlined, UserOutlined, CheckCircleOutlined } from '@ant-design/icons';
import { useQuery } from '@tanstack/react-query';
import { useOutletContext } from 'react-router-dom';
import type { DashboardUserData } from '../services/user.service';
import { giftService } from '../services/gift.service';
import { PurchasedGiftsResponse } from 'types/api/gift';

const { Title, Paragraph, Text } = Typography;

interface MyPurchasesProps {
  userData?: DashboardUserData;
}

type OutletContextType = {
  userData?: DashboardUserData;
  isLoading: boolean;
  isCouple: boolean;
};

const MyPurchases: React.FC<MyPurchasesProps> = (props) => {
  // Use props if provided directly, otherwise use context from Outlet
  const contextData = useOutletContext<OutletContextType>();
  const userData = props.userData || contextData?.userData;

  // Fetch user's purchases
  const { data, isLoading, error } = useQuery<PurchasedGiftsResponse>({
    queryKey: ['userPurchases', userData?.id],
    queryFn: () => giftService.getUserPurchases(userData?.id as number),
    enabled: !!userData?.id,
  });

  const userPurchases = data?.purchases || [];
  const totalSpent = data?.totalAmount || 0;

  // Calculate statistics
  // Only using thankedCount in UI, but calculating others for future use
  const thankedCount = userPurchases.filter((gift) => gift.status === 'THANKED').length;

  const columns = [
    {
      title: 'Regalo',
      dataIndex: 'giftName',
      key: 'giftName',
    },
    {
      title: 'Precio',
      dataIndex: 'price',
      key: 'price',
      render: (price: number) => `$${price.toFixed(2)}`,
    },
    {
      title: 'Fecha de Compra',
      dataIndex: 'purchaseDate',
      key: 'purchaseDate',
      render: (date: string) => new Date(date).toLocaleDateString('es-MX'),
    },
    {
      title: 'Para',
      dataIndex: 'purchasedFor',
      key: 'purchasedFor',
      render: () => (
        <Space>
          <Avatar icon={<UserOutlined />} />
          <Text>Pareja</Text>
        </Space>
      ),
    },
    {
      title: 'Estado',
      dataIndex: 'status',
      key: 'status',
      render: (status: string) => {
        let color = 'gold';
        let text = 'Pendiente';
        let icon = <GiftOutlined />;

        if (status === 'delivered') {
          color = 'green';
          text = 'Entregado';
          icon = <CheckCircleOutlined />;
        } else if (status === 'thanked') {
          color = 'blue';
          text = 'Agradecido';
          icon = <CheckCircleOutlined />;
        }

        return (
          <Tooltip title={getStatusDescription(status)}>
            <Tag color={color} icon={icon}>
              {text}
            </Tag>
          </Tooltip>
        );
      },
    },
  ];

  // Helper function to get status description
  const getStatusDescription = (status: string) => {
    switch (status) {
      case 'pending':
        return 'Tu regalo está pendiente de entrega';
      case 'delivered':
        return 'Tu regalo ha sido entregado a la pareja';
      case 'thanked':
        return 'La pareja te ha enviado un agradecimiento';
      default:
        return '';
    }
  };

  // Expanded row to show the message sent with the gift
  const expandedRowRender = (record: PurchasedGiftsResponse) => {
    return (
      <div className="p-4">
        <div className="bg-gray-50 p-4 rounded-lg">
          <Title level={5} className="mb-2">
            Tu mensaje:
          </Title>
          {/* @ts-ignore */}
          <Text italic>"{record.message}"</Text>
        </div>
      </div>
    );
  };

  return (
    <div className="m-6">
      <div className="p-6 bg-white rounded-lg shadow">
        <div className="mb-6">
          <Title level={2}>Mis Compras</Title>
          <Paragraph>Aquí puedes ver todos los regalos que has comprado para bodas y su estado actual.</Paragraph>
        </div>

        {isLoading ? (
          <div className="flex justify-center items-center h-64">
            <Spin size="large" />
          </div>
        ) : error ? (
          <div className="flex justify-center items-center h-64">
            <Typography.Text type="danger">Error al cargar tus compras</Typography.Text>
          </div>
        ) : userPurchases.length === 0 ? (
          <Empty image={Empty.PRESENTED_IMAGE_SIMPLE} description={<Text>Aún no has realizado ninguna compra</Text>}>
            <Button type="primary" onClick={() => (window.location.href = '/dashboard/gift-lists')}>
              Explorar Listas de Regalos
            </Button>
          </Empty>
        ) : (
          <>
            <Row gutter={16} className="mb-6">
              <Col span={8}>
                <Card>
                  <Statistic title="Total Gastado" value={totalSpent} prefix="$" precision={2} valueStyle={{ color: '#1890ff' }} />
                </Card>
              </Col>
              <Col span={8}>
                <Card>
                  <Statistic
                    title="Regalos Comprados"
                    value={userPurchases.length}
                    prefix={<ShoppingOutlined />}
                    valueStyle={{ color: '#52c41a' }}
                  />
                </Card>
              </Col>
              <Col span={8}>
                <Card>
                  <Statistic
                    title="Agradecimientos Recibidos"
                    value={thankedCount}
                    prefix={<GiftOutlined />}
                    valueStyle={{ color: '#722ed1' }}
                  />
                </Card>
              </Col>
            </Row>

            <Table
              // @ts-ignore
              dataSource={userPurchases}
              columns={columns}
              rowKey="id"
              expandable={{
                expandedRowRender,
                // @ts-ignore
                rowExpandable: (record) => !!record.message,
              }}
              pagination={{ pageSize: 10 }}
            />
          </>
        )}
      </div>
    </div>
  );
};

export default MyPurchases;
