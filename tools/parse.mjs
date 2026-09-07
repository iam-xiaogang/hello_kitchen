/**
 * HowToCook markdown → 结构化 JSON 构建脚本
 *
 * 遍历 howtocook/dishes 目录，把每道菜的 md 解析成结构化 JSON：
 *   - miniprogram/data/index.json            轻量索引（首页/列表/搜索用）
 *   - miniprogram/data/categories.json       分类元数据
 *   - miniprogram/data/recipes/<分类>.json   该分类的完整菜谱（详情页用）
 *   - tools/out/database/recipes.json        云数据库导入用 JSONL（每行一个对象）
 *
 * 用法：npm install && npm run parse
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { pinyin } from 'pinyin-pro';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, '..');
const SRC_DIR = path.join(ROOT, 'howtocook', 'dishes');
const DATA_DIR = path.join(ROOT, 'miniprogram', 'data');
const RECIPES_DIR = path.join(DATA_DIR, 'recipes');
const DB_OUT_DIR = path.join(__dirname, 'out', 'database');

// 目录名(英文) → 分类元数据
const CATEGORIES = {
  meat_dish: { name: '荤菜', emoji: '🍖', color: '#FFB3A7', light: '#FFF0ED' },
  vegetable_dish: { name: '素菜', emoji: '🥬', color: '#A8D8B9', light: '#EEF7F1' },
  aquatic: { name: '水产', emoji: '🦐', color: '#7FC8E8', light: '#EAF6FC' },
  staple: { name: '主食', emoji: '🍚', color: '#FFD166', light: '#FFF7E2' },
  soup: { name: '汤羹', emoji: '🍲', color: '#FFA86B', light: '#FFF1E6' },
  breakfast: { name: '早餐', emoji: '🥞', color: '#FFC93C', light: '#FFF5D6' },
  dessert: { name: '甜品', emoji: '🍰', color: '#F4A7C8', light: '#FCEAF2' },
  drink: { name: '饮品', emoji: '🍹', color: '#8ED6C5', light: '#E9F7F2' },
  condiment: { name: '调味料', emoji: '🧂', color: '#B9A8E8', light: '#F0ECFB' },
  'semi-finished': { name: '半成品加工', emoji: '🥫', color: '#A9C0DB', light: '#EDF2F8' },
};

// 菜名关键词 → 封面 emoji（按顺序优先匹配）
const EMOJI_RULES = [
  ['蛋糕', '🍰'], ['面包', '🍞'], ['饼干', '🍪'], ['布丁', '🍮'], ['甜', '🍮'],
  ['鸡', '🍗'], ['鸭', '🦆'], ['鹅', '🦢'],
  ['鱼', '🐟'], ['虾', '🦐'], ['蟹', '🦀'], ['贝', '🐚'], ['鲍', '🐚'], ['蛤', '🐚'], ['螺', '🐚'],
  ['蛋', '🥚'], ['豆腐', '🧈'], ['牛肉', '🥩'], ['牛', '🥩'], ['猪', '🥓'], ['羊', '🍖'], ['肉', '🍖'],
  ['面', '🍜'], ['饭', '🍚'], ['粥', '🥣'], ['饺', '🥟'], ['馄饨', '🥟'], ['包', '🥟'], ['饼', '🫓'], ['馍', '🫓'], ['糕', '🍮'], ['粉', '🍜'],
  ['汤', '🍲'], ['羹', '🍲'], ['火锅', '🍲'],
  ['咖啡', '☕'], ['茶', '🍵'], ['饮', '🍹'], ['汁', '🧃'], ['奶', '🥛'], ['酒', '🍶'], ['汽水', '🥤'], ['可乐', '🥤'], ['苏打', '🥤'], ['柠檬', '🍋'], ['酸梅', '🍹'],
  ['菜', '🥬'], ['瓜', '🥒'], ['茄', '🍆'], ['萝卜', '🥕'], ['胡萝卜', '🥕'], ['土豆', '🥔'], ['马铃薯', '🥔'], ['玉米', '🌽'], ['豆', '🫘'], ['菇', '🍄'], ['菌', '🍄'], ['笋', '🎋'], ['藕', '🪷'],
  ['果', '🍎'], ['苹果', '🍎'], ['草莓', '🍓'], ['香蕉', '🍌'], ['橙', '🍊'], ['桃', '🍑'], ['梨', '🍐'], ['瓜果', '🍉'],
  ['椒', '🌶'], ['辣', '🌶'], ['葱', '🌿'], ['蒜', '🧄'], ['姜', '🫚'], ['香菜', '🌿'],
  ['沙拉', '🥗'], ['酱', '🫙'], ['油', '🫗'], ['盐', '🧂'], ['糖', '🍬'],
];

const TAG_RULES = [
  ['辣', /辣|辣椒|花椒|麻|豆瓣/],
  ['下饭', /下饭|盖浇|拌饭|卤/],
  ['快手', /快手|10 ?分钟|15 ?分钟|快速|快手菜/],
  ['汤', /汤|羹|炖|煲/],
  ['蒸', /蒸/],
  ['炸', /炸|煎炸|酥/],
  ['烤', /烤|焗/],
  ['凉拌', /凉拌|凉菜|沙拉/],
  ['甜', /甜|蛋糕|面包|布丁|奶昔|蜜|甜品|糖水|甜点/],
  ['饮', /饮品|果汁|茶饮|咖啡|奶茶|汽水|苏打|冰饮|奶昔|柠檬水|酸梅汤/],
  ['早餐', /早餐|吐司|三明治|煎饼|豆浆|油条/],
];

function walkMdFiles(dir) {
  const out = [];
  const entries = fs.readdirSync(dir, { withFileTypes: true });
  for (const e of entries) {
    if (e.name === 'template') continue;
    const full = path.join(dir, e.name);
    if (e.isDirectory()) out.push(...walkMdFiles(full));
    else if (e.name.endsWith('.md')) out.push(full);
  }
  return out;
}

function slugify(name) {
  const arr = pinyin(name, { toneType: 'none', type: 'array' }) || [];
  return arr.join('').replace(/[^a-z0-9]/gi, '').toLowerCase();
}

function extractTitle(content) {
  const m = content.match(/^#\s+(.+)$/m);
  if (!m) return '未命名';
  return m[1].replace(/(的)?(做法|怎么做|菜谱|配方)\s*$/, '').trim();
}

function extractDifficulty(content) {
  const m = content.match(/难度\s*[：:]\s*(★+)/);
  return m ? m[1].length : 1;
}

function extractCalories(content) {
  const m = content.match(/卡路里\s*[：:]\s*([\d.]+\s*大卡)/);
  return m ? m[1].trim() : '';
}

function extractTime(description) {
  const m = description.match(/大约需要\s*(?:约\s*)?(\d+(?:\.\d+)?)\s*(小时|分钟|h|min)/i);
  if (!m) return '';
  const n = m[1];
  const unit = /小时|h/i.test(m[2]) ? '小时' : '分钟';
  return `${n}${unit}`;
}

function extractDescription(content) {
  // 标题之后、第一个 ## 之前的段落（排除难度/卡路里行）
  // 注意：JS 里 \z 不是字符串结尾锚点，会匹配字面量 z，导致含 z 的描述被截断；这里改为只匹配到 ## 标题
  const m = content.match(/^#\s+.+$\n+([\s\S]*?)(?=^##\s)/m);
  const block = m ? m[1] : content.replace(/^#\s+.+$\n*/, '');
  return block
    .replace(/!\[[^\]]*\]\([^)]*\)/g, '') // 去掉 markdown 图片语法 ![alt](src)
    .split('\n')
    .map((l) => l.trim())
    .filter((l) => l && !/^预估烹饪难度|^难度\s*[：:]|^预估卡路里|^卡路里\s*[：:]/.test(l))
    .join(' ')
    .replace(/\s+/g, ' ')
    .trim();
}

