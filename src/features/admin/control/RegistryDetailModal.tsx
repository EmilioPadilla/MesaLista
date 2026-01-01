import { Modal, Button, Tag } from 'antd';
import { Calendar, ExternalLink } from 'lucide-react';
import type { WeddingListAnalytics } from 'services/usersListsAnalytics.service';

interface RegistryDetailModalProps {
  isOpen: boolean;
  onClose: () => void;
  registry: WeddingListAnalytics | null;
  formatDate: (date: string) => string;
  formatDateTime: (date: string) => string;
  formatCurrency: (amount: number) => string;
  onViewPublicRegistry: (slug: string) => void;
  onCopyLink: (slug: string) => void;
}

export function RegistryDetailModal({
  isOpen,
  onClose,
  registry,
  formatDate,
  formatDateTime,
  formatCurrency,
  onViewPublicRegistry,
  onCopyLink,
}: RegistryDetailModalProps) {
  return (
    <Modal
      title="Detalles de la Lista de Regalos"
      open={isOpen}
      onCancel={onClose}
      footer={[
        <Button key="close" onClick={onClose}>
          Cerrar
        </Button>,
        registry?.coupleSlug && (
          <Button
            key="view"
            type="primary"
            icon={<ExternalLink className="h-4 w-4" />}
            onClick={() => onViewPublicRegistry(registry.coupleSlug!)}>
            Ver Lista Pública
          </Button>
        ),
      ]}
      width={700}>
      {registry && (
        <div className="space-y-4">
          <div>
            <h3 className="font-semibold text-lg mb-2">Información General</h3>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <span className="text-gray-500">Título:</span>
                <div className="font-medium">{registry.title}</div>
              </div>
              <div>
                <span className="text-gray-500">Pareja:</span>
                <div className="font-medium">{registry.coupleName}</div>
              </div>
              <div>
                <span className="text-gray-500">Email:</span>
                <div className="font-medium">{registry.coupleEmail}</div>
              </div>
              <div>
                <span className="text-gray-500">Slug:</span>
                <div className="font-medium text-blue-600 cursor-pointer hover:underline" onClick={() => onCopyLink(registry.coupleSlug!)}>
                  {registry.coupleSlug || 'N/A'}
                </div>
              </div>
              <div>
                <span className="text-gray-500">Plan:</span>
                <div className="font-medium">
                  {registry.couplePlanType ? (
                    <Tag color={registry.couplePlanType === 'FIXED' ? 'green' : 'blue'}>
                      {registry.couplePlanType === 'FIXED' ? 'Fijo' : 'Comisión'}
                    </Tag>
                  ) : (
                    'Sin plan'
                  )}
                </div>
              </div>
              <div>
                <span className="text-gray-500">Fecha de Creación:</span>
                <div className="font-medium">{formatDateTime(registry.createdAt)}</div>
              </div>
            </div>
          </div>

          <div>
            <h3 className="font-semibold text-lg mb-2">Fecha de Boda</h3>
            <div className="bg-purple-50 p-4 rounded-lg">
              <div className="flex items-center gap-2">
                <Calendar className="h-5 w-5 text-purple-600" />
                <span className="text-xl font-semibold text-purple-900">{formatDate(registry.weddingDate)}</span>
              </div>
            </div>
          </div>

          <div>
            <h3 className="font-semibold text-lg mb-2">Estadísticas de Regalos</h3>
            <div className="bg-gray-50 p-4 rounded-lg">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <span className="text-gray-500">Total Regalos:</span>
                  <div className="font-medium text-2xl">{registry.totalGifts}</div>
                </div>
                <div>
                  <span className="text-gray-500">Regalos Comprados:</span>
                  <div className="font-medium text-2xl text-green-600">{registry.purchasedGifts}</div>
                </div>
                <div>
                  <span className="text-gray-500">Tasa de Compra:</span>
                  <div className="font-medium">
                    <Tag color={registry.purchaseRate > 50 ? 'green' : registry.purchaseRate > 25 ? 'orange' : 'red'} className="text-lg">
                      {registry.purchaseRate.toFixed(1)}%
                    </Tag>
                  </div>
                </div>
                <div>
                  <span className="text-gray-500">Invitaciones:</span>
                  <div className="font-medium text-2xl">{registry.invitationCount || 0}</div>
                </div>
              </div>
            </div>
          </div>

          <div>
            <h3 className="font-semibold text-lg mb-2">Información Financiera</h3>
            <div className="bg-green-50 p-4 rounded-lg">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <span className="text-gray-500">Valor Total:</span>
                  <div className="font-semibold text-2xl text-gray-900">{formatCurrency(registry.totalValue)}</div>
                </div>
                <div>
                  <span className="text-gray-500">Total Recibido:</span>
                  <div className="font-semibold text-2xl text-green-600">{formatCurrency(registry.totalReceived)}</div>
                </div>
              </div>
            </div>
          </div>

          <div>
            <h3 className="font-semibold text-lg mb-2">Actividad</h3>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <span className="text-gray-500">Última Compra:</span>
                <div className="font-medium">
                  {registry.lastPurchaseDate ? formatDateTime(registry.lastPurchaseDate) : 'Sin compras aún'}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </Modal>
  );
}
