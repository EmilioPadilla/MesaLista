import React, { memo } from 'react';
import { Col } from 'antd';
import { SortableItem } from 'components/core/SortableItem';
import type { Gift } from 'types/models/gift';
import { GiftCard } from 'components/shared/GiftCard';
import { DragHandleProps } from 'components/shared/GiftCard';

interface SortableGiftItemProps {
  gift: Gift;
  onDelete: (giftId: number) => void;
  onEdit: (giftId: number | undefined) => void;
}

const SortableGiftItemComponent: React.FC<SortableGiftItemProps> = ({ gift, onDelete, onEdit }) => {
  const card = (dragHandleProps: DragHandleProps) => (
    <GiftCard gift={gift} onDelete={onDelete} onEdit={onEdit} dragHandleProps={dragHandleProps} />
  );

  return (
    <Col xs={24} sm={24} md={12} lg={8} key={gift.id}>
      <SortableItem id={gift.id}>{(dragHandleProps) => card(dragHandleProps)}</SortableItem>
    </Col>
  );
};

// Memoize to prevent re-renders when gift data hasn't changed
export const SortableGiftItem = memo(SortableGiftItemComponent, (prevProps, nextProps) => {
  return prevProps.gift.id === nextProps.gift.id && prevProps.gift.order === nextProps.gift.order;
});
