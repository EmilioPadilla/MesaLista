import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useState } from 'react';
import { Typography, Input, Card, Row, Col, Button, Avatar, Modal, Form, message, Spin } from 'antd';
import { SearchOutlined, HeartOutlined, ShoppingCartOutlined, UserOutlined } from '@ant-design/icons';
import { giftService } from '../services/gift.service';
import { useWeddingLists } from 'hooks/useWeddingList';
const { Title, Paragraph, Text } = Typography;
const GiftLists = () => {
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedGift, setSelectedGift] = useState(null);
    const [isPurchaseModalVisible, setIsPurchaseModalVisible] = useState(false);
    const [form] = Form.useForm();
    const [purchaseLoading, setPurchaseLoading] = useState(false);
    // Fetch all wedding lists from the API
    const { data: weddingLists, isLoading: isLoadingWeddingLists, refetch } = useWeddingLists();
    // Filter wedding lists based on search term
    const filteredWeddingLists = weddingLists
        ? weddingLists.filter((list) => list.coupleName.toLowerCase().includes(searchTerm.toLowerCase()))
        : [];
    const handlePurchase = (gift) => {
        setSelectedGift(gift);
        setIsPurchaseModalVisible(true);
        form.resetFields();
    };
    const handlePurchaseSubmit = async (values) => {
        if (!selectedGift)
            return;
        setPurchaseLoading(true);
        try {
            // The backend will extract the user ID from the JWT token
            await giftService.purchaseGift(selectedGift.id, values.message);
            message.success('¡Regalo comprado exitosamente!');
            setIsPurchaseModalVisible(false);
            // Refetch wedding lists to update the UI
            await refetch();
        }
        catch (error) {
            message.error('Error al comprar el regalo. Por favor intenta de nuevo.');
            console.error('Purchase error:', error);
        }
        finally {
            setPurchaseLoading(false);
        }
    };
    return (_jsxs("div", { className: "m-6", children: [_jsxs("div", { className: "p-6 bg-white rounded-lg shadow", children: [_jsxs("div", { className: "mb-6", children: [_jsx(Title, { level: 2, children: "Listas de Regalos" }), _jsx(Paragraph, { children: "Explora las listas de regalos de las parejas y haz un regalo especial para su boda." })] }), _jsx("div", { className: "mb-6", children: _jsx(Input.Search, { placeholder: "Buscar por nombre de pareja", allowClear: true, enterButton: _jsx(SearchOutlined, {}), size: "large", value: searchTerm, onChange: (e) => setSearchTerm(e.target.value), onSearch: (value) => setSearchTerm(value) }) }), isLoadingWeddingLists ? (_jsx("div", { className: "flex justify-center items-center h-64", children: _jsx(Spin, { size: "large" }) })) : filteredWeddingLists.length === 0 ? (_jsx("div", { className: "flex justify-center items-center h-64", children: _jsx(Text, { children: "No se encontraron listas de regalos." }) })) : (_jsx("div", { children: filteredWeddingLists.map((weddingList) => (_jsx(Card, { className: "mb-6", title: _jsxs("div", { className: "flex items-center", children: [_jsx(Avatar, { src: weddingList.imageUrl, size: 64, icon: _jsx(UserOutlined, {}), className: "mr-4" }), _jsxs("div", { children: [_jsx(Title, { level: 4, className: "mb-0", children: weddingList.coupleName }), _jsxs(Text, { type: "secondary", children: ["Fecha de boda:", ' ', new Date(weddingList.weddingDate).toLocaleDateString('es-MX', { year: 'numeric', month: 'long', day: 'numeric' })] })] })] }), children: _jsx(Row, { gutter: [16, 16], children: weddingList?.gifts?.map((gift) => (_jsx(Col, { xs: 24, sm: 12, md: 8, children: _jsxs(Card, { hoverable: true, className: `h-full flex flex-col ${gift.isPurchased ? 'opacity-60' : ''}`, children: [_jsxs("div", { className: "flex-grow", children: [_jsxs("div", { className: "flex justify-between items-start mb-2", children: [_jsx(Title, { level: 5, className: "mb-1", children: gift?.title }), _jsxs(Text, { strong: true, className: "text-lg", children: ["$", gift?.price.toFixed(2)] })] }), _jsx(Paragraph, { className: "text-gray-600 mb-4", children: gift?.description })] }), _jsx("div", { className: "mt-auto pt-4 flex justify-between items-center", children: gift.isPurchased ? (_jsx(Button, { type: "text", icon: _jsx(HeartOutlined, {}), disabled: true, children: "Ya comprado" })) : (_jsx(Button, { type: "primary", icon: _jsx(ShoppingCartOutlined, {}), onClick: () => handlePurchase(gift), children: "Comprar Regalo" })) })] }) }, gift.id))) }) }, weddingList.id))) }))] }), _jsx(Modal, { title: "Comprar Regalo", open: isPurchaseModalVisible, onCancel: () => setIsPurchaseModalVisible(false), footer: null, children: selectedGift && (_jsxs("div", { children: [_jsxs("div", { className: "mb-4", children: [_jsx(Title, { level: 4, children: selectedGift.title }), _jsx(Text, { className: "block mb-2", children: selectedGift.description }), _jsxs(Text, { strong: true, className: "text-lg", children: ["$", selectedGift.price.toFixed(2)] })] }), _jsxs(Form, { form: form, layout: "vertical", onFinish: handlePurchaseSubmit, children: [_jsx(Form.Item, { name: "message", label: "Mensaje para los novios", rules: [{ required: true, message: 'Por favor escribe un mensaje' }], children: _jsx(Input.TextArea, { rows: 4, placeholder: "Escribe un mensaje especial para los novios..." }) }), _jsxs("div", { className: "flex justify-end", children: [_jsx(Button, { className: "mr-2", onClick: () => setIsPurchaseModalVisible(false), children: "Cancelar" }), _jsx(Button, { type: "primary", htmlType: "submit", loading: purchaseLoading, children: "Confirmar Compra" })] })] })] })) })] }));
};
export default GiftLists;
