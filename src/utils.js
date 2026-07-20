import React from 'react';

export function useIsMobile(){
  const [m,setM]=React.useState(()=>typeof window!=='undefined'&&window.innerWidth<640);
  React.useEffect(()=>{
    const h=()=>setM(window.innerWidth<640);
    window.addEventListener('resize',h,{passive:true});
    return()=>window.removeEventListener('resize',h);
  },[]);
  return m;
}

export function useScrollCollapse(){
  const [collapsed,setCollapsed]=React.useState(false);
  React.useEffect(()=>{
    let lastY=window.scrollY;
    const h=()=>{
      const y=window.scrollY;
      if(y<40){setCollapsed(false);lastY=y;return;}
      if(y>lastY+6) setCollapsed(true);
      else if(y<lastY-6) setCollapsed(false);
      lastY=y;
    };
    window.addEventListener('scroll',h,{passive:true});
    return()=>window.removeEventListener('scroll',h);
  },[]);
  return collapsed;
}

export const DARK = {
  bg:'#0a120a', card:'#0f1f0f', surface:'#162616', surfaceHov:'#1e3a1e',
  text:'#f5f0e8', sub:'#9a8a6a', accent:'#7ab86a', green:'#4a7c3f',
  border:'rgba(255,255,255,0.08)', borderMid:'rgba(255,255,255,0.14)',
  input:'rgba(255,255,255,0.07)', overlay:'rgba(0,0,0,0.78)',
  tag:'rgba(255,255,255,0.08)', tagText:'#c8d8c0', badgeBg:'rgba(0,0,0,0.5)',
};

export const LIGHT = {
  bg:'#f5f7f0', card:'#ffffff', surface:'#eaf2e4', surfaceHov:'#daecd2',
  text:'#1a2a10', sub:'#567040', accent:'#2a6a18', green:'#2a5a18',
  border:'rgba(0,0,0,0.1)', borderMid:'rgba(0,0,0,0.18)',
  input:'rgba(0,0,0,0.06)', overlay:'rgba(0,0,0,0.52)',
  tag:'rgba(0,0,0,0.08)', tagText:'#3a5a28', badgeBg:'rgba(0,0,0,0.35)',
};

export const ThemeCtx = React.createContext(DARK);

export const MONTH_IDX = {jan:0,feb:1,mar:2,apr:3,may:4,jun:5,jul:6,aug:7,sep:8,oct:9,nov:10,dec:11};

export const MO_NAMES  = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];

export function floweringMonths(str){
  if(!str) return [];
  const s=str.toLowerCase(), res=[];
  const rangeRe=/(jan|feb|mar|apr|may|jun|jul|aug|sep|oct|nov|dec)[a-z]*\s*[–\-]\s*(jan|feb|mar|apr|may|jun|jul|aug|sep|oct|nov|dec)/g;
  let m;
  while((m=rangeRe.exec(s))!==null){
    const lo=MONTH_IDX[m[1].slice(0,3)], hi=MONTH_IDX[m[2].slice(0,3)];
    if(lo!==undefined&&hi!==undefined) for(let i=lo;i<=hi;i++) res.push(i);
  }
  if(!res.length){
    const single=/(jan|feb|mar|apr|may|jun|jul|aug|sep|oct|nov|dec)/g;
    while((m=single.exec(s))!==null){ const idx=MONTH_IDX[m[1]]; if(idx!==undefined) res.push(idx); }
    if(s.includes('spring')) [2,3,4].forEach(x=>res.push(x));
    if(s.includes('summer')) [5,6,7].forEach(x=>res.push(x));
    if(s.includes('autumn')) [8,9,10].forEach(x=>res.push(x));
    if(s.includes('winter')) [11,0,1].forEach(x=>res.push(x));
  }
  return [...new Set(res)];
}

export function isFloweringNow(plant){ const m=new Date().getMonth(); return floweringMonths(plant.flowering).includes(m); }

export function waterInterval(plant){
  const w=(plant.water||'').toLowerCase();
  if(w.includes('daily')||w.includes('very frequent')||w.includes('moist')) return 2;
  if(w.includes('frequent')||w.includes('moderate to high')) return 4;
  if(w.includes('sparingly')||w.includes('drought')||w.includes('infrequent')) return 14;
  return 7;
}

export function feedInterval(plant){
  const tags=plant.tags||[], id=String(plant.id);
  if(id.startsWith('h')||tags.includes('Productive')) return 7;
  if(tags.includes('Annual')||tags.includes('Long-flowering')) return 14;
  if(id.startsWith('i')||tags.includes('Tropical')) return 14;
  return 28;
}

