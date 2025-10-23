import { Input, Button, Select, Modal } from 'antd';
import { PredesignedList } from 'services/predesignedList.service';
import { MapPin, Plane, Home, Palette, Sparkles, Heart } from 'lucide-react';

const { TextArea } = Input;

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
  registry: PredesignedList | { name: string; description: string; image?: string; imageUrl?: string; icon: string } | null;
  onRegistryChange: (registry: any) => void;
  onSubmit: () => void;
  iconOptions: string[];
}

export function PredesignedRegistryModal({
  isOpen,
  onOpenChange,
  mode,
  registry,
  onRegistryChange,
  onSubmit,
  iconOptions,
}: PredesignedRegistryModalProps) {
  const isEditMode = mode === 'edit';
  const title = isEditMode ? 'Editar Lista Prediseñada' : 'Crear Nueva Lista Prediseñada';
  const submitText = isEditMode ? 'Guardar Cambios' : 'Crear Lista';

  // For create mode, use a simple object structure
  const registryData = registry || { name: '', description: '', imageUrl: '', icon: 'MapPin' };

  return (
    <Modal
      title={title}
      open={isOpen}
      onCancel={() => onOpenChange(false)}
      footer={[
        <Button key="cancel" onClick={() => onOpenChange(false)}>
          Cancelar
        </Button>,
        <Button key="submit" type="primary" onClick={onSubmit} className="bg-[#007aff] hover:bg-[#0051d0]">
          {submitText}
        </Button>,
      ]}>
      <div className="space-y-4">
        <div className="space-y-2">
          <label>Nombre de la Lista</label>
          <Input
            value={registryData.name}
            onChange={(e) => onRegistryChange({ ...registryData, name: e.target.value })}
            placeholder="Luna de Miel en París"
            className="shadow-sm"
          />
        </div>
        <div className="space-y-2">
          <label>Descripción</label>
          <TextArea
            value={registryData.description}
            onChange={(e) => onRegistryChange({ ...registryData, description: e.target.value })}
            placeholder="Ciudad del amor, arte y gastronomía"
            className="shadow-sm"
            rows={3}
          />
        </div>
        <div className="space-y-2">
          <label>URL de Imagen</label>
          <Input
            value={registryData.imageUrl || (registryData as any).image || ''}
            onChange={(e) => onRegistryChange({ ...registryData, imageUrl: e.target.value })}
            placeholder="https://ejemplo.com/imagen.jpg"
            className="shadow-sm"
          />
        </div>
        <div className="space-y-2">
          <label>Icono</label>
          <Select
            className="w-full shadow-sm"
            value={registryData.icon}
            onChange={(value) => onRegistryChange({ ...registryData, icon: value })}
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
        </div>
      </div>
    </Modal>
  );
}
