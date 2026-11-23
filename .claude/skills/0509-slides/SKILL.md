---
name: 0509-slides
description: Build or revise classroom PowerPoint decks (课件 / slide / PPT) for IGCSE 0509 Chinese First Language lessons — 4–6 lesson units, 45-minute lessons, 读→议→写 structure, python-pptx build kit, PowerPoint render check, deck lint. Also covers the matching lesson-design file (…_Chalk课堂设计.md, one file per unit). Use whenever the user asks to make, redo, or restyle a 0509 课件/slide, or to turn a lesson plan into slides. Not for worksheets or Word files.
---

# 0509 课件（slide）制作

负责 **0509 课堂 PPTX 课件**，以及与它配套的**课堂设计文件**。练习册、Word 资料不在本技能范围。

**课堂设计文件（2026-11-23 起的固定做法）**：每个单元只有一个 md，文件名 `日期_单元_课文_Chalk课堂设计.md`，按 Chalk 格式写——每课先是可直接复制到 Chalk 的区块（Learning Intention → 今天结束时我能 → Agenda → Exit Ticket → Homework → Differentiation → Resource），再是“课堂详案（教师用，不复制到 Chalk）”。**不再单独生成或更新 Chalk 课时总结**；课件内容、设计文件内容必须一致。参考：`1.4_…记李歌…/…Chalk课堂设计.md`、`1.5_…华语情结…/…Chalk课堂设计.md`。

## 先读这些（按需）

| 文件 | 什么时候读 |
|---|---|
| `0509_LTP-Lesson-slides/specification-slide-0509.md`（v3.0） | 每次开工前。内容准确性、讲者备注、交付检查的权威规格 |
| `0509_LTP-Lesson-slides/specification-slides_v2.1_added-colour-requirement.md` | 文言文单元：第 4 节（文言知识显性、逐句精读、提问质量） |
| [references/lesson-structure-v4.md](references/lesson-structure-v4.md) | 设计每一课：读→议→写、提取题、出口题、指令写法 |
| [references/visual-system.md](references/visual-system.md) | 做页面：五种页面类型、视觉意象、流程条、动画 |
| `0509_LTP-Lesson-slides/1.5_散文《华语情结》余秋雨/` | 参考成品：`…课堂设计_v4.0.md`（设计）和 `…课堂课件_v4.0.pptx`（课件） |

## 规格优先级（重要）

1. **用户当次明确的要求**最高。
2. **v4.0**（2026-11-23，《华语情结》重做）：课时结构、页面类型、视觉系统、指令写法——覆盖 v3.0 中相冲突的部分。
3. **v3.0 规格**：其余全部继续有效（内容准确性、备注、隐藏教师页、文件名、不覆盖原课件、交付检查）。
4. **v2.1 第 4 节**：文言文单元的专项要求，放在每课的“读”里执行。

### v4.0 与 v3.0 的已知冲突（遇到时按下表处理；表里标“待确认”的先问用户）

| 项目 | v3.0 | v4.0 做法 |
|---|---|---|
| 每课页面链 | 封面→路线图→提取→主体→知识→写作→出口 | 封面→开场→读→议→写→出口→要点；**不做路线图页**，用页内流程条 |
| 提取练习 | 3 固定＋1 机动 | 3 题（上课出口的提取题＋较早课的 1 题＋1 道机动题） |
| 出口检测 | 3 题 | 2 题（迁移＋说理），提取题移到下课开场 |
| 页面标记 | 右上角模式标签＋分钟，底部“产出”条 | 右上角“读/议/写”圆点＋分钟，底部流程条；产出写在页面内容里 |
| Chalk 文件 | 每单元另做“Chalk 课时总结” | **取消**：设计文件本身就是 Chalk 格式（见上） |
| 单元前置页 | 封面、总览、课堂五个动作 | 封面、总览（**五个动作页 v4 未做——待确认是否需要**） |
| 字体 | v2.1：全部 STKaiti；v3.0：界面雅黑＋原文宋体 | v4 成品：标题/原文/引文楷体（KaiTi），界面微软雅黑（**待确认统一标准**） |
| 字号下限 | 标题≥26，正文≥14，表格≥13，原文≥16 | 《华语情结》v4 成品有大量小字（232 处）；《记李歌》v4 已按下限做（仅剩 13 pt 的表格单元格）。**新做的页面按 v3.0 下限做**；页眉标签和页底流程条不计 |
| 学生页内容 | 备课元说明不出现在学生页 | 出口要点页**不显示**“回收规则”（只进备注）；《华语情结》v4 的该页违反了这一点 |

