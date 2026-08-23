import { useState } from 'react';
import { Button, Input, Card, Badge, Radio, DatePicker, Space, message, Form } from 'antd';
import { ArrowLeftOutlined, ArrowRightOutlined, CalendarOutlined, UserOutlined, GiftOutlined, CheckOutlined } from '@ant-design/icons';
import dayjs from 'dayjs';
import { useNavigate } from 'react-router-dom';
import { useCurrentUser } from 'src/hooks/useUser';
import { useCreateGiftList } from 'src/hooks/useGiftList';
import { MLButton } from 'src/components/core/MLButton';

// Lists are created as drafts and published later from the builder, so there is
// no plan or payment step here any more.
type Step = 'details' | 'confirmation';

export function CreateNewList() {
  const navigate = useNavigate();
  const handleGoPreviousPage = () => navigate(-1);
  const [currentStep, setCurrentStep] = useState<Step>('details');
  const { data: user } = useCurrentUser();
  const { mutateAsync: createGiftList } = useCreateGiftList();

  const [form] = Form.useForm();

  // Form state
  const [listName, setListName] = useState('');
  const [coupleNames, setCoupleNames] = useState('');
  const [eventDate, setEventDate] = useState('');
  const [eventType, setEventType] = useState('wedding');
  const [estimatedGuests, setEstimatedGuests] = useState('');


  const handleBack = () => {
    handleGoPreviousPage();
  };

  /**
   * Creates the list as a draft. Additional lists follow the same
   * build-then-publish path as the first one, so no plan is chosen here —
   * the couple picks one from the builder when they publish.
   */
  const handleCreateList = async () => {
    if (!user) return;

    try {
      const coupleName = user.spouseFirstName ? `${user.firstName} y ${user.spouseFirstName}` : `${user.firstName} ${user.lastName}`;

      await createGiftList({
        userId: user.id,
        title: listName,
        description: '',
        coupleName: coupleName,
        eventDate: new Date(eventDate).toISOString(),
      });

      message.success('¡Lista creada! Agrégale regalos y publícala cuando esté lista.');
      form.resetFields();
      setCurrentStep('confirmation');
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
    return true;
  };

  const handleNext = () => {
    if (currentStep === 'details') {
      handleCreateList();
    }
  };

  const renderStepIndicator = () => {
    const steps = [
      { id: 'details', label: 'Detalles', icon: GiftOutlined },
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
            <span className="text-gray-500 font-light">Estado</span>
            <Badge count="Borrador" style={{ backgroundColor: '#d4704a' }} />
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
            <span>Elige tu plan y publícala para compartirla con tus invitados</span>
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
              Crear mi mesa
            </MLButton>
          </div>
        )}
      </div>
    </div>
  );
}
