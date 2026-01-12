import { useState } from 'react';
import { Button, Card, Badge, Input, Tabs, Typography } from 'antd';
import { ArrowLeft, Heart, PartyPopper, Baby, Sparkles } from 'lucide-react';
import type { InvitationTemplate } from 'src/app/routes/couple/Invitations';

const { Search } = Input;
const { Title, Text } = Typography;
const { TabPane } = Tabs;

interface InvitationTemplateSelectorProps {
  onSelectTemplate: (template: InvitationTemplate) => void;
  onBack: () => void;
}

// Template definitions
const templates: InvitationTemplate[] = [
  {
    id: 'elegant-wedding',
    name: 'Boda Elegante',
    description: 'Diseño clásico y sofisticado perfecto para bodas formales',
    thumbnail: 'wedding-elegant',
    category: 'wedding',
    previewComponent: 'ElegantWeddingPreview',
    fields: [
      { key: 'title', label: 'Nombres de los Novios', type: 'text', placeholder: 'Ana & Carlos', defaultValue: '' },
      {
        key: 'subtitle',
        label: 'Subtítulo',
        type: 'text',
        placeholder: 'Te invitamos a celebrar nuestra boda',
        defaultValue: 'Te invitamos a celebrar nuestra boda',
      },
      { key: 'date', label: 'Fecha del Evento', type: 'date', placeholder: '', defaultValue: '' },
      { key: 'time', label: 'Hora', type: 'time', placeholder: '18:00', defaultValue: '18:00' },
      { key: 'location', label: 'Ubicación', type: 'location', placeholder: 'Hacienda San Miguel, Guadalajara', defaultValue: '' },
      {
        key: 'message',
        label: 'Mensaje Personal',
        type: 'textarea',
        placeholder: 'Será un honor contar con tu presencia...',
        defaultValue: '',
      },
    ],
  },
  {
    id: 'modern-birthday',
    name: 'Cumpleaños Moderno',
    description: 'Diseño vibrante y divertido para celebraciones de cumpleaños',
    thumbnail: 'birthday-modern',
    category: 'birthday',
    previewComponent: 'ModernBirthdayPreview',
    fields: [
      { key: 'title', label: 'Título', type: 'text', placeholder: '¡Fiesta de Cumpleaños!', defaultValue: '' },
      { key: 'name', label: 'Nombre del Festejado', type: 'text', placeholder: 'María', defaultValue: '' },
      { key: 'age', label: 'Edad', type: 'text', placeholder: '30', defaultValue: '' },
      { key: 'date', label: 'Fecha', type: 'date', placeholder: '', defaultValue: '' },
      { key: 'time', label: 'Hora', type: 'time', placeholder: '19:00', defaultValue: '19:00' },
      { key: 'location', label: 'Ubicación', type: 'location', placeholder: 'Salón de Fiestas', defaultValue: '' },
      { key: 'message', label: 'Mensaje', type: 'textarea', placeholder: 'Ven a celebrar conmigo...', defaultValue: '' },
    ],
  },
  {
    id: 'baby-shower',
    name: 'Baby Shower',
    description: 'Diseño tierno y dulce para celebrar la llegada del bebé',
    thumbnail: 'baby-shower',
    category: 'baby-shower',
    previewComponent: 'BabyShowerPreview',
    fields: [
      { key: 'title', label: 'Título', type: 'text', placeholder: 'Baby Shower', defaultValue: '' },
      { key: 'parentNames', label: 'Nombres de los Padres', type: 'text', placeholder: 'Ana y Carlos', defaultValue: '' },
      { key: 'babyName', label: 'Nombre del Bebé', type: 'text', placeholder: 'Sofía', defaultValue: '' },
      { key: 'date', label: 'Fecha', type: 'date', placeholder: '', defaultValue: '' },
      { key: 'time', label: 'Hora', type: 'time', placeholder: '16:00', defaultValue: '16:00' },
      { key: 'location', label: 'Ubicación', type: 'location', placeholder: 'Casa de la Abuela', defaultValue: '' },
      { key: 'message', label: 'Mensaje', type: 'textarea', placeholder: 'Acompáñanos a celebrar...', defaultValue: '' },
    ],
  },
];

