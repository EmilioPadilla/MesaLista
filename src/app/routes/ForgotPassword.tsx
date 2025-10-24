import React, { useState } from 'react';
import { Form, message } from 'antd';
import { useNavigate } from 'react-router-dom';
import { Button } from 'components/core/Button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from 'components/core/Card';
import { Input } from 'components/core/Input';
import { ArrowLeft, Mail, CheckCircle } from 'lucide-react';
import { userService } from 'services/user.service';

interface ForgotPasswordFormValues {
  email: string;
}

export function ForgotPassword() {
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(false);
  const [emailSent, setEmailSent] = useState(false);
  const [form] = Form.useForm();

  const onFinish = async (values: ForgotPasswordFormValues) => {
    setIsLoading(true);
    try {
      await userService.requestPasswordReset(values.email);
      setEmailSent(true);
      message.success('Si el correo existe, recibirás un enlace para restablecer tu contraseña');
    } catch (error) {
      console.error('Error requesting password reset:', error);
      // Still show success message to prevent email enumeration
      setEmailSent(true);
      message.success('Si el correo existe, recibirás un enlace para restablecer tu contraseña');
    } finally {
      setIsLoading(false);
    }
  };

  if (emailSent) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-secondary/30 via-background to-accent/20 flex items-center justify-center px-4 py-8">
        {/* Background decorations */}
        <div className="absolute top-10 left-10 w-32 h-32 bg-primary/10 rounded-full blur-3xl"></div>
        <div className="absolute bottom-20 right-20 w-40 h-40 bg-accent/20 rounded-full blur-2xl"></div>

        <div className="w-full max-w-md relative z-10">
          {/* Back button */}
          <Button variant="ghost" className="mb-4" onClick={() => navigate('/login')}>
            <ArrowLeft className="mr-2 h-4 w-4" />
            Volver al inicio de sesión
          </Button>

          <Card className="border-2 shadow-2xl backdrop-blur-sm bg-card/95">
            <CardHeader className="text-center space-y-4 pb-8">
              <div className="mx-auto w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mb-4">
                <CheckCircle className="h-8 w-8 text-green-600" />
              </div>
              <CardTitle className="text-3xl">Correo Enviado</CardTitle>
              <CardDescription className="text-base">
                Revisa tu bandeja de entrada y sigue las instrucciones para restablecer tu contraseña
              </CardDescription>
            </CardHeader>

            <CardContent className="space-y-6">
              <div className="bg-muted/50 p-4 rounded-lg border border-border/50">
                <p className="text-sm text-muted-foreground text-center">
                  Si no recibes el correo en unos minutos, revisa tu carpeta de spam o intenta nuevamente.
                </p>
              </div>

              <div className="space-y-3">
                <Button
                  className="w-full h-12"
                  onClick={() => {
                    setEmailSent(false);
                    form.resetFields();
                  }}>
                  Enviar otro correo
                </Button>
                <Button variant="outline" className="w-full h-12" onClick={() => navigate('/login')}>
                  Volver al inicio de sesión
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Footer */}
          <div className="text-center mt-6 text-xs text-muted-foreground">
            <p>¿Necesitas ayuda? Contáctanos en info@mesalista.com.mx</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-secondary/30 via-background to-accent/20 flex items-center justify-center px-4 py-8">
      {/* Background decorations */}
      <div className="absolute top-10 left-10 w-32 h-32 bg-primary/10 rounded-full blur-3xl"></div>
      <div className="absolute bottom-20 right-20 w-40 h-40 bg-accent/20 rounded-full blur-2xl"></div>

      <div className="w-full max-w-md relative z-10">
        {/* Back button */}
        <Button variant="ghost" className="mb-4" onClick={() => navigate('/login')}>
          <ArrowLeft className="mr-2 h-4 w-4" />
          Volver al inicio de sesión
        </Button>

        <Card className="border-2 shadow-2xl backdrop-blur-sm bg-card/95">
          <CardHeader className="text-center space-y-4 pb-8">
            <div className="mx-auto w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mb-4">
              <Mail className="h-8 w-8 text-primary" />
            </div>
            <CardTitle className="text-3xl">¿Olvidaste tu contraseña?</CardTitle>
            <CardDescription className="text-base">
              Ingresa tu correo electrónico y te enviaremos un enlace para restablecer tu contraseña
            </CardDescription>
          </CardHeader>

          <CardContent>
            <Form form={form} name="forgot-password" onFinish={onFinish} layout="vertical" className="space-y-6">
              <div className="space-y-2">
                <label className="!text-base font-semibold" htmlFor="email">
                  Correo Electrónico
                </label>
                <div className="relative">
                  <Mail className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                  <Form.Item
                    name="email"
                    rules={[
                      { required: true, message: 'Por favor ingresa tu correo electrónico' },
                      { type: 'email', message: 'Por favor ingresa un correo válido' },
                    ]}>
                    <Input id="email" type="email" placeholder="tu@email.com" className="pl-10 h-12 shadow-sm" />
                  </Form.Item>
                </div>
              </div>

              <Button
                type="submit"
                className="w-full h-12 shadow-lg hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1"
                disabled={isLoading}>
                {isLoading ? 'Enviando...' : 'Enviar enlace de restablecimiento'}
              </Button>
            </Form>

            <div className="mt-6 text-center">
              <p className="!text-sm text-muted-foreground">
                ¿Recordaste tu contraseña?{' '}
                <Button variant="link" className="p-0 h-auto text-primary hover:text-primary/80" onClick={() => navigate('/login')}>
                  Inicia sesión aquí
                </Button>
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Footer */}
        <div className="text-center mt-6 text-xs text-muted-foreground">
          <p>Al usar MesaLista, aceptas nuestros</p>
          <div className="space-x-2">
            <a
              href="https://pub-659df55516a64947b3e528a4322c71ac.r2.dev/documents/Te%CC%81rminos%20y%20Condiciones%20MesaLista%20Mx.pdf"
              target="_blank"
              className="p-0 h-auto text-xs text-primary hover:text-primary/50">
              Términos y Condiciones
            </a>
            <span>y</span>
            <a
              href="https://pub-659df55516a64947b3e528a4322c71ac.r2.dev/documents/Aviso%20de%20Privacidad%20MesaLista%20Mx.pdf"
              target="_blank"
              className="p-0 h-auto text-xs text-primary hover:text-primary/50">
              Política de Privacidad
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}
