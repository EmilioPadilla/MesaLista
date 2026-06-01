import { Badge } from 'components/core/Badge';
import { Trash2, Edit, GripVertical } from 'lucide-react';
import { Button, Popconfirm } from 'antd';
import { PredesignedGift } from 'services/predesignedList.service';

export interface DragHandleProps {
  listeners?: Record<string, Function>;
  attributes?: Record<string, any>;
}

interface PredesignedGiftCardProps {
  gift: PredesignedGift;
  onEdit: (gift: PredesignedGift) => void;
  onDelete: (giftId: number) => void;
  dragHandleProps?: DragHandleProps;
}

export function PredesignedGiftCard({ gift, onEdit, onDelete, dragHandleProps }: PredesignedGiftCardProps) {
  return (
    <div className="flex items-center gap-4 p-4 bg-[#f5f5f7] rounded-xl border border-border/30 hover:shadow-md transition-all">
      <div className="flex items-center gap-2" {...dragHandleProps?.attributes} {...dragHandleProps?.listeners}>
        <GripVertical className="h-5 w-5 text-muted-foreground cursor-grab active:cursor-grabbing" />
      </div>
      <div className="w-16 h-16 rounded-lg overflow-hidden flex-shrink-0">
        <img
          onError={(e) => {
            e.currentTarget.src = '/images/gift_placeholder.png';
            e.currentTarget.className = 'w-full h-full object-cover border-2 border-red';
          }}
          src={gift?.imageUrl || '/images/gift_placeholder.png'}
          alt={gift.title}
          className="w-full h-full object-cover"
        />
      </div>
      <div className="flex-1 min-w-0">
        <h4 className="font-medium text-primary truncate">{gift.title}</h4>
        <p className="text-sm text-muted-foreground truncate">{gift.description}</p>
        <div className="flex items-center gap-2 mt-1 flex-wrap">
          {gift.categories.map((category, index) => (
            <Badge key={index} variant="outline" className="text-xs">
              {category}
            </Badge>
          ))}
          <span className="text-sm text-primary">${gift.price.toLocaleString()}</span>
        </div>
      </div>
      <div className="flex items-center gap-1">
        <Button size="small" variant="text" onClick={() => onEdit(gift)} className="h-8 w-8 p-0">
          <Edit className="h-3 w-3" />
        </Button>
        <Popconfirm
          title="Eliminar regalo"
          description="¿Estás seguro de que deseas eliminar este regalo?"
          onConfirm={() => onDelete(gift.id)}
          okText="Eliminar"
          cancelText="Cancelar"
          okButtonProps={{ danger: true }}>
          <Button size="small" variant="text" className="h-8 w-8 p-0 text-red-500 hover:text-red-600">
            <Trash2 className="h-3 w-3" />
          </Button>
        </Popconfirm>
      </div>
    </div>
  );
}
