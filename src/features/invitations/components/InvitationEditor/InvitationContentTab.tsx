import { Input, DatePicker, TimePicker, Button, Checkbox } from 'antd';
import { PlusOutlined, MinusCircleOutlined, DownOutlined, UpOutlined } from '@ant-design/icons';
import dayjs from 'dayjs';
import { useState, useEffect } from 'react';
import { InvitationSection } from './InvitationSectionManager';
import { Collapsible } from 'src/components/core/Collapsible';

const { TextArea } = Input;

interface InvitationContentTabProps {
  eventName: string;
  setEventName: (name: string) => void;
  formData: Record<string, string>;
  handleFieldChange: (key: string, value: string) => void;
  sections: InvitationSection[];
  onEventNameChange?: () => void;
}

interface ScheduleItem {
  time: string;
  activity: string;
}

interface HotelItem {
  name: string;
  stars: number;
  distance: string;
  phone: string;
  image?: string;
  amenities?: string;
}

interface GalleryItem {
  url: string;
}

// Define fields needed for each section
const sectionFieldMappings: Record<string, Array<{ key: string; label: string; type: string; placeholder: string }>> = {
  header: [
    { key: 'brideName', label: 'Nombre de la Novia', type: 'text', placeholder: 'Ej: Ana' },
    { key: 'groomName', label: 'Nombre del Novio', type: 'text', placeholder: 'Ej: Carlos' },
    { key: 'eventDate', label: 'Fecha del Evento', type: 'date', placeholder: 'Selecciona la fecha' },
    { key: 'location', label: 'Ciudad/Ubicación', type: 'text', placeholder: 'Ej: Querétaro' },
    { key: 'headerBackgroundImage', label: 'Imagen de Fondo (URL)', type: 'text', placeholder: 'https://ejemplo.com/fondo.jpg' },
    { key: 'showCountdown', label: 'Mostrar Contador Regresivo', type: 'checkbox', placeholder: '' },
  ],
  presentation: [
    { key: 'brideMother', label: 'Madre de la Novia', type: 'text', placeholder: 'Ej: Rosa López' },
    { key: 'brideFather', label: 'Padre de la Novia', type: 'text', placeholder: 'Ej: Pedro Martínez' },
    { key: 'groomMother', label: 'Madre del Novio', type: 'text', placeholder: 'Ej: María García' },
    { key: 'groomFather', label: 'Padre del Novio', type: 'text', placeholder: 'Ej: Juan Pérez' },
  ],
  event: [
    { key: 'ceremonyVenue', label: 'Lugar de la Ceremonia', type: 'text', placeholder: 'Ej: Templo de San Francisco' },
    { key: 'ceremonyTime', label: 'Hora de la Ceremonia', type: 'time', placeholder: '16:00' },
    { key: 'ceremonyAddress', label: 'Dirección de la Ceremonia', type: 'text', placeholder: 'Calle, número, colonia' },
    { key: 'ceremonyMapLink', label: 'Link de Google Maps (Ceremonia)', type: 'text', placeholder: 'https://maps.app.goo.gl/...' },
    { key: 'receptionVenue', label: 'Lugar de la Recepción', type: 'text', placeholder: 'Ej: Casona de los 5 Patios' },
    { key: 'receptionTime', label: 'Hora de la Recepción', type: 'time', placeholder: '18:00' },
    { key: 'receptionAddress', label: 'Dirección de la Recepción', type: 'text', placeholder: 'Calle, número, colonia' },
    { key: 'receptionMapLink', label: 'Link de Google Maps (Recepción)', type: 'text', placeholder: 'https://maps.app.goo.gl/...' },
  ],
  dresscode: [
    { key: 'dressCodeMen', label: 'Código de Vestimenta - Hombres', type: 'text', placeholder: 'Ej: Formal de noche (traje)' },
    { key: 'dressCodeMenNote', label: 'Nota Adicional - Hombres', type: 'text', placeholder: 'Ej: Bonitos y gorditos' },
    { key: 'dressCodeWomen', label: 'Código de Vestimenta - Mujeres', type: 'text', placeholder: 'Ej: Formal de noche (largo)' },
    { key: 'dressCodeWomenNote', label: 'Nota Adicional - Mujeres', type: 'text', placeholder: 'Ej: Evitar tonos claros' },
  ],
  schedule: [],
  accommodation: [{ key: 'accommodationCode', label: 'Código de Reservación', type: 'text', placeholder: 'Ej: MAREMI-1125' }],
  gifts: [
    { key: 'giftsMessage', label: 'Mensaje de Mesa de Regalos', type: 'textarea', placeholder: 'Gracias por acompañarnos...' },
    { key: 'bankAccount', label: 'Cuenta Bancaria (Nombre)', type: 'text', placeholder: 'Ej: Mariana Soledad Rosales' },
    { key: 'clabe', label: 'CLABE Interbancaria', type: 'text', placeholder: 'Ej: 012 222 01541734407 1' },
  ],
  gallery: [],
  rsvp: [{ key: 'rsvpMessage', label: 'Mensaje de Confirmación', type: 'text', placeholder: 'Ingresa tu nombre y código para confirmar' }],
};

