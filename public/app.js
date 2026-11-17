let token = localStorage.getItem("rr_token") || "";
const $ = id => document.getElementById(id);
async function api(path, options={}) {
  const res = await fetch(path,{...options,headers:{"Content-Type":"application/json","Authorization":`Bearer ${token}`,...options.headers}});
  const data = await res.json().catch(()=>({}));
  if(res.status===401){logout();throw new Error(data.error||"Session expired.");}
  if(!res.ok) throw new Error(data.error||`Request failed (${res.status})`);
  return data;
}
function showApp(){ $("login").classList.add("hidden");$("dashboard").classList.remove("hidden");$("logout").classList.remove("hidden"); refresh(); }
function logout(){token="";localStorage.removeItem("rr_token");$("dashboard").classList.add("hidden");$("logout").classList.add("hidden");$("login").classList.remove("hidden");}
$("loginForm").addEventListener("submit",async e=>{e.preventDefault();$("loginError").textContent="";try{const r=await fetch("/api/login",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({password:$("password").value})});const d=await r.json();if(!r.ok)throw new Error(d.error);token=d.token;localStorage.setItem("rr_token",token);showApp();}catch(err){$("loginError").textContent=err.message;}});
$("logout").onclick=logout;
function esc(s){return String(s??"").replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]));}
async function refresh(){
  try{
    const [s,f]=await Promise.all([api("/api/stats"),api(`/api/findings?status=${encodeURIComponent($("filter").value)}&q=${encodeURIComponent($("search").value)}`)]);
    const counts=Object.fromEntries((s.counts||[]).map(x=>[x.status,x.count]));
    $("stats").innerHTML=[["NEW",counts.NEW||0],["APPROVED",counts.APPROVED||0],["IMPLEMENTED",counts.IMPLEMENTED||0],["TOTAL",Object.values(counts).reduce((a,b)=>a+b,0)]].map(([k,v])=>`<div class="stat"><strong>${v}</strong><span>${k==="TOTAL"?"Total findings":k[0]+k.slice(1).toLowerCase()}</span></div>`).join("");
    $("findings").innerHTML=(f.findings||[]).map(x=>`<article class="card"><div class="meta"><span class="tag">${esc(x.category)}</span><span class="tag">${esc(x.status)}</span><span class="tag">Confidence ${x.confidence}%</span><span class="tag">${esc(x.impact)} impact</span><span class="tag">${esc(x.effort)} effort</span></div><h3>${esc(x.title)}</h3><p>${esc(x.summary)}</p><details><summary>Evidence & implementation notes</summary><p>${esc(x.details)}</p><p><b>Risks:</b> ${esc(x.risks||"Not specified")}</p><p><b>Decision note:</b> ${esc(x.decision_note||"None")}</p></details><a href="${esc(x.source_url)}" target="_blank" rel="noopener">Open original source ↗</a><div class="actions">${["APPROVED","REJECTED","DEFERRED","IMPLEMENTED","DUPLICATE","NEW"].map(st=>`<button class="${st==="APPROVED"?"secondary":"ghost"}" data-id="${esc(x.id)}" data-status="${st}">${st[0]+st.slice(1).toLowerCase()}</button>`).join("")}</div></article>`).join("")||`<div class="panel muted">No findings here yet. Use “Research now” or wait for the next scheduled cloud run.</div>`;
    $("runMessage").textContent=s.latestRun?`Last run: ${new Date(s.latestRun.started_at).toLocaleString()} · ${s.latestRun.status} · ${s.latestRun.findings_added} new findings ${s.latestRun.note?"· "+s.latestRun.note:""}`:"No research runs yet.";
    document.querySelectorAll("[data-id]").forEach(b=>b.onclick=async()=>{const note=prompt("Optional decision note (why approved/rejected/deferred):")??"";try{await api("/api/findings/"+encodeURIComponent(b.dataset.id),{method:"PATCH",body:JSON.stringify({status:b.dataset.status,note})});refresh();}catch(e){alert(e.message);}});
  }catch(e){$("runMessage").textContent=e.message;}
}
$("filter").onchange=refresh;let timer; $("search").oninput=()=>{clearTimeout(timer);timer=setTimeout(refresh,250);};
$("run").onclick=async()=>{const b=$("run");b.disabled=true;b.textContent="Researching…";$("runMessage").textContent="Collecting one source and analyzing new items with Groq…";try{const r=await api("/api/run",{method:"POST",body:"{}"});$("runMessage").textContent=`Finished: checked ${r.result.sourcesChecked} source, saw ${r.result.itemsSeen} items, added ${r.result.findingsAdded} findings.`;await refresh();}catch(e){$("runMessage").textContent=e.message;}finally{b.disabled=false;b.textContent="Research now";}};
$("export").onclick=async()=>{try{const d=await api("/api/export");const blob=new Blob([JSON.stringify(d.tasks,null,2)],{type:"application/json"});const a=document.createElement("a");a.href=URL.createObjectURL(blob);a.download="radiant-approved-research-tasks.json";a.click();URL.revokeObjectURL(a.href);}catch(e){alert(e.message);}};
if(token)showApp();