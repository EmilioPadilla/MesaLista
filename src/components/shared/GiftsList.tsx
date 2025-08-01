import { useState, useEffect, useMemo } from 'react';
import { Row, Typography, Button, Select, Empty, Col, Checkbox } from 'antd';
import { PlusOutlined } from '@ant-design/icons';
import type { WeddingListWithGifts } from 'types/models/weddingList';
import { DraggableList } from 'core/DraggableList';
import { SortableGiftItem } from '../../features/manageRegistry/components/SortableGiftItem';
import { useDeleteGift } from 'hooks/useGift';
import { useReorderGifts } from 'hooks/useWeddingList';
import { Gift } from 'types/models/gift';
import { GiftCard } from './GiftCard';

const { Title, Text } = Typography;

interface GiftsListProps {
  isGuest?: boolean;
  weddingListData: WeddingListWithGifts;
  onOpenGiftModal: (giftId: number | undefined) => void;
  onAddToCart?: (giftId: number) => void;
  weddingListCategories?: any;
}

export const GiftsList = ({ isGuest = false, weddingListData, onOpenGiftModal, onAddToCart, weddingListCategories }: GiftsListProps) => {
  const [filter, setFilter] = useState('Todos');
  const [sort, setSort] = useState('masQueridos');
  const [showPurchased, setShowPurchased] = useState(false);
  const [gifts, setGifts] = useState<Gift[]>(weddingListData?.gifts || []);

  const { mutate: deleteGift } = useDeleteGift();
  const { mutate: reorderGifts } = useReorderGifts(weddingListData?.coupleId);

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

  const sortOptions = [
    { value: 'masQueridos', label: 'Más queridos' },
    { value: 'menorAMayor', label: 'Menor a Mayor' },
    { value: 'mayorAMenor', label: 'Mayor a Menor' },
  ];

  const sortByFunctionOrOrder = (gifts: Gift[]) => {
    switch (sort) {
      case 'menorAMayor':
        return gifts.sort((a, b) => a.price - b.price);
      case 'mayorAMenor':
        return gifts.sort((a, b) => b.price - a.price);
      case 'masQueridos':
        return gifts.sort((a, b) => a.order - b.order);
      default:
        return gifts.sort((a, b) => a.order - b.order);
    }
  };

  const filteredGifts = useMemo(() => {
    const allGifts = weddingListData?.gifts || [];
    let filtered: Gift[];

    // First apply category filter
    if (filter === 'Todos') {
      filtered = allGifts;
    } else {
      // Filter by category
      filtered = allGifts.filter((gift) => gift.categories && gift.categories.some((categoryItem: any) => categoryItem.name === filter));
    }

    // Then apply purchased filter independently
    if (isGuest && !showPurchased) {
      filtered = filtered.filter((gift) => !gift.isPurchased);
    }

    return sortByFunctionOrOrder(filtered);
  }, [filter, weddingListData?.gifts, sort, showPurchased, isGuest]);

  const displayGifts = () => {
    if (filteredGifts.length === 0) {
      if (isGuest) {
        return <Empty description="No gifts added yet" />;
      }
      return (
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
      );
    }
    if (isGuest) {
      return (
        <Row gutter={[24, 24]} className="min-h-[200px]">
          {filteredGifts.map((gift) => (
            <Col xs={24} sm={12} md={8} lg={6} key={gift.id}>
              <GiftCard
                isGuest
                gift={gift}
                onDelete={handleDeleteGift}
                onEdit={() => onOpenGiftModal(gift.id)}
                onAddToCart={() => onAddToCart?.(gift.id)}
              />
            </Col>
          ))}
        </Row>
      );
    }
    return (
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
    );
  };

  return (
    <div className="mt-8 w-full">
      <div className={`flex justify-between items-center mb-6`}>
        {!isGuest ? (
          <Title level={3} className="m-0">
            Tus Regalos
          </Title>
        ) : (
          <Checkbox checked={showPurchased} onChange={(e) => setShowPurchased(e.target.checked)}>
            Mostrar regalos comprados
          </Checkbox>
        )}
        <div className="flex items-center">
          <Text className="mr-2">Sortear por:</Text>
          <Select value={sort} onChange={setSort} style={{ width: 150 }} options={sortOptions} />
          <div className="flex items-center ml-4">
            <Text className="mr-2">Filtrar por:</Text>

            <Select value={filter} onChange={setFilter} style={{ width: 150 }} options={filterOptions} />
            {!isGuest && <Button type="primary" icon={<PlusOutlined />} className="ml-4" onClick={() => onOpenGiftModal(undefined)} />}
          </div>
        </div>
      </div>

      {displayGifts()}
    </div>
  );
};
