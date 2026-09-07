const dataService = require('../../utils/data-service');

Page({
  data: {
    tipGroups: [],
  },

  onLoad() {
    this.loadTips();
  },

  onShow() {
    if (typeof this.getTabBar === 'function' && this.getTabBar()) {
      this.getTabBar().setData({ selected: 1 });
    }
  },

  loadTips() {
    const tips = dataService.getTips();
    const tipGroups = dataService.getTipCategories().map((g) => ({
      ...g,
      items: tips.filter((t) => t.group === g.key),
    }));
    this.setData({ tipGroups });
  },

  onTipTap(e) {
    const id = e.currentTarget.dataset.id;
    wx.navigateTo({ url: `/pages/tip-detail/tip-detail?id=${id}` });
  },
});
