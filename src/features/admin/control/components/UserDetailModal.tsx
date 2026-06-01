import { Modal, Button, Tag } from 'antd';
import dayjs from 'dayjs';
import type { UserAnalytics } from 'services/usersListsAnalytics.service';

interface UserDetailModalProps {
  isOpen: boolean;
  onClose: () => void;
  user: UserAnalytics | null;
  formatDate: (date: string) => string;
  formatCurrency: (amount: number) => string;
}

export function UserDetailModal({ isOpen, onClose, user, formatDate, formatCurrency }: UserDetailModalProps) {
  return (
    <Modal
      title="Detalles del Usuario"
      open={isOpen}
      onCancel={onClose}
      footer={[
        <Button key="close" onClick={onClose}>
          Cerrar
        </Button>,
      ]}
      width={700}>
      {user && (
        <div className="space-y-4">
          <div>
            <h3 className="font-semibold text-lg mb-2">Información Personal</h3>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <span className="text-gray-500">Nombre:</span>
                <div className="font-medium">
                  {user.firstName} {user.lastName}
                </div>
              </div>
              {user.spouseFirstName && (
                <div>
                  <span className="text-gray-500">Pareja:</span>
                  <div className="font-medium">
                    {user.spouseFirstName} {user.spouseLastName}
                  </div>
                </div>
              )}
              <div>
                <span className="text-gray-500">Email:</span>
                <div className="font-medium">{user.email}</div>
              </div>
              <div>
                <span className="text-gray-500">Teléfono:</span>
                <div className="font-medium">{user.phoneNumber || 'No proporcionado'}</div>
              </div>
              <div>
                <span className="text-gray-500">Slug:</span>
                <div className="font-medium text-blue-600">{user.slug || 'N/A'}</div>
              </div>
              <div>
                <span className="text-gray-500">Fecha de Registro:</span>
                <div className="font-medium">{formatDate(user.createdAt)}</div>
              </div>
            </div>
          </div>

          <div>
            <h3 className="font-semibold text-lg mb-2">Plan y Descuentos</h3>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <span className="text-gray-500">Tipo de Plan:</span>
                <div className="font-medium">
                  {user.planType ? (
                    <Tag color={user.planType === 'FIXED' ? 'green' : 'blue'}>{user.planType === 'FIXED' ? 'Fijo' : 'Comisión'}</Tag>
                  ) : (
                    'Sin plan'
                  )}
                </div>
              </div>
              <div>
                <span className="text-gray-500">Código de Descuento:</span>
                <div className="font-medium">{user.discountCode ? <Tag color="orange">{user.discountCode}</Tag> : 'Ninguno'}</div>
              </div>
            </div>
          </div>

          {user.weddingList && (
            <div>
              <h3 className="font-semibold text-lg mb-2">Lista de Regalos</h3>
              <div className="bg-gray-50 p-4 rounded-lg">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <span className="text-gray-500">Título:</span>
                    <div className="font-medium">{user.weddingList.title}</div>
                  </div>
                  <div>
                    <span className="text-gray-500">Nombre Pareja:</span>
                    <div className="font-medium">{user.weddingList.coupleName}</div>
                  </div>
                  <div>
                    <span className="text-gray-500">Fecha de Boda:</span>
                    <div className="font-medium">{dayjs(user.weddingList.weddingDate).format('DD/MMM/YYYY')}</div>
                  </div>
                  <div>
                    <span className="text-gray-500">Total Regalos:</span>
                    <div className="font-medium">{user.weddingList.totalGifts}</div>
                  </div>
                  <div>
                    <span className="text-gray-500">Regalos Comprados:</span>
                    <div className="font-medium text-green-600">{user.weddingList.purchasedGifts}</div>
                  </div>
                  <div>
                    <span className="text-gray-500">Tasa de Compra:</span>
                    <div className="font-medium">
                      <Tag color={user.weddingList.purchaseRate > 50 ? 'green' : user.weddingList.purchaseRate > 25 ? 'orange' : 'red'}>
                        {user.weddingList.purchaseRate.toFixed(1)}%
                      </Tag>
                    </div>
                  </div>
                  <div>
                    <span className="text-gray-500">Valor Total:</span>
                    <div className="font-medium">{formatCurrency(user.weddingList.totalValue)}</div>
                  </div>
                  <div>
                    <span className="text-gray-500">Total Recibido:</span>
                    <div className="font-medium text-green-600 text-lg">{formatCurrency(user.weddingList.totalReceived)}</div>
                  </div>
                  <div>
                    <span className="text-gray-500">Invitaciones:</span>
                    <div className="font-medium">{user.weddingList.invitationCount}</div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      )}
    </Modal>
  );
}
