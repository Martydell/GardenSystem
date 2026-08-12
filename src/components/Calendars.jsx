import React from 'react';
import { AttentionCard } from './PlantCards.jsx';
import { MO_NAMES, ThemeCtx, daysUntilDue, fmtDate, getUrgency, parseSowMonths, parseWaterFreqDays, plantCategory, pruneApplicable, repotApplicable, repotSeason, useIsMobile } from '../utils.js';

export function CareSummaryPanel({allPlants, careLog, pestLog, onSelect}){
  const T = React.useContext(ThemeCtx);
  const [expanded, setExpanded] = React.useState(null);
  function toggle(id){ setExpanded(e=>e===id?null:id); }

  function bucket(type, gate){
    const today=[], week=[];
    allPlants.forEach(p=>{
      if(gate && !gate(p)) return;
      const d = daysUntilDue(p, careLog, type);
      if(d==null) return;
      if(d<=0) today.push(p);
      else if(d<=7) week.push(p);
    });
    return {today, week};
  }

  const water = bucket('watered');
  const feed  = bucket('fed');
  const prune = bucket('pruned', pruneApplicable);
  const activePests = (pestLog||[]).filter(e=>!e.resolved);
  const pestPlantIds = [...new Set(activePests.map(e=>String(e.plantId)))];
  const pestPlants = allPlants.filter(p=>pestPlantIds.includes(String(p.id)));

  const rows = [
    {key:'water', label:'Needing Water',      icon:'&#x1F4A7;', color:'#3b82f6', today:water.today, week:water.week},
    {key:'feed',  label:'Needing Fertilizer', icon:'&#x1F9EA;', color:'#10b981', today:feed.today,  week:feed.week},
    {key:'prune', label:'Needing Pruning',    icon:'&#x2702;&#xFE0F;', color:'#d97706', today:prune.today, week:prune.week},
  ];

  const countBtn = (id, count, color) => (
    <button onClick={()=>count&&toggle(id)} disabled={!count} style={{
      padding:'6px 12px',borderRadius:8,cursor:count?'pointer':'default',
      border:'1px solid '+(count?color:T.border),
      background:expanded===id?color:'transparent',
      color:expanded===id?'#fff':(count?color:T.sub),
      fontSize:13,fontWeight:700,minWidth:36}}>
      {count}
    </button>
  );

  const plantChips = (list) => (
    <div style={{display:'flex',flexWrap:'wrap',gap:6,padding:'10px 0 4px'}}>
      {list.length===0&&<span style={{fontSize:12,color:T.sub}}>None</span>}
      {list.map(p=>(
        <button key={p.id} onClick={()=>onSelect(p)} style={{
          padding:'4px 10px',borderRadius:20,border:'1px solid '+T.border,
          background:T.input,color:T.text,fontSize:12,cursor:'pointer'}}>
          {p.name}
        </button>
      ))}
    </div>
  );

  return (
    <div style={{background:T.card,border:'1px solid '+T.border,borderRadius:12,padding:'14px 16px',marginBottom:24}}>
      <h3 style={{fontSize:16,fontWeight:700,color:T.text,margin:'0 0 12px'}}>&#x1F4CB; Care Summary</h3>
      <div style={{display:'flex',flexDirection:'column',gap:10}}>
        {rows.map(r=>(
          <div key={r.key}>
            <div style={{display:'flex',alignItems:'center',gap:10,flexWrap:'wrap'}}>
              <span style={{minWidth:170,display:'flex',alignItems:'center',gap:6,color:T.text,fontWeight:600,fontSize:13}}>
                <span dangerouslySetInnerHTML={{__html:r.icon}}/>{r.label}
              </span>
              <div style={{display:'flex',alignItems:'center',gap:6}}>
                <span style={{fontSize:11,color:T.sub}}>Today</span>
                {countBtn(r.key+'-today', r.today.length, r.color)}
              </div>
              <div style={{display:'flex',alignItems:'center',gap:6}}>
                <span style={{fontSize:11,color:T.sub}}>Next 7 days</span>
                {countBtn(r.key+'-week', r.week.length, r.color)}
              </div>
            </div>
            {expanded===r.key+'-today'&&plantChips(r.today)}
            {expanded===r.key+'-week'&&plantChips(r.week)}
          </div>
        ))}
        <div>
          <div style={{display:'flex',alignItems:'center',gap:10,flexWrap:'wrap'}}>
            <span style={{minWidth:170,display:'flex',alignItems:'center',gap:6,color:T.text,fontWeight:600,fontSize:13}}>
              &#x1F41B; Pest Control
            </span>
            <div style={{display:'flex',alignItems:'center',gap:6}}>
              <span style={{fontSize:11,color:T.sub}}>Active issues</span>
              {countBtn('pests', pestPlants.length, '#ef4444')}
            </div>
          </div>
          {expanded==='pests'&&plantChips(pestPlants)}
        </div>
      </div>
    </div>
  );
}

