#!/usr/bin/env python3
"""Concatenate src/ into the single-file index.html (and optionally the artifact copy).

Usage:
  python3 build.py                      # writes index.html
  python3 build.py --artifact OUT.html  # also writes the artifact variant (no doc wrappers)
"""
import sys, pathlib

ROOT = pathlib.Path(__file__).parent
parts = sorted(p for p in (ROOT / 'src').iterdir() if p.is_file())
out = ''.join(p.read_text() for p in parts)
(ROOT / 'index.html').write_text(out)
print('built index.html from %d parts (%d bytes)' % (len(parts), len(out)))

if '--artifact' in sys.argv:
    dest = pathlib.Path(sys.argv[sys.argv.index('--artifact') + 1])
    art = out
    for tag in ['<!DOCTYPE html>', '<html lang="en">', '</html>', '<head>', '</head>',
                '<body>', '</body>', '<meta charset="utf-8">']:
        art = art.replace(tag, '', 1)
    dest.write_text(art.strip() + '\n')
    print('built artifact copy at', dest)
