"""Reusable page archetypes for 0509 lesson decks (v4.0 structure: 开场 / 读 / 议 / 写 / 出口).

Call set_lessons([...]) once per unit, then use the builders. Every builder takes the
speaker-notes text as an argument — notes are mandatory (spec v3.0 §5).
"""
from kit import *

LESSONS = []          # [(单字, 课名), ...] shown as dots on covers


def set_lessons(items):
    global LESSONS
    LESSONS = list(items)


def dots(s, cur, y=6.45):
    for i, (ch, nm) in enumerate(LESSONS):
        on = i == cur
        step = min(1.75, 8.3 / max(1, len(LESSONS) - 1) if len(LESSONS) > 5 else 1.75)
        d = oval(s, 0.85 + i * step, y, 0.46, 0.46, fill=AMBER if on else None, line=AMBER if on else '5E767C')
        label(d, [(ch, 15, INK if on else MUTED, True, DISPLAY)])
        T(s, 0.85 + i * step + 0.52, y + 0.07, 1.1, 0.3, nm, 11, WHITE if on else MUTED, on)


def rings(s, cx, cy, radii=(2.55, 2.05, 1.58, 1.14, 0.74)):
    """Concentric-ring motif. Replace/modify when the text suggests a different motif."""
    for i, r in enumerate(radii):
        oval(s, cx - r, cy - r, 2 * r, 2 * r, fill=None, line=AMBER if i in (0, 4) else '6A8F96', lw=1.5 if i == 4 else 1.0)


def unit_cover(big_char, title, subtitle, credit, tag, notes_t):
    s = new('ink')
    text(s, 6.4, -0.8, 8, 8.4, [(big_char, 440, TEAL, True, DISPLAY, 18)], align=C)
    rings(s, 10.35, 3.55)
    c = oval(s, 10.35 - 0.74, 3.55 - 0.74, 1.48, 1.48, fill=AMBER); label(c, [(LESSONS[-1][0] if LESSONS else '', 44, INK, True, DISPLAY)])
    T(s, 0.8, 0.8, 6, 0.4, tag, 16, AMBER, True)
    T(s, 0.8, 1.6, 8, 1.6, title, 88, WHITE, True, DISPLAY)
    waves(s, 0.85, 3.45, n=22, color=AMBER, maxh=0.8)
    T(s, 0.8, 4.55, 7.4, 0.6, subtitle, 30, WHITE, False, DISPLAY)
    T(s, 0.8, 5.3, 8, 0.4, credit, 14, TEAL_L)
    dots(s, -1)
    notes(s, notes_t)
    return s


def unit_overview(columns, notes_t, steps=(('开场', 4), ('读', 12), ('议', 15), ('写', 10), ('出口', 4))):
    """columns: [(单字, 课名, 色, 读文字, 议文字, 写文字), ...]"""
    s = new('paper')
    T(s, 0.7, 0.42, 7, 0.3, '单元总览（教师用）', 12, AMBER_D, True)
    T(s, 0.7, 0.78, 9, 0.9, '每课三个大环节：读 → 议 → 写', 32, TEXT_D, True, DISPLAY)
    for i, (ch, nm, col, a, b, c) in enumerate(columns):
        x = 0.7 + i * 3.02
        card(s, x, 1.85, 2.88, 4.4)
        rrect(s, x, 1.85, 2.88, 1.05, fill=col, r=0.1)
        text(s, x + 0.2, 1.88, 0.9, 1.0, [(ch, 46, WHITE, True, DISPLAY)], anchor=MID)
        text(s, x + 1.1, 1.88, 1.7, 1.0, [(f'第 {i + 1} 课', 11, WHITE), (nm, 17, WHITE, True, DISPLAY)], anchor=MID, spacing=1.2)
        for j, t in enumerate((a, b, c)):
            yy = 3.1 + j * 1.05
            o = oval(s, x + 0.2, yy + 0.05, 0.42, 0.42, fill=[TEAL, AMBER_D, CORAL][j]); label(o, [(t[0], 13, WHITE, True, DISPLAY)])
            T(s, x + 0.75, yy, 2.0, 0.95, t[2:], 12.5, TEXT_D, spacing=1.3)
    assert sum(m for _, m in steps) == 45, 'lesson must total 45 minutes'
    timeline(s, list(steps), y=6.5)
    notes(s, notes_t)
    return s


