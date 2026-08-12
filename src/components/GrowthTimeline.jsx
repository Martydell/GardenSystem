import React from 'react';
import { ThemeCtx, GROWTH_STAGES, fmtCalendarDate, resizeImageToDataURL,
  fetchGrowthTimeline, uploadGrowthPhoto, deleteGrowthPhoto, getTimelinePin, setTimelinePin } from '../utils.js';

export function GrowthTimeline({plant}){
  const T=React.useContext(ThemeCtx);
  const [entries,setEntries]=React.useState(null); // null = loading
  const [error,setError]=React.useState(null);
  const [openAt,setOpenAt]=React.useState(null);
  const [adding,setAdding]=React.useState(false);
  const [stage,setStage]=React.useState('Seedling');
  const [date,setDate]=React.useState(()=>new Date().toISOString().slice(0,10));
  const [pendingPhoto,setPendingPhoto]=React.useState(null);
  const [saving,setSaving]=React.useState(false);
  const fileRef=React.useRef(null);

  const load=React.useCallback(()=>{
    fetchGrowthTimeline(plant.id).then(setEntries).catch(e=>setError(e.message));
  },[plant.id]);

  React.useEffect(()=>{ setEntries(null); setError(null); load(); },[load]);

  async function handleFile(e){
    const file=e.target.files&&e.target.files[0];
    e.target.value='';
    if(!file)return;
    const dataUrl=await resizeImageToDataURL(file,1200,0.75);
    setPendingPhoto(dataUrl);
    setStage('Seedling');
    setDate(new Date().toISOString().slice(0,10));
    setAdding(true);
  }

  async function submit(){
    let pin=getTimelinePin();
    if(!pin){
      pin=window.prompt('Enter your growth-photo upload PIN (set once per device):')||'';
      if(!pin)return;
      setTimelinePin(pin);
    }
    setSaving(true);
    setError(null);
    try{
      await uploadGrowthPhoto(plant.id,{stage,date,dataUrl:pendingPhoto},pin);
      setAdding(false);
      setPendingPhoto(null);
      load();
    }catch(err){
      if(/pin/i.test(err.message))setTimelinePin('');
      setError(err.message);
    }finally{
      setSaving(false);
    }
  }

  async function handleRemove(ts){
    if(!window.confirm('Remove this growth photo?'))return;
    let pin=getTimelinePin();
    if(!pin){ pin=window.prompt('Enter your growth-photo upload PIN:')||''; if(!pin)return; setTimelinePin(pin); }
    try{
      await deleteGrowthPhoto(plant.id,ts,pin);
      setOpenAt(null);
      load();
    }catch(err){
      if(/pin/i.test(err.message))setTimelinePin('');
      setError(err.message);
    }
  }

  const list=entries||[];

  return (
    <div style={{marginBottom:16}}>
      <div style={{display:'flex',alignItems:'center',justifyContent:'space-between',marginBottom:8}}>
        <div style={{fontSize:12,fontWeight:600,color:T.sub,textTransform:'uppercase',letterSpacing:0.5}}>
          &#x1F331; Growth Timeline
        </div>
        <input ref={fileRef} type="file" accept="image/*" capture="environment" style={{display:'none'}} onChange={handleFile}/>
        <button onClick={()=>fileRef.current&&fileRef.current.click()} style={{
          padding:'3px 10px',background:'rgba(122,184,106,0.12)',border:'1px solid rgba(122,184,106,0.4)',
          borderRadius:20,color:T.accent,fontSize:11,cursor:'pointer',fontWeight:600}}>
          &#x1F4F7; Add growth photo
        </button>
      </div>

      {error&&<div style={{color:'#ef4444',fontSize:12,marginBottom:8}}>{error}</div>}

      {entries===null&&!error&&<div style={{color:T.sub,fontSize:12}}>Loading&hellip;</div>}

      {entries!==null&&list.length===0&&(
        <div style={{color:T.sub,fontSize:12,fontStyle:'italic'}}>
          No growth photos yet — tap &ldquo;Add growth photo&rdquo; to start tracking from seedling to maturity.
        </div>
      )}

      {list.length>0&&(
        <div style={{display:'flex',gap:8,overflowX:'auto',paddingBottom:4}}>
          {list.map((e,i)=>(
            <button key={e.ts} onClick={()=>setOpenAt(i)} title={`${e.stage} — ${fmtCalendarDate(e.date)}`}
              style={{flexShrink:0,width:64,borderRadius:8,overflow:'hidden',padding:0,cursor:'pointer',
                border:'1px solid '+T.border,background:T.surface,textAlign:'left'}}>
              <img src={e.photoUrl} alt={`${plant.name} — ${e.stage}`} loading="lazy" style={{width:64,height:64,objectFit:'cover',display:'block'}}/>
              <div style={{fontSize:9,color:T.sub,padding:'2px 4px',whiteSpace:'nowrap',overflow:'hidden',textOverflow:'ellipsis'}}>{e.stage}</div>
            </button>
          ))}
        </div>
      )}

      {openAt!=null&&list[openAt]&&(
        <TimelineLightbox entries={list} index={openAt} onIndexChange={setOpenAt} onClose={()=>setOpenAt(null)} onRemove={handleRemove} plant={plant} T={T}/>
      )}

      {adding&&(
        <div style={{marginTop:10,padding:12,background:T.surface,borderRadius:8}}>
          {pendingPhoto&&<img src={pendingPhoto} alt="New growth photo" style={{width:100,height:100,objectFit:'cover',borderRadius:8,marginBottom:8}}/>}
          <div style={{fontSize:11,color:T.sub,marginBottom:6}}>Growth stage</div>
          <div style={{display:'flex',gap:6,flexWrap:'wrap',marginBottom:10}}>
            {GROWTH_STAGES.map(s=>(
              <button key={s} onClick={()=>setStage(s)} style={{
                padding:'4px 10px',borderRadius:20,border:'1px solid '+(stage===s?T.accent:T.border),
                background:stage===s?T.accent:T.input,color:stage===s?'#fff':T.text,
                fontSize:12,cursor:'pointer'}}>{s}</button>
            ))}
          </div>
          <div style={{fontSize:11,color:T.sub,marginBottom:6}}>Date photo was taken</div>
          <input type="date" value={date} onChange={e=>setDate(e.target.value)} style={{
            background:T.input,border:'1px solid '+T.border,borderRadius:6,color:T.text,
            padding:'6px 10px',fontSize:13,marginBottom:10,display:'block'}}/>
          <div style={{display:'flex',gap:8}}>
            <button onClick={submit} disabled={saving} style={{
              padding:'6px 16px',background:T.green,color:'#fff',border:'none',
              borderRadius:8,fontSize:12,fontWeight:600,cursor:saving?'default':'pointer'}}>
              {saving?'Saving…':'Save photo'}
            </button>
            <button onClick={()=>{setAdding(false);setPendingPhoto(null);}} style={{
              padding:'6px 16px',background:'transparent',color:T.sub,border:'1px solid '+T.border,
              borderRadius:8,fontSize:12,cursor:'pointer'}}>Cancel</button>
          </div>
        </div>
      )}
    </div>
  );
}

