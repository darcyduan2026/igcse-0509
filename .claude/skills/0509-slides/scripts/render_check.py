#!/usr/bin/env python3
"""Render a .pptx with Microsoft PowerPoint (macOS) and build contact sheets for visual QA.

    python3 render_check.py deck.pptx [out_dir] [per_sheet=6]

Why the container trick: PowerPoint is sandboxed. AppleScript `open`/`save` on files outside its
container can hang on a hidden permission dialog (error -1712). Files inside
~/Library/Containers/com.microsoft.Powerpoint/Data work without a prompt, so we copy the deck
there, export a PDF there, then copy results back. Temporary files are removed afterwards.

Safety: always open the COPY under a unique name; never call `close`/`save` on "active presentation"
when the user may have their own decks open — we close the document we opened by name.
Needs: PyMuPDF (fitz) and Pillow.
"""
import os, shutil, subprocess, sys, uuid


def main():
    src = os.path.abspath(sys.argv[1])
    out = os.path.abspath(sys.argv[2]) if len(sys.argv) > 2 else os.path.join(os.path.dirname(src), '_render')
    per = int(sys.argv[3]) if len(sys.argv) > 3 else 6
    os.makedirs(out, exist_ok=True)
    cont = os.path.expanduser('~/Library/Containers/com.microsoft.Powerpoint/Data')
    tag = 'render_' + uuid.uuid4().hex[:8]
    tmp_pptx = os.path.join(cont, tag + '.pptx'); tmp_pdf = os.path.join(cont, tag + '.pdf')
    shutil.copy(src, tmp_pptx)
    script = f'''
with timeout of 120 seconds
tell application "Microsoft PowerPoint"
  open POSIX file "{tmp_pptx}"
  set p to presentation "{tag}.pptx"
  save p in POSIX file "{tmp_pdf}" as save as PDF
  close p saving no
end tell
end timeout'''
    try:
        subprocess.run(['osascript', '-e', script], check=True, timeout=150)
        import fitz
        from PIL import Image
        doc = fitz.open(tmp_pdf)
        imgs = []
        for i, pg in enumerate(doc, 1):
            pm = pg.get_pixmap(dpi=60)
            imgs.append(Image.frombytes('RGB', [pm.width, pm.height], pm.samples))
        w, h = imgs[0].size
        for k in range(0, len(imgs), per):
            grp = imgs[k:k + per]; rows = (len(grp) + 1) // 2
            sheet = Image.new('RGB', (2 * w + 10, rows * (h + 10)), 'white')
            for j, im in enumerate(grp): sheet.paste(im, ((j % 2) * (w + 10), (j // 2) * (h + 10)))
            sheet.save(os.path.join(out, f'sheet{k // per + 1}.png'))
        print(f'{len(imgs)} slides rendered (hidden slides are skipped by PowerPoint) -> {out}')
    finally:
        for f in (tmp_pptx, tmp_pdf):
            if os.path.exists(f): os.remove(f)


if __name__ == '__main__':
    main()
