import { jsx as _jsx } from "react/jsx-runtime";
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
export const SortableItem = ({ id, children, className = '' }) => {
    const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id });
    const style = {
        transform: CSS.Transform.toString(transform),
        transition,
        opacity: isDragging ? 0.5 : 1,
        zIndex: isDragging ? 1 : 0,
        height: '100%',
    };
    return (_jsx("div", { ref: setNodeRef, style: style, className: `${className} h-full`, ...attributes, children: _jsx("div", { ...listeners, className: "h-full cursor-grab", children: children }) }));
};
