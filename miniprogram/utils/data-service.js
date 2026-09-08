/**
 * 数据服务层：统一封装「云数据库」与「本地 JSON 降级」两种数据源。
 * 所有方法均为 async，页面统一 await，无需关心底层走哪条路。
 */
const config = require('../config');
const INDEX = require('../data/index.js');
const ALL_RECIPES = require('../data/recipes.js');
const util = require('./util');

let byId = null;
function buildById() {
  if (byId) return byId;
  byId = {};
  for (const r of ALL_RECIPES) byId[r.id] = r;
  return byId;
}

/** 当前是否走云 */
function isCloud() {
  try {
    return !!getApp().globalData.cloudReady;
  } catch (e) {
    return !!(wx.cloud && config.cloudEnv);
  }
}

/** 调用云函数 */
async function callCloud(action, data = {}) {
  const res = await wx.cloud.callFunction({ name: 'recipes', data: { action, ...data } });
  const r = res.result || {};
  if (r.code !== 0) throw new Error(r.msg || '云函数调用失败');
  return r.data;
}

/* ---------- 本地实现 ---------- */
function localList(categoryKey) {
  if (!categoryKey || categoryKey === 'all') return INDEX.slice();
  return INDEX.filter((r) => r.categoryKey === categoryKey);
}

function localSearch(keyword) {
  const kw = String(keyword || '').trim().toLowerCase();
  if (!kw) return INDEX.slice();
  return INDEX.filter((r) =>
    r.name.toLowerCase().includes(kw) ||
    (r.description || '').toLowerCase().includes(kw) ||
    (r.tags || []).some((t) => t.toLowerCase().includes(kw)) ||
    (r.ingredientNames || []).some((n) => n.toLowerCase().includes(kw)) ||
    r.category.includes(kw)
  );
}

function localRandom(categoryKey) {
  const pool = categoryKey ? INDEX.filter((r) => r.categoryKey === categoryKey) : INDEX;
  if (!pool.length) return null;
  return pool[Math.floor(Math.random() * pool.length)];
}

function localRelated(id, categoryKey, n) {
  const pool = INDEX.filter((r) => r.categoryKey === categoryKey && r.id !== id);
  return util.shuffle(pool).slice(0, n);
}

/* ---------- 对外 API ---------- */
const service = {
  isCloud,

  /** 分类列表（始终本地，体积小） */
  getCategories() {
    return require('../data/categories.js');
  },

  /** 某分类下的菜谱（轻量） */
  async listByCategory(categoryKey) {
    if (!isCloud()) return localList(categoryKey);
    const data = await callCloud('list', { categoryKey });
    return data.list || [];
  },

  /** 搜索（菜名/标签/食材反查/分类）——始终走本地索引，速度快且离线可用 */
  async search(keyword) {
    return localSearch(keyword);
  },

  /** 随机一道菜（今天吃什么） */
  async getRandom(categoryKey) {
    if (!isCloud()) return localRandom(categoryKey);
    const data = await callCloud('random', { categoryKey });
    return data.recipe || null;
  },

  /** 某分类下、排除当前菜的推荐 */
  async getRelated(id, categoryKey, n = 6) {
    if (!isCloud()) return localRelated(id, categoryKey, n);
    const data = await callCloud('list', { categoryKey });
    return (data.list || []).filter((r) => r.id !== id).slice(0, n);
  },

  /** 完整菜谱详情 */
  async getRecipe(id) {
    if (!isCloud()) {
      return buildById()[id] || null;
    }
    const data = await callCloud('detail', { id });
    return data.recipe || null;
  },

  /** 创建跨设备分享菜单（必须启用云开发） */
  async createSharedMenu(recipeIds, title) {
    if (!isCloud()) throw new Error('请先配置云开发环境');
    return callCloud('createSharedMenu', { recipeIds, title });
  },

  /** 通过不可猜测的分享令牌读取菜单 */
  async getSharedMenu(token) {
    if (!isCloud()) throw new Error('请先配置云开发环境');
    const data = await callCloud('getSharedMenu', { token });
    return data.menu || null;
  },

  /** 由 id 拿轻量信息（收藏页/历史页渲染用，始终走本地索引） */
  getLightById(id) {
    return INDEX.find((r) => r.id === id) || null;
  },

  /** 全部轻量索引（首页猜你喜欢等） */
  getIndex() {
    return INDEX;
  },

  /** 家务小贴士：分组元数据 */
  getTipCategories() {
    return require('../data/tips-categories.js');
  },

  /** 家务小贴士：全部内容 */
  getTips() {
    return require('../data/tips.js');
  },

  /** 家务小贴士：按 id 取单篇 */
  getTip(id) {
    return this.getTips().find((t) => t.id === id) || null;
  },
};

module.exports = service;
