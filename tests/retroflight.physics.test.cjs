'use strict';
const test=require('node:test'),assert=require('node:assert/strict');
const P=require('../public/imagine/SpaceShooters2/retroflight-physics.js');
const {ShipBody,V,Q}=P;
test('authentic flight persists momentum after releasing throttle',()=>{
 const b=new ShipBody({mass:10,mainThrust:100,maxVelocity:200});for(let i=0;i<60;i++)b.step({forward:1},1/60);
 const before={...b.velocity};assert.ok(b.speed()>9);for(let i=0;i<60;i++)b.step({},1/60,{assist:false});
 assert.ok(Math.abs(b.velocity.z-before.z)<.01);assert.ok(b.position.z< -10);
});
test('rotating does not instantaneously redirect an already moving ship',()=>{
 const b=new ShipBody({mass:10,inertia:3,mainThrust:100,torque:50});for(let i=0;i<60;i++)b.step({forward:1},1/60);
 const v={...b.velocity};for(let i=0;i<60;i++)b.step({yaw:1},1/60,{assist:false});
 assert.ok(Math.abs(b.velocity.z-v.z)<.01);assert.ok(Math.abs(b.forward().x)>.3);
});
test('counter-thrust stabilization slows angular movement only when requested',()=>{
 const a=new ShipBody({mass:10}),b=new ShipBody({mass:10});a.angularVelocity.y=b.angularVelocity.y=3;
 a.step({},.05,{assist:false});b.step({},.05,{assist:true,stabilization:7});
 assert.ok(b.angularVelocity.y<a.angularVelocity.y);
});
test('body mass determines acceleration at identical engine thrust',()=>{
 const light=new ShipBody({mass:6,mainThrust:120}),heavy=new ShipBody({mass:60,mainThrust:120});
 light.step({forward:1},.05);heavy.step({forward:1},.05);assert.ok(light.speed()>heavy.speed()*9);
});
test('collisions resolve overlap with finite impulses',()=>{
 const a=new ShipBody({mass:10,radius:2,x:0}),b=new ShipBody({mass:25,radius:2,x:3});a.velocity.x=9;b.velocity.x=-2;
 const c=P.sphereContact(a,b,.4);assert.ok(c&&c.impactSpeed>=10);assert.ok(V.distance(a.position,b.position)>3);assert.ok(Number.isFinite(a.velocity.x));
});
test('swept hit detects fast projectile crossing an enemy',()=>{
 assert.equal(P.raySphere(V.make(0,0,-2),V.make(0,0,-100),V.make(0,0,-50),2),true);
 assert.equal(P.raySphere(V.make(20,0,0),V.make(20,0,-100),V.make(0,0,-50),2),false);
});
test('kill milestones increase the heavy salvo but cap projectile count',()=>{
 assert.deepEqual([0,7,8,24,200].map(P.heavyCount),[1,1,2,4,16]);assert.equal(P.heavyCooldown,40);
});
test('permanent upgrades reject corrupt stored values and scale all three systems',()=>{
 const mem={getItem:()=>'{"armor":2,"damage":3,"thrusters":5}'};const up=P.loadUpgrades(mem),s=P.upgradedStats(up);
 assert.deepEqual(up,{armor:2,damage:3,thrusters:5});assert.equal(s.maxHealth,80);assert.equal(s.regularDamage,27);assert.equal(s.mainThrust,150);
 assert.deepEqual(P.loadUpgrades({getItem:()=>'{bad'}),{armor:0,damage:0,thrusters:0});
});
test('quaternion unit length survives repeated integration',()=>{
 const b=new ShipBody({mass:10,torque:12});for(let i=0;i<10000;i++)b.step({yaw:.6,pitch:.1},1/60,{assist:true,stabilization:1});
 assert.ok(Math.abs(Math.hypot(b.orientation.x,b.orientation.y,b.orientation.z,b.orientation.w)-1)<1e-8);
});
