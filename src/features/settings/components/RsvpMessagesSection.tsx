import { Form, Input } from 'antd';
import { MessageSquare, Save } from 'lucide-react';
import { Button } from 'components/core/Button';

interface RsvpMessagesSectionProps {
  form: any;
  isUpdating: boolean;
  hasChanges: boolean;
  onSave: () => void;
  onValuesChange: () => void;
}

export function RsvpMessagesSection({ form, isUpdating, hasChanges, onSave, onValuesChange }: RsvpMessagesSectionProps) {
  return (
    <section className="space-y-6">
      <div>
        <h2 className="text-3xl tracking-tight text-foreground mb-2 flex items-center gap-2">
          <MessageSquare className="h-8 w-8" />
          Mensajes de confirmación
        </h2>
        <p className="text-muted-foreground font-light">
          Personaliza los mensajes que verán tus invitados al confirmar o cancelar su asistencia
        </p>
      </div>

      <Form form={form} layout="vertical" onValuesChange={onValuesChange}>
        <div className="space-y-4">
          <Form.Item
            name="confirmationMessage"
            label={<span className="text-sm text-muted-foreground">Mensaje de confirmación</span>}
            rules={[{ required: true, message: 'El mensaje de confirmación es requerido' }]}>
            <Input.TextArea
              rows={3}
              maxLength={200}
              showCount
              placeholder="¡Gracias por confirmar tu asistencia! Nos encantará verte en nuestra boda."
              className="px-4 py-3 bg-[#f5f5f7]!"
            />
          </Form.Item>

          <Form.Item
            name="cancellationMessage"
            label={<span className="text-sm text-muted-foreground">Mensaje de cancelación</span>}
            rules={[{ required: true, message: 'El mensaje de cancelación es requerido' }]}>
            <Input.TextArea
              rows={3}
              maxLength={200}
              showCount
              placeholder="Lamentamos que no puedas asistir. ¡Gracias por avisarnos!"
              className="px-4 py-3 bg-[#f5f5f7]!"
            />
          </Form.Item>
        </div>
      </Form>

      <div className="flex justify-center pt-4">
        <Button
          onClick={onSave}
          disabled={isUpdating || !hasChanges}
          className="px-8 py-3 bg-[#d4704a] hover:bg-[#c25f3a] text-white rounded-full transition-all duration-200 flex items-center gap-2 border-0 disabled:opacity-50 disabled:cursor-not-allowed">
          <Save className="h-5 w-5" />
          {isUpdating ? 'Guardando...' : 'Guardar mensajes'}
        </Button>
      </div>
    </section>
  );
}
