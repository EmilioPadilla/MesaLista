import { useState } from 'react';
import { Card, Typography, Button, Popconfirm, Tooltip } from 'antd';
import { DeleteOutlined, DragOutlined, EditOutlined, ExclamationCircleFilled } from '@ant-design/icons';
import type { Gift } from 'types/models/gift';
import type { DraggableAttributes } from '@dnd-kit/core';
import type { SyntheticListenerMap } from '@dnd-kit/core/dist/hooks/utilities';

const { Text, Title } = Typography;

interface DragHandleProps {
  listeners: SyntheticListenerMap | undefined;
  attributes: DraggableAttributes;
}

interface GiftCardProps {
  gift: Gift;
  onDelete?: (giftId: number) => void;
  onMove?: (giftId: number) => void;
  onEdit: (giftId: number | undefined) => void;
  dragHandleProps?: DragHandleProps;
}

export const GiftCard: React.FC<GiftCardProps> = ({ gift, onDelete, onMove, onEdit, dragHandleProps }) => {
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
    e.stopPropagation();
    if (onMove) onMove(gift.id);
  };
  // Calculate how many have been purchased
  const purchasedCount = gift.isPurchased ? 1 : 0; // This will need to be updated with actual data
  const requestedCount = gift.quantity; // This will need to be updated with actual data

  const handleEditImage = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    onEdit(gift.id);
  };

  return (
    <Card
      className={`transition-all duration-200 ant-card-no-boder h-full ${isHovered ? 'shadow-lg border-gray-300' : ''}`}
      styles={{ body: { padding: '16px', display: 'flex', flexDirection: 'column' } }}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      cover={
        <div className="relative overflow-hidden" style={{ height: '200px' }}>
          {gift.imageUrl && !imageError ? (
            <img src={gift.imageUrl} alt={gift.title} className="w-full h-full object-cover" onError={() => setImageError(true)} />
          ) : (
            <img
              src="/images/gift_placeholder.png"
              alt={gift.title}
              className="w-full h-full object-contain"
              onError={(e) => {
                // If even the fallback fails, show a div with text
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
          {isHovered && (
            <div className="absolute top-2 right-2 flex space-x-2 gift-card-actions">
              <Button icon={<EditOutlined />} size="small" className="bg-white hover:bg-gray-100" onClick={handleEditImage} />
              <Button
                icon={<DragOutlined />}
                size="small"
                className="bg-white hover:bg-gray-100 cursor-grab"
                onClick={handleMove}
                {...(dragHandleProps?.listeners || {})}
                {...(dragHandleProps?.attributes || {})}
              />
              <Popconfirm
                title="Delete Gift"
                className="pop-delete"
                description="Are you sure you want to delete this gift?"
                onConfirm={handleDelete}
                okText="Yes"
                icon={<ExclamationCircleFilled color="red" />}
                okButtonProps={{ danger: true }}
                cancelText="No">
                <Button icon={<DeleteOutlined />} size="small" danger className="bg-white hover:bg-red-50" />
              </Popconfirm>
            </div>
          )}
        </div>
      }>
      <div className="flex flex-col flex-grow">
        <div className="mb-1">
          <Text type="secondary" className="text-xs uppercase">
            {gift.categories && gift.categories.length > 0
              ? gift.categories.map((categoryItem: any) => categoryItem.category.name).join(', ')
              : 'Uncategorized'}
          </Text>
        </div>
        <Title level={5} className="mb-1 line-clamp-2" style={{ minHeight: '48px' }}>
          {gift.title}
        </Title>
        <div className="">
          <div className="flex justify-between items-center mb-2">
            <Text strong className="text-lg">
              ${gift.price.toFixed(2)}
            </Text>
          </div>
          <div className="flex justify-between text-xs text-gray-500">
            <span>{requestedCount} Requested</span>
            <span>{purchasedCount} Gift Needed</span>
          </div>
        </div>
      </div>
    </Card>
  );
};
