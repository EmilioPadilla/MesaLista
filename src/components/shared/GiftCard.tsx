import { useState } from 'react';
import { Card, Button, Popconfirm } from 'antd';
import { DeleteOutlined, DragOutlined, ExclamationCircleFilled, ShopOutlined, ShoppingCartOutlined } from '@ant-design/icons';
import type { Gift } from 'types/models/gift';
import type { DraggableAttributes } from '@dnd-kit/core';
import type { SyntheticListenerMap } from '@dnd-kit/core/dist/hooks/utilities';

interface DragHandleProps {
  listeners: SyntheticListenerMap | undefined;
  attributes: DraggableAttributes;
}

interface GiftCardProps {
  isGuest?: boolean;
  gift: Gift;
  onDelete?: (giftId: number) => void;
  onMove?: (giftId: number) => void;
  onEdit: (giftId: number | undefined) => void;
  onAddToCart?: (giftId: number) => void;
  dragHandleProps?: DragHandleProps;
}

export const GiftCard: React.FC<GiftCardProps> = ({ gift, onDelete, onMove, onEdit, onAddToCart, dragHandleProps, isGuest = false }) => {
  const [isHovered, setIsHovered] = useState(false);
  const [imageError, setImageError] = useState(false);

  const handleDelete = (e?: React.MouseEvent) => {
    e?.preventDefault();
    e?.stopPropagation();
    if (onDelete) {
      onDelete(gift.id);
    }
  };

  const handleMove = (e: React.MouseEvent) => {
    e?.preventDefault();
    e?.stopPropagation();
    if (onMove) onMove(gift.id);
  };
  const purchasedCount = gift.isPurchased ? 1 : 0;
  const requestedCount = gift.quantity;

  const handleEditGift = (e: React.MouseEvent) => {
    e?.preventDefault();
    e?.stopPropagation();
    onEdit(gift.id);
  };

  const handleAddToCart = (e: React.MouseEvent) => {
    e?.preventDefault();
    e?.stopPropagation();
    if (onAddToCart) onAddToCart(gift.id);
  };

  return (
    <Card
      onClick={handleEditGift}
      className={`transition-all duration-200 ant-card-no-border h-full ${isHovered ? 'shadow-xl border-gray-300 cursor-pointer' : ''}`}
      styles={{ body: { padding: '16px', display: 'flex', flexDirection: 'column' } }}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      actions={
        isGuest
          ? [
              <div className="flex justify-center items-center gift-card-actions">
                <Button
                  icon={<ShoppingCartOutlined />}
                  type="primary"
                  disabled={gift.isPurchased}
                  size="small"
                  className="bg-white w-3/5 hover:bg-gray-100 cursor-grab mr-1"
                  onClick={handleAddToCart}>
                  Agregar al carrito
                </Button>
              </div>,
            ]
          : undefined
      }
      cover={
        <div className="relative overflow-hidden" style={{ height: '200px', border: '24px solid #fff' }}>
          {gift.imageUrl && !imageError ? (
            <img src={gift.imageUrl} alt={gift.title} className="w-full h-full object-contain" onError={() => setImageError(true)} />
          ) : (
            <img
              src="/images/gift_placeholder.png"
              alt={gift.title}
              className="w-full h-full object-contain"
              onError={(e) => {
                const target = e.target as HTMLImageElement;
                target.style.display = 'none';
                const parent = target.parentElement;
                if (parent) {
                  parent.innerHTML =
                    '<div class="w-full h-full bg-gray-100 flex items-center justify-center"><span class="text-gray-500">No Image</span></div>';
                }
              }}
            />
          )}
          {!isGuest && isHovered && (
            <div className="absolute top-2 left-0 right-0 flex justify-between items-center gift-card-actions">
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
                  <Button icon={<DeleteOutlined />} size="small" danger className="bg-white hover:bg-red-50" />
                </Popconfirm>
              </div>
              <Button
                icon={<DragOutlined />}
                size="small"
                className="bg-white hover:bg-gray-100 cursor-grab mr-1"
                onClick={handleMove}
                {...(dragHandleProps?.listeners || {})}
                {...(dragHandleProps?.attributes || {})}
              />
            </div>
          )}
        </div>
      }>
      <div className="flex flex-col flex-grow text-center">
        <div className="mb-1">
          <span className="text-xs uppercase text-gray-400">
            {gift.categories && gift.categories.length > 0
              ? gift.categories.map((categoryItem: any) => categoryItem?.name).join(', ')
              : 'Uncategorized'}
          </span>
        </div>
        <span className="mb-1 line-clamp-2" style={{ minHeight: '36px' }}>
          {gift.title}
        </span>
        <div className="text-gray-400">
          <div className="flex justify-center  items-center mb-2">
            <span className="text-gray-500">${gift.price.toFixed(2)}</span>
          </div>
          <div className="flex justify-around text-xs ">
            <span>{requestedCount} Requested</span> <span className="text-gray-500">|</span> <span>{purchasedCount} Gift Needed</span>
          </div>
        </div>
      </div>
    </Card>
  );
};
