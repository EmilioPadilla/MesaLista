import { useEffect, useState } from 'react';
import { Button } from 'components/core/Button';
import { Card, CardContent, CardHeader, CardTitle } from 'components/core/Card';
import { Label } from 'components/core/Label';
import { Badge } from 'components/core/Badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from 'components/core/Tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from 'components/core/Select';
import { Plus, Trash2, Edit, BarChart3, DollarSign, Package, TrendingUp, Target, Eye, ArrowUpDown, Filter, X } from 'lucide-react';
import { Input, Spin } from 'antd';
import { useComponentMountControl } from 'hooks/useComponentMountControl';
import { WeddingListWithGifts } from 'types/models/weddingList';
import { useGetCategoriesByWeddingList, useUpdateWeddingList, useWeddingListByCouple } from 'src/hooks/useWeddingList';
import { OutletContextPrivateType } from 'routes/Dashboard';
import { useOutletContext } from 'react-router-dom';
import { GiftModal } from 'src/features/manageRegistry/components/GiftModal';
import { EditGiftModal } from 'src/features/manageRegistry/components/EditGiftModal';
import { ImageWithFallback } from 'src/components/core/ImageFallback';
import { GiftCategory, Gift as GiftInterface } from 'types/models/gift';
import { StarFilled } from '@ant-design/icons';

export interface GiftItem extends GiftInterface {
  priority?: 'alta' | 'media' | 'baja';
  purchasedBy?: string;
}

type SortOption = 'name' | 'price-asc' | 'price-desc' | 'priority' | 'category' | 'status';
type FilterOption = 'all' | 'purchased' | 'pending' | 'alta' | 'media' | 'baja';

