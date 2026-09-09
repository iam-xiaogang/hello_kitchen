/**
 * 为小程序生成两套 WebP 菜谱封面：
 *   tools/out/images/thumb  卡片缩略图（480×360，quality 72）
 *   tools/out/images/detail 详情封面（1080×720，quality 80）
 *
 * 目录结构与数据中的 image 相对路径保持一致，仅扩展名统一为 .webp。
 */
import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import sharp from 'sharp';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, '..');
const SOURCE_ROOT = path.join(ROOT, 'howtocook');
const OUT_ROOT = path.join(__dirname, 'out', 'images');

const indexModule = await import(path.join(ROOT, 'miniprogram', 'data', 'index.js'));
const recipes = indexModule.default || [];
const images = [...new Set(recipes.map((r) => r.image).filter(Boolean))];

async function render(source, destination, width, height, quality) {
  await fs.mkdir(path.dirname(destination), { recursive: true });
  await sharp(source)
    .rotate()
    .resize(width, height, { fit: 'cover', position: 'centre', withoutEnlargement: true })
    .webp({ quality, effort: 5 })
    .toFile(destination);
}

let completed = 0;
for (const relative of images) {
  const source = path.join(SOURCE_ROOT, relative);
  const webpRelative = relative.replace(/\.(?:jpe?g|png|gif|webp)$/i, '.webp');
  try {
    await Promise.all([
      render(source, path.join(OUT_ROOT, 'thumb', webpRelative), 480, 360, 72),
      render(source, path.join(OUT_ROOT, 'detail', webpRelative), 1080, 720, 80),
    ]);
    completed += 1;
    if (completed % 25 === 0) console.log(`已处理 ${completed}/${images.length}`);
  } catch (error) {
    console.warn(`跳过 ${relative}: ${error.message}`);
  }
}

console.log(`完成：${completed}/${images.length} 张原图，输出到 tools/out/images/`);
