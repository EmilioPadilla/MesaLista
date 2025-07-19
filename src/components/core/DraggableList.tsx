import React, { ReactNode } from 'react';
import { DndContext, closestCenter, KeyboardSensor, PointerSensor, useSensor, useSensors, DragEndEvent } from '@dnd-kit/core';
import { arrayMove, SortableContext, sortableKeyboardCoordinates, rectSortingStrategy } from '@dnd-kit/sortable';

interface DraggableListProps<T> {
  items: T[];
  getItemId: (item: T) => number | string;
  onReorder: (reorderedItems: T[]) => void;
  renderContainer: (children: ReactNode) => ReactNode;
  renderItem: (item: T, index: number) => ReactNode;
}

export function DraggableList<T>({ items, getItemId, onReorder, renderContainer, renderItem }: DraggableListProps<T>) {
  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    }),
  );

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;

    if (over && active.id !== over.id) {
      const oldIndex = items.findIndex((item) => getItemId(item) === active.id);
      const newIndex = items.findIndex((item) => getItemId(item) === over.id);

      const reorderedItems = arrayMove(items, oldIndex, newIndex);
      onReorder(reorderedItems);
    }
  };

  return (
    <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
      <SortableContext items={items.map((item) => getItemId(item))} strategy={rectSortingStrategy}>
        {renderContainer(items.map((item, index) => renderItem(item, index)))}
      </SortableContext>
    </DndContext>
  );
}
