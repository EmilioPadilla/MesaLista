import React, { useEffect } from 'react';
import { ColorPalette } from '../InvitationEditor/InvitationSectionManager';

interface SectionProps {
  data: any;
  palette: ColorPalette;
}

// Header Section - Anniversary with elegant golden theme
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
          ? `linear-gradient(rgba(0, 0, 0, 0.3), rgba(0, 0, 0, 0.3)), url(${data.headerBackgroundImage})`
          : `linear-gradient(135deg, ${palette.background} 0%, ${palette.secondary} 50%, ${palette.background} 100%)`,
        backgroundSize: 'cover',
        backgroundPosition: 'center',
        color: data.headerBackgroundImage ? '#ffffff' : palette.text,
      }}>
      {/* Decorative golden rings */}
      <div className="absolute top-10 left-10 w-24 h-24 rounded-full border-4 opacity-20" style={{ borderColor: palette.primary }} />
      <div className="absolute top-16 left-16 w-20 h-20 rounded-full border-4 opacity-20" style={{ borderColor: palette.accent }} />
      <div className="absolute bottom-10 right-10 w-32 h-32 rounded-full border-4 opacity-20" style={{ borderColor: palette.primary }} />
      <div className="absolute bottom-16 right-16 w-24 h-24 rounded-full border-4 opacity-20" style={{ borderColor: palette.accent }} />

      <div className="relative z-10 max-w-4xl">
        {/* Anniversary number */}
        <div className="mb-8">
          <div
            className="text-8xl md:text-9xl font-bold inline-block px-8 py-4 rounded-2xl"
            style={{
              background: `linear-gradient(135deg, ${palette.primary}, ${palette.accent})`,
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              backgroundClip: 'text',
            }}>
            {data.anniversaryYears || '25'}
          </div>
        </div>

        <h1
          className="text-4xl md:text-6xl mb-6 font-serif"
          style={{
            fontFamily: "'Playfair Display', serif",
            color: data.headerBackgroundImage ? '#ffffff' : palette.primary,
          }}>
          {data.brideName} & {data.groomName}
        </h1>

        <p
          className="text-2xl md:text-3xl mb-4 font-light italic"
          style={{ color: data.headerBackgroundImage ? '#ffffff' : palette.accent }}>
          Celebrando {data.anniversaryYears || '25'} años de amor
        </p>

        <div className="text-lg md:text-xl mb-12 font-light" style={{ color: data.headerBackgroundImage ? '#ffffff' : palette.textLight }}>
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
          <div className="grid grid-cols-4 gap-4 max-w-xl mx-auto">
            {[
              { value: countdown.days, label: 'Días' },
              { value: countdown.hours, label: 'Horas' },
              { value: countdown.minutes, label: 'Minutos' },
              { value: countdown.seconds, label: 'Segundos' },
            ].map((item, idx) => (
              <div
                key={idx}
                className="p-4 rounded-xl backdrop-blur-sm"
                style={{ backgroundColor: data.headerBackgroundImage ? 'rgba(255,255,255,0.1)' : palette.secondary }}>
                <div
                  className="text-3xl md:text-4xl font-bold mb-1"
                  style={{ color: data.headerBackgroundImage ? '#ffffff' : palette.primary }}>
                  {String(item.value).padStart(2, '0')}
                </div>
                <div
                  className="text-xs md:text-sm font-light"
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

// Presentation Section - Love Story Timeline
export function PresentationSection({ data, palette }: SectionProps) {
  return (
    <section className="py-20 px-4" style={{ backgroundColor: palette.background }}>
      <div className="max-w-4xl mx-auto">
        <h2
          className="text-4xl md:text-5xl mb-16 font-serif text-center"
          style={{ fontFamily: "'Playfair Display', serif", color: palette.primary }}>
          Nuestra Historia de Amor
        </h2>

        <div className="relative">
          {/* Timeline line */}
          <div className="absolute left-1/2 transform -translate-x-1/2 h-full w-1" style={{ backgroundColor: palette.secondary }} />

          {/* Timeline items */}
          <div className="space-y-16">
            <div className="flex items-center gap-8">
              <div className="flex-1 text-right">
                <h3 className="text-2xl font-serif mb-2" style={{ color: palette.primary }}>
                  Nos conocimos
                </h3>
                <p className="text-lg" style={{ color: palette.textLight }}>
                  {data.brideMother || 'Primer encuentro'}
                </p>
              </div>
              <div
                className="w-6 h-6 rounded-full border-4 z-10"
                style={{ borderColor: palette.primary, backgroundColor: palette.background }}
              />
              <div className="flex-1" />
            </div>

            <div className="flex items-center gap-8">
              <div className="flex-1" />
              <div
                className="w-6 h-6 rounded-full border-4 z-10"
                style={{ borderColor: palette.accent, backgroundColor: palette.background }}
              />
              <div className="flex-1">
                <h3 className="text-2xl font-serif mb-2" style={{ color: palette.accent }}>
                  Nuestra Boda
                </h3>
                <p className="text-lg" style={{ color: palette.textLight }}>
                  {data.brideFather || 'El día que dijimos "Sí, acepto"'}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-8">
              <div className="flex-1 text-right">
                <h3 className="text-2xl font-serif mb-2" style={{ color: palette.primary }}>
                  Hoy
                </h3>
                <p className="text-lg" style={{ color: palette.textLight }}>
                  {data.groomMother || `${data.anniversaryYears || '25'} años de amor y felicidad`}
                </p>
              </div>
              <div
                className="w-6 h-6 rounded-full border-4 z-10"
                style={{ borderColor: palette.primary, backgroundColor: palette.background }}
              />
              <div className="flex-1" />
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
        <h2
          className="text-4xl md:text-5xl mb-12 font-serif text-center"
          style={{ fontFamily: "'Playfair Display', serif", color: palette.primary }}>
          Detalles de la Celebración
        </h2>

        <div className="grid md:grid-cols-2 gap-8">
          {data.ceremonyVenue && (
            <div className="rounded-3xl p-8 text-center shadow-xl" style={{ backgroundColor: 'white' }}>
              <div className="text-6xl mb-4">🎊</div>
              <h3 className="text-3xl mb-4 font-serif" style={{ color: palette.primary }}>
                Ceremonia
              </h3>
              <h4 className="text-xl mb-2 font-medium" style={{ color: palette.text }}>
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
                  className="inline-block px-6 py-3 rounded-full text-white font-medium transition-all hover:shadow-lg"
                  style={{ backgroundColor: palette.primary }}>
                  Ver Ubicación
                </a>
              )}
            </div>
          )}

          {data.receptionVenue && (
            <div className="rounded-3xl p-8 text-center shadow-xl" style={{ backgroundColor: 'white' }}>
              <div className="text-6xl mb-4">🥂</div>
              <h3 className="text-3xl mb-4 font-serif" style={{ color: palette.accent }}>
                Recepción
              </h3>
              <h4 className="text-xl mb-2 font-medium" style={{ color: palette.text }}>
                {data.receptionVenue}
              </h4>
              <p className="text-4xl font-light mb-6" style={{ color: palette.primary }}>
                {data.receptionTime}
              </p>
              {data.receptionAddress && (
                <a
                  href={data.receptionMapLink}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-block px-6 py-3 rounded-full text-white font-medium transition-all hover:shadow-lg"
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
        <h2 className="text-4xl md:text-5xl mb-12 font-serif" style={{ fontFamily: "'Playfair Display', serif", color: palette.primary }}>
          Código de Vestimenta
        </h2>

        <div className="grid md:grid-cols-2 gap-8">
          <div className="p-8 rounded-2xl" style={{ backgroundColor: palette.secondary }}>
            <div className="text-5xl mb-4">👔</div>
            <h3 className="text-2xl mb-4 font-semibold" style={{ color: palette.primary }}>
              Caballeros
            </h3>
            <p className="text-lg mb-2" style={{ color: palette.text }}>
              {data.dressCodeMen || 'Formal de noche'}
            </p>
            {data.dressCodeMenNote && (
              <p className="text-sm italic" style={{ color: palette.textLight }}>
                {data.dressCodeMenNote}
              </p>
            )}
          </div>

          <div className="p-8 rounded-2xl" style={{ backgroundColor: palette.secondary }}>
            <div className="text-5xl mb-4">👗</div>
            <h3 className="text-2xl mb-4 font-semibold" style={{ color: palette.accent }}>
              Damas
            </h3>
            <p className="text-lg mb-2" style={{ color: palette.text }}>
              {data.dressCodeWomen || 'Formal de noche'}
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
          className="text-4xl md:text-5xl mb-12 font-serif text-center"
          style={{ fontFamily: "'Playfair Display', serif", color: palette.primary }}>
          Cronograma
        </h2>

        <div className="space-y-6">
          {scheduleItems.map((item: any, index: number) => (
            <div key={index} className="flex items-center gap-6 p-6 rounded-2xl shadow-md" style={{ backgroundColor: 'white' }}>
              <div className="text-center min-w-[100px]">
                <div className="text-3xl font-bold" style={{ color: palette.primary }}>
                  {item.time}
                </div>
              </div>
              <div className="h-12 w-1 rounded-full" style={{ backgroundColor: palette.accent }} />
              <div className="flex-1">
                <p className="text-xl font-medium" style={{ color: palette.text }}>
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
        <h2
          className="text-4xl md:text-5xl mb-12 font-serif text-center"
          style={{ fontFamily: "'Playfair Display', serif", color: palette.primary }}>
          Hospedaje
        </h2>

        {data.accommodationCode && (
          <div className="text-center mb-12 p-6 rounded-2xl max-w-2xl mx-auto" style={{ backgroundColor: palette.secondary }}>
            <p className="text-lg mb-2" style={{ color: palette.textLight }}>
              Código de Reservación
            </p>
            <p className="text-3xl font-bold" style={{ color: palette.primary }}>
              {data.accommodationCode}
            </p>
          </div>
        )}

        <div
          className={`grid ${hotels.length === 1 ? 'md:grid-cols-1' : hotels.length === 2 ? 'md:grid-cols-2' : 'md:grid-cols-2 lg:grid-cols-3'} gap-8`}>
          {hotels.map((hotel: any, index: number) => (
            <div key={index} className="rounded-2xl overflow-hidden shadow-lg" style={{ backgroundColor: 'white' }}>
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
                  className="inline-block px-4 py-2 rounded-full text-white text-sm font-medium"
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
        <div className="text-6xl mb-6">🎁</div>
        <h2 className="text-4xl md:text-5xl mb-6 font-serif" style={{ fontFamily: "'Playfair Display', serif" }}>
          Mesa de Regalos
        </h2>
        <p className="text-lg mb-12 leading-relaxed max-w-2xl mx-auto">
          {data.giftsMessage ||
            'Tu presencia es nuestro mejor regalo, pero si deseas obsequiarnos algo, aquí te compartimos nuestras opciones.'}
        </p>

        <div className={`grid ${!data.bankAccount && !data.clabe ? 'grid-cols-1' : 'md:grid-cols-2'} gap-6 max-w-3xl mx-auto`}>
          {data.bankAccount && (
            <div className="p-8 rounded-2xl backdrop-blur-sm" style={{ backgroundColor: 'rgba(255,255,255,0.1)' }}>
              <div className="text-4xl mb-4">🏦</div>
              <h3 className="text-xl font-semibold mb-4">Transferencia Bancaria</h3>
              <p className="text-sm mb-2">{data.bankAccount}</p>
              {data.clabe && <p className="text-lg font-mono">{data.clabe}</p>}
            </div>
          )}

          <a
            href={`/${data.userSlug}/regalos?listId=${data.giftListId}`}
            className="p-8 rounded-2xl backdrop-blur-sm hover:scale-105 transition-transform"
            style={{ backgroundColor: 'rgba(255,255,255,0.1)' }}>
            <div className="text-4xl mb-4">🎀</div>
            <h3 className="text-xl font-semibold mb-4">Mesa de Regalos Digital</h3>
            <p className="text-sm">Ver lista de regalos →</p>
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
          className="text-4xl md:text-5xl mb-12 font-serif text-center"
          style={{ fontFamily: "'Playfair Display', serif", color: palette.primary }}>
          Momentos Especiales
        </h2>

        <div
          className={`grid ${galleryItems.length === 1 ? 'grid-cols-1' : galleryItems.length === 2 ? 'grid-cols-2' : 'grid-cols-2 md:grid-cols-3'} gap-4`}>
          {galleryItems.map((item: any, index: number) => (
            <div
              key={index}
              className="aspect-square rounded-2xl overflow-hidden shadow-lg hover:scale-105 transition-transform"
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
        <h2 className="text-4xl md:text-5xl mb-6 font-serif" style={{ fontFamily: "'Playfair Display', serif", color: palette.primary }}>
          Confirma tu Asistencia
        </h2>
        <p className="text-lg mb-12" style={{ color: palette.textLight }}>
          {data.rsvpMessage || 'Por favor confirma tu asistencia antes de la fecha indicada'}
        </p>

        <a
          href={`/${data.userSlug}/rsvp?listId=${data.giftListId}`}
          className="inline-block px-12 py-4 rounded-full text-white text-xl font-semibold hover:shadow-xl transition-all"
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
        <p className="text-2xl font-serif mb-4" style={{ fontFamily: "'Playfair Display', serif", color: palette.primary }}>
          {data.brideName} & {data.groomName}
        </p>
        <p className="text-sm" style={{ color: palette.textLight }}>
          {data.anniversaryYears || '25'} años de amor •{' '}
          {data.eventDate ? new Date(data.eventDate).getFullYear() : new Date().getFullYear()}
        </p>
      </div>
    </footer>
  );
}
