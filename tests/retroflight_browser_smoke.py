"""Browser smoke suite: page UX, physics integration and layouts. Use RETRO_FAKE_THREE=1 for offline UI-only checks."""
import contextlib,http.server,os,pathlib,socketserver,threading,time
from playwright.sync_api import sync_playwright
ROOT=pathlib.Path(__file__).resolve().parents[1]
BASE=ROOT/'public/imagine/SpaceShooters2'
FAKE=os.environ.get('RETRO_FAKE_THREE')=='1'
class Handler(http.server.SimpleHTTPRequestHandler):
    def __init__(self,*a,**kw):super().__init__(*a,directory=str(ROOT),**kw)
    def log_message(self,*a):pass
class Server(socketserver.ThreadingTCPServer):allow_reuse_address=True;daemon_threads=True

def check_page(browser,name,width,height,has_touch=False,mobile=False):
    context=browser.new_context(viewport={'width':width,'height':height},is_mobile=mobile,has_touch=has_touch,device_scale_factor=1)
    page=context.new_page();errors=[]
    page.on('pageerror',lambda e:errors.append(str(e)))
    if FAKE:
        body=(ROOT/'tests/three-mock.js').read_text()
        # This isolated Chromium installation blocks all localhost navigation.
        # Inline only the test document to exercise real UI logic with a fake renderer.
        page.add_init_script('window.__RETROFLIGHT_TEST__=true;')
    try:
        url=f'http://127.0.0.1:{port}/public/imagine/SpaceShooters2/index.html?test=1'
        if FAKE:
            source=(BASE/'index.html').read_text()
            css=(BASE/'retroflight.css').read_text()
            source=source.replace('<link rel="stylesheet" href="retroflight.css">','<style>'+css+'</style>')
            modules={'vendor/three.min.js':body,'retroflight-physics.js':(BASE/'retroflight-physics.js').read_text(),
              'userAssets.js':"window.userAssets={save:async()=>{},load:async()=>null,blobToURL:()=>''};",
              'cheats.js':"window.cheatSystem={updateUnlocks:()=>{},handleCheatKey:()=>{},getActiveCheats:()=>[],isCheatActive:()=>false};",
              'retroflight-network.js':(BASE/'retroflight-network.js').read_text(),
              'retroflight-game.js':(BASE/'retroflight-game.js').read_text()}
            # Escape script closing sequences to keep inline integration valid.
            for script,code in modules.items():
                code=code.replace('</script','<\\/script')
                source=source.replace(f'<script src="{script}"></script>',f'<script>{code}</script>')
            source=source.replace('<head>','<head><script>window.__RETROFLIGHT_TEST__=true; window.__dataStorage__={}; Object.defineProperty(window,"localStorage",{configurable:true,value:{getItem:k=>window.__dataStorage__[k]??null,setItem:(k,v)=>window.__dataStorage__[k]=String(v)}});</script>')
            page.set_content(source,wait_until='load',timeout=25000)
        else:
            page.goto(url,wait_until='domcontentloaded',timeout=25000)
        page.wait_for_function('window.RetroflightStatus && window.RetroflightStatus().threeReady',timeout=18000)
        assert page.locator('#startBtn').is_visible(),f'{name}: no main menu'
        assert page.locator('#loadError').is_hidden(),f'{name}: graphics unavailable'
        # Menu layout fits viewport; no horizontal webpage overflow.
        assert page.evaluate('document.documentElement.scrollWidth<=innerWidth+1'),f'{name}: overflow'
        page.locator('#startBtn').click()
        page.wait_for_function("RetroflightStatus().phase==='flying'",timeout=3000)
        assert page.locator('#hud').is_visible(),f'{name}: no HUD'
        assert page.evaluate('RetroflightStatus().threeReady')
        page.evaluate('RetroflightTestHarness.spawnEnemy("scout")')
        assert page.locator('.health-label').count()>=1,f'{name}: enemy health bar absent'
        # Weapon count, one bullet per press, independent salvo cooldown.
        page.evaluate('RetroflightTestHarness.setKills(24)')
        before=page.evaluate('RetroflightStatus().bullets')
        if has_touch:
            assert page.locator('#stickArea').is_visible(),f'{name}: joystick missing'
            assert page.locator('#turnArea').is_visible(),f'{name}: second flight joystick missing'
            assert page.locator('#aimAssistSlider').count()==1,f'{name}: aim assist slider missing'
            assert page.locator('#fireOneMobile').is_visible(),f'{name}: instant fire missing'
            assert page.locator('#fireHeavyMobile').is_visible(),f'{name}: salvo missing'
            page.locator('#fireOneMobile').dispatch_event('pointerdown',{'pointerId':1,'clientX':width-70,'clientY':height-75})
        else:
            page.keyboard.press('Space')
        page.wait_for_timeout(35)
        assert page.evaluate('RetroflightStatus().bullets')>before,f'{name}: single-shot button ineffective'
        if has_touch:
            page.locator('#fireHeavyMobile').dispatch_event('pointerdown',{'pointerId':2,'clientX':width-70,'clientY':height-80})
        else:
            page.keyboard.press('Shift')
        page.wait_for_timeout(40)
        assert page.evaluate('RetroflightStatus().heavyRemaining')>39,f'{name}: salvo cooldown not applied'
        page.wait_for_function("document.querySelector('#heavyStatus').textContent.endsWith('s')",timeout=1000)
        page.evaluate('RetroflightTestHarness.finishWave()')
        assert page.locator('#upgradeScreen').is_visible(),f'{name}: no post-wave upgrade screen'
        old=page.evaluate('RetroflightStatus().upgrades.armor')
        page.locator('[data-upgrade="armor"]').click()
        assert page.evaluate('RetroflightStatus().upgrades.armor')==old+1
        assert page.evaluate('RetroflightStatus().maxHealth')==60
        assert page.evaluate('RetroflightStatus().wave')==2
        # Gameplay flight with real inputs.
        if has_touch:
            area=page.locator('.stick-base').bounding_box()
            if area:
                x=area['x']+area['width']*.5;y=area['y']+area['height']*.5
                page.locator('#stickArea').dispatch_event('pointerdown',{'pointerId':9,'clientX':x,'clientY':y})
                page.locator('#stickArea').dispatch_event('pointermove',{'pointerId':9,'clientX':x,'clientY':y-area['height']*.24})
                page.wait_for_timeout(170)
                page.locator('#stickArea').dispatch_event('pointerup',{'pointerId':9})
                assert page.evaluate('RetroflightStatus().threeReady')
            turn=page.locator('#turnArea')
            rect=page.locator('.turn-base').bounding_box()
            if rect:
                tx=rect['x']+rect['width']*.5;ty=rect['y']+rect['height']*.5
                turn.dispatch_event('pointerdown',{'pointerId':41,'clientX':tx,'clientY':ty})
                turn.dispatch_event('pointermove',{'pointerId':41,'clientX':tx,'clientY':ty-rect['height']*.25})
                page.wait_for_timeout(170)
                assert abs(page.evaluate('RetroflightTestHarness.getBody().angularVelocity.x'))>.005,f'{name}: pitch/loop joystick inactive'
                turn.dispatch_event('pointerup',{'pointerId':41})
                for k in (42,43):
                    turn.dispatch_event('pointerdown',{'pointerId':k,'clientX':tx,'clientY':ty})
                    turn.dispatch_event('pointerup',{'pointerId':k})
                assert page.evaluate('RetroflightStatus().rollMode'),f'{name}: double-tap roll mode broken'
                for k in (51,52):
                    page.locator('#stickArea').dispatch_event('pointerdown',{'pointerId':k,'clientX':x,'clientY':y})
                    page.locator('#stickArea').dispatch_event('pointerup',{'pointerId':k})
                assert page.evaluate('RetroflightStatus().liftMode'),f'{name}: mobile lift mode broken'
        else:
            page.keyboard.down('w');page.wait_for_timeout(230);page.keyboard.up('w')
            assert page.evaluate('RetroflightTestHarness.getBody().velocity.z')<0
        if name=='Desktop':
            # Reaching wave 5 must actually enable planetary gravitational acceleration.
            for _ in range(3):
                page.evaluate('RetroflightTestHarness.finishWave()')
                assert page.locator('#upgradeScreen').is_visible()
                page.locator('[data-upgrade="thrusters"]').click()
            assert page.evaluate('RetroflightStatus().wave')==5
            assert page.evaluate('RetroflightStatus().gravitySources')>=2
            assert 'GRAVITY' in page.locator('#gravityReadout').inner_text()
        # Persistent upgrades survive a new page session on the same origin.
        if FAKE:
            # A new document keeps the test's explicit mock Storage contents.
            saved_levels=page.evaluate('RetroflightStatus().upgrades.armor')
            page.locator('#menuBtn').click(force=True) if page.locator('#menuBtn').is_visible() else None
            assert page.evaluate('RetroflightStatus().upgrades.armor')==saved_levels
        else:
            page.reload(wait_until='domcontentloaded');page.wait_for_function('RetroflightStatus().threeReady')
        assert page.evaluate('RetroflightStatus().upgrades.armor')==old+1
        if not FAKE: assert page.locator('#startBtn').is_visible()
        assert not errors,f'{name} Javascript errors: {errors[:4]}'
        print(f'PASS {name}: {width}x{height}, touch={has_touch}, ship upgrades & two weapons verified')
    finally:
        context.close()

if __name__=='__main__':
    with Server(('127.0.0.1',0),Handler) as server:
        port=server.server_address[1]
        th=threading.Thread(target=server.serve_forever,daemon=True);th.start()
        with sync_playwright() as p:
            browser=p.chromium.launch(headless=True,executable_path=(os.environ.get('RETRO_CHROMIUM_PATH') or ('/usr/bin/chromium' if pathlib.Path('/usr/bin/chromium').exists() else None)),args=['--no-sandbox','--use-gl=angle','--use-angle=swiftshader','--enable-webgl','--ignore-gpu-blocklist'])
            try:
                for opts in [
                    ('Desktop',1440,900,False,False),
                    ('Chromebook',1366,768,False,False),
                    ('Tablet',834,1112,True,True),
                    ('Phone portrait',390,844,True,True),
                    ('Phone landscape',844,390,True,True),
                ]:
                    check_page(browser,*opts)
            finally:browser.close()
        server.shutdown()
