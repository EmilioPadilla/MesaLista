import { jsx as _jsx, jsxs as _jsxs, Fragment as _Fragment } from "react/jsx-runtime";
import { useState } from 'react';
import { Form, Input, Button, Card, Typography, message, Divider, DatePicker, Radio } from 'antd';
import { UserOutlined, LockOutlined, MailOutlined, PhoneOutlined } from '@ant-design/icons';
import { Link, useNavigate } from 'react-router-dom';
import { userService } from '../../services/user.service';
const { Title, Text } = Typography;
const Signup = () => {
    const [loading, setLoading] = useState(false);
    const [isCouple, setIsCouple] = useState(false);
    const navigate = useNavigate();
    const onFinish = async (values) => {
        setLoading(true);
        try {
            // Remove confirmPassword as it's not needed for the API call
            const { confirmPassword, name, weddingDate, ...restValues } = values;
            // Split name into firstName and lastName
            const nameParts = name.trim().split(' ');
            const firstName = nameParts[0] || '';
            const lastName = nameParts.slice(1).join(' ') || null;
            // Create userData object that matches the Prisma User type
            const userData = {
                ...restValues,
                firstName,
                lastName,
                spouseFirstName: null,
                spouseLastName: null,
                imageUrl: null,
                updatedAt: new Date(),
                phoneNumber: restValues.phoneNumber || null,
            };
            await userService.create(userData);
            message.success('¡Cuenta creada exitosamente! Por favor inicia sesión.');
            // Redirect to login page after successful signup
            navigate('/login');
        }
        catch (error) {
            console.error('Signup error:', error);
            message.error('Error al crear la cuenta. Por favor intenta nuevamente.');
        }
        finally {
            setLoading(false);
        }
    };
    const handleRoleChange = (e) => {
        setIsCouple(e.target.value === 'COUPLE');
    };
    return (_jsx("div", { className: "min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8", children: _jsxs(Card, { className: "w-full max-w-md p-6 shadow-lg rounded-lg", children: [_jsxs("div", { className: "text-center mb-6", children: [_jsx(Title, { level: 2, className: "text-gray-800", children: "Crear una Cuenta" }), _jsx(Text, { className: "text-gray-500", children: "\u00DAnete a MesaLista hoy" })] }), _jsxs(Form, { name: "signup", initialValues: { role: 'GUEST' }, onFinish: onFinish, layout: "vertical", size: "large", children: [_jsx(Form.Item, { name: "role", label: "\u00BFC\u00F3mo deseas registrarte?", rules: [{ required: true, message: '¡Por favor selecciona un rol!' }], children: _jsxs(Radio.Group, { onChange: handleRoleChange, children: [_jsx(Radio, { value: "COUPLE", children: "Pareja de novios" }), _jsx(Radio, { value: "GUEST", children: "Invitado" })] }) }), _jsx(Form.Item, { name: "name", rules: [{ required: true, message: '¡Por favor ingresa tu nombre!' }], children: _jsx(Input, { prefix: _jsx(UserOutlined, { className: "text-gray-400" }), placeholder: "Nombre Completo", className: "rounded-md" }) }), _jsx(Form.Item, { name: "email", rules: [
                                { required: true, message: '¡Por favor ingresa tu correo electrónico!' },
                                { type: 'email', message: '¡Por favor ingresa un correo electrónico válido!' },
                            ], children: _jsx(Input, { prefix: _jsx(MailOutlined, { className: "text-gray-400" }), placeholder: "Correo electr\u00F3nico", className: "rounded-md" }) }), isCouple && (_jsxs(_Fragment, { children: [_jsx(Form.Item, { name: "phoneNumber", rules: [{ required: true, message: '¡Por favor ingresa tu número de teléfono!' }], children: _jsx(Input, { prefix: _jsx(PhoneOutlined, { className: "text-gray-400" }), placeholder: "N\u00FAmero de tel\u00E9fono", className: "rounded-md" }) }), _jsx(Form.Item, { name: "weddingDate", label: "Fecha de la boda", rules: [{ required: true, message: '¡Por favor selecciona la fecha de tu boda!' }], children: _jsx(DatePicker, { className: "w-full rounded-md", placeholder: "Selecciona una fecha", format: "DD/MM/YYYY" }) })] })), _jsx(Form.Item, { name: "password", rules: [
                                { required: true, message: '¡Por favor ingresa tu contraseña!' },
                                { min: 8, message: '¡La contraseña debe tener al menos 8 caracteres!' },
                            ], hasFeedback: true, children: _jsx(Input.Password, { prefix: _jsx(LockOutlined, { className: "text-gray-400" }), placeholder: "Contrase\u00F1a", className: "rounded-md" }) }), _jsx(Form.Item, { name: "confirmPassword", dependencies: ['password'], hasFeedback: true, rules: [
                                { required: true, message: '¡Por favor confirma tu contraseña!' },
                                ({ getFieldValue }) => ({
                                    validator(_, value) {
                                        if (!value || getFieldValue('password') === value) {
                                            return Promise.resolve();
                                        }
                                        return Promise.reject(new Error('¡Las contraseñas no coinciden!'));
                                    },
                                }),
                            ], children: _jsx(Input.Password, { prefix: _jsx(LockOutlined, { className: "text-gray-400" }), placeholder: "Confirmar Contrase\u00F1a", className: "rounded-md" }) }), _jsx(Form.Item, { children: _jsx(Button, { type: "primary", htmlType: "submit", className: "w-full rounded-md", loading: loading, children: "Registrarse" }) })] }), _jsx(Divider, { plain: true, children: "O" }), _jsxs("div", { className: "text-center", children: [_jsx(Text, { className: "text-gray-500", children: "\u00BFYa tienes una cuenta?" }), _jsx(Link, { to: "/login", className: "ml-2 text-blue-600 hover:text-blue-800", children: "Iniciar sesi\u00F3n" })] })] }) }));
};
export default Signup;
