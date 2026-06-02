import { Form, Input } from 'antd';
import { Save } from 'lucide-react';
import { Button } from 'components/core/Button';

interface ThankYouMessageSectionProps {
  form: any;
  isUpdating: boolean;
  hasChanges: boolean;
  onSave: () => void;
  onValuesChange: () => void;
}

export function ThankYouMessageSection({ form, isUpdating, hasChanges, onSave, onValuesChange }: ThankYouMessageSectionProps) {
  return (
    <section>
      <Form form={form} layout="vertical" onValuesChange={onValuesChange}>
        <Form.Item
          name="thankYouMessage"
          className="mb-0!"
          label={<span className="text-sm text-foreground/70 font-medium">Mensaje para tus invitados</span>}>
          <Input.TextArea
            rows={4}
            maxLength={500}
            showCount
            placeholder="¡Gracias de corazón por tu regalo! Nos emociona muchísimo recibirlo y sentir tu cariño tan cerquita."
            className="px-4 py-3 bg-[#f5f5f7]!"
          />
        </Form.Item>
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
          {isUpdating ? 'Guardando...' : 'Guardar mensaje'}
        </Button>
      </div>
    </section>
  );
}
