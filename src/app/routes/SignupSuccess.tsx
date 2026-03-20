import { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { message } from 'antd';
import { Check, Loader2 } from 'lucide-react';
import { Button } from 'components/core/Button';
import { useCompletePlanSignupSession } from 'hooks/usePayment';
import { useTrackEvent } from 'hooks/useAnalyticsTracking';

function SignupSuccess() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [isVerifying, setIsVerifying] = useState(true);
  const [paymentSuccess, setPaymentSuccess] = useState(false);
  const [signupSlug, setSignupSlug] = useState('');
  const sessionId = searchParams.get('session_id');
  const { mutateAsync: completePlanSignupSession } = useCompletePlanSignupSession();
  const trackEvent = useTrackEvent();

  useEffect(() => {
    const finalizeSignup = async () => {
      if (!sessionId) {
        message.error('No se encontró la sesión de pago');
        setIsVerifying(false);
        return;
      }

      try {
        const result = await completePlanSignupSession({ sessionId });

        sessionStorage.removeItem('pendingUserData');
        setSignupSlug(result.slug);
        setPaymentSuccess(true);
        setIsVerifying(false);

        trackEvent('REGISTRY_PURCHASE', {
          planType: result.planType,
          slug: result.slug,
        });

        setTimeout(() => {
          if (result.slug) {
            navigate(`/${result.slug}`);
          } else {
            message.error('Something failed when creating your user');
          }
        }, 6000);
      } catch (error: any) {
        console.error('Error completing plan signup:', error);
        message.error(error.response?.data?.message || 'Hubo un problema al procesar tu pago. Por favor intenta de nuevo.');
        setIsVerifying(false);
      }
    };

    finalizeSignup();
  }, [sessionId]);

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
            <p className="text-xs text-muted-foreground mt-1">Tu enlace: mesalista.com/{signupSlug}</p>
          </div>
        </div>
      </div>
    </div>
  );
}

export default SignupSuccess;
