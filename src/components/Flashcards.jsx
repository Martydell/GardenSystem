import React from 'react';
import { INDOOR_PHOTOS, STATIC_PHOTO_URLS } from '../data/plants.js';
import { ThemeCtx, getCustomPhoto, plantCategory, useIsMobile, wikiThumb } from '../utils.js';

const SCOPES = [['all','All'],['outdoor','Outdoor'],['indoor','Indoor'],['hydro','Hydro'],['produce','Produce']];
const MODES = [['name','&#x1F5BC;&#xFE0F; Name it'],['care','&#x1F4A7; Care check']];

function photoFor(p){
  return getCustomPhoto(p.id)||(plantCategory(p)==='indoor'
    ? (INDOOR_PHOTOS[p.id]||STATIC_PHOTO_URLS[p.id])
    : STATIC_PHOTO_URLS[p.id])||null;
}

function loadMisses(){
  try{ return JSON.parse(localStorage.getItem('flashcard-misses')||'{}'); }catch{ return {}; }
}
function saveMisses(m){
  try{ localStorage.setItem('flashcard-misses', JSON.stringify(m)); }catch{}
}

// Weighted shuffle: plants missed more often (or never seen) get more copies before
// shuffling, then we dedupe keeping first occurrence — statistically pushes them
// earlier in the session without literally repeating a card within one pass.
function buildDeck(plants, misses){
  const weighted = [];
  plants.forEach(p=>{
    const w = 1 + Math.min(misses[p.id]||0, 5)*2;
    for(let i=0;i<w;i++) weighted.push(p);
  });
  for(let i=weighted.length-1;i>0;i--){
    const j = Math.floor(Math.random()*(i+1));
    [weighted[i],weighted[j]] = [weighted[j],weighted[i]];
  }
  const seen = new Set(), deck=[];
  weighted.forEach(p=>{ if(!seen.has(p.id)){ seen.add(p.id); deck.push(p); } });
  return deck;
}

