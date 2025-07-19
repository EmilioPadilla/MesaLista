import { Button, Form, Input, InputNumber, Modal, Upload, Typography, Checkbox } from 'antd';
import { LoadingOutlined, PlusOutlined } from '@ant-design/icons';
import { useState } from 'react';
import { Gift } from '@prisma/client';
import { UploadChangeParam } from 'antd/es/upload';
import { useCreateGift } from 'hooks/useGift';

interface AddGiftProps {
  open: boolean;
  onCancel: () => void;
}

const { Text } = Typography;

export const AddGift = ({ open, onCancel }: AddGiftProps) => {
  const [imageUrl, setImageUrl] = useState<string>();
  const [loading, setLoading] = useState(false);
  const [isDragging, setIsDragging] = useState(false);

  const { mutate: createGift } = useCreateGift();

  const handleFinish = (values: any) => {
    const newGift = {
      ...values,
      imageUrl,
      isPurchased: false,
    };
    console.log('New gift:', newGift);
    createGift(newGift);
    onCancel();
  };

  const uploadButton = (
    <span
      onDragEnter={() => setIsDragging(true)}
      onDragLeave={() => setIsDragging(false)}
      className={`flex flex-col h-64 w-full px-3 items-center justify-center border border-dashed rounded-md ${isDragging ? 'border-orange' : ''}`}>
      {loading ? <LoadingOutlined /> : <PlusOutlined className="text-xl" />}
      <div className="mt-2 flex text-center">Da click o arrastra para subir una imagen</div>
    </span>
  );

  const onDropImage = (e: React.DragEvent<HTMLDivElement>) => {
    setLoading(true);
    e.preventDefault();
    setIsDragging(false);
    const files = e.dataTransfer.files;
    if (files.length > 0) {
      const file = files[0];
      const reader = new FileReader();
      reader.onload = (e) => {
        const result = e.target?.result as string;
        setImageUrl(result);
        setLoading(false);
      };
      reader.readAsDataURL(file);
    }
  };

  const onFileChange = (info: UploadChangeParam) => {
    const file = info.file;
    console.log('file', file);
    if (!file) return;

    setLoading(true);
    const reader = new FileReader();
    reader.onload = (e) => {
      const result = e.target?.result as string;
      setImageUrl(result);
      setLoading(false);
    };
    reader.readAsDataURL(file);
  };

  return (
    <Modal title="Agregar Regalo" open={open} onCancel={onCancel} footer={null} width={700}>
      <Form<Gift>
        onFinish={handleFinish}
        layout="vertical"
        initialValues={{
          title: '',
          price: 0,
          quantity: 1,
          isMostWanted: false,
          description: '',
        }}>
        <div className="flex gap-6">
          {/* Left side - Image upload */}
          <div className="w-1/3">
            <div
              onDragEnter={() => setIsDragging(true)}
              onDragLeave={() => setIsDragging(false)}
              className={`bg-gray-100 flex flex-col items-center justify-center h-64 ${isDragging ? 'border-orange' : ''}`}>
              {imageUrl ? (
                <img src={imageUrl} alt="Gift" className="max-h-full max-w-full object-contain" />
              ) : (
                <Upload
                  showUploadList={false}
                  onDrop={onDropImage}
                  onChange={onFileChange}
                  beforeUpload={() => false} // Prevent default upload behavior
                  accept="image/*">
                  {imageUrl ? <img src={imageUrl} alt="avatar" style={{ width: '100%' }} /> : uploadButton}
                </Upload>
              )}
            </div>
          </div>

          {/* Right side - Form fields */}
          <div className="w-2/3">
            <Form.Item name="title" label="Título" rules={[{ required: true, message: 'Por favor ingresa el título del regalo' }]}>
              <Input />
            </Form.Item>

            <div className="flex gap-4">
              <Form.Item
                name="price"
                label="Precio ($)"
                className="w-1/2"
                rules={[{ required: true, message: 'Por favor ingresa el precio del regalo' }]}>
                <InputNumber className="w-full" />
              </Form.Item>

              <Form.Item
                name="quantity"
                label="Cantidad"
                className="w-1/2"
                rules={[{ required: true, message: 'Por favor ingresa la cantidad' }]}>
                <InputNumber className="w-full" min={1} />
              </Form.Item>
            </div>

            {/* Most Wanted checkbox */}
            <div className="mb-4">
              <Form.Item name="isMostWanted" valuePropName="checked">
                <Checkbox>Más Deseado</Checkbox>
              </Form.Item>
              <div className="text-gray-500 text-sm">¡Deja que tus invitados sepan cuáles son tus regalos imprescindibles!</div>
            </div>

            {/* Description */}
            <Form.Item name="description" label="Descripción del artículo">
              <Input.TextArea
                placeholder="Opcional: Describe el artículo, qué harás con él o por qué lo quieres. ¡Diviértete con esto!"
                rows={4}
              />
            </Form.Item>
          </div>
        </div>

        {/* Footer buttons */}
        <div className="flex justify-end mt-6 gap-2">
          <Button onClick={onCancel}>Cancelar</Button>
          <Button type="primary" htmlType="submit">
            Agregar Regalo
          </Button>
        </div>
      </Form>
    </Modal>
  );
};
