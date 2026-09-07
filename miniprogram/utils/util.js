/**
 * 通用工具函数
 */
const config = require('../config');

/** 由数据里的相对图片路径拼出完整图片 URL（逐段 URL 编码，保留 "/"） */
function resolveImage(image) {
  if (!image) return '';
  const encoded = String(image).split('/').map((s) => encodeURIComponent(s)).join('/');
  return (config.imageBaseUrl || '') + encoded;
}

/** 格式化时间估算，如 "1.5小时" → "1小时30分"（或保留原样） */
function prettyTime(time) {
  if (!time) return '';
  const h = time.match(/(\d+(?:\.\d+)?)\s*小时/);
  const m = time.match(/(\d+)\s*分钟/);
  if (h) {
    const hv = parseFloat(h[1]);
    const hh = Math.floor(hv);
    const mm = Math.round((hv - hh) * 60);
    if (mm > 0) return `${hh}小时${mm}分`;
    return `${hh}小时`;
  }
  if (m) return `${m[1]}分钟`;
  return time;
}

/** 份量换算：把食材用量按比例缩放 */
function scaleIngredient(ing, ratio) {
  if (ing.amountValue == null || ing.amountValue === '') {
    return ing.amount || '';
  }
  const v = ing.amountValue * ratio;
  const rounded = v >= 10 ? Math.round(v) : Math.round(v * 10) / 10;
  return `${rounded}${ing.amountUnit || ''}`;
}

/** 从 "3-4人份" 解析基准人数（取平均值向上） */
function parseBaseServings(servings) {
  const m = String(servings || '').match(/(\d+)\s*[-–~至]\s*(\d+)/);
  if (m) return Math.ceil((parseInt(m[1], 10) + parseInt(m[2], 10)) / 2);
  const single = String(servings || '').match(/(\d+)/);
  return single ? parseInt(single[1], 10) : 1;
}

/** 合并去重：把多个菜谱的食材合并成购物清单 */
function mergeIngredients(recipeList) {
  const map = {};
  for (const r of recipeList) {
    const ings = r.ingredients || [];
    for (const ing of ings) {
      const key = String(ing.name).replace(/\s+/g, '');
      if (!map[key]) {
        map[key] = {
          name: ing.name,
          amountValue: ing.amountValue == null ? null : ing.amountValue,
          amountUnit: ing.amountUnit || '',
          pieces: [ing.amount || ''],
          checked: false,
        };
      } else {
        const item = map[key];
        item.pieces.push(ing.amount || '');
        // 仅当两边都可数值化且单位一致时才累加
        if (ing.amountValue != null && item.amountValue != null && ing.amountUnit === item.amountUnit) {
          item.amountValue += ing.amountValue;
        } else {
          item.amountValue = null; // 无法统一换算
        }
      }
    }
  }
  return Object.values(map).map((it) => {
    const uniquePieces = [...new Set(it.pieces.filter(Boolean))];
    let amountText = '';
    if (it.amountValue != null && it.amountValue !== '') {
      amountText = `${it.amountValue}${it.amountUnit}`;
    } else if (uniquePieces.length === 1) {
      amountText = uniquePieces[0];
    } else if (uniquePieces.length > 1) {
      amountText = `${uniquePieces.length} 份`;
    }
    return {
      name: it.name,
      amount: amountText,
      amountValue: it.amountValue,
      amountUnit: it.amountUnit,
      checked: false,
    };
  });
}

/**
 * 把一批食材合并进已有的购物清单（按名称去重，数值同单位则累加）
 * list: [{name, amount, amountValue, amountUnit, checked}]
 * ingredients: [{name, amount, amountValue, amountUnit, amountText}]
 */
function addIngredientsToShoppingList(list, ingredients) {
  const map = {};
  for (const it of list || []) {
    map[String(it.name).replace(/\s+/g, '')] = { ...it };
  }
  for (const ing of ingredients || []) {
    const key = String(ing.name).replace(/\s+/g, '');
    const existing = map[key];
    if (existing && existing.amountValue != null && ing.amountValue != null && existing.amountUnit === ing.amountUnit) {
      existing.amountValue += ing.amountValue;
      existing.amount = `${existing.amountValue}${existing.amountUnit}`;
    } else if (!existing) {
      const amount =
        ing.amountText ||
        ing.amount ||
        (ing.amountValue != null ? `${ing.amountValue}${ing.amountUnit || ''}` : '');
      map[key] = {
        name: ing.name,
        amount,
        amountValue: ing.amountValue != null ? ing.amountValue : null,
        amountUnit: ing.amountUnit || '',
        checked: false,
      };
    }
  }
  return Object.values(map);
}

/** 简单防抖 */
function debounce(fn, wait) {
  let timer = null;
  return function (...args) {
    if (timer) clearTimeout(timer);
    timer = setTimeout(() => fn.apply(this, args), wait);
  };
}

/** 随机取数组元素 */
function randomPick(arr) {
  return arr[Math.floor(Math.random() * arr.length)];
}

/** 打乱数组（Fisher-Yates） */
function shuffle(arr) {
  const a = arr.slice();
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

/** 延时（返回 Promise） */
function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

module.exports = {
  prettyTime,
  scaleIngredient,
  parseBaseServings,
  mergeIngredients,
  debounce,
  randomPick,
  shuffle,
  sleep,
  addIngredientsToShoppingList,
  resolveImage,
};
