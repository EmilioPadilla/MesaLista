import { useState } from 'react';
import { Card, Button, Alert, Spin, Modal, Checkbox } from 'antd';
import { Mail, Send, CheckCircle, AlertCircle, Eye, Users } from 'lucide-react';
import {
  useSendMarketingEmail1,
  useSendMarketingEmail2,
  useSendMarketingEmail3,
  useSendMarketingEmail4,
  useCommissionUsers,
  useSendToSelectedUsers,
} from 'hooks/useEmail';
import { UserSelectionModal } from './UserSelectionModal';
import { EmailPreviewModal } from './EmailPreviewModal';

export function MarketingTab() {
  const [lastResult, setLastResult] = useState<{ type: number; sent: number; failed: number } | null>(null);
  const [userSelectionOpen, setUserSelectionOpen] = useState(false);
  const [previewOpen, setPreviewOpen] = useState(false);
  const [selectedEmailType, setSelectedEmailType] = useState<1 | 2 | 3 | 4>(1);
  const [selectedEmailTitle, setSelectedEmailTitle] = useState('');
  const [selectedPlanTypes, setSelectedPlanTypes] = useState<('COMMISSION' | 'FIXED')[]>(['COMMISSION']);

  const email1Mutation = useSendMarketingEmail1();
  const email2Mutation = useSendMarketingEmail2();
  const email3Mutation = useSendMarketingEmail3();
  const email4Mutation = useSendMarketingEmail4();
  const { data: usersData, isLoading: isLoadingUsers } = useCommissionUsers(selectedPlanTypes);
  const sendToSelectedMutation = useSendToSelectedUsers();

  const handleOpenUserSelection = (emailType: 1 | 2 | 3 | 4, emailTitle: string) => {
    setSelectedEmailType(emailType);
    setSelectedEmailTitle(emailTitle);
    setUserSelectionOpen(true);
  };

  const handleOpenPreview = (emailType: 1 | 2 | 3 | 4, emailTitle: string) => {
    setSelectedEmailType(emailType);
    setSelectedEmailTitle(emailTitle);
    setPreviewOpen(true);
  };

  const handleSendToSelected = async (userIds: number[]) => {
    try {
      const result = await sendToSelectedMutation.mutateAsync({
        emailType: selectedEmailType,
        userIds,
      });
      setLastResult({ type: selectedEmailType, sent: result.data.sent, failed: result.data.failed });
      setUserSelectionOpen(false);
    } catch (error) {
      console.error('Error sending marketing email to selected users:', error);
    }
  };

  const handlePlanTypeChange = (checkedValues: string[]) => {
    const validPlanTypes = checkedValues.filter((pt) => pt === 'COMMISSION' || pt === 'FIXED') as ('COMMISSION' | 'FIXED')[];
    setSelectedPlanTypes(validPlanTypes.length > 0 ? validPlanTypes : ['COMMISSION']);
  };

  const handleSendEmail = async (emailType: 1 | 2 | 3 | 4, emailName: string) => {
    const planTypeText =
      selectedPlanTypes.length === 2
        ? 'usuarios con plan de comisión y plan fijo'
        : selectedPlanTypes.includes('FIXED')
          ? 'usuarios con plan fijo'
          : 'usuarios con plan de comisión';

    Modal.confirm({
      title: `¿Enviar ${emailName}?`,
      content: `Esto enviará el email a todos los ${planTypeText}. ¿Estás seguro?`,
      okText: 'Sí, enviar',
      cancelText: 'Cancelar',
      onOk: async () => {
        try {
          let result;
          switch (emailType) {
            case 1:
              result = await email1Mutation.mutateAsync(selectedPlanTypes);
              break;
            case 2:
              result = await email2Mutation.mutateAsync(selectedPlanTypes);
              break;
            case 3:
              result = await email3Mutation.mutateAsync(selectedPlanTypes);
              break;
            case 4:
              result = await email4Mutation.mutateAsync(selectedPlanTypes);
              break;
          }
          setLastResult({ type: emailType, sent: result.data.sent, failed: result.data.failed });
        } catch (error) {
          console.error('Error sending marketing email:', error);
        }
      },
    });
  };

  const emailCampaigns = [
    {
      type: 1 as const,
      title: 'Email 1: Bienvenida y Características',
      description: 'Presenta las características principales de MesaLista y recuerda por qué eligieron la plataforma.',
      icon: '👋',
      color: 'from-orange-400 to-orange-600',
      timing: 'Enviar 1-2 días después del registro',
      mutation: email1Mutation,
    },
    {
      type: 2 as const,
      title: 'Email 2: Guía de Inicio Rápido',
      description: 'Guía paso a paso para completar su mesa de regalos en 3 pasos simples.',
      icon: '🚀',
      color: 'from-blue-400 to-purple-600',
      timing: 'Enviar 3-4 días después si no hay actividad',
      mutation: email2Mutation,
    },
    {
      type: 3 as const,
      title: 'Email 3: Prueba Social e Historias de Éxito',
      description: 'Testimonios de parejas reales y estadísticas de la plataforma para generar confianza.',
      icon: '⭐',
      color: 'from-pink-400 to-orange-500',
      timing: 'Enviar 7 días después del registro',
      mutation: email3Mutation,
    },
    {
      type: 4 as const,
      title: 'Email 4: Re-engagement y Oferta Especial',
      description: 'Último empujón con urgencia y oferta especial para usuarios inactivos.',
      icon: '💜',
      color: 'from-purple-500 to-pink-500',
      timing: 'Enviar 14 días después si aún inactivo',
      mutation: email4Mutation,
    },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <Card>
        <div className="flex items-start gap-4">
          <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center flex-shrink-0">
            <Mail className="h-6 w-6 text-white" />
          </div>
          <div className="flex-1">
            <h2 className="text-2xl font-bold text-gray-900 mb-2">Campañas de Marketing por Email</h2>
            <p className="text-gray-600 mb-4">Envía emails estratégicos a usuarios para aumentar la activación y engagement.</p>

            {/* Plan Type Selector */}
            <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
              <div className="font-semibold text-gray-900 mb-2">Tipo de Plan:</div>
              <Checkbox.Group value={selectedPlanTypes} onChange={handlePlanTypeChange} className="flex gap-4">
                <Checkbox value="COMMISSION" className="text-gray-700">
                  Plan de Comisión (predeterminado)
                </Checkbox>
                <Checkbox value="FIXED" className="text-gray-700">
                  Plan Fijo
                </Checkbox>
              </Checkbox.Group>
              <div className="text-sm text-gray-600 mt-2">
                {selectedPlanTypes.length === 0 && 'Selecciona al menos un tipo de plan'}
                {selectedPlanTypes.length === 1 && selectedPlanTypes.includes('COMMISSION') && 'Solo usuarios con plan de comisión'}
                {selectedPlanTypes.length === 1 && selectedPlanTypes.includes('FIXED') && 'Solo usuarios con plan fijo'}
                {selectedPlanTypes.length === 2 && 'Usuarios con plan de comisión y plan fijo'}
              </div>
            </div>
          </div>
        </div>
      </Card>

      {/* Last Result Alert */}
      {lastResult && (
        <Alert
          message={`Email ${lastResult.type} enviado exitosamente`}
          description={`${lastResult.sent} emails enviados, ${lastResult.failed} fallidos`}
          type={lastResult.failed === 0 ? 'success' : 'warning'}
          showIcon
          closable
          onClose={() => setLastResult(null)}
        />
      )}

      {/* Email Campaign Cards */}
      <div className="grid md:grid-cols-2 gap-6">
        {emailCampaigns.map((campaign) => (
          <Card
            key={campaign.type}
            className="hover:shadow-lg transition-shadow duration-300"
            styles={{ body: { padding: '0px' } }}
            onClick={() => handleOpenPreview(campaign.type, campaign.title)}
            style={{ cursor: 'pointer' }}>
            <div className={`bg-gradient-to-r ${campaign.color} p-6 text-white`}>
              <div className="flex items-center gap-3 mb-2">
                <span className="text-3xl">{campaign.icon}</span>
                <h3 className="text-xl font-bold">{campaign.title}</h3>
              </div>
              <p className="text-white/90 text-sm">{campaign.timing}</p>
            </div>

            <div className="p-6">
              <p className="text-gray-700 mb-4 leading-relaxed">{campaign.description}</p>

              <div className="bg-gray-50 rounded-lg p-4 mb-4">
                <h4 className="font-semibold text-gray-900 mb-2 flex items-center gap-2">
                  <CheckCircle className="h-4 w-4 text-green-600" />
                  Contenido del Email:
                </h4>
                <ul className="text-sm text-gray-600 space-y-1 ml-6 list-disc">
                  {campaign.type === 1 && (
                    <>
                      <li>Listas prediseñadas (6+ colecciones)</li>
                      <li>Invitaciones digitales</li>
                      <li>Gestión de RSVPs</li>
                      <li>Estadísticas en tiempo real</li>
                    </>
                  )}
                  {campaign.type === 2 && (
                    <>
                      <li>Paso 1: Explorar listas prediseñadas</li>
                      <li>Paso 2: Agregar regalos</li>
                      <li>Paso 3: Compartir con invitados</li>
                      <li>Tips profesionales</li>
                    </>
                  )}
                  {campaign.type === 3 && (
                    <>
                      <li>Testimonios de parejas reales</li>
                      <li>Estadísticas de la plataforma</li>
                      <li>500+ parejas felices</li>
                      <li>Garantía de satisfacción</li>
                    </>
                  )}
                  {campaign.type === 4 && (
                    <>
                      <li>Manejo de objeciones comunes</li>
                      <li>Oferta especial por tiempo limitado</li>
                      <li>Urgencia y escasez</li>
                      <li>Soporte prioritario gratuito</li>
                    </>
                  )}
                </ul>
              </div>

              <div className="flex gap-2">
                <Button
                  icon={<Eye className="h-4 w-4" />}
                  onClick={(e) => {
                    e.stopPropagation();
                    handleOpenPreview(campaign.type, campaign.title);
                  }}
                  size="large"
                  className="flex-1"
                  style={{ height: '48px' }}>
                  Vista Previa
                </Button>
                <Button
                  icon={<Users className="h-4 w-4" />}
                  onClick={(e) => {
                    e.stopPropagation();
                    handleOpenUserSelection(campaign.type, campaign.title);
                  }}
                  size="large"
                  className="flex-1"
                  style={{ height: '48px' }}>
                  Seleccionar Usuarios
                </Button>
              </div>
              <Button
                type="primary"
                size="large"
                icon={campaign.mutation.isPending ? <Spin size="small" /> : <Send className="h-4 w-4" />}
                onClick={(e) => {
                  e.stopPropagation();
                  handleSendEmail(campaign.type, campaign.title);
                }}
                loading={campaign.mutation.isPending}
                disabled={campaign.mutation.isPending}
                className="w-full mt-2"
                style={{ height: '48px' }}>
                {campaign.mutation.isPending ? 'Enviando...' : 'Enviar a Todos'}
              </Button>

              {campaign.mutation.isError && (
                <Alert
                  message="Error al enviar"
                  description={campaign.mutation.error?.message || 'Ocurrió un error al enviar el email'}
                  type="error"
                  showIcon
                  icon={<AlertCircle className="h-4 w-4" />}
                  className="mt-4"
                />
              )}
            </div>
          </Card>
        ))}
      </div>

      {/* Best Practices Card */}
      <Card title="📋 Mejores Prácticas" className="bg-blue-50 border-blue-200">
        <div className="space-y-3 text-gray-700">
          <p className="flex items-start gap-2">
            <CheckCircle className="h-5 w-5 text-green-600 flex-shrink-0 mt-0.5" />
            <span>
              <strong>Secuencia recomendada:</strong> Envía los emails en orden (1 → 2 → 3 → 4) con los intervalos de tiempo sugeridos.
            </span>
          </p>
          <p className="flex items-start gap-2">
            <CheckCircle className="h-5 w-5 text-green-600 flex-shrink-0 mt-0.5" />
            <span>
              <strong>Segmentación:</strong> Estos emails se envían automáticamente solo a usuarios con planes de comisión que no pagaron
              por adelantado.
            </span>
          </p>
          <p className="flex items-start gap-2">
            <CheckCircle className="h-5 w-5 text-green-600 flex-shrink-0 mt-0.5" />
            <span>
              <strong>Monitoreo:</strong> Revisa las métricas de apertura y conversión después de cada campaña para optimizar el contenido.
            </span>
          </p>
          <p className="flex items-start gap-2">
            <CheckCircle className="h-5 w-5 text-green-600 flex-shrink-0 mt-0.5" />
            <span>
              <strong>Timing:</strong> Evita enviar múltiples emails el mismo día. Respeta los intervalos recomendados para no saturar a los
              usuarios.
            </span>
          </p>
        </div>
      </Card>

      {/* Modals */}
      <UserSelectionModal
        isOpen={userSelectionOpen}
        onClose={() => setUserSelectionOpen(false)}
        users={usersData?.data || []}
        onConfirm={handleSendToSelected}
        isLoading={sendToSelectedMutation.isPending}
      />

      <EmailPreviewModal
        isOpen={previewOpen}
        onClose={() => setPreviewOpen(false)}
        emailType={selectedEmailType}
        users={usersData?.data || []}
        emailTitle={selectedEmailTitle}
      />
    </div>
  );
}
