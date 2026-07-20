import React from 'react';
import { INDOOR_PHOTOS, INDOOR_WIKI_SLUGS, STATIC_PHOTO_URLS, WIKI_SLUGS } from '../data/plants.js';
import { ThemeCtx, URG_COLOR, feedInterval, fmtDate, getCustomPhoto, getUrgency, isFloweringNow, repotApplicable, resizeImageToDataURL, setCustomPhoto, useIsMobile } from '../utils.js';

export function CoverSlideshow({allPlants}){
  const slides=React.useMemo(()=>{
    const arr=[];
    allPlants.forEach(p=>{
      const url=STATIC_PHOTO_URLS[p.id];
      if(url&&url.startsWith('http')) arr.push({url,name:p.name});
    });
    // Fisher-Yates shuffle for random order each load
    for(let i=arr.length-1;i>0;i--){
      const j=Math.floor(Math.random()*(i+1));
      [arr[i],arr[j]]=[arr[j],arr[i]];
    }
    return arr.slice(0,14);
  },[]);

  const [idx,setIdx]=React.useState(0);
  const [show,setShow]=React.useState(true);

  React.useEffect(()=>{
    if(!slides.length) return;
    const t=setInterval(()=>{
      setShow(false);
      setTimeout(()=>{setIdx(i=>(i+1)%slides.length);setShow(true);},900);
    },5500);
    return()=>clearInterval(t);
  },[slides.length]);

  if(!slides.length) return null;
  const KB=['kb0','kb1','kb2','kb3'];
  const cur=slides[idx];
  const prev=slides[(idx-1+slides.length)%slides.length];
  return(<>
    {/* outgoing slide */}
    <img key={'p'+idx} src={prev.url} alt="" style={{
      position:'absolute',inset:0,width:'100%',height:'100%',objectFit:'cover',
      filter:'brightness(0.48) saturate(1.15)',
      opacity:show?0:1,transition:'opacity 0.9s ease',pointerEvents:'none'}}/>
    {/* incoming slide — ken burns */}
    <img key={'c'+idx} src={cur.url} alt="" style={{
      position:'absolute',inset:0,width:'100%',height:'100%',objectFit:'cover',
      filter:'brightness(0.48) saturate(1.15)',
      opacity:show?1:0,transition:'opacity 0.9s ease',
      animation:KB[idx%4]+' 6s ease-out forwards',
      pointerEvents:'none'}}/>
    {/* subtle slide indicator dots */}
    <div style={{position:'absolute',bottom:10,left:'50%',transform:'translateX(-50%)',
      display:'flex',gap:5,pointerEvents:'none'}}>
      {slides.map((_,i)=>(
        <div key={i} style={{width:i===idx?16:5,height:5,borderRadius:3,
          background:i===idx?'rgba(255,255,255,0.9)':'rgba(255,255,255,0.35)',
          transition:'all 0.4s ease'}}/>
      ))}
    </div>
    {/* current plant name */}
    <div style={{position:'absolute',bottom:22,right:16,
      color:'rgba(255,255,255,0.55)',fontSize:10,fontStyle:'italic',letterSpacing:.3,
      textShadow:'0 1px 6px rgba(0,0,0,0.9)',pointerEvents:'none'}}>
      {cur.name}
    </div>
  </>);
}

export function CareHistorySparkline({plantId, careHistory, type='watered'}){
  const T=React.useContext(ThemeCtx);
  const key=String(plantId)+'-'+type;
  const history=(careHistory||{})[key]||[];
  const W=200,H=28,maxDays=90,now=Date.now(),DAY=86400000;
  const typeColor={watered:'#22c55e',fed:'#3b82f6',repotted:'#d97706'}[type]||'#22c55e';
  if(!history.length) return <span style={{fontSize:11,color:T.sub}}>No history yet</span>;
  const dots=history.map(ts=>{const dAgo=(now-ts)/DAY;return{x:W-(dAgo/maxDays)*W,ts};}).filter(d=>d.x>=0&&d.x<=W);
  return (
    <svg width={W} height={H} style={{overflow:'visible',display:'block'}}>
      <line x1={0} y1={H/2} x2={W} y2={H/2} stroke={T.border} strokeWidth={1}/>
      {dots.map((d,i)=>(
        <circle key={i} cx={d.x} cy={H/2} r={4} fill={typeColor} fillOpacity={0.85}>
          <title>{fmtDate(d.ts)}</title>
        </circle>
      ))}
      <text x={0} y={H-2} fontSize={8} fill={T.sub}>90d ago</text>
      <text x={W-24} y={H-2} fontSize={8} fill={T.sub}>today</text>
    </svg>
  );
}

