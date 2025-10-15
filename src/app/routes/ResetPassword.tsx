import React, { useEffect, useState } from 'react';
import { Form, message } from 'antd';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Button } from 'components/core/Button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from 'components/core/Card';
import { Input } from 'components/core/Input';
import { ArrowLeft, Lock, CheckCircle, AlertCircle, Eye, EyeOff } from 'lucide-react';
import { userService } from 'services/user.service';
import { PasswordStrengthIndicator, calculatePasswordStrength } from 'components/auth/PasswordStrengthIndicator';

interface ResetPasswordFormValues {
  newPassword: string;
  confirmPassword: string;
}

export function ResetPassword() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const token = searchParams.get('token');

  const [isLoading, setIsLoading] = useState(false);
  const [isVerifying, setIsVerifying] = useState(true);
  const [isValidToken, setIsValidToken] = useState(false);
  const [firstName, setFirstName] = useState('');
  const [resetSuccess, setResetSuccess] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [password, setPassword] = useState('');
  const [form] = Form.useForm();

  // Verify token on mount
  useEffect(() => {
    const verifyToken = async () => {
      if (!token) {
        setIsVerifying(false);
        setIsValidToken(false);
        return;
      }

      try {
        const response = await userService.verifyResetToken(token);
        if (response.valid) {
          setIsValidToken(true);
          setFirstName(response.firstName);
        } else {
          setIsValidToken(false);
        }
      } catch (error) {
        console.error('Error verifying token:', error);
        setIsValidToken(false);
      } finally {
        setIsVerifying(false);
      }
    };

    verifyToken();
  }, [token]);

  const onFinish = async (values: ResetPasswordFormValues) => {
    if (!token) {
      message.error('Token inválido');
      return;
    }

    // Validate password strength before submitting
    const strength = calculatePasswordStrength(values.newPassword);
    if (!strength.hasMinLength || !strength.hasUppercase || !strength.hasLowercase || !strength.hasNumber) {
      message.error('La contraseña no cumple con los requisitos mínimos');
      return;
    }

    setIsLoading(true);
    try {
      await userService.resetPassword(token, values.newPassword);
      setResetSuccess(true);
      message.success('Contraseña restablecida exitosamente');
    } catch (error: any) {
      console.error('Error resetting password:', error);
      const errorMessage = error.response?.data?.error || 'Error al restablecer la contraseña';
      const errors = error.response?.data?.errors;
      
      if (errors && errors.length > 0) {
        // Show all validation errors
        errors.forEach((err: string) => message.error(err));
      } else {
        message.error(errorMessage);
      }
    } finally {
      setIsLoading(false);
    }
  };

  // Loading state while verifying token
  if (isVerifying) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-secondary/30 via-background to-accent/20">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Verificando enlace...</p>
        </div>
      </div>
    );
  }

  // Invalid or expired token
  if (!isValidToken) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-secondary/30 via-background to-accent/20 flex items-center justify-center px-4 py-8">
        <div className="absolute top-10 left-10 w-32 h-32 bg-primary/10 rounded-full blur-3xl"></div>
        <div className="absolute bottom-20 right-20 w-40 h-40 bg-accent/20 rounded-full blur-2xl"></div>

        <div className="w-full max-w-md relative z-10">
          <Button variant="ghost" className="mb-4" onClick={() => navigate('/login')}>
            <ArrowLeft className="mr-2 h-4 w-4" />
            Volver al inicio de sesión
          </Button>

          <Card className="border-2 shadow-2xl backdrop-blur-sm bg-card/95">
            <CardHeader className="text-center space-y-4 pb-8">
              <div className="mx-auto w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mb-4">
                <AlertCircle className="h-8 w-8 text-red-600" />
              </div>
              <CardTitle className="text-3xl">Enlace Inválido</CardTitle>
              <CardDescription className="text-base">Este enlace de restablecimiento es inválido o ha expirado</CardDescription>
            </CardHeader>

            <CardContent className="space-y-4">
              <div className="bg-muted/50 p-4 rounded-lg border border-border/50">
                <p className="text-sm text-muted-foreground text-center">
                  Los enlaces de restablecimiento expiran después de 1 hora por seguridad. Solicita un nuevo enlace para continuar.
                </p>
              </div>

              <div className="space-y-3">
                <Button className="w-full h-12" onClick={() => navigate('/olvide-contrasena')}>
                  Solicitar nuevo enlace
                </Button>
                <Button variant="outline" className="w-full h-12" onClick={() => navigate('/login')}>
                  Volver al inicio de sesión
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  // Success state
  if (resetSuccess) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-secondary/30 via-background to-accent/20 flex items-center justify-center px-4 py-8">
        <div className="absolute top-10 left-10 w-32 h-32 bg-primary/10 rounded-full blur-3xl"></div>
        <div className="absolute bottom-20 right-20 w-40 h-40 bg-accent/20 rounded-full blur-2xl"></div>

        <div className="w-full max-w-md relative z-10">
          <Card className="border-2 shadow-2xl backdrop-blur-sm bg-card/95">
            <CardHeader className="text-center space-y-4 pb-8">
              <div className="mx-auto w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mb-4">
                <CheckCircle className="h-8 w-8 text-green-600" />
              </div>
              <CardTitle className="text-3xl">¡Contraseña Restablecida!</CardTitle>
              <CardDescription className="text-base">
                Tu contraseña ha sido actualizada exitosamente. Ahora puedes iniciar sesión con tu nueva contraseña.
              </CardDescription>
            </CardHeader>

            <CardContent>
              <Button className="w-full h-12 shadow-lg hover:shadow-xl transition-all duration-300" onClick={() => navigate('/login')}>
                Ir al inicio de sesión
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  // Reset password form
  return (
    <div className="min-h-screen bg-gradient-to-br from-secondary/30 via-background to-accent/20 flex items-center justify-center px-4 py-8">
      <div className="absolute top-10 left-10 w-32 h-32 bg-primary/10 rounded-full blur-3xl"></div>
      <div className="absolute bottom-20 right-20 w-40 h-40 bg-accent/20 rounded-full blur-2xl"></div>

      <div className="w-full max-w-md relative z-10">
        <Button variant="ghost" className="mb-4" onClick={() => navigate('/login')}>
          <ArrowLeft className="mr-2 h-4 w-4" />
          Volver al inicio de sesión
        </Button>

        <Card className="border-2 shadow-2xl backdrop-blur-sm bg-card/95">
          <CardHeader className="text-center space-y-4 pb-8">
            <div className="mx-auto w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mb-4">
              <Lock className="h-8 w-8 text-primary" />
            </div>
            <CardTitle className="text-3xl">Nueva Contraseña</CardTitle>
            <CardDescription className="text-base">Hola {firstName}, crea una nueva contraseña segura para tu cuenta</CardDescription>
          </CardHeader>

          <CardContent>
            <Form form={form} name="reset-password" onFinish={onFinish} layout="vertical" className="space-y-6">
              <div className="space-y-2">
                <label className="!text-base font-semibold" htmlFor="newPassword">
                  Nueva Contraseña
                </label>
                <div className="relative">
                  <Lock className="absolute left-3 top-3 h-4 w-4 text-muted-foreground z-10" />
                  <Form.Item
                    name="newPassword"
                    rules={[
                      { required: true, message: 'Por favor ingresa tu nueva contraseña' },
                      { min: 8, message: 'La contraseña debe tener al menos 8 caracteres' },
                      {
                        pattern: /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/,
                        message: 'Debe incluir mayúsculas, minúsculas y números',
                      },
                    ]}>
                    <Input
                      id="newPassword"
                      type={showPassword ? 'text' : 'password'}
                      placeholder="••••••••"
                      className="pl-10 pr-10 h-12 shadow-sm"
                      onChange={(e) => setPassword(e.target.value)}
                    />
                  </Form.Item>
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-3 text-muted-foreground hover:text-foreground z-10">
                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>

                {/* Real-time password strength indicator */}
                {password && <PasswordStrengthIndicator password={password} showRequirements={true} />}
              </div>

              <div className="space-y-2">
                <label className="!text-base font-semibold" htmlFor="confirmPassword">
                  Confirmar Contraseña
                </label>
                <div className="relative">
                  <Lock className="absolute left-3 top-3 h-4 w-4 text-muted-foreground z-10" />
                  <Form.Item
                    name="confirmPassword"
                    dependencies={['newPassword']}
                    rules={[
                      { required: true, message: 'Por favor confirma tu contraseña' },
                      ({ getFieldValue }) => ({
                        validator(_, value) {
                          if (!value || getFieldValue('newPassword') === value) {
                            return Promise.resolve();
                          }
                          return Promise.reject(new Error('Las contraseñas no coinciden'));
                        },
                      }),
                    ]}>
                    <Input
                      id="confirmPassword"
                      type={showConfirmPassword ? 'text' : 'password'}
                      placeholder="••••••••"
                      className="pl-10 pr-10 h-12 shadow-sm"
                    />
                  </Form.Item>
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    className="absolute right-3 top-3 text-muted-foreground hover:text-foreground z-10">
                    {showConfirmPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
              </div>

              <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
                <p className="text-sm text-amber-900 font-medium mb-2">⚠️ Política de seguridad:</p>
                <ul className="text-xs text-amber-800 space-y-1">
                  <li>• No puedes reutilizar tus últimas 5 contraseñas</li>
                  <li>• Tu cuenta se bloqueará por 30 minutos después de 5 intentos fallidos de inicio de sesión</li>
                  <li>• Todas tus sesiones activas serán cerradas por seguridad</li>
                </ul>
              </div>

              <Button
                type="submit"
                className="w-full h-12 shadow-lg hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1"
                disabled={isLoading}>
                {isLoading ? 'Restableciendo...' : 'Restablecer Contraseña'}
              </Button>
            </Form>
          </CardContent>
        </Card>

        <div className="text-center mt-6 text-xs text-muted-foreground">
          <p>Tu sesión actual será cerrada por seguridad</p>
        </div>
      </div>
    </div>
  );
}
