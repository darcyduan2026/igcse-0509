import fs from "node:fs/promises";
import path from "node:path";
import { pathToFileURL } from "node:url";
import { FileBlob, PresentationFile } from "@oai/artifact-tool";

const workspaceDir = path.resolve(".");
const SKILL_DIR = "/Users/duan.d/.codex/plugins/cache/openai-primary-runtime/presentations/26.905.11957/skills/presentations";
const RUNTIME_PYTHON = "/Users/duan.d/.cache/codex-runtimes/codex-primary-runtime/dependencies/python/bin/python";
const sourcePath = path.join(workspaceDir, "LTP + Lesson slides/0509_Y10T1_文化认同_优化教学版_修订版.pptx");
const stagingDir = path.join(workspaceDir, ".codex-finalizer");
const FINAL_PPTX = path.join(workspaceDir, ".ppt_output", "0509_Y10T1_文化认同_指导写作二次修订版.pptx");
await fs.mkdir(stagingDir, { recursive: true });
await fs.mkdir(path.dirname(FINAL_PPTX), { recursive: true });

const presentation = await PresentationFile.importPptx(await FileBlob.load(sourcePath));

const C = {
  bg: "#FBFAF7",
  ink: "#40372F",
  muted: "#736A62",
  taupe: "#99826C",
  clay: "#B2775C",
  clayPale: "#F2E7DF",
  beige: "#EFEAE3",
  line: "#D7CDC0",
  moss: "#657C70",
  mossPale: "#E7EEE9",
};
const FONT = "STKaiti";

function rect(slide, left, top, width, height, fill, lineFill = fill) {
  return slide.shapes.add({
    geometry: "rect",
    position: { left, top, width, height },
    fill,
    line: { fill: lineFill, width: 0 },
  });
}

function text(slide, value, left, top, width, height, {
  size = 20, color = C.ink, bold = false, align = "left", fill = "none",
} = {}) {
  const shape = slide.shapes.add({
    geometry: "textbox",
    position: { left, top, width, height },
    fill,
    line: { fill: "none", width: 0 },
  });
  shape.text = value;
  shape.text.style = {
    typeface: FONT,
    fontSize: size,
    color,
    bold,
    align,
    autoFit: "shrinkText",
  };
  return shape;
}

function base(slide, title, subtitle = "") {
  rect(slide, 0, 0, 1280, 720, C.bg);
  rect(slide, 0, 0, 1280, 14, C.ink);
  text(slide, title, 64, 55, 1120, 46, { size: 31, bold: true });
  if (subtitle) text(slide, subtitle, 64, 112, 1120, 28, { size: 16, color: C.muted });
  rect(slide, 64, 153, 106, 5, C.clay);
}

function label(slide, value, left, top, width, color = C.clay) {
  text(slide, value, left, top, width, 28, { size: 17, bold: true, color });
}

function note(slide, value) {
  slide.speakerNotes.setText(value);
  slide.speakerNotes.setVisible(true);
}

// Slide 15: retain the supplied section cover and update only the teaching focus.
presentation.resolve("sh/ts7md4r2").text.replace("回应概括性写作", "指导写作");
presentation.resolve("sh/65gnqlk7").text.replace("回应概括性写作：短文一、短文二", "指导写作：双文本整合");
presentation.resolve("sh/t87ml0ji").text.replace("阅读要落到证据；写作要回应目的和受众。", "用编号找证据，用段落完成论证。");
note(presentation.resolve("sl/vaxsvy10"), "本节以教材《新加坡多种族政策》的两则短文为材料组。先让学生看到：这是一项指导写作练习，不是分别概括两篇短文。插图只作课堂情境。\n材料依据：用户提供的教材页面截图。\n教学重点：用 ①A1、①B1 等标注，将材料信息归入题目的三个要点。");

