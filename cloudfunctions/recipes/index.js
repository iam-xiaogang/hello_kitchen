/**
 * 饭团小厨 · recipes 云函数
 * action 支持：list（分类列表）/ detail（详情）/ random（随机一道）
 * 数据在云数据库 recipes 集合中（导入 tools/out/database/recipes.json）
 */
const cloud = require('wx-server-sdk');
const crypto = require('crypto');

cloud.init({ env: cloud.DYNAMIC_CURRENT_ENV });

const db = cloud.database();
const COLLECTION = 'recipes';

const LIGHT_FIELDS = {
  _id: true,
  id: true,
  name: true,
  category: true,
  categoryKey: true,
  emoji: true,
  color: true,
  light: true,
  difficulty: true,
  calories: true,
  time: true,
  servings: true,
  description: true,
  tags: true,
  ingredientCount: true,
  stepCount: true,
  ingredientNames: true,
  image: true,
  hasImage: true,
};

exports.main = async (event) => {
  const { action } = event || {};
  try {
    switch (action) {
      case 'list':
        return await list(event);
      case 'detail':
        return await detail(event);
      case 'random':
        return await random(event);
      case 'createSharedMenu':
        return await createSharedMenu(event);
      case 'getSharedMenu':
        return await getSharedMenu(event);
      default:
        return { code: 400, msg: `未知 action: ${action}` };
    }
  } catch (e) {
    console.error('[recipes] 异常', e);
    return { code: 500, msg: e.message || '服务异常' };
  }
};

async function list(event) {
  const { categoryKey } = event || {};
  const where = categoryKey && categoryKey !== 'all' ? { categoryKey } : {};
  const res = await db
    .collection(COLLECTION)
    .where(where)
    .field(LIGHT_FIELDS)
    .limit(500)
    .get();
  return { code: 0, data: { list: res.data } };
}

async function detail(event) {
  const { id } = event || {};
  if (!id) return { code: 400, msg: '缺少 id' };
  const res = await db.collection(COLLECTION).doc(id).get();
  return { code: 0, data: { recipe: res.data } };
}

async function random(event) {
  const { categoryKey } = event || {};
  const where = categoryKey && categoryKey !== 'all' ? { categoryKey } : {};
  const countRes = await db.collection(COLLECTION).where(where).count();
  const total = countRes.total;
  if (!total) return { code: 0, data: { recipe: null } };
  const skip = Math.floor(Math.random() * total);
  const res = await db
    .collection(COLLECTION)
    .where(where)
    .field(LIGHT_FIELDS)
    .skip(skip)
    .limit(1)
    .get();
  return { code: 0, data: { recipe: res.data[0] || null } };
}

async function createSharedMenu(event) {
  const ids = [...new Set((event.recipeIds || []).map(String))].slice(0, 20);
  if (!ids.length) return { code: 400, msg: '请至少选择一道菜' };

  const _ = db.command;
  const res = await db.collection(COLLECTION).where({ id: _.in(ids) }).field(LIGHT_FIELDS).limit(20).get();
  const byId = {};
  res.data.forEach((r) => { byId[r.id] = r; });
  const recipes = ids.map((id) => byId[id]).filter(Boolean);
  if (!recipes.length) return { code: 400, msg: '没有找到所选菜谱' };

  const wxContext = cloud.getWXContext();
  const shareToken = crypto.randomBytes(18).toString('base64url');
  const now = new Date();
  const expiresAt = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);
  await db.collection('shared_menus').add({ data: {
    shareToken,
    creatorOpenid: wxContext.OPENID,
    title: String(event.title || '我们吃这些吧').trim().slice(0, 30),
    recipeIds: recipes.map((r) => r.id),
    recipes,
    createdAt: db.serverDate(),
    expiresAt,
  } });
  return { code: 0, data: { token: shareToken, expiresAt: expiresAt.toISOString() } };
}

async function getSharedMenu(event) {
  const token = String(event.token || '');
  if (!/^[A-Za-z0-9_-]{20,40}$/.test(token)) return { code: 400, msg: '分享链接无效' };
  const res = await db.collection('shared_menus').where({ shareToken: token }).limit(1).get();
  const record = res.data[0];
  if (!record) return { code: 404, msg: '菜单不存在或已失效' };
  const expiry = record.expiresAt && (
    typeof record.expiresAt.getTime === 'function'
      ? record.expiresAt.getTime()
      : new Date(record.expiresAt).getTime()
  );
  if (expiry && expiry < Date.now()) {
    return { code: 410, msg: '这份菜单已过期' };
  }
  return { code: 0, data: { menu: {
    title: record.title,
    recipes: record.recipes || [],
    createdAt: record.createdAt,
  } } };
}