export function FlashcardsView({allPlants}){
  const T = React.useContext(ThemeCtx);
  const M = useIsMobile();
  const [scope, setScope] = React.useState('all');
  const [mode, setMode] = React.useState('name');
  const [misses, setMisses] = React.useState(loadMisses);
  const [deck, setDeck] = React.useState(null);
  const [index, setIndex] = React.useState(0);
  const [flipped, setFlipped] = React.useState(false);
  const [correct, setCorrect] = React.useState(0);
  const [seen, setSeen] = React.useState(0);

  const pool = scope==='all' ? allPlants : allPlants.filter(p=>plantCategory(p)===scope);

  function start(){
    setDeck(buildDeck(pool, misses));
    setIndex(0);
    setFlipped(false);
    setCorrect(0);
    setSeen(0);
  }

  function answer(gotIt){
    const p = deck[index];
    const next = {...misses};
    if(!gotIt) next[p.id] = (next[p.id]||0)+1;
    setMisses(next);
    saveMisses(next);
    setSeen(s=>s+1);
    if(gotIt) setCorrect(c=>c+1);
    setFlipped(false);
    setIndex(i=>i+1);
  }

  if(!deck){
    return (
      <div style={{paddingTop:20,maxWidth:600}}>
        <h2 style={{fontSize:20,fontWeight:700,color:T.text,marginBottom:6}}>&#x1F0CF; Flashcards</h2>
        <p style={{color:T.sub,fontSize:13,lineHeight:1.6,marginBottom:20}}>
          Quiz yourself on your own catalogue — photo to name, or name to care facts.
          Cards you miss show up more often.
        </p>
        <div style={{fontSize:12,fontWeight:600,color:T.sub,marginBottom:6}}>Mode</div>
        <div style={{display:'flex',gap:6,flexWrap:'wrap',marginBottom:16}}>
          {MODES.map(([key,label])=>(
            <button key={key} onClick={()=>setMode(key)} style={{
              padding:'6px 14px',borderRadius:20,border:'1px solid '+(mode===key?T.accent:T.border),
              background:mode===key?T.accent:T.input,color:mode===key?'#fff':T.text,
              fontSize:13,cursor:'pointer'}} dangerouslySetInnerHTML={{__html:label}}/>
          ))}
        </div>
        <div style={{fontSize:12,fontWeight:600,color:T.sub,marginBottom:6}}>Scope</div>
        <div style={{display:'flex',gap:6,flexWrap:'wrap',marginBottom:20}}>
          {SCOPES.map(([key,label])=>(
            <button key={key} onClick={()=>setScope(key)} style={{
              padding:'5px 12px',borderRadius:20,border:'1px solid '+(scope===key?T.accent:T.border),
              background:scope===key?T.accent:T.input,color:scope===key?'#fff':T.text,
              fontSize:12,cursor:'pointer'}}>{label}</button>
          ))}
        </div>
        <button onClick={start} disabled={!pool.length} style={{
          padding:'10px 20px',background:pool.length?T.green:'#6b7280',color:'#fff',border:'none',
          borderRadius:10,fontSize:14,fontWeight:600,cursor:pool.length?'pointer':'default'}}>
          &#x25B6;&#xFE0F; Start ({pool.length} plants)
        </button>
      </div>
    );
  }

  if(index>=deck.length){
    return (
      <div style={{paddingTop:20,maxWidth:600,textAlign:'center'}}>
        <h2 style={{fontSize:22,fontWeight:700,color:T.text,marginBottom:10}}>&#x1F389; Session Complete</h2>
        <p style={{fontSize:16,color:T.text,marginBottom:20}}>{correct} / {seen} correct</p>
        <div style={{display:'flex',gap:8,justifyContent:'center'}}>
          <button onClick={start} style={{padding:'10px 20px',background:T.green,color:'#fff',border:'none',
            borderRadius:10,fontSize:14,fontWeight:600,cursor:'pointer'}}>&#x1F504; Study Again</button>
          <button onClick={()=>setDeck(null)} style={{padding:'10px 20px',background:T.input,color:T.text,
            border:'1px solid '+T.border,borderRadius:10,fontSize:14,fontWeight:600,cursor:'pointer'}}>Change Options</button>
        </div>
      </div>
    );
  }

  const p = deck[index];
  const photo = photoFor(p);

  return (
    <div style={{paddingTop:20,maxWidth:480}}>
      <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:12}}>
        <span style={{fontSize:12,color:T.sub}}>{index+1} / {deck.length}</span>
        <span style={{fontSize:12,color:T.sub}}>{correct} correct so far</span>
      </div>
      <div onClick={()=>setFlipped(f=>!f)} style={{
        background:T.card,border:'1px solid '+T.border,borderRadius:16,padding:24,minHeight:280,
        display:'flex',flexDirection:'column',alignItems:'center',justifyContent:'center',
        cursor:'pointer',textAlign:'center',marginBottom:16}}>
        {mode==='name'?(!flipped?(<>
          <div style={{width:180,height:180,borderRadius:12,overflow:'hidden',background:T.surface,marginBottom:12}}>
            {photo&&<img src={wikiThumb(photo,500)} alt="" style={{width:'100%',height:'100%',objectFit:'cover'}}/>}
          </div>
          <div style={{fontSize:12,color:T.sub}}>Tap to reveal name</div>
        </>):(<>
          <div style={{fontSize:22,fontWeight:700,color:T.text,marginBottom:6}}>{p.name}</div>
          <div style={{fontSize:14,fontStyle:'italic',color:T.sub,marginBottom:4}}>{p.latin}</div>
          <div style={{fontSize:12,color:T.sub}}>{p.family}</div>
        </>)):(!flipped?(<>
          <div style={{fontSize:22,fontWeight:700,color:T.text,marginBottom:6}}>{p.name}</div>
          <div style={{fontSize:14,fontStyle:'italic',color:T.sub,marginBottom:12}}>{p.latin}</div>
          <div style={{fontSize:12,color:T.sub}}>Tap to reveal care facts</div>
        </>):(<div style={{textAlign:'left',width:'100%'}}>
          {[['&#x1F4A7; Water',p.water],['&#x2600; Light',p.light],['&#x1F321; Temp',p.temp],['&#x1FAB4; Humidity',p.humidity]]
            .filter(([,v])=>v).map(([label,val])=>(
            <div key={label} style={{display:'flex',gap:10,padding:'6px 0',borderBottom:'1px solid '+T.border}}>
              <span style={{minWidth:90,fontSize:12,color:T.sub}} dangerouslySetInnerHTML={{__html:label}}/>
              <span style={{fontSize:13,color:T.text,flex:1}}>{val}</span>
            </div>
          ))}
        </div>))}
      </div>
      {flipped?(
        <div style={{display:'flex',gap:8}}>
          <button onClick={()=>answer(false)} style={{flex:1,padding:'10px 0',background:'transparent',
            border:'1px solid rgba(239,68,68,0.4)',color:'#ef4444',borderRadius:10,fontSize:14,fontWeight:600,cursor:'pointer'}}>
            &#x2717; Missed it
          </button>
          <button onClick={()=>answer(true)} style={{flex:1,padding:'10px 0',background:T.green,
            border:'none',color:'#fff',borderRadius:10,fontSize:14,fontWeight:600,cursor:'pointer'}}>
            &#x2713; Got it
          </button>
        </div>
      ):(
        <div style={{textAlign:'center',color:T.sub,fontSize:12}}>Tap the card to flip</div>
      )}
    </div>
  );
}
