const dataService = require('../../utils/data-service');

Page({
  data: {
    tip: null,
  },

  onLoad(options) {
    const id = options.id || '';
    const tip = dataService.getTip(id);
    if (tip) {
      this.setData({ tip });
      wx.setNavigationBarTitle({ title: tip.title });
    } else {
      wx.showToast({ title: '内容不存在', icon: 'none' });
    }
  },
});
