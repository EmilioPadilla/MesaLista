import { useState } from 'react';
import { Upload, FileText, Download, AlertCircle } from 'lucide-react';
import { Modal, Button, Alert } from 'antd';

interface Invitee {
  firstName?: string;
  lastName?: string;
  tickets?: number;
  secretCode?: string;
  guestMessage?: string;
  status?: 'PENDING' | 'CONFIRMED' | 'REJECTED';
  hasWarnings?: boolean;
}

export interface ImportError {
  error: string;
  invitee?: Invitee;
}

interface ImportInviteesModalProps {
  open: boolean;
  onClose: () => void;
  onImport: (invitees: Invitee[]) => void;
}

export function ImportInviteesModal({ open, onClose, onImport }: ImportInviteesModalProps) {
  const [isDragging, setIsDragging] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [preview, setPreview] = useState<Invitee[]>([]);

  const parseCSV = (text: string): Invitee[] => {
    const rows: string[][] = [];
    let currentRow: string[] = [];
    let currentField = '';
    let inQuotes = false;

    // Parse entire CSV text character by character
    for (let i = 0; i < text.length; i++) {
      const char = text[i];
      const nextChar = text[i + 1];

      if (char === '"') {
        if (inQuotes && nextChar === '"') {
          // Escaped quote within quoted field
          currentField += '"';
          i++; // Skip next quote
        } else {
          // Toggle quote state
          inQuotes = !inQuotes;
        }
      } else if (char === ',' && !inQuotes) {
        // End of field
        currentRow.push(currentField.trim());
        currentField = '';
      } else if ((char === '\n' || char === '\r') && !inQuotes) {
        // End of row (handle both \n and \r\n)
        if (char === '\r' && nextChar === '\n') {
          i++; // Skip \n in \r\n
        }
        currentRow.push(currentField.trim());
        if (currentRow.some((field) => field !== '')) {
          // Only add non-empty rows
          rows.push(currentRow);
        }
        currentRow = [];
        currentField = '';
      } else {
        currentField += char;
      }
    }

    // Add last field and row if any
    if (currentField || currentRow.length > 0) {
      currentRow.push(currentField.trim());
      if (currentRow.some((field) => field !== '')) {
        rows.push(currentRow);
      }
    }

    const invitees: Invitee[] = [];

    // Skip header row (first row)
    for (let i = 1; i < rows.length; i++) {
      const parts = rows[i];

      // Allow partial data - pad with empty strings if needed
      while (parts.length < 6) {
        parts.push('');
      }

      const [firstName, lastName, ticketsStr, secretCode, guestMessage, statusStr] = parts;
      const tickets = ticketsStr ? parseInt(ticketsStr) : undefined;

      // Validate and normalize status
      let status: 'PENDING' | 'CONFIRMED' | 'REJECTED' | undefined;
      if (statusStr) {
        const normalizedStatus = statusStr.toUpperCase();
        if (['PENDING', 'CONFIRMED', 'REJECTED'].includes(normalizedStatus)) {
          status = normalizedStatus as 'PENDING' | 'CONFIRMED' | 'REJECTED';
        }
      }

      // Check if any values are missing to mark as warning
      const hasWarnings = !firstName || !lastName || !tickets || isNaN(tickets as number) || !secretCode;

      invitees.push({
        firstName: firstName || undefined,
        lastName: lastName || undefined,
        tickets: tickets && !isNaN(tickets) && tickets > 0 ? tickets : undefined,
        secretCode: secretCode ? secretCode.toUpperCase() : undefined,
        guestMessage: guestMessage || undefined,
        status: status || undefined,
        hasWarnings,
      });
    }

    return invitees;
  };

  const handleFileSelect = async (file: File) => {
    setError(null);
    setPreview([]);

    if (!file.name.endsWith('.csv')) {
      setError('Por favor, selecciona un archivo CSV');
      return;
    }

    try {
      const text = await file.text();
      const invitees = parseCSV(text);
      setPreview(invitees);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al procesar el archivo');
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);

    const file = e.dataTransfer.files[0];
    if (file) {
      handleFileSelect(file);
    }
  };

  const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      handleFileSelect(file);
    }
  };

  const handleImport = () => {
    if (preview.length > 0) {
      onImport(preview);
    }
  };

  const downloadTemplate = () => {
    const template = 'Nombre,Apellido,Boletos,Código,Mensaje,Estado\nJuan,Pérez,2,ABC12345,¡Nos vemos en la boda!,CONFIRMED\nMaría,González,1,XYZ67890,Felicidades,PENDING\nCarlos,Rodríguez,4,DEF54321,,REJECTED';
    const blob = new Blob([template], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'plantilla_invitados.csv';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  return (
    <Modal
      title="Importar Invitados"
      open={open}
      onCancel={onClose}
      footer={[
        <Button key="cancel" onClick={onClose}>
          Cancelar
        </Button>,
        <Button key="import" type="primary" onClick={handleImport} disabled={preview.length === 0}>
          Importar {preview.length > 0 && `(${preview.length})`}
        </Button>,
      ]}
      width={800}>
      <div className="space-y-6">
        {/* Instructions */}
        <Alert
          message="Formato del archivo CSV"
          description={
            <div>
              <p className="mb-2">El archivo debe tener las siguientes columnas en orden:</p>
              <ul className="space-y-1">
                <li>
                  • <strong>Nombre:</strong> Nombre del invitado
                </li>
                <li>
                  • <strong>Apellido:</strong> Apellido del invitado
                </li>
                <li>
                  • <strong>Boletos:</strong> Número de boletos (1 o más)
                </li>
                <li>
                  • <strong>Código:</strong> Código secreto único para confirmar
                </li>
                <li>
                  • <strong>Mensaje:</strong> Mensaje del invitado (opcional)
                </li>
                <li>
                  • <strong>Estado:</strong> PENDING, CONFIRMED o REJECTED (opcional, por defecto PENDING)
                </li>
              </ul>
            </div>
          }
          type="info"
          icon={<FileText className="h-5 w-5" />}
          showIcon
        />

        {/* Download Template */}
        <div className="flex justify-center mt-4">
          <Button
            onClick={downloadTemplate}
            className="border-primary! text-primary! hover:bg-primary! hover:text-white! rounded-xl px-4 py-2 flex items-center gap-2">
            <Download className="h-4 w-4" />
            Descargar Plantilla
          </Button>
        </div>

        {/* Upload Area */}
        <div
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
          className={`border-2 border-dashed rounded-xl p-12 text-center transition-all ${
            isDragging ? 'border-primary! bg-primary!/5' : 'border-border/30 hover:border-primary!/50 hover:bg-[#faf9f8]'
          }`}>
          <div className="flex flex-col items-center">
            <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mb-4">
              <Upload className="h-8 w-8 text-primary" />
            </div>
            <h3 className="text-foreground mb-2">Arrastra tu archivo CSV aquí</h3>
            <p className="text-sm text-muted-foreground mb-4">o haz clic para seleccionar</p>
            <label className="cursor-pointer">
              <input type="file" accept=".csv" onChange={handleFileInput} className="hidden" />
              <span className="inline-block px-6 py-2 bg-primary hover:bg-primary/80 text-white rounded-xl transition-colors">
                Seleccionar Archivo
              </span>
            </label>
          </div>
        </div>

        {/* Error Message */}
        {error && (
          <Alert
            message="Error al procesar archivo"
            description={error}
            type="error"
            closable
            showIcon
            icon={<AlertCircle className="h-5 w-5" />}
          />
        )}

        {/* Preview */}
        {preview.length > 0 && (
          <div>
            <h3 className="text-foreground mb-3">
              Vista previa ({preview.length} invitados)
              {preview.some((inv) => inv.hasWarnings) && (
                <span className="ml-2 text-sm text-[#ff9500]">⚠️ Algunos campos faltantes serán generados automáticamente</span>
              )}
            </h3>
            <div className="bg-[#faf9f8] rounded-xl p-4 max-h-64 overflow-y-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border/30">
                    <th className="px-3 py-2 text-left text-muted-foreground">Nombre</th>
                    <th className="px-3 py-2 text-left text-muted-foreground">Apellido</th>
                    <th className="px-3 py-2 text-center text-muted-foreground">Boletos</th>
                    <th className="px-3 py-2 text-left text-muted-foreground">Código</th>
                    <th className="px-3 py-2 text-left text-muted-foreground">Mensaje</th>
                    <th className="px-3 py-2 text-center text-muted-foreground">Estado</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border/30">
                  {preview.map((invitee, index) => (
                    <tr key={index}>
                      <td className={`px-3 py-2 ${!invitee.firstName ? 'bg-red-50' : ''}`}>
                        <span className="text-foreground">{invitee.firstName || '(Auto)'}</span>
                      </td>
                      <td className={`px-3 py-2 ${!invitee.lastName ? 'bg-red-50' : ''}`}>
                        <span className="text-foreground">{invitee.lastName || '(Auto)'}</span>
                      </td>
                      <td className={`px-3 py-2 text-center ${!invitee.tickets ? 'bg-red-50' : ''}`}>
                        <span className="text-foreground">{invitee.tickets || '(Auto)'}</span>
                      </td>
                      <td className={`px-3 py-2 ${!invitee.secretCode ? 'bg-red-50' : ''}`}>
                        {invitee.secretCode ? (
                          <code className="px-2 py-0.5 bg-white rounded text-foreground">{invitee.secretCode}</code>
                        ) : (
                          <span className="text-foreground">(Auto)</span>
                        )}
                      </td>
                      <td className="px-3 py-2">
                        <span className="text-foreground text-xs">{invitee.guestMessage || '-'}</span>
                      </td>
                      <td className="px-3 py-2 text-center">
                        {invitee.status ? (
                          <span
                            className={`inline-block px-2 py-0.5 rounded text-xs ${
                              invitee.status === 'CONFIRMED'
                                ? 'bg-green-100 text-green-700'
                                : invitee.status === 'REJECTED'
                                ? 'bg-red-100 text-red-700'
                                : 'bg-yellow-100 text-yellow-700'
                            }`}>
                            {invitee.status === 'CONFIRMED' ? 'Confirmado' : invitee.status === 'REJECTED' ? 'Rechazado' : 'Pendiente'}
                          </span>
                        ) : (
                          <span className="text-muted-foreground text-xs">(Pendiente)</span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </Modal>
  );
}
