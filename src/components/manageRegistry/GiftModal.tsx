import { Button, Form, Input, InputNumber, Modal, Checkbox, message, Select } from 'antd';
import { useState, useEffect } from 'react';
import { useCreateGift, useGiftById, useUpdateGift } from 'hooks/useGift';
import { useUploadFile } from 'hooks/useFiles';
import { FileUpload } from '../core/FileUpload';
import { useCategoriesByWeddingList } from 'hooks/useWeddingList';
import { Gift } from 'types/models/gift';

interface GiftModalProps {
  weddingListId?: number;
  giftId?: number;
  open: boolean;
  onCancel: () => void;
  afterClose: () => void;
}

export const GiftModal = ({ weddingListId, giftId, open, onCancel, afterClose }: GiftModalProps) => {
  const [imageUrl, setImageUrl] = useState<string>();
  const [uploadFiles, setUploadFiles] = useState<File[]>([]);
  const [form] = Form.useForm();

  const isEditing = !!giftId;
  const { data: existingGift, isLoading: loadingGift } = useGiftById(giftId, { enabled: isEditing });
  const { data: categories } = useCategoriesByWeddingList(weddingListId);
  const { mutate: createGift, isSuccess: createSuccess, isError: createError } = useCreateGift();
  const { mutate: updateGift, isSuccess: updateSuccess, isError: updateError } = useUpdateGift();
  const { mutate: uploadFile, data: imageData } = useUploadFile();

  useEffect(() => {
    if (uploadFiles.length > 0) {
      uploadFile(uploadFiles[0]);
    }
  }, [uploadFiles]);

  const handleFinish = (values: any) => {
    let categoriesPayload = values.categories;
    if (Array.isArray(categoriesPayload)) {
      categoriesPayload = categoriesPayload.map((cat: string) => ({ name: cat }));
    }

    if (isEditing && giftId) {
      const updatedGiftData = {
        ...values,
        categories: categoriesPayload,
        imageUrl: imageUrl || existingGift?.imageUrl,
      };
      updateGift({ id: giftId, data: updatedGiftData });
    } else {
      const newGift = {
        ...values,
        categories: categoriesPayload,
        weddingListId,
        imageUrl,
        isPurchased: false,
      };
      createGift(newGift);
    }
    onCancel();
  };

  useEffect(() => {
    if (imageData) {
      setImageUrl(imageData);
    }
  }, [imageData]);

  // Load existing gift data when editing
  useEffect(() => {
    if (isEditing && existingGift && open) {
      form.setFieldsValue({
        title: existingGift.title,
        price: existingGift.price,
        quantity: existingGift.quantity,
        isMostWanted: existingGift.isMostWanted,
        // @ts-ignore
        categories: existingGift.categories,
        description: existingGift.description,
      });
      setImageUrl(existingGift.imageUrl || undefined);
    } else if (!isEditing && open) {
      // Reset form for new gift
      form.resetFields();
      setImageUrl(undefined);
      setUploadFiles([]);
    }
  }, [isEditing, existingGift, open]);

  useEffect(() => {
    if (createSuccess) {
      message.success('Regalo agregado correctamente!');
    }
    if (createError) {
      message.error('Error al agregar el regalo');
    }
    if (updateSuccess) {
      message.success('Regalo actualizado correctamente!');
    }
    if (updateError) {
      message.error('Error al actualizar el regalo');
    }
  }, [createSuccess, createError, updateSuccess, updateError]);
  const categoryOptions = categories?.categories?.map((category: any) => ({ value: category.name, label: category.name }));

  return (
    <Modal
      afterClose={afterClose}
      destroyOnHidden
      title={isEditing ? 'Editar Regalo' : 'Agregar Regalo'}
      open={open}
      onCancel={onCancel}
      footer={null}
      width={700}>
      <Form<Gift>
        form={form}
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
            <Form.Item
              className="!mb-2"
              name="title"
              label="Título"
              rules={[{ required: true, message: 'Por favor ingresa el título del regalo' }]}>
              <Input />
            </Form.Item>

            {/* Category */}
            <Form.Item className="!mb-2" name="categories" label="Categoría">
              <Select
                mode="tags"
                allowClear
                optionFilterProp="label"
                style={{ width: '100%' }}
                placeholder="Selecciona de 1 a 3 categorías"
                options={categoryOptions}
                maxCount={3}
              />
            </Form.Item>

            <div className="flex gap-4">
              <Form.Item
                name="price"
                label="Precio ($)"
                className="w-1/2 !mb-2"
                rules={[{ required: true, message: 'Por favor ingresa el precio del regalo' }]}>
                <InputNumber className="w-full" />
              </Form.Item>

              <Form.Item
                name="quantity"
                label="Cantidad"
                className="w-1/2 !mb-2"
                rules={[{ required: true, message: 'Por favor ingresa la cantidad' }]}>
                <InputNumber className="w-full" min={1} />
              </Form.Item>
            </div>

            {/* Most Wanted checkbox */}
            <div className="mb-4">
              <Form.Item className="!mb-0" name="isMostWanted" valuePropName="checked">
                <Checkbox>Más Deseado</Checkbox>
              </Form.Item>
              <div className="text-gray-500 text-sm">¡Deja que tus invitados sepan cuáles son tus regalos imprescindibles!</div>
            </div>

            {/* Description */}
            <Form.Item className="!mb-0" name="description" label="Descripción del artículo">
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
          <Button type="primary" htmlType="submit" loading={loadingGift}>
            {isEditing ? 'Actualizar Regalo' : 'Agregar Regalo'}
          </Button>
        </div>
      </Form>
    </Modal>
  );
};
