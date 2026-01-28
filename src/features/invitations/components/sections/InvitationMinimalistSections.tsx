import React from 'react';
import { ColorPalette } from '../InvitationEditor/InvitationSectionManager';

interface SectionProps {
  data: any;
  palette: ColorPalette;
}

// Header Section
export function HeaderSection({ data, palette }: SectionProps) {
  const [countdown, setCountdown] = React.useState({ days: 0, hours: 0, minutes: 0, seconds: 0 });

  React.useEffect(() => {
    if (!data.eventDate) return;

    const updateCountdown = () => {
      const now = new Date().getTime();
      const eventDate = new Date(data.eventDate).getTime();
      const distance = eventDate - now;

      if (distance < 0) {
        setCountdown({ days: 0, hours: 0, minutes: 0, seconds: 0 });
        return;
      }

      setCountdown({
        days: Math.floor(distance / (1000 * 60 * 60 * 24)),
        hours: Math.floor((distance % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60)),
        minutes: Math.floor((distance % (1000 * 60 * 60)) / (1000 * 60)),
        seconds: Math.floor((distance % (1000 * 60)) / 1000),
      });
    };

    updateCountdown();
    const interval = setInterval(updateCountdown, 1000);
    return () => clearInterval(interval);
  }, [data.eventDate]);

  return (
    <header
      className="min-h-screen flex flex-col items-center justify-between text-center px-4 relative overflow-hidden"
      style={{
        backgroundImage: data.headerBackgroundImage
          ? `linear-gradient(rgba(0, 0, 0, 0.4), rgba(0, 0, 0, 0.4)), url(${data.headerBackgroundImage})`
          : `linear-gradient(to bottom, ${palette.background}, ${palette.secondary})`,
        backgroundSize: 'cover',
        backgroundPosition: 'center',
        color: data.headerBackgroundImage ? '#ffffff' : palette.text,
      }}>
      {/* Header Top */}
      <div className="flex-1 flex flex-col items-center justify-center relative z-10 py-12">
        <h1
          className="text-5xl sm:text-6xl md:text-8xl mb-4 font-light"
          style={{
            fontFamily: "'Great Vibes', cursive",
            color: data.headerBackgroundImage ? '#ffffff' : palette.primary,
          }}>
          {data.brideName} & {data.groomName}
        </h1>
        <div
          className="text-lg md:text-2xl mb-2 font-light tracking-wide"
          style={{ color: data.headerBackgroundImage ? '#ffffff' : palette.textLight }}>
          {data.eventDate
            ? new Date(data.eventDate).toLocaleDateString('es-MX', {
                day: 'numeric',
                month: 'long',
                year: 'numeric',
              })
            : 'Ingresa fecha'}{' '}
          {data.location && `| ${data.location}`}
        </div>
        <p
          className="text-xl md:text-3xl mt-6 font-light italic"
          style={{ color: data.headerBackgroundImage ? '#ffffff' : palette.accent }}>
          Save the Date
        </p>
      </div>

      {/* Countdown */}
      {data.showCountdown !== 'false' && (
        <div className="relative z-10 pb-12 w-full max-w-2xl">
          <div className="grid grid-cols-4 gap-2 sm:gap-4 md:gap-6">
            <div className="flex flex-col items-center">
              <span
                className="text-3xl sm:text-4xl md:text-5xl font-light mb-1"
                style={{ color: data.headerBackgroundImage ? '#ffffff' : palette.primary }}>
                {String(countdown.days).padStart(2, '0')}
              </span>
              <span
                className="text-xs sm:text-sm md:text-base font-light"
                style={{ color: data.headerBackgroundImage ? '#ffffff' : palette.textLight }}>
                Días
              </span>
            </div>
            <div className="flex flex-col items-center">
              <span
                className="text-3xl sm:text-4xl md:text-5xl font-light mb-1"
                style={{ color: data.headerBackgroundImage ? '#ffffff' : palette.primary }}>
                {String(countdown.hours).padStart(2, '0')}
              </span>
              <span
                className="text-xs sm:text-sm md:text-base font-light"
                style={{ color: data.headerBackgroundImage ? '#ffffff' : palette.textLight }}>
                Horas
              </span>
            </div>
            <div className="flex flex-col items-center">
              <span
                className="text-3xl sm:text-4xl md:text-5xl font-light mb-1"
                style={{ color: data.headerBackgroundImage ? '#ffffff' : palette.primary }}>
                {String(countdown.minutes).padStart(2, '0')}
              </span>
              <span
                className="text-xs sm:text-sm md:text-base font-light"
                style={{ color: data.headerBackgroundImage ? '#ffffff' : palette.textLight }}>
                Minutos
              </span>
            </div>
            <div className="flex flex-col items-center">
              <span
                className="text-3xl sm:text-4xl md:text-5xl font-light mb-1"
                style={{ color: data.headerBackgroundImage ? '#ffffff' : palette.primary }}>
                {String(countdown.seconds).padStart(2, '0')}
              </span>
              <span
                className="text-xs sm:text-sm md:text-base font-light"
                style={{ color: data.headerBackgroundImage ? '#ffffff' : palette.textLight }}>
                Segundos
              </span>
            </div>
          </div>
        </div>
      )}

      {/* Decorative elements (only if no background image) */}
      {!data.headerBackgroundImage && (
        <>
          <div
            className="absolute top-20 left-20 w-32 h-32 rounded-full blur-3xl opacity-20"
            style={{ backgroundColor: palette.primary }}
          />
          <div
            className="absolute bottom-20 right-20 w-40 h-40 rounded-full blur-3xl opacity-20"
            style={{ backgroundColor: palette.accent }}
          />
        </>
      )}
    </header>
  );
}

