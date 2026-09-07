const EMOJI_RULES = [
  ['腌', '🧂'], ['泡', '💧'], ['洗', '💧'], ['切', '🔪'], ['剁', '🔪'], ['片', '🔪'], ['丝', '🔪'],
  ['炒', '🍳'], ['煸', '🍳'], ['煎', '🍳'], ['炸', '🍤'], ['烤', '🔥'], ['焗', '🔥'],
  ['煮', '🍲'], ['焯', '🍲'], ['炖', '🍲'], ['焖', '🍲'], ['煲', '🍲'], ['蒸', '♨️'],
  ['搅', '🥣'], ['拌', '🥣'], ['揉', '🥣'], ['打发', '🥣'],
  ['盛', '🍽️'], ['装盘', '🍽️'], ['摆盘', '🍽️'], ['上桌', '🍽️'],
  ['关火', '✅'], ['完成', '✅'], ['出锅', '🍳'],
];

Component({
  properties: {
    index: { type: Number, value: 1 },
    total: { type: Number, value: 0 },
    step: { type: Object, value: {} },
  },
  data: {
    emoji: '🥄',
  },
  observers: {
    step(step) {
      const text = (step && step.text) || '';
      let emoji = '🥄';
      for (const [kw, e] of EMOJI_RULES) {
        if (text.includes(kw)) { emoji = e; break; }
      }
      this.setData({ emoji });
    },
  },
});
