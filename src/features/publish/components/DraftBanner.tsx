import { Eye, Rocket } from 'lucide-react';
import { Button } from 'components/core/Button';
import { checkPublishReadiness } from '../utils/readiness';

interface DraftBannerProps {
  giftCount: number;
  eventDate?: string | Date | null;
  coverImageUrl?: string | null;
  onPublish: () => void;
}

/**
 * Persistent reminder that the registry isn't live yet, shown above the builder.
 *
 * When the list isn't ready it says exactly what's missing rather than silently
 * disabling the button — a greyed-out CTA with no explanation is the fastest way
 * to lose a couple who was ready to pay.
 */
export function DraftBanner({ giftCount, eventDate, coverImageUrl, onPublish }: DraftBannerProps) {
  const { ready, missing } = checkPublishReadiness({ giftCount, eventDate, coverImageUrl });

  return (
    <div className="mb-6 rounded-2xl border-2 border-[#d4704a]/25 bg-[#d4704a]/5 p-5">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-start gap-3">
          <div className="mt-0.5 flex h-9 w-9 flex-none items-center justify-center rounded-full bg-[#d4704a]/15">
            <Eye className="h-4 w-4 text-[#d4704a]" />
          </div>
          <div>
            <h3 className="mb-1 text-base font-semibold text-foreground">Tu mesa todavía es un borrador</h3>
            <p className="mb-0 text-sm text-muted-foreground">
              {ready
                ? 'Solo tú puedes verla. Publícala para compartirla con tus invitados y empezar a recibir regalos.'
                : 'Solo tú puedes verla. Para publicarla te falta:'}
            </p>
            {!ready && (
              <ul className="mb-0 mt-2 space-y-1 text-sm text-[#d4704a]">
                {missing.map((item) => (
                  <li key={item}>• {item}</li>
                ))}
              </ul>
            )}
          </div>
        </div>

        <Button
          onClick={onPublish}
          disabled={!ready}
          className="flex-none rounded-full border-0 bg-[#d4704a] px-6 py-2.5 text-white shadow-md transition-all hover:shadow-lg disabled:cursor-not-allowed disabled:opacity-50">
          <Rocket className="mr-2 h-4 w-4" />
          Publicar mesa
        </Button>
      </div>
    </div>
  );
}
