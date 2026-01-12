import { useState, useEffect } from 'react';
import { Button, Spin, Typography } from 'antd';
import { InvitationPreview } from './InvitationPreview';
import { ArrowLeft, Gift, MapPin, Calendar, Share2 } from 'lucide-react';
import type { Invitation } from 'src/app/routes/couple/Invitations';
import { useNavigate } from 'react-router-dom';

const { Title, Text } = Typography;

interface PublicInvitationProps {
  slug: string;
  onBack?: () => void;
}

// Mock function to fetch invitation by slug
const fetchInvitationBySlug = (slug: string): Invitation | null => {
  const mockInvitations: Record<string, Invitation> = {
    'ana-carlos-boda': {
      id: '1',
      templateId: 'elegant-wedding',
      eventName: 'Boda de Ana y Carlos',
      status: 'published',
      data: {
        title: 'Ana & Carlos',
        subtitle: 'Te invitamos a celebrar nuestra boda',
        date: '2024-06-15',
        time: '18:00',
        location: 'Hacienda San Miguel, Guadalajara',
        message: 'Será un honor contar con tu presencia en este día tan especial para nosotros.',
      },
      createdAt: '2024-01-10T10:00:00Z',
      updatedAt: '2024-01-15T14:30:00Z',
      slug: 'ana-carlos-boda',
    },
    'mi-evento': {
      id: 'demo',
      templateId: 'modern-minimalist',
      eventName: 'Mi Evento',
      status: 'published',
      data: {
        title: 'Evento Especial',
        names: 'Tu Nombre',
        date: '2024-12-31',
        time: '20:00',
        location: 'Ubicación del Evento',
        message: 'Te invitamos a celebrar con nosotros',
      },
      createdAt: '2024-01-10T10:00:00Z',
      updatedAt: '2024-01-10T10:00:00Z',
      slug: 'mi-evento',
    },
  };

  return mockInvitations[slug] || null;
};

export function PublicInvitation({ slug, onBack }: PublicInvitationProps) {
  const navigate = useNavigate();
  const [invitation, setInvitation] = useState<Invitation | null>(null);
  const [loading, setLoading] = useState(true);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    setTimeout(() => {
      const data = fetchInvitationBySlug(slug);
      setInvitation(data);
      setLoading(false);
    }, 300);
  }, [slug]);

  const handleShare = () => {
    const url = `https://mesalista.com/i/${slug}`;

    if (navigator.share) {
      navigator
        .share({
          title: invitation?.eventName || 'Invitación',
          text: invitation?.data.message || 'Te invitamos a nuestro evento',
          url: url,
        })
        .catch(() => {
          handleCopyLink();
        });
    } else {
      handleCopyLink();
    }
  };

  const handleCopyLink = () => {
    const url = `https://mesalista.com/i/${slug}`;
    navigator.clipboard.writeText(url);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleViewRegistry = () => {
    navigate('buy');
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center space-y-4">
          <Spin size="large" />
          <Text className="text-muted-foreground font-light block">Cargando invitación...</Text>
        </div>
      </div>
    );
  }

  if (!invitation) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center space-y-6 max-w-md px-4">
          <div className="w-24 h-24 bg-[#f5f5f7] rounded-full flex items-center justify-center mx-auto">
            <Calendar className="h-12 w-12 text-muted-foreground" />
          </div>
          <Title level={2} className="text-3xl font-light text-foreground">
            Invitación no encontrada
          </Title>
          <Text className="text-muted-foreground font-light block">La invitación que buscas no existe o ha sido eliminada</Text>
          {onBack && (
            <Button
              onClick={onBack}
              className="rounded-full border-border hover:bg-[#f5f5f7] font-light"
              icon={<ArrowLeft className="h-4 w-4" />}>
              Volver
            </Button>
          )}
        </div>
      </div>
    );
  }

  const formatDate = (dateString: string) => {
    if (!dateString) return '';
    return new Date(dateString).toLocaleDateString('es-MX', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  return (
    <div className="min-h-screen bg-[#f5f5f7]">
      {/* Header */}
      <div className="bg-white border-b border-border/30 sticky top-0 z-10">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              {onBack && (
                <Button onClick={onBack} type="text" className="rounded-full hover:bg-[#f5f5f7]" icon={<ArrowLeft className="h-5 w-5" />} />
              )}
              <div>
                <Title level={3} className="text-xl font-light mb-0">
                  {invitation.eventName}
                </Title>
                <Text className="text-sm text-muted-foreground font-light">Invitación Digital</Text>
              </div>
            </div>

            <Button
              onClick={handleShare}
              type="primary"
              className="bg-[#007aff] hover:bg-[#0051d0] rounded-full font-light"
              icon={<Share2 className="h-4 w-4" />}>
              Compartir
            </Button>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* Invitation Preview */}
        <div className="mb-12">
          <InvitationPreview templateId={invitation.templateId} data={invitation.data} />
        </div>

        {/* Event Details Card */}
        <div className="bg-white rounded-2xl shadow-md p-8 mb-8">
          <Title level={4} className="text-xl font-medium text-foreground mb-6">
            Detalles del Evento
          </Title>

          <div className="space-y-6">
            {invitation.data.date && (
              <div className="flex gap-4">
                <div className="w-12 h-12 bg-[#e8f5e9] rounded-full flex items-center justify-center flex-shrink-0">
                  <Calendar className="h-6 w-6 text-[#34c759]" />
                </div>
                <div>
                  <Text className="text-sm text-muted-foreground font-light block mb-1">Fecha y Hora</Text>
                  <Text className="text-base text-foreground font-medium block">{formatDate(invitation.data.date)}</Text>
                  {invitation.data.time && <Text className="text-base text-foreground block">{invitation.data.time}</Text>}
                </div>
              </div>
            )}

            {invitation.data.location && (
              <div className="flex gap-4">
                <div className="w-12 h-12 bg-[#e3f2fd] rounded-full flex items-center justify-center flex-shrink-0">
                  <MapPin className="h-6 w-6 text-[#007aff]" />
                </div>
                <div>
                  <Text className="text-sm text-muted-foreground font-light block mb-1">Ubicación</Text>
                  <Text className="text-base text-foreground font-medium block">{invitation.data.location}</Text>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Gift Registry CTA */}
        <div className="bg-gradient-to-br from-[#007aff] to-[#0051d0] rounded-2xl shadow-lg p-8 text-white text-center">
          <div className="w-16 h-16 bg-white/20 rounded-full flex items-center justify-center mx-auto mb-4">
            <Gift className="h-8 w-8" />
          </div>
          <Title level={3} className="text-2xl font-light text-white mb-2">
            Mesa de Regalos
          </Title>
          <Text className="text-white/90 font-light block mb-6">Ayúdanos a comenzar nuestra nueva vida juntos con tu regalo</Text>
          <Button
            onClick={handleViewRegistry}
            size="large"
            className="bg-white text-[#007aff] hover:bg-white/90 rounded-full font-medium px-8">
            Ver Mesa de Regalos
          </Button>
        </div>

        {/* Share Section */}
        {copied && (
          <div className="mt-6 text-center">
            <Text className="text-sm text-[#34c759] font-light">✓ Enlace copiado al portapapeles</Text>
          </div>
        )}
      </div>
    </div>
  );
}