// Slide 16
{
  const s = presentation.resolve("sl/gny5sjyp");
  base(s, "指导写作：从材料到有针对性的文章", "两篇材料服务同一问题；答案必须回答题目指定的三个要点。 ");
  rect(s, 92, 205, 470, 335, C.beige);
  label(s, "材料输入", 126, 228, 160, C.taupe);
  text(s, "短文一\n政策、制度与融入安排", 126, 281, 360, 70, { size: 23, bold: true });
  text(s, "CMIO、双语、居住配额、\n融入与归化倡导员", 126, 368, 360, 66, { size: 18, color: C.muted });
  rect(s, 126, 460, 350, 2, C.line);
  text(s, "短文二\n学校、社区与共同经历", 126, 480, 360, 62, { size: 22, bold: true });
  rect(s, 640, 205, 2, 335, C.line);
  label(s, "文章产出", 710, 228, 160, C.clay);
  text(s, "向指定读者写一篇\n论证／讨论性回应", 710, 282, 370, 72, { size: 25, bold: true });
  text(s, "答全三个要点\n使用两篇材料\n250–350 字，以自己的话表达", 710, 388, 390, 110, { size: 20, color: C.ink });
  text(s, "编号帮助你覆盖题目；它不是文章的最终结构。", 92, 588, 1000, 30, { size: 18, color: C.moss, bold: true });
  note(s, "第 1 步：用本页建立任务意识。强调写作不是压缩材料，而是选取、整合和评价两则短文中的相关信息。\n材料依据：用户提供的教材页面截图；字数与任务形式依据 Cambridge IGCSE 0509 Paper 1 Section 2。 ");
}

// Slide 17
{
  const s = presentation.resolve("sl/14bup87q");
  base(s, "先拆题：三个要点就是三项写作任务", "先圈身份、读者、目的，再给每一个内容要求编号。 ");
  rect(s, 92, 195, 1096, 96, C.beige);
  text(s, "校报正在讨论：多元社会如何形成真正的归属感？请根据两则短文，给同学写一篇文章。", 125, 224, 1010, 36, { size: 22, bold: true, align: "center" });
  const rows = [
    ["①", "说明政府怎样维护不同族群的平等地位与文化特点"],
    ["②", "说明学校、社区等怎样创造跨族群交流的机会"],
    ["③", "结合两则短文，评价制度安排和日常互动怎样共同促进认同"],
  ];
  rows.forEach(([n, content], i) => {
    const y = 330 + i * 94;
    rect(s, 110, y, 74, 56, i === 2 ? C.mossPale : C.clayPale);
    text(s, n, 110, y + 8, 74, 36, { size: 28, bold: true, align: "center", color: i === 2 ? C.moss : C.clay });
    text(s, content, 220, y + 10, 890, 38, { size: 22, bold: i === 2 });
  });
  note(s, "第 2 步：投影仿真题干。学生用三种颜色圈出题目要点，并口头复述每一个要点要他们做什么。第 3 点要特别提示：它要求整合和评价，不是重复前两点。\n本题为根据用户提供材料编制的课堂仿真任务。 ");
}

// Slide 18
{
  const s = presentation.resolve("sl/y5wne50z");
  base(s, "证据编号法：每个标签都说明“答什么、来自哪里”", "格式：题目要点＋材料来源＋该要点下的序号。 ");
  text(s, "① A 1", 102, 225, 260, 70, { size: 43, bold: true, color: C.clay, align: "center" });
  text(s, "①  对应题目的第一个要点", 416, 220, 590, 32, { size: 22 });
  text(s, "A  来自短文一；B 来自短文二", 416, 269, 590, 32, { size: 22 });
  text(s, "1  同一要点下的第一项可用信息", 416, 318, 590, 32, { size: 22 });
  rect(s, 92, 400, 1096, 2, C.line);
  label(s, "在原文边上这样标", 92, 432, 250, C.moss);
  text(s, "①A1  CMIO：不同族群享有平等地位\n①A2  双语教育保留母语与族群语言\n②B1  跨族群课外活动创造交流机会", 92, 480, 885, 108, { size: 21 });
  text(s, "不要抄整句。\n圈关键词，再写“它说明什么”。", 982, 471, 175, 92, { size: 17, color: C.muted, align: "center" });
  note(s, "第 3 步：示范编号。学生在教材上直接做标记，优先圈关键词。要求学生在页边补半句话，例如“平等地位”后写“保障文化特点”。这样编号保留了信息的用途，而不是成为摘抄。\n材料依据：用户提供的教材页面截图。 ");
}

