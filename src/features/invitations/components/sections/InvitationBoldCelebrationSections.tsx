import React, { useEffect } from 'react';
import { ColorPalette } from '../InvitationEditor/InvitationSectionManager';

interface SectionProps {
  data: any;
  palette: ColorPalette;
}

// Header Section - Bold Celebration with vibrant, energetic styling
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
        background: data.headerBackgroundImage
          ? `linear-gradient(rgba(156, 39, 176, 0.7), rgba(255, 152, 0, 0.7)), url(${data.headerBackgroundImage})`
          : `linear-gradient(135deg, ${palette.primary} 0%, ${palette.secondary} 50%, ${palette.accent} 100%)`,
        backgroundSize: 'cover',
        backgroundPosition: 'center',
        color: '#ffffff',
      }}>
      {/* Animated geometric shapes */}
      <div className="absolute top-10 left-10 w-32 h-32 rotate-45 opacity-20" style={{ backgroundColor: '#ffffff' }} />
      <div className="absolute top-20 right-20 w-24 h-24 rounded-full opacity-20" style={{ backgroundColor: '#ffffff' }} />
      <div
        className="absolute bottom-20 left-20 w-28 h-28 opacity-20"
        style={{ backgroundColor: '#ffffff', clipPath: 'polygon(50% 0%, 0% 100%, 100% 100%)' }}
      />
      <div className="absolute bottom-10 right-10 w-36 h-36 rotate-12 opacity-20" style={{ backgroundColor: '#ffffff' }} />

      <div className="relative z-10 max-w-4xl">
        {/* Celebration emoji */}
        <div className="text-9xl mb-8 animate-bounce">🎉</div>

        <h1
          className="text-6xl md:text-8xl mb-6 font-black uppercase tracking-tight"
          style={{
            fontFamily: "'Montserrat', sans-serif",
            textShadow: '4px 4px 8px rgba(0,0,0,0.3)',
          }}>
          {data.brideName || '¡CELEBREMOS!'}
        </h1>

        {data.groomName && <p className="text-3xl md:text-4xl mb-8 font-bold">& {data.groomName}</p>}

        <p className="text-2xl md:text-3xl mb-4 font-bold uppercase tracking-wide">¡Estás Invitado!</p>

        <div className="text-xl md:text-2xl mb-12 font-semibold">
          {data.eventDate
            ? new Date(data.eventDate).toLocaleDateString('es-MX', {
                day: 'numeric',
                month: 'long',
                year: 'numeric',
              })
            : 'Fecha del evento'}{' '}
          {data.location && `• ${data.location}`}
        </div>

        {/* Vibrant countdown */}
        {data.showCountdown !== 'false' && (
          <div className="grid grid-cols-4 gap-4 max-w-2xl mx-auto">
            {[
              { value: countdown.days, label: 'DÍAS', color: palette.primary },
              { value: countdown.hours, label: 'HORAS', color: palette.secondary },
              { value: countdown.minutes, label: 'MIN', color: palette.accent },
              { value: countdown.seconds, label: 'SEG', color: palette.primary },
            ].map((item, idx) => (
              <div
                key={idx}
                className="p-4 rounded-2xl backdrop-blur-md transform hover:scale-110 transition-transform shadow-2xl"
                style={{ backgroundColor: 'rgba(255,255,255,0.2)', border: '3px solid rgba(255,255,255,0.3)' }}>
                <div className="text-4xl md:text-5xl font-black mb-1">{String(item.value).padStart(2, '0')}</div>
                <div className="text-xs md:text-sm font-bold tracking-wider">{item.label}</div>
              </div>
            ))}
          </div>
        )}
      </div>
    </header>
  );
}

