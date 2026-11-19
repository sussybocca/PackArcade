'use strict';
const { createClient } = require('@supabase/supabase-js');
const respond=(code,body)=>({statusCode:code,headers:{'Content-Type':'application/json; charset=utf-8','Cache-Control':'public, max-age=60, stale-while-revalidate=180','Access-Control-Allow-Origin':'*'},body:JSON.stringify(body)});
let supabase;
exports.handler=async(event)=>{
 if(event.httpMethod!=='GET')return respond(405,{error:'GET required'});
 if(!process.env.SUPABASE_URL||!process.env.SUPABASE_SERVICE_KEY)return respond(200,{available:false,games:[]});
 try{
  const db=supabase||(supabase=createClient(process.env.SUPABASE_URL,process.env.SUPABASE_SERVICE_KEY,{auth:{persistSession:false,autoRefreshToken:false}}));
  const since=new Date(Date.now()-6*86400000).toISOString().slice(0,10);
  const [totals,daily]=await Promise.all([db.from('arcade_game_totals').select('game_id,views').limit(1000),db.from('arcade_daily_views').select('game_id,views').gte('day',since).limit(3000)]);
  if(totals.error||daily.error)throw totals.error||daily.error;
  const map=new Map();(totals.data||[]).forEach(r=>map.set(r.game_id,{game_id:r.game_id,total:Number(r.views)||0,week:0}));
  (daily.data||[]).forEach(r=>{const row=map.get(r.game_id)||{game_id:r.game_id,total:0,week:0};row.week+=(Number(r.views)||0);map.set(r.game_id,row)});
  return respond(200,{available:true,games:[...map.values()]});
 }catch(err){console.error('arcade-stats failed',err.message);return respond(200,{available:false,games:[]})}
};
