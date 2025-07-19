import { jsx as _jsx, jsxs as _jsxs, Fragment as _Fragment } from "react/jsx-runtime";
import { Typography, Table, Card, Row, Col, Tag, Space, Avatar, Tooltip, Empty, Spin, Button, Statistic } from 'antd';
import { ShoppingOutlined, GiftOutlined, UserOutlined, CheckCircleOutlined } from '@ant-design/icons';
import { useQuery } from '@tanstack/react-query';
import { useOutletContext } from 'react-router-dom';
import { giftService } from '../services/gift.service';
const { Title, Paragraph, Text } = Typography;
const MyPurchases = (props) => {
    // Use props if provided directly, otherwise use context from Outlet
    const contextData = useOutletContext();
    const userData = props.userData || contextData?.userData;
    // Fetch user's purchases
    const { data, isLoading, error } = useQuery({
        queryKey: ['userPurchases', userData?.id],
        queryFn: () => giftService.getUserPurchases(userData?.id),
        enabled: !!userData?.id,
    });
    const userPurchases = data?.purchases || [];
    const totalSpent = data?.totalAmount || 0;
    // Calculate statistics
    // Only using thankedCount in UI, but calculating others for future use
    const thankedCount = userPurchases.filter((gift) => gift.status === 'thanked').length;
    const columns = [
        {
            title: 'Regalo',
            dataIndex: 'giftName',
            key: 'giftName',
        },
        {
            title: 'Precio',
            dataIndex: 'price',
            key: 'price',
            render: (price) => `$${price.toFixed(2)}`,
        },
        {
            title: 'Fecha de Compra',
            dataIndex: 'purchaseDate',
            key: 'purchaseDate',
            render: (date) => new Date(date).toLocaleDateString('es-MX'),
        },
        {
            title: 'Para',
            dataIndex: 'purchasedFor',
            key: 'purchasedFor',
            render: () => (_jsxs(Space, { children: [_jsx(Avatar, { icon: _jsx(UserOutlined, {}) }), _jsx(Text, { children: "Pareja" })] })),
        },
        {
            title: 'Estado',
            dataIndex: 'status',
            key: 'status',
            render: (status) => {
                let color = 'gold';
                let text = 'Pendiente';
                let icon = _jsx(GiftOutlined, {});
                if (status === 'delivered') {
                    color = 'green';
                    text = 'Entregado';
                    icon = _jsx(CheckCircleOutlined, {});
                }
                else if (status === 'thanked') {
                    color = 'blue';
                    text = 'Agradecido';
                    icon = _jsx(CheckCircleOutlined, {});
                }
                return (_jsx(Tooltip, { title: getStatusDescription(status), children: _jsx(Tag, { color: color, icon: icon, children: text }) }));
            },
        },
    ];
    // Helper function to get status description
    const getStatusDescription = (status) => {
        switch (status) {
            case 'pending':
                return 'Tu regalo está pendiente de entrega';
            case 'delivered':
                return 'Tu regalo ha sido entregado a la pareja';
            case 'thanked':
                return 'La pareja te ha enviado un agradecimiento';
            default:
                return '';
        }
    };
    // Expanded row to show the message sent with the gift
    const expandedRowRender = (record) => {
        return (_jsx("div", { className: "p-4", children: _jsxs("div", { className: "bg-gray-50 p-4 rounded-lg", children: [_jsx(Title, { level: 5, className: "mb-2", children: "Tu mensaje:" }), _jsxs(Text, { italic: true, children: ["\"", record.message, "\""] })] }) }));
    };
    return (_jsx("div", { className: "m-6", children: _jsxs("div", { className: "p-6 bg-white rounded-lg shadow", children: [_jsxs("div", { className: "mb-6", children: [_jsx(Title, { level: 2, children: "Mis Compras" }), _jsx(Paragraph, { children: "Aqu\u00ED puedes ver todos los regalos que has comprado para bodas y su estado actual." })] }), isLoading ? (_jsx("div", { className: "flex justify-center items-center h-64", children: _jsx(Spin, { size: "large" }) })) : error ? (_jsx("div", { className: "flex justify-center items-center h-64", children: _jsx(Typography.Text, { type: "danger", children: "Error al cargar tus compras" }) })) : userPurchases.length === 0 ? (_jsx(Empty, { image: Empty.PRESENTED_IMAGE_SIMPLE, description: _jsx(Text, { children: "A\u00FAn no has realizado ninguna compra" }), children: _jsx(Button, { type: "primary", onClick: () => (window.location.href = '/dashboard/gift-lists'), children: "Explorar Listas de Regalos" }) })) : (_jsxs(_Fragment, { children: [_jsxs(Row, { gutter: 16, className: "mb-6", children: [_jsx(Col, { span: 8, children: _jsx(Card, { children: _jsx(Statistic, { title: "Total Gastado", value: totalSpent, prefix: "$", precision: 2, valueStyle: { color: '#1890ff' } }) }) }), _jsx(Col, { span: 8, children: _jsx(Card, { children: _jsx(Statistic, { title: "Regalos Comprados", value: userPurchases.length, prefix: _jsx(ShoppingOutlined, {}), valueStyle: { color: '#52c41a' } }) }) }), _jsx(Col, { span: 8, children: _jsx(Card, { children: _jsx(Statistic, { title: "Agradecimientos Recibidos", value: thankedCount, prefix: _jsx(GiftOutlined, {}), valueStyle: { color: '#722ed1' } }) }) })] }), _jsx(Table
                        // @ts-ignore
                        , { 
                            // @ts-ignore
                            dataSource: userPurchases, columns: columns, rowKey: "id", expandable: {
                                expandedRowRender,
                                // @ts-ignore
                                rowExpandable: (record) => !!record.message,
                            }, pagination: { pageSize: 10 } })] }))] }) }));
};
export default MyPurchases;
