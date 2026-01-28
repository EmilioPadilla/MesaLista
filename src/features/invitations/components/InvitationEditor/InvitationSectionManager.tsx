import { useState } from 'react';
import { Card, Switch } from 'antd';
import { MLButton } from 'core/MLButton';
import { GripVertical, Eye, EyeOff, ChevronUp, ChevronDown, Palette, Check } from 'lucide-react';
import { motion } from 'motion/react';

export interface InvitationSection {
  id: string;
  name: string;
  icon: string;
  enabled: boolean;
  order: number;
  description: string;
}

export interface ColorPalette {
  id: string;
  name: string;
  primary: string;
  secondary: string;
  accent: string;
  background: string;
  text: string;
  textLight: string;
}

interface InvitationSectionManagerProps {
  sections: InvitationSection[];
  selectedPalette: ColorPalette;
  onSectionsChange: (sections: InvitationSection[]) => void;
  onPaletteChange: (palette: ColorPalette) => void;
}

const availablePalettes: ColorPalette[] = [
  {
    id: 'romantic-blush',
    name: 'Romantic Blush',
    primary: '#d4704a',
    secondary: '#f5e6e0',
    accent: '#a85a3f',
    background: '#faf8f6',
    text: '#2c1810',
    textLight: '#8b7355',
  },
  {
    id: 'elegant-gold',
    name: 'Elegant Gold',
    primary: '#c9a961',
    secondary: '#f4ede1',
    accent: '#9d7d3a',
    background: '#fdfbf7',
    text: '#3a2f1f',
    textLight: '#8b7e6a',
  },
  {
    id: 'navy-rose',
    name: 'Navy & Rose',
    primary: '#2c4251',
    secondary: '#e8b4b8',
    accent: '#9c4d53',
    background: '#f9f7f8',
    text: '#1a1a1a',
    textLight: '#6b7c8c',
  },
  {
    id: 'sage-green',
    name: 'Sage Green',
    primary: '#9caf88',
    secondary: '#e8ece5',
    accent: '#6b7c5e',
    background: '#f7f9f5',
    text: '#2d3319',
    textLight: '#7a8c6f',
  },
  {
    id: 'dusty-blue',
    name: 'Dusty Blue',
    primary: '#7791a8',
    secondary: '#e3eaf0',
    accent: '#4a6379',
    background: '#f6f9fc',
    text: '#1c2833',
    textLight: '#5d7186',
  },
  {
    id: 'burgundy-cream',
    name: 'Burgundy & Cream',
    primary: '#7d2e3b',
    secondary: '#f5ece8',
    accent: '#52141f',
    background: '#faf7f5',
    text: '#2a0f14',
    textLight: '#8f5d68',
  },
  {
    id: 'lavender-dreams',
    name: 'Lavender Dreams',
    primary: '#9b8fb9',
    secondary: '#ebe8f2',
    accent: '#6d5f8d',
    background: '#f8f7fb',
    text: '#2d2438',
    textLight: '#7a6f94',
  },
  {
    id: 'terracotta-sunset',
    name: 'Terracotta Sunset',
    primary: '#c17457',
    secondary: '#f2e6e0',
    accent: '#8d4e37',
    background: '#faf6f3',
    text: '#3d2417',
    textLight: '#9d7861',
  },
];

