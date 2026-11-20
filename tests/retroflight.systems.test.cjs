'use strict';
const test=require('node:test'), assert=require('node:assert/strict');
const P=require('../public/imagine/SpaceShooters2/retroflight-physics.js');
const S=require('../public/imagine/SpaceShooters2/retroflight-systems.js');
const {ShipBody,V,Q}=P;
const near=(a,b,tol=1e-6)=>assert.ok(Math.abs(a-b)<tol, `${a} is not approximately ${b}`);
test('GravityCore: inverse-square attraction and correct vector',()=>{
 const b={position:V.make(0,0,0),radius:1,mu:1000};
 const at10=S.gravityAt(V.make(10,0,0),[b]),at20=S.gravityAt(V.make(20,0,0),[b]);
 near(at10.x,-10);near(at20.x,-2.5);near(at10.y,0);near(at10.z,0);
});
test('GravityCore: gravitational acceleration is independent of spaceship mass',()=>{
 const g=S.gravityAt(V.make(60,0,0),[{position:V.make(0,0,0),radius:3,mu:3600}]);
 const a=new ShipBody({mass:8}),b=new ShipBody({mass:88});a.position=b.position=V.make(60,0,0);
 a.step({},1/60,{gravityAcceleration:g});b.step({},1/60,{gravityAcceleration:g});
 near(a.velocity.x,b.velocity.x);
});
test('GravityCore: multiple bodies accumulate and deep space has zero gravity',()=>{
 let bodies=[{position:V.make(-30,0,0),mu:300,radius:1},{position:V.make(30,0,0),mu:300,radius:1}];
 near(S.gravityAt(V.make(),bodies).x,0);near(V.length(S.gravityAt(V.make(),[])),0);
});
test('GravityCore: orbital simulation remains bounded for two complete rotations',()=>{
 const mu=3000,r=30,center=V.make(0,0,0),body=new ShipBody({mass:12,maxVelocity:300,mainThrust:25});
 body.position=V.make(r,0,0);body.velocity=V.make(0,Math.sqrt(mu/r),0);
 const dt=1/120,T=2*Math.PI*Math.sqrt(r*r*r/mu),cycles=Math.ceil(2*T/dt);
 for(let i=0;i<cycles;i++)body.step({},dt,{gravityAcceleration:S.gravityAt(body.position,[{position:center,radius:1,mu}])});
 assert.ok(V.distance(body.position,center)>26 && V.distance(body.position,center)<34,'stable orbital radius');
});
test('TargetLock 50: correction is one half angular error, not guaranteed hit',()=>{
 const a=V.make(0,0,-1),b=V.make(Math.sin(.22),0,-Math.cos(.22));
 const result=S.assist(a,b,.5,.38,Infinity,1/60);
 assert.ok(result.eligible);near(result.correction,.11,1e-9);near(S.angle(result.direction,b),.11,2e-4);
});
test('TargetLock 50: no snapping outside acquisition cone or behind obstacle',()=>{
 const a=V.make(0,0,-1),b=V.make(1,0,0);
 assert.equal(S.assist(a,b,.5,.38).eligible,false);
 assert.ok(S.obscured(V.make(0,0,0),V.make(0,0,-100),[{pos:V.make(0,0,-50),radius:4}]));
 assert.ok(!S.obscured(V.make(40,0,0),V.make(40,0,-100),[{pos:V.make(0,0,-50),radius:4}]));
});
test('TargetLock 50: faster projectile requires less lead for moving ship',()=>{
 const from=V.make(),target=V.make(0,0,-50),moving=V.make(8,0,0);
 const slow=S.intercept(from,V.make(),target,moving,30),fast=S.intercept(from,V.make(),target,moving,100);
 assert.ok(slow.direction.x>fast.direction.x);assert.ok(slow.time>fast.time);
});
test('Brainflight: eight distinct pilot personalities and finite steering commands',()=>{
 assert.equal(new Set(Array.from({length:8},(_,i)=>S.makePilot('scout',i).personality)).size,8);
 const body=new ShipBody({mass:15}),enemy={body,hp:50,maxHp:50};
 const pilot=S.makePilot('scout',5),player={position:V.make(2,0,-70),velocity:V.make(0,0,0)};
 const decision=S.pilotStep(pilot,enemy,player,{obstacles:[],gravityBodies:[]},1/60);
 for(const n of Object.values(decision.input))assert.ok(Number.isFinite(n)&&n>=-1&&n<=1,'bounded command');
 assert.deepEqual(body.position,V.make(),'bot does not teleport');
});
test('Brainflight: obstacles alter enemy behavior and no magic movement',()=>{
 const body=new ShipBody({mass:10});body.position=V.make();
 const enemy={body,hp:60,maxHp:60},pilot=S.makePilot('gunship',2),player={position:V.make(0,0,-80),velocity:V.make()};
 const ctx={obstacles:[{pos:V.make(0,0,-9),radius:5}],gravityBodies:[]};
 const decision=S.pilotStep(pilot,enemy,player,ctx,1/30);
 assert.equal(decision.behavior,'avoid');assert.deepEqual(body.position,V.make());
});
test('HeavyFlight: same engine thrust gives heavier ship lower acceleration',()=>{
 const light=new ShipBody({mass:10,mainThrust:120}),heavy=new ShipBody({mass:40,mainThrust:120});
 light.step({forward:1},1/60);heavy.step({forward:1},1/60);
 assert.ok(light.speed()>heavy.speed()*3.8);
});
test('Mobile dual joystick supports full pitch/yaw plus strafe/thrust and optional roll',()=>{
 const simple=S.joystickToFlight({x:.6,y:-.8},{x:.3,y:-.9,vertical:.5},false);
 near(simple.strafe,.6);near(simple.forward,.8);near(simple.yaw,.3);near(simple.pitch,.9);near(simple.vertical,.5);near(simple.roll,0);
 const roll=S.joystickToFlight({x:0,y:0},{x:.7,y:-1},true);
 near(roll.roll,.7);near(roll.pitch,1);
});

test('GravityCore: planet surface prevents penetration and produces impact response',()=>{
 const b=new ShipBody({mass:25,radius:2});b.position=V.make(10,0,0);b.velocity=V.make(-12,0,0);
 const hit=S.celestialContact(b,[{position:V.make(),radius:12,mu:3000}]);
 assert.ok(hit>=12);assert.ok(V.length(b.position)>=14);assert.ok(b.velocity.x>0);
});
