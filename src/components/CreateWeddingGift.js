import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { Modal, Input, InputNumber, Select, Button, Upload } from 'antd';
import { Form } from 'antd';
import { useState } from 'react';
export const CreateWeddingGift = ({ isModalVisible, setIsModalVisible }) => {
    const { Option } = Select;
    const [form] = Form.useForm();
    const [loading, setLoading] = useState(false);
    const handleSubmit = (values) => {
        console.log('New gift:', values);
        // In a real implementation, this would send a POST request to the API
        setIsModalVisible(false);
        form.resetFields();
        setLoading(false);
    };
    const handleCancel = () => {
        setIsModalVisible(false);
        form.resetFields();
    };
    return (_jsx(Modal, { title: "Agregar Nuevo Regalo", open: isModalVisible, onCancel: handleCancel, footer: null, children: _jsxs(Form, { form: form, layout: "vertical", onFinish: handleSubmit, children: [_jsx(Form.Item, { name: "name", label: "Nombre del Regalo", rules: [{ required: true, message: 'Por favor ingresa el nombre del regalo' }], children: _jsx(Input, {}) }), _jsx(Form.Item, { name: "description", label: "Descripci\u00F3n", rules: [{ required: true, message: 'Por favor ingresa una descripción' }], children: _jsx(Input.TextArea, { rows: 3 }) }), _jsx(Form.Item, { name: "price", label: "Precio", rules: [{ required: true, message: 'Por favor ingresa el precio' }], children: _jsx(InputNumber, { formatter: (value) => `$ ${value}`.replace(/\B(?=(\d{3})+(?!\d))/g, ','), parser: (value) => value.replace(/\$\s?|(,*)/g, ''), style: { width: '100%' } }) }), _jsx(Form.Item, { name: "category", label: "Categor\u00EDa", rules: [{ required: true, message: 'Por favor selecciona una categoría' }], children: _jsxs(Select, { placeholder: "Selecciona una categor\u00EDa", children: [_jsx(Option, { value: "Cocina", children: "Cocina" }), _jsx(Option, { value: "Electrodom\u00E9sticos", children: "Electrodom\u00E9sticos" }), _jsx(Option, { value: "Dormitorio", children: "Dormitorio" }), _jsx(Option, { value: "Ba\u00F1o", children: "Ba\u00F1o" }), _jsx(Option, { value: "Decoraci\u00F3n", children: "Decoraci\u00F3n" }), _jsx(Option, { value: "Otros", children: "Otros" })] }) }), _jsx(Form.Item, { name: "imageUrl", label: "URL de la Imagen (opcional)", children: _jsx(Upload.Dragger, { onChange: () => setLoading(true), children: _jsx("div", { className: "h-10 flex items-center justify-center", children: "Click or drag file to this area to upload" }) }) }), _jsx(Form.Item, { children: _jsxs("div", { className: "flex justify-end", children: [_jsx(Button, { onClick: handleCancel, style: { marginRight: 8 }, children: "Cancelar" }), _jsx(Button, { type: "primary", htmlType: "submit", children: "Guardar" })] }) })] }) }));
};
