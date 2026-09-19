# ZhiJiao · 中英双语个人学术主页

基于 Hexo 7 和本地 `folio` 主题的简洁个人主页。白底单栏，直接展示个人介绍、研究方向、联系方式与论文清单，仅保留姓名和“学术论文”两个标题。支持中英切换、记忆语言偏好、手机适配和键盘访问，并提供滚动进度、内容淡入等克制的动态细节。

## 本地运行

建议使用 Node.js 20 或更新版本：

```sh
npm ci
npm run server
```

浏览器访问 http://localhost:4000 。若修改 YAML 后预览未刷新，重启预览服务。

```sh
npm run build       # 清理旧产物并生成 public/
npm run deploy      # 先构建，再发布到已配置的 Git 仓库
```

部署目标为 `zhi-jiao/zhi-jiao.github.io` 的 `master` 分支。GitHub Pages 需要设置为从该分支发布，认证使用本机 Git 凭据。普通构建不会发布网站。

## 修改内容

| 文件 | 用途 |
| --- | --- |
| `homepage/_data/profile.yml` | 双语介绍、研究方向、邮箱、GitHub、论文清单 |
| `homepage/images/portrait.jpg` | 页首头像；通过资料配置中的 `photo` 字段设置路径 |
| `_config.yml` | 站点标题、描述、网址与部署设置 |
| `themes/folio/layout/home.ejs` | 首页区块与结构、双语界面文字 |
| `themes/folio/layout/layout.ejs` | 网页元信息与资源引用 |
| `themes/folio/source/css/site.css` | 配色、字体、手机适配 |
| `themes/folio/source/js/site.js` | 语言切换、滚动进度、内容淡入和苦力怕互动 |
| `themes/folio/scripts/three-assets.js` | 构建时从 npm 依赖输出匹配版本的 Three.js renderer、core 模块与许可证，避免遗漏依赖 |
| `themes/folio/source/images/favicon.svg` | 网站图标 |

双语字段使用 `en` / `zh`。首次访问默认中文，访客可点击右上角“English”切换英文，选择会保存在浏览器中。论文英文标题始终保留，中文模式额外显示中文释义。JavaScript 不可用时，默认展示中文内容和全部论文；WebGL 不可用时，苦力怕会自动回退到 CSS 样式。

论文按数据文件中的顺序展示。每篇支持 `title`、`translation`、`authors`、`venue`、`type`（`journal` 或 `conference`），以及可选的 `year`、`detail`、`doi`。作者名与 `publication_name` 一致时高亮。没有 DOI 的条目不会生成虚构链接；发表年份不根据 DOI 推断。个人信息及论文记录来自旧 About 页面，未独立核验。

## 原博客保留方式

`source/`、`scaffolds/`、`themes/oranges/`、`_config_oranges.yml` 和 `_config.landscape.yml` 作为历史源码保留，**不参与当前站点构建**。当前内容目录是 `homepage/`，主题为 `folio`，不会发布旧文章、归档、标签、RSS、搜索或 Minecraft 挂件。

`legacy/blog-config.yml`、`legacy/blog-package.json`、`legacy/blog-package-lock.json` 保存重构前配置及依赖。如要恢复博客，可结合这些备份恢复依赖和内容目录；恢复前仍需处理旧主题配置文件名错误和 `footer` 重复键问题。

`public/`、`.deploy_git/`、`node_modules/`、`db.json` 为构建或本地文件，无需纳入源码。应跟踪新主题、内容、配置与 lockfile；构建个人主页不需要初始化历史 Oranges 子模块。
