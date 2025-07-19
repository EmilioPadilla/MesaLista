import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import React from 'react';
import { Typography, Button, Table, Tag, Input, Space } from 'antd';
import { PlusOutlined, EditOutlined, DeleteOutlined, SearchOutlined } from '@ant-design/icons';
import { useQuery } from '@tanstack/react-query';
import { useOutletContext } from 'react-router-dom';
import { giftService } from 'services/gift.service';
import { CreateWeddingGift } from 'components/CreateWeddingGift';
const { Title, Paragraph } = Typography;
// Using Gift type from giftService
// Removed mock gifts - using real data from backend
const GiftRegistry = (props) => {
    // Use props if provided directly, otherwise use context from Outlet
    const contextData = useOutletContext();
    const userData = props.userData || contextData?.userData;
    const [isModalVisible, setIsModalVisible] = React.useState(false);
    // Fetch wedding list for the couple
    const { data: weddingList, isLoading: isLoadingWeddingList, error: weddingListError, } = useQuery({
        queryKey: ['weddingList', userData?.id],
        queryFn: () => giftService.getWeddingListByCouple(userData?.id),
        enabled: !!userData?.id && userData?.role === 'COUPLE',
    });
    // Fetch gifts for the wedding list
    const { data: gifts = [], isLoading: isLoadingGifts, error: giftsError, } = useQuery({
        queryKey: ['gifts', weddingList?.id],
        queryFn: () => giftService.getGiftsByWeddingList(weddingList?.id),
        enabled: !!weddingList?.id,
    });
    // Handle loading and error states
    const isLoading = isLoadingWeddingList || isLoadingGifts;
    const error = weddingListError || giftsError;
    const showModal = () => {
        setIsModalVisible(true);
    };
    const columns = [
        {
            title: 'Regalo',
            dataIndex: 'title',
            key: 'title',
            render: (text, record) => (_jsxs("div", { children: [_jsx("div", { className: "font-medium", children: text }), _jsx("div", { className: "text-xs text-gray-500", children: record.description })] })),
        },
        {
            title: 'Precio',
            dataIndex: 'price',
            key: 'price',
            render: (price) => `$${price.toFixed(2)}`,
        },
        {
            title: 'Categoría',
            dataIndex: 'category',
            key: 'category',
        },
        {
            title: 'Estado',
            dataIndex: 'isPurchased',
            key: 'status',
            render: (isPurchased) => {
                const color = isPurchased ? 'blue' : 'green';
                const text = isPurchased ? 'Comprado' : 'Disponible';
                return _jsx(Tag, { color: color, children: text });
            },
        },
        {
            title: 'Acciones',
            key: 'actions',
            render: (_, _record) => (_jsxs(Space, { size: "middle", children: [_jsx(Button, { type: "text", icon: _jsx(EditOutlined, {}) }), _jsx(Button, { type: "text", danger: true, icon: _jsx(DeleteOutlined, {}) })] })),
        },
    ];
    return (_jsxs("div", { className: "m-6", children: [_jsxs("div", { className: "p-6 bg-white rounded-lg shadow", children: [_jsxs("div", { className: "flex justify-between items-center mb-6", children: [_jsxs("div", { children: [_jsx(Title, { level: 2, children: "Mesa de Regalos" }), _jsx(Paragraph, { children: "Gestiona los regalos que deseas recibir en tu boda. Puedes agregar, editar o eliminar regalos." })] }), userData?.role === 'COUPLE' && (_jsx(Button, { type: "primary", icon: _jsx(PlusOutlined, {}), onClick: showModal, children: "Agregar Regalo" }))] }), _jsx("div", { className: "mb-4", children: _jsx(Input.Search, { placeholder: "Buscar regalos", allowClear: true, enterButton: _jsx(SearchOutlined, {}), size: "large", onSearch: (value) => console.log(value) }) }), isLoading ? (_jsx("div", { className: "flex justify-center items-center h-64", children: _jsx(Typography.Text, { children: "Cargando regalos..." }) })) : error ? (_jsx("div", { className: "flex justify-center items-center h-64", children: _jsx(Typography.Text, { type: "danger", children: "Error al cargar los regalos. Por favor, intente de nuevo." }) })) : gifts.length === 0 ? (_jsx("div", { className: "flex justify-center items-center h-64", children: _jsx(Typography.Text, { children: "No hay regalos disponibles." }) })) : (_jsx(Table, { dataSource: gifts, columns: columns, rowKey: "id", pagination: false }))] }), _jsx(CreateWeddingGift, { isModalVisible: isModalVisible, setIsModalVisible: setIsModalVisible })] }));
};
export default GiftRegistry;
