import { firebaseConfig } from "./firebase-config.js";
import {
  initializeApp, deleteApp
} from "https://www.gstatic.com/firebasejs/12.15.0/firebase-app.js";
import {
  getAuth, onAuthStateChanged, signInWithEmailAndPassword,
  createUserWithEmailAndPassword, signOut, sendPasswordResetEmail,
  setPersistence, browserLocalPersistence
} from "https://www.gstatic.com/firebasejs/12.15.0/firebase-auth.js";
import {
  getFirestore, collection, doc, setDoc, addDoc, updateDoc, deleteDoc,
  getDoc, onSnapshot, query, orderBy, serverTimestamp, writeBatch
} from "https://www.gstatic.com/firebasejs/12.15.0/firebase-firestore.js";

const primaryApp=initializeApp(firebaseConfig);
const auth=getAuth(primaryApp);
const db=getFirestore(primaryApp);
await setPersistence(auth,browserLocalPersistence);

const $=s=>document.querySelector(s);
const $$=s=>Array.from(document.querySelectorAll(s));

const CLANS=["77 Team I","77 Team II","亗 DHM黑龙77 亗","DHM 亗 白龙 ②","Projeto X"];
const MEMBER_ROLES=["Membros","PT TIME","PT BOOST","PT CORE"];
const ALL_ROLES=["Staff",...MEMBER_ROLES];
const DAYS=["SEGUNDA","TERÇA","QUARTA","QUINTA","SEXTA","SÁBADO","DOMINGO"];
const TIMES={worldboss:["10H","12H","20H","22H","00H"],purgatorio:["06H","12H","18H","00H"]};
const EVENTS=[
  {id:"guerra-vale",dayIndex:2,day:"QUARTA-FEIRA",name:"Guerra de Vale"},
  {id:"defesa-crista",dayIndex:3,day:"QUINTA-FEIRA",name:"Defesa de Crista"},
  {id:"evento-vale",dayIndex:3,day:"QUINTA-FEIRA",name:"Evento de Vale"},
  {id:"saque-castelo",dayIndex:4,day:"SEXTA-FEIRA",name:"Saque de Castelo"}
];

let currentUser=null;
let userProfile=null;
let guestMode=false;
let members=[];
let attendance=[];
let users=[];
let audit=[];
let unsubscribers=[];
let deferredInstallPrompt=null;
const weeks={
  worldboss:startOfWeek(new Date()),
  purgatorio:startOfWeek(new Date()),
  eventos:startOfWeek(new Date())
};

function startOfWeek(date){
  const result=new Date(date);
  result.setHours(0,0,0,0);
  result.setDate(result.getDate()-((result.getDay()+6)%7));
  return result;
}
function iso(date){return date.toISOString().slice(0,10)}
function formatDate(date){return date.toLocaleDateString("pt-BR",{day:"2-digit",month:"2-digit"})}
function weekDates(start){return DAYS.map((_,i)=>{const d=new Date(start);d.setDate(start.getDate()+i);return d})}
function eventDate(event,start){const d=new Date(start);d.setDate(start.getDate()+event.dayIndex);return d}


function roleClass(role){
  return {
    "Staff":"role-staff",
    "Membro":"role-member",
    "Membros":"role-member",
    "PT TIME":"role-time",
    "PT BOOST":"role-boost",
    "PT CORE":"role-core"
  }[String(role||"")]||"role-default";
}

function applyRoleSelectColor(select){
  if(!select)return;
  select.classList.remove(
    "role-select","role-staff","role-member",
    "role-time","role-boost","role-core","role-default"
  );
  select.classList.add("role-select",roleClass(select.value));
}
window.applyRoleSelectColor=applyRoleSelectColor;

function roleBadge(role){
  const normalized=String(role||"Membros");
  const className={
    "Staff":"role-staff",
    "Membro":"role-member",
    "Membros":"role-member",
    "PT TIME":"role-time",
    "PT BOOST":"role-boost",
    "PT CORE":"role-core"
  }[normalized]||"role-default";
  return `<span class="role-badge ${className}">${escapeHtml(normalized)}</span>`;
}

