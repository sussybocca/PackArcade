/* Optional anonymous 2-player PeerJS transport. Game logic retains authority on host. */
(function(root){'use strict';
 let peer=null,connection=null,host=false,room='',handler=()=>{},status=()=>{};
 function ensurePeer(){
   if(root.Peer)return Promise.resolve(root.Peer);
   return new Promise((resolve,reject)=>{
     const existing=document.querySelector('script[data-retro-peer]');if(existing){existing.addEventListener('load',()=>root.Peer?resolve(root.Peer):reject(Error('PeerJS unavailable')),{once:true});existing.addEventListener('error',()=>reject(Error('PeerJS load failed')),{once:true});return;}
     const s=document.createElement('script');s.src='https://cdn.jsdelivr.net/npm/peerjs@1.5.2/dist/peerjs.min.js';s.async=true;s.dataset.retroPeer='1';s.onload=()=>root.Peer?resolve(root.Peer):reject(Error('PeerJS unavailable'));s.onerror=()=>reject(Error('Could not load PeerJS. Check network connection.'));document.head.appendChild(s);
   });
 }
 function bindConnection(c){connection=c;
   c.on('data',d=>{if(d&&typeof d==='object'&&typeof d.type==='string')handler(d);});
   c.on('close',()=>{connection=null;status('DISCONNECTED');});
   c.on('error',err=>status('ERROR · '+(err.message||String(err))));
   c.on('open',()=>{status('CONNECTED · '+(host?'HOST':'GUEST'));handler({type:'connected'});});
 }
 async function createHost(){disconnect();await ensurePeer();return new Promise((resolve,reject)=>{
   host=true;peer=new root.Peer();peer.on('open',id=>{room=id;status('HOSTING · '+id);resolve(id);peer.on('connection',c=>{if(connection&&connection.open){c.close();return;}bindConnection(c);});});peer.on('error',reject);
 });}
 async function join(code){disconnect();await ensurePeer();return new Promise((resolve,reject)=>{
   host=false;peer=new root.Peer();peer.on('open',()=>{const c=peer.connect(String(code).trim(),{reliable:true});bindConnection(c);let resolved=false;c.on('open',()=>{if(!resolved){resolved=true;room=String(code).trim();resolve(room);}});c.on('error',err=>{if(!resolved){resolved=true;reject(err);}});});peer.on('error',reject);
 });}
 function send(type,payload={}){if(connection?.open){connection.send({type,...payload});return true;}return false;}
 function disconnect(){if(connection){try{connection.close();}catch{}connection=null;}if(peer){try{peer.destroy();}catch{}peer=null;}host=false;room='';status('NOT CONNECTED');}
 root.RetroNetwork={createHost,join,send,disconnect,isHost:()=>host,isConnected:()=>!!connection?.open,roomCode:()=>room,onData:f=>{handler=f;},onStatus:f=>{status=f;}};
})(window);
