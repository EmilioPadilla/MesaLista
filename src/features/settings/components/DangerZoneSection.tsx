import { AlertTriangle, Trash2 } from 'lucide-react';
import { Button } from 'components/core/Button';

interface DangerZoneSectionProps {
  onDeleteClick: () => void;
}

export function DangerZoneSection({ onDeleteClick }: DangerZoneSectionProps) {
  return (
    <div className="border-2 border-red-200 rounded-2xl p-8 bg-red-50/40">
      <div className="flex items-start gap-4">
        <div className="shrink-0 w-12 h-12 rounded-full bg-red-100 flex items-center justify-center">
          <AlertTriangle className="h-6 w-6 text-red-600" />
        </div>
        <div className="space-y-4 flex-1">
          <div>
            <h3 className="text-xl font-semibold text-red-900 mb-2">Eliminar cuenta</h3>
            <p className="text-sm text-red-800/90 leading-relaxed">
              Esta acción eliminará <strong>permanentemente</strong> tu cuenta, tu mesa de regalos, todos los regalos y toda la información asociada.
              Esta acción no se puede deshacer.
            </p>
          </div>
          <Button
            onClick={onDeleteClick}
            className="px-6 py-3 bg-red-600 hover:bg-red-700 text-white rounded-full transition-all duration-200 flex items-center gap-2 border-0">
            <Trash2 className="h-5 w-5" />
            Eliminar mi cuenta
          </Button>
        </div>
      </div>
    </div>
  );
}
