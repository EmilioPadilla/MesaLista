import { useState, useEffect } from 'react';
import { Typography, message, Tabs } from 'antd';
import { ArrowLeft, Save, Eye, Send, Edit3, Settings } from 'lucide-react';
import { InvitationPreview } from '../InvitationPreview/InvitationPreview';
import { PublishModal } from '../PublishModal/PublishModal';
import { InvitationContentTab } from '../InvitationEditor/InvitationContentTab';
import type { InvitationTemplate, Invitation } from 'types/models/invitation';
import { useCreateInvitation, useUpdateInvitation, usePublishInvitation } from 'src/hooks/useInvitation';
import { renderInvitationTemplate } from 'src/utils/renderInvitationTemplate';
import { useCurrentUser } from 'src/hooks/useUser';
import { getTemplateById } from '../invitationTemplates';
import { MLButton } from 'src/components/core/MLButton';
import { ColorPalette, InvitationSection, InvitationSectionManager } from '../InvitationEditor/InvitationSectionManager';
import { getSectionsForTemplate } from '../sections/templateSectionsHelper';
import { useQueryClient } from '@tanstack/react-query';

const { Title } = Typography;
const { TabPane } = Tabs;

interface InvitationEditorProps {
  giftListId: number;
  template: InvitationTemplate | null;
  invitation: Invitation | null;
  onBack: () => void;
  onPreview: (slug: string) => void;
}

