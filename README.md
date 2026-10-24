# Styling by Valeria

Website for [Styling by Valeria](https://www.stylingbyvaleria.nl/), hosted on GitHub Pages.

It is a single static page — plain HTML, CSS and a few lines of JavaScript.
No framework and no dependencies to keep up to date. A small build script fills
the page with the texts in `content/`, which Valeria edits through
[Drikus CMS](https://github.com/studioroor/drikus-cms).

```
src/index.html     page template with {{placeholders}}
content/           services, about, reviews and contact details (JSON)
scripts/build.ts   builds the site into dist/
.drikus/config.yml what Drikus CMS can edit
assets/styles.css  styling
assets/main.js     mobile menu, "Lees meer" toggles, copyright year
assets/images/     photos and icons
assets/fonts/      Moon Flower (heading font)
```

## Editing

Texts are edited in Drikus CMS, or directly in `content/*.json`. In longer texts
(about, reviews) an empty line starts a new paragraph. Layout and markup live in
`src/index.html`. When you add an editable text there, add it to
`scripts/build.ts` and `.drikus/config.yml` too.

## Running locally

Requires [Bun](https://bun.sh).

```sh
bun scripts/build.ts
bunx serve dist
```

## Deployment

`.github/workflows/deploy.yml` builds the site and publishes it to GitHub Pages
on every push to `main` (Settings → Pages → Source: *GitHub Actions*).
Changes are live within a couple of minutes.

### Custom domain (not active yet)

Until DNS is moved, the site is served at https://studioroor.github.io/stylingbyvaleria/.
To switch to the custom domain, set the DNS records below, then add
`www.stylingbyvaleria.nl` under Settings → Pages → Custom domain.

### DNS (at the domain registrar)

| Type  | Name  | Value                   |
| ----- | ----- | ----------------------- |
| CNAME | `www` | `studioroor.github.io`  |
| A     | `@`   | `185.199.108.153`       |
| A     | `@`   | `185.199.109.153`       |
| A     | `@`   | `185.199.110.153`       |
| A     | `@`   | `185.199.111.153`       |
| AAAA  | `@`   | `2606:50c0:8000::153`   |
| AAAA  | `@`   | `2606:50c0:8001::153`   |
| AAAA  | `@`   | `2606:50c0:8002::153`   |
| AAAA  | `@`   | `2606:50c0:8003::153`   |

GitHub redirects `stylingbyvaleria.nl` to `www.stylingbyvaleria.nl` and issues the
HTTPS certificate automatically. Once DNS resolves, tick *Enforce HTTPS* in the Pages settings.
