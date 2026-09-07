/**
 * 环境配置
 *
 * cloudEnv：微信云开发环境 ID（在「微信开发者工具 → 云开发控制台」查看，形如 cloud1-xxxx）
 * 留空 '' 时，小程序自动降级为「本地 JSON 数据」，无需任何后端即可运行。
 *
 * imageBaseUrl：菜谱图片的远程地址前缀（数据里的 image 是相对 howtocook 仓库的路径）。
 * 默认指向 HowToCook 的 GitHub raw 分支；预览时需在开发者工具勾选「详情 → 本地设置 → 不校验合法域名」。
 * 正式发布建议把图片压缩后传到自己的 CDN / 云存储，再改这里的前缀即可。
 */
module.exports = {
  cloudEnv: '',
  imageBaseUrl: 'https://raw.githubusercontent.com/Anduin2017/HowToCook/master/',
};
