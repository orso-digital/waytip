# אוסף מ-OpenStreetMap מקומות כשרים / טבעוניים / ללא גלוטן / חלאל ובתי כנסת וחב"ד
# ליעדים הפופולריים, ושומר כקובץ בתוך האתר – כך שהם נטענים מיד ותמיד.
# רץ אוטומטית ב-GitHub פעם בשבוע. נתונים: © OpenStreetMap contributors (ODbL).
import json, re, time, urllib.request, urllib.parse, os, sys

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
src = open(os.path.join(ROOT, 'places.js'), encoding='utf-8').read()
pop = re.findall(r"\['([^']+)','([^']+)','([^']*)','([^']+)','([A-Z]{2})'\]", src.replace("\\'", "’"))
cities = [(en, cc) for he, en, cHe, cEn, cc in pop if cHe]  # רק ערים (לא מדינות שלמות)
UA = {'User-Agent': 'WayTip/1.0 (https://waytip-app.github.io; orso@outlook.co.il)'}
MIRRORS = ['https://overpass-api.de/api/interpreter', 'https://overpass.private.coffee/api/interpreter', 'https://maps.mail.ru/osm/tools/overpass/api/interpreter']
SETS = ['["diet:kosher"~"^(yes|only)$"]', '["kosher"~"^(yes|only)$"]', '["name"~"kosher|chabad|כשר|חב\\"ד",i]', '["cuisine"~"kosher|jewish",i]',
        '["amenity"="place_of_worship"]["religion"="jewish"]', '["diet:vegan"~"^(yes|only)$"]', '["diet:gluten_free"~"^(yes|only)$"]',
        '["diet:halal"~"^(yes|only)$"]', '["diet:vegetarian"="only"]']

def get(url, data=None, t=90):
    req = urllib.request.Request(url, data=data, headers=UA)
    with urllib.request.urlopen(req, timeout=t) as r: return json.loads(r.read().decode())

def slug(s): return re.sub(r'[^a-z0-9]+', '-', s.lower()).strip('-')

only = sys.argv[1:]
for en, cc in cities:
    if only and slug(en) not in only: continue
    out = os.path.join(ROOT, 'data', 'osm', slug(en) + '.json')
    try:
        g = get('https://geocoding-api.open-meteo.com/v1/search?' + urllib.parse.urlencode({'name': en, 'count': 5, 'language': 'en'}))
        r = next((x for x in g.get('results', []) if x.get('country_code') == cc), None)
        if not r: print('no geo', en); continue
        lat, lon = r['latitude'], r['longitude']
        q = '[out:json][timeout:60];(' + ''.join(f'nwr{f}(around:25000,{lat},{lon});' for f in SETS) + ');out center tags 400;'
        els = None
        for m in MIRRORS:
            try: els = get(m, ('data=' + urllib.parse.quote(q)).encode())['elements']; break
            except Exception as e: print('  mirror fail', m, e)
        if els is None: print('FAILED', en); continue
        seen, keep = set(), []
        for e in els:
            t = e.get('tags') or {}
            if not t.get('name') or e['id'] in seen: continue
            seen.add(e['id'])
            keep.append({'id': e['id'], 'lat': e.get('lat') or (e.get('center') or {}).get('lat'), 'lon': e.get('lon') or (e.get('center') or {}).get('lon'),
                         'tags': {k: v for k, v in t.items() if k.split(':')[0] in ('name', 'diet', 'kosher', 'cuisine', 'amenity', 'shop', 'religion', 'denomination', 'website', 'contact', 'addr', 'opening_hours', 'phone', 'wheelchair', 'tourism')}})
        json.dump({'city': en, 'lat': lat, 'lon': lon, 'at': time.strftime('%Y-%m-%d'), 'elements': keep}, open(out, 'w', encoding='utf-8'), ensure_ascii=False, separators=(',', ':'))
        print(en, len(keep))
    except Exception as e:
        print('ERR', en, e)
    time.sleep(3)
