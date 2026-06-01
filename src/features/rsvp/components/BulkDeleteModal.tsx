import { Modal } from 'antd';

interface BulkDeleteModalProps {
  open: boolean;
  selectedCount: number;
  onConfirm: () => void;
  onCancel: () => void;
  loading?: boolean;
}

export function BulkDeleteModal({
  open,
  selectedCount,
  onConfirm,
  onCancel,
  loading,
}: BulkDeleteModalProps) {
  return (
    <Modal
      title="¿Eliminar invitados seleccionados?"
      open={open}
      onOk={onConfirm}
      onCancel={onCancel}
      okText="Eliminar"
      okType="danger"
      cancelText="Cancelar"
      confirmLoading={loading}>
      <p>Estás a punto de eliminar {selectedCount} invitado(s). Esta acción no se puede deshacer.</p>
    </Modal>
  );
}
