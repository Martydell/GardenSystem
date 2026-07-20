import React from 'react';
import { COURTYARD_DEFAULT } from '../data/zones.js';
import { ThemeCtx, WATER_LEVEL_COLORS, waterLevel } from '../utils.js';

export function IrrigationSection({title,storageKey,fallback,cfg,allPlants}){
  const T=React.useContext(ThemeCtx);
  const GP=4;
  const pos=(()=>{
    try{const s=JSON.parse(localStorage.getItem(storageKey)||'null');return s||fallback||{};}
    catch{return fallback||{};}
  })();
  const {cols,rows,size}=cfg;
  const gridW=cols*(size+GP)-GP, gridH=rows*(size+GP)-GP;
  const entries=Object.entries(pos);
  return (
    <div style={{marginBottom:28}}>
      <h3 style={{fontSize:16,fontWeight:700,color:T.text,marginBottom:10}}>{title}</h3>
      {entries.length===0?(
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
              const plants=val?String(val).split(',').filter(Boolean)
                .map(id=>allPlants.find(p=>String(p.id)===id)).filter(Boolean):[];
              if(!plants.length){
                return <div key={key} style={{width:size,height:size,borderRadius:8,
                  border:'1px dashed '+T.border,background:T.surface}}/>;
              }
              const levels=plants.map(waterLevel);
              const worst=levels.includes('high')?'high':levels.includes('med')?'med':'low';
              const c=WATER_LEVEL_COLORS[worst];
              const names=plants.map(p=>p.name).join(', ');
              return (
                <div key={key}
                  title={plants.map(p=>p.name+' — '+WATER_LEVEL_COLORS[waterLevel(p)].label+' water need').join('\n')}
                  style={{width:size,height:size,borderRadius:8,background:c.bg,
                    border:'2px solid '+c.border,display:'flex',alignItems:'center',
                    justifyContent:'center',padding:3,overflow:'hidden',cursor:'default'}}>
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
        </div>
      </div>
      <p style={{color:T.sub,fontSize:13,marginBottom:20}}>
        Colour reflects each plant's watering need, worked out automatically from its care info
        (Low / Medium / High). A shared pot is coloured by the highest need among its plants.
        This mirrors whatever is currently placed on the Courtyard and Back Garden maps — change
        placements there and this view updates to match.
      </p>
      <IrrigationSection title="Courtyard" storageKey="courtyard-map" fallback={COURTYARD_DEFAULT} cfg={getCfg('courtyard')} allPlants={allPlants}/>
      <IrrigationSection title="Back Garden" storageKey="garden-map" fallback={null} cfg={getCfg('garden')} allPlants={allPlants}/>
    </div>
  );
}
