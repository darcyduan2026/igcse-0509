import sys, os, importlib
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from common import *

out = sys.argv[1]
mods = sys.argv[2:] or ['unit', 'lg1', 'lg2', 'lg3', 'lg4', 'lg5', 'lg6', 'tail']
for m in mods:
    mod = importlib.import_module(m)
    for fn in [f for f in dir(mod) if f.startswith('lesson') or f in ('unit_pages', 'tail_pages')]:
        getattr(mod, fn)()
prs.save(out)
print('saved', len(prs.slides))
