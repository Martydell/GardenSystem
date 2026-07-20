import React from 'react';
import { COMPANIONS } from '../data/plants.js';
import { ThemeCtx, fmtDate, repotApplicable } from '../utils.js';

export function PhotoLightbox({src, onClose}){
  React.useEffect(()=>{
    const h=e=>{if(e.key==='Escape')onClose();};
    window.addEventListener('keydown',h);
    return()=>window.removeEventListener('keydown',h);
  },[onClose]);
  return (
    <div onClick={onClose} style={{position:'fixed',inset:0,background:'rgba(0,0,0,0.92)',
      zIndex:9999,display:'flex',alignItems:'center',justifyContent:'center',cursor:'zoom-out'}}>
      <img src={src} alt="" onClick={e=>e.stopPropagation()} style={{
        maxWidth:'90vw',maxHeight:'90vh',objectFit:'contain',borderRadius:8,
        boxShadow:'0 8px 40px rgba(0,0,0,0.8)'}}/>
      <button onClick={onClose} style={{position:'fixed',top:16,right:20,background:'none',
        border:'none',color:'#fff',fontSize:28,cursor:'pointer',lineHeight:1}}>&#x2715;</button>
    </div>
  );
}

export function CareActionsBar({plant, careLog, onLog}){
  const T = React.useContext(ThemeCtx);
  const actions = [
    {type:'watered', label:'Watered', icon:'&#x1F4A7;', always:true},
    {type:'fed',     label:'Fed',     icon:'&#x1F9EA;', always:true},
    {type:'repotted',label:'Repotted',icon:'&#x1FAB4;', always:repotApplicable(plant)},
  ].filter(a=>a.always);
  return (
    <div style={{display:'flex',gap:8,flexWrap:'wrap'}}>
      {actions.map(a=>{
        const ts=careLog[String(plant.id)+'-'+a.type];
        const days=ts?Math.round((Date.now()-ts)/86400000):null;
        return (
          <button key={a.type} onClick={()=>onLog(plant.id,a.type)} style={{
            flex:'1 1 80px', padding:'8px 10px', border:'1px solid '+T.borderMid,
            borderRadius:8, background:T.input, color:T.text, cursor:'pointer',
            display:'flex',flexDirection:'column',alignItems:'center',gap:2,
          }}>
            <span style={{fontSize:18}} dangerouslySetInnerHTML={{__html:a.icon}}/>
            <span style={{fontSize:12,fontWeight:600}}>{a.label}</span>
            <span style={{fontSize:10,color:T.sub}}>{days!=null?days+'d ago':'never'}</span>
          </button>
        );
      })}
    </div>
  );
}

export function CompanionPanel({plant}){
  const T = React.useContext(ThemeCtx);
  const list = COMPANIONS[plant.id];
  if(!list||!list.length) return null;
  return (
    <div style={{marginTop:12}}>
      <div style={{fontSize:12,fontWeight:600,color:T.sub,marginBottom:6,textTransform:'uppercase',letterSpacing:0.5}}>
        &#x1F91D; Companion Plants
      </div>
      <div style={{display:'flex',flexWrap:'wrap',gap:6}}>
        {list.map(c=>(
          <span key={c} style={{background:T.surface,color:T.text,fontSize:12,
            padding:'3px 8px',borderRadius:20,border:'1px solid '+T.border}}>{c}</span>
        ))}
      </div>
    </div>
  );
}

export function PestNotes({plantId, notes, onAdd}){
  const T = React.useContext(ThemeCtx);
  const [text, setText] = React.useState('');
  const entries = notes[String(plantId)] || [];
  function submit(){
    const t=text.trim();
    if(!t)return;
    onAdd(plantId,t);
    setText('');
  }
  return (
    <div style={{marginTop:12}}>
      <div style={{fontSize:12,fontWeight:600,color:T.sub,marginBottom:6,textTransform:'uppercase',letterSpacing:0.5}}>
        &#x1F50D; Pest &amp; Disease Notes
      </div>
      <div style={{display:'flex',gap:6,marginBottom:8}}>
        <input value={text} onChange={e=>setText(e.target.value)}
          onKeyDown={e=>e.key==='Enter'&&submit()}
          placeholder="Add observation..."
          style={{flex:1,padding:'6px 10px',background:T.input,border:'1px solid '+T.border,
            borderRadius:6,color:T.text,fontSize:12,outline:'none'}}/>
        <button onClick={submit} style={{padding:'6px 12px',background:T.green,border:'none',
          borderRadius:6,color:'#fff',fontSize:12,cursor:'pointer',fontWeight:600}}>Add</button>
      </div>
      {entries.map((e,i)=>(
        <div key={i} style={{fontSize:12,color:T.text,padding:'6px 8px',
          background:T.surface,borderRadius:6,marginBottom:4}}>
          <span style={{color:T.sub,fontSize:11}}>{fmtDate(e.date)} &#x2014; </span>{e.text}
        </div>
      ))}
    </div>
  );
}

