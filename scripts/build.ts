// Builds the site into dist/: fills src/index.html with the texts in content/
// (edited through Drikus CMS) and copies the static files next to it.
// Run with `bun scripts/build.ts`. No dependencies.

import { cpSync, mkdirSync, readFileSync, rmSync, writeFileSync } from "node:fs";

const root = new URL("..", import.meta.url).pathname;
const out = `${root}dist`;
const STATIC_FILES = ["assets", "robots.txt", "sitemap.xml", "google17c2dc8d76f2ef13.html"];

interface Site {
  email: string;
  phone: string;
  phoneLabel: string;
  facebook?: string;
  instagram?: string;
  pinterest?: string;
}
interface Service {
  title: string;
  icon?: string;
  intro: string;
  more?: string;
}
interface Review {
  name: string;
  text: string;
}

function content<T>(name: string): T {
  return JSON.parse(readFileSync(`${root}content/${name}.json`, "utf8"));
}

function text(value: string) {
  return value.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}

function attr(value: string) {
  return text(value).replace(/"/g, "&quot;");
}

/** "Paragraph one\n\nParagraph two" → <p> elements. */
function paragraphs(value: string) {
  return value
    .split(/\n\s*\n/)
    .map((p) => p.trim())
    .filter(Boolean)
    .map((p) => `<p>${text(p)}</p>`);
}

/** The CMS stores images as "/assets/images/x.png"; the page links them relatively. */
function imagePath(path: string) {
  return path.replace(/^\//, "");
}

/** Width and height of a PNG or JPEG, so the browser can reserve space for it. */
function imageSize(path: string): { width: number; height: number } | undefined {
  let bytes: Buffer;
  try {
    bytes = readFileSync(`${root}${imagePath(path)}`);
  } catch {
    return undefined;
  }
  if (bytes.readUInt32BE(0) === 0x89504e47) {
    return { width: bytes.readUInt32BE(16), height: bytes.readUInt32BE(20) };
  }
  if (bytes[0] === 0xff && bytes[1] === 0xd8) {
    let i = 2;
    while (i + 9 < bytes.length && bytes[i] === 0xff) {
      const marker = bytes[i + 1];
      // SOF0–SOF15, except DHT (C4), JPG (C8) and DAC (CC)
      if (marker >= 0xc0 && marker <= 0xcf && ![0xc4, 0xc8, 0xcc].includes(marker)) {
        return { width: bytes.readUInt16BE(i + 7), height: bytes.readUInt16BE(i + 5) };
      }
      i += 2 + bytes.readUInt16BE(i + 2);
    }
  }
  return undefined;
}

function img(path: string) {
  const size = imageSize(path);
  const dims = size ? ` width="${size.width}" height="${size.height}"` : "";
  return `src="${attr(imagePath(path))}"${dims}`;
}

const site = content<Site>("site");
const { services } = content<{ services: Service[] }>("services");
const about = content<{ photo: string; text: string }>("about");
const { reviews } = content<{ reviews: Review[] }>("reviews");

const profiles = [
  ["Facebook", "facebook", site.facebook],
  ["Instagram", "instagram", site.instagram],
  ["Pinterest", "pinterest", site.pinterest],
].filter((p): p is string[] => !!p[2]);

const parts: Record<string, string[]> = {
  email: [attr(site.email)],
  phone: [attr(site.phone)],
  sameAs: profiles.map(([, , url], i) => `${JSON.stringify(url)}${i < profiles.length - 1 ? "," : ""}`),
  social: profiles.map(
    ([label, icon, url]) =>
      `<a class="social__link" href="${attr(url)}" target="_blank" rel="noopener" aria-label="${label}"><svg aria-hidden="true"><use href="#i-${icon}"/></svg></a>`,
  ),
  services: services.flatMap((s) => [
    `<article class="service">`,
    ...(s.icon ? [`  <img class="service__icon" ${img(s.icon)} alt="" loading="lazy">`] : []),
    `  <h3 class="service__title">${text(s.title)}</h3>`,
    s.more
      ? `  <p>${text(s.intro)}<span class="service__dots">…</span> <span class="service__more">${text(s.more)}</span></p>`
      : `  <p>${text(s.intro)}</p>`,
    ...(s.more ? [`  <button class="service__toggle" type="button" aria-expanded="false">Lees meer</button>`] : []),
    `</article>`,
  ]),
  aboutPhoto: [img(about.photo)],
  about: paragraphs(about.text),
  reviews: reviews.flatMap((r) => [
    `<figure class="review">`,
    `  <blockquote>`,
    ...paragraphs(r.text).map((p) => `    ${p}`),
    `  </blockquote>`,
    `  <figcaption>${text(r.name)}</figcaption>`,
    `</figure>`,
  ]),
  contact: [
    `<a class="contact__item" href="mailto:${attr(site.email)}">`,
    `  <svg aria-hidden="true"><use href="#i-mail"/></svg>`,
    `  <span>${text(site.email)}</span>`,
    `</a>`,
    `<a class="contact__item" href="tel:${attr(site.phone)}">`,
    `  <svg aria-hidden="true"><use href="#i-phone"/></svg>`,
    `  <span>${text(site.phoneLabel)}</span>`,
    `</a>`,
  ],
};

// A placeholder on its own line is replaced by lines at that indentation.
const html = readFileSync(`${root}src/index.html`, "utf8").replace(
  /^([ \t]*)(.*?)\{\{(\w+)\}\}/gm,
  (_, indent: string, before: string, name: string) => {
    const lines = parts[name];
    if (!lines) throw new Error(`Unknown placeholder {{${name}}}`);
    return indent + before + lines.join(`\n${indent}`);
  },
);

rmSync(out, { recursive: true, force: true });
mkdirSync(out);
writeFileSync(`${out}/index.html`, html);
for (const file of STATIC_FILES) cpSync(`${root}${file}`, `${out}/${file}`, { recursive: true });
console.log(`Built dist/ (${services.length} services, ${reviews.length} reviews)`);
