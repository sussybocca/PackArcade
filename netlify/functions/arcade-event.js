'use strict';
const { createClient } = require('@supabase/supabase-js');
const catalog = require('../../public/game-catalog.json');
const allowedIds = new Set(catalog.games.map(g => g.id));
const response=(code,body)=>({statusCode:code,headers:{'Content-Type':'application/json; charset=utf-8','Cache-Control':'no-store','Access-Control-Allow-Origin':'https://packarcade.xyz','Vary':'Origin'},body:JSON.stringify(body)});
let supabase;
function client(){if(!process.env.SUPABASE_URL||!process.env.SUPABASE_SERVICE_KEY)return null;return supabase||(supabase=createClient(process.env.SUPABASE_URL,process.env.SUPABASE_SERVICE_KEY,{auth:{persistSession:false,autoRefreshToken:false}}))}
exports.handler=async(event)=>{
 if(event.httpMethod!=='POST')return response(405,{error:'POST required'});
 const origin=event.headers?.origin||event.headers?.Origin||'';
 if(origin&&!/^https:\/\/(?:www\.)?packarcade\.xyz$|^http:\/\/(?:localhost|127\.0\.0\.1)(?::\d+)?$/.test(origin))return response(403,{error:'Origin not permitted'});
 const size=Buffer.byteLength(event.body||'');if(size>600)return response(413,{error:'Request too large'});
 let payload;try{payload=JSON.parse(event.body||'{}')}catch{return response(400,{error:'Invalid JSON'})}
 if(!payload||typeof payload.value!=='string')return response(400,{error:'Invalid event'});
 const type=payload.type,raw=payload.value.trim();let name,params;
 if(type==='view'&&allowedIds.has(raw)&&/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(raw)&&raw.length<=75){name='arcade_record_view';params={p_game_id:raw}}
 else if(type==='search'&&raw.length>=2&&raw.length<=70&&/^[\p{L}\p{N}\p{M}\s._+\-]+$/u.test(raw)){name='arcade_record_search';params={p_term:raw.toLowerCase().replace(/\s+/g,' ').slice(0,64)}}
 else return response(400,{error:'Event not permitted'});
 const db=client();if(!db)return response(503,{error:'Anonymous metrics unavailable'});
 try{const {error}=await db.rpc(name,params);if(error)throw error;return response(200,{ok:true})}
 catch(err){console.error('arcade-event failed',err.message);return response(503,{error:'Anonymous metrics temporarily unavailable'})}
};
