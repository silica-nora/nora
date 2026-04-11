#!/usr/bin/env python3
import json, re, urllib.request, urllib.parse, datetime, os
from html import unescape

BASE='https://www.tkxiong.com/wp-json/wp/v2/posts'
GRAPH='/home/nora/.openclaw/workspace/memory/ontology/graph.jsonl'


def now_iso():
    return datetime.datetime.now(datetime.timezone(datetime.timedelta(hours=8))).isoformat(timespec='seconds')

def strip_html(s: str) -> str:
    s = unescape(re.sub('<[^<]+?>', '', s or ''))
    s = re.sub(r'\s+', ' ', s).strip()
    return s

def fetch_posts():
    page = 1
    while True:
        qs = urllib.parse.urlencode({
            'per_page': 100,
            'page': page,
            '_fields': 'id,date,modified,link,title,excerpt'
        })
        url = f'{BASE}?{qs}'
        try:
            with urllib.request.urlopen(url, timeout=30) as r:
                arr = json.loads(r.read().decode())
        except Exception:
            break
        if not arr:
            break
        yield from arr
        page += 1


def load_existing_ids(path):
    ids = set()
    if not os.path.exists(path):
        return ids
    with open(path, 'r', encoding='utf-8') as f:
        for line in f:
            line = line.strip()
            if not line:
                continue
            try:
                obj = json.loads(line)
            except Exception:
                continue
            ent = obj.get('entity')
            if isinstance(ent, dict) and ent.get('id'):
                ids.add(ent['id'])
    return ids


def main():
    os.makedirs(os.path.dirname(GRAPH), exist_ok=True)
    existing = load_existing_ids(GRAPH)
    created = 0
    with open(GRAPH, 'a', encoding='utf-8') as out:
        for p in fetch_posts():
            pid = p['id']
            eid = f'doc_blog_post_{pid}'
            if eid in existing:
                continue
            ts = now_iso()
            title = strip_html(p.get('title', {}).get('rendered', ''))
            summary = strip_html(p.get('excerpt', {}).get('rendered', ''))
            if len(summary) > 220:
                summary = summary[:217] + '...'
            rec = {
                'op': 'create',
                'entity': {
                    'id': eid,
                    'type': 'Document',
                    'properties': {
                        'title': title,
                        'url': p.get('link'),
                        'summary': summary,
                        'source': 'tkxiong_blog',
                        'post_id': pid,
                        'date': p.get('date'),
                        'modified': p.get('modified')
                    },
                    'created': ts,
                    'updated': ts
                },
                'timestamp': ts
            }
            out.write(json.dumps(rec, ensure_ascii=False) + '\n')
            existing.add(eid)
            created += 1
    print(f'created={created}')


if __name__ == '__main__':
    main()
