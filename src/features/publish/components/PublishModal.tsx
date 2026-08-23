import { useMemo, useState } from 'react';
import { Modal, Input, Checkbox, message } from 'antd';
import { Check, CreditCard, TrendingUp, Tag } from 'lucide-react';
import { usePublishGiftList, useUpdateGiftList } from 'src/hooks/useGiftList';
import { useCreatePlanCheckoutSession } from 'src/hooks/usePayment';
import { useValidateDiscountCode } from 'src/hooks/useDiscountCode';
import { useTrackEvent } from 'src/hooks/useAnalyticsTracking';
import { Button } from 'components/core/Button';
import { comparePlans, discountedFixedPrice, COMMISSION_RATE, PLAN_BREAK_EVEN_MXN } from 'config/plans';

const formatMXN = (amount: number) => `$${Math.round(amount).toLocaleString('es-MX')} MXN`;

interface PublishModalProps {
  open: boolean;
  onClose: () => void;
  giftListId: number;
  /** Sum of the gifts already on the list, used to seed the goal input. */
  suggestedGoal?: number;
}

/**
 * The paywall, moved from signup to publish.
 *
 * By the time a couple sees this they have a registry they can look at, which is
 * the whole point of the re-sequencing. The goal input turns the plan comparison
 * into their own arithmetic rather than an abstract table: the fixed plan pays
 * for itself above ~$66,667 MXN in gifts, and most registries clear that.
 */
