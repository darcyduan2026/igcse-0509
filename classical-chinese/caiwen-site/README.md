# 文言自学网站（IGCSE 0509）

静态网站，无需构建。打开 `index.html` 即可使用，或用 GitHub Pages 发布。

## 发布到 GitHub Pages

仓库 Settings → Pages → Source 选 "Deploy from a branch"，Branch 选 `main`，文件夹选 `/ (root)`。
发布后网址为：`https://<用户名>.github.io/igcse-0509/classical-chinese/caiwen-site/`

## 内容来源与版权

- 原文：明代作品，公有领域，依《采文》（华语教学出版社）的选篇照录。
- 注释、译文、文章主旨、练习题、答案要点、词语卡片：本站自编，不是《采文》原书内容。

## 文件

- `index.html` / `style.css` / `app.js`：页面与逻辑
- `data/unit1.js`：第一单元数据（四篇）
- 新增单元：复制 `data/unit1.js` 为 `data/unit2.js`，改 `id`、`title`、`texts`，并在 `index.html` 里加一行 `<script src="data/unit2.js"></script>`。

## 数据格式

- 原文段落里用 `[[词|拼音|注释]]` 标注（拼音可留空：`[[词||注释]]`）。
- 练习题 `type`：`mc`（选择，自动判分）、`short`（简答，自评）、`explain` / `who`（多小题，自评）。
- 学习记录保存在浏览器 localStorage，不上传。
