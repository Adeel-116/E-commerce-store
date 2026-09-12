"use client";

import { useEffect, useState, type FormEvent } from "react";
import api from "@/lib/axios";
import "@/styles/admin-reviews.css";

type Review = { _id:string; name:string; city:string; text:string; rating:number; screenshot?:string; verified:boolean; active:boolean; order:number };
const empty = { name:"", city:"", text:"", rating:5, verified:true, active:true, order:0 };

export default function AdminReviewsPage(){
  const [reviews,setReviews]=useState<Review[]>([]), [editing,setEditing]=useState<Review|null>(null);
  const [form,setForm]=useState(empty), [key,setKey]=useState(0), [busy,setBusy]=useState(false), [message,setMessage]=useState(""), [error,setError]=useState("");
  const load=()=>api.get("/admin/reviews").then(({data})=>setReviews(data.data));
  useEffect(()=>{load().catch(()=>setError("Reviews could not be loaded."));},[]);
  const reset=()=>{setEditing(null);setForm(empty);setKey(v=>v+1)};
  async function save(e:FormEvent<HTMLFormElement>){e.preventDefault();setBusy(true);setError("");setMessage("");try{const data=new FormData(e.currentTarget);data.set("verified",String(form.verified));data.set("active",String(form.active));const file=data.get("screenshot");if(file instanceof File&&!file.size)data.delete("screenshot");if(editing)await api.put(`/admin/reviews/${editing._id}`,data);else await api.post("/admin/reviews",data);setMessage("Review saved successfully.");reset();await load();}catch{setError("Review could not be saved. Please check the fields and try again.");}finally{setBusy(false)}}
  async function remove(r:Review){if(!confirm(`Delete ${r.name}'s review?`))return;await api.delete(`/admin/reviews/${r._id}`);if(editing?._id===r._id)reset();await load()}
  return <div className="admin-reviews"><h1>Customer Reviews</h1><p className="intro">Add customer review text and an optional screenshot. These appear inside the storefront Our Reviews modal.</p>{message&&<p className="review-admin-message">{message}</p>}{error&&<p className="review-admin-error">{error}</p>}
    <form key={key} className="review-admin-panel" onSubmit={save}><h2>{editing?"Edit review":"Add review"}</h2><div className="review-admin-grid">
      <label>Customer name<input name="name" required maxLength={80} value={form.name} onChange={e=>setForm({...form,name:e.target.value})}/></label>
      <label>City<input name="city" maxLength={80} value={form.city} onChange={e=>setForm({...form,city:e.target.value})} placeholder="Lahore"/></label>
      <label>Rating<select name="rating" value={form.rating} onChange={e=>setForm({...form,rating:Number(e.target.value)})}>{[5,4,3,2,1].map(n=><option key={n}>{n}</option>)}</select></label>
      <label>Display order<input name="order" type="number" min="0" value={form.order} onChange={e=>setForm({...form,order:Number(e.target.value)})}/></label>
      <label className="review-admin-wide">Review text<textarea name="text" required maxLength={800} value={form.text} onChange={e=>setForm({...form,text:e.target.value})}/></label>
      <label>Screenshot {editing?"(optional replacement)":"(optional)"}<input name="screenshot" type="file" accept="image/jpeg,image/png,image/webp,image/avif"/></label>
      <label><span><input type="checkbox" checked={form.verified} onChange={e=>setForm({...form,verified:e.target.checked})}/> Verified customer</span></label>
      <label><span><input type="checkbox" checked={form.active} onChange={e=>setForm({...form,active:e.target.checked})}/> Visible on website</span></label>
    </div><div className="review-admin-actions"><button disabled={busy}>{busy?"Saving…":"Save review"}</button>{editing&&<button type="button" className="secondary" onClick={reset}>Cancel</button>}</div></form>
    <div className="review-admin-list">{reviews.map(r=><article className="review-admin-card" key={r._id}>{r.screenshot&&<img src={r.screenshot} alt=""/>}<div className="review-admin-card-body"><h3>{r.name}</h3><span className={`review-admin-status${r.active?"":" off"}`}>{r.active?"Visible":"Hidden"} · {r.rating}/5</span><p>{r.text}</p><div className="review-admin-actions"><button onClick={()=>{setEditing(r);setForm({name:r.name,city:r.city||"",text:r.text,rating:r.rating,verified:r.verified,active:r.active,order:r.order});setKey(v=>v+1);scrollTo({top:0,behavior:"smooth"})}}>Edit</button><button className="secondary" onClick={()=>remove(r)}>Delete</button></div></div></article>)}</div>
  </div>;
}
