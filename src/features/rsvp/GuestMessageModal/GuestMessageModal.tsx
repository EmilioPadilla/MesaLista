import { Modal } from 'antd';
import { MessageSquare } from 'lucide-react';

interface GuestMessageModalProps {
  open: boolean;
  guestName: string;
  message: string;
  onClose: () => void;
}

export function GuestMessageModal({ open, guestName, message, onClose }: GuestMessageModalProps) {
  return (
    <Modal
      title={
        <div className="flex items-center gap-2">
          <MessageSquare className="h-5 w-5 text-primary" />
          Mensaje del Invitado
        </div>
      }
      open={open}
      onCancel={onClose}
      footer={null}
      width={500}>
      <div className="space-y-4 pt-4">
        <div>
          <p className="text-sm text-muted-foreground mb-2">De:</p>
          <p className="text-foreground font-medium">{guestName}</p>
        </div>
        <div>
          <p className="text-sm text-muted-foreground mb-2">Mensaje:</p>
          <div className="bg-[#f5f5f7] rounded-xl p-4 border border-border/30">
            <p className="text-foreground whitespace-pre-wrap">{message}</p>
          </div>
        </div>
      </div>
    </Modal>
  );
}
