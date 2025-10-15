import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Checkbox, message, Form, Input } from 'antd';
import { Button } from 'components/core/Button';
import { Label } from 'components/core/Label';
import { RadioGroup, RadioGroupItem } from 'components/core/RadioGroup';
import {
  Mail,
  Lock,
  Eye,
  EyeOff,
  ArrowLeft,
  Phone,
  Edit3,
  ArrowRight,
  Check,
  CreditCard,
  TrendingUp,
  Zap,
  ShieldCheck,
} from 'lucide-react';
import { userService } from 'services/user.service';
import { UserRole } from 'types/models/user';
import { useIsAuthenticated, useCreateUser, useLogin, useCheckSlugAvailability } from 'hooks/useUser';
import { useSendVerificationCode, useVerifyCode } from 'hooks/useEmailVerification';
import { useCreatePlanCheckoutSession } from 'hooks/usePayment';
import { motion, AnimatePresence } from 'motion/react';
import { InfoCircleOutlined } from '@ant-design/icons';
import { PasswordStrengthIndicator } from 'components/auth/PasswordStrengthIndicator';

interface User {
  id: string;
  name: string;
  email: string;
  type: UserRole;
  avatar?: string;
}

type Step = 'details' | 'verification' | 'coupleSlug' | 'plan' | 'payment' | 'success';

