import React from 'react';
import { BackupRestorePanel, DashboardView, SeasonalTasksPanel, SowingCalendar, WateringCalendarView } from './Calendars.jsx';
import { DetailPanel } from './DetailPanel.jsx';
import { IrrigationView } from './Irrigation.jsx';
import { MapGrid } from './MapGrid.jsx';
import { BulkWaterModal, FiltersDrawer, PestLogModal, PhotoLightbox } from './Modals.jsx';
import { CoverSlideshow, HydroCard, IndoorCard, OutdoorCard, ProduceCard } from './PlantCards.jsx';
import { PestsView } from './Pests.jsx';
import { NotificationManager, WeatherWidget } from './Weather.jsx';
import { WishlistView } from './Wishlist.jsx';
import { AREAS, GROUPS, areasInGroup, getArea } from '../data/areas.js';
import { HYDRO_PLANTS, INDOOR_PLANTS, OUTDOOR_PLANTS, PRODUCE_PLANTS, TAG_C } from '../data/plants.js';
import { DARK, LIGHT, ThemeCtx, getUrgency, plantCategory, plantsInArea, useIsMobile, useScrollCollapse } from '../utils.js';

const CARD_BY_TYPE = {outdoor:OutdoorCard, indoor:IndoorCard, hydro:HydroCard, produce:ProduceCard};
const HDR_BY_TYPE = {
  outdoor:'&#x1F33B; Outdoor Garden', indoor:'&#x1F3E0; Indoor Plants',
  hydro:'&#x1F9EA; Greenhouse &amp; Hydroponics', produce:'&#x1F345; Herbs &amp; Seasonal Produce',
};

