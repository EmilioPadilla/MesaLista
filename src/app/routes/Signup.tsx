import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Checkbox, message, Form, Input, Radio, DatePicker } from 'antd';
import dayjs from 'dayjs';
import { Button } from 'components/core/Button';
import { Mail, Lock, ArrowLeft, Phone, Edit3, ArrowRight, Check, CreditCard, TrendingUp, Zap, ShieldCheck, Calendar } from 'lucide-react';
import { userService } from 'services/user.service';
import { useIsAuthenticated, useCheckSlugAvailability, useCheckEmailAvailability, useSignup } from 'hooks/useUser';
import { useSendVerificationCode, useVerifyCode } from 'hooks/useEmailVerification';
import { motion, AnimatePresence } from 'motion/react';
import { InfoCircleOutlined } from '@ant-design/icons';
import { PasswordStrengthIndicator } from 'components/auth/PasswordStrengthIndicator';
import { useTrackEvent } from 'hooks/useAnalyticsTracking';
import { resolveSignupError, SIGNUP_ERROR_MESSAGES } from 'utils/signupErrors';

/**
 * Signup is free and creates a draft registry — no plan, no payment. The couple
 * builds the list first and chooses a plan from the builder when they publish
 * (see src/features/publish), which is also where a discount code is entered:
 * there is nothing to discount until a plan is being paid for. Keep in sync with
 * the mobile flow in mobile/src/features/signup/utils.ts.
 */
type Step = 'details' | 'verification' | 'slug' | 'success';

const SIGNUP_STEPS: Step[] = ['details', 'verification', 'slug', 'success'];

