import sys, math
from pptx import Presentation
from pptx.util import Inches, Pt, Emu
from pptx.dml.color import RGBColor
from pptx.enum.shapes import MSO_SHAPE
from pptx.enum.text import PP_ALIGN, MSO_ANCHOR
from pptx.enum.dml import MSO_LINE
from pptx.oxml.ns import qn
from lxml import etree

INK = '0F1B20'; INK2 = '17323B'; TEAL = '1F7A86'; TEAL_L = 'A9D8DC'; AMBER = 'E9B04A'; AMBER_D = 'B9802A'
CORAL = 'D9674F'; PAPER = 'F7F0E3'; PAPER2 = 'EDE2CC'; BROWN = '6B4A32'; TEXT_D = '1F2A2E'; GREY = '7B8A8E'; WHITE = 'FFFFFF'
MUTED = '9DB3B7'
DISPLAY = 'KaiTi'; BODY = 'Microsoft YaHei'
W = 13.333; H = 7.5
L, C, R = PP_ALIGN.LEFT, PP_ALIGN.CENTER, PP_ALIGN.RIGHT
TOP, MID, BOT = MSO_ANCHOR.TOP, MSO_ANCHOR.MIDDLE, MSO_ANCHOR.BOTTOM

prs = Presentation()
prs.slide_width = Emu(12192000); prs.slide_height = Emu(6858000)
BLANK = prs.slide_layouts[6]


def rgb(h): return RGBColor.from_string(h)


def set_alpha(parent, pct):
    for c in parent.iter(qn('a:srgbClr')):
        for a in c.findall(qn('a:alpha')): c.remove(a)
        a = etree.SubElement(c, qn('a:alpha')); a.set('val', str(int(pct * 1000)))
        break


def shape(slide, kind, x, y, w, h, fill=None, line=None, lw=1.0, alpha=None, dash=False, radius=None, rot=0):
    s = slide.shapes.add_shape(kind, Inches(x), Inches(y), Inches(w), Inches(h))
    s.shadow.inherit = False
    if fill is None: s.fill.background()
    else:
        s.fill.solid(); s.fill.fore_color.rgb = rgb(fill)
        if alpha is not None: set_alpha(s._element.spPr.find(qn('a:solidFill')), alpha)
    if line is None: s.line.fill.background()
    else:
        s.line.color.rgb = rgb(line); s.line.width = Pt(lw)
        if dash: s.line.dash_style = MSO_LINE.DASH
    if radius is not None and kind == MSO_SHAPE.ROUNDED_RECTANGLE: s.adjustments[0] = radius
    if rot: s.rotation = rot
    return s


def rrect(s, x, y, w, h, fill=None, line=None, r=0.12, **k): return shape(s, MSO_SHAPE.ROUNDED_RECTANGLE, x, y, w, h, fill, line, radius=r, **k)
def rect(s, x, y, w, h, fill=None, line=None, **k): return shape(s, MSO_SHAPE.RECTANGLE, x, y, w, h, fill, line, **k)
def oval(s, x, y, w, h, fill=None, line=None, **k): return shape(s, MSO_SHAPE.OVAL, x, y, w, h, fill, line, **k)


def style_run(r, size, color, bold=False, font=BODY, alpha=None, italic=False, underline=False, strike=False):
    r.font.size = Pt(size); r.font.bold = bold; r.font.color.rgb = rgb(color); r.font.name = font
    if italic: r.font.italic = True
    if underline: r.font.underline = True
    rPr = r._r.get_or_add_rPr()
    if strike: rPr.set('strike', 'sngStrike')
    for tag in ('a:ea', 'a:cs'):
        for e in rPr.findall(qn(tag)): rPr.remove(e)
        e = etree.SubElement(rPr, qn(tag)); e.set('typeface', font)
    if alpha is not None: set_alpha(rPr, alpha)


def text(s, x, y, w, h, paras, align=L, anchor=TOP, spacing=1.15, shp=None, margin=0.0):
    """paras: list of paragraphs. paragraph = tuple run or list of runs.
    run = (text,size,color[,bold[,font[,alpha[,opts dict]]]])"""
    tb = shp if shp is not None else s.shapes.add_textbox(Inches(x), Inches(y), Inches(w), Inches(h))
    tf = tb.text_frame; tf.word_wrap = True; tf.vertical_anchor = anchor
    tf.margin_left = tf.margin_right = Inches(margin); tf.margin_top = tf.margin_bottom = Inches(margin)
    first = True
    for p in paras:
        runs = [p] if isinstance(p, tuple) else p
        para = tf.paragraphs[0] if first else tf.add_paragraph()
        first = False
        para.alignment = align; para.line_spacing = spacing
        for rr in runs:
            run = para.add_run(); run.text = rr[0]
            opts = rr[6] if len(rr) > 6 else {}
            style_run(run, rr[1], rr[2], rr[3] if len(rr) > 3 else False, rr[4] if len(rr) > 4 else BODY,
                      rr[5] if len(rr) > 5 else None, **opts)
    return tb


