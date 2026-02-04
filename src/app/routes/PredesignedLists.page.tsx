import { useState, useEffect } from 'react';
import { Button, message, Tabs, Modal, Spin } from 'antd';
import { Heart, Plane, Home, Palette, Sparkles, MapPin } from 'lucide-react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useIsAuthenticated, useCurrentUser } from 'hooks/useUser';
import { usePredesignedLists, useAddPredesignedGiftToWeddingList } from 'hooks/usePredesignedList';
import { useGiftListsByUser } from 'hooks/useGiftList';
import { PredesignedGift } from 'src/services/predesignedList.service';
import { PredesignedListTabLabel } from 'src/features/predesignedLists/PredesignedListTabLabel';
import { PredesignedListTabContent } from 'src/features/predesignedLists/PredesignedListTabContent';
import { PageSEO } from 'src/components/seo';

// Icon mapping from string to component
const iconMap: Record<string, any> = {
  MapPin,
  Plane,
  Sparkles,
  Heart,
  Palette,
  Home,
};

export function PredesignedListsPage() {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const { data: isAuthenticated = false } = useIsAuthenticated();
  const { data: registries, isLoading } = usePredesignedLists();
  const { data: currentUser } = useCurrentUser();
  const { data: giftLists } = useGiftListsByUser(currentUser?.id);
  const { mutate: addGiftToWeddingList, isPending: isAddingGift } = useAddPredesignedGiftToWeddingList();
  const giftList = giftLists?.[0];
  const [showAuthModal, setShowAuthModal] = useState(false);

  // Get the list ID from query params
  const listIdParam = searchParams.get('list');
  const defaultActiveKey = listIdParam || registries?.[0]?.id.toString();

  // Scroll to top when component loads
  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  const handleAddGift = (gift: PredesignedGift) => {
    if (!isAuthenticated) {
      setShowAuthModal(true);
      return;
    }

    if (!giftList?.id) {
      message.error('No se encontró tu mesa de regalos');
      return;
    }

    addGiftToWeddingList(
      { giftId: gift.id, weddingListId: giftList.id },
      {
        onSuccess: () => {
          message.success(`"${gift.title}" agregado a tu mesa de regalos`);
        },
        onError: (error: any) => {
          const errorMessage = error.response?.data?.message || 'Error al agregar el regalo';
          message.error(errorMessage);
        },
      },
    );
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-[#fbfbfd] flex items-center justify-center">
        <Spin size="large" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#fbfbfd]">
      <PageSEO
        title="Colecciones de Regalos - Listas Prediseñadas"
        description="Descubre nuestras colecciones cuidadosamente seleccionadas para diferentes estilos de vida. Agrega los regalos que más te gusten a tu mesa personal."
        keywords="colecciones regalos, listas prediseñadas, ideas regalos boda, regalos luna de miel, regalos hogar, México"
        breadcrumbs={[
          { name: 'Inicio', url: 'https://www.mesalista.com.mx' },
          { name: 'Colecciones', url: 'https://www.mesalista.com.mx/colecciones' },
        ]}
      />
      {/* Hero Section */}
      <div className="bg-white border-b border-border/30">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20 text-center">
          <h1 className="text-5xl mb-6 text-primary">Listas Prediseñadas</h1>
          <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
            Descubre nuestras colecciones cuidadosamente seleccionadas para diferentes estilos de vida. Agrega los regalos que más te gusten
            a tu mesa personal.
          </p>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <Tabs
          activeKey={defaultActiveKey}
          onChange={(key) => setSearchParams({ list: key })}
          className="w-full"
          items={registries?.map((registry) => {
            const Icon = iconMap[registry.icon] || Heart;
            return {
              key: registry.id.toString(),
              label: <PredesignedListTabLabel icon={<Icon className="h-4 w-4" />} name={registry.name} />,
              children: <PredesignedListTabContent registry={registry} addedGifts={new Set()} onAddGift={handleAddGift} />,
            };
          })}
        />
      </div>

      {/* Call to Action */}
      {isAuthenticated && (
        <div className="bg-white border-t border-border/30">
          <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-20 text-center">
            <h2 className="text-3xl mb-4 text-primary">¿Listo para gestionar tu lista?</h2>
            <p className="text-lg text-muted-foreground mb-8 max-w-2xl mx-auto">
              Los regalos que agregues aparecerán en tu mesa de regalos personal. Puedes editarlos o eliminarlos en cualquier momento.
            </p>
            <Button
              onClick={() => navigate('gestionar')}
              className="bg-[#007aff] hover:bg-[#0051d0] text-white px-8 py-6 rounded-full text-lg">
              Ir a Mi Mesa de Regalos
            </Button>
          </div>
        </div>
      )}
      <Modal
        open={showAuthModal}
        onCancel={() => setShowAuthModal(false)}
        footer={[
          <Button key="login" type="primary" onClick={() => navigate('/login')}>
            Iniciar Sesión
          </Button>,
          <Button key="signup" className="!border-primary !text-primary" onClick={() => navigate('/registro')}>
            Crear Cuenta
          </Button>,
        ]}
        title="Inicia sesión para agregar regalos">
        <p>Para agregar regalos a tu lista, necesitas tener una cuenta de pareja.</p>
      </Modal>
    </div>
  );
}
