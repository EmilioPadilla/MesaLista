import { useEffect, useMemo, useState } from 'react';
import { Button, Spin, Tabs } from 'antd';
import { useComponentMountControl } from 'hooks/useComponentMountControl';
import { useReorderGifts } from 'src/hooks/useGiftList';
import { OutletContextPrivateType } from 'routes/Dashboard';
import { useNavigate, useOutletContext, useSearchParams } from 'react-router-dom';
import { Gift as GiftInterface } from 'types/models/gift';
import { useDeleteGift } from 'src/hooks/useGift';
import { StatsCards } from 'src/features/manageRegistry/components/StatsCards';
import { AddGiftForm } from 'src/features/manageRegistry/components/AddGiftForm';
import { StatsTabContent } from 'src/features/manageRegistry/components/StatsTabContent';
import { PurchasedGiftsTab } from 'src/features/manageRegistry/components/PurchasedGiftsTab';
import { GiftsList } from 'src/components/shared/GiftsList';
import { GiftModal } from 'src/features/manageRegistry/components/GiftModal';
import { useTrackEvent } from 'hooks/useAnalyticsTracking';
import { useDebounce } from 'src/hooks/useDebounce';
import { SettingOutlined } from '@ant-design/icons';
import { useGetCategoriesByGiftList, useGiftListsByUser } from 'src/hooks/useGiftList';

export interface GiftItem extends GiftInterface {
  purchasedBy?: string;
}

export type SortOption = 'name' | 'price-asc' | 'price-desc' | 'category' | 'status' | 'original';
export type FilterOption = 'all' | 'purchased' | 'pending' | 'mostWanted';

export const ManageRegistry = () => {
  const contextData = useOutletContext<OutletContextPrivateType>();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const listIdParam = searchParams.get('listId');

  // Fetch all user's gift lists
  const { data: giftLists } = useGiftListsByUser(contextData?.userData?.id);

  // Find the specific list by ID from query params, fallback to first list if no ID provided
  const giftList = useMemo(() => {
    if (!giftLists) return undefined;
    if (listIdParam) {
      return giftLists.find((list) => list.id === parseInt(listIdParam));
    }
    return giftLists[0];
  }, [giftLists, listIdParam]);

  const { data: weddingListCategories } = useGetCategoriesByGiftList(giftList?.id);
  const { mutate: reorderGifts } = useReorderGifts(giftList?.userId);
  const { mutate: deleteGift } = useDeleteGift();
  const trackEvent = useTrackEvent();

  const [gifts, setGifts] = useState<GiftItem[]>();
  const [editingGift, setEditingGift] = useState<GiftItem | null>(null);
  // Using 'original' as default to maintain original order
  const [sortBy, setSortBy] = useState<SortOption>('original');
  const [searchTerm, setSearchTerm] = useState('');
  const [filterBy, setFilterBy] = useState<FilterOption>('all');

  // Debounce search term to prevent excessive filtering (300ms delay)
  const debouncedSearchTerm = useDebounce(searchTerm, 300);

  // Track registry builder view
  useEffect(() => {
    trackEvent('VIEW_REGISTRY_BUILDER');
  }, []);

  useEffect(() => {
    if (giftList?.gifts) {
      // Sort gifts by their order property when initially loading
      const sortedGifts = [...giftList.gifts].sort((a, b) => a.order - b.order);
      setGifts(sortedGifts);
    }
  }, [giftList?.gifts]);

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
    if (giftList?.id) {
      reorderGifts({
        giftListId: giftList.id,
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

    // Apply debounced search term filter
    if (debouncedSearchTerm.trim()) {
      const searchLower = debouncedSearchTerm.toLowerCase().trim();
      filtered = filtered.filter(
        (gift) => gift.title.toLowerCase().includes(searchLower) || gift.description?.toLowerCase().includes(searchLower),
      );
    }

    // Apply sorting
    return sortGifts(filtered);
  }, [gifts, filterBy, sortBy, debouncedSearchTerm]);

  if (!gifts || !giftList)
    return (
      <div className="flex justify-center items-center h-64">
        <Spin size="large" />
      </div>
    );

  const handleDeleteGift = (giftId: number) => {
    deleteGift(giftId);
    setGifts(gifts.filter((gift) => gift.id !== giftId));
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl mb-2 text-primary">Gestionar Mesa de Regalos</h1>
          <p className="text-muted-foreground">Administra tu lista de regalos, ve estadísticas y mantén todo organizado para tu gran día</p>
        </div>
        <Button type="primary" icon={<SettingOutlined />} onClick={() => navigate(`/${contextData?.userData?.slug}/configuracion`)}>
          <span className="hidden md:flex">Configuración</span>
        </Button>
      </div>

      {/* Enhanced Stats Cards */}
      <StatsCards gifts={gifts} />

      <Tabs
        defaultActiveKey="gifts"
        items={[
          {
            key: 'gifts',
            label: 'Lista de Regalos',
            children: (
              <div className="space-y-6 mt-6">
                {/* Add New Gift */}
                <AddGiftForm
                  weddingListId={giftList?.id}
                  categoryOptions={categoryOptions}
                  onGiftCreated={() => {
                    // Refresh the gifts list when a new gift is created
                    if (giftList?.gifts) {
                      const sortedGifts = [...giftList.gifts].sort((a, b) => a.order - b.order);
                      setGifts(sortedGifts);
                    }
                  }}
                />

                {/* Gift List with Search, Sort and Filter */}
                <GiftsList
                  gifts={gifts}
                  filteredAndSortedGifts={filteredAndSortedGifts}
                  searchTerm={searchTerm}
                  sortBy={sortBy}
                  filterBy={filterBy}
                  weddingListCategories={weddingListCategories}
                  onSearchChange={setSearchTerm}
                  onSortChange={setSortBy}
                  onFilterChange={setFilterBy}
                  onReorder={handleReorderGifts}
                  onDelete={handleDeleteGift}
                  onEdit={(gift) => {
                    setEditingGift(gift);
                    setShowEditGiftModal(true);
                  }}
                />
              </div>
            ),
          },
          {
            key: 'purchased',
            label: 'Regalos Comprados',
            children: (
              <div className="mt-6">
                <PurchasedGiftsTab weddingListId={giftList?.id} />
              </div>
            ),
          },
          {
            key: 'stats',
            label: 'Estadísticas Detalladas',
            children: (
              <div className="mt-6">
                <StatsTabContent gifts={gifts} />
              </div>
            ),
          },
        ]}
      />

      {/* Edit Gift Modal */}
      {renderEditGiftModal && (
        <GiftModal
          gift={editingGift}
          isOpen={showEditGiftModal}
          onClose={() => setShowEditGiftModal(false)}
          // TODO: this is causing that the onSuccess of uploadFile is not being called
          // afterClose={handleAfterCloseEditGiftModal}
          weddingListId={giftList?.id}
          afterClose={handleAfterCloseEditGiftModal}
        />
      )}
    </div>
  );
};
