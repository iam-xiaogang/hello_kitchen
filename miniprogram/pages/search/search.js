const dataService = require('../../utils/data-service');

const HISTORY_KEY = 'kxg_search_history';

Page({
  data: {
    keyword: '',
    results: [],
    searched: false,
    history: [],
    fridgeWords: ['土豆', '番茄', '鸡蛋', '鸡翅', '豆腐', '牛肉', '虾', '白菜', '黄瓜', '面条'],
  },

  onLoad() {
    this.setData({ history: wx.getStorageSync(HISTORY_KEY) || [] });
  },

  onInput(e) {
    this.setData({ keyword: e.detail.value });
  },

  async doSearch(kw) {
    const keyword = String(kw !== undefined ? kw : this.data.keyword).trim();
    if (!keyword) return;
    this.setData({ keyword, searched: true });
    const results = await dataService.search(keyword);
    this.setData({ results });
    this.saveHistory(keyword);
  },

  onSearch() {
    this.doSearch();
  },

  onTag(e) {
    this.doSearch(e.currentTarget.dataset.kw);
  },

  onClear() {
    this.setData({ keyword: '', results: [], searched: false });
  },

  saveHistory(kw) {
    let h = wx.getStorageSync(HISTORY_KEY) || [];
    h = h.filter((x) => x !== kw);
    h.unshift(kw);
    h = h.slice(0, 10);
    wx.setStorageSync(HISTORY_KEY, h);
    this.setData({ history: h });
  },

  clearHistory() {
    wx.setStorageSync(HISTORY_KEY, []);
    this.setData({ history: [] });
  },
});