function Signup() {
  const navigate = useNavigate();
  const [form] = Form.useForm();
  const [isCheckingAuth, setIsCheckingAuth] = useState(true);
  const [currentStep, setCurrentStep] = useState<Step>('details');
  const [coupleSlug, setCoupleSlug] = useState('');
  const [selectedPlan, setSelectedPlan] = useState<'fixed' | 'commission' | ''>('');
  const [isLoading, setIsLoading] = useState(false);
  const [slugError, setSlugError] = useState('');
  const [planError, setPlanError] = useState('');
  const [isWeddingAccount, setIsWeddingAccount] = useState(false);
  const [debouncedSlug, setDebouncedSlug] = useState('');
  const [formData, setFormData] = useState<any>(null); // Store form data across steps
  const [verificationCode, setVerificationCode] = useState('');
  const [verificationError, setVerificationError] = useState('');
  const [isResendingCode, setIsResendingCode] = useState(false);
  const [resendTimer, setResendTimer] = useState(0);
  const [password, setPassword] = useState('');

  const { mutateAsync: createUser, isSuccess: isSuccessCreatedUser } = useCreateUser();
  const { mutateAsync: login } = useLogin();
  const { mutateAsync: createPlanCheckout } = useCreatePlanCheckoutSession();
  const { mutateAsync: sendVerificationCode } = useSendVerificationCode();
  const { mutateAsync: verifyCode } = useVerifyCode();

  // Check slug availability
  const { data: slugCheck, isLoading: isCheckingSlug } = useCheckSlugAvailability(debouncedSlug);

  // Generate slug from names
  useEffect(() => {
    const firstName = form.getFieldValue('firstName');
    const lastName = form.getFieldValue('lastName');
    const spouseFirstName = form.getFieldValue('spouseFirstName');
    const spouseLastName = form.getFieldValue('spouseLastName');

    if (firstName && lastName) {
      let slug = `${firstName.toLowerCase()}-${lastName.toLowerCase()}`;
      if (isWeddingAccount && spouseFirstName && spouseLastName) {
        slug = `${firstName.toLowerCase()}-y-${spouseFirstName.toLowerCase()}`;
      }
      setCoupleSlug(slug.replace(/\s+/g, '-'));
    }
  }, [form, isWeddingAccount]);

  // Debounce slug for availability check
  useEffect(() => {
    const timer = setTimeout(() => {
      if (coupleSlug && coupleSlug.length > 2) {
        setDebouncedSlug(coupleSlug);
      }
    }, 500);

    return () => clearTimeout(timer);
  }, [coupleSlug]);

  // Update slug error based on availability check
  useEffect(() => {
    if (slugCheck && currentStep === 'coupleSlug') {
      if (!slugCheck.available) {
        setSlugError('Este enlace ya está en uso. Por favor elige otro.');
      } else {
        setSlugError('');
      }
    }
  }, [slugCheck, currentStep]);

  // Resend timer countdown
  useEffect(() => {
    if (resendTimer > 0) {
      const timer = setTimeout(() => setResendTimer(resendTimer - 1), 1000);
      return () => clearTimeout(timer);
    }
  }, [resendTimer]);

  // Redirect user to couple page if user was successfully created here
  // Do it after eight seconds of being in success step
  useEffect(() => {
    if (isSuccessCreatedUser && currentStep === 'success') {
      setTimeout(() => navigate(`/${coupleSlug}`), 8000);
    }
  }, [isSuccessCreatedUser, currentStep]);

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
            message.error('Something failed when creating your user');
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

  const handlePaymentOrCreateAccount = async (values: any) => {
    setIsLoading(true);

    try {
      // If fixed plan, redirect to payment FIRST
      if (selectedPlan === 'fixed') {
        // Store user data in sessionStorage to create account after payment
        const userData = {
          email: values.email,
          password: values.password,
          firstName: values.firstName,
          lastName: values.lastName,
          spouseFirstName: values.spouseFirstName || '',
          spouseLastName: values.spouseLastName || '',
          phoneNumber: values.phone,
          coupleSlug: coupleSlug,
          role: 'COUPLE',
          planType: 'FIXED',
        };

        sessionStorage.setItem('pendingUserData', JSON.stringify(userData));

        const baseUrl = window.location.origin;
        const checkoutResponse = await createPlanCheckout({
          planType: 'FIXED',
          email: values.email,
          successUrl: `${baseUrl}/registro-exitoso?session_id={CHECKOUT_SESSION_ID}`,
          cancelUrl: `${baseUrl}/registro?step=payment&cancelled=true`,
        });

        if (checkoutResponse.success && checkoutResponse.url) {
          // Redirect to Stripe checkout
          window.location.href = checkoutResponse.url;
        } else {
          message.error('Error al crear la sesión de pago');
        }
      } else {
        // Commission plan - no payment needed, create account directly
        const userData = {
          email: values.email,
          password: values.password,
          firstName: values.firstName,
          lastName: values.lastName,
          spouseFirstName: values.spouseFirstName || '',
          spouseLastName: values.spouseLastName || '',
          phoneNumber: values.phone,
          coupleSlug: coupleSlug,
          role: 'COUPLE' as UserRole,
          planType: selectedPlan.toUpperCase() as 'FIXED' | 'COMMISSION',
          updatedAt: new Date(),
        };

        await createUser(userData);
        message.success('¡Cuenta creada exitosamente!');

        // Automatically log in the user
        await login({ email: values.email, password: values.password });

        // Go to success
        setCurrentStep('success');
      }
    } catch (error: any) {
      console.error('Error:', error);
      const errorMessage = error.response?.data?.error || 'Error al procesar la solicitud. Por favor intenta de nuevo.';
      message.error(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSendVerificationCode = async (email: string) => {
    try {
      setIsLoading(true);
      await sendVerificationCode({ email });
      message.success('Código de verificación enviado a tu correo');
      setResendTimer(60); // 60 seconds cooldown
    } catch (error: any) {
      console.error('Error sending verification code:', error);
      message.error(error.response?.data?.error || 'Error al enviar el código');
    } finally {
      setIsLoading(false);
    }
  };

  const handleResendCode = async () => {
    if (resendTimer > 0 || !formData?.email) return;
    setIsResendingCode(true);
    await handleSendVerificationCode(formData.email);
    setIsResendingCode(false);
  };

  const validateCurrentStep = async () => {
    switch (currentStep) {
      case 'details':
        try {
          await form.validateFields();
          return true;
        } catch (error) {
          return false;
        }

      case 'verification':
        if (!verificationCode || verificationCode.length !== 6) {
          setVerificationError('Ingresa el código de 6 dígitos');
          return false;
        }
        setVerificationError('');
        return true;

      case 'coupleSlug':
        if (!coupleSlug) {
          setSlugError('El enlace de la pareja es requerido');
          return false;
        }
        if (slugCheck && !slugCheck.available) {
          setSlugError('Este enlace ya está en uso. Por favor elige otro.');
          return false;
        }
        if (isCheckingSlug) {
          setSlugError('Verificando disponibilidad...');
          return false;
        }
        setSlugError('');
        return true;

      case 'plan':
        if (!selectedPlan) {
          setPlanError('Selecciona un plan');
          return false;
        }
        setPlanError('');
        return true;

      default:
        return true;
    }
  };

  const handleNext = async () => {
    const isValid = await validateCurrentStep();
    if (!isValid) return;

    switch (currentStep) {
      case 'details':
        // Save form data and send verification code
        const values = form.getFieldsValue();
        setFormData(values);
        await handleSendVerificationCode(values.email);
        setCurrentStep('verification');
        break;
      case 'verification':
        // Verify the code
        try {
          setIsLoading(true);
          const result = await verifyCode({ email: formData.email, code: verificationCode });
          if (result.success) {
            message.success('¡Correo verificado exitosamente!');
            setCurrentStep('coupleSlug');
          } else {
            setVerificationError(result.error || 'Código inválido');
          }
        } catch (error: any) {
          console.error('Error verifying code:', error);
          setVerificationError(error.response?.data?.error || 'Error al verificar el código');
        } finally {
          setIsLoading(false);
        }
        break;
      case 'coupleSlug':
        setCurrentStep('plan');
        break;
      case 'plan':
        setCurrentStep('payment');
        break;
      case 'payment':
        // Use stored form data
        if (formData) {
          handlePaymentOrCreateAccount(formData);
        } else {
          message.error('Error: No se encontraron los datos del formulario');
        }
        break;
    }
  };

  const handleBack = () => {
    switch (currentStep) {
      case 'verification':
        setCurrentStep('details');
        break;
      case 'coupleSlug':
        setCurrentStep('verification');
        break;
      case 'plan':
        setCurrentStep('coupleSlug');
        break;
      case 'payment':
        setCurrentStep('plan');
        break;
      default:
        navigate('/');
    }
  };

  const getStepNumber = () => {
    const steps = ['details', 'verification', 'coupleSlug', 'plan', 'payment', 'success'];
    return steps.indexOf(currentStep) + 1;
  };

  const getTotalSteps = () => {
    return 6;
  };

  const renderProgressBar = () => (
    <div className="mb-8">
      <div className="flex justify-between text-sm text-muted-foreground mb-2">
        <span>
          Paso {getStepNumber()} de {getTotalSteps()}
        </span>
      </div>
      <div className="w-full bg-gray-200 rounded-full h-1">
        <div
          className="bg-[#d4704a] h-1 rounded-full transition-all duration-500"
          style={{ width: `${(getStepNumber() / getTotalSteps()) * 100}%` }}
        />
      </div>
    </div>
  );

  // Show loading while checking authentication
  if (isCheckingAuth || isAuthLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-pulse text-primary">Cargando...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Navigation */}
      <div className="px-4 sm:px-6 lg:px-8 py-6">
        <Button
          variant="ghost"
          onClick={handleBack}
          className="flex items-center space-x-2 text-muted-foreground hover:text-foreground transition-colors">
          <ArrowLeft className="h-4 w-4" />
          <span>Atrás</span>
        </Button>
      </div>

      {/* Main Content */}
      <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8 pb-12">
        {currentStep !== 'success' && renderProgressBar()}

        <AnimatePresence mode="wait">
          <motion.div
            key={currentStep}
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            transition={{ duration: 0.3 }}
            className="bg-white rounded-3xl shadow-sm border border-border/30 p-16 sm:p-12">
            {currentStep === 'details' && (
              <>
                <div className="text-center">
                  <div className="w-30 h-30 bg-[#d4704a]/10 rounded-full flex items-center justify-center mx-auto mb-6">
                    <img src="/svg/MesaLista_isotipo.svg" className="w-24 h-24" alt="" />
                  </div>
                  <h1 className="text-3xl sm:text-4xl mb-4 text-foreground">Únete a MesaLista</h1>
                </div>
                <div className="text-center mb-8">
                  <p className="text-xl text-muted-foreground">Necesitamos algunos datos para crear tu cuenta</p>
                </div>

                <div className="relative mb-8">
                  <div className="absolute inset-0 flex items-center">
                    <div className="w-full border-t border-border/30" />
                  </div>
                </div>

                <Form form={form} layout="vertical" className="">
                  <div className="grid grid-cols-2 gap-4 !mb-0">
                    <Form.Item
                      name="firstName"
                      className="!mb-0"
                      label={<Label className="text-sm">Nombre</Label>}
                      rules={[{ required: true, message: 'El nombre es requerido' }]}>
                      <Input
                        type="outline"
                        placeholder="María"
                        className="h-12 rounded-xl !border !border-border"
                        onChange={() => {
                          const firstName = form.getFieldValue('firstName');
                          const lastName = form.getFieldValue('lastName');
                          if (firstName && lastName) {
                            const slug = `${firstName.toLowerCase()}-${lastName.toLowerCase()}`.replace(/\s+/g, '-');
                            setCoupleSlug(slug);
                          }
                        }}
                      />
                    </Form.Item>

                    <Form.Item
                      name="lastName"
                      label={<Label className="text-sm">Apellido</Label>}
                      className="!mb-0"
                      rules={[{ required: true, message: 'El apellido es requerido' }]}>
                      <Input
                        type="outline"
                        placeholder="González"
                        className="h-12 rounded-xl !border !border-border"
                        onChange={() => {
                          const firstName = form.getFieldValue('firstName');
                          const lastName = form.getFieldValue('lastName');
                          if (firstName && lastName) {
                            const slug = `${firstName.toLowerCase()}-${lastName.toLowerCase()}`.replace(/\s+/g, '-');
                            setCoupleSlug(slug);
                          }
                        }}
                      />
                    </Form.Item>
                  </div>

                  <Form.Item name="isWeddingAccount" valuePropName="checked">
                    <Checkbox onChange={(e) => setIsWeddingAccount(e.target.checked)}>
                      <span className="text-sm">Crear cuenta para boda</span>
                    </Checkbox>
                  </Form.Item>

                  {isWeddingAccount && (
                    <div className="grid grid-cols-2 gap-4">
                      <Form.Item
                        name="spouseFirstName"
                        label={<Label className="text-sm">Nombre de tu pareja</Label>}
                        rules={[{ required: isWeddingAccount, message: 'El nombre de tu pareja es requerido' }]}>
                        <Input
                          type="outline"
                          placeholder="Juan"
                          className="h-12 rounded-xl !border !border-border"
                          onChange={() => {
                            const firstName = form.getFieldValue('firstName');
                            const lastName = form.getFieldValue('lastName');
                            const spouseFirstName = form.getFieldValue('spouseFirstName');
                            const spouseLastName = form.getFieldValue('spouseLastName');
                            if (firstName && lastName && spouseFirstName && spouseLastName) {
                              const slug = `${firstName.toLowerCase()}-y-${spouseFirstName.toLowerCase()}`.replace(/\s+/g, '-');
                              setCoupleSlug(slug);
                            }
                          }}
                        />
                      </Form.Item>

                      <Form.Item
                        name="spouseLastName"
                        label={<Label className="text-sm">Apellido de tu pareja</Label>}
                        rules={[{ required: isWeddingAccount, message: 'El apellido de tu pareja es requerido' }]}>
                        <Input
                          type="outline"
                          placeholder="Pérez"
                          className="h-12 rounded-xl !border !border-border"
                          onChange={() => {
                            const firstName = form.getFieldValue('firstName');
                            const lastName = form.getFieldValue('lastName');
                            const spouseFirstName = form.getFieldValue('spouseFirstName');
                            const spouseLastName = form.getFieldValue('spouseLastName');
                            if (firstName && lastName && spouseFirstName && spouseLastName) {
                              const slug = `${firstName.toLowerCase()}-y-${spouseFirstName.toLowerCase()}`.replace(/\s+/g, '-');
                              setCoupleSlug(slug);
                            }
                          }}
                        />
                      </Form.Item>
                    </div>
                  )}

                  <Form.Item
                    name="email"
                    label={<Label className="text-sm">Correo Electrónico</Label>}
                    rules={[
                      { required: true, message: 'El correo electrónico es requerido' },
                      { type: 'email', message: 'Correo electrónico inválido' },
                    ]}>
                    <Input
                      type="outline"
                      prefix={<Mail className="h-4 w-4 text-muted-foreground" />}
                      placeholder="maria@correo.com"
                      className="h-12 rounded-xl !border !border-border"
                    />
                  </Form.Item>

                  <Form.Item
                    name="phone"
                    label={<Label className="text-sm">Teléfono</Label>}
                    rules={[
                      { required: true, message: 'El teléfono es requerido' },
                      { pattern: /^[\d\s\-\+\(\)]{10,}$/, message: 'Teléfono inválido' },
                    ]}>
                    <Input
                      type="outline"
                      prefix={<Phone className="h-4 w-4 text-muted-foreground" />}
                      placeholder="55 1234 5678"
                      className="h-12 rounded-xl !border !border-border"
                    />
                  </Form.Item>

                  <Form.Item
                    name="password"
                    label={<Label className="text-sm">Contraseña</Label>}
                    rules={[
                      { required: true, message: 'La contraseña es requerida' },
                      { min: 8, message: 'La contraseña debe tener al menos 8 caracteres' },
                      {
                        pattern: /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/,
                        message: 'Debe incluir mayúsculas, minúsculas y números',
                      },
                    ]}>
                    <Input.Password
                      type="outline"
                      prefix={<Lock className="h-4 w-4 text-muted-foreground" />}
                      placeholder="••••••••"
                      className="h-12 rounded-xl !border !border-border"
                      iconRender={(visible) => (visible ? <EyeOff size={16} /> : <Eye size={16} />)}
                      onChange={(e) => setPassword(e.target.value)}
                    />
                  </Form.Item>

                  {/* Real-time password strength indicator */}
                  {password && (
                    <div className="mb-4">
                      <PasswordStrengthIndicator password={password} showRequirements={true} />
                    </div>
                  )}

                  <Form.Item
                    name="confirmPassword"
                    label={<Label className="text-sm">Confirmar Contraseña</Label>}
                    dependencies={['password']}
                    rules={[
                      { required: true, message: 'Confirma tu contraseña' },
                      ({ getFieldValue }) => ({
                        validator(_, value) {
                          if (!value || getFieldValue('password') === value) {
                            return Promise.resolve();
                          }
                          return Promise.reject(new Error('Las contraseñas no coinciden'));
                        },
                      }),
                    ]}>
                    <Input.Password
                      type="outline"
                      prefix={<Lock className="h-4 w-4 text-muted-foreground" />}
                      placeholder="••••••••"
                      className="h-12 rounded-xl !border !border-border"
                      iconRender={(visible) => (visible ? <EyeOff size={16} /> : <Eye size={16} />)}
                    />
                  </Form.Item>

                  <Form.Item
                    name="termsAccepted"
                    valuePropName="checked"
                    rules={[
                      {
                        validator: (_, value) =>
                          value ? Promise.resolve() : Promise.reject(new Error('Debes aceptar los términos y condiciones')),
                      },
                    ]}>
                    <Checkbox>
                      <span className="text-sm">
                        Acepto los{' '}
                        <Button variant="link" className="p-0 h-auto text-[#d4704a] text-sm">
                          Términos de Servicio
                        </Button>{' '}
                        y la{' '}
                        <Button variant="link" className="p-0 h-auto text-[#d4704a] text-sm">
                          Política de Privacidad
                        </Button>
                      </span>
                    </Checkbox>
                  </Form.Item>
                </Form>
              </>
            )}

            {currentStep === 'verification' && (
              <>
                <div className="text-center mb-8">
                  <div className="w-20 h-20 bg-[#d4704a]/10 rounded-full flex items-center justify-center mx-auto mb-6">
                    <ShieldCheck className="w-10 h-10 text-[#d4704a]" />
                  </div>
                  <h1 className="text-3xl sm:text-4xl mb-4 text-foreground">Verifica tu correo</h1>
                  <p className="text-xl text-muted-foreground mb-2">Enviamos un código de 6 dígitos a</p>
                  <p className="text-lg text-[#d4704a] font-medium">{formData?.email}</p>
                </div>

                <div className="space-y-6">
                  <div>
                    <Label htmlFor="verificationCode" className="text-sm mb-2 block">
                      Código de verificación
                    </Label>
                    <Input
                      type="outline"
                      id="verificationCode"
                      value={verificationCode}
                      onChange={(e) => {
                        const value = e.target.value.replace(/\D/g, '').slice(0, 6);
                        setVerificationCode(value);
                        setVerificationError('');
                      }}
                      placeholder="000000"
                      maxLength={6}
                      className="h-14 rounded-xl !border !border-border text-center text-2xl tracking-widest font-mono"
                      status={verificationError ? 'error' : undefined}
                    />
                    {verificationError && <p className="text-sm text-red-500 mt-2">{verificationError}</p>}
                  </div>

                  <div className="bg-blue-50 rounded-2xl p-4">
                    <p className="text-sm text-blue-700 text-center">El código expira en 10 minutos</p>
                  </div>

                  <div className="text-center">
                    <p className="text-sm text-muted-foreground mb-2">¿No recibiste el código?</p>
                    <Button
                      variant="link"
                      onClick={handleResendCode}
                      disabled={resendTimer > 0 || isResendingCode}
                      className="text-[#d4704a] p-0 h-auto">
                      {resendTimer > 0 ? `Reenviar en ${resendTimer}s` : isResendingCode ? 'Reenviando...' : 'Reenviar código'}
                    </Button>
                  </div>
                </div>
              </>
            )}

            {currentStep === 'coupleSlug' && (
              <>
                <div className="text-center mb-8">
                  <h1 className="text-3xl sm:text-4xl mb-4 text-foreground">Tu enlace personalizado</h1>
                  <p className="text-xl text-muted-foreground">Este será el enlace único de tu mesa de regalos</p>
                </div>

                <div className="bg-gray-50 rounded-2xl p-6 mb-6">
                  <div className="text-center">
                    <p className="text-sm text-muted-foreground mb-2">Tu enlace será:</p>
                    <div className="text-lg">
                      <span className="text-muted-foreground">mesalista.com.mx/</span>
                      <span className="text-[#d4704a]">{coupleSlug}</span>
                    </div>
                  </div>
                </div>

                <div className="space-y-4">
                  <Label htmlFor="coupleSlug" className="text-sm">
                    Personalizar enlace
                  </Label>
                  <div className="relative">
                    <Input
                      type="outline"
                      id="coupleSlug"
                      value={coupleSlug}
                      onChange={(e) => setCoupleSlug(e.target.value.toLowerCase().replace(/\s+/g, '-'))}
                      placeholder="maria-gonzalez"
                      className="h-12 rounded-xl !border !border-border"
                      suffix={<Edit3 className="h-4 w-4 text-muted-foreground" />}
                      status={slugError ? 'error' : undefined}
                    />
                  </div>
                  {isCheckingSlug && <p className="text-sm text-muted-foreground">Verificando disponibilidad...</p>}
                  {!isCheckingSlug && slugCheck && slugCheck.available && (
                    <p className="text-sm text-green-600">✓ Este enlace está disponible</p>
                  )}
                  {slugError && <p className="text-sm text-red-500">{slugError}</p>}

                  <div className="text-xs text-muted-foreground space-y-1">
                    <p>• Solo letras, números y guiones</p>
                    <p>• Debe ser único y fácil de recordar</p>
                    <p>• Podrás cambiarlo más tarde si quieres</p>
                  </div>
                </div>
              </>
            )}

            {currentStep === 'plan' && (
              <>
                <div className="text-center mb-8">
                  <h1 className="text-3xl sm:text-4xl mb-4 text-foreground">Elige tu plan</h1>
                  <p className="text-xl text-muted-foreground">Selecciona la opción que mejor se adapte a ti</p>
                </div>

                <div className="space-y-4 mb-8">
                  <RadioGroup value={selectedPlan} onValueChange={(value) => setSelectedPlan(value as 'fixed' | 'commission')}>
                    <div className="space-y-4">
                      <div className="relative">
                        <RadioGroupItem value="fixed" id="fixed" className="peer sr-only" />
                        <Label
                          htmlFor="fixed"
                          className={`flex items-center p-6 rounded-2xl border-2 cursor-pointer transition-all duration-200 hover:shadow-md ${
                            selectedPlan === 'fixed'
                              ? 'border-[#d4704a] bg-[#d4704a]/5 shadow-md'
                              : 'border-border/30 hover:border-[#d4704a]/50'
                          }`}>
                          {selectedPlan === 'fixed' && (
                            <div className="absolute top-3 right-3 w-6 h-6 bg-[#d4704a] rounded-full flex items-center justify-center">
                              <Check className="h-4 w-4 text-white" />
                            </div>
                          )}
                          <div className="w-12 h-12 bg-[#d4704a]/10 rounded-full flex items-center justify-center mr-4">
                            <CreditCard className="h-6 w-6 text-[#d4704a]" />
                          </div>
                          <div className="flex-1">
                            <div className="flex items-center justify-between mb-1 pr-8">
                              <h3 className="text-lg text-foreground font-semibold">Plan Fijo</h3>
                              <span className="text-2xl text-[#d4704a] font-bold">$3,000 MXN</span>
                            </div>
                            <p className="text-muted-foreground">Pago único</p>
                            <ul className="text-sm text-muted-foreground mt-2 space-y-1">
                              <li>• Mesa de regalos ilimitada</li>
                              <li>• Sin comisiones por ventas</li>
                              <li>• Soporte al cliente</li>
                              <li>• Listas de regalos inspiradas por nosotros</li>
                            </ul>
                          </div>
                        </Label>
                      </div>

                      <div className="relative">
                        <RadioGroupItem value="commission" id="commission" className="peer sr-only" />
                        <Label
                          htmlFor="commission"
                          className={`flex items-center p-6 rounded-2xl border-2 cursor-pointer transition-all duration-200 hover:shadow-md ${
                            selectedPlan === 'commission'
                              ? 'border-[#d4704a] bg-[#d4704a]/5 shadow-md'
                              : 'border-border/30 hover:border-[#d4704a]/50'
                          }`}>
                          {selectedPlan === 'commission' && (
                            <div className="absolute top-3 right-3 w-6 h-6 bg-[#d4704a] rounded-full flex items-center justify-center">
                              <Check className="h-4 w-4 text-white" />
                            </div>
                          )}
                          <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center mr-4">
                            <TrendingUp className="h-6 w-6 text-green-600" />
                          </div>
                          <div className="flex-1">
                            <div className="flex items-center justify-between mb-1 pr-8">
                              <h3 className="text-lg text-foreground font-semibold">Plan por Comisión</h3>
                              <span className="text-2xl text-green-600 font-bold">3.00%</span>
                            </div>
                            <p className="text-muted-foreground">Comisión de 3.00% por cada venta</p>
                            <ul className="text-sm text-muted-foreground mt-2 space-y-1">
                              <li>• Mesa de regalos ilimitada</li>
                              <li>• Sin costo inicial</li>
                              <li>• Perfecto para comenzar</li>
                              <li>• Soporte al cliente</li>
                              <li>• Listas de regalos inspiradas por nosotros</li>
                            </ul>
                          </div>
                        </Label>
                      </div>
                    </div>
                  </RadioGroup>
                  {planError && <p className="text-sm text-red-500">{planError}</p>}
                </div>

                <div className="bg-blue-50 rounded-2xl p-4 text-center">
                  <InfoCircleOutlined className="!text-blue-700 !mr-2" />
                  <span className="text-sm text-blue-700">Una vez elegido tu plan, no podrás cambiarlo</span>
                </div>
              </>
            )}

            {currentStep === 'payment' && (
              <>
                <div className="text-center mb-8">
                  <h1 className="text-3xl sm:text-4xl mb-4 text-foreground">Confirmar pago</h1>
                  <p className="text-xl text-muted-foreground">
                    {selectedPlan === 'fixed' ? 'Pago único de $3,000 MXN' : 'Sin costo inicial - 3% por venta'}
                  </p>
                </div>

                {selectedPlan === 'fixed' ? (
                  <div className="space-y-6">
                    <div className="bg-gray-50 rounded-2xl p-6">
                      <div className="flex justify-between items-center mb-4">
                        <span className="text-lg">Plan Fijo</span>
                        <span className="text-2xl text-[#d4704a]">$3,000 MXN</span>
                      </div>
                      <div className="text-sm text-muted-foreground">Pago único, sin comisiones adicionales</div>
                    </div>

                    <div className="text-center">
                      <p className="text-muted-foreground mb-4">Serás redirigido a nuestro procesador de pagos seguro</p>
                      <div className="flex items-center justify-center space-x-2 text-sm text-muted-foreground">
                        <Zap className="h-4 w-4" />
                        <span>Procesamiento seguro con cifrado SSL</span>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="text-center space-y-6">
                    <div className="bg-green-50 rounded-2xl p-6">
                      <div className="text-center">
                        <Check className="h-12 w-12 text-green-600 mx-auto mb-4" />
                        <h3 className="text-lg mb-2">Sin costo inicial</h3>
                        <p className="text-muted-foreground">Solo pagarás el 3% cuando tengas ventas en tu mesa de regalos</p>
                      </div>
                    </div>
                  </div>
                )}
              </>
            )}

            {currentStep === 'success' && (
              <div className="text-center py-8">
                <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
                  <Check className="h-10 w-10 text-green-600" />
                </div>
                <h1 className="text-3xl sm:text-4xl mb-4 text-foreground">¡Cuenta creada exitosamente!</h1>
                <p className="text-xl text-muted-foreground mb-8">Tu mesa de regalos está lista. Te redirigiremos en unos segundos.</p>
                <div className="bg-blue-50 rounded-2xl p-4 text-center">
                  <p className="text-sm text-blue-700">Tu enlace: mesalista.com/{coupleSlug}</p>
                </div>
              </div>
            )}

            {/* Action Buttons */}
            {currentStep !== 'success' && (
              <div className="flex justify-end mt-8">
                <Button
                  onClick={handleNext}
                  disabled={isLoading}
                  className="px-8 py-3 bg-[#d4704a]  text-white rounded-full border-0 shadow-lg hover:shadow-xl transition-all duration-300">
                  {isLoading ? (
                    'Procesando...'
                  ) : currentStep === 'payment' ? (
                    selectedPlan === 'fixed' ? (
                      'Pagar $3,000'
                    ) : (
                      'Crear Cuenta'
                    )
                  ) : (
                    <>
                      Continuar
                      <ArrowRight className="h-4 w-4 ml-2" />
                    </>
                  )}
                </Button>
              </div>
            )}
          </motion.div>
        </AnimatePresence>
      </div>
    </div>
  );
}

export default Signup;