function extractSections(content) {
  const sections = {};
  const lines = content.split('\n');
  let cur = '__head__';
  sections[cur] = [];
  for (const line of lines) {
    const h = line.match(/^##\s+(.+)$/);
    if (h) {
      cur = h[1].trim();
      sections[cur] = [];
    } else {
      sections[cur].push(line);
    }
  }
  return sections;
}

function extractServings(sections, description) {
  const text = (sections['计算'] || []).join('\n') + '\n' + description;
  let m = text.match(/(\d+)\s*[-–~至]\s*(\d+)\s*人/);
  if (m) return `${m[1]}-${m[2]}人份`;
  m = text.match(/(?:够|供|约)?\s*(\d+)\s*人(?:食用|份)/);
  if (m) return `${m[1]}人份`;
  if (/默认一人|一人(?:餐|份)|1 人/.test(text)) return '1人份';
  if (/每份|多人/.test(text)) return '1-2人份';
  return '1人份';
}

function isGroupHeader(text) {
  return /^(必须配料|进阶配料|可选配料|可选原料|原料|主料|辅料|主食材|副食材|配料|香料|酱料|工具|每份|一份|成品|食材|调味料|面糊|馅料|面团|奶油|蛋白霜|装饰|汤底|卤水|腌料|蘸料)$/.test(text.trim());
}

function parseIngredientLine(text) {
  const raw = text.trim().replace(/^[-*]\s+/, '').trim();
  if (!raw) return null;

  let name = '';
  let amount = '';
  let optional = false;

  if (/可选|可不放|不吃.*可省略|（可选）|(可选)/.test(raw)) optional = true;

  if (raw.includes('=')) {
    const [a, b] = raw.split(/\s*=\s*/, 2);
    name = (a || '').trim();
    amount = (b || '').trim();
  } else {
    const m = raw.match(/^(.*?)\s+(\d[\d\s.,~\-–]*(?:g|kg|ml|l|L|片|个|根|支|只|颗|粒|朵|瓣|段|块|勺|匙|杯|碗|滴|cm|mm|两|斤|枚|条|头|份|g|ml)?.*)$/);
    if (m) {
      name = m[1].trim();
      amount = m[2].trim();
    } else {
      name = raw.replace(/[：:]\s*$/, '').trim();
    }
  }

  // 去掉名称里的分组/说明性尾巴
  name = name.replace(/[：:]\s*$/, '').trim();
  if (!name) return null;

  const scale = parseScale(amount);
  return { name, amount, optional, ...scale };
}

function parseScale(amount) {
  if (!amount) return { amountValue: null, amountUnit: '' };
  const m = amount.match(/(\d+(?:\.\d+)?)\s*(g|kg|ml|l|L|片|个|根|支|只|颗|粒|朵|瓣|段|块|勺|匙|杯|碗|滴|两|斤|枚|条|头|份)/);
  if (m) {
    let value = parseFloat(m[1]);
    let unit = m[2];
    if (unit === 'kg') { value *= 1000; unit = 'g'; }
    if (unit === 'L' || unit === 'l') { value *= 1000; unit = 'ml'; }
    return { amountValue: value, amountUnit: unit };
  }
  return { amountValue: null, amountUnit: '' };
}

function parseIngredients(sectionLines) {
  const ingredients = [];
  let group = '';
  for (const line of sectionLines) {
    const h = line.match(/^###\s+(.+)$/);
    if (h) { group = h[1].trim(); continue; }
    if (!/^\s*[-*]\s+/.test(line)) continue;
    const text = line.trim().replace(/^[-*]\s+/, '').trim();
    if (isGroupHeader(text)) { group = text; continue; }
    if (/\d+\s*人|每份|以上份量|依口味/.test(text)) continue;
    const ing = parseIngredientLine(text);
    if (ing) {
      if (group && !/配料|原料|食材|调料|工具/.test(group)) ing.group = group;
      ingredients.push(ing);
    }
  }
  return ingredients;
}

function cleanStepText(text) {
  return text
    .replace(/!\[[^\]]*\]\([^)]*\)/g, '') // 去掉行内 markdown 图片 ![alt](src)
    .replace(/\s+/g, ' ')
    .trim();
}

