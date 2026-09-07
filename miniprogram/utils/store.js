/**
 * 本地存储层：收藏 / 购物清单 / 历史 / 偏好
 * 均使用 wx.storage 本地持久化，离线可用、零配置。
 */
const KEY_FAVORITES = 'kxg_favorites';      // 收藏的菜谱 id 数组
const KEY_SHOPPING = 'kxg_shopping_list';   // 购物清单
const KEY_HISTORY = 'kxg_history';          // 浏览历史 id 数组
const KEY_PREFS = 'kxg_prefs';              // 口味偏好
const KEY_SERVINGS = 'kxg_servings';        // 上次选择的份量（按菜谱）

function read(key, fallback) {
  try {
    const v = wx.getStorageSync(key);
    return v === '' || v == null ? fallback : v;
  } catch (e) {
    return fallback;
  }
}

function write(key, value) {
  try {
    wx.setStorageSync(key, value);
  } catch (e) {
    console.warn('写入本地存储失败', key, e);
  }
}

const store = {
  init() {
    // 初始化默认值
    if (read(KEY_FAVORITES, null) === null) write(KEY_FAVORITES, []);
    if (read(KEY_SHOPPING, null) === null) write(KEY_SHOPPING, []);
    if (read(KEY_HISTORY, null) === null) write(KEY_HISTORY, []);
    if (read(KEY_PREFS, null) === null) {
      write(KEY_PREFS, { spice: 2, vegetarian: false, quick: false, dislikes: [] });
    }
  },

  /* ---------- 收藏 ---------- */
  getFavorites() {
    return read(KEY_FAVORITES, []);
  },
  isFavorite(id) {
    return this.getFavorites().includes(id);
  },
  toggleFavorite(id) {
    const list = this.getFavorites();
    const idx = list.indexOf(id);
    if (idx >= 0) list.splice(idx, 1);
    else list.unshift(id);
    write(KEY_FAVORITES, list);
    return idx < 0; // 返回是否已收藏
  },
  setFavorite(id, fav) {
    const list = this.getFavorites();
    const idx = list.indexOf(id);
    if (fav && idx < 0) list.unshift(id);
    if (!fav && idx >= 0) list.splice(idx, 1);
    write(KEY_FAVORITES, list);
  },

  /* ---------- 购物清单 ---------- */
  getShoppingList() {
    return read(KEY_SHOPPING, []);
  },
  setShoppingList(list) {
    write(KEY_SHOPPING, list);
  },
  toggleShoppingItem(name) {
    const list = this.getShoppingList();
    const item = list.find((i) => i.name === name);
    if (item) item.checked = !item.checked;
    write(KEY_SHOPPING, list);
    return list;
  },
  removeShoppingItem(name) {
    const list = this.getShoppingList().filter((i) => i.name !== name);
    write(KEY_SHOPPING, list);
    return list;
  },
  clearShoppingList() {
    write(KEY_SHOPPING, []);
  },

  /* ---------- 历史 ---------- */
  getHistory() {
    return read(KEY_HISTORY, []);
  },
  addHistory(id) {
    const list = this.getHistory().filter((x) => x !== id);
    list.unshift(id);
    write(KEY_HISTORY, list.slice(0, 50));
  },
  clearHistory() {
    write(KEY_HISTORY, []);
  },

  /* ---------- 偏好 ---------- */
  getPrefs() {
    return read(KEY_PREFS, { spice: 2, vegetarian: false, quick: false, dislikes: [] });
  },
  setPrefs(prefs) {
    write(KEY_PREFS, prefs);
  },

  /* ---------- 份量记忆 ---------- */
  getServings(recipeId) {
    const map = read(KEY_SERVINGS, {});
    return map[recipeId] || null;
  },
  setServings(recipeId, servings) {
    const map = read(KEY_SERVINGS, {});
    map[recipeId] = servings;
    write(KEY_SERVINGS, map);
  },
};

module.exports = store;