def label(shp, paras, align=C, anchor=MID, spacing=1.1, margin=0.05):
    text(None, 0, 0, 0, 0, paras, align=align, anchor=anchor, spacing=spacing, shp=shp, margin=margin)


def T(s, x, y, w, h, t, size=16, color=TEXT_D, bold=False, font=BODY, align=L, anchor=TOP, spacing=1.2):
    return text(s, x, y, w, h, [(t, size, color, bold, font)], align=align, anchor=anchor, spacing=spacing)


def notes(s, t):
    s.notes_slide.notes_text_frame.text = t


def new(kind='paper'):
    s = prs.slides.add_slide(BLANK)
    f = s.background.fill
    if kind == 'ink':
        f.gradient(); f.gradient_angle = 35
        f.gradient_stops[0].color.rgb = rgb(INK); f.gradient_stops[0].position = 0
        f.gradient_stops[1].color.rgb = rgb(INK2); f.gradient_stops[1].position = 1.0
    elif kind == 'teal':
        f.gradient(); f.gradient_angle = 30
        f.gradient_stops[0].color.rgb = rgb('0E3A43'); f.gradient_stops[0].position = 0
        f.gradient_stops[1].color.rgb = rgb(TEAL); f.gradient_stops[1].position = 1.0
    else:
        f.solid(); f.fore_color.rgb = rgb(PAPER)
    return s


def waves(s, x, y, n=17, color=AMBER, maxh=0.9, bw=0.09, gap=0.07, alpha=None):
    for i in range(n):
        h = maxh * (0.25 + 0.75 * abs(math.sin(i * 0.9 + 0.6)) * (1 - abs(i - n / 2) / n * 0.8))
        rrect(s, x + i * (bw + gap), y + (maxh - h) / 2, bw, h, fill=color, r=0.5, alpha=alpha)


def tracker(s, cur, mins, dark=False):
    x0 = W - 0.7 - (3 * 0.52 + 0.95)
    for i, l in enumerate(['读', '议', '写']):
        on = (l == cur)
        p = rrect(s, x0 + i * 0.52, 0.42, 0.44, 0.36, fill=AMBER if on else None,
                  line=(AMBER if on else ('5E767C' if dark else GREY)), lw=1, r=0.5)
        label(p, [(l, 13, INK if on else (MUTED if dark else GREY), True, DISPLAY)])
    chip = rrect(s, x0 + 3 * 0.52 + 0.08, 0.42, 0.8, 0.36, fill=(WHITE if dark else INK), r=0.5)
    label(chip, [(f'{mins}′', 13, INK if dark else WHITE, True)])


def chrome(s, tag, title, cur=None, mins=None, dark=False, size=32):
    T(s, 0.7, 0.42, 7, 0.3, tag, 12, AMBER if dark else AMBER_D, True)
    T(s, 0.7, 0.78, 9.6, 0.9, title, size, WHITE if dark else TEXT_D, True, DISPLAY)
    if mins is not None: tracker(s, cur, mins, dark)


def timeline(s, steps, cur=None, dark=False, y=6.5):
    total = sum(m for _, m in steps)
    cols = [TEAL, AMBER_D, CORAL, BROWN, '4F6D74']
    cx = 0.7
    raw = [11.95 * m / total for _, m in steps]
    small = [i for i, w_ in enumerate(raw) if w_ < 1.05]
    if small:
        rest = 11.95 - 1.05 * len(small)
        tot_big = sum(w_ for i, w_ in enumerate(raw) if i not in small)
        raw = [1.05 if i in small else w_ * rest / tot_big for i, w_ in enumerate(raw)]
    for i, (lab, m) in enumerate(steps):
        sw = raw[i]
        on = cur is None or cur == i
        b = rrect(s, cx + 0.02, y, sw - 0.04, 0.42, fill=cols[i % 5], r=0.3, alpha=None if on else 38)
        label(b, [(f'{lab} {m}′', 11, WHITE, True)])
        cx += sw


def card(s, x, y, w, h, fill=WHITE, line=PAPER2, r=0.08, **k): return rrect(s, x, y, w, h, fill=fill, line=line, r=r, **k)


def num(s, x, y, d, n, fill=TEAL, size=20, color=WHITE, font=DISPLAY):
    o = oval(s, x, y, d, d, fill=fill); label(o, [(str(n), size, color, True, font)]); return o


def chip(s, x, y, w, t, fill=None, line=TEAL_L, color=TEAL_L, size=12, h=0.36):
    c = rrect(s, x, y, w, h, fill=fill, line=line, r=0.5); label(c, [(t, size, color, True)]); return c