export function repotApplicable(plant){ return String(plant.id).startsWith('i')||String(plant.id).startsWith('h'); }

export function repotInterval(plant){
  const tags=plant.tags||[];
  if(tags.includes('Fast-growing')||tags.includes('Tropical')) return 365;
  return 730;
}

export function getUrgency(plant, careLog, type='watered'){
  const ts = careLog[String(plant.id)+'-'+type];
  if(!ts) return {level:'unset', days:null};
  const days = (Date.now()-ts)/86400000;
  const iv = type==='watered' ? waterInterval(plant) :
             type==='fed'     ? feedInterval(plant) :
                                repotInterval(plant);
  if(days>=iv)        return {level:'overdue', days:Math.round(days)};
  if(days>=iv*0.65)   return {level:'soon',    days:Math.round(days)};
  return                     {level:'ok',      days:Math.round(days)};
}

export const URG_COLOR = { overdue:'#ef4444', soon:'#f59e0b', ok:'#22c55e', unset:'#6b7280' };

export function plantCategory(p){ const id=String(p.id); return id.startsWith('h')?'hydro':id.startsWith('i')?'indoor':'outdoor'; }

export function waterLevel(p){
  const w=(p.water||'').toLowerCase();
  if(w.includes('high'))return 'high';
  if(w.includes('low'))return 'low';
  return 'med';
}

export const WATER_LEVEL_COLORS={
  low: {bg:'#93c5fd',border:'#3b82f6',label:'Low'},
  med: {bg:'#3b82f6',border:'#1e40af',label:'Medium'},
  high:{bg:'#1e3a8a',border:'#0f2557',label:'High'},
};

export function badgeForType(type){
  if(type==='hydro')  return {badge:'HYDRO',   color:'#d97706'};
  if(type==='indoor') return {badge:'INDOOR',  color:'#1e40af'};
  return                     {badge:'OUTDOOR', color:'#4a7c3f'};
}

export function parseSowMonths(sow){
  if(!sow) return [];
  const s=sow.toLowerCase(), all=new Set();
  if(s.includes('spring')) [2,3,4].forEach(m=>all.add(m));
  if(s.includes('summer')) [5,6,7].forEach(m=>all.add(m));
  if(s.includes('autumn')) [8,9,10].forEach(m=>all.add(m));
  if(s.includes('winter')) [11,0,1].forEach(m=>all.add(m));
  const mo={jan:0,feb:1,mar:2,apr:3,may:4,jun:5,jul:6,aug:7,sep:8,oct:9,nov:10,dec:11};
  const re=/(jan|feb|mar|apr|may|jun|jul|aug|sep|oct|nov|dec)[a-z]*(?:\s*[–\-]\s*(jan|feb|mar|apr|may|jun|jul|aug|sep|oct|nov|dec)[a-z]*)?/g;
  let m;
  while((m=re.exec(s))!==null){
    const lo=mo[m[1].slice(0,3)], hi=m[2]?mo[m[2].slice(0,3)]:lo;
    if(lo!==undefined&&hi!==undefined){ for(let i=lo;i<=hi;i++) all.add(i); }
  }
  return [...all].sort((a,b)=>a-b);
}

export function parseWaterFreqDays(w=''){
  const s=(w||'').toLowerCase();
  if(s.match(/daily|every\s*day/)) return 1;
  if(s.match(/every\s*2|twice\s*a\s*week/)) return 2;
  if(s.match(/every\s*3/)) return 3;
  if(s.match(/every\s*4/)) return 4;
  if(s.match(/every\s*5/)) return 5;
  if(s.match(/twice/)) return 3;
  if(s.match(/10[\s-–]14\s*day/)) return 12;
  if(s.match(/weekly|once\s*a?\s*week/)) return 7;
  if(s.match(/every\s*10/)) return 10;
  if(s.match(/every\s*two\s*week|fortnightly|every\s*14/)) return 14;
  if(s.match(/every\s*2[\s-–]3\s*week/)) return 18;
  if(s.match(/monthly|once\s*a?\s*month/)) return 30;
  if(s.match(/low|drought|sparingly|very\s*little/)) return 21;
  if(s.match(/high|frequent|constant|keep\s*moist/)) return 4;
  if(s.match(/moderate|regular/)) return 7;
  return 7;
}

export function fmtDate(ts){
  const d=new Date(ts);
  return d.toLocaleDateString('en-GB',{day:'numeric',month:'short',year:'numeric'});
}

