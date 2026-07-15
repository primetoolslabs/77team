import {state,canEdit} from "./store.js";
export const DAYS=["SEG","TER","QUA","QUI","SEX","SÁB","DOM"];
export const TYPES={
  worldboss:["10H","12H","20H","22H","00H"],
  purgatorio:["06H","12H","18H","00H"]
};
export const EVENTS=["Guerra de Vale","Defesa de Crista","Evento de Vale","Saque de Castelo"];
export function attendanceStats(name){
  const rows=state.attendance.filter(x=>x.memberName===name);
  const present=rows.filter(x=>x.status===1).length;
  const absent=rows.filter(x=>x.status===-1).length;
  const total=present+absent;
  return {present,absent,total,rate:total?Math.round(present/total*100):0};
}
export function renderSimplePresence(targetId,type,onClick){
  const target=document.getElementById(targetId);
  if(!target)return;
  const slots=type==="eventos"?EVENTS:TYPES[type];
  const head=`<thead><tr><th>Jogador</th>${slots.map(x=>`<th>${x}</th>`).join("")}</tr></thead>`;
  const rows=state.members.map(m=>`<tr><td>${m.name}</td>${slots.map(slot=>{
    const row=state.attendance.find(a=>a.memberId===m.id&&a.kind===type&&a.slot===slot);
    const status=row?.status||0;
    return `<td><button ${canEdit()?"":"disabled"} class="presence-btn ${status===1?"present":status===-1?"absent":""}" data-presence="${type}|${m.id}|${slot}">${status===1?"✓":status===-1?"×":"—"}</button></td>`;
  }).join("")}</tr>`).join("");
  target.innerHTML=`<div class="presence-grid"><table>${head}<tbody>${rows}</tbody></table></div>`;
  target.querySelectorAll("[data-presence]").forEach(btn=>btn.addEventListener("click",()=>onClick(btn.dataset.presence)));
}
