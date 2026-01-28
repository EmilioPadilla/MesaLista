import { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { message } from 'antd';
import { Check, Loader2 } from 'lucide-react';
import { Button } from 'components/core/Button';
import { useCreateUser, useLogin } from 'hooks/useUser';
import { useCreateGiftList } from 'hooks/useGiftList';
import { useTrackEvent } from 'hooks/useAnalyticsTracking';

function SignupSuccess() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [isVerifying, setIsVerifying] = useState(true);
  const [paymentSuccess, setPaymentSuccess] = useState(false);
  const sessionId = searchParams.get('session_id');
  const { mutateAsync: createUser, isSuccess: isSuccessCreatedUser } = useCreateUser();
  const { mutateAsync: createGiftList } = useCreateGiftList();
  const { mutateAsync: login, isSuccess: isSuccessLogin, isError: isFailedLogin } = useLogin();
  const trackEvent = useTrackEvent();

  const retrieveInfo = () => {
    const pendingUserDataStr = sessionStorage.getItem('pendingUserData');
    if (!pendingUserDataStr) {
      message.error('No se encontraron los datos de la cuenta');
      setIsVerifying(false);
      return;
    }

    const pendingUserData = JSON.parse(pendingUserDataStr);
    return pendingUserData;
  };

  useEffect(() => {
    if (!sessionId) {
      message.error('No se encontró la sesión de pago');
      setIsVerifying(false);
      return;
    }

    const userData = retrieveInfo();

    login({
      email: userData.email,
      password: userData.password,
    });
  }, [sessionId]);

  const goToCouplePage = async () => {
    const userData = retrieveInfo();

    setIsVerifying(false);
    // If login succeeds, account already exists
    sessionStorage.removeItem('pendingUserData');
    setPaymentSuccess(true);
    setIsVerifying(false);

    // Track registry purchase
    trackEvent('REGISTRY_PURCHASE', {
      planType: userData.planType,
      slug: userData.slug,
    });

    // Redirect to user's registry after 3 seconds
    setTimeout(() => {
      if (userData.slug) {
        navigate(`/${userData.slug}`);
      } else {
        message.error('Something failed when creating your user');
      }
    }, 6000);
  };

  const createUserAndLogin = async () => {
    const userData = retrieveInfo();
    // Verify Information before creating user
    if (
      !userData.email ||
      !userData.password ||
      !userData.firstName ||
      !userData.lastName ||
      !userData.planType ||
      !userData.slug ||
      !userData.phoneNumber ||
      !userData.role
    ) {
      message.error('Faltan datos para crear la cuenta');
      setIsVerifying(false);
      return;
    }

    // Create user WITHOUT planType (it goes to GiftList now)
    const { planType, discountCode, ...userDataWithoutPlan } = userData;
    const createdUser = await createUser(userDataWithoutPlan);

    // Create GiftList with planType and discountCodeId
    if (createdUser) {
      const coupleName = userData.spouseFirstName
        ? `${userData.firstName} y ${userData.spouseFirstName}`
        : `${userData.firstName} ${userData.lastName}`;

      await createGiftList({
        userId: createdUser.id,
        title: `Mesa de Regalos de ${coupleName}`,
        coupleName: coupleName,
        eventDate: new Date(Date.now() + 180 * 24 * 60 * 60 * 1000).toISOString(), // 6 months from now
        planType: planType,
        discountCodeId: discountCode?.id,
      });
    }
  };

  useEffect(() => {
    if (isSuccessLogin) {
      goToCouplePage();
    }
  }, [isSuccessLogin]);

  useEffect(() => {
    if (isFailedLogin) {
      createUserAndLogin();
    }
  }, [isFailedLogin]);

  useEffect(() => {
    if (isSuccessCreatedUser) {
      const userData = retrieveInfo();

      login({
        email: userData.email,
        password: userData.password,
      });
    }
  }, [isSuccessCreatedUser]);

  if (isVerifying) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="h-12 w-12 text-[#d4704a] animate-spin mx-auto mb-4" />
          <h2 className="text-2xl font-semibold text-foreground mb-2">Procesando pago y creando cuenta...</h2>
          <p className="text-muted-foreground">Por favor espera un momento</p>
        </div>
      </div>
    );
  }

  if (!paymentSuccess) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="max-w-md mx-auto px-4">
          <div className="bg-white rounded-3xl shadow-sm border border-border/30 p-8 text-center">
            <div className="w-20 h-20 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-6">
              <span className="text-4xl">❌</span>
            </div>
            <h1 className="text-3xl font-bold mb-4 text-foreground">Error en el pago</h1>
            <p className="text-xl text-muted-foreground mb-8">Hubo un problema al procesar tu pago. Por favor intenta de nuevo.</p>
            <Button onClick={() => navigate('/registro')} className="px-8 py-3 bg-[#d4704a] text-white rounded-full">
              Volver al registro
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background flex items-center justify-center">
      <div className="max-w-md mx-auto px-4">
        <div className="bg-white rounded-3xl shadow-sm border border-border/30 p-8 text-center">
          <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
            <Check className="h-10 w-10 text-green-600" />
          </div>
          <h1 className="text-3xl font-bold mb-4 text-foreground">¡Pago exitoso!</h1>
          <p className="text-xl text-muted-foreground mb-4">Tu cuenta ha sido creada y tu pago ha sido procesado correctamente.</p>
          <p className="text-muted-foreground mb-8">Serás redirigido a tu mesa de regalos en unos segundos...</p>
          <div className="bg-[#d4704a]/10 rounded-2xl p-4">
            <p className="text-sm text-[#d4704a] font-semibold">✓ Plan Fijo activado</p>
            <p className="text-xs text-muted-foreground mt-1">Sin comisiones por ventas</p>
          </div>
        </div>
      </div>
    </div>
  );
}

export default SignupSuccess;
