import { Modal, Form, Input, InputNumber, Select, DatePicker } from 'antd';
import { CreateDiscountCodeRequest } from 'services/discountCode.service';

interface CreateDiscountCodeModalProps {
  open: boolean;
  onCancel: () => void;
  onSubmit: (values: CreateDiscountCodeRequest) => Promise<void>;
  isLoading: boolean;
}

export const CreateDiscountCodeModal = ({ open, onCancel, onSubmit, isLoading }: CreateDiscountCodeModalProps) => {
  const [form] = Form.useForm();

  const handleCancel = () => {
    form.resetFields();
    onCancel();
  };

  const handleFinish = async (values: any) => {
    await onSubmit({
      code: values.code,
      discountType: values.discountType,
      discountValue: values.discountValue,
      usageLimit: values.usageLimit,
      expiresAt: values.expiresAt ? values.expiresAt.toISOString() : undefined,
    });
    form.resetFields();
  };

  return (
    <Modal title="Crear Código de Descuento" open={open} onCancel={handleCancel} onOk={() => form.submit()} confirmLoading={isLoading}>
      <Form form={form} layout="vertical" onFinish={handleFinish}>
        <Form.Item name="code" label="Código" rules={[{ required: true, message: 'El código es requerido' }]}>
          <Input
            className="shadow-sm"
            placeholder="VERANO2024"
            onChange={(e) => form.setFieldValue('code', e.target.value.toUpperCase())}
          />
        </Form.Item>

        <Form.Item name="discountType" label="Tipo de Descuento" rules={[{ required: true, message: 'Selecciona el tipo' }]}>
          <Select className="shadow-sm" placeholder="Selecciona el tipo">
            <Select.Option value="PERCENTAGE">Porcentaje</Select.Option>
            <Select.Option value="FIXED_AMOUNT">Cantidad Fija</Select.Option>
          </Select>
        </Form.Item>

        <Form.Item name="discountValue" label="Valor del Descuento" rules={[{ required: true, message: 'El valor es requerido' }]}>
          <Input
            type="number"
            min={0}
            max={form.getFieldValue('discountType') === 'PERCENTAGE' ? 100 : undefined}
            style={{ width: '100%' }}
            className="shadow-sm"
            placeholder="10"
          />
        </Form.Item>

        <Form.Item name="usageLimit" label="Límite de Uso" rules={[{ required: true, message: 'El límite es requerido' }]}>
          <Input type="number" min={1} style={{ width: '100%' }} className="shadow-sm" placeholder="100" />
        </Form.Item>

        <Form.Item name="expiresAt" label="Fecha de Expiración (Opcional)">
          <DatePicker className="shadow-sm" style={{ width: '100%' }} format="DD/MM/YYYY" />
        </Form.Item>
      </Form>
    </Modal>
  );
};
