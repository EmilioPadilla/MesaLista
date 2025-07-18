import React, { useState } from 'react';
import { Form, Input, Button, Card, Typography, message, Divider, DatePicker, Radio, Select } from 'antd';
import { UserOutlined, LockOutlined, MailOutlined, PhoneOutlined, CalendarOutlined } from '@ant-design/icons';
import { Link, useNavigate } from 'react-router-dom';
import { userService } from '../../services/user.service';

const { Title, Text } = Typography;

interface SignupFormValues {
  name: string;
  email: string;
  password: string;
  confirmPassword: string;
  phoneNumber?: string;
  weddingDate?: string;
  role: 'COUPLE' | 'GUEST';
}

const Signup: React.FC = () => {
  const [loading, setLoading] = useState(false);
  const [isCouple, setIsCouple] = useState(false);
  const navigate = useNavigate();

  const onFinish = async (values: SignupFormValues) => {
    setLoading(true);
    try {
      // Remove confirmPassword as it's not needed for the API call
      const { confirmPassword, ...userData } = values;

      // Format wedding date if provided
      if (userData.weddingDate) {
        userData.weddingDate = new Date(userData.weddingDate).toISOString();
      }

      await userService.create(userData);
      message.success('¡Cuenta creada exitosamente! Por favor inicia sesión.');

      // Redirect to login page after successful signup
      navigate('/login');
    } catch (error) {
      console.error('Signup error:', error);
      message.error('Error al crear la cuenta. Por favor intenta nuevamente.');
    } finally {
      setLoading(false);
    }
  };

  const handleRoleChange = (e: any) => {
    setIsCouple(e.target.value === 'COUPLE');
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <Card className="w-full max-w-md p-6 shadow-lg rounded-lg">
        <div className="text-center mb-6">
          <Title level={2} className="text-gray-800">
            Crear una Cuenta
          </Title>
          <Text className="text-gray-500">Únete a MesaLista hoy</Text>
        </div>

        <Form name="signup" initialValues={{ role: 'GUEST' }} onFinish={onFinish} layout="vertical" size="large">
          <Form.Item name="role" label="¿Cómo deseas registrarte?" rules={[{ required: true, message: '¡Por favor selecciona un rol!' }]}>
            <Radio.Group onChange={handleRoleChange}>
              <Radio value="COUPLE">Pareja de novios</Radio>
              <Radio value="GUEST">Invitado</Radio>
            </Radio.Group>
          </Form.Item>

          <Form.Item name="name" rules={[{ required: true, message: '¡Por favor ingresa tu nombre!' }]}>
            <Input prefix={<UserOutlined className="text-gray-400" />} placeholder="Nombre Completo" className="rounded-md" />
          </Form.Item>

          <Form.Item
            name="email"
            rules={[
              { required: true, message: '¡Por favor ingresa tu correo electrónico!' },
              { type: 'email', message: '¡Por favor ingresa un correo electrónico válido!' },
            ]}>
            <Input prefix={<MailOutlined className="text-gray-400" />} placeholder="Correo electrónico" className="rounded-md" />
          </Form.Item>

          {isCouple && (
            <>
              <Form.Item name="phoneNumber" rules={[{ required: true, message: '¡Por favor ingresa tu número de teléfono!' }]}>
                <Input prefix={<PhoneOutlined className="text-gray-400" />} placeholder="Número de teléfono" className="rounded-md" />
              </Form.Item>

              <Form.Item
                name="weddingDate"
                label="Fecha de la boda"
                rules={[{ required: true, message: '¡Por favor selecciona la fecha de tu boda!' }]}>
                <DatePicker className="w-full rounded-md" placeholder="Selecciona una fecha" format="DD/MM/YYYY" />
              </Form.Item>
            </>
          )}

          <Form.Item
            name="password"
            rules={[
              { required: true, message: '¡Por favor ingresa tu contraseña!' },
              { min: 8, message: '¡La contraseña debe tener al menos 8 caracteres!' },
            ]}
            hasFeedback>
            <Input.Password prefix={<LockOutlined className="text-gray-400" />} placeholder="Contraseña" className="rounded-md" />
          </Form.Item>

          <Form.Item
            name="confirmPassword"
            dependencies={['password']}
            hasFeedback
            rules={[
              { required: true, message: '¡Por favor confirma tu contraseña!' },
              ({ getFieldValue }) => ({
                validator(_, value) {
                  if (!value || getFieldValue('password') === value) {
                    return Promise.resolve();
                  }
                  return Promise.reject(new Error('¡Las contraseñas no coinciden!'));
                },
              }),
            ]}>
            <Input.Password prefix={<LockOutlined className="text-gray-400" />} placeholder="Confirmar Contraseña" className="rounded-md" />
          </Form.Item>

          <Form.Item>
            <Button type="primary" htmlType="submit" className="w-full rounded-md" loading={loading}>
              Registrarse
            </Button>
          </Form.Item>
        </Form>

        <Divider plain>O</Divider>

        <div className="text-center">
          <Text className="text-gray-500">¿Ya tienes una cuenta?</Text>
          <Link to="/login" className="ml-2 text-blue-600 hover:text-blue-800">
            Iniciar sesión
          </Link>
        </div>
      </Card>
    </div>
  );
};

export default Signup;
