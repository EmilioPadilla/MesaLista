import React, { useEffect } from 'react';
import { ColorPalette } from '../InvitationEditor/InvitationSectionManager';

interface SectionProps {
  data: any;
  palette: ColorPalette;
}

// Header Section - Floral Romance with romantic, floral styling
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
          ? `linear-gradient(rgba(255, 255, 255, 0.7), rgba(255, 255, 255, 0.7)), url(${data.headerBackgroundImage})`
          : `radial-gradient(circle at top left, ${palette.secondary} 0%, ${palette.background} 40%, ${palette.secondary} 100%)`,
        backgroundSize: 'cover',
        backgroundPosition: 'center',
        color: palette.text,
      }}>
      {/* Floral decorative elements */}
      <div className="absolute top-0 left-0 text-9xl opacity-10">🌸</div>
      <div className="absolute top-10 right-10 text-8xl opacity-10">🌹</div>
      <div className="absolute bottom-0 right-0 text-9xl opacity-10">🌺</div>
      <div className="absolute bottom-10 left-10 text-8xl opacity-10">🌷</div>
      <div className="absolute top-1/3 left-1/4 text-6xl opacity-5">🌼</div>
      <div className="absolute bottom-1/3 right-1/4 text-6xl opacity-5">🌻</div>

      <div className="relative z-10 max-w-4xl">
        {/* Floral divider */}
        <div className="text-4xl mb-6" style={{ color: palette.primary }}>
          ✿ ❀ ✿
        </div>

        <h1
          className="text-6xl md:text-8xl mb-8 font-light italic"
          style={{
            fontFamily: "'Dancing Script', cursive",
            color: palette.primary,
          }}>
          {data.brideName} & {data.groomName}
        </h1>

        <p className="text-2xl md:text-3xl mb-6 font-light italic" style={{ color: palette.accent }}>
          Celebrando nuestro amor
        </p>

        <div className="text-lg md:text-xl mb-12 font-light" style={{ color: palette.textLight }}>
          {data.eventDate
            ? new Date(data.eventDate).toLocaleDateString('es-MX', {
                day: 'numeric',
                month: 'long',
                year: 'numeric',
              })
            : 'Fecha del evento'}{' '}
          {data.location && `• ${data.location}`}
        </div>

        {/* Floral divider */}
        <div className="text-3xl mb-8" style={{ color: palette.primary }}>
          ❀ ✿ ❀ ✿ ❀
        </div>

        {/* Romantic countdown */}
        {data.showCountdown !== 'false' && (
          <div className="grid grid-cols-4 gap-4 max-w-2xl mx-auto">
            {[
              { value: countdown.days, label: 'Días', flower: '🌹' },
              { value: countdown.hours, label: 'Horas', flower: '🌸' },
              { value: countdown.minutes, label: 'Minutos', flower: '🌺' },
              { value: countdown.seconds, label: 'Segundos', flower: '🌷' },
            ].map((item, idx) => (
              <div
                key={idx}
                className="p-4 rounded-3xl shadow-lg"
                style={{ backgroundColor: 'white', border: `2px solid ${palette.secondary}` }}>
                <div className="text-2xl mb-1">{item.flower}</div>
                <div className="text-3xl md:text-4xl font-light mb-1" style={{ color: palette.primary }}>
                  {String(item.value).padStart(2, '0')}
                </div>
                <div className="text-xs md:text-sm font-light" style={{ color: palette.textLight }}>
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

// Presentation Section - Parents with Floral Theme
export function PresentationSection({ data, palette }: SectionProps) {
  return (
    <section className="py-20 px-4" style={{ backgroundColor: palette.background }}>
      <div className="max-w-4xl mx-auto text-center">
        <div className="text-5xl mb-4" style={{ color: palette.primary }}>
          ✿ ❀ ✿
        </div>
        <h2
          className="text-4xl md:text-5xl mb-16 font-light italic"
          style={{ fontFamily: "'Dancing Script', cursive", color: palette.primary }}>
          Con la bendición de nuestros padres
        </h2>

        <div className="grid md:grid-cols-2 gap-12 mb-12">
          <div className="space-y-6">
            <div className="text-4xl" style={{ color: palette.primary }}>
              🌹
            </div>
            <h3 className="text-2xl font-light italic" style={{ fontFamily: "'Dancing Script', cursive", color: palette.accent }}>
              Padres de la Novia
            </h3>
            <div className="space-y-3">
              <p className="text-xl font-light" style={{ color: palette.text }}>
                {data.brideMother || 'Madre de la novia'}
              </p>
              <p className="text-xl font-light" style={{ color: palette.text }}>
                {data.brideFather || 'Padre de la novia'}
              </p>
            </div>
          </div>

          <div className="space-y-6">
            <div className="text-4xl" style={{ color: palette.accent }}>
              🌸
            </div>
            <h3 className="text-2xl font-light italic" style={{ fontFamily: "'Dancing Script', cursive", color: palette.accent }}>
              Padres del Novio
            </h3>
            <div className="space-y-3">
              <p className="text-xl font-light" style={{ color: palette.text }}>
                {data.groomMother || 'Madre del novio'}
              </p>
              <p className="text-xl font-light" style={{ color: palette.text }}>
                {data.groomFather || 'Padre del novio'}
              </p>
            </div>
          </div>
        </div>

        <div className="text-4xl" style={{ color: palette.primary }}>
          ❀ ✿ ❀
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
        <div className="text-5xl mb-4 text-center" style={{ color: palette.primary }}>
          ✿ ❀ ✿
        </div>
        <h2
          className="text-4xl md:text-5xl mb-12 font-light italic text-center"
          style={{ fontFamily: "'Dancing Script', cursive", color: palette.primary }}>
          Detalles del Evento
        </h2>

        <div className="grid md:grid-cols-2 gap-8">
          {data.ceremonyVenue && (
            <div className="rounded-3xl p-10 text-center shadow-xl" style={{ backgroundColor: 'white' }}>
              <div className="text-6xl mb-6">🌹</div>
              <h3 className="text-3xl mb-4 font-light italic" style={{ fontFamily: "'Dancing Script', cursive", color: palette.primary }}>
                Ceremonia
              </h3>
              <h4 className="text-xl mb-2 font-light" style={{ color: palette.text }}>
                {data.ceremonyVenue}
              </h4>
              <p className="text-4xl font-light mb-6" style={{ color: palette.accent }}>
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
                  className="inline-block px-8 py-3 rounded-full text-white font-light transition-all hover:shadow-lg"
                  style={{ backgroundColor: palette.primary }}>
                  Ver Ubicación
                </a>
              )}
            </div>
          )}

          {data.receptionVenue && (
            <div className="rounded-3xl p-10 text-center shadow-xl" style={{ backgroundColor: 'white' }}>
              <div className="text-6xl mb-6">🌸</div>
              <h3 className="text-3xl mb-4 font-light italic" style={{ fontFamily: "'Dancing Script', cursive", color: palette.accent }}>
                Recepción
              </h3>
              <h4 className="text-xl mb-2 font-light" style={{ color: palette.text }}>
                {data.receptionVenue}
              </h4>
              <p className="text-4xl font-light mb-6" style={{ color: palette.primary }}>
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
                  className="inline-block px-8 py-3 rounded-full text-white font-light transition-all hover:shadow-lg"
                  style={{ backgroundColor: palette.accent }}>
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
        <div className="text-5xl mb-4" style={{ color: palette.primary }}>
          ✿ ❀ ✿
        </div>
        <h2
          className="text-4xl md:text-5xl mb-12 font-light italic"
          style={{ fontFamily: "'Dancing Script', cursive", color: palette.primary }}>
          Código de Vestimenta
        </h2>

        <div className="grid md:grid-cols-2 gap-8">
          <div className="p-10 rounded-3xl shadow-lg" style={{ backgroundColor: 'white', border: `3px solid ${palette.secondary}` }}>
            <div className="text-6xl mb-6">🤵</div>
            <h3 className="text-2xl mb-4 font-light italic" style={{ fontFamily: "'Dancing Script', cursive", color: palette.primary }}>
              Caballeros
            </h3>
            <p className="text-lg mb-2 font-light" style={{ color: palette.text }}>
              {data.dressCodeMen || 'Formal de noche'}
            </p>
            {data.dressCodeMenNote && (
              <p className="text-sm italic font-light" style={{ color: palette.textLight }}>
                {data.dressCodeMenNote}
              </p>
            )}
          </div>

          <div className="p-10 rounded-3xl shadow-lg" style={{ backgroundColor: 'white', border: `3px solid ${palette.secondary}` }}>
            <div className="text-6xl mb-6">👰</div>
            <h3 className="text-2xl mb-4 font-light italic" style={{ fontFamily: "'Dancing Script', cursive", color: palette.accent }}>
              Damas
            </h3>
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
        <div className="text-5xl mb-4 text-center" style={{ color: palette.primary }}>
          ✿ ❀ ✿
        </div>
        <h2
          className="text-4xl md:text-5xl mb-12 font-light italic text-center"
          style={{ fontFamily: "'Dancing Script', cursive", color: palette.primary }}>
          Cronograma
        </h2>

        <div className="space-y-6">
          {scheduleItems.map((item: any, index: number) => (
            <div key={index} className="flex items-center gap-6 p-6 rounded-3xl shadow-md" style={{ backgroundColor: 'white' }}>
              <div className="text-center min-w-[100px] p-4 rounded-2xl" style={{ backgroundColor: palette.secondary }}>
                <div className="text-3xl font-light" style={{ color: palette.primary }}>
                  {item.time}
                </div>
              </div>
              <div className="flex-1">
                <p className="text-xl font-light" style={{ color: palette.text }}>
                  {item.activity}
                </p>
              </div>
              <div className="text-3xl">{index % 4 === 0 ? '🌹' : index % 4 === 1 ? '🌸' : index % 4 === 2 ? '🌺' : '🌷'}</div>
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
        <div className="text-5xl mb-4 text-center" style={{ color: palette.primary }}>
          ✿ ❀ ✿
        </div>
        <h2
          className="text-4xl md:text-5xl mb-12 font-light italic text-center"
          style={{ fontFamily: "'Dancing Script', cursive", color: palette.primary }}>
          Hospedaje
        </h2>

        {data.accommodationCode && (
          <div
            className="text-center mb-12 p-8 rounded-3xl max-w-2xl mx-auto shadow-lg"
            style={{ backgroundColor: 'white', border: `3px solid ${palette.secondary}` }}>
            <div className="text-4xl mb-2">🏨</div>
            <p className="text-lg mb-2 font-light" style={{ color: palette.textLight }}>
              Código de Reservación
            </p>
            <p className="text-3xl font-light" style={{ color: palette.primary }}>
              {data.accommodationCode}
            </p>
          </div>
        )}

        <div
          className={`grid ${hotels.length === 1 ? 'md:grid-cols-1' : hotels.length === 2 ? 'md:grid-cols-2' : 'md:grid-cols-2 lg:grid-cols-3'} gap-8`}>
          {hotels.map((hotel: any, index: number) => (
            <div
              key={index}
              className="rounded-3xl overflow-hidden shadow-xl"
              style={{ backgroundColor: 'white', border: `3px solid ${palette.secondary}` }}>
              {hotel.image && <img src={hotel.image} alt={hotel.name} className="w-full h-48 object-cover" />}
              <div className="p-6">
                <h3 className="text-xl font-light mb-2" style={{ color: palette.primary }}>
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
                  className="inline-block px-4 py-2 rounded-full text-white text-sm font-light"
                  style={{ backgroundColor: palette.primary }}>
                  📞 {hotel.phone}
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
    <section className="py-20 px-4" style={{ background: `linear-gradient(135deg, ${palette.primary}, ${palette.accent})` }}>
      <div className="max-w-4xl mx-auto text-center text-white">
        <div className="text-7xl mb-6">🎁</div>
        <div className="text-4xl mb-6">✿ ❀ ✿</div>
        <h2 className="text-4xl md:text-5xl mb-6 font-light italic" style={{ fontFamily: "'Dancing Script', cursive" }}>
          Mesa de Regalos
        </h2>
        <p className="text-lg mb-12 leading-relaxed max-w-2xl mx-auto font-light">
          {data.giftsMessage ||
            'Tu presencia es nuestro mejor regalo, pero si deseas obsequiarnos algo, aquí te compartimos nuestras opciones.'}
        </p>

        <div className={`grid ${!data.bankAccount && !data.clabe ? 'grid-cols-1' : 'md:grid-cols-2'} gap-6 max-w-3xl mx-auto`}>
          {data.bankAccount && (
            <div
              className="p-8 rounded-3xl backdrop-blur-sm shadow-xl"
              style={{ backgroundColor: 'rgba(255,255,255,0.15)', border: '2px solid rgba(255,255,255,0.3)' }}>
              <div className="text-5xl mb-4">💳</div>
              <h3 className="text-xl font-light mb-4">Transferencia Bancaria</h3>
              <p className="text-sm mb-2 font-light">{data.bankAccount}</p>
              {data.clabe && <p className="text-lg font-mono font-light">{data.clabe}</p>}
            </div>
          )}

          <a
            href={`/${data.userSlug}/regalos?listId=${data.giftListId}`}
            className="p-8 rounded-3xl backdrop-blur-sm hover:scale-105 transition-transform shadow-xl"
            style={{ backgroundColor: 'rgba(255,255,255,0.15)', border: '2px solid rgba(255,255,255,0.3)' }}>
            <div className="text-5xl mb-4">🌸</div>
            <h3 className="text-xl font-light mb-4">Mesa de Regalos Digital</h3>
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
        <div className="text-5xl mb-4 text-center" style={{ color: palette.primary }}>
          ✿ ❀ ✿
        </div>
        <h2
          className="text-4xl md:text-5xl mb-12 font-light italic text-center"
          style={{ fontFamily: "'Dancing Script', cursive", color: palette.primary }}>
          Galería de Recuerdos
        </h2>

        <div
          className={`grid ${galleryItems.length === 1 ? 'grid-cols-1' : galleryItems.length === 2 ? 'grid-cols-2' : 'grid-cols-2 md:grid-cols-3'} gap-4`}>
          {galleryItems.map((item: any, index: number) => (
            <div
              key={index}
              className="aspect-square rounded-3xl overflow-hidden shadow-lg hover:scale-105 transition-transform"
              style={{ border: `4px solid ${palette.secondary}` }}>
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
        <div className="text-4xl mb-6" style={{ color: palette.primary }}>
          ✿ ❀ ✿
        </div>
        <h2
          className="text-4xl md:text-5xl mb-6 font-light italic"
          style={{ fontFamily: "'Dancing Script', cursive", color: palette.primary }}>
          Confirma tu Asistencia
        </h2>
        <p className="text-lg mb-12 font-light" style={{ color: palette.textLight }}>
          {data.rsvpMessage || 'Por favor confirma tu asistencia antes de la fecha indicada'}
        </p>

        <a
          href={`/${data.userSlug}/rsvp?listId=${data.giftListId}`}
          className="inline-block px-12 py-4 rounded-full text-white text-xl font-light hover:shadow-xl transition-all"
          style={{ backgroundColor: palette.primary }}>
          Confirmar Asistencia
        </a>
      </div>
    </section>
  );
}

// Footer Section
export function FooterSection({ data, palette }: SectionProps) {
  return (
    <footer className="py-12 px-4 text-center" style={{ backgroundColor: palette.secondary }}>
      <div className="max-w-4xl mx-auto">
        <div className="text-4xl mb-4" style={{ color: palette.primary }}>
          ✿ ❀ ✿
        </div>
        <p className="text-2xl font-light italic mb-2" style={{ fontFamily: "'Dancing Script', cursive", color: palette.primary }}>
          {data.brideName} & {data.groomName}
        </p>
        <p className="text-sm font-light" style={{ color: palette.textLight }}>
          {data.eventDate ? new Date(data.eventDate).getFullYear() : new Date().getFullYear()}
        </p>
      </div>
    </footer>
  );
}
