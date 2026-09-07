Component({
  data: {
    selected: 0,
    list: [
      { pagePath: '/pages/index/index', text: '首页', icon: '🏠' },
      { pagePath: '/pages/housework/housework', text: '家务', icon: '🧹' },
      { pagePath: '/pages/favorites/favorites', text: '收藏', icon: '⭐' },
      { pagePath: '/pages/profile/profile', text: '我的', icon: '🙋' },
    ],
  },
  methods: {
    onSwitchTab(e) {
      const { path, index } = e.currentTarget.dataset;
      if (index === this.data.selected) return;
      wx.switchTab({ url: path });
    },
  },
});
