import React from 'react';
import { COURTYARD_DEFAULT } from '../data/zones.js';
import { ThemeCtx, WATER_LEVEL_COLORS, waterLevel } from '../utils.js';

function loadInstalled(key){
  try{ return new Set(JSON.parse(localStorage.getItem(key)||'[]')); }
  catch{ return new Set(); }
}

export function IrrigationSection({title,storageKey,fallback,cfg,allPlants,editMode}){
  const T=React.useContext(ThemeCtx);
  const GP=4;
  const installKey=storageKey+'-drip-installed';
  const pos=(()=>{
    try{const s=JSON.parse(localStorage.getItem(storageKey)||'null');return s||fallback||{};}
    catch{return fallback||{};}
  })();
  const [installed,setInstalled]=React.useState(()=>loadInstalled(installKey));
  function toggleInstalled(key){
    setInstalled(prev=>{
      const next=new Set(prev);
      next.has(key)?next.delete(key):next.add(key);
      try{localStorage.setItem(installKey,JSON.stringify([...next]));}catch{}
      return next;
    });
  }
  const {cols,rows,size}=cfg;
  const gridW=cols*(size+GP)-GP, gridH=rows*(size+GP)-GP;
  const entries=Object.entries(pos);
  const installedCount=[...installed].filter(k=>{
    const [x,y]=k.split(',').map(Number);
    return x<cols&&y<rows;
  }).length;
  return (
    <div style={{marginBottom:28}}>
      <div style={{display:'flex',alignItems:'baseline',gap:10,marginBottom:10,flexWrap:'wrap'}}>
        <h3 style={{fontSize:16,fontWeight:700,color:T.text,margin:0}}>{title}</h3>
        <span style={{fontSize:12,color:T.sub}}>&#x1F4A7; {installedCount} pot{installedCount!==1?'s':''} on drip line</span>
      </div>
      {entries.length===0&&!editMode?(
        <div style={{padding:20,textAlign:'center',color:T.sub,fontSize:13,
          background:T.surface,borderRadius:10,border:'1px dashed '+T.border}}>
          No plants placed on the {title} map yet.
        </div>
      ):(
        <div style={{overflowX:'auto'}}>
          <div style={{display:'grid',gridTemplateColumns:`repeat(${cols},${size}px)`,
            gridTemplateRows:`repeat(${rows},${size}px)`,gap:GP,width:gridW,height:gridH}}>
            {Array.from({length:rows},(_,y)=>Array.from({length:cols},(_,x)=>{
              const key=`${x},${y}`;
              const val=pos[key];
              const isInstalled=installed.has(key);
              const plants=val?String(val).split(',').filter(Boolean)
                .map(id=>allPlants.find(p=>String(p.id)===id)).filter(Boolean):[];
              const dripBadge=isInstalled&&(
                <div title="Drip line installed" style={{position:'absolute',top:-4,right:-4,
                  width:16,height:16,borderRadius:'50%',background:'#22c55e',
                  border:'2px solid '+T.card,display:'flex',alignItems:'center',justifyContent:'center',
                  fontSize:8,lineHeight:1,boxShadow:'0 1px 3px rgba(0,0,0,.4)'}}>&#x1F4A7;</div>
              );
              if(!plants.length){
                return (
                  <div key={key} onClick={editMode?()=>toggleInstalled(key):undefined}
                    style={{position:'relative',width:size,height:size,borderRadius:8,
                      border:'1px dashed '+(isInstalled?'#22c55e':T.border),
                      background:isInstalled?'rgba(34,197,94,0.08)':T.surface,
                      cursor:editMode?'pointer':'default'}}>
                    {dripBadge}
                  </div>
                );
              }
              const levels=plants.map(waterLevel);
              const worst=levels.includes('high')?'high':levels.includes('med')?'med':'low';
              const c=WATER_LEVEL_COLORS[worst];
              const names=plants.map(p=>p.name).join(', ');
              return (
                <div key={key} onClick={editMode?()=>toggleInstalled(key):undefined}
                  title={plants.map(p=>p.name+' — '+WATER_LEVEL_COLORS[waterLevel(p)].label+' water need').join('\n')
                    +(isInstalled?'\n\n💧 Drip line installed':'')}
                  style={{position:'relative',width:size,height:size,borderRadius:8,background:c.bg,
                    border:'2px solid '+(isInstalled?'#22c55e':c.border),
                    boxShadow:isInstalled?'0 0 0 2px rgba(34,197,94,0.5)':'none',
                    display:'flex',alignItems:'center',
                    justifyContent:'center',padding:3,overflow:'hidden',
                    cursor:editMode?'pointer':'default'}}>
                  {dripBadge}
                  <span style={{fontSize:8,color:'#fff',fontWeight:700,textAlign:'center',
                    lineHeight:1.15,textShadow:'0 1px 2px rgba(0,0,0,.65)',
                    display:'-webkit-box',WebkitLineClamp:4,WebkitBoxOrient:'vertical',overflow:'hidden'}}>
                    {names}
                  </span>
                </div>
              );
            }))}
          </div>
        </div>
      )}
    </div>
  );
}

