# 记李歌 v4.0 课件构建脚本

`python3 build.py out.pptx`（在本目录运行；依赖 `.claude/skills/0509-slides/scripts` 里的 kit.py / pages.py，python-pptx）。
每课一个文件（lg1–lg6），单元页 unit.py，附录和隐藏教师页 tail.py。改文字后重新运行即可；放映前用 `render_check.py` 和 `lint_deck.py` 检查。
