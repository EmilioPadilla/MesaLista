import React, { useState, useEffect } from 'react';
import { useSearchParams, useLocation } from 'react-router-dom';
import { Collapsible } from 'components/core/Collapsible';
import { Plus, X, Eye, ExternalLink } from 'lucide-react';
import { UploadOutlined, CaretDownFilled } from '@ant-design/icons';
import { Checkbox, Form, Input, Upload, Select, message, Image, Button, Card } from 'antd';
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
  const [searchParams, setSearchParams] = useSearchParams();
  const location = useLocation();

  // Extract coupleSlug from current URL path
  const coupleSlug = location.pathname.split('/')[1];

  // Check URL query parameter to determine initial modal state
  const shouldShowModal = searchParams.get('addGift') === 'true';
  const [showAddGiftModal, setShowAddGiftModal] = useState(shouldShowModal);
  const [imageState, setImageState] = useState<{
    file: File | null;
    url: string | undefined;
    name: string | undefined;
  }>({ file: null, url: undefined, name: undefined });

  const { mutate: createGift, isSuccess: createSuccess, isError: createError } = useCreateGift();
  const { mutate: uploadFile } = useUploadFile();

  // Update modal state when URL parameter changes
  useEffect(() => {
    const shouldShow = searchParams.get('addGift') === 'true';
    setShowAddGiftModal(shouldShow);
  }, [searchParams]);

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

  const handleCloseModal = () => {
    setShowAddGiftModal(false);
    // Remove the query parameter from URL
    const newSearchParams = new URLSearchParams(searchParams);
    newSearchParams.delete('addGift');
    setSearchParams(newSearchParams);
  };

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
      <div className="flex justify-between items-center !mb-0">
        {/* Button to take user to see the list of gifts as a guest */}
        <Button
          type="default"
          icon={<Eye className="h-4 w-4" />}
          onClick={() => window.open(`/${coupleSlug}/regalos`, '_blank')}
          className="mt-2 group">
          Ver como Invitado <ExternalLink className="h-4 w-4 opacity-0 group-hover:opacity-100 transition-opacity duration-200" />
        </Button>

        <div className="flex items-center">
          {showAddGiftModal ? (
            <Button
              type="text"
              className="cursor-pointer flex items-center !mb-0 mt-2 flex text-gray-300 hover:text-gray-400 transition-colors"
              onClick={handleCloseModal}>
              <CaretDownFilled className="h-5 w-5" /> Ocultar Nuevo Regalo
            </Button>
          ) : (
            <Button type="primary" onClick={() => setShowAddGiftModal(true)} className="!mb-0 mt-2">
              <Plus className="h-5 w-5" /> Agregar Nuevo Regalo
            </Button>
          )}
        </div>
      </div>
      <Collapsible isOpen={showAddGiftModal}>
        <Card className="shadow-lg" title="Agregar Nuevo Regalo">
          <div className="space-y-4">
            <Form form={form} onFinish={handleAddGift} layout="vertical" className="space-y-4" validateTrigger="onSubmit">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Form.Item
                    name="title"
                    label="Nombre del Regalo"
                    className="!mb-0"
                    rules={[{ required: true, message: 'Por favor, ingresa el nombre del regalo' }]}>
                    <Input id="title" placeholder="Ej. Juego de sábanas" className="shadow-sm" />
                  </Form.Item>
                </div>

                <div className="space-y-2">
                  <Form.Item
                    name="price"
                    label="Precio (MXN)"
                    className="!mb-0"
                    rules={[{ required: true, message: 'Por favor, ingresa el precio del regalo' }]}>
                    <Input id="price" type="number" placeholder="1500" className="shadow-sm" />
                  </Form.Item>
                </div>

                <div className="space-y-2 ">
                  <Form.Item
                    name="categories"
                    label="Categoría"
                    className="!mb-0"
                    rules={[{ required: true, message: 'Por favor, selecciona una categoría' }]}>
                    <Select
                      className="!shadow-sm !rounded-md"
                      mode="tags"
                      allowClear
                      suffixIcon={<CaretDownFilled />}
                      optionFilterProp="label"
                      style={{ width: '100%' }}
                      placeholder="Selecciona (o crea) de 1 a 3 categorías"
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
                <Form.Item name="description" label="Descripción" className="!mb-0">
                  <Input.TextArea id="description" placeholder="Descripción detallada del regalo..." className="shadow-sm" />
                </Form.Item>
              </div>

              {/* Image Upload Section */}
              <div className="space-y-4">
                <div className="space-y-2">
                  <label htmlFor="image">Imagen del Regalo</label>
                  <div className="flex gap-2 !mt-2">
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
                          onClick={() => {
                            setImageState({ name: '', file: null, url: '' });
                          }}></Button>
                      </div>
                    </div>
                  </div>
                )}
              </div>

              <Button htmlType="submit" type="primary" className="w-full shadow-md hover:shadow-lg transition-all duration-200">
                <Plus className="h-4 w-4 mr-2" />
                Agregar Regalo
              </Button>
            </Form>
          </div>
        </Card>
      </Collapsible>
    </>
  );
};
