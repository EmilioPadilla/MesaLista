import { useState, useEffect } from 'react';
import { Button } from 'components/core/Button';
import { Form, Input, Select, Checkbox } from 'antd';
import { Label } from 'components/core/Label';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from 'components/core/Dialog';
import { ImageWithFallback } from 'components/core/ImageFallback';
import { X, Eye } from 'lucide-react';
import { GiftItem } from 'app/routes/couple/ManageRegistry';
import { GiftCategory } from 'types/models/gift';
import { useUpdateGift } from 'hooks/useGift';

interface EditGiftModalProps {
  gift: GiftItem | null;
  isOpen: boolean;
  onClose: () => void;
  afterClose: () => void;
  onSave: (updatedGift: GiftItem) => void;
}

export function EditGiftModal({ gift, isOpen, onClose, afterClose, onSave }: EditGiftModalProps) {
  const [form] = Form.useForm();
  const [imagePreview, setImagePreview] = useState<string>('');
  const { mutate: updateGift, isSuccess: updateSuccess, isError: updateError } = useUpdateGift();

  useEffect(() => {
    if (gift) {
      form.setFieldsValue({
        title: gift.title,
        description: gift.description || '',
        price: gift.price,
        categories: gift.categories?.map((cat) => cat.name) || [],
        isMostWanted: gift.isMostWanted,
        imageUrl: gift.imageUrl || '',
      });
      setImagePreview(gift.imageUrl || '');
    }
  }, [gift, form]);

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const url = e.target.value;
    form.setFieldValue('imageUrl', url);
    setImagePreview(url);
  };

  const handleFinish = (values: any) => {
    if (!gift) return;

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
    };

    updateGift({ id: gift.id, data: updatedGift });
    onClose();
  };

  const handleClose = () => {
    form.resetFields();
    onClose();
  };

  if (!gift) return null;

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-[600px] shadow-2xl">
        <DialogHeader>
          <DialogTitle className="text-xl text-primary">Editar Regalo</DialogTitle>
          <DialogDescription>Modifica los detalles de este regalo en tu mesa de regalos</DialogDescription>
        </DialogHeader>

        <Form form={form} onFinish={handleFinish} layout="vertical" className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Form.Item
              name="title"
              label="Nombre del Regalo"
              rules={[{ required: true, message: 'Por favor ingresa el título del regalo' }]}>
              <Input placeholder="Ej. Juego de sábanas" className="shadow-sm" />
            </Form.Item>

            <Form.Item
              name="price"
              label="Precio (MXN)"
              rules={[
                { required: true, message: 'Por favor ingresa el precio' },
                { type: 'number', min: 1, message: 'El precio debe ser mayor a 0' },
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
                options={[
                  { value: 'Hogar', label: 'Hogar' },
                  { value: 'Cocina', label: 'Cocina' },
                  { value: 'Baño', label: 'Baño' },
                  { value: 'Decoración', label: 'Decoración' },
                  { value: 'Electrónicos', label: 'Electrónicos' },
                  { value: 'General', label: 'General' },
                ]}
              />
            </Form.Item>

            <Form.Item name="isMostWanted" label="Prioridad Alta" valuePropName="checked">
              <Checkbox>Marcar como prioridad alta</Checkbox>
            </Form.Item>
          </div>

          <Form.Item name="description" label="Descripción">
            <Input.TextArea placeholder="Descripción detallada del regalo..." className="shadow-sm" rows={3} />
          </Form.Item>

          <div className="space-y-4">
            <Form.Item name="imageUrl" label="URL de la Imagen">
              <div className="flex gap-2">
                <Input onChange={handleImageChange} placeholder="https://ejemplo.com/imagen.jpg" className="shadow-sm flex-1" />
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  className="px-3"
                  onClick={() => setImagePreview(form.getFieldValue('imageUrl') || '')}>
                  <Eye className="h-4 w-4" />
                </Button>
              </div>
            </Form.Item>

            {imagePreview && (
              <div className="space-y-2">
                <Label>Vista Previa</Label>
                <div className="relative w-full h-32 bg-muted rounded-lg overflow-hidden shadow-sm">
                  <ImageWithFallback src={imagePreview} alt="Vista previa" className="w-full h-full object-cover" />
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="absolute top-1 right-1 h-6 w-6 p-0 bg-background/80 hover:bg-background"
                    onClick={() => {
                      setImagePreview('');
                      form.setFieldValue('imageUrl', '');
                    }}>
                    <X className="h-3 w-3" />
                  </Button>
                </div>
              </div>
            )}
          </div>

          <DialogFooter className="gap-2">
            <Button type="button" variant="outline" onClick={handleClose}>
              Cancelar
            </Button>
            <Button type="submit" className="shadow-md hover:shadow-lg transition-all duration-200">
              Guardar Cambios
            </Button>
          </DialogFooter>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
