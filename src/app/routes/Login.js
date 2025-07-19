import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useEffect } from 'react';
import { Form, Input, Button, Card, Typography, message, Divider } from 'antd';
import { UserOutlined, LockOutlined } from '@ant-design/icons';
import { Link, useNavigate } from 'react-router-dom';
import { useLogin } from 'hooks/useUser';
const { Title, Text } = Typography;
const Login = () => {
    const navigate = useNavigate();
    const { mutate: login, data: loginData, isSuccess: isLoginSuccess, isPending: isLoginPending } = useLogin();
    const onFinish = (values) => {
        login(values);
    };
    useEffect(() => {
        if (isLoginSuccess) {
            message.success(`¡Bienvenido de nuevo, ${loginData?.name || loginData?.email}!`);
            navigate('/dashboard');
        }
    }, [isLoginSuccess]);
    return (_jsx("div", { className: "min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8", children: _jsxs(Card, { className: "w-full max-w-md p-6 shadow-lg rounded-lg", children: [_jsxs("div", { className: "text-center mb-6", children: [_jsx(Title, { level: 2, className: "text-gray-800", children: "Bienvenido a MesaLista" }), _jsx(Text, { className: "text-gray-500", children: "Inicia sesi\u00F3n en tu cuenta" })] }), _jsxs(Form, { name: "login", initialValues: { remember: true }, onFinish: onFinish, layout: "vertical", size: "large", children: [_jsx(Form.Item, { name: "email", rules: [
                                { required: true, message: '¡Por favor ingresa tu correo electrónico!' },
                                { type: 'email', message: '¡Por favor ingresa un correo electrónico válido!' },
                            ], children: _jsx(Input, { prefix: _jsx(UserOutlined, { className: "text-gray-400" }), placeholder: "Correo electr\u00F3nico", className: "rounded-md" }) }), _jsx(Form.Item, { name: "password", rules: [{ required: true, message: '¡Por favor ingresa tu contraseña!' }], children: _jsx(Input.Password, { prefix: _jsx(LockOutlined, { className: "text-gray-400" }), placeholder: "Contrase\u00F1a", className: "rounded-md" }) }), _jsx(Form.Item, { children: _jsx(Button, { type: "primary", htmlType: "submit", className: "w-full rounded-md", loading: isLoginPending, children: "Iniciar Sesi\u00F3n" }) })] }), _jsx(Divider, { plain: true, children: "O" }), _jsxs("div", { className: "text-center", children: [_jsx(Text, { className: "text-gray-500", children: "\u00BFNo tienes una cuenta?" }), _jsx(Link, { to: "/signup", className: "ml-2 text-blue-600 hover:text-blue-800", children: "Reg\u00EDstrate ahora" })] })] }) }));
};
export default Login;
