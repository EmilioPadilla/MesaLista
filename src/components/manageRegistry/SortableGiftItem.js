import { jsx as _jsx } from "react/jsx-runtime";
import { Col } from 'antd';
import { GiftCard } from './GiftCard';
import { SortableItem } from '../core/SortableItem';
export const SortableGiftItem = ({ gift, onDelete, onMove }) => {
    return (_jsx(Col, { xs: 24, sm: 12, md: 8, lg: 6, children: _jsx(SortableItem, { id: gift.id, children: _jsx(GiftCard, { gift: gift, onDelete: onDelete, onMove: onMove }) }) }, gift.id));
};
