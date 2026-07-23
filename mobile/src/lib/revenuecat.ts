import { Platform } from 'react-native';
import Constants from 'expo-constants';
import type { PurchasesPackage } from 'react-native-purchases';

/**
 * RevenueCat / Apple In-App Purchase for the fixed plan (iOS only).
 *
 * `react-native-purchases` ships native code that is NOT present in Expo Go or on
 * web, so everything here lazy-requires the module and no-ops where it's missing.
 * Only real development / EAS builds on iOS exercise the native path; the rest of
 * the app keeps working in Expo Go.
 *
 * Config comes from EXPO_PUBLIC_* env vars (see .env):
 *   EXPO_PUBLIC_REVENUECAT_IOS_KEY          public SDK key from RevenueCat
 *   EXPO_PUBLIC_REVENUECAT_ENTITLEMENT_ID   entitlement id (default "fixed_plan")
 *   EXPO_PUBLIC_REVENUECAT_OFFERING_ID      offering id (optional; else current)
 */
const IOS_KEY = process.env.EXPO_PUBLIC_REVENUECAT_IOS_KEY?.trim() || '';
const ENTITLEMENT_ID = process.env.EXPO_PUBLIC_REVENUECAT_ENTITLEMENT_ID?.trim() || 'fixed_plan';
const OFFERING_ID = process.env.EXPO_PUBLIC_REVENUECAT_OFFERING_ID?.trim() || '';

function loadPurchases(): typeof import('react-native-purchases').default | null {
  // Expo Go reports appOwnership 'expo'; the native module is absent there.
  if (Platform.OS !== 'ios' || Constants.appOwnership === 'expo') return null;
  try {
    return require('react-native-purchases').default;
  } catch {
    return null;
  }
}

/** Whether the fixed-plan IAP can actually run here (native module + key present). */
export function isIapAvailable(): boolean {
  return !!IOS_KEY && !!loadPurchases();
}

/** Fresh RevenueCat app user id for one signup attempt (held stable in the screen). */
export function newIapUserId(): string {
  return `rc_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 10)}`;
}

let configured = false;
function configure(Purchases: NonNullable<ReturnType<typeof loadPurchases>>): void {
  if (configured) return;
  Purchases.configure({ apiKey: IOS_KEY });
  configured = true;
}

export interface IapResult {
  entitled: boolean;
  userCancelled: boolean;
}

/**
 * Run the native Apple purchase for the fixed plan under `appUserId`, returning
 * whether the entitlement is now active. This drives the UI only — the server
 * re-verifies the entitlement with RevenueCat before provisioning the account.
 */
export async function purchaseFixedPlan(appUserId: string): Promise<IapResult> {
  const Purchases = loadPurchases();
  if (!Purchases || !IOS_KEY) {
    throw new Error('Las compras no están disponibles en esta versión de la app');
  }

  configure(Purchases);
  await Purchases.logIn(appUserId);

  const offerings = await Purchases.getOfferings();
  const offering = (OFFERING_ID && offerings.all[OFFERING_ID]) || offerings.current;
  const pkg: PurchasesPackage | undefined = offering?.availablePackages?.[0];
  if (!pkg) {
    throw new Error('No hay un plan disponible para comprar');
  }

  try {
    const { customerInfo } = await Purchases.purchasePackage(pkg);
    return { entitled: !!customerInfo.entitlements.active[ENTITLEMENT_ID], userCancelled: false };
  } catch (e: any) {
    if (e?.userCancelled) return { entitled: false, userCancelled: true };
    throw e;
  }
}