def cover(n, ch, title, q, sub, notes_t, tag='', motif=None):
    """motif: None = concentric rings; or a callable(slide, n, ch) that draws the right-hand motif."""
    s = new('ink')
    text(s, 6.6, -0.6, 7.6, 7.6, [(ch, 420, TEAL, True, DISPLAY, 22)], align=C)
    if motif:
        motif(s, n, ch)
    else:
        rings(s, 10.35, 3.55)
        c = oval(s, 10.35 - 0.74, 3.55 - 0.74, 1.48, 1.48, fill=AMBER); label(c, [(f'0{n}', 44, INK, True, DISPLAY)])
    T(s, 0.8, 0.8, 7, 0.4, tag, 14, AMBER, True)
    T(s, 0.8, 1.55, 5, 0.5, f'第 {n} 课', 20, TEAL_L, True)
    T(s, 0.8, 2.05, 8.5, 1.6, title, 80, WHITE, True, DISPLAY)
    waves(s, 0.85, 3.85, n=22, color=AMBER, maxh=0.8)
    text(s, 0.8, 4.95, 7.6, 1.5, [(q, 28, WHITE, False, DISPLAY), (sub, 16, TEAL_L)], spacing=1.4)
    dots(s, n - 1)
    notes(s, notes_t)
    return s


def retrieval(n, qs, notes_t):
    """开场提取页：3 题（题3 = 机动题，来自上一课出口错题），答案点击出现。qs=[(题, 答案)]*3"""
    s = new('paper')
    chrome(s, f'第 {n} 课　开场', '先不翻书：把上节课找回来', cur=None, mins=4)
    ans = []
    for i, (q, a) in enumerate(qs):
        y = 1.75 + i * 1.5
        card(s, 0.7, y, 11.95, 1.35)
        num(s, 0.95, y + 0.3, 0.72, i + 1, TEAL if i < 2 else CORAL, 24)
        T(s, 1.95, y + 0.14, 5.9, 0.3, '机动题' if i == 2 else '提取', 11, AMBER_D, True)
        T(s, 1.95, y + 0.42, 5.8, 0.9, q, 15, TEXT_D, spacing=1.25)
        box = rrect(s, 7.9, y + 0.1, 4.6, 1.15, fill=TEAL, r=0.1)
        text(None, 0, 0, 0, 0, [(a, 14, WHITE)], shp=box, anchor=MID, margin=0.16, spacing=1.2)
        ans.append(box)
    reveal(s, [ans])
    timeline(s, [('白板作答', 3), ('核对', 1)], y=6.5)
    notes(s, notes_t)
    return s


def exit_slide(n, qs, notes_t, title='两道题，三分钟'):
    """出口页：2 题（迁移＋说理）。qs=[(标签, 题)]*2"""
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
    """要点页：答案要点＋课后作业＋下一课预告条。recycle（回收规则）是教师信息，只写进备注，不显示在学生页。"""
    s = new('paper')
    chrome(s, f'第 {n} 课　出口 · 要点', '对照要点，订正自己的答案')
    k = len(answers)
    ch = 1.45 if k <= 2 else 1.1
    for i, (tag, a) in enumerate(answers):
        y = 1.75 + i * (ch + 0.12)
        card(s, 0.7, y, 7.3, ch)
        num(s, 0.9, y + ch / 2 - 0.34, 0.68, i + 1, TEAL if i == 0 else CORAL, 22)
        text(s, 1.8, y + 0.06, 6.05, ch - 0.12, [(tag, 13, AMBER_D, True), (a, 14, TEXT_D)], anchor=MID, spacing=1.25)
    y2 = 1.75 + k * (ch + 0.12)
    rrect(s, 0.7, y2, 7.3, 6.15 - y2, fill=PAPER2, r=0.08)
    text(s, 0.95, y2 + 0.05, 6.8, 6.15 - y2 - 0.1, [('订正方法', 13, AMBER_D, True), ('用另一种颜色笔订正，保留原答案；错的题旁写“我错在哪一步”。', 14, TEXT_D)], anchor=MID, spacing=1.3)
    rrect(s, 8.3, 1.75, 4.35, 4.4, fill=INK, r=0.05)
    text(s, 8.55, 1.9, 3.9, 4.1, [('课后', 14, AMBER, True), (homework, 14.5 if len(homework) < 110 else 14, WHITE)], spacing=1.4)
    if teaser:
        b_ = rrect(s, 0.7, 6.4, 11.95, 0.5, fill=TEAL, r=0.3)
        label(b_, [(teaser, 14, WHITE, True)])
    notes(s, (notes_t + chr(10) + '回收规则：' + recycle) if recycle else notes_t)
    return s


def appendix_text(pages, title, notes_t):
    """pages: list of paragraph lists (<= ~650 chars per page). 原文页：纸色底。"""
    for i, pg in enumerate(pages):
        s = new('paper')
        T(s, 0.7, 0.42, 7, 0.3, f'附录　全文（第 {i + 1} 页，共 {len(pages)} 页）', 12, AMBER_D, True)
        T(s, 0.7, 0.75, 9, 0.6, title, 20, TEXT_D, True, DISPLAY)
        n = sum(len(p) for p in pg)
        size = 18 if n < 480 else (16.5 if n < 620 else 15.5)
        text(s, 0.9, 1.6, 11.5, 5.3, [[('　　' + p, size, TEXT_D, False, DISPLAY)] for p in pg], spacing=1.38)
        notes(s, notes_t)


def hide(slide):
    """教师参考页：放映时自动跳过。"""
    slide._element.set('show', '0')