export function PublishModal({ open, onClose, giftListId, suggestedGoal }: PublishModalProps) {
  const [goalInput, setGoalInput] = useState(suggestedGoal ? String(Math.round(suggestedGoal)) : '');
  const [discountCode, setDiscountCode] = useState('');
  const [isRedirecting, setIsRedirecting] = useState(false);
  // Drafts are created hidden, so this is the couple's first real say on
  // visibility. Checked by default: a registry reaching this screen is built and
  // about to be paid for, which is what search results are for.
  const [isPublic, setIsPublic] = useState(true);

  const { mutateAsync: publishGiftList, isPending: isPublishing } = usePublishGiftList();
  const { mutateAsync: updateGiftList } = useUpdateGiftList();
  const { mutateAsync: createPlanCheckout } = useCreatePlanCheckoutSession();
  const { data: discountCodeInfo, isError: isDiscountCodeError } = useValidateDiscountCode(discountCode);
  const trackEvent = useTrackEvent();

  const discountValid = discountCodeInfo ? true : isDiscountCodeError ? false : null;
  const fixedPrice = useMemo(() => discountedFixedPrice(discountValid ? discountCodeInfo : null), [discountValid, discountCodeInfo]);

  const goal = Number(goalInput.replace(/[^\d]/g, ''));
  const comparison = useMemo(() => comparePlans(goal, fixedPrice), [goal, fixedPrice]);
  const hasGoal = goal > 0;

  /**
   * Writes the visibility choice to the draft before it goes live.
   *
   * Done as a separate update rather than a publish argument because the fixed
   * plan publishes server-side (Stripe webhook), long after this screen is gone —
   * setting it on the draft first is the one mechanism that works for both plans.
   * The value is inert until `publishedAt` is stamped, so an abandoned checkout
   * leaves nothing visible.
   */
  const applyVisibility = () => updateGiftList({ id: giftListId, data: { isPublic } });

  const handlePublishCommission = async () => {
    try {
      await applyVisibility();
      await publishGiftList(giftListId);
      trackEvent('REGISTRY_PUBLISHED', { plan: 'COMMISSION', giftListId });
      message.success('¡Tu mesa de regalos ya está publicada!');
      onClose();
    } catch (error: any) {
      message.error(error?.response?.data?.error || 'No pudimos publicar tu mesa. Intenta de nuevo.');
    }
  };

  const handlePublishFixed = async () => {
    setIsRedirecting(true);
    try {
      await applyVisibility();
      trackEvent('START_CHECKOUT', { plan: 'FIXED', giftListId, method: 'stripe' });
      const baseUrl = window.location.origin;
      const checkout = await createPlanCheckout({
        planType: 'FIXED',
        giftListId,
        successUrl: `${baseUrl}/registro-exitoso?session_id={CHECKOUT_SESSION_ID}`,
        cancelUrl: `${window.location.href}`,
        ...(discountCode && discountValid && { discountCode }),
      });

      if (checkout.success && checkout.url) {
        window.location.href = checkout.url;
      } else {
        message.error('Error al crear la sesión de pago');
        setIsRedirecting(false);
      }
    } catch (error: any) {
      const reason = error?.response?.data?.message || error?.response?.data?.error;
      trackEvent('CHECKOUT_ERROR', { plan: 'FIXED', giftListId, method: 'stripe', error: reason });
      message.error(reason || 'Error al procesar el pago. Intenta de nuevo.');
      setIsRedirecting(false);
    }
  };

  const busy = isPublishing || isRedirecting;

  return (
    <Modal open={open} onCancel={onClose} footer={null} width={720} centered destroyOnClose>
      <div className="py-2">
        <div className="text-center mb-6">
          <h2 className="text-2xl sm:text-3xl mb-2 text-foreground">Publica tu mesa de regalos</h2>
          <p className="text-muted-foreground">Elige cómo quieres pagar. Puedes cambiar de opinión hasta que publiques.</p>
        </div>

        {/* Goal input — turns the comparison into the couple's own numbers */}
        <div className="bg-[#faf8f6] rounded-2xl p-4 mb-6">
          <label htmlFor="publish-goal" className="block text-sm font-medium text-foreground mb-2">
            ¿Cuánto esperas recibir en regalos?
          </label>
          <Input
            id="publish-goal"
            size="large"
            inputMode="numeric"
            prefix="$"
            suffix="MXN"
            placeholder="150,000"
            value={goalInput}
            onChange={(e) => setGoalInput(e.target.value)}
          />
          {hasGoal ? (
            <p className="text-sm mt-3 mb-0">
              {comparison.cheaper === 'fixed' ? (
                <span className="text-green-700">
                  Con esa meta, el <strong>Plan Fijo</strong> te ahorra <strong>{formatMXN(comparison.fixedSavings)}</strong>.
                </span>
              ) : (
                <span className="text-[#d4704a]">
                  Con esa meta, el <strong>Plan por Comisión</strong> te sale más barato por{' '}
                  <strong>{formatMXN(Math.abs(comparison.fixedSavings))}</strong>.
                </span>
              )}
            </p>
          ) : (
            <p className="text-sm text-muted-foreground mt-3 mb-0">
              A partir de {formatMXN(PLAN_BREAK_EVEN_MXN)} el Plan Fijo sale más barato.
            </p>
          )}
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-6">
          {/* Fixed plan */}
          <div className="border-2 border-border/30 rounded-2xl p-5 flex flex-col">
            <div className="w-11 h-11 bg-[#d4704a]/10 rounded-full flex items-center justify-center mb-3">
              <CreditCard className="h-5 w-5 text-[#d4704a]" />
            </div>
            <h3 className="text-lg font-semibold text-foreground mb-1">Plan Fijo</h3>
            <div className="mb-1">
              {fixedPrice < 2000 ? (
                <>
                  <span className="text-sm text-muted-foreground line-through mr-2">$2,000 MXN</span>
                  <span className="text-2xl text-green-600 font-bold">{formatMXN(fixedPrice)}</span>
                </>
              ) : (
                <span className="text-2xl text-[#d4704a] font-bold">{formatMXN(fixedPrice)}</span>
              )}
            </div>
            <p className="text-sm text-muted-foreground mb-3">Pago único, sin comisiones por regalo</p>
            {hasGoal && (
              <p className="text-sm text-foreground mb-3">
                Pagas <strong>{formatMXN(fixedPrice)}</strong> en total.
              </p>
            )}
            <ul className="text-sm text-muted-foreground space-y-1 mb-4 flex-1">
              <li>• Te quedas con el 100% de los regalos</li>
              <li>• Precio único, sin importar cuánto recibas</li>
              <li>• Gestión de RSVP e invitaciones</li>
            </ul>
            <Button
              onClick={handlePublishFixed}
              disabled={busy}
              className="w-full py-2.5 bg-[#d4704a] text-white rounded-full border-0 shadow-md hover:shadow-lg transition-all">
              {isRedirecting ? 'Redirigiendo...' : `Pagar y publicar`}
            </Button>
          </div>

          {/* Commission plan */}
          <div className="border-2 border-border/30 rounded-2xl p-5 flex flex-col">
            <div className="w-11 h-11 bg-green-100 rounded-full flex items-center justify-center mb-3">
              <TrendingUp className="h-5 w-5 text-green-600" />
            </div>
            <h3 className="text-lg font-semibold text-foreground mb-1">Plan por Comisión</h3>
            <div className="mb-1">
              <span className="text-2xl text-green-600 font-bold">{(COMMISSION_RATE * 100).toFixed(2)}%</span>
            </div>
            <p className="text-sm text-muted-foreground mb-3">Sin costo inicial, pagas solo cuando recibes</p>
            {hasGoal && (
              <p className="text-sm text-foreground mb-3">
                Pagarías <strong>{formatMXN(comparison.commissionCost)}</strong> sobre esa meta.
              </p>
            )}
            <ul className="text-sm text-muted-foreground space-y-1 mb-4 flex-1">
              <li>• Publicas hoy sin pagar nada</li>
              <li>• Solo cobramos sobre lo que recibas</li>
              <li>• Gestión de RSVP e invitaciones</li>
            </ul>
            <Button
              onClick={handlePublishCommission}
              disabled={busy}
              className="w-full py-2.5 bg-white text-[#d4704a] border-2 border-[#d4704a] rounded-full hover:bg-[#d4704a]/5 transition-all">
              {isPublishing ? 'Publicando...' : 'Publicar gratis'}
            </Button>
          </div>
        </div>

        {/* Visibility — drafts are hidden, so this is where the couple chooses */}
        <div className="bg-[#faf8f6] rounded-2xl p-4 mb-4">
          <Checkbox checked={isPublic} onChange={(e) => setIsPublic(e.target.checked)} disabled={busy}>
            <span className="text-sm text-foreground">Mostrar mi mesa en la búsqueda pública de MesaLista</span>
          </Checkbox>
          <p className="text-xs text-muted-foreground mt-2 mb-0 pl-6">
            Tu enlace funciona igual la elijas o no — solo cambia si aparece en nuestra búsqueda. Puedes cambiarlo cuando quieras
            desde Configuración.
          </p>
        </div>

        {/* Discount code — moved here with the payment */}
        <div className="flex items-center gap-2">
          <Tag className="h-4 w-4 text-muted-foreground flex-none" />
          <Input
            placeholder="¿Tienes un código de descuento?"
            value={discountCode}
            onChange={(e) => setDiscountCode(e.target.value.toUpperCase())}
            className="flex-1"
          />
          {discountValid === true && (
            <span className="text-sm text-green-700 flex items-center gap-1 flex-none">
              <Check className="h-4 w-4" /> Aplicado
            </span>
          )}
          {discountValid === false && discountCode.length > 2 && <span className="text-sm text-red-500 flex-none">No válido</span>}
        </div>
        <p className="text-xs text-muted-foreground mt-2 mb-0">El código solo se aplica al Plan Fijo.</p>
      </div>
    </Modal>
  );
}
