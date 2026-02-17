import { useState } from 'react';
import { CreditCard, Calculator, TrendingUp, AlertCircle, Save } from 'lucide-react';
import { Input } from 'antd';
import { Button } from 'components/core/Button';

interface FeePreferenceSectionProps {
  feePreference: 'couple' | 'guest';
  onFeePreferenceChange: (preference: 'couple' | 'guest') => void;
  onSave: () => void;
  hasChanges: boolean;
}

export function FeePreferenceSection({ feePreference, onFeePreferenceChange, onSave, hasChanges }: FeePreferenceSectionProps) {
  const [calculatorAmount, setCalculatorAmount] = useState('1000');

  // Fee calculator logic
  const calcAmount = parseFloat(calculatorAmount || '0');
  const stripeFee = calcAmount * 0.036 + 3;
  const paypalFee = calcAmount * 0.0399 + 4;
  const stripeTotal = feePreference === 'guest' ? calcAmount + stripeFee : calcAmount;
  const paypalTotal = feePreference === 'guest' ? calcAmount + paypalFee : calcAmount;
  const coupleReceivesStripe = calcAmount - stripeFee;
  const coupleReceivesPaypal = calcAmount - paypalFee;

  return (
    <section className="space-y-6">
      <div>
        <h2 className="text-3xl tracking-tight text-foreground mb-2 flex items-center gap-3">
          <CreditCard className="h-8 w-8 text-[#d4704a]" />
          Comisiones de Pago
        </h2>
        <p className="text-muted-foreground font-light">
          Decide cómo manejar las comisiones de las plataformas de pago (Stripe y PayPal)
        </p>
      </div>

      {/* Fee Preference Selection */}
      <div className="space-y-4">
        <div
          className="flex items-start space-x-4 p-5 rounded-2xl border-2 transition-all duration-200 cursor-pointer"
          style={{
            borderColor: feePreference === 'couple' ? 'rgba(212, 112, 74, 0.3)' : 'transparent',
            backgroundColor: feePreference === 'couple' ? 'rgba(212, 112, 74, 0.03)' : 'transparent',
          }}
          onClick={() => onFeePreferenceChange('couple')}>
          <div className="mt-1">
            <div
              className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${feePreference === 'couple' ? 'border-[#d4704a] bg-[#d4704a]' : 'border-gray-300'}`}>
              {feePreference === 'couple' && <div className="w-2 h-2 rounded-full bg-white" />}
            </div>
          </div>
          <div className="flex-1">
            <div className="text-base font-medium text-foreground">Nosotros (la pareja) absorberemos las comisiones</div>
            <p className="text-sm text-muted-foreground font-light mt-1">
              Tus invitados pagarán exactamente el monto del regalo. Las comisiones de pago se deducirán de lo que recibas.
            </p>
          </div>
        </div>

        <div
          className="flex items-start space-x-4 p-5 rounded-2xl border-2 transition-all duration-200 cursor-pointer"
          style={{
            borderColor: feePreference === 'guest' ? 'rgba(212, 112, 74, 0.3)' : 'transparent',
            backgroundColor: feePreference === 'guest' ? 'rgba(212, 112, 74, 0.03)' : 'transparent',
          }}
          onClick={() => onFeePreferenceChange('guest')}>
          <div className="mt-1">
            <div
              className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${feePreference === 'guest' ? 'border-[#d4704a] bg-[#d4704a]' : 'border-gray-300'}`}>
              {feePreference === 'guest' && <div className="w-2 h-2 rounded-full bg-white" />}
            </div>
          </div>
          <div className="flex-1">
            <div className="text-base font-medium text-foreground">Los invitados pagarán las comisiones</div>
            <p className="text-sm text-muted-foreground font-light mt-1">
              Las comisiones de pago se añadirán al total que pagan tus invitados. Recibirás el monto completo del regalo.
            </p>
          </div>
        </div>
      </div>

      {/* Fee Calculator */}
      <div className="bg-linear-to-br from-[#f5f5f7] to-white rounded-2xl p-6 border border-border/30">
        <div className="flex items-center gap-2 mb-4">
          <Calculator className="h-5 w-5 text-[#d4704a]" />
          <h3 className="text-lg text-foreground">Calculadora de Comisiones</h3>
        </div>

        <div className="space-y-4">
          <div>
            <label className="text-sm text-muted-foreground mb-2 block">Monto del regalo (MXN)</label>
            <Input
              type="number"
              value={calculatorAmount}
              onChange={(e) => setCalculatorAmount(e.target.value)}
              placeholder="1000"
              className="h-12 px-4 bg-white!"
            />
          </div>

          {/* Comparison Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-6">
            {/* Stripe Card */}
            <div className="rounded-xl border-2 border-[#635BFF]/20 overflow-hidden">
              <div className="bg-linear-to-br from-[#635BFF]/5 to-transparent p-4">
                <div className="flex items-center justify-between">
                  <span className="text-base font-medium text-foreground">Stripe</span>
                  <div className="w-8 h-8 bg-[#635BFF] rounded-lg flex items-center justify-center">
                    <CreditCard className="h-4 w-4 text-white" />
                  </div>
                </div>
              </div>
              <div className="p-4 space-y-3">
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Comisión:</span>
                  <span className="font-medium text-foreground">${stripeFee.toFixed(2)}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">
                    {feePreference === 'guest' ? 'Total a pagar:' : 'Ustedes reciben:'}
                  </span>
                  <span className="font-semibold text-[#635BFF]">
                    ${(feePreference === 'guest' ? stripeTotal : coupleReceivesStripe).toFixed(2)}
                  </span>
                </div>
              </div>
            </div>

            {/* PayPal Card */}
            <div className="rounded-xl border-2 border-[#0070BA]/20 overflow-hidden">
              <div className="bg-linear-to-br from-[#0070BA]/5 to-transparent p-4">
                <div className="flex items-center justify-between">
                  <span className="text-base font-medium text-foreground">PayPal</span>
                  <div className="w-8 h-8 bg-[#0070BA] rounded-lg flex items-center justify-center">
                    <TrendingUp className="h-4 w-4 text-white" />
                  </div>
                </div>
              </div>
              <div className="p-4 space-y-3">
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Comisión:</span>
                  <span className="font-medium text-foreground">${paypalFee.toFixed(2)}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">
                    {feePreference === 'guest' ? 'Total a pagar:' : 'Ustedes reciben:'}
                  </span>
                  <span className="font-semibold text-[#0070BA]">
                    ${(feePreference === 'guest' ? paypalTotal : coupleReceivesPaypal).toFixed(2)}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Info Box */}
          <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 mt-4">
            <div className="flex items-start gap-2">
              <AlertCircle className="h-5 w-5 text-blue-500 mt-0.5 shrink-0" />
              <p className="text-sm text-blue-800 font-light">
                {feePreference === 'couple'
                  ? 'Con esta opción, tus invitados pagan exactamente el monto del regalo, pero las comisiones se deducen de lo que recibes.'
                  : 'Con esta opción, las comisiones se añaden al total que pagan tus invitados, y recibes el monto completo del regalo.'}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Save Button */}
      <div className="flex justify-center pt-4">
        <Button
          onClick={onSave}
          disabled={!hasChanges}
          className="px-8 py-3 bg-[#d4704a] hover:bg-[#c25f3a] text-white rounded-full transition-all duration-200 flex items-center gap-2 border-0 disabled:opacity-50 disabled:cursor-not-allowed">
          <Save className="h-5 w-5" />
          Guardar configuración
        </Button>
      </div>
    </section>
  );
}
