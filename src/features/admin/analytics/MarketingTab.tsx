import { useState } from 'react';
import { Card, Button, Alert, Spin, Modal, Checkbox, Input, Table, Tag, message, Popconfirm } from 'antd';
import { Mail, Send, CheckCircle, AlertCircle, Eye, Users, Plus, Trash2, UserPlus } from 'lucide-react';
import { useSendMarketingEmailToUser, useCommissionUsers, useSendToSelectedUsers, useSendToLeads } from 'hooks/useEmail';
import { useSignupEmails, useAddManualSignupEmail, useDeleteSignupEmail } from 'hooks/useSignupEmail';
import { UserSelectionModal } from './UserSelectionModal';
import { EmailPreviewModal } from './EmailPreviewModal';
import { MARKETING_EMAIL_TEMPLATES, MarketingEmailType } from 'src/config/marketingEmailTemplates';
import dayjs from 'dayjs';

export function MarketingTab() {
  const [lastResult, setLastResult] = useState<{ type: MarketingEmailType; sent: number; failed: number } | null>(null);
  const [userSelectionOpen, setUserSelectionOpen] = useState(false);
  const [previewOpen, setPreviewOpen] = useState(false);
  const [selectedEmailType, setSelectedEmailType] = useState<MarketingEmailType>(1);
  const [selectedEmailTitle, setSelectedEmailTitle] = useState('');
  const [selectedPlanTypes, setSelectedPlanTypes] = useState<('COMMISSION' | 'FIXED')[]>(['COMMISSION']);
  const [manualEmail, setManualEmail] = useState('');
  const [manualFirstName, setManualFirstName] = useState('');
  const [manualLastName, setManualLastName] = useState('');
  const [includeLeads, setIncludeLeads] = useState(false);

  const sendEmailToUserMutation = useSendMarketingEmailToUser();
  const { data: usersData, isLoading: isLoadingUsers } = useCommissionUsers(selectedPlanTypes);
  const sendToSelectedMutation = useSendToSelectedUsers();
  const sendToLeadsMutation = useSendToLeads();
  const { data: signupEmailsData, isLoading: isLoadingSignupEmails } = useSignupEmails();
  const addManualEmailMutation = useAddManualSignupEmail();
  const deleteSignupEmailMutation = useDeleteSignupEmail();

  const signupEmails = signupEmailsData?.data || [];
  const nonConvertedEmails = signupEmails.filter((e) => !e.convertedToUser);

  const handleAddManualEmail = async () => {
    if (!manualEmail || !manualEmail.includes('@')) {
      message.error('Ingresa un email válido');
      return;
    }
    try {
      await addManualEmailMutation.mutateAsync({
        email: manualEmail,
        firstName: manualFirstName || undefined,
        lastName: manualLastName || undefined,
      });
      message.success('Email agregado');
      setManualEmail('');
      setManualFirstName('');
      setManualLastName('');
    } catch (error: any) {
      if (error.response?.status === 409) {
        message.warning('Este email ya existe en la lista');
      } else {
        message.error('Error al agregar email');
      }
    }
  };

  const handleDeleteSignupEmail = async (id: number) => {
    try {
      await deleteSignupEmailMutation.mutateAsync(id);
      message.success('Email eliminado');
    } catch {
      message.error('Error al eliminar email');
    }
  };

  const handleOpenUserSelection = (emailType: MarketingEmailType, emailTitle: string) => {
    setSelectedEmailType(emailType);
    setSelectedEmailTitle(emailTitle);
    setUserSelectionOpen(true);
  };

  const handleOpenPreview = (emailType: MarketingEmailType, emailTitle: string) => {
    setSelectedEmailType(emailType);
    setSelectedEmailTitle(emailTitle);
    setPreviewOpen(true);
  };

  const handleSendToSelected = async (userIds: number[], selectedLeads: { email: string; firstName?: string | null }[]) => {
    try {
      let totalSent = 0;
      let totalFailed = 0;

      if (userIds.length > 0) {
        const result = await sendToSelectedMutation.mutateAsync({
          emailType: selectedEmailType,
          userIds,
        });
        totalSent += result.data.sent;
        totalFailed += result.data.failed;
      }

      if (selectedLeads.length > 0) {
        const result = await sendToLeadsMutation.mutateAsync({
          emailType: selectedEmailType,
          leads: selectedLeads,
        });
        totalSent += result.data.sent;
        totalFailed += result.data.failed;
      }

      setLastResult({ type: selectedEmailType, sent: totalSent, failed: totalFailed });
      setUserSelectionOpen(false);
    } catch (error) {
      console.error('Error sending marketing email to selected recipients:', error);
    }
  };

  const handlePlanTypeChange = (checkedValues: string[]) => {
    const validPlanTypes = checkedValues.filter((pt) => pt === 'COMMISSION' || pt === 'FIXED') as ('COMMISSION' | 'FIXED')[];
    const leadsChecked = checkedValues.includes('LEADS');
    setIncludeLeads(leadsChecked);
    if (validPlanTypes.length === 0 && !leadsChecked) {
      setSelectedPlanTypes(['COMMISSION']);
    } else {
      setSelectedPlanTypes(validPlanTypes);
    }
  };

  const handleSendEmail = async (emailType: MarketingEmailType, emailName: string) => {
    const parts: string[] = [];
    if (selectedPlanTypes.includes('COMMISSION')) parts.push('usuarios con plan de comisión');
    if (selectedPlanTypes.includes('FIXED')) parts.push('usuarios con plan fijo');
    if (includeLeads) parts.push(`${nonConvertedEmails.length} leads`);
    const planTypeText = parts.join(' y ') || 'usuarios seleccionados';

    Modal.confirm({
      title: `¿Enviar ${emailName}?`,
      content: `Esto enviará el email a todos los ${planTypeText}. ¿Estás seguro?`,
      okText: 'Sí, enviar',
      cancelText: 'Cancelar',
      onOk: async () => {
        try {
          let totalSent = 0;
          let totalFailed = 0;

          if (selectedPlanTypes.length > 0 && usersData?.data) {
            // Send email to each user individually
            for (const user of usersData.data) {
              try {
                await sendEmailToUserMutation.mutateAsync({ userId: user.id, emailType });
                totalSent++;
              } catch (error) {
                console.error(`Failed to send email to user ${user.id}:`, error);
                totalFailed++;
              }
            }
          }

          if (includeLeads && nonConvertedEmails.length > 0) {
            const leadsPayload = nonConvertedEmails.map((l) => ({ email: l.email, firstName: l.firstName }));
            const leadsResult = await sendToLeadsMutation.mutateAsync({
              emailType,
              leads: leadsPayload,
            });
            totalSent += leadsResult.data.sent;
            totalFailed += leadsResult.data.failed;
          }

          setLastResult({ type: emailType, sent: totalSent, failed: totalFailed });
        } catch (error) {
          console.error('Error sending marketing email:', error);
        }
      },
    });
  };

  // Use all templates for sending
  const emailCampaigns = MARKETING_EMAIL_TEMPLATES.map((template) => ({
    ...template,
    mutation: sendEmailToUserMutation,
  }));

  return (
    <div className="space-y-6">
      {/* Header */}
      <Card>
        <div className="flex items-start gap-4">
          <div className="w-12 h-12 rounded-xl bg-linear-to-br from-purple-500 to-pink-500 flex items-center justify-center flex-shrink-0">
            <Mail className="h-6 w-6 text-white" />
          </div>
          <div className="flex-1">
            <h2 className="text-2xl font-bold text-gray-900 mb-2">Campañas de Marketing por Email</h2>
            <p className="text-gray-600 mb-4">Envía emails estratégicos a usuarios para aumentar la activación y engagement.</p>

            {/* Plan Type Selector */}
            <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
              <div className="font-semibold text-gray-900 mb-2">Tipo de Plan:</div>
              <Checkbox.Group
                value={[...selectedPlanTypes, ...(includeLeads ? ['LEADS'] : [])]}
                onChange={handlePlanTypeChange}
                className="flex gap-4 flex-wrap">
                <Checkbox value="COMMISSION" className="text-gray-700">
                  Plan de Comisión
                </Checkbox>
                <Checkbox value="FIXED" className="text-gray-700">
                  Plan Fijo
                </Checkbox>
                <Checkbox value="LEADS" className="text-gray-700">
                  Leads ({nonConvertedEmails.length})
                </Checkbox>
              </Checkbox.Group>
              <div className="text-sm text-gray-600 mt-2">
                {selectedPlanTypes.length === 0 && !includeLeads && 'Selecciona al menos un grupo de destinatarios'}
                {selectedPlanTypes.length === 1 &&
                  selectedPlanTypes.includes('COMMISSION') &&
                  !includeLeads &&
                  'Solo usuarios con plan de comisión'}
                {selectedPlanTypes.length === 1 && selectedPlanTypes.includes('FIXED') && !includeLeads && 'Solo usuarios con plan fijo'}
                {selectedPlanTypes.length === 2 && !includeLeads && 'Usuarios con plan de comisión y plan fijo'}
                {includeLeads && selectedPlanTypes.length === 0 && `Solo ${nonConvertedEmails.length} leads`}
                {includeLeads && selectedPlanTypes.length > 0 && `Usuarios seleccionados + ${nonConvertedEmails.length} leads`}
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

      {/* Signup Emails (Leads) Section */}
      <Card>
        <div className="flex items-start gap-4 mb-6">
          <div className="w-12 h-12 rounded-xl bg-linear-to-br from-green-500 to-emerald-600 flex items-center justify-center flex-shrink-0">
            <UserPlus className="h-6 w-6 text-white" />
          </div>
          <div className="flex-1">
            <h2 className="text-2xl font-bold text-gray-900 mb-1">Leads de Registro</h2>
            <p className="text-gray-600">
              Emails recopilados de intentos de registro y agregados manualmente. <strong>{nonConvertedEmails.length}</strong> leads
              activos, <strong>{signupEmails.filter((e) => e.convertedToUser).length}</strong> convertidos.
            </p>
          </div>
        </div>

        {/* Manual Add Form */}
        <div className="bg-gray-50 rounded-lg p-4 mb-4">
          <div className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
            <Plus className="h-4 w-4" />
            Agregar email manualmente
          </div>
          <div className="flex gap-2 flex-wrap">
            <Input
              placeholder="email@ejemplo.com"
              value={manualEmail}
              onChange={(e) => setManualEmail(e.target.value)}
              className="flex-1 min-w-[200px]"
              onPressEnter={handleAddManualEmail}
            />
            <Input
              placeholder="Nombre (opcional)"
              value={manualFirstName}
              onChange={(e) => setManualFirstName(e.target.value)}
              className="w-40"
              onPressEnter={handleAddManualEmail}
            />
            <Input
              placeholder="Apellido (opcional)"
              value={manualLastName}
              onChange={(e) => setManualLastName(e.target.value)}
              className="w-40"
              onPressEnter={handleAddManualEmail}
            />
            <Button
              type="primary"
              icon={<Plus className="h-4 w-4" />}
              onClick={handleAddManualEmail}
              loading={addManualEmailMutation.isPending}>
              Agregar
            </Button>
          </div>
        </div>

        {/* Emails Table */}
        <Table
          dataSource={signupEmails}
          rowKey="id"
          size="small"
          loading={isLoadingSignupEmails}
          pagination={{ pageSize: 10, showSizeChanger: true, showTotal: (total) => `${total} emails` }}
          columns={[
            {
              title: 'Email',
              dataIndex: 'email',
              key: 'email',
              render: (email: string) => <span className="font-medium">{email}</span>,
            },
            {
              title: 'Nombre',
              key: 'name',
              render: (_: any, record: any) => {
                const name = [record.firstName, record.lastName].filter(Boolean).join(' ');
                return name || <span className="text-gray-400">—</span>;
              },
            },
            {
              title: 'Origen',
              dataIndex: 'source',
              key: 'source',
              width: 100,
              render: (source: string) => (
                <Tag color={source === 'signup' ? 'blue' : 'purple'}>{source === 'signup' ? 'Registro' : 'Manual'}</Tag>
              ),
            },
            {
              title: 'Estado',
              dataIndex: 'convertedToUser',
              key: 'convertedToUser',
              width: 120,
              render: (converted: boolean) => <Tag color={converted ? 'green' : 'orange'}>{converted ? 'Convertido' : 'Lead'}</Tag>,
            },
            {
              title: 'Fecha',
              dataIndex: 'createdAt',
              key: 'createdAt',
              width: 120,
              render: (date: string) => dayjs(date).format('DD/MM/YYYY'),
            },
            {
              title: '',
              key: 'actions',
              width: 50,
              render: (_: any, record: any) => (
                <Popconfirm title="¿Eliminar este email?" onConfirm={() => handleDeleteSignupEmail(record.id)} okText="Sí" cancelText="No">
                  <Button type="text" danger size="small" icon={<Trash2 className="h-3.5 w-3.5" />} />
                </Popconfirm>
              ),
            },
          ]}
        />
      </Card>

      {/* Email Campaign Cards */}
      <div className="grid md:grid-cols-2 gap-6">
        {emailCampaigns.map((campaign) => (
          <Card
            key={campaign.type}
            className="hover:shadow-lg transition-shadow duration-300"
            styles={{ body: { padding: '0px' } }}
            onClick={() => handleOpenPreview(campaign.type, campaign.title)}
            style={{ cursor: 'pointer' }}>
            <div className={`bg-linear-to-r ${campaign.color} p-6 text-white`}>
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
        leads={includeLeads ? nonConvertedEmails : []}
        onConfirm={handleSendToSelected}
        isLoading={sendToSelectedMutation.isPending || sendToLeadsMutation.isPending}
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
