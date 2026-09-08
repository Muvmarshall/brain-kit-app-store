/**
 * Brain Kit Complete — StoreKit bridge (Capgo `@capgo/native-purchases`).
 * Never grant Complete from web preview localStorage in the App Store binary.
 *
 * PRICES NOT LOCKED — do not invent dollars; Mike/Grok must approve before ASC products go live.
 *
 * Runtime for bundled www: also see `www/js/brainkit-iap.js` (`window.BrainKitIAP`).
 * Still needed on device/CI: In-App Purchase capability on the Xcode target; Sandbox QA.
 */

import { NativePurchases, PURCHASE_TYPE, type Transaction } from '@capgo/native-purchases';

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

const COMPLETE_ID_SET = new Set<string>(Object.values(PRODUCT_IDS));

function isNative(): boolean {
  try {
    return typeof (window as unknown as { Capacitor?: { isNativePlatform?: () => boolean } }).Capacitor?.isNativePlatform === 'function'
      && !!(window as unknown as { Capacitor: { isNativePlatform: () => boolean } }).Capacitor.isNativePlatform();
  } catch {
    return false;
  }
}

function errText(err: unknown): string {
  if (err && typeof err === 'object') {
    const e = err as { message?: string; code?: string | number };
    return [e.code != null ? String(e.code) : '', e.message || ''].filter(Boolean).join(' ').trim() || String(err);
  }
  return String(err);
}

function mapPurchaseError(err: unknown): PurchaseResult {
  const text = errText(err);
  const lower = text.toLowerCase();
  if (lower.includes('cancel') || lower.includes('user_cancelled') || lower.includes('usercancelled')) {
    return { ok: false, reason: 'cancelled', message: text };
  }
  if (lower.includes('pending') || lower.includes('payment_pending')) {
    return { ok: false, reason: 'pending', message: text };
  }
  return { ok: false, reason: 'failed', message: text };
}

function isActiveCompletePurchase(p: Transaction): boolean {
  if (!COMPLETE_ID_SET.has(p.productIdentifier)) return false;
  if (p.revocationDate) return false;
  if (p.subscriptionState === 'revoked' || p.subscriptionState === 'expired') return false;
  if (p.isActive === true) return true;
  if (p.isActive === false) return false;
  if (p.subscriptionState === 'subscribed' || p.subscriptionState === 'inGracePeriod' || p.subscriptionState === 'inBillingRetryPeriod') {
    return true;
  }
  if (p.expirationDate) {
    const exp = Date.parse(p.expirationDate);
    if (!Number.isNaN(exp)) return exp > Date.now();
  }
  return false;
}

async function queryActiveComplete(): Promise<{ active: boolean; productId?: string }> {
  const { purchases } = await NativePurchases.getPurchases({ productType: PURCHASE_TYPE.SUBS });
  const hit = purchases.find(isActiveCompletePurchase);
  if (!hit) return { active: false };
  return { active: true, productId: hit.productIdentifier };
}

/**
 * Call only AFTER parent PIN succeeds.
 * Capgo purchaseProduct for PRODUCT_IDS[plan] (Complete yearly/monthly).
 */
export async function purchaseComplete(plan: CompletePlan): Promise<PurchaseResult> {
  if (!isNative()) {
    return { ok: false, reason: 'not_native', message: 'Use App Store build for real IAP' };
  }
  const productIdentifier = PRODUCT_IDS[plan];
  try {
    const { isBillingSupported } = await NativePurchases.isBillingSupported();
    if (!isBillingSupported) {
      return { ok: false, reason: 'not_wired', message: 'Billing not supported on this device' };
    }
    const transaction = await NativePurchases.purchaseProduct({
      productIdentifier,
      productType: PURCHASE_TYPE.SUBS,
      quantity: 1,
    });
    return { ok: true, productId: transaction.productIdentifier || productIdentifier };
  } catch (err) {
    return mapPurchaseError(err);
  }
}

/**
 * Debounced restore — do not call on every launch without user/parent intent.
 * Parent PIN / parental gate BEFORE restore (Kids 1.3).
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
  try {
    await NativePurchases.restorePurchases();
    const entitlement = await queryActiveComplete();
    return { ok: true, active: entitlement.active, productId: entitlement.productId };
  } catch (err) {
    return { ok: false, reason: 'failed', message: errText(err) };
  }
}

/** Production: entitlement from StoreKit only — never trust web preview flags */
export async function getCompleteActive(): Promise<boolean> {
  if (!isNative()) return false;
  try {
    const entitlement = await queryActiveComplete();
    return entitlement.active;
  } catch {
    return false;
  }
}

export const STOREKIT_RULES = {
  parentGateBeforePurchase: true,
  neverTrustWebPreviewUnlock: true,
  productIds: PRODUCT_IDS,
  pricesNotLocked: true,
} as const;

/** Optional window bridge for typed consumers that import this module on device. */
export function attachBrainKitIAP(target: Window & typeof globalThis = window): void {
  (target as unknown as { BrainKitIAP?: unknown }).BrainKitIAP = {
    PRODUCT_IDS,
    PRODUCT_PRICE_STATUS,
    STOREKIT_RULES,
    purchaseComplete,
    restoreComplete,
    getCompleteActive,
  };
}

try {
  if (typeof window !== 'undefined') attachBrainKitIAP(window);
} catch {
  /* non-DOM / SSR — ignore */
}
