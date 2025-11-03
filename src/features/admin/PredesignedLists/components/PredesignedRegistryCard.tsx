import { Badge } from 'components/core/Badge';
import { Trash2, Edit, ArrowUp, ArrowDown } from 'lucide-react';
import { Button, Popconfirm } from 'antd';
import { PredesignedList } from 'services/predesignedList.service';

interface PredesignedRegistryCardProps {
  registry: PredesignedList;
  isSelected: boolean;
  index: number;
  totalRegistries: number;
  onSelect: (registry: PredesignedList) => void;
  onEdit: (registry: PredesignedList) => void;
  onDelete: (registryId: number) => void;
  onMoveUp: (index: number) => void;
  onMoveDown: (index: number) => void;
}

export function PredesignedRegistryCard({
  registry,
  isSelected,
  index,
  totalRegistries,
  onSelect,
  onEdit,
  onDelete,
  onMoveUp,
  onMoveDown,
}: PredesignedRegistryCardProps) {
  return (
    <div
      className={`p-4 rounded-xl border transition-all cursor-pointer ${
        isSelected ? 'bg-[#007aff]/10 border-[#007aff]' : 'bg-white border-border hover:border-[#007aff]/50'
      }`}
      onClick={() => onSelect(registry)}>
      <div className="flex items-start justify-between mb-2">
        <div className="flex-1">
          <h3 className="font-medium text-primary mb-1">{registry.name}</h3>
          <p className="text-xs text-muted-foreground line-clamp-2">{registry.description}</p>
          <Badge variant="outline" className="mt-2 text-xs">
            {registry.gifts.length} regalos
          </Badge>
        </div>
      </div>
      <div className="flex items-center gap-1 mt-3">
        <Button
          size="small"
          variant="text"
          onClick={(e) => {
            e.stopPropagation();
            onMoveUp(index);
          }}
          disabled={index === 0}
          className="h-8 w-8 p-0">
          <ArrowUp className="h-3 w-3" />
        </Button>
        <Button
          size="small"
          variant="text"
          onClick={(e) => {
            e.stopPropagation();
            onMoveDown(index);
          }}
          disabled={index === totalRegistries - 1}
          className="h-8 w-8 p-0">
          <ArrowDown className="h-3 w-3" />
        </Button>
        <Button
          size="small"
          variant="text"
          onClick={(e) => {
            e.stopPropagation();
            onEdit(registry);
          }}
          className="h-8 w-8 p-0">
          <Edit className="h-3 w-3" />
        </Button>
        <Popconfirm
          title="Eliminar lista"
          description={
            <div>
              <p>¿Estás seguro de que deseas </p>
              <p>eliminar esta lista prediseñada?</p>
            </div>
          }
          onConfirm={(e) => {
            e?.stopPropagation();
            onDelete(registry.id);
          }}
          onCancel={(e) => e?.stopPropagation()}
          okText="Eliminar"
          cancelText="Cancelar"
          okButtonProps={{ danger: true }}>
          <Button
            size="small"
            variant="text"
            onClick={(e) => e.stopPropagation()}
            className="h-8 w-8 p-0 text-red-500 hover:text-red-600">
            <Trash2 className="h-3 w-3" />
          </Button>
        </Popconfirm>
      </div>
    </div>
  );
}
