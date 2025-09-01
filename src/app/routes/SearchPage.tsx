import { useState, useMemo } from 'react';
import { Button } from 'components/core/Button';
import { Input } from 'components/core/Input';
import { Card, CardContent, CardHeader } from 'components/core/Card';
import { Badge } from 'components/core/Badge';
import { Calendar, Search, Users, MapPin, Gift, Eye } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useWeddingLists } from 'src/hooks/useWeddingList';
import { WeddingListBrief } from 'types/models/weddingList';

export function SearchPage() {
  const navigate = useNavigate();
  const { data: registries } = useWeddingLists() as { data: WeddingListBrief[] | undefined };
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedDate, setSelectedDate] = useState('');

  // Filter and search logic using useMemo for efficiency
  const filteredRegistries = useMemo(() => {
    if (!registries) return [];

    let filtered = [...registries];

    // Apply search term filter
    if (searchTerm.trim()) {
      const searchLower = searchTerm.toLowerCase().trim();
      filtered = filtered.filter(
        (registry) => registry.coupleName.toLowerCase().includes(searchLower) || registry.coupleSlug.toLowerCase().includes(searchLower),
      );
    }

    // Apply date filter
    if (selectedDate) {
      filtered = filtered.filter((registry) => {
        const registryDate = new Date(registry.weddingDate);
        const searchDate = new Date(selectedDate);
        const diffTime = Math.abs(registryDate.getTime() - searchDate.getTime());
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
        return diffDays <= 30; // Within 30 days
      });
    }

    return filtered;
  }, [registries, searchTerm, selectedDate]);

  const clearFilters = () => {
    setSearchTerm('');
    setSelectedDate('');
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('es-MX', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  const getProgressPercentage = (purchased: number, total: number) => {
    return Math.round((purchased / total) * 100);
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Hero Section */}
      <div className="bg-gradient-to-br from-primary/5 via-secondary/30 to-accent/20 border-b border-border">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <div className="text-center space-y-6">
            <div className="flex justify-center">
              <div className="p-4 rounded-full bg-primary/10 shadow-lg">
                <Search className="h-12 w-12 text-primary" />
              </div>
            </div>
            <div className="space-y-2">
              <h1 className="text-4xl text-foreground">Buscar Mesa de Regalos</h1>
              <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
                Encuentra la mesa de regalos de tus seres queridos por nombre de pareja o fecha de boda
              </p>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Search Filters */}
        <Card className="mb-8 shadow-lg border-0 bg-card/80 backdrop-blur-sm">
          <CardHeader>
            <h2 className="text-foreground flex items-center space-x-2">
              <Search className="h-5 w-5 text-primary" />
              <span>Filtros de Búsqueda</span>
            </h2>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
              <div className="space-y-2">
                <label className="text-foreground">Nombres de la pareja o código</label>
                <Input
                  placeholder="Sol & Emilio, sol-y-emilio..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="bg-input-background border-border shadow-sm"
                />
              </div>
              <div className="space-y-2">
                <label className="text-foreground">Fecha de boda (aprox.)</label>
                <div className="relative">
                  <Input
                    type="date"
                    value={selectedDate}
                    onChange={(e) => setSelectedDate(e.target.value)}
                    className="bg-input-background border-border shadow-sm"
                  />
                  <Calendar className="absolute right-3 top-3 h-4 w-4 text-muted-foreground pointer-events-none" />
                </div>
              </div>
              <div className="flex items-end space-x-2">
                <Button variant="outline" onClick={clearFilters} className="shadow-sm hover:shadow-md transition-all duration-200">
                  Limpiar
                </Button>
              </div>
            </div>

            <div className="text-sm text-muted-foreground">
              Se encontraron <span className="text-primary">{filteredRegistries?.length || 0}</span> mesa(s) de regalos
            </div>
          </CardContent>
        </Card>

        {/* Results Grid */}
        {!filteredRegistries || filteredRegistries.length === 0 ? (
          <Card className="text-center py-12 shadow-lg border-0 bg-card/80">
            <CardContent>
              <div className="space-y-4">
                <div className="p-4 rounded-full bg-muted/50 w-16 h-16 mx-auto flex items-center justify-center">
                  <Search className="h-8 w-8 text-muted-foreground" />
                </div>
                <div className="space-y-2">
                  <h3 className="text-foreground">No se encontraron resultados</h3>
                  <p className="text-muted-foreground">Intenta con diferentes términos de búsqueda o ajusta los filtros</p>
                </div>
                <Button variant="outline" onClick={clearFilters}>
                  Ver todas las mesas de regalos
                </Button>
              </div>
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredRegistries?.map((registry) => (
              <Card
                key={registry.id}
                className="group cursor-pointer shadow-lg hover:shadow-xl transition-all duration-300 border-0 bg-card/80 backdrop-blur-sm overflow-hidden">
                <div className="relative">
                  <img
                    src={registry.imageUrl}
                    alt={`Boda de ${registry.coupleName}`}
                    className="w-full h-48 object-cover group-hover:scale-105 transition-transform duration-300"
                  />
                  <div className="absolute top-4 right-4">
                    <Badge variant="secondary" className="bg-card/90 text-card-foreground shadow-md">
                      {registry.coupleSlug}
                    </Badge>
                  </div>
                  <div className="absolute bottom-4 left-4 right-4">
                    <div className="bg-card/95 backdrop-blur-sm rounded-lg p-3 shadow-lg">
                      <h3 className="text-card-foreground mb-1">{registry.coupleName}</h3>
                      <div className="flex items-center text-sm text-muted-foreground">
                        <Calendar className="h-3 w-3 mr-1" />
                        {formatDate(registry.weddingDate.toString())}
                      </div>
                    </div>
                  </div>
                </div>

                <CardContent className="p-6">
                  <div className="space-y-4">
                    <div className="space-y-2">
                      <div className="flex items-center space-x-2 text-sm text-muted-foreground">
                        <Users className="h-4 w-4" />
                        <span>{registry.coupleName}</span>
                      </div>
                      {registry.weddingLocation && (
                        <div className="flex items-center space-x-2 text-sm text-muted-foreground">
                          <MapPin className="h-4 w-4" />
                          <span>{registry.weddingLocation}</span>
                        </div>
                      )}
                      {registry.weddingVenue && (
                        <div className="flex items-center space-x-2 text-sm text-muted-foreground">
                          <span className="text-xs">📍 {registry.weddingVenue}</span>
                        </div>
                      )}
                    </div>

                    {registry.description && (
                      <p className="text-sm text-muted-foreground line-clamp-2 whitespace-pre-line">{registry.description}</p>
                    )}

                    <div className="space-y-2">
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-muted-foreground">Progreso de regalos</span>
                        <span className="text-primary">{getProgressPercentage(registry.purchasedGifts, registry.totalGifts)}%</span>
                      </div>
                      <div className="w-full bg-secondary rounded-full h-2">
                        <div
                          className="bg-primary h-2 rounded-full transition-all duration-300"
                          style={{ width: `${getProgressPercentage(registry.purchasedGifts, registry.totalGifts)}%` }}
                        />
                      </div>
                      <div className="flex items-center justify-between text-xs text-muted-foreground">
                        <span>{registry.purchasedGifts} comprados</span>
                        <span>{registry.totalGifts} total</span>
                      </div>
                    </div>

                    <div className="flex space-x-2 pt-2">
                      <Button
                        className="flex-1 shadow-md hover:shadow-lg transition-all duration-200"
                        onClick={() => navigate(`/${registry.coupleSlug}/regalos`)}>
                        <Gift className="h-4 w-4 mr-2" />
                        Ver Regalos
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
