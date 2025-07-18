import React, { useState } from 'react';
import { Typography, Input, Card, Row, Col, Button, Avatar, Modal, Form, message, Spin } from 'antd';
import { SearchOutlined, HeartOutlined, ShoppingCartOutlined, UserOutlined } from '@ant-design/icons';
import { useQuery } from '@tanstack/react-query';
import { giftService } from '../services/gift.service';
import type { Gift, WeddingList } from '../services/gift.service';

const { Title, Paragraph, Text } = Typography;

// No props needed since we're using React Query for data fetching
interface GiftListsProps {}

const GiftLists: React.FC<GiftListsProps> = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedGift, setSelectedGift] = useState<Gift | null>(null);
  const [isPurchaseModalVisible, setIsPurchaseModalVisible] = useState(false);
  const [form] = Form.useForm();
  const [purchaseLoading, setPurchaseLoading] = useState(false);

  // Fetch all wedding lists from the API
  const {
    data: weddingLists,
    isLoading: isLoadingWeddingLists,
    refetch,
  } = useQuery<WeddingList[]>({
    queryKey: ['allWeddingLists'],
    queryFn: async () => {
      return await giftService.getAllWeddingLists();
    },
  });

  // Filter wedding lists based on search term
  const filteredWeddingLists = weddingLists
    ? weddingLists.filter((list: WeddingList) => list.coupleName.toLowerCase().includes(searchTerm.toLowerCase()))
    : [];

  const handlePurchase = (gift: Gift) => {
    setSelectedGift(gift);
    setIsPurchaseModalVisible(true);
    form.resetFields();
  };

  const handlePurchaseSubmit = async (values: { message: string }) => {
    if (!selectedGift) return;

    setPurchaseLoading(true);
    try {
      // The backend will extract the user ID from the JWT token
      await giftService.purchaseGift(selectedGift.id, values.message);
      message.success('¡Regalo comprado exitosamente!');
      setIsPurchaseModalVisible(false);
      // Refetch wedding lists to update the UI
      await refetch();
    } catch (error) {
      message.error('Error al comprar el regalo. Por favor intenta de nuevo.');
      console.error('Purchase error:', error);
    } finally {
      setPurchaseLoading(false);
    }
  };

  return (
    <div className="m-6">
      <div className="p-6 bg-white rounded-lg shadow">
        <div className="mb-6">
          <Title level={2}>Listas de Regalos</Title>
          <Paragraph>Explora las listas de regalos de las parejas y haz un regalo especial para su boda.</Paragraph>
        </div>

        <div className="mb-6">
          <Input.Search
            placeholder="Buscar por nombre de pareja"
            allowClear
            enterButton={<SearchOutlined />}
            size="large"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            onSearch={(value) => setSearchTerm(value)}
          />
        </div>

        {isLoadingWeddingLists ? (
          <div className="flex justify-center items-center h-64">
            <Spin size="large" />
          </div>
        ) : filteredWeddingLists.length === 0 ? (
          <div className="flex justify-center items-center h-64">
            <Text>No se encontraron listas de regalos.</Text>
          </div>
        ) : (
          <div>
            {filteredWeddingLists.map((weddingList: WeddingList) => (
              <Card
                key={weddingList.id}
                className="mb-6"
                title={
                  <div className="flex items-center">
                    <Avatar src={weddingList.imageUrl} size={64} icon={<UserOutlined />} className="mr-4" />
                    <div>
                      <Title level={4} className="mb-0">
                        {weddingList.coupleName}
                      </Title>
                      <Text type="secondary">
                        Fecha de boda:{' '}
                        {new Date(weddingList.weddingDate).toLocaleDateString('es-MX', { year: 'numeric', month: 'long', day: 'numeric' })}
                      </Text>
                    </div>
                  </div>
                }>
                <Row gutter={[16, 16]}>
                  {weddingList.gifts.map((gift: Gift) => (
                    <Col xs={24} sm={12} md={8} key={gift.id}>
                      <Card hoverable className={`h-full flex flex-col ${gift.isPurchased ? 'opacity-60' : ''}`}>
                        <div className="flex-grow">
                          <div className="flex justify-between items-start mb-2">
                            <Title level={5} className="mb-1">
                              {gift.title}
                            </Title>
                            <Text strong className="text-lg">
                              ${gift.price.toFixed(2)}
                            </Text>
                          </div>
                          <Paragraph className="text-gray-600 mb-4">{gift.description}</Paragraph>
                        </div>
                        <div className="mt-auto pt-4 flex justify-between items-center">
                          {gift.isPurchased ? (
                            <Button type="text" icon={<HeartOutlined />} disabled>
                              Ya comprado
                            </Button>
                          ) : (
                            <Button type="primary" icon={<ShoppingCartOutlined />} onClick={() => handlePurchase(gift)}>
                              Comprar Regalo
                            </Button>
                          )}
                        </div>
                      </Card>
                    </Col>
                  ))}
                </Row>
              </Card>
            ))}
          </div>
        )}
      </div>

      <Modal title="Comprar Regalo" open={isPurchaseModalVisible} onCancel={() => setIsPurchaseModalVisible(false)} footer={null}>
        {selectedGift && (
          <div>
            <div className="mb-4">
              <Title level={4}>{selectedGift.title}</Title>
              <Text className="block mb-2">{selectedGift.description}</Text>
              <Text strong className="text-lg">
                ${selectedGift.price.toFixed(2)}
              </Text>
            </div>

            <Form form={form} layout="vertical" onFinish={handlePurchaseSubmit}>
              <Form.Item
                name="message"
                label="Mensaje para los novios"
                rules={[{ required: true, message: 'Por favor escribe un mensaje' }]}>
                <Input.TextArea rows={4} placeholder="Escribe un mensaje especial para los novios..." />
              </Form.Item>

              <div className="flex justify-end">
                <Button className="mr-2" onClick={() => setIsPurchaseModalVisible(false)}>
                  Cancelar
                </Button>
                <Button type="primary" htmlType="submit" loading={purchaseLoading}>
                  Confirmar Compra
                </Button>
              </div>
            </Form>
          </div>
        )}
      </Modal>
    </div>
  );
};

export default GiftLists;
