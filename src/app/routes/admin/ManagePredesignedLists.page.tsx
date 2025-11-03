import { useState, useEffect } from 'react';
import { Plus, Eye, Shield } from 'lucide-react';
import { message, Button, Card, Spin } from 'antd';
import { DraggableList } from 'components/core/DraggableList';
import {
  PredesignedRegistryModal,
  PredesignedGiftModal,
  PredesignedRegistryCard,
  SortablePredesignedGiftItem,
} from 'src/features/admin/PredesignedLists/components';
import { useCurrentUser } from 'hooks/useUser';
import { useNavigate } from 'react-router-dom';
import {
  usePredesignedListsAdmin,
  useCreatePredesignedList,
  useUpdatePredesignedList,
  useDeletePredesignedList,
  useReorderPredesignedLists,
  useCreatePredesignedGift,
  useUpdatePredesignedGift,
  useDeletePredesignedGift,
  useReorderPredesignedGifts,
} from 'hooks/usePredesignedList';
import { PredesignedList, PredesignedGift } from 'services/predesignedList.service';

// Using types from service
type Registry = PredesignedList;
type GiftItem = PredesignedGift;

export function AdminPreDesignedLists() {
  const navigate = useNavigate();
  const { data: user, isLoading: isUserLoading } = useCurrentUser();

  // Fetch predesigned lists
  const { data: lists, isLoading: isListsLoading } = usePredesignedListsAdmin();

  // Mutations for lists
  const { mutate: createList } = useCreatePredesignedList();
  const { mutate: updateList } = useUpdatePredesignedList();
  const { mutate: deleteList } = useDeletePredesignedList();
  const { mutate: reorderLists } = useReorderPredesignedLists();

  // Mutations for gifts
  const { mutate: createGift } = useCreatePredesignedGift();
  const { mutate: updateGift } = useUpdatePredesignedGift();
  const { mutate: deleteGift } = useDeletePredesignedGift();
  const { mutate: reorderGifts } = useReorderPredesignedGifts();

  const [selectedRegistry, setSelectedRegistry] = useState<Registry | null>(null);
  const [registryModalOpen, setRegistryModalOpen] = useState(false);
  const [registryModalMode, setRegistryModalMode] = useState<'create' | 'edit'>('create');
  const [giftModalOpen, setGiftModalOpen] = useState(false);
  const [giftModalMode, setGiftModalMode] = useState<'create' | 'edit'>('create');
  const [editingGift, setEditingGift] = useState<GiftItem | null>(null);

  // Update selected registry when lists change
  useEffect(() => {
    if (selectedRegistry && lists) {
      const updated = lists.find((l) => l.id === selectedRegistry.id);
      if (updated) {
        setSelectedRegistry(updated);
      }
    }
  }, [lists]);

  // Show loading state while checking authentication or loading lists
  if (isUserLoading || isListsLoading) {
    return (
      <div className="min-h-screen bg-[#fbfbfd] flex items-center justify-center">
        <Spin size="large" />
      </div>
    );
  }

  // Check if user is admin
  if (!user || user.role !== 'ADMIN') {
    return (
      <div className="min-h-screen bg-[#fbfbfd] flex items-center justify-center">
        <Card className="max-w-md mx-4">
          <div>
            <div className="flex items-center gap-2">
              <Shield className="h-5 w-5 text-red-500" />
              Acceso Denegado
            </div>
            <div>Solo los administradores pueden acceder a esta página.</div>
          </div>
          <div>
            <Button onClick={() => navigate('/')} className="w-full">
              Volver al Inicio
            </Button>
          </div>
        </Card>
      </div>
    );
  }

  const registries = lists || [];

  const handleDeleteRegistry = (registryId: number) => {
    deleteList(registryId, {
      onSuccess: () => {
        if (selectedRegistry?.id === registryId) {
          setSelectedRegistry(null);
        }
        message.success('Lista eliminada exitosamente');
      },
      onError: (error: any) => {
        message.error('Error al eliminar la lista');
        console.error(error);
      },
    });
  };

  const moveRegistry = (index: number, direction: 'up' | 'down') => {
    const newIndex = direction === 'up' ? index - 1 : index + 1;
    if (newIndex < 0 || newIndex >= registries.length) return;

    const reordered = [...registries];
    const [moved] = reordered.splice(index, 1);
    reordered.splice(newIndex, 0, moved);

    const orders = reordered.map((reg, idx) => ({ id: reg.id, order: idx }));
    reorderLists(orders, {
      onError: (error: any) => {
        message.error('Error al reordenar las listas');
        console.error(error);
      },
    });
  };

  const handleDeleteGift = (giftId: number) => {
    deleteGift(giftId, {
      onSuccess: () => {
        message.success('Regalo eliminado exitosamente');
      },
      onError: (error: any) => {
        message.error('Error al eliminar el regalo');
        console.error(error);
      },
    });
  };

  const handleReorderGifts = (reorderedGifts: PredesignedGift[]) => {
    if (!selectedRegistry) return;

    // Update local state with new order
    const updatedRegistry: PredesignedList = {
      ...selectedRegistry,
      id: selectedRegistry.id,
      gifts: reorderedGifts.map((gift, idx) => ({
        ...gift,
        order: idx,
      })),
    };
    setSelectedRegistry(updatedRegistry);

    // Persist to backend
    const giftOrders = updatedRegistry.gifts.map((gift) => ({
      id: gift.id,
      order: gift.order,
    }));

    reorderGifts(giftOrders, {
      onError: (error: any) => {
        message.error('Error al actualizar el orden');
        console.error(error);
      },
      onSuccess: () => {
        message.success('Orden actualizado');
      },
    });
  };

  return (
    <div className="min-h-screen bg-[#fbfbfd]">
      {/* Header */}
      <div className="bg-white border-b border-border/30">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-4xl mb-2 text-primary">Administrar Listas Prediseñadas</h1>
              <p className="text-lg text-muted-foreground">Gestiona las colecciones de regalos para diferentes estilos de vida</p>
            </div>
            <Button onClick={() => navigate('/listas')} variant="outlined" className="!border-primary !text-primary rounded-full">
              <Eye className="h-4 w-4 mr-2" />
              Vista Pública
            </Button>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid lg:grid-cols-3 gap-8">
          {/* Left Panel - Registries List */}
          <div className="lg:col-span-1">
            <Card className="bg-white shadow-lg sticky">
              <div>
                <div className="flex items-center justify-between">
                  <div>Listas Prediseñadas</div>
                  <Button
                    size="small"
                    className="rounded-full !border-primary !text-primary"
                    onClick={() => {
                      setRegistryModalMode('create');
                      setRegistryModalOpen(true);
                    }}>
                    <Plus className="h-4 w-4" />
                  </Button>
                </div>
                <div>
                  {registries.length} {registries.length === 1 ? 'lista' : 'listas'}
                </div>
              </div>
              <div className="space-y-2 max-h-[calc(100vh-300px)] overflow-y-auto">
                {registries.map((registry, index) => (
                  <PredesignedRegistryCard
                    key={registry.id}
                    registry={registry}
                    isSelected={selectedRegistry?.id === registry.id}
                    index={index}
                    totalRegistries={registries.length}
                    onSelect={setSelectedRegistry}
                    onEdit={(reg) => {
                      setSelectedRegistry(reg);
                      setRegistryModalMode('edit');
                      setRegistryModalOpen(true);
                    }}
                    onDelete={handleDeleteRegistry}
                    onMoveUp={(idx) => moveRegistry(idx, 'up')}
                    onMoveDown={(idx) => moveRegistry(idx, 'down')}
                  />
                ))}
              </div>
            </Card>
          </div>

          {/* Right Panel - Registry Details & Gifts */}
          <div className="lg:col-span-2">
            {selectedRegistry ? (
              <div className="space-y-6">
                {/* Registry Header */}
                <Card className="bg-white shadow-lg">
                  <div className="p-0">
                    <div className="relative h-48 rounded-t-xl overflow-hidden">
                      <img src={selectedRegistry.imageUrl} alt={selectedRegistry.name} className="w-full h-full object-cover" />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/70 to-transparent"></div>
                      <div className="absolute bottom-4 left-4 text-white">
                        <h2 className="text-2xl mb-1">{selectedRegistry.name}</h2>
                        <p className="text-sm opacity-90">{selectedRegistry.description}</p>
                      </div>
                    </div>
                  </div>
                </Card>

                {/* Gifts Section */}
                <Card className="bg-white shadow-lg !mt-4">
                  <div className="flex items-center justify-between mb-4">
                    <div>
                      <div className="text-lg font-semibold">
                        {selectedRegistry.gifts.length} {selectedRegistry.gifts.length === 1 ? 'regalo' : 'regalos'}
                      </div>
                    </div>
                    <Button
                      className="rounded-full !border-primary !text-primary"
                      onClick={() => {
                        setGiftModalMode('create');
                        setGiftModalOpen(true);
                      }}>
                      <Plus className="h-4 w-4 mr-2" />
                      Agregar Regalo
                    </Button>
                  </div>
                  {selectedRegistry.gifts.length === 0 ? (
                    <div className="text-center py-12 text-muted-foreground">
                      <p className="mb-4">No hay regalos en esta lista</p>
                      <Button
                        onClick={() => {
                          setGiftModalMode('create');
                          setGiftModalOpen(true);
                        }}
                        variant="outlined">
                        <Plus className="h-4 w-4 mr-2" />
                        Agregar Primer Regalo
                      </Button>
                    </div>
                  ) : (
                    <DraggableList
                      items={selectedRegistry.gifts}
                      getItemId={(gift) => gift.id}
                      onReorder={handleReorderGifts}
                      renderContainer={(children) => <div className="space-y-2">{children}</div>}
                      renderItem={(gift) => (
                        <SortablePredesignedGiftItem
                          key={gift.id}
                          gift={gift}
                          onEdit={(g) => {
                            setEditingGift(g);
                            setGiftModalMode('edit');
                            setGiftModalOpen(true);
                          }}
                          onDelete={handleDeleteGift}
                        />
                      )}
                    />
                  )}
                </Card>
              </div>
            ) : (
              <Card className="bg-white shadow-lg">
                <div className="flex items-center justify-center py-20">
                  <div className="text-center text-muted-foreground">
                    <p className="text-lg mb-2">Selecciona una lista para ver sus regalos</p>
                    <p className="text-sm">o crea una nueva lista para comenzar</p>
                  </div>
                </div>
              </Card>
            )}
          </div>
        </div>
      </div>

      {/* Modal Components */}
      <PredesignedRegistryModal
        isOpen={registryModalOpen}
        onOpenChange={setRegistryModalOpen}
        mode={registryModalMode}
        registry={registryModalMode === 'edit' ? selectedRegistry : null}
      />

      <PredesignedGiftModal
        isOpen={giftModalOpen}
        onOpenChange={setGiftModalOpen}
        mode={giftModalMode}
        gift={giftModalMode === 'edit' ? editingGift : null}
        listId={selectedRegistry?.id}
      />
    </div>
  );
}
