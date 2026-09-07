const dataService = require('../../utils/data-service');
const util = require('../../utils/util');
const store = require('../../utils/store');

Page({
  data: {
    list: [],
    checkedCount: 0,
    total: 0,
  },

  onShow() {
    this.refresh();
  },

  refresh() {
    const list = store.getShoppingList();
    const checkedCount = list.filter((i) => i.checked).length;
    this.setData({ list, checkedCount, total: list.length });
  },

  onToggle(e) {
    const name = e.currentTarget.dataset.name;
    store.toggleShoppingItem(name);
    this.refresh();
  },

  onClear() {
    wx.showModal({
      title: '清空清单？',
      content: '所有食材都会被清空哦',
      confirmColor: '#FF7A5C',
      success: (res) => {
        if (res.confirm) {
          store.clearShoppingList();
          this.refresh();
        }
      },
    });
  },

  async onGenerate() {
    const favIds = store.getFavorites();
    if (!favIds.length) {
      wx.showToast({ title: '还没有收藏菜谱哦', icon: 'none' });
      return;
    }
    const current = store.getShoppingList();
    const proceed = () => this.doGenerate(favIds);
    if (current.length) {
      wx.showModal({
        title: '覆盖当前清单？',
        content: '将用收藏菜谱重新生成清单',
        confirmColor: '#FF7A5C',
        success: (res) => {
          if (res.confirm) proceed();
        },
      });
    } else {
      proceed();
    }
  },

  async doGenerate(favIds) {
    wx.showLoading({ title: '生成中…' });
    const recipes = [];
    for (const id of favIds) {
      const r = await dataService.getRecipe(id);
      if (r) recipes.push(r);
    }
    const merged = util.mergeIngredients(recipes);
    store.setShoppingList(merged);
    wx.hideLoading();
    this.refresh();
    wx.showToast({ title: `已生成 ${merged.length} 项`, icon: 'none' });
  },
});
