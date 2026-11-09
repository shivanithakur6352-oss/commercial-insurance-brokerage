"use client";
import { useEffect, useState } from "react";

const API = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000/api";
type User = { id: string; name: string; email: string; role: "customer" | "broker" | "admin"; companyName?: string };
type Enquiry = { _id: string; companyName: string; industry: string; insuranceType: string; status: string; createdAt: string; riskAssessment?: string; customer?: {name:string;email:string}; quotation?: {insurer?:string; indicativePremium?:string; coverageLimit?:string; terms?:string} };

export default function Home() {
  const [token, setToken] = useState(""); const [user, setUser] = useState<User|null>(null);
  const [mode, setMode] = useState<"login"|"register">("register");
  const [message, setMessage] = useState(""); const [enquiries, setEnquiries] = useState<Enquiry[]>([]);
  const [summary, setSummary] = useState<Record<string,number>|null>(null);
  const [authForm, setAuthForm] = useState({name:"",email:"",password:"",companyName:"",phone:""});
  const [form, setForm] = useState({companyName:"",industry:"",employeeCount:"1",annualRevenue:"",country:"India",insuranceType:"D&O",coverageNotes:""});
  const [quote, setQuote] = useState<Record<string,{insurer:string;indicativePremium:string;coverageLimit:string;terms:string}>>({});

  async function request(path:string, options:RequestInit={}) {
    const response = await fetch(`${API}${path}`, {...options, headers:{"Content-Type":"application/json", ...(token?{Authorization:`Bearer ${token}`}:{}) ,...(options.headers||{})}});
    const data = await response.json().catch(()=>({message:"Unexpected server response"}));
    if (!response.ok) throw new Error(data.message || "Request failed");
    return data;
  }
  async function loadDashboard(t=token, u=user) {
    if (!t || !u) return;
    try {
      const headers = {Authorization:`Bearer ${t}`};
      if (u.role === "customer") {
        const r = await fetch(`${API}/enquiries/mine`,{headers}); const d=await r.json(); if(r.ok)setEnquiries(d.enquiries||[]);
      } else {
        const [r,s] = await Promise.all([fetch(`${API}/enquiries`,{headers}),fetch(`${API}/dashboard/summary`,{headers})]);
        const d=await r.json(); const sd=await s.json(); if(r.ok)setEnquiries(d.enquiries||[]); if(s.ok)setSummary(sd);
      }
    } catch(e) { setMessage(e instanceof Error?e.message:"Could not load dashboard"); }
  }
  useEffect(()=>{ const saved=localStorage.getItem("coverbridge_token"); const savedUser=localStorage.getItem("coverbridge_user"); if(saved&&savedUser){const u=JSON.parse(savedUser);setToken(saved);setUser(u);loadDashboard(saved,u);} },[]);
  async function authenticate(e:React.FormEvent) {
    e.preventDefault(); setMessage("");
    try {
      const data=await request(`/auth/${mode}`,{method:"POST",body:JSON.stringify(authForm)});
      setToken(data.token);setUser(data.user);localStorage.setItem("coverbridge_token",data.token);localStorage.setItem("coverbridge_user",JSON.stringify(data.user));setMessage("Welcome to CoverBridge.");loadDashboard(data.token,data.user);
    } catch(e) {setMessage(e instanceof Error?e.message:"Authentication failed");}
  }
  async function createEnquiry(e:React.FormEvent) {
    e.preventDefault();setMessage("");
    try { await request("/enquiries",{method:"POST",body:JSON.stringify({...form,employeeCount:Number(form.employeeCount)})});setMessage("Enquiry submitted successfully.");setForm({...form,companyName:"",industry:"",coverageNotes:""});loadDashboard(); }
    catch(e){setMessage(e instanceof Error?e.message:"Could not submit enquiry");}
  }
  async function updateStatus(id:string,status:string) {
    try {await request(`/enquiries/${id}/status`,{method:"PATCH",body:JSON.stringify({status})});loadDashboard();}
    catch(e){setMessage(e instanceof Error?e.message:"Could not update status");}
  }
  async function saveQuote(id:string) {
    try {await request(`/enquiries/${id}/quotation`,{method:"PUT",body:JSON.stringify(quote[id]||{})});setMessage("Quotation saved.");loadDashboard();}
    catch(e){setMessage(e instanceof Error?e.message:"Could not save quotation");}
  }
  function logout(){localStorage.removeItem("coverbridge_token");localStorage.removeItem("coverbridge_user");setToken("");setUser(null);setEnquiries([]);setSummary(null);}
  if(!user) return <main className="authShell"><section className="hero"><span className="eyebrow">B2B COMMERCIAL INSURANCE</span><h1>Clarity for the risks behind your growth.</h1><p>One place for businesses to request D&O, Cyber Liability and Key-Person insurance support from a broker.</p><div className="heroTags"><span>D&O</span><span>Cyber Liability</span><span>Key-Person</span></div></section><form className="panel authPanel" onSubmit={authenticate}><h2>{mode==="register"?"Create business account":"Welcome back"}</h2><p className="muted">Access your commercial insurance workspace.</p>{mode==="register"&&<><label>Full name<input required value={authForm.name} onChange={e=>setAuthForm({...authForm,name:e.target.value})}/></label><label>Company name<input value={authForm.companyName} onChange={e=>setAuthForm({...authForm,companyName:e.target.value})}/></label><label>Phone<input value={authForm.phone} onChange={e=>setAuthForm({...authForm,phone:e.target.value})}/></label></>}<label>Email<input required type="email" value={authForm.email} onChange={e=>setAuthForm({...authForm,email:e.target.value})}/></label><label>Password<input required minLength={8} type="password" value={authForm.password} onChange={e=>setAuthForm({...authForm,password:e.target.value})}/></label><button className="primary">{mode==="register"?"Create account":"Sign in"}</button><button type="button" className="linkButton" onClick={()=>setMode(mode==="register"?"login":"register")}>{mode==="register"?"Already registered? Sign in":"New here? Create account"}</button>{message&&<p className="notice">{message}</p>}</form></main>;
  return <main className="appShell"><header className="topbar"><div className="brand"><span className="brandMark">C</span><span>CoverBridge<small>COMMERCIAL INSURANCE</small></span></div><div className="userArea"><span>{user.name} · {user.role}</span><button className="outline" onClick={logout}>Sign out</button></div></header><section className="welcome"><div><span className="eyebrow">YOUR WORKSPACE</span><h1>{user.role==="customer"?"Business insurance workspace":user.role==="broker"?"Broker operations":"Platform overview"}</h1><p className="muted">{user.companyName||"Manage enquiries, documents and quotations in one place."}</p></div></section>
  {message&&<div className="notice globalNotice">{message}</div>}
  {user.role==="customer"&&<section className="contentGrid"><form className="panel" onSubmit={createEnquiry}><h2>Request insurance support</h2><p className="muted">Share your requirements. A broker will review your enquiry.</p><label>Company name<input required value={form.companyName} onChange={e=>setForm({...form,companyName:e.target.value})}/></label><label>Industry<input required value={form.industry} onChange={e=>setForm({...form,industry:e.target.value})}/></label><div className="twoCol"><label>Employees<input type="number" min="1" value={form.employeeCount} onChange={e=>setForm({...form,employeeCount:e.target.value})}/></label><label>Annual revenue<input placeholder="e.g. ₹5 crore" value={form.annualRevenue} onChange={e=>setForm({...form,annualRevenue:e.target.value})}/></label></div><label>Country<input value={form.country} onChange={e=>setForm({...form,country:e.target.value})}/></label><label>Insurance product<select value={form.insuranceType} onChange={e=>setForm({...form,insuranceType:e.target.value})}><option>D&O</option><option>Cyber Liability</option><option>Key-Person</option></select></label><label>Requirements / context<textarea rows={4} value={form.coverageNotes} onChange={e=>setForm({...form,coverageNotes:e.target.value})}/></label><button className="primary">Submit enquiry</button></form><section className="panel"><h2>My enquiries</h2><p className="muted">Track review progress and quotations.</p><EnquiryList items={enquiries}/></section></section>}
  {user.role!=="customer"&&<><section className="stats">{Object.entries(summary||{}).map(([k,v])=><div className="stat panel" key={k}><span>{k.replace(/[A-Z]/g," $&")}</span><strong>{v}</strong></div>)}</section><section className="panel"><h2>Enquiry pipeline</h2><p className="muted">Review requests and manage broker responses.</p><EnquiryList items={enquiries} broker quote={quote} setQuote={setQuote} updateStatus={updateStatus} saveQuote={saveQuote}/></section></>}
  <footer>CoverBridge MVP · For broker-assisted enquiries only · Not an insurance policy or binding quote</footer></main>;
}

