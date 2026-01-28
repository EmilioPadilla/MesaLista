import React, { useEffect } from 'react';
import { ColorPalette } from '../InvitationEditor/InvitationSectionManager';

interface SectionProps {
  data: any;
  palette: ColorPalette;
}

// Header Section - Baby Shower with soft, playful styling
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
          ? `linear-gradient(rgba(255, 255, 255, 0.8), rgba(255, 255, 255, 0.8)), url(${data.headerBackgroundImage})`
          : `radial-gradient(circle at top right, ${palette.secondary} 0%, ${palette.background} 50%, ${palette.accent}20 100%)`,
        backgroundSize: 'cover',
        backgroundPosition: 'center',
        color: palette.text,
      }}>
      {/* Playful decorative elements */}
      <div className="absolute top-10 left-10 text-6xl opacity-20">🍼</div>
      <div className="absolute top-20 right-20 text-5xl opacity-20">👶</div>
      <div className="absolute bottom-20 left-20 text-5xl opacity-20">🎈</div>
      <div className="absolute bottom-10 right-10 text-6xl opacity-20">🧸</div>
      <div className="absolute top-1/2 left-10 text-4xl opacity-10">⭐</div>
      <div className="absolute top-1/3 right-10 text-4xl opacity-10">🌙</div>

      <div className="relative z-10 max-w-3xl">
        {/* Baby icon */}
        <div className="text-8xl mb-6">👶</div>

        <h1
          className="text-5xl md:text-7xl mb-6 font-bold"
          style={{
            fontFamily: "'Quicksand', sans-serif",
            color: palette.primary,
          }}>
          ¡Un Bebé en Camino!
        </h1>

        <p className="text-2xl md:text-3xl mb-4 font-medium" style={{ color: palette.accent }}>
          {data.brideName || 'Mamá'} {data.groomName && `& ${data.groomName}`}
        </p>

        <p className="text-xl md:text-2xl mb-8 font-light" style={{ color: palette.textLight }}>
          Te invitan a celebrar la llegada de su pequeño tesoro
        </p>

        <div className="text-lg md:text-xl mb-12 font-medium" style={{ color: palette.text }}>
          {data.eventDate
            ? new Date(data.eventDate).toLocaleDateString('es-MX', {
                day: 'numeric',
                month: 'long',
                year: 'numeric',
              })
            : 'Fecha del evento'}{' '}
          {data.location && `• ${data.location}`}
        </div>

        {/* Countdown */}
        {data.showCountdown !== 'false' && (
          <div className="grid grid-cols-4 gap-3 max-w-lg mx-auto">
            {[
              { value: countdown.days, label: 'Días', icon: '📅' },
              { value: countdown.hours, label: 'Horas', icon: '⏰' },
              { value: countdown.minutes, label: 'Min', icon: '⏱️' },
              { value: countdown.seconds, label: 'Seg', icon: '⏳' },
            ].map((item, idx) => (
              <div
                key={idx}
                className="p-3 rounded-2xl shadow-lg"
                style={{ backgroundColor: 'white', border: `3px solid ${palette.secondary}` }}>
                <div className="text-2xl mb-1">{item.icon}</div>
                <div className="text-2xl md:text-3xl font-bold mb-1" style={{ color: palette.primary }}>
                  {String(item.value).padStart(2, '0')}
                </div>
                <div className="text-xs font-medium" style={{ color: palette.textLight }}>
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

// Presentation Section - Parents & Baby Info
export function PresentationSection({ data, palette }: SectionProps) {
  return (
    <section className="py-20 px-4" style={{ backgroundColor: palette.background }}>
      <div className="max-w-4xl mx-auto text-center">
        <h2 className="text-4xl md:text-5xl mb-12 font-bold" style={{ fontFamily: "'Quicksand', sans-serif", color: palette.primary }}>
          Los Futuros Papás
        </h2>

        <div className="grid md:grid-cols-2 gap-8 mb-12">
          <div className="p-8 rounded-3xl shadow-lg" style={{ backgroundColor: 'white' }}>
            <div className="text-5xl mb-4">👩</div>
            <h3 className="text-2xl font-bold mb-2" style={{ color: palette.primary }}>
              Mamá
            </h3>
            <p className="text-xl" style={{ color: palette.text }}>
              {data.brideName || 'Nombre de la mamá'}
            </p>
          </div>

          <div className="p-8 rounded-3xl shadow-lg" style={{ backgroundColor: 'white' }}>
            <div className="text-5xl mb-4">👨</div>
            <h3 className="text-2xl font-bold mb-2" style={{ color: palette.accent }}>
              Papá
            </h3>
            <p className="text-xl" style={{ color: palette.text }}>
              {data.groomName || 'Nombre del papá'}
            </p>
          </div>
        </div>

        {/* Baby info */}
        <div className="p-10 rounded-3xl shadow-xl max-w-2xl mx-auto" style={{ backgroundColor: palette.secondary }}>
          <div className="text-6xl mb-4">🎀</div>
          <h3 className="text-3xl font-bold mb-4" style={{ color: palette.primary }}>
            Nuestro Pequeño Tesoro
          </h3>
          <p className="text-lg" style={{ color: palette.textLight }}>
            {data.brideMother || 'Esperamos con amor la llegada de nuestro bebé'}
          </p>
        </div>
      </div>
    </section>
  );
}

// Event Section
export function EventSection({ data, palette }: SectionProps) {
  return (
    <section className="py-20 px-4" style={{ background: `linear-gradient(to bottom, ${palette.secondary}, ${palette.background})` }}>
      <div className="max-w-4xl mx-auto">
        <h2
          className="text-4xl md:text-5xl mb-12 font-bold text-center"
          style={{ fontFamily: "'Quicksand', sans-serif", color: palette.primary }}>
          Detalles del Baby Shower
        </h2>

        <div className="rounded-3xl p-10 text-center shadow-2xl" style={{ backgroundColor: 'white' }}>
          <div className="text-7xl mb-6">🎉</div>

          {data.ceremonyVenue && (
            <>
              <h3 className="text-3xl mb-4 font-bold" style={{ color: palette.primary }}>
                {data.ceremonyVenue}
              </h3>
              <p className="text-5xl font-bold mb-6" style={{ color: palette.accent }}>
                {data.ceremonyTime}
              </p>
            </>
          )}

          {data.ceremonyAddress && (
            <p className="text-lg mb-6" style={{ color: palette.textLight }}>
              📍 {data.ceremonyAddress}
            </p>
          )}

          {data.ceremonyMapLink && (
            <a
              href={data.ceremonyMapLink}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-block px-8 py-4 rounded-full text-white text-lg font-bold transition-all hover:shadow-xl"
              style={{ backgroundColor: palette.primary }}>
              Ver Ubicación en Mapa
            </a>
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
        <h2 className="text-4xl md:text-5xl mb-12 font-bold" style={{ fontFamily: "'Quicksand', sans-serif", color: palette.primary }}>
          Código de Vestimenta
        </h2>

        <div className="grid md:grid-cols-2 gap-8">
          <div className="p-8 rounded-3xl shadow-lg" style={{ backgroundColor: 'white', border: `4px solid ${palette.secondary}` }}>
            <div className="text-6xl mb-4">👔</div>
            <h3 className="text-2xl mb-4 font-bold" style={{ color: palette.primary }}>
              Caballeros
            </h3>
            <p className="text-lg mb-2" style={{ color: palette.text }}>
              {data.dressCodeMen || 'Casual elegante'}
            </p>
            {data.dressCodeMenNote && (
              <p className="text-sm italic" style={{ color: palette.textLight }}>
                {data.dressCodeMenNote}
              </p>
            )}
          </div>

          <div className="p-8 rounded-3xl shadow-lg" style={{ backgroundColor: 'white', border: `4px solid ${palette.accent}20` }}>
            <div className="text-6xl mb-4">👗</div>
            <h3 className="text-2xl mb-4 font-bold" style={{ color: palette.accent }}>
              Damas
            </h3>
            <p className="text-lg mb-2" style={{ color: palette.text }}>
              {data.dressCodeWomen || 'Casual elegante'}
            </p>
            {data.dressCodeWomenNote && (
              <p className="text-sm italic" style={{ color: palette.textLight }}>
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
        <h2
          className="text-4xl md:text-5xl mb-12 font-bold text-center"
          style={{ fontFamily: "'Quicksand', sans-serif", color: palette.primary }}>
          Programa del Día
        </h2>

        <div className="space-y-4">
          {scheduleItems.map((item: any, index: number) => (
            <div key={index} className="flex items-center gap-4 p-6 rounded-2xl shadow-md" style={{ backgroundColor: 'white' }}>
              <div className="text-center min-w-[80px] p-3 rounded-xl" style={{ backgroundColor: palette.secondary }}>
                <div className="text-2xl font-bold" style={{ color: palette.primary }}>
                  {item.time}
                </div>
              </div>
              <div className="flex-1">
                <p className="text-lg font-semibold" style={{ color: palette.text }}>
                  {item.activity}
                </p>
              </div>
              <div className="text-3xl">{index % 3 === 0 ? '🎈' : index % 3 === 1 ? '🎁' : '🍰'}</div>
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
        <h2
          className="text-4xl md:text-5xl mb-12 font-bold text-center"
          style={{ fontFamily: "'Quicksand', sans-serif", color: palette.primary }}>
          Hospedaje Sugerido
        </h2>

        {data.accommodationCode && (
          <div className="text-center mb-12 p-6 rounded-3xl max-w-2xl mx-auto shadow-lg" style={{ backgroundColor: 'white' }}>
            <div className="text-4xl mb-2">🏨</div>
            <p className="text-lg mb-2" style={{ color: palette.textLight }}>
              Código de Reservación
            </p>
            <p className="text-3xl font-bold" style={{ color: palette.primary }}>
              {data.accommodationCode}
            </p>
          </div>
        )}

        <div className={`grid md:grid-cols-${hotels.length} gap-6`}>
          {hotels.map((hotel: any, index: number) => (
            <div key={index} className="rounded-3xl overflow-hidden shadow-xl" style={{ backgroundColor: 'white' }}>
              {hotel.image && <img src={hotel.image} alt={hotel.name} className="w-full h-48 object-cover" />}
              <div className="p-6">
                <h3 className="text-xl font-bold mb-2" style={{ color: palette.primary }}>
                  {hotel.name}
                </h3>
                <div className="flex items-center gap-1 mb-2">
                  {[...Array(hotel.stars || 5)].map((_, i) => (
                    <span key={i} style={{ color: palette.accent }}>
                      ⭐
                    </span>
                  ))}
                </div>
                <p className="text-sm mb-2" style={{ color: palette.textLight }}>
                  📍 {hotel.distance}
                </p>
                {hotel.amenities && (
                  <p className="text-sm mb-4" style={{ color: palette.textLight }}>
                    {hotel.amenities}
                  </p>
                )}
                <a
                  href={`tel:${hotel.phone}`}
                  className="inline-block px-4 py-2 rounded-full text-white text-sm font-bold"
                  style={{ backgroundColor: palette.primary }}>
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
    <section className="py-20 px-4" style={{ background: `radial-gradient(circle, ${palette.primary}, ${palette.accent})` }}>
      <div className="max-w-4xl mx-auto text-center text-white">
        <div className="text-7xl mb-6">🎁</div>
        <h2 className="text-4xl md:text-5xl mb-6 font-bold" style={{ fontFamily: "'Quicksand', sans-serif" }}>
          Mesa de Regalos
        </h2>
        <p className="text-lg mb-12 leading-relaxed max-w-2xl mx-auto">
          {data.giftsMessage ||
            'Tu presencia es nuestro mejor regalo, pero si deseas obsequiarnos algo para nuestro bebé, aquí te compartimos nuestras opciones.'}
        </p>

        <div className={`grid ${!data.bankAccount && !data.clabe ? 'grid-cols-1' : 'md:grid-cols-2'} gap-6 max-w-3xl mx-auto`}>
          {data.bankAccount && (
            <div className="p-8 rounded-3xl backdrop-blur-sm shadow-xl" style={{ backgroundColor: 'rgba(255,255,255,0.15)' }}>
              <div className="text-5xl mb-4">💳</div>
              <h3 className="text-xl font-bold mb-4">Transferencia</h3>
              <p className="text-sm mb-2">{data.bankAccount}</p>
              {data.clabe && <p className="text-lg font-mono">{data.clabe}</p>}
            </div>
          )}

          <a
            href={`/${data.userSlug}/regalos?listId=${data.giftListId}`}
            className="p-8 rounded-3xl backdrop-blur-sm hover:scale-105 transition-transform shadow-xl"
            style={{ backgroundColor: 'rgba(255,255,255,0.15)' }}>
            <div className="text-5xl mb-4">🛍️</div>
            <h3 className="text-xl font-bold mb-4">Mesa Digital</h3>
            <p className="text-sm">Ver lista completa →</p>
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
        <h2
          className="text-4xl md:text-5xl mb-12 font-bold text-center"
          style={{ fontFamily: "'Quicksand', sans-serif", color: palette.primary }}>
          Galería de Momentos
        </h2>

        <div className={`grid md:grid-cols-${galleryItems.length} gap-6`}>
          {galleryItems.map((item: any, index: number) => (
            <div
              key={index}
              className="aspect-square rounded-3xl overflow-hidden shadow-lg hover:scale-105 transition-transform"
              style={{ border: `5px solid ${palette.secondary}` }}>
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
        <h2 className="text-4xl md:text-5xl mb-6 font-bold" style={{ fontFamily: "'Quicksand', sans-serif", color: palette.primary }}>
          Confirma tu Asistencia
        </h2>
        <p className="text-lg mb-12" style={{ color: palette.textLight }}>
          {data.rsvpMessage || 'Nos encantaría contar con tu presencia. Por favor confirma tu asistencia.'}
        </p>

        <a
          href={`/${data.userSlug}/rsvp?listId=${data.giftListId}`}
          className="inline-block px-12 py-4 rounded-full text-white text-xl font-bold hover:shadow-2xl transition-all"
          style={{ backgroundColor: palette.primary }}>
          Confirmar Ahora
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
        <div className="text-4xl mb-4">👶💙💗</div>
        <p className="text-xl font-bold mb-2" style={{ fontFamily: "'Quicksand', sans-serif", color: palette.primary }}>
          {data.brideName} {data.groomName && `& ${data.groomName}`}
        </p>
        <p className="text-sm" style={{ color: palette.textLight }}>
          Baby Shower • {data.eventDate ? new Date(data.eventDate).getFullYear() : new Date().getFullYear()}
        </p>
      </div>
    </footer>
  );
}
