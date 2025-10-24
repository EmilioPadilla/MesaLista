import { Input, Button, Select, Modal, Upload, Image, message, Checkbox, Form } from 'antd';
import { PredesignedGift } from 'services/predesignedList.service';
import { useState, useEffect } from 'react';
import { X } from 'lucide-react';
import { UploadOutlined } from '@ant-design/icons';
import { UploadChangeParam } from 'antd/es/upload';
import { useCreatePredesignedGift, useUpdatePredesignedGift } from 'hooks/usePredesignedList';
import { useUploadFile } from 'hooks/useFiles';

interface PredesignedGiftModalProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  mode: 'create' | 'edit';
  gift?: PredesignedGift | null;
  listId?: number; // Required for create mode
  onSuccess?: () => void;
}

export function PredesignedGiftModal({ isOpen, onOpenChange, mode, gift, listId, onSuccess }: PredesignedGiftModalProps) {
  const isEditMode = mode === 'edit';
  const title = isEditMode ? 'Editar Regalo' : 'Agregar Nuevo Regalo';
  const submitText = isEditMode ? 'Guardar Cambios' : 'Agregar Regalo';

  const [form] = Form.useForm();
  const [imageState, setImageState] = useState<{
    file: File | null;
    url: string | undefined;
    name: string | undefined;
  }>({ file: null, url: undefined, name: undefined });

  // Mutations
  const { mutate: createGift, isPending: isCreating } = useCreatePredesignedGift();
  const { mutate: updateGift, isPending: isUpdating } = useUpdatePredesignedGift();
  const { mutate: uploadFile, isPending: isUploading } = useUploadFile();

  const isSubmitting = isCreating || isUpdating || isUploading;

  // Initialize form when modal opens or gift changes
  useEffect(() => {
    if (isOpen) {
      if (isEditMode && gift) {
        form.setFieldsValue({
          title: gift.title,
          description: gift.description || '',
          price: gift.price,
          categories: gift.categories || [],
          isMostWanted: gift.priority === 'alta',
        });
        setImageState({ file: null, url: gift.imageUrl || '', name: undefined });
      } else {
        form.resetFields();
        setImageState({ file: null, url: undefined, name: undefined });
      }
    }
  }, [isOpen, isEditMode, gift, form]);

  const handleImageChange = (info: UploadChangeParam) => {
    if (info.fileList && info.fileList[0]) {
      const file = info.fileList[0];
      const localUrl = URL.createObjectURL(file.originFileObj as Blob);
      setImageState({
        name: file.name,
        file: file.originFileObj as File,
        url: localUrl,
      });
    }
  };

  const handleRemoveImage = () => {
    setImageState({ file: null, url: undefined, name: undefined });
  };

  const handleFinish = (values: any) => {
    if (!isEditMode && !listId) {
      message.error('ID de lista requerido para crear regalo');
      return;
    }

    const submitData = (imageUrl?: string) => {
      const data = {
        title: values.title,
        description: values.description || '',
        price: values.price,
        imageUrl: imageUrl || imageState.url || '',
        categories: values.categories || [],
        priority: values.isMostWanted ? 'alta' : 'media',
      };

      if (isEditMode && gift) {
        updateGift(
          { giftId: gift.id, data },
          {
            onSuccess: () => {
              message.success('Regalo actualizado exitosamente');
              onOpenChange(false);
              onSuccess?.();
            },
            onError: () => {
              message.error('Error al actualizar el regalo');
            },
          },
        );
      } else if (listId) {
        createGift(
          { listId, data },
          {
            onSuccess: () => {
              message.success('Regalo creado exitosamente');
              onOpenChange(false);
              onSuccess?.();
            },
            onError: () => {
              message.error('Error al crear el regalo');
            },
          },
        );
      }
    };

    // Upload image first if there's a new file
    if (imageState.file) {
      uploadFile(imageState.file, {
        onSuccess: (uploadedUrl) => {
          submitData(uploadedUrl);
        },
        onError: () => {
          message.error('Error al subir la imagen');
        },
      });
    } else {
      submitData();
    }
  };

  const handleClose = () => {
    onOpenChange(false);
  };

  return (
    <Modal title={title} open={isOpen} onCancel={handleClose} footer={null} width={700}>
      <Form form={form} onFinish={handleFinish} layout="vertical" className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Form.Item
            name="title"
            label="Nombre del Regalo"
            rules={[{ required: true, message: 'Por favor ingresa el nombre del regalo' }]}>
            <Input placeholder="Vuelos a París" className="shadow-sm" />
          </Form.Item>

          <Form.Item
            name="price"
            label="Precio (MXN)"
            rules={[
              { required: true, message: 'Por favor ingresa el precio' },
              {
                validator: (_, value) => {
                  const numValue = Number(value);
                  if (isNaN(numValue) || numValue <= 0) {
                    return Promise.reject(new Error('El precio debe ser mayor a 0'));
                  }
                  return Promise.resolve();
                },
              },
            ]}>
            <Input type="number" placeholder="15000" className="shadow-sm" />
          </Form.Item>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Form.Item name="categories" label="Categorías">
            <Select
              mode="tags"
              allowClear
              optionFilterProp="label"
              className="shadow-sm w-full rounded"
              placeholder="Selecciona o crea categorías"
              options={[
                { label: 'Transporte', value: 'Transporte' },
                { label: 'Hospedaje', value: 'Hospedaje' },
                { label: 'Experiencias', value: 'Experiencias' },
                { label: 'Hogar', value: 'Hogar' },
                { label: 'Cocina', value: 'Cocina' },
                { label: 'Decoración', value: 'Decoración' },
                { label: 'Tecnología', value: 'Tecnología' },
              ]}
            />
          </Form.Item>

          <Form.Item name="isMostWanted" label="Prioridad Alta" valuePropName="checked">
            <Checkbox>Marcar como prioridad alta</Checkbox>
          </Form.Item>
        </div>

        <Form.Item name="description" label="Descripción">
          <Input.TextArea placeholder="Boletos de avión para dos personas" className="shadow-sm" rows={3} />
        </Form.Item>

        {/* Image Upload Section */}
        <div className="space-y-4">
          <div className="space-y-2">
            <label htmlFor="image">Imagen del Regalo</label>
            <div className="flex gap-2">
              <div className="relative w-full">
                <Upload
                  onChange={handleImageChange}
                  accept="image/*"
                  listType="picture"
                  maxCount={1}
                  beforeUpload={() => false}
                  showUploadList={false}>
                  <Button type="default" className="w-full border !border-primary !text-primary">
                    <UploadOutlined /> Seleccionar Imagen
                  </Button>
                </Upload>
                {imageState.file && <span className="ml-3 !text-md">{imageState.name}</span>}
              </div>
            </div>
          </div>

          {imageState.url && (
            <div className="space-y-2">
              <label>Vista Previa</label>
              <div className="relative flex items-center justify-center w-full max-w-sm mx-auto">
                <div className="w-full aspect-square bg-muted rounded-lg flex items-center justify-center overflow-hidden">
                  <Image src={imageState.url} alt="Vista previa" preview={false} className="w-full h-full object-cover" />
                </div>
                <div className="absolute top-2 right-2">
                  <Button
                    type="default"
                    icon={<X />}
                    className="flex items-center justify-center cursor-pointer h-6 w-6 p-0 bg-background/80 hover:bg-background shadow-md"
                    onClick={handleRemoveImage}></Button>
                </div>
              </div>
            </div>
          )}
        </div>

        <div className="flex justify-end gap-2 mt-6">
          <Button type="default" onClick={handleClose} disabled={isSubmitting}>
            Cancelar
          </Button>
          <Button type="primary" htmlType="submit" loading={isSubmitting} className="shadow-md hover:shadow-lg transition-all duration-200">
            {submitText}
          </Button>
        </div>
      </Form>
    </Modal>
  );
}
