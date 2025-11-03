import { useEffect } from 'react';
import { Modal, Form, Input, InputNumber, Select, DatePicker } from 'antd';
import { DiscountCode, UpdateDiscountCodeRequest } from 'services/discountCode.service';
import dayjs from 'dayjs';

interface EditDiscountCodeModalProps {
  open: boolean;
  discountCode: DiscountCode | null;
  onCancel: () => void;
  onSubmit: (id: number, data: UpdateDiscountCodeRequest) => Promise<void>;
  isLoading: boolean;
}

export const EditDiscountCodeModal = ({ open, discountCode, onCancel, onSubmit, isLoading }: EditDiscountCodeModalProps) => {
  const [form] = Form.useForm();

  useEffect(() => {
    if (discountCode && open) {
      form.setFieldsValue({
        code: discountCode.code,
        discountType: discountCode.discountType,
        discountValue: discountCode.discountValue,
        usageLimit: discountCode.usageLimit,
        isActive: discountCode.isActive,
        expiresAt: discountCode.expiresAt ? dayjs(discountCode.expiresAt) : null,
      });
    }
  }, [discountCode, open, form]);

  const handleCancel = () => {
    form.resetFields();
    onCancel();
  };

  const handleFinish = async (values: any) => {
    if (!discountCode) return;

    await onSubmit(discountCode.id, {
      code: values.code,
      discountType: values.discountType,
      discountValue: values.discountValue,
      usageLimit: values.usageLimit,
      isActive: values.isActive,
      expiresAt: values.expiresAt ? values.expiresAt.toISOString() : undefined,
    });
    form.resetFields();
  };

  return (
    <Modal
      title="Editar Código de Descuento"
      open={open}
      onCancel={handleCancel}
      onOk={() => form.submit()}
      confirmLoading={isLoading}>
      <Form form={form} layout="vertical" onFinish={handleFinish}>
        <Form.Item name="code" label="Código" rules={[{ required: true, message: 'El código es requerido' }]}>
          <Input placeholder="VERANO2024" onChange={(e) => form.setFieldValue('code', e.target.value.toUpperCase())} />
        </Form.Item>

        <Form.Item
          name="discountType"
          label="Tipo de Descuento"
          rules={[{ required: true, message: 'Selecciona el tipo' }]}>
          <Select placeholder="Selecciona el tipo">
            <Select.Option value="PERCENTAGE">Porcentaje</Select.Option>
            <Select.Option value="FIXED_AMOUNT">Cantidad Fija</Select.Option>
          </Select>
        </Form.Item>

        <Form.Item
          name="discountValue"
          label="Valor del Descuento"
          rules={[{ required: true, message: 'El valor es requerido' }]}>
          <InputNumber
            min={0}
            max={form.getFieldValue('discountType') === 'PERCENTAGE' ? 100 : undefined}
            style={{ width: '100%' }}
            placeholder="10"
          />
        </Form.Item>

        <Form.Item
          name="usageLimit"
          label="Límite de Uso"
          rules={[{ required: true, message: 'El límite es requerido' }]}>
          <InputNumber min={1} style={{ width: '100%' }} placeholder="100" />
        </Form.Item>

        <Form.Item name="isActive" label="Estado" valuePropName="checked">
          <Select>
            <Select.Option value={true}>Activo</Select.Option>
            <Select.Option value={false}>Inactivo</Select.Option>
          </Select>
        </Form.Item>

        <Form.Item name="expiresAt" label="Fecha de Expiración (Opcional)">
          <DatePicker style={{ width: '100%' }} format="DD/MM/YYYY" />
        </Form.Item>
      </Form>
    </Modal>
  );
};
