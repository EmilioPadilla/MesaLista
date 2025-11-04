import { X } from 'lucide-react';
import { Alert, Button } from 'antd';
import { ImportError } from '../ImportInviteeModal/ImportInviteeModal';

interface ImportErrorsAlertProps {
  errors: ImportError[];
  onDismiss: () => void;
}

export function ImportErrorsAlert({ errors, onDismiss }: ImportErrorsAlertProps) {
  if (errors.length === 0) {
    return null;
  }

  return (
    <Alert
      rootClassName="mb-3!"
      message={
        <div className="flex items-center justify-between">
          <span className="font-semibold">Errores de Importación ({errors.length})</span>
          <Button
            type="text"
            size="small"
            icon={<X className="h-4 w-4" />}
            onClick={onDismiss}
            className="hover:bg-transparent"
          />
        </div>
      }
      description={
        <div className="mt-3">
          <p className="text-sm text-muted-foreground mb-4">Los siguientes registros no pudieron ser importados:</p>
          <div className="max-h-60 overflow-y-auto space-y-3">
            {errors.map((error: ImportError, index) => (
              <div key={index} className="bg-white rounded-xl p-4 border border-red-200 shadow-sm">
                {/* Error Message */}
                <div className="flex items-start gap-2 mb-3 pb-3 border-b border-red-100">
                  <div className="w-5 h-5 rounded-full bg-red-100 flex items-center justify-center shrink-0 mt-0.5">
                    <X className="h-3 w-3 text-red-600" />
                  </div>
                  <p className="text-sm font-medium text-red-700 leading-relaxed">{error.error}</p>
                </div>

                {/* Invitee Details */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div className="flex flex-col">
                    <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-1">Nombre</span>
                    <span className="text-sm text-foreground font-medium">
                      {error.invitee?.firstName} {error.invitee?.lastName}
                    </span>
                  </div>
                  <div className="flex flex-col">
                    <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-1">Código</span>
                    <span className="text-sm text-foreground font-mono bg-gray-50 px-2 py-1 rounded w-fit">
                      {error.invitee?.secretCode}
                    </span>
                  </div>
                  <div className="flex flex-col">
                    <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-1">Boletos</span>
                    <span className="text-sm text-foreground font-medium">{error.invitee?.tickets}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      }
      type="error"
      showIcon
      closable={false}
      className="mb-6"
    />
  );
}
