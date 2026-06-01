import { useState } from 'react';
import { Popover, Button, Space } from 'antd';

interface DeleteInviteePopoverProps {
  inviteeName: string;
  onConfirm: () => void;
  loading?: boolean;
  children: React.ReactNode;
}

export function DeleteInviteePopover({ inviteeName, onConfirm, loading, children }: DeleteInviteePopoverProps) {
  const [open, setOpen] = useState(false);

  const handleConfirm = () => {
    onConfirm();
    setOpen(false);
  };

  const content = (
    <div className="space-y-3">
      <div className="text-sm text-foreground">
        ¿Estás seguro de que deseas eliminar a <strong>{inviteeName}</strong>? <br />
        <div className="font-extrabold">Esta acción no se puede deshacer.</div>
      </div>
      <Space className="flex justify-end gap-2">
        <Button size="small" onClick={() => setOpen(false)}>
          Cancelar
        </Button>
        <Button size="small" danger loading={loading} onClick={handleConfirm}>
          Eliminar
        </Button>
      </Space>
    </div>
  );

  return (
    <Popover
      content={content}
      title="Eliminar invitado"
      autoAdjustOverflow
      placement="topRight"
      trigger="click"
      open={open}
      onOpenChange={setOpen}>
      {children}
    </Popover>
  );
}
