/**
 * Brain Kit Complete — StoreKit bridge contract.
 * Wire Capgo `@capgo/native-purchases` (or Capawesome / custom Swift) on Codemagic Mac.
 * Never grant Complete from web preview localStorage in the App Store binary.
 *
 * PRICES NOT LOCKED — do not invent dollars; Mike/Grok must approve before ASC products go live.
 *
 * After `npm install` (dep pinned in package.json), real wiring looks like:
 *   // import { NativePurchases } from '@capgo/native-purchases';
 * Then replace the TODO bodies below. Keep this file compiling without the native
 * import until Codemagic Mac runs cap sync + IAP capability — comments only for now.
 */

export type CompletePlan = 'yearly' | 'monthly';

export const PRODUCT_IDS = {
  yearly: 'com.brainkit.complete.yearly',
  monthly: 'com.brainkit.complete.monthly',
} as const;

// Never hardcode dollar amounts here — only product ID constants + TBD comments below.

/** TBD — never invent dollar amounts in docs or UI until Mike/Grok approve. */
export const PRODUCT_PRICE_STATUS = {
  yearly: 'TBD — price not locked',
  monthly: 'TBD — price not locked',
} as const;

export type PurchaseResult =
  | { ok: true; productId: string }
  | { ok: false; reason: 'cancelled' | 'pending' | 'failed' | 'not_wired' | 'not_native'; message?: string };

export type RestoreResult =
  | { ok: true; active: boolean; productId?: string }
  | { ok: false; reason: 'failed' | 'not_wired' | 'not_native'; message?: string };

/** Debounce window to avoid restore storms on cold start */
const RESTORE_DEBOUNCE_MS = 8000;
let lastRestoreAt = 0;

function isNative(): boolean {
  try {
    return typeof (window as unknown as { Capacitor?: { isNativePlatform?: () => boolean } }).Capacitor?.isNativePlatform === 'function'
      && !!(window as unknown as { Capacitor: { isNativePlatform: () => boolean } }).Capacitor.isNativePlatform();
  } catch {
    return false;
  }
}

/**
 * Call only AFTER parent PIN succeeds.
 * Replace body with real plugin purchase(PRODUCT_IDS[plan]).
 */
export async function purchaseComplete(plan: CompletePlan): Promise<PurchaseResult> {
  if (!isNative()) {
    return { ok: false, reason: 'not_native', message: 'Use App Store build for real IAP' };
  }
  // TODO(Codemagic): after npm install + cap sync —
  //   import { NativePurchases } from '@capgo/native-purchases';
  //   await NativePurchases.purchaseProduct({ productIdentifier: PRODUCT_IDS[plan] })
  return { ok: false, reason: 'not_wired', message: 'StoreKit plugin not linked yet' };
}

/**
 * Debounced restore — do not call on every launch without user/parent intent.
 */
export async function restoreComplete(opts?: { force?: boolean }): Promise<RestoreResult> {
  const now = Date.now();
  if (!opts?.force && now - lastRestoreAt < RESTORE_DEBOUNCE_MS) {
    return { ok: false, reason: 'failed', message: 'Restore debounced — try again shortly' };
  }
  lastRestoreAt = now;
  if (!isNative()) {
    return { ok: false, reason: 'not_native', message: 'Restore only on device' };
  }
  // TODO(Codemagic): import { NativePurchases } from '@capgo/native-purchases';
  //   await NativePurchases.restorePurchases() — then verify PRODUCT_IDS entitlement
  return { ok: false, reason: 'not_wired', message: 'StoreKit plugin not linked yet' };
}

/** Production: entitlement from StoreKit only — never trust web preview flags */
export async function getCompleteActive(): Promise<boolean> {
  if (!isNative()) return false;
  // TODO(Codemagic): NativePurchases — query active subscription for PRODUCT_IDS
  return false;
}

export const STOREKIT_RULES = {
  parentGateBeforePurchase: true,
  neverTrustWebPreviewUnlock: true,
  productIds: PRODUCT_IDS,
  pricesNotLocked: true,
} as const;
