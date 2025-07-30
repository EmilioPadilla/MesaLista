import React from 'react';
import { Col } from 'antd';
import { GiftCard } from '../../../components/shared/GiftCard';
import { SortableItem } from 'components/core/SortableItem';
import type { Gift } from 'types/models/gift';

interface SortableGiftItemProps {
  gift: Gift;
  onDelete?: (giftId: number) => void;
  onMove?: (giftId: number) => void;
  onEdit: (giftId: number | undefined) => void;
}

export const SortableGiftItem: React.FC<SortableGiftItemProps> = ({ gift, onDelete, onMove, onEdit }) => {
  return (
    <Col xs={24} sm={12} md={8} lg={6} key={gift.id}>
      <SortableItem id={gift.id}>
        {(dragHandleProps) => (
          <GiftCard gift={gift} onDelete={onDelete} onMove={onMove} onEdit={onEdit} dragHandleProps={dragHandleProps} />
        )}
      </SortableItem>
    </Col>
  );
};