// Slide 19
{
  const s = presentation.resolve("sl/nid43ytk");
  base(s, "短文一 A：政策怎样为认同提供基础", "先把短文一的材料放进最合适的题目要点，不求每一句都编号。 ");
  const items = [
    ["①A1", "CMIO 模式让华人、马来人、印度人与其他族群享有平等地位", "维护平等地位"],
    ["①A2", "双语教育中的母语学习保留各族群的语言特点", "保留文化特点"],
    ["②A1", "种族配额制与公共场所让不同族群有接触机会", "创造交流条件"],
    ["②A2", "融入与归化倡导员协助新移民参与社区生活", "帮助融入社会"],
  ];
  rect(s, 92, 198, 1096, 54, C.ink);
  text(s, "编号", 118, 211, 155, 28, { size: 18, bold: true, color: C.bg });
  text(s, "材料关键词", 305, 211, 570, 28, { size: 18, bold: true, color: C.bg });
  text(s, "它回答什么", 920, 211, 210, 28, { size: 18, bold: true, color: C.bg });
  items.forEach(([n, detail, purpose], i) => {
    const y = 252 + i * 75;
    rect(s, 92, y, 1096, 75, i % 2 === 0 ? C.beige : C.bg);
    text(s, n, 118, y + 18, 155, 30, { size: 20, bold: true, color: C.clay });
    text(s, detail, 305, y + 13, 570, 48, { size: 19 });
    text(s, purpose, 920, y + 18, 210, 30, { size: 19, color: C.moss, bold: true });
  });
  text(s, "学生核对：我标的不是“有趣的信息”，而是能直接回应题目的一点。", 92, 594, 1040, 30, { size: 18, color: C.muted });
  note(s, "第 4 步：全班共同完成短文一的示范。先由学生提议编号，教师再追问“它回答①还是②？为什么？”无需把所有内容都标完。\n材料依据：用户提供的教材页面截图。 ");
}

// Slide 20
{
  const s = presentation.resolve("sl/zyxsni5k");
  base(s, "短文二 B：共同经历怎样把“接触”变成理解", "短文二主要帮助回答第②与第③点。 ");
  const items = [
    ["②B1", "跨越种族的课外活动让学生一起参与、消磨课余时间", "学校中的交流"],
    ["②B2", "种族和谐日、校园庆祝与社区文化周让居民共同参与", "社区中的交流"],
    ["②B3", "国民服役让不同背景的人共同维护国家安全", "共同经历"],
    ["③B1", "共同经历使人学习相互理解与尊重，体会社会多元性", "认同如何形成"],
  ];
  rect(s, 92, 198, 1096, 54, C.ink);
  text(s, "编号", 118, 211, 155, 28, { size: 18, bold: true, color: C.bg });
  text(s, "材料关键词", 305, 211, 570, 28, { size: 18, bold: true, color: C.bg });
  text(s, "它回答什么", 920, 211, 210, 28, { size: 18, bold: true, color: C.bg });
  items.forEach(([n, detail, purpose], i) => {
    const y = 252 + i * 75;
    rect(s, 92, y, 1096, 75, i % 2 === 0 ? C.beige : C.bg);
    text(s, n, 118, y + 18, 155, 30, { size: 20, bold: true, color: C.clay });
    text(s, detail, 305, y + 13, 570, 48, { size: 19 });
    text(s, purpose, 920, y + 18, 210, 30, { size: 19, color: C.moss, bold: true });
  });
  text(s, "一个信息先归入最主要的要点；写作时可以在另一段把它用于联结。", 92, 594, 1040, 30, { size: 18, color: C.muted });
  note(s, "第 5 步：学生两人一组完成短文二的编号，再与投影答案核对。特别讨论③B1：它为什么不是单纯的活动例子，而是说明“共同认同”形成的过程。\n材料依据：用户提供的教材页面截图。 ");
}