export function Catalogue(){
  const [dark,    setDark]    = React.useState(true);
  const [group,   setGroup]   = React.useState('overview');
  const [area,    setArea]    = React.useState(null);
  const [areaTab, setAreaTab] = React.useState('plants');
  const [highlightPlantId, setHighlightPlantId] = React.useState(null);
  const [mapFull, setMapFull] = React.useState(false);
  const [showMapSettings, setShowMapSettings] = React.useState(false);
  const [showFilters, setShowFilters] = React.useState(false);
  function goGroup(g){
    setGroup(g); setAreaTab('plants'); setHighlightPlantId(null);
    if(g==='overview'){ setArea(null); return; }
    const leaves=areasInGroup(g);
    setArea(leaves[0]?.key||null);
  }
  function goArea(a){
    setArea(a); setAreaTab('plants'); setHighlightPlantId(null);
  }
  function dropOnZone(e, leaf){
    e.preventDefault();
    const id=e.dataTransfer.getData('text/plain');
    if(!id)return;
    setGroup(leaf.group); setArea(leaf.key); setAreaTab('map'); setHighlightPlantId(id);
  }
  function handleCardDragStart(e, plant){
    e.dataTransfer.setData('text/plain', String(plant.id));
    e.dataTransfer.effectAllowed='move';
  }
  const [mapSettings, setMapSettings] = React.useState(()=>{
    try{return JSON.parse(localStorage.getItem('map-settings')||'{}');}catch{return {};}
  });
  function getMapCfg(k){ const a=getArea(k); return {cols:a.cols,rows:a.rows,size:a.size,...(mapSettings[k]||{})}; }
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
    if(!window.confirm(`Reset the ${getAreaName(k)} map layout? This clears all plant placements, custom zones, labels, colours and any background photo you've set for this map, restoring the built-in defaults.`))return;
    const sk=k+'-map';
    ['','-text','-color','-disabled','-czones','-rzones','-zlabels','-bg','-drip-installed'].forEach(suffix=>{
      try{localStorage.removeItem(sk+suffix);}catch{}
    });
    window.location.reload();
  }
  const [areaNames,setAreaNames]=React.useState(()=>{
    try{return JSON.parse(localStorage.getItem('map-names')||'{}');}catch{return {};}
  });
  const [editingArea,setEditingArea]=React.useState(null);
  const [editingName,setEditingName]=React.useState('');
  function getAreaName(k){return areaNames[k]||getArea(k).label;}
  function saveAreaName(k,v){
    const n={...areaNames,[k]:v.trim()||getArea(k).label};
    setAreaNames(n);
    try{localStorage.setItem('map-names',JSON.stringify(n));}catch{}
    setEditingArea(null);
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
  const allPlants = React.useMemo(()=>[...OUTDOOR_PLANTS,...INDOOR_PLANTS,...HYDRO_PLANTS,...PRODUCE_PLANTS],[]);

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

  const attention = allPlants.filter(p=>getUrgency(p,careLog,'watered').level==='overdue').length;

  // Zone membership — derived live from each area's map placements (no plant record changes needed)
  const currentArea = area ? getArea(area) : null;
  const zonePlants = area ? plantsInArea(area, allPlants, currentArea.defaultPos) : [];
  const placedIds = React.useMemo(()=>{
    if(group!=='overview') return new Set();
    const ids=new Set();
    AREAS.forEach(a=>plantsInArea(a.key,allPlants,a.defaultPos).forEach(p=>ids.add(String(p.id))));
    return ids;
  },[group,allPlants]);
  const unplaced = group==='overview' ? allPlants.filter(p=>!placedIds.has(String(p.id))) : [];
  const zoneActivePests = area
    ? (pestLog||[]).filter(e=>!e.resolved && zonePlants.some(p=>String(p.id)===String(e.plantId))).length
    : 0;

  const sectionHdr = (label,count) => (
    <h2 className="section-hdr" style={{fontSize:18,fontWeight:700,color:T.accent,marginBottom:16,marginTop:32,
      display:'flex',alignItems:'center',gap:10}}>
      <span dangerouslySetInnerHTML={{__html:label}}/>
      <span style={{fontSize:13,color:T.sub,fontWeight:400}}>{count} plants</span>
    </h2>
  );

  // Renders a plant list grouped by type (Outdoor/Indoor/Greenhouse/Produce), search+tag filtered.
  // Reused for a zone's Plants tab, Overview's global browse, and Overview's Unplaced section.
  function renderPlantSections(list, keyPrefix, draggable=false){
    const out = filterPlants(list);
    const byType = {
      outdoor: out.filter(p=>plantCategory(p)==='outdoor'),
      indoor:  out.filter(p=>plantCategory(p)==='indoor'),
      hydro:   out.filter(p=>plantCategory(p)==='hydro'),
      produce: out.filter(p=>plantCategory(p)==='produce'),
    };
    const anyResults = Object.values(byType).some(a=>a.length>0);
    return (
      <>
        {['outdoor','indoor','hydro','produce'].map(t=>{
          const arr=byType[t]; if(!arr.length) return null;
          const Card=CARD_BY_TYPE[t];
          return (
            <React.Fragment key={t}>
              {sectionHdr(HDR_BY_TYPE[t],arr.length)}
              <div key={keyPrefix+t+search+tags.join()} className="cards-grid" style={{display:'flex',flexWrap:'wrap',gap:M?8:16,marginBottom:8}}>
                {arr.map((p,i)=>(
                  <Card key={p.id} plant={p} onSelect={setSelected} careLog={careLog} onLog={logCare}
                    onPhotoZoom={setLightboxSrc} animIdx={i} pestLog={pestLog} onPest={setPestModal}
                    onDragStart={draggable?handleCardDragStart:undefined}/>
                ))}
              </div>
            </React.Fragment>
          );
        })}
        {!anyResults&&(
          <div style={{textAlign:'center',padding:60,color:T.sub,fontSize:16}}>
            No plants match your search.
          </div>
        )}
      </>
    );
  }

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

  const groupBtn = (key,label,icon,badge) => (
    <button key={key} onClick={()=>goGroup(key)} style={{
      padding:'8px 16px',border:'none',borderRadius:20,cursor:'pointer',fontSize:14,fontWeight:500,
      background:group===key?T.green:T.input,color:group===key?'#fff':T.text,
      display:'flex',alignItems:'center',gap:6,flexShrink:0,whiteSpace:'nowrap',position:'relative'}}>
      <span dangerouslySetInnerHTML={{__html:icon}}/>{label}
      {badge>0&&<span style={{background:'#ef4444',color:'#fff',borderRadius:'50%',
        minWidth:18,height:18,padding:'0 4px',fontSize:10,display:'inline-flex',alignItems:'center',
        justifyContent:'center',fontWeight:700}}>{badge}</span>}
    </button>
  );

  const leafBtn = (leaf) => (
    <button key={leaf.key} onClick={()=>goArea(leaf.key)} style={{
      padding:'6px 14px',border:'none',borderRadius:20,cursor:'pointer',fontSize:13,fontWeight:500,
      background:area===leaf.key?T.accent:T.input,color:area===leaf.key?'#fff':T.text,
      display:'flex',alignItems:'center',gap:6,flexShrink:0,whiteSpace:'nowrap'}}>
      <span dangerouslySetInnerHTML={{__html:leaf.icon}}/>{getAreaName(leaf.key)}
    </button>
  );

  const [dropHover, setDropHover] = React.useState(null);
  const dropZoneBtn = (leaf) => (
    <button key={leaf.key}
      onClick={()=>{setGroup(leaf.group);goArea(leaf.key);}}
      onDragOver={e=>{e.preventDefault();setDropHover(leaf.key);}}
      onDragLeave={()=>setDropHover(h=>h===leaf.key?null:h)}
      onDrop={e=>{setDropHover(null);dropOnZone(e,leaf);}}
      style={{padding:'6px 12px',border:'1px dashed '+(dropHover===leaf.key?T.accent:T.border),
        borderRadius:20,cursor:'pointer',fontSize:12,fontWeight:500,
        background:dropHover===leaf.key?'rgba(74,124,63,0.15)':T.input,color:T.text,
        display:'flex',alignItems:'center',gap:5,flexShrink:0,whiteSpace:'nowrap'}}>
      <span dangerouslySetInnerHTML={{__html:leaf.icon}}/>{getAreaName(leaf.key)}
    </button>
  );

  const FEATURE_TABS = [
    ['plants','&#x1F33F;','Plants',null],
    ['map','&#x1F5FA;','Map',null],
    ['irrigation','&#x1F4A7;','Irrigation',null],
    ['care','&#x1F4C5;','Care',null],
    ['pests','&#x1F41B;','Pests',zoneActivePests||null],
  ];

  const searchBar = (
    <div style={{position:'sticky',top:M?0:52,zIndex:90,background:T.bg,
      borderBottom:'1px solid '+T.border,marginBottom:16,padding:M?'8px 0':'12px 0'}}>
      <div style={{display:'flex',gap:8,alignItems:'center'}}>
        <input value={search} onChange={e=>setSearch(e.target.value)}
          placeholder="Search plants..." style={{
            flex:1,padding:M?'10px 14px':'10px 16px',background:T.input,
            border:'1px solid '+T.border,borderRadius:10,color:T.text,
            fontSize:14,outline:'none'}}/>
        <button onClick={()=>setShowFilters(true)} style={{
          padding:M?'10px 14px':'10px 16px',borderRadius:10,cursor:'pointer',fontSize:13,fontWeight:600,
          border:'1px solid '+(tags.length?T.accent:T.border),
          background:tags.length?T.accent:T.input,color:tags.length?'#fff':T.text,
          whiteSpace:'nowrap',flexShrink:0}}>
          &#x1F50D; {tags.length>0?`Filters (${tags.length})`:'Filters'}
        </button>
      </div>
    </div>
  );

  const mapCfg = currentArea ? getMapCfg(area) : null;

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
            <span style={{color:'#fca5a5'}}>{PRODUCE_PLANTS.length} produce</span>
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

      {/* ── Group navigation — Overview + Indoor/Outdoor/Green House ── */}
      <div style={{position:'sticky',top:0,zIndex:100,background:T.bg,
        borderBottom:'1px solid '+T.border,padding:'10px 16px'}}>
        <div className="chip-row" style={{display:'flex',gap:8,overflowX:'auto',alignItems:'center',
          msOverflowStyle:'none',scrollbarWidth:'none',WebkitOverflowScrolling:'touch'}}>
          {groupBtn('overview','Overview','&#x1F3E1;',attention||null)}
          {GROUPS.map(g=>groupBtn(g.key,g.label,g.icon,null))}
          {!M&&<div style={{marginLeft:8,flexShrink:0}}><NotificationManager allPlants={allPlants} careLog={careLog}/></div>}
        </div>
      </div>

      {/* ── Leaf zone navigation — the specific zones within the selected group ── */}
      {group!=='overview'&&(
        <div style={{position:'sticky',top:45,zIndex:99,background:T.bg,
          borderBottom:'1px solid '+T.border,padding:'8px 16px'}}>
          <div className="chip-row" style={{display:'flex',gap:6,overflowX:'auto',
            msOverflowStyle:'none',scrollbarWidth:'none',WebkitOverflowScrolling:'touch'}}>
            {areasInGroup(group).map(leafBtn)}
          </div>
        </div>
      )}

      {/* ── Feature navigation — desktop sticky row (mobile uses bottom nav) ── */}
      {!M&&area&&(
        <div style={{position:'sticky',top:90,zIndex:98,background:T.bg,
          borderBottom:'1px solid '+T.border,padding:'8px 16px',display:'flex',gap:8}}>
          {FEATURE_TABS.map(([k,icon,lbl,badge])=>(
            <button key={k} onClick={()=>setAreaTab(k)} style={{
              padding:'6px 14px',border:'none',borderRadius:20,cursor:'pointer',fontSize:13,fontWeight:500,
              background:areaTab===k?T.accent:T.input,color:areaTab===k?'#fff':T.text,
              display:'flex',alignItems:'center',gap:6}}>
              <span dangerouslySetInnerHTML={{__html:icon}}/>{lbl}
              {badge>0&&<span style={{background:'#ef4444',color:'#fff',borderRadius:'50%',
                minWidth:16,height:16,padding:'0 4px',fontSize:9,display:'inline-flex',alignItems:'center',
                justifyContent:'center',fontWeight:700}}>{badge}</span>}
            </button>
          ))}
        </div>
      )}

      <div style={{maxWidth:areaTab==='map'&&area?'none':1200,margin:'0 auto',
        padding:areaTab==='map'&&area?(M?'0 8px 100px':'0 16px 40px'):(M?'0 12px 100px':'0 20px 60px')}}>

        {/* ── Overview ── */}
        {group==='overview'&&(
          <div style={{paddingTop:20}}>
            <WeatherWidget/>

            <div style={{background:T.card,border:'1px solid '+T.border,borderRadius:10,padding:'10px 12px',margin:'8px 0 24px'}}>
              <div style={{fontSize:11,color:T.sub,fontWeight:600,textTransform:'uppercase',letterSpacing:.5,marginBottom:8}}>
                &#x1F4CD; Drag a plant card onto a zone to jump straight to placing it
              </div>
              <div className="chip-row" style={{display:'flex',gap:6,overflowX:'auto',
                msOverflowStyle:'none',scrollbarWidth:'none',WebkitOverflowScrolling:'touch'}}>
                {AREAS.map(dropZoneBtn)}
              </div>
            </div>

            <h2 style={{fontSize:20,fontWeight:700,color:T.text,margin:'8px 0 6px'}}>&#x1F4CA; Care Dashboard</h2>
            <p style={{color:T.sub,fontSize:13,marginBottom:16}}>Track watering, feeding, repotting, and recent care activity across every zone.</p>
            <DashboardView allPlants={allPlants} careLog={careLog} onLog={logCare} onSelect={setSelected}/>
            <BackupRestorePanel/>

            <h2 style={{fontSize:20,fontWeight:700,color:T.text,margin:'32px 0 6px'}}>&#x1F331; Wishlist</h2>
            <WishlistView wishlist={wishlist} onAdd={addWish} onRemove={removeWish}/>

            {unplaced.length>0&&(
              <>
                <h2 style={{fontSize:20,fontWeight:700,color:T.text,margin:'32px 0 6px'}}>&#x1F4CD; Unplaced ({unplaced.length})</h2>
                <p style={{color:T.sub,fontSize:13,marginBottom:16}}>
                  Not yet placed on any zone's map — open a zone's Map tab and drag these on to assign them.
                </p>
                <div className="cards-grid" style={{display:'flex',flexWrap:'wrap',gap:M?8:16,marginBottom:8}}>
                  {unplaced.map((p,i)=>{
                    const Card=CARD_BY_TYPE[plantCategory(p)];
                    return <Card key={p.id} plant={p} onSelect={setSelected} careLog={careLog} onLog={logCare}
                      onPhotoZoom={setLightboxSrc} animIdx={i} pestLog={pestLog} onPest={setPestModal}
                      onDragStart={handleCardDragStart}/>;
                  })}
                </div>
              </>
            )}

            <h2 style={{fontSize:20,fontWeight:700,color:T.text,margin:'32px 0 6px'}}>&#x1F50D; Browse All Plants</h2>
            {searchBar}
            {attention>0&&(
              <div style={{marginBottom:8,display:'flex',justifyContent:'flex-end'}}>
                <button onClick={()=>setBulkWaterModal(true)} style={{
                  padding:'6px 14px',background:'rgba(59,130,246,0.12)',border:'1px solid rgba(59,130,246,0.35)',
                  borderRadius:8,color:'#3b82f6',fontSize:12,fontWeight:600,cursor:'pointer',display:'flex',alignItems:'center',gap:6}}>
                  &#x1F4A7; Water all overdue ({attention})
                </button>
              </div>
            )}
            {renderPlantSections(allPlants,'ov-',true)}
          </div>
        )}

        {/* ── Zone: Plants ── */}
        {area&&areaTab==='plants'&&(
          <div style={{paddingTop:20}}>
            {searchBar}
            {renderPlantSections(zonePlants,area+'-')}
          </div>
        )}

        {/* ── Zone: Map ── */}
        {area&&areaTab==='map'&&(
          <div style={{paddingTop:mapFull?0:20}}>
            {!mapFull&&(
              <div style={{display:'flex',alignItems:'center',gap:12,marginBottom:16,flexWrap:'wrap'}}>
                <div style={{display:'flex',alignItems:'center',gap:0}}>
                  {editingArea===area?(
                    <input autoFocus value={editingName}
                      onChange={e=>setEditingName(e.target.value)}
                      onBlur={()=>saveAreaName(area,editingName)}
                      onKeyDown={e=>{
                        if(e.key==='Enter')saveAreaName(area,editingName);
                        if(e.key==='Escape')setEditingArea(null);
                      }}
                      style={{padding:'4px 10px',borderRadius:10,border:'1px solid '+T.accent,
                        background:T.input,color:T.text,fontSize:18,fontWeight:700,outline:'none',width:200}}/>
                  ):(
                    <h2 style={{fontSize:20,fontWeight:700,color:T.text,display:'flex',alignItems:'center',gap:8}}>
                      <span dangerouslySetInnerHTML={{__html:currentArea.icon}}/> {getAreaName(area)} Map
                    </h2>
                  )}
                  {editingArea!==area&&(
                    <button onClick={()=>{setEditingArea(area);setEditingName(getAreaName(area));}}
                      title="Rename zone" style={{marginLeft:6,padding:'4px 8px',border:'1px solid '+T.border,
                        borderRadius:20,cursor:'pointer',fontSize:11,background:T.input,color:T.sub}}>
                      &#x270F;&#xFE0F;
                    </button>
                  )}
                </div>
                <div style={{display:'flex',gap:6,marginLeft:'auto',alignItems:'center'}}>
                  <button onClick={()=>setShowMapSettings(s=>!s)} title="Customise map grid"
                    style={{padding:'5px 10px',borderRadius:20,border:'1px solid '+(showMapSettings?T.accent:T.border),
                      cursor:'pointer',fontSize:13,background:showMapSettings?'rgba(74,124,63,0.12)':T.input,
                      color:showMapSettings?T.accent:T.sub}}>
                    &#x2699;&#xFE0F;
                  </button>
                  <button onClick={()=>setMapFull(true)} title="Full screen"
                    style={{padding:'5px 10px',borderRadius:20,border:'1px solid '+T.border,
                      cursor:'pointer',fontSize:13,background:T.input,color:T.sub}}>
                    &#x26F6;
                  </button>
                </div>
              </div>
            )}
            {mapFull&&(
              <div style={{display:'flex',alignItems:'center',gap:6,marginBottom:6}}>
                <span style={{fontSize:13,fontWeight:700,color:T.text,display:'flex',alignItems:'center',gap:6}}>
                  <span dangerouslySetInnerHTML={{__html:currentArea.icon}}/> {getAreaName(area)}
                </span>
                <button onClick={()=>setMapFull(false)} title="Exit full screen"
                  style={{marginLeft:'auto',padding:'4px 10px',borderRadius:20,border:'1px solid '+T.border,
                    cursor:'pointer',fontSize:13,background:T.input,color:T.sub}}>
                  &#x2715; Exit
                </button>
              </div>
            )}
            {showMapSettings&&!mapFull&&(()=>{
              const cfg=mapCfg;
              const def={cols:currentArea.cols,rows:currentArea.rows,size:currentArea.size};
              const isCustom=JSON.stringify(cfg)!==JSON.stringify(def);
              return(
                <div style={{background:T.card,border:'1px solid '+T.border,borderRadius:10,
                  padding:'10px 14px',marginBottom:12,display:'flex',alignItems:'center',
                  gap:16,flexWrap:'wrap'}}>
                  <span style={{fontSize:12,fontWeight:700,color:T.text}}>
                    &#x2699;&#xFE0F; {getAreaName(area)}
                  </span>
                  <div style={{display:'flex',alignItems:'center',gap:6}}>
                    <span style={{fontSize:11,color:T.sub}}>Cols</span>
                    <input type="number" min={3} max={30} value={cfg.cols}
                      onChange={e=>updateMapCfg(area,{cols:Math.max(3,Math.min(30,+e.target.value||cfg.cols))})}
                      style={{width:52,padding:'4px 6px',borderRadius:6,border:'1px solid '+T.border,
                        background:T.input,color:T.text,fontSize:12,textAlign:'center',outline:'none'}}/>
                    <span style={{fontSize:11,color:T.sub}}>Rows</span>
                    <input type="number" min={3} max={24} value={cfg.rows}
                      onChange={e=>updateMapCfg(area,{rows:Math.max(3,Math.min(24,+e.target.value||cfg.rows))})}
                      style={{width:52,padding:'4px 6px',borderRadius:6,border:'1px solid '+T.border,
                        background:T.input,color:T.text,fontSize:12,textAlign:'center',outline:'none'}}/>
                  </div>
                  <div style={{display:'flex',alignItems:'center',gap:5}}>
                    <span style={{fontSize:11,color:T.sub}}>Cell</span>
                    {[['XS',48],['S',60],['M',76],['L',92],['XL',112]].map(([lbl,s])=>(
                      <button key={lbl} onClick={()=>updateMapCfg(area,{size:s})}
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
                    {isCustom&&<button onClick={()=>resetMapCfg(area)}
                      style={{padding:'3px 10px',borderRadius:20,border:'1px solid '+T.border,
                        cursor:'pointer',fontSize:11,background:T.input,color:T.sub}}>
                      &#x21BA; Reset Size
                    </button>}
                    <button onClick={()=>resetMapLayout(area)}
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
              Drag plants onto the grid &bull; Double-click to remove (in &#x1F331; Place mode) &bull; &#x270F;&#xFE0F; rename zone
            </p>}
            <MapGrid storageKey={area+'-map'} cols={mapCfg.cols} rows={mapCfg.rows} size={mapCfg.size}
              zones={currentArea.zones} defaultFilter={currentArea.defaultFilter}
              defaultPos={currentArea.defaultPos} defaultText={currentArea.defaultText}
              allPlants={allPlants} careLog={careLog} onSelect={setSelected} fullHeight={mapFull}
              highlightPlantId={highlightPlantId}/>
          </div>
        )}

        {/* ── Zone: Irrigation ── */}
        {area&&areaTab==='irrigation'&&(
          <div style={{paddingTop:28}}>
            <IrrigationView area={currentArea} allPlants={allPlants}/>
          </div>
        )}

        {/* ── Zone: Care ── */}
        {area&&areaTab==='care'&&(
          <div style={{paddingTop:28}}>
            <h2 style={{fontSize:20,fontWeight:700,color:T.text,marginBottom:6}}>&#x1F4C5; {getAreaName(area)} Care Schedule</h2>
            <p style={{color:T.sub,fontSize:13,marginBottom:24}}>Watering calendar, seasonal tasks, and sowing guide for this zone.</p>
            {zonePlants.length===0?(
              <div style={{padding:24,textAlign:'center',color:T.sub,fontSize:13,
                background:T.surface,borderRadius:10,border:'1px dashed '+T.border}}>
                No plants placed in this zone yet — place some on the Map tab first.
              </div>
            ):(<>
              <WateringCalendarView allPlants={zonePlants} careLog={careLog}/>
              <SeasonalTasksPanel allPlants={zonePlants}/>
              <h3 style={{fontSize:16,fontWeight:700,color:T.text,margin:'0 0 12px'}}>&#x1F331; Sowing Calendar</h3>
              <p style={{color:T.sub,fontSize:13,marginBottom:16}}>When to sow, propagate, or plant out each species in this zone.</p>
              <SowingCalendar allPlants={zonePlants}/>
            </>)}
          </div>
        )}

        {/* ── Zone: Pests ── */}
        {area&&areaTab==='pests'&&(
          <div style={{paddingTop:28}}>
            <PestsView plants={zonePlants} pestLog={pestLog} onResolve={resolvePest} onSelect={setSelected}/>
          </div>
        )}
      </div>

      {/* ── Mobile Bottom Navigation — feature tabs within a zone ── */}
      {M&&area&&(
        <div style={{position:'fixed',bottom:0,left:0,right:0,zIndex:200,
          background:T.card,borderTop:'1px solid '+T.border,
          display:'flex',alignItems:'stretch',
          paddingBottom:'env(safe-area-inset-bottom)'}}>
          {FEATURE_TABS.map(([k,icon,lbl,badge])=>(
            <button key={k} onClick={()=>setAreaTab(k)} style={{
              flex:1,padding:'9px 2px 7px',border:'none',background:'transparent',
              cursor:'pointer',display:'flex',flexDirection:'column',alignItems:'center',gap:1,
              color:areaTab===k?T.accent:T.sub,position:'relative'}}>
              <span style={{fontSize:20,lineHeight:1}} dangerouslySetInnerHTML={{__html:icon}}/>
              <span style={{fontSize:9,fontWeight:areaTab===k?700:400}}>{lbl}</span>
              {badge>0&&(
                <span style={{position:'absolute',top:5,right:'calc(50% - 18px)',background:'#ef4444',
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
      {showFilters&&<FiltersDrawer allTags={allTags} tags={tags} onToggle={toggleTag}
        onClear={()=>setTags([])} onClose={()=>setShowFilters(false)}/>}
    </ThemeCtx.Provider>
  );
}
