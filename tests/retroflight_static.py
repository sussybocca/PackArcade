import re, json, pathlib, unittest
from html.parser import HTMLParser
ROOT=pathlib.Path(__file__).resolve().parents[1]
BASE=ROOT/'public/imagine/SpaceShooters2'
class IDs(HTMLParser):
    def __init__(self):super().__init__();self.ids=[];self.references=[]
    def handle_starttag(self,tag,attrs):
        a=dict(attrs)
        if a.get('id'):self.ids.append(a['id'])
        if tag=='script' and a.get('src'):self.references.append(a['src'])
        if tag=='link' and a.get('href'):self.references.append(a['href'])
class GameStaticTests(unittest.TestCase):
    def test_unique_ids(self):
        p=IDs();p.feed((BASE/'index.html').read_text());self.assertEqual(len(p.ids),len(set(p.ids)))
    def test_all_local_dependencies_exist(self):
        p=IDs();p.feed((BASE/'index.html').read_text())
        missing=[ref for ref in p.references if not ref.startswith(('https:','http:')) and not (BASE/ref).is_file()]
        self.assertFalse(missing,missing)
    def test_required_controls_and_round_panel(self):
        p=IDs();p.feed((BASE/'index.html').read_text());ids=set(p.ids)
        for ident in ('stickArea','stickThumb','fireOneMobile','fireHeavyMobile','upgradeScreen','levelArmor','levelDamage','levelThrusters','gameOverScreen','healthLabels','startBtn','pauseBtn','cameraSelect','modeSelect','hostBtn','joinBtn','audioScreen','cheatsScreen'):
            self.assertIn(ident,ids)
    def test_source_has_real_3d_not_sprite_substitutions(self):
        src=(BASE/'retroflight-game.js').read_text();self.assertIn('THREE.WebGLRenderer',src)
        self.assertIn('THREE.IcosahedronGeometry',src);self.assertIn('sphereContact(',src)
        self.assertIn('THREE.Points',src);self.assertIn('PH.heavyCooldown',src)
        self.assertNotIn('ctx.drawImage',src)
    def test_separate_responsive_layouts(self):
        css=(BASE/'retroflight.css').read_text()
        for marker in ('@media(max-width:650px)','(orientation:landscape)','(pointer:coarse)','safe-area-inset-bottom'):
            self.assertIn(marker,css)
    def test_no_account_dependent_backend(self):
        src=(BASE/'retroflight-game.js').read_text()+ (BASE/'index.html').read_text();self.assertNotIn('supabase',src.lower())
        self.assertNotIn('/login',src);self.assertNotIn('email=',src)
if __name__=='__main__':unittest.main()