// Presentation Section (Parents)
export function PresentationSection({ data, palette }: SectionProps) {
  return (
    <section className="py-20 px-4" style={{ backgroundColor: palette.background }}>
      <div className="max-w-4xl mx-auto text-center">
        <h2 className="text-4xl md:text-5xl mb-12 font-light" style={{ color: palette.primary }}>
          Nuestros Padres
        </h2>
        <div className="grid md:grid-cols-2 gap-12">
          <div className="space-y-4">
            <h3 className="text-2xl font-light" style={{ color: palette.text }}>
              {data.groomMother}
            </h3>
            <h3 className="text-2xl font-light" style={{ color: palette.text }}>
              {data.groomFather}
            </h3>
          </div>
          <div className="space-y-4">
            <h3 className="text-2xl font-light" style={{ color: palette.text }}>
              {data.brideMother}
            </h3>
            <h3 className="text-2xl font-light" style={{ color: palette.text }}>
              {data.brideFather}
            </h3>
          </div>
        </div>
      </div>
    </section>
  );
}

// Event Section
export function EventSection({ data, palette }: SectionProps) {
  return (
    <section
      className="py-20 px-4"
      style={{
        background: `linear-gradient(to bottom, ${palette.secondary}, ${palette.background})`,
      }}>
      <div className="max-w-6xl mx-auto">
        <div className="grid md:grid-cols-2 gap-8">
          {/* Ceremony */}
          <div className="rounded-3xl p-8 text-center shadow-lg" style={{ backgroundColor: 'white' }}>
            <div className="text-6xl mb-4">💒</div>
            <h3 className="text-3xl mb-4 font-medium" style={{ color: palette.primary }}>
              Ceremonia Religiosa
            </h3>
            <h4 className="text-xl mb-2 font-light" style={{ color: palette.text }}>
              {data.ceremonyVenue}
            </h4>
            <p className="text-4xl font-light mb-6" style={{ color: palette.accent }}>
              {data.ceremonyTime}
            </p>
            {data.ceremonyAddress && (
              <a
                href={data.ceremonyMapLink}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-block px-6 py-3 rounded-full text-white font-light transition-all hover:shadow-lg"
                style={{ backgroundColor: palette.primary }}>
                Ver Ubicación
              </a>
            )}
          </div>

          {/* Reception */}
          <div className="rounded-3xl p-8 text-center shadow-lg" style={{ backgroundColor: 'white' }}>
            <div className="text-6xl mb-4">🥂</div>
            <h3 className="text-3xl mb-4 font-medium" style={{ color: palette.primary }}>
              Recepción
            </h3>
            <h4 className="text-xl mb-2 font-light" style={{ color: palette.text }}>
              {data.receptionVenue}
            </h4>
            <p className="text-4xl font-light mb-6" style={{ color: palette.accent }}>
              {data.receptionTime}
            </p>
            {data.receptionAddress && (
              <a
                href={data.receptionMapLink}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-block px-6 py-3 rounded-full text-white font-light transition-all hover:shadow-lg"
                style={{ backgroundColor: palette.primary }}>
                Ver Ubicación
              </a>
            )}
          </div>
        </div>
      </div>
    </section>
  );
}

