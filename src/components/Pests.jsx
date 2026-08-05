import React from 'react';
import { ThemeCtx, fmtDate } from '../utils.js';

export function PestsView({plants, pestLog, onResolve, onSelect}){
  const T = React.useContext(ThemeCtx);
  const ids = new Set(plants.map(p=>String(p.id)));
  const active = (pestLog||[]).filter(e=>!e.resolved && ids.has(String(e.plantId)));
  const byPlant = {};
  active.forEach(e=>{ (byPlant[e.plantId]=byPlant[e.plantId]||[]).push(e); });
  const plantIds = Object.keys(byPlant).sort((a,b)=>byPlant[b].length-byPlant[a].length);

  if(!plants.length){
    return (
      <div style={{padding:24,textAlign:'center',color:T.sub,fontSize:13,
        background:T.surface,borderRadius:10,border:'1px dashed '+T.border}}>
        No plants placed in this zone yet — place some on the Map tab first.
      </div>
    );
  }

  return (
    <div>
      <h2 style={{fontSize:20,fontWeight:700,color:T.text,marginBottom:6}}>&#x1F41B; Pests &amp; Disease</h2>
      <p style={{color:T.sub,fontSize:13,marginBottom:20}}>
        Active issues logged against the {plants.length} plant{plants.length!==1?'s':''} in this zone.
      </p>
      {plantIds.length===0?(
        <div style={{padding:24,textAlign:'center',color:'#22c55e',fontSize:13,
          background:'rgba(34,197,94,0.08)',borderRadius:10,border:'1px solid rgba(34,197,94,0.25)'}}>
          &#x2705; No active pest or disease issues in this zone.
        </div>
      ):(
        plantIds.map(pid=>{
          const plant = plants.find(p=>String(p.id)===pid);
          const entries = byPlant[pid];
          if(!plant) return null;
          return (
            <div key={pid} style={{background:T.card,border:'1px solid '+T.border,borderRadius:10,
              padding:14,marginBottom:10}}>
              <div style={{display:'flex',alignItems:'center',justifyContent:'space-between',marginBottom:8}}>
                <button onClick={()=>onSelect(plant)} style={{background:'none',border:'none',cursor:'pointer',
                  padding:0,fontWeight:700,color:T.text,fontSize:14,textAlign:'left'}}>
                  {plant.name}
                </button>
                <span style={{fontSize:11,color:'#ef4444',fontWeight:600}}>{entries.length} active</span>
              </div>
              {entries.map((e,i)=>(
                <div key={e.id||i} style={{display:'flex',alignItems:'flex-start',gap:8,padding:'8px 10px',
                  background:'rgba(239,68,68,0.08)',borderRadius:8,marginBottom:i<entries.length-1?5:0,
                  border:'1px solid rgba(239,68,68,0.2)'}}>
                  <div style={{flex:1}}>
                    <div style={{fontWeight:600,color:T.text,fontSize:13}}>{e.pest}</div>
                    {e.note&&<div style={{color:T.sub,fontSize:11,marginTop:2}}>{e.note}</div>}
                    <div style={{color:T.sub,fontSize:10,marginTop:2}}>{fmtDate(e.date)}</div>
                  </div>
                  <button onClick={()=>onResolve(e.id)} style={{padding:'3px 8px',background:'rgba(34,197,94,0.15)',
                    color:'#22c55e',border:'1px solid rgba(34,197,94,0.3)',borderRadius:4,fontSize:11,cursor:'pointer',
                    flexShrink:0}}>
                    &#x2713; Resolved
                  </button>
                </div>
              ))}
            </div>
          );
        })
      )}
    </div>
  );
}
