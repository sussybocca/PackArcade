/* Retroflight 3D: deterministic, frame-rate-independent rigid-body math. No DOM dependency. */
(function(root,factory){const api=factory();if(typeof module==='object'&&module.exports)module.exports=api;else root.RetroPhysics=api;})(typeof globalThis!=='undefined'?globalThis:this,function(){'use strict';
  const EPS=1e-8;
  const V={
    make:(x=0,y=0,z=0)=>({x,y,z}),
    add:(a,b)=>({x:a.x+b.x,y:a.y+b.y,z:a.z+b.z}),
    sub:(a,b)=>({x:a.x-b.x,y:a.y-b.y,z:a.z-b.z}),
    scale:(a,s)=>({x:a.x*s,y:a.y*s,z:a.z*s}),
    dot:(a,b)=>a.x*b.x+a.y*b.y+a.z*b.z,
    cross:(a,b)=>({x:a.y*b.z-a.z*b.y,y:a.z*b.x-a.x*b.z,z:a.x*b.y-a.y*b.x}),
    length:a=>Math.hypot(a.x,a.y,a.z),
    normalized:a=>{const n=Math.hypot(a.x,a.y,a.z);return n>EPS?{x:a.x/n,y:a.y/n,z:a.z/n}:{x:0,y:0,z:0};},
    distance:(a,b)=>Math.hypot(a.x-b.x,a.y-b.y,a.z-b.z),
    clampLength:(a,max)=>{const n=V.length(a);return n>max?V.scale(a,max/n):{...a};}
  };
  const Q={
    identity:()=>({x:0,y:0,z:0,w:1}),
    multiply:(a,b)=>({w:a.w*b.w-a.x*b.x-a.y*b.y-a.z*b.z,x:a.w*b.x+a.x*b.w+a.y*b.z-a.z*b.y,y:a.w*b.y-a.x*b.z+a.y*b.w+a.z*b.x,z:a.w*b.z+a.x*b.y-a.y*b.x+a.z*b.w}),
    normalize:q=>{const n=Math.hypot(q.w,q.x,q.y,q.z);return n>EPS?{w:q.w/n,x:q.x/n,y:q.y/n,z:q.z/n}:Q.identity();},
    conjugate:q=>({x:-q.x,y:-q.y,z:-q.z,w:q.w}),
    rotate:(q,v)=>{const u={x:q.x,y:q.y,z:q.z};const uv=V.cross(u,v),uuv=V.cross(u,uv);return V.add(v,V.add(V.scale(uv,2*q.w),V.scale(uuv,2)));},
    axisAngle:(axis,angle)=>{const a=V.normalized(axis),s=Math.sin(angle/2);return Q.normalize({x:a.x*s,y:a.y*s,z:a.z*s,w:Math.cos(angle/2)});},
    integrate:(q,omega,dt)=>{const angle=V.length(omega)*dt;if(angle<EPS)return q;return Q.normalize(Q.multiply(Q.axisAngle(omega,angle),q));}
  };
  function clamp(v,a,b){return Math.max(a,Math.min(b,v));}
  class ShipBody {
    constructor(options={}){
      this.mass=Math.max(.01,Number(options.mass)||12);
      this.inertia=Math.max(.05,Number(options.inertia)||this.mass*.8);
      this.radius=Math.max(.25,Number(options.radius)||2);
      this.position=V.make(options.x||0,options.y||0,options.z||0);
      this.velocity=V.make();this.angularVelocity=V.make();this.orientation=Q.identity();
      this.mainThrust=Math.max(0,Number(options.mainThrust)||80);
      this.strafeThrust=Math.max(0,Number(options.strafeThrust)||48);
      this.torque=Math.max(0,Number(options.torque)||26);
      this.damageImbalance=0;
      this.maxVelocity=Math.max(8,Number(options.maxVelocity)||90);
      this.linearDamping=0;this.angularDamping=0;
    }
    forward(){return Q.rotate(this.orientation,V.make(0,0,-1));}
    right(){return Q.rotate(this.orientation,V.make(1,0,0));}
    up(){return Q.rotate(this.orientation,V.make(0,1,0));}
    speed(){return V.length(this.velocity);}
    impulse(impulse){this.velocity=V.add(this.velocity,V.scale(impulse,1/this.mass));}
    step(input={},dt=1/60,options={}){
      dt=clamp(Number(dt)||0,0,1/20);if(dt===0)return;
      const thrust=clamp(Number(input.forward)||0,-1,1),sx=clamp(Number(input.strafe)||0,-1,1),sy=clamp(Number(input.vertical)||0,-1,1);
      const yaw=clamp(Number(input.yaw)||0,-1,1),pitch=clamp(Number(input.pitch)||0,-1,1),roll=clamp(Number(input.roll)||0,-1,1);
      const health=Math.max(.25,1-clamp(this.damageImbalance,0,.75));
      const acc=V.add(V.scale(this.forward(),thrust*this.mainThrust*health/this.mass),V.add(V.scale(this.right(),sx*this.strafeThrust/this.mass),V.scale(this.up(),sy*this.strafeThrust/this.mass)));
      this.velocity=V.add(this.velocity,V.scale(acc,dt));
      if(options.gravityAcceleration)this.velocity=V.add(this.velocity,V.scale(options.gravityAcceleration,dt));
      // Optional planetary gravity is a real acceleration, absent in deep-space sectors.
      if(options.gravityCenter&&options.gravityStrength){const r=V.sub(options.gravityCenter,this.position);let n=V.length(r);if(n>1)this.velocity=V.add(this.velocity,V.scale(r,(options.gravityStrength/(n*n*n))*dt));}
      const rotLocal=V.make(pitch,yaw,roll);
      const torqueWorld=Q.rotate(this.orientation,V.scale(rotLocal,this.torque/this.inertia));
      this.angularVelocity=V.add(this.angularVelocity,V.scale(torqueWorld,dt));
      if(options.assist){
        // Realistic stabilization: independent counter-thrusters, not instantaneous velocity deletion.
        const stabilization=clamp(Number(options.stabilization)||3,0,10);
        const controlFree=[pitch,yaw,roll].every(v=>Math.abs(v)<.1);
        if(controlFree)this.angularVelocity=V.scale(this.angularVelocity,Math.exp(-stabilization*dt));
        if(options.dampLinear&&Math.abs(thrust)<.01&&Math.abs(sx)<.01&&Math.abs(sy)<.01){
          const brake=Math.min(this.strafeThrust/this.mass*dt,this.speed());
          this.velocity=V.sub(this.velocity,V.scale(V.normalized(this.velocity),brake));
        }
      }
      if(this.angularDamping>0)this.angularVelocity=V.scale(this.angularVelocity,Math.exp(-this.angularDamping*dt));
      if(this.linearDamping>0)this.velocity=V.scale(this.velocity,Math.exp(-this.linearDamping*dt));
      this.velocity=V.clampLength(this.velocity,this.maxVelocity);
      this.orientation=Q.integrate(this.orientation,this.angularVelocity,dt);
      this.position=V.add(this.position,V.scale(this.velocity,dt));
    }
  }
  function sphereContact(a,b,restitution=.25){
    const delta=V.sub(b.position,a.position),distance=V.length(delta),penetration=a.radius+b.radius-distance;
    if(penetration<=0)return null;
    const normal=distance>EPS?V.scale(delta,1/distance):V.make(1,0,0);
    const inverseA=1/a.mass,inverseB=1/b.mass;
    const relative=V.sub(b.velocity,a.velocity),approach=V.dot(relative,normal);
    const j=approach<0?-(1+restitution)*approach/(inverseA+inverseB):0;
    a.velocity=V.sub(a.velocity,V.scale(normal,j*inverseA));b.velocity=V.add(b.velocity,V.scale(normal,j*inverseB));
    const correction=V.scale(normal,Math.max(0,penetration-.01)/(inverseA+inverseB)*.75);
    a.position=V.sub(a.position,V.scale(correction,inverseA));b.position=V.add(b.position,V.scale(correction,inverseB));
    return {normal,impulse:j,impactSpeed:Math.max(0,-approach),penetration};
  }
  function raySphere(point,next,center,radius){const dir=V.sub(next,point),m=V.sub(point,center),a=V.dot(dir,dir),b=V.dot(m,dir),c=V.dot(m,m)-radius*radius;
    if(c<=0)return true;if(a<EPS)return false;const det=b*b-a*c;if(det<0)return false;const t=(-b-Math.sqrt(det))/a;return t>=0&&t<=1;
  }
  function loadUpgrades(storage,key='retroflight-upgrades-v1'){
    let raw={};try{raw=JSON.parse(storage.getItem(key)||'{}')||{};}catch{};
    const level=k=>clamp(Number.isFinite(Number(raw[k]))?Math.floor(Number(raw[k])):0,0,100);
    return {armor:level('armor'),damage:level('damage'),thrusters:level('thrusters')};
  }
  function upgradedStats(u){return {maxHealth:40+u.armor*20,regularDamage:12+u.damage*5,mainThrust:80+u.thrusters*14,strafeThrust:48+u.thrusters*8,torque:26+u.thrusters*4};}
  function heavyCount(kills){return clamp(1+Math.floor(Math.max(0,kills)/8),1,16);}
  const heavyCooldown=40;
  return {V,Q,ShipBody,sphereContact,raySphere,clamp,loadUpgrades,upgradedStats,heavyCount,heavyCooldown};
});
