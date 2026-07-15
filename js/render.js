import {state,canEdit,isOwner} from "./store.js";
import {roleBadge} from "./roles.js";
import {attendanceStats,renderSimplePresence} from "./attendance.js";

export function applyPermissions(){
  document.querySelectorAll(".owner-only").forEach(el=>el.classList.toggle("hidden",!isOwner()));
  document.querySelectorAll(".editor-only").forEach(el=>el.classList.toggle("hidden",!canEdit()));
  const label=state.guest?"Visitante":`${state.profile?.name||state.profile?.email} · ${state.profile?.role||""}`;
  document.getElementById("userBadge").textContent=label;
}

export function renderAll(onPresence){
  document.getElementById("kMembers").textContent=state.members.length;
  const present=state.attendance.filter(x=>x.status===1).length;
  const marked=state.attendance.filter(x=>x.status!==0).length;
  document.getElementById("kPresence").textContent=present;
  document.getElementById("kRate").textContent=(marked?Math.round(present/marked*100):0)+"%";
  const rank=state.members.map(m=>({...m,...attendanceStats(m.name)})).sort((a,b)=>b.rate-a.rate||b.present-a.present);
  document.getElementById("kBest").textContent=rank[0]?.name||"—";

  renderSimplePresence("worldbossContent","worldboss",onPresence);
  renderSimplePresence("purgatorioContent","purgatorio",onPresence);
  renderSimplePresence("eventosContent","eventos",onPresence);

  document.getElementById("memberRows").innerHTML=state.members.map(m=>`<tr><td>${m.name}</td><td>${roleBadge(m.role)}</td><td>${m.clan||"—"}</td><td>${canEdit()?`<button class="btn danger" data-delete-member="${m.id}">Excluir</button>`:"Visualização"}</td></tr>`).join("");

  document.getElementById("historyRows").innerHTML=state.attendance.map(a=>`<tr><td>${a.date||"—"}</td><td>${a.kind}</td><td>${a.memberName}</td><td>${a.clan||"—"}</td><td>${roleBadge(a.role)}</td><td>${a.status===1?"Presente":"Ausente"}</td></tr>`).join("");

  document.getElementById("rankingRows").innerHTML=rank.map((r,i)=>`<tr><td>${i+1}</td><td>${r.name}</td><td>${r.clan||"—"}</td><td>${roleBadge(r.role)}</td><td>${r.present}</td><td>${r.rate}%</td></tr>`).join("");

  const pending=state.users.filter(u=>u.role==="member"&&u.status==="pending");
  document.getElementById("requestRows").innerHTML=pending.map(u=>`<tr><td>${u.name}</td><td>${u.email}</td><td><select data-clan="${u.id}"></select></td><td><select data-role="${u.id}"></select></td><td><button class="btn primary" data-approve="${u.id}">Aprovar</button></td></tr>`).join("");

  document.getElementById("staffRows").innerHTML=state.users.filter(u=>u.role==="staff").map(u=>`<tr><td>${u.name}</td><td>${u.email}</td><td>${u.active===false?"Bloqueado":"Ativo"}</td></tr>`).join("");
  document.getElementById("auditRows").innerHTML=state.audit.map(a=>`<tr><td>${a.createdAt?.toDate?a.createdAt.toDate().toLocaleString("pt-BR"):"—"}</td><td>${a.userName||"—"}</td><td>${a.action}</td><td>${a.details||""}</td></tr>`).join("");
}
