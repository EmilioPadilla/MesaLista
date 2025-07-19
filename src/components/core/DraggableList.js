import { jsx as _jsx } from "react/jsx-runtime";
import { DndContext, closestCenter, KeyboardSensor, PointerSensor, useSensor, useSensors } from '@dnd-kit/core';
import { arrayMove, SortableContext, sortableKeyboardCoordinates, rectSortingStrategy } from '@dnd-kit/sortable';
export function DraggableList({ items, getItemId, onReorder, renderContainer, renderItem }) {
    const sensors = useSensors(useSensor(PointerSensor), useSensor(KeyboardSensor, {
        coordinateGetter: sortableKeyboardCoordinates,
    }));
    const handleDragEnd = (event) => {
        const { active, over } = event;
        if (over && active.id !== over.id) {
            const oldIndex = items.findIndex((item) => getItemId(item) === active.id);
            const newIndex = items.findIndex((item) => getItemId(item) === over.id);
            const reorderedItems = arrayMove(items, oldIndex, newIndex);
            onReorder(reorderedItems);
        }
    };
    return (_jsx(DndContext, { sensors: sensors, collisionDetection: closestCenter, onDragEnd: handleDragEnd, children: _jsx(SortableContext, { items: items.map((item) => getItemId(item)), strategy: rectSortingStrategy, children: renderContainer(items.map((item, index) => renderItem(item, index))) }) }));
}
