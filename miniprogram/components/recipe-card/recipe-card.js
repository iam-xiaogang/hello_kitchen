const util = require('../../utils/util');

Component({
  properties: {
    recipe: { type: Object, value: {} },
    favorite: { type: Boolean, value: false },
    showFavorite: { type: Boolean, value: true },
    type: { type: String, value: 'grid' }, // grid | row
  },
  data: {
    imageUrl: '',
  },
  observers: {
    recipe(recipe) {
      this.setData({ imageUrl: util.resolveImage(recipe && recipe.image) });
    },
  },
  methods: {
    onTap() {
      const id = this.data.recipe.id;
      if (id) wx.navigateTo({ url: `/pages/detail/detail?id=${id}` });
    },
    onFav() {
      this.triggerEvent('fav', {
        id: this.data.recipe.id,
        favorite: this.data.favorite,
      });
    },
    onImgError() {
      this.setData({ imageUrl: '' });
    },
  },
});