export function InvitationSectionManager({ sections, selectedPalette, onSectionsChange, onPaletteChange }: InvitationSectionManagerProps) {
  const [showPalettes, setShowPalettes] = useState(false);

  const toggleSection = (id: string) => {
    const updated = sections.map((section) => (section.id === id ? { ...section, enabled: !section.enabled } : section));
    onSectionsChange(updated);
  };

  const moveSection = (id: string, direction: 'up' | 'down') => {
    const currentIndex = sections.findIndex((s) => s.id === id);
    if ((direction === 'up' && currentIndex === 0) || (direction === 'down' && currentIndex === sections.length - 1)) {
      return;
    }

    const newSections = [...sections];
    const newIndex = direction === 'up' ? currentIndex - 1 : currentIndex + 1;

    [newSections[currentIndex], newSections[newIndex]] = [newSections[newIndex], newSections[currentIndex]];

    // Update order numbers
    const reordered = newSections.map((section, index) => ({
      ...section,
      order: index,
    }));

    onSectionsChange(reordered);
  };

  return (
    <div className="space-y-6">
      {/* Color Palette Selector */}
      <Card styles={{ body: { padding: '0px' } }} className="border-0 shadow-md rounded-2xl overflow-hidden">
        <div className="p-6">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-linear-to-br from-purple-500 to-pink-500 rounded-full flex items-center justify-center">
                <Palette className="h-5 w-5 text-white" />
              </div>
              <div>
                <h3 className="font-medium text-foreground">Paleta de Colores</h3>
                <p className="text-sm text-muted-foreground font-light">{selectedPalette.name}</p>
              </div>
            </div>
            <MLButton onClick={() => setShowPalettes(!showPalettes)} buttonType="outline" className="rounded-full!">
              Cambiar
            </MLButton>
          </div>

          {/* Current Palette Preview */}
          <div className="flex gap-2 mb-4">
            <div className="flex-1 h-12 rounded-lg shadow-sm" style={{ backgroundColor: selectedPalette.primary }} title="Primary" />
            <div className="flex-1 h-12 rounded-lg shadow-sm" style={{ backgroundColor: selectedPalette.secondary }} title="Secondary" />
            <div className="flex-1 h-12 rounded-lg shadow-sm" style={{ backgroundColor: selectedPalette.accent }} title="Accent" />
          </div>

          {/* Palette Options */}
          {showPalettes && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="space-y-3 pt-4 border-t border-border">
              {availablePalettes.map((palette) => (
                <div
                  key={palette.id}
                  className={`p-4 rounded-xl border-2 cursor-pointer transition-all ${
                    selectedPalette.id === palette.id ? 'border-[#007aff] bg-[#007aff]/5' : 'border-border hover:border-[#007aff]/50'
                  }`}
                  onClick={() => {
                    onPaletteChange(palette);
                    setShowPalettes(false);
                  }}>
                  <div className="flex items-center justify-between mb-2">
                    <span className="font-medium text-sm">{palette.name}</span>
                    {selectedPalette.id === palette.id && <Check className="h-4 w-4 text-[#007aff]" />}
                  </div>
                  <div className="flex gap-2">
                    <div className="flex-1 h-8 rounded" style={{ backgroundColor: palette.primary }} />
                    <div className="flex-1 h-8 rounded" style={{ backgroundColor: palette.secondary }} />
                    <div className="flex-1 h-8 rounded" style={{ backgroundColor: palette.accent }} />
                  </div>
                </div>
              ))}
            </motion.div>
          )}
        </div>
      </Card>

      {/* Section Management */}
      <Card styles={{ body: { padding: '0px' } }} className="border-0 shadow-md rounded-2xl overflow-hidden">
        <div className="p-6">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-10 h-10 bg-[#007aff]/10 rounded-full flex items-center justify-center">
              <GripVertical className="h-5 w-5 text-[#007aff]" />
            </div>
            <div>
              <h3 className="font-medium text-foreground">Secciones de la Invitación</h3>
              <p className="text-sm text-muted-foreground font-light">Activa, desactiva y reordena las secciones</p>
            </div>
          </div>

          <div className="space-y-2">
            {sections.map((section, index) => (
              <motion.div
                key={section.id}
                layout
                className={`p-4 rounded-xl border-2 transition-all ${
                  section.enabled ? 'border-border bg-white' : 'border-border/50 bg-[#f5f5f7]/50'
                }`}>
                <div className="flex items-center gap-4">
                  {/* Drag Handle */}
                  <div className="text-muted-foreground cursor-move">
                    <GripVertical className="h-5 w-5" />
                  </div>

                  {/* Section Info */}
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-xl">{section.icon}</span>
                      <h4 className={`font-medium ${section.enabled ? 'text-foreground' : 'text-muted-foreground'}`}>{section.name}</h4>
                    </div>
                    <p className="text-xs text-muted-foreground font-light">{section.description}</p>
                  </div>

                  {/* Controls */}
                  <div className="flex items-center gap-2">
                    {/* Order MLButtons */}
                    <div className="flex flex-col gap-1">
                      <button
                        onClick={() => moveSection(section.id, 'up')}
                        disabled={index === 0}
                        className="p-1 rounded hover:bg-[#f5f5f7] disabled:opacity-30 disabled:cursor-not-allowed transition-colors">
                        <ChevronUp className="h-4 w-4 text-muted-foreground" />
                      </button>
                      <button
                        onClick={() => moveSection(section.id, 'down')}
                        disabled={index === sections.length - 1}
                        className="p-1 rounded hover:bg-[#f5f5f7] disabled:opacity-30 disabled:cursor-not-allowed transition-colors">
                        <ChevronDown className="h-4 w-4 text-muted-foreground" />
                      </button>
                    </div>

                    {/* Enable/Disable Toggle */}
                    <div className="flex items-center gap-2 pl-2 border-l border-border">
                      <Switch checked={section.enabled} onChange={() => toggleSection(section.id)} id={`section-${section.id}`} />
                      <label htmlFor={`section-${section.id}`} className="cursor-pointer text-sm">
                        {section.enabled ? (
                          <Eye className="h-4 w-4 text-[#34c759]" />
                        ) : (
                          <EyeOff className="h-4 w-4 text-muted-foreground" />
                        )}
                      </label>
                    </div>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>

          {/* Summary */}
          <div className="mt-6 pt-6 border-t border-border">
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground font-light">Secciones activas</span>
              <span className="font-medium text-foreground">
                {sections.filter((s) => s.enabled).length} de {sections.length}
              </span>
            </div>
          </div>
        </div>
      </Card>

      {/* Tips */}
      <Card
        styles={{ body: { padding: '0px' } }}
        className="border-0 shadow-md rounded-2xl overflow-hidden bg-linear-to-br from-[#007aff]/5 to-[#34c759]/5">
        <div className="p-6">
          <h4 className="font-medium text-foreground mb-3 flex items-center gap-2">💡 Consejos</h4>
          <ul className="space-y-2 text-sm text-muted-foreground font-light">
            <li>• Las secciones desactivadas no aparecerán en tu invitación</li>
            <li>• Usa las flechas para cambiar el orden de las secciones</li>
            <li>• La paleta de colores se aplicará a todas las secciones</li>
            <li>• Puedes previsualizar los cambios en tiempo real</li>
          </ul>
        </div>
      </Card>
    </div>
  );
}

// Default sections configuration
export const defaultSections: InvitationSection[] = [
  {
    id: 'header',
    name: 'Encabezado',
    icon: '👋',
    enabled: true,
    order: 0,
    description: 'Nombres de la pareja, fecha y countdown',
  },
  {
    id: 'presentation',
    name: 'Presentación',
    icon: '👨‍👩‍👧‍👦',
    enabled: true,
    order: 1,
    description: 'Nombres de los padres',
  },
  {
    id: 'event',
    name: 'Evento',
    icon: '💒',
    enabled: true,
    order: 2,
    description: 'Ceremonia y recepción con ubicaciones',
  },
  {
    id: 'dresscode',
    name: 'Código de Vestimenta',
    icon: '👔',
    enabled: true,
    order: 3,
    description: 'Indicaciones de vestimenta para invitados',
  },
  {
    id: 'schedule',
    name: 'Cronograma',
    icon: '📅',
    enabled: true,
    order: 4,
    description: 'Itinerario del evento',
  },
  {
    id: 'accommodation',
    name: 'Hospedaje',
    icon: '🏨',
    enabled: false,
    order: 5,
    description: 'Hoteles recomendados',
  },
  {
    id: 'gifts',
    name: 'Mesa de Regalos',
    icon: '🎁',
    enabled: true,
    order: 6,
    description: 'Links a mesa de regalos',
  },
  {
    id: 'gallery',
    name: 'Galería',
    icon: '📸',
    enabled: true,
    order: 7,
    description: 'Fotos de la pareja',
  },
  {
    id: 'rsvp',
    name: 'Confirmación',
    icon: '✉️',
    enabled: true,
    order: 8,
    description: 'Formulario de confirmación de asistencia',
  },
];
