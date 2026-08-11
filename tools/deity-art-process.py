"""Download the picked deity art at full size, fit it to the app's palette.

Run from anywhere; writes straight into public/deities/. Needs the candidate
JSON that deity-art-search.py leaves in ./cand — run that first if the folder
is missing, and re-pick the indices in PICKS from its contact sheets, because
Commons search results are not stable over time.
"""
import json, os, re, urllib.request
from PIL import Image, ImageEnhance

UA = 'aether-mono-dev/1.0 (prototype; contact administrator@sleepycat.in)'
HERE = os.path.dirname(os.path.abspath(__file__))
CAND = os.path.join(HERE, 'cand')
RAW = os.path.join(HERE, 'raw')
DEST = os.path.join(HERE, '..', 'public', 'deities')
os.makedirs(RAW, exist_ok=True)
os.makedirs(DEST, exist_ok=True)

# (deity key, source sheet, index in that sheet's json, vertical crop bias 0=top
#  1=bottom, zoom). zoom > 1 tightens onto the centre before the 4:5 crop; zoom
#  None means the source is a cut-out on white, so contain it on cream instead
#  of cropping the pedestal off.
PICKS = [
    ('ganesh',  'ganesh',   0, 0.30, 1.0),
    ('ganesh',  'ganesh',   5, 0.45, 1.0),
    ('ganesh',  'ganesh',   9, 0.40, 1.0),
    ('ganesh',  'ganesh',  11, 0.45, 1.18),
    ('shiva',   'shiva',    0, 0.35, 1.0),
    ('shiva',   'shiva',    1, 0.00, 1.0),
    ('shiva',   'shiva',    5, 0.40, 1.0),
    ('shiva',   'shiva',    9, 0.45, 1.0),
    ('lakshmi', 'lakshmi',  0, 0.35, 1.0),
    ('lakshmi', 'lakshmi',  4, 0.35, 1.0),
    ('lakshmi', 'lakshmi',  7, 0.40, 1.0),
    ('lakshmi', 'lakshmi',  8, 0.35, 1.0),
    ('hanuman', 'hanuman2',10, 0.40, 1.0),
    ('hanuman', 'hanuman2', 2, 0.42, 1.45),
    ('hanuman', 'hanuman2', 5, 0.40, 1.0),
    ('hanuman', 'hanuman2', 9, 0.40, 1.0),
    ('durga',   'durga',    1, 0.35, 1.0),
    ('durga',   'durga',    0, 0.00, 1.0),
    ('durga',   'durga',   10, 0.40, 1.0),
    ('durga',   'durga',    8, 0.35, 1.0),
    ('shani',   'shani3',   7, 0.40, 1.0),
    ('shani',   'shani3',   3, 0.35, 1.0),
    ('shani',   'shani3',   9, 0.40, None),
]

W, H = 600, 750  # 4:5, the shrine's aspect


def fetch(url, path):
    if os.path.exists(path) and os.path.getsize(path) > 4000:
        return
    req = urllib.request.Request(url, headers={'User-Agent': UA})
    with urllib.request.urlopen(req, timeout=180) as r, open(path, 'wb') as f:
        f.write(r.read())


def treat(im):
    """Mute and warm a saturated devotional print until it sits on a cream canvas.

    A flat cream blend at 10% is what an old print already does to itself — it
    lifts the blacks and pulls everything half a step toward the paper. That
    plus a light desaturation is the whole treatment; anything stronger turns
    the gold leaf grey, which is the one colour the app cannot lose.
    """
    im = ImageEnhance.Color(im).enhance(0.80)
    im = ImageEnhance.Contrast(im).enhance(1.05)
    im = Image.blend(im, Image.new('RGB', im.size, (241, 239, 236)), 0.10)
    r, g, b = im.split()
    r = r.point(lambda v: min(255, int(v * 1.035)))
    b = b.point(lambda v: int(v * 0.965))
    return Image.merge('RGB', (r, g, b))


def crop_fill(im, bias, zoom):
    """Fit to 4:5, keeping `bias` of the trimmed height above the frame."""
    target = W / H

    if zoom is None:                            # cut-out — letterbox on cream
        im = im.copy()
        im.thumbnail((int(W * 0.92), int(H * 0.92)), Image.LANCZOS)
        pad = Image.new('RGB', (W, H), (247, 245, 242))
        pad.paste(im, ((W - im.width) // 2, (H - im.height) // 2))
        return pad

    if zoom > 1:                                # tighten onto the centre first
        w, h = int(im.width / zoom), int(im.height / zoom)
        im = im.crop(((im.width - w) // 2, int((im.height - h) * bias),
                      (im.width - w) // 2 + w, int((im.height - h) * bias) + h))

    if im.width / im.height > target:           # too wide — trim the sides
        w = int(im.height * target)
        x = (im.width - w) // 2
        im = im.crop((x, 0, x + w, im.height))
    else:                                       # too tall — trim top and bottom
        h = int(im.width / target)
        y = int((im.height - h) * bias)
        im = im.crop((0, y, im.width, y + h))
    return im.resize((W, H), Image.LANCZOS)


meta, by_key = {}, {}
for key, sheet, idx, bias, zoom in PICKS:
    rec = json.load(open(os.path.join(CAND, f'{sheet}.json'), encoding='utf-8'))[idx]
    n = by_key.get(key, 0) + 1
    by_key[key] = n
    src = os.path.join(RAW, f'{key}-{n}.jpg')
    # Ask for a generously sized render rather than the original — some of these
    # scans are 8000px wide and we only ever show 600.
    url = re.sub(r'/\d+px-', '/1400px-', rec['thumb']).split('?')[0]
    try:
        fetch(url, src)
    except Exception:
        fetch(rec['full'], src)

    im = treat(crop_fill(Image.open(src).convert('RGB'), bias, zoom))
    out = f'{key}-{n}.webp'
    im.save(os.path.join(DEST, out), 'WEBP', quality=80, method=6)

    title = re.sub(r'^File:|\.\w+$', '', rec['title'])
    artist = re.sub(r'\s+', ' ', rec['artist'] or '').strip(' ,')
    meta.setdefault(key, []).append({
        'file': out,
        'label': title,
        'credit': f"{artist + ' · ' if artist else ''}{rec['lic']} · Wikimedia Commons",
    })
    print(f'{out:20} {os.path.getsize(os.path.join(DEST, out))//1024:>4} KB  {title[:52]}')

json.dump(meta, open(os.path.join(HERE, 'deity-meta.json'), 'w', encoding='utf-8'),
          ensure_ascii=False, indent=1)

# Preview: every processed image in deity order, so one look catches a bad crop.
COLS = 6
rows = (len(PICKS) + COLS - 1) // COLS
sheet = Image.new('RGB', (COLS * 210, rows * 268), (241, 239, 236))
for i, (key, *_) in enumerate(PICKS):
    n = sum(1 for k, *_ in PICKS[:i + 1] if k == key)
    im = Image.open(os.path.join(DEST, f'{key}-{n}.webp')).resize((196, 245), Image.LANCZOS)
    sheet.paste(im, ((i % COLS) * 210 + 7, (i // COLS) * 268 + 12))
sheet.save(os.path.join(HERE, 'preview-deities.jpg'), quality=88)
print('preview written')