// A flat, tickable "what needs doing today" list — complements CareSummaryPanel's
// per-type counts with something more directly actionable: one row per due item,
// tap done and it's gone.
export function TodaysChecklist({allPlants, careLog, pestLog, onLog, onResolvePest, onSelect, streak=0}){
  const T = React.useContext(ThemeCtx);
  const [completingKeys, setCompletingKeys] = React.useState({});

  function complete(key, action){
    setCompletingKeys(c=>({...c,[key]:true}));
    setTimeout(()=>{
      action();
      setCompletingKeys(c=>{ const n={...c}; delete n[key]; return n; });
    }, 360);
  }

  const items = [];
  allPlants.forEach(p=>{
    const wD = daysUntilDue(p, careLog, 'watered');
    if(wD!=null && wD<=0) items.push({key:p.id+'-watered', plant:p, type:'watered', label:'Water', icon:'&#x1F4A7;', color:'#3b82f6'});
    const fD = daysUntilDue(p, careLog, 'fed');
    if(fD!=null && fD<=0) items.push({key:p.id+'-fed', plant:p, type:'fed', label:'Feed', icon:'&#x1F9EA;', color:'#10b981'});
    if(pruneApplicable(p)){
      const pD = daysUntilDue(p, careLog, 'pruned');
      if(pD!=null && pD<=0) items.push({key:p.id+'-pruned', plant:p, type:'pruned', label:'Prune', icon:'&#x2702;&#xFE0F;', color:'#d97706'});
    }
  });
  const activePests = (pestLog||[]).filter(e=>!e.resolved);

  const row = (key, icon, color, text, onDone, doneLabel) => {
    const isDone = !!completingKeys[key];
    return (
      <div key={key} className={'checklist-row'+(isDone?' is-done':'')} style={{position:'relative',display:'flex',alignItems:'center',gap:10,padding:'8px 4px',
        borderBottom:'1px solid '+T.border}}>
        <span style={{fontSize:16,flexShrink:0}} dangerouslySetInnerHTML={{__html:icon}}/>
        <span style={{flex:1,fontSize:13,color:T.text,minWidth:0,overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap'}}>{text}</span>
        <button onClick={()=>complete(key,onDone)} disabled={isDone} style={{flexShrink:0,padding:'5px 12px',borderRadius:20,border:'1px solid '+color,
          background:'transparent',color,fontSize:12,fontWeight:600,cursor:isDone?'default':'pointer'}}>
          {doneLabel||'✓ Done'}
        </button>
        {isDone&&(
          <span className="checklist-check-pop" style={{position:'absolute',right:14,top:-4,fontSize:16,color:'#22c55e',pointerEvents:'none'}}>
            &#x2705;
          </span>
        )}
      </div>
    );
  };

  const total = items.length + activePests.length;

  return (
    <div style={{background:T.card,border:'1px solid '+T.border,borderRadius:12,padding:'14px 16px',marginBottom:24}}>
      <div style={{display:'flex',alignItems:'center',justifyContent:'space-between',gap:8,marginBottom:4}}>
        <h3 style={{fontSize:16,fontWeight:700,color:T.text,margin:0}}>&#x2705; Today's Checklist</h3>
        {streak>0&&(
          <span title="Consecutive days you've logged at least one care action"
            style={{fontSize:12,fontWeight:700,color:'#f59e0b',background:'rgba(245,158,11,0.12)',
              padding:'3px 10px',borderRadius:20,whiteSpace:'nowrap'}}>
            &#x1F525; {streak} day{streak>1?'s':''}
          </span>
        )}
      </div>
      {total===0?(
        <p style={{color:T.sub,fontSize:13,margin:'8px 0 0'}}>&#x1F389; All caught up for today.</p>
      ):(
        <div style={{marginTop:8}}>
          {items.map(it=>row(it.key, it.icon, it.color,
            <button onClick={()=>onSelect(it.plant)} style={{background:'none',border:'none',color:'inherit',
              font:'inherit',cursor:'pointer',padding:0,textAlign:'left'}}>{it.label} — {it.plant.name}</button>,
            ()=>onLog(it.plant.id, it.type)))}
          {activePests.map(e=>{
            const p=allPlants.find(pl=>String(pl.id)===String(e.plantId));
            return row('pest-'+e.id, '&#x1F41B;', '#ef4444',
              <button onClick={()=>p&&onSelect(p)} style={{background:'none',border:'none',color:'inherit',
                font:'inherit',cursor:'pointer',padding:0,textAlign:'left'}}>{e.pest}{p?' — '+p.name:''}</button>,
              ()=>onResolvePest(e.id), '✓ Resolved');
          })}
        </div>
      )}
    </div>
  );
}

export function CareStreak({careLog, allPlants}){
  const T = React.useContext(ThemeCtx);
  const now = Date.now();
  const week = 7*86400000, fortnight=14*86400000;
  const watered  = allPlants.filter(p=>careLog[String(p.id)+'-watered']&&(now-careLog[String(p.id)+'-watered'])<week).length;
  const fed      = allPlants.filter(p=>careLog[String(p.id)+'-fed']    &&(now-careLog[String(p.id)+'-fed'])<fortnight).length;
  const overdue  = allPlants.filter(p=>getUrgency(p,careLog,'watered').level==='overdue').length;
  const total = allPlants.length;
  const pct = Math.round(watered/total*100);
  const stats = [
    {val:watered, of:total, label:'watered this week',   color:'#3b82f6', icon:'&#x1F4A7;'},
    {val:fed,     of:total, label:'fed this fortnight',  color:'#10b981', icon:'&#x1F9EA;'},
    {val:overdue, of:total, label:'need water now',      color:'#ef4444', icon:'&#x26A0;'},
  ];
  return (
    <div style={{display:'grid',gridTemplateColumns:'repeat(auto-fit,minmax(160px,1fr))',gap:12,marginBottom:24}}>
      {stats.map((s,i)=>(
        <div key={i} style={{background:T.card,border:'1px solid '+T.border,borderRadius:12,padding:'14px 16px'}}>
          <div style={{display:'flex',justifyContent:'space-between',alignItems:'flex-start',marginBottom:8}}>
            <span style={{fontSize:22}} dangerouslySetInnerHTML={{__html:s.icon}}/>
            <span style={{fontSize:26,fontWeight:700,color:s.color}}>{s.val}</span>
          </div>
          <div style={{fontSize:12,color:T.sub}}>{s.label}</div>
          <div style={{marginTop:8,height:4,background:T.surface,borderRadius:2,overflow:'hidden'}}>
            <div style={{height:'100%',background:s.color,width:(s.val/s.of*100)+'%',borderRadius:2,transition:'width 0.5s'}}/>
          </div>
        </div>
      ))}
    </div>
  );
}

export function SowingCalendar({allPlants}){
  const T = React.useContext(ThemeCtx);
  const [filter,setFilter] = React.useState('all');
  const [expanded,setExpanded] = React.useState(false);
  const now = new Date().getMonth();
  const plants = allPlants.filter(p=>p.sow && (filter==='all'||plantCategory(p)===filter));
  const typeColor = {outdoor:'#4a7c3f',indoor:'#1e40af',hydro:'#d97706'};
  if(!expanded){
    return (
      <button onClick={()=>setExpanded(true)} style={{
        display:'flex',alignItems:'center',gap:8,width:'100%',textAlign:'left',
        padding:'12px 16px',borderRadius:10,border:'1px solid '+T.border,
        background:T.card,color:T.text,cursor:'pointer',fontSize:13}}>
        <span>&#x1F4C6;</span>
        <span style={{flex:1}}>Show full-year sowing calendar &mdash; {plants.length} plants with sowing dates</span>
        <span style={{color:T.sub}}>&#x25BE;</span>
      </button>
    );
  }
  return (
    <div>
      <div style={{display:'flex',gap:8,marginBottom:16,flexWrap:'wrap',alignItems:'center'}}>
        {[['all','All'],['outdoor','Outdoor'],['indoor','Indoor'],['hydro','Greenhouse']].map(([k,l])=>(
          <button key={k} onClick={()=>setFilter(k)} style={{
            padding:'5px 14px',borderRadius:20,border:'1px solid '+T.border,cursor:'pointer',fontSize:12,
            background:filter===k?T.green:T.input,color:filter===k?'#fff':T.text}}>
            {l}
          </button>
        ))}
        <button onClick={()=>setExpanded(false)} style={{
          marginLeft:'auto',padding:'5px 14px',borderRadius:20,border:'1px solid '+T.border,
          cursor:'pointer',fontSize:12,background:T.input,color:T.sub}}>
          &#x25B4; Collapse
        </button>
      </div>
      <div style={{overflowX:'auto'}}>
        <table style={{width:'100%',borderCollapse:'collapse',fontSize:12,minWidth:600}}>
          <thead>
            <tr>
              <th style={{textAlign:'left',padding:'6px 10px',color:T.sub,fontWeight:600,
                borderBottom:'1px solid '+T.border,minWidth:130,position:'sticky',left:0,background:T.bg}}>Plant</th>
              {MO_NAMES.map((mo,i)=>(
                <th key={mo} style={{padding:'6px 4px',color:i===now?T.accent:T.sub,fontWeight:i===now?700:500,
                  textAlign:'center',borderBottom:'1px solid '+T.border,minWidth:36,
                  background:i===now?'rgba(122,184,106,0.08)':T.bg}}>
                  {mo}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {plants.map(p=>{
              const sowMonths = parseSowMonths(p.sow);
              const color = typeColor[plantCategory(p)]||'#4a7c3f';
              return (
                <tr key={p.id} style={{borderBottom:'1px solid '+T.border}}>
                  <td style={{padding:'6px 10px',color:T.text,fontWeight:500,
                    position:'sticky',left:0,background:T.bg,whiteSpace:'nowrap',overflow:'hidden',
                    textOverflow:'ellipsis',maxWidth:150}}>
                    <span style={{display:'inline-block',width:8,height:8,borderRadius:'50%',
                      background:color,marginRight:6,verticalAlign:'middle'}}/>
                    {p.name}
                  </td>
                  {MO_NAMES.map((_,i)=>(
                    <td key={i} style={{padding:'4px',textAlign:'center',
                      background:i===now?'rgba(122,184,106,0.05)':T.bg}}>
                      {sowMonths.includes(i)&&(
                        <div style={{width:22,height:22,borderRadius:'50%',background:color,
                          margin:'0 auto',opacity:0.85}}/>
                      )}
                    </td>
                  ))}
                </tr>
              );
            })}
          </tbody>
        </table>
        {!plants.length&&<div style={{textAlign:'center',color:T.sub,padding:40}}>No plants match this filter.</div>}
      </div>
      <div style={{display:'flex',gap:16,marginTop:16,flexWrap:'wrap'}}>
        {Object.entries(typeColor).map(([k,c])=>(
          <div key={k} style={{display:'flex',alignItems:'center',gap:6,fontSize:12,color:T.sub}}>
            <div style={{width:12,height:12,borderRadius:'50%',background:c}}/>{k.charAt(0).toUpperCase()+k.slice(1)}
          </div>
        ))}
        <div style={{display:'flex',alignItems:'center',gap:6,fontSize:12,color:T.accent}}>
          <div style={{width:12,height:12,borderRadius:2,background:'rgba(122,184,106,0.3)',border:'1px solid '+T.accent}}/>Current month
        </div>
      </div>
    </div>
  );
}

export function DashboardView({allPlants, careLog, onLog, onSelect}){
  const T = React.useContext(ThemeCtx);
  const attention = allPlants.filter(p=>{
    const wU=getUrgency(p,careLog,'watered');
    const fU=getUrgency(p,careLog,'fed');
    const rU=repotApplicable(p)?getUrgency(p,careLog,'repotted'):null;
    return wU.level==='overdue'||fU.level==='overdue'||(rU&&rU.level==='overdue');
  });
  // Recent activity: find most recently logged events
  const activity = [];
  allPlants.forEach(p=>{
    ['watered','fed','repotted'].forEach(type=>{
      const ts=careLog[String(p.id)+'-'+type];
      if(ts) activity.push({plant:p, type, ts});
    });
  });
  activity.sort((a,b)=>b.ts-a.ts);
  const recent = activity.slice(0,8);
  const typeIcon = {watered:'&#x1F4A7;',fed:'&#x1F9EA;',repotted:'&#x1FAB4;'};
  return (
    <div>
      <CareStreak careLog={careLog} allPlants={allPlants}/>
      {attention.length>0&&(
        <div style={{marginBottom:28}}>
          <h3 style={{fontSize:16,fontWeight:700,color:T.text,margin:'0 0 12px',display:'flex',alignItems:'center',gap:8}}>
            <span style={{color:'#ef4444'}}>&#x26A0;</span> Needs Attention <span style={{
              background:'#ef4444',color:'#fff',borderRadius:'50%',width:22,height:22,
              display:'inline-flex',alignItems:'center',justifyContent:'center',fontSize:12}}>{attention.length}</span>
          </h3>
          <div style={{display:'flex',flexDirection:'column',gap:8}}>
            {attention.map(p=>(
              <AttentionCard key={p.id} plant={p} careLog={careLog} onLog={onLog} onSelect={onSelect}/>
            ))}
          </div>
        </div>
      )}
      {!attention.length&&<div style={{textAlign:'center',padding:'32px 0 40px',color:T.sub,fontSize:15}}>
        &#x2705; All plants are up to date &#x2014; great work!
      </div>}
      {recent.length>0&&(
        <div>
          <h3 style={{fontSize:16,fontWeight:700,color:T.text,margin:'0 0 12px'}}>
            &#x1F4CB; Recent Activity
          </h3>
          <div style={{display:'flex',flexDirection:'column',gap:6}}>
            {recent.map((a,i)=>(
              <div key={i} style={{display:'flex',alignItems:'center',gap:12,padding:'8px 12px',
                background:T.card,borderRadius:8,border:'1px solid '+T.border}}>
                <span style={{fontSize:18}} dangerouslySetInnerHTML={{__html:typeIcon[a.type]}}/>
                <div style={{flex:1}}>
                  <span style={{fontWeight:600,color:T.text,fontSize:13}}>{a.plant.name}</span>
                  <span style={{color:T.sub,fontSize:12}}> &mdash; {a.type}</span>
                </div>
                <span style={{color:T.sub,fontSize:12}}>{fmtDate(a.ts)}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

export function WateringCalendarView({allPlants, careLog}){
  const T=React.useContext(ThemeCtx);
  const M=useIsMobile();
  const [span,setSpan]=React.useState(7);
  const DAY=86400000;
  const todayStart=new Date(); todayStart.setHours(0,0,0,0);
  const todayTs=todayStart.getTime();
  const plantDays=allPlants.map(p=>{
    const last=careLog[String(p.id)+'-watered'];
    const freq=parseWaterFreqDays(p.water);
    const offset=last ? Math.round((last+freq*DAY-todayTs)/DAY) : -1;
    return {plant:p,offset};
  });
  const dayRange=Array.from({length:span},(_,i)=>i-2);
  const byDay={};
  dayRange.forEach(d=>{byDay[d]=[];});
  plantDays.forEach(({plant,offset})=>{
    const d=Math.max(dayRange[0],Math.min(offset,dayRange[dayRange.length-1]));
    byDay[d].push({plant,offset});
  });
  const dayLabel=d=>{if(d===0)return 'Today';if(d===-1)return 'Yesterday';if(d===1)return 'Tomorrow';if(d<0)return Math.abs(d)+'d ago';return '+'+d+'d';};
  const dayDate=d=>{const dd=new Date(todayStart);dd.setDate(dd.getDate()+d);return dd.toLocaleDateString('en-GB',{day:'numeric',month:'short'});};
  return (
    <div style={{marginBottom:28}}>
      <div style={{display:'flex',alignItems:'center',gap:8,marginBottom:12,flexWrap:'wrap'}}>
        <h3 style={{fontSize:15,fontWeight:700,color:T.text,margin:0}}>&#x1F4A7; Watering Calendar</h3>
        <div style={{display:'flex',gap:4,marginLeft:'auto'}}>
          {[7,14,30].map(s=>(
            <button key={s} onClick={()=>setSpan(s)} style={{padding:'3px 8px',borderRadius:4,border:'1px solid '+T.border,
              background:span===s?T.green:T.input,color:span===s?'#fff':T.text,fontSize:11,cursor:'pointer'}}>{s}d</button>
          ))}
        </div>
      </div>
      <div style={{display:'flex',gap:5,overflowX:'auto',paddingBottom:8}}>
        {dayRange.map(d=>{
          const items=byDay[d]||[],isToday=d===0,isPast=d<0;
          return (
            <div key={d} style={{minWidth:M?72:86,flexShrink:0,background:isToday?'rgba(74,124,63,0.08)':T.card,
              border:'1px solid '+(isToday?T.green:T.border),borderRadius:8,padding:6,opacity:isPast?0.65:1}}>
              <div style={{fontSize:10,fontWeight:700,color:isToday?T.green:T.sub,textAlign:'center'}}>{dayLabel(d)}</div>
              <div style={{fontSize:9,color:T.sub,textAlign:'center',marginBottom:4}}>{dayDate(d)}</div>
              {!items.length&&<div style={{color:T.sub,fontSize:10,textAlign:'center',padding:'4px 0'}}>—</div>}
              {items.map(({plant,offset})=>(
                <div key={plant.id} style={{padding:'2px 4px',borderRadius:4,marginBottom:2,fontSize:9,
                  background:offset<0?'rgba(239,68,68,0.15)':offset===0?'rgba(234,179,8,0.2)':'rgba(74,124,63,0.15)',
                  color:offset<0?'#ef4444':offset===0?'#d97706':T.text,
                  whiteSpace:'nowrap',overflow:'hidden',textOverflow:'ellipsis',maxWidth:78}}>
                  {plant.name}
                </div>
              ))}
            </div>
          );
        })}
      </div>
      <div style={{display:'flex',gap:12,marginTop:6,fontSize:10,color:T.sub}}>
        <span><span style={{color:'#ef4444'}}>■</span> Overdue</span>
        <span><span style={{color:'#d97706'}}>■</span> Due today</span>
        <span><span style={{color:T.green}}>■</span> Upcoming</span>
      </div>
    </div>
  );
}

export function SeasonalTasksPanel({allPlants}){
  const T=React.useContext(ThemeCtx);
  const MN=['January','February','March','April','May','June','July','August','September','October','November','December'];
  const cur=new Date().getMonth(),nxt=(cur+1)%12;
  const getTasks=mi=>{
    const tasks=[];
    allPlants.forEach(p=>{
      if(parseSowMonths(p.sow||'').includes(mi)) tasks.push({type:'sow',plant:p,text:'Sow / propagate '+p.name,icon:'🌱'});
      if(parseSowMonths(repotSeason(p)).includes(mi)) tasks.push({type:'repot',plant:p,text:'Repot '+p.name,icon:'🪴'});
    });
    if([2,3,4].includes(mi)) tasks.push({type:'tip',text:'Start liquid feed as growth resumes — fortnightly until autumn',icon:'💡'});
    if([5,6,7].includes(mi)) tasks.push({type:'tip',text:'Water more often — check daily in hot spells',icon:'💡'});
    if([8,9].includes(mi)) tasks.push({type:'tip',text:'Reduce feeding; bring tender plants inside before first frost',icon:'💡'});
    if([10,11,0,1].includes(mi)) tasks.push({type:'tip',text:'Water sparingly; check indoor plants for pests in dry heated air',icon:'💡'});
    return tasks;
  };
  const curT=getTasks(cur),nxtT=getTasks(nxt);
  const item=(t,i)=>(
    <div key={i} style={{display:'flex',alignItems:'flex-start',gap:8,padding:'6px 10px',
      background:T.surface,borderRadius:7,border:'1px solid '+T.border,marginBottom:4}}>
      <span style={{fontSize:15,flexShrink:0}}>{t.icon}</span>
      <div style={{flex:1}}>
        <div style={{fontSize:12,color:T.text}}>{t.text}</div>
        {t.plant&&<div style={{fontSize:10,color:T.sub,fontStyle:'italic'}}>{t.plant.latin}</div>}
      </div>
      <span style={{fontSize:10,padding:'1px 6px',borderRadius:20,flexShrink:0,fontWeight:600,
        background:t.type==='sow'?'rgba(74,124,63,0.15)':t.type==='repot'?'rgba(217,119,6,0.15)':'rgba(59,130,246,0.12)',
        color:t.type==='sow'?T.green:t.type==='repot'?'#d97706':'#3b82f6'}}>{t.type}</span>
    </div>
  );
  return (
    <div style={{marginBottom:28}}>
      <h3 style={{fontSize:16,fontWeight:700,color:T.text,margin:'0 0 12px'}}>&#x1F4C5; Seasonal Tasks</h3>
      <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:16}}>
        <div>
          <div style={{fontSize:13,fontWeight:600,color:T.accent,marginBottom:8}}>This month — {MN[cur]}</div>
          {curT.length?curT.map(item):<div style={{color:T.sub,fontSize:12}}>Nothing due this month</div>}
        </div>
        <div>
          <div style={{fontSize:13,fontWeight:600,color:T.sub,marginBottom:8}}>Next month — {MN[nxt]}</div>
          {nxtT.length?nxtT.map(item):<div style={{color:T.sub,fontSize:12}}>Nothing due next month</div>}
        </div>
      </div>
    </div>
  );
}

export function BackupRestorePanel(){
  const T=React.useContext(ThemeCtx);
  const [msg,setMsg]=React.useState(null);
  const fileRef=React.useRef();
  function doExport(){
    const data={};
    const KEYS=['plant-care-log','plant-care-history','plant-notes','plant-harvests','plant-pests','plant-wishlist','plant-notif-last'];
    KEYS.forEach(k=>{const v=localStorage.getItem(k);if(v)data[k]=JSON.parse(v);});
    ['indoor-map','outdoor-map','courtyard-map','greenhouse-map'].forEach(base=>{
      ['',' -bg','-color','-text','-disabled','-czones','-rzones','-zlabels','-zpos'].forEach(suf=>{
        const k=suf?base+suf:base, v=localStorage.getItem(k);
        if(v){try{data[k]=JSON.parse(v);}catch{data[k]=v;}}
      });
    });
    const blob=new Blob([JSON.stringify(data,null,2)],{type:'application/json'});
    const a=document.createElement('a');
    a.href=URL.createObjectURL(blob);
    a.download='marty-plants-'+new Date().toISOString().slice(0,10)+'.json';
    a.click();
    setMsg('✅ Backup downloaded!');
    setTimeout(()=>setMsg(null),3000);
  }
  function doImport(e){
    const file=e.target.files[0];
    if(!file)return;
    const reader=new FileReader();
    reader.onload=ev=>{
      try{
        const data=JSON.parse(ev.target.result);
        let n=0;
        Object.entries(data).forEach(([k,v])=>{localStorage.setItem(k,typeof v==='string'?v:JSON.stringify(v));n++;});
        setMsg('✅ '+n+' items restored — reloading…');
        setTimeout(()=>location.reload(),1500);
      }catch{setMsg('❌ Invalid backup file');}
    };
    reader.readAsText(file);
    e.target.value='';
  }
  return (
    <div style={{marginBottom:28,background:T.card,borderRadius:12,border:'1px solid '+T.border,padding:16}}>
      <h3 style={{fontSize:15,fontWeight:700,color:T.text,margin:'0 0 6px',display:'flex',alignItems:'center',gap:8}}>
        &#x1F4BE; Backup &amp; Restore
      </h3>
      <p style={{color:T.sub,fontSize:12,marginBottom:12}}>Export all care data, map positions and notes to a JSON file you can restore any time.</p>
      <div style={{display:'flex',gap:8,flexWrap:'wrap',alignItems:'center'}}>
        <button onClick={doExport} style={{padding:'7px 14px',background:T.green,color:'#fff',
          border:'none',borderRadius:8,fontSize:13,fontWeight:600,cursor:'pointer'}}>&#x2B07;&#xFE0F; Export</button>
        <button onClick={()=>fileRef.current.click()} style={{padding:'7px 14px',background:T.input,
          color:T.text,border:'1px solid '+T.border,borderRadius:8,fontSize:13,cursor:'pointer'}}>&#x2B06;&#xFE0F; Import</button>
        <input ref={fileRef} type="file" accept=".json" style={{display:'none'}} onChange={doImport}/>
        {msg&&<span style={{color:msg.startsWith('✅')?'#22c55e':'#ef4444',fontSize:13}}>{msg}</span>}
      </div>
    </div>
  );
}
