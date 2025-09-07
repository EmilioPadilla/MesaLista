import { useState, useEffect } from 'react';
import { Form, Input, Select, Checkbox, message, Modal, Upload, Button, Image, Slider } from 'antd';
import { X } from 'lucide-react';
import { GiftItem } from 'app/routes/couple/ManageRegistry';
import { GiftCategory } from 'types/models/gift';
import { useUpdateGift } from 'hooks/useGift';
import { useGetCategoriesByWeddingList } from 'hooks/useWeddingList';
import { UploadOutlined } from '@ant-design/icons';
import { UploadChangeParam } from 'antd/es/upload';
import { useUploadFile } from 'hooks/useFiles';

interface GiftModalProps {
  gift: GiftItem | null;
  isOpen: boolean;
  onClose: () => void;
  weddingListId?: number;
}

export function GiftModal({ gift, isOpen, onClose, weddingListId }: GiftModalProps) {
  const [form] = Form.useForm();
  const [imageState, setImageState] = useState<{
    file: File | null;
    url: string | undefined;
    name: string | undefined;
  }>({ file: null, url: undefined, name: undefined });
  const [imagePosition, setImagePosition] = useState<number>(50);
  const { mutate: updateGift, isSuccess: updateSuccess, isError: updateError } = useUpdateGift();
  const { mutate: uploadFile } = useUploadFile();
  const { data: categories } = useGetCategoriesByWeddingList(weddingListId);
  const categoryOptions = categories?.categories?.map((category: any) => ({ value: category.name, label: category.name }));

  useEffect(() => {
    if (gift && isOpen) {
      form.setFieldsValue({
        title: gift.title,
        description: gift.description || '',
        price: gift.price,
        categories: gift.categories?.map((cat: any) => cat.name),
        isMostWanted: gift.isMostWanted,
        imageUrl: gift.imageUrl || '',
      });
      setImageState({ file: null, url: gift.imageUrl || '', name: gift.imageUrl || '' });
      setImagePosition((gift as any).imagePosition || 50);
    }
  }, [gift, isOpen]);

  useEffect(() => {
    if (updateSuccess) {
      message.success('Regalo actualizado correctamente!');
    }
    if (updateError) {
      message.error('Error al actualizar el regalo');
    }
  }, [updateSuccess, updateError]);

  const handleImageChange = (info: UploadChangeParam) => {
    if (info.fileList && info.fileList[0]) {
      const file = info.fileList[0];
      const localUrl = URL.createObjectURL(file.originFileObj as Blob);
      setImageState({
        name: file.name,
        file: file.originFileObj as File,
        url: localUrl,
      });
    } else {
      setImageState({ name: '', file: null, url: '' });
    }
  };

  const handleFinish = (values: any) => {
    if (!gift) return;

    if (imageState.file) {
      uploadFile(imageState.file, {
        onSuccess: (data) => {
          const updatedGift: GiftItem = {
            ...gift,
            title: values.title,
            description: values.description || '',
            price: values.price,
            categories:
              values.categories?.map(
                (name: string) => ({ name, id: gift.categories?.find((cat) => cat.name === name)?.id || 0 }) as GiftCategory,
              ) || [],
            isMostWanted: values.isMostWanted || false,
            imageUrl: data,
            imagePosition,
          };

          updateGift({ id: gift.id, data: updatedGift });
        },
      });
    }
    const updatedGift: GiftItem = {
      ...gift,
      title: values.title,
      description: values.description || '',
      price: values.price,
      categories:
        values.categories?.map(
          (name: string) => ({ name, id: gift.categories?.find((cat) => cat.name === name)?.id || 0 }) as GiftCategory,
        ) || [],
      isMostWanted: values.isMostWanted || false,
      imageUrl: values.imageUrl || gift.imageUrl,
      imagePosition,
    };

    updateGift({ id: gift.id, data: updatedGift });
    onClose();
  };

  const handleClose = () => {
    // Don't reset fields here - let the useEffect handle proper data loading
    onClose();
  };

  if (!gift) return null;

  return (
    <Modal title="Editar Regalo" open={isOpen} onCancel={handleClose} footer={null} width={700}>
      <Form form={form} onFinish={handleFinish} layout="vertical" className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Form.Item name="title" label="Nombre del Regalo" rules={[{ required: true, message: 'Por favor ingresa el título del regalo' }]}>
            <Input placeholder="Ej. Juego de sábanas" className="shadow-sm" />
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
            <Input type="number" placeholder="1500" className="shadow-sm" />
          </Form.Item>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Form.Item name="categories" label="Categorías">
            <Select
              mode="tags"
              allowClear
              optionFilterProp="label"
              style={{ width: '100%' }}
              placeholder="Selecciona de 1 a 3 categorías"
              maxCount={3}
              options={categoryOptions}
            />
          </Form.Item>

          <Form.Item name="isMostWanted" label="Prioridad Alta" valuePropName="checked">
            <Checkbox>Marcar como prioridad alta</Checkbox>
          </Form.Item>
        </div>

        <Form.Item name="description" label="Descripción">
          <Input.TextArea placeholder="Descripción detallada del regalo..." className="shadow-sm" rows={3} />
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
                  beforeUpload={(_file) => {
                    // Return false to prevent actual upload since we're just previewing
                    return false;
                  }}
                  showUploadList={false}>
                  <Button type="primary" className="w-full">
                    <UploadOutlined /> Seleccionar Imagen
                  </Button>
                </Upload>
                {imageState.file && <span className="ml-3 !text-md">{imageState.name}</span>}
              </div>
            </div>
          </div>

          {imageState.url && (
            <div className="space-y-4">
              <label>Vista Previa</label>
              <div className="relative flex items-center justify-center">
                <div className="w-64 h-40 bg-muted rounded-lg flex items-center justify-center overflow-hidden">
                  <div 
                    className="w-full h-full bg-cover bg-no-repeat rounded-lg"
                    style={{
                      backgroundImage: `url(${imageState.url})`,
                      backgroundPosition: `center ${imagePosition}%`,
                      backgroundSize: 'cover'
                    }}
                  />
                </div>
                <div className="absolute top-2 right-2">
                  <Button
                    type="default"
                    icon={<X />}
                    className="flex items-center justify-center cursor-pointer h-6 w-6 p-0 bg-background/80 hover:bg-background shadow-md"
                    onClick={() => {
                      setImageState({ name: '', file: null, url: '' });
                      setImagePosition(50);
                    }}></Button>
                </div>
              </div>
              
              <div className="space-y-2">
                <label>Posición de la imagen</label>
                <div className="px-2">
                  <Slider
                    min={0}
                    max={100}
                    value={imagePosition}
                    onChange={(value) => setImagePosition(value)}
                    tooltip={{
                      formatter: (value) => `${value}%`
                    }}
                    marks={{
                      0: 'Arriba',
                      50: 'Centro',
                      100: 'Abajo'
                    }}
                  />
                </div>
                <p className="text-sm text-gray-500">
                  Ajusta qué parte de la imagen será visible en la tarjeta del regalo
                </p>
              </div>
            </div>
          )}
        </div>

        <div className="flex justify-end gap-2 mt-6">
          <Button type="default" onClick={handleClose}>
            Cancelar
          </Button>
          <Button type="primary" htmlType="submit" className="shadow-md hover:shadow-lg transition-all duration-200">
            Guardar Cambios
          </Button>
        </div>
      </Form>
    </Modal>
  );
}