const getCategoryIcon = (category: string) => {
  switch (category) {
    case 'wedding':
      return Heart;
    case 'birthday':
      return PartyPopper;
    case 'baby':
      return Baby;
    default:
      return Sparkles;
  }
};

const getCategoryLabel = (category: string) => {
  switch (category) {
    case 'wedding':
      return 'Bodas';
    case 'birthday':
      return 'Cumpleaños';
    case 'baby':
      return 'Baby Shower';
    default:
      return 'Otros';
  }
};

export function InvitationTemplateSelector({ onSelectTemplate, onBack }: InvitationTemplateSelectorProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');

  const categories = ['all', ...Array.from(new Set(templates.map((t) => t.category)))];

  const filteredTemplates = templates.filter((template) => {
    const matchesSearch =
      template.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      template.description.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = selectedCategory === 'all' || template.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  return (
    <div className="min-h-screen bg-[#f5f5f7]">
      {/* Header */}
      <div className="bg-white border-b border-border/30 sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center gap-4">
            <Button onClick={onBack} type="text" className="rounded-full hover:bg-[#f5f5f7]" icon={<ArrowLeft className="h-5 w-5" />} />
            <div>
              <Title level={2} className="text-xl font-light mb-0">
                Selecciona una Plantilla
              </Title>
              <Text className="text-sm text-muted-foreground font-light">Elige el diseño perfecto para tu evento</Text>
            </div>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* Search */}
        <div className="mb-8">
          <Search
            placeholder="Buscar plantillas..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="bg-white border-0 rounded-xl shadow-sm"
            size="large"
            allowClear
          />
        </div>

        {/* Category Tabs */}
        <Tabs activeKey={selectedCategory} onChange={setSelectedCategory} className="mb-8">
          <TabPane tab="Todas" key="all" />
          {categories
            .filter((cat) => cat !== 'all')
            .map((category) => (
              <TabPane tab={getCategoryLabel(category)} key={category} />
            ))}
        </Tabs>

        {/* Templates Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {filteredTemplates.map((template) => {
            const IconComponent = getCategoryIcon(template.category);

            return (
              <Card
                key={template.id}
                className="border-0 shadow-md hover:shadow-xl transition-all duration-300 rounded-2xl overflow-hidden group cursor-pointer"
                onClick={() => onSelectTemplate(template)}>
                {/* Thumbnail */}
                <div className="relative h-64 bg-gradient-to-br from-[#faf0f0] to-[#f5f5f7] flex items-center justify-center overflow-hidden">
                  <IconComponent className="h-24 w-24 text-[#007aff] opacity-30 group-hover:opacity-50 transition-opacity" />
                  <div className="absolute top-4 right-4">
                    <Badge color="blue" text={getCategoryLabel(template.category)} />
                  </div>
                </div>

                {/* Content */}
                <div className="p-6">
                  <Title level={4} className="text-lg font-medium text-foreground mb-2">
                    {template.name}
                  </Title>
                  <Text className="text-sm text-muted-foreground font-light block mb-4">{template.description}</Text>

                  <Button
                    type="primary"
                    className="w-full bg-[#007aff] hover:bg-[#0051d0] rounded-full font-light"
                    onClick={(e) => {
                      e.stopPropagation();
                      onSelectTemplate(template);
                    }}>
                    Usar esta Plantilla
                  </Button>
                </div>
              </Card>
            );
          })}
        </div>

        {filteredTemplates.length === 0 && (
          <div className="text-center py-16">
            <Sparkles className="h-24 w-24 text-muted-foreground mx-auto mb-6" />
            <Title level={3} className="text-2xl font-light text-foreground mb-3">
              No se encontraron plantillas
            </Title>
            <Text className="text-muted-foreground font-light">Intenta con otro término de búsqueda o categoría</Text>
          </div>
        )}
      </div>
    </div>
  );
}
