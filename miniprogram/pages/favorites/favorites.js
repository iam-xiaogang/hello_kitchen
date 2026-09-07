const dataService = require('../../utils/data-service');
const store = require('../../utils/store');

Page({
  data: {
    groups: [],
    count: 0,
  },

  onShow() {
    if (typeof this.getTabBar === 'function' && this.getTabBar()) {
      this.getTabBar().setData({ selected: 2 });
    }
    this.refresh();
  },

  refresh() {
    const favIds = store.getFavorites();
    const records = favIds.map((id) => dataService.getLightById(id)).filter(Boolean);
    const map = {};
    for (const r of records) {
      if (!map[r.category]) map[r.category] = [];
      map[r.category].push(r);
    }
    const groups = Object.keys(map).map((cat) => ({ category: cat, list: map[cat] }));
    this.setData({ groups, count: records.length });
  },

  onFav(e) {
    const { id } = e.detail;
    store.toggleFavorite(id);
    this.refresh();
    wx.showToast({ title: '已取消收藏', icon: 'none' });
  },

  goHome() {
    wx.switchTab({ url: '/pages/index/index' });
  },
});
