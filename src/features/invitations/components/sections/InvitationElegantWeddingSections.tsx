import React, { useEffect } from 'react';
import { ColorPalette } from '../InvitationEditor/InvitationSectionManager';

interface SectionProps {
  data: any;
  palette: ColorPalette;
}

// Header Section - Elegant Wedding with classic, sophisticated styling
export function HeaderSection({ data, palette }: SectionProps) {
  const [countdown, setCountdown] = React.useState({ days: 0, hours: 0, minutes: 0, seconds: 0 });

  useEffect(() => {
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
      className="min-h-screen flex flex-col items-center justify-center text-center px-4 py-16 relative overflow-hidden"
      style={{
        backgroundImage: data.headerBackgroundImage
          ? `linear-gradient(rgba(0, 0, 0, 0.2), rgba(0, 0, 0, 0.2)), url(${data.headerBackgroundImage})`
          : `linear-gradient(to bottom, ${palette.background} 0%, ${palette.secondary} 100%)`,
        backgroundSize: 'cover',
        backgroundPosition: 'center',
        color: data.headerBackgroundImage ? '#ffffff' : palette.text,
      }}>
      {/* Elegant decorative borders */}
      <div className="absolute top-0 left-0 right-0 h-1" style={{ backgroundColor: palette.primary }} />
      <div className="absolute bottom-0 left-0 right-0 h-1" style={{ backgroundColor: palette.primary }} />
      <div className="absolute top-0 bottom-0 left-0 w-1" style={{ backgroundColor: palette.primary }} />
      <div className="absolute top-0 bottom-0 right-0 w-1" style={{ backgroundColor: palette.primary }} />

      {/* Corner ornaments */}
      <div className="absolute top-8 left-8 w-16 h-16 border-t-2 border-l-2 opacity-30" style={{ borderColor: palette.primary }} />
      <div className="absolute top-8 right-8 w-16 h-16 border-t-2 border-r-2 opacity-30" style={{ borderColor: palette.primary }} />
      <div className="absolute bottom-8 left-8 w-16 h-16 border-b-2 border-l-2 opacity-30" style={{ borderColor: palette.primary }} />
      <div className="absolute bottom-8 right-8 w-16 h-16 border-b-2 border-r-2 opacity-30" style={{ borderColor: palette.primary }} />

      <div className="relative z-10 max-w-4xl">
        {/* Elegant monogram */}
        <div
          className="text-7xl mb-8 font-serif"
          style={{
            fontFamily: "'Cormorant Garamond', serif",
            color: data.headerBackgroundImage ? '#ffffff' : palette.primary,
          }}>
          {data.brideName?.charAt(0) || 'A'} & {data.groomName?.charAt(0) || 'C'}
        </div>

        <div className="mb-6" style={{ color: data.headerBackgroundImage ? '#ffffff' : palette.accent }}>
          ━━━━━━━━━━━━━━━━━━━━
        </div>

        <h1
          className="text-5xl md:text-7xl mb-8 font-serif tracking-wide"
          style={{
            fontFamily: "'Cormorant Garamond', serif",
            color: data.headerBackgroundImage ? '#ffffff' : palette.primary,
          }}>
          {data.brideName} & {data.groomName}
        </h1>

        <p
          className="text-xl md:text-2xl mb-6 font-light tracking-widest uppercase"
          style={{ color: data.headerBackgroundImage ? '#ffffff' : palette.textLight }}>
          Tienen el honor de invitarte
        </p>

        <div className="mb-6" style={{ color: data.headerBackgroundImage ? '#ffffff' : palette.accent }}>
          ━━━━━━━━━━━━━━━━━━━━
        </div>

        <div className="text-lg md:text-xl mb-12 font-light" style={{ color: data.headerBackgroundImage ? '#ffffff' : palette.text }}>
          {data.eventDate
            ? new Date(data.eventDate).toLocaleDateString('es-MX', {
                day: 'numeric',
                month: 'long',
                year: 'numeric',
              })
            : 'Fecha del evento'}{' '}
          {data.location && `• ${data.location}`}
        </div>

        {/* Sophisticated countdown */}
        {data.showCountdown !== 'false' && (
          <div className="grid grid-cols-4 gap-6 max-w-2xl mx-auto">
            {[
              { value: countdown.days, label: 'Días' },
              { value: countdown.hours, label: 'Horas' },
              { value: countdown.minutes, label: 'Minutos' },
              { value: countdown.seconds, label: 'Segundos' },
            ].map((item, idx) => (
              <div
                key={idx}
                className="p-4 border-2"
                style={{ borderColor: data.headerBackgroundImage ? 'rgba(255,255,255,0.3)' : palette.secondary }}>
                <div
                  className="text-3xl md:text-4xl font-serif mb-1"
                  style={{
                    fontFamily: "'Cormorant Garamond', serif",
                    color: data.headerBackgroundImage ? '#ffffff' : palette.primary,
                  }}>
                  {String(item.value).padStart(2, '0')}
                </div>
                <div
                  className="text-xs md:text-sm font-light tracking-widest uppercase"
                  style={{ color: data.headerBackgroundImage ? '#ffffff' : palette.textLight }}>
                  {item.label}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </header>
  );
}

// Presentation Section - Parents with Classic Elegance
export function PresentationSection({ data, palette }: SectionProps) {
  return (
    <section className="py-20 px-4" style={{ backgroundColor: palette.background }}>
      <div className="max-w-4xl mx-auto text-center">
        <div className="mb-6" style={{ color: palette.accent }}>
          ━━━━━━━━━━━━━━━━━━━━
        </div>
        <h2
          className="text-4xl md:text-5xl mb-16 font-serif tracking-wide"
          style={{ fontFamily: "'Cormorant Garamond', serif", color: palette.primary }}>
          Con la bendición de nuestros padres
        </h2>
        <div className="mb-6" style={{ color: palette.accent }}>
          ━━━━━━━━━━━━━━━━━━━━
        </div>

        <div className="grid md:grid-cols-2 gap-16 mt-12">
          <div className="space-y-6">
            <div className="border-b-2 pb-4 mb-6" style={{ borderColor: palette.secondary }}>
              <h3 className="text-2xl font-serif mb-2" style={{ fontFamily: "'Cormorant Garamond', serif", color: palette.primary }}>
                Padres de la Novia
              </h3>
            </div>
            <div className="space-y-4">
              <p className="text-xl font-light" style={{ color: palette.text }}>
                {data.brideMother || 'Madre de la novia'}
              </p>
              <p className="text-xl font-light" style={{ color: palette.text }}>
                {data.brideFather || 'Padre de la novia'}
              </p>
            </div>
          </div>

          <div className="space-y-6">
            <div className="border-b-2 pb-4 mb-6" style={{ borderColor: palette.secondary }}>
              <h3 className="text-2xl font-serif mb-2" style={{ fontFamily: "'Cormorant Garamond', serif", color: palette.primary }}>
                Padres del Novio
              </h3>
            </div>
            <div className="space-y-4">
              <p className="text-xl font-light" style={{ color: palette.text }}>
                {data.groomMother || 'Madre del novio'}
              </p>
              <p className="text-xl font-light" style={{ color: palette.text }}>
                {data.groomFather || 'Padre del novio'}
              </p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

// Event Section
export function EventSection({ data, palette }: SectionProps) {
  return (
    <section className="py-20 px-4" style={{ background: `linear-gradient(to bottom, ${palette.secondary}, ${palette.background})` }}>
      <div className="max-w-6xl mx-auto">
        <div className="mb-6 text-center" style={{ color: palette.accent }}>
          ━━━━━━━━━━━━━━━━━━━━
        </div>
        <h2
          className="text-4xl md:text-5xl mb-12 font-serif tracking-wide text-center"
          style={{ fontFamily: "'Cormorant Garamond', serif", color: palette.primary }}>
          Detalles del Evento
        </h2>
        <div className="mb-12 text-center" style={{ color: palette.accent }}>
          ━━━━━━━━━━━━━━━━━━━━
        </div>

        <div className="grid md:grid-cols-2 gap-12">
          {data.ceremonyVenue && (
            <div className="p-10 text-center border-2" style={{ backgroundColor: 'white', borderColor: palette.secondary }}>
              <div className="text-6xl mb-6" style={{ color: palette.primary }}>
                ⛪
              </div>
              <h3 className="text-3xl mb-4 font-serif" style={{ fontFamily: "'Cormorant Garamond', serif", color: palette.primary }}>
                Ceremonia Religiosa
              </h3>
              <div className="mb-6" style={{ color: palette.accent }}>
                ━━━━━━━━━━━━
              </div>
              <h4 className="text-xl mb-2 font-light" style={{ color: palette.text }}>
                {data.ceremonyVenue}
              </h4>
              <p className="text-4xl font-serif mb-6" style={{ fontFamily: "'Cormorant Garamond', serif", color: palette.accent }}>
                {data.ceremonyTime}
              </p>
              {data.ceremonyAddress && (
                <p className="text-sm mb-6 font-light" style={{ color: palette.textLight }}>
                  {data.ceremonyAddress}
                </p>
              )}
              {data.ceremonyMapLink && (
                <a
                  href={data.ceremonyMapLink}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-block px-8 py-3 border-2 text-sm font-light tracking-widest uppercase transition-all hover:text-white"
                  style={{ borderColor: palette.primary, color: palette.primary, backgroundColor: 'transparent' }}
                  onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = palette.primary)}
                  onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = 'transparent')}>
                  Ver Ubicación
                </a>
              )}
            </div>
          )}

          {data.receptionVenue && (
            <div className="p-10 text-center border-2" style={{ backgroundColor: 'white', borderColor: palette.secondary }}>
              <div className="text-6xl mb-6" style={{ color: palette.accent }}>
                🥂
              </div>
              <h3 className="text-3xl mb-4 font-serif" style={{ fontFamily: "'Cormorant Garamond', serif", color: palette.accent }}>
                Recepción
              </h3>
              <div className="mb-6" style={{ color: palette.accent }}>
                ━━━━━━━━━━━━
              </div>
              <h4 className="text-xl mb-2 font-light" style={{ color: palette.text }}>
                {data.receptionVenue}
              </h4>
              <p className="text-4xl font-serif mb-6" style={{ fontFamily: "'Cormorant Garamond', serif", color: palette.primary }}>
                {data.receptionTime}
              </p>
              {data.receptionAddress && (
                <p className="text-sm mb-6 font-light" style={{ color: palette.textLight }}>
                  {data.receptionAddress}
                </p>
              )}
              {data.receptionMapLink && (
                <a
                  href={data.receptionMapLink}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-block px-8 py-3 border-2 text-sm font-light tracking-widest uppercase transition-all hover:text-white"
                  style={{ borderColor: palette.accent, color: palette.accent, backgroundColor: 'transparent' }}
                  onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = palette.accent)}
                  onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = 'transparent')}>
                  Ver Ubicación
                </a>
              )}
            </div>
          )}
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
        <div className="mb-6" style={{ color: palette.accent }}>
          ━━━━━━━━━━━━━━━━━━━━
        </div>
        <h2
          className="text-4xl md:text-5xl mb-12 font-serif tracking-wide"
          style={{ fontFamily: "'Cormorant Garamond', serif", color: palette.primary }}>
          Código de Vestimenta
        </h2>
        <div className="mb-12" style={{ color: palette.accent }}>
          ━━━━━━━━━━━━━━━━━━━━
        </div>

        <div className="grid md:grid-cols-2 gap-12">
          <div className="p-10 border-2" style={{ backgroundColor: 'white', borderColor: palette.secondary }}>
            <div className="text-6xl mb-6">🤵</div>
            <h3 className="text-2xl mb-4 font-serif" style={{ fontFamily: "'Cormorant Garamond', serif", color: palette.primary }}>
              Caballeros
            </h3>
            <div className="mb-4" style={{ color: palette.accent }}>
              ━━━━━━━━
            </div>
            <p className="text-lg mb-2 font-light" style={{ color: palette.text }}>
              {data.dressCodeMen || 'Formal de noche'}
            </p>
            {data.dressCodeMenNote && (
              <p className="text-sm italic font-light" style={{ color: palette.textLight }}>
                {data.dressCodeMenNote}
              </p>
            )}
          </div>

          <div className="p-10 border-2" style={{ backgroundColor: 'white', borderColor: palette.secondary }}>
            <div className="text-6xl mb-6">👰</div>
            <h3 className="text-2xl mb-4 font-serif" style={{ fontFamily: "'Cormorant Garamond', serif", color: palette.accent }}>
              Damas
            </h3>
            <div className="mb-4" style={{ color: palette.accent }}>
              ━━━━━━━━
            </div>
            <p className="text-lg mb-2 font-light" style={{ color: palette.text }}>
              {data.dressCodeWomen || 'Formal de noche'}
            </p>
            {data.dressCodeWomenNote && (
              <p className="text-sm italic font-light" style={{ color: palette.textLight }}>
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
    <section className="py-20 px-4" style={{ background: `linear-gradient(to bottom, ${palette.secondary}, ${palette.background})` }}>
      <div className="max-w-3xl mx-auto">
        <div className="mb-6 text-center" style={{ color: palette.accent }}>
          ━━━━━━━━━━━━━━━━━━━━
        </div>
        <h2
          className="text-4xl md:text-5xl mb-12 font-serif tracking-wide text-center"
          style={{ fontFamily: "'Cormorant Garamond', serif", color: palette.primary }}>
          Cronograma del Día
        </h2>
        <div className="mb-12 text-center" style={{ color: palette.accent }}>
          ━━━━━━━━━━━━━━━━━━━━
        </div>

        <div className="space-y-6">
          {scheduleItems.map((item: any, index: number) => (
            <div
              key={index}
              className="flex items-center gap-6 p-6 border-2"
              style={{ backgroundColor: 'white', borderColor: palette.secondary }}>
              <div className="text-center min-w-[120px] border-r-2 pr-6" style={{ borderColor: palette.secondary }}>
                <div className="text-3xl font-serif" style={{ fontFamily: "'Cormorant Garamond', serif", color: palette.primary }}>
                  {item.time}
                </div>
              </div>
              <div className="flex-1">
                <p className="text-xl font-light" style={{ color: palette.text }}>
                  {item.activity}
                </p>
              </div>
            </div>
          ))}
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
        <div className="mb-6 text-center" style={{ color: palette.accent }}>
          ━━━━━━━━━━━━━━━━━━━━
        </div>
        <h2
          className="text-4xl md:text-5xl mb-12 font-serif tracking-wide text-center"
          style={{ fontFamily: "'Cormorant Garamond', serif", color: palette.primary }}>
          Hospedaje Sugerido
        </h2>
        <div className="mb-12 text-center" style={{ color: palette.accent }}>
          ━━━━━━━━━━━━━━━━━━━━
        </div>

        {data.accommodationCode && (
          <div
            className="text-center mb-12 p-8 border-2 max-w-2xl mx-auto"
            style={{ backgroundColor: 'white', borderColor: palette.secondary }}>
            <div className="text-4xl mb-4" style={{ color: palette.primary }}>
              🏨
            </div>
            <p className="text-lg mb-2 font-light tracking-widest uppercase" style={{ color: palette.textLight }}>
              Código de Reservación
            </p>
            <p className="text-3xl font-serif" style={{ fontFamily: "'Cormorant Garamond', serif", color: palette.primary }}>
              {data.accommodationCode}
            </p>
          </div>
        )}

        <div
          className={`grid ${hotels.length === 1 ? 'md:grid-cols-1' : hotels.length === 2 ? 'md:grid-cols-2' : 'md:grid-cols-2 lg:grid-cols-3'} gap-8`}>
          {hotels.map((hotel: any, index: number) => (
            <div key={index} className="border-2 overflow-hidden" style={{ backgroundColor: 'white', borderColor: palette.secondary }}>
              {hotel.image && <img src={hotel.image} alt={hotel.name} className="w-full h-48 object-cover" />}
              <div className="p-6">
                <h3 className="text-xl font-serif mb-2" style={{ fontFamily: "'Cormorant Garamond', serif", color: palette.primary }}>
                  {hotel.name}
                </h3>
                <div className="flex items-center gap-1 mb-2">
                  {[...Array(hotel.stars || 5)].map((_, i) => (
                    <span key={i} style={{ color: palette.accent }}>
                      ⭐
                    </span>
                  ))}
                </div>
                <p className="text-sm mb-2 font-light" style={{ color: palette.textLight }}>
                  📍 {hotel.distance}
                </p>
                {hotel.amenities && (
                  <p className="text-sm mb-4 font-light" style={{ color: palette.textLight }}>
                    {hotel.amenities}
                  </p>
                )}
                <a
                  href={`tel:${hotel.phone}`}
                  className="inline-block px-4 py-2 border text-sm font-light tracking-widest uppercase"
                  style={{ borderColor: palette.primary, color: palette.primary }}>
                  📞 Llamar
                </a>
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
  return (
    <section className="py-20 px-4" style={{ background: `linear-gradient(to bottom, ${palette.primary}, ${palette.accent})` }}>
      <div className="max-w-4xl mx-auto text-center text-white">
        <div className="text-7xl mb-6">🎁</div>
        <div className="mb-6">━━━━━━━━━━━━━━━━━━━━</div>
        <h2 className="text-4xl md:text-5xl mb-6 font-serif tracking-wide" style={{ fontFamily: "'Cormorant Garamond', serif" }}>
          Mesa de Regalos
        </h2>
        <div className="mb-12">━━━━━━━━━━━━━━━━━━━━</div>
        <p className="text-lg mb-12 leading-relaxed max-w-2xl mx-auto font-light">
          {data.giftsMessage ||
            'Tu presencia es nuestro mejor regalo, pero si deseas obsequiarnos algo, aquí te compartimos nuestras opciones.'}
        </p>

        <div className={`grid ${!data.bankAccount && !data.clabe ? 'grid-cols-1' : 'md:grid-cols-2'} gap-8 max-w-3xl mx-auto`}>
          {data.bankAccount && (
            <div className="p-8 border-2 border-white/30" style={{ backgroundColor: 'rgba(255,255,255,0.1)' }}>
              <div className="text-5xl mb-4">💳</div>
              <h3 className="text-xl font-serif mb-4 tracking-widest uppercase" style={{ fontFamily: "'Cormorant Garamond', serif" }}>
                Transferencia
              </h3>
              <p className="text-sm mb-2 font-light">{data.bankAccount}</p>
              {data.clabe && <p className="text-lg font-mono font-light">{data.clabe}</p>}
            </div>
          )}

          <a
            href={`/${data.userSlug}/regalos?listId=${data.giftListId}`}
            className="p-8 border-2 border-white/30 hover:bg-white/20 transition-all"
            style={{ backgroundColor: 'rgba(255,255,255,0.1)' }}>
            <div className="text-5xl mb-4">🎀</div>
            <h3 className="text-xl font-serif mb-4 tracking-widest uppercase" style={{ fontFamily: "'Cormorant Garamond', serif" }}>
              Mesa Digital
            </h3>
            <p className="text-sm font-light">Ver lista de regalos →</p>
          </a>
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
        <div className="mb-6 text-center" style={{ color: palette.accent }}>
          ━━━━━━━━━━━━━━━━━━━━
        </div>
        <h2
          className="text-4xl md:text-5xl mb-12 font-serif tracking-wide text-center"
          style={{ fontFamily: "'Cormorant Garamond', serif", color: palette.primary }}>
          Galería de Momentos
        </h2>
        <div className="mb-12 text-center" style={{ color: palette.accent }}>
          ━━━━━━━━━━━━━━━━━━━━
        </div>

        <div
          className={`grid ${galleryItems.length === 1 ? 'grid-cols-1' : galleryItems.length === 2 ? 'grid-cols-2' : 'grid-cols-2 md:grid-cols-3'} gap-6`}>
          {galleryItems.map((item: any, index: number) => (
            <div
              key={index}
              className="aspect-square overflow-hidden border-4 hover:scale-105 transition-transform"
              style={{ borderColor: palette.secondary }}>
              <img src={item.url} alt={`Galería ${index + 1}`} className="w-full h-full object-cover" />
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
    <section className="py-20 px-4" style={{ background: `linear-gradient(to bottom, ${palette.secondary}, ${palette.background})` }}>
      <div className="max-w-2xl mx-auto text-center">
        <div className="text-7xl mb-6">✉️</div>
        <div className="mb-6" style={{ color: palette.accent }}>
          ━━━━━━━━━━━━━━━━━━━━
        </div>
        <h2
          className="text-4xl md:text-5xl mb-6 font-serif tracking-wide"
          style={{ fontFamily: "'Cormorant Garamond', serif", color: palette.primary }}>
          Confirma tu Asistencia
        </h2>
        <div className="mb-12" style={{ color: palette.accent }}>
          ━━━━━━━━━━━━━━━━━━━━
        </div>
        <p className="text-lg mb-12 font-light" style={{ color: palette.textLight }}>
          {data.rsvpMessage || 'Por favor confirma tu asistencia antes de la fecha indicada'}
        </p>

        <a
          href={`/${data.userSlug}/rsvp?listId=${data.giftListId}`}
          className="inline-block px-12 py-4 border-2 text-lg font-light tracking-widest uppercase transition-all hover:text-white"
          style={{ borderColor: palette.primary, color: palette.primary, backgroundColor: 'transparent' }}
          onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = palette.primary)}
          onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = 'transparent')}>
          Confirmar Asistencia
        </a>
      </div>
    </section>
  );
}

// Footer Section
export function FooterSection({ data, palette }: SectionProps) {
  return (
    <footer className="py-12 px-4 text-center border-t-2" style={{ backgroundColor: palette.secondary, borderColor: palette.primary }}>
      <div className="max-w-4xl mx-auto">
        <div className="mb-4" style={{ color: palette.accent }}>
          ━━━━━━━━━━━━━━━━━━━━
        </div>
        <p className="text-2xl font-serif mb-2" style={{ fontFamily: "'Cormorant Garamond', serif", color: palette.primary }}>
          {data.brideName} & {data.groomName}
        </p>
        <p className="text-sm font-light tracking-widest uppercase" style={{ color: palette.textLight }}>
          {data.eventDate ? new Date(data.eventDate).getFullYear() : new Date().getFullYear()}
        </p>
      </div>
    </footer>
  );
}
