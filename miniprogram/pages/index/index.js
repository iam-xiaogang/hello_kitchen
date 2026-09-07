const dataService = require('../../utils/data-service');
const util = require('../../utils/util');
const theme = require('../../theme/theme');
const store = require('../../utils/store');

Page({
  data: {
    greeting: '',
    recommend: [],
    favorites: [],
    rolling: false,
    rollRecipe: null,
    resultRecipe: null,
    resultImageUrl: '',
    showResult: false,
  },

  onLoad() {
    this.setData({ greeting: theme.randomGreeting() });
    this.init();
  },

  onShow() {
    if (typeof this.getTabBar === 'function' && this.getTabBar()) {
      this.getTabBar().setData({ selected: 0 });
    }
    this.refreshFavorites();
  },

  init() {
    const index = dataService.getIndex();
    const prefs = store.getPrefs();
    const isQuick = (r) => {
      const m = String(r.time || '').match(/(\d+(?:\.\d+)?)\s*分钟/);
      return m ? parseFloat(m[1]) <= 15 : false;
    };
    let recommend;
    if (prefs && prefs.vegetarian) {
      const veg = util.shuffle(index.filter((r) => r.categoryKey === 'vegetable_dish'));
      const others = util.shuffle(index.filter((r) => r.categoryKey !== 'vegetable_dish'));
      recommend = veg.slice(0, 6).concat(others.slice(0, 2));
    } else {
      recommend = util.shuffle(index).slice(0, 8);
    }
    if (prefs && prefs.quick) {
      const quick = recommend.filter(isQuick);
      if (quick.length >= 3) recommend = quick;
    }
    this.setData({ recommend });
  },

  refreshFavorites() {
    this.setData({ favorites: store.getFavorites() });
  },

  onSearch() {
    wx.navigateTo({ url: '/pages/search/search' });
  },

  /* ---------- 今天吃什么 ---------- */
  onTodayEat() {
    if (this.data.rolling) return;
    this.setData({ rolling: true });
    const index = dataService.getIndex();
    let count = 0;
    const timer = setInterval(() => {
      this.setData({ rollRecipe: util.randomPick(index) });
      count += 1;
      if (count >= 14) {
        clearInterval(timer);
        this.finishRoll();
      }
    }, 80);
  },

  async finishRoll() {
    const recipe = (await dataService.getRandom()) || util.randomPick(dataService.getIndex());
    this.setData({
      rolling: false,
      resultRecipe: recipe,
      resultImageUrl: util.resolveImage(recipe.image),
      showResult: true,
    });
  },

  onCloseResult() {
    this.setData({ showResult: false });
  },

  noop() {},

  onGoResult() {
    const id = this.data.resultRecipe && this.data.resultRecipe.id;
    this.setData({ showResult: false });
    if (id) wx.navigateTo({ url: `/pages/detail/detail?id=${id}` });
  },

  onChange() {
    this.setData({ showResult: false });
    setTimeout(() => this.onTodayEat(), 200);
  },

  /* ---------- 收藏 ---------- */
  onFav(e) {
    const { id } = e.detail;
    const added = store.toggleFavorite(id);
    this.refreshFavorites();
    wx.showToast({ title: added ? '已收藏 ❤️' : '已取消收藏', icon: 'none' });
  },
});
