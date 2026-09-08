const dataService = require('../../utils/data-service');
const store = require('../../utils/store');

Page({
  data: {
    title: '我们吃这些吧',
    recipes: [],
    creating: false,
    shareToken: '',
  },

  onShow() {
    this.refresh();
  },

  refresh() {
    const recipes = store.getMenuDraft()
      .map((id) => dataService.getLightById(id))
      .filter(Boolean);
    const before = this.data.recipes.map((r) => r.id).join(',');
    const after = recipes.map((r) => r.id).join(',');
    this.setData({ recipes, shareToken: before && before !== after ? '' : this.data.shareToken });
  },

  onTitleInput(e) {
    this.setData({ title: e.detail.value, shareToken: '' });
  },

  onRemove(e) {
    store.removeMenuItem(e.currentTarget.dataset.id);
    this.setData({ shareToken: '' });
    this.refresh();
  },

  onAddMore() {
    wx.navigateBack({
      fail: () => wx.switchTab({ url: '/pages/index/index' }),
    });
  },

  async onCreateShare() {
    if (this.data.creating || !this.data.recipes.length) return;
    if (!dataService.isCloud()) {
      wx.showModal({
        title: '需要启用云开发',
        content: '跨设备分享需要先在 config.js 配置云环境，并部署最新版 recipes 云函数。',
        showCancel: false,
        confirmColor: '#FF7A5C',
      });
      return;
    }
    this.setData({ creating: true });
    wx.showLoading({ title: '生成菜单中…' });
    try {
      const result = await dataService.createSharedMenu(
        this.data.recipes.map((r) => r.id),
        this.data.title
      );
      this.setData({ shareToken: result.token });
      wx.hideLoading();
      wx.showToast({ title: '菜单已生成', icon: 'success' });
    } catch (e) {
      wx.hideLoading();
      wx.showToast({ title: e.message || '生成失败，请重试', icon: 'none' });
    } finally {
      this.setData({ creating: false });
    }
  },

  onShareAppMessage() {
    if (!this.data.shareToken) {
      return { title: '一起选今晚吃什么', path: '/pages/index/index' };
    }
    return {
      title: `${this.data.title || '我们吃这些吧'} · ${this.data.recipes.length} 道菜`,
      path: `/pages/shared-menu/shared-menu?token=${encodeURIComponent(this.data.shareToken)}`,
    };
  },
});
