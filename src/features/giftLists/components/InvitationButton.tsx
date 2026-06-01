import { useInvitationByGiftList } from 'src/hooks/useInvitation';
import { MLButton } from 'src/components/core/MLButton';
import { Mail } from 'lucide-react';

interface InvitationButtonProps {
  listId: number;
  onManageInvitation: () => void;
  onViewInvitation: () => void;
}

export function InvitationButton({ listId, onManageInvitation, onViewInvitation }: InvitationButtonProps) {
  const { data: invitation, isLoading } = useInvitationByGiftList(listId);

  if (isLoading) {
    return (
      <div className="bg-[#f5f5f7] rounded-xl p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-white rounded-full flex items-center justify-center">
              <Mail className="h-5 w-5 text-muted-foreground" />
            </div>
            <div>
              <p className="text-sm font-medium text-foreground">Cargando...</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // If invitation is published, show published invitation card
  if (invitation && invitation.status === 'PUBLISHED') {
    return (
      <div className="bg-linear-to-r from-orange-50 to-white-50 rounded-xl p-4 border border-orange-100">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-white rounded-full flex items-center justify-center shadow-sm">
              <Mail className="h-5 w-5 text-orange-500" />
            </div>
            <div>
              <p className="text-sm font-medium text-foreground">Invitación vinculada</p>
              <p className="text-xs text-muted-foreground font-light">{invitation.eventName}</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <MLButton
              onClick={onManageInvitation}
              buttonType="transparent"
              className="text-[#007aff] hover:text-[#0051d0] hover:bg-white rounded-full">
              Editar
            </MLButton>
            <MLButton
              onClick={onViewInvitation}
              buttonType="primary"
              className="text-rose-600 hover:text-rose-700 hover:bg-white rounded-full">
              Ver
            </MLButton>
          </div>
        </div>
      </div>
    );
  }

  // Otherwise show "Create/Edit Invitation" card
  return (
    <div className="bg-[#f5f5f7] rounded-xl p-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-white rounded-full flex items-center justify-center">
            <Mail className="h-5 w-5 text-muted-foreground" />
          </div>
          <div>
            <p className="text-sm font-medium text-foreground">{invitation ? 'Invitación en borrador' : 'Sin invitación'}</p>
            <p className="text-xs text-muted-foreground font-light">
              {invitation ? 'Edita tu invitación digital' : 'Crea una invitación digital'}
            </p>
          </div>
        </div>
        <MLButton
          onClick={onManageInvitation}
          buttonType="transparent"
          className="text-[#007aff] hover:text-[#0051d0] hover:bg-white rounded-full">
          {invitation ? 'Editar' : 'Crear'}
        </MLButton>
      </div>
    </div>
  );
}
