// Public storefront configuration. Nothing here is secret: the checkout URL,
// download location, and price are all visible to every visitor by design.
//
// PLACEHOLDER: `checkoutUrl` still points at STORE / VARIANT_UUID. Replace both
// with the "Share" URL of the JoyPointer Lifetime License variant once the
// Lemon Squeezy product exists (keep `?embed=1` so the overlay checkout opens).
// Until then script.js disables the buy buttons so a broken checkout never ships.
window.JOYPOINTER_CONFIG = Object.freeze({
  price: "$22",
  checkoutUrl: "https://STORE.lemonsqueezy.com/checkout/buy/VARIANT_UUID?embed=1",
  activationLimit: 3,
  downloadUrl: "https://github.com/heg-wtf/joypointer.heg.wtf/releases/latest",
  supportEmail: "me@heg.wtf",
  minimumMacOS: "macOS 13 Ventura",
});
