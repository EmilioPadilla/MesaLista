import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Checkbox, Tooltip } from 'antd';
import { Button } from 'components/core/Button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from 'components/core/Card';
import { Input } from 'components/core/Input';
import { Label } from 'components/core/Label';
import { Separator } from 'components/core/Separator';
import { RadioGroup, RadioGroupItem } from 'components/core/RadioGroup';
import { Heart, Mail, Lock, Eye, EyeOff, ArrowLeft, Chrome, Facebook, User, Users, Phone, Apple } from 'lucide-react';
import { GoogleOutlined } from '@ant-design/icons';
import { userService } from 'services/user.service';
import { UserRole } from 'types/models/user';
import { useIsAuthenticated } from 'hooks/useUser';

interface User {
  id: string;
  name: string;
  email: string;
  type: UserRole;
  avatar?: string;
}

function Signup() {
  const navigate = useNavigate();
  const [step, setStep] = useState<'type' | 'details'>('type');
  const [userType, setUserType] = useState<UserRole | ''>('');
  const [isCheckingAuth, setIsCheckingAuth] = useState(true);

  // Use the useIsAuthenticated hook to check authentication status
  const { data: isAuthenticated = false, isLoading: isAuthLoading } = useIsAuthenticated();

  // Check if user is already authenticated and redirect if needed
  useEffect(() => {
    const checkAuthStatus = async () => {
      try {
        if (isAuthenticated) {
          console.log('Signup page - Auth check:', isAuthenticated);
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
        // If error, user is not authenticated, so stay on signup page
      } finally {
        setIsCheckingAuth(false);
      }
    };

    if (!isAuthLoading) {
      checkAuthStatus();
    }
  }, [navigate, isAuthenticated, isAuthLoading]);

  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    password: '',
    confirmPassword: '',
    termsAccepted: false,
  });
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [agreeTerms, setAgreeTerms] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    if (!formData.firstName.trim()) newErrors.firstName = 'El nombre es requerido';
    if (!formData.lastName.trim()) newErrors.lastName = 'El apellido es requerido';

    if (!formData.email) {
      newErrors.email = 'El correo electrónico es requerido';
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
      newErrors.email = 'Correo electrónico inválido';
    }

    if (!formData.phone) {
      newErrors.phone = 'El teléfono es requerido';
    } else if (!/^\d{10}$/.test(formData.phone.replace(/\D/g, ''))) {
      newErrors.phone = 'Teléfono debe tener 10 dígitos';
    }

    if (!formData.password) {
      newErrors.password = 'La contraseña es requerida';
    } else if (formData.password.length < 8) {
      newErrors.password = 'La contraseña debe tener al menos 8 caracteres';
    }

    if (formData.password !== formData.confirmPassword) {
      newErrors.confirmPassword = 'Las contraseñas no coinciden';
    }

    if (!agreeTerms) {
      newErrors.terms = 'Debes aceptar los términos y condiciones';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) return;

    setIsLoading(true);

    setIsLoading(false);
    navigate('/');
  };

  const handleSocialSignup = (provider: string) => {
    setIsLoading(true);

    // Simulate social signup
    setTimeout(() => {
      setIsLoading(false);
      navigate('/');
    }, 1000);
  };

  const handleContinue = () => {
    if (userType) {
      setStep('details');
    }
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
          onClick={() => (step === 'details' ? setStep('type') : navigate('/'))}
          className="mb-6 flex items-center space-x-2 hover:shadow-md transition-all duration-200">
          <ArrowLeft className="h-4 w-4" />
          <span>{step === 'details' ? 'Volver' : 'Volver al inicio'}</span>
        </Button>

        <Card className="shadow-2xl border-0 bg-card/95 backdrop-blur-sm">
          <CardHeader className="text-center pb-6">
            <div className="flex justify-center mb-4">
              <div className="p-3 rounded-full bg-gradient-to-br from-primary/20 to-primary/10 shadow-lg">
                <Heart className="h-8 w-8 text-primary" />
              </div>
            </div>
            <CardTitle className="text-2xl text-primary">{step === 'type' ? 'Únete a MesaLista' : 'Completa tu registro'}</CardTitle>
            <CardDescription>
              {step === 'type' ? 'Primero, dinos qué tipo de usuario eres' : 'Solo unos datos más y estarás listo'}
            </CardDescription>
          </CardHeader>

          <CardContent className="space-y-6">
            {step === 'type' ? (
              <>
                {/* User Type Selection */}
                <div className="space-y-4">
                  <Label className="text-base">¿Cómo planeas usar MesaLista?</Label>
                  <RadioGroup value={userType} onValueChange={(value) => setUserType(value as UserRole)}>
                    <div className="space-y-3">
                      <div className="flex items-center space-x-3 border rounded-lg p-4 hover:bg-muted/50 cursor-pointer transition-all duration-200 hover:shadow-md">
                        <RadioGroupItem value="couple" id="couple" />
                        <Label htmlFor="couple" className="flex items-center space-x-3 cursor-pointer flex-1">
                          <div className="p-2 rounded-full bg-primary/10">
                            <Users className="h-5 w-5 text-primary" />
                          </div>
                          <div>
                            <p className="text-base">Somos la pareja</p>
                            <p className="text-sm text-muted-foreground">Queremos crear nuestra mesa de regalos</p>
                          </div>
                        </Label>
                      </div>
                      <Tooltip title="¡Funcionalidad disponible pronto!" trigger={['click']}>
                        <div className="flex items-center space-x-3 border rounded-lg p-4 hover:bg-muted/50 cursor-pointer transition-all duration-200 hover:shadow-md">
                          <RadioGroupItem value="guest" id="guest" disabled />
                          <Label htmlFor="guest" className="flex items-center space-x-3 cursor-pointer flex-1">
                            <div className="p-2 rounded-full bg-accent/40">
                              <User className="h-5 w-5 text-accent-foreground" />
                            </div>
                            <div>
                              <p className="text-base">Soy invitado</p>
                              <p className="text-sm text-muted-foreground">Quiero comprar regalos para una pareja</p>
                            </div>
                          </Label>
                        </div>
                      </Tooltip>
                    </div>
                  </RadioGroup>
                </div>

                <Button
                  onClick={handleContinue}
                  disabled={!userType}
                  className="w-full h-12 shadow-lg hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1">
                  Continuar
                </Button>

                <div className="text-center">
                  <p className="text-sm text-muted-foreground">
                    ¿Ya tienes una cuenta?{' '}
                    <Button variant="link" className="p-0 h-auto text-primary hover:text-primary/80" onClick={() => navigate('/login')}>
                      Inicia sesión aquí
                    </Button>
                  </p>
                </div>
              </>
            ) : (
              <>
                {/* Social Signup Options */}
                <div className="space-y-3">
                  <Button
                    variant="outline"
                    className="w-full h-12 shadow-md hover:shadow-lg transition-all duration-200 border-primary/20 hover:border-primary/40"
                    onClick={() => handleSocialSignup('google')}
                    disabled={isLoading}>
                    <GoogleOutlined className="h-5 w-5 mr-3 text-blue-500" />
                    Registrarse con Google
                  </Button>

                  <Button
                    variant="outline"
                    className="w-full h-12 shadow-md hover:shadow-lg transition-all duration-200 border-primary/20 hover:border-primary/40"
                    onClick={() => handleSocialSignup('apple')}
                    disabled={isLoading}>
                    <Apple className="h-5 w-5 mr-3" />
                    Registrarse con Apple
                  </Button>
                </div>

                <div className="relative">
                  <div className="absolute inset-0 flex items-center">
                    <Separator className="w-full" />
                  </div>
                  <div className="relative flex justify-center text-xs uppercase">
                    <span className="bg-card px-2 text-muted-foreground">O regístrate con email</span>
                  </div>
                </div>

                {/* Registration Form */}
                <form onSubmit={handleSubmit} className="space-y-4">
                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-2">
                      <Label htmlFor="firstName">Nombre</Label>
                      <Input
                        id="firstName"
                        value={formData.firstName}
                        onChange={(e) => setFormData({ ...formData, firstName: e.target.value })}
                        placeholder="María"
                        className={`h-12 shadow-sm ${errors.firstName ? 'border-destructive' : ''}`}
                      />
                      {errors.firstName && <p className="text-xs text-destructive">{errors.firstName}</p>}
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="lastName">Apellido</Label>
                      <Input
                        id="lastName"
                        value={formData.lastName}
                        onChange={(e) => setFormData({ ...formData, lastName: e.target.value })}
                        placeholder="González"
                        className={`h-12 shadow-sm ${errors.lastName ? 'border-destructive' : ''}`}
                      />
                      {errors.lastName && <p className="text-xs text-destructive">{errors.lastName}</p>}
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="email">Correo Electrónico</Label>
                    <div className="relative">
                      <Mail className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                      <Input
                        id="email"
                        type="email"
                        value={formData.email}
                        onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                        placeholder="maria@correo.com"
                        className={`pl-10 h-12 shadow-sm ${errors.email ? 'border-destructive' : ''}`}
                      />
                    </div>
                    {errors.email && <p className="text-sm text-destructive">{errors.email}</p>}
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="phone">Teléfono</Label>
                    <div className="relative">
                      <Phone className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                      <Input
                        id="phone"
                        value={formData.phone}
                        onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                        placeholder="55 1234 5678"
                        className={`pl-10 h-12 shadow-sm ${errors.phone ? 'border-destructive' : ''}`}
                      />
                    </div>
                    {errors.phone && <p className="text-sm text-destructive">{errors.phone}</p>}
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="password">Contraseña</Label>
                    <div className="relative">
                      <Lock className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                      <Input
                        id="password"
                        type={showPassword ? 'text' : 'password'}
                        value={formData.password}
                        onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                        placeholder="••••••••"
                        className={`pl-10 pr-10 h-12 shadow-sm ${errors.password ? 'border-destructive' : ''}`}
                      />
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        className="absolute right-1 top-1 h-10 w-10"
                        onClick={() => setShowPassword(!showPassword)}>
                        {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                      </Button>
                    </div>
                    {errors.password && <p className="text-sm text-destructive">{errors.password}</p>}
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="confirmPassword">Confirmar Contraseña</Label>
                    <div className="relative">
                      <Lock className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                      <Input
                        id="confirmPassword"
                        type={showConfirmPassword ? 'text' : 'password'}
                        value={formData.confirmPassword}
                        onChange={(e) => setFormData({ ...formData, confirmPassword: e.target.value })}
                        placeholder="••••••••"
                        className={`pl-10 pr-10 h-12 shadow-sm ${errors.confirmPassword ? 'border-destructive' : ''}`}
                      />
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        className="absolute right-1 top-1 h-10 w-10"
                        onClick={() => setShowConfirmPassword(!showConfirmPassword)}>
                        {showConfirmPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                      </Button>
                    </div>
                    {errors.confirmPassword && <p className="text-sm text-destructive">{errors.confirmPassword}</p>}
                  </div>

                  <div className="space-y-2">
                    <div className="flex items-center space-x-2">
                      <Checkbox
                        id="terms"
                        checked={formData.termsAccepted}
                        onChange={(e) => setFormData({ ...formData, termsAccepted: e.target.checked })}
                        className="rounded-sm"
                      />
                      <Label
                        htmlFor="terms"
                        className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
                        Acepto los{' '}
                        <Button variant="link" className="p-0 h-auto text-primary text-sm">
                          Términos de Servicio
                        </Button>{' '}
                        y la{' '}
                        <Button variant="link" className="p-0 h-auto text-primary text-sm">
                          Política de Privacidad
                        </Button>
                      </Label>
                    </div>
                    {errors.terms && <p className="text-sm text-destructive">{errors.terms}</p>}
                  </div>

                  <Button
                    type="submit"
                    className="w-full h-12 shadow-lg hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1"
                    disabled={isLoading}>
                    {isLoading ? 'Creando cuenta...' : 'Crear Cuenta'}
                  </Button>
                </form>

                <div className="text-center">
                  <p className="text-sm text-muted-foreground">
                    ¿Ya tienes una cuenta?{' '}
                    <Button variant="link" className="p-0 h-auto text-primary hover:text-primary/80" onClick={() => navigate('/login')}>
                      Inicia sesión aquí
                    </Button>
                  </p>
                </div>
              </>
            )}
          </CardContent>
        </Card>

        {/* Footer */}
        {step === 'details' && (
          <div className="text-center mt-6 text-xs text-muted-foreground">
            <p>Tu información está protegida con cifrado de nivel bancario</p>
          </div>
        )}
      </div>
    </div>
  );
}

export default Signup;
