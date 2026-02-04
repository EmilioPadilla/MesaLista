import { useState } from 'react';
import { Button, Input, Card, Badge, Radio, DatePicker, Space, message, Form } from 'antd';
import {
  ArrowLeftOutlined,
  ArrowRightOutlined,
  CalendarOutlined,
  UserOutlined,
  GiftOutlined,
  DollarOutlined,
  CheckOutlined,
  CreditCardOutlined,
  SafetyOutlined,
  StarOutlined,
} from '@ant-design/icons';
import dayjs from 'dayjs';
import { useNavigate } from 'react-router-dom';
import { useCurrentUser } from 'src/hooks/useUser';
import { useCreateGiftList } from 'src/hooks/useGiftList';
import { useCreateGiftListCheckoutSession } from 'src/hooks/usePayment';
import { PlanType } from '@prisma/client';
import { MLButton } from 'src/components/core/MLButton';

type Step = 'details' | 'pricing' | 'payment' | 'confirmation';

export function CreateNewList() {
  const navigate = useNavigate();
  const handleGoPreviousPage = () => navigate(-1);
  const [currentStep, setCurrentStep] = useState<Step>('details');
  const { data: user } = useCurrentUser();
  const { mutateAsync: createGiftList } = useCreateGiftList();
  const { mutateAsync: createGiftListCheckout } = useCreateGiftListCheckoutSession();

  const [form] = Form.useForm();

  // Form state
  const [listName, setListName] = useState('');
  const [coupleNames, setCoupleNames] = useState('');
  const [eventDate, setEventDate] = useState('');
  const [eventType, setEventType] = useState('wedding');
  const [estimatedGuests, setEstimatedGuests] = useState('');
  const [pricingPlan, setPricingPlan] = useState<'fixed' | 'commission'>('fixed');

  const handleBack = () => {
    if (currentStep === 'details') {
      handleGoPreviousPage();
    } else if (currentStep === 'pricing') {
      setCurrentStep('details');
    } else if (currentStep === 'payment') {
      setCurrentStep('pricing');
    }
  };

  const handleCreateList = async () => {
    if (!user) return;

    try {
      const coupleName = user.spouseFirstName ? `${user.firstName} y ${user.spouseFirstName}` : `${user.firstName} ${user.lastName}`;

      const giftListData = {
        userId: user.id,
        title: listName,
        description: '',
        coupleName: coupleName,
        eventDate: new Date(eventDate).toISOString(),
      };

      // If fixed plan, redirect to payment FIRST
      if (pricingPlan === 'fixed') {
        // Store gift list data in sessionStorage to create list after payment
        sessionStorage.setItem('pendingGiftListData', JSON.stringify(giftListData));

        const baseUrl = window.location.origin;
        const checkoutResponse = await createGiftListCheckout({
          userId: user.id,
          planType: 'FIXED',
          giftListData: giftListData,
          successUrl: `${baseUrl}/${user.slug}/colecciones?payment=success&session_id={CHECKOUT_SESSION_ID}`,
          cancelUrl: `${baseUrl}/${user.slug}/crear-lista?payment=cancelled`,
        });

        if (checkoutResponse.success && checkoutResponse.url) {
          // Redirect to Stripe checkout
          window.location.href = checkoutResponse.url;
        } else {
          message.error('Error al crear la sesión de pago');
        }
      } else {
        // Commission plan - no payment needed, create list directly
        await createGiftList({
          ...giftListData,
          planType: 'COMMISSION' as PlanType,
        });

        message.success('¡Lista creada exitosamente!');
        form.resetFields();
        setCurrentStep('confirmation');
      }
    } catch (error: any) {
      console.error('Error creating gift list:', error);
      message.error(error.response?.data?.error || 'Error al crear la lista');
    }
  };

  const handleFinish = () => {
    navigate('wedding-lists');
  };

  const canProceed = () => {
    if (currentStep === 'details') {
      return listName && coupleNames && eventDate;
    }
    if (currentStep === 'pricing') {
      return pricingPlan;
    }
    return true;
  };

  const handleNext = () => {
    if (currentStep === 'details') {
      setCurrentStep('pricing');
    } else if (currentStep === 'pricing') {
      if (pricingPlan === 'fixed') {
        setCurrentStep('payment');
      } else {
        handleCreateList();
      }
    } else if (currentStep === 'payment') {
      handleCreateList();
    }
  };

  const renderStepIndicator = () => {
    const steps = [
      { id: 'details', label: 'Detalles', icon: GiftOutlined },
      { id: 'pricing', label: 'Plan', icon: DollarOutlined },
      ...(pricingPlan === 'fixed' ? [{ id: 'payment', label: 'Pago', icon: CreditCardOutlined }] : []),
      { id: 'confirmation', label: 'Listo', icon: CheckOutlined },
    ];

    const currentIndex = steps.findIndex((s) => s.id === currentStep);

    return (
      <div className="mb-12">
        <div className="flex items-center justify-center">
          {steps.map((step, index) => {
            const StepIcon = step.icon;
            const isActive = step.id === currentStep;
            const isCompleted = index < currentIndex;

            return (
              <div key={step.id} className="flex items-center">
                <div className="flex flex-col items-center">
                  <div
                    className={`w-12 h-12 rounded-full flex items-center justify-center transition-all duration-300 ${
                      isActive ? 'bg-[#d4704a] shadow-lg' : isCompleted ? 'bg-[#d4704a]' : 'bg-[#f5f5f7]'
                    }`}>
                    <StepIcon className={`text-xl ${isActive || isCompleted ? 'text-white!' : 'text-gray-400!'}`} />
                  </div>
                  <span className={`text-xs mt-2 font-light ${isActive ? 'text-foreground font-medium' : 'text-gray-500'}`}>
                    {step.label}
                  </span>
                </div>
                {index < steps.length - 1 && (
                  <div
                    className={`w-16 h-0.5 mx-2 mb-6 transition-all duration-300 ${index < currentIndex ? 'bg-[#d4704a]' : 'bg-[#f5f5f7]'}`}
                  />
                )}
              </div>
            );
          })}
        </div>
      </div>
    );
  };

  const renderDetailsStep = () => (
    <div className="max-w-2xl mx-auto">
      <div className="text-center mb-8">
        <h2 className="text-3xl font-light text-foreground mb-3">Detalles de tu Lista</h2>
        <p className="text-gray-500 font-light">Cuéntanos sobre tu evento especial</p>
      </div>

      <Card className="shadow-lg" style={{ borderRadius: '24px', border: 'none' }}>
        <Space direction="vertical" size="large" style={{ width: '100%' }}>
          <div>
            <label className="block text-sm font-medium mb-2">Nombre de la Lista</label>
            <Input
              value={listName}
              onChange={(e) => setListName(e.target.value)}
              placeholder="Ej: Boda de Ana y Carlos"
              size="large"
              style={{ borderRadius: '12px', backgroundColor: '#f5f5f7', border: 'none' }}
            />
            <p className="text-xs text-gray-500 font-light mt-1">Este nombre es para tu referencia interna</p>
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">Nombres de la Pareja</label>
            <Input
              value={coupleNames}
              onChange={(e) => setCoupleNames(e.target.value)}
              placeholder="Ej: Ana y Carlos"
              size="large"
              style={{ borderRadius: '12px', backgroundColor: '#f5f5f7', border: 'none' }}
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium mb-2">Fecha del Evento</label>
              <DatePicker
                value={eventDate ? dayjs(eventDate) : null}
                onChange={(date) => setEventDate(date ? date.format('YYYY-MM-DD') : '')}
                placeholder="Selecciona fecha"
                size="large"
                suffixIcon={<CalendarOutlined />}
                style={{ width: '100%', borderRadius: '12px', backgroundColor: '#f5f5f7', border: 'none' }}
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">Invitados Estimados</label>
              <Input
                type="number"
                value={estimatedGuests}
                onChange={(e) => setEstimatedGuests(e.target.value)}
                placeholder="100"
                size="large"
                suffix={<UserOutlined />}
                style={{ borderRadius: '12px', backgroundColor: '#f5f5f7', border: 'none' }}
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">Tipo de Evento</label>
            <Radio.Group value={eventType} onChange={(e) => setEventType(e.target.value)} style={{ width: '100%' }}>
              <div className="grid grid-cols-2 gap-4">
                {[
                  { value: 'wedding', label: 'Boda' },
                  { value: 'anniversary', label: 'Aniversario' },
                  { value: 'birthday', label: 'Cumpleaños' },
                  { value: 'baby-shower', label: 'Baby Shower' },
                ].map((type) => (
                  <div
                    key={type.value}
                    className={`flex items-center p-4 rounded-xl border-2 cursor-pointer transition-all ${
                      eventType === type.value ? 'border-[#d4704a] bg-[#d4704a]/5' : 'border-gray-200 hover:border-[#d4704a]/50'
                    }`}
                    onClick={() => setEventType(type.value)}>
                    <Radio value={type.value} className="flex-1">
                      {type.label}
                    </Radio>
                  </div>
                ))}
              </div>
            </Radio.Group>
          </div>
        </Space>
      </Card>
    </div>
  );

  const renderPricingStep = () => (
    <div className="max-w-4xl mx-auto">
      <div className="text-center mb-8">
        <h2 className="text-3xl font-light text-foreground mb-3">Selecciona tu Plan</h2>
        <p className="text-gray-500 font-light">Elige el modelo de pago que mejor se adapte a ti</p>
      </div>

      <div className="grid md:grid-cols-2 gap-6">
        {/* Fixed Plan */}
        <Card
          className={`cursor-pointer transition-all duration-300 ${pricingPlan === 'fixed' ? 'shadow-xl' : 'shadow-md'}`}
          style={{
            borderRadius: '24px',
            border: pricingPlan === 'fixed' ? '2px solid #d4704a' : '2px solid #e5e7eb',
          }}
          onClick={() => setPricingPlan('fixed')}>
          <div className="flex items-start justify-between mb-6">
            <div>
              <h3 className="text-2xl font-medium text-foreground mb-2">Plan Fijo</h3>
              <Badge count="Más Popular" style={{ backgroundColor: '#d4704a' }} />
            </div>
            <div
              className={`w-6 h-6 rounded-full border-2 flex items-center justify-center ${
                pricingPlan === 'fixed' ? 'border-[#d4704a] bg-[#d4704a]' : 'border-gray-300'
              }`}>
              {pricingPlan === 'fixed' && <CheckOutlined style={{ fontSize: '12px', color: 'white' }} />}
            </div>
          </div>

          <div className="mb-6">
            <div className="flex items-baseline gap-2">
              <span className="text-5xl font-light text-foreground">$1,000</span>
              <span className="text-gray-500 font-light">MXN</span>
            </div>
            <p className="text-sm text-gray-500 font-light mt-1">Pago único al crear la lista</p>
          </div>

          <ul className="space-y-3 mb-6">
            {[
              'Sin comisiones por regalo',
              'Tus invitados no pagan extra',
              'Acceso completo a todas las funciones',
              'RSVPs y invitaciones digitales',
              'Soporte prioritario',
            ].map((feature, index) => (
              <li key={index} className="flex items-start gap-3">
                <CheckOutlined style={{ fontSize: '16px', color: '#d4704a', marginTop: '2px' }} />
                <span className="text-sm text-foreground font-light">{feature}</span>
              </li>
            ))}
          </ul>

          <div className="bg-[#fef5f1] rounded-xl p-4">
            <p className="text-sm text-[#d4704a] font-medium flex items-center gap-2">
              <StarOutlined />
              Mejor valor para eventos grandes
            </p>
          </div>
        </Card>

        {/* Commission Plan */}
        <Card
          className={`cursor-pointer transition-all duration-300 ${pricingPlan === 'commission' ? 'shadow-xl' : 'shadow-md'}`}
          style={{
            borderRadius: '24px',
            border: pricingPlan === 'commission' ? '2px solid #d4704a' : '2px solid #e5e7eb',
          }}
          onClick={() => setPricingPlan('commission')}>
          <div className="flex items-start justify-between mb-6">
            <div>
              <h3 className="text-2xl font-medium text-foreground mb-2">Plan Comisión</h3>
              <Badge count="Sin Pago Inicial" style={{ backgroundColor: '#d4704a' }} />
            </div>
            <div
              className={`w-6 h-6 rounded-full border-2 flex items-center justify-center ${
                pricingPlan === 'commission' ? 'border-[#d4704a] bg-[#d4704a]' : 'border-gray-300'
              }`}>
              {pricingPlan === 'commission' && <CheckOutlined style={{ fontSize: '12px', color: 'white' }} />}
            </div>
          </div>

          <div className="mb-6">
            <div className="flex items-baseline gap-2">
              <span className="text-5xl font-light text-foreground">3%</span>
              <span className="text-gray-500 font-light">por regalo</span>
            </div>
            <p className="text-sm text-gray-500 font-light mt-1">Comisión sobre cada compra</p>
          </div>

          <ul className="space-y-3 mb-6">
            {[
              'Sin costos iniciales',
              'Paga solo por regalos recibidos',
              'Acceso completo a todas las funciones',
              'RSVPs y invitaciones digitales',
              'Soporte estándar incluido',
            ].map((feature, index) => (
              <li key={index} className="flex items-start gap-3">
                <CheckOutlined style={{ fontSize: '16px', color: '#d4704a', marginTop: '2px' }} />
                <span className="text-sm text-foreground font-light">{feature}</span>
              </li>
            ))}
          </ul>

          <div className="bg-[#fef5f1] rounded-xl p-4">
            <p className="text-sm text-[#d4704a] font-medium flex items-center gap-2">
              <StarOutlined />
              Ideal para eventos más pequeños
            </p>
          </div>
        </Card>
      </div>

      <div className="mt-8 bg-[#f5f5f7] rounded-2xl p-6">
        <div className="flex items-start gap-4">
          <div className="w-12 h-12 bg-white rounded-full flex items-center justify-center shrink-0">
            <SafetyOutlined style={{ fontSize: '24px', color: '#d4704a' }} />
          </div>
          <div>
            <h4 className="font-medium text-foreground mb-2">Todas las listas incluyen</h4>
            <ul className="grid grid-cols-1 md:grid-cols-2 gap-2 text-sm text-gray-500 font-light">
              <li>✓ Gestión completa de regalos</li>
              <li>✓ Sistema de RSVP avanzado</li>
              <li>✓ Invitaciones digitales</li>
              <li>✓ Lista de tareas</li>
              <li>✓ Mensajería con invitados</li>
              <li>✓ Estadísticas en tiempo real</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );

  const renderPaymentStep = () => (
    <div className="max-w-2xl mx-auto">
      <div className="text-center mb-8">
        <h2 className="text-3xl font-light text-foreground mb-3">Información de Pago</h2>
        <p className="text-gray-500 font-light">Completa tu pago para activar tu lista</p>
      </div>

      <Card className="shadow-lg mb-6!" style={{ borderRadius: '24px', border: 'none' }}>
        <h3 className="font-medium text-foreground mb-4">Resumen del Pedido</h3>
        <div className="space-y-3 mb-6 pb-6 border-b border-gray-200">
          <div className="flex items-center justify-between">
            <span className="text-gray-500 font-light">Plan Seleccionado</span>
            <span className="font-medium">Plan Fijo</span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-gray-500 font-light">Lista</span>
            <span className="font-medium">{listName || 'Nueva Lista'}</span>
          </div>
        </div>
        <div className="flex items-center justify-between text-lg">
          <span className="font-medium text-foreground">Total a Pagar</span>
          <span className="text-2xl font-medium text-[#d4704a]">$1,000 MXN</span>
        </div>
      </Card>

      <Card className="shadow-lg" style={{ borderRadius: '24px', border: 'none' }}>
        <h3 className="font-medium text-foreground mb-4">Método de Pago</h3>

        <div className="flex items-center justify-between p-4 rounded-xl border-2 border-[#d4704a] bg-[#d4704a]/5">
          <div className="flex items-center gap-4">
            <div>
              <div className="font-medium">Tarjeta de Crédito/Débito</div>
              <p className="text-xs text-gray-500 font-light">Procesado de forma segura con Stripe</p>
            </div>
          </div>
          <CreditCardOutlined style={{ fontSize: '24px', color: '#d4704a' }} />
        </div>

        <div className="bg-[#fef5f1] rounded-xl p-4 mt-6">
          <div className="flex items-start gap-3">
            <SafetyOutlined style={{ fontSize: '20px', color: '#d4704a', marginTop: '2px' }} />
            <div>
              <p className="text-sm font-medium text-[#d4704a] mb-1">Pago 100% Seguro</p>
              <p className="text-xs text-[#d4704a]/80 font-light">Tus datos de pago están protegidos con encriptación de nivel bancario</p>
            </div>
          </div>
        </div>
      </Card>
    </div>
  );

  const renderConfirmationStep = () => (
    <div className="max-w-2xl mx-auto text-center">
      <div className="w-24 h-24 bg-gradient-to-br from-[#d4704a] to-[#c05f3d] rounded-full flex items-center justify-center mx-auto mb-6 shadow-lg">
        <CheckOutlined style={{ fontSize: '48px', color: 'white' }} />
      </div>

      <h2 className="text-4xl font-light text-foreground mb-4">¡Lista Creada!</h2>
      <p className="text-xl text-gray-500 font-light mb-8">Tu nueva lista de regalos está lista para usar</p>

      <Card className="shadow-lg mb-8" style={{ borderRadius: '24px', border: 'none' }}>
        <div className="space-y-4 text-left">
          <div className="flex items-center justify-between py-3 border-b border-gray-200">
            <span className="text-gray-500 font-light">Nombre de la Lista</span>
            <span className="font-medium">{listName}</span>
          </div>
          <div className="flex items-center justify-between py-3 border-b border-gray-200">
            <span className="text-gray-500 font-light">Pareja</span>
            <span className="font-medium">{coupleNames}</span>
          </div>
          <div className="flex items-center justify-between py-3 border-b border-gray-200">
            <span className="text-gray-500 font-light">Fecha del Evento</span>
            <span className="font-medium">
              {eventDate &&
                new Date(eventDate).toLocaleDateString('es-MX', {
                  year: 'numeric',
                  month: 'long',
                  day: 'numeric',
                })}
            </span>
          </div>
          <div className="flex items-center justify-between py-3">
            <span className="text-gray-500 font-light">Plan</span>
            <Badge count={pricingPlan === 'fixed' ? 'Plan Fijo' : 'Plan Comisión'} style={{ backgroundColor: '#d4704a' }} />
          </div>
        </div>
      </Card>

      <div className="bg-gradient-to-br from-[#d4704a]/5 to-[#d4704a]/10 rounded-2xl p-6 mb-8">
        <h3 className="font-medium text-foreground mb-4">Próximos Pasos</h3>
        <ul className="space-y-3 text-sm text-gray-500 text-left">
          <li className="flex items-start gap-3">
            <CheckOutlined style={{ fontSize: '16px', color: '#d4704a', marginTop: '2px' }} />
            <span>Agrega regalos a tu lista o usa nuestras colecciones prediseñadas</span>
          </li>
          <li className="flex items-start gap-3">
            <CheckOutlined style={{ fontSize: '16px', color: '#d4704a', marginTop: '2px' }} />
            <span>Crea una invitación digital para tu evento</span>
          </li>
          <li className="flex items-start gap-3">
            <CheckOutlined style={{ fontSize: '16px', color: '#d4704a', marginTop: '2px' }} />
            <span>Gestiona tus RSVPs e invitados</span>
          </li>
          <li className="flex items-start gap-3">
            <CheckOutlined style={{ fontSize: '16px', color: '#d4704a', marginTop: '2px' }} />
            <span>Comparte tu lista con familiares y amigos</span>
          </li>
        </ul>
      </div>

      <Button
        type="primary"
        size="large"
        onClick={handleFinish}
        icon={<ArrowRightOutlined />}
        iconPosition="end"
        style={{
          width: '100%',
          height: '48px',
          borderRadius: '24px',
          backgroundColor: '#d4704a',
          fontSize: '16px',
          fontWeight: '300',
        }}>
        Ir a Mi Lista
      </Button>
    </div>
  );

  return (
    <div className="min-h-screen bg-background py-12">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        {currentStep !== 'confirmation' && (
          <div className="mb-8">
            <Button
              type="text"
              onClick={handleBack}
              icon={<ArrowLeftOutlined />}
              style={{ borderRadius: '24px' }}
              className="hover:bg-[#f5f5f7] mb-6">
              Volver
            </Button>
          </div>
        )}

        {/* Step Indicator */}
        {renderStepIndicator()}

        {/* Step Content */}
        <div className="mb-8">
          {currentStep === 'details' && renderDetailsStep()}
          {currentStep === 'pricing' && renderPricingStep()}
          {currentStep === 'payment' && renderPaymentStep()}
          {currentStep === 'confirmation' && renderConfirmationStep()}
        </div>

        {/* Navigation Buttons */}
        {currentStep !== 'confirmation' && (
          <div className="max-w-2xl mx-auto flex gap-4">
            <MLButton
              buttonType="transparent"
              size="large"
              onClick={handleBack}
              icon={<ArrowLeftOutlined />}
              className="flex-1 radius-full h-[48px]"
              // style={{
              //   flex: 1,
              //   height: '48px',
              //   borderRadius: '24px',
              //   fontWeight: '300',
              // }}
            >
              Atrás
            </MLButton>
            <MLButton
              buttonType="primary"
              size="large"
              onClick={handleNext}
              disabled={!canProceed()}
              icon={<ArrowRightOutlined />}
              iconPosition="end"
              className="flex-1 radius-full h-[48px]"
              // style={{
              //   flex: 1,
              //   height: '48px',
              //   borderRadius: '24px',
              //   backgroundColor: '#d4704a',
              //   fontWeight: '300',
              // }}
            >
              {currentStep === 'payment' ? 'Pagar Ahora' : 'Continuar'}
            </MLButton>
          </div>
        )}
      </div>
    </div>
  );
}
