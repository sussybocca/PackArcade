/* RETROFLIGHT BRAINFLIGHT / GRAVITYCORE / TARGETLOCK 50. Deterministic, no network or DOM dependency. */
(function(root,factory){const P=typeof module==='object'&&module.exports?require('./retroflight-physics.js'):root.RetroPhysics;
const api=factory(P);if(typeof module==='object'&&module.exports)module.exports=api;else root.RetroSystems=api;})(typeof globalThis!=='undefined'?globalThis:this,function(P){'use strict';
const {V,Q,clamp,raySphere}=P, EPS=1e-9,TAU=Math.PI*2;
const PERS=['aggressive','defensive','tactical','unpredictable','rookie','veteran','leader','survivor'];
const LIMIT=55;
function gravityAt(pos,bodies=[]){
 let acc=V.make();
 for(const b of bodies){if(!b||!b.position||!(b.mu>0))continue;
  const offset=V.sub(b.position,pos),r=V.length(offset),minimum=Math.max(1,Number(b.radius)||1);
  if(r<EPS)continue;
  const strength=Math.min(LIMIT,b.mu/Math.max(minimum,r)**2);
  acc=V.add(acc,V.scale(offset,strength/r));
 }
 return V.clampLength(acc,LIMIT);
}
function celestialBodies(wave){
 const phase=(Math.max(1,wave)-1)%5;
 if(phase===4)return [{id:'planet',position:V.make(0,-270,-190),radius:145,mu:290000},{id:'moon',position:V.make(285,120,-420),radius:58,mu:21000}];
 if(phase===3)return [{id:'distant-moon',position:V.make(200,-220,-390),radius:90,mu:65000}];
 return [];
}
function obscured(from,to,obstacles=[],padding=0){
 for(const b of obstacles){const c=b.position||b.pos;
  if(c&&b.radius>0&&raySphere(from,to,c,b.radius+padding))return true;
 }
 return false;
}
function intercept(origin,velocity,target,targetVelocity,speed,gravityRelative=V.make()){
 const r=V.sub(target,origin),v=V.sub(targetVelocity,velocity),s=Math.max(1,speed);
 const a=V.dot(v,v)-s*s,b=2*V.dot(r,v),c=V.dot(r,r);
 let time=Math.sqrt(c)/s;
 if(Math.abs(a)<EPS){if(Math.abs(b)>EPS)time=Math.max(0,-c/b);}
 else{const disc=b*b-4*a*c;if(disc>=0){const roots=[(-b-Math.sqrt(disc))/(2*a),(-b+Math.sqrt(disc))/(2*a)].filter(t=>t>0);if(roots.length)time=Math.min(...roots);}}
 time=clamp(time,0,5);
 const aim=V.add(r,V.add(V.scale(v,time),V.scale(gravityRelative,.5*time*time)));
 return {direction:V.normalized(aim),time,predicted:V.add(target,V.add(V.scale(targetVelocity,time),V.scale(gravityRelative,.5*time*time)))};
}
function angle(a,b){return Math.acos(clamp(V.dot(V.normalized(a),V.normalized(b)),-1,1));}
function assist(manual,ideal,strength=.5,cone=.37,rate=Infinity,dt=1/60){
 const a=V.normalized(manual),b=V.normalized(ideal),theta=angle(a,b);
 if(theta>cone||!Number.isFinite(theta))return {direction:a,correction:0,eligible:false,error:theta};
 const correction=Math.min(theta*clamp(strength,0,1),Math.max(0,rate)*Math.max(0,dt));
 if(theta<EPS)return {direction:a,correction:0,eligible:true,error:0};
 const k=correction/theta;return {direction:V.normalized(V.add(V.scale(a,1-k),V.scale(b,k))),correction,eligible:true,error:theta};
}
function makePilot(type,index=0){
 const personality=PERS[Math.abs(Math.floor(index))%PERS.length];
 return {personality,experience:personality==='veteran'?.94:personality==='rookie'?.37:personality==='leader'?.84:.58,
  confidence:0,track:null,seen:false,elapsed:0,decisionWait:0,behavior:'approach',formation:index%4,
  desiredRange:personality==='defensive'?60:personality==='aggressive'?23:38,
  errorSeed:(index+1)*13.37, input:{forward:0,strafe:0,vertical:0,yaw:0,pitch:0,roll:0}};
}
function celestialContact(body,bodies=[],restitution=.18){
 let highest=0;
 for(const field of bodies){if(!field.position||!(field.radius>0))continue;
  const delta=V.sub(body.position,field.position),dist=V.length(delta),safe=field.radius+body.radius;
  if(dist>=safe)continue;
  const out=dist>EPS?V.scale(delta,1/dist):V.make(0,1,0);
  body.position=V.add(field.position,V.scale(out,safe+.025));
  const along=V.dot(body.velocity,out);
  if(along<0){highest=Math.max(highest,-along);body.velocity=V.sub(body.velocity,V.scale(out,(1+restitution)*along));}
 }
 return highest;
}
function nearestHazard(body,obstacles=[],lookahead=2){
 let best=null,dist=Infinity;
 const look=V.add(body.position,V.scale(body.velocity,lookahead));
 for(const o of obstacles){const c=o.position||o.pos;if(!c||!(o.radius>0))continue;
  const d=V.distance(look,c)-body.radius-o.radius;
  if(d<dist){dist=d;best=o;}
 }
 return best&&dist<24?{body:best,clearance:dist}:null;
}
function steerToward(body,point,skill,sideBias=0){
 const diff=V.sub(point,body.position);
 const d=V.length(diff);
 const desired=V.normalized(diff);
 const local=Q.rotate(Q.conjugate(body.orientation),desired);
 const current=Q.rotate(Q.conjugate(body.orientation),body.angularVelocity);
 // Ship faces -Z. Correct angular rates are applied through the actual thruster input.
 const yaw=-Math.atan2(local.x,Math.max(.05,-local.z));
 const pitch=Math.atan2(local.y,Math.max(.05,-local.z));
 const damping=skill>.7?.4:.24;
 return {yaw:clamp(yaw*(.9+skill)-current.y*damping,-1,1),pitch:clamp(pitch*(.9+skill)-current.x*damping,-1,1),
  forward:clamp((d-14)/18,-.9,1),strafe:sideBias,vertical:0,roll:clamp(sideBias*.3-current.z*.18,-.65,.65)};
}
function pilotStep(pilot,enemy,player,world={},dt=1/60){
 const body=enemy.body,target=player.position,range=V.distance(body.position,target),obstacles=world.obstacles||[];
 pilot.elapsed+=dt;pilot.decisionWait-=dt;
 const direct=range<170&&!obscured(body.position,target,obstacles,.1);
 if(pilot.decisionWait<=0){
  pilot.decisionWait=.13+(1-pilot.experience)*.23;
  if(direct){pilot.track={position:{...target},velocity:{...player.velocity},time:pilot.elapsed};pilot.confidence=1;}
  else if(world.sharedTrack&&V.distance(body.position,world.sharedTrack.position)<240&&pilot.personality!=='rookie'){
    pilot.track={position:{...world.sharedTrack.position},velocity:{...world.sharedTrack.velocity},time:pilot.elapsed};
    pilot.confidence=Math.max(pilot.confidence,.62);
  }else pilot.confidence*=.85;
  const wounded=Number(enemy.hp)/Math.max(1,Number(enemy.maxHp))<.28;
  const dangerous=nearestHazard(body,obstacles);
  if(dangerous)pilot.behavior='avoid';
  else if(wounded&&(pilot.personality==='survivor'||pilot.personality==='defensive'))pilot.behavior='retreat';
  else if(world.playerPattern?.heavyUse>.5&&range<70&&['defensive','tactical','survivor'].includes(pilot.personality))pilot.behavior='reposition';
  else if(range<pilot.desiredRange*.65)pilot.behavior='reposition';
  else if(!direct&&pilot.confidence<.2)pilot.behavior='search';
  else pilot.behavior='approach';
 }
 pilot.seen=direct;
 const age=pilot.track?pilot.elapsed-pilot.track.time:999;
 if(!direct&&age>4)pilot.confidence=0;
 let aimPoint=pilot.track&&pilot.confidence>.1?V.add(pilot.track.position,V.scale(pilot.track.velocity,Math.min(age+.3,1.8))):V.add(body.position,V.scale(body.forward(),25));
 const anticipation=clamp((world.playerPattern?.avgSpeed||0)/80,0,.35);
 if(pilot.personality==='veteran'||pilot.personality==='tactical')aimPoint=V.add(aimPoint,V.scale(pilot.track?.velocity||V.make(),anticipation));
 const lead=intercept(body.position,body.velocity,aimPoint,pilot.track?.velocity||V.make(),100);
 aimPoint=lead.predicted;
 const hazard=nearestHazard(body,obstacles);
 if(pilot.behavior==='avoid'&&hazard){
  const c=hazard.body.position||hazard.body.pos;aimPoint=V.add(body.position,V.scale(V.normalized(V.sub(body.position,c)),45));
 }else if(pilot.behavior==='retreat'){
  aimPoint=V.add(body.position,V.scale(V.normalized(V.sub(body.position,target)),60));
 }else if(pilot.behavior==='reposition'){
  const away=V.normalized(V.sub(body.position,target));aimPoint=V.add(body.position,V.add(V.scale(away,27),V.scale(body.right(),12)));
 }else if(pilot.behavior==='search'){
  aimPoint=V.add(body.position,V.add(V.scale(body.forward(),32),V.scale(body.right(),Math.sin(pilot.elapsed*.7+pilot.errorSeed)*19)));
 }
 if(world.leader&&world.leader.body&&world.leader.body!==body&&pilot.behavior==='approach'&&range>35&&['rookie','defensive','tactical'].includes(pilot.personality)){
   const leader=world.leader.body,slot=pilot.formation-1.5;
   const formationPoint=V.add(leader.position,V.add(V.scale(leader.right(),slot*8),V.scale(leader.forward(),-10)));
   aimPoint=V.add(V.scale(aimPoint,.67),V.scale(formationPoint,.33));
 }
 const side=pilot.personality==='unpredictable'?Math.sin(pilot.elapsed*1.7+pilot.errorSeed)*.6:pilot.personality==='aggressive'?.22:.07;
 const requested=steerToward(body,aimPoint,pilot.experience,side);
 if(pilot.behavior==='retreat')requested.forward=.92;
 if(pilot.behavior==='reposition')requested.forward=.25;
 const inertiaFactor=clamp(body.mass/22,.3,5);
 requested.forward=clamp(requested.forward, -.9,1);
 // Pilots cannot alter position or velocity directly: their output goes through ShipBody.step.
 pilot.input=requested;
 const aimError=angle(body.forward(),lead.direction);
 const canFire=direct&&range<125&&aimError<(.18+pilot.experience*.18)&&pilot.behavior!=='retreat';
 return {input:requested,canFire,seen:direct,behavior:pilot.behavior,range,skill:pilot.experience,gravity:gravityAt(body.position,world.gravityBodies||[]),inertiaFactor};
}
function joystickToFlight(left,right,rollMode=false){
 const l={x:clamp(left?.x||0,-1,1),y:clamp(left?.y||0,-1,1)};
 const r={x:clamp(right?.x||0,-1,1),y:clamp(right?.y||0,-1,1)};
 return {forward:-l.y,strafe:l.x,vertical:rollMode?0:(right?.vertical||0),
 yaw:rollMode?0:r.x,pitch:-r.y,roll:rollMode?r.x:0};
}
return {gravityAt,celestialBodies,celestialContact,obscured,intercept,assist,angle,makePilot,pilotStep,joystickToFlight,nearestHazard,PERS};
});
