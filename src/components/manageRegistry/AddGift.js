import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { Button, Form, Input, InputNumber, Modal, Upload, Typography, Checkbox } from 'antd';
import { LoadingOutlined, PlusOutlined } from '@ant-design/icons';
import { useState } from 'react';
import { useCreateGift } from 'hooks/useGift';
const { Text } = Typography;
export const AddGift = ({ open, onCancel }) => {
    const [imageUrl, setImageUrl] = useState();
    const [loading, setLoading] = useState(false);
    const [isDragging, setIsDragging] = useState(false);
    const { mutate: createGift } = useCreateGift();
    const handleFinish = (values) => {
        const newGift = {
            ...values,
            imageUrl,
            isPurchased: false,
        };
        console.log('New gift:', newGift);
        createGift(newGift);
        onCancel();
    };
    const uploadButton = (_jsxs("span", { onDragEnter: () => setIsDragging(true), onDragLeave: () => setIsDragging(false), className: `flex flex-col h-64 w-full px-3 items-center justify-center border border-dashed rounded-md ${isDragging ? 'border-orange' : ''}`, children: [loading ? _jsx(LoadingOutlined, {}) : _jsx(PlusOutlined, { className: "text-xl" }), _jsx("div", { className: "mt-2 flex text-center", children: "Da click o arrastra para subir una imagen" })] }));
    const onDropImage = (e) => {
        setLoading(true);
        e.preventDefault();
        setIsDragging(false);
        const files = e.dataTransfer.files;
        if (files.length > 0) {
            const file = files[0];
            const reader = new FileReader();
            reader.onload = (e) => {
                const result = e.target?.result;
                setImageUrl(result);
                setLoading(false);
            };
            reader.readAsDataURL(file);
        }
    };
    const onFileChange = (info) => {
        const file = info.file;
        console.log('file', file);
        if (!file)
            return;
        setLoading(true);
        const reader = new FileReader();
        reader.onload = (e) => {
            const result = e.target?.result;
            setImageUrl(result);
            setLoading(false);
        };
        // reader.readAsDataURL(file);
    };
    return (_jsx(Modal, { title: "Agregar Regalo", open: open, onCancel: onCancel, footer: null, width: 700, children: _jsxs(Form, { onFinish: handleFinish, layout: "vertical", initialValues: {
                title: '',
                price: 0,
                quantity: 1,
                isMostWanted: false,
                description: '',
            }, children: [_jsxs("div", { className: "flex gap-6", children: [_jsx("div", { className: "w-1/3", children: _jsx("div", { onDragEnter: () => setIsDragging(true), onDragLeave: () => setIsDragging(false), className: `bg-gray-100 flex flex-col items-center justify-center h-64 ${isDragging ? 'border-orange' : ''}`, children: imageUrl ? (_jsx("img", { src: imageUrl, alt: "Gift", className: "max-h-full max-w-full object-contain" })) : (_jsx(Upload, { showUploadList: false, onDrop: onDropImage, onChange: onFileChange, beforeUpload: () => false, accept: "image/*", children: imageUrl ? _jsx("img", { src: imageUrl, alt: "avatar", style: { width: '100%' } }) : uploadButton })) }) }), _jsxs("div", { className: "w-2/3", children: [_jsx(Form.Item, { name: "title", label: "T\u00EDtulo", rules: [{ required: true, message: 'Por favor ingresa el título del regalo' }], children: _jsx(Input, {}) }), _jsxs("div", { className: "flex gap-4", children: [_jsx(Form.Item, { name: "price", label: "Precio ($)", className: "w-1/2", rules: [{ required: true, message: 'Por favor ingresa el precio del regalo' }], children: _jsx(InputNumber, { className: "w-full" }) }), _jsx(Form.Item, { name: "quantity", label: "Cantidad", className: "w-1/2", rules: [{ required: true, message: 'Por favor ingresa la cantidad' }], children: _jsx(InputNumber, { className: "w-full", min: 1 }) })] }), _jsxs("div", { className: "mb-4", children: [_jsx(Form.Item, { name: "isMostWanted", valuePropName: "checked", children: _jsx(Checkbox, { children: "M\u00E1s Deseado" }) }), _jsx("div", { className: "text-gray-500 text-sm", children: "\u00A1Deja que tus invitados sepan cu\u00E1les son tus regalos imprescindibles!" })] }), _jsx(Form.Item, { name: "description", label: "Descripci\u00F3n del art\u00EDculo", children: _jsx(Input.TextArea, { placeholder: "Opcional: Describe el art\u00EDculo, qu\u00E9 har\u00E1s con \u00E9l o por qu\u00E9 lo quieres. \u00A1Divi\u00E9rtete con esto!", rows: 4 }) })] })] }), _jsxs("div", { className: "flex justify-end mt-6 gap-2", children: [_jsx(Button, { onClick: onCancel, children: "Cancelar" }), _jsx(Button, { type: "primary", htmlType: "submit", children: "Agregar Regalo" })] })] }) }));
};