// Slide 21
{
  const s = presentation.resolve("sl/m1wvqtk3");
  base(s, "第三个要点：把两篇材料放进同一个判断", "整合不是“短文一说……短文二说……”，而是说明两者怎样共同回答问题。 ");
  rect(s, 92, 210, 440, 176, C.clayPale);
  label(s, "短文一提供条件", 126, 236, 250, C.clay);
  text(s, "平等地位、文化空间、\n接触机会与融入安排", 126, 287, 320, 62, { size: 23, bold: true });
  rect(s, 748, 210, 440, 176, C.mossPale);
  label(s, "短文二呈现过程", 782, 236, 250, C.moss);
  text(s, "一起学习、参与活动、\n承担共同责任", 782, 287, 320, 62, { size: 23, bold: true });
  rect(s, 568, 245, 144, 92, C.ink);
  text(s, "共同\n认同", 568, 259, 144, 55, { size: 25, bold: true, color: C.bg, align: "center" });
  rect(s, 92, 454, 1096, 2, C.line);
  label(s, "把编号改写成判断", 92, 483, 300, C.moss);
  text(s, "制度安排让不同群体有平等地位和相遇的机会；学校、社区与国民服役中的共同经历，\n则把“有机会接触”转化为理解、尊重与较稳定的归属感。", 92, 530, 1050, 70, { size: 22, bold: true });
  note(s, "第 6 步：教师示范从①A1、②A1、②B1、③B1抽取信息，写成一个整合判断。提醒学生：这不是外加的个人例子，而是根据材料关系作出的解释。\n材料依据：用户提供的教材页面截图。 ");
}

// Slide 22
{
  const s = presentation.resolve("sl/5onypobq");
  base(s, "从编号到限时写作", "按题目要点组织文章；提交前分别检查“内容”与“表达”。 ");
  const parts = [
    ["开头", "约30字\n说明议题与对象"],
    ["①", "约70字\n选①A1、①A2"],
    ["②", "约70字\n整合②A、②B"],
    ["③", "约90字\n作出整合判断"],
    ["结尾", "约30字\n回应核心问题"],
  ];
  parts.forEach(([head, body], i) => {
    const x = 78 + i * 218;
    const fill = i === 3 ? C.mossPale : (i === 1 || i === 2 ? C.clayPale : C.beige);
    rect(s, x, 205, 184, 138, fill);
    text(s, head, x + 14, 225, 156, 32, { size: 24, bold: true, color: i === 3 ? C.moss : C.ink, align: "center" });
    text(s, body, x + 14, 274, 156, 50, { size: 17, color: C.muted, align: "center" });
  });
  rect(s, 92, 410, 500, 172, C.beige);
  label(s, "内容 15 分", 122, 434, 180, C.clay);
  text(s, "□ 三个要点都回应了吗？\n□ 两则短文都发挥作用了吗？\n□ 我的判断能回到材料吗？", 122, 478, 390, 84, { size: 19 });
  rect(s, 666, 410, 522, 172, C.mossPale);
  label(s, "写作 10 分", 696, 434, 180, C.moss);
  text(s, "□ 语气适合校报读者吗？\n□ 我用自己的话组织了吗？\n□ 250–350 字，字词与标点准确吗？", 696, 478, 410, 84, { size: 19 });
  text(s, "反馈只留一个内容目标和一个写作目标，例如：③段要真正整合两篇材料。", 92, 620, 1050, 30, { size: 17, color: C.muted });
  note(s, "第 7 步：50 分钟限时练习可分为读题与编号 10 分钟、计划 5 分钟、写作 30 分钟、检查 5 分钟。批改与同伴反馈分开记录内容目标和写作目标。\n评分结构与字数依据 Cambridge IGCSE 0509 Paper 1 Section 2。 ");
}

// Second revision: the textbook writing task has three explicit requirements.
// These top-layer slides replace the earlier generic directed-writing sequence.
presentation.resolve("sh/65gnqlk7").text.replace("指导写作：双文本整合", "指导写作：原因、内容与意义");
presentation.resolve("sh/t87ml0ji").text.replace("用编号找证据，用段落完成论证。", "围绕三个写作要求整理两则短文。");

// Slide 16: exact task
{
  const s = presentation.resolve("sl/gny5sjyp");
  base(s, "写作任务：原因、内容、意义", "整篇文章只回答这三个方面，段落按题目要求组织。 ");
  rect(s, 92, 198, 1096, 78, C.beige);
  text(s, "根据短文一和短文二，介绍新加坡多种族模式政策。", 120, 220, 1040, 34, { size: 24, bold: true, align: "center" });
  const tasks = [
    ["第一方面", "说明实施这项政策的原因", "为什么需要这项政策"],
    ["第二方面", "介绍这项政策的主要内容", "政府和社会怎样做"],
    ["第三方面", "评价这项政策的意义", "它带来什么结果与影响"],
  ];
  tasks.forEach(([head, task, cue], i) => {
    const x = 92 + i * 367;
    rect(s, x, 338, 334, 180, i === 2 ? C.mossPale : C.clayPale);
    label(s, head, x + 28, 363, 170, i === 2 ? C.moss : C.clay);
    text(s, task, x + 28, 411, 275, 54, { size: 23, bold: true });
    text(s, cue, x + 28, 474, 275, 25, { size: 17, color: C.muted });
  });
  text(s, "先分清三个问题，再在原文中编号。", 92, 580, 880, 30, { size: 19, color: C.moss, bold: true });
  note(s, "以用户确认的最终写作要求为准：1. 说明政策的原因；2. 介绍政策内容；3. 评价政策意义。课堂起点是把这三个问题说清楚，避免自行增加第四项讨论任务。\n材料依据：用户提供的教材页面截图。 ");
}

