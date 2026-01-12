import { useState, useEffect } from 'react';
import { Button, Input, Card, Space, Typography, DatePicker, TimePicker } from 'antd';
import { ArrowLeft, Save, Eye, Send, Calendar as CalendarIcon } from 'lucide-react';
import { InvitationPreview } from './InvitationPreview';
import { PublishModal } from './PublishModal';
import type { InvitationTemplate, Invitation } from 'src/app/routes/couple/Invitations';
import dayjs from 'dayjs';

const { TextArea } = Input;
const { Title, Text, Paragraph } = Typography;

interface InvitationEditorProps {
  template: InvitationTemplate | null;
  invitation: Invitation | null;
  onBack: () => void;
  onPreview: (slug: string) => void;
}

export function InvitationEditor({ template, invitation, onBack, onPreview }: InvitationEditorProps) {
  const [formData, setFormData] = useState<Record<string, string>>({});
  const [eventName, setEventName] = useState('');
  const [showPublishModal, setShowPublishModal] = useState(false);
  const [isDraft, setIsDraft] = useState(true);

  // Initialize form data
  useEffect(() => {
    if (invitation) {
      setFormData(invitation.data);
      setEventName(invitation.eventName);
      setIsDraft(invitation.status === 'draft');
    } else if (template) {
      const initialData: Record<string, string> = {};
      template.fields.forEach((field) => {
        initialData[field.key] = field.defaultValue || '';
      });
      setFormData(initialData);
      setEventName('');
    }
  }, [template, invitation]);

  const handleFieldChange = (key: string, value: string) => {
    setFormData((prev) => ({
      ...prev,
      [key]: value,
    }));
  };

  const handleSaveDraft = () => {
    console.log('Saving draft...', { eventName, formData });
    // In real implementation, this would save to database
  };

  const handlePublish = () => {
    if (!eventName.trim()) {
      return;
    }

    // Validate required fields
    const hasRequiredData = template?.fields.some((field) => formData[field.key] && formData[field.key].trim() !== '');

    if (!hasRequiredData) {
      return;
    }

    setShowPublishModal(true);
  };

  const handlePublishConfirm = () => {
    console.log('Publishing invitation...', { eventName, formData });
    setIsDraft(false);
    setShowPublishModal(false);
    // In real implementation, this would save to database and generate public URL
  };

  const currentTemplate = template || {
    id: 'elegant-wedding',
    name: 'Boda Elegante',
    fields: [],
    category: 'wedding' as const,
    description: '',
    thumbnail: '',
    previewComponent: 'ElegantWeddingPreview',
  };

  const generateSlug = () => {
    return (
      eventName
        .toLowerCase()
        .replace(/\s+/g, '-')
        .replace(/[^a-z0-9-]/g, '') || 'mi-evento'
    );
  };

  return (
    <div className="min-h-screen bg-[#f5f5f7]">
      {/* Header */}
      <div className="bg-white border-b border-border/30 sticky top-0 z-10">
        <div className="max-w-[1800px] mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Button onClick={onBack} type="text" className="rounded-full hover:bg-[#f5f5f7]" icon={<ArrowLeft className="h-5 w-5" />} />
              <div>
                <h1 className="text-xl font-light text-foreground">{invitation ? 'Editar Invitación' : 'Nueva Invitación'}</h1>
                <p className="text-sm text-muted-foreground font-light">{currentTemplate.name}</p>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <Button
                onClick={handleSaveDraft}
                className="rounded-full border-border hover:bg-[#f5f5f7] font-light"
                icon={<Save className="h-4 w-4" />}>
                Guardar Borrador
              </Button>
              <Button
                onClick={handlePublish}
                type="primary"
                className="bg-[#007aff] hover:bg-[#0051d0] text-white rounded-full font-light px-6"
                icon={<Send className="h-4 w-4" />}>
                Publicar
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Split Screen Layout */}
      <div className="max-w-[1800px] mx-auto">
        <div className="grid grid-cols-1 lg:grid-cols-2 min-h-[calc(100vh-73px)]">
          {/* Left Panel - Form */}
          <div className="bg-white p-8 lg:p-12 overflow-y-auto">
            <div className="max-w-2xl">
              <Title level={2} className="text-2xl font-light mb-2">
                Detalles del Evento
              </Title>
              <Paragraph className="text-muted-foreground font-light mb-8">
                Completa la información para personalizar tu invitación
              </Paragraph>

              <div className="space-y-6">
                {/* Event Name Field */}
                <div className="space-y-2">
                  <Text className="text-sm font-medium text-foreground block mb-2">Nombre del Evento</Text>
                  <Input
                    id="eventName"
                    value={eventName}
                    onChange={(e) => setEventName(e.target.value)}
                    placeholder="Ej: Boda de Ana y Carlos"
                    className="bg-[#f5f5f7] border-0 rounded-xl"
                    size="large"
                  />
                  <Text className="text-xs text-muted-foreground font-light block">Este nombre es para tu referencia interna</Text>
                </div>

                {/* Dynamic Form Fields */}
                {currentTemplate.fields &&
                  currentTemplate.fields.map((field) => (
                    <div key={field.key} className="space-y-2">
                      <Text className="text-sm font-medium text-foreground block mb-2">{field.label}</Text>

                      {field.type === 'textarea' ? (
                        <TextArea
                          id={field.key}
                          value={formData[field.key] || ''}
                          onChange={(e) => handleFieldChange(field.key, e.target.value)}
                          placeholder={field.placeholder}
                          rows={4}
                          className="bg-[#f5f5f7] border-0 rounded-xl"
                        />
                      ) : field.type === 'date' ? (
                        <DatePicker
                          id={field.key}
                          value={formData[field.key] ? dayjs(formData[field.key]) : null}
                          onChange={(date) => handleFieldChange(field.key, date ? date.format('YYYY-MM-DD') : '')}
                          placeholder={field.placeholder}
                          className="bg-[#f5f5f7] border-0 rounded-xl w-full"
                          size="large"
                        />
                      ) : field.type === 'time' ? (
                        <TimePicker
                          id={field.key}
                          value={formData[field.key] ? dayjs(formData[field.key], 'HH:mm') : null}
                          onChange={(time) => handleFieldChange(field.key, time ? time.format('HH:mm') : '')}
                          format="HH:mm"
                          className="bg-[#f5f5f7] border-0 rounded-xl w-full"
                          size="large"
                        />
                      ) : (
                        <Input
                          id={field.key}
                          value={formData[field.key] || ''}
                          onChange={(e) => handleFieldChange(field.key, e.target.value)}
                          placeholder={field.placeholder}
                          className="bg-[#f5f5f7] border-0 rounded-xl"
                          size="large"
                        />
                      )}
                    </div>
                  ))}
              </div>

              {/* Helper Card */}
              <Card className="mt-8 border-0 bg-[#e8f5e9] rounded-2xl overflow-hidden">
                <div className="p-6">
                  <div className="flex gap-3">
                    <div className="flex-shrink-0">
                      <div className="w-10 h-10 bg-[#34c759] rounded-full flex items-center justify-center">
                        <Eye className="h-5 w-5 text-white" />
                      </div>
                    </div>
                    <div>
                      <Title level={5} className="font-medium text-foreground mb-1">
                        Vista Previa en Tiempo Real
                      </Title>
                      <Text className="text-sm text-muted-foreground font-light">
                        Los cambios que realices se reflejan automáticamente en la vista previa de la derecha
                      </Text>
                    </div>
                  </div>
                </div>
              </Card>
            </div>
          </div>

          {/* Right Panel - Live Preview */}
          <div className="bg-[#f5f5f7] p-8 lg:p-12 overflow-y-auto border-l border-border/30">
            <div className="sticky top-8">
              <div className="flex items-center justify-between mb-6">
                <Title level={3} className="text-xl font-light text-foreground">
                  Vista Previa
                </Title>
                <Button
                  className="rounded-full border-border hover:bg-white font-light"
                  onClick={() => {
                    if (!isDraft) {
                      onPreview(generateSlug());
                    }
                  }}
                  disabled={isDraft}
                  icon={<Eye className="h-4 w-4" />}>
                  Ver en Página Pública
                </Button>
              </div>

              <InvitationPreview templateId={currentTemplate.id} data={formData} />
            </div>
          </div>
        </div>
      </div>

      {/* Publish Modal */}
      <PublishModal
        isOpen={showPublishModal}
        onClose={() => setShowPublishModal(false)}
        onConfirm={handlePublishConfirm}
        slug={generateSlug()}
        eventName={eventName}
      />
    </div>
  );
}
