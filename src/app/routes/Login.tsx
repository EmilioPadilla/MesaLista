import React, { useEffect, useState } from 'react';
import { Form, Typography, message, Checkbox } from 'antd';
import { useNavigate } from 'react-router-dom';
import { useLogin, useIsAuthenticated } from 'hooks/useUser';
import { Button } from 'components/core/Button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from 'components/core/Card';
import { Input } from 'components/core/Input';
import { Separator } from 'components/core/Separator';
import { Heart, Mail, Lock, ArrowLeft, Chrome, Facebook, Apple } from 'lucide-react';
import { userService } from 'services/user.service';
// PGPASSWORD=RzXOlCpwkRTxAJbxngQGqtPXogREUuks psql -h maglev.proxy.rlwy.net -U postgres -p 38276 -d railway
const { Title, Text } = Typography;

interface LoginFormValues {
  email: string;
  password: string;
}

const Login: React.FC = () => {
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(false);
  const [isCheckingAuth, setIsCheckingAuth] = useState(true);

  // Use the useIsAuthenticated hook to check authentication status
  const { data: isAuthenticated = false, isLoading: isAuthLoading } = useIsAuthenticated();

  // Check if user is already authenticated and redirect if needed
  useEffect(() => {
    const checkAuthStatus = async () => {
      try {
        if (isAuthenticated) {
          // Get current user to determine where to redirect
          const user = await userService.getCurrentUser();
          if (user?.coupleSlug) {
            navigate(`/${user.coupleSlug}`);
          } else {
            navigate('/');
          }
        }
      } catch (error) {
        console.error('Auth check error:', error);
        // If error, user is not authenticated, so stay on login page
      } finally {
        setIsCheckingAuth(false);
      }
    };

    if (!isAuthLoading) {
      checkAuthStatus();
    }
  }, [navigate, isAuthenticated, isAuthLoading]);

  const { mutate: login, data: loginData, isSuccess: isLoginSuccess, isPending: isLoginPending } = useLogin();

  const onFinish = (values: LoginFormValues) => {
    login(values);
  };

  useEffect(() => {
    if (isLoginPending) {
      setIsLoading(true);
    }
  }, [isLoginPending]);

  useEffect(() => {
    if (isLoginSuccess) {
      navigate(`/${loginData?.coupleSlug}`);
    }
  }, [isLoginSuccess]);

  const handleSocialLogin = (provider: string) => {
    setIsLoading(true);

    // Simulate social login
    setTimeout(() => {
      setIsLoading(false);
      navigate('/home');
    }, 1000);
  };

  // Show loading while checking authentication
  if (isCheckingAuth || isAuthLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-pulse text-primary">Cargando...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-secondary/30 via-background to-accent/20 flex items-center justify-center px-4 py-8">
      {/* Background decorations */}
      <div className="absolute top-10 left-10 w-32 h-32 bg-primary/10 rounded-full blur-3xl"></div>
      <div className="absolute bottom-20 right-20 w-40 h-40 bg-accent/20 rounded-full blur-2xl"></div>

      <div className="w-full max-w-md relative">
        {/* Back button */}
        <Button
          variant="ghost"
          onClick={() => navigate('/')}
          className="mb-6 flex items-center space-x-2 hover:shadow-md transition-all duration-200">
          <ArrowLeft className="h-4 w-4" />
          <span>Volver al inicio</span>
        </Button>

        <Card className="shadow-2xl border-0 bg-card/95 backdrop-blur-sm">
          <CardHeader className="text-center pb-6">
            <div className="flex justify-center mb-4">
              <img src="/svg/MesaLista_isologo.svg" alt="logo" className="h-32 w-32" />
            </div>
            <CardTitle className="text-2xl text-primary">Bienvenido de vuelta</CardTitle>
            <CardDescription>Inicia sesión en tu cuenta de MesaLista</CardDescription>
          </CardHeader>

          <CardContent className="space-y-6">
            {/* Social Login Options */}
            {/* <div className="space-y-3">
              <Button
                variant="outline"
                className="w-full h-12 shadow-md hover:shadow-lg transition-all duration-200 border-primary/20 hover:border-primary/40"
                onClick={() => handleSocialLogin('google')}
                disabled={isLoading}>
                <Chrome className="h-5 w-5 mr-3" />
                Continuar con Google
              </Button>

              <Button
                variant="outline"
                className="w-full h-12 shadow-md hover:shadow-lg transition-all duration-200 border-primary/20 hover:border-primary/40"
                onClick={() => handleSocialLogin('facebook')}
                disabled={isLoading}>
                <Facebook className="h-5 w-5 mr-3 text-blue-600" />
                Continuar con Facebook
              </Button>

              <Button
                variant="outline"
                className="w-full h-12 shadow-md hover:shadow-lg transition-all duration-200 border-primary/20 hover:border-primary/40"
                onClick={() => handleSocialLogin('apple')}
                disabled={isLoading}>
                <Apple className="h-5 w-5 mr-3" />
                Continuar con Apple
              </Button>
            </div>

            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <Separator className="w-full" />
              </div>
              <div className="relative flex justify-center text-xs uppercase">
                <span className="bg-card px-2 text-muted-foreground">O continúa con</span>
              </div>
            </div> */}

            {/* Email/Password Form */}
            <Form onFinish={onFinish} className="space-y-4">
              <div className="space-y-2">
                <label className="!text-base font-semibold" htmlFor="email">
                  Correo Electrónico
                </label>
                <div className="relative">
                  <Mail className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                  <Form.Item name="email" rules={[{ required: true, message: 'Por favor ingresa tu correo electrónico' }]}>
                    <Input id="email" type="email" placeholder="tu@correo.com" className="pl-10 h-12 shadow-sm" />
                  </Form.Item>
                </div>
              </div>

              <div className="space-y-2">
                <label className="!text-base font-semibold" htmlFor="password">
                  Contraseña
                </label>
                <div className="relative">
                  <Lock className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                  <Form.Item name="password" rules={[{ required: true, message: 'Por favor ingresa tu contraseña' }]}>
                    <Input id="password" type="password" placeholder="••••••••" className="pl-10 pr-10 h-12 shadow-sm" />
                  </Form.Item>
                </div>
              </div>

              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <Form.Item name="remember" className="!mb-0" valuePropName="checked">
                    <Checkbox />
                  </Form.Item>
                  <label htmlFor="remember" className="ml-2 !text-base cursor-pointer">
                    Recordarme
                  </label>
                </div>
                <Button variant="link" className="!text-base p-0 h-auto text-primary hover:text-primary/80">
                  ¿Olvidaste tu contraseña?
                </Button>
              </div>

              <Button
                type="submit"
                className="w-full h-12 shadow-lg hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1"
                disabled={isLoading}>
                {isLoading ? 'Iniciando sesión...' : 'Iniciar Sesión'}
              </Button>
            </Form>

            <div className="text-center">
              <p className="!text-base text-muted-foreground">
                ¿No tienes una cuenta?{' '}
                <Button variant="link" className="p-0 h-auto text-primary hover:text-primary/80" onClick={() => navigate('/registro')}>
                  Regístrate aquí
                </Button>
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Footer */}
        <div className="text-center mt-6 text-xs text-muted-foreground">
          <p>Al iniciar sesión, aceptas nuestros</p>
          <div className="space-x-2">
            <Button variant="link" className="p-0 h-auto text-xs">
              Términos de Servicio
            </Button>
            <span>y</span>
            <Button variant="link" className="p-0 h-auto text-xs">
              Política de Privacidad
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Login;
