import { useEffect, useMemo, useState } from 'react';
import { Card, CardContent } from 'components/core/Card';
import { Label } from 'components/core/Label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from 'components/core/Tabs';
import { ArrowUpDown, Filter } from 'lucide-react';
import { Row, Spin, Select } from 'antd';
import { useComponentMountControl } from 'hooks/useComponentMountControl';
import { useGetCategoriesByWeddingList, useReorderGifts, useWeddingListByCouple } from 'src/hooks/useWeddingList';
import { OutletContextPrivateType } from 'routes/Dashboard';
import { useOutletContext } from 'react-router-dom';
import { EditGiftModal } from 'src/features/manageRegistry/components/EditGiftModal';
import { GiftCategory, Gift as GiftInterface } from 'types/models/gift';
import { DraggableList } from 'components/core/DraggableList';
import { SortableGiftItem } from 'features/manageRegistry/components/SortableGiftItem';
import { useDeleteGift } from 'src/hooks/useGift';
import { StatsCards } from 'src/features/manageRegistry/components/StatsCards';
import { AddGiftForm } from 'src/features/manageRegistry/components/AddGiftForm';
import { StatsTabContent } from 'src/features/manageRegistry/components/StatsTabContent';

export interface GiftItem extends GiftInterface {
  purchasedBy?: string;
}

export type SortOption = 'name' | 'price-asc' | 'price-desc' | 'category' | 'status' | 'original';
export type FilterOption = 'all' | 'purchased' | 'pending' | 'mostWanted';

