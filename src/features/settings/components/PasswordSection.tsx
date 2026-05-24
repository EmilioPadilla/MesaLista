import { Form, Input, type FormInstance } from 'antd';
import { PasswordStrengthIndicator } from 'components/auth/PasswordStrengthIndicator';
import { SaveBar } from './SaveBar';

interface PasswordSectionProps {
  form: FormInstance;
  password: string | undefined;
  onValuesChange: () => void;
  isUpdating: boolean;
  hasChanges: boolean;
  onSave: () => void;
}

export function PasswordSection({ form, password, onValuesChange, isUpdating, hasChanges, onSave }: PasswordSectionProps) {
  return (
    <div>
      <Form form={form} layout="vertical" onValuesChange={onValuesChange} className="space-y-4 max-w-xl">
        <Form.Item
          name="currentPassword"
          className="mb-0!"
          label={<span className="text-sm text-foreground/70 font-medium">Contraseña actual</span>}
          rules={[{ required: true, message: 'La contraseña actual es requerida' }]}>
          <Input.Password className="h-12 px-4 bg-[#f5f5f7]!" />
        </Form.Item>

        <Form.Item
          name="newPassword"
          className="mb-0!"
          label={<span className="text-sm text-foreground/70 font-medium">Nueva contraseña</span>}
          rules={[
            { required: true, message: 'La nueva contraseña es requerida' },
            { min: 8, message: 'La contraseña debe tener al menos 8 caracteres' },
          ]}>
          <Input.Password className="h-12 px-4 bg-[#f5f5f7]!" />
        </Form.Item>

        {password && <PasswordStrengthIndicator password={password} />}

        <Form.Item
          name="confirmPassword"
          className="mb-0!"
          label={<span className="text-sm text-foreground/70 font-medium">Confirmar nueva contraseña</span>}
          dependencies={['newPassword']}
          rules={[
            { required: true, message: 'Confirma tu nueva contraseña' },
            ({ getFieldValue }) => ({
              validator(_, value) {
                if (!value || getFieldValue('newPassword') === value) {
                  return Promise.resolve();
                }
                return Promise.reject(new Error('Las contraseñas no coinciden'));
              },
            }),
          ]}>
          <Input.Password className="h-12 px-4 bg-[#f5f5f7]!" />
        </Form.Item>
      </Form>

      <SaveBar
        onSave={onSave}
        disabled={isUpdating || !hasChanges}
        loading={isUpdating}
        label="Actualizar contraseña"
        loadingLabel="Actualizando..."
      />
    </div>
  );
}
