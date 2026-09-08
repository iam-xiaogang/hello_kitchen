const dataService = require('../../utils/data-service');

Page({
  data: {
    loading: true,
    error: '',
    menu: null,
  },

  onLoad(options) {
    this.loadMenu(options.token || '');
  },

  async loadMenu(token) {
    if (!token) {
      this.setData({ loading: false, error: '分享链接不完整' });
      return;
    }
    try {
      const menu = await dataService.getSharedMenu(token);
      this.setData({ menu, loading: false });
      wx.setNavigationBarTitle({ title: menu.title || '分享菜单' });
    } catch (e) {
      this.setData({ loading: false, error: e.message || '菜单加载失败' });
    }
  },

  onGoHome() {
    wx.switchTab({ url: '/pages/index/index' });
  },
});