## 工作流程

1. **核对材料**：长期计划、教材页/截图、课文原文、课时数（默认每课 45′）。引文逐字核对；教师改写句、迁移新句要标明“非原文”。无法确认的教材题答案不给唯一答案。
2. **先出设计，再出课件**：用 `references/lesson-structure-v4.md` 写一份设计文件（Chalk 格式，每课 开场4′＋读12′＋议15′＋写10′＋出口4′，总和必须 45′）。用户确认设计后才做课件，除非用户已明确要求直接做；直接做时也要同时交设计文件。
3. **逐页搭建**：用 `scripts/kit.py`（形状/文字/流程条/点击动画/表格）和 `scripts/pages.py`（封面、提取、出口、要点、附录等页面模板）。**先 `kit.set_theme(...)` 再 `from kit import *`**（配色按课文换：`THEMES` 里有 `ji`＝记李歌的黛/金/朱/宣纸；新单元加一个新主题）；封面母题用 `pages.cover(..., motif=函数)`。每课一个函数，页面按页面类型（见 visual-system.md）选择，不要所有页面同构。参考实现（含构建脚本）：文言文——`.ppt_build/jilige_v4/`（`1.4_…记李歌…v4.0.pptx`）；现代文——`.ppt_build/huayu_v4/`（`1.5_…华语情结…v4.0.pptx`）。
4. **每页必有讲者备注**：做法、答案、预期错误、追问、压缩办法、安全提醒、教材页码对应。学生页不出现备课元说明。
5. **渲染检查**：`python3 scripts/render_check.py deck.pptx <输出目录>` → 打开 `sheet*.png` 逐张看。重点：文字溢出、重叠、计时条文字换行、空白页。修完再渲染，直到干净。
6. **静态检查**：`python3 scripts/lint_deck.py deck.pptx`。ERROR 必须清零（无备注、越界、占位文字）；WARN（小字、非常规字体）向用户如实报告数量，不要隐瞒。
7. **交付**：新文件名（如 `…_课堂课件_v4.0.pptx`），**不覆盖原课件**，放在对应课文文件夹；隐藏页只有教师参考页；报告页数、动画页数、未验证项。

## 硬规则

- 动画只用“点击出现/消失”，用来制造等待，不做装饰；动画在渲染里看不到，**必须告诉用户“放映时试一遍”**。
- 所有填写结构（表格、词卡、证据卡）用可编辑形状/文字，不做图片。
- 不用生成图片；视觉意象从课文长出来（同心圈、虚线人形、对话气泡等），见 visual-system.md。
- 敏感话题（家庭语言、姓名、民族、真实人物）：页面和备注里都写明“可以跳过”“只讨论文章里的人物”。
- 不编造教材内容、数据、考试字数；字数一律标“课堂建议，不是考试规定”。
- 任务指令必须写清：做什么（动词＋对象）／交什么／做到什么算完成。禁用含糊说法：“把词放回原句”“解释一下”“说说你的理解”。

## 渲染环境注意（macOS）

- 渲染用 Microsoft PowerPoint + AppleScript。PowerPoint 有沙盒：**必须把文件放进它的容器目录**（脚本已处理），否则 AppleScript 会超时（-1712）。
- 用户的其他 PPT 可能正开着：脚本只对自己复制的临时文件按名字操作，**不要对 “active presentation” 执行 save/close**。
- 没有 PowerPoint 时，没有可靠的替代渲染；此时必须明确告诉用户“版式未渲染验证”。
- 依赖：python-pptx、PyMuPDF（fitz）、Pillow。

## 搭建示例

```python
import sys; sys.path.insert(0, '.claude/skills/0509-slides/scripts')
from kit import *
import pages
pages.set_lessons([('声', '华语的声音'), ('根', '抽象人')])
pages.cover(1, '声', '华语的声音', '“我没有华文名字。”', '凭这一句，能断定他不认同自己是华人吗？', '备注…', tag='第一单元 · 现代散文')
s = new('paper'); chrome(s, '第 1 课　读', '默读全文', cur='读', mins=12)
timeline(s, [('默读猜词', 8), ('同桌核对', 4)], cur=0); notes(s, '…')
prs.save('out.pptx')
```
