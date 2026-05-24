import { Form, Input, Checkbox, type FormInstance } from 'antd';
import { Collapsible } from 'components/core/Collapsible';
import { SaveBar } from './SaveBar';

interface ProfileSectionProps {
  form: FormInstance;
  isWeddingAccount: boolean;
  onWeddingAccountChange: (checked: boolean) => void;
  onValuesChange: () => void;
  isUpdating: boolean;
  hasChanges: boolean;
  onSave: () => void;
}

export function ProfileSection({
  form,
  isWeddingAccount,
  onWeddingAccountChange,
  onValuesChange,
  isUpdating,
  hasChanges,
  onSave,
}: ProfileSectionProps) {
  return (
    <div>
      <Form form={form} layout="vertical" onValuesChange={onValuesChange} className="space-y-10">
        <div>
          <h3 className="text-xs tracking-[0.18em] uppercase text-foreground/65 font-bold mb-4">Datos personales</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Form.Item
              name="firstName"
              className="mb-0!"
              label={<span className="text-sm text-foreground/70 font-medium">Nombre</span>}
              rules={[{ required: true, message: 'El nombre es requerido' }]}>
              <Input className="h-12 px-4 bg-[#f5f5f7]!" />
            </Form.Item>

            <Form.Item
              name="lastName"
              className="mb-0!"
              label={<span className="text-sm text-foreground/70 font-medium">Apellido</span>}
              rules={[{ required: true, message: 'El apellido es requerido' }]}>
              <Input className="h-12 px-4 bg-[#f5f5f7]!" />
            </Form.Item>

            <Form.Item
              name="phoneNumber"
              label={<span className="text-sm text-foreground/70 font-medium">Teléfono</span>}
              className="md:col-span-2 mb-0!"
              rules={[
                { required: true, message: 'El teléfono es requerido' },
                { pattern: /^[\d\s\-\+\(\)]{10,}$/, message: 'Teléfono inválido' },
              ]}>
              <Input className="h-12 px-4 bg-[#f5f5f7]!" placeholder="55 1234 5678" />
            </Form.Item>
          </div>
        </div>

        <div className="pt-2">
          <h3 className="text-xs tracking-[0.18em] uppercase text-foreground/65 font-bold mb-4">Pareja</h3>
          <Checkbox checked={isWeddingAccount} onChange={(e) => onWeddingAccountChange(e.target.checked)} className="text-base mb-4">
            <span className="text-foreground font-medium">Esta es una cuenta de boda</span>
          </Checkbox>

          <Collapsible isOpen={isWeddingAccount}>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-2">
              <Form.Item name="spouseFirstName" className="mb-0!" label={<span className="text-sm text-foreground/70 font-medium">Nombre de la pareja</span>}>
                <Input className="h-12 px-4 bg-[#f5f5f7]!" placeholder="Ej: María" />
              </Form.Item>

              <Form.Item name="spouseLastName" className="mb-0!" label={<span className="text-sm text-foreground/70 font-medium">Apellido de la pareja</span>}>
                <Input className="h-12 px-4 bg-[#f5f5f7]!" placeholder="Ej: García" />
              </Form.Item>
            </div>
          </Collapsible>
        </div>
      </Form>

      <SaveBar onSave={onSave} disabled={isUpdating || !hasChanges} loading={isUpdating} label="Guardar perfil" />
    </div>
  );
}
