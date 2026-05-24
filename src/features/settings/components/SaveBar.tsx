import { Save } from 'lucide-react';
import { Button } from 'components/core/Button';

interface SaveBarProps {
  onSave: () => void;
  disabled: boolean;
  loading: boolean;
  label: string;
  loadingLabel?: string;
}

export function SaveBar({ onSave, disabled, loading, label, loadingLabel }: SaveBarProps) {
  return (
    <div className="mt-10 pt-6 border-t border-border/40 flex items-center justify-between gap-4">
      <p className="text-xs text-foreground/60 font-medium">
        {disabled && !loading ? 'No hay cambios sin guardar.' : 'Tienes cambios sin guardar.'}
      </p>
      <Button
        onClick={onSave}
        disabled={disabled}
        className="px-7 py-3 bg-[#d4704a] hover:bg-[#c25f3a] text-white rounded-full transition-all duration-200 flex items-center gap-2 border-0 disabled:opacity-40 disabled:cursor-not-allowed">
        <Save className="h-4 w-4" />
        {loading ? loadingLabel || 'Guardando...' : label}
      </Button>
    </div>
  );
}