// Dress Code Section
export function DressCodeSection({ data, palette }: SectionProps) {
  return (
    <section className="py-20 px-4" style={{ backgroundColor: palette.background }}>
      <div className="max-w-4xl mx-auto text-center">
        <h2 className="text-4xl md:text-5xl mb-12 font-light" style={{ color: palette.primary }}>
          Código de Vestimenta
        </h2>
        <div className="grid md:grid-cols-2 gap-8">
          <div className="rounded-3xl p-8 shadow-md" style={{ backgroundColor: 'white' }}>
            <div className="text-6xl mb-4">🤵</div>
            <h3 className="text-2xl mb-4 font-medium" style={{ color: palette.text }}>
              Caballeros
            </h3>
            <p className="text-lg font-light mb-2" style={{ color: palette.textLight }}>
              {data.dressCodeMen}
            </p>
            {data.dressCodeMenNote && (
              <p className="text-sm font-light italic" style={{ color: palette.textLight }}>
                {data.dressCodeMenNote}
              </p>
            )}
          </div>
          <div className="rounded-3xl p-8 shadow-md" style={{ backgroundColor: 'white' }}>
            <div className="text-6xl mb-4">👗</div>
            <h3 className="text-2xl mb-4 font-medium" style={{ color: palette.text }}>
              Damas
            </h3>
            <p className="text-lg font-light mb-2" style={{ color: palette.textLight }}>
              {data.dressCodeWomen}
            </p>
            {data.dressCodeWomenNote && (
              <p className="text-sm font-light italic" style={{ color: palette.textLight }}>
                {data.dressCodeWomenNote}
              </p>
            )}
          </div>
        </div>
      </div>
    </section>
  );
}