export const ManageRegistry = () => {
  const contextData = useOutletContext<OutletContextPrivateType>();
  // Use props if provided directly, otherwise use context from Outlet
  const { data: weddinglist } = useWeddingListByCouple(contextData?.userData?.id);
  const { data: weddingListCategories } = useGetCategoriesByWeddingList(weddinglist?.id);
  const { mutate: reorderGifts } = useReorderGifts(weddinglist?.coupleId);
  const { mutate: deleteGift } = useDeleteGift();

  const [gifts, setGifts] = useState<GiftItem[]>();
  const [editingGift, setEditingGift] = useState<GiftItem | null>(null);
  // Using 'original' as default to maintain original order
  const [sortBy, setSortBy] = useState<SortOption>('original');
  const [filterBy, setFilterBy] = useState<FilterOption>('all');

  useEffect(() => {
    if (weddinglist?.gifts) {
      // Sort gifts by their order property when initially loading
      const sortedGifts = [...weddinglist.gifts].sort((a, b) => a.order - b.order);
      setGifts(sortedGifts);
    }
  }, [weddinglist?.gifts]);

  const {
    isOpen: showEditGiftModal,
    setIsOpen: setShowEditGiftModal,
    shouldRender: renderEditGiftModal,
    handleAfterClose: handleAfterCloseEditGiftModal,
  } = useComponentMountControl();

  const categoryOptions = weddingListCategories?.categories?.map((category: any) => ({ value: category.name, label: category.name }));
  const categoryArray = weddingListCategories?.categories?.map((category: any) => category.name);

  const handleReorderGifts = (reorderedGifts: GiftItem[]) => {
    // Update each gift's order property to match its new index
    const updatedGifts = reorderedGifts.map((gift, idx) => ({
      ...gift,
      order: idx,
    }));
    setGifts(updatedGifts);

    // Create the order updates array
    const giftOrders = updatedGifts.map((gift) => ({
      giftId: gift.id,
      order: gift.order,
    }));

    // Persist the new order to the backend
    if (weddinglist?.id) {
      reorderGifts({
        weddingListId: weddinglist.id,
        giftOrders,
      });
    }
  };

  // Sort and filter logic
  const sortGifts = (giftsToSort: GiftItem[]) => {
    switch (sortBy) {
      case 'name':
        return [...giftsToSort].sort((a, b) => a.title.localeCompare(b.title));
      case 'price-asc':
        return [...giftsToSort].sort((a, b) => a.price - b.price);
      case 'price-desc':
        return [...giftsToSort].sort((a, b) => b.price - a.price);
      case 'status':
        return [...giftsToSort].sort((a, b) => Number(a.isPurchased) - Number(b.isPurchased));
      case 'original':
      default:
        return [...giftsToSort].sort((a, b) => a.order - b.order);
    }
  };

  const filteredAndSortedGifts = useMemo(() => {
    if (!gifts) return [];

    let filtered = [...gifts];

    // Apply purchased/pending filter
    if (filterBy === 'pending') {
      filtered = filtered.filter((gift) => !gift.isPurchased);
    } else if (filterBy === 'purchased') {
      filtered = filtered.filter((gift) => gift.isPurchased);
    } else if (filterBy === 'mostWanted') {
      filtered = filtered.filter((gift) => gift.isMostWanted);
    } else if (categoryArray?.includes(filterBy)) {
      filtered = filtered.filter((gift) => gift.categories && gift.categories.some((categoryItem: any) => categoryItem.name === filterBy));
    }

    // Apply sorting
    return sortGifts(filtered);
  }, [gifts, filterBy, sortBy]);

  if (!gifts || !weddinglist)
    return (
      <div className="flex justify-center items-center h-64">
        <Spin size="large" />
      </div>
    );

  // Enhanced statistics
  const stats = {
    totalItems: gifts.length,
    purchasedItems: gifts.filter((g) => g.isPurchased).length,
    totalValue: gifts.reduce((sum, g) => sum + g.price, 0),
    purchasedValue: gifts.filter((g) => g.isPurchased).reduce((sum, g) => sum + g.price, 0),
    averagePrice: gifts.length > 0 ? Math.round(gifts.reduce((sum, g) => sum + g.price, 0) / gifts.length) : 0,
    minPrice: gifts.length > 0 ? Math.min(...gifts.map((g) => g.price)) : 0,
    maxPrice: gifts.length > 0 ? Math.max(...gifts.map((g) => g.price)) : 0,
    priceRanges: {
      low: gifts.filter((g) => g.price < 1000).length,
      medium: gifts.filter((g) => g.price >= 1000 && g.price < 5000).length,
      high: gifts.filter((g) => g.price >= 5000).length,
    },
    categoryDistribution: gifts.reduce(
      (acc, gift) => {
        gift.categories?.forEach((category) => {
          acc[category.name] = (acc[category.name] || 0) + 1;
        });
        return acc;
      },
      {} as Record<string, number>,
    ),
  };

  const handleDeleteGift = (giftId: number) => {
    deleteGift(giftId);
    setGifts(gifts.filter((gift) => gift.id !== giftId));
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="mb-8">
        <h1 className="text-3xl mb-2 text-primary">Gestionar Mesa de Regalos</h1>
        <p className="text-muted-foreground">Administra tu lista de regalos, ve estadísticas y mantén todo organizado para tu gran día</p>
      </div>

      {/* Enhanced Stats Cards */}
      <StatsCards stats={stats} />

      <Tabs defaultValue="gifts" className="w-full">
        <TabsList className="grid w-full grid-cols-2 shadow-sm">
          <TabsTrigger value="gifts">Lista de Regalos</TabsTrigger>
          <TabsTrigger value="stats">Estadísticas Detalladas</TabsTrigger>
        </TabsList>

        <TabsContent value="gifts" className="space-y-6">
          {/* Add New Gift */}
          <AddGiftForm
            weddingListId={weddinglist?.id}
            categoryOptions={categoryOptions}
            onGiftCreated={() => {
              // Refresh the gifts list when a new gift is created
              if (weddinglist?.gifts) {
                const sortedGifts = [...weddinglist.gifts].sort((a, b) => a.order - b.order);
                setGifts(sortedGifts);
              }
            }}
          />

          {/* Sort and Filter Controls */}
          <Card className="shadow-md">
            <CardContent className="pt-6">
              <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
                <div className="flex flex-col sm:flex-row gap-4">
                  <div className="space-y-2 sm:space-y-0">
                    <Label className="text-sm">Ordenar por:</Label>
                    <div className="flex items-center w-[180px]">
                      <Select
                        suffixIcon={<ArrowUpDown size={14} />}
                        className="w-full !rounded-md !shadow-sm pl-6"
                        value={sortBy}
                        onChange={(value: SortOption) => setSortBy(value)}
                        options={[
                          { value: 'original', label: 'Orden Original' },
                          { value: 'name', label: 'Nombre A-Z' },
                          { value: 'price-asc', label: 'Precio (menor)' },
                          { value: 'price-desc', label: 'Precio (mayor)' },
                          { value: 'status', label: 'Estado' },
                        ]}
                      />
                    </div>
                  </div>

                  <div className="space-y-2 sm:space-y-0">
                    <Label className="text-sm">Filtrar por:</Label>
                    <div className="flex items-center w-[180px]">
                      <Select
                        suffixIcon={<Filter size={14} />}
                        className="w-full !rounded-md !shadow-sm pl-6"
                        value={filterBy}
                        onChange={(value: FilterOption) => setFilterBy(value)}
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
                  </div>
                </div>

                <div className="text-sm text-muted-foreground">
                  Mostrando {filteredAndSortedGifts.length} de {gifts.length} regalos
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Gift List */}
          <DraggableList
            items={filteredAndSortedGifts}
            getItemId={(gift) => gift.id}
            onReorder={handleReorderGifts}
            renderContainer={(children) => (
              <Row gutter={[24, 24]} className="min-h-[200px] flex-wrap">
                {children}
              </Row>
            )}
            renderItem={(gift) => (
              <SortableGiftItem
                newModel
                key={gift.id}
                gift={gift}
                onDelete={() => handleDeleteGift(gift.id)}
                onEdit={() => {
                  setEditingGift(gift);
                  setShowEditGiftModal(true);
                }}
              />
            )}
          />
        </TabsContent>

        <TabsContent value="stats">
          <StatsTabContent stats={stats} />
        </TabsContent>
      </Tabs>

      {/* Edit Gift Modal */}
      {renderEditGiftModal && (
        <EditGiftModal
          gift={editingGift}
          isOpen={showEditGiftModal}
          onClose={() => setShowEditGiftModal(false)}
          weddingListId={weddinglist?.id}
        />
      )}
    </div>
  );
};
