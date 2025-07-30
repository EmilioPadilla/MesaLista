import { Button, Modal, Typography, Tag, Divider, Select } from 'antd';
import { ShoppingCartOutlined } from '@ant-design/icons';
import { useGiftById } from 'hooks/useGift';
import { useState, useEffect } from 'react';

const { Title, Text, Paragraph } = Typography;

interface GiftDetailsModalProps {
  weddingListId?: number;
  giftId?: number;
  open: boolean;
  onCancel: () => void;
  afterClose: () => void;
  onAddToCart?: (giftId: number, quantity: number) => void;
}

export const GiftDetailsModal = ({ giftId, open, onCancel, afterClose, onAddToCart }: GiftDetailsModalProps) => {
  const { data: gift, isLoading } = useGiftById(giftId, { enabled: !!giftId });
  const [selectedQuantity, setSelectedQuantity] = useState<number>(1);

  // Reset quantity when gift changes or modal opens
  useEffect(() => {
    if (gift && open) {
      setSelectedQuantity(1);
    }
  }, [gift, open]);

  const handleAddToCart = () => {
    if (gift && onAddToCart) {
      onAddToCart(gift.id, selectedQuantity);
      onCancel();
    }
  };

  // Generate quantity options based on gift.quantity
  const quantityOptions = gift ? Array.from({ length: gift.quantity }, (_, i) => ({
    label: (i + 1).toString(),
    value: i + 1,
  })) : [];

  if (!gift && !isLoading) {
    return null;
  }

  return (
    <Modal
      afterClose={afterClose}
      destroyOnHidden
      title={gift?.title || 'Gift Details'}
      open={open}
      onCancel={onCancel}
      footer={null}
      width={700}>
      {isLoading ? (
        <div className="flex justify-center items-center h-64">
          <Text>Loading...</Text>
        </div>
      ) : (
        gift && (
          <div className="flex gap-6">
            {/* Left side - Image display */}
            <div className="w-1/2">
              {gift.imageUrl ? (
                <img src={gift.imageUrl} alt={gift.title} className="w-full h-auto object-contain rounded-lg" />
              ) : (
                <img src="/images/gift_placeholder.png" alt="Gift Placeholder" className="w-full h-auto object-contain rounded-lg" />
              )}
            </div>

            {/* Right side - Gift details */}
            <div className="w-1/2 flex flex-col">
              <div className="mb-4">
                <Title level={3} className="!mb-2">
                  {gift.title}
                </Title>

                {/* Categories */}
                {gift.categories && gift.categories.length > 0 && (
                  <div className="mb-3">
                    {gift.categories.map((categoryItem: any, index: number) => (
                      <Tag key={index} color="blue">
                        {categoryItem?.name || categoryItem}
                      </Tag>
                    ))}
                  </div>
                )}

                {/* Price */}
                <div className="mb-4">
                  <Title level={2} className="!mb-0 text-green-600">
                    ${gift.price.toFixed(2)}
                  </Title>
                </div>

                {/* Quantity info */}
                <div className="mb-4">
                  <Text className="text-gray-600">
                    Cantidad solicitada: <strong>{gift.quantity}</strong>
                  </Text>
                  
                  {/* Quantity selector */}
                  <div className="mt-3">
                    <Text className="text-gray-700 block mb-2">Cantidad a regalar:</Text>
                    <Select
                      value={selectedQuantity}
                      onChange={setSelectedQuantity}
                      options={quantityOptions}
                      className="w-24"
                      disabled={gift.isPurchased}
                    />
                  </div>
                  
                  {gift.isMostWanted && (
                    <div className="mt-2">
                      <Tag color="gold">Regalo más deseado ⭐</Tag>
                    </div>
                  )}
                </div>

                {/* Description */}
                {gift.description && (
                  <div className="mb-6">
                    <Divider orientation="left">Descripción</Divider>
                    <Paragraph className="text-gray-700">{gift.description}</Paragraph>
                  </div>
                )}
              </div>

              {/* Action buttons */}
              <div className="mt-auto">
                <div className="flex gap-3">
                  <Button
                    type="primary"
                    size="large"
                    icon={<ShoppingCartOutlined />}
                    onClick={handleAddToCart}
                    className="flex-1"
                    disabled={gift.isPurchased}>
                    {gift.isPurchased ? 'Ya comprado' : 'Agregar al carrito'}
                  </Button>
                </div>
              </div>
            </div>
          </div>
        )
      )}
    </Modal>
  );
};
