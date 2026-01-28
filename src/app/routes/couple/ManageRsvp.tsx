import { useState } from 'react';
import { Search, Upload, Plus, Download, Users, RefreshCw, Copy, Check } from 'lucide-react';
import { Button, Input, Select, message } from 'antd';
import { AddInviteeModal } from 'src/features/rsvp/AddInviteeModal/AddInviteeModal';
import { ImportInviteesModal } from 'src/features/rsvp/ImportInviteeModal/ImportInviteeModal';
import { InviteesTable } from 'src/features/rsvp/InviteesTable';
import { RsvpStatistics } from 'src/features/rsvp/RsvpStatistics';
import { ImportErrorsAlert } from 'src/features/rsvp/ImportErrorsAlert';
import {
  useInvitees,
  useCreateInvitee,
  useBulkCreateInvitees,
  useUpdateInvitee,
  useDeleteInvitee,
  useBulkDeleteInvitees,
  useBulkUpdateInviteeStatus,
  useRsvpStats,
} from 'src/hooks/useRsvp';
import { useCurrentUser } from 'src/hooks/useUser';

interface Invitee {
  id: string;
  firstName: string;
  lastName: string;
  tickets: number;
  secretCode: string;
  status: 'PENDING' | 'CONFIRMED' | 'REJECTED';
  confirmedTickets?: number;
}

interface ImportInvitee {
  firstName?: string;
  lastName?: string;
  tickets?: number;
  secretCode?: string;
  guestMessage?: string;
  status?: 'PENDING' | 'CONFIRMED' | 'REJECTED';
}

