import { useState, useEffect } from 'react';
import { Button } from 'components/core/Button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from 'components/core/Card';
import { Label } from 'components/core/Label';
import { Input } from 'antd';
import { Separator } from 'components/core/Separator';
import { User, ShoppingBag } from 'lucide-react';
import { useOutletContext } from 'react-router-dom';
import { useGetCart } from 'src/hooks/useCart';
import { useCreateCheckoutSession } from 'src/hooks/usePayment';
import { OutletContextType } from '../guest/PublicRegistry';
import { message } from 'antd';
import { useUpdateCartDetails } from 'src/hooks/useCart';

const { TextArea } = Input;

export function Checkout() {
  const contextData = useOutletContext<OutletContextType>();
  const { guestId, coupleSlug } = contextData;

  const { data: cart } = useGetCart(guestId || undefined);
  const { mutate: updateCartDetails } = useUpdateCartDetails();
  const { mutate: createCheckoutSession, isPending: isCreatingSession } = useCreateCheckoutSession();

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
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Form */}
          <div className="lg:col-span-2 space-y-8">
            {/* Guest Information */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <User className="h-5 w-5" />
                  Información del Invitado
                </CardTitle>
                <CardDescription>Ingresa tus datos para que la pareja sepa quién les está regalando</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="name">Nombre Completo *</Label>
                    <Input
                      id="name"
                      value={guestInfo.name}
                      onChange={(e) => setGuestInfo({ ...guestInfo, name: e.target.value })}
                      placeholder="Ej. Juan Pérez"
                      className={`shadow-sm ${errors.name ? 'border-destructive' : ''}`}
                    />
                    {errors.name && <p className="text-md text-destructive">{errors.name}</p>}
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="email">Correo Electrónico *</Label>
                    <Input
                      id="email"
                      type="email"
                      value={guestInfo.email}
                      onChange={(e) => setGuestInfo({ ...guestInfo, email: e.target.value })}
                      placeholder="juan@correo.com"
                      className={`shadow-sm ${errors.email ? 'border-destructive' : ''}`}
                    />
                    {errors.email && <p className="text-md text-destructive">{errors.email}</p>}
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="phone">Teléfono *</Label>
                  <Input
                    id="phone"
                    value={guestInfo.phone}
                    onChange={(e) => setGuestInfo({ ...guestInfo, phone: e.target.value })}
                    placeholder="55 1234 5678"
                    className={`shadow-sm ${errors.phone ? 'border-destructive' : ''}`}
                  />
                  {errors.phone && <p className="text-md text-destructive">{errors.phone}</p>}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="message">Mensaje para la Pareja (Opcional)</Label>
                  <TextArea
                    className="shadow-sm"
                    id="message"
                    value={guestInfo.message}
                    onChange={(e) => setGuestInfo({ ...guestInfo, message: e.target.value })}
                    placeholder="Escribe un mensaje especial..."
                    rows={3}
                  />
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Order Summary */}
          <div className="lg:col-span-1">
            <Card className="sticky top-4">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <ShoppingBag className="h-5 w-5" />
                  Resumen de Compra
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-3">
                  {cart?.items?.map((item: any) => (
                    <div key={item.id} className="flex gap-3">
                      <img
                        src={item.gift?.imageUrl || '/images/gift_placeholder.png'}
                        alt={item.gift?.title}
                        className="w-12 h-12 object-cover rounded-md"
                      />
                      <div className="flex-1 min-w-0">
                        <h4 className="text-md truncate">{item.gift?.title}</h4>
                        <p className="text-xs text-muted-foreground">Cantidad: {item.quantity}</p>
                        <p className="text-md">${((item.gift?.price || 0) * item.quantity).toLocaleString()}</p>
                      </div>
                    </div>
                  ))}
                </div>

                <Separator />

                <div className="space-y-2">
                  <div className="flex justify-between text-md">
                    <span>Subtotal:</span>
                    <span>${cartTotal.toLocaleString()}</span>
                  </div>
                  <Separator />
                  <div className="flex justify-between">
                    <span>Total:</span>
                    <span className="text-primary">${finalTotal.toLocaleString()}</span>
                  </div>
                </div>

                <Button className="w-full" onClick={handleContinue} disabled={isCreatingSession}>
                  {isCreatingSession ? 'Redirigiendo a pago...' : 'Pagar con Stripe'}
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}
