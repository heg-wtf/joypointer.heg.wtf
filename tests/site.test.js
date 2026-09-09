const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const vm = require("node:vm");

const root = path.resolve(__dirname, "..");
const read = (file) => fs.readFileSync(path.join(root, file), "utf8");
const exists = (file) => fs.existsSync(path.join(root, file));

const index = read("index.html");
const configSource = read("config.js");
const script = read("script.js");
const readme = read("README.md");
const pages = {
  "index.html": index,
  "privacy/index.html": read("privacy/index.html"),
  "terms/index.html": read("terms/index.html"),
  "download/index.html": read("download/index.html"),
};
const publicText = [...Object.values(pages), configSource, script, readme].join("\n");

/** Collapse prettier line wraps so prose can be matched as a single line. */
const flatten = (text) => text.replace(/\s+/g, " ");

/** Evaluate config.js in a fake browser window and return the frozen config object. */
function loadConfig() {
  const sandbox = { window: {} };
  vm.runInNewContext(configSource, sandbox);
  return sandbox.window.JOYPOINTER_CONFIG;
}

const config = loadConfig();
const PLACEHOLDER_CHECKOUT = "https://STORE.lemonsqueezy.com/checkout/buy/VARIANT_UUID?embed=1";
const REAL_CHECKOUT_PATTERN =
  /^https:\/\/[a-z0-9-]+\.lemonsqueezy\.com\/checkout\/buy\/[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}\?embed=1$/;

test("canonical domain, CNAME, and Open Graph URL agree", () => {
  assert.equal(read("CNAME").trim(), "joypointer.heg.wtf");
  assert.match(index, /<link rel="canonical" href="https:\/\/joypointer\.heg\.wtf\/" \/>/);
  assert.match(index, /property="og:url" content="https:\/\/joypointer\.heg\.wtf\/"/);
  for (const page of ["privacy", "terms", "download"]) {
    assert.match(
      pages[`${page}/index.html`],
      new RegExp(`href="https://joypointer\\.heg\\.wtf/${page}/"`),
      `${page} page should declare its canonical URL`,
    );
  }
});

test("config exposes the agreed public values", () => {
  assert.equal(config.price, "$22");
  assert.equal(config.activationLimit, 3);
  assert.equal(config.supportEmail, "me@heg.wtf");
  assert.equal(config.minimumMacOS, "macOS 13 Ventura");
  assert.match(
    config.downloadUrl,
    /^https:\/\/github\.com\/heg-wtf\/joypointer\.heg\.wtf\/releases\//,
  );
  assert.ok(Object.isFrozen(config), "config should be frozen");
});

test("checkout URL is either the documented placeholder or a real Lemon Squeezy overlay URL", () => {
  const isPlaceholder = config.checkoutUrl === PLACEHOLDER_CHECKOUT;
  const isReal = REAL_CHECKOUT_PATTERN.test(config.checkoutUrl);
  assert.ok(isPlaceholder || isReal, `unexpected checkoutUrl: ${config.checkoutUrl}`);
  if (isPlaceholder) {
    assert.match(configSource, /PLACEHOLDER/, "placeholder must be called out in a comment");
  }
});

test("script disables buy buttons while the checkout URL is still a placeholder", () => {
  assert.match(script, /STORE\.lemonsqueezy\.com/);
  assert.match(script, /VARIANT_UUID/);
  assert.match(script, /classList\.remove\("lemonsqueezy-button"\)/);
  assert.match(script, /aria-disabled/);
  assert.match(script, /Checkout opens soon/);
  assert.match(script, /createLemonSqueezy/);
});

test("price is $22 everywhere and no other dollar amount leaks in", () => {
  assert.match(index, /\$22/);
  assert.match(pages["terms/index.html"], /\$22/);
  assert.match(pages["download/index.html"], /\$22/);
  const prices = new Set(publicText.match(/\$\d+(?:\.\d{2})?/g));
  assert.deepEqual([...prices], ["$22"]);
});

test("no free trial or free download wording — the app is paid only", () => {
  const forbidden = /free trial|free download|try (it )?free|try for free|download free|freemium/i;
  assert.doesNotMatch(flatten(publicText), forbidden);
});

test("activation limit wording matches the config value", () => {
  const limit = String(config.activationLimit);
  assert.match(index, new RegExp(`data-activation-limit>${limit}<`));
  assert.match(pages["terms/index.html"], new RegExp(`<strong>${limit} Macs</strong>`));
  assert.match(pages["download/index.html"], new RegExp(`data-activation-limit>${limit}<`));
});

