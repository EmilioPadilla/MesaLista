import { Input, Button, Select, Modal } from 'antd';
import { PredesignedGift } from 'services/predesignedList.service';

const { TextArea } = Input;

interface PredesignedGiftModalProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  mode: 'create' | 'edit';
  gift: PredesignedGift | any | null;
  onGiftChange: (gift: PredesignedGift | any) => void;
  onSubmit: () => void;
}

export function PredesignedGiftModal({ isOpen, onOpenChange, mode, gift, onGiftChange, onSubmit }: PredesignedGiftModalProps) {
  const isEditMode = mode === 'edit';
  const title = isEditMode ? 'Editar Regalo' : 'Agregar Nuevo Regalo';
  const submitText = isEditMode ? 'Guardar Cambios' : 'Agregar Regalo';

  // For create mode, use a simple object structure
  const giftData = gift || { name: '', description: '', price: '', categories: [], image: '', priority: 'media' };

  // Handle both create mode (name/image) and edit mode (title/imageUrl)
  const displayName = giftData.title || giftData.name || '';
  const displayImage = giftData.imageUrl || giftData.image || '';
  const displayPrice = typeof giftData.price === 'number' ? giftData.price : giftData.price || '';
  const displayCategories = giftData.categories || [];

  return (
    <Modal
      title={title}
      open={isOpen}
      onCancel={() => onOpenChange(false)}
      width={600}
      footer={[
        <Button key="cancel" onClick={() => onOpenChange(false)}>
          Cancelar
        </Button>,
        <Button key="submit" type="primary" onClick={onSubmit} className="bg-[#007aff] hover:bg-[#0051d0]">
          {submitText}
        </Button>,
      ]}>
      {giftData && (
        <div className="space-y-4">
          <div className="space-y-2">
            <label>Nombre del Regalo</label>
            <Input
              value={displayName}
              onChange={(e) => {
                const newValue = e.target.value;
                if (isEditMode) {
                  onGiftChange({ ...giftData, title: newValue });
                } else {
                  onGiftChange({ ...giftData, name: newValue });
                }
              }}
              placeholder="Vuelos a París"
              className="shadow-sm"
            />
          </div>
          <div className="space-y-2">
            <label>Descripción</label>
            <TextArea
              value={giftData.description || ''}
              onChange={(e) => onGiftChange({ ...giftData, description: e.target.value })}
              placeholder="Boletos de avión para dos personas"
              rows={3}
              className="shadow-sm"
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <label>Precio (MXN)</label>
              <Input
                type="number"
                value={displayPrice}
                onChange={(e) => {
                  const value = e.target.value;
                  if (isEditMode) {
                    onGiftChange({ ...giftData, price: parseFloat(value) || 0 });
                  } else {
                    onGiftChange({ ...giftData, price: value });
                  }
                }}
                placeholder="15000"
                className="shadow-sm"
              />
            </div>
            <div className="space-y-2">
              <label>Categorías</label>
              <Select
                mode="tags"
                className="w-full shadow-sm"
                value={displayCategories}
                onChange={(value) => onGiftChange({ ...giftData, categories: value })}
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
            </div>
          </div>
          <div className="space-y-2">
            <label>URL de Imagen</label>
            <Input
              value={displayImage}
              onChange={(e) => {
                const newValue = e.target.value;
                if (isEditMode) {
                  onGiftChange({ ...giftData, imageUrl: newValue });
                } else {
                  onGiftChange({ ...giftData, image: newValue });
                }
              }}
              placeholder="https://ejemplo.com/imagen.jpg"
              className="shadow-sm"
            />
          </div>
          <div className="space-y-2">
            <label>Prioridad</label>
            <Select
              className="w-full shadow-sm"
              value={giftData.priority}
              onChange={(value) => onGiftChange({ ...giftData, priority: value })}
              options={[
                { label: 'Alta', value: 'alta' },
                { label: 'Media', value: 'media' },
                { label: 'Baja', value: 'baja' },
              ]}
            />
          </div>
        </div>
      )}
    </Modal>
  );
}
