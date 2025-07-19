import { jsx as _jsx, jsxs as _jsxs, Fragment as _Fragment } from "react/jsx-runtime";
import { Table, Card, Statistic, Row, Col, Button, Typography, message, Avatar, Tag, Space, Tooltip } from 'antd';
import { UserOutlined, GiftOutlined, CheckCircleOutlined, MailOutlined } from '@ant-design/icons';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useOutletContext } from 'react-router-dom';
import { giftService } from 'services/gift.service';
const { Title, Paragraph, Text } = Typography;
// Using types from giftService
// Using functions from giftService
const PurchasedGifts = (props) => {
    // Use props if provided directly, otherwise use context from Outlet
    const contextData = useOutletContext();
    // console.log('contextData', contextData);
    const userData = props.userData || contextData?.userData;
    const queryClient = useQueryClient();
    // Fetch purchased gifts from the API
    const { data, isLoading, error } = useQuery({
        queryKey: ['purchasedGifts', userData?.id],
        queryFn: () => giftService.fetchPurchasedGifts(userData?.id),
        enabled: !!userData?.id,
    });
    const purchasedGifts = data?.purchases || [];
    const totalAmount = data?.totalAmount || 0;
    // Mutation for updating purchase status
    const updateStatusMutation = useMutation({
        mutationFn: giftService.updatePurchaseStatus,
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['purchasedGifts', userData?.id] });
            message.success('Estado del regalo actualizado correctamente');
        },
        onError: () => {
            message.error('Error al actualizar el estado del regalo');
        },
    });
    // Calculate statistics
    const pendingCount = purchasedGifts.filter((gift) => gift.status === 'pending').length;
    const deliveredCount = purchasedGifts.filter((gift) => gift.status === 'delivered').length;
    const thankedCount = purchasedGifts.filter((gift) => gift.status === 'thanked').length;
    const handleMarkAsDelivered = (id) => {
        updateStatusMutation.mutate({ purchaseId: id, status: 'DELIVERED' });
    };
    const handleSendThankYou = (id) => {
        updateStatusMutation.mutate({ purchaseId: id, status: 'THANKED' });
    };
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
            title: 'Comprado por',
            dataIndex: 'purchasedBy',
            key: 'purchasedBy',
            render: (purchasedBy) => (_jsxs(Space, { children: [_jsx(Avatar, { icon: _jsx(UserOutlined, {}) }), _jsxs("div", { children: [_jsx("div", { children: purchasedBy.name }), _jsx("div", { className: "text-xs text-gray-500", children: purchasedBy.email })] })] })),
        },
        {
            title: 'Estado',
            dataIndex: 'status',
            key: 'status',
            render: (status) => {
                let color = 'gold';
                let text = 'Pendiente';
                if (status === 'delivered') {
                    color = 'green';
                    text = 'Entregado';
                }
                else if (status === 'thanked') {
                    color = 'blue';
                    text = 'Agradecido';
                }
                return _jsx(Tag, { color: color, children: text });
            },
        },
        {
            title: 'Acciones',
            key: 'actions',
            render: (_, record) => (_jsxs(Space, { size: "middle", children: [record.status !== 'thanked' && (_jsx(Button, { type: "primary", size: "small", icon: _jsx(MailOutlined, {}), disabled: record.status === 'pending', onClick: () => updateStatusMutation.mutate({ purchaseId: record.id, status: 'thanked' }), children: "Agradecer" })), record.status === 'pending' && (_jsx(Tooltip, { title: "Marcar como entregado", children: _jsx(Button, { type: "default", size: "small", icon: _jsx(CheckCircleOutlined, {}), onClick: () => updateStatusMutation.mutate({ purchaseId: record.id, status: 'delivered' }) }) }))] })),
        },
    ];
    const expandedRowRender = (record) => {
        return (_jsxs("div", { className: "p-4", children: [_jsxs("div", { className: "flex items-start mb-4", children: [_jsx(Avatar, { icon: _jsx(UserOutlined, {}), className: "mr-3" }), _jsxs("div", { children: [_jsx(Text, { strong: true, children: record.purchasedBy.name }), _jsx(Text, { type: "secondary", className: "block", children: record.purchasedBy.email })] })] }), _jsx("div", { className: "bg-gray-50 p-4 rounded-lg", children: _jsxs(Text, { italic: true, children: ["\"", record.message, "\""] }) }), _jsxs("div", { className: "mt-4 flex justify-end", children: [record.status === 'pending' && (_jsx(Button, { type: "primary", size: "small", icon: _jsx(CheckCircleOutlined, {}), onClick: () => handleMarkAsDelivered(record.id), children: "Marcar como Entregado" })), record.status === 'delivered' && (_jsx(Button, { type: "primary", size: "small", icon: _jsx(MailOutlined, {}), onClick: () => handleSendThankYou(record.id), children: "Agradecer" }))] })] }));
    };
    return (_jsx("div", { className: "m-6", children: _jsxs("div", { className: "p-6 bg-white rounded-lg shadow", children: [_jsx(Title, { level: 2, children: "Regalos Comprados" }), _jsx(Paragraph, { children: "Aqu\u00ED puedes ver todos los regalos que han sido comprados para tu boda, su estado y enviar agradecimientos." }), isLoading ? (_jsx("div", { className: "flex justify-center items-center h-64", children: _jsx(Typography.Text, { children: "Cargando regalos comprados..." }) })) : error ? (_jsx("div", { className: "flex justify-center items-center h-64", children: _jsx(Typography.Text, { type: "danger", children: "Error al cargar los regalos comprados" }) })) : (_jsxs(_Fragment, { children: [_jsxs(Row, { gutter: 16, className: "mb-6", children: [_jsx(Col, { span: 6, children: _jsx(Card, { children: _jsx(Statistic, { title: "Total Recibido", value: totalAmount, prefix: "$", precision: 2 }) }) }), _jsx(Col, { span: 6, children: _jsx(Card, { children: _jsx(Statistic, { title: "Pendientes", value: pendingCount, valueStyle: { color: '#faad14' }, prefix: _jsx(GiftOutlined, {}) }) }) }), _jsx(Col, { span: 6, children: _jsx(Card, { children: _jsx(Statistic, { title: "Entregados", value: deliveredCount, valueStyle: { color: '#52c41a' }, prefix: _jsx(CheckCircleOutlined, {}) }) }) }), _jsx(Col, { span: 6, children: _jsx(Card, { children: _jsx(Statistic, { title: "Agradecidos", value: thankedCount, valueStyle: { color: '#1890ff' }, prefix: _jsx(MailOutlined, {}) }) }) })] }), _jsx(Table, { dataSource: purchasedGifts, columns: columns, rowKey: "id", expandable: {
                                expandedRowRender,
                                rowExpandable: (record) => !!record.message,
                            }, pagination: { pageSize: 10 } })] }))] }) }));
};
export default PurchasedGifts;