test("Lemon Squeezy overlay script is loaded and every buy link is an overlay button target", () => {
  assert.match(
    index,
    /<script src="https:\/\/assets\.lemonsqueezy\.com\/lemon\.js" defer><\/script>/,
  );
  const buyLinks = index.match(/<a [^>]*data-buy[^>]*>/g) || [];
  assert.ok(buyLinks.length >= 3, "expected buy links in nav, hero, pricing, and CTA");
  for (const link of buyLinks) {
    assert.match(link, /href="#pricing"/, `buy link must fall back to #pricing: ${link}`);
  }
  assert.match(script, /button\.classList\.add\("lemonsqueezy-button"\)/);
  assert.match(script, /button\.href = checkoutUrl/);
});

test("pricing section exists with the expected id and buy button", () => {
  assert.match(index, /<section [^>]*id="pricing"/);
  const pricingSection = index.slice(index.indexOf('id="pricing"'));
  assert.match(pricingSection, /data-buy/);
  assert.match(pricingSection, /Lifetime License/);
});

test("appcast.xml is a well-formed Sparkle RSS feed", () => {
  const appcast = read("appcast.xml");
  assert.match(appcast, /^<\?xml version="1\.0" encoding="utf-8"\?>/);
  assert.match(
    appcast,
    /<rss version="2\.0"[^>]*xmlns:sparkle="http:\/\/www\.andymatuschak\.org\/xml-namespaces\/sparkle"/,
  );
  assert.match(
    appcast,
    /<channel>[\s\S]*<title>JoyPointer Updates<\/title>[\s\S]*<link>https:\/\/joypointer\.heg\.wtf\/<\/link>/,
  );
  assert.match(appcast, /<\/channel>\s*<\/rss>\s*$/);

  // Minimal well-formedness: every opened tag is closed in order.
  const stripped = appcast.replace(/<\?xml[^>]*\?>/, "").replace(/<!--[\s\S]*?-->/g, "");
  const stack = [];
  for (const match of stripped.matchAll(/<(\/?)([A-Za-z_:][\w:.-]*)[^>]*?(\/?)>/g)) {
    const [, closing, name, selfClosing] = match;
    if (selfClosing) continue;
    if (closing) {
      assert.equal(stack.pop(), name, `mismatched closing tag </${name}>`);
    } else {
      stack.push(name);
    }
  }
  assert.deepEqual(stack, [], "all tags should be closed");
});

test("sitemap lists exactly the pages that exist", () => {
  const sitemap = read("sitemap.xml");
  const locs = [...sitemap.matchAll(/<loc>https:\/\/joypointer\.heg\.wtf\/([^<]*)<\/loc>/g)].map(
    (m) => m[1],
  );
  assert.deepEqual(locs, ["", "download/", "privacy/", "terms/"]);
  for (const loc of locs) {
    assert.ok(exists(path.join(loc, "index.html")), `${loc || "/"} should have an index.html`);
  }
  assert.match(read("robots.txt"), /Sitemap: https:\/\/joypointer\.heg\.wtf\/sitemap\.xml/);
});

test("legal and download pages are present, non-empty, and linked from the footer", () => {
  for (const file of ["privacy/index.html", "terms/index.html", "download/index.html"]) {
    assert.ok(fs.statSync(path.join(root, file)).size > 500, `${file} should have real content`);
    assert.match(pages[file], /<main id="main" class="legal shell">/);
  }
  assert.match(index, /href="privacy\/"/);
  assert.match(index, /href="terms\/"/);
  assert.match(index, /href="download\/"/);
  assert.match(flatten(pages["terms/index.html"]), /14 days of purchase/);
  assert.match(flatten(pages["privacy/index.html"]), /Lemon Squeezy License API/);
});

test("assets referenced by the pages exist", () => {
  for (const asset of [
    "assets/logo.svg",
    "assets/favicon.svg",
    "styles.css",
    "config.js",
    "script.js",
  ]) {
    assert.ok(fs.statSync(path.join(root, asset)).size > 0, `${asset} should not be empty`);
  }
  assert.match(read("assets/logo.svg"), /<svg[^>]*viewBox="0 0 128 128"/);
});

test("README documents how releases and the appcast are updated", () => {
  assert.match(readme, /appcast\.xml/);
  assert.match(readme, /releases/i);
  assert.match(readme, /make release/);
  assert.match(readme, /config\.js/);
  assert.match(readme, /heg-wtf\.github\.io/);
});
