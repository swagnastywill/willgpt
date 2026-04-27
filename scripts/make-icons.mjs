import sharp from "sharp";
import { mkdir } from "node:fs/promises";
import { dirname, resolve } from "node:path";

const SOURCE = resolve("public/will.png");
const APP_DIR = resolve("app");

async function circleCrop(size) {
  const buf = await sharp(SOURCE)
    .resize(size, size, { fit: "cover", position: "centre" })
    .toBuffer();

  const r = Math.floor(size / 2);
  const mask = Buffer.from(
    `<svg width="${size}" height="${size}"><circle cx="${r}" cy="${r}" r="${r}" fill="white"/></svg>`,
  );

  return await sharp(buf)
    .composite([{ input: mask, blend: "dest-in" }])
    .png({ compressionLevel: 9, palette: true })
    .toBuffer();
}

async function ogImage() {
  const w = 1200;
  const h = 630;
  const photoSize = 360;

  const photo = await sharp(SOURCE)
    .resize(photoSize, photoSize, { fit: "cover", position: "centre" })
    .toBuffer();

  const r = photoSize / 2;
  const mask = Buffer.from(
    `<svg width="${photoSize}" height="${photoSize}"><circle cx="${r}" cy="${r}" r="${r}" fill="white"/></svg>`,
  );

  const circlePhoto = await sharp(photo)
    .composite([{ input: mask, blend: "dest-in" }])
    .png()
    .toBuffer();

  const bg = `<svg width="${w}" height="${h}" xmlns="http://www.w3.org/2000/svg">
    <rect width="${w}" height="${h}" fill="#ffffff"/>
    <text x="${w / 2}" y="${h - 140}" font-family="-apple-system, system-ui, sans-serif" font-size="72" font-weight="600" fill="#0a0a0a" text-anchor="middle">i am replacing ai</text>
    <text x="${w / 2}" y="${h - 70}" font-family="-apple-system, system-ui, sans-serif" font-size="32" fill="#666666" text-anchor="middle">willygpt.com</text>
  </svg>`;

  return await sharp(Buffer.from(bg))
    .composite([
      {
        input: circlePhoto,
        top: 80,
        left: Math.floor((w - photoSize) / 2),
      },
    ])
    .png({ compressionLevel: 9 })
    .toBuffer();
}

async function ensureDir(p) {
  await mkdir(dirname(p), { recursive: true });
}

async function writeFile(path, buf) {
  await ensureDir(path);
  await sharp(buf).toFile(path);
  console.log(`wrote ${path} (${buf.length} bytes)`);
}

const tasks = [
  { path: `${APP_DIR}/icon.png`, gen: () => circleCrop(64) },
  { path: `${APP_DIR}/apple-icon.png`, gen: () => circleCrop(180) },
  { path: `${APP_DIR}/opengraph-image.png`, gen: ogImage },
  { path: `${APP_DIR}/twitter-image.png`, gen: ogImage },
];

for (const t of tasks) {
  const buf = await t.gen();
  await writeFile(t.path, buf);
}
console.log("done");
