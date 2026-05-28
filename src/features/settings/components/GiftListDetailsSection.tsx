import { Form, Input, DatePicker, Alert, type FormInstance } from 'antd';
import { Lock } from 'lucide-react';
import { SaveBar } from './SaveBar';

interface GiftListDetailsSectionProps {
  form: FormInstance;
  slug: string;
  slugError: string;
  slugCheck: { available: boolean } | undefined;
  isCheckingSlug: boolean;
  userSlug: string | undefined;
  onSlugChange: (value: string) => void;
  onValuesChange: () => void;
  isUpdating: boolean;
  hasChanges: boolean;
  onSave: () => void;
}

export function GiftListDetailsSection({
  form,
  slug,
  slugError,
  slugCheck,
  isCheckingSlug,
  userSlug,
  onSlugChange,
  onValuesChange,
  isUpdating,
  hasChanges,
  onSave,
}: GiftListDetailsSectionProps) {
  const slugChanged = slug && slug !== userSlug;
  const slugAvailable = !isCheckingSlug && slugCheck && slugCheck.available && slugChanged;

  return (
    <div>
      <Form form={form} layout="vertical" onValuesChange={onValuesChange} className="space-y-10">
        <div>
          <h3 className="text-xs tracking-[0.18em] uppercase text-foreground/65 font-bold mb-4">Enlace público</h3>
          <Form.Item
            name="slug"
            className="mb-0!"
            label={<span className="text-sm text-foreground/70 font-medium">ID de la pareja</span>}
            rules={[{ required: true, message: 'El slug es requerido' }]}
            validateStatus={slugError ? 'error' : slugAvailable ? 'success' : undefined}
            help={null}>
            <Input
              addonBefore="mesalista.com.mx/"
              value={slug}
              className="[&_input]:bg-[#f5f5f7]! [&_input]:h-12 [&_.ant-input-group-addon]:bg-white! [&_.ant-input-group-addon]:border-border!"
              onChange={(e) => {
                const value = e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, '');
                onSlugChange(value);
                form.setFieldValue('slug', value);
              }}
            />
          </Form.Item>
          <div className="space-y-1 mt-2">
            <p className="text-xs text-foreground/60">Solo letras minúsculas, números y guiones.</p>
            {isCheckingSlug && slugChanged && <p className="text-xs text-foreground/65">Verificando disponibilidad...</p>}
            {slugAvailable && <p className="text-xs text-green-700 font-medium">✓ Este enlace está disponible</p>}
            {slugError && <p className="text-xs text-red-600 font-medium">{slugError}</p>}
          </div>
          {slugChanged && (
            <Alert
              className="mt-4!"
              message="Al cambiar tu ID, la URL anterior dejará de funcionar. Recuerda compartir la nueva dirección con tus invitados."
              type="warning"
              showIcon
            />
          )}
        </div>

        <div>
          <h3 className="text-xs tracking-[0.18em] uppercase text-foreground/65 font-bold mb-4">Evento</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Form.Item
              name="weddingVenue"
              className="mb-0!"
              label={<span className="text-sm text-foreground/70 font-medium">Lugar del evento</span>}>
              <Input className="h-12 px-4 bg-[#f5f5f7]!" placeholder="Ej: Hacienda San José" />
            </Form.Item>

            <Form.Item
              name="weddingLocation"
              className="mb-0!"
              label={<span className="text-sm text-foreground/70 font-medium">Ciudad, Estado</span>}>
              <Input className="h-12 px-4 bg-[#f5f5f7]!" placeholder="Ej: Guadalajara, Jalisco" />
            </Form.Item>

            <div className="md:col-span-2 space-y-2">
              <Form.Item
                name="weddingDate"
                className="mb-0!"
                label={<span className="text-sm text-foreground/70 font-medium">Fecha del evento</span>}>
                <DatePicker
                  disabled
                  className="w-full h-12 bg-[#f5f5f7]! border-none! [&.ant-picker-disabled]:opacity-70 [&.ant-picker-disabled]:cursor-not-allowed"
                  format="MMM DD, YYYY"
                  placeholder="Selecciona la fecha"
                />
              </Form.Item>
              <div className="flex items-start gap-2">
                <Lock className="h-3 w-3 text-info mt-0.25 shrink-0" />
                <p className="text-xs text-info font-medium">
                  Para cambiar esta fecha, por favor contacta al equipo de MesaLista a{' '}
                  <a href="mailto:info@mesalista.com.mx" className="underline font-semibold">
                    info@mesalista.com.mx
                  </a>
                  .
                </p>
              </div>
            </div>
          </div>
        </div>

        <div>
          <h3 className="text-xs tracking-[0.18em] uppercase text-foreground/65 font-bold mb-4">Mensaje a tus invitados</h3>
          <Form.Item name="weddingListDescription" className="mb-0!">
            <Input.TextArea
              rows={5}
              placeholder="Describe tu mesa de regalos, comparte tu historia o deja un mensaje para tus invitados..."
              className="bg-[#f5f5f7]! resize-none"
              maxLength={500}
              showCount
            />
          </Form.Item>
        </div>
      </Form>

      <SaveBar onSave={onSave} disabled={isUpdating || !hasChanges} loading={isUpdating} label="Guardar información" />
    </div>
  );
}
