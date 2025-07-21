import { Button, Form, Input, InputNumber, Modal, Checkbox, message } from 'antd';
import { useState, useEffect } from 'react';
import { Gift } from '@prisma/client';
import { useCreateGift } from 'hooks/useGift';
import { useUploadFile } from 'hooks/useFiles';
import { FileUpload } from '../core/FileUpload';

interface AddGiftProps {
  weddingListId?: number;
  open: boolean;
  onCancel: () => void;
  afterClose: () => void;
}

export const AddGiftModal = ({ weddingListId, open, onCancel, afterClose }: AddGiftProps) => {
  const [imageUrl, setImageUrl] = useState<string>();
  const [uploadFiles, setUploadFiles] = useState<File[]>([]);

  const { mutate: createGift, isSuccess: createSuccess, isError: createError } = useCreateGift();
  const { mutate: uploadFile, data: imageData } = useUploadFile();

  useEffect(() => {
    if (uploadFiles.length > 0) {
      uploadFile(uploadFiles[0]);
    }
  }, [uploadFiles]);

  const handleFinish = (values: any) => {
    const newGift = {
      ...values,
      weddingListId,
      imageUrl,
      isPurchased: false,
    };
    createGift(newGift);
    onCancel();
  };

  useEffect(() => {
    if (imageData) {
      setImageUrl(imageData);
    }
  }, [imageData]);

  useEffect(() => {
    if (createSuccess) {
      message.success('Regalo agregado correctamente!');
    }
    if (createError) {
      message.error('Error al agregar el regalo');
    }
  }, [createSuccess, createError]);

  return (
    <Modal afterClose={afterClose} destroyOnHidden title="Agregar Regalo" open={open} onCancel={onCancel} footer={null} width={700}>
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
            {imageUrl ? (
              <img src={imageUrl} alt="Gift" className="max-h-full max-w-full object-contain" />
            ) : (
              <FileUpload
                value={uploadFiles[0]}
                onChange={(file: File | null) => {
                  if (file) {
                    setUploadFiles([file]);
                  }
                }}
              />
            )}
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
