import { Button } from 'components/core/Button';
import { Badge } from 'components/core/Badge';
import { CheckCircle, Heart, Package, Download, Home, ArrowRight, CreditCard, Mail, Bell, UserCircle } from 'lucide-react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useGetCart } from 'src/hooks/useCart';
import { useOutletContext } from 'react-router-dom';
import { OutletContextType } from '../guest/PublicRegistry';
import { useEffect, useRef } from 'react';
import { useCapturePayPalPayment } from 'src/hooks/usePayment';
import { useResendPaymentToInvitee } from 'src/hooks/useEmail';
import { motion } from 'motion/react';
import { message } from 'antd';
import { useTrackEvent } from 'src/hooks/useAnalyticsTracking';
import { useGiftListBySlug } from 'src/hooks/useGiftList';

export function OrderConfirmation() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const cartId = searchParams.get('cartId');
  const contextData = useOutletContext<OutletContextType>();
  const { slug, regenerateGuestId } = contextData;
  const trackEvent = useTrackEvent();
  const hasTrackedPurchase = useRef(false);

  const { data: weddinglist } = useGiftListBySlug(slug);
  const { data: cartData, isLoading: isLoadingCart, error: cartError } = useGetCart(cartId || '');
  const { mutate: capturePayPalPayment } = useCapturePayPalPayment();
  const { mutate: resendEmail, isPending: isResendingEmail } = useResendPaymentToInvitee();
  const [messageApi, contextHolder] = message.useMessage();

  // Handle PayPal payment capture
  useEffect(() => {
    const paypalOrderId = searchParams.get('token'); // PayPal returns 'token' parameter
    const payerId = searchParams.get('PayerID');

    if (paypalOrderId && payerId && cartData && cartData.status !== 'PAID') {
      // Capture the PayPal payment
      capturePayPalPayment(
        { orderId: paypalOrderId },
        {
          onError: (error) => {
            // Redirect back to checkout on error
            navigate(`/${slug}/checkout`);
          },
        },
      );
    }
  }, [searchParams, cartData, capturePayPalPayment, navigate, slug]);

  // Handle guest ID regeneration when cart is paid
  useEffect(() => {
    if (cartData?.status === 'PAID' && !hasTrackedPurchase.current) {
      localStorage.removeItem('guestId');
      regenerateGuestId();

      // Track gift purchase (only once)
      trackEvent('GIFT_PURCHASE', {
        cartId: cartData.id,
        totalAmount: cartData.totalAmount,
        itemCount: cartData.items?.length || 0,
      });

      hasTrackedPurchase.current = true;
    }
  }, [cartData?.status, cartData?.id, cartData?.totalAmount, cartData?.items?.length]);

  // Handle resend email with rate limiting
  const handleResendEmail = () => {
    if (!cartData.id) {
      messageApi.error('No se encontró el ID del carrito');
      return;
    }

    // Check if email was recently sent
    const resendKey = `email_resend_${cartData.id}`;
    const lastResendTime = localStorage.getItem(resendKey);

    if (lastResendTime) {
      const timeSinceLastResend = Date.now() - parseInt(lastResendTime);
      const twoMinutesInMs = 2 * 60 * 1000; // 2 minutes

      if (timeSinceLastResend < twoMinutesInMs) {
        const remainingSeconds = Math.ceil((twoMinutesInMs - timeSinceLastResend) / 1000);
        const remainingMinutes = Math.floor(remainingSeconds / 60);
        const seconds = remainingSeconds % 60;

        messageApi.warning(
          `Ya se reenvió la confirmación. Podrás reenviar nuevamente en ${remainingMinutes}:${seconds.toString().padStart(2, '0')}`,
        );
        return;
      }
    }

    resendEmail(
      { cartId: cartData.id },
      {
        onSuccess: () => {
          // Store the timestamp of successful resend
          localStorage.setItem(resendKey, Date.now().toString());
          messageApi.success('¡Correo de confirmación reenviado exitosamente!');

          // Auto-clear the localStorage after 2 minutes
          setTimeout(
            () => {
              localStorage.removeItem(resendKey);
            },
            2 * 60 * 1000,
          );
        },
        onError: (error) => {
          messageApi.error(error.message || 'Error al reenviar los correos');
        },
      },
    );
  };

  if (isLoadingCart) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <p className="text-muted-foreground mb-4">Cargando información del pedido...</p>
        </div>
      </div>
    );
  }

  if (cartError || !cartData) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <p className="text-muted-foreground mb-4">No se encontró la información del pedido</p>
          <Button onClick={() => navigate('/')}>Ir al Inicio</Button>
        </div>
      </div>
    );
  }

  return (
    <>
      {contextHolder}
      <div className="min-h-screen bg-white">
        {/* Header */}
        <header className="bg-white border-b border-border/30">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
            <div className="flex items-center justify-center">
              <div className="flex items-center space-x-2">
                <img src="/svg/MesaLista_isologo.svg" className="w-44 h-12" alt="" />
              </div>
            </div>
          </div>
        </header>

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          {/* Success Hero Section */}
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            className="text-center mb-16">
            <div className="inline-flex items-center justify-center w-24 h-24 bg-[#34c759] rounded-full mb-8 shadow-lg">
              <CheckCircle className="h-12 w-12 text-white" />
            </div>

            <h1 className="text-5xl md:text-6xl font-semibold text-foreground mb-6 tracking-tight">¡Pedido completado!</h1>
            <p className="text-xl md:text-2xl text-muted-foreground font-light mb-8 max-w-2xl mx-auto leading-relaxed">
              Tu regalo está en camino hacia {weddinglist?.coupleName}. Gracias por ser parte de su historia de amor.
            </p>

            <div className="inline-flex items-center space-x-3 bg-[#f5f5f7] rounded-full px-6 py-3">
              <Package className="h-5 w-5 text-[#d4704a]" />
              <span className="text-base font-medium text-foreground">Pedido #{cartData.id}</span>
            </div>
          </motion.div>

          <div className="grid grid-cols-1 lg:grid-cols-5 gap-12">
            {/* Main Content */}
            <div className="lg:col-span-3 space-y-12">
              {/* Order Items */}
              <motion.div
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: 0.2 }}
                className="bg-white rounded-3xl p-8 shadow-sm border border-border/30">
                <div className="flex items-center space-x-3 mb-8">
                  <div className="w-10 h-10 bg-[#f5f5f7] rounded-full flex items-center justify-center">
                    <Package className="h-5 w-5 text-[#d4704a]" />
                  </div>
                  <div>
                    <h2 className="text-2xl font-semibold text-foreground tracking-tight">Detalles del pedido</h2>
                    <p className="text-muted-foreground font-light">
                      {cartData.items.length} {cartData.items.length === 1 ? 'regalo' : 'regalos'} para la pareja
                    </p>
                  </div>
                </div>

                <div className="space-y-6">
                  {cartData.items.map((item: any, index: number) => (
                    <motion.div
                      key={item.id}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ duration: 0.5, delay: 0.1 * index }}
                      className="flex gap-6 p-6 bg-[#f5f5f7] rounded-2xl">
                      <img
                        src={item.gift?.imageUrl || '/images/gift_placeholder.png'}
                        alt={item.gift?.title}
                        className="w-20 h-20 object-cover rounded-2xl"
                      />
                      <div className="flex-1">
                        <div className="flex justify-between items-start mb-2">
                          <h3 className="font-semibold text-foreground">{item.gift?.title}</h3>
                          <div className="text-right">
                            <div className="text-sm text-muted-foreground font-light">Cantidad: {item.quantity}</div>
                            <div className="text-lg font-semibold text-foreground">${item?.gift?.price * item?.quantity}</div>
                          </div>
                        </div>
                        <p className="text-sm text-muted-foreground font-light mb-3 leading-relaxed">{item?.gift?.description}</p>
                        {item?.gift?.categories?.map((category: any) => (
                          <Badge key={category.id} variant="secondary" className="bg-white text-muted-foreground border-0">
                            {category.name}
                          </Badge>
                        ))}
                      </div>
                    </motion.div>
                  ))}
                </div>

                <div className="border-t border-border/30 mt-8 pt-8">
                  <div className="space-y-4">
                    <div className="flex justify-between text-base">
                      <span className="text-muted-foreground font-light">Subtotal:</span>
                      <span className="font-medium text-foreground">${cartData.totalAmount}</span>
                    </div>
                    <div className="flex justify-between text-base">
                      <span className="text-muted-foreground font-light">Envío:</span>
                      <span className="font-medium text-foreground">
                        <span className="text-[#34c759]">No Aplica</span>
                      </span>
                    </div>
                    <div className="border-t border-border/30 pt-4">
                      <div className="flex justify-between text-2xl">
                        <span className="font-semibold text-foreground">Total pagado:</span>
                        <span className="font-semibold text-[#34c759]">${cartData.totalAmount}</span>
                      </div>
                    </div>
                  </div>
                </div>
              </motion.div>

              {/* User Information */}
              <motion.div
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: 0.4 }}
                className="bg-white rounded-3xl p-8 shadow-sm border border-border/30">
                <div className="flex items-center space-x-3 mb-8">
                  <div className="w-10 h-10 bg-[#f5f5f7] rounded-full flex items-center justify-center">
                    <UserCircle className="h-5 w-5 text-[#d4704a]" />
                  </div>
                  <div>
                    <h2 className="text-2xl font-semibold text-foreground tracking-tight">Información del invitado</h2>
                    <p className="text-muted-foreground font-light">Detalles del remitente</p>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-1 gap-8 mb-8">
                  <div className="space-y-4">
                    <div>
                      <div className="flex items-center space-x-2 mb-3">
                        <Mail className="h-4 w-4 text-[#d4704a]" />
                        <span className="text-sm font-medium text-foreground">Información del remitente</span>
                      </div>
                      <div className="text-sm text-muted-foreground font-light space-y-1 pl-6">
                        <p>{cartData?.inviteeName}</p>
                        <p>{cartData?.inviteeEmail}</p>
                        <p>{cartData?.phoneNumber}</p>
                      </div>
                    </div>
                  </div>
                </div>

                {cartData?.guestInfo?.message && (
                  <div className="mb-8">
                    <div className="flex items-center space-x-2 mb-3">
                      <Heart className="h-4 w-4 text-[#d4704a]" />
                      <span className="text-sm font-medium text-foreground">Mensaje para la pareja</span>
                    </div>
                    <div className="bg-[#f5f5f7] p-6 rounded-2xl text-base font-light text-foreground leading-relaxed">
                      "{cartData?.guestInfo?.message}"
                    </div>
                  </div>
                )}
              </motion.div>
            </div>

            {/* Sidebar */}
            <div className="lg:col-span-2 space-y-8">
              {/* Order Timeline */}
              <motion.div
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: 0.6 }}
                className="bg-[#f5f5f7] rounded-3xl p-8">
                <h3 className="text-2xl font-semibold text-foreground mb-8 tracking-tight">Estado del pedido</h3>

                <div className="space-y-6">
                  <div className="flex items-start space-x-4">
                    <div className="w-8 h-8 bg-[#34c759] rounded-full flex items-center justify-center flex-shrink-0">
                      <CheckCircle className="h-4 w-4 text-white" />
                    </div>
                    <div className="flex-1">
                      <h4 className="font-medium text-foreground">Pago confirmado</h4>
                      <p className="text-sm text-muted-foreground font-light">Tu pago fue procesado exitosamente</p>
                      <p className="text-xs text-[#34c759] font-medium mt-1">Completado</p>
                    </div>
                  </div>

                  <div className="flex items-start space-x-4">
                    <div className="w-8 h-8 bg-[#d4704a] rounded-full flex items-center justify-center flex-shrink-0">
                      <Mail className="h-4 w-4 text-white" />
                    </div>
                    <div className="flex-1">
                      <h4 className="font-medium text-foreground">Correo de confirmación</h4>
                      <p className="text-sm text-muted-foreground font-light">
                        Enviamos un correo de confirmación. Revisa tu bandeja de SPAM o correo no deseado
                      </p>
                      <p className="text-xs text-[#d4704a] font-medium mt-1">En progreso</p>
                    </div>
                  </div>

                  <div className="flex items-start space-x-4">
                    <div className="w-8 h-8 bg-[#d4704a] rounded-full flex items-center justify-center flex-shrink-0">
                      <Bell className="h-4 w-4 text-white" />
                    </div>
                    <div className="flex-1">
                      <h4 className="font-medium text-muted-foreground">Confirmación para la pareja</h4>
                      <p className="text-sm text-muted-foreground font-light">¡Serán notificados de tu regalo!</p>
                      <p className="text-xs text-[#d4704a] font-medium mt-1">En progreso</p>{' '}
                    </div>
                  </div>
                </div>
              </motion.div>

              {/* Payment Information */}
              <motion.div
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: 0.8 }}
                className="bg-white rounded-3xl p-8 shadow-sm border border-border/30">
                <div className="flex items-center space-x-3 mb-6">
                  <div className="w-10 h-10 bg-[#f5f5f7] rounded-full flex items-center justify-center">
                    <CreditCard className="h-5 w-5 text-[#d4704a]" />
                  </div>
                  <h3 className="text-xl font-semibold text-foreground tracking-tight">Información de pago</h3>
                </div>

                <div className="space-y-4">
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-muted-foreground font-light">Método de pago:</span>
                    <span className="text-sm font-medium text-foreground">
                      {cartData.paymentType === 'STRIPE' ? 'Tarjeta de crédito/débito' : 'PayPal'}
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-muted-foreground font-light">Estado:</span>
                    <Badge className="bg-[#34c759] text-white border-0 font-medium">Aprobado</Badge>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-muted-foreground font-light">Fecha:</span>
                    <span className="text-sm font-medium text-foreground">{new Date().toLocaleDateString('es-MX')}</span>
                  </div>
                </div>
              </motion.div>

              {/* Quick Actions */}
              <motion.div
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: 1.0 }}
                className="space-y-4">
                <div className="grid grid-cols-1 gap-3">
                  <Button
                    variant="outline"
                    className="justify-start h-12 rounded-2xl bg-white border border-border/30 hover:bg-[#f5f5f7] transition-colors"
                    onClick={handleResendEmail}
                    disabled={isResendingEmail}>
                    <Mail className="h-4 w-4 mr-3" />
                    <span className="font-light">{isResendingEmail ? 'Reenviando...' : 'Reenviar confirmación'}</span>
                  </Button>

                  <Button
                    variant="outline"
                    className="justify-start h-12 rounded-2xl bg-white border border-border/30 hover:bg-[#f5f5f7] transition-colors"
                    onClick={() => window.print()}>
                    <Download className="h-4 w-4 mr-3" />
                    <span className="font-light">Descargar comprobante</span>
                  </Button>

                  {/* <Button
                  variant="outline"
                  className="justify-start h-12 rounded-2xl bg-white border border-border/30 hover:bg-[#f5f5f7] transition-colors">
                  <Share2 className="h-4 w-4 mr-3" />
                  <span className="font-light">Compartir regalo</span>
                </Button> */}
                </div>

                <div className="grid grid-cols-1 gap-3 pt-4">
                  <Button
                    className="h-12 bg-[#d4704a] text-white rounded-2xl font-medium border-0 shadow-lg hover:shadow-xl transition-all duration-300"
                    onClick={() => navigate(`/${slug}/regalos${weddinglist?.id ? `?listId=${weddinglist.id}` : ''}`)}>
                    Ver más regalos
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </Button>

                  <Button
                    variant="outline"
                    className="h-12 rounded-2xl bg-white border border-border/30 hover:bg-[#f5f5f7] transition-colors font-light"
                    onClick={() => navigate(`/${slug}`)}>
                    <Home className="h-4 w-4 mr-2" />
                    Ir al inicio
                  </Button>
                </div>
              </motion.div>
            </div>
          </div>

          {/* Footer Message */}
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 1.2 }}
            className="text-center mt-16 p-12 bg-gradient-to-r from-[#d4704a]/5 to-white/5 rounded-3xl border border-border/30">
            <div className="inline-flex items-center justify-center w-16 h-16 bg-[#d4704a]/10 rounded-full mb-6">
              <Heart className="h-8 w-8 text-[#d4704a]" />
            </div>
            <h3 className="text-2xl font-semibold text-foreground mb-4 tracking-tight">Gracias por ser parte de este momento especial</h3>
            <p className="text-lg text-muted-foreground font-light max-w-2xl mx-auto leading-relaxed">
              Tu regalo llegará directamente a {weddinglist?.coupleName}, y seguramente les traerá mucha alegría en su nuevo hogar. Eres
              parte de su historia de amor.
            </p>
          </motion.div>
        </div>
      </div>
    </>
  );
}