export function InvitationContentTab({ eventName, setEventName, formData, handleFieldChange, sections }: InvitationContentTabProps) {
  // State for dynamic arrays
  const [scheduleItems, setScheduleItems] = useState<ScheduleItem[]>([{ time: '', activity: '' }]);
  const [hotelItems, setHotelItems] = useState<HotelItem[]>([{ name: '', stars: 5, distance: '', phone: '', image: '', amenities: '' }]);
  const [galleryItems, setGalleryItems] = useState<GalleryItem[]>([{ url: '' }]);

  // State for collapsible sections
  const [openSections, setOpenSections] = useState<Record<string, boolean>>({});

  const toggleSection = (sectionName: string) => {
    setOpenSections((prev) => ({
      ...prev,
      [sectionName]: !prev[sectionName],
    }));
  };

  // Initialize from formData on mount
  useEffect(() => {
    if (formData.scheduleItems) {
      try {
        const parsed = JSON.parse(formData.scheduleItems);
        if (Array.isArray(parsed) && parsed.length > 0) {
          setScheduleItems(parsed);
        }
      } catch (e) {
        // Invalid JSON, keep default
      }
    }
    if (formData.hotels) {
      try {
        const parsed = JSON.parse(formData.hotels);
        if (Array.isArray(parsed) && parsed.length > 0) {
          setHotelItems(parsed);
        }
      } catch (e) {
        // Invalid JSON, keep default
      }
    }
    if (formData.galleryImages) {
      try {
        const parsed = JSON.parse(formData.galleryImages);
        if (Array.isArray(parsed) && parsed.length > 0) {
          setGalleryItems(parsed.map((url: string) => ({ url })));
        }
      } catch (e) {
        // Invalid JSON, keep default
      }
    }
  }, []);

  // Sync arrays to formData as JSON
  useEffect(() => {
    handleFieldChange('scheduleItems', JSON.stringify(scheduleItems));
  }, [scheduleItems]);

  useEffect(() => {
    handleFieldChange('hotels', JSON.stringify(hotelItems));
  }, [hotelItems]);

  useEffect(() => {
    handleFieldChange('galleryImages', JSON.stringify(galleryItems.map((item) => item.url)));
  }, [galleryItems]);

  // Get enabled sections
  const enabledSections = sections.filter((s) => s.enabled);

  // Collect all fields needed based on enabled sections
  const dynamicFields: Array<{ key: string; label: string; type: string; placeholder: string; sectionName?: string }> = [];

  enabledSections.forEach((section) => {
    const sectionFields = sectionFieldMappings[section.id] || [];
    sectionFields.forEach((field) => {
      dynamicFields.push({ ...field, sectionName: section.name });
    });
  });

  // Render field based on type
  const renderField = (field: { key: string; label: string; type: string; placeholder: string; sectionName?: string }) => {
    switch (field.type) {
      case 'textarea':
        return (
          <TextArea
            id={field.key}
            value={formData[field.key] || ''}
            onChange={(e) => handleFieldChange(field.key, e.target.value)}
            placeholder={field.placeholder}
            rows={4}
            className="bg-[#f5f5f7]! border-0 rounded-xl"
          />
        );
      case 'date':
        return (
          <DatePicker
            id={field.key}
            value={formData[field.key] ? dayjs(formData[field.key]) : null}
            onChange={(date) => handleFieldChange(field.key, date ? date.format('YYYY-MM-DD') : '')}
            placeholder={field.placeholder}
            className="bg-[#f5f5f7] border-0 rounded-xl w-full"
            size="large"
          />
        );
      case 'time':
        return (
          <TimePicker
            id={field.key}
            value={formData[field.key] ? dayjs(formData[field.key], 'HH:mm') : null}
            onChange={(time) => handleFieldChange(field.key, time ? time.format('HH:mm') : '')}
            format="HH:mm"
            className="bg-[#f5f5f7] border-0 rounded-xl w-full"
            size="large"
          />
        );
      case 'checkbox':
        return (
          <Checkbox
            key={field.key}
            checked={formData[field.key] === 'false' ? false : true}
            onChange={(e) => handleFieldChange(field.key, e.target.checked.toString())}
          />
        );
      default:
        return (
          <Input
            id={field.key}
            value={formData[field.key] || ''}
            onChange={(e) => handleFieldChange(field.key, e.target.value)}
            placeholder={field.placeholder}
            className="bg-[#f5f5f7]! border-0 rounded-xl"
            size="large"
          />
        );
    }
  };

  // Group fields by section
  const fieldsBySectionName = dynamicFields.reduce(
    (acc, field) => {
      const sectionName = field.sectionName || 'General';
      if (!acc[sectionName]) {
        acc[sectionName] = [];
      }
      acc[sectionName].push(field);
      return acc;
    },
    {} as Record<string, typeof dynamicFields>,
  );

  // Render dynamic schedule fields
  const renderScheduleFields = () => {
    return (
      <div className="space-y-4">
        {scheduleItems.map((item, index) => (
          <div key={index} className="flex gap-3 items-start">
            <div className="flex-1 space-y-2">
              <div className="text-sm font-medium text-foreground block mb-2">Hora</div>
              <TimePicker
                value={item.time ? dayjs(item.time, 'HH:mm') : null}
                onChange={(time) => {
                  const newItems = [...scheduleItems];
                  newItems[index].time = time ? time.format('HH:mm') : '';
                  setScheduleItems(newItems);
                }}
                format="HH:mm"
                className="bg-[#f5f5f7] border-0 rounded-xl w-full"
                size="large"
                placeholder="16:00"
              />
            </div>
            <div className="flex-2 space-y-2">
              <div className="text-sm font-medium text-foreground block mb-2">Actividad</div>
              <Input
                value={item.activity}
                onChange={(e) => {
                  const newItems = [...scheduleItems];
                  newItems[index].activity = e.target.value;
                  setScheduleItems(newItems);
                }}
                placeholder="Ej: Ceremonia religiosa"
                className="bg-[#f5f5f7]! border-0 rounded-xl"
                size="large"
              />
            </div>
            {scheduleItems.length > 1 && (
              <Button
                type="text"
                danger
                icon={<MinusCircleOutlined />}
                onClick={() => setScheduleItems(scheduleItems.filter((_, i) => i !== index))}
                className="mt-8"
              />
            )}
          </div>
        ))}
        <Button
          type="dashed"
          onClick={() => setScheduleItems([...scheduleItems, { time: '', activity: '' }])}
          icon={<PlusOutlined />}
          className="w-full">
          Agregar Actividad
        </Button>
      </div>
    );
  };

  // Render dynamic hotel fields
  const renderHotelFields = () => {
    if (!enabledSections.find((s) => s.id === 'accommodation')) return null;

    return (
      <div className="space-y-4">
        {hotelItems.map((item, index) => (
          <div key={index} className="space-y-3 p-4 bg-[#f5f5f7] rounded-xl">
            <div className="flex justify-between items-center">
              <div className="text-sm font-semibold text-foreground">Hotel {index + 1}</div>
              {hotelItems.length > 1 && (
                <Button
                  type="text"
                  danger
                  icon={<MinusCircleOutlined />}
                  onClick={() => setHotelItems(hotelItems.filter((_, i) => i !== index))}
                  size="small"
                />
              )}
            </div>
            <div className="space-y-3">
              <div className="space-y-2">
                <div className="text-xs font-medium text-foreground block">Nombre del Hotel</div>
                <Input
                  value={item.name}
                  onChange={(e) => {
                    const newItems = [...hotelItems];
                    newItems[index].name = e.target.value;
                    setHotelItems(newItems);
                  }}
                  placeholder="Ej: Gran Hotel"
                  className="bg-white! border-0 rounded-lg"
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-2">
                  <div className="text-xs font-medium text-foreground block">Estrellas</div>
                  <Input
                    type="number"
                    min={1}
                    max={5}
                    value={item.stars}
                    onChange={(e) => {
                      const newItems = [...hotelItems];
                      newItems[index].stars = parseInt(e.target.value) || 5;
                      setHotelItems(newItems);
                    }}
                    placeholder="5"
                    className="bg-white! border-0 rounded-lg"
                  />
                </div>
                <div className="space-y-2">
                  <div className="text-xs font-medium text-foreground block">Distancia</div>
                  <Input
                    value={item.distance}
                    onChange={(e) => {
                      const newItems = [...hotelItems];
                      newItems[index].distance = e.target.value;
                      setHotelItems(newItems);
                    }}
                    placeholder="Ej: 1 minuto"
                    className="bg-white! border-0 rounded-lg"
                  />
                </div>
              </div>
              <div className="space-y-2">
                <div className="text-xs font-medium text-foreground block">Imagen URL</div>
                <Input
                  value={item.image || ''}
                  onChange={(e) => {
                    const newItems = [...hotelItems];
                    newItems[index].image = e.target.value;
                    setHotelItems(newItems);
                  }}
                  placeholder="https://ejemplo.com/hotel.jpg"
                  className="bg-white! border-0 rounded-lg"
                />
              </div>
              <div className="space-y-2">
                <div className="text-xs font-medium text-foreground block">Amenidades</div>
                <Input
                  value={item.amenities || ''}
                  onChange={(e) => {
                    const newItems = [...hotelItems];
                    newItems[index].amenities = e.target.value;
                    setHotelItems(newItems);
                  }}
                  placeholder="Ej: WiFi, Piscina, Desayuno incluido"
                  className="bg-white! border-0 rounded-lg"
                />
              </div>
              <div className="space-y-2">
                <div className="text-xs font-medium text-foreground block">Teléfono</div>
                <Input
                  value={item.phone}
                  onChange={(e) => {
                    const newItems = [...hotelItems];
                    newItems[index].phone = e.target.value;
                    setHotelItems(newItems);
                  }}
                  placeholder="Ej: 4422518050"
                  className="bg-white! border-0 rounded-lg"
                />
              </div>
            </div>
          </div>
        ))}
        <Button
          type="dashed"
          onClick={() => setHotelItems([...hotelItems, { name: '', stars: 5, distance: '', phone: '', image: '', amenities: '' }])}
          icon={<PlusOutlined />}
          className="w-full">
          Agregar Hotel
        </Button>
      </div>
    );
  };

  // Render dynamic gallery fields
  const renderGalleryFields = () => {
    return (
      <div className="space-y-4">
        {galleryItems.map((item, index) => (
          <div key={index} className="flex gap-3 items-start">
            <div className="flex-1 space-y-2">
              <div className="text-sm font-medium text-foreground block mb-2">URL de Imagen {index + 1}</div>
              <Input
                value={item.url}
                onChange={(e) => {
                  const newItems = [...galleryItems];
                  newItems[index].url = e.target.value;
                  setGalleryItems(newItems);
                }}
                placeholder="https://ejemplo.com/imagen.jpg"
                className="bg-[#f5f5f7]! border-0 rounded-xl"
                size="large"
              />
            </div>
            {galleryItems.length > 1 && (
              <Button
                type="text"
                danger
                icon={<MinusCircleOutlined />}
                onClick={() => setGalleryItems(galleryItems.filter((_, i) => i !== index))}
                className="mt-8"
              />
            )}
          </div>
        ))}
        <Button type="dashed" onClick={() => setGalleryItems([...galleryItems, { url: '' }])} icon={<PlusOutlined />} className="w-full">
          Agregar Imagen
        </Button>
      </div>
    );
  };

  // Prevent form submission on Enter key
  const handleFormSubmit = (e: React.FormEvent) => {
    e.preventDefault();
  };

  return (
    <form onSubmit={handleFormSubmit} className="space-y-6 mt-6">
      <div>
        <div className="text-3xl font-light text-foreground mb-2">Detalles del Evento</div>
        <div className="text-muted-foreground font-light">Completa la información de tu invitación</div>
      </div>

      <div className="space-y-6">
        {/* Event Name Field */}
        <div className="space-y-2">
          <div className="text-sm font-medium text-foreground block mb-2">Nombre del Evento</div>
          <Input
            id="eventName"
            value={eventName}
            onChange={(e) => setEventName(e.target.value)}
            placeholder="Ej: Boda de Ana y Carlos"
            className="bg-[#f5f5f7]! border-0 rounded-xl"
            size="large"
          />
          <div className="text-xs text-muted-foreground font-light block">Este nombre es para tu referencia interna</div>
        </div>

        {/* Dynamic Fields Grouped by Section */}
        {Object.entries(fieldsBySectionName).map(([sectionName, fields]) => (
          <div key={sectionName} className="space-y-2">
            <div
              className="py-4 border-t border-border/30 cursor-pointer flex items-center justify-between bg-primary/10 hover:bg-gray-50 pl-2 pr-4 rounded-lg transition-colors"
              onClick={() => toggleSection(sectionName)}>
              <div className="text-xl font-medium! text-foreground!">{sectionName}</div>
              {openSections[sectionName] ? <UpOutlined /> : <DownOutlined />}
            </div>
            <Collapsible isOpen={openSections[sectionName] || false}>
              <div className="space-y-4 pl-2 pr-4">
                {fields.map((field) => (
                  <div key={field.key} className="space-y-2">
                    <div className="text-sm font-medium text-foreground! block mb-2">{field.label}</div>
                    {renderField(field)}
                  </div>
                ))}
                {/* Render dynamic hotel fields after accommodation code */}
                {sectionName === 'Hospedaje' && renderHotelFields()}
              </div>
            </Collapsible>
          </div>
        ))}

        {/* Dynamic Schedule Fields */}
        {enabledSections.find((s) => s.id === 'schedule') && (
          <div className="space-y-2">
            <div
              className="py-4 border-t border-border/30 cursor-pointer flex items-center justify-between bg-primary/10 hover:bg-gray-50 pl-2 pr-4 rounded-lg transition-colors"
              onClick={() => toggleSection('Cronograma')}>
              <div className="text-xl font-medium! text-foreground">Cronograma</div>
              {openSections['Cronograma'] ? <UpOutlined /> : <DownOutlined />}
            </div>
            <Collapsible isOpen={openSections['Cronograma'] || false}>
              <div className="pl-2 pr-4">{renderScheduleFields()}</div>
            </Collapsible>
          </div>
        )}

        {/* Dynamic Gallery Fields */}
        {enabledSections.find((s) => s.id === 'gallery') && (
          <div className="space-y-2">
            <div
              className="py-4 border-t border-border/30 cursor-pointer flex items-center justify-between bg-primary/10 hover:bg-gray-50 pl-2 pr-4 rounded-lg transition-colors"
              onClick={() => toggleSection('Galería')}>
              <div className="text-xl font-medium! text-foreground">Galería de Imágenes</div>
              {openSections['Galería'] ? <UpOutlined /> : <DownOutlined />}
            </div>
            <Collapsible isOpen={openSections['Galería'] || false}>
              <div className="pl-2 pr-4">{renderGalleryFields()}</div>
            </Collapsible>
          </div>
        )}
      </div>
    </form>
  );
}
