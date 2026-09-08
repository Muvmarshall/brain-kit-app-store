/* Brain Kit Complete — Capgo NativePurchases window bridge (window.BrainKitIAP).
 * Call only AFTER parent PIN / parental gate. Never invent dollar amounts.
 * PRODUCT_PRICE_STATUS stays TBD until Mike/Grok approve.
 * Mirror of ios-wrap/storekit-bridge.ts for static www (no bundler).
 */
(function (global) {
  "use strict";

  var PRODUCT_IDS = {
    yearly: "com.brainkit.complete.yearly",
    monthly: "com.brainkit.complete.monthly"
  };

  var PRODUCT_PRICE_STATUS = {
    yearly: "TBD — price not locked",
    monthly: "TBD — price not locked"
  };

  var STOREKIT_RULES = {
    parentGateBeforePurchase: true,
    neverTrustWebPreviewUnlock: true,
    productIds: PRODUCT_IDS,
    pricesNotLocked: true
  };

  var RESTORE_DEBOUNCE_MS = 8000;
  var lastRestoreAt = 0;
  var COMPLETE_IDS = {};
  COMPLETE_IDS[PRODUCT_IDS.yearly] = true;
  COMPLETE_IDS[PRODUCT_IDS.monthly] = true;

  function isNative() {
    try {
      return !!(global.Capacitor && typeof global.Capacitor.isNativePlatform === "function" && global.Capacitor.isNativePlatform());
    } catch (e) {
      return false;
    }
  }

  function plugin() {
    var Caps = global.Capacitor || {};
    if (Caps.Plugins && Caps.Plugins.NativePurchases) return Caps.Plugins.NativePurchases;
    if (global.NativePurchases) return global.NativePurchases;
    return null;
  }

  function errText(err) {
    if (!err) return "unknown error";
    if (typeof err === "string") return err;
    var code = err.code != null ? String(err.code) : "";
    var msg = err.message || "";
    return (code + " " + msg).trim() || String(err);
  }

  function mapPurchaseError(err) {
    var text = errText(err);
    var lower = text.toLowerCase();
    if (lower.indexOf("cancel") !== -1) return { ok: false, reason: "cancelled", message: text };
    if (lower.indexOf("pending") !== -1) return { ok: false, reason: "pending", message: text };
    return { ok: false, reason: "failed", message: text };
  }

  function isActiveCompletePurchase(p) {
    if (!p || !COMPLETE_IDS[p.productIdentifier]) return false;
    if (p.revocationDate) return false;
    if (p.subscriptionState === "revoked" || p.subscriptionState === "expired") return false;
    if (p.isActive === true) return true;
    if (p.isActive === false) return false;
    if (p.subscriptionState === "subscribed" || p.subscriptionState === "inGracePeriod" || p.subscriptionState === "inBillingRetryPeriod") {
      return true;
    }
    if (p.expirationDate) {
      var exp = Date.parse(p.expirationDate);
      if (!isNaN(exp)) return exp > Date.now();
    }
    return false;
  }

  async function queryActiveComplete(np) {
    var res = await np.getPurchases({ productType: "subs" });
    var purchases = (res && res.purchases) || [];
    for (var i = 0; i < purchases.length; i++) {
      if (isActiveCompletePurchase(purchases[i])) {
        return { active: true, productId: purchases[i].productIdentifier };
      }
    }
    return { active: false };
  }

  async function purchaseComplete(plan) {
    if (!isNative()) {
      return { ok: false, reason: "not_native", message: "Use App Store build for real IAP" };
    }
    var productIdentifier = PRODUCT_IDS[plan];
    if (!productIdentifier) {
      return { ok: false, reason: "failed", message: "Unknown plan: " + plan };
    }
    var np = plugin();
    if (!np || typeof np.purchaseProduct !== "function") {
      return { ok: false, reason: "not_wired", message: "NativePurchases plugin not available" };
    }
    try {
      if (typeof np.isBillingSupported === "function") {
        var bill = await np.isBillingSupported();
        if (bill && bill.isBillingSupported === false) {
          return { ok: false, reason: "not_wired", message: "Billing not supported on this device" };
        }
      }
      var transaction = await np.purchaseProduct({
        productIdentifier: productIdentifier,
        productType: "subs",
        quantity: 1
      });
      return { ok: true, productId: (transaction && transaction.productIdentifier) || productIdentifier };
    } catch (err) {
      return mapPurchaseError(err);
    }
  }

  async function restoreComplete(opts) {
    var now = Date.now();
    if (!(opts && opts.force) && now - lastRestoreAt < RESTORE_DEBOUNCE_MS) {
      return { ok: false, reason: "failed", message: "Restore debounced — try again shortly" };
    }
    lastRestoreAt = now;
    if (!isNative()) {
      return { ok: false, reason: "not_native", message: "Restore only on device" };
    }
    var np = plugin();
    if (!np || typeof np.restorePurchases !== "function") {
      return { ok: false, reason: "not_wired", message: "NativePurchases plugin not available" };
    }
    try {
      await np.restorePurchases();
      var entitlement = await queryActiveComplete(np);
      return { ok: true, active: entitlement.active, productId: entitlement.productId };
    } catch (err) {
      return { ok: false, reason: "failed", message: errText(err) };
    }
  }

  async function getCompleteActive() {
    if (!isNative()) return false;
    var np = plugin();
    if (!np || typeof np.getPurchases !== "function") return false;
    try {
      var entitlement = await queryActiveComplete(np);
      return !!entitlement.active;
    } catch (e) {
      return false;
    }
  }

  global.BrainKitIAP = {
    PRODUCT_IDS: PRODUCT_IDS,
    PRODUCT_PRICE_STATUS: PRODUCT_PRICE_STATUS,
    STOREKIT_RULES: STOREKIT_RULES,
    purchaseComplete: purchaseComplete,
    restoreComplete: restoreComplete,
    getCompleteActive: getCompleteActive
  };
})(typeof window !== "undefined" ? window : globalThis);
