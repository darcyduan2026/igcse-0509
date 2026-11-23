from kit import *

LESSONS = [('声', '华语的声音'), ('根', '抽象人'), ('痛', '语言之痛'), ('我', '我的情结')]


def dots(s, cur, y=6.45):
    for i, (ch, nm) in enumerate(LESSONS):
        on = i == cur
        d = oval(s, 0.85 + i * 1.75, y, 0.46, 0.46, fill=AMBER if on else None, line=AMBER if on else '5E767C')
        label(d, [(ch, 15, INK if on else MUTED, True, DISPLAY)])
        T(s, 0.85 + i * 1.75 + 0.55, y + 0.07, 1.2, 0.3, nm, 11, WHITE if on else MUTED, on)


def rings(s, cx, cy, radii=(2.55, 2.05, 1.58, 1.14, 0.74)):
    for i, r in enumerate(radii):
        oval(s, cx - r, cy - r, 2 * r, 2 * r, fill=None, line=AMBER if i in (0, 4) else '6A8F96', lw=1.5 if i == 4 else 1.0)


# ------------------------------------------------------------------ unit
def unit_cover():
    s = new('ink')
    T(s, 5.6, -0.9, 8.4, 8.4, '', 10)
    text(s, 6.4, -0.8, 8, 8.4, [('情', 440, TEAL, True, DISPLAY, 18)], align=C)
    rings(s, 10.35, 3.55)
    c = oval(s, 10.35 - 0.74, 3.55 - 0.74, 1.48, 1.48, fill=AMBER)
    label(c, [('我', 44, INK, True, DISPLAY)])
    T(s, 0.8, 0.8, 6, 0.4, '第一单元 · 现代散文', 16, AMBER, True)
    T(s, 0.8, 1.6, 8, 1.6, '华语情结', 88, WHITE, True, DISPLAY)
    waves(s, 0.85, 3.45, n=22, color=AMBER, maxh=0.8)
    T(s, 0.8, 4.55, 7.4, 0.6, '语言，是怎样连着一个人的根？', 30, WHITE, False, DISPLAY)
    T(s, 0.8, 5.3, 8, 0.4, '余秋雨 · 四课时阅读与思辨 · IGCSE 0509 中文第一语言', 14, TEAL_L)
    dots(s, -1)
    T(s, 9.7, 6.95, 3, 0.3, '课件 v4.0', 11, MUTED, align=R)
    notes(s, '单元封面。教材课文5《文学作品——散文》，余秋雨《华语情结》（P38–49），共四课时，每课45分钟。\n本单元每课只有三个大环节：读 → 议 → 写；前有 4′ 开场，后有 4′ 出口。\n四个字：声（读通）、根（读深）、痛（读评）、我（立论）。')
    return s


def unit_overview():
    s = new('paper')
    T(s, 0.7, 0.42, 7, 0.3, '单元总览（教师用）', 12, AMBER_D, True)
    T(s, 0.7, 0.78, 9, 0.9, '每课三个大环节：读 → 议 → 写', 32, TEXT_D, True, DISPLAY)
    cols = [('声', '华语的声音', TEAL, '读　默读全文，猜八个词', '议　立场讨论：凭一句话，能断定一个人的态度吗？', '写　四个场景各一句概括'),
            ('根', '抽象人', AMBER_D, '读　找“抽象人”的三处证据', '议　定格表演：四个材料各让我们“看见”什么？', '写　一段“观点—原文—手法—效果”'),
            ('痛', '语言之痛', CORAL, '读　品味三句话', '议　四角站位：父母划去华语课，可以理解吗？', '写　一段“情结”判断'),
            ('我', '我的情结', BROWN, '读　与《记李歌》对读', '议　角色热座：我是文中的人', '写　博客开头与主体')]
    for i, (ch, nm, col, a, b, c) in enumerate(cols):
        x = 0.7 + i * 3.02
        card(s, x, 1.85, 2.88, 4.4)
        top = rrect(s, x, 1.85, 2.88, 1.05, fill=col, r=0.1)
        text(s, x + 0.2, 1.88, 0.9, 1.0, [(ch, 46, WHITE, True, DISPLAY)], anchor=MID)
        text(s, x + 1.1, 1.88, 1.7, 1.0, [(f'第 {i + 1} 课', 11, WHITE), (nm, 17, WHITE, True, DISPLAY)], anchor=MID, spacing=1.2)
        for j, t in enumerate((a, b, c)):
            yy = 3.1 + j * 1.05
            tag = t[0]
            o = oval(s, x + 0.2, yy + 0.05, 0.42, 0.42, fill=[TEAL, AMBER_D, CORAL][j]); label(o, [(tag, 13, WHITE, True, DISPLAY)])
            T(s, x + 0.75, yy, 2.0, 0.95, t[2:], 12.5, TEXT_D, spacing=1.3)
    timeline(s, [('开场', 4), ('读', 12), ('议', 15), ('写', 10), ('出口', 4)], y=6.5)
    notes(s, '单元总览（教师用）。\n一、结构：每课 45′ = 开场 4′ ＋ 读 12′ ＋ 议 15′ ＋ 写 10′ ＋ 出口 4′。\n二、三条固定规则（整单元不变）：先写后说；依据规则（每个观点必须指出课文里的一个词或事例）；四人组固定（记录/发言/质疑/计时，每课轮换）。\n三、出口检测只有 2 题（迁移＋说理）；原来的“提取题”改到下节课开场再问（间隔提取）。\n四、教材对应：见教师参考页（隐藏）。')
    return s