function parseSteps(sectionLines) {
  const steps = [];
  let group = '';
  for (const line of sectionLines) {
    const h = line.match(/^###\s+(.+)$/);
    if (h) { group = h[1].trim(); continue; }
    const num = line.match(/^\s*\d+\s*[.、]\s*(.+)$/);
    if (num) {
      steps.push({ text: cleanStepText(num[1]), group });
      continue;
    }
    const bullet = line.match(/^\s*[-*]\s+(.+)$/);
    if (bullet) {
      steps.push({ text: cleanStepText(bullet[1]), group });
      continue;
    }
  }
  return steps;
}

function parseTips(sectionLines) {
  const tips = [];
  for (const line of sectionLines) {
    const t = line.trim();
    if (!t) continue;
    if (/^#{1,3}\s/.test(t)) continue;
    if (/Issue|Pull ?request/i.test(t)) continue;
    const clean = t
      .replace(/^[-*]\s+/, '')
      .replace(/!\[[^\]]*\]\([^)]*\)/g, '')
      .replace(/\[([^\]]*)\]\([^)]*\)/g, '$1')
      .trim();
    if (clean && !/^如果您遵循本指南/.test(clean)) tips.push(clean);
  }
  return tips;
}

function pickEmoji(name, categoryEmoji) {
  for (const [kw, emoji] of EMOJI_RULES) {
    if (name.includes(kw)) return emoji;
  }
  return categoryEmoji;
}

