// Helper function to calculate gross amount from net amount with fees
function grossUp({ net, percent, fixed, tax }: { net: number; percent: number; fixed: number; tax: number }) {
  const gross = (net + fixed * (1 + tax)) / (1 - percent * (1 + tax));

  return Math.round(gross * 100) / 100;
}

// Mexico stripe fees
export const stripeMexico = (net: number) => grossUp({ net, percent: 0.036, fixed: 3, tax: 0.16 });

// Mexico paypal fees
export const paypalMexico = (net: number) => grossUp({ net, percent: 0.0395, fixed: 4, tax: 0.16 });

// Mexico paypal breakdown
export function paypalMexicoBreakdown(gross: number) {
  const percent = 0.0395;
  const fixed = 4;
  const tax = 0.16;

  const fee = gross * percent + fixed;
  const iva = fee * tax;
  const totalFee = fee + iva;
  const net = gross - totalFee;

  return {
    gross: Number(gross.toFixed(2)),
    fee: Number(fee.toFixed(2)),
    iva: Number(iva.toFixed(2)),
    totalFee: Number(totalFee.toFixed(2)),
    net: Number(net.toFixed(2)),
  };
}

// Mexico stripe breakdown
export function stripeMexicoBreakdown(gross: number) {
  const percent = 0.036;
  const fixed = 3;
  const tax = 0.16;

  const fee = gross * percent + fixed;
  const iva = fee * tax;
  const totalFee = fee + iva;
  const net = gross - totalFee;

  return {
    gross: Number(gross.toFixed(2)),
    fee: Number(fee.toFixed(2)),
    iva: Number(iva.toFixed(2)),
    totalFee: Number(totalFee.toFixed(2)),
    net: Number(net.toFixed(2)),
  };
}
