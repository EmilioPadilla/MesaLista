import { Input, Button, Select, Modal, Upload, Image, message, Form } from 'antd';
import { PredesignedList } from 'services/predesignedList.service';
import { MapPin, Plane, Home, Palette, Sparkles, Heart, X } from 'lucide-react';
import { useState, useEffect } from 'react';
import { UploadOutlined } from '@ant-design/icons';
import { UploadChangeParam } from 'antd/es/upload';
import { useCreatePredesignedList, useUpdatePredesignedList } from 'hooks/usePredesignedList';
import { useUploadFile } from 'hooks/useFiles';

const iconMap: Record<string, React.ReactNode> = {
  MapPin: <MapPin className="h-4 w-4 inline mr-2" />,
  Plane: <Plane className="h-4 w-4 inline mr-2" />,
  Home: <Home className="h-4 w-4 inline mr-2" />,
  Palette: <Palette className="h-4 w-4 inline mr-2" />,
  Sparkles: <Sparkles className="h-4 w-4 inline mr-2" />,
  Heart: <Heart className="h-4 w-4 inline mr-2" />,
};

interface PredesignedRegistryModalProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  mode: 'create' | 'edit';
  registry?: PredesignedList | null;
  onSuccess?: () => void;
}

export function PredesignedRegistryModal({ isOpen, onOpenChange, mode, registry, onSuccess }: PredesignedRegistryModalProps) {
  const isEditMode = mode === 'edit';
  const title = isEditMode ? 'Editar Lista Prediseñada' : 'Crear Nueva Lista Prediseñada';
  const submitText = isEditMode ? 'Guardar Cambios' : 'Crear Lista';

  const iconOptions = ['MapPin', 'Plane', 'Home', 'Palette', 'Sparkles', 'Heart'];

  const [form] = Form.useForm();
  const [imageState, setImageState] = useState<{
    file: File | null;
    url: string | undefined;
    name: string | undefined;
  }>({ file: null, url: undefined, name: undefined });

  // Mutations
  const { mutate: createList, isPending: isCreating } = useCreatePredesignedList();
  const { mutate: updateList, isPending: isUpdating } = useUpdatePredesignedList();
  const { mutate: uploadFile, isPending: isUploading } = useUploadFile();

  const isSubmitting = isCreating || isUpdating || isUploading;

  // Initialize form when modal opens or registry changes
  useEffect(() => {
    if (isOpen) {
      if (isEditMode && registry) {
        form.setFieldsValue({
          name: registry.name,
          description: registry.description,
          icon: registry.icon,
        });
        setImageState({ file: null, url: registry.imageUrl || '', name: undefined });
      } else {
        form.resetFields();
        setImageState({ file: null, url: undefined, name: undefined });
      }
    }
  }, [isOpen, isEditMode, registry, form]);

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
    const submitData = (imageUrl?: string) => {
      const data = {
        name: values.name,
        description: values.description,
        imageUrl: imageUrl || imageState.url || '',
        icon: values.icon,
        isActive: true,
      };

      if (isEditMode && registry) {
        updateList(
          { id: registry.id, data },
          {
            onSuccess: () => {
              message.success('Lista actualizada exitosamente');
              onOpenChange(false);
              onSuccess?.();
            },
            onError: () => {
              message.error('Error al actualizar la lista');
            },
          }
        );
      } else {
        createList(data, {
          onSuccess: () => {
            message.success('Lista creada exitosamente');
            onOpenChange(false);
            onSuccess?.();
          },
          onError: () => {
            message.error('Error al crear la lista');
          },
        });
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
        <Form.Item
          name="name"
          label="Nombre de la Lista"
          rules={[{ required: true, message: 'Por favor ingresa el nombre de la lista' }]}>
          <Input placeholder="Luna de Miel en París" className="shadow-sm" />
        </Form.Item>

        <Form.Item
          name="description"
          label="Descripción"
          rules={[{ required: true, message: 'Por favor ingresa la descripción' }]}>
          <Input.TextArea placeholder="Ciudad del amor, arte y gastronomía" className="shadow-sm" rows={3} />
        </Form.Item>

        {/* Image Upload Section */}
        <div className="space-y-4">
          <div className="space-y-2">
            <label htmlFor="image">Imagen de la Lista</label>
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

        <Form.Item name="icon" label="Icono" initialValue="MapPin">
          <Select
            className="w-full shadow-sm"
            options={iconOptions.map((icon) => ({
              label: (
                <span>
                  {iconMap[icon]}
                  {icon}
                </span>
              ),
              value: icon,
            }))}
          />
        </Form.Item>

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
