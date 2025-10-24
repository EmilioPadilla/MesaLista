import { DragOutlined, ExclamationCircleFilled, StarFilled } from '@ant-design/icons';
import { Edit, Minus, Plus, ShoppingCart, Trash2 } from 'lucide-react';
import { GiftItem } from 'routes/couple/ManageRegistry';
import { useState, memo } from 'react';
import type { DraggableAttributes } from '@dnd-kit/core';
import type { SyntheticListenerMap } from '@dnd-kit/core/dist/hooks/utilities';
import { Popconfirm, Tag, Button, Card, Tooltip } from 'antd';
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
  variant?: 'default' | 'predesigned';
}

const GiftCardComponent = ({
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
  variant = 'default',
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

  if (variant === 'predesigned') {
    return (
      <Card
        styles={{ body: { height: '100%' } }}
        className="group bg-white border-border/30 shadow-lg hover:shadow-2xl transition-all duration-300 overflow-hidden rounded-2xl h-full flex flex-col"
        cover={
          <div className="relative overflow-hidden h-40">
            <img
              src={gift.imageUrl}
              alt={gift.title}
              loading="lazy"
              className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
            />
          </div>
        }>
        <div className="flex flex-col flex-1 h-full">
          <div className="space-y-2 flex-1">
            <h3 className="text-xl mb-2 text-primary font-semibold">{gift.title}</h3>
            <p className="text-muted-foreground line-clamp-2">{gift.description}</p>
          </div>

          <div className="flex flex-col justify-end items-center gap-4 mt-4 flex-1 h-full">
            <div
              className={`flex items-center w-full ${gift.categories && gift.categories?.length > 0 ? 'justify-between' : 'justify-end'}`}>
              {/* <div> */}
              {gift.categories && gift.categories.length > 0 ? (
                <div className="flex items-center gap-1">
                  <Tag bordered={false} className="shadow-sm !bg-white font-bold">
                    {gift.categories[0].name}
                  </Tag>
                  {gift.categories.length > 1 && (
                    <Tooltip
                      title={
                        <div className="space-y-1">
                          {gift.categories.slice(1).map((category) => (
                            <div key={category.id}>{category.name}</div>
                          ))}
                        </div>
                      }>
                      <div className="flex items-center justify-center w-6 h-6 rounded shadow-sm bg-white border border-border/30 cursor-pointer hover:bg-primary/10 transition-colors">
                        <Plus className="h-3 w-3 text-primary" />
                      </div>
                    </Tooltip>
                  )}
                </div>
              ) : null}
              {/* </div> */}
              <span className="text-lg text-primary">${gift.price.toLocaleString()}</span>
            </div>
            <Button
              onClick={handleAddToCart}
              className="rounded-full transition-all duration-200 !border-primary !text-primary hover:!bg-primary hover:!text-white w-full"
              size="large">
              <Plus className="h-4 w-4 mr-2" />
              Agregar
            </Button>
          </div>
        </div>
      </Card>
    );
  }

  return (
    <Card
      key={gift.id}
      onClick={handleEditGift}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      className={`relative shadow-lg hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1 h-full flex flex-col 
      ${isHovered ? 'cursor-pointer' : ''}
      ${gift.isPurchased ? 'opacity-75' : ''}`}
      styles={{
        body: {
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
        },
      }}
      cover={
        <div className="relative">
          <div className="h-40 overflow-hidden rounded-t-lg">
            {gift.imageUrl ? (
              <img
                src={gift.imageUrl}
                alt={gift.title}
                loading="lazy"
                className="w-full h-full object-cover rounded-t-lg"
                style={{
                  objectPosition: `center ${(gift as any).imagePosition ?? 50}%`,
                }}
              />
            ) : (
              <img
                src="/images/gift_placeholder.png"
                alt="Gift placeholder"
                loading="lazy"
                className="w-full h-full object-cover rounded-t-lg"
              />
            )}
          </div>
          {gift.isPurchased && (
            <div className="absolute top-2 right-2">
              <Tag bordered={false} className="shadow-md backdrop-blur-sm !rounded-lg font-bold !bg-green-500">
                Comprado
              </Tag>
            </div>
          )}
          {gift.isMostWanted && (
            <div className="absolute top-2 left-2">
              <Tag bordered={false} className="shadow-md backdrop-blur-sm !rounded-lg font-bold !bg-yellow-500">
                <StarFilled />
              </Tag>
            </div>
          )}
          {(isHovered || deviceType === 'mobile') && !isGuest && (
            <div className="absolute top-2 left-2 flex justify-between items-center gift-card-actions">
              <Button
                size="small"
                className="cursor-grab mr-1"
                onClick={handleMove}
                {...(dragHandleProps?.listeners || {})}
                {...(dragHandleProps?.attributes || {})}>
                <DragOutlined color="black" />
              </Button>
            </div>
          )}
        </div>
      }>
      <div className="flex-grow flex flex-col h-full">
        <div className="space-y-2 flex-grow flex flex-col">
          <div className="flex justify-between items-start">
            <div className="text-xl font-bold">{gift.title}</div>
            {!gift.isPurchased && !isGuest && (
              <div className="flex gap-1">
                <Button
                  size="small"
                  variant="text"
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
                    <Button size="small" variant="text" className="hover:shadow-md hover:cursor-pointer transition-all duration-200">
                      <Trash2 className="h-4 w-4 text-destructive" />
                    </Button>
                  </Popconfirm>
                </div>
              </div>
            )}
          </div>

          <p className="!text-md text-muted-foreground line-clamp-2">{gift.description}</p>

          <div className="flex justify-between items-center">
            <div>
              {gift.categories?.map((category) => (
                <Tag key={category.id} bordered={false} className="shadow-sm !bg-white font-bold">
                  {category.name}
                </Tag>
              ))}
            </div>
            <span className="text-lg text-primary">${gift.price.toLocaleString()}</span>
          </div>
        </div>

        {/* Cart Controls - Moved to bottom with mt-auto to push it to the bottom */}
        {isGuest && !gift.isPurchased && (
          <div className="mt-auto pt-4">
            {!isInCart ? (
              <Button className="w-full h-full" onClick={handleAddToCart} type="primary">
                <ShoppingCart className="h-4 w-4 mr-2" />
                Agregar al carrito
              </Button>
            ) : (
              <div className="flex flex-col space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <Button
                      variant="outlined"
                      size="small"
                      onClick={handleDecreaseQuantity}
                      disabled={cartItem?.quantity ? cartItem.quantity <= 1 : true}>
                      <Minus className="h-3 w-3" />
                    </Button>
                    <span className="w-8 text-center">{cartItem?.quantity}</span>
                    <Button variant="outlined" size="small" onClick={handleIncreaseQuantity}>
                      <Plus className="h-3 w-3" />
                    </Button>
                  </div>
                  <Button variant="text" size="small" onClick={handleRemoveFromCart} className="text-destructive hover:text-destructive">
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </Card>
  );
};

// Memoize the component to prevent unnecessary re-renders
// Only re-render if gift data, handlers, or cart state actually changes
export const GiftCard = memo(GiftCardComponent, (prevProps, nextProps) => {
  // Custom comparison function for better performance
  return (
    prevProps.gift.id === nextProps.gift.id &&
    prevProps.gift.title === nextProps.gift.title &&
    prevProps.gift.price === nextProps.gift.price &&
    prevProps.gift.isPurchased === nextProps.gift.isPurchased &&
    prevProps.gift.isMostWanted === nextProps.gift.isMostWanted &&
    prevProps.gift.imageUrl === nextProps.gift.imageUrl &&
    prevProps.isGuest === nextProps.isGuest &&
    prevProps.variant === nextProps.variant &&
    prevProps.cartItems?.length === nextProps.cartItems?.length
  );
});
