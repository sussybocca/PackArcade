import json,re,subprocess,sys
from pathlib import Path
from html.parser import HTMLParser
BASE=Path(__file__).resolve().parents[1]
class Parser(HTMLParser):
 def __init__(self):super().__init__();self.ids=set();self.scripts=[];self.styles=[];self.current=None;self.refs=[]
 def handle_starttag(self,tag,attrs):
  attrs=dict(attrs)
  if 'id' in attrs:
   assert attrs['id'] not in self.ids, 'duplicate ID: '+attrs['id']
   self.ids.add(attrs['id'])
  if tag in ('script','style'):self.current=tag
  if tag in ('script','link','iframe') and ('src' in attrs or 'href' in attrs):self.refs.append(attrs.get('src') or attrs.get('href'))
 def handle_data(self,data):
  if self.current=='script':self.scripts.append(data)
  if self.current=='style':self.styles.append(data)
 def handle_endtag(self,tag):
  if self.current==tag:self.current=None
catalog=json.loads((BASE/'public/game-catalog.json').read_text())['games']; assert len(catalog)>=69,len(catalog)
ids=[x['id'] for x in catalog];paths=[x['path'] for x in catalog]
assert len(ids)==len(set(ids));assert len(paths)==len(set(paths));assert all(re.fullmatch(r'[a-z0-9]+(?:-[a-z0-9]+)*',x) for x in ids)
for game in catalog:
 assert all(x in game for x in ('id','name','path','description','category','accent','platforms'))
 assert game['path'].startswith('/public/imagine/')
 if game['id'] in ('neon-serpent','orbit-rally','crystal-memory') or __import__('os').environ.get('PACKARCADE_FULL_CHECK')=='1': assert (BASE/game['path'][1:]).is_file(),game['path']
print('Catalog checks:',len(catalog),'unique games, 3 new game files exist')
for path in ['index.html','play.html',*[str(p.relative_to(BASE)) for p in (BASE/'public/imagine').glob('*/index.html')]]:
 text=(BASE/path).read_text();p=Parser();p.feed(text)
 for ref in p.refs:
  if ref.startswith('/') and not ref.startswith('//') and not ref.startswith('/public/imagine/'):
   if ref not in ('/favicon.ico','/icons/favicon.png'):
    assert (BASE/ref.lstrip('/').split('?')[0]).exists(),(path,ref)
 for script in p.scripts:
  if script.strip() and 'const' in script or script.strip().startswith('(()=>'):
   cp=subprocess.run(['node','--check'],input=script,text=True,capture_output=True)
   assert cp.returncode==0,(path,cp.stderr[:400])
 print('HTML checked:',path,'DOM IDs',len(p.ids))
for path in ['public/arcade-core.js','public/arcade-next.js','public/player-next.js','tools/import-github-game.mjs','netlify/functions/arcade-event.js','netlify/functions/arcade-stats.js']:
 p=BASE/path;r=subprocess.run(['node','--check',str(p)],capture_output=True,text=True);assert r.returncode==0,(path,r.stderr)
css=(BASE/'public/arcade-next.css').read_text();assert '@media(max-width:610px)' in css and '@media(max-width:860px)' in css and '@media(max-width:1160px)' in css
ui=(BASE/'index.html').read_text();assert 'data-go="favorites"' in ui and 'data-go="recent"' in ui and 'mobile-nav' in ui and 'mobileSettingsButton' in ui
print('Static JS, responsive CSS, game and HTML assertions passed')
