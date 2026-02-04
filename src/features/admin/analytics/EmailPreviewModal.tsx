import { Modal, Spin, Alert, Select } from 'antd';
import { Eye, Mail } from 'lucide-react';
import { useEmailPreview, useCommissionUsers } from 'hooks/useEmail';
import { useState } from 'react';
import { CommissionUser } from 'src/services/email.service';

interface EmailPreviewModalProps {
  isOpen: boolean;
  onClose: () => void;
  users: CommissionUser[];
  emailType: 1 | 2 | 3 | 4;
  emailTitle: string;
}

export function EmailPreviewModal({ isOpen, onClose, users, emailType, emailTitle }: EmailPreviewModalProps) {
  const [selectedUserId, setSelectedUserId] = useState<number | null>(null);

  const {
    data: previewData,
    isLoading: isLoadingPreview,
    isError,
    error,
  } = useEmailPreview(emailType, selectedUserId || 0, isOpen && selectedUserId !== null);

  const handleUserChange = (userId: number) => {
    setSelectedUserId(userId);
  };

  return (
    <Modal
      title={
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-green-500 to-blue-500 flex items-center justify-center">
            <Eye className="h-5 w-5 text-white" />
          </div>
          <div>
            <h3 className="text-lg font-semibold text-gray-900 m-0">Vista Previa del Email</h3>
            <p className="text-sm text-gray-500 m-0">{emailTitle}</p>
          </div>
        </div>
      }
      open={isOpen}
      onCancel={onClose}
      width={900}
      footer={null}
      styles={{ body: { maxHeight: '70vh', overflow: 'auto' } }}>
      <div className="space-y-4">
        {/* User Selection */}
        <div className="bg-blue-50 p-4 rounded-lg">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Selecciona un usuario para ver cómo se verá el email personalizado:
          </label>
          <Select
            placeholder="Selecciona un usuario..."
            value={selectedUserId}
            onChange={handleUserChange}
            style={{ width: '100%' }}
            size="large"
            showSearch
            filterOption={(input, option) => {
              const label = option?.label?.toString() || '';
              return label.toLowerCase().includes(input.toLowerCase());
            }}
            options={users.map((user) => ({
              value: user.id,
              label: `${user.firstName} ${user.lastName} (${user.email})`,
            }))}
          />
        </div>

        {/* Preview Content */}
        {!selectedUserId && (
          <Alert
            message="Selecciona un usuario"
            description="Elige un usuario de la lista para ver la vista previa del email personalizado."
            type="info"
            showIcon
            icon={<Mail className="h-4 w-4" />}
          />
        )}

        {selectedUserId && isLoadingPreview && (
          <div className="flex justify-center items-center py-12">
            <Spin size="large" tip="Cargando vista previa..." />
          </div>
        )}

        {selectedUserId && isError && (
          <Alert
            message="Error al cargar vista previa"
            description={error?.message || 'No se pudo cargar la vista previa del email'}
            type="error"
            showIcon
          />
        )}

        {selectedUserId && previewData && !isLoadingPreview && (
          <div className="space-y-4">
            {/* Subject Line */}
            <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
              <div className="text-sm font-medium text-gray-600 mb-1">Asunto:</div>
              <div className="text-base font-semibold text-gray-900">{previewData.data.subject}</div>
            </div>

            {/* Email Preview */}
            <div className="border border-gray-200 rounded-lg overflow-hidden">
              <div className="bg-gray-100 px-4 py-2 border-b border-gray-200">
                <div className="flex items-center gap-2">
                  <Mail className="h-4 w-4 text-gray-600" />
                  <span className="text-sm font-medium text-gray-700">Vista Previa del Email</span>
                </div>
              </div>
              <div
                className="bg-white p-4"
                dangerouslySetInnerHTML={{ __html: previewData.data.html }}
                style={{
                  maxHeight: '500px',
                  overflow: 'auto',
                  fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
                }}
              />
            </div>

            {/* Info Note */}
            <Alert
              message="Nota"
              description="Esta es una vista previa de cómo se verá el email para el usuario seleccionado. Los enlaces y botones son funcionales en el email real."
              type="info"
              showIcon
            />
          </div>
        )}
      </div>
    </Modal>
  );
}