export function IrrigationMap({allPlants}){
  const T=React.useContext(ThemeCtx);
  const [editMode,setEditMode]=React.useState(false);
  const MAP_BASE_SIZE={courtyard:{cols:14,rows:8,size:76},garden:{cols:14,rows:9,size:76}};
  function getCfg(k){
    let ms={};
    try{ms=JSON.parse(localStorage.getItem('map-settings')||'{}');}catch{}
    return {...MAP_BASE_SIZE[k],...(ms[k]||{})};
  }
  return (
    <div>
      <div style={{display:'flex',alignItems:'center',gap:16,marginBottom:12,flexWrap:'wrap'}}>
        <h2 style={{fontSize:20,fontWeight:700,color:T.text,margin:0}}>&#x1F4A7; Irrigation System</h2>
        <div style={{display:'flex',gap:14,alignItems:'center',marginLeft:'auto',flexWrap:'wrap'}}>
          {['low','med','high'].map(k=>{
            const c=WATER_LEVEL_COLORS[k];
            return (
              <div key={k} style={{display:'flex',alignItems:'center',gap:5}}>
                <div style={{width:14,height:14,borderRadius:4,background:c.bg,border:'2px solid '+c.border}}/>
                <span style={{fontSize:12,color:T.sub}}>{c.label}</span>
              </div>
            );
          })}
          <button onClick={()=>setEditMode(e=>!e)} style={{
            padding:'5px 12px',borderRadius:20,cursor:'pointer',fontSize:12,fontWeight:600,
            border:'1px solid '+(editMode?'#22c55e':T.border),
            background:editMode?'rgba(34,197,94,0.15)':T.input,
            color:editMode?'#22c55e':T.sub}}>
            &#x1F527; {editMode?'Done marking install status':'Mark drip install status'}
          </button>
        </div>
      </div>
      <p style={{color:T.sub,fontSize:13,marginBottom:20}}>
        Colour reflects each plant's watering need, worked out automatically from its care info
        (Low / Medium / High). A shared pot is coloured by the highest need among its plants.
        This mirrors whatever is currently placed on the Courtyard and Back Garden maps — change
        placements there and this view updates to match.
        {editMode&&<><br/><strong style={{color:'#22c55e'}}>Edit mode:</strong> tap any pot or empty cell below to mark whether its drip line is physically connected yet.</>}
      </p>
      <IrrigationSection title="Courtyard" storageKey="courtyard-map" fallback={COURTYARD_DEFAULT} cfg={getCfg('courtyard')} allPlants={allPlants} editMode={editMode}/>
      <IrrigationSection title="Back Garden" storageKey="garden-map" fallback={null} cfg={getCfg('garden')} allPlants={allPlants} editMode={editMode}/>
    </div>
  );
}
