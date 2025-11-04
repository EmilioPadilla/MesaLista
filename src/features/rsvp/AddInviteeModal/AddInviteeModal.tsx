import { useEffect } from 'react';
import { Modal, Input, Button, Form, message } from 'antd';

interface Invitee {
  firstName: string;
  lastName: string;
  tickets: number;
  secretCode: string;
}

interface AddInviteeModalProps {
  open: boolean;
  invitee?: (Invitee & { id: string; status: string }) | null;
  onClose: () => void;
  onSave: (invitee: Invitee) => void;
}

export function AddInviteeModal({ open, invitee, onClose, onSave }: AddInviteeModalProps) {
  const [form] = Form.useForm();

  useEffect(() => {
    if (invitee) {
      form.setFieldsValue({
        firstName: invitee.firstName,
        lastName: invitee.lastName,
        tickets: invitee.tickets,
        secretCode: invitee.secretCode,
      });
    } else {
      form.resetFields();
    }
  }, [invitee, form]);

  const generateSecretCode = () => {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    let code = '';
    for (let i = 0; i < 8; i++) {
      code += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    form.setFieldValue('secretCode', code);
  };

  const handleSubmit = async () => {
    try {
      const values = await form.validateFields();
      onSave(values);
      form.resetFields();
    } catch (error) {
      message.error('Por favor, completa todos los campos requeridos');
    }
  };

  const handleCancel = () => {
    form.resetFields();
    onClose();
  };

  return (
    <Modal
      title={invitee ? 'Editar Invitado' : 'Agregar Invitado'}
      open={open}
      onCancel={handleCancel}
      onOk={handleSubmit}
      okText={invitee ? 'Guardar Cambios' : 'Agregar Invitado'}
      cancelText="Cancelar"
      width={500}>
      <Form form={form} layout="vertical" className="mt-4">
        <Form.Item name="firstName" label="Nombre" rules={[{ required: true, message: 'El nombre es requerido' }]}>
          <Input className="shadow-sm" placeholder="Juan" />
        </Form.Item>

        <Form.Item name="lastName" label="Apellido" rules={[{ required: true, message: 'El apellido es requerido' }]}>
          <Input className="shadow-sm" placeholder="Pérez" />
        </Form.Item>

        <Form.Item
          name="tickets"
          label="Número de Boletos"
          rules={[{ required: true, message: 'El número de boletos es requerido' }]}
          extra="Número máximo de personas que pueden asistir con esta invitación">
          <Input className="shadow-sm" type="number" min={1} placeholder="1" />
        </Form.Item>

        <div className="flex gap-2 items-center">
          <Form.Item
            name="secretCode"
            label="Código Secreto"
            className="flex-1 mb-0!"
            rules={[{ required: true, message: 'El código secreto es requerido' }]}
            extra="Este código será necesario para confirmar la asistencia">
            <Input placeholder="ABC12345" className="flex-1 shadow-sm" />
          </Form.Item>
          <Button className="border! border-primary! text-primary!" onClick={generateSecretCode}>
            Generar
          </Button>
        </div>
      </Form>
    </Modal>
  );
}
