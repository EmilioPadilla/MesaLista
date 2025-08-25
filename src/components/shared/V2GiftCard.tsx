import { DragOutlined, ExclamationCircleFilled, StarFilled } from '@ant-design/icons';
import { Badge } from 'components/core/Badge';
import { Button } from 'components/core/Button';
import { Edit, Minus, Plus, ShoppingCart, Trash2 } from 'lucide-react';
import { Card, CardHeader, CardContent, CardTitle } from 'components/core/Card';
import { ImageWithFallback } from 'components/core/ImageFallback';
import { GiftItem } from 'routes/couple/ManageRegistry';
import { useState } from 'react';
import type { DraggableAttributes } from '@dnd-kit/core';
import type { SyntheticListenerMap } from '@dnd-kit/core/dist/hooks/utilities';
import { Popconfirm } from 'antd';
import { useDeviceType } from 'src/hooks/useDeviceType';
import { CartItem } from 'types/models/cart';

export interface DragHandleProps {
  listeners: SyntheticListenerMap | undefined;
  attributes: DraggableAttributes;
}

interface GiftCardProps {
  isGuest?: boolean;
  gift: GiftItem;
  onDelete?: (id: number) => void;
  onEdit?: (giftId: number | undefined) => void;
  onMove?: (giftId: number | undefined) => void;
  dragHandleProps?: DragHandleProps;
  cartItems?: CartItem[];
  onAddToCart?: (giftId: number) => void;
  onUpdateCartQuantity?: (cartItemId: number, quantity: number) => void;
  onRemoveFromCart?: (cartItemId: number) => void;
}

export const V2GiftCard = ({
  gift,
  onDelete,
  onEdit,
  onMove,
  dragHandleProps,
  isGuest = false,
  cartItems = [],
  onAddToCart,
  onUpdateCartQuantity,
  onRemoveFromCart,
}: GiftCardProps) => {
  const [isHovered, setIsHovered] = useState(false);
  const deviceType = useDeviceType();

  // Find if this gift is in the cart
  const cartItem = cartItems?.find((item) => item.gift?.id === gift.id);
  const isInCart = Boolean(cartItem);

  const handleEditGift = (e: React.MouseEvent) => {
    e?.preventDefault();
    e?.stopPropagation();
    onEdit?.(gift.id);
  };

  const handleMove = (e: React.MouseEvent) => {
    e?.preventDefault();
    e?.stopPropagation();
    if (onMove) onMove(gift.id);
  };

  const handleDelete = (e?: React.MouseEvent) => {
    e?.preventDefault();
    e?.stopPropagation();
    if (onDelete) {
      onDelete(gift.id);
    }
  };

  const handleAddToCart = (e: React.MouseEvent) => {
    e?.preventDefault();
    e?.stopPropagation();
    if (onAddToCart) {
      onAddToCart(gift.id);
    }
  };

  const handleIncreaseQuantity = (e: React.MouseEvent) => {
    e?.preventDefault();
    e?.stopPropagation();
    if (cartItem && onUpdateCartQuantity) {
      onUpdateCartQuantity(cartItem.id as unknown as number, cartItem.quantity + 1);
    }
  };

  const handleDecreaseQuantity = (e: React.MouseEvent) => {
    e?.preventDefault();
    e?.stopPropagation();
    if (cartItem && onUpdateCartQuantity) {
      onUpdateCartQuantity(cartItem.id as unknown as number, cartItem.quantity - 1);
    }
  };

  const handleRemoveFromCart = (e: React.MouseEvent) => {
    e?.preventDefault();
    e?.stopPropagation();
    if (cartItem && onRemoveFromCart) {
      onRemoveFromCart(cartItem.id as unknown as number);
    }
  };

  return (
    <Card
      key={gift.id}
      onClick={handleEditGift}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      className={`relative shadow-lg hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1 h-full flex flex-col
      ${isHovered ? 'cursor-pointer' : ''}
      ${gift.isPurchased ? 'opacity-75' : ''}`}>
      <CardHeader className="p-0">
        <div className="relative">
          <ImageWithFallback src={gift.imageUrl} alt={gift.title} className="w-full h-40 object-contain rounded-t-lg" />
          {gift.isPurchased && (
            <div className="absolute top-2 right-2">
              <Badge className="bg-green-500 shadow-md">Comprado</Badge>
            </div>
          )}
          {gift.isMostWanted && (
            <div className="absolute top-2 left-2">
              <Badge className="bg-yellow-500 shadow-md">
                <StarFilled />
              </Badge>
            </div>
          )}
          {(isHovered || deviceType === 'mobile') && !isGuest && (
            <div className="absolute top-2 left-2 flex justify-between items-center gift-card-actions">
              <Button
                size="sm"
                className="cursor-grab mr-1"
                onClick={handleMove}
                {...(dragHandleProps?.listeners || {})}
                {...(dragHandleProps?.attributes || {})}>
                <DragOutlined color="black" />
              </Button>
            </div>
          )}
        </div>
      </CardHeader>

      <CardContent className="p-4 flex-grow flex flex-col">
        <div className="space-y-2 flex-grow flex flex-col">
          <div className="flex justify-between items-start">
            <CardTitle className="text-xl font-bold">{gift.title}</CardTitle>
            {!gift.isPurchased && !isGuest && (
              <div className="flex gap-1">
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={handleEditGift}
                  className="hover:shadow-md hover:cursor-pointer transition-all duration-200">
                  <Edit className="h-4 w-4" />
                </Button>
                <div onClick={(e) => e.stopPropagation()}>
                  <Popconfirm
                    title="Delete Gift"
                    className="pop-delete ml-1"
                    description="Are you sure you want to delete this gift?"
                    onConfirm={handleDelete}
                    okText="Yes"
                    icon={<ExclamationCircleFilled />}
                    okButtonProps={{ danger: true }}
                    cancelText="No">
                    <Button size="sm" variant="ghost" className="hover:shadow-md hover:cursor-pointer transition-all duration-200">
                      <Trash2 className="h-4 w-4 text-destructive" />
                    </Button>
                  </Popconfirm>
                </div>
              </div>
            )}
          </div>

          <p className="text-sm text-muted-foreground line-clamp-2">{gift.description}</p>

          <div className="flex justify-between items-center">
            <div>
              {gift.categories?.map((category) => (
                <Badge key={category.id} variant="outline" className="shadow-sm">
                  {category.name}
                </Badge>
              ))}
            </div>
            <span className="text-lg text-primary">${gift.price.toLocaleString()}</span>
          </div>
        </div>

        {/* Cart Controls - Moved to bottom with mt-auto to push it to the bottom */}
        {isGuest && !gift.isPurchased && (
          <div className="mt-auto pt-4">
            {!isInCart ? (
              <Button className="w-full h-full" onClick={handleAddToCart} variant="default">
                <ShoppingCart className="h-4 w-4 mr-2" />
                Agregar al carrito
              </Button>
            ) : (
              <div className="flex flex-col space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={handleDecreaseQuantity}
                      disabled={cartItem?.quantity ? cartItem.quantity <= 1 : true}>
                      <Minus className="h-3 w-3" />
                    </Button>
                    <span className="w-8 text-center">{cartItem?.quantity}</span>
                    <Button variant="outline" size="sm" onClick={handleIncreaseQuantity}>
                      <Plus className="h-3 w-3" />
                    </Button>
                  </div>
                  <Button variant="ghost" size="sm" onClick={handleRemoveFromCart} className="text-destructive hover:text-destructive">
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
};
