import React from 'react';
import { Col } from 'antd';
import { GiftCard } from '../../../components/shared/GiftCard';
import { SortableItem } from 'components/core/SortableItem';
import type { Gift } from 'types/models/gift';
import { V2GiftCard } from 'components/shared/V2GiftCard';
import { DragHandleProps } from 'components/shared/V2GiftCard';

interface SortableGiftItemProps {
  newModel?: boolean;
  gift: Gift;
  onDelete: (giftId: number) => void;
  onEdit: (giftId: number | undefined) => void;
}

export const SortableGiftItem: React.FC<SortableGiftItemProps> = ({ gift, onDelete, onEdit, newModel = false }) => {
  const card = (dragHandleProps: DragHandleProps) =>
    newModel ? (
      <V2GiftCard gift={gift} onDelete={onDelete} onEdit={onEdit} dragHandleProps={dragHandleProps} />
    ) : (
      <GiftCard gift={gift} onDelete={onDelete} onEdit={onEdit} dragHandleProps={dragHandleProps} />
    );
  return (
    <Col xs={24} sm={24} md={12} lg={8} key={gift.id}>
      <SortableItem id={gift.id}>{(dragHandleProps) => card(dragHandleProps)}</SortableItem>
    </Col>
  );
};
