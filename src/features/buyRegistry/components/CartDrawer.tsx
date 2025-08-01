import React from 'react';
import { Drawer, Typography, Button, Image, InputNumber, Space, Divider } from 'antd';
import { DeleteOutlined, ShoppingCartOutlined } from '@ant-design/icons';
import type { Cart } from 'types/models/cart';
import { useRemoveGiftFromCart, useUpdateCartItemQuantity } from 'hooks/useCart';

const { Title, Text } = Typography;

interface CartDrawerProps {
  open: boolean;
  onClose: () => void;
  cartData?: Cart;
  sessionId?: string;
}

export const CartDrawer: React.FC<CartDrawerProps> = ({ open, onClose, cartData, sessionId }) => {
  const { mutate: removeFromCart } = useRemoveGiftFromCart();
  const { mutate: updateQuantity } = useUpdateCartItemQuantity();

  const handleQuantityChange = (cartItemId: number, newQuantity: number) => {
    if (newQuantity < 1) return;
    updateQuantity({ cartItemId, quantity: newQuantity });
  };

  const handleRemoveItem = (cartItemId: number) => {
    removeFromCart(cartItemId);
  };

  // Calculate subtotal
  const subtotal = cartData?.items?.reduce((total, item) => {
    const price = item.gift?.price || 0;
    return total + (price * item.quantity);
  }, 0) || 0;

  return (
    <Drawer
      title={
        <div className="flex items-center gap-2">
          <ShoppingCartOutlined />
          <span>Cart</span>
        </div>
      }
      placement="right"
      onClose={onClose}
      open={open}
      width={400}
      styles={{
        body: { padding: '16px' },
      }}
    >
      {!cartData?.items || cartData.items.length === 0 ? (
        <div className="text-center py-8">
          <ShoppingCartOutlined className="text-4xl text-gray-300 mb-4" />
          <Text className="text-gray-500">Your cart is empty</Text>
        </div>
      ) : (
        <div className="flex flex-col h-full">
          {/* Cart Items */}
          <div className="flex-1 overflow-y-auto">
            <Space direction="vertical" size="middle" className="w-full">
              {cartData.items.map((item) => {
                if (!item.gift) return null;
                
                return (
                  <div key={item.id} className="border-b border-gray-100 pb-4">
                    <div className="flex gap-3">
                      {/* Gift Image */}
                      <div className="flex-shrink-0">
                        <Image
                          src={item.gift.imageUrl || undefined}
                          alt={item.gift.title}
                          width={80}
                          height={80}
                          className="rounded-lg object-cover"
                          fallback="data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAMIAAADDCAYAAADQvc6UAAABRWlDQ1BJQ0MgUHJvZmlsZQAAKJFjYGASSSwoyGFhYGDIzSspCnJ3UoiIjFJgf8LAwSDCIMogwMCcmFxc4BgQ4ANUwgCjUcG3awyMIPqyLsis7PPOq3QdDFcvjV3jOD1boQVTPQrgSkktTgbSf4A4LbmgqISBgTEFyFYuLykAsTuAbJEioKOA7DkgdjqEvQHEToKwj4DVhAQ5A9k3gGyB5IxEoBmML4BsnSQk8XQkNtReEOBxcfXxUQg1Mjc0dyHgXNJBSWpFCYh2zi+oLMpMzyhRcASGUqqCZ16yno6CkYGRAQMDKMwhqj/fAIcloxgHQqxAjIHBEugw5sUIsSQpBobtQPdLciLEVJYzMPBHMDBsayhILEqEO4DxG0txmrERhM29nYGBddr//5/DGRjYNRkY/l7////39v///y4Dmn+LgeHANwDrkl1AuO+pmgAAADhlWElmTU0AKgAAAAgAAYdpAAQAAAABAAAAGgAAAAAAAqACAAQAAAABAAAAwqADAAQAAAABAAAAwwAAAAD9b/HnAAAHlklEQVR4Ae3dP3Ik1RnG4W+FgYxN"
                        />
                      </div>

                      {/* Gift Details */}
                      <div className="flex-1 min-w-0">
                        <div className="flex justify-between items-start mb-2">
                          <div className="flex-1 min-w-0">
                            <Title level={5} className="mb-1 text-sm font-medium truncate">
                              {item.gift.title}
                            </Title>
                            <Text className="text-gray-600 text-sm">
                              ${item.gift.price.toFixed(2)}
                            </Text>
                        </div>
                        <Button
                          type="text"
                          size="small"
                          icon={<DeleteOutlined />}
                          onClick={() => handleRemoveItem(item.id)}
                          className="text-gray-400 hover:text-red-500 ml-2"
                        />
                      </div>

                      {/* Quantity Controls */}
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <Button
                            size="small"
                            onClick={() => handleQuantityChange(item.id, item.quantity - 1)}
                            disabled={item.quantity <= 1}
                          >
                            -
                          </Button>
                          <InputNumber
                            size="small"
                            min={1}
                            value={item.quantity}
                            onChange={(value) => handleQuantityChange(item.id, value || 1)}
                            className="w-16 text-center"
                            controls={false}
                          />
                          <Button
                            size="small"
                            onClick={() => handleQuantityChange(item.id, item.quantity + 1)}
                          >
                            +
                          </Button>
                        </div>
                        <Text className="font-medium">
                          ${(item.gift.price * item.quantity).toFixed(2)}
                        </Text>
                      </div>
                    </div>
                  </div>
                  </div>
                );
              }).filter(Boolean)}
            </Space>
          </div>

          <Divider />

          {/* Shipping Info */}
          <div className="mb-4">
            <div className="flex items-center justify-between text-sm text-gray-600 mb-2">
              <span>Free Shipping to Emilio Padilla Miranda</span>
              <Button type="link" size="small" className="p-0 h-auto text-xs">
                Modify
              </Button>
            </div>
          </div>

          {/* Subtotal */}
          <div className="mb-4">
            <div className="flex justify-between items-center">
              <Text className="text-lg font-medium">Subtotal</Text>
              <Text className="text-lg font-bold">${subtotal.toFixed(2)}</Text>
            </div>
          </div>

          {/* Checkout Buttons */}
          <Space direction="vertical" size="middle" className="w-full">
            <Button
              type="primary"
              size="large"
              block
              className="h-12 text-base font-medium"
            >
              Check Out
            </Button>
            <Button
              type="default"
              size="large"
              block
              className="h-12 text-base font-medium bg-black text-white hover:bg-gray-800 border-black"
            >
              <div className="flex items-center justify-center gap-2">
                <span>Checkout with</span>
                <span className="font-bold">G Pay</span>
              </div>
            </Button>
          </Space>
        </div>
      )}
    </Drawer>
  );
};
