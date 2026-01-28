import { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Card, Modal, Input, message, Spin, Space } from 'antd';
import { useCurrentUser } from 'hooks/useUser';
import { useGiftListsByUser, useDeleteGiftList } from 'hooks/useGiftList';
import { Plus, Gift, CheckCircle, ShoppingBag, DollarSign, Search } from 'lucide-react';
import type { GiftListWithGifts } from 'types/models/giftList';
import { MLButton } from 'src/components/core/MLButton';
import { GiftListCard } from 'src/features/giftLists/GiftListCard';

function MyGiftLists() {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const [searchQuery, setSearchQuery] = useState('');

  const { data: user, isLoading: isLoadingUser } = useCurrentUser();
  const { data: giftLists, isLoading: isLoadingLists } = useGiftListsByUser(user?.id);
  const { mutateAsync: deleteGiftList } = useDeleteGiftList();

  // Handle payment success redirect
  useEffect(() => {
    const paymentStatus = searchParams.get('payment');
    if (paymentStatus === 'success') {
      message.success('¡Pago procesado exitosamente! Tu nueva lista ha sido creada.');
      // Clear the payment parameter from URL
      searchParams.delete('payment');
      searchParams.delete('session_id');
      setSearchParams(searchParams, { replace: true });
      // Clear pending gift list data from session storage
      sessionStorage.removeItem('pendingGiftListData');
    } else if (paymentStatus === 'cancelled') {
      message.warning('El pago fue cancelado. Puedes intentarlo nuevamente.');
      searchParams.delete('payment');
      setSearchParams(searchParams, { replace: true });
    }
  }, [searchParams, setSearchParams]);

  const filteredLists = giftLists?.filter(
    (list) =>
      list.coupleName.toLowerCase().includes(searchQuery.toLowerCase()) || list.title?.toLowerCase().includes(searchQuery.toLowerCase()),
  );

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('es-MX', {
      style: 'currency',
      currency: 'MXN',
      minimumFractionDigits: 0,
    }).format(amount);
  };

  const getRaisedAmount = (list: GiftListWithGifts) => {
    if (!list.gifts) return 0;
    return list.gifts.filter((g) => g.isPurchased).reduce((sum, gift) => sum + gift.price, 0);
  };

  // Stats
  const activeLists = giftLists?.filter((l) => l.isActive).length || 0;
  const totalGifts = giftLists?.reduce((sum, l) => sum + (l.gifts?.length || 0), 0) || 0;
  const totalRaised = giftLists?.reduce((sum, l) => sum + getRaisedAmount(l), 0) || 0;

  const handleCreateNewList = () => {
    navigate(`/${user?.slug}/crear-lista`);
  };

  const handleViewList = (listId: number) => {
    if (user?.slug) {
      navigate(`/${user.slug}/gestionar?listId=${listId}`);
    }
  };

  const handleManageInvitation = (listId: number) => {
    if (user?.slug) {
      navigate(`/${user.slug}/invitacion?listId=${listId}`);
    }
  };

  const handleViewInvitation = (listId: number) => {
    if (user?.slug) {
      // take the user to a new tab
      const url = `/${user.slug}/${listId}/invitacion`;
      window.open(url, '_blank', 'noopener,noreferrer');
    }
  };

  const handleDeleteList = async (listId: number, listTitle: string) => {
    Modal.confirm({
      title: '¿Eliminar lista?',
      content: `¿Estás seguro de que quieres eliminar "${listTitle}"? Esta acción no se puede deshacer.`,
      okText: 'Eliminar',
      okType: 'danger',
      cancelText: 'Cancelar',
      onOk: async () => {
        try {
          await deleteGiftList(listId);
          message.success('Lista eliminada exitosamente');
        } catch (error: any) {
          console.error('Error deleting gift list:', error);
          message.error('Error al eliminar la lista');
        }
      },
    });
  };

  if (isLoadingUser || isLoadingLists) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Spin size="large" />
      </div>
    );
  }

  if (!user) {
    navigate('/login');
    return null;
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Hero Section */}
      <div className="bg-linear-to-b from-orange-50 to-white py-16 sm:py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-6 mb-12">
            <div>
              <h1 className="text-4xl sm:text-5xl font-light text-foreground mb-3 tracking-tight">Mis Listas de Regalos</h1>
              <p className="text-lg text-muted-foreground font-light">Gestiona todas tus mesas de regalos en un solo lugar</p>
            </div>
          </div>

          {/* Stats Cards */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            <Card className="border-0 shadow-sm bg-white rounded-2xl overflow-hidden">
              <div className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground font-light mb-1">Listas Totales</p>
                    <p className="text-3xl font-light">{giftLists?.length || 0}</p>
                  </div>
                  <div className="w-12 h-12 bg-[#f5f5f7] rounded-full flex items-center justify-center">
                    <Gift className="h-6 w-6 text-[#007aff]" />
                  </div>
                </div>
              </div>
            </Card>

            <Card className="border-0 shadow-sm! bg-white rounded-2xl! overflow-hidden">
              <div className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground font-light mb-1">Listas Activas</p>
                    <p className="text-3xl font-light">{activeLists}</p>
                  </div>
                  <div className="w-12 h-12 bg-[#e8f5e9] rounded-full flex items-center justify-center">
                    <CheckCircle className="h-6 w-6 text-[#34c759]" />
                  </div>
                </div>
              </div>
            </Card>

            <Card className="border-0 shadow-sm! bg-white rounded-2xl! overflow-hidden">
              <div className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground font-light mb-1">Regalos Totales</p>
                    <p className="text-3xl font-light">{totalGifts}</p>
                  </div>
                  <div className="w-12 h-12 bg-[#fff3e0] rounded-full flex items-center justify-center">
                    <ShoppingBag className="h-6 w-6 text-[#ff9500]" />
                  </div>
                </div>
              </div>
            </Card>

            <Card className="border-0 shadow-sm! bg-white rounded-2xl! overflow-hidden">
              <div className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground font-light mb-1">Total Recaudado</p>
                    <p className="text-2xl font-light">{formatCurrency(totalRaised)}</p>
                  </div>
                  <div className="w-12 h-12 bg-[#e3f2fd] rounded-full flex items-center justify-center">
                    <DollarSign className="h-6 w-6 text-[#007aff]" />
                  </div>
                </div>
              </div>
            </Card>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* Search Bar */}
        <div className="mb-8 flex items-center justify-between">
          <div className="relative max-w-md">
            <Space.Compact className="flex items-center pl-4 bg-[#f5f5f7] rounded-2xl! gap-2">
              <Search className="h-5! w-5! text-muted-foreground! " />
              <Input
                type="text"
                placeholder="Buscar listas..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-12 py-3 bg-[#f5f5f7]! border-0! rounded-r-2xl! text-base!"
              />
            </Space.Compact>
          </div>
          <MLButton onClick={handleCreateNewList} buttonType="primary">
            <Plus className="h-5 w-5 mr-2" />
            Crear Nueva Lista
          </MLButton>
        </div>

        {/* Lists Grid */}
        {!filteredLists || filteredLists.length === 0 ? (
          <div className="text-center py-16">
            <div className="w-24 h-24 bg-[#f5f5f7] rounded-full flex items-center justify-center mx-auto mb-6">
              <Gift className="h-12 w-12 text-muted-foreground" />
            </div>
            <h3 className="text-2xl font-light text-foreground mb-3">
              {searchQuery ? 'No se encontraron listas' : 'No tienes listas de regalos'}
            </h3>
            <p className="text-muted-foreground font-light mb-8">
              {searchQuery ? 'Intenta con otro término de búsqueda' : 'Comienza creando tu primera lista de regalos'}
            </p>
            {!searchQuery && (
              <MLButton onClick={handleCreateNewList} buttonType="primary">
                <Plus className="h-5 w-5 mr-2" />
                Crear Lista
              </MLButton>
            )}
          </div>
        ) : (
          <div className="space-y-6">
            {filteredLists?.map((list, index) => (
              <GiftListCard
                key={list.id}
                list={list}
                index={index}
                onViewList={handleViewList}
                onDeleteList={handleDeleteList}
                onManageInvitation={handleManageInvitation}
                onViewInvitation={handleViewInvitation}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

export default MyGiftLists;
