import { useState, useEffect } from 'react';
import { CheckCircle2, XCircle, Heart, AlertCircle } from 'lucide-react';
import { message, Input, Button } from 'antd';
import { useNavigate } from 'react-router-dom';
import { useInviteeByCode, useRespondToRsvp, useRsvpMessages } from 'src/hooks/useRsvp';

interface Invitee {
  id: string;
  coupleId: number;
  firstName: string;
  lastName: string;
  tickets: number;
  secretCode: string;
  status: 'PENDING' | 'CONFIRMED' | 'REJECTED';
  confirmedTickets?: number;
}

export function GuestConfirmation() {
  const navigate = useNavigate();
  const [searchCode, setSearchCode] = useState('');
  const [confirmedTickets, setConfirmedTickets] = useState(1);
  const [guestMessage, setGuestMessage] = useState('');
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // React Query hooks
  const { data: invitee, refetch: searchInvitee, isLoading: searchLoading } = useInviteeByCode(searchCode, false);
  const { data: messages } = useRsvpMessages(invitee?.giftListId || 0, !!invitee);
  const respondMutation = useRespondToRsvp();

  // Update confirmed tickets when invitee is found
  useEffect(() => {
    if (invitee) {
      setConfirmedTickets(invitee.confirmedTickets || invitee.tickets);
      setError(null);
    }
  }, [invitee]);

  const handleSearch = async () => {
    setError(null);

    if (!searchCode.trim()) {
      setError('Por favor, ingresa tu código secreto');
      return;
    }

    try {
      await searchInvitee();
      if (!invitee) {
        setError('No se encontró ninguna invitación con este código');
      }
    } catch (error) {
      console.error('Error searching for invitee:', error);
      setError('Error al buscar la invitación. Por favor, intenta de nuevo.');
    }
  };

  const handleConfirm = async (confirm: boolean) => {
    if (!invitee) return;

    try {
      const response = await respondMutation.mutateAsync({
        secretCode: invitee.secretCode,
        status: confirm ? 'CONFIRMED' : 'REJECTED',
        confirmedTickets: confirm ? confirmedTickets : 0,
        guestMessage: guestMessage.trim() || undefined,
      });

      // Update the invitee with the response from the server
      // This ensures the UI shows the correct status immediately
      Object.assign(invitee, response);

      setSubmitted(true);
      message.success(confirm ? 'Asistencia confirmada' : 'Respuesta registrada');
    } catch (error) {
      console.error('Error confirming RSVP:', error);
      message.error('Error al confirmar. Por favor, intenta de nuevo.');
    }
  };

  const loading = searchLoading || respondMutation.isPending;

  if (submitted && invitee) {
    return (
      <div className="min-h-screen bg-linear-to-b from-[#faf9f8] to-white flex items-center justify-center px-4 py-12">
        <div className="max-w-md w-full">
          <div className="bg-white rounded-2xl shadow-lg border border-border/30 p-8 text-center">
            {invitee.status === 'CONFIRMED' ? (
              <>
                <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-[#34c759]/10 mb-6">
                  <CheckCircle2 className="h-8 w-8 text-[#34c759]" />
                </div>
                <h2 className="mb-3 text-foreground">¡Confirmado!</h2>
                <p className="text-muted-foreground mb-4">
                  Hola {invitee.firstName} {invitee.lastName},
                </p>
                <p className="text-muted-foreground mb-4">
                  Has confirmado tu asistencia con {confirmedTickets} {confirmedTickets === 1 ? 'boleto' : 'boletos'}.
                </p>
                <div className="bg-[#34c759]/5 border border-[#34c759]/10 rounded-xl p-5 mb-6">
                  <p className="text-muted-foreground leading-relaxed whitespace-pre-wrap">
                    {messages?.confirmationMessage || '¡Gracias por confirmar tu asistencia! Nos encantará verte en nuestra boda.'}
                  </p>
                </div>
              </>
            ) : (
              <>
                <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-[#ff9500]/10 mb-6">
                  <XCircle className="h-8 w-8 text-[#ff9500]" />
                </div>
                <h2 className="mb-3 text-foreground">Respuesta Registrada</h2>
                <p className="text-muted-foreground mb-4">
                  Gracias por tu respuesta, {invitee.firstName} {invitee.lastName}.
                </p>
                <div className="bg-[#ff9500]/5 border border-[#ff9500]/10 rounded-xl p-5 mb-6">
                  <p className="text-muted-foreground leading-relaxed whitespace-pre-wrap">
                    {messages?.cancellationMessage || 'Lamentamos que no puedas asistir. ¡Gracias por avisarnos!'}
                  </p>
                </div>
              </>
            )}

            <Button type="primary" onClick={() => navigate('/')} className="text-white rounded-xl px-6 py-3 w-full">
              Volver al Inicio
            </Button>
          </div>
        </div>
      </div>
    );
  }

  if (invitee && !submitted) {
    return (
      <div className="min-h-screen bg-linear-to-b` from-[#faf9f8] to-white flex items-center justify-center px-4 py-12">
        <div className="max-w-md w-full">
          <div className="bg-white rounded-2xl shadow-lg border border-border/30 p-8">
            <div className="text-center mb-8">
              <div className="inline-flex items-center justify-center w-16 h-16 rounded-full mb-4">
                <img src="/svg/MesaLista_isotipo.svg" className="w-24 h-24" alt="" />
              </div>
              <h2 className="text-foreground mb-2">¡Hola, {invitee.firstName}!</h2>
              <p className="text-muted-foreground">Por favor confirma tu asistencia</p>
            </div>

            {invitee.status === 'PENDING' ? (
              <>
                {/* Ticket Selection */}
                {invitee.tickets > 1 && (
                  <div className="mb-6">
                    <label htmlFor="tickets" className="mb-2 block">
                      ¿Cuántas personas asistirán?
                    </label>
                    <div className="flex items-center gap-3">
                      <Button
                        onClick={() => setConfirmedTickets(Math.max(1, confirmedTickets - 1))}
                        disabled={confirmedTickets <= 1}
                        className="border-primary! text-primary! hover:bg-primary! hover:text-white! rounded-xl w-12 h-12 disabled:opacity-50">
                        -
                      </Button>
                      <div className="flex-1 text-center">
                        <div className="text-3xl text-foreground">{confirmedTickets}</div>
                        <div className="text-sm text-muted-foreground">
                          de {invitee.tickets} {invitee.tickets === 1 ? 'boleto' : 'boletos'}
                        </div>
                      </div>
                      <Button
                        onClick={() => setConfirmedTickets(Math.min(invitee.tickets, confirmedTickets + 1))}
                        disabled={confirmedTickets >= invitee.tickets}
                        className="border-primary! text-primary! hover:bg-primary! hover:text-white! rounded-xl w-12 h-12 disabled:opacity-50">
                        +
                      </Button>
                    </div>
                  </div>
                )}

                {/* Guest Message */}
                <div className="mb-6">
                  <label htmlFor="guestMessage" className="mb-2 flex items-center gap-2 text-sm text-muted-foreground">
                    <Heart className="h-4 w-4" />
                    Mensaje para los novios (opcional)
                  </label>
                  <Input.TextArea
                    id="guestMessage"
                    value={guestMessage}
                    onChange={(e) => setGuestMessage(e.target.value)}
                    maxLength={500}
                    showCount
                    rows={4}
                    placeholder="Escribe un mensaje para los novios..."
                    className="rounded-xl bg-[#f5f5f7]! border-border/30"
                  />
                </div>

                {/* Action Buttons */}
                <div className="space-y-3">
                  <Button
                    onClick={() => handleConfirm(true)}
                    disabled={loading}
                    className="w-full bg-[#34c759]! hover:bg-[#2da54a]! text-white! rounded-xl py-3 flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed">
                    <CheckCircle2 className="h-5 w-5" />
                    {loading ? 'Confirmando...' : 'Confirmar Asistencia'}
                  </Button>
                  <Button
                    onClick={() => handleConfirm(false)}
                    disabled={loading}
                    className="w-full bg-white! hover:bg-[#f5f5f7]! text-foreground border border-border/30 rounded-xl py-3 flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed">
                    <XCircle className="h-5 w-5" />
                    {loading ? 'Procesando...' : 'No Podré Asistir'}
                  </Button>
                </div>
              </>
            ) : (
              <>
                {/* Already Responded */}
                <div className="bg-[#007aff]/5 border border-[#007aff]/10 rounded-xl p-4 mb-6">
                  <div className="flex gap-3">
                    <AlertCircle className="h-5 w-5 text-[#007aff] shrink-0 mt-0.5" />
                    <div>
                      <h4 className="text-foreground mb-1">Ya respondiste</h4>
                      <p className="text-sm text-muted-foreground">
                        {invitee.status === 'CONFIRMED' && invitee.confirmedTickets !== undefined
                          ? `Confirmaste tu asistencia con ${invitee.confirmedTickets} ${invitee.confirmedTickets === 1 ? 'boleto' : 'boletos'}.`
                          : 'Indicaste que no podrás asistir.'}
                      </p>
                    </div>
                  </div>
                </div>

                <p className="text-sm text-muted-foreground text-center mb-6">
                  Si necesitas cambiar tu respuesta, por favor contacta a los novios.
                </p>

                <Button
                  onClick={() => {
                    setSubmitted(false);
                    setSearchCode('');
                  }}
                  className="w-full bg-white hover:bg-[#f5f5f7] text-foreground border border-border/30 rounded-xl py-3">
                  Buscar Otra Invitación
                </Button>
              </>
            )}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-linear-to-b` from-[#faf9f8] to-white flex items-center justify-center px-4 py-12">
      <div className="max-w-md w-full">
        <div className="bg-white rounded-2xl shadow-lg border border-border/30 p-8">
          {/* Header */}
          <div className="text-center mb-8">
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-full mb-4">
              <img src="/svg/MesaLista_isotipo.svg" className="w-24 h-24" alt="" />
            </div>
            <h1 className="text-primary mb-2">Confirmación de Asistencia</h1>
            <p className="text-muted-foreground">Ingresa tu código secreto para confirmar tu asistencia</p>
          </div>

          {/* Form */}
          <div className="space-y-6">
            <div className="space-y-2">
              <label htmlFor="secretCode">Código Secreto</label>
              <Input
                id="secretCode"
                type="text"
                value={searchCode}
                onChange={(e) => setSearchCode(e.target.value.toUpperCase())}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    handleSearch();
                  }
                }}
                placeholder="ABC12345"
                className="bg-input-background border-border/30 rounded-xl shadow-sm text-center text-lg"
                maxLength={20}
              />
              <p className="text-sm text-muted-foreground">Este código debería estar en tu invitación</p>
            </div>

            {/* Error Message */}
            {error && (
              <div className="bg-[#ff3b30]/5 border border-[#ff3b30]/10 rounded-xl p-4">
                <div className="flex gap-3">
                  <AlertCircle className="h-5 w-5 text-[#ff3b30] shrink-0 mt-0.5" />
                  <p className="text-sm text-muted-foreground">{error}</p>
                </div>
              </div>
            )}

            {/* Submit Button */}
            <Button
              onClick={handleSearch}
              disabled={loading}
              className="w-full border-primary! text-primary! hover:bg-primary! hover:text-white! rounded-xl py-3 disabled:opacity-50 disabled:cursor-not-allowed">
              {loading ? 'Buscando...' : 'Buscar Invitación'}
            </Button>

            {/* Help Text */}
            <div className="bg-[#faf9f8] rounded-xl p-4">
              <p className="text-sm text-muted-foreground text-center">
                ¿No encuentras tu código? Contacta a los novios para más información.
              </p>
            </div>
          </div>
        </div>

        {/* Back to Home */}
        <div className="text-center mt-6">
          <button onClick={() => navigate('/')} className="text-sm text-muted-foreground hover:text-foreground transition-colors">
            ← Volver al inicio
          </button>
        </div>
      </div>
    </div>
  );
}