// Slide 17: use the user's numbering convention
{
  const s = presentation.resolve("sl/14bup87q");
  base(s, "证据编号：1.1、2.1、3.1", "第一个数字对应写作方面；小数点后的数字记录同一方面下的证据。 ");
  const rows = [
    ["1.1", "回答第一方面：为什么需要政策", "原因"],
    ["2.1", "回答第二方面：政策具体怎样做", "内容"],
    ["3.1", "回答第三方面：政策带来什么影响", "意义"],
  ];
  rows.forEach(([n, work, category], i) => {
    const y = 208 + i * 94;
    rect(s, 110, y, 138, 58, i === 2 ? C.mossPale : C.clayPale);
    text(s, n, 110, y + 10, 138, 36, { size: 28, bold: true, color: i === 2 ? C.moss : C.clay, align: "center" });
    text(s, work, 286, y + 13, 585, 35, { size: 23, bold: true });
    text(s, category, 945, y + 15, 160, 30, { size: 20, color: C.muted, align: "right" });
  });
  rect(s, 92, 522, 1096, 2, C.line);
  text(s, "例：在短文二看到“学校安排跨族群课外活动”，先问它是政策内容还是政策意义，\n再分别标为 2.4 或 3.2。", 92, 553, 1030, 55, { size: 19, color: C.ink });
  note(s, "沿用学生已掌握的 1.1、1.2、1.3 编号法，不改用新的来源代码。学生在两篇材料中都以同一套编号标注，先判断信息属于原因、内容还是意义。\n材料依据：用户提供的教材页面截图。 ");
}

// Slide 18: reasons
{
  const s = presentation.resolve("sl/y5wne50z");
  base(s, "第一方面：为什么需要多种族模式政策", "原因要回答社会面对的需要，不是罗列政策本身。 ");
  const items = [
    ["1.1", "不同族群在语言、文化和宗教方面保有各自特点", "需要维护多元社会中的平等与尊重"],
    ["1.2", "不同种族的学生需要互动和交流的机会", "需要避免群体之间缺少接触"],
    ["1.3", "新移民需要融入新加坡社会", "需要帮助新成员建立归属感"],
  ];
  items.forEach(([n, evidence, reason], i) => {
    const y = 212 + i * 110;
    rect(s, 92, y, 142, 70, C.clayPale);
    text(s, n, 92, y + 16, 142, 38, { size: 28, bold: true, color: C.clay, align: "center" });
    text(s, evidence, 282, y + 5, 465, 58, { size: 20, bold: true });
    rect(s, 785, y + 5, 2, 58, C.line);
    text(s, reason, 830, y + 10, 300, 50, { size: 19, color: C.moss, bold: true });
  });
  text(s, "写作时把“材料事实”解释成“政策为什么有必要”。", 92, 584, 1000, 30, { size: 19, color: C.muted });
  note(s, "原因段建议使用 1.1 至 1.3 中两项或三项信息。教师示范：先说多元社会的现实，再说明政策需要回应的平等、接触和融入需要。\n材料依据：用户提供的教材页面截图。 ");
}