function buildTags(name, difficulty, ingredientsText) {
  const tags = [];
  const haystack = name + ' ' + ingredientsText;
  for (const [tag, re] of TAG_RULES) {
    if (re.test(haystack) && !tags.includes(tag)) tags.push(tag);
  }
  if (difficulty <= 2 && !tags.includes('快手')) tags.push('新手友好');
  if (difficulty >= 4) tags.push('进阶挑战');
  return tags.slice(0, 5);
}

// 找菜谱的封面图：优先同名封面，其次含「成品/完成」的图，最后取第一张步骤图
// 返回相对 howtocook 根目录的路径（如 dishes/meat_dish/宫保鸡丁/宫保鸡丁.jpg），无图返回 null
function findCoverImage(filePath) {
  const dir = path.dirname(filePath);
  const base = path.basename(filePath, '.md');
  const IMG = /\.(jpe?g|png|webp|gif)$/i;
  let imgs = [];
  try {
    imgs = fs.readdirSync(dir).filter((f) => IMG.test(f));
  } catch (e) {
    return null;
  }
  if (!imgs.length) return null;
  let cover = imgs.find((f) => path.basename(f, path.extname(f)) === base);
  if (!cover) cover = imgs.find((f) => /成品|完成|出锅|最终|做好的/.test(f));
  if (!cover) cover = imgs[0];
  const howtocookRoot = path.dirname(SRC_DIR);
  return path.relative(howtocookRoot, path.join(dir, cover)).split(path.sep).join('/');
}

function parseFile(filePath, categoryKey) {
  const content = fs.readFileSync(filePath, 'utf8');
  const category = CATEGORIES[categoryKey];
  const name = extractTitle(content);
  const description = extractDescription(content);
  const difficulty = extractDifficulty(content);
  const sections = extractSections(content);
  const ingredients = parseIngredients(sections['计算'] || []);
  const steps = parseSteps(sections['操作'] || []);
  const tips = parseTips(sections['附加内容'] || []);
  const tags = buildTags(name, difficulty, ingredients.map((i) => i.name).join(' '));
  const image = findCoverImage(filePath);

  return {
    id: slugify(name),
    name,
    category: category.name,
    categoryKey,
    emoji: pickEmoji(name, category.emoji),
    color: category.color,
    light: category.light,
    image,
    hasImage: !!image,
    difficulty,
    difficultyText: '★'.repeat(difficulty),
    calories: extractCalories(content),
    time: extractTime(description),
    servings: extractServings(sections, description),
    description: description.slice(0, 200),
    tags,
    ingredients,
    steps,
    tips,
  };
}

// 把数组写成 JS 模块：每个元素占一行，避免「单行超长」导致小程序编译器无法打包
function toJsArrayModule(arr) {
  return 'module.exports = [\n' + arr.map((x) => JSON.stringify(x)).join(',\n') + '\n];\n';
}

/* ================= 家务小贴士（tips）解析 ================= */
const TIPS_DIR = path.join(ROOT, 'howtocook', 'tips');
const TIPS_OUT_DIR = path.join(DATA_DIR, 'tips');

const TIP_GROUPS = {
  advanced: { key: 'advanced', name: '高级', icon: '🧑‍🍳' },
  learn: { key: 'learn', name: '学习', icon: '📚' },
  basic: { key: 'basic', name: '基础', icon: '🧹' },
};

