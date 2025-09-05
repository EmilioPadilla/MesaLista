import React from 'react';
import { Drawer, Button as AntdButton, Image } from 'antd';
import { CloseCircleOutlined } from '@ant-design/icons';
import type { Cart, CartItem } from 'types/models/cart';
import { GiftIcon, Minus, Package, Plus, ShoppingCart, Trash2 } from 'lucide-react';
import { Card, CardContent } from 'components/core/Card';
import { Button } from 'components/core/Button';
import { useNavigate } from 'react-router-dom';
import { useRemoveGiftFromCart, useUpdateCartItemQuantity } from 'hooks/useCart';

interface CartDrawerProps {
  open: boolean;
  onClose: () => void;
  cartData?: Cart;
  sessionId: string | null;
  afterOpenChange?: (open: boolean) => void;
  coupleSlug: string;
}

export const CartDrawer: React.FC<CartDrawerProps> = ({ open, onClose, cartData, sessionId, afterOpenChange, coupleSlug }) => {
  const navigate = useNavigate();
  const { mutate: removeFromCart } = useRemoveGiftFromCart();
  const { mutate: updateCartQuantity } = useUpdateCartItemQuantity();

  // Calculate cart total and item count
  const cartTotal =
    cartData?.items?.reduce((sum: number, item: CartItem) => {
      return sum + (item.gift?.price || 0) * item.quantity;
    }, 0) || 0;
  const cartItemCount = cartData?.items?.length || 0;

  return (
    <Drawer
      title={
        <>
          <div className="flex justify-between">
            <div className="flex items-center">
              <ShoppingCart className="h-4 w-4 mr-2" />
              Carrito de Regalos
            </div>
            <CloseCircleOutlined onClick={onClose} />
          </div>
          <p className="text-md text-gray-500">Revisa tus regalos seleccionados antes de proceder al pago</p>
        </>
      }
      placement="right"
      afterOpenChange={afterOpenChange}
      closeIcon={null}
      width={400}
      keyboard={true}
      open={open}
      footer={
        <div className="w-full space-y-4">
          <div className="flex justify-between items-center text-lg">
            <span>Total:</span>
            <span className="text-primary">${cartTotal.toLocaleString()}</span>
          </div>
          <AntdButton disabled={cartItemCount === 0} className="w-full" type="primary" onClick={() => navigate(`/${coupleSlug}/checkout`)}>
            <GiftIcon className="h-4 w-4 mr-2" />
            Proceder al Pago
          </AntdButton>
        </div>
      }>
      <div className="flex flex-col h-full">
        <div className="flex-1 overflow-y-auto py-6">
          {cartItemCount === 0 ? (
            <div className="text-center py-12">
              <Package className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
              <p className="text-muted-foreground">Tu carrito está vacío</p>
            </div>
          ) : (
            <div className="space-y-4">
              {cartData?.items?.map((item: CartItem) => (
                <Card key={item.id}>
                  <CardContent className="p-4">
                    <div className="flex gap-4">
                      <Image
                        src={item.gift?.imageUrl}
                        fallback="/images/gift_placeholder.png"
                        preview={false}
                        alt={item.gift?.title}
                        className="!w-16 !h-16 rounded-md"
                      />
                      <div className="flex-1 min-w-0">
                        <h4 className="truncate">{item.gift?.title}</h4>
                        <p className="text-md text-muted-foreground">${item.gift?.price}</p>

                        <div className="flex items-center justify-between mt-2">
                          <div className="flex items-center space-x-2">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => updateCartQuantity({ cartItemId: item.id as unknown as number, quantity: item.quantity - 1 })}>
                              <Minus className="h-3 w-3" />
                            </Button>
                            <span className="w-8 text-center">{item.quantity}</span>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => updateCartQuantity({ cartItemId: item.id as unknown as number, quantity: item.quantity + 1 })}>
                              <Plus className="h-3 w-3" />
                            </Button>
                          </div>

                          <Button variant="ghost" size="sm" onClick={() => removeFromCart(item.id as unknown as number)}>
                            <Trash2 className="h-4 w-4 text-destructive" />
                          </Button>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>
      </div>
    </Drawer>
  );
};
