import { Modal, Select, Tag } from 'antd';
import type { UserAnalytics } from 'services/usersListsAnalytics.service';

interface PlanTypeUpdateModalProps {
  isOpen: boolean;
  onClose: () => void;
  onUpdate: () => void;
  user: UserAnalytics | null;
  newPlanType: 'FIXED' | 'COMMISSION' | null;
  onPlanTypeChange: (value: 'FIXED' | 'COMMISSION') => void;
  isLoading: boolean;
}

export function PlanTypeUpdateModal({
  isOpen,
  onClose,
  onUpdate,
  user,
  newPlanType,
  onPlanTypeChange,
  isLoading,
}: PlanTypeUpdateModalProps) {
  return (
    <Modal
      title="Actualizar Tipo de Plan"
      open={isOpen}
      onCancel={onClose}
      onOk={onUpdate}
      okText="Actualizar"
      cancelText="Cancelar"
      confirmLoading={isLoading}>
      {user && (
        <div className="space-y-4">
          <div>
            <p className="mb-2">
              Usuario:{' '}
              <strong>
                {user.firstName} {user.lastName}
              </strong>
            </p>
            <p className="text-sm text-gray-600 mb-4">
              Plan actual: <Tag color={user.planType === 'FIXED' ? 'green' : 'blue'}>{user.planType === 'FIXED' ? 'Fijo' : 'Comisión'}</Tag>
            </p>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Nuevo Tipo de Plan:</label>
            <Select value={newPlanType} onChange={onPlanTypeChange} style={{ width: '100%' }} placeholder="Selecciona un tipo de plan">
              <Select.Option value="FIXED">
                <Tag color="green">Fijo</Tag> - Pago único por el servicio
              </Select.Option>
              <Select.Option value="COMMISSION">
                <Tag color="blue">Comisión</Tag> - Comisión por regalo comprado
              </Select.Option>
            </Select>
          </div>
        </div>
      )}
    </Modal>
  );
}