// Slide 19: policy content
{
  const s = presentation.resolve("sl/nid43ytk");
  base(s, "第二方面：政策包括哪些安排", "介绍内容时按类别归纳，不把每一个例子平铺直叙。 ");
  const items = [
    ["2.1", "身份与语言", "CMIO 模式、双语教育与母语学习"],
    ["2.2", "居住与接触", "种族配额制、公共场所提供交往机会"],
    ["2.3", "融入支持", "融入与归化倡导员协助新移民参与社区"],
    ["2.4", "共同参与", "跨族群课外活动、公共假日、文化节日与国民服役"],
  ];
  rect(s, 92, 198, 1096, 54, C.ink);
  text(s, "编号", 122, 211, 130, 28, { size: 18, bold: true, color: C.bg });
  text(s, "政策类别", 310, 211, 240, 28, { size: 18, bold: true, color: C.bg });
  text(s, "材料中的具体安排", 650, 211, 420, 28, { size: 18, bold: true, color: C.bg });
  items.forEach(([n, category, detail], i) => {
    const y = 252 + i * 76;
    rect(s, 92, y, 1096, 76, i % 2 === 0 ? C.beige : C.bg);
    text(s, n, 122, y + 20, 130, 30, { size: 21, bold: true, color: C.clay });
    text(s, category, 310, y + 19, 240, 32, { size: 21, bold: true });
    text(s, detail, 650, y + 16, 430, 42, { size: 20 });
  });
  text(s, "“课外活动”在这里是 2.4 的一个政策内容，不单独成为第四个写作方向。", 92, 588, 1080, 30, { size: 18, color: C.moss, bold: true });
  note(s, "内容段按四类归纳。学生可选择最能代表不同层面的安排，不必为了凑字数逐句罗列。课外活动、假日和国民服役均属于政策内容的例子。\n材料依据：用户提供的教材页面截图。 ");
}

// Slide 20: significance
{
  const s = presentation.resolve("sl/zyxsni5k");
  base(s, "第三方面：怎样评价政策的意义", "评价要写出政策产生的影响，并用材料说明影响怎样出现。 ");
  const items = [
    ["3.1", "不同族群获得平等地位，同时保留语言、文化和宗教特点", "维护多元社会"],
    ["3.2", "居住、学校和社区中的接触机会增加", "促进族群交流与融合"],
    ["3.3", "共同学习、庆祝节日和参与国民服役", "形成新加坡人的共同认同"],
    ["3.4", "人们学习相互理解与尊重，认识社会的多元性", "增强社会凝聚力"],
    ["3.5", "新移民参与社区并融入社会", "扩大归属感"],
  ];
  items.forEach(([n, evidence, value], i) => {
    const y = 195 + i * 65;
    rect(s, 92, y, 126, 52, i === 4 ? C.mossPale : C.clayPale);
    text(s, n, 92, y + 10, 126, 30, { size: 22, bold: true, color: i === 4 ? C.moss : C.clay, align: "center" });
    text(s, evidence, 265, y + 8, 620, 35, { size: 19 });
    text(s, value, 932, y + 10, 215, 30, { size: 19, color: C.moss, bold: true });
  });
  text(s, "评价句：这项安排的意义在于……，因为它让……", 92, 564, 990, 30, { size: 20, color: C.ink, bold: true });
  note(s, "意义段要避免重复“政策有什么”。学生应把安排转化为结果：平等、接触、理解、共同认同和融入。可先圈 3.1 至 3.5，再选取其中三项展开。\n材料依据：用户提供的教材页面截图。 ");
}

// Slide 21: keep the extracurricular activity in its proper supporting role.
{
  const s = presentation.resolve("sl/m1wvqtk3");
  base(s, "课外活动在文章中的位置", "同一例子可以同时帮助介绍内容和评价意义，但它不构成第四个写作要求。 ");
  rect(s, 92, 205, 476, 218, C.clayPale);
  label(s, "作为政策内容", 125, 234, 200, C.clay);
  text(s, "2.4  学校安排跨族群课外活动，\n让不同种族的学生一起参与。", 125, 289, 365, 74, { size: 23, bold: true });
  rect(s, 712, 205, 476, 218, C.mossPale);
  label(s, "作为政策意义", 745, 234, 200, C.moss);
  text(s, "3.2／3.3  共同活动提供交流机会，\n帮助学生建立理解与共同认同。", 745, 289, 365, 74, { size: 23, bold: true });
  rect(s, 92, 480, 1096, 2, C.line);
  text(s, "课堂上可以用它帮助理解“为什么需要接触机会”，但不必另行讨论各族群的优势、挑战和诉求。\n所有讨论最后都回到 1、2、3 三个写作要求。", 92, 522, 1040, 64, { size: 20, color: C.ink });
  note(s, "本页回应课堂活动的取舍。若教师要让学生谈不同群体的经验，只宜作为 3 分钟导入，用来理解“接触机会”和“融入”的必要性；不把活动发展为独立的社会议题讨论。 ");
}