export function HarvestLog({plant, harvests, onAdd}){
  const T = React.useContext(ThemeCtx);
  const isEdible = (plant.tags||[]).some(t=>['Edible','Productive','Culinary'].includes(t));
  if(!isEdible) return null;
  const [qty,setQty]=React.useState('');
  const [note,setNote]=React.useState('');
  const entries = harvests[String(plant.id)] || [];
  function submit(){
    if(!qty.trim()&&!note.trim())return;
    onAdd(plant.id, qty.trim(), note.trim());
    setQty(''); setNote('');
  }
  return (
    <div style={{marginTop:12}}>
      <div style={{fontSize:12,fontWeight:600,color:T.sub,marginBottom:6,textTransform:'uppercase',letterSpacing:0.5}}>
        &#x1F33E; Harvest Log
      </div>
      <div style={{display:'flex',gap:6,marginBottom:6,flexWrap:'wrap'}}>
        <input value={qty} onChange={e=>setQty(e.target.value)} placeholder="Quantity (e.g. 200g)"
          style={{flex:'1 1 100px',padding:'6px 10px',background:T.input,border:'1px solid '+T.border,
            borderRadius:6,color:T.text,fontSize:12,outline:'none'}}/>
        <input value={note} onChange={e=>setNote(e.target.value)} placeholder="Notes (optional)"
          onKeyDown={e=>e.key==='Enter'&&submit()}
          style={{flex:'2 1 140px',padding:'6px 10px',background:T.input,border:'1px solid '+T.border,
            borderRadius:6,color:T.text,fontSize:12,outline:'none'}}/>
        <button onClick={submit} style={{padding:'6px 12px',background:'#d97706',border:'none',
          borderRadius:6,color:'#fff',fontSize:12,cursor:'pointer',fontWeight:600}}>Log</button>
      </div>
      {entries.slice(0,5).map((e,i)=>(
        <div key={i} style={{fontSize:12,color:T.text,padding:'6px 8px',
          background:T.surface,borderRadius:6,marginBottom:4,display:'flex',gap:8}}>
          <span style={{color:'#d97706',fontWeight:600}}>{e.qty||'—'}</span>
          <span style={{color:T.sub,fontSize:11}}>{fmtDate(e.date)}</span>
          {e.note&&<span style={{color:T.text}}>{e.note}</span>}
        </div>
      ))}
    </div>
  );
}

