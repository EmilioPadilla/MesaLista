import React from 'react';
import { Col } from 'antd';
import { GiftCard } from './GiftCard';
import { SortableItem } from '../core/SortableItem';
import type { GiftBase } from '../../../shared/types/gift';

interface SortableGiftItemProps {
  gift: GiftBase;
  onDelete?: (giftId: number) => void;
  onMove?: (giftId: number) => void;
}

export const SortableGiftItem: React.FC<SortableGiftItemProps> = ({ gift, onDelete, onMove }) => {
  return (
    <Col xs={24} sm={12} md={8} lg={6} key={gift.id}>
      <SortableItem id={gift.id}>
        <GiftCard 
          gift={gift} 
          onDelete={onDelete} 
          onMove={onMove} 
        />
      </SortableItem>
    </Col>
  );
};
