import React from 'react';
import { ThemeCtx, WATER_LEVEL_COLORS, fmtDate, waterLevel } from '../utils.js';

function HydroReservoirPanel({area}){
  const T=React.useContext(ThemeCtx);
  const waterKey=area.key+'-water-change';
  const nutrientAKey=area.key+'-nutrient-a-ml-per-l';
  const nutrientBKey=area.key+'-nutrient-b-ml-per-l';
  const [wc,setWc]=React.useState(()=>{
    try{ return JSON.parse(localStorage.getItem(waterKey)||'null')||{lastChanged:null,intervalDays:14}; }
    catch{ return {lastChanged:null,intervalDays:14}; }
  });
  const [mlA,setMlA]=React.useState(()=>{
    try{ const v=JSON.parse(localStorage.getItem(nutrientAKey)||'null'); return v!=null?v:5; }
    catch{ return 5; }
  });
  const [mlB,setMlB]=React.useState(()=>{
    try{ const v=JSON.parse(localStorage.getItem(nutrientBKey)||'null'); return v!=null?v:5; }
    catch{ return 5; }
  });
  function saveWc(next){
    setWc(next);
    try{localStorage.setItem(waterKey,JSON.stringify(next));}catch{}
  }
  function saveMlA(v){
    setMlA(v);
    try{localStorage.setItem(nutrientAKey,JSON.stringify(v));}catch{}
  }
  function saveMlB(v){
    setMlB(v);
    try{localStorage.setItem(nutrientBKey,JSON.stringify(v));}catch{}
  }

  const daysSince = wc.lastChanged ? (Date.now()-wc.lastChanged)/86400000 : null;
  const daysLeft = daysSince!=null ? wc.intervalDays-daysSince : null;
  const level = daysLeft==null?'unset':daysLeft<=0?'overdue':daysLeft<=wc.intervalDays*0.35?'soon':'ok';
  const levelColor = {overdue:'#ef4444',soon:'#f59e0b',ok:'#22c55e',unset:'#6b7280'}[level];

  return (
    <div style={{background:T.card,border:'1px solid '+T.border,borderRadius:12,padding:'14px 16px',marginBottom:20}}>
      <h3 style={{fontSize:16,fontWeight:700,color:T.text,margin:'0 0 14px'}}>&#x1F9EA; Hydroponic Reservoir</h3>

      <div style={{display:'flex',alignItems:'center',gap:14,flexWrap:'wrap',marginBottom:16,
        paddingBottom:16,borderBottom:'1px solid '+T.border}}>
        <div style={{flex:'1 1 200px'}}>
          <div style={{fontSize:11,color:T.sub,marginBottom:2}}>Next water change</div>
          <div style={{fontSize:14,fontWeight:700,color:levelColor}}>
            {wc.lastChanged
              ? (daysLeft<=0 ? `Overdue by ${Math.abs(Math.round(daysLeft))}d` : `Due in ${Math.round(daysLeft)}d`)
              : 'Not logged yet'}
          </div>
          {wc.lastChanged&&<div style={{fontSize:11,color:T.sub}}>Last changed {fmtDate(wc.lastChanged)}</div>}
        </div>
        <div style={{display:'flex',alignItems:'center',gap:6}}>
          <span style={{fontSize:11,color:T.sub}}>Every</span>
          <input type="number" min={1} value={wc.intervalDays}
            onChange={e=>saveWc({...wc,intervalDays:Math.max(1,+e.target.value||wc.intervalDays)})}
            style={{width:52,padding:'4px 6px',borderRadius:6,border:'1px solid '+T.border,
              background:T.input,color:T.text,fontSize:12,textAlign:'center'}}/>
          <span style={{fontSize:11,color:T.sub}}>days</span>
        </div>
        <button onClick={()=>saveWc({...wc,lastChanged:Date.now()})} style={{padding:'6px 14px',
          borderRadius:8,border:'none',background:T.green,color:'#fff',fontSize:12,
          fontWeight:600,cursor:'pointer'}}>
          &#x2713; Changed today
        </button>
      </div>

      {[['Nutrient A',mlA,saveMlA],['Nutrient B',mlB,saveMlB]].map(([label,val,save],i)=>(
        <div key={label} style={{marginBottom:i===0?14:0}}>
          <div style={{display:'flex',alignItems:'center',gap:8,marginBottom:10,flexWrap:'wrap'}}>
            <span style={{fontSize:12,fontWeight:600,color:T.text,minWidth:76}}>{label}</span>
            <input type="number" min={0} step={0.1} value={val}
              onChange={e=>save(+e.target.value||0)}
              style={{width:64,padding:'4px 6px',borderRadius:6,border:'1px solid '+T.border,
                background:T.input,color:T.text,fontSize:12,textAlign:'center'}}/>
            <span style={{fontSize:12,color:T.sub}}>ml per litre &mdash; set this to match your own nutrient product</span>
          </div>
          <div style={{display:'flex',gap:8,flexWrap:'wrap'}}>
            {[1,5,10,25,50].map(l=>(
              <div key={l} style={{padding:'8px 12px',borderRadius:8,background:T.surface,
                border:'1px solid '+T.border,textAlign:'center',minWidth:64}}>
                <div style={{fontSize:11,color:T.sub}}>{l}L</div>
                <div style={{fontSize:14,fontWeight:700,color:T.text}}>{(val*l).toFixed(1)}ml</div>
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}

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

export function IrrigationView({area, allPlants}){
  const T=React.useContext(ThemeCtx);
  const [editMode,setEditMode]=React.useState(false);
  function getCfg(){
    let ms={};
    try{ms=JSON.parse(localStorage.getItem('map-settings')||'{}');}catch{}
    return {cols:area.cols,rows:area.rows,size:area.size,...(ms[area.key]||{})};
  }
  return (
    <div>
      <div style={{display:'flex',alignItems:'center',gap:16,marginBottom:12,flexWrap:'wrap'}}>
        <h2 style={{fontSize:20,fontWeight:700,color:T.text,margin:0}}>&#x1F4A7; {area.label} Irrigation</h2>
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
        This mirrors whatever is currently placed on the {area.label} map — change placements
        there and this view updates to match.
        {editMode&&<><br/><strong style={{color:'#22c55e'}}>Edit mode:</strong> tap any pot or empty cell below to mark whether its drip line is physically connected yet.</>}
      </p>
      {area.defaultFilter==='hydro'&&<HydroReservoirPanel area={area}/>}
      <IrrigationSection title={area.label} storageKey={area.key+'-map'} fallback={area.defaultPos||null} cfg={getCfg()} allPlants={allPlants} editMode={editMode}/>
    </div>
  );
}
