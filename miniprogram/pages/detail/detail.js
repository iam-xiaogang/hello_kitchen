const dataService = require('../../utils/data-service');
const util = require('../../utils/util');
const store = require('../../utils/store');

Page({
  data: {
    id: '',
    recipe: null,
    favorite: false,
    prettyTime: '',
    imageUrl: '',
    ingredients: [],
    allChecked: false,
    steps: [],
    currentStep: 0,
    related: [],
  },

  onLoad(options) {
    const id = options.id || '';
    this.setData({ id });
    if (id) store.addHistory(id);
    this.init(id);
  },

  async init(id) {
    const recipe = await dataService.getRecipe(id);
    if (!recipe) {
      wx.showToast({ title: '菜谱不存在', icon: 'none' });
      return;
    }
    const ingredients = (recipe.ingredients || []).map((i) => ({ ...i, checked: false }));
    const related = await dataService.getRelated(id, recipe.categoryKey, 8);
    this.setData({
      recipe,
      prettyTime: util.prettyTime(recipe.time),
      imageUrl: util.resolveImage(recipe.image),
      ingredients,
      steps: recipe.steps || [],
      favorite: store.isFavorite(id),
      related,
    });
    wx.setNavigationBarTitle({ title: recipe.name });
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

  onStepChange(e) {
    this.setData({ currentStep: e.detail.current });
  },

  onImgError() {
    this.setData({ imageUrl: '' });
  },
});
