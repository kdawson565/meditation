import sharp from "sharp";
const svg = (pad) => `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512"><rect width="512" height="512" fill="#16223A"/><g transform="translate(${pad} ${pad}) scale(${(512 - pad * 2) / 512})"><path d="M96 232h320l-44 160a24 24 0 0 1-23 18H163a24 24 0 0 1-23-18z" fill="#78A89E"/><path d="M96 232h320l-44 160a24 24 0 0 1-23 18H163a24 24 0 0 1-23-18z" fill="none" stroke="#F6F1E7" stroke-width="14" stroke-linejoin="round"/><path d="M256 232V96M256 96l96 110H256" fill="none" stroke="#C9A46A" stroke-width="14" stroke-linejoin="round" stroke-linecap="round"/></g></svg>`;
const out = async (name, size, pad) => sharp(Buffer.from(svg(pad))).resize(size, size).png().toFile(`public/icons/${name}`);
await out("icon-192.png", 192, 0);
await out("icon-512.png", 512, 0);
await out("icon-maskable-512.png", 512, 60);
await out("apple-touch-icon.png", 180, 0);
console.log("icons ok");
