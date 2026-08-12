import React from 'react';
import { OBJECT_TYPES } from '../data/objects.js';
import { surfaceStyle } from '../data/surfaces.js';
import { INDOOR_PHOTOS, STATIC_PHOTO_URLS } from '../data/plants.js';
import { ThemeCtx, getCustomPhoto, getUrgency, plantCategory, resizeImageToDataURL, wikiThumb } from '../utils.js';

export function MapGrid({storageKey,cols,rows,size,zones,defaultFilter,defaultPos,defaultText,defaultObjects,defaultSurface,allPlants,careLog,onSelect,fullHeight=false,highlightPlantId=null}){
  const T=React.useContext(ThemeCtx);
  const [pos,setPos]=React.useState(()=>{
    try{
      const s=JSON.parse(localStorage.getItem(storageKey)||'null');
      // Migrate old format {plantId:{x,y}} → new format {"x,y":plantId}
      if(s && typeof s === 'object'){
        const first = Object.values(s)[0];
        if(first && typeof first === 'object' && 'x' in first){
          const migrated={};
          Object.entries(s).forEach(([id,v])=>{ migrated[`${v.x},${v.y}`]=id; });
          return migrated;
        }
        return s;
      }
      return defaultPos||{};
    }catch{return defaultPos||{};}
  });
  // objects: [{id, typeId, x, y}] — x,y is the top-left cell; footprint (w,h) comes from OBJECT_TYPES.
  const [objects,setObjects]=React.useState(()=>{
    try{
      const s=JSON.parse(localStorage.getItem(storageKey+'-objects')||'null');
      if(Array.isArray(s)) return s;
      // Migrate old single-cell format {"x,y":typeId} → instance array
      if(s && typeof s === 'object'){
        return Object.entries(s).map(([key,typeId])=>{
          const [x,y]=key.split(',').map(Number);
          return {id:'obj-'+x+'-'+y+'-'+Date.now()+Math.random().toString(36).slice(2,6),typeId,x,y};
        });
      }
      return defaultObjects||[];
    }catch{return defaultObjects||[];}
  });
  const [dragId,setDragId]=React.useState(null);
  const clickTimerRef=React.useRef(null);
  const [hov,setHov]=React.useState(null);
  const [zFilter,setZFilter]=React.useState(defaultFilter||'all');
  const highlightRef=React.useRef(null);
  React.useEffect(()=>{
    if(!highlightPlantId)return;
    setZFilter('all');
    const t=setTimeout(()=>highlightRef.current?.scrollIntoView({block:'center',behavior:'smooth'}),150);
    return ()=>clearTimeout(t);
  },[highlightPlantId]);
  const [showPlantPicker,setShowPlantPicker]=React.useState(false);
  const [pickerFilter,setPickerFilter]=React.useState(defaultFilter||'all');
  const [pickerSearch,setPickerSearch]=React.useState('');
  const [bgImage,setBgImage]=React.useState(()=>{try{return localStorage.getItem(storageKey+'-bg')||null;}catch{return null;}});
  const [bgDragOver,setBgDragOver]=React.useState(false);
  // Paint state
  const [cellColor,setCellColor]=React.useState(()=>{try{return JSON.parse(localStorage.getItem(storageKey+'-color')||'{}');}catch{return {};}});
  const [cellText,setCellText]=React.useState(()=>{try{const s=JSON.parse(localStorage.getItem(storageKey+'-text')||'null');return s||defaultText||{};}catch{return defaultText||{};}});
  const [mode,setMode]=React.useState('place'); // 'place' | 'label' | 'paint' | 'shape'
  const [paintColor,setPaintColor]=React.useState('#86efac');
  const [isPainting,setIsPainting]=React.useState(false);
  const [editCell,setEditCell]=React.useState(null);
  const [editText,setEditText]=React.useState('');
  const [editingObjectId,setEditingObjectId]=React.useState(null); // opens the rotate/scale popover
  const [disabledCells,setDisabledCells]=React.useState(()=>{
    try{return new Set(JSON.parse(localStorage.getItem(storageKey+'-disabled')||'[]'));}
    catch{return new Set();}
  });
  const [shapeErasing,setShapeErasing]=React.useState(false);

  // ── Zone add/remove state ──────────────────────────────────────────────────
  const [customZones,setCustomZones]=React.useState(()=>{
    try{return JSON.parse(localStorage.getItem(storageKey+'-czones')||'[]');}catch{return [];}
  });
  const [removedZoneIds,setRemovedZoneIds]=React.useState(()=>{
    try{return new Set(JSON.parse(localStorage.getItem(storageKey+'-rzones')||'[]'));}catch{return new Set();}
  });
  const [zoneLabels,setZoneLabels]=React.useState(()=>{
    try{return JSON.parse(localStorage.getItem(storageKey+'-zlabels')||'{}');}catch{return {};}
  });
  // Zone drawing
  const [zoneDrawStart,setZoneDrawStart]=React.useState(null);
  const [zoneDrawEnd,setZoneDrawEnd]=React.useState(null);
  const [pendingZoneRect,setPendingZoneRect]=React.useState(null); // {x,y,w,h}
  const [newZoneLabel,setNewZoneLabel]=React.useState('');
  const [newZoneColorIdx,setNewZoneColorIdx]=React.useState(0);
  const [editingZoneId,setEditingZoneId]=React.useState(null);
  const [editingZoneLabelVal,setEditingZoneLabelVal]=React.useState('');

  const ZONE_COLORS=[
    {col:'rgba(59,130,246,0.13)',border:'#3b82f6'},
    {col:'rgba(16,185,129,0.15)',border:'#10b981'},
    {col:'rgba(139,92,246,0.13)',border:'#8b5cf6'},
    {col:'rgba(234,179,8,0.13)' ,border:'#eab308'},
    {col:'rgba(239,68,68,0.13)' ,border:'#ef4444'},
    {col:'rgba(249,115,22,0.13)',border:'#f97316'},
    {col:'rgba(236,72,153,0.13)',border:'#ec4899'},
    {col:'rgba(107,114,128,0.15)',border:'#6b7280'},
    {col:'rgba(161,107,59,0.18)',border:'#a16b3b'},
    {col:'rgba(20,184,166,0.13)',border:'#14b8a6'},
  ];

  const PALETTE=['#86efac','#166534','#bef264','#fde68a','#fda4af','#93c5fd','#c4b5fd','#9ca3af','#92400e','#f97316','#ef4444','#ffffff'];
  const LIGHT_LEVELS=[{c:'#fef9c3',l:'Full Sun',i:'☀️'},{c:'#fef3c7',l:'Partial Sun',i:'🌤'},{c:'#dbeafe',l:'Indirect Light',i:'🌥'},{c:'#e5e7eb',l:'Low Light',i:'🌑'}];

  function saveBg(dataUrl){
    setBgImage(dataUrl);
    try{if(dataUrl)localStorage.setItem(storageKey+'-bg',dataUrl);else localStorage.removeItem(storageKey+'-bg');}catch{}
  }
  async function handleBgFile(file){
    if(!file||!file.type.startsWith('image/'))return;
    const dataUrl=await resizeImageToDataURL(file);
    saveBg(dataUrl);
  }
  function saveCellColor(key,color){
    const n={...cellColor};
    if(color)n[key]=color; else delete n[key];
    setCellColor(n);
    try{localStorage.setItem(storageKey+'-color',JSON.stringify(n));}catch{}
  }
  function saveCellText(key,text){
    const n={...cellText};
    if(text.trim())n[key]=text.trim(); else delete n[key];
    setCellText(n);
    try{localStorage.setItem(storageKey+'-text',JSON.stringify(n));}catch{}
    setEditCell(null);
  }
  function doPaint(key){
    saveCellColor(key, cellColor[key]===paintColor?null:paintColor);
  }
  function doShape(key,erase){
    const next=new Set(disabledCells);
    if(erase)next.delete(key); else next.add(key);
    setDisabledCells(next);
    try{localStorage.setItem(storageKey+'-disabled',JSON.stringify([...next]));}catch{}
  }
  function resetShape(){
    setDisabledCells(new Set());
    try{localStorage.removeItem(storageKey+'-disabled');}catch{}
  }

  // Zone position overrides — stores {x,y} top-left per zone id, persisted
  const [zonePositions,setZonePositions]=React.useState(()=>{
    try{return JSON.parse(localStorage.getItem(storageKey+'-zpos')||'{}');}
    catch{return {};}
  });
  function getZonePos(z){return zonePositions[z.id]||{x:z.x,y:z.y};}

  // All live zones = preset (minus removed, with label overrides) + custom (minus removed)
  const effectiveZones=[
    ...(zones||[]).filter(z=>!removedZoneIds.has(z.id)).map(z=>({...z,label:zoneLabels[z.id]||z.label})),
    ...customZones.filter(z=>!removedZoneIds.has(z.id)).map(z=>({...z,label:zoneLabels[z.id]||z.label})),
  ];

  function moveZone(zid,dropX,dropY){
    const z=effectiveZones.find(q=>q.id===zid);
    if(!z)return;
    const nx=Math.max(0,Math.min(dropX,cols-z.w));
    const ny=Math.max(0,Math.min(dropY,rows-z.h));
    const next={...zonePositions,[zid]:{x:nx,y:ny}};
    setZonePositions(next);
    try{localStorage.setItem(storageKey+'-zpos',JSON.stringify(next));}catch{}
  }
  function resetZones(){
    setZonePositions({});
    try{localStorage.removeItem(storageKey+'-zpos');}catch{}
  }
  function removeZone(zid){
    const next=new Set(removedZoneIds); next.add(zid);
    setRemovedZoneIds(next);
    try{localStorage.setItem(storageKey+'-rzones',JSON.stringify([...next]));}catch{}
  }
  function addZone(rect,label,colorIdx){
    const c=ZONE_COLORS[colorIdx]||ZONE_COLORS[0];
    const z={id:'cz-'+Date.now(),label:label||'New zone',
      col:c.col,border:c.border,x:rect.x,y:rect.y,w:rect.w,h:rect.h};
    const next=[...customZones,z];
    setCustomZones(next);
    try{localStorage.setItem(storageKey+'-czones',JSON.stringify(next));}catch{}
  }
  function saveZoneLabel(zid,val){
    const next={...zoneLabels,[zid]:val.trim()};
    setZoneLabels(next);
    try{localStorage.setItem(storageKey+'-zlabels',JSON.stringify(next));}catch{}
    setEditingZoneId(null);
  }
  function confirmNewZone(){
    if(!pendingZoneRect)return;
    addZone(pendingZoneRect,newZoneLabel,newZoneColorIdx);
    setPendingZoneRect(null);setNewZoneLabel('');setNewZoneColorIdx(0);
  }

  function save(p){setPos(p);try{localStorage.setItem(storageKey,JSON.stringify(p));}catch{}}
  // Cells hold a comma-separated list of plant ids, e.g. "33,60" — a mixed pot with two species.
  // Single-plant cells are just one id with no comma (backward compatible with older saved layouts).
  // Plants may freely share a cell with each other and with furniture objects — no collision check.
  function placeAt(pid,x,y,fromCell=null){
    const key=`${x},${y}`;
    const pidStr=String(pid);
    const existing=(pos[key]||'').split(',').filter(Boolean);
    const list=existing.includes(pidStr)?existing:[...existing,pidStr];
    const next={...pos,[key]:list.join(',')};
    if(fromCell&&fromCell!==key){
      const fromList=(pos[fromCell]||'').split(',').filter(Boolean).filter(id=>id!==pidStr);
      if(fromList.length) next[fromCell]=fromList.join(',');
      else delete next[fromCell];
    }
    save(next);
  }
  // Places a freshly-dragged (not yet placed) plant at the exact cell under the
  // cursor, clamped to the zone's bounds. Plants and objects can freely share a
  // cell — there's no "find the nearest free cell" search any more.
  function placeInZone(pid,zone,hintX,hintY){
    const zp=getZonePos(zone);
    const x=Math.max(zp.x,Math.min(hintX,zp.x+zone.w-1));
    const y=Math.max(zp.y,Math.min(hintY,zp.y+zone.h-1));
    placeAt(pid,x,y);
  }
  function removeCell(x,y,pid=null){
    const key=`${x},${y}`;
    if(pid==null){ const n={...pos}; delete n[key]; save(n); return; }
    const list=(pos[key]||'').split(',').filter(Boolean).filter(id=>id!==String(pid));
    const n={...pos};
    if(list.length) n[key]=list.join(','); else delete n[key];
    save(n);
  }

  // Objects (furniture, heaters, etc.) — each instance also carries a free rotation
  // (`rot`, degrees) and visual `scale` (0.4–1). Placement allows free overlap with
  // plants and other objects — the footprint (w,h from OBJECT_TYPES) is only used to
  // size the tile and keep its anchor cell within the grid, not to block placement.
  function saveObjects(o){setObjects(o);try{localStorage.setItem(storageKey+'-objects',JSON.stringify(o));}catch{}}
  function objectAt(x,y){
    return objects.find(o=>{
      const t=OBJECT_TYPES.find(ot=>ot.id===o.typeId);
      const w=t?t.w:1,h=t?t.h:1;
      return x>=o.x&&x<o.x+w&&y>=o.y&&y<o.y+h;
    })||null;
  }
  function placeObjectAt(typeId,x,y,fromId=null){
    const t=OBJECT_TYPES.find(ot=>ot.id===typeId);
    const w=t?t.w:1,h=t?t.h:1;
    const cx=Math.max(0,Math.min(x,cols-w)),cy=Math.max(0,Math.min(y,rows-h));
    const existing=fromId?objects.find(o=>o.id===fromId):null;
    const next=objects.filter(o=>o.id!==fromId);
    next.push({
      id:fromId||('obj-'+cx+'-'+cy+'-'+Date.now()+Math.random().toString(36).slice(2,6)),
      typeId,x:cx,y:cy,
      rot:existing?existing.rot||0:0,
      scale:existing?existing.scale||1:1,
    });
    saveObjects(next);
  }
  function placeObjectInZone(typeId,zone,hintX,hintY){
    const t=OBJECT_TYPES.find(ot=>ot.id===typeId);
    const w=t?t.w:1,h=t?t.h:1;
    const zp=getZonePos(zone);
    const x=Math.max(zp.x,Math.min(hintX,zp.x+zone.w-w));
    const y=Math.max(zp.y,Math.min(hintY,zp.y+zone.h-h));
    placeObjectAt(typeId,x,y);
  }
  function rotateObject(id,rot){
    saveObjects(objects.map(o=>o.id===id?{...o,rot:((rot%360)+360)%360}:o));
  }
  function scaleObject(id,scale){
    saveObjects(objects.map(o=>o.id===id?{...o,scale}:o));
  }
  function removeObject(id){
    saveObjects(objects.filter(o=>o.id!==id));
    setEditingObjectId(prev=>prev===id?null:prev);
  }

  function exportLayout(){
    const zonesOut=effectiveZones.map(z=>{const zp=getZonePos(z);return {id:z.id,label:z.label,x:zp.x,y:zp.y,w:z.w,h:z.h};});
    const plantsOut=Object.entries(pos).flatMap(([key,val])=>{
      const [x,y]=key.split(',').map(Number);
      return String(val).split(',').filter(Boolean).map(pid=>{
        const p=allPlants.find(q=>String(q.id)===pid);
        return {x,y,plantId:pid,name:p?p.name:pid};
      });
    }).sort((a,b)=>a.y-b.y||a.x-b.x);
    const labelsOut=Object.entries(cellText).map(([key,text])=>{
      const [x,y]=key.split(',').map(Number);
      return {x,y,text};
    });
    const json=JSON.stringify({map:storageKey,zones:zonesOut,plants:plantsOut,labels:labelsOut},null,2);
    if(navigator.clipboard&&navigator.clipboard.writeText){
      navigator.clipboard.writeText(json).then(
        ()=>window.alert('Layout copied to clipboard — paste it into your chat with Claude to make this the permanent default.'),
        ()=>window.prompt('Copy this layout JSON and paste it into your chat with Claude:',json)
      );
    }else{
      window.prompt('Copy this layout JSON and paste it into your chat with Claude:',json);
    }
  }

  // Build cellMap: "x,y" → array of plant objects (usually length 1; 2+ for a shared/mixed pot)
  const cellMap={};
  Object.entries(pos).forEach(([key,val])=>{
    const ids=String(val).split(',').filter(Boolean);
    const plants=ids.map(id=>allPlants.find(q=>String(q.id)===id)).filter(Boolean);
    if(plants.length) cellMap[key]=plants;
  });
  const TC={outdoor:'#4a7c3f',indoor:'#1e40af',hydro:'#d97706',produce:'#b91c1c'};
  function photo(p){return getCustomPhoto(p.id)||(plantCategory(p)==='indoor'?(INDOOR_PHOTOS[p.id]||STATIC_PHOTO_URLS[p.id]||null):STATIC_PHOTO_URLS[p.id]||null);}
  function getZn(x,y){
    return effectiveZones.find(z=>{const p=getZonePos(z);return x>=p.x&&x<p.x+z.w&&y>=p.y&&y<p.y+z.h;})||null;
  }

  // Sidebar: always shows all plants — same plant can be placed in multiple cells
  const sidebar=allPlants.filter(p=>zFilter==='all'||plantCategory(p)===zFilter)
    .sort((a,b)=>a.name.localeCompare(b.name));
  const countInMap=pid=>Object.values(pos).filter(v=>String(v).split(',').includes(String(pid))).length;
  const GP=4, gridW=cols*(size+GP)-GP, gridH=rows*(size+GP)-GP;

  return (
    <>
    <div style={{display:'flex',gap:12,height:fullHeight?'calc(100vh - 96px)':'calc(100vh - 290px)',minHeight:500}}>
      {/* Sidebar */}
      <div style={{width:168,flexShrink:0,display:'flex',flexDirection:'column',background:T.card,borderRadius:12,border:'1px solid '+T.border,overflow:'hidden'}}>
        <div style={{padding:'10px 8px',borderBottom:'1px solid '+T.border}}>
          <div style={{fontSize:11,color:T.sub,fontWeight:600,textTransform:'uppercase',letterSpacing:.5,marginBottom:6}}>Filter</div>
          <div style={{display:'flex',flexWrap:'wrap',gap:3}}>
            {[['all','All'],['outdoor','Out'],['indoor','In'],['hydro','Glass'],['produce','Prod']].map(([k,l])=>(
              <button key={k} onClick={()=>setZFilter(k)} style={{
                padding:'3px 7px',borderRadius:20,border:'1px solid '+T.border,cursor:'pointer',fontSize:10,
                background:zFilter===k?T.green:T.input,color:zFilter===k?'#fff':T.text}}>{l}
              </button>
            ))}
          </div>
        </div>
        <div style={{flex:1,overflowY:'auto',padding:8}}>
          <div style={{fontSize:11,color:T.sub,fontWeight:600,textTransform:'uppercase',letterSpacing:.5,marginBottom:6}}>
            Plants ({sidebar.length})
          </div>
          <div style={{fontSize:10,color:T.sub,marginBottom:8,lineHeight:1.4}}>Drag to place — same plant can go in multiple zones</div>
          {sidebar.map(p=>{
            const ph=photo(p),col=TC[plantCategory(p)];
            const cnt=countInMap(p.id);
            const isHighlighted=highlightPlantId&&String(p.id)===String(highlightPlantId);
            return(
              <div key={p.id} draggable ref={isHighlighted?highlightRef:undefined}
                onDragStart={e=>{e.dataTransfer.setData('plantId',String(p.id));setDragId(String(p.id));}}
                onDragEnd={()=>setDragId(null)}
                className={isHighlighted?'urg-overdue':undefined}
                style={{display:'flex',gap:7,alignItems:'center',padding:'5px 6px',borderRadius:7,marginBottom:3,
                  cursor:'grab',userSelect:'none',background:dragId===String(p.id)?T.surface:T.input,
                  border:'1px solid '+(isHighlighted?'#22c55e':T.border),borderLeft:'3px solid '+col,
                  boxShadow:isHighlighted?'0 0 0 2px rgba(34,197,94,0.5)':'none',opacity:dragId===String(p.id)?.5:1}}>
                <div style={{width:28,height:28,borderRadius:5,overflow:'hidden',flexShrink:0,background:T.surface}}>
                  {ph&&<img src={wikiThumb(ph,80)} alt={p.name} loading="lazy" style={{width:'100%',height:'100%',objectFit:'cover'}}/>}
                </div>
                <div style={{fontSize:11,fontWeight:600,color:T.text,lineHeight:1.2,overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap',flex:1}}>{p.name}</div>
                {cnt>0&&<div style={{background:T.green,color:'#fff',borderRadius:'50%',width:16,height:16,fontSize:9,flexShrink:0,display:'flex',alignItems:'center',justifyContent:'center',fontWeight:700}}>{cnt}</div>}
              </div>
            );
          })}
          {!sidebar.length&&<div style={{textAlign:'center',color:T.sub,fontSize:11,padding:'20px 4px'}}>No plants match filter</div>}
        </div>
        <div style={{padding:'8px',borderTop:'1px solid '+T.border,maxHeight:160,overflowY:'auto'}}>
          <div style={{fontSize:10,color:T.sub,fontWeight:600,textTransform:'uppercase',letterSpacing:.5,marginBottom:6}}>
            Objects
          </div>
          <div style={{display:'flex',flexWrap:'wrap',gap:5}}>
            {OBJECT_TYPES.map(o=>(
              <div key={o.id} draggable
                onDragStart={e=>{e.dataTransfer.setData('objectTypeId',o.id);setDragId('obj:'+o.id);}}
                onDragEnd={()=>setDragId(null)}
                style={{display:'flex',alignItems:'center',gap:4,padding:'4px 7px',borderRadius:20,
                  border:'1px solid '+T.border,cursor:'grab',userSelect:'none',
                  background:dragId==='obj:'+o.id?T.surface:T.input,
                  opacity:dragId==='obj:'+o.id?.5:1,fontSize:10,color:T.text}}>
                <span style={{fontSize:13}}>{o.icon}</span>{o.label}
              </div>
            ))}
          </div>
        </div>
        <div style={{padding:'8px',borderTop:'1px solid '+T.border,maxHeight:220,overflowY:'auto'}}>
          <div style={{display:'flex',alignItems:'center',justifyContent:'space-between',marginBottom:6}}>
            <div style={{fontSize:10,color:T.sub,fontWeight:600,textTransform:'uppercase',letterSpacing:.5}}>
              Zones ({effectiveZones.length})
            </div>
            <button onClick={()=>setMode('zones')} title="Draw a new zone on the grid" aria-label="Draw a new zone on the grid"
              style={{padding:'2px 7px',borderRadius:20,border:'1px solid '+T.border,cursor:'pointer',
                fontSize:11,background:mode==='zones'?T.accent:T.input,
                color:mode==='zones'?'#fff':T.sub,fontWeight:700,lineHeight:1.4}}>
              ＋
            </button>
          </div>
          {effectiveZones.length===0&&(
            <div style={{fontSize:10,color:T.sub,textAlign:'center',padding:'8px 0',lineHeight:1.4}}>
              No zones yet.<br/>Click ＋ then draw on the grid.
            </div>
          )}
          {effectiveZones.map(z=>(
            <div key={z.id} style={{display:'flex',alignItems:'center',gap:4,marginBottom:5}}>
              <div style={{width:10,height:10,borderRadius:2,flexShrink:0,
                background:z.col,border:'1px solid '+z.border}}/>
              {editingZoneId===z.id?(
                <input autoFocus value={editingZoneLabelVal}
                  onChange={e=>setEditingZoneLabelVal(e.target.value)}
                  onKeyDown={e=>{
                    if(e.key==='Enter')saveZoneLabel(z.id,editingZoneLabelVal);
                    if(e.key==='Escape')setEditingZoneId(null);
                  }}
                  onBlur={()=>saveZoneLabel(z.id,editingZoneLabelVal)}
                  style={{flex:1,padding:'2px 5px',borderRadius:4,border:'1px solid '+T.accent,
                    background:T.input,color:T.text,fontSize:10,minWidth:0}}/>
              ):(
                <span onClick={()=>{setEditingZoneId(z.id);setEditingZoneLabelVal(z.label);}}
                  title="Click to rename"
                  style={{fontSize:10,color:T.sub,lineHeight:1.2,flex:1,cursor:'text',
                    overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap'}}>
                  {z.label}
                </span>
              )}
              <button onClick={()=>{setEditingZoneId(z.id);setEditingZoneLabelVal(z.label);}}
                title="Rename zone" aria-label={'Rename zone: '+z.label}
                style={{padding:'1px 3px',border:'none',background:'transparent',
                  color:T.sub,cursor:'pointer',fontSize:10,flexShrink:0,lineHeight:1}}>
                &#x270F;
              </button>
              <button onClick={()=>removeZone(z.id)} title="Remove zone" aria-label={'Remove zone: '+z.label}
                style={{padding:'1px 4px',border:'none',background:'transparent',
                  color:'rgba(239,68,68,0.7)',cursor:'pointer',fontSize:11,lineHeight:1,
                  flexShrink:0,fontWeight:700}}>
                &#x2715;
              </button>
            </div>
          ))}
          {mode==='zones'&&(
            <div style={{fontSize:9,color:T.accent,marginTop:4,lineHeight:1.4}}>
              &#x2195; Drag on grid to draw zone
            </div>
          )}
        </div>
      </div>
      {/* Grid */}
      <div style={{flex:1,display:'flex',flexDirection:'column',gap:8,minWidth:0}}>
        {/* Mode toolbar */}
        <div style={{display:'flex',alignItems:'center',gap:6,flexWrap:'wrap'}}>
          {[['place','&#x1F33F; Place','Drag plants onto cells; drag placed plants to move them'],
            ['label','&#x270F;&#xFE0F; Label','Click any cell to add or edit a text label'],
            ['paint','&#x1F3A8; Paint','Click or drag across cells to colour them'],
            ['shape','&#x1F4D0; Shape','Click or drag cells to hide/show them — carve any shape from the grid'],
            ['zones','&#x1F5FA;&#xFE0F; Zones','Add new zones by dragging a rectangle; rename or delete existing zones']
          ].map(([m,lbl,tip])=>(
            <button key={m} title={tip} onClick={()=>{setMode(m);setEditCell(null);}}
              style={{padding:'4px 12px',borderRadius:20,border:'1px solid '+T.border,cursor:'pointer',fontSize:12,
                background:mode===m?T.accent:T.input,color:mode===m?'#fff':T.text,fontWeight:mode===m?700:400}}>
              <span dangerouslySetInnerHTML={{__html:lbl}}/>
            </button>
          ))}
          {mode==='paint'&&(
            <div style={{display:'flex',alignItems:'center',gap:4,marginLeft:6,flexWrap:'wrap'}}>
              {PALETTE.map(c=>(
                <div key={c} onClick={()=>setPaintColor(c)}
                  title={c}
                  style={{width:20,height:20,borderRadius:4,background:c,cursor:'pointer',flexShrink:0,
                    border:paintColor===c?'3px solid '+T.text:'2px solid rgba(0,0,0,0.25)',
                    boxSizing:'border-box',outline:paintColor===c?'1px solid '+T.accent:'none',outlineOffset:1}}/>
              ))}
              <div onClick={()=>setPaintColor('__erase__')} title="Eraser"
                style={{width:20,height:20,borderRadius:4,cursor:'pointer',flexShrink:0,display:'flex',
                  alignItems:'center',justifyContent:'center',fontSize:12,
                  border:paintColor==='__erase__'?'3px solid '+T.text:'2px solid rgba(0,0,0,0.25)',
                  background:T.surface,boxSizing:'border-box'}}>
                &#x2715;
              </div>
              <span style={{fontSize:10,color:T.sub,margin:'0 4px'}}>|</span>
              {LIGHT_LEVELS.map(({c,l,i})=>(
                <div key={c} onClick={()=>setPaintColor(c)} title={l}
                  style={{width:28,height:20,borderRadius:4,background:c,cursor:'pointer',flexShrink:0,
                    border:paintColor===c?'3px solid '+T.text:'2px solid rgba(0,0,0,0.25)',
                    boxSizing:'border-box',display:'flex',alignItems:'center',justifyContent:'center',fontSize:11}}>
                  {i}
                </div>
              ))}
              <span style={{fontSize:10,color:T.sub,marginLeft:2}}>Light levels</span>
            </div>
          )}
          {mode==='shape'&&(
            <div style={{display:'flex',alignItems:'center',gap:8,marginLeft:6,flexWrap:'wrap'}}>
              <span style={{fontSize:11,color:T.sub}}>Click/drag cells to hide &bull; click faint ✕ cells to restore</span>
              <button onClick={resetShape} style={{
                padding:'3px 10px',borderRadius:20,border:'1px solid '+T.border,cursor:'pointer',fontSize:11,
                background:T.input,color:T.text}}>
                &#x21BA; Reset cells
              </button>
              {zones&&zones.length>0&&<button onClick={resetZones} style={{
                padding:'3px 10px',borderRadius:20,border:'1px solid '+T.border,cursor:'pointer',fontSize:11,
                background:T.input,color:T.text}}>
                &#x21BA; Reset zones
              </button>}
            </div>
          )}
          {mode==='place'&&effectiveZones.length>0&&(
            <span style={{fontSize:11,color:T.sub,marginLeft:6}}>&#x1F4CD; Drag zone labels to reposition</span>
          )}
          {mode==='zones'&&(
            <span style={{fontSize:11,color:T.sub,marginLeft:6}}>
              Drag to draw a new zone &bull; click zone label to rename &bull; &#x2715; to delete
            </span>
          )}
          <button onClick={()=>setShowPlantPicker(p=>!p)} title="Toggle plant picker panel"
            style={{padding:'4px 12px',borderRadius:20,border:'1px solid '+(showPlantPicker?T.accent:T.border),
              cursor:'pointer',fontSize:12,marginLeft:6,
              background:showPlantPicker?'rgba(74,124,63,0.15)':T.input,
              color:showPlantPicker?T.accent:T.text,fontWeight:showPlantPicker?700:400}}>
            &#x1F33F; Plants &#x25BE;
          </button>
          <div style={{marginLeft:'auto',display:'flex',gap:6,alignItems:'center'}}>
            <button onClick={exportLayout} title="Copy the current zones, plant placements and labels as JSON — paste it into your chat with Claude to make this the permanent default"
              style={{padding:'4px 10px',borderRadius:20,border:'1px solid '+T.border,
                background:T.input,color:T.text,cursor:'pointer',fontSize:11,fontWeight:600,
                display:'flex',alignItems:'center',gap:4}}>
              &#x1F4CB; Export Layout
            </button>
            {bgImage
              ? <button onClick={()=>saveBg(null)} style={{
                  padding:'4px 10px',borderRadius:20,border:'1px solid #ef4444',
                  background:'rgba(239,68,68,0.1)',color:'#ef4444',cursor:'pointer',fontSize:11,fontWeight:600}}>
                  &#x2715; Clear photo
                </button>
              : <label style={{
                  padding:'4px 10px',borderRadius:20,border:'1px dashed '+T.accent,
                  background:'rgba(74,124,63,0.08)',color:T.accent,cursor:'pointer',fontSize:11,fontWeight:600,
                  display:'flex',alignItems:'center',gap:4}}>
                  &#x1F4F7; Photo
                  <input type="file" accept="image/*" style={{display:'none'}}
                    onChange={e=>{if(e.target.files[0])handleBgFile(e.target.files[0]);}}/>
                </label>
            }
          </div>
        </div>
        <div style={{overflowX:'auto',overflowY:'auto',flex:1,paddingTop:24}}
          onMouseUp={()=>{
            setIsPainting(false);
            if(mode==='zones'&&zoneDrawStart&&zoneDrawEnd){
              const x1=Math.min(zoneDrawStart.x,zoneDrawEnd.x);
              const y1=Math.min(zoneDrawStart.y,zoneDrawEnd.y);
              const x2=Math.max(zoneDrawStart.x,zoneDrawEnd.x);
              const y2=Math.max(zoneDrawStart.y,zoneDrawEnd.y);
              setPendingZoneRect({x:x1,y:y1,w:x2-x1+1,h:y2-y1+1});
            }
            setZoneDrawStart(null);setZoneDrawEnd(null);
          }}
          onMouseLeave={()=>{setIsPainting(false);setZoneDrawStart(null);setZoneDrawEnd(null);}}>
          <div style={{position:'relative',width:gridW,height:gridH,borderRadius:10,
            outline:bgDragOver?'3px dashed '+T.accent:'none'}}
            onDragOver={e=>{
              if(e.dataTransfer.types.includes('Files')){e.preventDefault();e.dataTransfer.dropEffect='copy';setBgDragOver(true);}
              else if(e.dataTransfer.types.includes('zoneid')){e.preventDefault();e.dataTransfer.dropEffect='move';}
            }}
            onDragLeave={e=>{if(!e.currentTarget.contains(e.relatedTarget))setBgDragOver(false);}}
            onDrop={e=>{
              const zid=e.dataTransfer.getData('zoneId');
              if(zid){
                e.preventDefault();
                const rect=e.currentTarget.getBoundingClientRect();
                const cx=Math.max(0,Math.floor((e.clientX-rect.left)/(size+GP)));
                const cy=Math.max(0,Math.floor((e.clientY-rect.top)/(size+GP)));
                moveZone(zid,cx,cy);
                return;
              }
              if(e.dataTransfer.files.length>0){
                e.preventDefault();setBgDragOver(false);
                handleBgFile(e.dataTransfer.files[0]);
              }
            }}>
            {bgImage&&<div style={{position:'absolute',inset:0,borderRadius:10,overflow:'hidden',zIndex:0,pointerEvents:'none'}}>
              <img src={bgImage} alt="" style={{width:'100%',height:'100%',objectFit:'cover',opacity:0.32}}/>
            </div>}
            {bgDragOver&&!bgImage&&<div style={{position:'absolute',inset:0,zIndex:20,borderRadius:10,
              background:'rgba(74,124,63,0.12)',display:'flex',alignItems:'center',justifyContent:'center',pointerEvents:'none'}}>
              <span style={{fontSize:18,fontWeight:700,color:T.accent}}>&#x1F4F7; Drop to set as background</span>
            </div>}
            <div style={{display:'grid',gridTemplateColumns:`repeat(${cols},${size}px)`,gridTemplateRows:`repeat(${rows},${size}px)`,gap:GP,width:gridW,height:gridH,position:'relative',zIndex:1}}>
              {Array.from({length:rows},(_,y)=>Array.from({length:cols},(_,x)=>{
                const key=`${x},${y}`,plants=cellMap[key]||[],plant=plants[0]||null,multi=plants.length>1;
                const isHov=hov&&hov.x===x&&hov.y===y;
                const ph=plant?photo(plant):null,col=plant?TC[plantCategory(plant)]:null;
                const wUlvl=plant?getUrgency(plant,careLog,'watered').level:null;
                const anyOverdue=multi&&plants.some(p=>getUrgency(p,careLog,'watered').level==='overdue');
                const zone=getZn(x,y);
                const objInstance=!plant?objectAt(x,y):null;
                const obj=objInstance?OBJECT_TYPES.find(o=>o.id===objInstance.typeId):null;
                const paintC=cellColor[key]||null;
                const labelTxt=cellText[key]||null;
                const isEditingThis=editCell===key&&mode==='label';
                const isDisabled=disabledCells.has(key);

                // Disabled cell — invisible gap (preserve grid position) except in shape mode
                if(isDisabled&&mode!=='shape'){
                  return <div key={key} style={{width:size,height:size,visibility:'hidden',pointerEvents:'none'}}/>;
                }

                // Border
                const border=isDisabled?'1px dashed rgba(255,255,255,0.18)'
                  :isHov&&mode==='place'?'2px dashed '+T.accent
                  :multi?'2px dashed '+T.accent
                  :plant?'2px solid '+col
                  :obj?'2px solid '+T.sub
                  :paintC?'2px solid '+paintC
                  :(zone?'1px solid '+zone.border:'1px dashed '+T.border);
                // Ground texture — real material per zone (paving, bark, water, decking, soil,
                // grass, gravel, indoor floor), falling back to the map's overall default surface.
                const surf=surfaceStyle(zone?.surface||defaultSurface||'tile');
                // Cursor
                const cursor=mode==='zones'?'crosshair':mode==='shape'?'pointer':mode==='paint'?'crosshair':mode==='label'?'text':(plant||obj)?'grab':'default';
                // Zone-draw selection highlight
                const inDrawSel=zoneDrawStart&&zoneDrawEnd&&
                  x>=Math.min(zoneDrawStart.x,zoneDrawEnd.x)&&x<=Math.max(zoneDrawStart.x,zoneDrawEnd.x)&&
                  y>=Math.min(zoneDrawStart.y,zoneDrawEnd.y)&&y<=Math.max(zoneDrawStart.y,zoneDrawEnd.y);
                // Keyboard access: only the two modes with a single well-defined click action
                // (open detail on a placed plant / edit a cell's label) get button semantics —
                // paint/shape/zones are inherently drag-based and out of scope for this pass.
                const keyboardActionable=(mode==='place'&&plant&&!isDisabled&&!multi)||(mode==='label'&&!isDisabled);

                return(
                  <div key={key}
                    role={keyboardActionable?'button':undefined}
                    tabIndex={keyboardActionable?0:undefined}
                    aria-label={keyboardActionable?(mode==='place'?'View '+plant.name:'Edit label for cell'):undefined}
                    onKeyDown={keyboardActionable?e=>{
                      if(e.key!=='Enter'&&e.key!==' ')return;
                      e.preventDefault();
                      if(mode==='place')onSelect(plant);
                      else if(mode==='label'){setEditCell(key);setEditText(cellText[key]||'');}
                    }:undefined}
                    draggable={mode==='place'&&!!plant&&!multi}
                    onDragStart={e=>{
                      if(!plant||mode!=='place'||multi)return;
                      e.dataTransfer.setData('plantId',String(plant.id));
                      e.dataTransfer.setData('fromCell',key);
                      setDragId(String(plant.id));
                      e.stopPropagation();
                    }}
                    onDragEnd={()=>setDragId(null)}
                    onDragOver={e=>{if(mode==='place'){e.preventDefault();setHov({x,y});}}}
                    onDragLeave={e=>{if(mode==='place'&&!e.currentTarget.contains(e.relatedTarget))setHov(null);}}
                    onDrop={e=>{
                      if(mode==='place'){
                        e.preventDefault();
                        const otid=e.dataTransfer.getData('objectTypeId');
                        if(otid){
                          const fromObjectId=e.dataTransfer.getData('fromObjectId');
                          placeObjectAt(otid,x,y,fromObjectId||null);
                          setHov(null);
                          return;
                        }
                        const pid=e.dataTransfer.getData('plantId');
                        const fromCell=e.dataTransfer.getData('fromCell');
                        if(pid)placeAt(pid,x,y,fromCell||null);
                        setHov(null);
                      }
                    }}
                    onDoubleClick={()=>{
                      if(mode!=='place'||isDisabled)return;
                      if(plant&&!multi){
                        if(clickTimerRef.current){clearTimeout(clickTimerRef.current);clickTimerRef.current=null;}
                        removeCell(x,y);
                      }
                    }}
                    onClick={()=>{
                      if(mode==='place'&&plant&&!isDisabled&&!multi){
                        if(clickTimerRef.current)clearTimeout(clickTimerRef.current);
                        clickTimerRef.current=setTimeout(()=>{onSelect(plant);clickTimerRef.current=null;},230);
                      }
                      else if(mode==='label'&&!isDisabled){setEditCell(key);setEditText(cellText[key]||'');}
                    }}
                    onMouseDown={e=>{
                      if(e.button!==0)return;
                      e.preventDefault();
                      if(mode==='paint'&&!isDisabled){setIsPainting(true);doPaint(key);}
                      else if(mode==='shape'){
                        setIsPainting(true);
                        const erasing=isDisabled;
                        setShapeErasing(erasing);
                        doShape(key,erasing);
                      }
                      else if(mode==='zones'){
                        setIsPainting(true);
                        setZoneDrawStart({x,y});setZoneDrawEnd({x,y});
                      }
                    }}
                    onMouseEnter={()=>{
                      if(!isPainting)return;
                      if(mode==='paint'&&!isDisabled)doPaint(key);
                      else if(mode==='shape')doShape(key,shapeErasing);
                      else if(mode==='zones')setZoneDrawEnd({x,y});
                    }}
                    title={
                      mode==='paint'?'Click/drag to paint'
                      :mode==='label'?'Click to edit label'
                      :multi?plants.length+' plants in this pot — click a tile to view, double-click a tile to remove it, drag another plant here to add more'
                      :plant?plant.name+' — drag to move, double-click to remove, drag another plant here to combine into one pot'
                      :obj?obj.label
                      :(zone?zone.label:'Drag a plant here')
                    }
                    style={{width:size,height:size,borderRadius:8,overflow:'hidden',position:'relative',
                      cursor,
                      ...(isDisabled?{background:'rgba(0,0,0,0.35)'}:surf),
                      border,
                      transition:'border-color .12s,box-shadow .12s',
                      userSelect:'none',
                      boxShadow:(plant&&wUlvl==='overdue')||anyOverdue?'0 0 8px rgba(239,68,68,.55)':'none'}}>
                    {/* Disabled cell — show X hint in shape mode */}
                    {isDisabled&&mode==='shape'&&<div style={{
                      position:'absolute',inset:0,display:'flex',alignItems:'center',
                      justifyContent:'center',fontSize:16,color:'rgba(255,255,255,0.35)',
                      userSelect:'none',pointerEvents:'none',zIndex:2}}>&#x2715;</div>}
                    {/* Zone/paint colour wash over the ground texture — only visible without a
                        full-bleed plant photo on top; same tint values as before, now layered
                        over real ground texture instead of the bare page background. */}
                    {!isDisabled&&!plant&&(paintC||zone?.col)&&<div style={{position:'absolute',inset:0,background:paintC||zone.col,zIndex:0,pointerEvents:'none'}}/>}
                    {/* Paint colour tint on painted cells (shows even with plant) */}
                    {!isDisabled&&paintC&&plant&&<div style={{position:'absolute',inset:0,background:paintC,opacity:0.22,zIndex:0,pointerEvents:'none'}}/>}
                    {/* Single-plant cell: full photo + name */}
                    {!isDisabled&&!multi&&ph&&plant&&<img src={wikiThumb(ph,200)} alt={plant.name} loading="lazy" style={{width:'100%',height:'100%',objectFit:'cover',position:'relative',zIndex:1}}/>}
                    {!isDisabled&&!multi&&plant&&<div style={{position:'absolute',bottom:0,left:0,right:0,zIndex:2,
                      background:'linear-gradient(transparent,rgba(0,0,0,.82))',padding:'16px 3px 4px',
                      fontSize:9,color:'#fff',fontWeight:700,textAlign:'center',lineHeight:1.2}}>
                      {plant.name.length>13?plant.name.slice(0,11)+'…':plant.name}
                    </div>}
                    {!isDisabled&&!multi&&plant&&<div style={{position:'absolute',top:3,right:3,width:8,height:8,zIndex:3,borderRadius:'50%',background:col,boxShadow:'0 0 0 1px rgba(0,0,0,.35)'}}/>}
                    {!isDisabled&&!multi&&plant&&wUlvl==='overdue'&&<div style={{position:'absolute',top:3,left:3,zIndex:3,background:'#ef4444',color:'#fff',borderRadius:'50%',width:14,height:14,fontSize:9,display:'flex',alignItems:'center',justifyContent:'center',fontWeight:900}}>!</div>}
                    {!isDisabled&&!multi&&plant&&paintC&&<div style={{position:'absolute',bottom:3,left:3,width:8,height:8,zIndex:4,borderRadius:'50%',background:paintC,border:'1px solid rgba(0,0,0,0.4)'}}/>}
                    {/* Multi-plant (mixed pot) cell: mini-tiles in a single horizontal row, one per plant */}
                    {!isDisabled&&multi&&(
                      <div style={{position:'absolute',inset:0,display:'flex',
                        flexDirection:'row',gap:1,padding:1,zIndex:1}}>
                        {plants.map((p,i)=>{
                          const pph=photo(p),pcol=TC[plantCategory(p)];
                          const pU=getUrgency(p,careLog,'watered').level;
                          return (
                            <div key={p.id+':'+i}
                              draggable={mode==='place'}
                              onDragStart={e=>{
                                if(mode!=='place')return;
                                e.dataTransfer.setData('plantId',String(p.id));
                                e.dataTransfer.setData('fromCell',key);
                                setDragId(String(p.id));
                                e.stopPropagation();
                              }}
                              onDragEnd={()=>setDragId(null)}
                              onClick={e=>{
                                e.stopPropagation();
                                if(mode==='place'&&!isDisabled){
                                  if(clickTimerRef.current)clearTimeout(clickTimerRef.current);
                                  clickTimerRef.current=setTimeout(()=>{onSelect(p);clickTimerRef.current=null;},230);
                                }
                              }}
                              onDoubleClick={e=>{
                                e.stopPropagation();
                                if(mode==='place'&&!isDisabled){
                                  if(clickTimerRef.current){clearTimeout(clickTimerRef.current);clickTimerRef.current=null;}
                                  removeCell(x,y,p.id);
                                }
                              }}
                              title={p.name+' — drag to move out, double-click to remove from this pot'}
                              style={{position:'relative',flex:'1 1 0',minWidth:0,borderRadius:3,overflow:'hidden',
                                border:'1px solid '+pcol,cursor:mode==='place'?'grab':'default',
                                background:T.surface}}>
                              {pph&&<img src={wikiThumb(pph,80)} alt={p.name} loading="lazy" style={{width:'100%',height:'100%',objectFit:'cover'}}/>}
                              {pU==='overdue'&&<div style={{position:'absolute',top:1,left:1,background:'#ef4444',color:'#fff',
                                borderRadius:'50%',width:10,height:10,fontSize:7,display:'flex',alignItems:'center',justifyContent:'center',fontWeight:900}}>!</div>}
                            </div>
                          );
                        })}
                      </div>
                    )}
                    {!isDisabled&&multi&&<div style={{position:'absolute',bottom:0,left:0,right:0,zIndex:2,pointerEvents:'none',
                      background:'linear-gradient(transparent,rgba(0,0,0,.85))',padding:'10px 2px 2px',
                      fontSize:7,color:'#fff',fontWeight:700,textAlign:'center',lineHeight:1.1}}>
                      {plants.length} plants
                    </div>}
                    {/* Text label */}
                    {labelTxt&&!isEditingThis&&<div style={{
                      position:'absolute',zIndex:5,
                      bottom:plant?18:4,left:2,right:2,
                      textAlign:'center',fontSize:8,fontWeight:700,
                      color:'#fff',textShadow:'0 1px 3px rgba(0,0,0,1)',
                      lineHeight:1.2,wordBreak:'break-word',overflow:'hidden',maxHeight:plant?14:32}}>
                      {labelTxt}
                    </div>}
                    {/* Hover + indicator */}
                    {isHov&&mode==='place'&&!plant&&<div style={{position:'absolute',inset:0,zIndex:5,display:'flex',alignItems:'center',justifyContent:'center',fontSize:22,color:T.accent,opacity:.55}}>+</div>}
                    {isHov&&mode==='place'&&!!plant&&<div style={{position:'absolute',top:2,right:multi?2:14,zIndex:6,fontSize:13,color:T.accent,background:'rgba(0,0,0,0.55)',borderRadius:'50%',width:16,height:16,display:'flex',alignItems:'center',justifyContent:'center',pointerEvents:'none'}}>+</div>}
                    {inDrawSel&&<div style={{position:'absolute',inset:0,background:'rgba(99,102,241,0.35)',zIndex:6,pointerEvents:'none',borderRadius:4}}/>}
                    {mode==='label'&&!isEditingThis&&<div style={{position:'absolute',top:2,left:2,fontSize:9,zIndex:5,opacity:0.45}}>&#x270F;</div>}
                    {/* Inline text editor (label mode) */}
                    {isEditingThis&&(
                      <div style={{position:'absolute',inset:0,zIndex:10,display:'flex',flexDirection:'column',
                        alignItems:'center',justifyContent:'center',background:'rgba(0,0,0,0.72)',borderRadius:6,padding:4}}>
                        <input autoFocus value={editText}
                          onChange={e=>setEditText(e.target.value)}
                          placeholder="Label…"
                          onKeyDown={e=>{
                            if(e.key==='Enter'){e.preventDefault();saveCellText(key,editText);}
                            if(e.key==='Escape'){setEditCell(null);}
                          }}
                          onBlur={()=>saveCellText(key,editText)}
                          style={{width:'100%',padding:'3px 5px',borderRadius:4,border:'1px solid '+T.accent,
                            background:T.input,color:T.text,fontSize:10,boxSizing:'border-box',textAlign:'center'}}/>
                        <div style={{display:'flex',gap:4,marginTop:3}}>
                          <button onMouseDown={e=>{e.preventDefault();saveCellText(key,'');}}
                            style={{fontSize:8,padding:'2px 5px',borderRadius:3,border:'none',
                              background:'rgba(239,68,68,0.8)',color:'#fff',cursor:'pointer'}}>Clear</button>
                          <button onMouseDown={e=>{e.preventDefault();saveCellText(key,editText);}}
                            style={{fontSize:8,padding:'2px 5px',borderRadius:3,border:'none',
                              background:T.green,color:'#fff',cursor:'pointer'}}>Save</button>
                        </div>
                      </div>
                    )}
                  </div>
                );
              }))}
            </div>
            {/* Object overlays — footprint-sized tiles, freely rotatable/scalable, draggable in
                place mode, click to open rotate/size controls, double-click to remove */}
            {objects.map(o=>{
              const t=OBJECT_TYPES.find(ot=>ot.id===o.typeId);
              if(!t)return null;
              const rot=o.rot||0, scale=o.scale||1;
              const tileW=t.w*(size+GP)-GP, tileH=t.h*(size+GP)-GP;
              const isEditingThis=editingObjectId===o.id;
              return (
                <React.Fragment key={o.id}>
                  <div
                    draggable={mode==='place'}
                    onDragStart={mode==='place'?e=>{
                      e.dataTransfer.setData('objectTypeId',o.typeId);
                      e.dataTransfer.setData('fromObjectId',o.id);
                      setDragId('obj:'+o.id);
                      e.stopPropagation();
                    }:undefined}
                    onDragEnd={()=>setDragId(null)}
                    onClick={e=>{
                      if(mode!=='place')return;
                      e.stopPropagation();
                      setEditingObjectId(prev=>prev===o.id?null:o.id);
                    }}
                    onDoubleClick={e=>{e.stopPropagation();if(mode==='place')removeObject(o.id);}}
                    title={t.label+' — click to rotate/resize, drag to move, double-click to remove'}
                    style={{
                      position:'absolute',
                      left:o.x*(size+GP),top:o.y*(size+GP),
                      width:tileW,height:tileH,
                      borderRadius:8,border:'2px solid '+(isEditingThis?T.accent:T.sub),background:T.surface,
                      zIndex:isEditingThis?7:2,cursor:mode==='place'?'grab':'default',
                      display:'flex',flexDirection:'column',alignItems:'center',justifyContent:'center',gap:2,
                      userSelect:'none',
                      transform:`rotate(${rot}deg) scale(${scale})`,transformOrigin:'center'}}>
                    <span style={{fontSize:Math.round(size*0.32)}}>{t.icon}</span>
                    <span style={{fontSize:9,color:T.text,fontWeight:700,textAlign:'center',lineHeight:1.1,
                      padding:'0 2px',overflow:'hidden',display:'-webkit-box',WebkitLineClamp:2,WebkitBoxOrient:'vertical'}}>
                      {t.label}
                    </span>
                  </div>
                  {/* Rotate/scale/remove popover — opens on click, independent of the tile's own transform */}
                  {isEditingThis&&(
                    <div onClick={e=>e.stopPropagation()} style={{
                      position:'absolute',zIndex:50,
                      left:o.x*(size+GP),top:o.y*(size+GP)+tileH+6,
                      width:158,background:'rgba(0,0,0,0.85)',backdropFilter:'blur(3px)',
                      borderRadius:8,padding:'8px 10px',boxShadow:T.shadowLg}}>
                      <div style={{display:'flex',alignItems:'center',justifyContent:'space-between',marginBottom:6}}>
                        <span style={{fontSize:10,fontWeight:700,color:'#fff'}}>{t.icon} {t.label}</span>
                        <button onClick={()=>setEditingObjectId(null)} aria-label="Close"
                          style={{background:'none',border:'none',color:'#fff',fontSize:13,cursor:'pointer',lineHeight:1,padding:0}}>&#x2715;</button>
                      </div>
                      <div style={{fontSize:9,color:'#cbd5c8',marginBottom:2,display:'flex',justifyContent:'space-between'}}>
                        <span>&#x1F504; Rotate</span><span>{rot}&deg;</span>
                      </div>
                      <div style={{display:'flex',alignItems:'center',gap:4,marginBottom:8}}>
                        <button onClick={()=>rotateObject(o.id,rot-15)} aria-label="Rotate 15 degrees left"
                          style={{width:20,height:20,flexShrink:0,borderRadius:4,border:'none',background:'rgba(255,255,255,0.15)',color:'#fff',fontSize:11,cursor:'pointer'}}>&#x21B6;</button>
                        <input type="range" min="0" max="359" step="1" value={rot}
                          onChange={e=>rotateObject(o.id,Number(e.target.value))}
                          style={{flex:1,accentColor:T.accent}}/>
                        <button onClick={()=>rotateObject(o.id,rot+15)} aria-label="Rotate 15 degrees right"
                          style={{width:20,height:20,flexShrink:0,borderRadius:4,border:'none',background:'rgba(255,255,255,0.15)',color:'#fff',fontSize:11,cursor:'pointer'}}>&#x21B7;</button>
                      </div>
                      <div style={{fontSize:9,color:'#cbd5c8',marginBottom:2,display:'flex',justifyContent:'space-between'}}>
                        <span>&#x1F50D; Size</span><span>{Math.round(scale*100)}%</span>
                      </div>
                      <input type="range" min="0.4" max="1" step="0.05" value={scale}
                        onChange={e=>scaleObject(o.id,Number(e.target.value))}
                        style={{width:'100%',accentColor:T.accent,marginBottom:8}}/>
                      <button onClick={()=>removeObject(o.id)} style={{
                        width:'100%',padding:'4px 0',background:'rgba(239,68,68,0.85)',border:'none',
                        borderRadius:5,color:'#fff',fontSize:10,fontWeight:600,cursor:'pointer'}}>
                        &#x1F5D1;&#xFE0F; Remove
                      </button>
                    </div>
                  )}
                </React.Fragment>
              );
            })}
            {/* Zone label overlays — draggable in place mode, editable/deletable in zones mode */}
            {effectiveZones.map(z=>{
              const zp=getZonePos(z);
              const draggable=mode==='place';
              const editable=mode==='zones';
              const isEditThis=editingZoneId===z.id;
              const zoneDropActive=mode==='place'&&!!dragId;
              return(
                <React.Fragment key={z.id}>
                  {/* Invisible full-rect drag/drop target — bounds match the zone exactly */}
                  <div
                    onDragOver={zoneDropActive?e=>{
                      if(!e.dataTransfer.types.includes('plantid')&&!e.dataTransfer.types.includes('objecttypeid'))return;
                      e.preventDefault();
                      const rect=e.currentTarget.getBoundingClientRect();
                      const hx=zp.x+Math.max(0,Math.min(z.w-1,Math.floor((e.clientX-rect.left)/(size+GP))));
                      const hy=zp.y+Math.max(0,Math.min(z.h-1,Math.floor((e.clientY-rect.top)/(size+GP))));
                      setHov({x:hx,y:hy});
                    }:undefined}
                    onDrop={zoneDropActive?e=>{
                      if(!e.dataTransfer.types.includes('plantid')&&!e.dataTransfer.types.includes('objecttypeid'))return;
                      e.preventDefault();
                      const fromCell=e.dataTransfer.getData('fromCell');
                      const rect=e.currentTarget.getBoundingClientRect();
                      const cx=zp.x+Math.max(0,Math.min(z.w-1,Math.floor((e.clientX-rect.left)/(size+GP))));
                      const cy=zp.y+Math.max(0,Math.min(z.h-1,Math.floor((e.clientY-rect.top)/(size+GP))));
                      const otid=e.dataTransfer.getData('objectTypeId');
                      if(otid){
                        const fromObjectId=e.dataTransfer.getData('fromObjectId');
                        if(fromObjectId) placeObjectAt(otid,cx,cy,fromObjectId);
                        else placeObjectInZone(otid,z,cx,cy);
                        setHov(null);
                        return;
                      }
                      const pid=e.dataTransfer.getData('plantId');
                      if(!pid)return;
                      if(fromCell) placeAt(pid,cx,cy,fromCell);
                      else placeInZone(pid,z,cx,cy);
                      setHov(null);
                    }:undefined}
                    style={{
                      position:'absolute',
                      left:zp.x*(size+GP),top:zp.y*(size+GP),
                      width:z.w*(size+GP)-GP,height:z.h*(size+GP)-GP,
                      pointerEvents:zoneDropActive?'auto':'none',
                      zIndex:5}}/>
                  {/* Visible zone label — external, sits just above the zone rectangle */}
                  <div style={{
                    position:'absolute',
                    left:zp.x*(size+GP),top:zp.y*(size+GP)-22,
                    width:z.w*(size+GP)-GP,
                    display:'flex',alignItems:'center',justifyContent:'center',
                    zIndex:6,pointerEvents:'none'}}>
                    {editable?(
                      <div style={{display:'flex',alignItems:'center',gap:4,
                        background:'rgba(0,0,0,0.72)',borderRadius:5,padding:'3px 6px',
                        maxWidth:'90%',backdropFilter:'blur(3px)',pointerEvents:'auto'}}>
                        {isEditThis?(
                          <input autoFocus value={editingZoneLabelVal}
                            onChange={e=>setEditingZoneLabelVal(e.target.value)}
                            onKeyDown={e=>{if(e.key==='Enter')saveZoneLabel(z.id,editingZoneLabelVal);if(e.key==='Escape')setEditingZoneId(null);}}
                            onBlur={()=>saveZoneLabel(z.id,editingZoneLabelVal)}
                            style={{width:80,padding:'2px 4px',borderRadius:3,border:'1px solid '+T.accent,
                              background:T.input,color:T.text,fontSize:10}}/>
                        ):(
                          <span onClick={()=>{setEditingZoneId(z.id);setEditingZoneLabelVal(z.label);}}
                            style={{color:'#fff',fontSize:10,fontWeight:700,cursor:'text',userSelect:'none',
                              letterSpacing:.3,lineHeight:1.3}}>
                            &#x270F; {z.label}
                          </span>
                        )}
                        <button onMouseDown={e=>{e.preventDefault();e.stopPropagation();removeZone(z.id);}}
                          aria-label={'Remove zone: '+z.label}
                          style={{background:'rgba(239,68,68,0.85)',border:'none',borderRadius:3,
                            color:'#fff',fontSize:11,fontWeight:700,cursor:'pointer',lineHeight:1,
                            padding:'1px 4px',flexShrink:0}}>
                          &#x2715;
                        </button>
                      </div>
                    ):(
                      <span
                        draggable={draggable}
                        onDragStart={draggable?e=>{
                          e.dataTransfer.setData('zoneId',z.id);
                          e.dataTransfer.effectAllowed='move';
                          e.stopPropagation();
                        }:undefined}
                        style={{
                        background:T.card,color:T.text,fontSize:10,fontWeight:700,
                        border:'1px solid '+z.border,
                        borderRadius:4,padding:'2px 7px',letterSpacing:.3,
                        maxWidth:'90%',textAlign:'center',lineHeight:1.3,pointerEvents:draggable?'auto':'none',
                        userSelect:'none',display:'flex',alignItems:'center',gap:4,cursor:draggable?'grab':'default'}}>
                        {draggable&&<span style={{opacity:0.7,fontSize:12}}>&#x2B0C;</span>}
                        {z.label}
                      </span>
                    )}
                  </div>
                </React.Fragment>
              );
            })}
          </div>{/* end position:relative outer */}
        </div>{/* end overflow scroll */}
      </div>
    </div>
    {/* ── New-zone confirmation modal ─────────────────────────────────── */}
    {pendingZoneRect&&(
      <div style={{position:'fixed',inset:0,zIndex:3000,display:'flex',alignItems:'center',justifyContent:'center',
        background:'rgba(0,0,0,0.55)'}}
        onMouseDown={e=>{if(e.target===e.currentTarget){setPendingZoneRect(null);}}}>
        <div style={{background:T.card,border:'1px solid '+T.border,borderRadius:14,padding:20,
          width:320,boxShadow:T.shadowLg}}>
          <div style={{fontWeight:700,fontSize:15,color:T.text,marginBottom:14}}>
            &#x1F5FA;&#xFE0F; New Zone ({pendingZoneRect.w}&times;{pendingZoneRect.h} cells)
          </div>
          <div style={{marginBottom:10}}>
            <label style={{fontSize:12,color:T.sub,display:'block',marginBottom:4}}>Zone name</label>
            <input autoFocus value={newZoneLabel} onChange={e=>setNewZoneLabel(e.target.value)}
              onKeyDown={e=>{if(e.key==='Enter')confirmNewZone();if(e.key==='Escape')setPendingZoneRect(null);}}
              placeholder="e.g. Sunny corner"
              style={{width:'100%',padding:'7px 10px',borderRadius:7,border:'1px solid '+T.border,
                background:T.input,color:T.text,fontSize:13,boxSizing:'border-box'}}/>
          </div>
          <div style={{marginBottom:16}}>
            <label style={{fontSize:12,color:T.sub,display:'block',marginBottom:6}}>Colour</label>
            <div style={{display:'flex',gap:6,flexWrap:'wrap'}}>
              {ZONE_COLORS.map((c,i)=>(
                <div key={i} onClick={()=>setNewZoneColorIdx(i)}
                  style={{width:24,height:24,borderRadius:5,background:c.border,cursor:'pointer',flexShrink:0,
                    border:newZoneColorIdx===i?'3px solid '+T.text:'2px solid transparent',
                    outline:newZoneColorIdx===i?'1px solid '+T.accent:'none',outlineOffset:1,
                    boxSizing:'border-box'}}/>
              ))}
            </div>
          </div>
          <div style={{display:'flex',gap:8}}>
            <button onClick={()=>setPendingZoneRect(null)} style={{
              flex:1,padding:'8px 0',borderRadius:7,border:'1px solid '+T.border,
              background:T.input,color:T.sub,cursor:'pointer',fontSize:13}}>
              Cancel
            </button>
            <button onClick={confirmNewZone} style={{
              flex:2,padding:'8px 0',borderRadius:7,border:'none',
              background:T.green,color:'#fff',cursor:'pointer',fontSize:13,fontWeight:700}}>
              Add Zone
            </button>
          </div>
        </div>
      </div>
    )}
    </>
  );
}
