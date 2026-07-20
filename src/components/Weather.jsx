import React from 'react';
import { ThemeCtx, getUrgency } from '../utils.js';

export const WMO_ICON=c=>c===0?'☀️':c<=2?'⛅':c===3?'☁️':c<=49?'🌫️':c<=69?'🌧️':c<=79?'🌨️':c<=84?'🌦️':'⛈️';

export const WMO_DESC=c=>c===0?'Clear sky':c===1?'Mainly clear':c===2?'Partly cloudy':c===3?'Overcast':c<=49?'Foggy':c<=69?'Rainy':c<=79?'Snowy':c<=84?'Showers':'Thunderstorm';

export function WeatherWidget(){
  const T=React.useContext(ThemeCtx);
  const [w,setW]=React.useState(null);
  React.useEffect(()=>{
    fetch('https://api.open-meteo.com/v1/forecast?latitude=51.45&longitude=0.05&current=temperature_2m,apparent_temperature,weather_code,relative_humidity_2m,wind_speed_10m&timezone=Europe%2FLondon&wind_speed_unit=mph')
      .then(r=>r.json()).then(d=>{if(d&&d.current)setW(d.current);}).catch(()=>{});
  },[]);
  if(!w) return(
    <div style={{background:T.card,borderRadius:14,padding:'12px 18px',border:'1px solid '+T.border,
      marginBottom:20,fontSize:12,color:T.sub}}>
      Loading London SE weather...
    </div>
  );
  return(
    <div style={{background:T.card,borderRadius:14,padding:'14px 20px',border:'1px solid '+T.border,
      display:'flex',alignItems:'center',gap:20,flexWrap:'wrap',marginBottom:20}}>
      <div>
        <div style={{fontSize:10,color:T.sub,marginBottom:4,textTransform:'uppercase',letterSpacing:.5,fontWeight:600}}>London SE &bull; Live Weather</div>
        <div style={{display:'flex',alignItems:'center',gap:10}}>
          <span style={{fontSize:36,lineHeight:1}}>{WMO_ICON(w.weather_code)}</span>
          <div>
            <div style={{fontSize:30,fontWeight:800,color:T.text,lineHeight:1}}>{Math.round(w.temperature_2m)}&deg;C</div>
            <div style={{fontSize:11,color:T.sub}}>Feels like {Math.round(w.apparent_temperature)}&deg;C &bull; {WMO_DESC(w.weather_code)}</div>
          </div>
        </div>
      </div>
      <div style={{display:'flex',gap:16,flexWrap:'wrap'}}>
        {[
          ['💧',w.relative_humidity_2m+'%','Humidity'],
          ['💨',Math.round(w.wind_speed_10m)+' mph','Wind'],
        ].map(([icon,val,lbl])=>(
          <div key={lbl} style={{textAlign:'center'}}>
            <div style={{fontSize:18,lineHeight:1.2}}>{icon}</div>
            <div style={{fontSize:13,fontWeight:700,color:T.text}}>{val}</div>
            <div style={{fontSize:10,color:T.sub}}>{lbl}</div>
          </div>
        ))}
      </div>
      <div style={{marginLeft:'auto',fontSize:10,color:T.sub,textAlign:'right'}}>
        <div>Updated on page load</div>
        <div>SE London (51.45&deg;N, 0.05&deg;E)</div>
      </div>
    </div>
  );
}

export function NotificationManager({allPlants, careLog}){
  const T=React.useContext(ThemeCtx);
  const [perm,setPerm]=React.useState(typeof Notification!=='undefined'?Notification.permission:'denied');

  function doNotify(){
    if(typeof Notification==='undefined'||Notification.permission!=='granted') return;
    const overdueW=allPlants.filter(p=>getUrgency(p,careLog,'watered').level==='overdue');
    const overdueF=allPlants.filter(p=>getUrgency(p,careLog,'fed').level==='overdue');
    if(overdueW.length){
      new Notification('Plant Watering',{body:overdueW.length+' plant'+(overdueW.length>1?'s':'')+' need water: '+overdueW.slice(0,3).map(p=>p.name).join(', ')+(overdueW.length>3?'...':'')});
    }
    if(overdueF.length){
      new Notification('Plant Feeding',{body:overdueF.length+' plant'+(overdueF.length>1?'s':'')+' need feeding'});
    }
    if(!overdueW.length&&!overdueF.length){
      new Notification('All Good',{body:'No plants are overdue right now.'});
    }
    try{localStorage.setItem('plant-notif-last',String(Date.now()));}catch{}
  }

  React.useEffect(()=>{
    if(perm==='granted'){
      const last=Number(localStorage.getItem('plant-notif-last')||0);
      if(Date.now()-last>3600000) doNotify();
    }
  },[perm]);

  async function enable(){
    if(typeof Notification==='undefined') return;
    const r=await Notification.requestPermission();
    setPerm(r);
  }

  if(typeof Notification==='undefined') return null;
  return (
    <div style={{marginLeft:'auto'}}>
      {perm==='default'&&(
        <button onClick={enable} style={{padding:'5px 12px',background:'#3b82f6',border:'none',
          borderRadius:20,color:'#fff',fontSize:12,cursor:'pointer',fontWeight:600}}>
          &#x1F514; Enable reminders
        </button>
      )}
      {perm==='granted'&&(
        <button onClick={doNotify} style={{padding:'5px 12px',background:T.input,
          border:'1px solid '+T.border,borderRadius:20,color:T.text,fontSize:12,cursor:'pointer'}}>
          &#x1F514; Check now
        </button>
      )}
      {perm==='denied'&&(
        <span style={{fontSize:11,color:T.sub}}>&#x1F514; Notifications blocked</span>
      )}
    </div>
  );
}
