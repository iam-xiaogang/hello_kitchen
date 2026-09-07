/**
 * 饭团小厨 · recipes 云函数
 * action 支持：list（分类列表）/ detail（详情）/ random（随机一道）
 * 数据在云数据库 recipes 集合中（导入 tools/out/database/recipes.json）
 */
const cloud = require('wx-server-sdk');

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
