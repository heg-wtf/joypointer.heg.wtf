# joypointer.heg.wtf

Marketing site, Lemon Squeezy checkout, and Sparkle appcast for **JoyPointer**, the macOS menu bar app that turns a game controller into a mouse. The app itself lives in the private `hyperengineeringgroup/joypointer` repository.

## What this repository serves

| Path                                    | Purpose                                                                                     |
| --------------------------------------- | ------------------------------------------------------------------------------------------- |
| `index.html`, `styles.css`, `script.js` | English landing page: features, pricing, requirements, FAQ                                  |
| `config.js`                             | Public storefront values: price, Lemon Squeezy checkout URL, activation limit, download URL |
| `privacy/`, `terms/`, `download/`       | Privacy policy, license terms and refunds, re-download page for customers                   |
| `appcast.xml`                           | Sparkle update feed read by the app (`SUFeedURL`)                                           |
| `sitemap.xml`, `robots.txt`, `CNAME`    | SEO and GitHub Pages custom domain                                                          |
| GitHub Releases                         | Hosts each notarized `JoyPointer-{version}.dmg` referenced by the appcast                   |

No build step. Static files are published from the `main` branch root by GitHub Pages.

## Run locally

```bash
make install   # eslint + prettier
make serve     # http://localhost:4173
make lint      # prettier --write, then eslint
make test      # node --test tests/site.test.js
```

## Connecting the Lemon Squeezy checkout

`config.js` ships with a placeholder checkout URL (`STORE` / `VARIANT_UUID`). While it is a placeholder, `script.js` disables the buy buttons and shows “Checkout opens soon”, so nothing broken is ever live.

1. In Lemon Squeezy create the product **JoyPointer Lifetime License**, price $22, single payment.
2. Enable **License keys** on the product: activation limit **3**, no expiry.
3. Open **Share** on the variant, choose the **overlay** checkout, and copy the URL. It looks like `https://heg.lemonsqueezy.com/checkout/buy/xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx?embed=1`.
4. Paste it into `checkoutUrl` in `config.js` and run `make test`. The test accepts only the placeholder or a URL of that exact shape.
5. In the product's receipt / confirmation text, point customers to `https://joypointer.heg.wtf/download` and remind them the license key is in the same email.

## How a release lands here

Releases are produced by the app repository, never by hand in this one.

1. In `hyperengineeringgroup/joypointer`, run `make release VERSION=x.y.z`. It builds, signs with Developer ID, notarizes, creates `dist/JoyPointer-x.y.z.dmg`, and runs Sparkle's `generate_appcast`, producing `dist/appcast.xml` whose enclosure URLs point at `https://github.com/heg-wtf/joypointer.heg.wtf/releases/download/vx.y.z/`.
2. Create the GitHub Release `vx.y.z` **on this repository** and upload the DMG as its asset:
   `gh release create vx.y.z dist/JoyPointer-x.y.z.dmg --repo heg-wtf/joypointer.heg.wtf --title "JoyPointer x.y.z" --notes-file RELEASE_NOTES.md`
3. Copy `dist/appcast.xml` over `appcast.xml` at the root of this repository, open a PR, merge. Sparkle in installed apps picks up the new item on its next check.

`download/` always links to `releases/latest`, so it needs no edit per release.

## DNS and hosting

GitHub Pages serves the `main` branch root with the custom domain in `CNAME`. The `heg.wtf` zone is hosted on Route 53; the record required is:

```
joypointer.heg.wtf.  CNAME  heg-wtf.github.io.
```

After the record resolves, enforce HTTPS in the repository's Pages settings (the certificate is issued automatically).