function TimelineLightbox({entries,index,onIndexChange,onClose,onRemove,plant,T}){
  const entry=entries[index];
  React.useEffect(()=>{
    const h=e=>{
      if(e.key==='Escape')onClose();
      if(e.key==='ArrowLeft'&&index>0)onIndexChange(index-1);
      if(e.key==='ArrowRight'&&index<entries.length-1)onIndexChange(index+1);
    };
    window.addEventListener('keydown',h);
    return()=>window.removeEventListener('keydown',h);
  },[index,entries.length,onClose,onIndexChange]);
  if(!entry)return null;
  const btnStyle={background:'rgba(0,0,0,0.55)',border:'none',color:'#fff',borderRadius:'50%',
    width:36,height:36,cursor:'pointer',fontSize:18,display:'flex',alignItems:'center',justifyContent:'center'};
  return (
    <div onClick={onClose} style={{position:'fixed',inset:0,background:'rgba(0,0,0,0.92)',
      zIndex:1100,display:'flex',flexDirection:'column',alignItems:'center',justifyContent:'center',cursor:'zoom-out'}}>
      <img src={entry.photoUrl} alt={`${plant.name} — ${entry.stage}`} onClick={e=>e.stopPropagation()} style={{
        maxWidth:'90vw',maxHeight:'78vh',objectFit:'contain',borderRadius:8,
        boxShadow:'0 8px 30px rgba(0,0,0,0.5)'}}/>
      <div onClick={e=>e.stopPropagation()} style={{display:'flex',alignItems:'center',gap:16,marginTop:16}}>
        <button onClick={()=>onIndexChange(index-1)} disabled={index===0} aria-label="Previous photo" style={{...btnStyle,opacity:index===0?0.3:1,cursor:index===0?'default':'pointer'}}>&#x2190;</button>
        <span style={{color:'#fff',fontSize:13}}>{entry.stage} &bull; {fmtCalendarDate(entry.date)} &bull; {index+1}/{entries.length}</span>
        <button onClick={()=>onIndexChange(index+1)} disabled={index===entries.length-1} aria-label="Next photo" style={{...btnStyle,opacity:index===entries.length-1?0.3:1,cursor:index===entries.length-1?'default':'pointer'}}>&#x2192;</button>
      </div>
      <button onClick={e=>{e.stopPropagation();onRemove(entry.ts);}}
        style={{marginTop:10,background:'none',border:'1px solid rgba(239,68,68,0.5)',color:'#ef4444',
          borderRadius:20,padding:'5px 14px',fontSize:12,cursor:'pointer'}}>
        &#x1F5D1;&#xFE0F; Remove this photo
      </button>
      <button onClick={onClose} aria-label="Close" style={{position:'fixed',top:16,right:20,background:'none',
        border:'none',color:'#fff',fontSize:28,cursor:'pointer',lineHeight:1}}>&#x2715;</button>
    </div>
  );
}
