const dataService = require('../../utils/data-service');
const util = require('../../utils/util');
const store = require('../../utils/store');

Page({
  data: {
    loading: true,
    error: '',
    id: '',
    recipe: null,
    favorite: false,
    prettyTime: '',
    imageUrl: '',
    imageCandidates: [],
    imageCandidateIndex: 0,
    ingredients: [],
    allChecked: false,
    steps: [],
    currentStep: 0,
    related: [],
    inMenu: false,
  },

  onLoad(options) {
    const id = options.id || '';
    this.setData({ id });
    if (id) store.addHistory(id);
    if (id) this.init(id);
    else this.setData({ loading: false, error: '菜谱链接不完整' });
  },

  onShow() {
    if (this.data.id) this.setData({ inMenu: store.isInMenu(this.data.id) });
  },

  async init(id) {
    this.setData({ loading: true, error: '' });
    try {
      const recipe = await dataService.getRecipe(id);
      if (!recipe) throw new Error('菜谱不存在');
      const ingredients = (recipe.ingredients || []).map((i) => ({ ...i, checked: false }));
      const related = await dataService.getRelated(id, recipe.categoryKey, 8);
      const imageCandidates = util.resolveRecipeImageCandidates(recipe, 'detail');
      this.setData({
        recipe,
        prettyTime: util.prettyTime(recipe.time),
        imageUrl: imageCandidates[0] || '',
        imageCandidates,
        imageCandidateIndex: 0,
        ingredients,
        steps: recipe.steps || [],
        favorite: store.isFavorite(id),
        inMenu: store.isInMenu(id),
        related,
      });
      wx.setNavigationBarTitle({ title: recipe.name });
    } catch (e) {
      this.setData({ error: e.message || '菜谱加载失败' });
    } finally {
      this.setData({ loading: false });
    }
  },

  onIngToggle(e) {
    const idx = e.currentTarget.dataset.index;
    const checked = e.detail.checked;
    this.setData({ [`ingredients[${idx}].checked`]: checked });
    this.setData({ allChecked: this.data.ingredients.every((i) => i.checked) });
  },

  onCheckAll() {
    const target = !this.data.allChecked;
    const ingredients = this.data.ingredients.map((i) => ({ ...i, checked: target }));
    this.setData({ ingredients, allChecked: target });
  },

  onToggleFav() {
    const added = store.toggleFavorite(this.data.id);
    this.setData({ favorite: added });
    wx.showToast({ title: added ? '已收藏 ❤️' : '已取消收藏', icon: 'none' });
  },

  onAddShopping() {
    const list = util.addIngredientsToShoppingList(store.getShoppingList(), this.data.ingredients);
    store.setShoppingList(list);
    wx.showToast({ title: '已加入购物清单 🛒', icon: 'none' });
  },

  onToggleMenu() {
    const added = store.toggleMenuItem(this.data.id);
    this.setData({ inMenu: added });
    wx.showToast({ title: added ? '已加入点菜篮 🍽️' : '已移出点菜篮', icon: 'none' });
  },

  onOpenMenu() {
    wx.navigateTo({ url: '/pages/menu-builder/menu-builder' });
  },

  onStepChange(e) {
    this.setData({ currentStep: e.detail.current });
  },

  onImgError() {
    const nextIndex = this.data.imageCandidateIndex + 1;
    const nextUrl = this.data.imageCandidates[nextIndex];
    this.setData({
      imageUrl: nextUrl || '',
      imageCandidateIndex: nextUrl ? nextIndex : this.data.imageCandidateIndex,
    });
  },

  onRetry() {
    if (this.data.id) this.init(this.data.id);
  },
});
