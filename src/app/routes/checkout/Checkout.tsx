import { useState, useEffect } from 'react';
import { Button } from 'components/core/Button';
import { CardHeader, CardTitle } from 'components/core/Card';
import { Separator } from 'components/core/Separator';
import { User, ShoppingBag, ArrowRight, CheckCircle } from 'lucide-react';
import { useOutletContext } from 'react-router-dom';
import { useGetCart } from 'src/hooks/useCart';
import { useCreateCheckoutSession } from 'src/hooks/usePayment';
import { OutletContextType } from '../guest/PublicRegistry';
import { message, Card as AntCard, Input, Button as AntButton } from 'antd';
import { useUpdateCartDetails } from 'src/hooks/useCart';
import { motion } from 'motion/react';
import { useWeddingListBySlug } from 'src/hooks/useWeddingList';

const { TextArea } = Input;

export function Checkout() {
  const contextData = useOutletContext<OutletContextType>();
  const { guestId, coupleSlug } = contextData;

  const { data: cart } = useGetCart(guestId || undefined);
  const { mutate: updateCartDetails } = useUpdateCartDetails();
  const { mutate: createCheckoutSession, isPending: isCreatingSession } = useCreateCheckoutSession();
  const { data: weddinglist } = useWeddingListBySlug(coupleSlug);

  const coupleName = weddinglist?.coupleName;

  const [guestInfo, setGuestInfo] = useState({
    name: '',
    email: '',
    phone: '',
    message: '',
  });

  const [errors, setErrors] = useState<Record<string, string>>({});

  // Scroll to top when component loads
  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  const cartTotal = cart?.items?.reduce((sum: number, item: any) => sum + (item.gift?.price || 0) * item.quantity, 0) || 0;
  const finalTotal = cartTotal;

  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    // Guest info validation
    if (!guestInfo.name.trim()) newErrors.name = 'El nombre es requerido';
    if (!guestInfo.email.trim()) newErrors.email = 'El correo electrónico es requerido';
    else if (!/\S+@\S+\.\S+/.test(guestInfo.email)) newErrors.email = 'Correo electrónico inválido';
    if (!guestInfo.phone.trim()) newErrors.phone = 'El teléfono es requerido';
    else if (!/^\d{10}$/.test(guestInfo.phone.replace(/\D/g, ''))) newErrors.phone = 'Teléfono debe tener 10 dígitos';

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleContinue = () => {
    if (!validateForm()) return;

    if (!cart?.id) {
      message.error('No se encontró el carrito');
      return;
    }

    const baseUrl = window.location.origin;

    // Update cart details first, then redirect to Stripe checkout
    updateCartDetails(
      {
        cartItemId: cart.id,
        details: {
          inviteeName: guestInfo.name,
          inviteeEmail: guestInfo.email,
          phoneNumber: guestInfo.phone,
          message: guestInfo.message,
        },
      },
      {
        onSuccess: () => {
          createCheckoutSession(
            {
              cartId: cart.id,
              successUrl: `${baseUrl}/${coupleSlug}/confirmation?cartId=${cart.sessionId}`,
              cancelUrl: `${baseUrl}/${coupleSlug}/checkout`,
              orderId: cart.id,
            },
            {
              onSuccess: (checkoutResponse) => {
                if (checkoutResponse.success && checkoutResponse.url) {
                  // Redirect to Stripe hosted checkout
                  window.location.href = checkoutResponse.url;
                } else {
                  message.error('Error al crear la sesión de pago');
                }
              },
              onError: (error) => {
                console.error('Error creating checkout session:', error);
                message.error('Error al crear la sesión de pago');
              },
            },
          );
        },
      },
    );
  };

  return (
    <div className="min-h-screen bg-muted/30">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 lg:grid-cols-5 gap-12">
          {/* Main Form */}
          <div className="lg:col-span-3 space-y-12">
            {/* Page Title */}
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6 }}>
              <h1 className="text-4xl md:text-5xl font-semibold text-foreground mb-4 tracking-tight">Información de remitente</h1>
              <p className="text-xl text-muted-foreground font-light leading-relaxed">
                Completa tus datos para que {coupleName} reciban tu regalo especial.
              </p>
            </motion.div>

            {/* Guest Information */}
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.2 }}
              className="bg-white rounded-3xl p-8 shadow-sm border border-border/30">
              <div className="flex items-center space-x-3 mb-8">
                <div className="w-10 h-10 bg-[#f5f5f7] rounded-full flex items-center justify-center">
                  <User className="h-5 w-5 text-[#d4704a]" />
                </div>
                <div>
                  <h2 className="text-2xl font-semibold text-foreground tracking-tight">Información del invitado</h2>
                  <p className="text-muted-foreground font-light">Para que la pareja sepa quién les está enviando este regalo</p>
                </div>
              </div>

              <div className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <label htmlFor="name" className="text-sm font-medium text-foreground">
                      Nombre completo *
                    </label>
                    <Input
                      id="name"
                      value={guestInfo.name}
                      onChange={(e) => setGuestInfo({ ...guestInfo, name: e.target.value })}
                      placeholder="Tu nombre completo"
                      className={`!bg-[#f5f5f7] border-0 rounded-2xl h-12 text-base font-light focus:ring-[#007aff] ${
                        errors.name ? 'ring-2 ring-[#ff3b30]' : ''
                      }`}
                    />
                    {errors.name && <p className="text-sm text-[#ff3b30] font-light">{errors.name}</p>}
                  </div>

                  <div className="space-y-2">
                    <label htmlFor="email" className="text-sm font-medium text-foreground">
                      Correo electrónico *
                    </label>
                    <Input
                      id="email"
                      type="email"
                      value={guestInfo.email}
                      onChange={(e) => setGuestInfo({ ...guestInfo, email: e.target.value })}
                      placeholder="tu@correo.com"
                      className={`!bg-[#f5f5f7] border-0 rounded-2xl h-12 text-base font-light focus:ring-[#007aff] ${
                        errors.email ? 'ring-2 ring-[#ff3b30]' : ''
                      }`}
                    />
                    {errors.email && <p className="text-sm text-[#ff3b30] font-light">{errors.email}</p>}
                  </div>
                </div>

                <div className="space-y-2">
                  <label htmlFor="phone" className="text-sm font-medium text-foreground">
                    Teléfono *
                  </label>
                  <Input
                    id="phone"
                    value={guestInfo.phone}
                    onChange={(e) => setGuestInfo({ ...guestInfo, phone: e.target.value })}
                    placeholder="55 1234 5678"
                    className={`!bg-[#f5f5f7] border-0 rounded-2xl h-12 text-base font-light focus:ring-[#007aff] ${
                      errors.phone ? 'ring-2 ring-[#ff3b30]' : ''
                    }`}
                  />
                  {errors.phone && <p className="text-sm text-[#ff3b30] font-light">{errors.phone}</p>}
                </div>

                <div className="space-y-2">
                  <label htmlFor="message" className="text-sm font-medium text-foreground">
                    Mensaje para la pareja (opcional)
                  </label>
                  <TextArea
                    id="message"
                    value={guestInfo.message}
                    onChange={(e) => setGuestInfo({ ...guestInfo, message: e.target.value })}
                    placeholder="Escribe un mensaje especial para María y Carlos..."
                    rows={4}
                    className="!bg-[#f5f5f7] border-0 rounded-2xl text-base font-light focus:ring-[#007aff] resize-none"
                  />
                </div>
              </div>
            </motion.div>
          </div>

          {/* Order Summary */}
          <div className="lg:col-span-2">
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.6 }}
              className="sticky top-24">
              <div className="bg-[#f5f5f7] rounded-3xl p-8">
                <h3 className="text-2xl font-semibold text-foreground mb-8 tracking-tight">Resumen de compra</h3>

                <div className="space-y-6 mb-8">
                  {cart?.items?.map((item: any) => (
                    <div key={item.id} className="flex gap-4">
                      <div className="relative">
                        <img
                          src={item.gift?.imageUrl || '/images/gift_placeholder.png'}
                          alt={item.gift?.title}
                          className="w-16 h-16 object-cover rounded-2xl"
                        />
                        <div className="absolute -top-2 -right-2 w-6 h-6 bg-[#d4704a] rounded-full flex items-center justify-center">
                          <span className="text-xs text-white font-medium">{item.quantity}</span>
                        </div>
                      </div>
                      <div className="flex-1 min-w-0">
                        <h4 className="font-medium text-foreground truncate">{item.gift?.title}</h4>
                        <p className="text-sm text-muted-foreground font-light">Cantidad: {item.quantity}</p>
                        <p className="text-lg font-semibold text-foreground mt-1">
                          ${((item.gift?.price || 0) * item.quantity).toLocaleString()}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>

                <div className="border-t border-border/30 pt-6 space-y-4">
                  <div className="border-t border-border/30 pt-4">
                    <div className="flex justify-between text-xl">
                      <span className="font-semibold text-foreground">Total:</span>
                      <span className="font-semibold text-[#d4704a]">${finalTotal.toLocaleString()}</span>
                    </div>
                  </div>
                </div>

                <Button
                  disabled={isCreatingSession}
                  className="w-full mt-8 bg-[#d4704a] hover:bg-[#d4704a] text-white rounded-full h-12 text-base font-medium border-0 shadow-lg hover:shadow-xl transition-all duration-300"
                  onClick={handleContinue}>
                  {isCreatingSession ? 'Redirigiendo a pago...' : 'Pagar con Stripe'}
                  <ArrowRight className="ml-2 h-5 w-5" />
                </Button>

                <div className="mt-6 space-y-2">
                  <div className="flex items-center space-x-2 text-sm text-muted-foreground">
                    <CheckCircle className="h-4 w-4 text-[#34c759]" />
                    <span className="font-light">Pagos 100% seguros</span>
                  </div>
                </div>
              </div>
            </motion.div>
          </div>
        </div>
      </div>
    </div>
  );
}
