/* Test-only Three.js surface; never used by the production game. */
(()=>{
 class V3{constructor(x=0,y=0,z=0){this.set(x,y,z)}set(x=0,y=0,z=0){this.x=x;this.y=y;this.z=z;return this}copy(v){return this.set(v.x,v.y,v.z)}addScaledVector(v,s){this.x+=v.x*s;this.y+=v.y*s;this.z+=v.z*s;return this}lerp(v,t){this.x+=(v.x-this.x)*t;this.y+=(v.y-this.y)*t;this.z+=(v.z-this.z)*t;return this}project(c){return this.set(this.x/90,this.y/90,-.1)}}
 class Rot extends V3{}
 class Scale extends V3{constructor(){super(1,1,1)}setScalar(n){return this.set(n,n,n)}}
 class Quaternion{constructor(){this.set(0,0,0,1)}set(x,y,z,w){this.x=x;this.y=y;this.z=z;this.w=w;return this}}
 class Thing{constructor(...args){this.position=new V3();this.rotation=new Rot();this.quaternion=new Quaternion();this.scale=new Scale();this.children=[];this.userData={};this.visible=true;this.matrix={};this.geometry=args[0];this.material=args[1];this.instanceMatrix={needsUpdate:false};}
 add(v){this.children.push(v)}remove(v){this.children=this.children.filter(x=>x!==v)}updateMatrix(){}lookAt(){}setMatrixAt(){}updateProjectionMatrix(){}
 }
 class Geometry{constructor(){this.type=new.target.name}setAttribute(){}}
 class Material{constructor(o={}){Object.assign(this,o);this.opacity??=1}}
 class MockRenderer{constructor(){this.outputEncoding=0;this.toneMapping=0;this.toneMappingExposure=1;}setPixelRatio(){}setSize(){}setClearColor(){}render(){}dispose(){}}
 class FogExp2{constructor(...args){this.args=args}}
 const all={WebGLRenderer:MockRenderer,Scene:Thing,Group:Thing,Mesh:Thing,Points:Thing,InstancedMesh:Thing,Object3D:Thing,PerspectiveCamera:Thing,Light:Thing,HemisphereLight:Thing,DirectionalLight:Thing,PointLight:Thing,BufferGeometry:Geometry,SphereGeometry:Geometry,IcosahedronGeometry:Geometry,OctahedronGeometry:Geometry,TetrahedronGeometry:Geometry,CylinderGeometry:Geometry,ConeGeometry:class ConeGeometry extends Geometry{},TorusGeometry:Geometry,BoxGeometry:Geometry,PointsMaterial:Material,MeshStandardMaterial:Material,MeshBasicMaterial:Material,Color:class Color{constructor(value){this.value=value}},FogExp2,BufferAttribute:class BufferAttribute{constructor(arr,n){this.arr=arr;this.n=n}},Vector3:V3,DoubleSide:2,BackSide:1,sRGBEncoding:3001,ACESFilmicToneMapping:4};
 window.THREE=all;
})();