function escapeHtml(value){
  return String(value??"").replace(/[&<>"']/g,ch=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[ch]));
}
function toast(message){
  const el=$("#toast");
  if(!el)return;
  el.textContent=message;
  el.classList.add("show");
  clearTimeout(toast.timer);
  toast.timer=setTimeout(()=>el.classList.remove("show"),3200);
}
function firebaseMessage(error){
  const code=error?.code||"erro-desconhecido";
  const messages={
    "auth/invalid-credential":"E-mail ou senha incorretos.",
    "auth/email-already-in-use":"Este e-mail já possui uma conta.",
    "auth/weak-password":"Use uma senha com pelo menos 6 caracteres.",
    "auth/invalid-email":"O e-mail informado é inválido.",
    "auth/too-many-requests":"Muitas tentativas. Aguarde e tente novamente.",
    "auth/network-request-failed":"Falha de rede. Verifique sua internet.",
    "permission-denied":"Permissão negada pelo Firestore. Publique o firestore.rules deste pacote.",
    "unavailable":"O Firebase está temporariamente indisponível."
  };
  return messages[code]||`Firebase [${code}]: ${error?.message||"falha inesperada"}`;
}
function isOwner(){return userProfile?.role==="owner"}
function isStaff(){return userProfile?.role==="staff"}
function canEdit(){return isOwner()||isStaff()}
function isMember(){return userProfile?.role==="member"}
function clearSubscriptions(){unsubscribers.forEach(fn=>{try{fn()}catch{}});unsubscribers=[]}

function showLoading(show){
  $("#loading")?.classList.toggle("hidden",!show);
}
function showAuth(){
  showLoading(false);
  $("#app")?.classList.add("hidden");
  $("#authScreen")?.classList.remove("hidden");
}
function showApp(){
  showLoading(false);
  $("#authScreen")?.classList.add("hidden");
  $("#app")?.classList.remove("hidden");
}

function fillSelects(){
  const allClans='<option value="">Todos os clãs</option>'+CLANS.map(c=>`<option>${escapeHtml(c)}</option>`).join("");
  ["worldbossClan","purgatorioClan","eventosClan","historyClan","rankingClan","memberClanFilter"].forEach(id=>{
    const el=$("#"+id);if(el)el.innerHTML=allClans;
  });
  const memberClan=$("#memberClan");
  if(memberClan)memberClan.innerHTML='<option value="">Selecione o clã</option>'+CLANS.map(c=>`<option>${escapeHtml(c)}</option>`).join("");
  const memberRole=$("#memberRole");
  if(memberRole){
    memberRole.innerHTML=ALL_ROLES.map(r=>`<option>${escapeHtml(r)}</option>`).join("");
    applyRoleSelectColor(memberRole);
    memberRole.addEventListener("change",()=>applyRoleSelectColor(memberRole));
  }
}
fillSelects();

async function ownerAlreadyExists(){
  try{return (await getDoc(doc(db,"system","owner"))).exists()}
  catch(error){console.warn("Não foi possível verificar proprietário:",error);return false}
}
ownerAlreadyExists().then(exists=>$("#showBootstrap")?.classList.toggle("hidden",exists));

$("#showSignup").addEventListener("click",()=>$("#signupBox").classList.toggle("hidden"));
$("#showBootstrap").addEventListener("click",()=>$("#bootstrapBox").classList.toggle("hidden"));

$("#guestButton").addEventListener("click",async()=>{
  guestMode=true;
  currentUser=null;
  userProfile={role:"guest",name:"Visitante",active:true,status:"approved"};
  showApp();
  applyPermissions();
  subscribePublicData();
});

$("#loginHeaderButton").addEventListener("click",()=>{
  guestMode=false;
  clearSubscriptions();
  showAuth();
});

$("#loginForm").addEventListener("submit",async event=>{
  event.preventDefault();
  const button=event.submitter;
  if(button)button.disabled=true;
  try{
    await signInWithEmailAndPassword(auth,$("#loginEmail").value.trim(),$("#loginPassword").value);
  }catch(error){toast(firebaseMessage(error))}
  finally{if(button)button.disabled=false}
});

$("#forgotButton").addEventListener("click",async()=>{
  const email=$("#loginEmail").value.trim();
  if(!email)return toast("Digite seu e-mail primeiro.");
  try{await sendPasswordResetEmail(auth,email);toast("E-mail de recuperação enviado.")}
  catch(error){toast(firebaseMessage(error))}
});

$("#signupForm").addEventListener("submit",async event=>{
  event.preventDefault();
  const button=event.submitter;
  if(button){button.disabled=true;button.textContent="Enviando…"}
  let secondaryApp;
  try{
    // Segunda instância: não derruba a sessão do proprietário ou visitante.
    secondaryApp=initializeApp(firebaseConfig,"member-signup-"+Date.now());
    const secondaryAuth=getAuth(secondaryApp);
    const secondaryDb=getFirestore(secondaryApp);
    const name=$("#signupName").value.trim();
    const email=$("#signupEmail").value.trim().toLowerCase();
    const password=$("#signupPassword").value;
    const credential=await createUserWithEmailAndPassword(secondaryAuth,email,password);
    await setDoc(doc(secondaryDb,"users",credential.user.uid),{
      name,email,role:"member",active:false,status:"pending",
      createdAt:serverTimestamp()
    });
    await signOut(secondaryAuth);
    await deleteApp(secondaryApp);
    event.target.reset();
    $("#signupBox").classList.add("hidden");
    toast("Cadastro enviado. Aguarde a aprovação da Staff.");
  }catch(error){
    console.error("Cadastro de membro:",error);
    if(secondaryApp)try{await deleteApp(secondaryApp)}catch{}
    const message=firebaseMessage(error);
    toast(error?.code==="permission-denied"
      ?"A conta foi criada, mas o Firestore bloqueou o perfil. Publique o firestore.rules deste pacote e tente novamente."
      :message);
  }finally{
    if(button){button.disabled=false;button.textContent="Enviar cadastro"}
  }
});

$("#bootstrapForm").addEventListener("submit",async event=>{
  event.preventDefault();
  const button=event.submitter;
  if(button){button.disabled=true;button.textContent="Criando…"}
  try{
    const email=$("#bootstrapEmail").value.trim().toLowerCase();
    const password=$("#bootstrapPassword").value;
    if(!email)throw new Error("Informe o e-mail do proprietário.");
    if(password!==$("#bootstrapConfirm").value)throw new Error("As senhas não conferem.");
    if(await ownerAlreadyExists())throw new Error("O proprietário já foi configurado.");
    const credential=await createUserWithEmailAndPassword(auth,email,password);
    await setDoc(doc(db,"users",credential.user.uid),{
      name:email.split("@")[0]||"Proprietário",email,role:"owner",active:true,status:"approved",
      createdAt:serverTimestamp()
    });
    await setDoc(doc(db,"system","owner"),{
      uid:credential.user.uid,email,createdAt:serverTimestamp()
    });
    toast("Proprietário criado com sucesso.");
    $("#showBootstrap").classList.add("hidden");
  }catch(error){console.error("Primeiro acesso:",error);toast(firebaseMessage(error))}
  finally{if(button){button.disabled=false;button.textContent="Criar proprietário"}}
});

$("#logoutButton").addEventListener("click",async()=>{
  if(guestMode){
    guestMode=false;clearSubscriptions();showAuth();return;
  }
  try{await signOut(auth)}catch(error){toast(firebaseMessage(error))}
});


async function recoverOwnerProfile(firebaseUser){
  if(!firebaseUser)return null;
  const email=(firebaseUser.email||"").toLowerCase();
  const ownerSnapshot=await getDoc(doc(db,"system","owner"));
  if(!ownerSnapshot.exists())return null;
  const ownerData=ownerSnapshot.data();
  if(ownerData.uid!==firebaseUser.uid)return null;
  if(String(ownerData.email||"").toLowerCase()!==email)return null;
  const recovered={
    name:email.split("@")[0]||"Proprietário",
    email,
    role:"owner",
    active:true,
    status:"approved",
    recoveredAt:serverTimestamp()
  };
  await setDoc(doc(db,"users",firebaseUser.uid),recovered,{merge:true});
  return {id:firebaseUser.uid,...recovered};
}

onAuthStateChanged(auth,async firebaseUser=>{
  if(guestMode)return;
  clearSubscriptions();
  currentUser=firebaseUser;
  if(!firebaseUser){
    userProfile=null;
    showAuth();
    return;
  }
  try{
    let profileSnapshot=await getDoc(doc(db,"users",firebaseUser.uid));
    let profile;
    if(!profileSnapshot.exists()){
      profile=await recoverOwnerProfile(firebaseUser);
      if(!profile){
        await signOut(auth);
        return toast("Sua conta ainda não foi aprovada ou não possui perfil no sistema.");
      }
      toast("Perfil de Proprietário recuperado automaticamente.");
    }else{
      profile={id:firebaseUser.uid,...profileSnapshot.data()};
    }
    if(profile.status==="pending"){
      await signOut(auth);
      return toast("Seu cadastro ainda está aguardando aprovação.");
    }
    if(profile.status==="rejected"||profile.active===false){
      await signOut(auth);
      return toast("Sua conta não está autorizada.");
    }
    userProfile=profile;
    showApp();
    applyPermissions();
    subscribeAuthenticatedData();
    await writeAudit("login","Entrou no sistema");
  }catch(error){
    console.error("Leitura do perfil:",error);
    toast(firebaseMessage(error));
    showAuth();
  }
});

function applyPermissions(){
  const owner=isOwner(),editor=canEdit(),guest=guestMode||userProfile?.role==="guest";
  $$(".owner-only").forEach(el=>el.classList.toggle("hidden",!owner));
  $$(".editor-only").forEach(el=>el.classList.toggle("hidden",!editor));
  const accessLabel=guest?"Visitante":owner?"Proprietário":isStaff()?"Staff":"Membro";
  $("#userBadge").textContent=guest?"Visitante":`${userProfile?.name||userProfile?.email} · ${accessLabel}`;
  $("#userBadge").className=`badge ${guest?"role-default":owner||isStaff()?"role-staff":"role-member"}`;
  $("#logoutButton").textContent=guest?"Sair da visualização":"Sair";
  $("#loginHeaderButton").classList.toggle("hidden",!guest);
  $("#logoutButton").classList.toggle("hidden",false);
}

function subscribePublicData(){
  clearSubscriptions();
  unsubscribers.push(onSnapshot(query(collection(db,"members"),orderBy("name")),snapshot=>{
    members=snapshot.docs.map(d=>({id:d.id,...d.data()}));renderAll();
  },handleSnapshotError));
  unsubscribers.push(onSnapshot(query(collection(db,"attendance"),orderBy("date","desc")),snapshot=>{
    attendance=snapshot.docs.map(d=>({id:d.id,...d.data()}));renderAll();
  },handleSnapshotError));
}
function subscribeAuthenticatedData(){
  subscribePublicData();
  if(canEdit()){
    unsubscribers.push(onSnapshot(collection(db,"users"),snapshot=>{
      users=snapshot.docs.map(d=>({id:d.id,...d.data()}));
      renderRequests();renderStaff();renderUserAdmin();
    },handleSnapshotError));
  }
  if(isOwner()){
    unsubscribers.push(onSnapshot(query(collection(db,"audit"),orderBy("createdAt","desc")),snapshot=>{
      audit=snapshot.docs.map(d=>({id:d.id,...d.data()}));renderAudit();
    },handleSnapshotError));
  }
}
function handleSnapshotError(error){console.error("Listener Firebase:",error);toast(firebaseMessage(error))}
async function writeAudit(action,details){
  if(!currentUser||!canEdit())return;
  try{
    await addDoc(collection(db,"audit"),{
      userId:currentUser.uid,userName:userProfile.name||userProfile.email,
      action,details,createdAt:serverTimestamp()
    });
  }catch(error){console.warn("Auditoria não gravada:",error)}
}

function attendanceValue(memberId,kind,date,slot){
  return attendance.find(a=>a.memberId===memberId&&a.kind===kind&&a.date===date&&a.slot===slot)?.status||0;
}
function statsForMember(memberName){
  const list=attendance.filter(a=>a.memberName===memberName);
  const present=list.filter(a=>a.status===1).length;
  const absent=list.filter(a=>a.status===-1).length;
  const total=present+absent;
  return{present,absent,total,rate:total?Math.round(present/total*100):0};
}
function renderAll(){
  renderDashboard();renderPresence("worldboss");renderPresence("purgatorio");
  renderEvents();renderHistory();renderRanking();renderMembers();
}
function renderDashboard(){
  const present=attendance.filter(a=>a.status===1).length;
  const total=attendance.filter(a=>a.status!==0).length;
  $("#kMembers").textContent=members.length;
  $("#kPresence").textContent=present;
  $("#kRate").textContent=(total?Math.round(present/total*100):0)+"%";
  const ranking=members.map(m=>({...m,...statsForMember(m.name)}))
    .filter(x=>x.total).sort((a,b)=>b.rate-a.rate||b.present-a.present);
  $("#kBest").textContent=ranking[0]?.name||"—";
  $("#kBestSub").textContent=ranking[0]?ranking[0].rate+"% de participação":"sem dados";
  $("#clanCards").innerHTML=CLANS.map(clan=>`<article class="card kpi"><small>${escapeHtml(clan)}</small><strong>${members.filter(m=>m.clan===clan).length}</strong><em>membros</em></article>`).join("");
  $("#activitySummary").innerHTML=[
    ["WorldBoss","worldboss"],["Purgatório","purgatorio"],["Eventos","evento"]
  ].map(([label,kind])=>{
    const items=attendance.filter(a=>a.kind===kind);
    const p=items.filter(a=>a.status===1).length;
    const r=items.length?Math.round(p/items.length*100):0;
    return `<div class="rank-row"><span><b>${label}</b><div class="bar"><i style="width:${r}%"></i></div></span><strong>${r}%</strong></div>`;
  }).join("");
  $("#topRanking").innerHTML=ranking.slice(0,6).map((row,index)=>`<div class="rank-row"><span><b>${index+1}º ${escapeHtml(row.name)}</b><small style="display:block;color:var(--muted)">${escapeHtml(row.clan)}</small></span><strong>${row.rate}%</strong></div>`).join("")||'<div class="empty">Ainda não há marcações.</div>';
}
function filteredMembers(kind){
  const search=($("#"+kind+"Search").value||"").toLowerCase();
  const clan=$("#"+kind+"Clan").value;
  return members.filter(m=>(m.name.toLowerCase().includes(search)||(m.clan||"").toLowerCase().includes(search))&&(!clan||m.clan===clan));
}
function renderPresence(kind){
  const dates=weekDates(weeks[kind]);
  const times=TIMES[kind];
  $("#"+kind+"WeekLabel").textContent=`${formatDate(dates[0])} a ${formatDate(dates[6])}`;
  const head=`<thead><tr><th rowspan="2">Jogador</th>${dates.map((date,index)=>`<th colspan="${times.length}" class="day-head">${DAYS[index]}<br><small>${formatDate(date)}</small></th>`).join("")}<th rowspan="2">%</th></tr><tr>${dates.map(()=>times.map(time=>`<th class="time-head">${time}</th>`).join("")).join("")}</tr></thead>`;
  const rows=filteredMembers(kind).map(member=>{
    const values=dates.flatMap(date=>times.map(time=>attendanceValue(member.id,kind,iso(date),time)));
    const present=values.filter(v=>v===1).length;
    const marked=values.filter(v=>v!==0).length;
    const rate=marked?Math.round(present/marked*100):0;
    return `<tr><td class="name-cell">${escapeHtml(member.name)}<small style="display:block;color:var(--muted)">${escapeHtml(member.clan)}</small></td>${dates.map((date,dayIndex)=>times.map(time=>{
      const value=attendanceValue(member.id,kind,iso(date),time);
      const payload=encodeURIComponent(JSON.stringify({memberId:member.id,kind,date:iso(date),slot:time,label:`${DAYS[dayIndex]} ${time}`}));
      return `<td><button class="status ${value===1?"present":value===-1?"absent":""}" data-attendance="${payload}" ${canEdit()?"":"disabled"}>${value===1?"✓":value===-1?"×":"—"}</button></td>`;
    }).join("")).join("")}<td><b>${rate}%</b></td></tr>`;
  }).join("");
  const table=$("#"+kind+"Table");
  table.className="presence-table";
  table.innerHTML=head+`<tbody>${rows||`<tr><td colspan="${dates.length*times.length+2}" class="empty">Nenhum membro encontrado.</td></tr>`}</tbody>`;
}
function renderEvents(){
  const start=weeks.eventos;
  const end=new Date(start);end.setDate(start.getDate()+6);
  $("#eventosWeekLabel").textContent=`${formatDate(start)} a ${formatDate(end)}`;
  const search=($("#eventosSearch").value||"").toLowerCase(),clan=$("#eventosClan").value;
  const list=members.filter(m=>(m.name.toLowerCase().includes(search)||(m.clan||"").toLowerCase().includes(search))&&(!clan||m.clan===clan));
  const head=`<thead><tr><th>Jogador</th>${EVENTS.map(event=>`<th>${event.day}<br><small>${escapeHtml(event.name)} · ${formatDate(eventDate(event,start))}</small></th>`).join("")}<th>%</th></tr></thead>`;
  const rows=list.map(member=>{
    const values=EVENTS.map(event=>attendanceValue(member.id,"evento",iso(eventDate(event,start)),event.id));
    const present=values.filter(v=>v===1).length;
    const marked=values.filter(v=>v!==0).length;
    const rate=marked?Math.round(present/marked*100):0;
    return `<tr><td class="name-cell">${escapeHtml(member.name)}<small style="display:block;color:var(--muted)">${escapeHtml(member.clan)}</small></td>${EVENTS.map(event=>{
      const date=eventDate(event,start);
      const value=attendanceValue(member.id,"evento",iso(date),event.id);
      const payload=encodeURIComponent(JSON.stringify({memberId:member.id,kind:"evento",date:iso(date),slot:event.id,label:event.name}));
      return `<td style="text-align:center"><button class="status ${value===1?"present":value===-1?"absent":""}" data-attendance="${payload}" ${canEdit()?"":"disabled"}>${value===1?"✓":value===-1?"×":"—"}</button></td>`;
    }).join("")}<td><b>${rate}%</b></td></tr>`;
  }).join("");
  $("#eventosTable").innerHTML=head+`<tbody>${rows||'<tr><td colspan="6" class="empty">Nenhum membro encontrado.</td></tr>'}</tbody>`;
}
async function cycleAttendance(payload){
  if(!canEdit())return toast("Somente Proprietário ou Staff pode alterar presenças.");
  const member=members.find(m=>m.id===payload.memberId);
  if(!member)return toast("Membro não encontrado.");
  const id=[payload.kind,member.id,payload.date,payload.slot].join("__").replace(/[^a-zA-Z0-9_-]/g,"_");
  const reference=doc(db,"attendance",id);
  const current=attendanceValue(member.id,payload.kind,payload.date,payload.slot);
  const next=current===0?1:current===1?-1:0;
  try{
    if(next===0){
      await deleteDoc(reference);
      await writeAudit("presença removida",`${member.name} · ${payload.label}`);
    }else{
      await setDoc(reference,{
        memberId:member.id,memberName:member.name,clan:member.clan,role:member.role,
        kind:payload.kind,date:payload.date,slot:payload.slot,label:payload.label,status:next,
        updatedBy:currentUser.uid,updatedByName:userProfile.name||userProfile.email,
        updatedAt:serverTimestamp()
      });
      await writeAudit(next===1?"presença marcada":"falta marcada",`${member.name} · ${payload.label}`);
    }
  }catch(error){console.error("Presença:",error);toast(firebaseMessage(error))}
}
document.addEventListener("click",event=>{
  const button=event.target.closest("[data-attendance]");
  if(!button)return;
  try{cycleAttendance(JSON.parse(decodeURIComponent(button.dataset.attendance)))}
  catch(error){console.error(error);toast("Não foi possível interpretar a marcação.")}
});

function renderHistory(){
  const search=($("#historySearch").value||"").toLowerCase();
  const type=$("#historyType").value,clan=$("#historyClan").value;
  const typeMap={worldboss:"WorldBoss",purgatorio:"Purgatório",evento:"Evento"};
  const rows=attendance.filter(item=>
    (!type||typeMap[item.kind]===type)&&(!clan||item.clan===clan)&&
    (!search||[item.memberName,item.clan,item.role,item.label,item.date,typeMap[item.kind]].some(v=>String(v||"").toLowerCase().includes(search)))
  );
  $("#historyRows").innerHTML=rows.map(item=>`<tr><td>${new Date(item.date+"T12:00:00").toLocaleDateString("pt-BR")}</td><td><span class="tag">${typeMap[item.kind]}</span></td><td>${escapeHtml(item.label)}</td><td>${escapeHtml(item.memberName)}</td><td>${escapeHtml(item.clan)}</td><td>${roleBadge(item.role)}</td><td style="color:${item.status===1?"var(--green)":"var(--red)"}">${item.status===1?"Presente":"Ausente"}</td><td>${escapeHtml(item.updatedByName||"—")}</td></tr>`).join("")||'<tr><td colspan="8" class="empty">Nenhum histórico encontrado.</td></tr>';
}
function renderRanking(){
  const search=($("#rankingSearch").value||"").toLowerCase(),clan=$("#rankingClan").value;
  const rows=members.map(m=>({...m,...statsForMember(m.name)}))
    .filter(row=>row.total&&(row.name.toLowerCase().includes(search)||(row.clan||"").toLowerCase().includes(search))&&(!clan||row.clan===clan))
    .sort((a,b)=>b.rate-a.rate||b.present-a.present);
  $("#rankingRows").innerHTML=rows.map((row,index)=>`<tr><td><b>${index+1}º</b></td><td>${escapeHtml(row.name)}</td><td>${escapeHtml(row.clan)}</td><td>${roleBadge(row.role)}</td><td>${row.present}</td><td>${row.absent}</td><td><b>${row.rate}%</b></td></tr>`).join("")||'<tr><td colspan="7" class="empty">Ainda não há dados suficientes.</td></tr>';
}
function renderMembers(){
  const search=($("#memberSearch").value||"").toLowerCase(),clan=$("#memberClanFilter").value;
  const list=members.filter(m=>(m.name.toLowerCase().includes(search)||(m.clan||"").toLowerCase().includes(search))&&(!clan||m.clan===clan));
  $("#memberRows").innerHTML=list.map((member,index)=>`<tr><td>${index+1}</td><td><b>${escapeHtml(member.name)}</b></td><td>${roleBadge(member.role)}</td><td>${escapeHtml(member.clan)}</td><td>${canEdit()?`<button class="btn" data-edit-member="${member.id}">Editar</button> <button class="btn danger" data-delete-member="${member.id}">Excluir</button>`:"Somente visualização"}</td></tr>`).join("")||'<tr><td colspan="5" class="empty">Nenhum membro encontrado.</td></tr>';
}
$("#memberForm").addEventListener("submit",async event=>{
  event.preventDefault();
  if(!canEdit())return;
  const name=$("#memberName").value.trim(),role=$("#memberRole").value,clan=$("#memberClan").value;
  if(!clan)return toast("Selecione o clã.");
  try{
    await addDoc(collection(db,"members"),{name,role,clan,createdAt:serverTimestamp(),createdBy:currentUser.uid});
    await writeAudit("membro criado",`${name} · ${role} · ${clan}`);
    event.target.reset();
  }catch(error){toast(firebaseMessage(error))}
});
document.addEventListener("click",async event=>{
  const editButton=event.target.closest("[data-edit-member]");
  const deleteButton=event.target.closest("[data-delete-member]");
  if(editButton&&canEdit()){
    const member=members.find(m=>m.id===editButton.dataset.editMember);
    if(!member)return;
    const name=prompt("Nickname:",member.name);if(!name)return;
    const role=prompt("Cargo: "+ALL_ROLES.join(", "),member.role);if(!ALL_ROLES.includes(role))return toast("Cargo inválido.");
    const clan=prompt("Clã: "+CLANS.join(", "),member.clan);if(!CLANS.includes(clan))return toast("Clã inválido.");
    try{
      await updateDoc(doc(db,"members",member.id),{name:name.trim(),role,clan,updatedAt:serverTimestamp()});
      await writeAudit("membro editado",`${member.name} → ${name}`);
    }catch(error){toast(firebaseMessage(error))}
  }
  if(deleteButton&&canEdit()){
    const member=members.find(m=>m.id===deleteButton.dataset.deleteMember);
    if(!member||!confirm(`Excluir ${member.name} e todas as presenças?`))return;
    try{
      const batch=writeBatch(db);
      batch.delete(doc(db,"members",member.id));
      attendance.filter(a=>a.memberId===member.id).forEach(a=>batch.delete(doc(db,"attendance",a.id)));
      await batch.commit();
      await writeAudit("membro excluído",member.name);
    }catch(error){toast(firebaseMessage(error))}
  }
});

function renderRequests(){
  if(!canEdit()||!$("#requestRows"))return;
  const pending=users.filter(u=>u.role==="member"&&u.status==="pending");
  $("#requestRows").innerHTML=pending.map(account=>`<tr>
    <td>${escapeHtml(account.name)}</td>
    <td>${escapeHtml(account.email)}</td>
    <td><select data-request-clan="${account.id}"><option value="">Selecione o clã</option>${CLANS.map(c=>`<option>${escapeHtml(c)}</option>`).join("")}</select></td>
    <td><select class="role-select role-member" data-request-role="${account.id}" onchange="window.applyRoleSelectColor(this)">${MEMBER_ROLES.map(r=>`<option>${escapeHtml(r)}</option>`).join("")}</select></td>
    <td>Pendente</td>
    <td><button class="btn primary" data-approve="${account.id}">Aprovar</button> <button class="btn danger" data-reject="${account.id}">Rejeitar</button></td>
  </tr>`).join("")||'<tr><td colspan="6" class="empty">Nenhuma solicitação pendente.</td></tr>';
}
document.addEventListener("click",async event=>{
  const approveButton=event.target.closest("[data-approve]");
  const rejectButton=event.target.closest("[data-reject]");
  if(approveButton){
    if(!canEdit())return toast("Sem permissão para aprovar.");
    const account=users.find(u=>u.id===approveButton.dataset.approve);
    if(!account)return toast("Solicitação não encontrada.");
    const clan=document.querySelector(`[data-request-clan="${account.id}"]`)?.value||"";
    const role=document.querySelector(`[data-request-role="${account.id}"]`)?.value||"Membros";
    if(!clan)return toast("Selecione o clã antes de aprovar.");
    if(!MEMBER_ROLES.includes(role))return toast("Cargo inválido.");
    approveButton.disabled=true;approveButton.textContent="Aprovando…";
    try{
      const batch=writeBatch(db);
      batch.update(doc(db,"users",account.id),{
        active:true,status:"approved",clan,memberRole:role,
        approvedAt:serverTimestamp(),approvedBy:currentUser.uid
      });
      batch.set(doc(db,"members",account.id),{
        name:account.name||account.email,role,clan,userId:account.id,
        createdAt:serverTimestamp(),createdBy:currentUser.uid
      },{merge:true});
      await batch.commit();
      await writeAudit("cadastro aprovado",`${account.email} · ${clan} · ${role}`);
      toast("Membro aprovado com sucesso.");
    }catch(error){
      console.error("Aprovação:",error);toast(firebaseMessage(error));
      approveButton.disabled=false;approveButton.textContent="Aprovar";
    }
  }
  if(rejectButton){
    if(!canEdit())return toast("Sem permissão para rejeitar.");
    const account=users.find(u=>u.id===rejectButton.dataset.reject);
    if(!account)return toast("Solicitação não encontrada.");
    rejectButton.disabled=true;rejectButton.textContent="Rejeitando…";
    try{
      await updateDoc(doc(db,"users",account.id),{
        active:false,status:"rejected",rejectedAt:serverTimestamp(),rejectedBy:currentUser.uid
      });
      await writeAudit("cadastro rejeitado",account.email);
      toast("Cadastro rejeitado.");
    }catch(error){
      toast(firebaseMessage(error));rejectButton.disabled=false;rejectButton.textContent="Rejeitar";
    }
  }
});

function renderStaff(){
  if(!isOwner()||!$("#staffRows"))return;
  const staffAccounts=users.filter(u=>u.role==="owner"||u.role==="staff");
  $("#staffRows").innerHTML=staffAccounts.map(account=>`<tr><td>${escapeHtml(account.name||"—")}</td><td>${escapeHtml(account.email)}</td><td>${account.role==="owner"?'<span class="role-badge role-staff">Proprietário</span>':roleBadge("Staff")}</td><td>${account.active===false?"Desativado":"Ativo"}</td><td>${account.role==="owner"?"Protegido":`<button class="btn" data-toggle-user="${account.id}">${account.active===false?"Ativar":"Desativar"}</button>`}</td></tr>`).join("");
}
$("#staffForm").addEventListener("submit",async event=>{
  event.preventDefault();
  if(!isOwner())return toast("Somente o proprietário pode criar Staff.");
  const button=event.submitter;if(button){button.disabled=true;button.textContent="Criando…"}
  let secondaryApp;
  try{
    secondaryApp=initializeApp(firebaseConfig,"staff-create-"+Date.now());
    const secondaryAuth=getAuth(secondaryApp);
    const name=$("#staffName").value.trim(),email=$("#staffEmail").value.trim().toLowerCase(),password=$("#staffPassword").value;
    const credential=await createUserWithEmailAndPassword(secondaryAuth,email,password);
    await setDoc(doc(db,"users",credential.user.uid),{
      name,email,role:"staff",active:true,status:"approved",
      createdAt:serverTimestamp(),createdBy:currentUser.uid
    });
    await signOut(secondaryAuth);await deleteApp(secondaryApp);
    await writeAudit("staff criado",`${name} · ${email}`);
    event.target.reset();toast("Staff criado com sucesso.");
  }catch(error){
    if(secondaryApp)try{await deleteApp(secondaryApp)}catch{}
    toast(firebaseMessage(error));
  }finally{if(button){button.disabled=false;button.textContent="Criar Staff"}}
});
document.addEventListener("click",async event=>{
  const button=event.target.closest("[data-toggle-user]");
  if(!button||!isOwner())return;
  const account=users.find(u=>u.id===button.dataset.toggleUser);if(!account)return;
  try{
    await updateDoc(doc(db,"users",account.id),{active:account.active===false,updatedAt:serverTimestamp()});
    await writeAudit("status de Staff alterado",account.email);
  }catch(error){toast(firebaseMessage(error))}
});

function normalizedStatus(account){
  if(account.status)return account.status;
  if(account.active===false)return "blocked";
  return "approved";
}

function renderUserAdmin(){
  if(!isOwner()||!$("#userAdminRows"))return;
  const search=($("#userAdminSearch")?.value||"").toLowerCase();
  const statusFilter=$("#userAdminStatus")?.value||"";
  const list=users.filter(account=>{
    const status=normalizedStatus(account);
    return (!search||[account.name,account.email,account.role,account.clan].some(v=>String(v||"").toLowerCase().includes(search)))
      &&(!statusFilter||status===statusFilter);
  });

  $("#userAdminRows").innerHTML=list.map(account=>{
    const status=normalizedStatus(account);
    const protectedOwner=account.role==="owner";
    return `<tr>
      <td>${escapeHtml(account.name||"—")}</td>
      <td>${escapeHtml(account.email||"—")}</td>
      <td>${account.role==="owner"?'<span class="role-badge role-staff">Proprietário</span>':account.role==="staff"?roleBadge("Staff"):roleBadge(account.memberRole||"Membros")}</td>
      <td>${escapeHtml(status)}</td>
      <td>${escapeHtml(account.clan||"—")}</td>
      <td>${protectedOwner
        ?'<span class="tag">Conta protegida</span>'
        :`<button class="btn" data-admin-action="password" data-user-id="${account.id}">Recuperar senha</button>
           <button class="btn" data-admin-action="${account.active===false?"unblock":"block"}" data-user-id="${account.id}">${account.active===false?"Desbloquear":"Bloquear"}</button>
           <button class="btn" data-admin-action="reset" data-user-id="${account.id}">Redefinir cadastro</button>
           <button class="btn danger" data-admin-action="remove-profile" data-user-id="${account.id}">Remover perfil</button>`}
      </td>
    </tr>`;
  }).join("")||'<tr><td colspan="6" class="empty">Nenhum usuário encontrado.</td></tr>';
}

async function resetUserRegistration(account){
  const batch=writeBatch(db);
  batch.update(doc(db,"users",account.id),{
    active:false,
    status:"pending",
    clan:"",
    memberRole:"",
    resetAt:serverTimestamp(),
    resetBy:currentUser.uid
  });
  batch.delete(doc(db,"members",account.id));
  attendance.filter(item=>item.memberId===account.id).forEach(item=>{
    batch.delete(doc(db,"attendance",item.id));
  });
  await batch.commit();
}

async function removeUserProfile(account){
  const batch=writeBatch(db);
  batch.delete(doc(db,"users",account.id));
  batch.delete(doc(db,"members",account.id));
  attendance.filter(item=>item.memberId===account.id).forEach(item=>{
    batch.delete(doc(db,"attendance",item.id));
  });
  await batch.commit();
}

document.addEventListener("click",async event=>{
  const button=event.target.closest("[data-admin-action]");
  if(!button||!isOwner())return;
  const account=users.find(item=>item.id===button.dataset.userId);
  if(!account)return toast("Usuário não encontrado.");
  if(account.role==="owner")return toast("A conta do Proprietário é protegida.");

  const action=button.dataset.adminAction;
  const oldText=button.textContent;
  button.disabled=true;
  button.textContent="Processando…";

  try{
    if(action==="password"){
      if(!account.email)throw new Error("Este usuário não possui e-mail.");
      await sendPasswordResetEmail(auth,account.email);
      await writeAudit("recuperação de senha enviada",account.email);
      toast("E-mail de recuperação enviado.");
    }

    if(action==="block"){
      await updateDoc(doc(db,"users",account.id),{
        active:false,status:"blocked",blockedAt:serverTimestamp(),blockedBy:currentUser.uid
      });
      await writeAudit("usuário bloqueado",account.email||account.name);
      toast("Usuário bloqueado.");
    }

    if(action==="unblock"){
      await updateDoc(doc(db,"users",account.id),{
        active:true,status:"approved",unblockedAt:serverTimestamp(),unblockedBy:currentUser.uid
      });
      await writeAudit("usuário desbloqueado",account.email||account.name);
      toast("Usuário desbloqueado.");
    }

    if(action==="reset"){
      if(!confirm(`Redefinir o cadastro de ${account.name||account.email}? As presenças e o registro em Membros serão removidos.`))return;
      await resetUserRegistration(account);
      await writeAudit("cadastro redefinido",account.email||account.name);
      toast("Cadastro redefinido. O usuário voltou para solicitações pendentes.");
    }

    if(action==="remove-profile"){
      if(!confirm(`Remover o perfil Firestore de ${account.name||account.email}? A conta Authentication continuará existindo.`))return;
      await removeUserProfile(account);
      await writeAudit("perfil Firestore removido",account.email||account.name);
      toast("Perfil removido. Para reutilizar o mesmo e-mail, exclua também a conta em Authentication → Usuários.");
    }
  }catch(error){
    console.error("Administração de usuário:",error);
    toast(firebaseMessage(error));
  }finally{
    button.disabled=false;
    button.textContent=oldText;
  }
});

$("#userAdminSearch")?.addEventListener("input",renderUserAdmin);
$("#userAdminStatus")?.addEventListener("change",renderUserAdmin);

function renderAudit(){
  if(!isOwner()||!$("#auditRows"))return;
  $("#auditRows").innerHTML=audit.slice(0,500).map(item=>`<tr><td>${item.createdAt?.toDate?item.createdAt.toDate().toLocaleString("pt-BR"):"—"}</td><td>${escapeHtml(item.userName)}</td><td>${escapeHtml(item.action)}</td><td>${escapeHtml(item.details)}</td></tr>`).join("")||'<tr><td colspan="4" class="empty">Nenhuma ação registrada.</td></tr>';
}

["worldboss","purgatorio","eventos"].forEach(kind=>{
  $("#"+kind+"Search").addEventListener("input",()=>kind==="eventos"?renderEvents():renderPresence(kind));
  $("#"+kind+"Clan").addEventListener("change",()=>kind==="eventos"?renderEvents():renderPresence(kind));
});
["historySearch","historyType","historyClan"].forEach(id=>$("#"+id).addEventListener(id==="historySearch"?"input":"change",renderHistory));
["rankingSearch","rankingClan"].forEach(id=>$("#"+id).addEventListener(id==="rankingSearch"?"input":"change",renderRanking));
["memberSearch","memberClanFilter"].forEach(id=>$("#"+id).addEventListener(id==="memberSearch"?"input":"change",renderMembers));
$$("[data-week-change]").forEach(button=>button.addEventListener("click",()=>{
  const kind=button.dataset.kind;
  weeks[kind].setDate(weeks[kind].getDate()+Number(button.dataset.weekChange)*7);
  kind==="eventos"?renderEvents():renderPresence(kind);
}));

$("#exportPdfButton").addEventListener("click",()=>{
  const rows=attendance.map(item=>`<tr><td>${item.date}</td><td>${item.kind}</td><td>${escapeHtml(item.label)}</td><td>${escapeHtml(item.memberName)}</td><td>${escapeHtml(item.clan)}</td><td>${item.status===1?"Presente":"Ausente"}</td></tr>`).join("");
  const popup=window.open("","_blank");
  if(!popup)return toast("O navegador bloqueou a janela do PDF.");
  popup.document.write(`<!doctype html><html><head><meta charset="utf-8"><title>77 TEAM</title><style>body{font-family:Arial;padding:20px}table{width:100%;border-collapse:collapse}th,td{border:1px solid #999;padding:6px;font-size:11px}@page{size:A4 landscape}</style></head><body><h1>77 TEAM — Histórico de Presença</h1><p>Gerado em ${new Date().toLocaleString("pt-BR")}</p><table><thead><tr><th>Data</th><th>Tipo</th><th>Evento/Horário</th><th>Jogador</th><th>Clã</th><th>Status</th></tr></thead><tbody>${rows}</tbody></table><script>window.onload=function(){window.print()}<\/script></body></html>`);
  popup.document.close();
});

window.addEventListener("beforeinstallprompt",event=>{
  event.preventDefault();deferredInstallPrompt=event;$("#installButton").classList.remove("hidden");
});
$("#installButton").addEventListener("click",async()=>{
  if(!deferredInstallPrompt)return toast("Use o menu do navegador e escolha Adicionar à tela inicial.");
  deferredInstallPrompt.prompt();await deferredInstallPrompt.userChoice;
  deferredInstallPrompt=null;$("#installButton").classList.add("hidden");
});
// Service Worker temporariamente desativado para evitar cache de versões antigas.
if ("serviceWorker" in navigator) {
  navigator.serviceWorker.getRegistrations()
    .then(registrations => registrations.forEach(registration => registration.unregister()))
    .catch(() => {});
}
function updateNetwork(){
  const online=navigator.onLine;$("#networkState").textContent=online?"Online":"Offline";
  $("#networkState").style.color=online?"var(--green)":"var(--red)";
}
window.addEventListener("online",updateNetwork);window.addEventListener("offline",updateNetwork);
updateNetwork();
$("#today").textContent=new Intl.DateTimeFormat("pt-BR",{dateStyle:"full"}).format(new Date());

window.addEventListener("unhandledrejection",event=>{
  console.error("Promise não tratada:",event.reason);
  toast(firebaseMessage(event.reason));
});
