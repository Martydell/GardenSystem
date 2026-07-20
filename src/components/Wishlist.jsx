import React from 'react';
import { ThemeCtx, fmtDate } from '../utils.js';

export function WishlistView({wishlist, onAdd, onRemove}){
  const T=React.useContext(ThemeCtx);
  const [name,setName]=React.useState('');
  const [latin,setLatin]=React.useState('');
  const [notes,setNotes]=React.useState('');
  function submit(){if(!name.trim())return;onAdd(name.trim(),latin.trim(),notes.trim());setName('');setLatin('');setNotes('');}
  return (
    <div style={{paddingTop:28}}>
      <h2 style={{fontSize:20,fontWeight:700,color:T.text,marginBottom:6}}>&#x1F331; Plant Wishlist</h2>
      <p style={{color:T.sub,fontSize:13,marginBottom:24}}>Plants you want to find and add to your collection.</p>
      <div style={{background:T.card,borderRadius:12,border:'1px solid '+T.border,padding:16,marginBottom:24}}>
        <div style={{fontSize:13,fontWeight:600,color:T.text,marginBottom:10}}>Add a plant</div>
        <div style={{display:'flex',gap:8,flexWrap:'wrap',marginBottom:8}}>
          <input value={name} onChange={e=>setName(e.target.value)} placeholder="Plant name *"
            style={{flex:'1 1 140px',background:T.input,border:'1px solid '+T.border,borderRadius:6,
              color:T.text,padding:'6px 10px',fontSize:13}}/>
          <input value={latin} onChange={e=>setLatin(e.target.value)} placeholder="Latin name"
            style={{flex:'1 1 140px',background:T.input,border:'1px solid '+T.border,borderRadius:6,
              color:T.text,padding:'6px 10px',fontSize:13,fontStyle:'italic'}}/>
        </div>
        <input value={notes} onChange={e=>setNotes(e.target.value)}
          placeholder="Notes — where you'd put it, size, cost..."
          style={{width:'100%',background:T.input,border:'1px solid '+T.border,borderRadius:6,
            color:T.text,padding:'6px 10px',fontSize:13,marginBottom:10,boxSizing:'border-box'}}/>
        <button onClick={submit} disabled={!name.trim()} style={{
          padding:'7px 16px',background:name.trim()?T.green:'#6b7280',color:'#fff',border:'none',
          borderRadius:8,fontSize:13,fontWeight:600,cursor:name.trim()?'pointer':'default'}}>
          + Add to Wishlist
        </button>
      </div>
      {wishlist.length===0&&(
        <div style={{textAlign:'center',padding:'40px 0',color:T.sub,fontSize:15}}>
          &#x1F331; Your wishlist is empty — add plants you want to find!
        </div>
      )}
      <div style={{display:'flex',flexDirection:'column',gap:8}}>
        {wishlist.map(item=>(
          <div key={item.id} style={{display:'flex',alignItems:'flex-start',gap:12,padding:'12px 14px',
            background:T.card,borderRadius:10,border:'1px solid '+T.border}}>
            <span style={{fontSize:22,flexShrink:0}}>&#x1F331;</span>
            <div style={{flex:1}}>
              <div style={{fontWeight:600,color:T.text,fontSize:14}}>{item.name}</div>
              {item.latin&&<div style={{fontStyle:'italic',color:T.sub,fontSize:12}}>{item.latin}</div>}
              {item.notes&&<div style={{color:T.sub,fontSize:12,marginTop:3}}>{item.notes}</div>}
              <div style={{color:T.sub,fontSize:10,marginTop:3}}>{fmtDate(item.added)}</div>
            </div>
            <button onClick={()=>onRemove(item.id)} style={{background:'none',border:'1px solid '+T.border,
              borderRadius:6,color:T.sub,padding:'4px 8px',cursor:'pointer',fontSize:11,flexShrink:0}}>
              Remove
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}
