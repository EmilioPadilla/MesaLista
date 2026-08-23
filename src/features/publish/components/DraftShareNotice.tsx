import { useNavigate } from 'react-router-dom';
import { AlertTriangle } from 'lucide-react';
import { Button } from 'components/core/Button';

interface DraftShareNoticeProps {
  /** Couple slug, used to link back to the builder where publishing happens. */
  userSlug?: string;
  /** What the couple was about to share, e.g. "tu invitación". */
  subject?: string;
}

/**
 * Shown above anything that produces a link guests will follow — invitations,
 * RSVP collection, share buttons — while the registry is still a draft.
 *
 * A draft's public URL 404s, so the failure mode this prevents is a couple
 * mailing a dead link to two hundred guests and only finding out afterwards.
 */
export function DraftShareNotice({ userSlug, subject = 'esto' }: DraftShareNoticeProps) {
  const navigate = useNavigate();

  return (
    <div className="mx-auto mb-6 max-w-5xl rounded-2xl border-2 border-amber-300 bg-amber-50 p-5">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-start gap-3">
          <AlertTriangle className="mt-0.5 h-5 w-5 flex-none text-amber-600" />
          <div>
            <h3 className="mb-1 text-base font-semibold text-amber-900">Tu mesa todavía no está publicada</h3>
            <p className="mb-0 text-sm text-amber-800">
              Puedes preparar {subject} sin problema, pero el enlace no funcionará para tus invitados hasta que publiques tu mesa.
            </p>
          </div>
        </div>
        <Button
          onClick={() => navigate(`/${userSlug}/gestionar`)}
          className="flex-none rounded-full border-0 bg-amber-600 px-6 py-2.5 text-white shadow-md transition-all hover:shadow-lg">
          Publicar mesa
        </Button>
      </div>
    </div>
  );
}
