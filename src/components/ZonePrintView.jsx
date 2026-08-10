import React from 'react';
import { SeasonalTasksPanel, SowingCalendar, WateringCalendarView } from './Calendars.jsx';
import { LIGHT, ThemeCtx, plantsInArea } from '../utils.js';

export function ZonePrintModal({area, currentArea, allPlants, careLog, onClose}){
  const zonePlants = plantsInArea(area, allPlants, currentArea.defaultPos);

  let pos = null;
  try{ pos = JSON.parse(localStorage.getItem(area+'-map')||'null'); }catch{}
  if(!pos) pos = currentArea.defaultPos||{};
  const byId = {};
  zonePlants.forEach(p=>{ byId[String(p.id)]=p; });
  const cellNames = {};
  Object.entries(pos).forEach(([key,v])=>{
    const names = String(v).split(',').filter(Boolean).map(id=>byId[id]?.name).filter(Boolean);
    if(names.length) cellNames[key]=names.join(', ');
  });

  return (
    <ThemeCtx.Provider value={LIGHT}>
      <div onClick={onClose} style={{position:'fixed',inset:0,background:'rgba(0,0,0,0.6)',
        zIndex:1200,display:'flex',alignItems:'center',justifyContent:'center',padding:16}}>
        <style>{`
          @media print {
            body * { visibility: hidden; }
            #zone-print-root, #zone-print-root * { visibility: visible; }
            #zone-print-root { position: absolute; top: 0; left: 0; width: 100%; box-shadow: none !important; max-height: none !important; }
            #zone-print-hide { display: none !important; }
          }
        `}</style>
        <div id="zone-print-root" onClick={e=>e.stopPropagation()} style={{background:LIGHT.card,
          borderRadius:12, maxWidth:700, width:'100%', maxHeight:'90vh', overflowY:'auto',
          border:'1px solid '+LIGHT.borderMid, boxShadow:'0 -4px 40px rgba(0,0,0,0.5)', padding:24}}>
          <div id="zone-print-hide" style={{display:'flex',justifyContent:'flex-end',gap:8,marginBottom:12}}>
            <button onClick={()=>window.print()} style={{padding:'6px 14px',borderRadius:20,
              border:'1px solid '+LIGHT.accent,cursor:'pointer',fontSize:13,fontWeight:600,
              background:LIGHT.accent,color:'#fff'}}>
              &#x1F5A8;&#xFE0F; Print
            </button>
            <button onClick={onClose} style={{padding:'6px 14px',borderRadius:20,
              border:'1px solid '+LIGHT.border,cursor:'pointer',fontSize:13,
              background:LIGHT.input,color:LIGHT.text}}>
              &#x2715; Close
            </button>
          </div>

          <h2 style={{fontSize:20,fontWeight:700,color:LIGHT.text,margin:'0 0 4px',
            display:'flex',alignItems:'center',gap:8}}>
            <span dangerouslySetInnerHTML={{__html:currentArea.icon}}/> {currentArea.label} — Zone Summary
          </h2>
          <p style={{color:LIGHT.sub,fontSize:12,margin:'0 0 16px'}}>
            Printed {new Date().toLocaleDateString('en-GB',{day:'numeric',month:'long',year:'numeric'})}
          </p>

          <h3 style={{fontSize:14,fontWeight:700,color:LIGHT.text,margin:'0 0 8px'}}>&#x1F5FA;&#xFE0F; Plant Layout</h3>
          {Object.keys(cellNames).length===0?(
            <p style={{color:LIGHT.sub,fontSize:13,marginBottom:20}}>No plants placed in this zone yet.</p>
          ):(
            <div style={{display:'grid',
              gridTemplateColumns:`repeat(${currentArea.cols},minmax(0,1fr))`,
              gap:2,marginBottom:20,border:'1px solid '+LIGHT.border}}>
              {Array.from({length:currentArea.rows},(_,y)=>Array.from({length:currentArea.cols},(_,x)=>{
                const key=`${x},${y}`, label=cellNames[key];
                return (
                  <div key={key} style={{minHeight:36,border:'1px solid '+LIGHT.border,
                    background:label?LIGHT.surface:'transparent',
                    fontSize:9,color:LIGHT.text,padding:2,overflow:'hidden',
                    display:'flex',alignItems:'center',justifyContent:'center',textAlign:'center'}}>
                    {label}
                  </div>
                );
              }))}
            </div>
          )}

          {zonePlants.length===0?(
            <p style={{color:LIGHT.sub,fontSize:13}}>No plants placed in this zone yet — nothing to schedule.</p>
          ):(<>
            <WateringCalendarView allPlants={zonePlants} careLog={careLog}/>
            <SeasonalTasksPanel allPlants={zonePlants}/>
            <h3 style={{fontSize:14,fontWeight:700,color:LIGHT.text,margin:'16px 0 8px'}}>&#x1F331; Sowing Calendar</h3>
            <SowingCalendar allPlants={zonePlants}/>
          </>)}
        </div>
      </div>
    </ThemeCtx.Provider>
  );
}
