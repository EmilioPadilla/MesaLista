import { Heart, MapPin, Clock, Calendar, Sparkles, PartyPopper, Baby } from 'lucide-react';

interface InvitationPreviewProps {
  templateId: string;
  data: Record<string, string>;
}

export function InvitationPreview({ templateId, data }: InvitationPreviewProps) {
  const formatDate = (dateString: string) => {
    if (!dateString) return '';
    const date = new Date(dateString);
    return date.toLocaleDateString('es-MX', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  const renderTemplate = () => {
    switch (templateId) {
      case 'elegant-wedding':
        return <ElegantWeddingTemplate data={data} formatDate={formatDate} />;
      case 'modern-minimalist':
        return <ModernMinimalistTemplate data={data} formatDate={formatDate} />;
      case 'floral-romance':
        return <FloralRomanceTemplate data={data} formatDate={formatDate} />;
      case 'bold-celebration':
        return <BoldCelebrationTemplate data={data} formatDate={formatDate} />;
      case 'baby-shower-soft':
        return <BabyShowerTemplate data={data} formatDate={formatDate} />;
      case 'anniversary-golden':
        return <AnniversaryTemplate data={data} formatDate={formatDate} />;
      default:
        return <ElegantWeddingTemplate data={data} formatDate={formatDate} />;
    }
  };

  return <div className="bg-white rounded-3xl shadow-2xl overflow-hidden max-w-2xl mx-auto">{renderTemplate()}</div>;
}

// Template Components
interface TemplateProps {
  data: Record<string, string>;
  formatDate: (date: string) => string;
}

function ElegantWeddingTemplate({ data, formatDate }: TemplateProps) {
  return (
    <div className="relative bg-gradient-to-b from-[#faf0f0] to-white p-12 sm:p-16 min-h-[600px] flex flex-col items-center justify-center text-center">
      {/* Decorative Elements */}
      <div className="absolute top-8 left-1/2 transform -translate-x-1/2">
        <div className="w-16 h-16 border-2 border-[#d4a574]/30 rounded-full" />
      </div>

      <div className="space-y-8 max-w-xl">
        {/* Subtitle */}
        {data.subtitle && <p className="text-sm uppercase tracking-[0.3em] text-muted-foreground font-light">{data.subtitle}</p>}

        {/* Names */}
        <div className="space-y-4">
          <Heart className="h-8 w-8 text-rose-400 mx-auto" />
          <h1 className="text-5xl sm:text-6xl font-light text-foreground tracking-tight">{data.title || 'Nombres'}</h1>
        </div>

        {/* Divider */}
        <div className="flex items-center justify-center gap-4">
          <div className="h-px w-16 bg-border" />
          <Sparkles className="h-4 w-4 text-muted-foreground" />
          <div className="h-px w-16 bg-border" />
        </div>

        {/* Event Details */}
        <div className="space-y-4 text-foreground/80">
          {data.date && (
            <div className="flex items-center justify-center gap-3">
              <Calendar className="h-5 w-5 text-muted-foreground" />
              <p className="text-lg font-light capitalize">{formatDate(data.date)}</p>
            </div>
          )}

          {data.time && (
            <div className="flex items-center justify-center gap-3">
              <Clock className="h-5 w-5 text-muted-foreground" />
              <p className="text-lg font-light">{data.time}</p>
            </div>
          )}

          {data.location && (
            <div className="flex items-center justify-center gap-3">
              <MapPin className="h-5 w-5 text-muted-foreground" />
              <p className="text-lg font-light">{data.location}</p>
            </div>
          )}
        </div>

        {/* Message */}
        {data.message && (
          <div className="pt-6 border-t border-border/50">
            <p className="text-base text-muted-foreground font-light italic leading-relaxed">{data.message}</p>
          </div>
        )}
      </div>

      {/* Bottom Decoration */}
      <div className="absolute bottom-8 left-1/2 transform -translate-x-1/2">
        <div className="w-24 h-px bg-border" />
      </div>
    </div>
  );
}

function ModernMinimalistTemplate({ data, formatDate }: TemplateProps) {
  return (
    <div className="bg-white p-12 sm:p-16 min-h-[600px] flex flex-col items-center justify-center">
      <div className="space-y-12 max-w-xl w-full">
        {/* Title */}
        <div className="text-center space-y-3">
          <h1 className="text-6xl sm:text-7xl font-extralight text-foreground tracking-tight">{data.title || data.names || 'Evento'}</h1>
          {data.names && data.title && <p className="text-2xl font-light text-muted-foreground">{data.names}</p>}
        </div>

        {/* Date & Time */}
        <div className="text-center space-y-2 py-8 border-y border-border">
          {data.date && <p className="text-lg font-light text-foreground capitalize">{formatDate(data.date)}</p>}
          {data.time && <p className="text-base text-muted-foreground font-light">{data.time}</p>}
        </div>

        {/* Location */}
        {data.location && (
          <div className="text-center">
            <p className="text-base text-muted-foreground font-light mb-2">Ubicación</p>
            <p className="text-lg text-foreground font-light">{data.location}</p>
          </div>
        )}

        {/* Message */}
        {data.message && (
          <div className="text-center pt-8">
            <p className="text-base text-muted-foreground font-light leading-relaxed">{data.message}</p>
          </div>
        )}
      </div>
    </div>
  );
}

function FloralRomanceTemplate({ data, formatDate }: TemplateProps) {
  return (
    <div className="relative bg-gradient-to-br from-rose-50 via-white to-pink-50 p-12 sm:p-16 min-h-[600px] flex flex-col items-center justify-center">
      {/* Floral Decorations */}
      <div className="absolute top-0 left-0 w-full h-32 bg-gradient-to-b from-rose-100/50 to-transparent" />
      <div className="absolute bottom-0 left-0 w-full h-32 bg-gradient-to-t from-rose-100/50 to-transparent" />

      <div className="space-y-8 max-w-xl text-center relative z-10">
        {/* Subtitle */}
        {data.subtitle && <p className="text-sm uppercase tracking-widest text-rose-600 font-light">{data.subtitle}</p>}

        {/* Names with Floral Accent */}
        <div className="space-y-4">
          <div className="flex items-center justify-center gap-6">
            <div className="w-8 h-8 rounded-full bg-rose-200/50" />
            <Heart className="h-10 w-10 text-rose-400" />
            <div className="w-8 h-8 rounded-full bg-rose-200/50" />
          </div>
          <h1 className="text-5xl sm:text-6xl font-light text-foreground tracking-tight">{data.title || 'Nombres'}</h1>
        </div>

        {/* Event Details */}
        <div className="space-y-6 py-8">
          {data.date && (
            <div className="space-y-1">
              <p className="text-sm text-rose-600 font-light uppercase tracking-wide">Fecha</p>
              <p className="text-lg text-foreground font-light capitalize">{formatDate(data.date)}</p>
            </div>
          )}

          {data.time && (
            <div className="space-y-1">
              <p className="text-sm text-rose-600 font-light uppercase tracking-wide">Hora</p>
              <p className="text-lg text-foreground font-light">{data.time}</p>
            </div>
          )}

          {data.location && (
            <div className="space-y-1">
              <p className="text-sm text-rose-600 font-light uppercase tracking-wide">Lugar</p>
              <p className="text-lg text-foreground font-light">{data.location}</p>
            </div>
          )}
        </div>

        {/* Message */}
        {data.message && (
          <div className="pt-6">
            <p className="text-base text-muted-foreground font-light italic leading-relaxed">{data.message}</p>
          </div>
        )}
      </div>
    </div>
  );
}

function BoldCelebrationTemplate({ data, formatDate }: TemplateProps) {
  return (
    <div className="relative bg-gradient-to-br from-purple-500 via-pink-500 to-orange-400 p-12 sm:p-16 min-h-[600px] flex flex-col items-center justify-center text-white">
      {/* Decorative Elements */}
      <div className="absolute inset-0 opacity-10">
        <div className="absolute top-10 left-10 w-32 h-32 bg-white rounded-full blur-2xl" />
        <div className="absolute bottom-10 right-10 w-40 h-40 bg-yellow-300 rounded-full blur-3xl" />
        <div className="absolute top-1/2 left-1/4 w-24 h-24 bg-pink-300 rounded-full blur-2xl" />
      </div>

      <div className="space-y-8 max-w-xl text-center relative z-10">
        <PartyPopper className="h-16 w-16 mx-auto" />

        <div className="space-y-3">
          <h1 className="text-5xl sm:text-6xl font-bold text-white">{data.title || '¡Estás Invitado!'}</h1>
          {data.subtitle && <p className="text-2xl font-light text-white/90">{data.subtitle}</p>}
        </div>

        <div className="bg-white/20 backdrop-blur-sm rounded-2xl p-8 space-y-4">
          {data.date && (
            <div className="flex items-center justify-center gap-3">
              <Calendar className="h-6 w-6" />
              <p className="text-lg font-light capitalize">{formatDate(data.date)}</p>
            </div>
          )}

          {data.time && (
            <div className="flex items-center justify-center gap-3">
              <Clock className="h-6 w-6" />
              <p className="text-lg font-light">{data.time}</p>
            </div>
          )}

          {data.location && (
            <div className="flex items-center justify-center gap-3">
              <MapPin className="h-6 w-6" />
              <p className="text-lg font-light">{data.location}</p>
            </div>
          )}
        </div>

        {data.message && <p className="text-lg text-white/90 font-light leading-relaxed">{data.message}</p>}
      </div>
    </div>
  );
}

function BabyShowerTemplate({ data, formatDate }: TemplateProps) {
  return (
    <div className="relative bg-gradient-to-b from-blue-50 via-white to-blue-50/50 p-12 sm:p-16 min-h-[600px] flex flex-col items-center justify-center">
      {/* Decorative Clouds */}
      <div className="absolute top-8 left-8 w-20 h-12 bg-blue-100/50 rounded-full blur-sm" />
      <div className="absolute top-12 left-16 w-16 h-10 bg-blue-100/50 rounded-full blur-sm" />
      <div className="absolute top-8 right-8 w-20 h-12 bg-pink-100/50 rounded-full blur-sm" />
      <div className="absolute top-12 right-16 w-16 h-10 bg-pink-100/50 rounded-full blur-sm" />

      <div className="space-y-8 max-w-xl text-center relative z-10">
        <Baby className="h-12 w-12 text-blue-400 mx-auto" />

        <div className="space-y-3">
          <h1 className="text-4xl sm:text-5xl font-light text-foreground">{data.title || 'Baby Shower'}</h1>
          {data.subtitle && <p className="text-xl text-muted-foreground font-light">{data.subtitle}</p>}
        </div>

        {/* Divider */}
        <div className="flex items-center justify-center gap-3">
          <div className="h-px w-12 bg-blue-200" />
          <div className="w-2 h-2 rounded-full bg-blue-300" />
          <div className="h-px w-12 bg-blue-200" />
        </div>

        <div className="space-y-4">
          {data.date && (
            <div className="flex items-center justify-center gap-3">
              <Calendar className="h-5 w-5 text-blue-400" />
              <p className="text-lg font-light text-foreground capitalize">{formatDate(data.date)}</p>
            </div>
          )}

          {data.time && (
            <div className="flex items-center justify-center gap-3">
              <Clock className="h-5 w-5 text-blue-400" />
              <p className="text-lg font-light text-foreground">{data.time}</p>
            </div>
          )}

          {data.location && (
            <div className="flex items-center justify-center gap-3">
              <MapPin className="h-5 w-5 text-blue-400" />
              <p className="text-lg font-light text-foreground">{data.location}</p>
            </div>
          )}
        </div>

        {data.message && (
          <div className="pt-6">
            <p className="text-base text-muted-foreground font-light leading-relaxed">{data.message}</p>
          </div>
        )}
      </div>
    </div>
  );
}

function AnniversaryTemplate({ data, formatDate }: TemplateProps) {
  return (
    <div className="relative bg-gradient-to-b from-amber-50 via-white to-amber-50/30 p-12 sm:p-16 min-h-[600px] flex flex-col items-center justify-center">
      {/* Golden Accents */}
      <div className="absolute inset-0 opacity-5">
        <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-amber-400 to-transparent" />
        <div className="absolute bottom-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-amber-400 to-transparent" />
      </div>

      <div className="space-y-8 max-w-xl text-center relative z-10">
        <Sparkles className="h-12 w-12 text-amber-500 mx-auto" />

        <div className="space-y-4">
          <h1 className="text-5xl sm:text-6xl font-light text-foreground tracking-tight">{data.title || 'Aniversario'}</h1>
          {data.names && <p className="text-2xl text-muted-foreground font-light">{data.names}</p>}
        </div>

        <div className="py-8 space-y-4">
          {data.date && (
            <div className="space-y-1">
              <Calendar className="h-6 w-6 text-amber-500 mx-auto" />
              <p className="text-lg font-light text-foreground capitalize">{formatDate(data.date)}</p>
            </div>
          )}

          {data.time && <p className="text-lg text-muted-foreground font-light">{data.time}</p>}

          {data.location && (
            <div className="pt-4">
              <p className="text-base text-muted-foreground font-light mb-2">Ubicación</p>
              <p className="text-lg text-foreground font-light">{data.location}</p>
            </div>
          )}
        </div>

        {data.message && (
          <div className="pt-6 border-t border-amber-200">
            <p className="text-base text-muted-foreground font-light italic leading-relaxed">{data.message}</p>
          </div>
        )}
      </div>
    </div>
  );
}
