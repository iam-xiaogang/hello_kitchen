/**
 * 主题常量（JS 侧需要用到颜色/文案的地方）
 * 样式主要走 app.wxss 里的 CSS 变量，这里只放 JS 需要的数据。
 */
const DIFFICULTY = [
  { level: 1, label: '超简单', emoji: '🍳' },
  { level: 2, label: '简单', emoji: '🍳' },
  { level: 3, label: '中等', emoji: '🍳' },
  { level: 4, label: '有挑战', emoji: '🍳' },
  { level: 5, label: '进阶', emoji: '🍳' },
];

const MASCOT = {
  happy: '👨‍🍳',
  think: '🤔',
  empty: '👨‍🍳',
  cooking: '👨‍🍳',
};

const GREETINGS = [
  '今天吃什么？',
  '写代码也要好好吃饭',
  '翻翻冰箱，做顿好的',
  '干饭人，冲鸭！',
  '修完 bug，奖励自己一顿 🍳',
];

function difficultyOf(level) {
  return DIFFICULTY[Math.max(0, Math.min(4, (level || 1) - 1))] || DIFFICULTY[0];
}

function randomGreeting() {
  return GREETINGS[Math.floor(Math.random() * GREETINGS.length)];
}

module.exports = {
  DIFFICULTY,
  MASCOT,
  GREETINGS,
  difficultyOf,
  randomGreeting,
};
