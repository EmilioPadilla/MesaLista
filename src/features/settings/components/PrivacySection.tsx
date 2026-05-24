import { Eye, EyeOff, AlertCircle } from 'lucide-react';

interface PrivacySectionProps {
  isPublic: boolean;
  userSlug?: string;
  onPublicChange: (isPublic: boolean) => void;
}

export function PrivacySection({ isPublic, userSlug, onPublicChange }: PrivacySectionProps) {
  return (
    <section className="space-y-6">
      <div className="space-y-4">
        <div
          className="flex items-start space-x-4 p-5 rounded-2xl border-2 transition-all duration-200 cursor-pointer"
          style={{
            borderColor: isPublic ? 'rgba(212, 112, 74, 0.35)' : 'rgba(0, 0, 0, 0.06)',
            backgroundColor: isPublic ? 'rgba(212, 112, 74, 0.04)' : 'transparent',
          }}
          onClick={() => onPublicChange(true)}>
          <div className="mt-1">
            <div
              className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${isPublic ? 'border-[#d4704a] bg-[#d4704a]' : 'border-foreground/30'}`}>
              {isPublic && <div className="w-2 h-2 rounded-full bg-white" />}
            </div>
          </div>
          <div className="flex-1">
            <div className="text-base font-semibold text-foreground flex items-center gap-2">
              <Eye className="h-4 w-4" />
              Pública
            </div>
            <p className="text-sm text-foreground/70 mt-1">
              Tu mesa de regalos aparecerá en la página de búsqueda. Cualquier persona puede encontrarla buscando tu nombre.
            </p>
          </div>
        </div>

        <div
          className="flex items-start space-x-4 p-5 rounded-2xl border-2 transition-all duration-200 cursor-pointer"
          style={{
            borderColor: !isPublic ? 'rgba(212, 112, 74, 0.35)' : 'rgba(0, 0, 0, 0.06)',
            backgroundColor: !isPublic ? 'rgba(212, 112, 74, 0.04)' : 'transparent',
          }}
          onClick={() => onPublicChange(false)}>
          <div className="mt-1">
            <div
              className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${!isPublic ? 'border-[#d4704a] bg-[#d4704a]' : 'border-foreground/30'}`}>
              {!isPublic && <div className="w-2 h-2 rounded-full bg-white" />}
            </div>
          </div>
          <div className="flex-1">
            <div className="text-base font-semibold text-foreground flex items-center gap-2">
              <EyeOff className="h-4 w-4" />
              Privada
            </div>
            <p className="text-sm text-foreground/70 mt-1">
              Tu mesa de regalos <strong>no</strong> aparecerá en búsquedas. Solo las personas con el enlace directo podrán acceder a ella.
            </p>
          </div>
        </div>
      </div>

      <div className="bg-blue-50 border border-blue-200 rounded-xl p-4">
        <div className="flex items-start gap-2">
          <AlertCircle className="h-5 w-5 text-blue-600 mt-0.5 shrink-0" />
          <p className="text-sm text-blue-900 font-medium">
            {isPublic
              ? 'Tu mesa es visible en la página de búsqueda. Los invitados también pueden acceder con tu enlace directo.'
              : `Tu mesa solo es accesible mediante tu enlace: mesalista.com.mx/${userSlug || 'tu-enlace'}`}
          </p>
        </div>
      </div>
    </section>
  );
}