// Slide 22: planning and checking
{
  const s = presentation.resolve("sl/5onypobq");
  base(s, "写前计划与交稿检查", "一段处理一个方面，让读者清楚看见“原因、内容、意义”。 ");
  const parts = [
    ["开头", "约30字\n点出多种族社会"],
    ["第一段", "原因\n选 1.1、1.2"],
    ["第二段", "内容\n按 2.1–2.4 分类"],
    ["第三段", "意义\n用 3.1–3.5 评价"],
    ["结尾", "约30字\n回扣政策价值"],
  ];
  parts.forEach(([head, body], i) => {
    const x = 78 + i * 218;
    const fill = i === 3 ? C.mossPale : (i === 1 || i === 2 ? C.clayPale : C.beige);
    rect(s, x, 205, 184, 138, fill);
    text(s, head, x + 14, 225, 156, 32, { size: 23, bold: true, color: i === 3 ? C.moss : C.ink, align: "center" });
    text(s, body, x + 14, 273, 156, 54, { size: 17, color: C.muted, align: "center" });
  });
  rect(s, 92, 410, 1096, 164, C.beige);
  label(s, "三项检查", 122, 434, 150, C.clay);
  text(s, "□ 第一段解释的是“为什么”，没有提前罗列措施\n□ 第二段按类别介绍政策内容，不写成材料流水账\n□ 第三段写出政策带来的影响，并回到材料说明", 122, 478, 870, 85, { size: 20 });
  text(s, "再检查：两篇短文都用到吗？是否用自己的话？字数、字词与标点准确吗？", 92, 616, 1080, 30, { size: 18, color: C.muted });
  note(s, "限时写作前，学生用本页计划三个主体段。批改时先检查三项任务是否完成，再看材料选择、改写和表达。字数与评分可沿用课程既有要求。 ");
}

// Align the portfolio language on slide 31 with the corrected three-part task.
presentation.resolve("sh/0jut43yp").text.replace("回应概括性写作", "指导写作");
presentation.resolve("sh/fmhszex0").text.replace("我怎样让两则材料真正发生关系？", "我怎样用③段整合两则材料？");
presentation.resolve("sh/fmhszex0").text.replace("我怎样用③段整合两则材料？", "我怎样分清原因、内容和意义？");
const teacherSequence = presentation.resolve("sh/8vq1wzyd");
teacherSequence.text.replace("回应概括性写作：新加坡多种族政策", "指导写作：新加坡多种族政策");
teacherSequence.text.style = { typeface: FONT, fontSize: 24, color: C.ink, autoFit: "shrinkText" };

const { finalizePresentation } = await import(pathToFileURL(
  path.join(SKILL_DIR, "container_tools/artifact_tool_utils.mjs"),
).href);
const candidatePath = path.join(stagingDir, "candidate-directed-writing-update.pptx");
await (await PresentationFile.exportPptx(presentation)).save(candidatePath);

const requirements = {
  sourceTemplatePath: sourcePath,
  requiredTemplateReferenceSlides: [1, 2, 15, 16, 17, 18, 19, 20, 21, 22, 31, 32],
  minimumTemplateCoverageRatio: 0.75,
  requiredNativeTableOwnerSlides: [],
};
const fontPolicy = {
  basis: "reference",
  families: [FONT],
  referencePath: sourcePath,
  referenceSha256: "a3693c1dd90acbda5ac6ea054aafb16ac239a527b934188f240c362f831fbbab",
};
const result = await finalizePresentation({
  ...requirements,
  workspaceDir,
  candidatePath,
  finalPath: FINAL_PPTX,
  pythonExecutable: RUNTIME_PYTHON,
  integrityValidatorPath: path.join(SKILL_DIR, "container_tools/inspect_presentation_package_integrity.py"),
  layoutValidatorPath: path.join(SKILL_DIR, "container_tools/inspect_presentation_layout_geometry.py"),
  layoutArgs: ["--expected-slide-size-emu", "12192000,6858000", "--validate-bullet-geometry", "--validate-heading-fit"],
  fontPolicy,
  verifyArtifactToolImport: true,
  receiptPath: path.join(stagingDir, "directed-writing-second-revision.validation.json"),
});
console.log(JSON.stringify({ finalPath: FINAL_PPTX, result }, null, 2));