export function PhotoCard({src, loading, name, onZoom, onUpload}){
  const T=React.useContext(ThemeCtx);
  const fileRef=React.useRef(null);
  async function handleFile(e){
    const file=e.target.files&&e.target.files[0];
    e.target.value='';
    if(!file||!onUpload)return;
    const dataUrl=await resizeImageToDataURL(file,1200,0.75);
    onUpload(dataUrl);
  }
  return (
    <div style={{position:'relative',width:'100%',aspectRatio:'4/3',overflow:'hidden',background:T.surface,borderRadius:8,cursor:onZoom?'zoom-in':'default'}}
         onClick={onZoom?e=>{e.stopPropagation();onZoom(src);}:undefined}>
      {loading&&<div style={{position:'absolute',inset:0,display:'flex',alignItems:'center',justifyContent:'center'}}>
        <div style={{width:24,height:24,border:'2px solid '+T.borderMid,borderTopColor:T.accent,borderRadius:'50%',animation:'spin 0.8s linear infinite'}}/>
      </div>}
      {src&&<img src={src} alt={name} style={{width:'100%',height:'100%',objectFit:'cover',display:loading?'none':'block'}} onLoad={e=>e.target.style.display='block'} onError={e=>e.target.style.display='none'}/>}
      {onZoom&&src&&<div style={{position:'absolute',top:6,right:6,background:'rgba(0,0,0,0.55)',borderRadius:'50%',width:26,height:26,display:'flex',alignItems:'center',justifyContent:'center',fontSize:14,color:'#fff',pointerEvents:'none'}}>&#x2295;</div>}
      {onUpload&&<>
        <input ref={fileRef} type="file" accept="image/*" capture="environment" style={{display:'none'}} onChange={handleFile}/>
        <button onClick={e=>{e.stopPropagation();fileRef.current&&fileRef.current.click();}}
          title="Upload your own photo"
          style={{position:'absolute',top:6,left:6,background:'rgba(0,0,0,0.55)',border:'none',borderRadius:'50%',
            width:26,height:26,display:'flex',alignItems:'center',justifyContent:'center',fontSize:13,
            color:'#fff',cursor:'pointer',padding:0}}>&#x1F4F7;</button>
      </>}
    </div>
  );
}

export function PlantCard({plant, onSelect, photo, loading=false, badge, badgeColor, careLog, onLog, onPhotoZoom, animIdx=0, pestLog=[], onPest}){
  const T = React.useContext(ThemeCtx);
  const M = useIsMobile();
  const [flipped, setFlipped] = React.useState(false);
  const [customPhoto,setCustomPhotoState]=React.useState(()=>getCustomPhoto(plant.id));
  const displayPhoto = customPhoto||photo;
  function handleUpload(dataUrl){
    setCustomPhotoState(dataUrl);
    setCustomPhoto(plant.id,dataUrl);
  }
  const flowering = isFloweringNow(plant);
  const wUrgency  = getUrgency(plant, careLog,'watered');
  const fUrgency  = getUrgency(plant, careLog,'fed');
  const rUrgency  = repotApplicable(plant) ? getUrgency(plant,careLog,'repotted') : null;
  const urgent = wUrgency.level==='overdue'||fUrgency.level==='overdue'||(rUrgency&&rUrgency.level==='overdue');
  const activePests = (pestLog||[]).filter(e=>String(e.plantId)===String(plant.id)&&!e.resolved).length;

  function logAction(type,e){
    e.stopPropagation();
    onLog(plant.id, type);
  }

  const delay = Math.min(animIdx * 0.045, 0.65) + 's';
  const cardStyle = {
    flex: M ? '1 1 calc(50% - 8px)' : '0 0 220px',
    maxWidth: M ? 'calc(50% - 8px)' : 220,
    minWidth: M ? 'calc(50% - 8px)' : 'auto',
    perspective:1000,
    filter: urgent ? 'drop-shadow(0 0 8px rgba(239,68,68,0.5))' :
            flowering ? 'drop-shadow(0 0 8px rgba(122,184,106,0.6))' : 'none',
    animation:`cardIn 0.45s ease both`,
    animationDelay: delay,
  };
  const cardH = M ? 280 : 320;
  const innerStyle = {
    position:'relative', width:'100%', height:cardH,
    transformStyle:'preserve-3d',
    transition:'transform 0.48s cubic-bezier(0.4,0.2,0.2,1)',
    transform: flipped?'rotateY(180deg)':'rotateY(0deg)',
    cursor:'pointer',
  };
  const faceBase = {
    position:'absolute', inset:0, borderRadius:12, backfaceVisibility:'hidden',
    WebkitBackfaceVisibility:'hidden', border:'1px solid '+T.border,
    overflow:'hidden', background:T.card,
  };
  const backStyle = {...faceBase, transform:'rotateY(180deg)', padding:12,
    display:'flex', flexDirection:'column', gap:6, overflowY:'auto'};

  const dot = (level, title) => (
    <div title={title} className={level==='overdue'?'urg-overdue':level==='soon'?'urg-soon':''}
      style={{width:8,height:8,borderRadius:'50%',background:URG_COLOR[level],flexShrink:0}}/>
  );

  const actionBtn = (label, type, icon) => (
    <button onClick={e=>logAction(type,e)} style={{
      flex:1, padding:'6px 4px', background:T.input, border:'1px solid '+T.border,
      borderRadius:6, color:T.text, fontSize:11, cursor:'pointer', display:'flex',
      alignItems:'center', justifyContent:'center', gap:4,
    }}>
      <span dangerouslySetInnerHTML={{__html:icon}}/><span>{label}</span>
    </button>
  );

  return (
    <div className="plant-card" style={cardStyle} onClick={()=>setFlipped(f=>!f)}>
      <div style={innerStyle}>
        {/* FRONT */}
        <div style={faceBase}>
          <PhotoCard src={displayPhoto} loading={loading&&!customPhoto} name={plant.name} onZoom={onPhotoZoom} onUpload={handleUpload}/>
          {plant.medicinal&&<div style={{position:'absolute',top:8,left:8,background:'#10b981',color:'#fff',
            fontSize:10,fontWeight:700,padding:'2px 6px',borderRadius:4,letterSpacing:0.5}}>&#x271A; MEDICINAL</div>}
          {activePests>0&&onPest&&<div onClick={e=>{e.stopPropagation();onPest(plant);}}
            title={activePests+' active pest/disease issue'+(activePests>1?'s':'')}
            style={{position:'absolute',top:plant.medicinal?32:8,left:8,background:'rgba(239,68,68,0.9)',
              color:'#fff',fontSize:9,fontWeight:700,padding:'2px 5px',borderRadius:4,
              cursor:'pointer',zIndex:2}}>&#x1F41B; {activePests}</div>}
          <div style={{position:'absolute',top:8,right:8,background:badgeColor,color:'#fff',
            fontSize:10,fontWeight:700,padding:'2px 6px',borderRadius:4}}>{badge}</div>
          {flowering&&<div style={{position:'absolute',bottom:80,left:8,background:'rgba(122,184,106,0.9)',
            color:'#fff',fontSize:10,fontWeight:700,padding:'2px 6px',borderRadius:4}}>IN SEASON</div>}
          {careLog[String(plant.id)+'-watered']&&(Date.now()-careLog[String(plant.id)+'-watered'])<7*86400000&&(
            <div title="Watered this week" style={{position:'absolute',bottom:80,right:8,background:'#22c55e',
              color:'#fff',borderRadius:'50%',width:22,height:22,fontSize:13,fontWeight:900,
              display:'flex',alignItems:'center',justifyContent:'center',
              boxShadow:'0 1px 4px rgba(0,0,0,0.5)'}}>&#x2713;</div>
          )}
          <div style={{position:'absolute',bottom:0,left:0,right:0,background:'linear-gradient(transparent,rgba(0,0,0,0.8))',
            padding:'24px 10px 8px'}}>
            <div style={{color:'#fff',fontWeight:700,fontSize:14}}>{plant.name}</div>
            <div style={{color:'rgba(255,255,255,0.65)',fontSize:11,fontStyle:'italic'}}>{plant.latin}</div>
            <div style={{display:'flex',gap:4,flexWrap:'wrap',marginTop:4}}>
              {(plant.tags||[]).slice(0,3).map(t=>(
                <span key={t} style={{background:'rgba(255,255,255,0.15)',color:'#fff',
                  fontSize:10,padding:'1px 5px',borderRadius:3}}>{t}</span>
              ))}
            </div>
          </div>
          <div style={{position:'absolute',top:42,right:8,display:'flex',flexDirection:'column',gap:3}}>
            {dot(wUrgency.level,'Watering: '+(wUrgency.days!=null?wUrgency.days+'d ago':'never logged'))}
            {dot(fUrgency.level,'Feeding: '+(fUrgency.days!=null?fUrgency.days+'d ago':'never logged'))}
            {rUrgency&&dot(rUrgency.level,'Repotting: '+(rUrgency.days!=null?rUrgency.days+'d ago':'never logged'))}
          </div>
        </div>
        {/* BACK */}
        <div style={backStyle}>
          <div style={{display:'flex',alignItems:'center',justifyContent:'space-between',marginBottom:2}}>
            <div style={{fontWeight:700,fontSize:13,color:T.text}}>{plant.name}</div>
            <div style={{fontSize:9,color:T.sub,opacity:0.7}}>tap to flip ↩</div>
          </div>
          {[['&#x1F4A7;','Water',plant.water],['&#x2600;','Light',plant.light],['&#x1F321;','Temp',plant.temp]].map(([ic,lb,val])=>(
            <div key={lb} style={{display:'flex',gap:6,fontSize:11,color:T.sub}}>
              <span dangerouslySetInnerHTML={{__html:ic}}/><strong style={{color:T.text,minWidth:38}}>{lb}</strong><span>{val}</span>
            </div>
          ))}
          {plant.placement&&<div style={{background:'rgba(74,124,63,0.12)',borderLeft:'2px solid '+T.green,
            padding:'4px 8px',borderRadius:4,marginTop:2}}>
            <div style={{fontSize:10,color:T.sub,marginBottom:1}}>&#x1F4CD; Best placement</div>
            <div style={{fontSize:11,color:T.text}}>{plant.placement}</div>
          </div>}
          {plant.sow&&<div style={{background:'rgba(59,130,246,0.1)',borderLeft:'2px solid #3b82f6',
            padding:'4px 8px',borderRadius:4}}>
            <div style={{fontSize:10,color:T.sub,marginBottom:1}}>&#x1F331; Sow / propagate</div>
            <div style={{fontSize:11,color:T.text}}>{plant.sow}</div>
          </div>}
          {(()=>{
            const fedTs=careLog[String(plant.id)+'-fed'];
            const nextTs=fedTs?fedTs+feedInterval(plant)*86400000:null;
            const overdue=nextTs&&Date.now()>nextTs;
            return <div style={{background:'rgba(16,185,129,0.08)',borderLeft:'2px solid #10b981',
              padding:'4px 8px',borderRadius:4}}>
              <div style={{fontSize:10,color:T.sub,marginBottom:2}}>&#x1F9EA; Feeding</div>
              <div style={{fontSize:11,color:T.sub}}>
                {fedTs?'Last: '+fmtDate(fedTs):'Never fed'}
              </div>
              {nextTs&&<div style={{fontSize:11,fontWeight:600,color:overdue?'#ef4444':'#22c55e'}}>
                {overdue?'Overdue since ':'Next due: '}{fmtDate(nextTs)}
              </div>}
            </div>;
          })()}
          <div style={{display:'flex',gap:4,marginTop:'auto',flexWrap:'wrap'}}>
            {actionBtn('Watered','watered','&#x1F4A7;')}
            {actionBtn('Fed','fed','&#x1F9EA;')}
            {repotApplicable(plant)&&actionBtn('Repotted','repotted','&#x1FAB4;')}
            {onPest&&<button onClick={e=>{e.stopPropagation();onPest(plant);}} style={{
              flex:1,padding:'6px 4px',background:activePests>0?'rgba(239,68,68,0.15)':T.input,
              border:'1px solid '+(activePests>0?'rgba(239,68,68,0.4)':T.border),
              borderRadius:6,color:activePests>0?'#ef4444':T.text,fontSize:11,cursor:'pointer',
              display:'flex',alignItems:'center',justifyContent:'center',gap:4,
            }}>&#x1F41B;<span>Pest</span></button>}
          </div>
          <button onClick={e=>{e.stopPropagation();onSelect(plant);}} style={{
            width:'100%',padding:'7px 0',background:T.green,border:'none',borderRadius:6,
            color:'#fff',fontSize:12,cursor:'pointer',fontWeight:600,marginTop:2}}>
            Full details &#x2192;
          </button>
        </div>
      </div>
    </div>
  );
}

export function OutdoorCard({plant,onSelect,careLog,onLog,onPhotoZoom,animIdx=0,pestLog,onPest}){
  const [photo,setPhoto]=React.useState(STATIC_PHOTO_URLS[plant.id]||null);
  const [loading,setLoading]=React.useState(!STATIC_PHOTO_URLS[plant.id]);
  React.useEffect(()=>{
    if(photo||!WIKI_SLUGS[plant.id])return;
    fetch(`https://en.wikipedia.org/api/rest_v1/page/summary/${WIKI_SLUGS[plant.id]}`)
      .then(r=>r.json()).then(d=>{ setPhoto(d?.originalimage?.source||null); setLoading(false); })
      .catch(()=>setLoading(false));
  },[plant.id]);
  return <PlantCard plant={plant} onSelect={onSelect} photo={photo} loading={loading}
    badge="OUTDOOR" badgeColor="#4a7c3f" careLog={careLog} onLog={onLog} onPhotoZoom={onPhotoZoom} animIdx={animIdx} pestLog={pestLog} onPest={onPest}/>;
}

export function IndoorCard({plant,onSelect,careLog,onLog,onPhotoZoom,animIdx=0,pestLog,onPest}){
  const photo=INDOOR_PHOTOS[plant.id]||STATIC_PHOTO_URLS[plant.id]||null;
  const [wikiPhoto,setWikiPhoto]=React.useState(null);
  React.useEffect(()=>{
    if(photo||!INDOOR_WIKI_SLUGS[plant.id])return;
    fetch(`https://en.wikipedia.org/api/rest_v1/page/summary/${INDOOR_WIKI_SLUGS[plant.id]}`)
      .then(r=>r.json()).then(d=>setWikiPhoto(d?.originalimage?.source||null)).catch(()=>{});
  },[plant.id]);
  return <PlantCard plant={plant} onSelect={onSelect} photo={photo||wikiPhoto} loading={false}
    badge="INDOOR" badgeColor="#1e40af" careLog={careLog} onLog={onLog} onPhotoZoom={onPhotoZoom} animIdx={animIdx} pestLog={pestLog} onPest={onPest}/>;
}

export function HydroCard({plant,onSelect,careLog,onLog,onPhotoZoom,animIdx=0,pestLog,onPest}){
  return <PlantCard plant={plant} onSelect={onSelect} photo={STATIC_PHOTO_URLS[plant.id]||null} loading={false}
    badge="HYDRO" badgeColor="#d97706" careLog={careLog} onLog={onLog} onPhotoZoom={onPhotoZoom} animIdx={animIdx} pestLog={pestLog} onPest={onPest}/>;
}

export function AttentionCard({plant, careLog, onLog, onSelect}){
  const T = React.useContext(ThemeCtx);
  const photo = getCustomPhoto(plant.id)||(plant.type==='indoor'
    ? (INDOOR_PHOTOS[plant.id]||STATIC_PHOTO_URLS[plant.id])
    : STATIC_PHOTO_URLS[plant.id]);
  const wU = getUrgency(plant,careLog,'watered');
  const fU = getUrgency(plant,careLog,'fed');
  const rU = repotApplicable(plant)?getUrgency(plant,careLog,'repotted'):null;
  const needs = [
    wU.level==='overdue'&&{type:'watered',label:'Water',icon:'&#x1F4A7;',color:'#3b82f6'},
    fU.level==='overdue'&&{type:'fed',    label:'Feed', icon:'&#x1F9EA;',color:'#10b981'},
    rU&&rU.level==='overdue'&&{type:'repotted',label:'Repot',icon:'&#x1FAB4;',color:'#a855f7'},
  ].filter(Boolean);
  if(!needs.length)return null;
  return (
    <div style={{display:'flex',alignItems:'center',gap:12,padding:'10px 14px',
      background:T.card,borderRadius:10,border:'1px solid rgba(239,68,68,0.3)',
      borderLeft:'3px solid #ef4444'}}>
      <div style={{width:44,height:44,borderRadius:8,overflow:'hidden',background:T.surface,flexShrink:0}}>
        {photo&&<img src={photo} alt={plant.name} style={{width:'100%',height:'100%',objectFit:'cover'}}/>}
      </div>
      <div style={{flex:1,minWidth:0}}>
        <div style={{fontWeight:600,fontSize:13,color:T.text,whiteSpace:'nowrap',overflow:'hidden',textOverflow:'ellipsis'}}>{plant.name}</div>
        <div style={{fontSize:11,color:T.sub}}>{plant.latin}</div>
      </div>
      <div style={{display:'flex',gap:6,flexShrink:0}}>
        {needs.map(n=>(
          <button key={n.type} onClick={()=>onLog(plant.id,n.type)} style={{
            padding:'4px 10px',background:n.color,border:'none',borderRadius:6,
            color:'#fff',fontSize:12,cursor:'pointer',fontWeight:600,display:'flex',gap:4,alignItems:'center'}}>
            <span dangerouslySetInnerHTML={{__html:n.icon}}/>{n.label}
          </button>
        ))}
        <button onClick={()=>onSelect(plant)} style={{padding:'4px 8px',background:T.input,
          border:'1px solid '+T.border,borderRadius:6,color:T.sub,fontSize:12,cursor:'pointer'}}>
          &#x2192;
        </button>
      </div>
    </div>
  );
}
