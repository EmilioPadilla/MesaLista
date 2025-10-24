import React, { useEffect, useState } from 'react';
import { Form, message, Input, Button } from 'antd';
import { useNavigate } from 'react-router-dom';
import { useLogin, useIsAuthenticated } from 'hooks/useUser';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from 'components/core/Card';
import { ArrowLeft } from 'lucide-react';
import { userService } from 'services/user.service';
import { useTrackEvent } from 'hooks/useAnalyticsTracking';

interface LoginFormValues {
  email: string;
  password: string;
}

const Login: React.FC = () => {
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(false);
  const [isCheckingAuth, setIsCheckingAuth] = useState(true);
  const trackEvent = useTrackEvent();

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

  const {
    mutate: login,
    data: loginData,
    isSuccess: isLoginSuccess,
    isPending: isLoginPending,
    isError: isLoginError,
    error: loginError,
  } = useLogin();

  const onFinish = (values: LoginFormValues) => {
    login(values, {
      onSuccess: () => {
        // Track successful sign-in
        trackEvent('SIGN_IN');
      },
    });
  };

  useEffect(() => {
    if (isLoginPending) {
      setIsLoading(true);
    } else {
      setIsLoading(false);
    }
  }, [isLoginPending]);

  useEffect(() => {
    if (isLoginError && loginError) {
      const errorResponse = (loginError as any)?.response?.data;
      const errorMessage = errorResponse?.error || 'Error al iniciar sesión. Por favor verifica tus credenciales.';
      const attemptsRemaining = errorResponse?.attemptsRemaining;
      const lockedUntil = errorResponse?.lockedUntil;

      // Display the main error message
      message.error(errorMessage);

      // If there are remaining attempts, show additional info
      if (attemptsRemaining !== undefined && attemptsRemaining > 0) {
        message.warning(`Te quedan ${attemptsRemaining} ${attemptsRemaining === 1 ? 'intento' : 'intentos'}`);
      }

      // If account is locked, show lockout info
      if (lockedUntil) {
        const unlockTime = new Date(lockedUntil);
        const minutesRemaining = Math.ceil((unlockTime.getTime() - Date.now()) / 60000);
        message.error(`Tu cuenta está bloqueada por ${minutesRemaining} ${minutesRemaining === 1 ? 'minuto' : 'minutos'} más`, 10);
      }

      setIsLoading(false);
    }
  }, [isLoginError, loginError]);

  useEffect(() => {
    if (isLoginSuccess) {
      navigate(`/${loginData?.coupleSlug}`);
    }
  }, [isLoginSuccess]);

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
          type="link"
          onClick={() => navigate('/')}
          className="mb-6 flex items-center space-x-2 hover:shadow-md transition-all duration-200">
          <ArrowLeft className="h-4 w-4" />
          <span>Volver al inicio</span>
        </Button>

        <Card className="shadow-2xl border-0 bg-card/95 backdrop-blur-sm">
          <CardHeader className="text-center pb-6">
            <div className="flex justify-center mb-4">
              <img src="/svg/MesaLista_isologo.svg" alt="logo" className="h-22 w-32" />
            </div>
            <CardTitle className="text-2xl text-primary">Bienvenido de vuelta</CardTitle>
            <CardDescription>Inicia sesión en tu cuenta de MesaLista</CardDescription>
          </CardHeader>

          <CardContent className="space-y-6">
            {/* Email/Password Form */}
            <Form layout="vertical" onFinish={onFinish} className="space-y-4">
              <div className="space-y-2">
                <Form.Item
                  label="Correo Electrónico"
                  name="email"
                  rules={[{ required: true, message: 'Por favor ingresa tu correo electrónico' }]}>
                  <Input size="large" id="email" type="email" placeholder="tu@correo.com" className="pl-10 h-12 shadow-sm" />
                </Form.Item>
              </div>

              <div className="space-y-2">
                <Form.Item name="password" label="Contraseña" rules={[{ required: true, message: 'Por favor ingresa tu contraseña' }]}>
                  <Input.Password size="large" id="password" placeholder="••••••••" className="shadow-sm" />
                </Form.Item>
              </div>

              <div className="flex items-center justify-end">
                <a className="!text-sm p-0 h-auto !text-primary hover:!text-primary/80" onClick={() => navigate('/olvide-contrasena')}>
                  ¿Olvidaste tu contraseña?
                </a>
              </div>

              <Button
                type="primary"
                htmlType="submit"
                className="w-full h-12 shadow-lg hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1"
                disabled={isLoading}>
                {isLoading ? 'Iniciando sesión...' : 'Iniciar Sesión'}
              </Button>
            </Form>

            <div className="text-center">
              <p className="!text-base text-muted-foreground">
                ¿No tienes una cuenta?{' '}
                <a
                  className="!text-sm p-0 h-auto cursor-pointer !text-primary hover:!text-primary/80"
                  onClick={() => navigate('/registro')}>
                  Regístrate aquí
                </a>
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Footer */}
        <div className="text-center mt-6 text-xs text-muted-foreground">
          <p>Al iniciar sesión, aceptas nuestros</p>
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
};

export default Login;