function Signup() {
  const navigate = useNavigate();
  const [form] = Form.useForm();
  const [isCheckingAuth, setIsCheckingAuth] = useState(true);
  const [currentStep, setCurrentStep] = useState<Step>('details');
  const [slug, setCoupleSlug] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [slugError, setSlugError] = useState('');
  const [isWeddingAccount, setIsWeddingAccount] = useState(false);
  const [debouncedSlug, setDebouncedSlug] = useState('');
  const [formData, setFormData] = useState<any>(null); // Store form data across steps
  const [verificationCode, setVerificationCode] = useState('');
  const [verificationError, setVerificationError] = useState('');
  const [resendTimer, setResendTimer] = useState(0);
  const [password, setPassword] = useState('');
  const [successSlug, setSuccessSlug] = useState('');

  const { mutateAsync: signup } = useSignup();
  const { mutateAsync: checkEmailAvailability, isPending: isCheckingEmail } = useCheckEmailAvailability();
  const { mutateAsync: sendVerificationCode, isPending: isResendingCode } = useSendVerificationCode();
  const { mutateAsync: verifyCode } = useVerifyCode();
  const trackEvent = useTrackEvent();

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
      if (slug && slug.length > 2) {
        setDebouncedSlug(slug);
      }
    }, 500);

    return () => clearTimeout(timer);
  }, [slug]);

  // Update slug error based on availability check
  useEffect(() => {
    if (slugCheck && currentStep === 'slug') {
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
          if (user?.slug) {
            navigate(`/${user.slug}`);
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

  /**
   * Creates the account and a draft registry. Nothing is charged here — the
   * couple picks a plan later, from the builder, once they can see what they
   * are buying.
   */
  const handleCreateAccount = async (values: any) => {
    setIsLoading(true);

    // The DatePicker stores a dayjs value on the form; serialize it to an ISO
    // string for the API. Falls back to undefined so the backend keeps its default.
    const eventDate = values.eventDate ? dayjs(values.eventDate).toISOString() : undefined;

    try {
      const createdUser = await signup({
        email: values.email,
        password: values.password,
        firstName: values.firstName,
        lastName: values.lastName,
        spouseFirstName: values.spouseFirstName || '',
        spouseLastName: values.spouseLastName || '',
        phoneNumber: values.phone,
        slug: slug,
        role: 'COUPLE',
        ...(eventDate && { eventDate }),
      });

      const finalSlug = createdUser.slug || slug;
      trackEvent('REGISTRY_DRAFT_CREATED', { slug: finalSlug });
      message.success('¡Tu mesa de regalos está lista para armar!');

      setSuccessSlug(finalSlug);
      // Straight into the builder — the empty registry is the next thing to do.
      setTimeout(() => navigate(`/${finalSlug}/gestionar`), 3000);

      setCurrentStep('success');
    } catch (error: any) {
      console.error('Error:', error);
      const { code, message: errorMessage } = resolveSignupError(error);
      message.error(errorMessage);

      // Point the couple at the field that actually collided: the email lives two
      // steps back, so re-open it and flag it (after the form remounts); the slug
      // is on this step and gets the inline error the availability check uses.
      if (code === 'EMAIL_TAKEN') {
        setCurrentStep('details');
        setTimeout(() => form.setFields([{ name: 'email', errors: [errorMessage] }]), 0);
      } else if (code === 'SLUG_TAKEN') {
        setSlugError(errorMessage);
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleSendVerificationCode = async (email: string, extra?: { firstName?: string; lastName?: string; phone?: string }) => {
    try {
      setIsLoading(true);
      await sendVerificationCode({ email, ...extra });
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
    await handleSendVerificationCode(formData.email);
  };

  /**
   * A taken email used to surface only when the account was created, three steps
   * later. Check it here so the couple sees the problem on the field they just
   * filled in. A check that fails (older deployed API, network blip) doesn't block
   * signup — the create call still rejects duplicates.
   */
  const isEmailAvailable = async (email: string) => {
    try {
      const result = await checkEmailAvailability(email);
      if (!result.available) {
        form.setFields([{ name: 'email', errors: [SIGNUP_ERROR_MESSAGES.EMAIL_TAKEN] }]);
        return false;
      }
    } catch (error) {
      console.error('Error checking email availability:', error);
    }
    return true;
  };

  const validateCurrentStep = async () => {
    switch (currentStep) {
      case 'details':
        try {
          const values = await form.validateFields();
          return await isEmailAvailable(values.email);
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

      case 'slug':
        if (!slug) {
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
        trackEvent('REGISTRY_ATTEMPT', { slug });
        const values = form.getFieldsValue();
        setFormData(values);
        await handleSendVerificationCode(values.email, {
          firstName: values.firstName,
          lastName: values.lastName,
          phone: values.phone,
        });
        setCurrentStep('verification');
        break;

      case 'verification':
        // Verify the code
        try {
          setIsLoading(true);
          const result = await verifyCode({ email: formData.email, code: verificationCode });
          if (result.success) {
            message.success('¡Correo verificado exitosamente!');
            setCurrentStep('slug');
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
      case 'slug':
        // Last step: the slug is confirmed, so create the account and the draft.
        if (formData) {
          handleCreateAccount(formData);
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
      case 'slug':
        setCurrentStep('verification');
        break;
      default:
        navigate('/');
    }
  };

  const getStepNumber = () => {
    return SIGNUP_STEPS.indexOf(currentStep) + 1;
  };

  const getTotalSteps = () => {
    return SIGNUP_STEPS.length;
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
                  <div className="w-30 h-30 rounded-full flex items-center justify-center mx-auto mb-6">
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
                  <div className="grid grid-cols-2 gap-4 mb-0!">
                    <Form.Item
                      name="firstName"
                      className="mb-0!"
                      label={<label className="text-sm">Nombre</label>}
                      rules={[{ required: true, message: 'El nombre es requerido' }]}>
                      <Input
                        type="outline"
                        placeholder="María"
                        className="h-12 rounded-xl border border-border!"
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
                      label={<label className="text-sm">Apellido</label>}
                      className="mb-0!"
                      rules={[{ required: true, message: 'El apellido es requerido' }]}>
                      <Input
                        type="outline"
                        placeholder="González"
                        className="h-12 rounded-xl border border-border!"
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
                        label={<label className="text-sm">Nombre de tu pareja</label>}
                        rules={[{ required: isWeddingAccount, message: 'El nombre de tu pareja es requerido' }]}>
                        <Input
                          type="outline"
                          placeholder="Juan"
                          className="h-12 rounded-xl border border-border!"
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
                        label={<label className="text-sm">Apellido de tu pareja</label>}
                        rules={[{ required: isWeddingAccount, message: 'El apellido de tu pareja es requerido' }]}>
                        <Input
                          type="outline"
                          placeholder="Pérez"
                          className="h-12 rounded-xl border border-border!"
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
                    label={<label className="text-sm">Correo Electrónico</label>}
                    rules={[
                      { required: true, message: 'El correo electrónico es requerido' },
                      { type: 'email', message: 'Correo electrónico inválido' },
                    ]}>
                    <Input
                      type="outline"
                      prefix={<Mail className="h-4 w-4 text-muted-foreground" />}
                      placeholder="maria@correo.com"
                      className="h-12 rounded-xl border border-border!"
                    />
                  </Form.Item>

                  <Form.Item
                    name="phone"
                    label={<label className="text-sm">Teléfono</label>}
                    rules={[
                      { required: true, message: 'El teléfono es requerido' },
                      { pattern: /^[\d\s\-\+\(\)]{10,}$/, message: 'Teléfono inválido' },
                    ]}>
                    <Input
                      type="outline"
                      prefix={<Phone className="h-4 w-4 text-muted-foreground" />}
                      placeholder="55 1234 5678"
                      className="h-12 rounded-xl border border-border!"
                    />
                  </Form.Item>

                  <Form.Item
                    name="eventDate"
                    label={<label className="text-sm">Fecha del evento</label>}
                    rules={[{ required: true, message: 'La fecha del evento es requerida' }]}>
                    <DatePicker
                      className="h-12 w-full rounded-xl border border-border!"
                      format="DD MMM YYYY"
                      placeholder="Selecciona la fecha"
                      suffixIcon={<Calendar className="h-4 w-4 text-muted-foreground" />}
                      inputReadOnly
                      disabledDate={(current) => !!current && current < dayjs().startOf('day')}
                    />
                  </Form.Item>

                  <Form.Item
                    name="password"
                    label={<label className="text-sm">Contraseña</label>}
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
                      className="h-12 rounded-xl border border-border!"
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
                    label={<label className="text-sm">Confirmar Contraseña</label>}
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
                      className="h-12 rounded-xl border border-border!"
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
                        <a
                          href="https://pub-659df55516a64947b3e528a4322c71ac.r2.dev/documents/Te%CC%81rminos%20y%20Condiciones%20MesaLista%20Mx.pdf"
                          target="_blank"
                          className="p-0 h-auto text-primary! hover:text-primary/50! text-sm">
                          Términos y Condiciones
                        </a>{' '}
                        y la{' '}
                        <a
                          href="https://pub-659df55516a64947b3e528a4322c71ac.r2.dev/documents/Aviso%20de%20Privacidad%20MesaLista%20Mx.pdf"
                          target="_blank"
                          className="p-0 h-auto text-primary! hover:text-primary/50! text-sm">
                          Política de Privacidad
                        </a>
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
                    <label htmlFor="verificationCode" className="text-sm mb-2 block">
                      Código de verificación
                    </label>
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
                      className="h-14 rounded-xl border border-border! text-center text-2xl tracking-widest font-mono"
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

            {currentStep === 'slug' && (
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
                      <span className="text-[#d4704a]">{slug}</span>
                    </div>
                  </div>
                </div>

                <div className="space-y-4">
                  <label htmlFor="slug" className="text-sm">
                    Personalizar enlace
                  </label>
                  <div className="relative">
                    <Input
                      type="outline"
                      id="slug"
                      value={slug}
                      onChange={(e) => setCoupleSlug(e.target.value.toLowerCase().replace(/\s+/g, '-'))}
                      placeholder="maria-gonzalez"
                      className="h-12 rounded-xl border border-border!"
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

            {currentStep === 'success' && (
              <div className="text-center py-8">
                <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
                  <Check className="h-10 w-10 text-green-600" />
                </div>
                <h1 className="text-3xl sm:text-4xl mb-4 text-foreground">¡Tu mesa está lista para armar!</h1>
                <p className="text-xl text-muted-foreground mb-8">
                  Agrega tus regalos con calma. Nadie puede verla hasta que tú la publiques.
                </p>
                <div className="bg-blue-50 rounded-2xl p-4 text-center">
                  <p className="text-sm text-blue-700">Tu enlace será: mesalista.com/{successSlug || slug}</p>
                </div>
              </div>
            )}

            {/* Action Buttons */}
            {currentStep !== 'success' && (
              <div className="flex justify-end mt-8">
                <Button
                  onClick={handleNext}
                  disabled={isLoading || isCheckingEmail}
                  className="px-8 py-3 bg-[#d4704a]  text-white rounded-full border-0 shadow-lg hover:shadow-xl transition-all duration-300">
                  {isLoading || isCheckingEmail ? (
                    'Procesando...'
                  ) : currentStep === 'slug' ? (
                    'Crear Mi Mesa Gratis'
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