// Presentation Section - Party Hosts
export function PresentationSection({ data, palette }: SectionProps) {
  return (
    <section className="py-20 px-4" style={{ background: `linear-gradient(135deg, ${palette.background}, ${palette.secondary}20)` }}>
      <div className="max-w-4xl mx-auto text-center">
        <h2
          className="text-5xl md:text-6xl mb-16 font-black uppercase"
          style={{ fontFamily: "'Montserrat', sans-serif", color: palette.primary }}>
          Los Anfitriones
        </h2>

        <div className="grid md:grid-cols-2 gap-8">
          <div
            className="p-10 rounded-3xl shadow-2xl transform hover:rotate-2 transition-transform"
            style={{ background: `linear-gradient(135deg, ${palette.primary}, ${palette.secondary})`, color: '#ffffff' }}>
            <div className="text-7xl mb-4">🎊</div>
            <h3 className="text-3xl font-black mb-2">{data.brideName || 'Anfitrión 1'}</h3>
            {data.brideMother && <p className="text-lg font-medium opacity-90">{data.brideMother}</p>}
          </div>

          <div
            className="p-10 rounded-3xl shadow-2xl transform hover:-rotate-2 transition-transform"
            style={{ background: `linear-gradient(135deg, ${palette.secondary}, ${palette.accent})`, color: '#ffffff' }}>
            <div className="text-7xl mb-4">🎈</div>
            <h3 className="text-3xl font-black mb-2">{data.groomName || 'Anfitrión 2'}</h3>
            {data.groomMother && <p className="text-lg font-medium opacity-90">{data.groomMother}</p>}
          </div>
        </div>
      </div>
    </section>
  );
}

