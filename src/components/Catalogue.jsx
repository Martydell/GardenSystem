import React from 'react';
import { BackupRestorePanel, DashboardView, SeasonalTasksPanel, SowingCalendar, WateringCalendarView } from './Calendars.jsx';
import { DetailPanel } from './DetailPanel.jsx';
import { IrrigationMap } from './Irrigation.jsx';
import { MapGrid } from './MapGrid.jsx';
import { BulkWaterModal, PestLogModal, PhotoLightbox } from './Modals.jsx';
import { CoverSlideshow, HydroCard, IndoorCard, OutdoorCard } from './PlantCards.jsx';
import { NotificationManager, WeatherWidget } from './Weather.jsx';
import { WishlistView } from './Wishlist.jsx';
import { HYDRO_PLANTS, INDOOR_PLANTS, OUTDOOR_PLANTS, TAG_C } from '../data/plants.js';
import { COURTYARD_DEFAULT, COURTYARD_TEXT, COURTYARD_ZONES, GREENHOUSE_DEFAULT, GREENHOUSE_ZONES, INDOOR_ZONES } from '../data/zones.js';
import { DARK, LIGHT, ThemeCtx, getUrgency, useIsMobile, useScrollCollapse } from '../utils.js';

export function Catalogue(){
  const [dark,    setDark]    = React.useState(true);
  const [view,    setView]    = React.useState('catalogue');
  const [mapTab,  setMapTab]  = React.useState('garden');
  const [mapFull, setMapFull] = React.useState(false);
  const [showMapSettings, setShowMapSettings] = React.useState(false);
  const [mapSettings, setMapSettings] = React.useState(()=>{
    try{return JSON.parse(localStorage.getItem('map-settings')||'{}');}catch{return {};}
  });
  const MAP_SIZE_DEFAULTS={
    garden:    {cols:14,rows:9, size:76},
    courtyard: {cols:14,rows:8, size:76},
    greenhouse:{cols:7, rows:9, size:86},
    indoor:    {cols:16,rows:10,size:64},
  };
  function getMapCfg(k){return{...MAP_SIZE_DEFAULTS[k],...(mapSettings[k]||{})};}
  function updateMapCfg(k,patch){
    const next={...mapSettings,[k]:{...((mapSettings[k])||{}),...patch}};
    setMapSettings(next);
    try{localStorage.setItem('map-settings',JSON.stringify(next));}catch{}
  }
  function resetMapCfg(k){
    const next={...mapSettings};delete next[k];
    setMapSettings(next);
    try{localStorage.setItem('map-settings',JSON.stringify(next));}catch{}
  }
  function resetMapLayout(k){
    if(!window.confirm(`Reset the ${getMapName(k)} map layout? This clears all plant placements, custom zones, labels, colours and any background photo you've set for this map, restoring the built-in defaults.`))return;
    const sk=k+'-map';
    ['','-text','-color','-disabled','-czones','-rzones','-zlabels','-bg'].forEach(suffix=>{
      try{localStorage.removeItem(sk+suffix);}catch{}
    });
    window.location.reload();
  }
  const MAP_DEFAULTS={garden:'Back Garden',courtyard:'Courtyard',greenhouse:'Greenhouse',indoor:'Indoor'};
  const MAP_ICONS={garden:'&#x1F33B;',courtyard:'&#x2600;&#xFE0F;',greenhouse:'&#x1F9EA;',indoor:'&#x1F3E0;'};
  const [mapNames,setMapNames]=React.useState(()=>{
    try{return JSON.parse(localStorage.getItem('map-names')||'{}');}catch{return {};}
  });
  const [editingMap,setEditingMap]=React.useState(null);
  const [editingName,setEditingName]=React.useState('');
  function getMapName(k){return mapNames[k]||MAP_DEFAULTS[k]||k;}
  function saveMapName(k,v){
    const n={...mapNames,[k]:v.trim()||MAP_DEFAULTS[k]};
    setMapNames(n);
    try{localStorage.setItem('map-names',JSON.stringify(n));}catch{}
    setEditingMap(null);
  }
  const [search,  setSearch]  = React.useState('');
  const [tags,    setTags]    = React.useState([]);
  const [selected,setSelected]= React.useState(null);
  const [careLog, setCareLog] = React.useState(()=>{
    try{ return JSON.parse(localStorage.getItem('plant-care-log')||'{}'); }catch{ return {}; }
  });
  const [notes,   setNotes]   = React.useState(()=>{
    try{ return JSON.parse(localStorage.getItem('plant-notes')||'{}'); }catch{ return {}; }
  });
  const [harvests,setHarvests]= React.useState(()=>{
    try{ return JSON.parse(localStorage.getItem('plant-harvests')||'{}'); }catch{ return {}; }
  });
  const [lightboxSrc,setLightboxSrc] = React.useState(null);
  const [coverY,  setCoverY]  = React.useState(50); // kept for compat
  const [pestLog,  setPestLog]  = React.useState(()=>{try{return JSON.parse(localStorage.getItem('plant-pests')||'[]');}catch{return [];}});
  const [wishlist, setWishlist] = React.useState(()=>{try{return JSON.parse(localStorage.getItem('plant-wishlist')||'[]');}catch{return [];}});
  const [careHistory, setCareHistory] = React.useState(()=>{try{return JSON.parse(localStorage.getItem('plant-care-history')||'{}');}catch{return {};}});
  const [bulkWaterModal, setBulkWaterModal] = React.useState(false);
  const [pestModal, setPestModal] = React.useState(null);

  const T = dark ? DARK : LIGHT;
  const allPlants = React.useMemo(()=>[...OUTDOOR_PLANTS,...INDOOR_PLANTS,...HYDRO_PLANTS],[]);

  React.useEffect(()=>{
    const onScroll=()=>setCoverY(Math.min(80,50+window.scrollY*0.03));
    window.addEventListener('scroll',onScroll,{passive:true});
    return()=>window.removeEventListener('scroll',onScroll);
  },[]);

  function logCare(plantId, type){
    const ts = Date.now();
    const updated = {...careLog, [String(plantId)+'-'+type]: ts};
    setCareLog(updated);
    try{ localStorage.setItem('plant-care-log',JSON.stringify(updated)); }catch{}
    const hKey=String(plantId)+'-'+type;
    const updH={...careHistory,[hKey]:[ts,...(careHistory[hKey]||[])].slice(0,30)};
    setCareHistory(updH);
    try{ localStorage.setItem('plant-care-history',JSON.stringify(updH)); }catch{}
  }
  function addNote(plantId, text){
    const key=String(plantId), existing=notes[key]||[];
    const updated={...notes,[key]:[{date:Date.now(),text},...existing].slice(0,10)};
    setNotes(updated);
    try{ localStorage.setItem('plant-notes',JSON.stringify(updated)); }catch{}
  }
  function addHarvest(plantId,qty,note){
    const key=String(plantId), existing=harvests[key]||[];
    const updated={...harvests,[key]:[{date:Date.now(),qty,note},...existing].slice(0,20)};
    setHarvests(updated);
    try{ localStorage.setItem('plant-harvests',JSON.stringify(updated)); }catch{}
  }
  function logPest(plantId, pest, note){
    const entry={id:Date.now(),plantId:String(plantId),pest,note,date:Date.now(),resolved:false};
    const updated=[entry,...pestLog];
    setPestLog(updated);
    try{ localStorage.setItem('plant-pests',JSON.stringify(updated)); }catch{}
  }
  function resolvePest(id){
    const updated=pestLog.map(e=>e.id===id?{...e,resolved:true}:e);
    setPestLog(updated);
    try{ localStorage.setItem('plant-pests',JSON.stringify(updated)); }catch{}
  }
  function addWish(name,latin,notes){
    const item={id:Date.now(),name,latin,notes,added:Date.now()};
    const updated=[item,...wishlist];
    setWishlist(updated);
    try{ localStorage.setItem('plant-wishlist',JSON.stringify(updated)); }catch{}
  }
  function removeWish(id){
    const updated=wishlist.filter(i=>i.id!==id);
    setWishlist(updated);
    try{ localStorage.setItem('plant-wishlist',JSON.stringify(updated)); }catch{}
  }
  function bulkWater(){
    const overdue=allPlants.filter(p=>getUrgency(p,careLog,'watered').level==='overdue');
    const ts=Date.now();
    const updL={...careLog}, updH={...careHistory};
    overdue.forEach(p=>{
      const k=String(p.id)+'-watered';
      updL[k]=ts;
      updH[k]=[ts,...(updH[k]||[])].slice(0,30);
    });
    setCareLog(updL); setCareHistory(updH);
    try{localStorage.setItem('plant-care-log',JSON.stringify(updL));}catch{}
    try{localStorage.setItem('plant-care-history',JSON.stringify(updH));}catch{}
    setBulkWaterModal(false);
  }

  const allTags = React.useMemo(()=>[...new Set(allPlants.flatMap(p=>p.tags||[]))].sort(),[allPlants]);

  function toggleTag(t){ setTags(ts=>ts.includes(t)?ts.filter(x=>x!==t):[...ts,t]); }

  function filterPlants(arr){
    return arr.filter(p=>{
      const q=search.toLowerCase();
      const matchSearch = !q||(p.name+p.latin+(p.desc||'')).toLowerCase().includes(q);
      const matchTags   = !tags.length||tags.every(t=>(p.tags||[]).includes(t));
      return matchSearch&&matchTags;
    });
  }

  const fOutdoor = filterPlants(OUTDOOR_PLANTS);
  const fIndoor  = filterPlants(INDOOR_PLANTS);
  const fHydro   = filterPlants(HYDRO_PLANTS);
  const attention = allPlants.filter(p=>getUrgency(p,careLog,'watered').level==='overdue').length;

  const sectionHdr = (label,count) => (
    <h2 className="section-hdr" style={{fontSize:18,fontWeight:700,color:T.accent,marginBottom:16,marginTop:32,
      display:'flex',alignItems:'center',gap:10}}>
      <span dangerouslySetInnerHTML={{__html:label}}/>
      <span style={{fontSize:13,color:T.sub,fontWeight:400}}>{count} plants</span>
    </h2>
  );

  const M = useIsMobile();
  const scrolled = useScrollCollapse();
  const CSS = `
    *{box-sizing:border-box;margin:0;padding:0;}
    body{background:${T.bg};color:${T.text};font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;min-height:100vh;}
    ::-webkit-scrollbar{width:6px;height:6px;}
    ::-webkit-scrollbar-track{background:${T.bg};}
    ::-webkit-scrollbar-thumb{background:${dark?'#2a3a2a':'#90b080'};border-radius:4px;}
    @keyframes spin{to{transform:rotate(360deg)}}
    @keyframes pulse{0%,100%{opacity:1}50%{opacity:0.5}}
    @keyframes kb0{0%{transform:scale(1.0) translate(0%,0%)}100%{transform:scale(1.12) translate(-2%,-1%)}}
    @keyframes kb1{0%{transform:scale(1.1) translate(-1%,0%)}100%{transform:scale(1.0) translate(1%,1%)}}
    @keyframes kb2{0%{transform:scale(1.0) translate(1%,1%)}100%{transform:scale(1.12) translate(-1%,-2%)}}
    @keyframes kb3{0%{transform:scale(1.1) translate(0%,1%)}100%{transform:scale(1.0) translate(-1%,-1%)}}
    @keyframes cardIn{from{opacity:0;transform:translateY(22px) scale(0.96)}to{opacity:1;transform:translateY(0) scale(1)}}
    @keyframes hdrIn{from{opacity:0;transform:translateX(-18px)}to{opacity:1;transform:translateX(0)}}
    @keyframes urgPulse{0%,100%{box-shadow:0 0 0 0 currentColor}60%{box-shadow:0 0 0 5px transparent}}
    @keyframes chipPop{0%{transform:scale(1)}40%{transform:scale(1.18)}100%{transform:scale(1)}}
    @keyframes fadeIn{from{opacity:0}to{opacity:1}}
    .plant-card{transition:transform 0.22s ease,box-shadow 0.22s ease;cursor:pointer;will-change:transform;}
    .plant-card:hover{transform:translateY(-6px) scale(1.015);box-shadow:0 12px 32px rgba(0,0,0,0.45);}
    .plant-card:active{transform:translateY(-2px) scale(1.005);}
    .urg-overdue{animation:urgPulse 1.6s ease-in-out infinite;color:rgba(239,68,68,0.7);}
    .urg-soon{animation:urgPulse 3s ease-in-out infinite;color:rgba(234,179,8,0.6);}
    .section-hdr{animation:hdrIn 0.4s ease both;}
    .chip-active{animation:chipPop 0.25s ease both;}
    .cards-grid{animation:fadeIn 0.3s ease both;}
    .chip-row::-webkit-scrollbar{display:none;}
    input::placeholder{color:${T.sub};opacity:0.7;}
    button,input,select{-webkit-tap-highlight-color:transparent;}
    @media(max-width:639px){html{font-size:15px;}}
    @media(prefers-reduced-motion:reduce){.plant-card,.plant-card:hover,.section-hdr,.cards-grid{animation:none;transition:none;transform:none;}}
  `;

  const navBtn = (key,label,extra='') => (
    <button onClick={()=>setView(key)} style={{
      padding:'8px 18px', border:'none', borderRadius:20,cursor:'pointer',fontSize:14,fontWeight:500,
      background:view===key?T.green:T.input, color:view===key?'#fff':T.text,
      position:'relative',
    }}>
      <span dangerouslySetInnerHTML={{__html:label}}/>
      {extra&&<span style={{background:'#ef4444',color:'#fff',borderRadius:'50%',
        width:18,height:18,fontSize:10,display:'inline-flex',alignItems:'center',
        justifyContent:'center',marginLeft:6,fontWeight:700}}>{extra}</span>}
    </button>
  );

  return (
    <ThemeCtx.Provider value={T}>
      <style>{CSS}</style>
      {/* ── Cover Slideshow ── */}
      <div style={{position:'relative',height:M?220:320,overflow:'hidden',background:'#061006'}}>
        <CoverSlideshow allPlants={allPlants}/>
        {/* gradient overlay — dark at top/bottom, lighter in centre */}
        <div style={{position:'absolute',inset:0,
          background:'linear-gradient(to bottom, rgba(0,0,0,0.35) 0%, rgba(0,0,0,0.1) 45%, rgba(0,0,0,0.55) 100%)',
          pointerEvents:'none'}}/>
        {/* Title */}
        <div style={{position:'absolute',inset:0,display:'flex',flexDirection:'column',
          alignItems:'center',justifyContent:'center',textAlign:'center',padding:20,pointerEvents:'none'}}>
          <h1 style={{fontSize:'clamp(26px,5vw,52px)',fontWeight:900,color:'#fff',
            textShadow:'0 2px 20px rgba(0,0,0,0.8)',letterSpacing:-0.5,marginBottom:6,
            fontFamily:'-apple-system,BlinkMacSystemFont,"Segoe UI",sans-serif'}}>
            &#x1F331; Marty's Plant Haven
          </h1>
          <p style={{color:'rgba(255,255,255,0.8)',fontSize:M?12:14,
            textShadow:'0 1px 8px rgba(0,0,0,0.7)',letterSpacing:.3}}>
            <span style={{color:'#86efac'}}>{OUTDOOR_PLANTS.length} outdoor</span>
            &nbsp;&bull;&nbsp;
            <span style={{color:'#93c5fd'}}>{INDOOR_PLANTS.length} indoor</span>
            &nbsp;&bull;&nbsp;
            <span style={{color:'#fcd34d'}}>{HYDRO_PLANTS.length} greenhouse</span>
            &nbsp;&bull;&nbsp;
            {allPlants.length} plants
          </p>
        </div>
        {/* Dark/Light toggle */}
        <button onClick={()=>setDark(d=>!d)}
          dangerouslySetInnerHTML={{__html: dark?'&#x2600; Light':'&#x1F319; Dark'}}
          style={{position:'absolute',top:14,right:14,zIndex:10,
          background:'rgba(0,0,0,0.5)',border:'1px solid rgba(255,255,255,0.25)',borderRadius:20,
          color:'#fff',padding:'6px 14px',cursor:'pointer',fontSize:13,backdropFilter:'blur(6px)'}}/>
      </div>

      {/* ── Navigation (desktop only — mobile uses bottom nav) ── */}
      {!M&&<div style={{position:'sticky',top:0,zIndex:100,background:T.bg,
        borderBottom:'1px solid '+T.border,padding:'10px 16px',
        display:'flex',gap:8,flexWrap:'wrap',alignItems:'center'}}>
        {navBtn('catalogue','&#x1F33F; Plants')}
        {navBtn('map',      '&#x1F5FA; Maps')}
        {navBtn('irrigation','&#x1F4A7; Irrigation')}
        {navBtn('calendar', '&#x1F4C5; Care Schedule')}
        {navBtn('dashboard','&#x1F4CA; Dashboard',attention||'')}
        {navBtn('wishlist', '&#x1F331; Wishlist',wishlist.length||'')}
        <NotificationManager allPlants={allPlants} careLog={careLog}/>
      </div>}

      <div style={{maxWidth:view==='map'?'none':1200,margin:'0 auto',
        padding:view==='map'?(M?'0 8px 100px':'0 16px 40px'):(M?'0 12px 100px':'0 20px 60px')}}>
        {/* ── Catalogue View ── */}
        {view==='catalogue'&&(<>
          {/* Search + Tags */}
          <div style={{position:'sticky',top:M?0:52,zIndex:90,background:T.bg,
            borderBottom:'1px solid '+T.border,marginBottom:16}}>
            {/* Search row */}
            <div style={{display:'flex',gap:8,alignItems:'center',padding:M?'8px 0':'12px 0 8px'}}>
              <input value={search} onChange={e=>setSearch(e.target.value)}
                placeholder="Search plants..." style={{
                  flex:1,padding:M?'10px 14px':'10px 16px',background:T.input,
                  border:'1px solid '+T.border,borderRadius:10,color:T.text,
                  fontSize:14,outline:'none'}}/>
              {!M&&scrolled&&tags.length>0&&(
                <span style={{background:T.accent,color:'#fff',borderRadius:20,
                  padding:'3px 10px',fontSize:12,fontWeight:700,flexShrink:0,whiteSpace:'nowrap'}}>
                  {tags.length} filter{tags.length!==1?'s':''} active
                </span>
              )}
            </div>
            {/* Tag chips:
                Mobile  — single horizontal scroll row, always visible, no wrapping
                Desktop — wrapping rows, auto-collapse on scroll */}
            {M?(
              <div className="chip-row" style={{
                display:'flex',gap:7,overflowX:'auto',paddingBottom:10,
                msOverflowStyle:'none',scrollbarWidth:'none',WebkitOverflowScrolling:'touch'}}>
                {tags.length>0&&(
                  <button onClick={()=>setTags([])} style={{
                    flexShrink:0,padding:'6px 12px',borderRadius:20,whiteSpace:'nowrap',
                    border:'1px solid #ef4444',background:'rgba(239,68,68,0.12)',
                    color:'#ef4444',cursor:'pointer',fontSize:12,fontWeight:700}}>
                    &#x2715; Clear
                  </button>
                )}
                {allTags.map(t=>{
                  const cfg=TAG_C[t]||{},on=tags.includes(t);
                  return <button key={t} onClick={()=>toggleTag(t)} style={{
                    flexShrink:0,padding:'6px 14px',borderRadius:20,whiteSpace:'nowrap',
                    border:'1px solid '+(on?T.accent:T.border),
                    background:on?(cfg.bg||T.accent):(cfg.bg||T.input),
                    color:on?'#fff':(cfg.text||T.sub),
                    cursor:'pointer',fontSize:12,fontWeight:on?700:400,
                  }}>{t}</button>;
                })}
              </div>
            ):(
              <div style={{maxHeight:scrolled?0:300,overflow:'hidden',
                transition:'max-height 0.25s ease',paddingBottom:scrolled?0:10}}>
                <div style={{display:'flex',gap:6,flexWrap:'wrap'}}>
                  {allTags.map(t=>{
                    const cfg=TAG_C[t]||{};
                    return <button key={t} onClick={()=>toggleTag(t)} style={{
                      padding:'4px 10px',borderRadius:20,
                      border:'1px solid '+(tags.includes(t)?T.accent:T.border),
                      background:tags.includes(t)?(cfg.bg||T.accent):(cfg.bg||T.tag),
                      color:tags.includes(t)?'#fff':(cfg.text||T.tagText),
                      cursor:'pointer',fontSize:12,fontWeight:tags.includes(t)?600:400,
                    }}>{t}</button>;
                  })}
                </div>
              </div>
            )}
          </div>

          {/* Bulk water button */}
          {attention>0&&(
            <div style={{marginBottom:8,display:'flex',justifyContent:'flex-end'}}>
              <button onClick={()=>setBulkWaterModal(true)} style={{
                padding:'6px 14px',background:'rgba(59,130,246,0.12)',border:'1px solid rgba(59,130,246,0.35)',
                borderRadius:8,color:'#3b82f6',fontSize:12,fontWeight:600,cursor:'pointer',display:'flex',alignItems:'center',gap:6}}>
                &#x1F4A7; Water all overdue ({attention})
              </button>
            </div>
          )}

          {/* Outdoor */}
          {fOutdoor.length>0&&<>{sectionHdr('&#x1F33B; Outdoor Garden',fOutdoor.length)}
            <div key={'out-'+search+tags.join()} className="cards-grid" style={{display:'flex',flexWrap:'wrap',gap:M?8:16,marginBottom:8}}>
              {fOutdoor.map((p,i)=><OutdoorCard key={p.id} plant={p} onSelect={setSelected}
                careLog={careLog} onLog={logCare} onPhotoZoom={setLightboxSrc} animIdx={i} pestLog={pestLog} onPest={setPestModal}/>)}
            </div></>}

          {/* Indoor */}
          {fIndoor.length>0&&<>{sectionHdr('&#x1F3E0; Indoor Plants',fIndoor.length)}
            <div key={'in-'+search+tags.join()} className="cards-grid" style={{display:'flex',flexWrap:'wrap',gap:M?8:16,marginBottom:8}}>
              {fIndoor.map((p,i)=><IndoorCard key={p.id} plant={p} onSelect={setSelected}
                careLog={careLog} onLog={logCare} onPhotoZoom={setLightboxSrc} animIdx={i} pestLog={pestLog} onPest={setPestModal}/>)}
            </div></>}

          {/* Greenhouse */}
          {fHydro.length>0&&<>{sectionHdr('&#x1F9EA; Greenhouse & Hydroponics',fHydro.length)}
            <div key={'hy-'+search+tags.join()} className="cards-grid" style={{display:'flex',flexWrap:'wrap',gap:M?8:16,marginBottom:8}}>
              {fHydro.map((p,i)=><HydroCard key={p.id} plant={p} onSelect={setSelected}
                careLog={careLog} onLog={logCare} onPhotoZoom={setLightboxSrc} animIdx={i} pestLog={pestLog} onPest={setPestModal}/>)}
            </div></>}

          {!fOutdoor.length&&!fIndoor.length&&!fHydro.length&&(
            <div style={{textAlign:'center',padding:60,color:T.sub,fontSize:16}}>
              No plants match your search.
            </div>
          )}
        </>)}

        {/* ── Maps View ── */}
        {view==='map'&&(
          <div style={{paddingTop:mapFull?0:20}}>
            {/* Header row — hidden when full-screen */}
            {!mapFull&&(
              <div style={{display:'flex',alignItems:'center',gap:12,marginBottom:16,flexWrap:'wrap'}}>
                <h2 style={{fontSize:20,fontWeight:700,color:T.text}}>&#x1F5FA; Plant Maps</h2>
                <div style={{display:'flex',gap:6,marginLeft:'auto',flexWrap:'wrap',alignItems:'center'}}>
                  {['indoor','courtyard','garden','greenhouse'].map(k=>(
                    <div key={k} style={{display:'flex',alignItems:'center',gap:0}}>
                      {editingMap===k?(
                        <input autoFocus value={editingName}
                          onChange={e=>setEditingName(e.target.value)}
                          onBlur={()=>saveMapName(k,editingName)}
                          onKeyDown={e=>{
                            if(e.key==='Enter')saveMapName(k,editingName);
                            if(e.key==='Escape')setEditingMap(null);
                          }}
                          style={{padding:'4px 10px',borderRadius:'20px 0 0 20px',border:'1px solid '+T.accent,
                            background:T.input,color:T.text,fontSize:12,outline:'none',width:110}}/>
                      ):(
                        <button onClick={()=>setMapTab(k)} style={{
                          padding:'5px 10px 5px 14px',borderRadius:20,
                          border:'1px solid '+T.border,cursor:'pointer',fontSize:12,
                          background:mapTab===k?T.green:T.input,
                          color:mapTab===k?'#fff':T.text,fontWeight:mapTab===k?700:400,
                          display:'flex',alignItems:'center',gap:5}}>
                          <span dangerouslySetInnerHTML={{__html:MAP_ICONS[k]}}/>
                          {getMapName(k)}
                        </button>
                      )}
                      {editingMap!==k&&(
                        <button onClick={e=>{e.stopPropagation();setEditingMap(k);setEditingName(getMapName(k));}}
                          title="Rename map"
                          style={{padding:'5px 8px',border:'1px solid '+T.border,borderLeft:'none',
                            borderRadius:'0 20px 20px 0',cursor:'pointer',fontSize:11,lineHeight:1,
                            background:mapTab===k?T.green:T.input,
                            color:mapTab===k?'rgba(255,255,255,0.75)':T.sub}}>
                          &#x270F;&#xFE0F;
                        </button>
                      )}
                    </div>
                  ))}
                  {/* Settings */}
                  <button onClick={()=>setShowMapSettings(s=>!s)} title="Customise map grid"
                    style={{padding:'5px 10px',borderRadius:20,border:'1px solid '+(showMapSettings?T.accent:T.border),
                      cursor:'pointer',fontSize:13,background:showMapSettings?'rgba(74,124,63,0.12)':T.input,
                      color:showMapSettings?T.accent:T.sub}}>
                    &#x2699;&#xFE0F;
                  </button>
                  {/* Expand to full screen */}
                  <button onClick={()=>setMapFull(true)} title="Full screen"
                    style={{padding:'5px 10px',borderRadius:20,border:'1px solid '+T.border,
                      cursor:'pointer',fontSize:13,background:T.input,color:T.sub}}>
                    &#x26F6;
                  </button>
                </div>
              </div>
            )}
            {/* Compact bar shown only in full-screen mode */}
            {mapFull&&(
              <div style={{display:'flex',alignItems:'center',gap:6,marginBottom:6,flexWrap:'wrap'}}>
                {['indoor','courtyard','garden','greenhouse'].map(k=>(
                  <button key={k} onClick={()=>setMapTab(k)} style={{
                    padding:'4px 12px',borderRadius:20,border:'1px solid '+T.border,cursor:'pointer',fontSize:11,
                    background:mapTab===k?T.green:T.input,color:mapTab===k?'#fff':T.text,
                    fontWeight:mapTab===k?700:400,display:'flex',alignItems:'center',gap:4}}>
                    <span dangerouslySetInnerHTML={{__html:MAP_ICONS[k]}}/>
                    {getMapName(k)}
                  </button>
                ))}
                <button onClick={()=>setMapFull(false)} title="Exit full screen"
                  style={{marginLeft:'auto',padding:'4px 10px',borderRadius:20,border:'1px solid '+T.border,
                    cursor:'pointer',fontSize:13,background:T.input,color:T.sub}}>
                  &#x2715; Exit
                </button>
              </div>
            )}
            {/* Map settings panel */}
            {showMapSettings&&!mapFull&&(()=>{
              const cfg=getMapCfg(mapTab);
              const def=MAP_SIZE_DEFAULTS[mapTab];
              const isCustom=JSON.stringify(cfg)!==JSON.stringify(def);
              return(
                <div style={{background:T.card,border:'1px solid '+T.border,borderRadius:10,
                  padding:'10px 14px',marginBottom:12,display:'flex',alignItems:'center',
                  gap:16,flexWrap:'wrap'}}>
                  <span style={{fontSize:12,fontWeight:700,color:T.text}}>
                    &#x2699;&#xFE0F; {getMapName(mapTab)}
                  </span>
                  <div style={{display:'flex',alignItems:'center',gap:6}}>
                    <span style={{fontSize:11,color:T.sub}}>Cols</span>
                    <input type="number" min={3} max={30} value={cfg.cols}
                      onChange={e=>updateMapCfg(mapTab,{cols:Math.max(3,Math.min(30,+e.target.value||cfg.cols))})}
                      style={{width:52,padding:'4px 6px',borderRadius:6,border:'1px solid '+T.border,
                        background:T.input,color:T.text,fontSize:12,textAlign:'center',outline:'none'}}/>
                    <span style={{fontSize:11,color:T.sub}}>Rows</span>
                    <input type="number" min={3} max={24} value={cfg.rows}
                      onChange={e=>updateMapCfg(mapTab,{rows:Math.max(3,Math.min(24,+e.target.value||cfg.rows))})}
                      style={{width:52,padding:'4px 6px',borderRadius:6,border:'1px solid '+T.border,
                        background:T.input,color:T.text,fontSize:12,textAlign:'center',outline:'none'}}/>
                  </div>
                  <div style={{display:'flex',alignItems:'center',gap:5}}>
                    <span style={{fontSize:11,color:T.sub}}>Cell</span>
                    {[['XS',48],['S',60],['M',76],['L',92],['XL',112]].map(([lbl,s])=>(
                      <button key={lbl} onClick={()=>updateMapCfg(mapTab,{size:s})}
                        style={{padding:'3px 8px',borderRadius:6,border:'1px solid '+T.border,
                          cursor:'pointer',fontSize:11,
                          background:cfg.size===s?T.accent:T.input,
                          color:cfg.size===s?'#fff':T.text,
                          fontWeight:cfg.size===s?700:400}}>
                        {lbl}
                      </button>
                    ))}
                  </div>
                  <div style={{display:'flex',gap:8,marginLeft:'auto'}}>
                    {isCustom&&<button onClick={()=>resetMapCfg(mapTab)}
                      style={{padding:'3px 10px',borderRadius:20,border:'1px solid '+T.border,
                        cursor:'pointer',fontSize:11,background:T.input,color:T.sub}}>
                      &#x21BA; Reset Size
                    </button>}
                    <button onClick={()=>resetMapLayout(mapTab)}
                      title="Clears saved plant placements, zones and labels for this map, restoring the built-in defaults"
                      style={{padding:'3px 10px',borderRadius:20,border:'1px solid '+T.border,
                        cursor:'pointer',fontSize:11,background:T.input,color:'#ef4444'}}>
                      &#x1F5D1;&#xFE0F; Reset Layout
                    </button>
                  </div>
                </div>
              );
            })()}
            {!mapFull&&<p style={{color:T.sub,fontSize:13,marginBottom:12}}>
              Drag plants onto the grid &bull; Double-click to remove (in &#x1F331; Place mode) &bull; &#x270F;&#xFE0F; rename map
            </p>}
            {mapTab==='garden'&&(()=>{const c=getMapCfg('garden');return<MapGrid storageKey="garden-map" cols={c.cols} rows={c.rows} size={c.size} zones={null} defaultFilter="outdoor" allPlants={allPlants} careLog={careLog} onSelect={setSelected} fullHeight={mapFull}/>;})()}
            {mapTab==='courtyard'&&(()=>{const c=getMapCfg('courtyard');return<MapGrid storageKey="courtyard-map" cols={c.cols} rows={c.rows} size={c.size} zones={COURTYARD_ZONES} defaultFilter="outdoor" defaultPos={COURTYARD_DEFAULT} defaultText={COURTYARD_TEXT} allPlants={allPlants} careLog={careLog} onSelect={setSelected} fullHeight={mapFull}/>;})()}
            {mapTab==='greenhouse'&&(()=>{const c=getMapCfg('greenhouse');return<MapGrid storageKey="greenhouse-map" cols={c.cols} rows={c.rows} size={c.size} zones={GREENHOUSE_ZONES} defaultFilter="hydro" defaultPos={GREENHOUSE_DEFAULT} allPlants={allPlants} careLog={careLog} onSelect={setSelected} fullHeight={mapFull}/>;})()}
            {mapTab==='indoor'&&(()=>{const c=getMapCfg('indoor');return<MapGrid storageKey="indoor-map" cols={c.cols} rows={c.rows} size={c.size} zones={INDOOR_ZONES} defaultFilter="indoor" allPlants={allPlants} careLog={careLog} onSelect={setSelected} fullHeight={mapFull}/>;})()}
          </div>
        )}

        {/* ── Irrigation System View ── */}
        {view==='irrigation'&&(
          <div style={{paddingTop:28}}>
            <IrrigationMap allPlants={allPlants}/>
          </div>
        )}

        {/* ── Care Schedule View ── */}
        {view==='calendar'&&(
          <div style={{paddingTop:28}}>
            <h2 style={{fontSize:20,fontWeight:700,color:T.text,marginBottom:6}}>&#x1F4C5; Care Schedule</h2>
            <p style={{color:T.sub,fontSize:13,marginBottom:24}}>Watering calendar, seasonal tasks, and sowing guide.</p>
            <WateringCalendarView allPlants={allPlants} careLog={careLog}/>
            <SeasonalTasksPanel allPlants={allPlants}/>
            <h3 style={{fontSize:16,fontWeight:700,color:T.text,margin:'0 0 12px'}}>&#x1F331; Sowing Calendar</h3>
            <p style={{color:T.sub,fontSize:13,marginBottom:16}}>When to sow, propagate, or plant out each species across the year.</p>
            <SowingCalendar allPlants={allPlants}/>
          </div>
        )}

        {/* ── Dashboard View ── */}
        {view==='dashboard'&&(
          <div style={{paddingTop:28}}>
            <h2 style={{fontSize:20,fontWeight:700,color:T.text,marginBottom:6}}>&#x1F4CA; Care Dashboard</h2>
            <p style={{color:T.sub,fontSize:13,marginBottom:16}}>Track watering, feeding, repotting, and recent care activity.</p>
            <WeatherWidget/>
            <DashboardView allPlants={allPlants} careLog={careLog} onLog={logCare} onSelect={setSelected}/>
            <BackupRestorePanel/>
          </div>
        )}

        {/* ── Wishlist View ── */}
        {view==='wishlist'&&(
          <WishlistView wishlist={wishlist} onAdd={addWish} onRemove={removeWish}/>
        )}
      </div>

      {/* ── Mobile Bottom Navigation ── */}
      {M&&(
        <div style={{position:'fixed',bottom:0,left:0,right:0,zIndex:200,
          background:T.card,borderTop:'1px solid '+T.border,
          display:'flex',alignItems:'stretch',
          paddingBottom:'env(safe-area-inset-bottom)'}}>
          {[
            ['catalogue','&#x1F33F;','Plants',null],
            ['map','&#x1F5FA;','Maps',null],
            ['irrigation','&#x1F4A7;','Irrigate',null],
            ['calendar','&#x1F4C5;','Schedule',null],
            ['dashboard','&#x1F4CA;','Care',attention||null],
            ['wishlist','&#x1F331;','Wishlist',wishlist.length||null],
          ].map(([k,icon,lbl,badge])=>(
            <button key={k} onClick={()=>setView(k)} style={{
              flex:1,padding:'9px 2px 7px',border:'none',background:'transparent',
              cursor:'pointer',display:'flex',flexDirection:'column',alignItems:'center',gap:1,
              color:view===k?T.accent:T.sub,position:'relative'}}>
              <span style={{fontSize:20,lineHeight:1}} dangerouslySetInnerHTML={{__html:icon}}/>
              <span style={{fontSize:9,fontWeight:view===k?700:400}}>{lbl}</span>
              {badge>0&&(
                <span style={{position:'absolute',top:5,right:'calc(50% - 18px)',background:k==='filter'?T.accent:'#ef4444',
                  color:'#fff',borderRadius:20,padding:'0px 5px',fontSize:9,fontWeight:700,minWidth:16,textAlign:'center'}}>{badge}</span>
              )}
            </button>
          ))}
        </div>
      )}

      {/* ── Overlays ── */}
      {selected&&<DetailPanel plant={selected} onClose={()=>setSelected(null)}
        careLog={careLog} onLog={logCare} onPhotoZoom={setLightboxSrc}
        notes={notes} harvests={harvests} onAddNote={addNote} onAddHarvest={addHarvest}
        careHistory={careHistory} pestLog={pestLog} onPest={setPestModal}/>}
      {lightboxSrc&&<PhotoLightbox src={lightboxSrc} onClose={()=>setLightboxSrc(null)}/>}
      {pestModal&&<PestLogModal plant={pestModal} pestLog={pestLog}
        onLog={logPest} onResolve={resolvePest} onClose={()=>setPestModal(null)}/>}
      {bulkWaterModal&&<BulkWaterModal
        plants={allPlants.filter(p=>getUrgency(p,careLog,'watered').level==='overdue')}
        onConfirm={bulkWater} onClose={()=>setBulkWaterModal(false)}/>}
    </ThemeCtx.Provider>
  );
}
