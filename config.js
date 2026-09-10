// Public storefront configuration. Nothing here is secret: the checkout URL,
// download location, and price are all visible to every visitor by design.
//
// `checkoutUrl` is the Lemon Squeezy "Share" URL of the JoyPointer Lifetime License
// variant, with `?embed=1` so the overlay checkout opens in place instead of
// navigating away. If the product is ever recreated the UUID changes; script.js
// disables the buy buttons whenever this falls back to a placeholder.
window.JOYPOINTER_CONFIG = Object.freeze({
  price: "$22",
  checkoutUrl:
    "https://heg.lemonsqueezy.com/checkout/buy/5819dba1-aa29-47f6-a19a-bbde643965a9?embed=1",
  activationLimit: 3,
  downloadUrl: "https://github.com/heg-wtf/joypointer.heg.wtf/releases/latest",
  supportEmail: "me@heg.wtf",
  minimumMacOS: "macOS 13 Ventura",
});