// Schedule Section
export function ScheduleSection({ data, palette }: SectionProps) {
  const scheduleItems = data.scheduleItems || [];

  return (
    <section
      className="py-20 px-4"
      style={{
        background: `linear-gradient(to bottom, ${palette.secondary}, ${palette.background})`,
      }}>
      <div className="max-w-3xl mx-auto">
        <h2 className="text-4xl md:text-5xl mb-12 text-center font-light" style={{ color: palette.primary }}>
          Cronograma del Día
        </h2>
        <div className="relative">
          {/* Timeline vertical line */}
          <div className="absolute left-4 md:left-8 top-0 bottom-0 w-0.5" style={{ backgroundColor: palette.primary, opacity: 0.3 }} />

          {/* Timeline items */}
          <div className="space-y-8">
            {scheduleItems.map((item: any, index: number) => (
              <div key={index} className="relative flex items-start gap-4 md:gap-8">
                {/* Timeline dot */}
                <div className="relative z-10 flex-shrink-0">
                  <div
                    className="w-8 h-8 md:w-12 md:h-12 rounded-full border-4 flex items-center justify-center"
                    style={{
                      backgroundColor: palette.background,
                      borderColor: palette.primary,
                    }}>
                    <div className="w-3 h-3 md:w-4 md:h-4 rounded-full" style={{ backgroundColor: palette.primary }} />
                  </div>
                </div>

                {/* Timeline content */}
                <div className="flex-1 pb-4">
                  <div className="bg-white rounded-2xl p-4 md:p-6 shadow-md">
                    <h3 className="text-xl md:text-2xl font-medium mb-1" style={{ color: palette.primary }}>
                      {item.time}
                    </h3>
                    <p className="text-base md:text-lg font-light" style={{ color: palette.text }}>
                      {item.activity}
                    </p>
                    {item.description && (
                      <p className="text-sm font-light" style={{ color: palette.textLight }}>
                        {item.description}
                      </p>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}

// Accommodation Section
export function AccommodationSection({ data, palette }: SectionProps) {
  const hotels = data.hotels || [];

  return (
    <section className="py-20 px-4" style={{ backgroundColor: palette.background }}>
      <div className="max-w-6xl mx-auto">
        <h2 className="text-4xl md:text-5xl mb-4 text-center font-light" style={{ color: palette.primary }}>
          Hospedaje Recomendado
        </h2>
        {data.accommodationCode && (
          <p className="text-center mb-12 text-lg" style={{ color: palette.textLight }}>
            Código de reservación:{' '}
            <span className="font-medium" style={{ color: palette.accent }}>
              {data.accommodationCode}
            </span>
          </p>
        )}
        <div
          className={`grid ${hotels.length === 1 ? 'md:grid-cols-1' : hotels.length === 2 ? 'md:grid-cols-2' : 'md:grid-cols-2 lg:grid-cols-3'} gap-6`}>
          {hotels.map((hotel: any, index: number) => (
            <div key={index} className="rounded-3xl overflow-hidden shadow-lg" style={{ backgroundColor: 'white' }}>
              {hotel.image && <img src={hotel.image} alt={hotel.name} className="w-full h-48 object-cover" />}
              <div className="p-6">
                <h3 className="text-xl font-medium mb-2" style={{ color: palette.text }}>
                  {hotel.name}
                </h3>
                <p className="text-yellow-500 mb-2">{'⭐️'.repeat(hotel.stars)}</p>
                <p className="text-sm mb-2 font-light" style={{ color: palette.textLight }}>
                  🚶 {hotel.distance}
                </p>
                <p className="text-sm mb-4 font-light" style={{ color: palette.textLight }}>
                  {hotel.amenities}
                </p>
                {hotel.phone && (
                  <a
                    href={`tel:${hotel.phone}`}
                    className="inline-block w-full text-center px-4 py-3 rounded-full text-white font-light transition-all hover:shadow-lg"
                    style={{ backgroundColor: palette.primary }}>
                    Reservar
                  </a>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

// Gifts Section
export function GiftsSection({ data, palette }: SectionProps) {
  // Build gift registries array from form data
  const giftRegistries = [];

  // Add MesaLista registry (always present if user has slug and giftListId)
  if (data.userSlug && data.giftListId) {
    giftRegistries.push({
      icon: '🎁',
      name: 'Mesa de Regalos MesaLista',
      link: `/${data.userSlug}/${data.giftListId}/regalos`,
    });
  }

  // Add bank account if provided
  if (data.bankAccount || data.clabe) {
    giftRegistries.push({
      icon: '💳',
      name: 'Transferencia Bancaria',
      account: data.bankAccount,
      clabe: data.clabe,
    });
  }

  return (
    <section
      className="py-20 px-4"
      style={{
        background: `linear-gradient(to bottom, ${palette.secondary}, ${palette.background})`,
      }}>
      <div className="max-w-4xl mx-auto text-center">
        <h2 className="text-4xl md:text-5xl mb-6 font-light" style={{ color: palette.primary }}>
          Mesa de Regalos
        </h2>
        <p className="text-lg mb-8 font-light max-w-2xl mx-auto" style={{ color: palette.textLight }}>
          {data.giftsMessage ||
            '¡Tu presencia es nuestro mejor regalo! Si deseas obsequiarnos algo, aquí te compartimos nuestras opciones.'}
        </p>
        <div className={`grid ${!data.bankAccount || !data.clabe ? 'grid-cols-1' : 'md:grid-cols-2'} gap-6`}>
          {giftRegistries.map((registry: any, index: number) => (
            <div key={index} className="rounded-3xl p-8 shadow-lg" style={{ backgroundColor: 'white' }}>
              <div className="text-6xl mb-4">{registry.icon}</div>
              <h3 className="text-xl mb-4 font-medium" style={{ color: palette.text }}>
                {registry.name}
              </h3>
              {registry.account && (
                <p className="text-sm mb-2 font-light" style={{ color: palette.textLight }}>
                  <strong>Cuenta:</strong> {registry.account}
                </p>
              )}
              {registry.clabe && (
                <p className="text-sm mb-4 font-light" style={{ color: palette.textLight }}>
                  <strong>CLABE:</strong> {registry.clabe}
                </p>
              )}
              {registry.link && (
                <a
                  href={registry.link}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-block px-6 py-3 rounded-full text-white font-light transition-all hover:shadow-lg"
                  style={{ backgroundColor: palette.primary }}>
                  Visitar
                </a>
              )}
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

// Gallery Section
export function GallerySection({ data, palette }: SectionProps) {
  const galleryItems = data.galleryItems || [];

  return (
    <section className="py-20 px-4" style={{ backgroundColor: palette.background }}>
      <div className="max-w-6xl mx-auto">
        <h2 className="text-4xl md:text-5xl mb-12 text-center font-light" style={{ color: palette.primary }}>
          {data.galleryTitle || 'Nuestros Momentos Felices'}
        </h2>
        <div
          className={`grid ${galleryItems.length === 1 ? 'grid-cols-1' : galleryItems.length === 2 ? 'grid-cols-2' : 'grid-cols-2 md:grid-cols-3'} gap-6`}>
          {galleryItems.map((item: any, index: number) => (
            <div key={index} className="rounded-2xl overflow-hidden shadow-lg aspect-square">
              <img
                src={item.url}
                alt={`Foto ${index + 1}`}
                className="w-full h-full object-cover hover:scale-105 transition-transform duration-300"
              />
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

// RSVP Section
export function RSVPSection({ data, palette }: SectionProps) {
  return (
    <section
      className="py-20 px-4"
      style={{
        background: `linear-gradient(to bottom, ${palette.secondary}, ${palette.background})`,
      }}>
      <div className="max-w-2xl mx-auto text-center">
        <h2 className="text-4xl md:text-5xl mb-6 font-light" style={{ color: palette.primary }}>
          Confirmación de Asistencia
        </h2>
        <p className="text-lg mb-8 font-light" style={{ color: palette.textLight }}>
          {data.rsvpMessage || 'Por favor confirma tu asistencia antes de la fecha indicada'}
        </p>
        <div className="rounded-3xl p-8 shadow-lg" style={{ backgroundColor: 'white' }}>
          <p className="text-sm mb-6 font-light" style={{ color: palette.textLight }}>
            Ingresa tu nombre completo y código de invitación para confirmar tu asistencia:
          </p>
          <div className="space-y-4">
            <input
              type="text"
              placeholder="Nombre Completo"
              className="w-full px-4 py-3 rounded-xl border-2 border-border focus:outline-none focus:border-current transition-colors"
              style={{ borderColor: palette.secondary }}
            />
            <input
              type="text"
              placeholder="Código de Invitación"
              className="w-full px-4 py-3 rounded-xl border-2 border-border focus:outline-none focus:border-current transition-colors"
              style={{ borderColor: palette.secondary }}
            />
            <button
              className="w-full px-6 py-4 rounded-full text-white font-light transition-all hover:shadow-lg"
              style={{ backgroundColor: palette.primary }}>
              Confirmar Asistencia
            </button>
          </div>
        </div>
      </div>
    </section>
  );
}

// Footer
export function FooterSection({ data, palette }: SectionProps) {
  return (
    <footer className="py-12 px-4 text-center" style={{ backgroundColor: palette.primary, color: 'white' }}>
      <h2 className="text-4xl mb-2 font-light" style={{ fontFamily: "'Great Vibes', cursive" }}>
        {data.groomName} & {data.brideName}
      </h2>
      <p className="text-lg mb-4 font-light">
        {new Date(data.eventDate).toLocaleDateString('es-MX', {
          day: 'numeric',
          month: 'long',
          year: 'numeric',
        })}
      </p>
      <p className="font-light">¡Esperamos celebrar nuestro día especial contigo!</p>
    </footer>
  );
}
