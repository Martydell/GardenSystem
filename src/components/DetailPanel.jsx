import React from 'react';
import { CareActionsBar, CompanionPanel, HarvestLog, PestNotes } from './Modals.jsx';
import { CareHistorySparkline } from './PlantCards.jsx';
import { INDOOR_PHOTOS, STATIC_PHOTO_URLS, TAG_C } from '../data/plants.js';
import { STORAGE_INFO, ThemeCtx, badgeForType, getCustomPhoto, isFloweringNow, repotSeason, resizeImageToDataURL, setCustomPhoto, useIsMobile } from '../utils.js';

export function DetailPanel({plant, onClose, careLog, onLog, onPhotoZoom, notes, harvests, onAddNote, onAddHarvest, careHistory, pestLog, onPest}){
  const T = React.useContext(ThemeCtx);
  const M = useIsMobile();
  const {badge,color}=badgeForType(plant.type);
  const flowering=isFloweringNow(plant);
  const basePhoto = plant.type==='indoor'
    ? (INDOOR_PHOTOS[plant.id]||STATIC_PHOTO_URLS[plant.id]||null)
    : STATIC_PHOTO_URLS[plant.id]||null;
  const [customPhoto,setCustomPhotoState]=React.useState(()=>getCustomPhoto(plant.id));
  const photo = customPhoto||basePhoto;
  const uploadRef=React.useRef(null);
  async function handleDetailUpload(e){
    const file=e.target.files&&e.target.files[0];
    e.target.value='';
    if(!file)return;
    const dataUrl=await resizeImageToDataURL(file,1200,0.75);
    setCustomPhotoState(dataUrl);
    setCustomPhoto(plant.id,dataUrl);
  }
  React.useEffect(()=>{
    const h=e=>{if(e.key==='Escape')onClose();};
    window.addEventListener('keydown',h);
    document.body.style.overflow='hidden';
    return()=>{window.removeEventListener('keydown',h);document.body.style.overflow='';}
  },[onClose]);

  const row=(label,val)=>val&&(
    <div style={{display:'flex',gap:10,padding:'8px 0',borderBottom:'1px solid '+T.border}}>
      <span style={{minWidth:100,color:T.sub,fontSize:13}} dangerouslySetInnerHTML={{__html:label}}/>
      <span style={{color:T.text,fontSize:13,flex:1}}>{val}</span>
    </div>
  );

  return (
    <div onClick={onClose} style={{position:'fixed',inset:0,background:T.overlay,
      zIndex:1000,display:'flex',
      alignItems:M?'flex-end':'center',
      justifyContent:'center',
      padding:M?0:16}}>
      <div onClick={e=>e.stopPropagation()} style={{background:T.card,
        borderRadius:M?'20px 20px 0 0':16,
        maxWidth:M?'none':600,width:'100%',
        maxHeight:M?'92vh':'90vh',overflowY:'auto',
        paddingBottom:M?'env(safe-area-inset-bottom)':'0',
        border:'1px solid '+T.borderMid,
        boxShadow:'0 -4px 40px rgba(0,0,0,0.5)'}}>
        {/* Header photo */}
        <div style={{position:'relative',height:200,overflow:'hidden',borderRadius:'16px 16px 0 0',
          background:T.surface,cursor:photo?'zoom-in':'default'}}
          onClick={photo?()=>onPhotoZoom(photo):undefined}>
          {photo&&<img src={photo} alt={plant.name} style={{width:'100%',height:'100%',objectFit:'cover'}}/>}
          {plant.medicinal&&<div style={{position:'absolute',top:12,left:12,background:'#10b981',
            color:'#fff',fontSize:11,fontWeight:700,padding:'3px 8px',borderRadius:5}}>&#x271A; MEDICINAL</div>}
          <div style={{position:'absolute',top:12,right:12,background:color,
            color:'#fff',fontSize:11,fontWeight:700,padding:'3px 8px',borderRadius:5}}>{badge}</div>
          {flowering&&<div style={{position:'absolute',bottom:12,left:12,background:'rgba(122,184,106,0.9)',
            color:'#fff',fontSize:11,fontWeight:700,padding:'3px 8px',borderRadius:5}}>IN SEASON</div>}
          <input ref={uploadRef} type="file" accept="image/*" capture="environment" style={{display:'none'}} onChange={handleDetailUpload}/>
          <button onClick={e=>{e.stopPropagation();uploadRef.current&&uploadRef.current.click();}}
            title="Upload your own photo"
            style={{position:'absolute',bottom:12,right:12,background:'rgba(0,0,0,0.55)',border:'none',
              color:'#fff',borderRadius:'50%',width:30,height:30,cursor:'pointer',fontSize:15,
              display:'flex',alignItems:'center',justifyContent:'center'}}>&#x1F4F7;</button>
          <button onClick={e=>{e.stopPropagation();onClose();}} style={{position:'absolute',top:12,right:plant.medicinal?12+70:12,
            background:'rgba(0,0,0,0.5)',border:'none',color:'#fff',borderRadius:'50%',
            width:28,height:28,cursor:'pointer',fontSize:16,display:'flex',alignItems:'center',justifyContent:'center'}}>&#x2715;</button>
        </div>
        <div style={{padding:20}}>
          <div style={{marginBottom:12}}>
            <h2 style={{margin:'0 0 4px',color:T.text,fontSize:22}}>{plant.name}</h2>
            <div style={{color:T.sub,fontSize:14,fontStyle:'italic',marginBottom:4}}>{plant.latin}</div>
            <div style={{color:T.sub,fontSize:12}}>{plant.family} &bull; {plant.origin}</div>
          </div>
          {plant.desc&&<p style={{color:T.sub,fontSize:13,lineHeight:1.6,margin:'0 0 16px'}}>{plant.desc}</p>}

          {/* Care action buttons */}
          <div style={{marginBottom:16}}>
            <div style={{display:'flex',alignItems:'center',justifyContent:'space-between',marginBottom:8}}>
              <div style={{fontSize:12,fontWeight:600,color:T.sub,textTransform:'uppercase',letterSpacing:0.5}}>
                &#x1F4CB; Log Care
              </div>
              {onPest&&<button onClick={()=>onPest(plant)} style={{
                padding:'3px 10px',background:'rgba(239,68,68,0.1)',border:'1px solid rgba(239,68,68,0.3)',
                borderRadius:20,color:'#ef4444',fontSize:11,cursor:'pointer',fontWeight:600}}>
                &#x1F41B; Pest Log
              </button>}
            </div>
            <CareActionsBar plant={plant} careLog={careLog} onLog={onLog}/>
            {careHistory&&(careHistory[String(plant.id)+'-watered']||[]).length>0&&(
              <div style={{marginTop:10}}>
                <div style={{fontSize:11,color:T.sub,marginBottom:4}}>Watering history (last 90 days)</div>
                <CareHistorySparkline plantId={plant.id} careHistory={careHistory} type="watered"/>
              </div>
            )}
            {careHistory&&(careHistory[String(plant.id)+'-fed']||[]).length>0&&(
              <div style={{marginTop:8}}>
                <div style={{fontSize:11,color:T.sub,marginBottom:4}}>Feeding history (last 90 days)</div>
                <CareHistorySparkline plantId={plant.id} careHistory={careHistory} type="fed"/>
              </div>
            )}
          </div>

          {/* Care details */}
          <div style={{marginBottom:16}}>
            {row('&#x1F4A7; Water', plant.water)}
            {row('&#x2600; Light', plant.light)}
            {row('&#x1F321; Temperature', plant.temp)}
            {row('&#x1F4A7; Humidity', plant.humidity)}
            {row('&#x1F4CF; Height', plant.height)}
            {row('&#x1F33A; Flowering', plant.flowering)}
            {row('&#x26A0; Hardiness', plant.hardiness)}
            {row('&#x26D4; Toxic', plant.toxic)}
            {row('&#x1F4AA; Difficulty', plant.difficulty)}
            {row('&#x1F331; Sow/Propagate', plant.sow)}
            {row('&#x1F4CD; Best Placement', plant.placement)}
            {row('&#x1FAB4; Best Repot Time', repotSeason(plant))}
          </div>

          {plant.care&&<div style={{background:T.surface,borderRadius:8,padding:'10px 14px',marginBottom:12}}>
            <div style={{fontSize:11,fontWeight:600,color:T.sub,textTransform:'uppercase',letterSpacing:0.5,marginBottom:4}}>Care tips</div>
            <div style={{fontSize:13,color:T.text,lineHeight:1.6}}>{plant.care}</div>
          </div>}

          {STORAGE_INFO[String(plant.id)]&&(
            <div style={{background:'rgba(16,185,129,0.08)',borderLeft:'2px solid #10b981',borderRadius:6,padding:'10px 14px',marginBottom:12}}>
              <div style={{fontSize:11,fontWeight:600,color:'#10b981',textTransform:'uppercase',letterSpacing:.5,marginBottom:6}}>&#x1F4E6; Storage &amp; Preservation</div>
              <div style={{fontSize:13,color:T.text,lineHeight:1.6}}>{STORAGE_INFO[String(plant.id)]}</div>
            </div>
          )}

          {(plant.tags||[]).length>0&&<div style={{display:'flex',gap:6,flexWrap:'wrap',marginBottom:16}}>
            {plant.tags.map(t=>{
              const cfg=TAG_C[t]||{};
              return <span key={t} style={{background:cfg.bg||T.tag,color:cfg.text||T.tagText,
                fontSize:12,padding:'3px 8px',borderRadius:20,border:'1px solid '+(cfg.border||T.border)}}>{t}</span>;
            })}
          </div>}

          <CompanionPanel plant={plant}/>
          <HarvestLog plant={plant} harvests={harvests} onAdd={onAddHarvest}/>
          <PestNotes plantId={plant.id} notes={notes} onAdd={onAddNote}/>
        </div>
      </div>
    </div>
  );
}
