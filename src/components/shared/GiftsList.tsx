import { ArrowUpDown, Filter } from 'lucide-react';
import { Row, Select, Input, Card } from 'antd';
import { SearchOutlined } from '@ant-design/icons';
import { DraggableList } from 'components/core/DraggableList';
import { SortableGiftItem } from 'features/manageRegistry/components/SortableGiftItem';
import { GiftCategory } from 'types/models/gift';
import { GiftItem, SortOption, FilterOption } from 'src/app/routes/couple/ManageRegistry';

interface GiftsListProps {
  gifts: GiftItem[];
  filteredAndSortedGifts: GiftItem[];
  searchTerm: string;
  sortBy: SortOption;
  filterBy: FilterOption;
  weddingListCategories?: { categories: GiftCategory[] };
  onSearchChange: (value: string) => void;
  onSortChange: (value: SortOption) => void;
  onFilterChange: (value: FilterOption) => void;
  onReorder: (gifts: GiftItem[]) => void;
  onDelete: (giftId: number) => void;
  onEdit: (gift: GiftItem) => void;
}

export const GiftsList = ({
  gifts,
  filteredAndSortedGifts,
  searchTerm,
  sortBy,
  filterBy,
  weddingListCategories,
  onSearchChange,
  onSortChange,
  onFilterChange,
  onReorder,
  onDelete,
  onEdit,
}: GiftsListProps) => {
  return (
    <div className="space-y-6">
      {/* Search, Sort and Filter Controls */}
      <Card className="shadow-md !mb-4">
        <div className="grid grid-cols-1 md:grid-cols-12 gap-4 items-end">
          <div className="col-span-4">
            <label className="text-md">Buscar:</label>
            <Input
              prefix={<SearchOutlined />}
              placeholder="Buscar regalos..."
              className="!rounded-md !shadow-sm"
              value={searchTerm}
              onChange={(e) => onSearchChange(e.target.value)}
            />
          </div>

          <div className="col-span-3">
            <label className="text-md">Ordenar por:</label>
            <Select
              suffixIcon={<ArrowUpDown size={14} />}
              className="w-full !rounded-md !shadow-sm"
              value={sortBy}
              onChange={onSortChange}
              options={[
                { value: 'original', label: 'Orden Original' },
                { value: 'name', label: 'Nombre A-Z' },
                { value: 'price-asc', label: 'Precio (menor)' },
                { value: 'price-desc', label: 'Precio (mayor)' },
                { value: 'status', label: 'Estado' },
              ]}
            />
          </div>

          <div className="col-span-3">
            <label className="text-md">Filtrar por:</label>
            <Select
              suffixIcon={<Filter size={14} />}
              className="w-full !rounded-md !shadow-sm"
              value={filterBy}
              onChange={onFilterChange}
              options={[
                { value: 'all', label: 'Todos' },
                { value: 'purchased', label: 'Comprados' },
                { value: 'pending', label: 'Pendientes' },
                { value: 'mostWanted', label: 'Más Querido' },
                ...(weddingListCategories?.categories?.map((category: GiftCategory) => ({
                  value: category.name,
                  label: category.name,
                })) || []),
              ]}
            />
          </div>

          <div className="col-span-2 text-md text-muted-foreground text-right">
            {filteredAndSortedGifts.length} de {gifts.length}
          </div>
        </div>
      </Card>

      {/* Gift List */}
      <DraggableList
        items={filteredAndSortedGifts}
        getItemId={(gift) => gift.id}
        onReorder={onReorder}
        renderContainer={(children) => (
          <Row gutter={[24, 24]} className="min-h-[200px] flex-wrap">
            {children}
          </Row>
        )}
        renderItem={(gift) => (
          <SortableGiftItem newModel key={gift.id} gift={gift} onDelete={() => onDelete(gift.id)} onEdit={() => onEdit(gift)} />
        )}
      />
    </div>
  );
};
