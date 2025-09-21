import { Button } from 'components/core/Button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from 'components/core/Card';
import { Badge } from 'components/core/Badge';
import { Separator } from 'components/core/Separator';
import { CheckCircle, Heart, Package, Download, Home } from 'lucide-react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useGetCart } from 'src/hooks/useCart';
import { useOutletContext } from 'react-router-dom';
import { OutletContextType } from '../guest/PublicRegistry';
import { useWeddingListBySlug } from 'src/hooks/useWeddingList';
import { useEffect } from 'react';
import { useCapturePayPalPayment } from 'src/hooks/usePayment';

export function OrderConfirmation() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const cartId = searchParams.get('cartId');
  const contextData = useOutletContext<OutletContextType>();
  const { coupleSlug, regenerateGuestId } = contextData;

  const { data: weddinglist } = useWeddingListBySlug(coupleSlug);
  const { data: cartData, isLoading: isLoadingCart, error: cartError } = useGetCart(cartId || '');
  const { mutate: capturePayPalPayment } = useCapturePayPalPayment();

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
            navigate(`/${coupleSlug}/checkout`);
          },
        },
      );
    }
  }, [searchParams, cartData, capturePayPalPayment, navigate, coupleSlug]);

  // Handle guest ID regeneration when cart is paid
  useEffect(() => {
    if (cartData?.status === 'PAID') {
      localStorage.removeItem('guestId');
      regenerateGuestId();
    }
  }, [cartData?.status, regenerateGuestId]);

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

  const getPaymentMethodName = (method: string) => {
    switch (method) {
      case 'card':
        return 'Tarjeta de Crédito/Débito';
      case 'transfer':
        return 'Transferencia Bancaria';
      case 'digital':
        return 'Billetera Digital';
      default:
        return 'Método de Pago';
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 to-primary/5">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Success Header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-20 h-20 bg-green-500 rounded-full mb-6">
            <CheckCircle className="h-10 w-10 text-white" />
          </div>

          <h1 className="text-3xl text-primary mb-2">¡Compra Exitosa! 🎉</h1>
          <p className="text-xl text-muted-foreground mb-4">Gracias por tu regalo para {weddinglist?.coupleName}</p>

          <div className="flex items-center justify-center space-x-2">
            <Heart className="h-5 w-5 text-primary" />
            <span className="text-lg text-primary">MesaLista</span>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Order Details */}
          <div className="lg:col-span-2 space-y-6">
            {/* Order Summary */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Package className="h-5 w-5" />
                  Detalles del Pedido
                </CardTitle>
                <CardDescription>Pedido #{cartData?.id}</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-3">
                  {cartData?.items?.map((item: any) => (
                    <div key={item.id} className="flex gap-4 p-3 bg-muted/30 rounded-lg">
                      <img
                        src={item?.gift?.imageUrl || '/images/gift_placeholder.png'}
                        alt={item?.gift?.title}
                        className="w-16 h-16 object-cover rounded-md"
                      />
                      <div className="flex-1">
                        <h4 className="!text-md mb-1">{item?.gift?.title}</h4>
                        <div className="flex justify-between items-center">
                          <div className="text-right">
                            <p className="text-xs text-muted-foreground">Cantidad: {item?.quantity}</p>
                            <p className="!text-md">${item?.gift?.price * item?.quantity}</p>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>

                <Separator />

                <div className="space-y-2">
                  <div className="flex justify-between !text-md">
                    <span>Subtotal:</span>
                    <span>${cartData?.totalAmount}</span>
                  </div>
                  <Separator />
                  <div className="flex justify-between text-lg">
                    <span>Total Pagado:</span>
                    <span className="text-green-600">${cartData?.totalAmount}</span>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Footer Message */}
            <div className="text-center mt-12 p-6 bg-card rounded-lg border">
              <Heart className="h-8 w-8 text-primary mx-auto mb-4" />
              <h3 className="text-lg mb-2">¡Gracias por ser parte de este momento especial!</h3>
              <p className="text-muted-foreground">
                Tu regalo llegará directamente a {weddinglist?.coupleName}, y seguramente les traerá mucha alegría en su nuevo hogar.
              </p>
            </div>
          </div>

          {/* Actions Sidebar */}
          <div className="lg:col-span-1 space-y-6">
            {/* Next Steps */}
            <Card>
              <CardHeader>
                <CardTitle>¿Qué sigue?</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-3">
                  <div className="flex items-start gap-3">
                    <div className="w-6 h-6 bg-green-500 rounded-full flex items-center justify-center text-white text-xs">1</div>
                    <div>
                      <p className="!text-md">Confirmación por correo</p>
                      <p className="text-xs text-muted-foreground">Te enviamos los detalles a tu email</p>
                    </div>
                  </div>

                  <div className="flex items-start gap-3">
                    <div className="w-6 h-6 bg-muted rounded-full flex items-center justify-center text-muted-foreground text-xs">3</div>
                    <div>
                      <p className="!text-md">Confirmación de la pareja</p>
                      <p className="text-xs text-muted-foreground">¡Tan pronto como puedan!</p>
                    </div>
                  </div>
                </div>

                <Separator />

                <div className="space-y-2">
                  {/* <Button variant="outline" className="w-full justify-start" size="sm">
                    <Mail className="h-4 w-4 mr-2" />
                    Reenviar confirmación
                  </Button> */}

                  <Button variant="outline" className="w-full justify-start" size="sm" onClick={() => window.print()}>
                    <Download className="h-4 w-4 mr-2" />
                    Descargar comprobante
                  </Button>

                  {/* <Button variant="outline" className="w-full justify-start" size="sm">
                    <Share2 className="h-4 w-4 mr-2" />
                    Compartir regalo
                  </Button> */}
                </div>
              </CardContent>
            </Card>

            {/* Payment Info */}
            <Card>
              <CardHeader>
                <CardTitle>Información de Pago</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                <div className="flex justify-between !text-md">
                  <span>Método de pago:</span>
                  <span>{getPaymentMethodName(cartData?.paymentMethod)}</span>
                </div>
                <div className="flex justify-between !text-md">
                  <span>Estado:</span>
                  <Badge className="bg-green-500">Aprobado</Badge>
                </div>
                <div className="flex justify-between !text-md">
                  <span>Fecha:</span>
                  <span>{new Date().toLocaleDateString('es-MX')}</span>
                </div>
              </CardContent>
            </Card>

            {/* Actions */}
            <div className="space-y-3 print:hidden">
              <Button className="w-full" onClick={() => navigate(`/${coupleSlug}/regalos`)}>
                Ver Más Regalos
              </Button>

              <Button variant="outline" className="w-full" onClick={() => navigate(`/${coupleSlug}`)}>
                <Home className="h-4 w-4 mr-2" />
                Ir al Inicio
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
