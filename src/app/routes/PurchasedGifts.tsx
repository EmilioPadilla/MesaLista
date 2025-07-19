import React from 'react';
import { Table, Card, Statistic, Row, Col, Button, Typography, message, Avatar, Tag, Space, Tooltip } from 'antd';
import { UserOutlined, GiftOutlined, CheckCircleOutlined, MailOutlined } from '@ant-design/icons';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useOutletContext } from 'react-router-dom';
import { giftService } from 'services/gift.service';
import type { DashboardUserData } from 'services/user.service';
import { PurchasedGiftsResponse } from 'shared/types/gift';

const { Title, Paragraph, Text } = Typography;

interface PurchasedGiftsProps {
  userData?: DashboardUserData;
}

type OutletContextType = {
  userData?: DashboardUserData;
  isLoading: boolean;
  isCouple: boolean;
};

// Using types from giftService

// Using functions from giftService

const PurchasedGifts: React.FC<PurchasedGiftsProps> = (props) => {
  // Use props if provided directly, otherwise use context from Outlet
  const contextData = useOutletContext<OutletContextType>();
  // console.log('contextData', contextData);
  const userData = props.userData || contextData?.userData;
  const queryClient = useQueryClient();

  // Fetch purchased gifts from the API
  const { data, isLoading, error } = useQuery({
    queryKey: ['purchasedGifts', userData?.id],
    queryFn: () => giftService.fetchPurchasedGifts(userData?.id),
    enabled: !!userData?.id,
  });
  const purchasedGifts = data?.purchases || [];
  const totalAmount = data?.totalAmount || 0;

  // Mutation for updating purchase status
  const updateStatusMutation = useMutation({
    mutationFn: giftService.updatePurchaseStatus,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['purchasedGifts', userData?.id] });
      message.success('Estado del regalo actualizado correctamente');
    },
    onError: () => {
      message.error('Error al actualizar el estado del regalo');
    },
  });

  // Calculate statistics
  const pendingCount = purchasedGifts.filter((gift) => gift.status === 'pending').length;
  const deliveredCount = purchasedGifts.filter((gift) => gift.status === 'delivered').length;
  const thankedCount = purchasedGifts.filter((gift) => gift.status === 'thanked').length;

  const handleMarkAsDelivered = (id: number) => {
    updateStatusMutation.mutate({ purchaseId: id, status: 'DELIVERED' });
  };

  const handleSendThankYou = (id: number) => {
    updateStatusMutation.mutate({ purchaseId: id, status: 'THANKED' });
  };

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
      title: 'Comprado por',
      dataIndex: 'purchasedBy',
      key: 'purchasedBy',
      render: (purchasedBy: PurchasedGiftsResponse['purchases'][number]['purchasedBy']) => (
        <Space>
          <Avatar icon={<UserOutlined />} />
          <div>
            <div>{purchasedBy.name}</div>
            <div className="text-xs text-gray-500">{purchasedBy.email}</div>
          </div>
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

        if (status === 'delivered') {
          color = 'green';
          text = 'Entregado';
        } else if (status === 'thanked') {
          color = 'blue';
          text = 'Agradecido';
        }

        return <Tag color={color}>{text}</Tag>;
      },
    },
    {
      title: 'Acciones',
      key: 'actions',
      render: (_: any, record: PurchasedGiftsResponse['purchases'][number]) => (
        <Space size="middle">
          {record.status !== 'thanked' && (
            <Button
              type="primary"
              size="small"
              icon={<MailOutlined />}
              disabled={record.status === 'pending'}
              onClick={() => updateStatusMutation.mutate({ purchaseId: record.id, status: 'thanked' })}>
              Agradecer
            </Button>
          )}
          {record.status === 'pending' && (
            <Tooltip title="Marcar como entregado">
              <Button
                type="default"
                size="small"
                icon={<CheckCircleOutlined />}
                onClick={() => updateStatusMutation.mutate({ purchaseId: record.id, status: 'delivered' })}
              />
            </Tooltip>
          )}
        </Space>
      ),
    },
  ];

  const expandedRowRender = (record: PurchasedGiftsResponse['purchases'][number]) => {
    return (
      <div className="p-4">
        <div className="flex items-start mb-4">
          <Avatar icon={<UserOutlined />} className="mr-3" />
          <div>
            <Text strong>{record.purchasedBy.name}</Text>
            <Text type="secondary" className="block">
              {record.purchasedBy.email}
            </Text>
          </div>
        </div>
        <div className="bg-gray-50 p-4 rounded-lg">
          <Text italic>"{record.message}"</Text>
        </div>
        <div className="mt-4 flex justify-end">
          {record.status === 'pending' && (
            <Button type="primary" size="small" icon={<CheckCircleOutlined />} onClick={() => handleMarkAsDelivered(record.id)}>
              Marcar como Entregado
            </Button>
          )}
          {record.status === 'delivered' && (
            <Button type="primary" size="small" icon={<MailOutlined />} onClick={() => handleSendThankYou(record.id)}>
              Agradecer
            </Button>
          )}
        </div>
      </div>
    );
  };

  return (
    <div className="m-6">
      <div className="p-6 bg-white rounded-lg shadow">
        <Title level={2}>Regalos Comprados</Title>
        <Paragraph>Aquí puedes ver todos los regalos que han sido comprados para tu boda, su estado y enviar agradecimientos.</Paragraph>

        {isLoading ? (
          <div className="flex justify-center items-center h-64">
            <Typography.Text>Cargando regalos comprados...</Typography.Text>
          </div>
        ) : error ? (
          <div className="flex justify-center items-center h-64">
            <Typography.Text type="danger">Error al cargar los regalos comprados</Typography.Text>
          </div>
        ) : (
          <>
            <Row gutter={16} className="mb-6">
              <Col span={6}>
                <Card>
                  <Statistic title="Total Recibido" value={totalAmount} prefix="$" precision={2} />
                </Card>
              </Col>
              <Col span={6}>
                <Card>
                  <Statistic title="Pendientes" value={pendingCount} valueStyle={{ color: '#faad14' }} prefix={<GiftOutlined />} />
                </Card>
              </Col>
              <Col span={6}>
                <Card>
                  <Statistic title="Entregados" value={deliveredCount} valueStyle={{ color: '#52c41a' }} prefix={<CheckCircleOutlined />} />
                </Card>
              </Col>
              <Col span={6}>
                <Card>
                  <Statistic title="Agradecidos" value={thankedCount} valueStyle={{ color: '#1890ff' }} prefix={<MailOutlined />} />
                </Card>
              </Col>
            </Row>

            <Table
              dataSource={purchasedGifts}
              columns={columns}
              rowKey="id"
              expandable={{
                expandedRowRender,
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

export default PurchasedGifts;
