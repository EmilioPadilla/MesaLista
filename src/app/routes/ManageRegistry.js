import { jsx as _jsx, Fragment as _Fragment, jsxs as _jsxs } from "react/jsx-runtime";
import { useState } from 'react';
import { Card, Spin, Row, Col, Button } from 'antd';
import { useOutletContext } from 'react-router-dom';
import { useWeddingListByCouple } from 'hooks/useWeddingList';
import { RegistryAdvisor } from 'components/manageRegistry/RegistryAdvisor';
import { GiftsList } from 'components/manageRegistry/GiftsList';
import { AddGift } from 'src/components/manageRegistry/AddGift';
const ManageRegistry = (props) => {
    // Use props if provided directly, otherwise use context from Outlet
    const contextData = useOutletContext();
    const { data: weddinglist, isLoading: loadingGifts } = useWeddingListByCouple(contextData?.userData?.id);
    const [isAddGiftModalOpen, setIsAddGiftModalOpen] = useState(false);
    const userData = props?.userData || contextData?.userData;
    const isLoading = props?.isLoading !== undefined ? props?.isLoading : contextData?.isLoading;
    const isCouple = props?.isCouple !== undefined ? props?.isCouple : contextData?.isCouple;
    return (_jsxs("div", { className: "m-6", children: [isLoading ? (_jsx("div", { className: "flex justify-center items-center h-64", children: _jsx(Spin, { size: "large" }) })) : (_jsx("div", { className: "p-6 bg-white rounded-lg", children: userData && (_jsx(_Fragment, { children: _jsx(Row, { gutter: [16, 16], className: "mt-6", children: isCouple ? (_jsxs(_Fragment, { children: [_jsx(RegistryAdvisor, { userData: userData, weddinglist: weddinglist }), _jsx(GiftsList, { loadingGifts: loadingGifts, weddingListData: weddinglist, onOpenAddGiftModal: () => setIsAddGiftModalOpen(true) })] })) : (_jsxs(_Fragment, { children: [_jsx(Col, { xs: 24, sm: 12, lg: 8, children: _jsxs(Card, { title: "Buscar Listas de Regalos", className: "shadow-md hover:shadow-lg transition-shadow h-full", children: [_jsx("p", { children: "Busca listas de regalos por el nombre de los novios o fecha de la boda." }), _jsx(Button, { type: "primary", className: "mt-2", children: "Buscar Listas" })] }) }), _jsx(Col, { xs: 24, sm: 12, lg: 8, children: _jsx(Card, { title: "Mis Compras Recientes", className: "shadow-md hover:shadow-lg transition-shadow h-full", children: _jsx("p", { children: "No tienes compras recientes." }) }) }), _jsx(Col, { xs: 24, sm: 12, lg: 8, children: _jsxs(Card, { title: "Mi Perfil", className: "shadow-md hover:shadow-lg transition-shadow h-full", children: [_jsx("p", { children: "Actualiza tu informaci\u00F3n personal y preferencias." }), _jsx(Button, { type: "default", className: "mt-2", children: "Editar Perfil" })] }) })] })) }) })) })), _jsx(AddGift, { open: isAddGiftModalOpen, onCancel: () => setIsAddGiftModalOpen(false) })] }));
};
export default ManageRegistry;