function EnquiryList({
  items,
  broker,
  quote,
  setQuote,
  updateStatus,
  saveQuote
}: {
  items: Enquiry[];
  broker?: boolean;
  quote?: Record<string, {
    insurer: string;
    indicativePremium: string;
    coverageLimit: string;
    terms: string;
  }>;
  setQuote?: (v: Record<string, {
    insurer: string;
    indicativePremium: string;
    coverageLimit: string;
    terms: string;
  }>) => void;
  updateStatus?: (id: string, s: string) => void;
  saveQuote?: (id: string) => void;
}) {
  if (!items.length) {
    return <div className="empty">No enquiries yet.</div>;
  }

  return (
    <div className="enquiryList">
      {items.map(item => (
        <article className="enquiry" key={item._id}>
          <div className="enquiryHead">
            <div>
              <span className="productTag">{item.insuranceType}</span>
              <h3>{item.companyName}</h3>
              <p className="muted">
                {item.industry} · {new Date(item.createdAt).toLocaleDateString()}
              </p>
              {item.customer && (
                <p className="muted">
                  Contact: {item.customer.name} ({item.customer.email})
                </p>
              )}
            </div>
            <span className={`status ${item.status}`}>
              {item.status.replace("_", " ")}
            </span>
          </div>

          {item.riskAssessment && (
            <p className="risk">{item.riskAssessment}</p>
          )}

          {item.quotation?.insurer && (
            <div className="quoteView">
              <b>{item.quotation.insurer}</b>
              {" · "}Indicative premium: {item.quotation.indicativePremium || "Not provided"}
              {" · "}Limit: {item.quotation.coverageLimit || "Not provided"}
              <p>{item.quotation.terms}</p>
            </div>
          )}

          {broker && (
            <div className="brokerTools">
              <label>
                Status
                <select
                  value={item.status}
                  onChange={e => updateStatus?.(item._id, e.target.value)}
                >
                  <option value="submitted">Submitted</option>
                  <option value="under_review">Under review</option>
                  <option value="quote_ready">Quote ready</option>
                  <option value="closed">Closed</option>
                </select>
              </label>

              <div className="quoteFields">
                <input
                  placeholder="Insurer"
                  value={quote?.[item._id]?.insurer || ""}
                  onChange={e => setQuote?.({
                    ...quote,
                    [item._id]: {
                      insurer: "",
                      indicativePremium: "",
                      coverageLimit: "",
                      terms: "",
                      ...quote?.[item._id],
                      insurer: e.target.value
                    }
                  })}
                />

                <input
                  placeholder="Indicative premium"
                  value={quote?.[item._id]?.indicativePremium || ""}
                  onChange={e => setQuote?.({
                    ...quote,
                    [item._id]: {
                      insurer: "",
                      indicativePremium: "",
                      coverageLimit: "",
                      terms: "",
                      ...quote?.[item._id],
                      indicativePremium: e.target.value
                    }
                  })}
                />

                <input
                  placeholder="Coverage limit"
                  value={quote?.[item._id]?.coverageLimit || ""}
                  onChange={e => setQuote?.({
                    ...quote,
                    [item._id]: {
                      insurer: "",
                      indicativePremium: "",
                      coverageLimit: "",
                      terms: "",
                      ...quote?.[item._id],
                      coverageLimit: e.target.value
                    }
                  })}
                />

                <input
                  placeholder="Terms / notes"
                  value={quote?.[item._id]?.terms || ""}
                  onChange={e => setQuote?.({
                    ...quote,
                    [item._id]: {
                      insurer: "",
                      indicativePremium: "",
                      coverageLimit: "",
                      terms: "",
                      ...quote?.[item._id],
                      terms: e.target.value
                    }
                  })}
                />
              </div>

              <button
                className="primary small"
                onClick={() => saveQuote?.(item._id)}
              >
                Save quotation
              </button>
            </div>
          )}
        </article>
      ))}
    </div>
  );
}
