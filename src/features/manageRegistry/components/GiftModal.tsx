import { useState, useEffect } from 'react';
import { Form, Input, Select, Checkbox, message, Modal, Upload, Button, Slider } from 'antd';
import { X } from 'lucide-react';
import { GiftItem } from 'app/routes/couple/ManageRegistry';
import { GiftCategory } from 'types/models/gift';
import { useUpdateGift } from 'hooks/useGift';
import { UploadOutlined } from '@ant-design/icons';
import { UploadChangeParam } from 'antd/es/upload';
import { useUploadFile } from 'hooks/useFiles';
import { useGetCategoriesByGiftList } from 'src/hooks/useGiftList';
import { convertHeicToJpegIfNeeded, isHeic } from 'src/features/manageRegistry/utils/heicToJpeg';

interface GiftModalProps {
  gift: GiftItem | null;
  isOpen: boolean;
  onClose: () => void;
  afterClose?: () => void;
  weddingListId?: number;
  onGiftSaved?: (gift: GiftItem) => void;
}

export function GiftModal({ gift, isOpen, onClose, afterClose, weddingListId, onGiftSaved }: GiftModalProps) {
  const [form] = Form.useForm();
  // `imageRemoved` is the explicit "user clicked X" signal. Without it, we cannot tell
  // an empty `imageState.url` apart from a gift that simply has no image yet, and we
  // were falling back to the original URL on save — which is why removing an image in
  // edit mode silently did nothing.
  const [imageState, setImageState] = useState<{
    file: File | null;
    url: string | undefined;
    name: string | undefined;
    imageRemoved: boolean;
  }>({ file: null, url: undefined, name: undefined, imageRemoved: false });
  const [imagePosition, setImagePosition] = useState<number>(50);
  const [imageScale, setImageScale] = useState<number>(100);
  const { mutate: updateGift, isError: updateError } = useUpdateGift();
  const { mutate: uploadFile } = useUploadFile();
  const { data: categories } = useGetCategoriesByGiftList(weddingListId);
  const categoryOptions = categories?.categories?.map((category: any) => ({ value: category.name, label: category.name }));

  useEffect(() => {
    if (gift && isOpen) {
      form.setFieldsValue({
        title: gift.title,
        description: gift.description || '',
        price: gift.price,
        categories: gift.categories?.map((cat: any) => cat.name) ?? [],
        isMostWanted: gift.isMostWanted,
      });
      setImageState({ file: null, url: gift.imageUrl || '', name: gift.imageUrl || '', imageRemoved: false });
      setImagePosition((gift as any).imagePosition ?? 50);
      setImageScale((gift as any).imageScale ?? 100);
    }
  }, [gift, isOpen]);

  useEffect(() => {
    if (updateError) {
      message.error('Error al actualizar el regalo');
    }
  }, [updateError]);

  const handleImageChange = (info: UploadChangeParam) => {
    if (!info.fileList || !info.fileList[0]) {
      setImageState({ name: '', file: null, url: '', imageRemoved: true });
      return;
    }

    const originalFile = info.fileList[0].originFileObj as File;

    // Non-HEIC files (JPEG/PNG/etc) must update state synchronously. An
    // unconditional `await` here defers the setState by a microtask, racing
    // with a quick Save click and submitting with `imageState.file` still null.
    if (!isHeic(originalFile)) {
      setImageState({
        name: originalFile.name,
        file: originalFile,
        url: URL.createObjectURL(originalFile),
        imageRemoved: false,
      });
      return;
    }

    convertHeicToJpegIfNeeded(originalFile)
      .then((usableFile) => {
        setImageState({
          name: usableFile.name,
          file: usableFile,
          url: URL.createObjectURL(usableFile),
          imageRemoved: false,
        });
      })
      .catch(() => {
        message.error('No pudimos procesar esa imagen. Intenta con otro formato (JPG o PNG).');
      });
  };

  const handleRemoveImage = () => {
    setImageState({ name: '', file: null, url: '', imageRemoved: true });
    setImagePosition(50);
    setImageScale(100);
  };

  const resolveFinalImageUrl = (uploadedUrl?: string): string | undefined => {
    if (uploadedUrl) return uploadedUrl;
    if (imageState.imageRemoved) return '';
    return imageState.url || gift?.imageUrl;
  };

  const handleFinish = (values: any) => {
    if (!gift) return;

    const buildUpdatedGift = (finalImageUrl: string | undefined): GiftItem => ({
      ...gift,
      title: values.title,
      description: values.description ?? '',
      price: values.price,
      // Always emit `categories` — even as []. The backend uses presence-of-field as the
      // signal to replace, so omitting it on clear-all silently kept the old tags.
      categories: (values.categories ?? []).map(
        (name: string) => ({ name, id: gift.categories?.find((cat) => cat.name === name)?.id || 0 }) as GiftCategory,
      ),
      isMostWanted: values.isMostWanted || false,
      imageUrl: finalImageUrl,
      imagePosition,
      imageScale,
    });

    const dispatchUpdate = (finalImageUrl: string | undefined) => {
      const updatedGift = buildUpdatedGift(finalImageUrl);
      updateGift(
        { id: gift.id, data: updatedGift },
        {
          onSuccess: () => {
            message.success('Regalo actualizado correctamente!');
            onGiftSaved?.(updatedGift);
            onClose();
          },
        },
      );
    };

    if (imageState.file) {
      // New image file selected - upload it first, then update gift.
      uploadFile(imageState.file, {
        onSuccess: (data) => dispatchUpdate(data),
      });
    } else {
      dispatchUpdate(resolveFinalImageUrl());
    }
  };

  const handleClose = () => {
    // Don't reset fields here - let the useEffect handle proper data loading
    onClose();
  };

  if (!gift) return null;

  return (
    <Modal afterClose={afterClose} title="Editar Regalo" open={isOpen} onCancel={handleClose} footer={null} width={700}>
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
              className="shadow-sm w-full rounded"
              placeholder="Selecciona (o crea) de 1 a 3 categorías"
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
                <div className="w-64 h-40 bg-muted rounded-lg flex items-center justify-center overflow-hidden shadow-sm border border-gray-100">
                  <div
                    className="w-full h-full bg-no-repeat rounded-lg"
                    style={{
                      // Quote + escape so URLs with spaces (e.g. R2 uploads named "WhatsApp
                      // Image …") don't break CSS parsing. Same pattern as GiftCard.tsx.
                      backgroundImage: `url("${imageState.url.replace(/\\/g, '\\\\').replace(/"/g, '\\"')}")`,
                      backgroundPosition: `center ${imagePosition}%`,
                      backgroundSize: `${imageScale}%`,
                    }}
                  />
                </div>
                <div className="absolute top-2 right-2">
                  <Button
                    type="default"
                    icon={<X />}
                    className="flex items-center justify-center cursor-pointer h-6 w-6 p-0 bg-background/80 hover:bg-background shadow-md"
                    onClick={handleRemoveImage}></Button>
                </div>
              </div>

              <div className="space-y-4 rounded-xl border border-gray-100 bg-gray-50 p-4">
                <div className="space-y-2">
                  <div className="flex items-center justify-between text-sm">
                    <label className="font-medium">Posición vertical</label>
                    <span className="text-gray-500">{Math.round(imagePosition)}%</span>
                  </div>
                  <Slider
                    min={0}
                    max={100}
                    value={imagePosition}
                    onChange={(value) => setImagePosition(Number(value))}
                    tooltip={{
                      formatter: (value) => `${value}%`,
                    }}
                  />
                  <div className="flex justify-between text-xs text-gray-500">
                    <span>Arriba</span>
                    <span>Centro</span>
                    <span>Abajo</span>
                  </div>
                </div>

                <div className="space-y-2">
                  <div className="flex items-center justify-between text-sm">
                    <label className="font-medium">Zoom</label>
                    <span className="text-gray-500">{(imageScale / 100).toFixed(2)}x</span>
                  </div>
                  <Slider
                    min={70}
                    max={200}
                    value={imageScale}
                    onChange={(value) => setImageScale(Number(value))}
                    tooltip={{
                      formatter: (value) => `${value}%`,
                    }}
                  />
                  <div className="flex justify-between text-xs text-gray-500">
                    <span>Alejar</span>
                    <span>Normal</span>
                    <span>Acercar</span>
                  </div>
                </div>
              </div>
              <p className="text-sm text-gray-500">
                Ajusta la posición y el zoom de la imagen para que se vea mejor en la tarjeta del regalo
              </p>
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