export function ManageRSVP() {
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [showAddModal, setShowAddModal] = useState(false);
  const [showImportModal, setShowImportModal] = useState(false);
  const [editingInvitee, setEditingInvitee] = useState<Invitee | null>(null);
  const [copied, setCopied] = useState(false);
  const [importErrors, setImportErrors] = useState<Array<{ row: number; error: string }>>([]);

  // Get current user
  const { data: user } = useCurrentUser();
  const slug = user?.slug;

  // React Query hooks
  const { data: invitees = [], isLoading: loading, refetch } = useInvitees();
  const { data: stats } = useRsvpStats();
  const createInviteeMutation = useCreateInvitee();
  const updateInviteeMutation = useUpdateInvitee();
  const deleteInviteeMutation = useDeleteInvitee();
  const bulkCreateMutation = useBulkCreateInvitees();
  const bulkDeleteMutation = useBulkDeleteInvitees();
  const bulkUpdateStatusMutation = useBulkUpdateInviteeStatus();

  const handleAddInvitee = async (invitee: Omit<Invitee, 'id' | 'status'>) => {
    try {
      await createInviteeMutation.mutateAsync(invitee);
      message.success('Invitado agregado');
    } catch (error) {
      console.error('Error creating invitee:', error);
      message.error(error instanceof Error ? error.message : 'Error al agregar invitado');
    }
  };

  const handleUpdateInvitee = async (id: string, updatedInvitee: Omit<Invitee, 'id' | 'status'>) => {
    try {
      await updateInviteeMutation.mutateAsync({ id, data: updatedInvitee });
      message.success('Invitado actualizado');
    } catch (error) {
      console.error('Error updating invitee:', error);
      message.error(error instanceof Error ? error.message : 'Error al actualizar invitado');
    }
  };

  const handleDeleteInvitee = async (id: string) => {
    try {
      await deleteInviteeMutation.mutateAsync(id);
      message.success('Invitado eliminado');
    } catch (error) {
      console.error('Error deleting invitee:', error);
      message.error('Error al eliminar invitado');
    }
  };

  const handleBulkDelete = async (ids: string[]) => {
    try {
      const result = await bulkDeleteMutation.mutateAsync(ids);
      message.success(`${result.count} invitado(s) eliminado(s) exitosamente`);
    } catch (error) {
      console.error('Error bulk deleting invitees:', error);
      message.error('Error al eliminar invitados');
    }
  };

  const handleBulkUpdateStatus = async (ids: string[], status: 'PENDING' | 'CONFIRMED' | 'REJECTED') => {
    try {
      const result = await bulkUpdateStatusMutation.mutateAsync({ ids, status });
      const statusText = status === 'CONFIRMED' ? 'confirmados' : status === 'REJECTED' ? 'rechazados' : 'pendientes';
      message.success(`${result.count} invitado(s) marcado(s) como ${statusText}`);
    } catch (error) {
      console.error('Error bulk updating status:', error);
      message.error('Error al actualizar estado');
    }
  };

  const handleImportInvitees = async (importedInvitees: ImportInvitee[]) => {
    try {
      const result = await bulkCreateMutation.mutateAsync(importedInvitees);

      if (result.errors && result.errors.length > 0) {
        setImportErrors(result.errors);
        message.warning(`Importados ${result.created.length} invitados. ${result.errors.length} con errores.`);
        console.error('Import errors:', result.errors);
      } else {
        setImportErrors([]);
        message.success(`${result.created.length} invitados importados exitosamente`);
      }
    } catch (error) {
      console.error('Error importing invitees:', error);
      message.error('Error al importar invitados');
    }
  };

  const handleExportCSV = () => {
    const csvHeader = 'Nombre,Apellido,Boletos,Código Secreto,Estado,Boletos Confirmados\n';
    const csvContent = invitees
      .map((inv) => `${inv.firstName},${inv.lastName},${inv.tickets},${inv.secretCode},${inv.status},${inv.confirmedTickets || 0}`)
      .join('\n');

    const blob = new Blob([csvHeader + csvContent], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'invitados_rsvp.csv';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const handleCopyLink = async () => {
    const rsvpLink = `${window.location.origin}/${slug}/rsvp`;
    try {
      await navigator.clipboard.writeText(rsvpLink);
      setCopied(true);
      message.success('Enlace copiado al portapapeles');
      setTimeout(() => setCopied(false), 2000);
    } catch (error) {
      console.error('Error copying to clipboard:', error);
      message.error('Error al copiar el enlace');
    }
  };

  // Filter invitees based on search and status
  const filteredInvitees = invitees.filter((inv) => {
    const matchesSearch =
      inv.firstName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      inv.lastName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      inv.secretCode.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesStatus = statusFilter === 'all' || inv.status === statusFilter;

    return matchesSearch && matchesStatus;
  });

  // Use stats from API (single source of truth)
  const localStats = stats || {
    total: 0,
    confirmed: 0,
    rejected: 0,
    pending: 0,
    totalTickets: 0,
    confirmedTickets: 0,
    pendingTickets: 0,
    rejectedTickets: 0,
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Hero Section */}
      <section className="relative py-10 px-4 sm:px-6 lg:px-8 bg-linear from-[#faf9f8] to-white">
        <div className="max-w-7xl mx-auto text-center">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-[#007aff]/10 mb-6">
            <Users className="h-8 w-8 text-[#007aff]" />
          </div>
          <h1 className="mb-4 text-3xl text-foreground">Gestionar Invitados</h1>
          <p className="max-w-2xl mx-auto text-muted-foreground">
            Administra tu lista de invitados, controla las confirmaciones y mantén todo organizado en un solo lugar.
          </p>
        </div>
      </section>

      {/* Statistics Cards */}
      <RsvpStatistics stats={localStats} />

      {/* Main Content */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-20">
        {/* Actions Bar */}
        <div className="bg-white rounded-2xl p-6 shadow-sm border border-border/30 mb-6">
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
            <div className="flex-1 flex flex-col sm:flex-row gap-4">
              {/* Search */}
              <div className="relative flex-1 max-w-md">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                <Input
                  type="text"
                  placeholder="Buscar por nombre o código..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10 bg-input-background border-border/30 rounded-xl shadow-sm"
                />
              </div>

              {/* Status Filter */}
              <Select
                value={statusFilter}
                onChange={setStatusFilter}
                className="w-full max-w-[192px] shadow-sm"
                options={[
                  { label: 'Todos', value: 'all' },
                  { label: 'Pendientes', value: 'PENDING' },
                  { label: 'Confirmados', value: 'CONFIRMED' },
                  { label: 'Rechazados', value: 'REJECTED' },
                ]}
                placeholder="Estado"
              />
            </div>

            {/* Action Buttons */}
            <div className="flex flex-wrap gap-3">
              <Button onClick={() => refetch()} disabled={loading} className="shadow-sm! rounded-xl px-4 py-2 flex items-center gap-2">
                <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
                Actualizar
              </Button>
              <Button onClick={() => setShowImportModal(true)} className="shadow-sm! rounded-xl px-4 py-2 flex items-center gap-2">
                <Upload className="h-4 w-4" />
                Importar CSV
              </Button>
              <Button onClick={handleExportCSV} className="shadow-sm! rounded-xl px-4 py-2 flex items-center gap-2">
                <Download className="h-4 w-4" />
                Exportar
              </Button>
              <Button
                onClick={() => {
                  setEditingInvitee(null);
                  setShowAddModal(true);
                }}
                type="primary"
                className="rounded-xl px-4 py-2 flex items-center gap-2">
                <Plus className="h-4 w-4" />
                Agregar Invitado
              </Button>
            </div>
          </div>
        </div>

        {/* Import Errors Alert */}
        <ImportErrorsAlert errors={importErrors} onDismiss={() => setImportErrors([])} />

        {/* Invitees Table */}
        <InviteesTable
          invitees={filteredInvitees}
          loading={loading}
          searchTerm={searchTerm}
          statusFilter={statusFilter}
          onEdit={(invitee) => {
            setEditingInvitee(invitee);
            setShowAddModal(true);
          }}
          onDelete={handleDeleteInvitee}
          onBulkDelete={handleBulkDelete}
          onBulkUpdateStatus={handleBulkUpdateStatus}
        />

        {/* Info Section */}
        <div className="mt-8 bg-[#007aff]/5 rounded-2xl p-6 border border-[#007aff]/10">
          <h3 className="text-foreground mb-2">Cómo compartir la confirmación con tus invitados</h3>
          <p className="text-muted-foreground mb-4">
            Comparte el siguiente enlace con tus invitados para que puedan confirmar su asistencia:
          </p>
          <div className="flex gap-2 items-center">
            <div
              onClick={handleCopyLink}
              className="flex-1 bg-white rounded-xl p-4 border border-border/30 cursor-pointer hover:bg-[#f5f5f7] transition-colors">
              <code className="text-sm text-foreground break-all">
                {window.location.origin}/{slug}/rsvp
              </code>
            </div>
            <Button
              onClick={handleCopyLink}
              className="flex items-center gap-2 border-primary! text-primary!"
              icon={copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}>
              {copied ? 'Copiado' : 'Copiar'}
            </Button>
          </div>
          <p className="text-sm text-muted-foreground mt-4">
            Cada invitado necesitará su código secreto único para confirmar su asistencia.
          </p>
        </div>
      </section>

      {/* Modals */}
      <AddInviteeModal
        open={showAddModal}
        invitee={editingInvitee}
        onClose={() => {
          setShowAddModal(false);
          setEditingInvitee(null);
        }}
        onSave={(invitee) => {
          if (editingInvitee) {
            handleUpdateInvitee(editingInvitee.id, invitee);
          } else {
            handleAddInvitee(invitee);
          }
          setShowAddModal(false);
          setEditingInvitee(null);
        }}
      />

      <ImportInviteesModal
        open={showImportModal}
        onClose={() => setShowImportModal(false)}
        onImport={(invitees) => {
          handleImportInvitees(invitees);
          setShowImportModal(false);
        }}
      />
    </div>
  );
}
