import React, { useEffect, useState } from 'react';
import { Typography, Form, message, Button, Card, Badge } from 'antd';
import { DownOutlined, UpOutlined, ShoppingCartOutlined } from '@ant-design/icons';
import { giftService } from 'services/gift.service';
import type { Gift } from 'types/models/gift';
import { useGetCategoriesByWeddingList } from 'hooks/useWeddingList';
import { GiftsList } from 'src/components/shared/GiftsList';
import { useOutletContext } from 'react-router-dom';
import { GuestContext } from 'src/app/routes/guest/PublicRegistry';
import { useWeddingListBySlug } from 'hooks/useWeddingList';
import { Collapsible } from 'components/core/Collapsible';
import dayjs from 'dayjs';
import { useGetUserBySlug } from 'hooks/useUser';
import { useComponentMountControl } from 'src/hooks/useComponentMountControl';
import { GiftDetailsModal } from 'src/features/buyRegistry/components/GiftDetailsModal';
import { CartDrawer } from 'src/features/buyRegistry/components/CartDrawer';
import { useAddGiftToCart, useGetCart } from 'hooks/useCart';

const { Title, Text } = Typography;

interface BuyGiftsProps {}

const BuyGifts: React.FC<BuyGiftsProps> = () => {
  const contextData = useOutletContext<GuestContext>();
  const [isHeaderOpen, setIsHeaderOpen] = useState(true);
  const { coupleSlug, guestId } = contextData;

  const { data: userData } = useGetUserBySlug(coupleSlug);
  const { mutate: addGiftToCart } = useAddGiftToCart(guestId || undefined);
  const { data: cartData } = useGetCart(guestId || undefined);
  const { data: weddinglist } = useWeddingListBySlug(coupleSlug);
  const { data: weddingListCategories } = useGetCategoriesByWeddingList(weddinglist?.id);

  const {
    isOpen: showGiftDetailsModal,
    setIsOpen: setShowGiftDetailsModal,
    shouldRender: renderGiftDetailsModal,
    handleAfterClose: handleAfterCloseGiftDetailsModal,
  } = useComponentMountControl();

  const {
    isOpen: showCartDrawer,
    setIsOpen: setShowCartDrawer,
    shouldRender: renderCartDrawer,
    handleAfterClose: handleAfterCloseCartDrawer,
  } = useComponentMountControl();

  const [selectedGiftId, setSelectedGiftId] = useState<number | null>(null);
  const [selectedGift, setSelectedGift] = useState<Gift | null>(null);
  const [form] = Form.useForm();
  const formattedWeddingDate = weddinglist?.weddingDate ? dayjs(weddinglist.weddingDate).format('MMM DD, YYYY') : '';
  const note = weddinglist?.description || '';

  const handlePurchase = (giftId?: number) => {
    if (!giftId) return;
    setSelectedGiftId(giftId);
    setShowGiftDetailsModal(true);
    form.resetFields();
  };

  const handleAddToCart = (giftId: number, quantity: number = 1) => {
    if (!giftId || !guestId) return;
    addGiftToCart({ giftId, quantity, sessionId: guestId });
    setShowGiftDetailsModal(false);
  };

  useEffect(() => {
    if (selectedGiftId) {
      setSelectedGift(weddinglist?.gifts?.find((gift) => gift.id === selectedGiftId) || null);
    }
  }, [selectedGiftId]);

  // Calculate total items in cart
  const totalCartItems = cartData?.items?.length || 0;

  return (
    <div className="m-6">
      {/* Floating Cart Button */}
      <div className="fixed top-[60px] right-[20px] z-50">
        <Badge count={totalCartItems} showZero={false}>
          <Button
            type="primary"
            shape="circle"
            size="large"
            icon={<ShoppingCartOutlined />}
            className="shadow-lg hover:shadow-xl transition-shadow duration-200"
            onClick={() => {
              setShowCartDrawer(true);
            }}
          />
        </Badge>
      </div>
      <div className="p-6 bg-white rounded-lg shadow">
        <div className="mb-6 text-center">
          <Title className="chamberi-heading" level={1}>
            {weddinglist?.coupleName || `${userData?.firstName} & ${userData?.spouseFirstName}`}
          </Title>
        </div>

        <div className="flex justify-center">
          <Button
            type="link"
            icon={isHeaderOpen ? <UpOutlined /> : <DownOutlined />}
            className="text-gray-500"
            onClick={() => setIsHeaderOpen(!isHeaderOpen)}>
            {isHeaderOpen ? 'Ocultar Foto y Nota' : 'Ver Foto y Nota'}
          </Button>
        </div>
        <Collapsible isOpen={isHeaderOpen}>
          <Card className="mt-4 mb-4" variant="borderless">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <div className="flex flex-col items-center">
                  <div className="relative w-96 bg-gray-100 rounded-md mb-4 overflow-hidden">
                    <img src={weddinglist?.imageUrl} alt="Couple Image" className="w-full h-full object-cover" />
                  </div>
                </div>
              </div>
              <div className="flex items-center justify-center">
                <div className="flex flex-col">
                  <Title level={4}>{formattedWeddingDate}</Title>
                  <Text>{note}</Text>
                </div>
              </div>
            </div>
          </Card>
        </Collapsible>

        {weddinglist?.gifts?.length === 0 ? (
          <div className="flex justify-center items-center h-64">
            <Text>No se encontraron listas de regalos.</Text>
          </div>
        ) : (
          <GiftsList
            isGuest={true}
            weddingListData={weddinglist!}
            onOpenGiftModal={handlePurchase}
            onAddToCart={handleAddToCart}
            weddingListCategories={weddingListCategories}
          />
        )}
      </div>

      {renderGiftDetailsModal && (
        <GiftDetailsModal
          weddingListId={weddinglist?.id}
          giftId={selectedGift?.id}
          open={showGiftDetailsModal}
          afterClose={handleAfterCloseGiftDetailsModal}
          onAddToCart={handleAddToCart}
          onCancel={() => {
            setShowGiftDetailsModal(false);
            setSelectedGift(null);
          }}
        />
      )}

      {renderCartDrawer && (
        <CartDrawer
          open={showCartDrawer}
          onClose={() => setShowCartDrawer(false)}
          cartData={cartData}
          sessionId={guestId || undefined}
        />
      )}
    </div>
  );
};

export default BuyGifts;
