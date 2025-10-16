import { Modal, Alert, Input, message } from 'antd';
import { Button } from 'components/core/Button';
import { useDeleteCurrentUser } from 'hooks/useUser';
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';

interface DeleteCurrentUserModalProps {
  open: boolean;
  onCancel: () => void;
}

export function DeleteCurrentUserModal({ open, onCancel }: DeleteCurrentUserModalProps) {
  const navigate = useNavigate();
  const [deleteConfirmText, setDeleteConfirmText] = useState('');
  const { mutateAsync: deleteAccount, isPending: isDeletingAccount } = useDeleteCurrentUser();

  const handleDeleteAccount = async () => {
    if (deleteConfirmText !== 'eliminar mi cuenta') {
      message.error('Por favor escribe "eliminar mi cuenta" para confirmar');
      return;
    }

    try {
      await deleteAccount();
      // Redirect to home page after successful deletion
      navigate('/', { replace: true });
    } catch (error) {
      console.error('Error deleting account:', error);
    } finally {
      handleCancel();
    }
  };

  const handleCancel = () => {
    setDeleteConfirmText('');
    onCancel();
  };

  return (
    <Modal
      title={<span className="text-xl font-semibold">Confirmar eliminación de cuenta</span>}
      open={open}
      onCancel={handleCancel}
      footer={
        <div className="flex justify-end gap-2">
          <Button key="cancel" onClick={handleCancel} className="px-6 py-2 rounded-full">
            Cancelar
          </Button>
          <Button
            key="delete"
            onClick={handleDeleteAccount}
            disabled={deleteConfirmText !== 'eliminar mi cuenta' || isDeletingAccount}
            className="px-6 py-2 bg-red-600 hover:bg-red-700 text-white rounded-full border-0 disabled:bg-gray-400 disabled:text-black">
            {isDeletingAccount ? 'Eliminando...' : 'Eliminar cuenta'}
          </Button>
        </div>
      }
      className="[&_.ant-modal-content]:rounded-2xl">
      <div className="space-y-4 py-4">
        <Alert
          message="¡Advertencia!"
          description="Esta acción es permanente e irreversible. Se eliminarán todos tus datos, incluyendo tu mesa de regalos, regalos, y toda la información asociada."
          type="error"
          showIcon
          className="mb-4"
        />
        <div>
          <p className="text-sm text-muted-foreground mt-5 mb-2">
            Para confirmar, escribe <strong className="text-foreground">eliminar mi cuenta</strong> en el campo de abajo:
          </p>
          <Input
            value={deleteConfirmText}
            onChange={(e) => setDeleteConfirmText(e.target.value)}
            placeholder="eliminar mi cuenta"
            className="h-12 px-4 !bg-[#f5f5f7]"
            autoComplete="off"
          />
        </div>
      </div>
    </Modal>
  );
}
