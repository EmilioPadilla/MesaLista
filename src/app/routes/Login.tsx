import React, { useEffect } from 'react';
import { Form, Input, Button, Card, Typography, message, Divider } from 'antd';
import { UserOutlined, LockOutlined } from '@ant-design/icons';
import { Link, useNavigate } from 'react-router-dom';
import { useLogin } from 'hooks/useUser';

const { Title, Text } = Typography;

interface LoginFormValues {
  email: string;
  password: string;
}

const Login: React.FC = () => {
  const navigate = useNavigate();

  const { mutate: login, data: loginData, isSuccess: isLoginSuccess, isPending: isLoginPending } = useLogin();

  const onFinish = (values: LoginFormValues) => {
    login(values);
  };

  useEffect(() => {
    if (isLoginSuccess) {
      message.success(`¡Bienvenido de nuevo, ${loginData?.name || loginData?.email}!`);
      navigate('/dashboard');
    }
  }, [isLoginSuccess]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <Card className="w-full max-w-md p-6 shadow-lg rounded-lg">
        <div className="text-center mb-6">
          <Title level={2} className="text-gray-800">
            Bienvenido a MesaLista
          </Title>
          <Text className="text-gray-500">Inicia sesión en tu cuenta</Text>
        </div>

        <Form name="login" initialValues={{ remember: true }} onFinish={onFinish} layout="vertical" size="large">
          <Form.Item
            name="email"
            rules={[
              { required: true, message: '¡Por favor ingresa tu correo electrónico!' },
              { type: 'email', message: '¡Por favor ingresa un correo electrónico válido!' },
            ]}>
            <Input prefix={<UserOutlined className="text-gray-400" />} placeholder="Correo electrónico" className="rounded-md" />
          </Form.Item>

          <Form.Item name="password" rules={[{ required: true, message: '¡Por favor ingresa tu contraseña!' }]}>
            <Input.Password prefix={<LockOutlined className="text-gray-400" />} placeholder="Contraseña" className="rounded-md" />
          </Form.Item>

          <Form.Item>
            <Button type="primary" htmlType="submit" className="w-full rounded-md" loading={isLoginPending}>
              Iniciar Sesión
            </Button>
          </Form.Item>
        </Form>

        <Divider plain>O</Divider>

        <div className="text-center">
          <Text className="text-gray-500">¿No tienes una cuenta?</Text>
          <Link to="/signup" className="ml-2 text-blue-600 hover:text-blue-800">
            Regístrate ahora
          </Link>
        </div>
      </Card>
    </div>
  );
};

export default Login;