export function PestLogModal({plant, pestLog, onLog, onResolve, onClose}){
  const T=React.useContext(ThemeCtx);
  const [pest,setPest]=React.useState('');
  const [note,setNote]=React.useState('');
  const PESTS=['Spider mite','Aphids','Mealybug','Scale insect','Fungus gnats','Root rot','Leaf spot','Powdery mildew','Vine weevil','Thrips','Yellowing','Wilting','Other'];
  const plantPests=(pestLog||[]).filter(e=>String(e.plantId)===String(plant.id));
  const active=plantPests.filter(e=>!e.resolved);
  const resolved=plantPests.filter(e=>e.resolved).slice(0,3);
  function submit(){if(!pest)return;onLog(plant.id,pest,note);setPest('');setNote('');}
  return (
    <div style={{position:'fixed',inset:0,zIndex:3000,background:'rgba(0,0,0,0.72)',
      display:'flex',alignItems:'center',justifyContent:'center',padding:16}}>
      <div style={{background:T.card,borderRadius:16,padding:20,maxWidth:440,width:'100%',
        boxShadow:'0 20px 60px rgba(0,0,0,0.5)',maxHeight:'82vh',overflowY:'auto'}}>
        <div style={{display:'flex',alignItems:'center',justifyContent:'space-between',marginBottom:14}}>
          <div style={{fontWeight:700,fontSize:15,color:T.text}}>&#x1F41B; Pest &amp; Disease — {plant.name}</div>
          <button onClick={onClose} style={{background:'none',border:'none',color:T.sub,fontSize:20,cursor:'pointer'}}>&#x2715;</button>
        </div>
        {active.length>0&&(
          <div style={{marginBottom:14}}>
            <div style={{fontSize:12,fontWeight:600,color:'#ef4444',marginBottom:8}}>&#x26A0; Active Issues ({active.length})</div>
            {active.map((e,i)=>(
              <div key={i} style={{display:'flex',alignItems:'flex-start',gap:8,padding:'8px 10px',
                background:'rgba(239,68,68,0.08)',borderRadius:8,marginBottom:5,border:'1px solid rgba(239,68,68,0.2)'}}>
                <div style={{flex:1}}>
                  <div style={{fontWeight:600,color:T.text,fontSize:13}}>{e.pest}</div>
                  {e.note&&<div style={{color:T.sub,fontSize:11,marginTop:2}}>{e.note}</div>}
                  <div style={{color:T.sub,fontSize:10,marginTop:2}}>{fmtDate(e.date)}</div>
                </div>
                <button onClick={()=>onResolve(e.id)} style={{padding:'3px 8px',background:'rgba(34,197,94,0.15)',
                  color:'#22c55e',border:'1px solid rgba(34,197,94,0.3)',borderRadius:4,fontSize:11,cursor:'pointer'}}>
                  ✓ Resolved
                </button>
              </div>
            ))}
          </div>
        )}
        {resolved.length>0&&(
          <div style={{marginBottom:14}}>
            <div style={{fontSize:11,color:T.sub,marginBottom:5}}>Past issues</div>
            {resolved.map((e,i)=>(
              <div key={i} style={{padding:'4px 8px',background:T.surface,borderRadius:6,marginBottom:3,
                fontSize:11,color:T.sub,opacity:0.75}}>
                ✓ {e.pest}{e.note?' — '+e.note:''} <span style={{marginLeft:4,fontSize:10}}>{fmtDate(e.date)}</span>
              </div>
            ))}
          </div>
        )}
        {!active.length&&!resolved.length&&(
          <div style={{textAlign:'center',padding:'16px 0 12px',color:T.sub,fontSize:13}}>No issues logged yet for this plant</div>
        )}
        <div style={{borderTop:'1px solid '+T.border,paddingTop:14}}>
          <div style={{fontSize:12,fontWeight:600,color:T.text,marginBottom:8}}>Log new issue</div>
          <div style={{display:'flex',flexWrap:'wrap',gap:4,marginBottom:8}}>
            {PESTS.map(p=>(
              <button key={p} onClick={()=>setPest(p)} style={{padding:'3px 8px',borderRadius:20,
                border:'1px solid '+(pest===p?T.accent:T.border),background:pest===p?T.accent:'transparent',
                color:pest===p?'#fff':T.text,fontSize:11,cursor:'pointer'}}>{p}</button>
            ))}
          </div>
          <textarea value={note} onChange={e=>setNote(e.target.value)}
            placeholder="Notes — treatment used, severity..." rows={2}
            style={{width:'100%',background:T.input,border:'1px solid '+T.border,borderRadius:6,color:T.text,
              padding:8,fontSize:12,resize:'none',marginBottom:10,boxSizing:'border-box'}}/>
          <button onClick={submit} disabled={!pest} style={{width:'100%',padding:'8px',
            background:pest?T.green:'#6b7280',color:'#fff',border:'none',borderRadius:8,
            fontSize:13,fontWeight:600,cursor:pest?'pointer':'default'}}>Log Issue</button>
        </div>
      </div>
    </div>
  );
}

export function BulkWaterModal({plants, onConfirm, onClose}){
  const T=React.useContext(ThemeCtx);
  return (
    <div style={{position:'fixed',inset:0,zIndex:3000,background:'rgba(0,0,0,0.72)',
      display:'flex',alignItems:'center',justifyContent:'center',padding:16}}>
      <div style={{background:T.card,borderRadius:16,padding:20,maxWidth:380,width:'100%',
        boxShadow:'0 20px 60px rgba(0,0,0,0.5)'}}>
        <div style={{fontWeight:700,fontSize:16,color:T.text,marginBottom:8}}>&#x1F4A7; Water All Overdue</div>
        <p style={{color:T.sub,fontSize:13,marginBottom:14}}>
          Mark {plants.length} plant{plants.length!==1?'s':''} as watered right now?
        </p>
        <div style={{maxHeight:200,overflowY:'auto',marginBottom:16,borderRadius:8,
          border:'1px solid '+T.border,padding:8}}>
          {plants.map(p=>(
            <div key={p.id} style={{padding:'4px 6px',fontSize:12,color:T.text,
              borderBottom:'1px solid '+T.border}}>&#x1F4A7; {p.name}</div>
          ))}
        </div>
        <div style={{display:'flex',gap:8,justifyContent:'flex-end'}}>
          <button onClick={onClose} style={{padding:'7px 14px',background:T.input,
            color:T.text,border:'1px solid '+T.border,borderRadius:8,fontSize:13,cursor:'pointer'}}>Cancel</button>
          <button onClick={onConfirm} style={{padding:'7px 16px',background:T.green,
            color:'#fff',border:'none',borderRadius:8,fontSize:13,fontWeight:600,cursor:'pointer'}}>
            ✓ Water {plants.length} Plants
          </button>
        </div>
      </div>
    </div>
  );
}
