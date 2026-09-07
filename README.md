# 程序员厨房 · 厨房菜单小程序

基于 [HowToCook（程序员做饭指南）](https://github.com/Anduin2017/HowToCook) 开源菜谱库打造的微信小程序。奶油色系设计，菜谱配图使用 HowToCook 的真实照片（无图菜谱用纯色占位），让"做饭"这件事变得轻松。

---

## ✨ 功能一览

| 页面 | 功能 |
| --- | --- |
| 🏠 首页 | 每日问候 + **「今天吃什么」抽卡动画** + 分类贴纸入口 + 「猜你喜欢」卡片流 |
| 📖 菜谱库 | 分类 Tab 切换 + 双列卡片流 + 搜索入口 |
| 🔍 搜索 | 菜名/标签/**食材反查（冰箱里有什么）** + 历史搜索 |
| 🍳 详情 | 难度锅铲标签 + **份量换算（按人数自动换算用量）** + 食材勾选清单 + **步骤故事模式（一步一屏翻页）** + 小贴士 + 相关推荐 |
| ⭐ 收藏 | 按分类分组展示收藏，一键取消 |
| 🛒 购物清单 | 食材**合并去重** + 勾选进度条 + 从收藏菜谱一键生成 |
| 🙋 我的 | 口味偏好（辣度/素食/快手）+ 浏览历史 + 关于 |

---

## 📁 目录结构

```
kitchen_xg/
├── tools/                    # 数据构建脚本（Node.js）
│   ├── parse.mjs             # HowToCook md → 结构化 JSON
│   └── out/database/recipes.json   # 云数据库导入文件（JSONL）
├── howtocook/                # HowToCook 源仓库（需自行克隆，已 gitignore）
├── cloudfunctions/
│   └── recipes/              # 云函数（list / detail / random）
├── miniprogram/
│   ├── app.js / app.json / app.wxss   # 入口 + 可爱风设计系统（CSS 变量）
│   ├── config.js             # 云环境 ID 配置（留空即本地数据）
│   ├── custom-tab-bar/       # 自定义胶囊 TabBar
│   ├── data/                 # 解析生成的数据（按分类/分块拆成 <100KB 的 .js 模块，由 index.js/recipes.js 聚合）
│   ├── theme/                # 主题常量（难度/吉祥物/问候语）
│   ├── utils/                # 数据服务层 / 本地存储 / 工具函数
│   ├── components/           # 复用组件
│   └── pages/                # 7 个页面
└── project.config.json       # 微信开发者工具项目配置
```

---

## 🚀 快速开始

### 方式一：本地数据（零后端，最快预览）

1. 用 **微信开发者工具** 打开项目根目录 `kitchen_xg/`（已内置 `miniprogram/data/` 全部 368 道菜的数据）。
2. 什么都不用配，直接编译预览即可 —— 未配置云环境时自动走本地数据。

> 游客模式（`touristappid`）即可运行；如需真机预览/发布，把 `project.config.json` 里的 `appid` 换成你自己的。

### 方式二：微信云开发（生产推荐）

1. **开通云开发**：开发者工具 →「云开发」→ 创建环境，记下环境 ID（形如 `cloud1-xxxx`）。
2. **填环境 ID**：编辑 `miniprogram/config.js`，把 `cloudEnv` 填上：
   ```js
   module.exports = { cloudEnv: 'cloud1-xxxx' };
   ```
3. **导入数据**：云开发控制台 →「数据库」→ 新建集合 `recipes` →「导入」→ 选择 `tools/out/database/recipes.json`（JSON Lines 格式，368 行）。
4. **部署云函数**：在 `cloudfunctions/recipes` 目录右键 →「上传并部署：云端安装依赖」。
5. 重新编译，即可从云数据库拉取（详情页/列表/随机走云，搜索仍走内置索引以保证食材反查与离线可用）。

---

## 🔧 数据构建脚本

当 HowToCook 仓库更新、想重新同步菜谱时：

```bash
# 1. 克隆源仓库（如已存在可跳过）
git clone --depth 1 https://github.com/Anduin2017/HowToCook.git howtocook

# 2. 安装依赖（首次）
cd tools && npm install

# 3. 解析并生成 JSON
npm run parse
```

脚本会遍历 `howtocook/dishes/`，把每道菜的 markdown 解析为：

```jsonc
{
  "id": "gongbaojiding",        // 拼音 id
  "name": "宫保鸡丁",
  "category": "荤菜", "categoryKey": "meat_dish",
  "difficulty": 4,              // 由 ★ 数量解析
  "servings": "1人份",
  "time": "1.5小时",
  "tags": ["辣", "进阶挑战"],
  "emoji": "🍗",                // 关键词匹配的封面 emoji
  "ingredients": [{ "name": "手枪腿", "amount": "1 支（约 350g）", "amountValue": 1, "amountUnit": "支" }],
  "steps": [{ "text": "…", "group": "简易版本" }],
  "tips": ["…"]
}
```

输出：`miniprogram/data/categories.js`、按分类/分块拆分的 `data/index/*.js`（轻量索引，含 `ingredientNames` 供食材反查）与 `data/recipes/*.js`（完整数据），以及 `tools/out/database/recipes.json`（云导入）。数据以 `.js` 模块输出、每个文件控制在 100KB 以内（由 `data/index.js` / `data/recipes.js` 静态聚合），避免小程序编译器无法打包大文件的问题。

---

## 🎨 设计说明

- **色彩**：奶油白 `#FFF9F0` 打底，蜜桃粉 `#FFB3A7` / 番茄橘 `#FF7A5C` / 黄油黄 `#FFD166` / 薄荷绿 `#A8D8B9` 点缀，深棕 `#5C4A3D` 代替纯黑。
- **形状**：卡片大圆角 24rpx，按钮/标签胶囊形，分类图标"冰箱贴"式白描边。
- **微交互**：收藏爱心跳动、抽卡滚动动画、勾选"啵"地弹一下、难度用锅铲 `🍳` 代替五角星。
- **图片策略**：菜谱配图使用 HowToCook 真实照片（通过可配置的远程地址加载，见 `config.js` 的 `imageBaseUrl`），无图菜谱显示纯色占位 + 菜名；不把 100MB+ 的原图打进小程序包。

---

## 🛠 技术栈

- **框架**：原生微信小程序（无第三方 UI 库，样式全部手写，轻量可控）
- **数据**：微信云开发（云数据库 + 云函数），内置本地数据自动降级
- **存储**：收藏/购物清单/历史/偏好走 `wx.storage` 本地持久化
- **构建**：Node.js 脚本 `tools/parse.mjs`（依赖 `pinyin-pro` 生成拼音 id）

## 📄 许可

菜谱数据源自 [HowToCook](https://github.com/Anduin2017/HowToCook)（MIT License）。