export function InvitationEditor({ giftListId, template, invitation, onBack, onPreview }: InvitationEditorProps) {
  const queryClient = useQueryClient();
  const [formData, setFormData] = useState<Record<string, string>>({});
  const [eventName, setEventName] = useState('');
  const [showPublishModal, setShowPublishModal] = useState(false);
  const [isDraft, setIsDraft] = useState(true);
  const [currentInvitationId, setCurrentInvitationId] = useState<number | null>(invitation?.id || null);

  // Initialize sections based on template type
  const templateId = template?.id || invitation?.templateId || 'elegant-wedding';
  const [sections, setSections] = useState<InvitationSection[]>(getSectionsForTemplate(templateId));

  const [selectedPalette, setSelectedPalette] = useState<ColorPalette>({
    id: 'romantic-blush',
    name: 'Romantic Blush',
    primary: '#d4704a',
    secondary: '#f5e6e0',
    accent: '#a85a3f',
    background: '#faf8f6',
    text: '#2c1810',
    textLight: '#8b7355',
  });
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);

  const { data: currentUser } = useCurrentUser();
  const createInvitationMutation = useCreateInvitation();
  const updateInvitationMutation = useUpdateInvitation();
  const publishInvitationMutation = usePublishInvitation();

  useEffect(() => {
    if (invitation) {
      const savedFormData = invitation.formData || {};

      // Restore sections if saved
      if (savedFormData.sections) {
        try {
          const parsedSections = typeof savedFormData.sections === 'string' ? JSON.parse(savedFormData.sections) : savedFormData.sections;
          setSections(parsedSections);
        } catch (e) {
          console.error('Error parsing saved sections:', e);
        }
      }

      // Restore palette if saved
      if (savedFormData.palette) {
        try {
          const parsedPalette = typeof savedFormData.palette === 'string' ? JSON.parse(savedFormData.palette) : savedFormData.palette;
          setSelectedPalette(parsedPalette);
        } catch (e) {
          console.error('Error parsing saved palette:', e);
        }
      }

      // Create clean formData without sections and palette
      const { sections: _, palette: __, ...cleanFormData } = savedFormData;
      setFormData(cleanFormData);
      setEventName(invitation.eventName || '');
      setIsDraft(invitation.status === 'DRAFT');
      setCurrentInvitationId(invitation.id);
    } else {
      // New invitation - formData starts empty
      setFormData({});
      setEventName('');
      setCurrentInvitationId(null);
    }
    setHasUnsavedChanges(false);
  }, [template, invitation]);

  useEffect(() => {
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      if (hasUnsavedChanges) {
        e.preventDefault();
        e.returnValue = '';
      }
    };
    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => window.removeEventListener('beforeunload', handleBeforeUnload);
  }, [hasUnsavedChanges]);

  const handleFieldChange = (key: string, value: string) => {
    setFormData((prev) => ({
      ...prev,
      [key]: value,
    }));
    setHasUnsavedChanges(true);
  };

  const handleSaveDraft = async () => {
    if (!eventName.trim()) {
      message.error('Por favor ingresa un nombre para el evento');
      return;
    }

    try {
      const htmlContent = renderInvitationTemplate(templateId, formData);

      // Prepare data to save including sections and palette
      const dataToSave = {
        eventName,
        htmlContent,
        formData: {
          ...formData,
          sections: JSON.stringify(sections),
          palette: JSON.stringify(selectedPalette),
        },
      };

      if (currentInvitationId) {
        await updateInvitationMutation.mutateAsync({
          id: currentInvitationId,
          data: dataToSave,
        });
        message.success('Borrador actualizado exitosamente');
      } else {
        const newInvitation = await createInvitationMutation.mutateAsync({
          giftListId,
          templateId,
          eventName,
          slug: currentUser?.slug || 'evento',
          htmlContent,
          formData: dataToSave.formData,
        });
        setCurrentInvitationId(newInvitation.id);
        message.success('Borrador guardado exitosamente');
      }
      setHasUnsavedChanges(false);
    } catch (error: any) {
      console.error('Error saving draft:', error);
      message.error(error.response?.data?.error || 'Error al guardar el borrador');
    }
  };

  const handlePublish = () => {
    if (!eventName.trim()) {
      message.error('Por favor ingresa un nombre para el evento');
      return;
    }

    // Check if at least one enabled section has data
    const enabledSections = sections.filter((s) => s.enabled);
    if (enabledSections.length === 0) {
      message.error('Por favor habilita al menos una sección');
      return;
    }

    // Check if basic required fields are filled (brideName, groomName, eventDate)
    const hasBasicData = formData.brideName || formData.groomName || formData.eventDate;
    if (!hasBasicData) {
      message.error('Por favor completa al menos los nombres o la fecha del evento');
      return;
    }

    setShowPublishModal(true);
  };

  const handlePublishConfirm = async () => {
    if (!currentInvitationId) {
      message.error('Primero debes guardar el borrador');
      return;
    }
    try {
      const slug = currentUser?.slug || '';
      await publishInvitationMutation.mutateAsync({ id: currentInvitationId, slug });

      // Invalidate the invitation cache to ensure fresh data is fetched
      await queryClient.invalidateQueries({ queryKey: ['invitationByGiftList', giftListId] });

      setIsDraft(false);
      setShowPublishModal(false);
      setHasUnsavedChanges(false);
      message.success('¡Invitación publicada exitosamente!');
      onPreview(`/${slug}/${giftListId}/invitacion`);
    } catch (error: any) {
      console.error('Error publishing invitation:', error);
      message.error(error.response?.data?.error || 'Error al publicar la invitación');
    }
  };

  const templateName = template?.name || (invitation ? getTemplateById(invitation.templateId)?.name : null) || 'Boda Elegante';

  return (
    <div className="min-h-screen bg-[#f5f5f7]">
      {/* Header */}
      <div className="bg-white border-b border-border/30 sticky top-0 z-10">
        <div className="max-w-[1800px] mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <MLButton buttonType="transparent" onClick={onBack} icon={<ArrowLeft className="h-5 w-5" />} />
              <div>
                <h1 className="text-xl font-light text-foreground">{invitation ? 'Editar Invitación' : 'Nueva Invitación'}</h1>
                <p className="text-sm text-muted-foreground font-light">{templateName}</p>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <MLButton
                onClick={handleSaveDraft}
                loading={createInvitationMutation.isPending || updateInvitationMutation.isPending}
                buttonType="secondary"
                icon={<Save className="h-4 w-4" />}>
                Guardar Borrador
              </MLButton>
              <MLButton
                onClick={handlePublish}
                loading={publishInvitationMutation.isPending}
                disabled={!currentInvitationId}
                buttonType="primary"
                icon={<Send className="h-4 w-4" />}>
                Publicar
              </MLButton>
            </div>
          </div>
        </div>
      </div>

      {/* Split Screen Layout */}
      <div className="max-w-[1800px] mx-auto">
        <div className="grid grid-cols-1 lg:grid-cols-2 h-[calc(100vh-73px)]">
          {/* Left Panel - Form */}
          <div className="bg-white p-8 lg:p-12 overflow-y-auto h-full">
            <div className="max-w-2xl">
              <Tabs defaultActiveKey="content" className="w-full">
                <TabPane
                  tab={
                    <span className="flex items-center gap-2">
                      <Edit3 className="h-4 w-4" />
                      Contenido
                    </span>
                  }
                  key="content">
                  <InvitationContentTab
                    eventName={eventName}
                    setEventName={(name) => {
                      setEventName(name);
                      setHasUnsavedChanges(true);
                    }}
                    formData={formData}
                    handleFieldChange={handleFieldChange}
                    sections={sections}
                  />
                </TabPane>

                <TabPane
                  tab={
                    <span className="flex items-center gap-2">
                      <Settings className="h-4 w-4" />
                      Diseño
                    </span>
                  }
                  key="design">
                  <div className="my-6">
                    <h2 className="text-2xl font-light text-foreground mb-2">Personaliza tu Invitación</h2>
                    <p className="text-muted-foreground font-light mb-8">Elige colores y configura las secciones de tu invitación</p>
                  </div>

                  <InvitationSectionManager
                    sections={sections}
                    selectedPalette={selectedPalette}
                    onSectionsChange={setSections}
                    onPaletteChange={setSelectedPalette}
                  />
                </TabPane>
              </Tabs>
            </div>
          </div>

          {/* Right Panel - Live Preview */}
          <div className="bg-[#f5f5f7] p-8 lg:p-12 overflow-y-auto h-full border-l border-border/30">
            <div className="flex items-center justify-between mb-6">
              <Title level={3} className="text-xl font-light text-foreground">
                Vista Previa
              </Title>
              <MLButton
                buttonType="outline"
                onClick={() => {
                  if (!isDraft && currentUser?.slug) {
                    onPreview(`${currentUser.slug}/${giftListId}`);
                  }
                }}
                disabled={isDraft}
                icon={<Eye className="h-4 w-4" />}>
                Ver en Página Pública
              </MLButton>
            </div>

            <InvitationPreview
              templateId={template?.id || invitation?.templateId || 'elegant-wedding'}
              data={{
                ...formData,
                userSlug: currentUser?.slug || '',
                giftListId: giftListId?.toString() || '',
              }}
              sections={sections}
              palette={selectedPalette}
            />
          </div>
        </div>
      </div>

      {/* Publish Modal */}
      <PublishModal
        isOpen={showPublishModal}
        onClose={() => setShowPublishModal(false)}
        onConfirm={handlePublishConfirm}
        slug={currentUser?.slug || ''}
        giftListId={giftListId}
        eventName={eventName}
      />
    </div>
  );
}