function cleanTipInline(text) {
  const entities = { '&deg;': '°', '&amp;': '&', '&lt;': '<', '&gt;': '>', '&nbsp;': ' ', '&quot;': '"', '&#39;': "'" };
  return String(text)
    .replace(/&[a-z#0-9]+;/gi, (m) => entities[m] || m)
    .replace(/\*\*/g, '')
    .replace(/\[\^\d+\]/g, '')
    .replace(/^\^\d+:\s*/, '')
    .replace(/\s+/g, ' ')
    .trim();
}

function parseTipContent(content) {
  const lines = content.split('\n');
  const blocks = [];
  let i = 0;
  while (i < lines.length) {
    const t = lines[i].trim();
    if (!t) { i++; continue; }
    if (/^#\s/.test(t)) { i++; continue; } // 跳过标题行（另行提取）
    if (/^#{2,4}\s/.test(t)) {
      const depth = t.match(/^#+/)[0].length;
      blocks.push({ type: depth === 2 ? 'h2' : depth === 3 ? 'h3' : 'h4', text: cleanTipInline(t.replace(/^#{2,4}\s*/, '')) });
      i++; continue;
    }
    if (/^>\s?/.test(t)) { blocks.push({ type: 'quote', text: cleanTipInline(t.replace(/^>\s?/, '')) }); i++; continue; }
    if (/^[-*]\s+/.test(t) || /^\d+[.、]\s+/.test(t)) {
      blocks.push({ type: 'li', text: cleanTipInline(t.replace(/^[-*]\s+/, '').replace(/^\d+[.、]\s+/, '')) });
      i++; continue;
    }
    if (/^\|/.test(t)) {
      const rows = [];
      while (i < lines.length && /^\|/.test(lines[i].trim())) {
        rows.push(lines[i].trim());
        i++;
      }
      const parsed = rows
        .map((r) => r.replace(/^\|/, '').replace(/\|$/, '').split('|').map((c) => cleanTipInline(c)))
        .filter((cells) => !cells.every((c) => /^:?-+:?$/.test(c)));
      if (parsed.length) blocks.push({ type: 'table', header: parsed[0], rows: parsed.slice(1) });
      continue;
    }
    // 普通段落：合并连续普通行
    const parts = [cleanTipInline(t)];
    i++;
    while (i < lines.length && lines[i].trim() && !/^[#>|*\-]/.test(lines[i].trim()) && !/^\d+[.、]\s+/.test(lines[i].trim())) {
      parts.push(cleanTipInline(lines[i].trim()));
      i++;
    }
    blocks.push({ type: 'p', text: parts.join(' ') });
  }
  return blocks;
}

function walkTips() {
  const out = [];
  (function walk(dir, groupKey) {
    if (!fs.existsSync(dir)) return;
    for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
      const p = path.join(dir, e.name);
      if (e.isDirectory()) walk(p, ['advanced', 'learn'].includes(e.name) ? e.name : groupKey);
      else if (e.name.endsWith('.md')) out.push({ file: p, groupKey });
    }
  })(TIPS_DIR, 'basic');
  return out;
}

function buildTips() {
  const tips = [];
  const idSet = new Set();
  for (const { file, groupKey } of walkTips()) {
    const content = fs.readFileSync(file, 'utf8');
    const title = ((content.match(/^#\s+(.+)$/m) || [])[1] || path.basename(file, '.md')).trim();
    let id = slugify(title);
    if (idSet.has(id)) id = `${id}-${groupKey}`;
    idSet.add(id);
    tips.push({ id, title, group: groupKey, groupName: TIP_GROUPS[groupKey].name, content: parseTipContent(content) });
  }
  return tips;
}

function main() {
  if (!fs.existsSync(SRC_DIR)) {
    console.error('未找到 howtocook/dishes 目录，请先在项目根目录执行：git clone --depth 1 https://github.com/Anduin2017/HowToCook.git howtocook');
    process.exit(1);
  }

  const files = walkMdFiles(SRC_DIR).filter((f) => !f.includes(`${path.sep}template${path.sep}`));
  const recipes = [];
  const idMap = new Map();
  const nameDedup = new Set();

  for (const file of files) {
    const rel = path.relative(SRC_DIR, file);
    const categoryKey = rel.split(path.sep)[0];
    if (!CATEGORIES[categoryKey]) continue;
    const recipe = parseFile(file, categoryKey);
    // 同一分类下同名（源仓库同时存在 扁平文件 与 子目录 两份）只保留第一份
    const dedupKey = `${categoryKey}:${recipe.name}`;
    if (nameDedup.has(dedupKey)) continue;
    nameDedup.add(dedupKey);
    // 处理重名（拼音冲突）追加分类后缀
    if (idMap.has(recipe.id)) {
      recipe.id = `${recipe.id}-${categoryKey}`;
    }
    idMap.set(recipe.id, true);
    recipes.push(recipe);
  }

  recipes.sort((a, b) => a.category.localeCompare(b.category, 'zh') || a.name.localeCompare(b.name, 'zh'));

  // 写分类元数据
  const categories = Object.entries(CATEGORIES).map(([key, meta]) => {
    const count = recipes.filter((r) => r.categoryKey === key).length;
    return { key, ...meta, count };
  });
  fs.mkdirSync(DATA_DIR, { recursive: true });
  // 数据以 .js 模块输出，并按分类拆成小块，避免大文件无法被小程序编译器打包
  fs.writeFileSync(path.join(DATA_DIR, 'categories.js'), 'module.exports = ' + JSON.stringify(categories) + ';\n');

  // 写轻量索引（含食材名，供本地「按食材反查」搜索）
  const index = recipes.map((r) => ({
    id: r.id, name: r.name, category: r.category, categoryKey: r.categoryKey,
    emoji: r.emoji, color: r.color, light: r.light, difficulty: r.difficulty,
    calories: r.calories, time: r.time, servings: r.servings,
    description: r.description, tags: r.tags,
    image: r.image, hasImage: r.hasImage,
    ingredientCount: r.ingredients.length, stepCount: r.steps.length,
    ingredientNames: r.ingredients.map((i) => i.name),
  }));

  // 轻量索引：按分类拆成小文件，再由 index.js 聚合
  const IDX_DIR = path.join(DATA_DIR, 'index');
  fs.mkdirSync(IDX_DIR, { recursive: true });
  for (const [key] of Object.entries(CATEGORIES)) {
    const list = index.filter((r) => r.categoryKey === key);
    fs.writeFileSync(path.join(IDX_DIR, `${key}.js`), toJsArrayModule(list));
  }
  fs.writeFileSync(
    path.join(DATA_DIR, 'index.js'),
    'module.exports = [].concat(\n' +
      Object.keys(CATEGORIES).map((k) => `  require('./index/${k}.js')`).join(',\n') +
      '\n);\n'
  );

  // 完整菜谱：按分类拆块（每块 ≤ CHUNK 道），再由 recipes.js 聚合
  fs.mkdirSync(RECIPES_DIR, { recursive: true });
  const CHUNK = 30;
  const chunkFiles = [];
  for (const [key] of Object.entries(CATEGORIES)) {
    const list = recipes.filter((r) => r.categoryKey === key);
    for (let i = 0; i < list.length; i += CHUNK) {
      const part = list.slice(i, i + CHUNK);
      const fname = `${key}_${Math.floor(i / CHUNK)}`;
      fs.writeFileSync(path.join(RECIPES_DIR, `${fname}.js`), toJsArrayModule(part));
      chunkFiles.push(fname);
    }
  }
  fs.writeFileSync(
    path.join(DATA_DIR, 'recipes.js'),
    'module.exports = [].concat(\n' +
      chunkFiles.map((f) => `  require('./recipes/${f}.js')`).join(',\n') +
      '\n);\n'
  );

  // 写云数据库导入用 JSONL
  fs.mkdirSync(DB_OUT_DIR, { recursive: true });
  const jsonl = recipes.map((r) => JSON.stringify({ _id: r.id, ...r })).join('\n');
  fs.writeFileSync(path.join(DB_OUT_DIR, 'recipes.json'), jsonl);

  // 家务小贴士（tips）：按分组拆成小文件，再由 tips.js 聚合
  const tips = buildTips();
  fs.mkdirSync(TIPS_OUT_DIR, { recursive: true });
  const tipChunkFiles = [];
  for (const [key] of Object.entries(TIP_GROUPS)) {
    const list = tips.filter((t) => t.group === key);
    if (!list.length) continue;
    fs.writeFileSync(path.join(TIPS_OUT_DIR, `${key}.js`), toJsArrayModule(list));
    tipChunkFiles.push(key);
  }
  fs.writeFileSync(
    path.join(DATA_DIR, 'tips.js'),
    'module.exports = [].concat(\n' +
      tipChunkFiles.map((k) => `  require('./tips/${k}.js')`).join(',\n') +
      '\n);\n'
  );
  const tipCategories = Object.values(TIP_GROUPS).map((g) => ({
    key: g.key,
    name: g.name,
    icon: g.icon,
    count: tips.filter((t) => t.group === g.key).length,
  }));
  fs.writeFileSync(path.join(DATA_DIR, 'tips-categories.js'), 'module.exports = ' + JSON.stringify(tipCategories) + ';\n');

  // 统计输出
  console.log(`✅ 解析完成：共 ${recipes.length} 道菜`);
  for (const c of categories) {
    const withImg = recipes.filter((r) => r.categoryKey === c.key).length;
    console.log(`   ${c.emoji} ${c.name}: ${withImg} 道`);
  }
  console.log(`📦 索引: miniprogram/data/index.js (${(JSON.stringify(index).length / 1024).toFixed(1)} KB)`);
  console.log(`🗄️  云数据库导入: tools/out/database/recipes.json (${recipes.length} 行)`);
  console.log(`🧹 家务小贴士: ${tips.length} 篇（${tipCategories.map((c) => `${c.name} ${c.count}`).join(' / ')}）`);
}

main();
