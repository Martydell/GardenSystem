import React from 'react';
import { ThemeCtx, resizeImageToDataURL } from '../utils.js';

const ORGANS = [['leaf','&#x1F343; Leaf'],['flower','&#x1F33A; Flower'],['fruit','&#x1F345; Fruit'],['bark','&#x1FAB5; Bark'],['other','&#x2753; Other']];
const CATEGORIES = [['outdoor','&#x1F333; Outdoor'],['indoor','&#x1F3E0; Indoor'],['hydro','&#x1F9EA; Hydro'],['produce','&#x1F345; Produce']];

function ResultCard({result, onAddWish, onAddCustomPlant, T}){
  const [wishAdded,setWishAdded]=React.useState(false);
  const [showForm,setShowForm]=React.useState(false);
  const [name,setName]=React.useState(result.commonNames[0]||result.scientificName);
  const [latin,setLatin]=React.useState(result.scientificName);
  const [category,setCategory]=React.useState('outdoor');
  const [added,setAdded]=React.useState(false);

  function addWish(){
    onAddWish(result.commonNames[0]||result.scientificName, result.scientificName,
      `Identified via Pl@ntNet (${result.score}% match)`);
    setWishAdded(true);
  }
  function submitCatalogue(){
    if(!name.trim())return;
    onAddCustomPlant({name:name.trim(),latin:latin.trim(),family:result.family,category});
    setAdded(true);
    setShowForm(false);
  }

  return (
    <div style={{background:T.card,border:'1px solid '+T.border,borderRadius:12,padding:14,marginBottom:12,display:'flex',gap:12}}>
      <div style={{width:64,height:64,borderRadius:8,overflow:'hidden',background:T.surface,flexShrink:0}}>
        {result.image&&<img src={result.image} alt="" loading="lazy" style={{width:'100%',height:'100%',objectFit:'cover'}}/>}
      </div>
      <div style={{flex:1,minWidth:0}}>
        <div style={{display:'flex',alignItems:'center',gap:8,marginBottom:2}}>
          <span style={{fontWeight:700,color:T.text,fontSize:15}}>{result.commonNames[0]||result.scientificName}</span>
          <span style={{fontSize:11,fontWeight:700,color:'#fff',background:result.score>50?T.green:'#f59e0b',
            borderRadius:20,padding:'1px 8px'}}>{result.score}%</span>
        </div>
        <div style={{fontStyle:'italic',color:T.sub,fontSize:13,marginBottom:4}}>{result.scientificName}</div>
        {result.family&&<div style={{fontSize:11,color:T.sub,marginBottom:8}}>{result.family}</div>}
        <div style={{display:'flex',gap:8,flexWrap:'wrap'}}>
          <button onClick={addWish} disabled={wishAdded} style={{
            padding:'5px 12px',borderRadius:20,border:'1px solid '+(wishAdded?'#22c55e':T.border),
            background:wishAdded?'rgba(34,197,94,0.12)':T.input,color:wishAdded?'#22c55e':T.text,
            fontSize:12,cursor:wishAdded?'default':'pointer',fontWeight:600}}
            dangerouslySetInnerHTML={{__html:wishAdded?'&#x2713; Added to Wishlist':'&#x1F331; Add to Wishlist'}}/>
          <button onClick={()=>setShowForm(s=>!s)} disabled={added} style={{
            padding:'5px 12px',borderRadius:20,border:'1px solid '+(added?'#22c55e':T.border),
            background:added?'rgba(34,197,94,0.12)':T.input,color:added?'#22c55e':T.text,
            fontSize:12,cursor:added?'default':'pointer',fontWeight:600}}
            dangerouslySetInnerHTML={{__html:added?'&#x2713; Added to Catalogue':'&#x1F4CB; Add to Catalogue'}}/>
        </div>
        {showForm&&!added&&(
          <div style={{marginTop:10,padding:12,background:T.surface,borderRadius:8}}>
            <input value={name} onChange={e=>setName(e.target.value)} placeholder="Plant name"
              style={{width:'100%',boxSizing:'border-box',background:T.input,border:'1px solid '+T.border,
                borderRadius:6,color:T.text,padding:'6px 10px',fontSize:13,marginBottom:6}}/>
            <input value={latin} onChange={e=>setLatin(e.target.value)} placeholder="Latin name"
              style={{width:'100%',boxSizing:'border-box',background:T.input,border:'1px solid '+T.border,
                borderRadius:6,color:T.text,padding:'6px 10px',fontSize:13,fontStyle:'italic',marginBottom:8}}/>
            <div style={{fontSize:11,color:T.sub,marginBottom:6}}>Category (required)</div>
            <div style={{display:'flex',gap:6,flexWrap:'wrap',marginBottom:10}}>
              {CATEGORIES.map(([key,label])=>(
                <button key={key} onClick={()=>setCategory(key)} style={{
                  padding:'4px 10px',borderRadius:20,border:'1px solid '+(category===key?T.accent:T.border),
                  background:category===key?T.accent:T.input,color:category===key?'#fff':T.text,
                  fontSize:12,cursor:'pointer'}} dangerouslySetInnerHTML={{__html:label}}/>
              ))}
            </div>
            <button onClick={submitCatalogue} disabled={!name.trim()} style={{
              padding:'6px 16px',background:name.trim()?T.green:'#6b7280',color:'#fff',border:'none',
              borderRadius:8,fontSize:12,fontWeight:600,cursor:name.trim()?'pointer':'default'}}>
              Save to Catalogue
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

export function IdentifyView({onAddWish, onAddCustomPlant}){
  const T = React.useContext(ThemeCtx);
  const [organ,setOrgan]=React.useState('leaf');
  const [photo,setPhoto]=React.useState(null);
  const [loading,setLoading]=React.useState(false);
  const [error,setError]=React.useState(null);
  const [results,setResults]=React.useState(null);
  const fileRef=React.useRef(null);

  async function handleFile(e){
    const file=e.target.files&&e.target.files[0];
    e.target.value='';
    if(!file)return;
    const dataUrl=await resizeImageToDataURL(file,1000,0.7);
    setPhoto(dataUrl);
    setResults(null);
    setError(null);
    setLoading(true);
    try{
      const res=await fetch('/.netlify/functions/identify',{
        method:'POST',
        headers:{'Content-Type':'application/json'},
        body:JSON.stringify({image:dataUrl,organ}),
      });
      const data=await res.json();
      if(!res.ok) throw new Error(data.error||'Identification failed.');
      setResults(data.results||[]);
    }catch(err){
      setError(err.message||'Something went wrong.');
    }finally{
      setLoading(false);
    }
  }

  return (
    <div style={{paddingTop:20,maxWidth:600}}>
      <h2 style={{fontSize:20,fontWeight:700,color:T.text,marginBottom:6}}>&#x1F50D; Identify a Plant</h2>
      <p style={{color:T.sub,fontSize:13,lineHeight:1.6,marginBottom:20}}>
        Free plant identification powered by Pl@ntNet. Take or upload a photo — a clear shot of a leaf
        works best, but flowers and fruit help too. Not saved anywhere unless you choose to add it below.
      </p>

      <div style={{fontSize:12,fontWeight:600,color:T.sub,marginBottom:6}}>What's in the photo?</div>
      <div style={{display:'flex',gap:6,flexWrap:'wrap',marginBottom:16}}>
        {ORGANS.map(([key,label])=>(
          <button key={key} onClick={()=>setOrgan(key)} style={{
            padding:'5px 12px',borderRadius:20,border:'1px solid '+(organ===key?T.accent:T.border),
            background:organ===key?T.accent:T.input,color:organ===key?'#fff':T.text,
            fontSize:12,cursor:'pointer'}} dangerouslySetInnerHTML={{__html:label}}/>
        ))}
      </div>

      <input ref={fileRef} type="file" accept="image/*" capture="environment" style={{display:'none'}} onChange={handleFile}/>
      <button onClick={()=>fileRef.current&&fileRef.current.click()} style={{
        padding:'10px 20px',background:T.green,color:'#fff',border:'none',borderRadius:10,
        fontSize:14,fontWeight:600,cursor:'pointer',marginBottom:20}}>
        &#x1F4F7; Take or Upload Photo
      </button>

      {photo&&(
        <div style={{width:160,height:160,borderRadius:10,overflow:'hidden',background:T.surface,marginBottom:16}}>
          <img src={photo} alt="" style={{width:'100%',height:'100%',objectFit:'cover'}}/>
        </div>
      )}

      {loading&&(
        <div style={{display:'flex',alignItems:'center',gap:10,color:T.sub,fontSize:13,marginBottom:16}}>
          <div style={{width:20,height:20,border:'2px solid '+T.borderMid,borderTopColor:T.accent,
            borderRadius:'50%',animation:'spin 0.8s linear infinite'}}/>
          Identifying&hellip;
        </div>
      )}

      {error&&(
        <div style={{background:'rgba(239,68,68,0.1)',border:'1px solid rgba(239,68,68,0.3)',
          borderRadius:8,padding:'10px 14px',color:'#ef4444',fontSize:13,marginBottom:16}}>
          {error}
        </div>
      )}

      {results&&results.length===0&&!error&&(
        <div style={{color:T.sub,fontSize:13}}>No matches found — try a clearer photo or a different part of the plant.</div>
      )}

      {results&&results.length>0&&results.map((r,i)=>(
        <ResultCard key={i} result={r} onAddWish={onAddWish} onAddCustomPlant={onAddCustomPlant} T={T}/>
      ))}
    </div>
  );
}
