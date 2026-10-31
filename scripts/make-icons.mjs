import sharp from "sharp";
import { writeFileSync } from "node:fs";
import b from "../lib/brand.json" with { type: "json" };

const NAVY = "#16223A", PAPER = "#F6F1E7", BRASS = "#B08D57";

/** The symbol inside a square of `size` units. `scale` is how much of the square the 80-unit-wide mark fills. */
const mark = (fg, barFill, scale) => {
  const s = scale / 80; // content is 80 wide (x 10-90)
  const tx = 50 - 50 * s, ty = 50 - 43.5 * s; // centre on x 50, y 43.5
  return `<g transform="translate(${tx} ${ty}) scale(${s})"><path d="${b.sail}" fill="${fg}"/><path d="${b.line}" fill="${fg}"/><path d="${b.bar}" fill="${barFill}"/></g>`;
};
const icon = (bg, fg, barFill, scale) => `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><rect width="100" height="100" fill="${bg}"/>${mark(fg, barFill, scale)}</svg>`;
const smallIcon = (bg, fg) => `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 16 16"><rect width="16" height="16" rx="3" fill="${bg}"/>${Object.values(b.small).map((d) => `<path d="${d}" fill="${fg}"/>`).join("")}</svg>`;
const bare = (fg) => `<svg xmlns="http://www.w3.org/2000/svg" viewBox="10 4 80 79">${["sail", "line", "bar"].map((k) => `<path d="${b[k]}" fill="${fg}"/>`).join("")}</svg>`;

const png = (svg, size, file) => sharp(Buffer.from(svg), { density: 600 }).resize(size, size).png().toFile(file);

const appIcon = icon(NAVY, PAPER, BRASS, 56); // iOS rounds the corners itself
await png(appIcon, 1024, "public/brand/app-icon-1024.png");
await png(appIcon, 512, "public/icons/icon-512.png");
await png(appIcon, 192, "public/icons/icon-192.png");
await png(appIcon, 180, "public/icons/apple-touch-icon.png");
await png(icon(NAVY, PAPER, BRASS, 42), 512, "public/icons/icon-maskable-512.png"); // stays inside the 80% safe circle
await png(smallIcon(NAVY, PAPER), 32, "public/icons/favicon-32.png");
await png(bare(NAVY), 240, "public/brand/symbol-navy.png");
await png(bare(PAPER), 240, "public/brand/symbol-paper.png");

writeFileSync("public/icons/favicon.svg", smallIcon(NAVY, PAPER));
writeFileSync("public/brand/symbol.svg", bare(NAVY));
writeFileSync("public/brand/app-icon.svg", appIcon);
console.log("icons ok");