export const V2ManageRegistry = () => {
  const contextData = useOutletContext<OutletContextPrivateType>();
  // Use props if provided directly, otherwise use context from Outlet
  const { data: weddinglist, isLoading: isWeddingListLoading } = useWeddingListByCouple(contextData?.userData?.id);
  const { data: weddingListCategories } = useGetCategoriesByWeddingList(weddinglist?.id);

  const {
    isOpen: showEditGiftModal,
    setIsOpen: setShowEditGiftModal,
    shouldRender: renderEditGiftModal,
    handleAfterClose: handleAfterCloseEditGiftModal,
  } = useComponentMountControl();

  const [editingGiftId, setEditingGiftId] = useState<number | undefined>();
  const { mutate: updateWeddingList } = useUpdateWeddingList();

  const handleUpdateWeddingList = (data: WeddingListWithGifts) => {
    const { weddingDate, ...rest } = data;
    updateWeddingList({ id: weddinglist?.id!, data: { ...rest, weddingDate: String(weddingDate) } });
  };

  const userData = contextData?.userData;
  const isCouple = contextData?.userData?.role === 'COUPLE';

  const [gifts, setGifts] = useState<GiftItem[]>();

  useEffect(() => {
    if (weddinglist?.gifts) {
      setGifts(weddinglist.gifts);
    }
  }, [weddinglist?.id]);

  const [newGift, setNewGift] = useState({
    title: '',
    description: '',
    price: '',
    category: 'General',
    priority: 'media' as 'alta' | 'media' | 'baja',
    image: '',
  });

  const [imagePreview, setImagePreview] = useState<string>('');
  const [editingGift, setEditingGift] = useState<GiftItem | null>(null);
  const [sortBy, setSortBy] = useState<SortOption>('name');
  const [filterBy, setFilterBy] = useState<FilterOption>('all');

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
    priorityDistribution: {
      alta: gifts.filter((g) => g.priority === 'alta').length,
      media: gifts.filter((g) => g.priority === 'media').length,
      baja: gifts.filter((g) => g.priority === 'baja').length,
    },
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
      case 'priority':
        const priorityOrder = { alta: 3, media: 2, baja: 1 };
        return [...giftsToSort].sort((a, b) => priorityOrder[b.priority!] - priorityOrder[a.priority!]);
      case 'status':
        return [...giftsToSort].sort((a, b) => Number(a.isPurchased) - Number(b.isPurchased));
      default:
        return giftsToSort;
    }
  };

  const filterGifts = (giftsToFilter: GiftItem[]) => {
    switch (filterBy) {
      case 'purchased':
        return giftsToFilter.filter((g) => g.isPurchased);
      case 'pending':
        return giftsToFilter.filter((g) => !g.isPurchased);
      case 'alta':
      case 'media':
      case 'baja':
        return giftsToFilter.filter((g) => g.priority === filterBy);
      default:
        return giftsToFilter;
    }
  };

  const filteredAndSortedGifts = sortGifts(filterGifts(gifts));

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const url = e.target.value;
    setNewGift({ ...newGift, image: url });
    setImagePreview(url);
  };

  const addGift = () => {
    if (!newGift.title || !newGift.price || !gifts) return;

    const gift: GiftItem = {
      id: gifts.length + 1,
      title: newGift.title,
      description: newGift.description,
      price: parseInt(newGift.price),
      quantity: 1,
      order: gifts.length + 1,
      categories: [{ id: 1, name: newGift.category || 'General' } as GiftCategory],
      imageUrl: newGift.image || 'https://images.unsplash.com/photo-1549298916-b41d501d3772?w=300&h=300&fit=crop',
      isPurchased: false,
      priority: newGift.priority,
      isMostWanted: false,
      weddingListId: weddinglist?.id!,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    setGifts([...gifts, gift]);
    setNewGift({ title: '', description: '', price: '', category: 'General', priority: 'media', image: '' });
    setImagePreview('');
  };

  const deleteGift = (id: number) => {
    setGifts(gifts.filter((g) => g.id !== id));
  };

  const updateGift = (updatedGift: GiftItem) => {
    setGifts(gifts.map((g) => (g.id === updatedGift.id ? updatedGift : g)));
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'alta':
        return 'bg-red-100 text-red-800 border-red-200';
      case 'media':
        return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'baja':
        return 'bg-green-100 text-green-800 border-green-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="mb-8">
        <h1 className="text-3xl mb-2 text-primary">Gestionar Mesa de Regalos</h1>
        <p className="text-muted-foreground">Administra tu lista de regalos, ve estadísticas y mantén todo organizado para tu gran día</p>
      </div>

      {/* Enhanced Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <Card className="shadow-md hover:shadow-lg transition-shadow duration-200">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm">Total de Regalos</CardTitle>
            <Package className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl text-primary">{stats.totalItems}</div>
            <p className="text-xs text-muted-foreground mt-1">
              {stats.purchasedItems} comprados, {stats.totalItems - stats.purchasedItems} pendientes
            </p>
          </CardContent>
        </Card>

        <Card className="shadow-md hover:shadow-lg transition-shadow duration-200">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm">Progreso</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl text-green-600">{Math.round((stats.purchasedItems / stats.totalItems) * 100)}%</div>
            <div className="w-full bg-muted rounded-full h-2 mt-2">
              <div
                className="bg-green-600 h-2 rounded-full transition-all duration-300"
                style={{ width: `${(stats.purchasedItems / stats.totalItems) * 100}%` }}></div>
            </div>
          </CardContent>
        </Card>

        <Card className="shadow-md hover:shadow-lg transition-shadow duration-200">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm">Rango de Precios</CardTitle>
            <Target className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-lg text-primary">
              ${stats.minPrice.toLocaleString()} - ${stats.maxPrice.toLocaleString()}
            </div>
            <p className="text-xs text-muted-foreground mt-1">Promedio: ${stats.averagePrice.toLocaleString()}</p>
          </CardContent>
        </Card>

        <Card className="shadow-md hover:shadow-lg transition-shadow duration-200">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm">Valor Total</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl text-primary">${stats.totalValue.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground mt-1">Comprado: ${stats.purchasedValue.toLocaleString()}</p>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="gifts" className="w-full">
        <TabsList className="grid w-full grid-cols-2 shadow-sm">
          <TabsTrigger value="gifts">Lista de Regalos</TabsTrigger>
          <TabsTrigger value="stats">Estadísticas Detalladas</TabsTrigger>
        </TabsList>

        <TabsContent value="gifts" className="space-y-6">
          {/* Add New Gift */}
          <Card className="shadow-lg">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Plus className="h-5 w-5" />
                Agregar Nuevo Regalo
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="title">Nombre del Regalo</Label>
                  <Input
                    id="title"
                    value={newGift.title}
                    onChange={(e) => setNewGift({ ...newGift, title: e.target.value })}
                    placeholder="Ej. Juego de sábanas"
                    className="shadow-sm"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="price">Precio (MXN)</Label>
                  <Input
                    id="price"
                    type="number"
                    value={newGift.price}
                    onChange={(e) => setNewGift({ ...newGift, price: e.target.value })}
                    placeholder="1500"
                    className="shadow-sm"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="category">Categoría</Label>
                  <Select value={newGift.category} onValueChange={(value) => setNewGift({ ...newGift, category: value })}>
                    <SelectTrigger className="shadow-sm">
                      <SelectValue placeholder="Seleccionar categoría" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Hogar">Hogar</SelectItem>
                      <SelectItem value="Cocina">Cocina</SelectItem>
                      <SelectItem value="Baño">Baño</SelectItem>
                      <SelectItem value="Decoración">Decoración</SelectItem>
                      <SelectItem value="Electrónicos">Electrónicos</SelectItem>
                      <SelectItem value="General">General</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="priority">Prioridad</Label>
                  <Select
                    value={newGift.priority}
                    onValueChange={(value: 'alta' | 'media' | 'baja') => setNewGift({ ...newGift, priority: value })}>
                    <SelectTrigger className="shadow-sm">
                      <SelectValue placeholder="Media" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="alta">Alta</SelectItem>
                      <SelectItem value="media">Media</SelectItem>
                      <SelectItem value="baja">Baja</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="description">Descripción</Label>
                <Input.TextArea
                  id="description"
                  value={newGift.description}
                  onChange={(e) => setNewGift({ ...newGift, description: e.target.value })}
                  placeholder="Descripción detallada del regalo..."
                  className="shadow-sm"
                />
              </div>

              {/* Image Upload Section */}
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="image">URL de la Imagen</Label>
                  <div className="flex gap-2">
                    <Input
                      id="image"
                      value={newGift.image}
                      onChange={handleImageChange}
                      placeholder="https://ejemplo.com/imagen.jpg"
                      className="shadow-sm flex-1"
                    />
                    <Button type="button" size="sm" className="px-3 shadow-sm" onClick={() => setImagePreview(newGift.image)}>
                      <Eye className="h-4 w-4" />
                    </Button>
                  </div>
                </div>

                {imagePreview && (
                  <div className="space-y-2">
                    <Label>Vista Previa</Label>
                    <div className="relative w-full h-32 bg-muted rounded-lg overflow-hidden shadow-sm">
                      <ImageWithFallback src={imagePreview} alt="Vista previa" className="w-full h-full object-cover" />
                      <Button
                        type="button"
                        size="sm"
                        className="absolute top-1 right-1 h-6 w-6 p-0 bg-background/80 hover:bg-background"
                        onClick={() => {
                          setImagePreview('');
                          setNewGift({ ...newGift, image: '' });
                        }}>
                        <X className="h-3 w-3" />
                      </Button>
                    </div>
                  </div>
                )}
              </div>

              <Button onClick={addGift} className="w-full shadow-md hover:shadow-lg transition-all duration-200">
                <Plus className="h-4 w-4 mr-2" />
                Agregar Regalo
              </Button>
            </CardContent>
          </Card>

          {/* Sort and Filter Controls */}
          <Card className="shadow-md">
            <CardContent className="pt-6">
              <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
                <div className="flex flex-col sm:flex-row gap-4">
                  <div className="space-y-2 sm:space-y-0">
                    <Label className="text-sm">Ordenar por:</Label>
                    <Select value={sortBy} onValueChange={(value: SortOption) => setSortBy(value)}>
                      <SelectTrigger className="w-[180px] shadow-sm">
                        <ArrowUpDown className="h-4 w-4 mr-2" />
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="name">Nombre A-Z</SelectItem>
                        <SelectItem value="price-asc">Precio (menor)</SelectItem>
                        <SelectItem value="price-desc">Precio (mayor)</SelectItem>
                        <SelectItem value="mostWanted">Más Querido</SelectItem>
                        <SelectItem value="status">Estado</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2 sm:space-y-0">
                    <Label className="text-sm">Filtrar por:</Label>
                    <Select value={filterBy} onValueChange={(value: FilterOption) => setFilterBy(value)}>
                      <SelectTrigger className="w-[180px] shadow-sm">
                        <Filter className="h-4 w-4 mr-2" />
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">Todos</SelectItem>
                        <SelectItem value="purchased">Comprados</SelectItem>
                        <SelectItem value="pending">Pendientes</SelectItem>
                        <SelectItem value="mostWanted">Más Querido</SelectItem>
                        {weddingListCategories?.categories?.map((category: GiftCategory) => (
                          <SelectItem key={category.id} value={category.name}>
                            {category.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="text-sm text-muted-foreground">
                  Mostrando {filteredAndSortedGifts.length} de {gifts.length} regalos
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Gift List */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredAndSortedGifts.map((gift) => (
              <Card
                key={gift.id}
                className={`relative shadow-lg hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1 ${gift.isPurchased ? 'opacity-75' : ''}`}>
                <CardHeader className="p-0">
                  <div className="relative">
                    <ImageWithFallback src={gift.imageUrl} alt={gift.title} className="w-full h-48 object-cover rounded-t-lg" />
                    {gift.isPurchased && (
                      <div className="absolute top-2 right-2">
                        <Badge className="bg-green-500 shadow-md">Comprado</Badge>
                      </div>
                    )}
                    {gift.isMostWanted && (
                      <div className="absolute top-2 left-2">
                        <Badge className="bg-yellow-500 shadow-md">
                          <StarFilled />
                        </Badge>
                      </div>
                    )}
                  </div>
                </CardHeader>

                <CardContent className="p-4">
                  <div className="space-y-2">
                    <div className="flex justify-between items-start">
                      <CardTitle className="text-lg">{gift.title}</CardTitle>
                      {!gift.isPurchased && (
                        <div className="flex gap-1">
                          <Button
                            size="sm"
                            onClick={() => {
                              setEditingGift(gift);
                              setShowEditGiftModal(true);
                            }}
                            className="hover:shadow-md transition-all duration-200">
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="link"
                            size="sm"
                            onClick={() => deleteGift(gift.id)}
                            className="hover:shadow-md transition-all duration-200">
                            <Trash2 className="h-4 w-4 text-destructive" />
                          </Button>
                        </div>
                      )}
                    </div>

                    <p className="text-sm text-muted-foreground line-clamp-2">{gift.description}</p>

                    <div className="flex justify-between items-center">
                      <div>
                        {gift.categories?.map((category) => (
                          <Badge key={category.id} className="shadow-sm">
                            {category.name}
                          </Badge>
                        ))}
                      </div>
                      <span className="text-lg text-primary">${gift.price.toLocaleString()}</span>
                    </div>

                    {gift.purchases && gift.purchases.length > 0 && (
                      <p className="text-sm text-green-600">Comprado por: {gift.purchases[0].user.firstName}</p>
                    )}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="stats">
          <div className="space-y-6">
            {/* Price Range Analysis */}
            <Card className="shadow-lg">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <BarChart3 className="h-5 w-5" />
                  Análisis de Rangos de Precios
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="p-4 bg-gradient-to-br from-green-50 to-green-100 rounded-lg border border-green-200">
                    <div className="text-2xl text-green-700">{stats.priceRanges.low}</div>
                    <div className="text-sm text-green-600">Regalos &lt; $1,000</div>
                    <div className="text-xs text-green-500 mt-1">
                      {Math.round((stats.priceRanges.low / stats.totalItems) * 100)}% del total
                    </div>
                  </div>
                  <div className="p-4 bg-gradient-to-br from-yellow-50 to-yellow-100 rounded-lg border border-yellow-200">
                    <div className="text-2xl text-yellow-700">{stats.priceRanges.medium}</div>
                    <div className="text-sm text-yellow-600">Regalos $1,000 - $5,000</div>
                    <div className="text-xs text-yellow-500 mt-1">
                      {Math.round((stats.priceRanges.medium / stats.totalItems) * 100)}% del total
                    </div>
                  </div>
                  <div className="p-4 bg-gradient-to-br from-red-50 to-red-100 rounded-lg border border-red-200">
                    <div className="text-2xl text-red-700">{stats.priceRanges.high}</div>
                    <div className="text-sm text-red-600">Regalos &gt; $5,000</div>
                    <div className="text-xs text-red-500 mt-1">
                      {Math.round((stats.priceRanges.high / stats.totalItems) * 100)}% del total
                    </div>
                  </div>
                </div>

                <div className="space-y-4">
                  <h4 className="text-lg text-primary">Distribución por Categorías</h4>
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                    {Object.entries(stats.categoryDistribution).map(([category, count]) => (
                      <div key={category} className="p-3 bg-muted/50 rounded-lg">
                        <div className="text-lg text-primary">{count}</div>
                        <div className="text-sm text-muted-foreground">{category}</div>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="space-y-4">
                  <h4 className="text-lg text-primary">Distribución por Prioridad</h4>
                  <div className="grid grid-cols-3 gap-4">
                    <div className="p-3 bg-red-50 rounded-lg border border-red-200">
                      <div className="text-lg text-red-700">{stats.priorityDistribution.alta}</div>
                      <div className="text-sm text-red-600">Alta Prioridad</div>
                    </div>
                    <div className="p-3 bg-yellow-50 rounded-lg border border-yellow-200">
                      <div className="text-lg text-yellow-700">{stats.priorityDistribution.media}</div>
                      <div className="text-sm text-yellow-600">Media Prioridad</div>
                    </div>
                    <div className="p-3 bg-green-50 rounded-lg border border-green-200">
                      <div className="text-lg text-green-700">{stats.priorityDistribution.baja}</div>
                      <div className="text-sm text-green-600">Baja Prioridad</div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* General Progress */}
            <Card className="shadow-lg">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <TrendingUp className="h-5 w-5" />
                  Progreso General
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="space-y-4">
                  <div className="flex justify-between items-center">
                    <span>Progreso de la Mesa</span>
                    <span className="text-primary">{Math.round((stats.purchasedItems / stats.totalItems) * 100)}%</span>
                  </div>
                  <div className="w-full bg-muted rounded-full h-4 shadow-inner">
                    <div
                      className="bg-gradient-to-r from-primary to-primary/80 h-4 rounded-full transition-all duration-500 shadow-sm"
                      style={{ width: `${(stats.purchasedItems / stats.totalItems) * 100}%` }}></div>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4 text-center">
                  <div className="p-4 bg-gradient-to-br from-green-50 to-green-100 rounded-lg shadow-sm">
                    <div className="text-2xl text-green-700">${stats.purchasedValue.toLocaleString()}</div>
                    <div className="text-sm text-green-600">Valor Comprado</div>
                  </div>
                  <div className="p-4 bg-gradient-to-br from-muted/30 to-muted/50 rounded-lg shadow-sm">
                    <div className="text-2xl text-muted-foreground">${(stats.totalValue - stats.purchasedValue).toLocaleString()}</div>
                    <div className="text-sm text-muted-foreground">Valor Pendiente</div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>

      {/* Edit Gift Modal */}
      {renderEditGiftModal && (
        <EditGiftModal
          gift={editingGift}
          isOpen={showEditGiftModal}
          onClose={() => setShowEditGiftModal(false)}
          onSave={updateGift}
          afterClose={handleAfterCloseEditGiftModal}
        />
      )}
    </div>
  );
};
