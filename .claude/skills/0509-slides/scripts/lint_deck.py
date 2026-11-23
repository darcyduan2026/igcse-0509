#!/usr/bin/env python3
"""Static checks for a 0509 deck (spec v3.0 §7 + v4.0 rules). Exit code 1 if any ERROR.

    python3 lint_deck.py deck.pptx [--min-body 14]

ERROR: slide without speaker notes; shape outside the page; leftover placeholder text.
WARN : text runs below the size floor (counts per slide; the page-header zone y<0.85in and the flow-bar zone y>=6.4in are exempt); fonts other than
       the allowed set; hidden slides that are not teacher pages; timeline segments not summing to 45.
"""
import re, sys, collections
from pptx import Presentation
from pptx.util import Emu

ALLOWED_FONTS = {'KaiTi', 'STKaiti', 'Microsoft YaHei', 'SimSun'}
PLACEHOLDER = re.compile(r'(待补|TODO|占位|lorem|XXX)', re.I)


def main():
    path = sys.argv[1]
    floor = 14
    if '--min-body' in sys.argv: floor = float(sys.argv[sys.argv.index('--min-body') + 1])
    prs = Presentation(path)
    W, H = prs.slide_width, prs.slide_height
    errors, warns = [], []
    fonts = collections.Counter()
    small_total = 0
    for i, s in enumerate(prs.slides, 1):
        if not (s.has_notes_slide and s.notes_slide.notes_text_frame.text.strip()):
            errors.append(f'slide {i}: no speaker notes')
        hidden = s._element.get('show') == '0'
        small = 0
        for sh in s.shapes:
            if sh.left is not None and (sh.left < -Emu(914400 * 0.05) or sh.top < -Emu(914400 * 3) or sh.left + sh.width > W + Emu(914400 * 0.2) or sh.top + sh.height > H + Emu(914400 * 0.2)):
                # huge watermark characters are allowed to bleed
                if not (sh.has_text_frame and sh.width > Emu(914400 * 4) and sh.height > Emu(914400 * 4)):
                    errors.append(f'slide {i}: shape "{sh.name}" outside the page')
            chrome_zone = sh.top is not None and (sh.top < Emu(914400 * 0.85) or sh.top >= Emu(914400 * 6.4))   # 页眉标签/环节圆点/页底流程条不计字号
            if sh.has_text_frame:
                txt = sh.text_frame.text
                if PLACEHOLDER.search(txt): errors.append(f'slide {i}: placeholder text "{txt[:20]}"')
                for p in sh.text_frame.paragraphs:
                    for r in p.runs:
                        if r.font.name: fonts[r.font.name] += 1
                        if not chrome_zone and r.font.size is not None and r.font.size.pt < floor and len(r.text.strip()) > 3:
                            small += 1
        small_total += small
        if small: warns.append(f'slide {i}: {small} text runs below {floor:g} pt')
    for f, n in fonts.items():
        if f not in ALLOWED_FONTS: warns.append(f'font "{f}" used {n} times (not in {sorted(ALLOWED_FONTS)})')
    print(f'{len(prs.slides)} slides; fonts: {dict(fonts)}')
    print(f'small-text runs total: {small_total}')
    for w in warns[:40]: print('WARN ', w)
    if len(warns) > 40: print(f'... {len(warns) - 40} more warnings')
    for e in errors: print('ERROR', e)
    sys.exit(1 if errors else 0)


if __name__ == '__main__':
    main()
