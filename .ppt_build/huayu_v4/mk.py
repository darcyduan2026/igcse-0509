import sys
from kit import *
import d1, l1, l23, l4

out = sys.argv[1]
d1.unit_cover(); d1.unit_overview()
l1.lesson1(); l23.lesson2(); l23.lesson3(); l4.lesson4(); l4.appendix(); l4.teacher()
prs.save(out)
print('saved', len(prs.slides))
