const dataService = require('../../utils/data-service');
const store = require('../../utils/store');

const SPICE_OPTIONS = [
  { v: 0, label: '不辣' },
  { v: 1, label: '微辣' },
  { v: 2, label: '中辣' },
  { v: 3, label: '特辣' },
];

Page({
  data: {
    prefs: { spice: 2, vegetarian: false, quick: false },
    spiceOptions: SPICE_OPTIONS,
    history: [],
    totalRecipes: 0,
    dataSource: 'How to Cook',
  },

  onShow() {
    if (typeof this.getTabBar === 'function' && this.getTabBar()) {
      this.getTabBar().setData({ selected: 3 });
    }
    this.refresh();
  },

  refresh() {
    const prefs = store.getPrefs();
    const history = store
      .getHistory()
      .map((id) => dataService.getLightById(id))
      .filter(Boolean)
      .slice(0, 10);
    this.setData({
      prefs,
      history,
      totalRecipes: dataService.getIndex().length,
      dataSource: dataService.isCloud() ? '云开发数据库' : 'How to Cook',
    });
  },

  onSpice(e) {
    this.updatePrefs({ spice: e.currentTarget.dataset.v });
  },

  onSwitch(e) {
    const key = e.currentTarget.dataset.key;
    this.updatePrefs({ [key]: e.detail.value });
  },

  updatePrefs(patch) {
    const prefs = { ...this.data.prefs, ...patch };
    store.setPrefs(prefs);
    this.setData({ prefs });
  },

  onClearHistory() {
    wx.showModal({
      title: '清空浏览历史？',
      confirmColor: '#FF7A5C',
      success: (res) => {
        if (res.confirm) {
          store.clearHistory();
          this.refresh();
        }
      },
    });
  },

  onAbout() {
    wx.showModal({
      title: '关于 程序员厨房',
      content: `程序员做饭指南小助手。\n\n菜谱数据来自 HowToCook（程序员做饭指南）开源仓库，共 ${this.data.totalRecipes} 道菜。\n\n当前数据源：${this.data.dataSource}\n\n。`,
      showCancel: false,
      confirmText: '知道啦',
      confirmColor: '#FF7A5C',
    });
  },
});
