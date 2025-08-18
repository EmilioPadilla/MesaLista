import { Modal, Input, InputNumber, Select, Button, Upload } from 'antd';
import { Form } from 'antd';
import { useState } from 'react';

interface CreateWeddingGiftProps {
  isModalVisible: boolean;
  setIsModalVisible: (visible: boolean) => void;
}

export const CreateWeddingGift: React.FC<CreateWeddingGiftProps> = ({ isModalVisible, setIsModalVisible }) => {
  const { Option } = Select;
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);

  const handleSubmit = (values: any) => {
    setIsModalVisible(false);
    form.resetFields();
    setLoading(false);
  };

  const handleCancel = () => {
    setIsModalVisible(false);
    form.resetFields();
  };

  return (
    <Modal title="Agregar Nuevo Regalo" open={isModalVisible} onCancel={handleCancel} footer={null}>
      <Form form={form} layout="vertical" onFinish={handleSubmit}>
        <Form.Item name="name" label="Nombre del Regalo" rules={[{ required: true, message: 'Por favor ingresa el nombre del regalo' }]}>
          <Input />
        </Form.Item>
        <Form.Item name="description" label="Descripción" rules={[{ required: true, message: 'Por favor ingresa una descripción' }]}>
          <Input.TextArea rows={3} />
        </Form.Item>
        <Form.Item name="price" label="Precio" rules={[{ required: true, message: 'Por favor ingresa el precio' }]}>
          <InputNumber
            formatter={(value) => `$ ${value}`.replace(/\B(?=(\d{3})+(?!\d))/g, ',')}
            parser={(value) => value!.replace(/\$\s?|(,*)/g, '')}
            style={{ width: '100%' }}
          />
        </Form.Item>
        <Form.Item name="category" label="Categoría" rules={[{ required: true, message: 'Por favor selecciona una categoría' }]}>
          <Select placeholder="Selecciona una categoría">
            <Option value="Cocina">Cocina</Option>
            <Option value="Electrodomésticos">Electrodomésticos</Option>
            <Option value="Dormitorio">Dormitorio</Option>
            <Option value="Baño">Baño</Option>
            <Option value="Decoración">Decoración</Option>
            <Option value="Otros">Otros</Option>
          </Select>
        </Form.Item>
        <Form.Item name="imageUrl" label="URL de la Imagen (opcional)">
          <Upload.Dragger onChange={() => setLoading(true)}>
            <div className="h-10 flex items-center justify-center">Click or drag file to this area to upload</div>
          </Upload.Dragger>
        </Form.Item>
        <Form.Item>
          <div className="flex justify-end">
            <Button onClick={handleCancel} style={{ marginRight: 8 }}>
              Cancelar
            </Button>
            <Button type="primary" htmlType="submit">
              Guardar
            </Button>
          </div>
        </Form.Item>
      </Form>
    </Modal>
  );
};
