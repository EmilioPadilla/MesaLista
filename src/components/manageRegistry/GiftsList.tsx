import { useState, useEffect, useMemo } from 'react';
import { Row, Typography, Button, Select, Empty } from 'antd';
import { PlusOutlined } from '@ant-design/icons';
import type { WeddingListWithGifts } from 'types/models/weddingList';
import { DraggableList } from 'core/DraggableList';
import { SortableGiftItem } from './SortableGiftItem';
import { useDeleteGift } from 'hooks/useGift';
import { useCategoriesByWeddingList, useReorderGifts } from 'hooks/useWeddingList';
import { Gift } from 'types/models/gift';

const { Title, Text } = Typography;

interface GiftsListProps {
  weddingListData: WeddingListWithGifts;
  onOpenGiftModal: (giftId: number | undefined) => void;
}

export const GiftsList = ({ weddingListData, onOpenGiftModal }: GiftsListProps) => {
  const [filter, setFilter] = useState('Todos');
  const [gifts, setGifts] = useState<Gift[]>(weddingListData?.gifts || []);

  const { mutate: deleteGift } = useDeleteGift();
  const { mutate: reorderGifts } = useReorderGifts(weddingListData?.coupleId);

  const { data: weddingListCategories } = useCategoriesByWeddingList(weddingListData?.id);
  useEffect(() => {
    if (weddingListData) {
      setGifts(weddingListData.gifts);
    }
  }, [weddingListData]);

  useEffect(() => {
    if (weddingListData) {
      setGifts(weddingListData.gifts);
    }
  }, [weddingListData]);

  // Filter gifts by category locally
  useEffect(() => {
    if (filter === 'Todos') {
      setGifts(weddingListData?.gifts || []);
    } else {
      const filteredGifts = weddingListData?.gifts?.filter((gift) =>
        gift.categories?.some((category: any) => category?.category?.name === filter),
      );
      setGifts(filteredGifts || []);
    }
  }, [filter]);

  const handleReorderGifts = (reorderedGifts: Gift[]) => {
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
    if (weddingListData?.id) {
      reorderGifts({
        weddingListId: weddingListData.id,
        giftOrders,
      });
    }
  };

  const handleDeleteGift = (giftId: number) => {
    deleteGift(giftId);
    setGifts(gifts.filter((gift) => gift.id !== giftId));
  };

  const filterOptions = [
    { value: 'Todos', label: 'Todos' },
    ...(weddingListCategories?.categories?.map((category: any) => ({ value: category.name, label: category.name })) || []),
  ];

  const filteredGifts = useMemo(
    () =>
      (filter === 'Todos'
        ? gifts
        : gifts.filter((gift) => gift.categories && gift.categories.some((categoryItem: any) => categoryItem.category.name === filter))
      ).sort((a, b) => (a.order || 0) - (b.order || 0)),
    [filter, gifts],
  );

  return (
    <div className="mt-8 w-full">
      <div className="flex justify-between items-center mb-6">
        <Title level={3} className="m-0">
          Tus Regalos
        </Title>
        <div className="flex items-center">
          <Text className="mr-2">Filtrar por:</Text>

          <Select value={filter} onChange={setFilter} style={{ width: 150 }} options={filterOptions} />
          <Button type="primary" icon={<PlusOutlined />} className="ml-4" onClick={() => onOpenGiftModal(undefined)} />
        </div>
      </div>

      {filteredGifts.length === 0 ? (
        <div className="bg-gray-50 rounded-lg p-10 text-center">
          <Empty
            description={
              <div className="mt-4">
                <Text className="text-gray-500 block mb-4">No gifts added yet</Text>
                <Button type="primary" icon={<PlusOutlined />} onClick={() => onOpenGiftModal(undefined)}>
                  Add Gifts
                </Button>
              </div>
            }
          />
        </div>
      ) : (
        <DraggableList
          items={filteredGifts}
          getItemId={(gift) => gift.id}
          onReorder={handleReorderGifts}
          renderContainer={(children) => (
            <Row gutter={[24, 24]} className="min-h-[200px]">
              {children}
            </Row>
          )}
          renderItem={(gift) => (
            <SortableGiftItem key={gift.id} gift={gift} onDelete={handleDeleteGift} onEdit={() => onOpenGiftModal(gift.id)} />
          )}
        />
      )}
    </div>
  );
};
