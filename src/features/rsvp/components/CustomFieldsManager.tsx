import { useState } from 'react';
import { Plus, Trash2, GripVertical, ToggleLeft, Hash, Type, Pencil, Check, X } from 'lucide-react';
import { Button, Input, Select, Switch, Popconfirm, message, Empty } from 'antd';
import { useCreateRsvpCustomField, useUpdateRsvpCustomField, useDeleteRsvpCustomField } from 'src/hooks/useRsvp';
import type { RsvpCustomField, RsvpCustomFieldType } from 'src/services/rsvp.service';

interface CustomFieldsManagerProps {
  giftListId: number;
  fields: RsvpCustomField[];
}

const TYPE_LABELS: Record<RsvpCustomFieldType, string> = {
  TEXT: 'Texto',
  NUMBER: 'Número',
  BOOLEAN: 'Sí / No',
};

const TYPE_ICONS: Record<RsvpCustomFieldType, React.ReactNode> = {
  TEXT: <Type className="h-4 w-4" />,
  NUMBER: <Hash className="h-4 w-4" />,
  BOOLEAN: <ToggleLeft className="h-4 w-4" />,
};

export function CustomFieldsManager({ giftListId, fields }: CustomFieldsManagerProps) {
  const [adding, setAdding] = useState(false);
  const [newLabel, setNewLabel] = useState('');
  const [newType, setNewType] = useState<RsvpCustomFieldType>('TEXT');
  const [newRequired, setNewRequired] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [editLabel, setEditLabel] = useState('');

  const createMutation = useCreateRsvpCustomField();
  const updateMutation = useUpdateRsvpCustomField();
  const deleteMutation = useDeleteRsvpCustomField();

  const handleAdd = async () => {
    if (!newLabel.trim()) {
      message.error('El nombre del campo es requerido');
      return;
    }
    try {
      await createMutation.mutateAsync({
        giftListId,
        label: newLabel.trim(),
        type: newType,
        required: newRequired,
        order: fields.length,
      });
      setNewLabel('');
      setNewType('TEXT');
      setNewRequired(false);
      setAdding(false);
      message.success('Campo agregado');
    } catch {
      message.error('Error al agregar campo');
    }
  };

  const handleEditSave = async (field: RsvpCustomField) => {
    if (!editLabel.trim()) return;
    try {
      await updateMutation.mutateAsync({ id: field.id, giftListId, data: { label: editLabel.trim() } });
      setEditingId(null);
      message.success('Campo actualizado');
    } catch {
      message.error('Error al actualizar campo');
    }
  };

  const handleToggleRequired = async (field: RsvpCustomField, required: boolean) => {
    try {
      await updateMutation.mutateAsync({ id: field.id, giftListId, data: { required } });
    } catch {
      message.error('Error al actualizar campo');
    }
  };

  const handleDelete = async (id: number) => {
    try {
      await deleteMutation.mutateAsync({ id, giftListId });
      message.success('Campo eliminado');
    } catch {
      message.error('Error al eliminar campo');
    }
  };

  return (
    <div className="space-y-3">
      {fields.length === 0 && !adding && (
        <Empty
          image={Empty.PRESENTED_IMAGE_SIMPLE}
          description={<span className="text-sm text-muted-foreground">Sin campos personalizados</span>}
        />
      )}

      {fields.map((field) => (
        <div key={field.id} className="flex items-center gap-3 bg-[#f5f5f7] rounded-xl px-4 py-3 group">
          <span className="text-muted-foreground shrink-0">{TYPE_ICONS[field.type]}</span>

          {editingId === field.id ? (
            <Input
              value={editLabel}
              onChange={(e) => setEditLabel(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') handleEditSave(field);
                if (e.key === 'Escape') setEditingId(null);
              }}
              autoFocus
              size="small"
              className="flex-1 rounded-lg"
            />
          ) : (
            <span className="flex-1 text-sm font-medium text-foreground">{field.label}</span>
          )}

          <span className="text-xs text-muted-foreground bg-white border border-border/30 px-2 py-0.5 rounded-full shrink-0">
            {TYPE_LABELS[field.type]}
          </span>

          <div className="flex items-center gap-1 shrink-0">
            <span className="text-xs text-muted-foreground mr-1">Requerido</span>
            <Switch
              checked={field.required}
              onChange={(checked) => handleToggleRequired(field, checked)}
              size="small"
              loading={updateMutation.isPending}
            />
          </div>

          {editingId === field.id ? (
            <div className="flex gap-1 shrink-0">
              <Button type="text" size="small" icon={<Check className="h-4 w-4 text-green-500" />} onClick={() => handleEditSave(field)} />
              <Button type="text" size="small" icon={<X className="h-4 w-4 text-muted-foreground" />} onClick={() => setEditingId(null)} />
            </div>
          ) : (
            <div className="flex gap-1 shrink-0 opacity-0 group-hover:opacity-100 transition-opacity">
              <Button
                type="text"
                size="small"
                icon={<Pencil className="h-4 w-4 text-muted-foreground" />}
                onClick={() => {
                  setEditingId(field.id);
                  setEditLabel(field.label);
                }}
              />
              <Popconfirm
                title="¿Eliminar campo?"
                description="Se eliminarán también todas las respuestas de los invitados a este campo."
                onConfirm={() => handleDelete(field.id)}
                okText="Eliminar"
                cancelText="Cancelar"
                okButtonProps={{ danger: true }}>
                <Button type="text" size="small" icon={<Trash2 className="h-4 w-4 text-[#ff3b30]" />} loading={deleteMutation.isPending} />
              </Popconfirm>
            </div>
          )}
        </div>
      ))}

      {adding && (
        <div className="bg-white border border-primary/20 rounded-xl p-4 space-y-3">
          <div className="flex gap-2">
            <Input
              placeholder="Nombre del campo (ej. ¿Tiene restricciones alimentarias?)"
              value={newLabel}
              onChange={(e) => setNewLabel(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') handleAdd();
                if (e.key === 'Escape') setAdding(false);
              }}
              autoFocus
              className="flex-1 rounded-xl"
            />
            <Select
              value={newType}
              onChange={setNewType}
              className="w-36 border rounded border-secondary"
              options={[
                { label: 'Texto', value: 'TEXT' },
                { label: 'Número', value: 'NUMBER' },
                { label: 'Sí / No', value: 'BOOLEAN' },
              ]}
            />
          </div>
          <div className="flex items-center justify-between">
            <label className="flex items-center gap-2 text-sm text-muted-foreground cursor-pointer">
              <Switch checked={newRequired} onChange={setNewRequired} size="small" />
              Respuesta requerida
            </label>
            <div className="flex gap-2">
              <Button
                size="small"
                className="rounded-lg"
                onClick={() => {
                  setAdding(false);
                  setNewLabel('');
                }}>
                Cancelar
              </Button>
              <Button size="small" type="primary" className="rounded-lg" loading={createMutation.isPending} onClick={handleAdd}>
                Agregar
              </Button>
            </div>
          </div>
        </div>
      )}

      {!adding && (
        <Button
          onClick={() => setAdding(true)}
          className="w-full rounded-xl border-dashed border-border/50 text-muted-foreground hover:border-primary! hover:text-primary!"
          icon={<Plus className="h-4 w-4" />}>
          Agregar campo personalizado
        </Button>
      )}
    </div>
  );
}