def grid(s, x, y, colw, rowh, header, rows, hfill=INK, hcolor=WHITE, fs=13, hfs=13, first_bold=True, fills=None):
    """draw a table from rounded rects. rows: list of list of str (or (str,color)). returns None"""
    cx = x
    for j, cw in enumerate(colw):
        c = rect(s, cx, y, cw - 0.03, 0.5, fill=hfill)
        label(c, [(header[j], hfs, hcolor, True)])
        cx += cw
    cy = y + 0.53
    for i, row in enumerate(rows):
        cx = x
        for j, cw in enumerate(colw):
            f = (fills[i][j] if fills else None) or (WHITE if j else PAPER2)
            c = rect(s, cx, cy, cw - 0.03, rowh - 0.03, fill=f, line=PAPER2)
            val = row[j]; col = TEXT_D
            if isinstance(val, tuple): val, col = val
            label(c, [(val, fs + (2 if (j == 0 and first_bold) else 0), col, first_bold and j == 0, DISPLAY if (j == 0 and first_bold) else BODY)], align=L if j else C, margin=0.12, spacing=1.2)
            cx += cw
        cy += rowh


# ---------- click animations ----------
def reveal(slide, groups, dur=500):
    """groups: list; each group = list of shapes or (shape,'in'|'out') — one click per group."""
    P = 'http://schemas.openxmlformats.org/presentationml/2006/main'
    nid = [2]

    def nxt():
        nid[0] += 1; return nid[0]
    clicks = ''
    for g in groups:
        outer = nxt(); mid = nxt(); effs = ''; first = True
        for item in g:
            shp, mode = (item if isinstance(item, tuple) else (item, 'in'))
            sid = shp.shape_id; a = nxt(); b = nxt(); c = nxt()
            node = 'clickEffect' if first else 'withEffect'; first = False
            if mode == 'in':
                body = (f'<p:set><p:cBhvr><p:cTn id="{b}" dur="1" fill="hold"><p:stCondLst><p:cond delay="0"/></p:stCondLst></p:cTn>'
                        f'<p:tgtEl><p:spTgt spid="{sid}"/></p:tgtEl><p:attrNameLst><p:attrName>style.visibility</p:attrName></p:attrNameLst></p:cBhvr>'
                        f'<p:to><p:strVal val="visible"/></p:to></p:set>'
                        f'<p:animEffect transition="in" filter="fade"><p:cBhvr><p:cTn id="{c}" dur="{dur}"/><p:tgtEl><p:spTgt spid="{sid}"/></p:tgtEl></p:cBhvr></p:animEffect>')
                pc = 'entr'
            else:
                body = (f'<p:animEffect transition="out" filter="fade"><p:cBhvr><p:cTn id="{c}" dur="{dur}"/><p:tgtEl><p:spTgt spid="{sid}"/></p:tgtEl></p:cBhvr></p:animEffect>'
                        f'<p:set><p:cBhvr><p:cTn id="{b}" dur="1" fill="hold"><p:stCondLst><p:cond delay="{dur}"/></p:stCondLst></p:cTn>'
                        f'<p:tgtEl><p:spTgt spid="{sid}"/></p:tgtEl><p:attrNameLst><p:attrName>style.visibility</p:attrName></p:attrNameLst></p:cBhvr>'
                        f'<p:to><p:strVal val="hidden"/></p:to></p:set>')
                pc = 'exit'
            effs += (f'<p:par><p:cTn id="{a}" presetID="10" presetClass="{pc}" presetSubtype="0" fill="hold" nodeType="{node}">'
                     f'<p:stCondLst><p:cond delay="0"/></p:stCondLst><p:childTnLst>{body}</p:childTnLst></p:cTn></p:par>')
        clicks += (f'<p:par><p:cTn id="{outer}" fill="hold"><p:stCondLst><p:cond delay="indefinite"/></p:stCondLst><p:childTnLst>'
                   f'<p:par><p:cTn id="{mid}" fill="hold"><p:stCondLst><p:cond delay="0"/></p:stCondLst><p:childTnLst>{effs}</p:childTnLst></p:cTn></p:par>'
                   f'</p:childTnLst></p:cTn></p:par>')
    xml = (f'<p:timing xmlns:p="{P}"><p:tnLst><p:par><p:cTn id="1" dur="indefinite" restart="never" nodeType="tmRoot"><p:childTnLst>'
           f'<p:seq concurrent="1" nextAc="seek"><p:cTn id="2" dur="indefinite" nodeType="mainSeq"><p:childTnLst>{clicks}</p:childTnLst></p:cTn>'
           f'<p:prevCondLst><p:cond evt="onPrev" delay="0"><p:tgtEl><p:sldTgt/></p:tgtEl></p:cond></p:prevCondLst>'
           f'<p:nextCondLst><p:cond evt="onNext" delay="0"><p:tgtEl><p:sldTgt/></p:tgtEl></p:cond></p:nextCondLst></p:seq>'
           f'</p:childTnLst></p:cTn></p:par></p:tnLst></p:timing>')
    sld = slide._element
    for old in sld.findall(qn('p:timing')): sld.remove(old)
    sld.append(etree.fromstring(xml))
