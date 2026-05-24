import { Form, Input } from 'antd';
import { Save } from 'lucide-react';
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
    <section>
      <Form form={form} layout="vertical" onValuesChange={onValuesChange}>
        <div className="space-y-6">
          <Form.Item
            name="confirmationMessage"
            className="mb-0!"
            label={<span className="text-sm text-foreground/70 font-medium">Mensaje de confirmación</span>}
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
            className="mb-0!"
            label={<span className="text-sm text-foreground/70 font-medium">Mensaje de cancelación</span>}
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

      <div className="mt-10 pt-6 border-t border-border/40 flex items-center justify-between gap-4">
        <p className="text-xs text-foreground/60 font-medium">
          {!hasChanges ? 'No hay cambios sin guardar.' : 'Tienes cambios sin guardar.'}
        </p>
        <Button
          onClick={onSave}
          disabled={isUpdating || !hasChanges}
          className="px-7 py-3 bg-[#d4704a] hover:bg-[#c25f3a] text-white rounded-full transition-all duration-200 flex items-center gap-2 border-0 disabled:opacity-40 disabled:cursor-not-allowed">
          <Save className="h-4 w-4" />
          {isUpdating ? 'Guardando...' : 'Guardar mensajes'}
        </Button>
      </div>
    </section>
  );
}
