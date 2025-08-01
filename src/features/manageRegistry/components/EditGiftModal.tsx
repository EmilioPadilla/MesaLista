import { useState, useEffect } from 'react';
import { Button } from 'components/core/Button';
import { Input } from 'components/core/Input';
import { Input as antdInput } from 'antd';
import { Label } from 'components/core/Label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from 'components/core/Select';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from 'components/core/Dialog';
import { ImageWithFallback } from 'components/core/ImageFallback';
import { X, Eye } from 'lucide-react';
import { GiftItem } from 'app/routes/couple/v2ManageRegistry';
import { GiftCategory } from 'types/models/gift';

interface EditGiftModalProps {
  gift: GiftItem | null;
  isOpen: boolean;
  onClose: () => void;
  afterClose: () => void;
  onSave: (updatedGift: GiftItem) => void;
}

export function EditGiftModal({ gift, isOpen, onClose, afterClose, onSave }: EditGiftModalProps) {
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    price: '',
    category: 'General',
    priority: 'media' as 'alta' | 'media' | 'baja',
    image: '',
  });
  const [imagePreview, setImagePreview] = useState<string>('');
  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    if (gift) {
      setFormData({
        name: gift.title,
        description: gift.description!,
        price: gift.price.toString(),
        category: gift.categories![0].name!,
        priority: gift.priority!,
        image: gift.imageUrl!,
      });
      setImagePreview(gift.imageUrl!);
    }
  }, [gift]);

  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    if (!formData.name.trim()) newErrors.name = 'El nombre es requerido';
    if (!formData.price.trim()) newErrors.price = 'El precio es requerido';
    if (parseInt(formData.price) <= 0) newErrors.price = 'El precio debe ser mayor a 0';

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const url = e.target.value;
    setFormData({ ...formData, image: url });
    setImagePreview(url);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm() || !gift) return;

    const updatedGift: GiftItem = {
      ...gift,
      title: formData.name,
      description: formData.description,
      price: parseInt(formData.price),
      categories: [{ name: formData.category, id: gift.categories![0].id } as GiftCategory],
      priority: formData.priority,
      imageUrl: formData.image || gift.imageUrl,
    };

    onSave(updatedGift);
    onClose();
  };

  const handleClose = () => {
    setErrors({});
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

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="edit-name">Nombre del Regalo</Label>
              <Input
                id="edit-name"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="Ej. Juego de sábanas"
                className={`shadow-sm ${errors.name ? 'border-destructive' : ''}`}
              />
              {errors.name && <p className="text-sm text-destructive">{errors.name}</p>}
            </div>

            <div className="space-y-2">
              <Label htmlFor="edit-price">Precio (MXN)</Label>
              <Input
                id="edit-price"
                type="number"
                value={formData.price}
                onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                placeholder="1500"
                className={`shadow-sm ${errors.price ? 'border-destructive' : ''}`}
              />
              {errors.price && <p className="text-sm text-destructive">{errors.price}</p>}
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="edit-category">Categoría</Label>
              <Select value={formData.category} onValueChange={(value) => setFormData({ ...formData, category: value })}>
                <SelectTrigger className="shadow-sm">
                  <SelectValue placeholder="Seleccionar categoría" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Hogar">Hogar</SelectItem>
                  <SelectItem value="Cocina">Cocina</SelectItem>
                  <SelectItem value="Baño">Baño</SelectItem>
                  <SelectItem value="Decoración">Decoración</SelectItem>
                  <SelectItem value="Electrónicos">Electrónicos</SelectItem>
                  <SelectItem value="General">General</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="edit-priority">Prioridad</Label>
              <Select
                value={formData.priority}
                onValueChange={(value: 'alta' | 'media' | 'baja') => setFormData({ ...formData, priority: value })}>
                <SelectTrigger className="shadow-sm">
                  <SelectValue placeholder="Media" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="alta">Alta</SelectItem>
                  <SelectItem value="media">Media</SelectItem>
                  <SelectItem value="baja">Baja</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="edit-description">Descripción</Label>
            <antdInput.TextArea
              id="edit-description"
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              placeholder="Descripción detallada del regalo..."
              className="shadow-sm"
              rows={3}
            />
          </div>

          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="edit-image">URL de la Imagen</Label>
              <div className="flex gap-2">
                <Input
                  id="edit-image"
                  value={formData.image}
                  onChange={handleImageChange}
                  placeholder="https://ejemplo.com/imagen.jpg"
                  className="shadow-sm flex-1"
                />
                <Button type="button" variant="outline" size="sm" className="px-3" onClick={() => setImagePreview(formData.image)}>
                  <Eye className="h-4 w-4" />
                </Button>
              </div>
            </div>

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
                      setFormData({ ...formData, image: '' });
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
        </form>
      </DialogContent>
    </Dialog>
  );
}
