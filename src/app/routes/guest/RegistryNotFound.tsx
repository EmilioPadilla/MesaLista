import { Link, useNavigate } from 'react-router-dom';
import { RotateCw, Search } from 'lucide-react';
import { PageSEO } from 'src/components/seo';

/** MesaLista's bow mark, lifted from the isotipo and used here as a crest. */
const BOW_PATH =
  'M76.24,5.85S65.36-2.27,55.64,1,41.33,18.26,41.33,18.26L38,11.57a21.63,21.63,0,0,0-3.15-4.63A27.36,27.36,0,0,0,29.48,2C26.54.31,25.51-.12,19,0S5.36,5,1.81,11A16.22,16.22,0,0,0,0,19.64c.18,1.68,1.46,3.92,2.78,5.68a15.22,15.22,0,0,0,5.31,4,39.8,39.8,0,0,0,4.74,1.56c2.48.63,4.7,1,7.48,1.74,10.21,2.79,21.46,4.93,21.46,4.93,1.36-2.23,31.13-3.27,38.55-12.64S76.24,5.85,76.24,5.85ZM6.09,23.48A6.74,6.74,0,0,1,4.63,20a10.87,10.87,0,0,1,2.72-9c2.7-2.93,7.58-7,14-7a14,14,0,0,1,13.13,8.45C11.81,8.62,14.36,27.68,14.36,27.68A15.44,15.44,0,0,1,6.09,23.48Zm32.64,9.6S33.06,31.86,27.6,30.3,17.1,27,17.93,22.84c0,0,1.5-6.75,11-7.38S40.2,31.79,40.2,31.79l.19,1.55ZM65,27.37c-3.51,2.2-21.69,6.25-21.69,6.25s.1-15.74,8.47-19.36,15,3.64,15.6,6S68.52,25.17,65,27.37Zm6.12-.7c1.37-7.14-1.41-11-4.73-13.59-6.64-5.2-15.25-3.79-15.77-3.27C57.15,3.19,60,4,61.93,4.07S75.8,7,78.36,15.14,71.13,26.67,71.13,26.67Z';

/**
 * One staggered reveal on load, in CSS rather than JS.
 *
 * This page exists precisely because something already went wrong, so its copy
 * must never depend on an animation library having run — and it collapses to
 * plain visible text when the reader asks for reduced motion.
 */
const REVEAL_CSS = `
@keyframes registry-rise {
  from { opacity: 0; transform: translateY(16px); }
  to   { opacity: 1; transform: none; }
}
.registry-rise { animation: registry-rise 0.8s cubic-bezier(0.22, 1, 0.36, 1) both; }
@media (prefers-reduced-motion: reduce) {
  .registry-rise { animation: none; }
}
`;

interface RegistryNotFoundProps {
  /** The slug the guest typed, echoed back so a typo is easy to spot. */
  slug?: string;
  /**
   * `not-found` covers both a slug nobody owns and a registry still in draft —
   * a guest must not be able to tell those apart, or an unpublished list leaks.
   * `error` is for a request that never got an answer.
   */
  variant?: 'not-found' | 'error';
  onRetry?: () => void;
}

