/* SpaceShooters 2 RETROFLIGHT 3D — preserves original waves, powerups, cheat codes, audio customization and anonymous play. */
(function(){'use strict';
const PH=window.RetroPhysics,NET=window.RetroNetwork,SYS=window.RetroSystems;
if(!SYS)throw Error('RETROFLIGHT systems module not loaded');
const {V,Q,ShipBody,clamp,raySphere,sphereContact}=PH;
const $=id=>document.getElementById(id), dom={};
const H='retroflight-options-v1',U='retroflight-upgrades-v1';
const defaults={mode:'stabilized',camera:'chase',quality:'auto',look:'retro',volume:65,healthLabels:true,aimAssist:50};
const sectors=['DEEP SPACE','CRIMSON NEBULA','ASTEROID BELT','ORBITAL SHIPYARD','PLANETARY FRONTIER'];
const enemyTypes={
 scout:{name:'RAZOR SCOUT',hp:25,mass:5,radius:1.55,mainThrust:72,strafeThrust:48,torque:35,score:10,color:0xed687d,scale:.8},
 interceptor:{name:'VEX INTERCEPTOR',hp:45,mass:8,radius:2,mainThrust:85,strafeThrust:44,torque:35,score:20,color:0xa67cff,scale:1},
 gunship:{name:'GOLIATH',hp:100,mass:28,radius:3.7,mainThrust:115,strafeThrust:45,torque:65,score:50,color:0xffb46e,scale:1.55},
 miniboss:{name:'CRIMSON COMMANDER',hp:300,mass:64,radius:5.8,mainThrust:145,strafeThrust:80,torque:115,score:170,color:0xf06479,scale:2.4},
 boss:{name:'OBLIVION DREADNOUGHT',hp:850,mass:240,radius:10,mainThrust:260,strafeThrust:95,torque:260,score:500,color:0xffbf86,scale:4.5}
};
let settings={...defaults},upgrades={armor:0,damage:0,thrusters:0};
let R,scene,camera,renderer,clock,playerMesh,playerBody,stars,planet,asteroidField,station,thrusterLight,remoteMesh;
let wave=1,phase='menu',lives=3,score=0,kills=0,killStreak=0,bestStreak=0,
 health=40,maxHealth=40,shield=0,powerups=[],enemies=[],shots=[],particles=[],nextEnemy=0,spawnRemaining=0,
 waveKills=0,heavyLast=-Infinity,roundTimer=0,toastTimer=0,hitTimer=0,invincible=0,autoFire=false,powerTimers={spread:0,homing:0,rapid:0,overdrive:0};
let enemyAIData={dodges:0,shots:0,playerSpeed:0},remoteState=null,remoteShots=[],roomRole='solo',netSendTimer=0;
let keys=new Set(),joystick={x:0,y:0,active:false,pointer:null},turnStick={x:0,y:0,vertical:0,rollMode:false,active:false,pointer:null,lastTap:-Infinity},shotListener=false;
let gravityBodies=[],aimState={target:null,direction:null,lead:null,enabled:false},manualPointer={x:0,y:0,active:false},moonObject=null;
let pendingStart=false,visualTime=0,audioCtx=null,bgm=null,userBgmUrl=null,gunAudio=null,explosionAudio=null;
let lastTime=0,accumulator=0,uiTimer=0,seed=18273,asteroidBodies=[];
const noise=()=>{seed=(seed*1664525+1013904223)>>>0;return seed/4294967296;};
const saved=(key,fallback)=>{try{return JSON.parse(localStorage.getItem(key)||'null')??fallback}catch{return fallback}};
function writeStorage(key,val){try{localStorage.setItem(key,JSON.stringify(val));return true}catch{return false}}
function optionsLoaded(){let o=saved(H,{});settings={...defaults,...o};settings.aimAssist=clamp(Number(settings.aimAssist)||0,0,50);upgrades=PH.loadUpgrades(localStorage,U);}
function stat(){return PH.upgradedStats(upgrades);}
function toast(msg,seconds=2.6){if(!dom.toast)return;dom.toast.textContent=msg;dom.toast.classList.remove('hidden');toastTimer=seconds;}
function show(id){$(id).classList.remove('hidden');$(id).classList.add('visible');}
function hide(id){$(id).classList.add('hidden');$(id).classList.remove('visible');}
function getQuality(){if(settings.quality!=='auto')return settings.quality;
 const compact=Math.min(innerWidth,innerHeight)<520;return compact||((navigator.hardwareConcurrency||4)<=4)?'low':'medium';}
function setPerformance(){if(!renderer)return;const q=getQuality(),scale=q==='low'?.64:q==='medium'?.83:1;renderer.setPixelRatio(Math.min(window.devicePixelRatio||1,q==='high'?1.8:1.4)*scale);resize();
 if(asteroidField)asteroidField.visible=q!=='low';if(stars)stars.material.size=q==='low'?.55:.7;}
function resize(){if(!renderer||!camera)return;const w=Math.max(1,innerWidth),h=Math.max(1,innerHeight);renderer.setSize(w,h,false);camera.aspect=w/h;camera.fov=h>w?78:66;camera.updateProjectionMatrix();}
function showFatal(msg){$('errorMessage').textContent=msg;show('loadError');hide('startScreen');}
function begin3D(){
 if(typeof THREE==='undefined'){showFatal('The bundled 3D engine could not load. Please reload or use the original edition.');return false;}
 try{renderer=new THREE.WebGLRenderer({canvas:$('spaceCanvas'),antialias:false,alpha:false,powerPreference:'high-performance'});scene=new THREE.Scene();scene.background=new THREE.Color(0x040916);scene.fog=new THREE.FogExp2(0x07112a,.00058);camera=new THREE.PerspectiveCamera(66,innerWidth/innerHeight,.1,2200);
 renderer.setClearColor(0x040916,1);renderer.outputEncoding=THREE.sRGBEncoding;renderer.toneMapping=THREE.ACESFilmicToneMapping;renderer.toneMappingExposure=1.15;
 scene.add(new THREE.HemisphereLight(0x9eb9ff,0x0b1333,1.3));const sun=new THREE.DirectionalLight(0xb4cdff,1.55);sun.position.set(-80,80,20);scene.add(sun);
 const pink=new THREE.PointLight(0xff539a,.6,230);pink.position.set(70,-15,-100);scene.add(pink);
 createEnvironment();setPerformance();window.addEventListener('resize',resize);
 $('spaceCanvas').addEventListener('webglcontextlost',e=>{e.preventDefault();phase='paused';showFatal('WebGL was interrupted. Reload this page to restore the 3D session; permanent upgrades are saved.');});
 return true;
 }catch(e){console.error('Retroflight WebGL failed',e);showFatal('3D graphics initialization failed: '+e.message);return false;}
}
function createEnvironment(){
 const points=new Float32Array(2000*3),colors=new Float32Array(2000*3);
 for(let i=0;i<2000;i++){let d=200+noise()*950,a=noise()*Math.PI*2,b=Math.acos(noise()*2-1);points[3*i]=Math.sin(b)*Math.cos(a)*d;points[3*i+1]=Math.cos(b)*d;points[3*i+2]=Math.sin(b)*Math.sin(a)*d;const tint=.65+noise()*.35;colors[3*i]=tint*.7;colors[3*i+1]=tint*.85;colors[3*i+2]=tint;}
 const starGeo=new THREE.BufferGeometry();starGeo.setAttribute('position',new THREE.BufferAttribute(points,3));starGeo.setAttribute('color',new THREE.BufferAttribute(colors,3));stars=new THREE.Points(starGeo,new THREE.PointsMaterial({size:.72,vertexColors:true,sizeAttenuation:false}));scene.add(stars);
 planet=new THREE.Mesh(new THREE.SphereGeometry(145,32,18),new THREE.MeshStandardMaterial({color:0x214b80,roughness:1,metalness:0,emissive:0x07133b,emissiveIntensity:.9,flatShading:true}));planet.position.set(-280,115,-880);scene.add(planet);
 moonObject=new THREE.Mesh(new THREE.SphereGeometry(58,18,12),new THREE.MeshStandardMaterial({color:0x8497a8,roughness:1,flatShading:true}));moonObject.visible=false;scene.add(moonObject);
 const atmosphere=new THREE.Mesh(new THREE.SphereGeometry(151,32,16),new THREE.MeshBasicMaterial({color:0x58a2f4,transparent:true,opacity:.075,side:THREE.BackSide}));planet.add(atmosphere);
 asteroidBodies=[];const asteroidGeo=new THREE.IcosahedronGeometry(1,1),asteroidMat=new THREE.MeshStandardMaterial({color:0x5d6980,flatShading:true,roughness:.92});asteroidField=new THREE.InstancedMesh(asteroidGeo,asteroidMat,120);const dummy=new THREE.Object3D();
 for(let i=0;i<120;i++){dummy.position.set((noise()-.5)*390,(noise()-.5)*170,-70-noise()*1050);dummy.scale.setScalar(1+noise()*6);asteroidBodies.push({pos:{x:dummy.position.x,y:dummy.position.y,z:dummy.position.z},radius:dummy.scale.x*.9});dummy.rotation.set(noise()*3,noise()*3,noise()*3);dummy.updateMatrix();asteroidField.setMatrixAt(i,dummy.matrix);}asteroidField.instanceMatrix.needsUpdate=true;scene.add(asteroidField);
 station=new THREE.Group();const iron=new THREE.MeshStandardMaterial({color:0x506487,metalness:.75,roughness:.55});const stationCore=new THREE.Mesh(new THREE.CylinderGeometry(9,9,44,12),iron);stationCore.rotation.z=Math.PI/2;station.add(stationCore);
 for(let i=0;i<3;i++){let ring=new THREE.Mesh(new THREE.TorusGeometry(27+i*7,1.1,6,50),iron);ring.rotation.x=Math.PI*.3+i*.26;ring.rotation.y=Math.PI*.28;station.add(ring);}
 station.position.set(120,-48,-470);scene.add(station);
}
function mat(color,metalness=.7,roughness=.38){return new THREE.MeshStandardMaterial({color,metalness,roughness,flatShading:true,side:THREE.DoubleSide});}
function craftMesh(type='player',armorTier=0){
 const def=type==='player'?{color:0x7ba9c5,scale:1}:enemyTypes[type]||enemyTypes.scout;
 const size=def.scale||1,group=new THREE.Group(),body=mat(def.color),dark=mat(0x1a2545,.58,.5),trim=mat(0x90bbd8),glass=new THREE.MeshStandardMaterial({color:0x18c5f5,emissive:0x1ca6e9,emissiveIntensity:.55,metalness:.5,roughness:.15,transparent:true,opacity:.87});
 const parts=[],engines=[],wings=[],armorPieces=[];
 const mesh=(geo,ma,x,y,z)=>{const m=new THREE.Mesh(geo,ma);m.position.set(x,y,z);m.castShadow=false;group.add(m);parts.push(m);return m;};
 let fuselage=mesh(new THREE.ConeGeometry(1.15,6.2,6),body,0,0,-.6);fuselage.rotation.x=-Math.PI/2;
 mesh(new THREE.BoxGeometry(2.4,.72,3.8),dark,0,-.23,1);
 const canopy=mesh(new THREE.SphereGeometry(.85,10,7),glass,0,.62,-1.2);canopy.scale.set(.88,.6,1.5);
 for(const dir of [-1,1]){
   const wing=mesh(new THREE.BoxGeometry(3.15,.22,1.7),body,dir*2,.02,1.1);wing.rotation.y=dir*.26;wing.rotation.z=dir*.07;wings.push(wing);
   const fin=mesh(new THREE.BoxGeometry(.23,1.2,1.35),trim,dir*1.25,.7,2.25);fin.rotation.z=-dir*.19;
   const engine=mesh(new THREE.CylinderGeometry(.5,.66,2.1,10),dark,dir*.8,-.24,2.5);engine.rotation.x=Math.PI/2;
   const rim=mesh(new THREE.TorusGeometry(.49,.09,6,14),trim,dir*.8,-.24,3.6);engines.push(rim);
   const fire=mesh(new THREE.ConeGeometry(.43,1.7,9),new THREE.MeshBasicMaterial({color:0x64ddff,transparent:true,opacity:.72,depthWrite:false}),dir*.8,-.24,4.35);fire.rotation.x=Math.PI/2;engines.push(fire);
   const nozzle=mesh(new THREE.SphereGeometry(.16,6,4),new THREE.MeshBasicMaterial({color:0xa8efff}),dir*2.1,.09,.5);nozzle.name='maneuver';engines.push(nozzle);
   const armor=mesh(new THREE.BoxGeometry(1.55,.25,2),trim,dir*1.8,.25,1.12);armor.visible=type==='player'&&armorTier>0;armorPieces.push(armor);
   for(let j=0;j<4;j++){const plate=mesh(new THREE.BoxGeometry(.9,.11,.47),j%2?body:trim,dir*(.95+((j%2)*.55)),.39,(-1.7+j*.9));plate.visible=type!=='player'||armorTier>=j+2;armorPieces.push(plate);}
 }
 const gun=mat(0xf1bd71);for(let side of [-1,1]){const rail=mesh(new THREE.CylinderGeometry(.12,.16,2.5,6),gun,side*2.75,-.08,-1);rail.rotation.x=Math.PI/2;}
 if(type==='gunship'||type==='miniboss'||type==='boss'){
   for(let i=-1;i<=1;i+=2){const pod=mesh(new THREE.BoxGeometry(.95,1.15,3.5),dark,i*2.6,-.15,1);pod.rotation.z=i*.18;mesh(new THREE.CylinderGeometry(.23,.23,2.5,8),gun,i*2.6,-.5,-1.4).rotation.x=Math.PI/2;}
 }
 if(type==='boss'){
   for(let i=-2;i<=2;i++){const rib=mesh(new THREE.BoxGeometry(.8,.4,6),i%2?dark:trim,i*1.45,-.25,1.5);rib.rotation.z=i*.07;}
 }
 group.userData={engines,wings,armorPieces,size,type};group.scale.setScalar(size);return group;
}
function animateCraft(mesh,body,t,engineLevel=0){if(!mesh)return;const ud=mesh.userData,force=Math.min(1,body?body.speed()/50:.4);
 ud.engines?.forEach((e,i)=>{if(e.geometry?.type==='ConeGeometry'){e.scale.y=.6+force*.9+Math.sin(t*30+i)*.08;e.material.opacity=.28+force*.62;}else if(e.name==='maneuver')e.scale.setScalar(.95+.2*Math.sin(t*10+i));});
 ud.wings?.forEach((w,i)=>{w.rotation.z=(i===0?-1:1)*(.045+Math.sin(t*2)*.03);});
}
function newPlayer(){
 const s=stat();maxHealth=s.maxHealth;health=maxHealth;shield=0;
 playerBody=new ShipBody({mass:21+upgrades.armor*3.2,inertia:29+upgrades.armor*3.8,radius:2.05,mainThrust:s.mainThrust,strafeThrust:s.strafeThrust,torque:s.torque,maxVelocity:98});
 playerBody.position.z=16;playerMesh=craftMesh('player',upgrades.armor);scene.add(playerMesh);playerMesh.position.set(0,0,16);
 thrusterLight=new THREE.PointLight(0x55cfff,.9,30);playerMesh.add(thrusterLight);thrusterLight.position.set(0,0,4);
}
function resetGame(){
 enemies.forEach(e=>{scene.remove(e.mesh);e.label?.remove();});enemies=[];
 shots.forEach(s=>scene.remove(s.mesh));shots=[];
 powerups.forEach(p=>scene.remove(p.mesh));powerups=[];
 particles.forEach(p=>scene.remove(p.mesh));particles=[];
 if(playerMesh)scene.remove(playerMesh);if(remoteMesh)scene.remove(remoteMesh);
 playerMesh=null;remoteMesh=null;remoteState=null;wave=1;lives=3;score=0;kills=0;killStreak=0;bestStreak=0;waveKills=0;heavyLast=-Infinity;nextEnemy=0;spawnRemaining=0;invincible=0;visualTime=0;roundTimer=0;powerTimers={spread:0,homing:0,rapid:0,overdrive:0};enemyAIData={dodges:0,shots:0,playerSpeed:0};
 joystick={x:0,y:0,active:false,pointer:null};turnStick={x:0,y:0,vertical:0,rollMode:false,active:false,pointer:null,lastTap:-Infinity};manualPointer={x:0,y:0,active:false};
 $('stickThumb').style.transform='translate(0px,0px)';$('turnThumb').style.transform='translate(0px,0px)';$('turnModeHint').textContent='TURN / LOOP';
 newPlayer();startWave(1);
}
function startWave(n){
 wave=n;waveKills=0;gravityBodies=SYS.celestialBodies(n);
 const major=gravityBodies.find(b=>b.id==='planet');if(planet)planet.position.set(major?major.position.x:-280,major?major.position.y:115,major?major.position.z:-880);
 const moon=gravityBodies.find(b=>b.id==='moon'||b.id==='distant-moon');if(moonObject){moonObject.visible=!!moon;if(moon)moonObject.position.set(moon.position.x,moon.position.y,moon.position.z);}
 const extra=(n%5===0)?5:0;spawnRemaining=Math.min(24,5+Math.ceil(n*1.6)+extra);nextEnemy=.8;
 $('waveText').textContent=String(wave).padStart(2,'0');$('locationText').textContent=sectors[(wave-1)%sectors.length];
 $('objectiveText').textContent=n%5===0?'BOSS WAVE · SURVIVE':'DESTROY HOSTILE WAVE';
 if(window.cheatSystem)window.cheatSystem.updateUnlocks(wave);
 toast(`SECTOR ${String(wave).padStart(2,'0')} · ${n%5===0?'BOSS INBOUND':'ENGAGE HOSTILES'}`,2.7);
}
function spawnEnemy(typeOverride){
 let type=typeOverride||'scout';if(!typeOverride){
 const r=noise();if(wave>=10&&spawnRemaining===1&&wave%5===0)type='boss';
 else if(wave>=5&&spawnRemaining===1&&wave%5===0)type='miniboss';
 else if(wave>=4&&r<.26)type='gunship';
 else if(wave>=2&&r<.52)type='interceptor';
 }
 const def=enemyTypes[type];
 const body=new ShipBody({mass:def.mass*1.85,inertia:def.mass*2.8,radius:def.radius,mainThrust:def.mainThrust,strafeThrust:def.strafeThrust,torque:def.torque,maxVelocity:35+(wave*1.5)});
 const spawnOffset=V.make((noise()-.5)*90,(noise()-.5)*52,-62-noise()*65);
 body.position=V.add(playerBody.position,spawnOffset);body.orientation=Q.axisAngle(V.make(0,1,0),Math.PI);
 const enemy={id:`e${Math.round(visualTime*1000)}-${Math.floor(noise()*1e6)}`,type,body,hp:def.hp*(1+(wave-1)*.12),maxHp:def.hp*(1+(wave-1)*.12),mesh:craftMesh(type),label:null,shotTimer:1.1+noise()*2,age:0,movePattern:noise()*6.28,dropChance:.12,remote:false,pilot:SYS.makePilot(type,Math.abs(Math.floor(noise()*4096)))};
 enemy.mesh.position.copy(body.position);enemy.mesh.rotation.y=Math.PI;scene.add(enemy.mesh);
 enemy.label=document.createElement('div');enemy.label.className='health-label';enemy.label.innerHTML='<div class="health-name"></div><div class="health-track"><b></b></div>';enemy.label.querySelector('.health-name').textContent=def.name;$('healthLabels').appendChild(enemy.label);
 enemies.push(enemy);return enemy;
}
function removeEnemy(enemy){const idx=enemies.indexOf(enemy);if(idx>=0)enemies.splice(idx,1);if(enemy.mesh)scene.remove(enemy.mesh);enemy.label?.remove();}
function scoreKill(enemy){
 score+=enemyTypes[enemy.type].score;kills++;waveKills++;killStreak++;bestStreak=Math.max(bestStreak,killStreak);
 if(noise()<enemy.dropChance){spawnPowerup(enemy.body.position);}
 enemyExplosion(enemy.body.position,enemy.type==='boss'?22:enemy.type==='gunship'?12:7);
 playFX('explode');
 removeEnemy(enemy);
 if(kills%8===0)toast(`HEAVY VOLLEY UNLOCKED: ${PH.heavyCount(kills)} PROJECTILES`,2);
}
function damageEnemy(enemy,dmg,impulse){if(enemy.hp<=0)return;enemy.hp=Math.max(0,enemy.hp-dmg);enemy.body.impulse(impulse||V.make());enemy.body.damageImbalance=clamp(1-enemy.hp/enemy.maxHp,0,.6);if(enemy.hp<=0)scoreKill(enemy);}
function takeDamage(amount,origin){if(invincible>0||isCheat('invincible'))return;
 let leftover=amount;if(shield>0){const absorbed=Math.min(shield,leftover);shield-=absorbed;leftover-=absorbed;}
 health=Math.max(0,health-leftover);invincible=.65;hitTimer=.3;$('flightApp').classList.add('hit');killStreak=0;
 if(origin&&playerBody)playerBody.impulse(V.scale(V.normalized(V.sub(playerBody.position,origin)),12));
 if(health<=0){lives--;if(lives>0){health=maxHealth;shield=0;invincible=3;toast(`HULL LOST · ${lives} RESERVE SHIPS`,2.2);}else endGame();}
}
function createShot(pos,direction,owner,heavy=false){
 const mass=heavy?3.2:.45,radius=heavy?.64:.25;
 const origin=V.make(pos.x,pos.y,pos.z);const dir=V.normalized(direction);
 const material=new THREE.MeshBasicMaterial({color:heavy?0xffba79:owner==='player'?0x7dedff:0xff6675});
 const mesh=new THREE.Mesh(new THREE.IcosahedronGeometry(radius,heavy?1:0),material);mesh.position.copy(origin);mesh.scale.z=heavy?2.3:2.6;scene.add(mesh);
 const speed=heavy?64:107;
 const sh={homing:owner==='player'&&!heavy&&(powerTimers.homing>0||isCheat('autotarget')),pos:origin,prev:{...origin},velocity:V.add(V.scale(dir,speed),owner==='player'?V.scale(playerBody.velocity,.35):V.make()),mesh,owner,heavy,mass,radius,damage:owner==='player'?(heavy?27+upgrades.damage*2:stat().regularDamage):8+wave*1.1,life:4};
 shots.push(sh);return sh;
}

function calculateAim(){
 if(!playerBody)return playerBody?.forward()||V.make(0,0,-1);
 const pos=V.add(playerBody.position,V.scale(playerBody.forward(),3.2));
 let manual=playerBody.forward();
 if(manualPointer.active&&camera&&innerWidth>0&&innerHeight>0){
  try{
   const ray=new THREE.Vector3(manualPointer.x,manualPointer.y,.5).unproject(camera).sub(camera.position).normalize();
   manual=V.normalized(V.sub(V.add(camera.position,V.scale(ray,180)),pos));
  }catch{}
 }
 let best=null,bestAngle=.38;
 for(const e of enemies){
  if(e.hp<=0||SYS.obscured(pos,e.body.position,asteroidBodies,.12))continue;
  const angle=SYS.angle(manual,V.sub(e.body.position,pos));
  if(angle<bestAngle){bestAngle=angle;best=e;}
 }
 if(!best){aimState={target:null,direction:manual,lead:null,enabled:false};return manual;}
 const gd=V.sub(SYS.gravityAt(best.body.position,gravityBodies),SYS.gravityAt(pos,gravityBodies));
 const lead=SYS.intercept(pos,V.scale(playerBody.velocity,.35),best.body.position,best.body.velocity,107,gd);
 const result=SYS.assist(manual,lead.direction,clamp(Number(settings.aimAssist)/100,0,.5),.38);
 aimState={target:best,direction:result.direction,lead:lead.predicted,enabled:result.eligible,correction:result.correction,error:result.error};
 return result.direction;
}
function updateAimHUD(){
 if(!camera)return;calculateAim();
 const marker=$('targetLead'),bracket=$('targetLock');
 if(!aimState.target||!aimState.enabled){marker.style.display='none';bracket.style.display='none';$('assistState').textContent='NO TARGET';return;}
 const toScreen=(v)=>new THREE.Vector3(v.x,v.y,v.z).project(camera);
 const hit=toScreen(aimState.lead),ship=toScreen(aimState.target.body.position);
 const valid=(p)=>p.z>=-1&&p.z<=1&&Math.abs(p.x)<=1&&Math.abs(p.y)<=1;
 if(!valid(hit)||!valid(ship)){marker.style.display='none';bracket.style.display='none';return;}
 const place=(el,p)=>{el.style.display='block';el.style.left=((p.x*.5+.5)*innerWidth)+'px';el.style.top=((-p.y*.5+.5)*innerHeight)+'px';};
 place(marker,hit);place(bracket,ship);
 $('assistState').textContent='TARGETLOCK '+settings.aimAssist+'%';
}

function canShoot(){return phase==='flying'&&!pendingStart;}
function singleShot(sendRemote=true){if(!canShoot())return false;
 const pos=V.add(playerBody.position,V.scale(playerBody.forward(),3.2)),direction=calculateAim();createShot(pos,direction,'player',false);enemyAIData.shots++;playFX('laser');
 if(sendRemote&&NET.isConnected())NET.send('fire',{heavy:false,p:copyV(pos),d:copyV(direction)});
 return true;
}
function heavyShot(sendRemote=true){if(!canShoot()||visualTime-heavyLast<PH.heavyCooldown)return false;
 const count=Math.min(16,PH.heavyCount(kills)+(powerTimers.spread>0?2:0)),aim=calculateAim(),side=playerBody.right(),up=playerBody.up();
 for(let i=0;i<count;i++){
  const spread=(i-(count-1)/2)*.075;
  const dir=V.normalized(V.add(aim,V.add(V.scale(side,spread),V.scale(up,Math.sin(i*2.4)*.03))));
  const pos=V.add(playerBody.position,V.add(V.scale(aim,3.4),V.scale(side,spread*8)));
  createShot(pos,dir,'player',true);
 }
 heavyLast=visualTime;playFX('heavy');toast(`${count} HEAVY PROJECTILES DEPLOYED · 40s RECHARGE`,1.7);
 if(sendRemote&&NET.isConnected())NET.send('fire',{heavy:true,p:copyV(playerBody.position),d:copyV(aim),count});
 return true;
}
function enemyShot(enemy){
 const skill=enemy.pilot?.experience||.45;const gRelative=V.sub(SYS.gravityAt(playerBody.position,gravityBodies),SYS.gravityAt(enemy.body.position,gravityBodies));
 const predicted=SYS.intercept(enemy.body.position,enemy.body.velocity,playerBody.position,playerBody.velocity,108,gRelative);
 const jitter=Math.sin(enemy.age*2.37+(enemy.pilot?.errorSeed||0))*(1-skill)*.16;
 const forward=V.normalized(V.add(predicted.direction,V.scale(enemy.body.right(),jitter)));
 createShot(V.add(enemy.body.position,V.scale(forward,enemy.body.radius+1)),forward,'enemy');playFX('enemy');
}
function spawnPowerup(position){const options=['repair','shield','rapid','spread','homing','points','overdrive'];const type=options[Math.floor(noise()*options.length)];
 const geometry=new THREE.OctahedronGeometry(1.05),material=new THREE.MeshStandardMaterial({color:type==='repair'?0x75f1a7:type==='shield'?0x83b5ff:0xffd174,emissive:type==='shield'?0x264aff:0x7d5420,emissiveIntensity:.5,metalness:.1});
 const mesh=new THREE.Mesh(geometry,material);mesh.position.copy(position);scene.add(mesh);powerups.push({type,pos:{...position},mesh,age:0});
}
function collectPowerup(p){switch(p.type){case 'repair':health=Math.min(maxHealth,health+22);toast('REPAIR +22');break;case 'shield':shield=Math.min(100,shield+45);toast('SHIELD +45');break;case 'rapid':powerTimers.rapid=18;toast('RAPID HOLD-FIRE · 18s');break;case 'spread':powerTimers.spread=24;toast('HEAVY VOLLEY SPREAD BOOST · 24s');break;case 'homing':powerTimers.homing=24;toast('HOMING SINGLE SHOTS · 24s');break;case 'points':score+=150;toast('BONUS +150');break;case 'overdrive':powerTimers.overdrive=20;playerBody.velocity=V.add(playerBody.velocity,V.scale(playerBody.forward(),14));toast('THRUSTER OVERDRIVE · 20s');break;}
 scene.remove(p.mesh);powerups.splice(powerups.indexOf(p),1);playFX('powerup');}
function enemyExplosion(position,amount){const hues=[0xff5f78,0xffbb6b,0xffe7a0];for(let i=0;i<Math.min(amount,28);i++){
 const radius=.15+noise()*.45,mesh=new THREE.Mesh(new THREE.TetrahedronGeometry(radius),new THREE.MeshBasicMaterial({color:hues[Math.floor(noise()*hues.length)]}));
 mesh.position.copy(position);scene.add(mesh);particles.push({mesh,vel:V.make((noise()-.5)*18,(noise()-.5)*18,(noise()-.5)*18),life:1+noise()*.7});
}}
function updateEnemies(dt){
 if(roomRole!=='guest'){
 nextEnemy-=dt;if(spawnRemaining>0&&nextEnemy<=0){spawnRemaining--;spawnEnemy();nextEnemy=Math.max(.34,1.1-wave*.035);}
 }
 let sharedTrack=null;
 const obstacles=asteroidBodies.concat([{pos:station?.position||V.make(9999,0,0),radius:27}]).concat(gravityBodies.map(b=>({pos:b.position,radius:b.radius})));
 for(const e of [...enemies]){
  e.age+=dt;if(!e.remote){
   const distance=V.distance(playerBody.position,e.body.position);
   if(distance>380||e.age>125){removeEnemy(e);continue;}
   if(!e.pilot)e.pilot=SYS.makePilot(e.type,enemies.indexOf(e)+wave*7);
   const decision=SYS.pilotStep(e.pilot,e,playerBody,{obstacles,gravityBodies,sharedTrack},dt);
   if(decision.seen)sharedTrack={position:{...playerBody.position},velocity:{...playerBody.velocity}};
   e.body.step(decision.input,dt,{assist:true,stabilization:e.pilot.experience>0.7?2.2:1.25,gravityAcceleration:decision.gravity});
   const impact=SYS.celestialContact(e.body,gravityBodies);
   if(impact>3){e.hp=Math.max(0,e.hp-impact*.42);e.body.damageImbalance=clamp(1-e.hp/e.maxHp,0,.65);if(e.hp<=0){scoreKill(e);continue;}}
   e.shotTimer-=dt;
   if(e.shotTimer<=0&&decision.canFire){enemyShot(e);e.shotTimer=1.2+noise()*2.5+(.8-e.pilot.experience);}
   if(distance<e.body.radius+playerBody.radius+1){const hit=sphereContact(e.body,playerBody,.22);
    if(hit?.impactSpeed>1){takeDamage(Math.max(5,hit.impactSpeed*.32),e.body.position);e.hp-=hit.impactSpeed*.55;e.body.damageImbalance=clamp(1-e.hp/e.maxHp,0,.65);if(e.hp<=0){scoreKill(e);continue;}}}
  }
  e.mesh.position.set(e.body.position.x,e.body.position.y,e.body.position.z);
  e.mesh.quaternion.set(e.body.orientation.x,e.body.orientation.y,e.body.orientation.z,e.body.orientation.w);
  if(!e.remote)animateCraft(e.mesh,e.body,visualTime);
 }
 if(spawnRemaining===0&&enemies.length===0&&phase==='flying'&&roomRole!=='guest')completeWave();
}
function updateShots(dt){
 for(let i=shots.length-1;i>=0;i--){const s=shots[i];s.life-=dt;s.prev={...s.pos};
  if(s.homing&&enemies.length){let nearest=null,best=Infinity;for(const e of enemies){const d=V.distance(s.pos,e.body.position);if(d<best){best=d;nearest=e;}}if(nearest){const target=V.normalized(V.sub(nearest.body.position,s.pos)),old=V.normalized(s.velocity),steer=V.normalized(V.add(V.scale(old,1-dt*2),V.scale(target,dt*2)));s.velocity=V.scale(steer,V.length(s.velocity));}}
  s.velocity=V.add(s.velocity,V.scale(SYS.gravityAt(s.pos,gravityBodies),dt));s.pos=V.add(s.pos,V.scale(s.velocity,dt));s.mesh.position.set(s.pos.x,s.pos.y,s.pos.z);
  let hit=false;
  if(s.owner==='player'||s.owner==='remote'){
   for(const e of [...enemies]){if(raySphere(s.prev,s.pos,e.body.position,e.body.radius+s.radius)){
     if(!e.remote||roomRole==='guest'){if(isCheat('onehitkill'))damageEnemy(e,e.hp,V.scale(s.velocity,s.mass*.3));else damageEnemy(e,s.damage,V.scale(V.normalized(s.velocity),s.mass*4));}
     hit=true;break;}}
  }else if(raySphere(s.prev,s.pos,playerBody.position,playerBody.radius+s.radius)){takeDamage(s.damage,s.pos);hit=true;}
  if(hit||s.life<=0||V.distance(s.pos,playerBody.position)>290){scene.remove(s.mesh);shots.splice(i,1);}
 }
}
function updateObjects(dt){
 for(const p of [...powerups]){p.age+=dt;p.mesh.rotation.y+=dt*1.5;p.mesh.position.y=p.pos.y+Math.sin(p.age*2)*.55;
  if(V.distance(p.pos,playerBody.position)<4)collectPowerup(p);
  else if(p.age>28){scene.remove(p.mesh);powerups.splice(powerups.indexOf(p),1);}}
 for(let i=particles.length-1;i>=0;i--){const p=particles[i];p.life-=dt;p.vel=V.add(p.vel,V.scale(SYS.gravityAt(p.mesh.position,gravityBodies),dt));p.mesh.position.addScaledVector(p.vel,dt);p.mesh.rotation.x+=dt*3;p.mesh.scale.setScalar(Math.max(.01,p.life));if(p.life<=0){scene.remove(p.mesh);particles.splice(i,1);}}
 if(station)station.rotation.z+=dt*.012;
 if(planet)planet.rotation.y+=dt*.006;
}
function completeWave(){if(phase!=='flying')return;phase='upgrade';show('upgradeScreen');updateUpgradeUI();playFX('win');
 NET.send('waveComplete',{wave,score,kills});
}
function chooseUpgrade(which){if(phase!=='upgrade'||!['armor','damage','thrusters'].includes(which))return;
 upgrades[which]=clamp(upgrades[which]+1,0,100);writeStorage(U,upgrades);
 const s=stat();if(which==='armor'){
  const oldMax=maxHealth;maxHealth=s.maxHealth;health=Math.min(maxHealth,health+(maxHealth-oldMax)+14);
  playerBody.mass+=3.2;playerBody.inertia+=3.8;playerMesh.userData.armorPieces.forEach((part,i)=>part.visible=i<Math.min(2+upgrades.armor*2,10));
 }else{playerBody.mainThrust=s.mainThrust;playerBody.strafeThrust=s.strafeThrust;playerBody.torque=s.torque;health=Math.min(maxHealth,health+10);}
 hide('upgradeScreen');phase='flying';startWave(wave+1);refreshPreview();
}
function updateUpgradeUI(){['armor','damage','thrusters'].forEach(k=>{const id='level'+k[0].toUpperCase()+k.slice(1);$(id).textContent=`LEVEL ${upgrades[k]}`;});}
function refreshPreview(){const s=stat();$('previewArmor').textContent=s.maxHealth;$('previewDamage').textContent=s.regularDamage;$('previewThrust').textContent=s.mainThrust;$('previewLevels').textContent=upgrades.armor+upgrades.damage+upgrades.thrusters;}
function endGame(){if(phase==='gameover')return;phase='gameover';$('endScore').textContent=score.toLocaleString();$('endKills').textContent=kills;$('endWave').textContent=wave-1;show('gameOverScreen');NET.send('playerDown',{score,kills});}
function copyV(a){return {x:Math.round(a.x*1000)/1000,y:Math.round(a.y*1000)/1000,z:Math.round(a.z*1000)/1000};}
function validV(v){return v&&['x','y','z'].every(k=>Number.isFinite(v[k])&&Math.abs(v[k])<10000);}
function isCheat(name){return !!window.cheatSystem?.isCheatActive(name);}
function simulate(dt){
 visualTime+=dt;
 const left=keys.has('KeyA'),right=keys.has('KeyD'),up=keys.has('ArrowUp'),down=keys.has('ArrowDown');
 const input={
 forward:clamp((keys.has('KeyW')?1:0)-(keys.has('KeyS')?1:0)-(joystick.active&&!joystick.liftMode?joystick.y:0),-1,1),
 strafe:clamp((right?1:0)-(left?1:0)+(joystick.active?joystick.x:0),-1,1),
 vertical:clamp((keys.has('KeyR')?1:0)-(keys.has('KeyF')?1:0)+turnStick.vertical-(joystick.active&&joystick.liftMode?joystick.y:0),-1,1),
 yaw:clamp((keys.has('ArrowLeft')?1:0)-(keys.has('ArrowRight')?1:0)-(turnStick.active&&!turnStick.rollMode?turnStick.x:0),-1,1),
 pitch:clamp((up?1:0)-(down?1:0)-(turnStick.active?turnStick.y:0),-1,1),
 roll:clamp((keys.has('KeyQ')?1:0)-(keys.has('KeyE')?1:0)+(turnStick.active&&turnStick.rollMode?turnStick.x:0),-1,1)
 };
 const arcade=settings.mode==='arcade',stabilized=settings.mode!=='authentic';
 const playerStats=stat();playerBody.mainThrust=playerStats.mainThrust*(powerTimers.overdrive>0?1.4:1);
 playerBody.step(input,dt,{assist:stabilized,stabilization:arcade?8:3.4,dampLinear:arcade,gravityAcceleration:SYS.gravityAt(playerBody.position,gravityBodies)});
 for(const key of Object.keys(powerTimers))powerTimers[key]=Math.max(0,powerTimers[key]-dt);
 // Deep-space waves keep arcade arena rails; planetary waves allow real, unbounded orbital flight.
 if(gravityBodies.length===0){
 for(const axis of ['x','y','z']){const range=axis==='z'?115:axis==='x'?95:64;
  if(playerBody.position[axis]>range){playerBody.position[axis]=range;playerBody.velocity[axis]=Math.min(0,playerBody.velocity[axis])*.38;}
  if(playerBody.position[axis]<-range){playerBody.position[axis]=-range;playerBody.velocity[axis]=Math.max(0,playerBody.velocity[axis])*.38;}}
 }else{
  const surfaceImpact=SYS.celestialContact(playerBody,gravityBodies);
  if(surfaceImpact>4)takeDamage(Math.min(26,surfaceImpact*.42),gravityBodies[0].position);
 }
 // Nearby physical asteroid impacts include collision response and hull damage.
 for(const rock of asteroidBodies){const delta=V.sub(playerBody.position,rock.pos),distance=V.length(delta),separation=playerBody.radius+rock.radius;if(distance<separation){const normal=distance>1e-6?V.scale(delta,1/distance):V.make(0,1,0),speedIn=V.dot(playerBody.velocity,normal);playerBody.position=V.add(rock.pos,V.scale(normal,separation+.02));if(speedIn<0){playerBody.velocity=V.sub(playerBody.velocity,V.scale(normal,1.35*speedIn));if(Math.abs(speedIn)>3)takeDamage(Math.abs(speedIn)*.46,rock.pos);}}}
 playerMesh.position.set(playerBody.position.x,playerBody.position.y,playerBody.position.z);
 playerMesh.quaternion.set(playerBody.orientation.x,playerBody.orientation.y,playerBody.orientation.z,playerBody.orientation.w);
 animateCraft(playerMesh,playerBody,visualTime,upgrades.thrusters);
 if(thrusterLight)thrusterLight.intensity=.5+Math.min(2,playerBody.speed()/40);
 if(invincible>0)invincible-=dt;if(hitTimer>0){hitTimer-=dt;if(hitTimer<=0)$('flightApp').classList.remove('hit');}
 if(autoFire){roundTimer-=dt;if(roundTimer<=0){singleShot();roundTimer=(isCheat('rapidfire')||powerTimers.rapid>0)?.065:.13;}}
 updateEnemies(dt);updateShots(dt);updateObjects(dt);
 if(toastTimer>0){toastTimer-=dt;if(toastTimer<=0)dom.toast.classList.add('hidden');}
 netSendTimer+=dt;if(NET.isConnected()&&netSendTimer>.12){netSendTimer=0;
  NET.send('player',{p:copyV(playerBody.position),q:{...playerBody.orientation},v:copyV(playerBody.velocity),hp:health,lives});
  if(roomRole==='host')NET.send('snapshot',{wave,spawnRemaining,score,kills,ships:enemies.map(e=>({id:e.id,type:e.type,p:copyV(e.body.position),q:{...e.body.orientation},hp:e.hp,maxHp:e.maxHp})),projectiles:shots.filter(s=>s.owner==='enemy').slice(0,40).map(s=>({p:copyV(s.pos)}))});
 }
}
function moveCamera(dt){if(!playerBody)return;
 const pos=playerBody.position,forward=playerBody.forward(),up=playerBody.up(),side=playerBody.right();
 let desired,focus;
 if(settings.camera==='cockpit'){
  desired=V.add(pos,V.add(V.scale(up,.7),V.scale(forward,1.15)));focus=V.add(desired,V.scale(forward,65));
 }else if(settings.camera==='cinematic'){
  desired=V.add(pos,V.add(V.scale(side,16),V.add(V.scale(up,8),V.scale(forward,-20))));focus=V.add(pos,V.scale(forward,14));
 }else{
  desired=V.add(pos,V.add(V.scale(up,6.2),V.scale(forward,-15)));focus=V.add(pos,V.scale(forward,26));
 }
 const factor=1-Math.exp(-Math.min(dt,.1)*5);camera.position.lerp(new THREE.Vector3(desired.x,desired.y,desired.z),factor);
 camera.lookAt(focus.x,focus.y,focus.z);
 const speed=playerBody.speed();camera.fov=clamp((innerHeight>innerWidth?78:66)+speed*.065,65,88);camera.updateProjectionMatrix();
 // Real ship stays visible in chase/cinematic, cockpit uses viewpoint inside the hull.
 if(playerMesh)playerMesh.visible=settings.camera!=='cockpit';
}
function renderLabels(){if(!camera||!renderer)return;const w=innerWidth,h=innerHeight;
 enemies.forEach(e=>{if(!e.label)return;if(!settings.healthLabels||V.distance(e.body.position,camera.position)>210){e.label.style.display='none';return;}
 const v=new THREE.Vector3(e.body.position.x,e.body.position.y+e.body.radius*1.5,e.body.position.z).project(camera);
 if(v.z>1||v.z< -1||Math.abs(v.x)>1.05||Math.abs(v.y)>1.05){e.label.style.display='none';return;}
 e.label.style.display='block';e.label.style.left=`${(v.x*.5+.5)*w}px`;e.label.style.top=`${(-v.y*.5+.5)*h}px`;
 e.label.querySelector('.health-track b').style.width=`${Math.round(clamp(e.hp/e.maxHp,0,1)*100)}%`;
 });}
function hud(){
 $('healthText').textContent=`${Math.round(health)} / ${maxHealth}`;$('healthFill').style.width=`${clamp(health/maxHealth*100,0,100)}%`;
 $('shieldText').textContent=`${Math.round(shield)}%`;$('shieldFill').style.width=`${clamp(shield,0,100)}%`;
 $('livesText').textContent=lives;$('waveText').textContent=String(wave).padStart(2,'0');$('scoreText').textContent=String(score).padStart(6,'0');$('killsText').textContent=kills;
 $('velocityText').textContent=Math.round(playerBody?.speed()||0);
 if(playerBody)$('gravityReadout').textContent='GRAVITY '+SYS.gravityAt(playerBody.position,gravityBodies).x.toFixed(1)+' / '+SYS.gravityAt(playerBody.position,gravityBodies).y.toFixed(1)+' / '+SYS.gravityAt(playerBody.position,gravityBodies).z.toFixed(1)+' u/s²';$('flightModeLabel').textContent=settings.mode.toUpperCase();
 const left=Math.max(0,PH.heavyCooldown-(visualTime-heavyLast));$('heavyCount').textContent=`×${PH.heavyCount(kills)}`;$('heavyStatus').textContent=left>0?`${left.toFixed(1)}s`:'READY';
 $('specialIndicator').classList.toggle('cooling',left>0);$('mobileCooldown').textContent=left>0?`${Math.ceil(left)}s`:'READY';$('fireHeavyMobile').disabled=left>0||phase!=='flying';
 $('fireOneMobile').disabled=phase!=='flying';
}
function frameLoop(now){requestAnimationFrame(frameLoop);
 if(!lastTime)lastTime=now;let dt=Math.min(.065,(now-lastTime)/1000||0);lastTime=now;
 if(phase==='flying'){
  accumulator=Math.min(.12,accumulator+dt);let frames=0;
  while(accumulator>=1/60&&frames<5&&phase==='flying'){simulate(1/60);accumulator-=1/60;frames++;}
 }else{
  accumulator=0;
  if(phase==='menu'&&stars)stars.rotation.y+=dt*.002;
  if(phase==='upgrade'&&toastTimer>0){toastTimer-=dt;if(toastTimer<=0)dom.toast.classList.add('hidden');}
 }
 if(renderer&&scene&&camera){if(playerBody)moveCamera(dt);else{camera.position.set(0,6,24);camera.lookAt(0,0,-80);}renderer.render(scene,camera);}
 uiTimer+=dt;if(uiTimer>.085){uiTimer=0;if(playerBody)hud();if(renderer){renderLabels();updateAimHUD();}}
}
function start(){if(!renderer)return;
 hide('startScreen');hide('settingsScreen');hide('gameOverScreen');hide('upgradeScreen');hide('cheatsScreen');hide('audioScreen');hide('multiplayerScreen');
 resetGame();phase='flying';$('hud').classList.remove('hidden');$('crosshairInfo').classList.remove('hidden');$('specialIndicator').classList.remove('hidden');
 $('touchControls').classList.toggle('hidden',!isTouchUI());$('reticle').style.display='block';pendingStart=false;playMusic();
}
function isTouchUI(){return matchMedia('(pointer:coarse)').matches||('ontouchstart' in window&&innerWidth<=1100);}
function pause(){if(phase!=='flying')return;phase='paused';$('modeSelect').value=settings.mode;$('cameraSelect').value=settings.camera;show('settingsScreen');}
function resume(){if(phase==='paused'){phase='flying';hide('settingsScreen');$('spaceCanvas').focus({preventScroll:true});}else if(phase==='menu')hide('settingsScreen');}
function settingsOpen(){if(phase==='flying'){pause();return;}show('settingsScreen');}
function settingsChanged(){settings.mode=$('modeSelect').value;settings.camera=$('cameraSelect').value;settings.quality=$('qualitySelect').value;settings.look=$('lookSelect').value;settings.volume=Number($('volumeSlider').value);settings.healthLabels=$('healthLabelsToggle').checked;settings.aimAssist=clamp(Number($('aimAssistSlider').value),0,50);
 writeStorage(H,settings);applySettings();}
function applySettings(){document.body.classList.toggle('look-crt',settings.look==='crt');renderer&&(renderer.toneMappingExposure=settings.look==='cinematic'?1.45:1.15);
 $('volumeOut').textContent=settings.volume+'%';$('aimAssistOut').textContent=settings.aimAssist+'%';if(bgm)bgm.volume=settings.volume/100*.5;setPerformance();}
function setupInput(){
 document.addEventListener('keydown',e=>{
  const typing=['INPUT','SELECT','TEXTAREA'].includes(document.activeElement?.tagName);
  if(typing)return;
  if(['Space','ArrowUp','ArrowDown','ArrowLeft','ArrowRight'].includes(e.code))e.preventDefault();
  if(e.code==='Escape'||e.code==='KeyP'){if(!e.repeat){if(phase==='flying')pause();else if(phase==='paused')resume();}return;}
  if(e.code==='KeyC'&&!e.repeat){settings.camera=settings.camera==='chase'?'cockpit':settings.camera==='cockpit'?'cinematic':'chase';$('cameraSelect').value=settings.camera;settingsChanged();return;}
  if(e.code==='KeyH'&&!e.repeat){settingsOpen();show('cheatsScreen');return;}
  if(e.code==='Space'&&phase==='flying'&&!e.repeat){singleShot();autoFire=true;roundTimer=.16;}
  if((e.code==='ShiftLeft'||e.code==='ShiftRight')&&!e.repeat)heavyShot();
  keys.add(e.code);
 });
 document.addEventListener('keyup',e=>{keys.delete(e.code);if(e.code==='Space')autoFire=false;});
 window.addEventListener('blur',()=>{keys.clear();autoFire=false;if(phase==='flying')pause();});
 document.addEventListener('visibilitychange',()=>{if(document.hidden&&phase==='flying')pause();});
 const area=$('stickArea'),thumb=$('stickThumb');
 function moveStick(e){const rect=area.querySelector('.stick-base').getBoundingClientRect(),cx=rect.left+rect.width/2,cy=rect.top+rect.height/2,r=rect.width*.3;
  let dx=e.clientX-cx,dy=e.clientY-cy;const len=Math.hypot(dx,dy);if(len>r){dx=dx/len*r;dy=dy/len*r;}
  joystick.x=dx/r;joystick.y=dy/r;joystick.active=true;thumb.style.transform='translate('+dx+'px,'+dy+'px)';}
 area.addEventListener('pointerdown',e=>{
  if(phase!=='flying')return;e.preventDefault();
  if(e.timeStamp-joystick.lastTap<310){joystick.liftMode=!joystick.liftMode;joystick.lastTap=-Infinity;$('moveModeHint').textContent=joystick.liftMode?'LIFT / STRAFE':'THRUST / STRAFE';}
  else joystick.lastTap=e.timeStamp;
  joystick.pointer=e.pointerId;try{area.setPointerCapture(e.pointerId);}catch{}moveStick(e);});
 area.addEventListener('pointermove',e=>{if(e.pointerId===joystick.pointer){e.preventDefault();moveStick(e);}});
 function stopStick(e){if(joystick.pointer!==e.pointerId)return;joystick.pointer=null;joystick.x=0;joystick.y=0;joystick.active=false;thumb.style.transform='translate(0px,0px)';}
 area.addEventListener('pointerup',stopStick);area.addEventListener('pointercancel',stopStick);area.addEventListener('lostpointercapture',stopStick);
 const turnArea=$('turnArea'),turnThumb=$('turnThumb'),pointers=new Map();
 let twoFingerOrigin=null;
 function turnMove(e){const rect=turnArea.querySelector('.turn-base').getBoundingClientRect(),cx=rect.left+rect.width/2,cy=rect.top+rect.height/2,r=rect.width*.30;
  let dx=e.clientX-cx,dy=e.clientY-cy;const len=Math.hypot(dx,dy);if(len>r){dx=dx/len*r;dy=dy/len*r;}
  turnStick.x=dx/r;turnStick.y=dy/r;turnStick.active=true;turnThumb.style.transform='translate('+dx+'px,'+dy+'px)';}
 function fingerVertical(){
  if(pointers.size<2){twoFingerOrigin=null;turnStick.vertical=0;return;}
  const ys=[...pointers.values()].map(p=>p.y),avg=(ys[0]+ys[1])/2;
  if(twoFingerOrigin===null)twoFingerOrigin=avg;
  turnStick.vertical=clamp((twoFingerOrigin-avg)/70,-1,1);
  $('turnModeHint').textContent='LIFT '+(turnStick.vertical>=0?'↑':'↓');
 }
 turnArea.addEventListener('pointerdown',e=>{
  if(phase!=='flying')return;e.preventDefault();
  const had=pointers.size;
  if(!had&&e.timeStamp-turnStick.lastTap<310){
    turnStick.rollMode=!turnStick.rollMode;
    $('turnModeHint').textContent=turnStick.rollMode?'ROLL / LOOP':'TURN / LOOP';
    turnStick.lastTap=-Infinity;
  }else if(!had)turnStick.lastTap=e.timeStamp;
  pointers.set(e.pointerId,{x:e.clientX,y:e.clientY});
  try{turnArea.setPointerCapture(e.pointerId);}catch{}
  if(pointers.size===1){turnStick.pointer=e.pointerId;turnMove(e);}else fingerVertical();
 });
 turnArea.addEventListener('pointermove',e=>{
  if(!pointers.has(e.pointerId))return;e.preventDefault();
  pointers.set(e.pointerId,{x:e.clientX,y:e.clientY});
  if(pointers.size>=2)fingerVertical();else if(turnStick.pointer===e.pointerId)turnMove(e);
 });
 function turnStop(e){
  if(!pointers.has(e.pointerId))return;pointers.delete(e.pointerId);
  if(!pointers.size){turnStick.active=false;turnStick.pointer=null;turnStick.x=0;turnStick.y=0;turnStick.vertical=0;twoFingerOrigin=null;turnThumb.style.transform='translate(0px,0px)';$('turnModeHint').textContent=turnStick.rollMode?'ROLL / LOOP':'TURN / LOOP';}
  else{turnStick.pointer=[...pointers.keys()][0];turnStick.vertical=0;twoFingerOrigin=null;}
 }
 turnArea.addEventListener('pointerup',turnStop);turnArea.addEventListener('pointercancel',turnStop);turnArea.addEventListener('lostpointercapture',turnStop);
 $('fireOneMobile').addEventListener('pointerdown',e=>{e.preventDefault();singleShot();});
 $('fireHeavyMobile').addEventListener('pointerdown',e=>{e.preventDefault();heavyShot();});
 $('spaceCanvas').addEventListener('pointermove',e=>{
  if(e.pointerType!=='mouse'||phase!=='flying')return;
  const rect=$('spaceCanvas').getBoundingClientRect();
  manualPointer={x:clamp((e.clientX-rect.left)/rect.width*2-1,-1,1),y:clamp(1-(e.clientY-rect.top)/rect.height*2,-1,1),active:true};
  $('reticle').style.left=e.clientX+'px';$('reticle').style.top=e.clientY+'px';
 });
 window.addEventListener('resize',()=>{$('touchControls').classList.toggle('hidden',phase==='menu'||!isTouchUI());});
}
function bindUI(){
 $('startBtn').addEventListener('click',()=>{unlockAudio();start();});$('retryBtn').addEventListener('click',()=>start());$('menuBtn').addEventListener('click',()=>{hide('gameOverScreen');hide('upgradeScreen');hide('hud');hide('crosshairInfo');hide('specialIndicator');hide('touchControls');if(playerMesh)scene.remove(playerMesh);playerMesh=null;playerBody=null;phase='menu';show('startScreen');refreshPreview();});
 $('startSettings').addEventListener('click',settingsOpen);$('pauseBtn').addEventListener('click',pause);$('resumeBtn').addEventListener('click',resume);$('closeSettings').addEventListener('click',resume);
 document.querySelectorAll('.upgrade-card').forEach(b=>b.addEventListener('click',()=>chooseUpgrade(b.dataset.upgrade)));
 ['modeSelect','cameraSelect','qualitySelect','lookSelect','healthLabelsToggle','volumeSlider','aimAssistSlider'].forEach(id=>{$(id).addEventListener(id==='volumeSlider'?'input':'change',settingsChanged);});
 $('openMultiplayer').addEventListener('click',()=>show('multiplayerScreen'));
 $('openCustomAudio').addEventListener('click',()=>show('audioScreen'));
 $('openCheats').addEventListener('click',()=>show('cheatsScreen'));
 document.querySelectorAll('[data-close]').forEach(b=>b.addEventListener('click',()=>hide(b.dataset.close)));
 $('hostBtn').addEventListener('click',async()=>{try{$('roomStatus').textContent='CONNECTING…';const code=await NET.createHost();roomRole='host';$('roomCodeInput').value=code;$('roomStatus').textContent=`HOST READY · ${code}`;}catch(e){$('roomStatus').textContent=e.message;}});
 $('joinBtn').addEventListener('click',async()=>{const code=$('roomCodeInput').value.trim();if(!code){$('roomStatus').textContent='ENTER A ROOM CODE';return;}try{$('roomStatus').textContent='CONNECTING…';await NET.join(code);roomRole='guest';$('roomStatus').textContent='JOINED · '+code;}catch(e){$('roomStatus').textContent=e.message;}});
 $('disconnectBtn').addEventListener('click',()=>{NET.disconnect();roomRole='solo';$('roomStatus').textContent='DISCONNECTED';});
 $('activateCheat').addEventListener('click',()=>{const code=$('cheatCodeInput').value.toUpperCase().trim();if(!window.cheatSystem){$('cheatStatus').textContent='CHEAT SYSTEM UNAVAILABLE';return;}
  const before=window.cheatSystem.getActiveCheats().length;for(const key of code)window.cheatSystem.handleCheatKey({key});window.cheatSystem.handleCheatKey({key:'Enter'});
  const after=window.cheatSystem.getActiveCheats().length;
  if(after>before){if(code==='LIFEUP')lives++;$('cheatStatus').textContent='ACTIVATED · '+code;}else $('cheatStatus').textContent='LOCKED, INVALID OR ALREADY ACTIVE';
  $('cheatCodeInput').value='';});
 $('saveAudio').addEventListener('click',saveAudioSelection);
}
async function saveAudioSelection(){const file=$('audioFileInput').files[0],choice=$('bgmSelect').value;
 if(choice==='custom'&&file){if(!file.type.startsWith('audio/')){$('audioStatus').textContent='SELECT A VALID AUDIO FILE';return;}
  try{const id='retro_custom_bgm';await window.userAssets.save(id,file);writeStorage('retroflight-custom-audio',id);$('audioStatus').textContent='CUSTOM SOUND SAVED LOCALLY';}catch(e){$('audioStatus').textContent='CANNOT SAVE FILE: '+e.message;return;}
 }else if(choice==='custom'&&!localStorage.getItem('retroflight-custom-audio')){$('audioStatus').textContent='CHOOSE AN AUDIO FILE FIRST';return;}
 writeStorage('retroflight-bgm-choice',choice);$('audioStatus').textContent='SOUND CHOICE SAVED';await playMusic(true);
}
function unlockAudio(){try{if(!audioCtx){audioCtx=new (window.AudioContext||window.webkitAudioContext)();}if(audioCtx.state==='suspended')audioCtx.resume();}catch{}}
function playFX(name){if(!audioCtx||settings.volume===0)return;
 try{const t=audioCtx.currentTime,osc=audioCtx.createOscillator(),gain=audioCtx.createGain();
  osc.type=name==='heavy'?'sawtooth':name==='explode'?'triangle':'square';
  const freq=name==='laser'?530:name==='enemy'?220:name==='heavy'?150:name==='win'?760:name==='powerup'?900:90;
  osc.frequency.setValueAtTime(freq,t);osc.frequency.exponentialRampToValueAtTime(Math.max(30,freq*(name==='powerup'?1.4:.34)),t+.18);
  gain.gain.setValueAtTime(.001,t);gain.gain.exponentialRampToValueAtTime(.04*(settings.volume/100),t+.015);
  gain.gain.exponentialRampToValueAtTime(.001,t+(name==='heavy'?.33:.21));osc.connect(gain);gain.connect(audioCtx.destination);osc.start(t);osc.stop(t+(name==='heavy'?.35:.22));
 }catch(e){console.warn('Audio playback unavailable',e);}
}
async function playMusic(force=false){if(!audioCtx)return;let choice=saved('retroflight-bgm-choice','default');if(force&&bgm){bgm.pause();bgm=null;}
 if(bgm)return;let src='sounds/universfield-horror-background-atmosphere-156462.mp3';
 if(choice==='phaser')src='sounds/phaser.mp3';
 if(choice==='custom'){try{const id=saved('retroflight-custom-audio',null);if(id&&window.userAssets){const blob=await window.userAssets.load(id);if(blob){if(userBgmUrl)URL.revokeObjectURL(userBgmUrl);userBgmUrl=window.userAssets.blobToURL(blob);src=userBgmUrl;}}}catch(e){console.warn('Custom audio not available',e);}}
 bgm=new Audio(src);bgm.loop=true;bgm.volume=settings.volume/100*.5;bgm.play().catch(()=>{});
}
function networkData(msg){
 if(msg.type==='connected'){toast('CO-OP PEER CONNECTED');return;}
 if(msg.type==='player'&&validV(msg.p)&&msg.q&&['x','y','z','w'].every(k=>Number.isFinite(msg.q[k]))){remoteState=msg;
   if(!remoteMesh){remoteMesh=craftMesh('player',upgrades.armor);scene.add(remoteMesh);}
   remoteMesh.position.set(msg.p.x,msg.p.y,msg.p.z);remoteMesh.quaternion.set(msg.q.x,msg.q.y,msg.q.z,msg.q.w);return;}
 if(msg.type==='fire'&&roomRole==='host'&&validV(msg.p)&&validV(msg.d)){
  const origin=remoteState?.p||msg.p,dir=V.normalized(msg.d);
  const amount=msg.heavy?clamp(Number(msg.count)||1,1,PH.heavyCount(kills)):1;
  for(let j=0;j<amount;j++){let spread=(j-(amount-1)/2)*.075;let shot=createShot(origin,V.normalized(V.add(dir,V.make(spread,0,0))),'remote',!!msg.heavy);shot.damage=msg.heavy?27:stat().regularDamage;}
 }
 if(msg.type==='snapshot'&&roomRole==='guest'&&Array.isArray(msg.ships)){
  const current=new Set();for(const data of msg.ships.slice(0,40)){
   if(!validV(data.p)||!enemyTypes[data.type]||!Number.isFinite(data.hp))continue;
   let enemy=enemies.find(e=>e.id===data.id);if(!enemy){enemy=spawnEnemy(data.type);enemy.id=data.id;enemy.remote=true;}
   enemy.maxHp=Math.max(1,Number(data.maxHp)||enemy.maxHp);enemy.hp=clamp(data.hp,0,enemy.maxHp);enemy.body.position={...data.p};
   if(data.q&&['x','y','z','w'].every(k=>Number.isFinite(data.q[k])))enemy.body.orientation=Q.normalize(data.q);
   current.add(enemy.id);
  }for(const enemy of [...enemies])if(!current.has(enemy.id))removeEnemy(enemy);
  if(Number.isInteger(msg.wave)&&msg.wave>0&&msg.wave!==wave&&phase==='flying'){wave=msg.wave;$('waveText').textContent=String(wave).padStart(2,'0');}
 }
 if(msg.type==='waveComplete'&&roomRole==='guest'&&phase==='flying')completeWave();
 if(msg.type==='playerDown')toast('CO-OP PILOT HAS LOST ALL HULLS');
}
function init(){for(const el of document.querySelectorAll('[id]'))dom[el.id]=el;
 optionsLoaded();for(const [field,id] of [['mode','modeSelect'],['camera','cameraSelect'],['quality','qualitySelect'],['look','lookSelect']])$(id).value=settings[field];
 $('healthLabelsToggle').checked=settings.healthLabels;$('aimAssistSlider').value=settings.aimAssist;$('volumeSlider').value=settings.volume;$('volumeOut').textContent=settings.volume+'%';
 refreshPreview();bindUI();setupInput();NET.onStatus(s=>{$('roomStatus').textContent=s;});NET.onData(networkData);
 window.closeCheatMenu=()=>hide('cheatsScreen');
 if(!begin3D())return;applySettings();$('spaceCanvas').addEventListener('pointerdown',()=>unlockAudio());requestAnimationFrame(frameLoop);
}
document.addEventListener('DOMContentLoaded',init);
// A development-only deterministic harness is accessible on localhost, never on the deployed host.
if(window.__RETROFLIGHT_TEST__===true||(['localhost','127.0.0.1'].includes(location.hostname)&&new URLSearchParams(location.search).has('test'))){
 window.RetroflightTestHarness={finishWave:()=>{if(phase!=='flying')return;spawnRemaining=0;[...enemies].forEach(removeEnemy);completeWave();},setKills:n=>{kills=clamp(Math.floor(n),0,1000);hud();},advanceSeconds:s=>{visualTime+=clamp(s,0,100);hud();},spawnEnemy:type=>spawnEnemy(type),damageEnemy:(id,amount)=>{const e=enemies.find(x=>x.id===id);if(e)damageEnemy(e,amount,V.make());},getBody:()=>playerBody&&({position:{...playerBody.position},velocity:{...playerBody.velocity},angularVelocity:{...playerBody.angularVelocity}})};
}
// Read-only diagnostics for automated smoke testing, not a cheat or mutation interface.
window.RetroflightStatus=()=>({phase,wave,score,kills,lives,health,maxHealth,gravitySources:gravityBodies.length,aimTarget:aimState.target?.id||null,aimStrength:settings.aimAssist,rollMode:turnStick.rollMode,liftMode:joystick.liftMode,turn:{x:turnStick.x,y:turnStick.y,vertical:turnStick.vertical},upgrades:{...upgrades},enemyCount:enemies.length,bullets:shots.length,heavyRemaining:Math.max(0,PH.heavyCooldown-(visualTime-heavyLast)),threeReady:!!renderer,touchUI:isTouchUI()});
})();
