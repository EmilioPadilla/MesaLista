import { useState } from 'react';
import { Pencil, Trash2, CheckCircle2, XCircle, Clock, Users, MessageSquare } from 'lucide-react';
import { Button, Table, Switch } from 'antd';
import type { TableRowSelection } from 'antd/es/table/interface';
import { Collapsible } from 'src/components/core/Collapsible';
import { BulkDeleteModal } from '../BulkDeleteModal';
import { DeleteInviteePopover } from '../DeleteInviteePopover';
import { GuestMessageModal } from '../GuestMessageModal';

interface Invitee {
  id: string;
  firstName: string;
  lastName: string;
  tickets: number;
  secretCode: string;
  status: 'PENDING' | 'CONFIRMED' | 'REJECTED';
  confirmedTickets?: number;
  guestMessage?: string;
}

interface InviteesTableProps {
  invitees: Invitee[];
  loading?: boolean;
  searchTerm?: string;
  statusFilter?: string;
  onEdit: (invitee: Invitee) => void;
  onDelete: (id: string) => void;
  onBulkDelete?: (ids: string[]) => void;
  onBulkUpdateStatus?: (ids: string[], status: 'PENDING' | 'CONFIRMED' | 'REJECTED') => void;
}

export function InviteesTable({ invitees, loading, searchTerm, statusFilter, onEdit, onDelete, onBulkDelete, onBulkUpdateStatus }: InviteesTableProps) {
  const [selectedRowKeys, setSelectedRowKeys] = useState<React.Key[]>([]);
  const [bulkDeleteModalOpen, setBulkDeleteModalOpen] = useState(false);
  const [showMessages, setShowMessages] = useState(false);
  const [messageModalOpen, setMessageModalOpen] = useState(false);
  const [selectedMessage, setSelectedMessage] = useState<{ name: string; message: string } | null>(null);

  const rowSelection: TableRowSelection<Invitee> = {
    selectedRowKeys,
    onChange: (selectedKeys) => {
      setSelectedRowKeys(selectedKeys);
    },
  };

  const handleBulkDelete = () => {
    setBulkDeleteModalOpen(true);
  };

  const handleBulkDeleteConfirm = () => {
    if (onBulkDelete) {
      onBulkDelete(selectedRowKeys as string[]);
      setSelectedRowKeys([]);
      setBulkDeleteModalOpen(false);
    }
  };

  const handleViewMessage = (name: string, message?: string) => {
    if (!message) return;
    setSelectedMessage({ name, message });
    setMessageModalOpen(true);
  };

  const hasSelection = selectedRowKeys.length > 0;
  const messagesCount = invitees.filter((inv) => inv.guestMessage).length;

  return (
    <div className="space-y-2">
      {/* Messages Toggle */}
      {messagesCount > 0 && (
        <div className="flex items-center justify-end gap-2">
          <MessageSquare className="h-4 w-4 text-muted-foreground" />
          <span className="text-sm text-muted-foreground">Mostrar mensajes ({messagesCount})</span>
          <Switch checked={showMessages} onChange={setShowMessages} size="small" />
        </div>
      )}

      {/* Bulk Actions Bar */}
      <Collapsible isOpen={hasSelection}>
        <div className="bg-primary/5 border border-primary/20 rounded-xl p-4 flex items-center justify-between">
          <span className="text-foreground">{selectedRowKeys.length} invitado(s) seleccionado(s)</span>
          <div className="flex gap-2">
            {onBulkUpdateStatus && (
              <>
                <Button
                  onClick={() => {
                    onBulkUpdateStatus(selectedRowKeys as string[], 'CONFIRMED');
                    setSelectedRowKeys([]);
                  }}
                  className="rounded-xl bg-green-500 hover:bg-green-600 text-white border-0"
                  icon={<CheckCircle2 className="h-4 w-4" />}>
                  Confirmar
                </Button>
                <Button
                  onClick={() => {
                    onBulkUpdateStatus(selectedRowKeys as string[], 'REJECTED');
                    setSelectedRowKeys([]);
                  }}
                  className="rounded-xl bg-red-500 hover:bg-red-600 text-white border-0"
                  icon={<XCircle className="h-4 w-4" />}>
                  Rechazar
                </Button>
                <Button
                  onClick={() => {
                    onBulkUpdateStatus(selectedRowKeys as string[], 'PENDING');
                    setSelectedRowKeys([]);
                  }}
                  className="rounded-xl"
                  icon={<Clock className="h-4 w-4" />}>
                  Pendiente
                </Button>
              </>
            )}
            {onBulkDelete && (
              <Button onClick={handleBulkDelete} danger className="rounded-xl" icon={<Trash2 className="h-4 w-4" />}>
                Eliminar
              </Button>
            )}
          </div>
        </div>
      </Collapsible>

      {/* Bulk Delete Modal */}
      <BulkDeleteModal
        open={bulkDeleteModalOpen}
        selectedCount={selectedRowKeys.length}
        onConfirm={handleBulkDeleteConfirm}
        onCancel={() => setBulkDeleteModalOpen(false)}
      />

      {/* Table */}
      <div className="overflow-x-auto">
        <Table
          dataSource={invitees}
          rowKey="id"
          loading={loading}
          pagination={false}
          size="small"
          scroll={{ x: 768 }}
          rowSelection={rowSelection}
          locale={{
            emptyText: (
              <div className="flex flex-col items-center justify-center py-12">
                <Users className="h-12 w-12 text-muted-foreground/30 mb-3" />
                <p className="text-muted-foreground">
                  {searchTerm || statusFilter !== 'all' ? 'No se encontraron invitados' : 'No hay invitados todavía'}
                </p>
                <p className="text-sm text-muted-foreground mt-1">Comienza agregando invitados manualmente o importando un archivo CSV</p>
              </div>
            ),
          }}
          columns={[
            {
              title: 'Nombre',
              dataIndex: 'firstName',
              key: 'firstName',
              render: (text, record) => (
                <span className={!text || text === 'Invitado' ? 'bg-red-50 px-2 py-1 rounded' : ''}>
                  {text}
                  {record?.guestMessage && (
                    <Button
                      type="text"
                      size="small"
                      icon={<MessageSquare className="h-4 w-4 text-primary!" />}
                      onClick={() => handleViewMessage(`${record.firstName} ${record.lastName}`, record.guestMessage)}></Button>
                  )}
                </span>
              ),
            },
            {
              title: 'Apellido',
              dataIndex: 'lastName',
              key: 'lastName',
              render: (text) => <span className={!text || text === 'Sin Apellido' ? 'bg-red-50 px-2 py-1 rounded' : ''}>{text}</span>,
            },
            {
              title: 'Código',
              dataIndex: 'secretCode',
              key: 'secretCode',
              render: (text) => <code className="px-2 py-1 bg-[#f5f5f7] rounded text-sm">{text}</code>,
            },
            {
              title: 'Boletos',
              dataIndex: 'tickets',
              key: 'tickets',
              align: 'center' as const,
              render: (_, record: Invitee) =>
                record.status === 'CONFIRMED' && record.confirmedTickets !== undefined
                  ? `${record.confirmedTickets}/${record.tickets}`
                  : record.tickets,
            },
            {
              title: 'Estado',
              dataIndex: 'status',
              key: 'status',
              align: 'center' as const,
              render: (status: string) => {
                if (status === 'CONFIRMED') {
                  return (
                    <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-[#34c759]/10 text-[#34c759] text-sm">
                      <CheckCircle2 className="h-3.5 w-3.5" />
                      Confirmado
                    </span>
                  );
                }
                if (status === 'REJECTED') {
                  return (
                    <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-[#ff3b30]/10 text-[#ff3b30] text-sm">
                      <XCircle className="h-3.5 w-3.5" />
                      Rechazado
                    </span>
                  );
                }
                return (
                  <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-[#ff9500]/10 text-[#ff9500] text-sm">
                    <Clock className="h-3.5 w-3.5" />
                    Pendiente
                  </span>
                );
              },
            },
            ...(showMessages
              ? [
                  {
                    title: 'Mensaje',
                    dataIndex: 'guestMessage',
                    key: 'guestMessage',
                    align: 'center' as const,
                    render: (message: string | undefined) => {
                      if (!message) {
                        return <span className="text-muted-foreground text-sm italic">Sin mensaje</span>;
                      }
                      return <span className="font-bold">{message}</span>;
                    },
                  },
                ]
              : []),
            {
              title: 'Acciones',
              key: 'actions',
              align: 'center' as const,
              render: (_, record: Invitee) => (
                <div className="flex items-center justify-center gap-2">
                  <Button
                    type="text"
                    size="small"
                    icon={<Pencil className="h-4 w-4 text-muted-foreground" />}
                    onClick={() => onEdit(record)}
                    title="Editar"
                  />
                  <DeleteInviteePopover inviteeName={`${record.firstName} ${record.lastName}`} onConfirm={() => onDelete(record.id)}>
                    <Button type="text" size="small" icon={<Trash2 className="h-4 w-4 text-[#ff3b30]" />} title="Eliminar" />
                  </DeleteInviteePopover>
                </div>
              ),
            },
          ]}
        />
      </div>

      {/* Guest Message Modal */}
      {selectedMessage && (
        <GuestMessageModal
          open={messageModalOpen}
          guestName={selectedMessage.name}
          message={selectedMessage.message}
          onClose={() => {
            setMessageModalOpen(false);
            setSelectedMessage(null);
          }}
        />
      )}
    </div>
  );
}