export function customPhotoKey(id){return 'plant-photo-'+id;}

export function getCustomPhoto(id){try{return localStorage.getItem(customPhotoKey(id))||null;}catch{return null;}}

export function setCustomPhoto(id,dataUrl){try{if(dataUrl)localStorage.setItem(customPhotoKey(id),dataUrl);else localStorage.removeItem(customPhotoKey(id));}catch{}}

export function resizeImageToDataURL(file,maxW=1400,quality=0.68){
  return new Promise(resolve=>{
    const img=new Image(),url=URL.createObjectURL(file);
    img.onload=()=>{
      URL.revokeObjectURL(url);
      const scale=Math.min(1,maxW/img.width);
      const c=document.createElement('canvas');
      c.width=Math.round(img.width*scale);
      c.height=Math.round(img.height*scale);
      c.getContext('2d').drawImage(img,0,0,c.width,c.height);
      resolve(c.toDataURL('image/jpeg',quality));
    };
    img.src=url;
  });
}

export function repotSeason(plant){
  if(plant.repotSeason) return plant.repotSeason;
  const tags=plant.tags||[],id=String(plant.id);
  if(tags.includes('Annual')) return 'Not applicable — grown fresh each season';
  if(tags.includes('Succulent')) return 'Spring (March–April) — only when severely root-bound';
  if(tags.includes('Bulb')) return 'After flowering dies back, or early autumn before dormancy';
  if(id.startsWith('i')||tags.includes('Tropical')) return 'Spring (April–May) — every 1–2 years or when root-bound';
  if(tags.includes('Evergreen')) return 'Spring (March–May) — every 2–3 years into slightly larger pot';
  if(tags.includes('Perennial')) return 'Early spring (March) before growth resumes, or early autumn';
  return 'Spring (March–May) before active growing season';
}

export const STORAGE_INFO={
  "1":  "Harvest at 15–20 cm. Refrigerate 1 week. Slice, blanch 1 min and freeze 6 months. Grate and freeze for baking. Make chutney for pantry.",
  "16": "Harvest when firm and fully coloured. Counter 1–2 weeks; fridge 2 weeks. Slice and freeze raw. Dry, pickle in vinegar, or make hot sauce.",
  "18": "Eat fresh within 2 days — quality drops fast. Blanch 2 min, freeze flat on tray before bagging. Store upright in water in fridge short-term.",
  "19": "Twist off tops; store roots in damp sand in cool dark place 3 months. Pickle in vinegar. Roast and freeze in portions.",
  "47": "Eat immediately when soft and skin splits. Dry in oven at 60°C for 6–8h. Make jam or freeze as purée.",
  "50": "Squeeze and freeze juice in ice cube trays. Zest and dry or freeze peel. Preserved lemons: pack in coarse salt 4 weeks — lasts 12 months in fridge.",
  "h01":"Ripen at room temperature. Refrigerate ripe tomatoes 2 weeks. Oven-roast and freeze. Make passata or sauce for freezer/jar storage.",
  "h02":"Dry leaves at 30°C 48h — store in airtight jar 1 year. Freeze blended with oil in ice cube trays. For pesto: blend, freeze up to 6 months.",
  "h03":"Dry whole in oven at 80°C 6–8h or hang-dry. Freeze raw. Make chilli oil, hot sauce or pickle in vinegar. Dried chillies last 12+ months.",
  "h04":"Eat fresh within 3 days. Hull and freeze on a tray before bagging — keeps 6 months. Make jam or coulis.",
  "h06":"Slow-roast halved at 160°C for 1h, then freeze in portions. Excellent for passata.",
  "h07":"Dry in oven (3–4h at 120°C). Freeze whole — skins slip off after defrost. Great for sauce.",
  "h08":"Best fresh for colour. Freeze raw on tray. Makes striking deep-coloured sauce or bruschetta.",
  "h09":"Halve and oven-roast, freeze in bags. Traditional passata: blanch, peel, blend, bottle in sterilised jars. Best variety for sauce storage.",
  "h11":"Dry at 35°C 48h — very concentrated flavour. Freeze in olive oil ice cube trays. Excellent dried for seasoning.",
  "h12":"Infuse in white wine vinegar 2 weeks for vivid pink vinegar — strain and bottle. Freeze in oil. Make purple pesto.",
  "h13":"Use immediately for maximum flavour. Keep between damp paper towels in fridge 2–3 days. Not suitable for drying — use fresh.",
};