# ------------------------------------------------------------------ lesson cover
def cover(n, ch, title, q, sub, notes_t):
    s = new('ink')
    text(s, 6.6, -0.6, 7.6, 7.6, [(ch, 420, TEAL, True, DISPLAY, 22)], align=C)
    rings(s, 10.35, 3.55)
    c = oval(s, 10.35 - 0.74, 3.55 - 0.74, 1.48, 1.48, fill=AMBER)
    label(c, [(f'0{n}', 44, INK, True, DISPLAY)])
    T(s, 0.8, 0.8, 7, 0.4, '第一单元 · 现代散文　余秋雨《华语情结》', 14, AMBER, True)
    T(s, 0.8, 1.55, 5, 0.5, f'第 {n} 课', 20, TEAL_L, True)
    T(s, 0.8, 2.05, 8.5, 1.6, title, 80, WHITE, True, DISPLAY)
    waves(s, 0.85, 3.85, n=22, color=AMBER, maxh=0.8)
    text(s, 0.8, 4.95, 7.6, 1.5, [(q, 28, WHITE, False, DISPLAY), (sub, 16, TEAL_L)], spacing=1.4)
    dots(s, n - 1)
    notes(s, notes_t)
    return s


# ------------------------------------------------------------------ retrieval opening
def retrieval(n, qs, notes_t):
    s = new('paper')
    chrome(s, f'第 {n} 课　开场', '先不翻书：把上节课找回来', cur=None, mins=4)
    ans = []
    for i, (q, a) in enumerate(qs):
        y = 1.75 + i * 1.5
        card(s, 0.7, y, 11.95, 1.35)
        num(s, 0.95, y + 0.3, 0.72, i + 1, TEAL if i < 2 else CORAL, 24)
        tag = '机动题' if i == 2 else '提取'
        T(s, 1.95, y + 0.14, 5.9, 0.3, tag, 11, AMBER_D, True)
        T(s, 1.95, y + 0.42, 5.9, 0.9, q, 15, TEXT_D, spacing=1.25)
        a_box = rrect(s, 8.1, y + 0.15, 4.35, 1.05, fill=TEAL, r=0.1)
        text(None, 0, 0, 0, 0, [(a, 12.5, WHITE)], shp=a_box, anchor=MID, margin=0.18, spacing=1.25)
        ans.append(a_box)
    reveal(s, [ans])
    timeline(s, [('白板作答', 3), ('核对', 1)], y=6.5)
    notes(s, notes_t)
    return s


# ------------------------------------------------------------------ exit
def exit_slide(n, qs, notes_t, title='两道题，三分钟'):
    s = new('paper')
    chrome(s, f'第 {n} 课　出口', title, cur='写', mins=4)
    for i, (tag, q) in enumerate(qs):
        y = 1.85 + i * 2.05
        card(s, 0.7, y, 11.95, 1.8)
        num(s, 0.95, y + 0.45, 0.9, i + 1, TEAL if i == 0 else CORAL, 34)
        T(s, 2.15, y + 0.22, 1.6, 0.4, tag, 13, AMBER_D, True)
        T(s, 2.15, y + 0.58, 10.2, 1.2, q, 18, TEXT_D, spacing=1.35)
    for i in range(4):
        rrect(s, 0.7 + i * 0.78, 6.45, 0.7, 0.34, fill=AMBER if i < 3 else TEAL, r=0.3)
    T(s, 3.95, 6.43, 6, 0.4, '作答 3′　＋　对照要点 1′', 13, TEXT_D, True, anchor=MID)
    notes(s, notes_t)
    return s


def exit_key(n, answers, recycle, homework, teaser, notes_t):
    s = new('paper')
    chrome(s, f'第 {n} 课　出口 · 要点', '对照要点，订正自己的答案')
    for i, (tag, a) in enumerate(answers):
        y = 1.8 + i * 1.3
        card(s, 0.7, y, 7.3, 1.18)
        num(s, 0.9, y + 0.25, 0.68, i + 1, TEAL if i == 0 else CORAL, 22)
        text(s, 1.8, y + 0.1, 6.0, 1.0, [(tag, 11, AMBER_D, True), (a, 13, TEXT_D)], anchor=MID, spacing=1.3)
    y2 = 1.8 + len(answers) * 1.3
    box = rrect(s, 0.7, y2, 7.3, 6.15 - y2, fill=PAPER2, r=0.08)
    text(s, 0.95, y2 + 0.1, 6.8, 6.15 - y2 - 0.2, [('订正方法', 11, AMBER_D, True), ('用另一种颜色笔订正，保留原答案；错的题旁写“我错在哪一步”。', 12.5, TEXT_D)], anchor=MID, spacing=1.3)
    # homework card
    hc = rrect(s, 8.3, 1.8, 4.35, 2.75, fill=INK, r=0.06)
    text(s, 8.55, 1.95, 3.9, 2.2, [('课后', 13, AMBER, True), (homework, 14.5 if len(homework) < 90 else 12, WHITE)], spacing=1.4 if len(homework) < 90 else 1.3)
    rc = rrect(s, 8.3, 4.7, 4.35, 1.45, fill=None, line=GREY, dash=True, r=0.1)
    text(s, 8.5, 4.72, 3.95, 1.4, [('回收规则（教师）', 11, AMBER_D, True), (recycle, 10.5 if len(recycle) > 80 else 11.5, GREY)], anchor=MID, spacing=1.3)
    if teaser:
        b = rrect(s, 0.7, 6.4, 11.95, 0.5, fill=TEAL, r=0.3)
        label(b, [(teaser, 13, WHITE, True)])
    notes(s, notes_t)
    return s