export function RegistryNotFound({ slug, variant = 'not-found', onRetry }: RegistryNotFoundProps) {
  const navigate = useNavigate();
  const isError = variant === 'error';

  return (
    <>
      <PageSEO
        title={isError ? 'No pudimos cargar la mesa | MesaLista' : 'Mesa de regalos no encontrada | MesaLista'}
        description="No encontramos una mesa de regalos publicada en esta dirección."
        noindex
      />
      <style>{REVEAL_CSS}</style>

      <div className="relative flex min-h-[calc(100vh-4rem)] items-center justify-center overflow-hidden bg-[#fdfaf6] px-6 py-20">
        {/* Warm light falling from above. */}
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0"
          style={{ background: 'radial-gradient(110% 80% at 50% -10%, rgba(212,112,74,0.13), transparent 60%)' }}
        />

        {/* Fine dot grid, masked to a soft oval so it never reaches the edges. */}
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0"
          style={{
            backgroundImage: 'radial-gradient(rgba(212,112,74,0.22) 1px, transparent 1px)',
            backgroundSize: '24px 24px',
            maskImage: 'radial-gradient(48% 42% at 50% 46%, #000 0%, transparent 80%)',
            WebkitMaskImage: 'radial-gradient(48% 42% at 50% 46%, #000 0%, transparent 80%)',
          }}
        />

        <div className="relative z-10 w-full max-w-lg text-center">
          {/* Crest: hairline rules flanking the bow mark. */}
          <div className="registry-rise flex items-center justify-center gap-5" style={{ animationDelay: '0.05s' }}>
            <span className="h-px w-14 bg-gradient-to-r from-transparent to-[#d4704a]/45" />
            <svg aria-hidden viewBox="0 0 82.85 38" className="w-14 shrink-0">
              <path d={BOW_PATH} fill="#d4704a" fillOpacity={0.85} />
            </svg>
            <span className="h-px w-14 bg-gradient-to-l from-transparent to-[#d4704a]/45" />
          </div>

          <p className="registry-rise mb-5 text-[11px] uppercase tracking-[0.42em] text-[#c08a6d]" style={{ animationDelay: '0.12s' }}>
            {isError ? 'Algo salió mal' : ''}
          </p>

          <h1
            className="registry-rise mb-6 text-[2.35rem] leading-[1.1] text-[#2a211c] sm:text-[3.1rem]"
            style={{ fontFamily: "'Chamberi Headline', 'Questrial', serif", animationDelay: '0.2s' }}>
            {isError ? (
              <>
                No pudimos cargar
                <br />
                esta mesa de regalos
              </>
            ) : (
              <>
                Mesa de regalos
                <br />
                no encontrada
              </>
            )}
          </h1>

          <p className="registry-rise mx-auto max-w-md text-base leading-relaxed text-[#6b5c53]" style={{ animationDelay: '0.28s' }}>
            {isError
              ? 'La conexión con nuestro servidor falló. Vuelve a intentarlo en un momento.'
              : 'Esta dirección no corresponde a ninguna mesa publicada. Puede que el enlace tenga un error, o que la pareja todavía no haya publicado la suya.'}
          </p>

          {slug && !isError && (
            <p
              className="registry-rise mt-5 inline-block rounded-full border border-[#d4704a]/20 bg-white/70 px-4 py-1.5 text-sm text-[#a3918a]"
              style={{ animationDelay: '0.34s' }}>
              mesalista.com.mx/<span className="text-[#d4704a]">{slug}</span>
            </p>
          )}

          <div
            className="registry-rise mt-10 flex flex-col items-center justify-center gap-3 sm:flex-row"
            style={{ animationDelay: '0.42s' }}>
            {isError && onRetry ? (
              <button
                onClick={onRetry}
                className="inline-flex cursor-pointer items-center gap-2 rounded-full bg-[#d4704a] px-7 py-3 text-white shadow-[0_10px_24px_-12px_rgba(212,112,74,0.9)] transition-all hover:-translate-y-0.5 hover:bg-[#c3633f] hover:shadow-[0_16px_30px_-14px_rgba(212,112,74,0.95)]">
                <RotateCw className="h-4 w-4" />
                Reintentar
              </button>
            ) : (
              <button
                onClick={() => navigate('/buscar')}
                className="inline-flex cursor-pointer items-center gap-2 rounded-full bg-[#d4704a] px-7 py-3 text-white shadow-[0_10px_24px_-12px_rgba(212,112,74,0.9)] transition-all hover:-translate-y-0.5 hover:bg-[#c3633f] hover:shadow-[0_16px_30px_-14px_rgba(212,112,74,0.95)]">
                <Search className="h-4 w-4" />
                Buscar una mesa
              </button>
            )}

            <button
              onClick={() => navigate('/')}
              className="cursor-pointer rounded-full border border-[#d4704a]/30 px-7 py-3 text-[#8a6d5d] transition-all hover:-translate-y-0.5 hover:border-[#d4704a]/60 hover:text-[#d4704a]">
              Ir al inicio
            </button>
          </div>

          {!isError && (
            <p
              className="registry-rise mx-auto mt-12 max-w-sm border-t border-[#d4704a]/15 pt-6 text-sm text-[#a3918a]"
              style={{ animationDelay: '0.5s' }}>
              ¿Es tu mesa? {/* `!` because antd's unlayered `a` reset outranks Tailwind's utility layer. */}
              <Link to="/login" className="text-[#d4704a]! font-normal underline-offset-4 hover:underline">
                Inicia sesión
              </Link>{' '}
              para verla y publicarla.
            </p>
          )}
        </div>
      </div>
    </>
  );
}
