import { Button, Modal, Typography, Tag, Divider, Select } from 'antd';
import { DeleteOutlined, MinusOutlined, PlusOutlined, ShoppingCartOutlined } from '@ant-design/icons';
import { useGiftById } from 'hooks/useGift';
import { useState, useEffect } from 'react';
import { CartItem } from 'types/models/cart';

const { Title, Text, Paragraph } = Typography;

interface GiftDetailsModalProps {
  weddingListId?: number;
  giftId?: number;
  open: boolean;
  onCancel: () => void;
  afterClose: () => void;
  onAddToCart?: (giftId: number, quantity: number) => void;
  cartItems?: CartItem[];
  onUpdateCartQuantity?: (cartItemId: number, quantity: number) => void;
  onRemoveFromCart?: (cartItemId: number) => void;
}

export const GiftDetailsModal = ({
  giftId,
  open,
  onCancel,
  afterClose,
  onAddToCart,
  cartItems = [],
  onUpdateCartQuantity,
  onRemoveFromCart,
}: GiftDetailsModalProps) => {
  const { data: gift, isLoading } = useGiftById(giftId, { enabled: !!giftId });
  const [selectedQuantity, setSelectedQuantity] = useState<number>(1);

  // Find if this gift is already in the cart
  const cartItem = gift ? cartItems?.find((item) => item.gift?.id === gift.id) : undefined;
  const isInCart = Boolean(cartItem);

  // Reset quantity when gift changes or modal opens
  useEffect(() => {
    if (gift && open) {
      // If in cart, set the initial quantity to match cart quantity
      if (cartItem) {
        setSelectedQuantity(cartItem.quantity);
      } else {
        setSelectedQuantity(1);
      }
    }
  }, [gift, open, cartItem]);

  const handleAddToCart = () => {
    if (gift && onAddToCart) {
      onAddToCart(gift.id, selectedQuantity);
      onCancel();
    }
  };

  const handleIncreaseQuantity = () => {
    if (cartItem && onUpdateCartQuantity) {
      onUpdateCartQuantity(cartItem.id as unknown as number, cartItem.quantity + 1);
    }
  };

  const handleDecreaseQuantity = () => {
    if (cartItem && onUpdateCartQuantity) {
      onUpdateCartQuantity(cartItem.id as unknown as number, cartItem.quantity - 1);
    }
  };

  const handleRemoveFromCart = () => {
    if (cartItem && onRemoveFromCart) {
      onRemoveFromCart(cartItem.id as unknown as number);
      onCancel();
    }
  };

  // Generate quantity options based on gift.quantity
  const quantityOptions = gift
    ? Array.from({ length: gift.quantity }, (_, i) => ({
        label: (i + 1).toString(),
        value: i + 1,
      }))
    : [];

  if (!gift && !isLoading) {
    return null;
  }

  const handleAfterClose = (openedDrawer: boolean) => {
    if (!openedDrawer) {
      afterClose?.();
    }
  };

  return (
    <Modal
      afterOpenChange={handleAfterClose}
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
                {gift.isPurchased ? (
                  <Button type="primary" size="large" disabled className="flex-1 w-full">
                    Ya comprado
                  </Button>
                ) : isInCart ? (
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Button
                          icon={<MinusOutlined />}
                          onClick={handleDecreaseQuantity}
                          disabled={cartItem?.quantity ? cartItem.quantity <= 1 : true}
                        />
                        <span className="text-lg px-2">{cartItem?.quantity}</span>
                        <Button
                          icon={<PlusOutlined />}
                          onClick={handleIncreaseQuantity}
                          disabled={cartItem?.quantity ? cartItem.quantity >= (gift.quantity || 1) : false}
                        />
                      </div>
                      <Button danger icon={<DeleteOutlined />} onClick={handleRemoveFromCart}>
                        Eliminar
                      </Button>
                    </div>
                  </div>
                ) : (
                  <div className="flex gap-3">
                    <Button type="primary" size="large" icon={<ShoppingCartOutlined />} onClick={handleAddToCart} className="flex-1">
                      Agregar al carrito
                    </Button>
                  </div>
                )}
              </div>
            </div>
          </div>
        )
      )}
    </Modal>
  );
};
