import { useState } from 'react';
import { Card, Typography, Button, Tooltip } from 'antd';
import { DeleteOutlined, DragOutlined } from '@ant-design/icons';
import type { GiftBase } from '../../../shared/types/gift';

const { Text, Title } = Typography;

interface GiftCardProps {
  gift: GiftBase;
  onDelete?: (giftId: number) => void;
  onMove?: (giftId: number) => void;
}

export const GiftCard: React.FC<GiftCardProps> = ({ gift, onDelete, onMove }) => {
  const [isHovered, setIsHovered] = useState(false);

  const handleDelete = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (onDelete) onDelete(gift.id);
  };

  const handleMove = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (onMove) onMove(gift.id);
  };

  // Calculate how many have been purchased
  const purchasedCount = gift.isPurchased ? 1 : 0; // This will need to be updated with actual data
  const requestedCount = 1; // This will need to be updated with actual data

  return (
    <Card
      className={`transition-all duration-200 h-full ${isHovered ? 'shadow-lg border-gray-300' : ''}`}
      styles={{ body: { padding: '16px', height: '100%', display: 'flex', flexDirection: 'column' } }}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      cover={
        <div className="relative overflow-hidden" style={{ height: '200px' }}>
          {gift.imageUrl ? (
            <img src={gift.imageUrl} alt={gift.title} className="w-full h-full object-cover" />
          ) : (
            <div className="w-full h-full bg-gray-100 flex items-center justify-center">
              <Text type="secondary">No Image</Text>
            </div>
          )}
          {isHovered && (
            <div className="absolute top-2 right-2 flex space-x-2">
              <Button icon={<DragOutlined />} size="small" className="bg-white hover:bg-gray-100" onClick={handleMove} />
              <Button icon={<DeleteOutlined />} size="small" danger className="bg-white hover:bg-red-50" onClick={handleDelete} />
            </div>
          )}
        </div>
      }>
      <div className="flex flex-col flex-grow">
        <div className="mb-1">
          <Text type="secondary" className="text-xs uppercase">
            {gift.category || 'Uncategorized'}
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
