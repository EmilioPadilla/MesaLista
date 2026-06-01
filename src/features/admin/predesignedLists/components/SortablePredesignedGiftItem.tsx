import React from 'react';
import { SortableItem } from 'components/core/SortableItem';
import { PredesignedGift } from 'services/predesignedList.service';
import { PredesignedGiftCard, DragHandleProps } from './PredesignedGiftCard';

interface SortablePredesignedGiftItemProps {
  gift: PredesignedGift;
  onEdit: (gift: PredesignedGift) => void;
  onDelete: (giftId: number) => void;
}

export const SortablePredesignedGiftItem: React.FC<SortablePredesignedGiftItemProps> = ({
  gift,
  onEdit,
  onDelete,
}) => {
  const card = (dragHandleProps: DragHandleProps) => (
    <PredesignedGiftCard gift={gift} onEdit={onEdit} onDelete={onDelete} dragHandleProps={dragHandleProps} />
  );

  return <SortableItem id={gift.id}>{(dragHandleProps) => card(dragHandleProps)}</SortableItem>;
};
