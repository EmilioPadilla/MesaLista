import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useState } from 'react';
import { Card, Typography, Button } from 'antd';
import { DeleteOutlined, DragOutlined } from '@ant-design/icons';
const { Text, Title } = Typography;
export const GiftCard = ({ gift, onDelete, onMove }) => {
    const [isHovered, setIsHovered] = useState(false);
    const handleDelete = (e) => {
        e.stopPropagation();
        if (onDelete)
            onDelete(gift.id);
    };
    const handleMove = (e) => {
        e.stopPropagation();
        if (onMove)
            onMove(gift.id);
    };
    // Calculate how many have been purchased
    const purchasedCount = gift.isPurchased ? 1 : 0; // This will need to be updated with actual data
    const requestedCount = 1; // This will need to be updated with actual data
    return (_jsx(Card, { className: `transition-all duration-200 h-full ${isHovered ? 'shadow-lg border-gray-300' : ''}`, styles: { body: { padding: '16px', height: '100%', display: 'flex', flexDirection: 'column' } }, onMouseEnter: () => setIsHovered(true), onMouseLeave: () => setIsHovered(false), cover: _jsxs("div", { className: "relative overflow-hidden", style: { height: '200px' }, children: [gift.imageUrl ? (_jsx("img", { src: gift.imageUrl, alt: gift.title, className: "w-full h-full object-cover" })) : (_jsx("div", { className: "w-full h-full bg-gray-100 flex items-center justify-center", children: _jsx(Text, { type: "secondary", children: "No Image" }) })), isHovered && (_jsxs("div", { className: "absolute top-2 right-2 flex space-x-2", children: [_jsx(Button, { icon: _jsx(DragOutlined, {}), size: "small", className: "bg-white hover:bg-gray-100", onClick: handleMove }), _jsx(Button, { icon: _jsx(DeleteOutlined, {}), size: "small", danger: true, className: "bg-white hover:bg-red-50", onClick: handleDelete })] }))] }), children: _jsxs("div", { className: "flex flex-col flex-grow", children: [_jsx("div", { className: "mb-1", children: _jsx(Text, { type: "secondary", className: "text-xs uppercase", children: gift.category || 'Uncategorized' }) }), _jsx(Title, { level: 5, className: "mb-1 line-clamp-2", style: { minHeight: '48px' }, children: gift.title }), _jsxs("div", { className: "", children: [_jsx("div", { className: "flex justify-between items-center mb-2", children: _jsxs(Text, { strong: true, className: "text-lg", children: ["$", gift.price.toFixed(2)] }) }), _jsxs("div", { className: "flex justify-between text-xs text-gray-500", children: [_jsxs("span", { children: [requestedCount, " Requested"] }), _jsxs("span", { children: [purchasedCount, " Gift Needed"] })] })] })] }) }));
};
