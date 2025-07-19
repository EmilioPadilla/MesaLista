import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useState, useEffect } from 'react';
import { Row, Typography, Button, Select, Empty } from 'antd';
import { PlusOutlined } from '@ant-design/icons';
import { DraggableList } from '../core/DraggableList';
import { SortableGiftItem } from './SortableGiftItem';
const { Title, Text } = Typography;
export const GiftsList = ({ weddingListData, loadingGifts, onOpenAddGiftModal }) => {
    const [filter, setFilter] = useState('Everything');
    const [gifts, setGifts] = useState(weddingListData?.gifts || []);
    useEffect(() => {
        if (weddingListData) {
            setGifts(weddingListData.gifts);
        }
    }, [weddingListData]);
    const handleReorderGifts = (reorderedGifts) => {
        setGifts(reorderedGifts);
        // Here you would typically save the new order to the backend
        console.log('Gifts reordered:', reorderedGifts);
    };
    const handleDeleteGift = (giftId) => {
        console.log('Delete gift:', giftId);
        // Implement delete functionality
        setGifts(gifts.filter((gift) => gift.id !== giftId));
    };
    const handleMoveGift = (giftId) => {
        console.log('Move gift:', giftId);
        // Implement move functionality
    };
    const filterOptions = [
        { value: 'Everything', label: 'Everything' },
        { value: 'Kitchen', label: 'Kitchen' },
        { value: 'Dining', label: 'Dining' },
        { value: 'Bedroom', label: 'Bedroom' },
        { value: 'Bathroom', label: 'Bathroom' },
        { value: 'Living Room', label: 'Living Room' },
    ];
    const filteredGifts = filter === 'Everything' ? gifts : gifts.filter((gift) => gift.category === filter);
    return (_jsxs("div", { className: "mt-8 w-full", children: [_jsxs("div", { className: "flex justify-between items-center mb-6", children: [_jsx(Title, { level: 3, className: "m-0", children: "Tus Regalos" }), _jsxs("div", { className: "flex items-center", children: [_jsx(Text, { className: "mr-2", children: "Filtrar por:" }), _jsx(Select, { value: filter, onChange: setFilter, style: { width: 150 }, options: filterOptions }), _jsx(Button, { type: "primary", icon: _jsx(PlusOutlined, {}), className: "ml-4", onClick: onOpenAddGiftModal })] })] }), filteredGifts.length === 0 ? (_jsx("div", { className: "bg-gray-50 rounded-lg p-10 text-center", children: _jsx(Empty, { description: _jsxs("div", { className: "mt-4", children: [_jsx(Text, { className: "text-gray-500 block mb-4", children: "No gifts added yet" }), _jsx(Button, { type: "primary", icon: _jsx(PlusOutlined, {}), onClick: onOpenAddGiftModal, children: "Add Gifts" })] }) }) })) : (_jsx(DraggableList, { items: filteredGifts, getItemId: (gift) => gift.id, onReorder: handleReorderGifts, renderContainer: (children) => (_jsx(Row, { gutter: [24, 24], className: "min-h-[200px]", children: children })), renderItem: (gift) => _jsx(SortableGiftItem, { gift: gift, onDelete: handleDeleteGift, onMove: handleMoveGift }, gift.id) }))] }));
};
