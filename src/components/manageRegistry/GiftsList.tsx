import { useState, useEffect } from 'react';
import { Row, Typography, Button, Select, Empty } from 'antd';
import { PlusOutlined } from '@ant-design/icons';
import type { WeddingListWithGifts } from '../../../shared/types/weddingList';
import type { GiftBase } from '../../../shared/types/gift';
import { DraggableList } from '../core/DraggableList';
import { SortableGiftItem } from './SortableGiftItem';

const { Title, Text } = Typography;

interface GiftsListProps {
  weddingListData: WeddingListWithGifts;
  loadingGifts?: boolean;
  onOpenGiftModal: (giftId: number | undefined) => void;
}

export const GiftsList = ({ weddingListData, loadingGifts, onOpenGiftModal }: GiftsListProps) => {
  const [filter, setFilter] = useState('Everything');
  const [gifts, setGifts] = useState<GiftBase[]>(weddingListData?.gifts || []);

  useEffect(() => {
    if (weddingListData) {
      setGifts(weddingListData.gifts);
    }
  }, [weddingListData]);

  const handleReorderGifts = (reorderedGifts: GiftBase[]) => {
    setGifts(reorderedGifts);
    // Here you would typically save the new order to the backend
    console.log('Gifts reordered:', reorderedGifts);
  };

  const handleDeleteGift = (giftId: number) => {
    console.log('Delete gift:', giftId);
    // Implement delete functionality
    setGifts(gifts.filter((gift) => gift.id !== giftId));
  };

  const handleMoveGift = (giftId: number) => {
    console.log('Move gift:', giftId);
    // Implement move functionality
  };

  const filterOptions = [
    { value: 'Everything', label: 'Everything' },
    { value: 'Kitchen', label: 'Kitchen' },
    { value: 'Dining', label: 'Dining' },
    { value: 'Bedroom', label: 'Bedroom' },
    { value: 'Bathroom', label: 'Bathroom' },
    { value: 'Living Room', label: 'Living Room' },
  ];

  const filteredGifts = filter === 'Everything' ? gifts : gifts.filter((gift) => gift.category === filter);

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
            <SortableGiftItem
              key={gift.id}
              gift={gift}
              onDelete={handleDeleteGift}
              onMove={handleMoveGift}
              onEdit={() => onOpenGiftModal(gift.id)}
            />
          )}
        />
      )}
    </div>
  );
};
