const config = require('./config');
const store = require('./utils/store');

App({
  globalData: {
    cloudReady: false,
    cloudEnv: config.cloudEnv || '',
    categories: [],
  },

  onLaunch() {
    this.initCloud();
    this.loadCategories();
    store.init();
  },

  // 初始化云开发（未配置 env 时走本地数据）
  initCloud() {
    if (!wx.cloud) {
      console.warn('[程序员厨房] 基础库过低，云能力不可用，已降级为本地数据');
      return;
    }
    if (!config.cloudEnv) {
      console.warn('[程序员厨房] 未配置 cloudEnv，已降级为本地数据（可在 miniprogram/config.js 填写云环境 ID）');
      return;
    }
    try {
      wx.cloud.init({ env: config.cloudEnv, traceUser: true });
      this.globalData.cloudReady = true;
    } catch (e) {
      console.warn('[程序员厨房] 云初始化失败，已降级为本地数据', e);
    }
  },

  loadCategories() {
    try {
      this.globalData.categories = require('./data/categories.js');
    } catch (e) {
      this.globalData.categories = [];
    }
  },
});