// Event Section
export function EventSection({ data, palette }: SectionProps) {
  return (
    <section className="py-20 px-4" style={{ backgroundColor: palette.background }}>
      <div className="max-w-6xl mx-auto">
        <h2
          className="text-5xl md:text-6xl mb-12 font-black uppercase text-center"
          style={{ fontFamily: "'Montserrat', sans-serif", color: palette.primary }}>
          ¿Dónde es la Fiesta?
        </h2>

        <div className="grid md:grid-cols-2 gap-8">
          {data.ceremonyVenue && (
            <div
              className="rounded-3xl p-10 text-center shadow-2xl transform hover:scale-105 transition-transform"
              style={{ background: `linear-gradient(135deg, ${palette.primary}, ${palette.accent})`, color: '#ffffff' }}>
              <div className="text-7xl mb-6">🎪</div>
              <h3 className="text-4xl mb-4 font-black uppercase">Evento Principal</h3>
              <h4 className="text-2xl mb-4 font-bold">{data.ceremonyVenue}</h4>
              <p className="text-5xl font-black mb-6">{data.ceremonyTime}</p>
              {data.ceremonyAddress && (
                <a
                  href={data.ceremonyMapLink}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-block px-8 py-4 rounded-full font-bold text-lg transition-all hover:shadow-2xl transform hover:scale-110"
                  style={{ backgroundColor: '#ffffff', color: palette.primary }}>
                  📍 Ver Ubicación
                </a>
              )}
            </div>
          )}

          {data.receptionVenue && (
            <div
              className="rounded-3xl p-10 text-center shadow-2xl transform hover:scale-105 transition-transform"
              style={{ background: `linear-gradient(135deg, ${palette.secondary}, ${palette.primary})`, color: '#ffffff' }}>
              <div className="text-7xl mb-6">🎉</div>
              <h3 className="text-4xl mb-4 font-black uppercase">After Party</h3>
              <h4 className="text-2xl mb-4 font-bold">{data.receptionVenue}</h4>
              <p className="text-5xl font-black mb-6">{data.receptionTime}</p>
              {data.receptionAddress && (
                <a
                  href={data.receptionMapLink}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-block px-8 py-4 rounded-full font-bold text-lg transition-all hover:shadow-2xl transform hover:scale-110"
                  style={{ backgroundColor: '#ffffff', color: palette.secondary }}>
                  📍 Ver Ubicación
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
    <section className="py-20 px-4" style={{ background: `linear-gradient(135deg, ${palette.secondary}40, ${palette.background})` }}>
      <div className="max-w-4xl mx-auto text-center">
        <h2
          className="text-5xl md:text-6xl mb-12 font-black uppercase"
          style={{ fontFamily: "'Montserrat', sans-serif", color: palette.primary }}>
          Dress Code
        </h2>

        <div className="grid md:grid-cols-2 gap-8">
          <div className="p-10 rounded-3xl shadow-2xl border-4" style={{ backgroundColor: 'white', borderColor: palette.primary }}>
            <div className="text-7xl mb-6">🕺</div>
            <h3 className="text-3xl mb-4 font-black uppercase" style={{ color: palette.primary }}>
              Ellos
            </h3>
            <p className="text-xl mb-2 font-bold" style={{ color: palette.text }}>
              {data.dressCodeMen || 'Casual chic'}
            </p>
            {data.dressCodeMenNote && (
              <p className="text-sm font-medium" style={{ color: palette.textLight }}>
                {data.dressCodeMenNote}
              </p>
            )}
          </div>

          <div className="p-10 rounded-3xl shadow-2xl border-4" style={{ backgroundColor: 'white', borderColor: palette.accent }}>
            <div className="text-7xl mb-6">💃</div>
            <h3 className="text-3xl mb-4 font-black uppercase" style={{ color: palette.accent }}>
              Ellas
            </h3>
            <p className="text-xl mb-2 font-bold" style={{ color: palette.text }}>
              {data.dressCodeWomen || 'Casual chic'}
            </p>
            {data.dressCodeWomenNote && (
              <p className="text-sm font-medium" style={{ color: palette.textLight }}>
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
    <section className="py-20 px-4" style={{ backgroundColor: palette.background }}>
      <div className="max-w-3xl mx-auto">
        <h2
          className="text-5xl md:text-6xl mb-12 font-black uppercase text-center"
          style={{ fontFamily: "'Montserrat', sans-serif", color: palette.primary }}>
          Programa
        </h2>

        <div className="space-y-6">
          {scheduleItems.map((item: any, index: number) => (
            <div
              key={index}
              className="flex items-center gap-6 p-8 rounded-2xl shadow-xl transform hover:scale-105 transition-transform"
              style={{
                background:
                  index % 2 === 0
                    ? `linear-gradient(135deg, ${palette.primary}, ${palette.secondary})`
                    : `linear-gradient(135deg, ${palette.secondary}, ${palette.accent})`,
                color: '#ffffff',
              }}>
              <div className="text-center min-w-[120px] p-4 rounded-xl" style={{ backgroundColor: 'rgba(255,255,255,0.2)' }}>
                <div className="text-4xl font-black">{item.time}</div>
              </div>
              <div className="flex-1">
                <p className="text-2xl font-black uppercase">{item.activity}</p>
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
    <section className="py-20 px-4" style={{ background: `linear-gradient(to bottom, ${palette.background}, ${palette.secondary}20)` }}>
      <div className="max-w-6xl mx-auto">
        <h2
          className="text-5xl md:text-6xl mb-12 font-black uppercase text-center"
          style={{ fontFamily: "'Montserrat', sans-serif", color: palette.primary }}>
          Hospedaje
        </h2>

        {data.accommodationCode && (
          <div
            className="text-center mb-12 p-8 rounded-3xl max-w-2xl mx-auto shadow-2xl"
            style={{ background: `linear-gradient(135deg, ${palette.primary}, ${palette.accent})`, color: '#ffffff' }}>
            <div className="text-5xl mb-4">🏨</div>
            <p className="text-xl mb-2 font-bold uppercase">Código de Reservación</p>
            <p className="text-4xl font-black">{data.accommodationCode}</p>
          </div>
        )}

        <div
          className={`grid ${hotels.length === 1 ? 'md:grid-cols-1' : hotels.length === 2 ? 'md:grid-cols-2' : 'md:grid-cols-2 lg:grid-cols-3'} gap-8`}>
          {hotels.map((hotel: any, index: number) => (
            <div
              key={index}
              className="rounded-3xl overflow-hidden shadow-2xl transform hover:scale-105 transition-transform"
              style={{ backgroundColor: 'white', border: `4px solid ${palette.primary}` }}>
              {hotel.image && <img src={hotel.image} alt={hotel.name} className="w-full h-48 object-cover" />}
              <div className="p-6">
                <h3 className="text-2xl font-black mb-2" style={{ color: palette.primary }}>
                  {hotel.name}
                </h3>
                <div className="flex items-center gap-1 mb-2">
                  {[...Array(hotel.stars || 5)].map((_, i) => (
                    <span key={i} className="text-xl" style={{ color: palette.accent }}>
                      ⭐
                    </span>
                  ))}
                </div>
                <p className="text-sm mb-2 font-semibold" style={{ color: palette.textLight }}>
                  📍 {hotel.distance}
                </p>
                {hotel.amenities && (
                  <p className="text-sm mb-4" style={{ color: palette.textLight }}>
                    {hotel.amenities}
                  </p>
                )}
                <a
                  href={`tel:${hotel.phone}`}
                  className="inline-block px-6 py-3 rounded-full text-white text-sm font-bold"
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
    <section
      className="py-20 px-4"
      style={{ background: `linear-gradient(135deg, ${palette.primary} 0%, ${palette.secondary} 50%, ${palette.accent} 100%)` }}>
      <div className="max-w-4xl mx-auto text-center text-white">
        <div className="text-8xl mb-8">🎁</div>
        <h2 className="text-5xl md:text-6xl mb-8 font-black uppercase" style={{ fontFamily: "'Montserrat', sans-serif" }}>
          Regalos
        </h2>
        <p className="text-xl mb-12 leading-relaxed max-w-2xl mx-auto font-semibold">
          {data.giftsMessage || '¡Tu presencia es el mejor regalo! Pero si quieres obsequiarnos algo, aquí te dejamos las opciones.'}
        </p>

        <div className={`grid ${!data.bankAccount && !data.clabe ? 'grid-cols-1' : 'md:grid-cols-2'} gap-8 max-w-3xl mx-auto`}>
          {data.bankAccount && (
            <div
              className="p-10 rounded-3xl backdrop-blur-md shadow-2xl border-4 border-white/30"
              style={{ backgroundColor: 'rgba(255,255,255,0.15)' }}>
              <div className="text-6xl mb-6">💳</div>
              <h3 className="text-2xl font-black mb-4 uppercase">Transferencia</h3>
              <p className="text-sm mb-2 font-semibold">{data.bankAccount}</p>
              {data.clabe && <p className="text-lg font-mono font-bold">{data.clabe}</p>}
            </div>
          )}

          <a
            href={`/${data.userSlug}/regalos?listId=${data.giftListId}`}
            className="p-10 rounded-3xl backdrop-blur-md hover:scale-110 transition-transform shadow-2xl border-4 border-white/30"
            style={{ backgroundColor: 'rgba(255,255,255,0.15)' }}>
            <div className="text-6xl mb-6">🛒</div>
            <h3 className="text-2xl font-black mb-4 uppercase">Mesa Digital</h3>
            <p className="text-sm font-bold">Ver Lista Completa →</p>
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
          className="text-5xl md:text-6xl mb-12 font-black uppercase text-center"
          style={{ fontFamily: "'Montserrat', sans-serif", color: palette.primary }}>
          Galería
        </h2>

        <div
          className={`grid ${galleryItems.length === 1 ? 'grid-cols-1' : galleryItems.length === 2 ? 'grid-cols-2' : 'grid-cols-2 md:grid-cols-3'} gap-6`}>
          {galleryItems.map((item: any, index: number) => (
            <div
              key={index}
              className="aspect-square rounded-3xl overflow-hidden shadow-2xl hover:scale-110 transition-transform border-4"
              style={{ borderColor: index % 3 === 0 ? palette.primary : index % 3 === 1 ? palette.secondary : palette.accent }}>
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
    <section className="py-20 px-4" style={{ background: `linear-gradient(to bottom, ${palette.secondary}40, ${palette.background})` }}>
      <div className="max-w-2xl mx-auto text-center">
        <div className="text-8xl mb-8">✉️</div>
        <h2
          className="text-5xl md:text-6xl mb-8 font-black uppercase"
          style={{ fontFamily: "'Montserrat', sans-serif", color: palette.primary }}>
          ¡Confirma Ya!
        </h2>
        <p className="text-xl mb-12 font-bold" style={{ color: palette.textLight }}>
          {data.rsvpMessage || 'No te quedes fuera de la fiesta. Confirma tu asistencia ahora.'}
        </p>

        <a
          href={`/${data.userSlug}/rsvp?listId=${data.giftListId}`}
          className="inline-block px-16 py-5 rounded-full text-white text-2xl font-black uppercase hover:shadow-2xl transition-all transform hover:scale-110"
          style={{ background: `linear-gradient(135deg, ${palette.primary}, ${palette.accent})` }}>
          Confirmar Ahora
        </a>
      </div>
    </section>
  );
}

// Footer Section
export function FooterSection({ data, palette }: SectionProps) {
  return (
    <footer
      className="py-12 px-4 text-center text-white"
      style={{ background: `linear-gradient(135deg, ${palette.primary}, ${palette.accent})` }}>
      <div className="max-w-4xl mx-auto">
        <div className="text-5xl mb-4">🎉🎊🎈</div>
        <p className="text-2xl font-black mb-2 uppercase" style={{ fontFamily: "'Montserrat', sans-serif" }}>
          {data.brideName} {data.groomName && `& ${data.groomName}`}
        </p>
        <p className="text-sm font-bold">{data.eventDate ? new Date(data.eventDate).getFullYear() : new Date().getFullYear()}</p>
      </div>
    </footer>
  );
}
