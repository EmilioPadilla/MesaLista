import React, { ReactNode } from 'react';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { DraggableAttributes } from '@dnd-kit/core';
import { SyntheticListenerMap } from '@dnd-kit/core/dist/hooks/utilities';

interface DragHandleProps {
  listeners: SyntheticListenerMap | undefined;
  attributes: DraggableAttributes;
}

interface SortableItemProps {
  id: number | string;
  children: ReactNode | ((dragHandleProps: DragHandleProps) => ReactNode);
  className?: string;
}

export const SortableItem: React.FC<SortableItemProps> = ({ id, children, className = '' }) => {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
    zIndex: isDragging ? 1 : 0,
    height: '100%',
  };

  const dragHandleProps: DragHandleProps = {
    listeners,
    attributes,
  };

  return (
    <div ref={setNodeRef} style={style} className={`${className} h-full`}>
      <div className="h-full">
        {typeof children === 'function' ? children(dragHandleProps) : children}
      </div>
    </div>
  );
};
