import { useEffect, useMemo, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from 'components/core/Card';
import { Filter, Gift as GiftIcon, ArrowUpDown } from 'lucide-react';
import { useOutletContext } from 'react-router-dom';
import { Button, Spin, Select, Col, Row, Input, Switch, Badge, Card as AntdCard, Typography } from 'antd';
import type { Gift, GiftCategory } from 'types/models/gift';
import { DownOutlined, SearchOutlined, ShoppingCartOutlined, UpOutlined } from '@ant-design/icons';
import { useAddGiftToCart, useGetCart, useUpdateCartItemQuantity, useRemoveGiftFromCart } from 'src/hooks/useCart';
import { useComponentMountControl } from 'src/hooks/useComponentMountControl';
import { useWeddingListBySlug, useGetCategoriesByWeddingList } from 'src/hooks/useWeddingList';
import { OutletContextType } from './PublicRegistry';
import { GiftDetailsModal } from 'src/features/buyRegistry/components/GiftDetailsModal';
import { CartDrawer } from 'src/features/buyRegistry/components/CartDrawer';
import { SortOption, FilterOption, GiftItem } from 'routes/couple/ManageRegistry';
import { Label } from '@radix-ui/react-label';
import { V2GiftCard } from 'src/components/shared/V2GiftCard';
import { Collapsible } from 'src/components/core/Collapsible';
import dayjs from 'dayjs';

const { Title } = Typography;

export function BuyGifts() {
  const contextData = useOutletContext<OutletContextType>();
  const [isHeaderOpen, setIsHeaderOpen] = useState(true);
  const { coupleSlug, guestId } = contextData;
  console.log(guestId);
  const [sortBy, setSortBy] = useState<SortOption>('original');
  const [filterBy, setFilterBy] = useState<FilterOption>();
  const [gifts, setGifts] = useState<GiftItem[]>();
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedGift, setSelectedGift] = useState<Gift | null>(null);
  const [showPurchased, setShowPurchased] = useState(false);

  const { mutate: addGiftToCart } = useAddGiftToCart(guestId || undefined);
  const { data: cartData } = useGetCart(guestId || undefined);
  const { data: weddinglist } = useWeddingListBySlug(coupleSlug);
  const { data: weddingListCategories } = useGetCategoriesByWeddingList(weddinglist?.id);
  const { mutate: updateCartQuantity } = useUpdateCartItemQuantity();
  const { mutate: removeFromCart } = useRemoveGiftFromCart();

  const formattedWeddingDate = weddinglist?.weddingDate ? dayjs(weddinglist.weddingDate).format('MMM DD, YYYY') : '';
  const note = weddinglist?.description || '';

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

  // Close drawer on escape key press (even if the drawer is not focused)
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape' && showCartDrawer && setShowCartDrawer) {
        setShowCartDrawer(false);
      }
    };
    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [showCartDrawer]);

  useEffect(() => {
    if (weddinglist?.gifts) {
      // Sort gifts by their order property when initially loading
      const sortedGifts = [...weddinglist.gifts].sort((a, b) => a.order - b.order);
      setGifts(sortedGifts);
    }
  }, [weddinglist?.gifts]);

  const categoryArray = weddingListCategories?.categories?.map((category: any) => category.name);

  const handleAfterClose = (openedDrawer: boolean) => {
    if (!openedDrawer) {
      handleAfterCloseCartDrawer?.();
    }
  };

  const handleAddToCart = (giftId: number, quantity: number = 1) => {
    if (!giftId || !guestId) return;
    addGiftToCart({ giftId, quantity, sessionId: guestId });
    setShowGiftDetailsModal(false);
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

    // First apply purchased/not purchased filter based on showPurchased toggle
    if (!showPurchased) {
      filtered = filtered.filter((gift) => !gift.isPurchased);
    }

    // Handle empty or 'all' filter case
    if (!filterBy || filterBy.length === 0 || (filterBy.length === 1 && filterBy[0] === 'all')) {
      // No additional filtering needed
    } else {
      // Create separate arrays for each filter type
      const statusFilters: string[] = [];
      const categoryFilters: string[] = [];

      // Separate filters by type
      if (Array.isArray(filterBy)) {
        filterBy.forEach((filter) => {
          if (['pending', 'mostWanted', 'all'].includes(filter)) {
            statusFilters.push(filter);
          } else if (categoryArray?.includes(filter)) {
            categoryFilters.push(filter);
          }
        });
      }

      // Apply status filters (OR logic between different status types)
      if (statusFilters.length > 0) {
        filtered = filtered.filter((gift) => {
          return statusFilters.some((filter) => {
            if (filter === 'pending') return !gift.isPurchased;
            if (filter === 'mostWanted') return gift.isMostWanted;
            if (filter === 'all') return true;
            return false;
          });
        });
      }

      // Apply category filters (OR logic between categories)
      if (categoryFilters.length > 0) {
        filtered = filtered.filter((gift) => {
          return gift.categories && gift.categories.some((categoryItem) => categoryFilters.includes(categoryItem.name));
        });
      }
    }

    // Apply search term filter
    if (searchTerm.trim()) {
      const searchLower = searchTerm.toLowerCase().trim();
      filtered = filtered.filter(
        (gift) => gift.title.toLowerCase().includes(searchLower) || gift.description?.toLowerCase().includes(searchLower),
      );
    }

    // Apply sorting
    return sortGifts(filtered);
  }, [gifts, filterBy, sortBy, searchTerm, categoryArray, showPurchased]);

  if (!gifts || !weddinglist)
    return (
      <div className="flex justify-center items-center h-64">
        <Spin size="large" />
      </div>
    );

  const cartItemCount = cartData?.items?.length || 0;

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Floating Cart Button */}
      <div className="fixed top-[80px] right-[20px] z-50">
        <Badge count={cartItemCount} showZero={false}>
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
      {/* Header */}
      <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4">
        <div>
          <h1 className="text-3xl mb-2 text-primary">Mesa de Regalos - {weddinglist?.coupleName}</h1>
          <p className="text-muted-foreground">Encuentra el regalo perfecto para esta pareja especial</p>
        </div>
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
        <AntdCard className="mt-4 mb-4" variant="borderless">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <div className="flex flex-col items-center">
                <div className="relative w-96 bg-gray-100 rounded-md mb-4 overflow-hidden">
                  <img src={weddinglist?.imageUrl} alt="Couple Image" className="w-full h-full object-cover" />
                </div>
              </div>
            </div>
            <div className="flex items-center justify-center">
              <div className="flex flex-col items-center justify-center">
                <Title level={4}>{formattedWeddingDate}</Title>
                <div className="whitespace-pre-line text-center">{note}</div>
              </div>
            </div>
          </div>
        </AntdCard>
      </Collapsible>

      {/* Filters */}
      <Card className="mb-8">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Filter className="h-5 w-5" />
            Filtros
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-12 gap-3">
            <div className="col-span-4 relative">
              <Label className="text-sm">Buscar:</Label>
              <Input
                prefix={<SearchOutlined />}
                placeholder="Buscar regalos..."
                className="!rounded-md !shadow-sm pl-6"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>

            <div className="col-span-2 space-y-2 sm:space-y-0">
              <Label className="text-sm">Ordenar por:</Label>
              <div className="flex items-center w-full">
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

            <div className="col-span-4 space-y-2 sm:space-y-0">
              <Label className="text-sm">Filtrar por:</Label>
              <div className="flex items-center w-full">
                <Select
                  suffixIcon={<Filter size={14} />}
                  className="w-full !rounded-md !shadow-sm pl-6"
                  value={filterBy}
                  mode="multiple"
                  allowClear
                  placeholder="Selecciona un filtro"
                  onChange={(value: FilterOption) => setFilterBy(value)}
                  options={[
                    { value: 'mostWanted', label: 'Más deseados' },
                    ...(weddingListCategories?.categories?.map((category: GiftCategory) => ({
                      value: category.name,
                      label: category.name,
                    })) || []),
                  ]}
                />
              </div>
            </div>
            <div className="col-span-2 space-y-2 sm:space-y-0">
              <Label className="text-sm">Mostrar regalos comprados</Label>
              <div className="flex items-center mt-2">
                <Switch checked={showPurchased} className={showPurchased ? 'hover:!bg-primary' : ''} onChange={setShowPurchased} />
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Gift Grid */}
      <Row gutter={[24, 24]} className="min-h-[200px]">
        {filteredAndSortedGifts.map((gift) => (
          <Col xs={24} sm={12} md={8} lg={6} key={gift.id}>
            <V2GiftCard
              gift={gift}
              isGuest
              cartItems={cartData?.items || []}
              onAddToCart={(giftId) => {
                handleAddToCart(giftId);
              }}
              onUpdateCartQuantity={(cartItemId, quantity) => {
                updateCartQuantity({ cartItemId, quantity });
              }}
              onRemoveFromCart={(cartItemId) => {
                removeFromCart(cartItemId);
              }}
              onEdit={() => {
                setSelectedGift(gift);
                setShowGiftDetailsModal(true);
              }}
            />
          </Col>
        ))}
      </Row>

      {filteredAndSortedGifts.length === 0 && (
        <div className="text-center py-12">
          <GiftIcon className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
          <p className="text-lg text-muted-foreground mb-2">No se encontraron regalos</p>
          <p className="text-muted-foreground">Intenta ajustar tus filtros de búsqueda</p>
        </div>
      )}

      {renderCartDrawer && (
        <CartDrawer
          open={showCartDrawer}
          onClose={() => setShowCartDrawer(false)}
          cartData={cartData}
          sessionId={guestId}
          coupleSlug={coupleSlug || ''}
          afterOpenChange={handleAfterClose}
        />
      )}

      {renderGiftDetailsModal && (
        <GiftDetailsModal
          weddingListId={weddinglist?.id}
          giftId={selectedGift?.id}
          open={showGiftDetailsModal}
          afterClose={handleAfterCloseGiftDetailsModal}
          onAddToCart={handleAddToCart}
          cartItems={cartData?.items || []}
          onUpdateCartQuantity={(cartItemId, quantity) => {
            updateCartQuantity({ cartItemId, quantity });
          }}
          onRemoveFromCart={(cartItemId) => {
            removeFromCart(cartItemId);
          }}
          onCancel={() => {
            setShowGiftDetailsModal(false);
            setSelectedGift(null);
          }}
        />
      )}
    </div>
  );
}
