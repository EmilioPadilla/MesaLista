import React from 'react';
import { Form, Input, Button, Card, Typography, message, Divider } from 'antd';
import { UserOutlined, LockOutlined } from '@ant-design/icons';
import { Link, useNavigate } from 'react-router-dom';
import { userService } from '../api/userService';
import type { LoginResponse } from '../api/userService';
import { useMutation } from '@tanstack/react-query';

const { Title, Text } = Typography;

interface LoginFormValues {
  email: string;
  password: string;
}

const Login: React.FC = () => {
  const navigate = useNavigate();

  const loginMutation = useMutation<LoginResponse, Error, LoginFormValues>({ 
    mutationFn: (values) => userService.login(values.email, values.password),
    onSuccess: (response) => {
      // Token is automatically stored in localStorage by the userService
      message.success(`¡Bienvenido de nuevo, ${response.name || response.email}!`);
      
      // Redirect to dashboard after successful login
      navigate('/dashboard');
    },
    onError: (error) => {
      console.error('Login error:', error);
      message.error('Error al iniciar sesión. Por favor verifica tus credenciales.');
    }
  });

  const onFinish = (values: LoginFormValues) => {
    loginMutation.mutate(values);
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <Card className="w-full max-w-md p-6 shadow-lg rounded-lg">
        <div className="text-center mb-6">
          <Title level={2} className="text-gray-800">Bienvenido a RegalAmor</Title>
          <Text className="text-gray-500">Inicia sesión en tu cuenta</Text>
        </div>
        
        <Form
          name="login"
          initialValues={{ remember: true }}
          onFinish={onFinish}
          layout="vertical"
          size="large"
        >
          <Form.Item
            name="email"
            rules={[
              { required: true, message: '¡Por favor ingresa tu correo electrónico!' },
              { type: 'email', message: '¡Por favor ingresa un correo electrónico válido!' }
            ]}
          >
            <Input 
              prefix={<UserOutlined className="text-gray-400" />} 
              placeholder="Correo electrónico" 
              className="rounded-md"
            />
          </Form.Item>

          <Form.Item
            name="password"
            rules={[{ required: true, message: '¡Por favor ingresa tu contraseña!' }]}
          >
            <Input.Password
              prefix={<LockOutlined className="text-gray-400" />}
              placeholder="Contraseña"
              className="rounded-md"
            />
          </Form.Item>

          <Form.Item>
            <Button 
              type="primary" 
              htmlType="submit" 
              className="w-full rounded-md" 
              loading={loginMutation.isPending}
            >
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
