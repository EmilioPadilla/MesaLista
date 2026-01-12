import { useState } from 'react';
import { Button, Card, Badge, Input, Empty, Typography } from 'antd';
import { Plus, Search, Calendar, Eye, Edit, Share2 } from 'lucide-react';
import { Heart, PartyPopper, Baby, GraduationCap, Gift } from 'lucide-react';
import type { Invitation } from 'src/app/routes/couple/Invitations';

const { Text } = Typography;

interface InvitationsDashboardProps {
  invitations: Invitation[];
  onCreateNew: () => void;
  onEditInvitation: (invitation: Invitation) => void;
  onPreviewPublic: (slug: string) => void;
}

const getTemplateIcon = (templateId: string) => {
  switch (templateId) {
    case 'elegant-wedding':
      return Heart;
    case 'modern-birthday':
      return PartyPopper;
    case 'baby-shower':
      return Baby;
    case 'graduation':
      return GraduationCap;
    default:
      return Gift;
  }
};

export function InvitationsDashboard({ invitations, onCreateNew, onEditInvitation, onPreviewPublic }: InvitationsDashboardProps) {
  const [searchQuery, setSearchQuery] = useState('');

  const handleCopyLink = (slug: string) => {
    const url = `${window.location.origin}/invitaciones/${slug}`;
    navigator.clipboard.writeText(url);
  };

  const filteredInvitations = invitations.filter(
    (inv) =>
      inv.eventName.toLowerCase().includes(searchQuery.toLowerCase()) || inv.data.title?.toLowerCase().includes(searchQuery.toLowerCase()),
  );

  return (
    <div className="min-h-screen bg-[#f5f5f7]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* Header */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-6 mb-12">
          <div>
            <h1 className="text-4xl font-light text-foreground mb-2">Mis Invitaciones</h1>
            <p className="text-muted-foreground font-light">Gestiona tus invitaciones digitales</p>
          </div>
          <Button
            onClick={onCreateNew}
            type="primary"
            className="bg-[#007aff] hover:bg-[#0051d0] rounded-full font-light px-6"
            size="large"
            icon={<Plus className="h-5 w-5" />}>
            Nueva Invitación
          </Button>
        </div>

        {/* Search Bar */}
        <div className="mb-8">
          <Input
            placeholder="Buscar invitaciones..."
            prefix={<Search className="h-5 w-5 text-muted-foreground" />}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="bg-white border-0 rounded-xl shadow-sm"
            size="large"
          />
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
          <Card className="border-0 shadow-sm bg-white rounded-2xl">
            <div className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <Text className="text-sm! text-muted-foreground! font-light! block mb-1">Total</Text>
                  <Text className="text-3xl! font-light! block">{invitations.length}</Text>
                </div>
                <div className="w-12 h-12 bg-[#f5f5f7] rounded-full flex items-center justify-center">
                  <Calendar className="h-6 w-6 text-[#007aff]" />
                </div>
              </div>
            </div>
          </Card>

          <Card className="border-0 shadow-sm bg-white rounded-2xl">
            <div className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <Text className="text-sm! text-muted-foreground! font-light! block mb-1">Publicadas</Text>
                  <Text className="text-3xl! font-light! block">{invitations.filter((inv) => inv.status === 'published').length}</Text>
                </div>
                <div className="w-12 h-12 bg-[#e8f5e9] rounded-full flex items-center justify-center">
                  <Eye className="h-6 w-6 text-[#34c759]" />
                </div>
              </div>
            </div>
          </Card>

          <Card className="border-0 shadow-sm bg-white rounded-2xl">
            <div className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <Text className="text-sm! text-muted-foreground! font-light! block mb-1">Borradores</Text>
                  <Text className="text-3xl! font-light! block">{invitations.filter((inv) => inv.status === 'draft').length}</Text>
                </div>
                <div className="w-12 h-12 bg-[#fff3e0] rounded-full flex items-center justify-center">
                  <Edit className="h-6 w-6 text-[#ff9500]" />
                </div>
              </div>
            </div>
          </Card>
        </div>

        {/* Invitations Grid */}
        {filteredInvitations.length === 0 ? (
          <Empty
            image={<Calendar className="h-24 w-24 text-muted-foreground mx-auto" />}
            description={
              <div className="text-center">
                <h3 className="text-2xl font-light text-foreground mb-3">
                  {searchQuery ? 'No se encontraron invitaciones' : 'No tienes invitaciones'}
                </h3>
                <p className="text-muted-foreground font-light mb-8">
                  {searchQuery ? 'Intenta con otro término de búsqueda' : 'Comienza creando tu primera invitación digital'}
                </p>
              </div>
            }>
            {!searchQuery && (
              <Button
                onClick={onCreateNew}
                type="primary"
                className="bg-[#007aff] hover:bg-[#0051d0] rounded-full font-light"
                size="large"
                icon={<Plus className="h-5 w-5" />}>
                Crear Invitación
              </Button>
            )}
          </Empty>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {filteredInvitations.map((invitation) => {
              const IconComponent = getTemplateIcon(invitation.templateId);

              return (
                <Card
                  key={invitation.id}
                  className="border-0 shadow-md hover:shadow-xl transition-all duration-300 rounded-2xl overflow-hidden group cursor-pointer">
                  {/* Thumbnail Preview */}
                  <div className="relative h-48 bg-gradient-to-br from-[#faf0f0] to-[#f5f5f7] flex items-center justify-center overflow-hidden">
                    <div className="text-center p-6">
                      <IconComponent className="h-16 w-16 text-[#007aff] mx-auto mb-4 opacity-50" />
                      <h3 className="text-2xl font-light text-foreground">{invitation.data.title}</h3>
                    </div>
                    <div className="absolute top-4 right-4">
                      <Badge
                        color={invitation.status === 'published' ? 'green' : 'orange'}
                        text={invitation.status === 'published' ? 'Publicada' : 'Borrador'}
                      />
                    </div>
                  </div>

                  <div className="p-6">
                    <h4 className="text-lg font-medium text-foreground mb-2">{invitation.eventName}</h4>
                    <p className="text-sm text-muted-foreground font-light mb-1">
                      {invitation.data.date &&
                        new Date(invitation.data.date).toLocaleDateString('es-MX', {
                          year: 'numeric',
                          month: 'long',
                          day: 'numeric',
                        })}
                    </p>
                    <p className="text-sm text-muted-foreground font-light mb-6">{invitation.data.location}</p>
                    {/* Action Buttons */}
                    <div className="flex gap-2">
                      <Button
                        onClick={() => onEditInvitation(invitation)}
                        className="flex-1 border-[#007aff] text-[#007aff] hover:bg-[#007aff] hover:text-white rounded-full font-light transition-all duration-200"
                        icon={<Edit className="h-4 w-4" />}>
                        Editar
                      </Button>

                      {invitation.status === 'published' && (
                        <>
                          <Button
                            onClick={() => onPreviewPublic(invitation.slug)}
                            className="border-border hover:bg-[#f5f5f7] rounded-full font-light transition-all duration-200"
                            icon={<Eye className="h-4 w-4" />}
                          />
                          <Button
                            onClick={() => handleCopyLink(invitation.slug)}
                            className="border-border hover:bg-[#f5f5f7] rounded-full font-light transition-all duration-200"
                            icon={<Share2 className="h-4 w-4" />}
                          />
                        </>
                      )}
                    </div>
                  </div>
                </Card>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
