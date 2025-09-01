import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from 'components/core/Card';
import { Button } from 'components/core/Button';
import { Label } from 'components/core/Label';
import { Collapsible } from 'components/core/Collapsible';
import { ImageWithFallback } from 'src/components/core/ImageFallback';
import { Plus, X } from 'lucide-react';
import { UploadOutlined, CaretDownFilled } from '@ant-design/icons';
import { Checkbox, Form, Input, Upload, Select as AntdSelect, message, Image } from 'antd';
import { useForm } from 'antd/es/form/Form';
import { UploadChangeParam } from 'antd/es/upload';
import { useCreateGift } from 'src/hooks/useGift';
import { useUploadFile } from 'src/hooks/useFiles';

interface AddGiftFormProps {
  weddingListId?: number;
  categoryOptions?: Array<{ value: string; label: string }>;
  onGiftCreated?: () => void;
}

export const AddGiftForm: React.FC<AddGiftFormProps> = ({ weddingListId, categoryOptions = [], onGiftCreated }) => {
  const [form] = useForm();
  const [showAddGiftModal, setShowAddGiftModal] = useState(true);
  const [imageState, setImageState] = useState<{
    file: File | null;
    url: string | undefined;
    name: string | undefined;
  }>({ file: null, url: undefined, name: undefined });

  const { mutate: createGift, isSuccess: createSuccess, isError: createError } = useCreateGift();
  const { mutate: uploadFile } = useUploadFile();

  useEffect(() => {
    if (createSuccess) {
      message.success('Regalo agregado correctamente!');
      form.resetFields();
      setImageState({ file: null, url: undefined, name: undefined });
      onGiftCreated?.();
    }
    if (createError) {
      message.error('Error al agregar el regalo');
    }
  }, [createSuccess, createError]);

  const handleAddGift = (values: any) => {
    let categoriesPayload = values.categories;
    if (Array.isArray(categoriesPayload)) {
      categoriesPayload = categoriesPayload.map((cat: string) => ({ name: cat }));
    }

    if (imageState.file) {
      uploadFile(imageState.file, {
        onSuccess: (data) => {
          const newGift = {
            ...values,
            categories: categoriesPayload,
            weddingListId: weddingListId,
            imageUrl: data,
            isPurchased: false,
          };
          createGift(newGift);
        },
      });
    } else {
      const newGift = {
        ...values,
        categories: categoriesPayload,
        weddingListId: weddingListId,
        imageUrl: undefined,
        isPurchased: false,
      };
      createGift(newGift);
    }
  };

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

  return (
    <>
      <span
        className="cursor-pointer flex items-center !mb-0 flex text-gray-300 hover:text-gray-400 transition-colors"
        onClick={() => setShowAddGiftModal(!showAddGiftModal)}>
        {showAddGiftModal ? <CaretDownFilled className="h-5 w-5" /> : <Plus className="h-5 w-5" />}{' '}
        {showAddGiftModal ? 'Ocultar' : 'Agregar'} Nuevo Regalo
      </span>
      <Collapsible isOpen={showAddGiftModal}>
        <Card className="shadow-lg">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Plus className="h-5 w-5" />
              Agregar Nuevo Regalo
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <Form form={form} onFinish={handleAddGift} layout="vertical" className="space-y-4" validateTrigger="onSubmit">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="title">Nombre del Regalo</Label>
                  <Form.Item
                    name="title"
                    className="!mb-0"
                    rules={[{ required: true, message: 'Por favor, ingresa el nombre del regalo' }]}>
                    <Input id="title" placeholder="Ej. Juego de sábanas" className="shadow-sm" />
                  </Form.Item>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="price">Precio (MXN)</Label>
                  <Form.Item
                    name="price"
                    className="!mb-0"
                    rules={[{ required: true, message: 'Por favor, ingresa el precio del regalo' }]}>
                    <Input id="price" type="number" placeholder="1500" className="shadow-sm" />
                  </Form.Item>
                </div>

                <div className="space-y-2 ">
                  <Label htmlFor="categories">Categoría</Label>
                  <Form.Item
                    name="categories"
                    className="!mb-0"
                    rules={[{ required: true, message: 'Por favor, selecciona una categoría' }]}>
                    <AntdSelect
                      className="!shadow-sm !rounded-md"
                      mode="tags"
                      allowClear
                      suffixIcon={<CaretDownFilled />}
                      optionFilterProp="label"
                      style={{ width: '100%' }}
                      placeholder="Selecciona de 1 a 3 categorías"
                      options={categoryOptions}
                      maxCount={3}
                    />
                  </Form.Item>
                </div>
                <div className="space-y-2  flex items-center">
                  <Form.Item className="!mb-0" name="isMostWanted" valuePropName="checked">
                    <Checkbox>Más Deseado</Checkbox>
                  </Form.Item>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="description">Descripción</Label>
                <Form.Item name="description" className="!mb-0">
                  <Input.TextArea id="description" placeholder="Descripción detallada del regalo..." className="shadow-sm" />
                </Form.Item>
              </div>

              {/* Image Upload Section */}
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="image">Imagen del Regalo</Label>
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
                        <Button type="button" className="w-full">
                          <UploadOutlined /> Seleccionar Imagen
                        </Button>
                      </Upload>
                      {imageState.file && <span className="ml-3 text-sm">{imageState.name}</span>}
                    </div>
                  </div>
                </div>

                {imageState.url && (
                  <div className="space-y-2">
                    <Label>Vista Previa</Label>
                    <div className="relative flex items-center justify-center">
                      <div className="w-64 h-64 bg-muted rounded-lg flex items-center justify-center">
                        <Image src={imageState.url} alt="Vista previa" className="w-full h-full object-contain" />
                      </div>
                      <Button
                        type="button"
                        size="sm"
                        className="absolute cursor-pointer top-2 right-2 h-6 w-6 p-0 bg-background/80 hover:bg-background shadow-md"
                        onClick={() => {
                          setImageState({ name: '', file: null, url: '' });
                        }}>
                        <X className="h-3 w-3 text-black" />
                      </Button>
                    </div>
                  </div>
                )}
              </div>

              <Button type="submit" className="w-full shadow-md hover:shadow-lg transition-all duration-200">
                <Plus className="h-4 w-4 mr-2" />
                Agregar Regalo
              </Button>
            </Form>
          </CardContent>
        </Card>
      </Collapsible>
    </>
  );
};
