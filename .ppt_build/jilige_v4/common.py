import sys
import os
sys.path.insert(0, os.path.join(os.path.dirname(os.path.abspath(__file__)), '..', '..', '.claude', 'skills', '0509-slides', 'scripts'))
import kit
kit.set_theme('ji')
from kit import *
import pages

pages.set_lessons([('约', '言语与选择'), ('界', '界限与对抗'), ('压', '人物与冲突'), ('笔', '文学表达'), ('评', '谁在评价'), ('论', '辨字与立论')])
CH = ['约', '界', '压', '笔', '评', '论']

ORIG = {
    1: '李歌者，霸州人。其母一枝梅，倡也。年十四，母教之歌舞。李艴然曰：“人皆有配偶，我可独为倡耶？”母告以衣食所仰，不得已。与母约曰：“媪能宽我，不脂泽，不荤肉，则可尔；否则有死而已！”母惧，阳从之。',
    2: '自是缟衣素裳，唯拂掠翠鬟，然姿容如玉雪，望之宛若仙人，愈致其妍。人有招之者，李必询筵中无恶少年乃行。未行，复遣人觇之。人亦熟李行，不敢以亵语加焉。李至，歌道家游仙辞数阕，俨容默坐。或有狎之者，辄拂袖径出，弗少留；他日或再招，必拒不往。',
    3: '益津县令年颇少，以白金遗其母。欲私之。李持刀入户，以巨木撑柱，骂曰：“吾闻县令为风化首，汝纵不能而忍坏之耶？今冠裳其形而狗彘其行，乃真贼尔！岂官人耶？汝即来，汝即来，吾先杀汝而后自杀尔！”令惊走。',
    4: '时监州闻其贤，有子方读书，举秀才，聘为之妇，李尚处子也。居数年，天下大乱，夫妇逃难，俱为贼所执。贼悦李有殊色，欲杀其夫而妻之。李抱其夫，诟曰：“汝欲杀吾夫，即先杀我，我宁死，决不从汝作贼也！”贼怒，并杀之。吁！倡犹能有是哉！可慨也。',
}


def seal(s, n, ch):
    """记李歌封面右侧母题：朱红竖线（界限）＋方印。"""
    rect(s, 9.0, 0.0, 0.05, 6.1, fill=CORAL)
    sq = rrect(s, 9.9, 2.3, 2.3, 2.3, fill=CORAL, r=0.06)
    label(sq, [(ch, 96, WHITE, True, DISPLAY)])
    T(s, 9.9, 4.8, 2.3, 0.5, f'第 {n} 课', 18, MUTED, True, align=C)


def lcover(n, title, q, sub, notes_t):
    return pages.cover(n, CH[n - 1], title, q, sub, notes_t, tag='第一单元 · 文言传记　宋濂《记李歌》', motif=seal)


def task_card(s, x, y, w, h, n_, head_, body_, col, bsize=14):
    card(s, x, y, w, h)
    num(s, x + 0.2, y + 0.18, 0.55, n_, col, 18)
    text(s, x + 0.95, y + 0.08, w - 1.1, h - 0.16, [(head_, 16, TEXT_D, True, DISPLAY), (body_, bsize, GREY)], anchor=MID, spacing=1.3)


def orig_box(s, x, y, w, h, t, size=17, fill=None, color=None):
    rrect(s, x, y, w, h, fill=fill or INK, r=0.04)
    text(s, x + 0.25, y + 0.15, w - 0.5, h - 0.3, [(t, size, color or WHITE, False, DISPLAY)], spacing=1.55, anchor=MID)


def qpage(n, tag, mins, lines, opts, foot, notes_t, theme='teal', cur='议'):
    """问题页：lines = [[(文字,色)],...]；opts = [(字母,文字,色)]；cur=None 表示开场页"""
    s = new('teal' if theme == 'teal' else 'ink')
    T(s, 0.7, 0.42, 6, 0.3, tag, 12, AMBER, True)
    tracker(s, cur, mins, dark=True)
    paras = [[(t, 38, c, True, DISPLAY) for (t, c) in ln] for ln in lines]
    text(s, 0.7, 1.1, 11.8, 2.4, paras, spacing=1.35)
    k = len(opts)
    wd = (11.95 - 0.2 * (k - 1)) / k
    for i, (Lt, t, col) in enumerate(opts):
        x = 0.7 + i * (wd + 0.2)
        rrect(s, x, 3.75, wd, 1.75, fill=INK, alpha=55, line=col, lw=2, r=0.1)
        T(s, x + 0.2, 3.85, 0.9, 1.5, Lt, 54, col, True, DISPLAY, anchor=MID)
        T(s, x + 1.05, 3.85, wd - 1.2, 1.5, t, 17, WHITE, True, DISPLAY, anchor=MID, spacing=1.25)
    T(s, 0.7, 5.75, 12, 0.5, foot, 15, TEAL_L, True)
    notes(s, notes_t)
    return s
