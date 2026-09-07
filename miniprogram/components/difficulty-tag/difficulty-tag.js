const theme = require('../../theme/theme');

Component({
  properties: {
    level: { type: Number, value: 1 },
    showLabel: { type: Boolean, value: false },
    size: { type: String, value: 'sm' }, // sm | lg
  },
  data: {
    pans: [0, 1, 2, 3, 4],
    label: '',
  },
  observers: {
    level(level) {
      this.setData({ label: theme.difficultyOf(level || 1).label });
    },
  },
  lifetimes: {
    attached() {
      this.setData({ label: theme.difficultyOf(this.data.level || 1).label });
    },
  },
});
