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
    imageCandidates: [],
    imageCandidateIndex: 0,
    imageLoaded: false,
  },
  observers: {
    recipe(recipe) {
      const imageCandidates = util.resolveRecipeImageCandidates(recipe, 'thumb');
      this.setData({
        imageUrl: imageCandidates[0] || '',
        imageCandidates,
        imageCandidateIndex: 0,
        imageLoaded: false,
      });
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
      const nextIndex = this.data.imageCandidateIndex + 1;
      const nextUrl = this.data.imageCandidates[nextIndex];
      if (nextUrl) {
        this.setData({ imageUrl: nextUrl, imageCandidateIndex: nextIndex, imageLoaded: false });
        return;
      }
      this.setData({ imageUrl: '', imageLoaded: false });
    },
    onImgLoad() {
      this.setData({ imageLoaded: true });
    },
  },
});
