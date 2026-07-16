
function byId(id){return document.getElementById(id)}
function setText(id,value){const el=byId(id);if(el)el.textContent=value??""}
function setHtml(id,value){const el=byId(id);if(el)el.innerHTML=value??""}
function setValue(id,value){const el=byId(id);if(el)el.value=value??""}
function on(id,eventName,handler){const el=byId(id);if(el)el.addEventListener(eventName,handler)}

import {firebaseConfig,FIREBASE_VERSION} from "./firebase-config.js";
const SDK=`https://www.gstatic.com/firebasejs/${FIREBASE_VERSION}`;
const {initializeApp,deleteApp}=await import(`${SDK}/firebase-app.js`);
const {getAuth,onAuthStateChanged,signInWithEmailAndPassword,createUserWithEmailAndPassword,signOut,updatePassword}=await import(`${SDK}/firebase-auth.js`);
const {getFirestore,collection,doc,getDoc,setDoc,addDoc,updateDoc,deleteDoc,onSnapshot,serverTimestamp,writeBatch}=await import(`${SDK}/firebase-firestore.js`);

const app=initializeApp(firebaseConfig);
const auth=getAuth(app);
const db=getFirestore(app);
const $=s=>document.querySelector(s),$$=s=>Array.from(document.querySelectorAll(s));

const CLANS=["77 Team I","77 Team II","亗 DHM黑龙77 亗","DHM 亗 白龙 ②","Projeto X"];
const MEMBER_ROLES=["Membros","PT TIME","PT BOOST","PT CORE"];
const ALL_ROLES=["Staff",...MEMBER_ROLES];
const TYPES={worldboss:["10H","12H","20H","22H","00H"],purgatorio:["06H","12H","18H","00H"],eventos:["Guerra de Vale","Defesa de Crista","Evento de Vale","Saque de Castelo"]};

const state={user:null,profile:null,guest:false,members:[],attendance:[],users:[],audit:[],events:[],notifications:[],settings:{},unsubs:[]};

function toast(msg){const el=$("#toast");el.textContent=msg;el.classList.add("show");clearTimeout(toast.t);toast.t=setTimeout(()=>el.classList.remove("show"),3000)}
function errMsg(e){return ({'auth/invalid-credential':'E-mail ou senha incorretos.','auth/email-already-in-use':'Este e-mail já existe.','auth/weak-password':'A senha precisa ter pelo menos 6 caracteres.','permission-denied':'Permissão negada. Publique o firestore.rules novo.'})[e?.code]||`${e?.code||'erro'}: ${e?.message||'Falha inesperada'}`}
function showOnly(id){["loading","setupScreen","authScreen","app"].forEach(x=>$("#"+x).classList.toggle("hidden",x!==id))}
function owner(){return state.profile?.role==="owner"}function staff(){return state.profile?.role==="staff"}function editor(){return owner()||staff()}

const RESTRICTED_EDITOR_PAGES=new Set(["worldboss","purgatorio","eventos"]);

function canOpenPage(page){
  if(RESTRICTED_EDITOR_PAGES.has(page)||page==="personagens")return editor();
  if(page==="staff"||page==="configuracoes"||page==="auditoria")return owner();
  return true;
}

function openAllowedPage(page){
  if(!canOpenPage(page)){
    toast("Esta área é exclusiva do Proprietário e da Staff.");
    window.TeamManagerUI?.activatePage("dashboard");
    return false;
  }
  window.TeamManagerUI?.activatePage(page);
  return true;
}

function roleBadge(role){const cls={"Staff":"role-staff","Membro":"role-member","Membros":"role-member","PT TIME":"role-time","PT BOOST":"role-boost","PT CORE":"role-core"}[role]||"role-member";return `<span class="role-badge ${cls}">${role||"Membros"}</span>`}
function clearSubs(){state.unsubs.forEach(fn=>{try{fn()}catch{}});state.unsubs=[]}
async function ownerExists(){try{return (await getDoc(doc(db,"system","owner"))).exists()}catch(e){console.error(e);return false}}

function fillSelects(){
  $("#memberRole").innerHTML=ALL_ROLES.map(x=>`<option>${x}</option>`).join("");
  $("#memberClan").innerHTML='<option value="">Selecione o clã</option>'+CLANS.map(x=>`<option>${x}</option>`).join("");
}
fillSelects();

async function decideInitialScreen(){
  const exists=await ownerExists();
  showOnly(exists?"authScreen":"setupScreen");
}
decideInitialScreen();

$("#setupForm").onsubmit=async e=>{
  e.preventDefault();
  try{
    if(await ownerExists())throw new Error("O proprietário já foi configurado.");
    const name=$("#setupName").value.trim();
    const email=$("#setupEmail").value.trim().toLowerCase();
    const password=$("#setupPassword").value;
    if(password!==$("#setupConfirm").value)throw new Error("As senhas não conferem.");
    const cred=await createUserWithEmailAndPassword(auth,email,password);
    await setDoc(doc(db,"users",cred.user.uid),{name,email,role:"owner",active:true,status:"approved",createdAt:serverTimestamp()});
    await setDoc(doc(db,"system","owner"),{uid:cred.user.uid,email,createdAt:serverTimestamp()});
    toast("Sistema configurado com sucesso.");
  }catch(e){toast(errMsg(e))}
};

$("#loginForm").onsubmit=async e=>{e.preventDefault();try{await signInWithEmailAndPassword(auth,$("#loginEmail").value.trim(),$("#loginPassword").value)}catch(e2){toast(errMsg(e2))}};
$("#toggleSignup").onclick=()=>$("#signupBox").classList.toggle("hidden");
$("#guestButton").onclick=()=>{state.guest=true;state.profile={role:"guest",name:"Visitante"};showOnly("app");applyPermissions();subscribePublic()};

$("#signupForm").onsubmit=async e=>{
  e.preventDefault();
  let secondary;
  try{
    secondary=initializeApp(firebaseConfig,"signup-"+Date.now());
    const sa=getAuth(secondary),sd=getFirestore(secondary);
    const name=$("#signupName").value.trim(),email=$("#signupEmail").value.trim().toLowerCase(),password=$("#signupPassword").value;
    const cred=await createUserWithEmailAndPassword(sa,email,password);
    await setDoc(doc(sd,"users",cred.user.uid),{name,email,role:"member",active:false,status:"pending",createdAt:serverTimestamp()});
    await signOut(sa);await deleteApp(secondary);e.target.reset();toast("Cadastro enviado.");
  }catch(e2){if(secondary)try{await deleteApp(secondary)}catch{};toast(errMsg(e2))}
};

$("#sidebarLogout").onclick=()=>$("#logoutButton").click();
$("#logoutButton").onclick=async()=>{clearSubs();if(state.guest){state.guest=false;showOnly("authScreen")}else await signOut(auth)};

onAuthStateChanged(auth,async user=>{
  if(state.guest)return;
  state.user=user;
  if(!user){if(await ownerExists())showOnly("authScreen");return}
  try{
    const snap=await getDoc(doc(db,"users",user.uid));
    if(!snap.exists()){await signOut(auth);return toast("Perfil não encontrado.");}
    state.profile={id:user.uid,...snap.data()};
    if(state.profile.active===false||state.profile.status==="pending"){await signOut(auth);return toast("Conta ainda não aprovada.");}
    showOnly("app");applyPermissions();subscribeAll();
  }catch(e){toast(errMsg(e));showOnly("authScreen")}
});

function applyPermissions(){
  $$(".owner-only").forEach(el=>el.classList.toggle("hidden",!owner()));
  $$(".editor-only").forEach(el=>el.classList.toggle("hidden",!editor()));

  const displayName=state.guest
    ?"Visitante"
    :(state.profile?.name||state.profile?.email||"Usuário");

  const roleLabel=state.guest
    ?"Somente visualização"
    :state.profile?.role==="owner"
      ?"Proprietário"
      :state.profile?.role==="staff"
        ?"Staff"
        :"Membro";

  setText("welcomeName",displayName);
  setText("topbarUserName",displayName);
  setText("userBadge",roleLabel);
  setText("sidebarUserName",displayName);
  setText("sidebarUserRole",roleLabel);
  const currentActivePage=document.querySelector(".page.active")?.id;
  if(currentActivePage&&!canOpenPage(currentActivePage)){
    window.TeamManagerUI?.activatePage("dashboard");
  }
  const avatarData=state.profile?.avatarDataUrl||"";
  document.querySelectorAll(".profile-logo-wrap img").forEach(image=>{
    if(avatarData){
      image.src=avatarData;
      image.style.objectFit="cover";
    }
  });
}

function subscribePublic(){
  clearSubs();
  state.unsubs.push(onSnapshot(collection(db,"members"),s=>{state.members=s.docs.map(d=>({id:d.id,...d.data()}));render()}));
  state.unsubs.push(onSnapshot(collection(db,"attendance"),s=>{state.attendance=s.docs.map(d=>({id:d.id,...d.data()}));render()}));
}
function subscribeAll(){
  subscribePublic();
  if(editor())state.unsubs.push(onSnapshot(collection(db,"users"),s=>{state.users=s.docs.map(d=>({id:d.id,...d.data()}));render()}));
  if(owner())state.unsubs.push(onSnapshot(collection(db,"audit"),s=>{state.audit=s.docs.map(d=>({id:d.id,...d.data()}));render()}));
  state.unsubs.push(onSnapshot(collection(db,"events"),s=>{state.events=s.docs.map(d=>({id:d.id,...d.data()}));render()}));
  if(state.user)state.unsubs.push(onSnapshot(collection(db,"notifications"),s=>{state.notifications=s.docs.map(d=>({id:d.id,...d.data()})).filter(n=>!n.userId||n.userId===state.user.uid);render()}));
  state.unsubs.push(onSnapshot(doc(db,"settings","app"),s=>{state.settings=s.exists()?s.data():{};if(state.settings.themeColor)document.documentElement.style.setProperty("--v31-purple",state.settings.themeColor);render()}));
}
async function audit(action,details){if(!state.user||!editor())return;try{await addDoc(collection(db,"audit"),{userId:state.user.uid,userName:state.profile.name,action,details,createdAt:serverTimestamp()})}catch{}}

function stats(name){const rows=state.attendance.filter(x=>x.memberName===name),p=rows.filter(x=>x.status===1).length,a=rows.filter(x=>x.status===-1).length,t=p+a;return{present:p,absent:a,rate:t?Math.round(p/t*100):0}}
function renderPresence(targetId,kind){
  const target=$("#"+targetId),slots=TYPES[kind];
  target.innerHTML=`<div class="presence-grid"><table><thead><tr><th>Jogador</th>${slots.map(x=>`<th>${x}</th>`).join("")}</tr></thead><tbody>${state.members.map(m=>`<tr><td>${m.name}</td>${slots.map(slot=>{const row=state.attendance.find(a=>a.memberId===m.id&&a.kind===kind&&a.slot===slot),status=row?.status||0;return `<td><button ${editor()?"":"disabled"} class="presence-btn ${status===1?"present":status===-1?"absent":""}" data-presence="${kind}|${m.id}|${slot}">${status===1?"✓":status===-1?"×":"—"}</button></td>`}).join("")}</tr>`).join("")}</tbody></table></div>`;
}

function memberLevel(present){return Math.max(1,Math.floor((present||0)/10)+1)}
function memberMedals(member){
  const s=stats(member.name);
  const medals=[];
  if(s.present>=10)medals.push("🥉");
  if(s.present>=30)medals.push("🥈");
  if(s.present>=60)medals.push("🥇");
  if(s.rate===100&&s.present>=5)medals.push("🔥");
  if(member.role==="Staff")medals.push("👑");
  return medals;
}
function openMemberDrawer(member){
  const s=stats(member.name),level=memberLevel(s.present),medals=memberMedals(member);
  $("#memberDrawerContent").innerHTML=`<div class="profile-hero">
    <div class="profile-big-avatar">${(member.name||"?").slice(0,1).toUpperCase()}</div>
    <h2>${member.name}</h2>${roleBadge(member.role)}<p>${member.clan||"Sem clã"}</p>
  </div>
  <div class="profile-level"><span>Nível ${level}</span><div><i style="width:${(s.present%10)*10}%"></i></div></div>
  <div class="profile-stats">
    <div><strong>${s.present}</strong><span>Presenças</span></div>
    <div><strong>${s.absent}</strong><span>Ausências</span></div>
    <div><strong>${s.rate}%</strong><span>Taxa</span></div>
  </div>
  <div class="medal-list"><h3>Medalhas</h3>${medals.length?medals.map(x=>`<span>${x}</span>`).join(""):"<p>Nenhuma medalha ainda.</p>"}</div>`;
  $("#memberDrawer").classList.remove("hidden");
}
function renderNotifications(){
  setText("notificationCount",state.notifications.filter(n=>!n.read).length);
  $("#notificationRows").innerHTML=state.notifications.map(n=>`<article class="notification-item ${n.read?"":"unread"}">
    <strong>${n.title||"Notificação"}</strong><p>${n.message||""}</p><small>${n.createdAt?.toDate?n.createdAt.toDate().toLocaleString("pt-BR"):""}</small>
  </article>`).join("")||"<p class='empty-state'>Nenhuma notificação.</p>";
}
function renderCalendar(){
  const today=new Date(),year=today.getFullYear(),month=today.getMonth();
  const first=new Date(year,month,1),days=new Date(year,month+1,0).getDate();
  const cells=[];
  for(let i=0;i<first.getDay();i++)cells.push('<div class="calendar-day empty"></div>');
  for(let d=1;d<=days;d++){
    const iso=`${year}-${String(month+1).padStart(2,"0")}-${String(d).padStart(2,"0")}`;
    const evs=state.events.filter(e=>e.date===iso);
    cells.push(`<div class="calendar-day ${iso===new Date().toISOString().slice(0,10)?"today":""}">
      <strong>${d}</strong>${evs.map(e=>`<span class="calendar-event">${e.title}</span>`).join("")}
    </div>`);
  }
  $("#calendarGrid").innerHTML=`<div class="calendar-week">DOM</div><div class="calendar-week">SEG</div><div class="calendar-week">TER</div><div class="calendar-week">QUA</div><div class="calendar-week">QUI</div><div class="calendar-week">SEX</div><div class="calendar-week">SÁB</div>${cells.join("")}`;
}
function renderStatistics(){
  const present=state.attendance.filter(a=>a.status===1).length;
  const absent=state.attendance.filter(a=>a.status===-1).length;
  const total=present+absent;
  setText("statsPresenceTotal",present);
  setText("statsAbsenceTotal",absent);
  setText("statsGeneralRate",(total?Math.round(present/total*100):0)+"%");
  setText("statsActiveMembers",state.members.length);
  const kinds=["worldboss","purgatorio","eventos"];
  $("#typeStats").innerHTML=kinds.map(k=>{
    const rows=state.attendance.filter(a=>a.kind===k),p=rows.filter(a=>a.status===1).length,t=rows.filter(a=>a.status!==0).length,r=t?Math.round(p/t*100):0;
    return `<div class="chart-row"><span>${k}</span><div><i style="width:${r}%"></i></div><strong>${r}%</strong></div>`;
  }).join("");
  const months={};
  state.attendance.filter(a=>a.status===1).forEach(a=>{const m=String(a.date||"").slice(0,7)||"sem data";months[m]=(months[m]||0)+1});
  const max=Math.max(1,...Object.values(months));
  $("#monthlyStats").innerHTML=Object.entries(months).sort().slice(-6).map(([m,v])=>`<div class="chart-row"><span>${m}</span><div><i style="width:${Math.round(v/max*100)}%"></i></div><strong>${v}</strong></div>`).join("")||"<p>Sem dados.</p>";
  $("#performanceRows").innerHTML=state.members.map(m=>{const s=stats(m.name),level=memberLevel(s.present),medals=memberMedals(m);return `<tr><td><button class="member-link" data-view-member="${m.id}">${m.name}</button></td><td>Lv ${level}</td><td>${medals.join(" ")||"—"}</td><td>${s.present}</td><td>${s.absent}</td><td>${s.rate}%</td></tr>`}).join("");
}


function pdfSafe(value){
  return String(value ?? "—")
    .replace(/[–—]/g, "-")
    .replace(/[^\x20-\x7EÀ-ÿ]/g, "");
}

function formatHistoryDate(value){
  if(!value)return "—";
  const match=String(value).match(/^(\d{4})-(\d{2})-(\d{2})$/);
  return match?`${match[3]}/${match[2]}/${match[1]}`:String(value);
}

function historyPdfRows(memberId=""){
  const selected=memberId
    ? state.members.find(member=>member.id===memberId)
    : null;

  return state.attendance
    .filter(item=>item.status!==0)
    .filter(item=>!selected||item.memberId===selected.id||item.memberName===selected.name)
    .sort((a,b)=>String(b.date||"").localeCompare(String(a.date||"")))
    .map(item=>[
      formatHistoryDate(item.date),
      pdfSafe(item.kind),
      pdfSafe(item.slot||"—"),
      pdfSafe(item.memberName),
      pdfSafe(item.clan),
      pdfSafe(item.role),
      item.status===1?"Presente":"Ausente"
    ]);
}

function escapePrintHtml(value){
  return String(value??"—")
    .replace(/&/g,"&amp;")
    .replace(/</g,"&lt;")
    .replace(/>/g,"&gt;")
    .replace(/"/g,"&quot;")
    .replace(/'/g,"&#039;");
}

function createHistoryPdf({memberId="",fileName,title}){
  const rows=historyPdfRows(memberId);
  if(!rows.length){
    toast("Não existem registros para gerar este PDF.");
    return;
  }

  const selected=memberId
    ? state.members.find(member=>member.id===memberId)
    : null;

  const popup=window.open("","_blank");
  if(!popup){
    toast("O navegador bloqueou a janela. Permita pop-ups para gerar o PDF.");
    return;
  }

  const memberInfo=selected
    ? `<div class="member-info">
        <strong>Membro:</strong> ${escapePrintHtml(selected.name)}
        &nbsp; | &nbsp;
        <strong>Cargo:</strong> ${escapePrintHtml(selected.role)}
        &nbsp; | &nbsp;
        <strong>Clã:</strong> ${escapePrintHtml(selected.clan)}
      </div>`
    : "";

  const bodyRows=rows.map(row=>`
    <tr>${row.map(cell=>`<td>${escapePrintHtml(cell)}</td>`).join("")}</tr>
  `).join("");

  const generatedAt=new Date().toLocaleString("pt-BR");

  if(!popup||!popup.document){toast("Permita pop-ups para gerar o PDF.");return;}
  popup.document.open();
  popup.document.write(`<!doctype html>
<html lang="pt-BR">
<head>
<meta charset="utf-8">
<title>${escapePrintHtml(fileName)}</title>
<style>
  @page{size:A4 landscape;margin:12mm}
  *{box-sizing:border-box}
  body{
    margin:0;
    color:#17131c;
    background:#fff;
    font-family:Arial,Helvetica,sans-serif;
    -webkit-print-color-adjust:exact;
    print-color-adjust:exact;
  }
  .header{
    padding:14px 18px;
    color:#fff;
    background:linear-gradient(135deg,#090812,#321047);
    border-bottom:4px solid #a83cff;
  }
  .brand{
    color:#c964ff;
    font-size:20px;
    font-weight:900;
    letter-spacing:.06em;
  }
  h1{margin:6px 0 0;font-size:17px}
  .meta,.member-info{
    margin:10px 0;
    color:#514958;
    font-size:11px;
  }
  table{
    width:100%;
    border-collapse:collapse;
    table-layout:fixed;
    font-size:10px;
  }
  th{
    padding:8px 7px;
    color:#fff;
    background:#2c123c;
    border:1px solid #7e4597;
    text-align:left;
  }
  td{
    padding:7px;
    border:1px solid #d4c4dc;
    vertical-align:top;
    word-break:break-word;
  }
  tbody tr:nth-child(even){background:#f8f2fb}
  .footer{
    margin-top:10px;
    color:#6d6471;
    font-size:9px;
    text-align:center;
  }
  .actions{
    padding:12px 0;
    text-align:right;
  }
  button{
    padding:10px 16px;
    border:0;
    border-radius:7px;
    color:#fff;
    background:#8e24cf;
    font-weight:800;
    cursor:pointer;
  }
  @media print{
    .actions{display:none}
    thead{display:table-header-group}
    tr{break-inside:avoid}
  }
</style>
</head>
<body>
  <div class="header">
    <div class="brand">77 TEAM MANAGER</div>
    <h1>${escapePrintHtml(title)}</h1>
  </div>

  <div class="actions">
    <button onclick="window.print()">Salvar como PDF</button>
  </div>

  <div class="meta">
    Gerado em ${escapePrintHtml(generatedAt)} · ${rows.length} registro(s)
  </div>

  ${memberInfo}

  <table>
    <thead>
      <tr>
        <th>Data</th>
        <th>Tipo</th>
        <th>Horário / Evento</th>
        <th>Membro</th>
        <th>Clã</th>
        <th>Cargo</th>
        <th>Status</th>
      </tr>
    </thead>
    <tbody>${bodyRows}</tbody>
  </table>

  <div class="footer">77 TEAM Manager — Relatório de presença</div>

<script>
  window.addEventListener("load",()=>{
    setTimeout(()=>window.print(),350);
  });
<\/script>
</body>
</html>`);
  popup.document.close();
}

function updatePdfMemberOptions(){
  const select=$("#individualPdfMember");
  if(!select)return;
  const current=select.value;
  const members=[...state.members].sort((a,b)=>
    String(a.name||"").localeCompare(String(b.name||""),"pt-BR")
  );
  select.innerHTML='<option value="">Selecionar membro</option>'+
    members.map(member=>`<option value="${member.id}">${member.name}</option>`).join("");
  if(members.some(member=>member.id===current))select.value=current;
}

function render(){
  const todayIso=new Date().toISOString().slice(0,10);
  const monthIso=todayIso.slice(0,7);
  animateNumber("kMembers",state.members.length);

  const todayPresent=state.attendance.filter(x=>x.status===1&&x.date===todayIso).length;
  animateNumber("kPresence",todayPresent);

  const monthEvents=new Set(
    state.attendance
      .filter(x=>x.kind==="eventos"&&String(x.date||"").startsWith(monthIso))
      .map(x=>`${x.date}|${x.slot}`)
  ).size;
  animateNumber("kMonthEvents",monthEvents);

  const rank=state.members
    .map(m=>({...m,...stats(m.name)}))
    .sort((a,b)=>b.present-a.present||b.rate-a.rate);

  setText("kBest",rank[0]?.name||"—");
  $("#kBestPoints").textContent=`${rank[0]?.present||0} presenças`;

  const recent=state.attendance
    .filter(x=>x.status===1)
    .sort((a,b)=>String(b.date||"").localeCompare(String(a.date||"")))
    .slice(0,5);

  $("#recentPresenceRows").innerHTML=recent.map(a=>`<tr>
    <td><span class="member-avatar">${(a.memberName||"?").slice(0,1).toUpperCase()}</span>${a.memberName||"—"}</td>
    <td>${roleBadge(a.role)}</td>
    <td>${a.date||"—"}</td>
    <td>${a.slot||a.kind||"—"}</td>
  </tr>`).join("")||'<tr><td colspan="4">Nenhuma presença registrada.</td></tr>';

  $("#topFiveRows").innerHTML=rank.slice(0,5).map((r,i)=>`<tr>
    <td><span class="rank-position rank-${i+1}">${i<3?["🥇","🥈","🥉"][i]:i+1}</span></td>
    <td><span class="member-avatar">${(r.name||"?").slice(0,1).toUpperCase()}</span>${r.name}</td>
    <td>${roleBadge(r.role)}</td>
    <td><strong class="ranking-points">${r.present}</strong></td>
  </tr>`).join("")||'<tr><td colspan="4">Sem dados de ranking.</td></tr>';
  renderPresence("worldbossContent","worldboss");renderPresence("purgatorioContent","purgatorio");renderPresence("eventosContent","eventos");
  const dashboardSearch=($("#dashboardMemberSearch")?.value||"").toLowerCase();
  const dashboardMembers=rank.filter(m=>
    !dashboardSearch||
    String(m.name||"").toLowerCase().includes(dashboardSearch)||
    String(m.clan||"").toLowerCase().includes(dashboardSearch)||
    String(m.role||"").toLowerCase().includes(dashboardSearch)
  );

  $("#dashboardMemberRows").innerHTML=dashboardMembers.map(m=>`<tr>
    <td><span class="member-avatar">${(m.name||"?").slice(0,1).toUpperCase()}</span><strong>${m.name}</strong></td>
    <td>${roleBadge(m.role)}</td>
    <td>${m.clan||"—"}</td>
    <td>${m.present}</td>
    <td><strong class="ranking-points">${m.rate}%</strong></td>
    <td><span class="online-status"><i></i>Ativo</span></td>
  </tr>`).join("")||'<tr><td colspan="6">Nenhum membro encontrado.</td></tr>';

  $("#memberRows").innerHTML=state.members.map(m=>`<tr><td><button class="member-link" data-view-member="${m.id}">${m.name}</button></td><td>${roleBadge(m.role)}</td><td>${m.clan||"—"}</td><td>${editor()?`<button class="btn danger" data-delete-member="${m.id}">Excluir</button>`:"Visualização"}</td></tr>`).join("");
  $("#historyRows").innerHTML=state.attendance.map(a=>`<tr><td>${a.date||"—"}</td><td>${a.kind}</td><td>${a.memberName}</td><td>${a.clan||"—"}</td><td>${roleBadge(a.role)}</td><td>${a.status===1?"Presente":"Ausente"}</td></tr>`).join("");
  $("#rankingRows").innerHTML=rank.map((r,i)=>`<tr><td>${i+1}</td><td>${r.name}</td><td>${r.clan||"—"}</td><td>${roleBadge(r.role)}</td><td>${r.present}</td><td>${r.rate}%</td></tr>`).join("");
  const pending=state.users.filter(u=>u.role==="member"&&u.status==="pending");
  $("#requestRows").innerHTML=pending.map(u=>`<tr><td>${u.name}</td><td>${u.email}</td><td><select data-clan="${u.id}">${'<option value="">Clã</option>'+CLANS.map(x=>`<option>${x}</option>`).join("")}</select></td><td><select data-role="${u.id}">${MEMBER_ROLES.map(x=>`<option>${x}</option>`).join("")}</select></td><td><button class="btn primary" data-approve="${u.id}">Aprovar</button></td></tr>`).join("");
  $("#staffRows").innerHTML=state.users.filter(u=>u.role==="staff").map(u=>`<tr><td>${u.name}</td><td>${u.email}</td><td>${u.active===false?"Bloqueado":"Ativo"}</td></tr>`).join("");
  $("#auditRows").innerHTML=state.audit.map(a=>`<tr><td>${a.createdAt?.toDate?a.createdAt.toDate().toLocaleString("pt-BR"):"—"}</td><td>${a.userName||"—"}</td><td>${a.action}</td><td>${a.details||""}</td></tr>`).join("");
  renderNotifications();renderCalendar();renderStatistics();updatePdfMemberOptions();renderOwnProfile();renderCharacterProfile();renderCharactersTable();applyRestrictedVisibility();
}

document.addEventListener("click",async e=>{
  const p=e.target.closest("[data-presence]");
  if(p&&editor()){
    const [kind,memberId,slot]=p.dataset.presence.split("|"),member=state.members.find(m=>m.id===memberId);if(!member)return;
    const id=(kind+"__"+memberId+"__"+slot).replace(/[^a-zA-Z0-9_-]/g,"_");
    const ref=doc(db,"attendance",id),current=state.attendance.find(a=>a.id===id)?.status||0,next=current===0?1:current===1?-1:0;
    if(next===0)await deleteDoc(ref);else await setDoc(ref,{memberId,memberName:member.name,clan:member.clan,role:member.role,kind,slot,status:next,date:new Date().toISOString().slice(0,10),updatedAt:serverTimestamp()});
    await audit("presença alterada",`${member.name} · ${kind} · ${slot}`);
  }
  const del=e.target.closest("[data-delete-member]");if(del&&editor())await deleteDoc(doc(db,"members",del.dataset.deleteMember));
  const approve=e.target.closest("[data-approve]");
  if(approve&&editor()){
    const u=state.users.find(x=>x.id===approve.dataset.approve);if(!u)return;
    const clan=document.querySelector(`[data-clan="${u.id}"]`).value,role=document.querySelector(`[data-role="${u.id}"]`).value;
    if(!clan)return toast("Selecione o clã.");
    const batch=writeBatch(db);
    batch.update(doc(db,"users",u.id),{active:true,status:"approved",clan,memberRole:role,approvedAt:serverTimestamp()});
    batch.set(doc(db,"members",u.id),{name:u.name,role,clan,userId:u.id,createdAt:serverTimestamp()});
    await batch.commit();await audit("membro aprovado",u.email);
  }
});

$("#memberForm").onsubmit=async e=>{e.preventDefault();if(!editor())return;await addDoc(collection(db,"members"),{name:$("#memberName").value.trim(),role:$("#memberRole").value,clan:$("#memberClan").value,createdAt:serverTimestamp()});e.target.reset()};
$("#staffForm").onsubmit=async e=>{
  e.preventDefault();if(!owner())return;
  let secondary;
  try{
    secondary=initializeApp(firebaseConfig,"staff-"+Date.now());const sa=getAuth(secondary),sd=getFirestore(secondary);
    const name=$("#staffName").value.trim(),email=$("#staffEmail").value.trim().toLowerCase(),password=$("#staffPassword").value;
    const cred=await createUserWithEmailAndPassword(sa,email,password);
    await setDoc(doc(sd,"users",cred.user.uid),{name,email,role:"staff",active:true,status:"approved",createdAt:serverTimestamp()});
    await signOut(sa);await deleteApp(secondary);e.target.reset();toast("Staff criado.");
  }catch(e2){if(secondary)try{await deleteApp(secondary)}catch{};toast(errMsg(e2))}
};

$("#dashboardMemberSearch")?.addEventListener("input",render);

setText("today",new Intl.DateTimeFormat("pt-BR",{dateStyle:"full"}).format(new Date()));


document.addEventListener("click",event=>{
  const jump=event.target.closest("[data-page-jump]");
  if(!jump)return;
  const page=jump.dataset.pageJump;
  document.querySelector(`#nav [data-page="${page}"]`)?.click();
});


$("#notificationButton").onclick=()=>$("#notificationPanel").classList.toggle("hidden");
$("#closeNotifications").onclick=()=>$("#notificationPanel").classList.add("hidden");
$("#newCalendarEvent").onclick=()=>$("#eventModal").classList.remove("hidden");
$("#closeEventModal").onclick=()=>$("#eventModal").classList.add("hidden");
document.addEventListener("click",event=>{
  if(event.target.closest("[data-close-drawer]"))$("#memberDrawer").classList.add("hidden");
  const view=event.target.closest("[data-view-member]");
  if(view){const member=state.members.find(m=>m.id===view.dataset.viewMember);if(member)openMemberDrawer(member)}
});
$("#eventForm").onsubmit=async event=>{
  event.preventDefault();if(!editor())return;
  await addDoc(collection(db,"events"),{title:$("#eventTitle").value.trim(),date:$("#eventDate").value,type:$("#eventType").value,description:$("#eventDescription").value.trim(),createdBy:state.user.uid,createdAt:serverTimestamp()});
  await addDoc(collection(db,"notifications"),{title:"Novo evento",message:`${$("#eventTitle").value} em ${$("#eventDate").value}`,createdAt:serverTimestamp(),read:false});
  event.target.reset();$("#eventModal").classList.add("hidden");toast("Evento criado.");
};
$("#themeForm").onsubmit=async event=>{
  event.preventDefault();if(!owner())return;
  await setDoc(doc(db,"settings","app"),{themeColor:$("#themeColor").value,systemName:$("#systemName").value.trim()},{merge:true});
  toast("Aparência salva.");
};
$("#scheduleForm").onsubmit=async event=>{
  event.preventDefault();if(!owner())return;
  await setDoc(doc(db,"settings","app"),{worldbossSchedule:$("#worldbossSchedule").value,purgatorioSchedule:$("#purgatorioSchedule").value},{merge:true});
  toast("Horários salvos.");
};


$("#downloadGeneralPdf").onclick=()=>createHistoryPdf({
  fileName:`historico-geral-77-team-${new Date().toISOString().slice(0,10)}.pdf`,
  title:"Historico geral de presenca"
});

$("#downloadIndividualPdf").onclick=()=>{
  const memberId=$("#individualPdfMember").value;
  if(!memberId){
    toast("Selecione um membro.");
    return;
  }
  const member=state.members.find(item=>item.id===memberId);
  createHistoryPdf({
    memberId,
    fileName:`historico-${String(member?.name||"membro").toLowerCase().replace(/[^a-z0-9]+/g,"-")}.pdf`,
    title:`Historico individual - ${member?.name||"Membro"}`
  });
};

window.addEventListener("error",event=>{
  console.error("77 TEAM Manager:",event.error||event.message);
  if(document.querySelector(".system-error"))return;
  const box=document.createElement("div");
  box.className="system-error";
  box.textContent="Ocorreu um erro na interface. Atualize com Ctrl+Shift+R.";
  document.body.appendChild(box);
  setTimeout(()=>box.remove(),7000);
});
window.addEventListener("unhandledrejection",event=>{
  console.error("77 TEAM Manager promise:",event.reason);
});


function updateLiveClock(){
  const now=new Date();
  setText("liveClock",new Intl.DateTimeFormat("pt-BR",{
    hour:"2-digit",minute:"2-digit",second:"2-digit",
    day:"2-digit",month:"2-digit"
  }).format(now));
}
updateLiveClock();
setInterval(updateLiveClock,1000);

function animateNumber(id,target,suffix=""){
  const el=byId(id);
  if(!el)return;
  const end=Number(target)||0;
  const start=Number(String(el.textContent).replace(/[^\d.-]/g,""))||0;
  const duration=420;
  const started=performance.now();
  function frame(now){
    const progress=Math.min(1,(now-started)/duration);
    const eased=1-Math.pow(1-progress,3);
    el.textContent=Math.round(start+(end-start)*eased)+suffix;
    if(progress<1)requestAnimationFrame(frame);
  }
  requestAnimationFrame(frame);
}

function renderGlobalSearch(query){
  const box=byId("globalSearchResults");
  if(!box)return;
  const term=String(query||"").trim().toLowerCase();
  if(!term){
    box.classList.add("hidden");
    box.innerHTML="";
    return;
  }

  const matches=state.members.filter(member=>
    String(member.name||"").toLowerCase().includes(term)||
    String(member.clan||"").toLowerCase().includes(term)||
    String(member.role||"").toLowerCase().includes(term)
  ).slice(0,8);

  box.innerHTML=matches.length
    ?matches.map(member=>`<button type="button" data-search-member="${member.id}">
        <span class="member-avatar">${(member.name||"?").slice(0,1).toUpperCase()}</span>
        <span><strong>${member.name}</strong><small>${member.role||"Membro"} · ${member.clan||"Sem clã"}</small></span>
      </button>`).join("")
    :'<p>Nenhum resultado encontrado.</p>';
  box.classList.remove("hidden");
}

on("globalSearch","input",event=>renderGlobalSearch(event.target.value));
document.addEventListener("click",event=>{
  const result=event.target.closest("[data-search-member]");
  if(result){
    const member=state.members.find(item=>item.id===result.dataset.searchMember);
    if(member)openMemberDrawer(member);
    byId("globalSearchResults")?.classList.add("hidden");
  }else if(!event.target.closest(".topbar-center")){
    byId("globalSearchResults")?.classList.add("hidden");
  }
});


function currentMemberRecord(){
  if(!state.user)return null;
  return state.members.find(member=>
    member.userId===state.user.uid||
    member.id===state.user.uid||
    String(member.name||"").toLowerCase()===String(state.profile?.name||"").toLowerCase()
  )||null;
}
function renderOwnProfile(){
  if(state.guest||!state.user||!state.profile)return;
  const member=currentMemberRecord();
  const displayName=state.profile.name||member?.name||state.profile.email||"Usuário";
  const role=member?.role||state.profile.memberRole||state.profile.role||"Membro";
  const clan=member?.clan||state.profile.clan||"Sem clã";
  const avatar=state.profile.avatarDataUrl||"";
  const stat=stats(member?.name||displayName);
  const level=memberLevel(stat.present);
  const medals=memberMedals({name:member?.name||displayName,role});
  setText("profileDisplayName",displayName);
  setText("profileEmail",`${state.profile.email||state.user.email||"—"} · ${clan}`);
  setText("profileLevel",`Nível ${level}`);
  setText("profileNextLevel",`${stat.present%10}/10 presenças`);
  setText("profilePresence",stat.present);
  setText("profileAbsence",stat.absent);
  setText("profileRate",`${stat.rate}%`);
  setText("profileAvatarFallback",(displayName||"U").slice(0,1).toUpperCase());
  setHtml("profileRoleBadge",roleBadge(role));
  setHtml("profileMedals",medals.length?medals.map(x=>`<span>${x}</span>`).join(""):"Nenhuma medalha ainda.");
  const fill=byId("profileProgressFill");if(fill)fill.style.width=`${(stat.present%10)*10}%`;
  const img=byId("profileAvatarPreview"),fallback=byId("profileAvatarFallback");
  if(img&&fallback){
    if(avatar){img.src=avatar;img.classList.remove("hidden");fallback.classList.add("hidden")}
    else{img.removeAttribute("src");img.classList.add("hidden");fallback.classList.remove("hidden")}
  }
  setValue("profileNicknameInput",displayName);
  const history=state.attendance.filter(item=>
    item.memberId===member?.id||item.memberName===member?.name||item.memberName===displayName
  ).sort((a,b)=>String(b.date||"").localeCompare(String(a.date||""))).slice(0,20);
  setHtml("profileHistoryRows",history.map(item=>`<tr><td>${formatHistoryDate(item.date)}</td><td>${item.kind||"—"}</td><td>${item.slot||"—"}</td><td>${item.status===1?"Presente":item.status===-1?"Ausente":"—"}</td></tr>`).join("")||'<tr><td colspan="4">Nenhum registro encontrado.</td></tr>');
}
function resizeAvatar(file){
  return new Promise((resolve,reject)=>{
    if(!file)return reject(new Error("Selecione uma imagem."));

    const allowedTypes=["image/jpeg","image/png","image/webp"];
    if(!allowedTypes.includes(file.type)){
      return reject(new Error("Use uma imagem JPG, PNG ou WebP."));
    }

    if(file.size>8*1024*1024){
      return reject(new Error("A imagem deve ter no máximo 8 MB."));
    }

    const reader=new FileReader();

    reader.onerror=()=>reject(new Error("Não foi possível ler a imagem."));

    reader.onload=()=>{
      const image=new Image();

      image.onerror=()=>reject(new Error("A imagem selecionada é inválida."));

      image.onload=()=>{
        const outputSize=256;
        const canvas=document.createElement("canvas");
        canvas.width=outputSize;
        canvas.height=outputSize;

        const context=canvas.getContext("2d");
        if(!context){
          return reject(new Error("Seu navegador não conseguiu processar a imagem."));
        }

        // Recorte central quadrado automático.
        const sourceSize=Math.min(image.naturalWidth,image.naturalHeight);
        const sourceX=(image.naturalWidth-sourceSize)/2;
        const sourceY=(image.naturalHeight-sourceSize)/2;

        context.clearRect(0,0,outputSize,outputSize);
        context.imageSmoothingEnabled=true;
        context.imageSmoothingQuality="high";

        context.drawImage(
          image,
          sourceX,
          sourceY,
          sourceSize,
          sourceSize,
          0,
          0,
          outputSize,
          outputSize
        );

        // JPEG comprimido para caber com segurança no documento Firestore.
        const avatarDataUrl=canvas.toDataURL("image/jpeg",0.78);

        if(avatarDataUrl.length>700000){
          return reject(new Error("A imagem processada ficou muito grande. Escolha outra imagem."));
        }

        resolve(avatarDataUrl);
      };

      image.src=reader.result;
    };

    reader.readAsDataURL(file);
  });
}
on("profileNicknameForm","submit",async event=>{
  event.preventDefault();
  const name=(byId("profileNicknameInput")?.value||"").trim();
  if(name.length<2)return toast("O nickname precisa ter pelo menos 2 caracteres.");
  try{
    await updateDoc(doc(db,"users",state.user.uid),{name,updatedAt:serverTimestamp()});
    state.profile.name=name;applyPermissions();renderOwnProfile();renderCharacterProfile();renderCharactersTable();applyRestrictedVisibility();toast("Nickname atualizado.");
  }catch(error){toast(error.message||"Não foi possível atualizar.")}
});
on("profileAvatarForm","submit",async event=>{
  event.preventDefault();

  try{
    const input=byId("profileAvatarInput");
    const file=input?.files?.[0];

    if(!file){
      toast("Selecione uma imagem.");
      return;
    }

    const avatarDataUrl=await resizeAvatar(file);

    await updateDoc(
      doc(db,"users",state.user.uid),
      {
        avatarDataUrl,
        updatedAt:serverTimestamp()
      }
    );

    state.profile.avatarDataUrl=avatarDataUrl;

    renderOwnProfile();renderCharacterProfile();renderCharactersTable();applyRestrictedVisibility();
    applyPermissions();
    event.target.reset();

    toast("Avatar atualizado e ajustado automaticamente.");
  }catch(error){
    toast(error.message||"Não foi possível atualizar o avatar.");
  }
});
on("removeProfileAvatar","click",async()=>{
  try{
    await updateDoc(doc(db,"users",state.user.uid),{avatarDataUrl:"",updatedAt:serverTimestamp()});
    state.profile.avatarDataUrl="";renderOwnProfile();renderCharacterProfile();renderCharactersTable();applyRestrictedVisibility();toast("Avatar removido.");
  }catch(error){toast(error.message||"Não foi possível remover o avatar.")}
});
on("profilePasswordForm","submit",async event=>{
  event.preventDefault();
  const password=byId("profileNewPassword")?.value||"";
  const confirm=byId("profileConfirmPassword")?.value||"";
  if(password.length<6)return toast("A senha precisa ter pelo menos 6 caracteres.");
  if(password!==confirm)return toast("As senhas não conferem.");
  try{
    await updatePassword(auth.currentUser,password);
    event.target.reset();toast("Senha atualizada.");
  }catch(error){
    toast(error?.code==="auth/requires-recent-login"?"Entre novamente e tente trocar a senha.":errMsg(error));
  }
});


on("profileAvatarInput","change",async event=>{
  const file=event.target.files?.[0];
  if(!file)return;

  try{
    const previewDataUrl=await resizeAvatar(file);
    const image=byId("profileAvatarPreview");
    const fallback=byId("profileAvatarFallback");

    if(image&&fallback){
      image.src=previewDataUrl;
      image.classList.remove("hidden");
      fallback.classList.add("hidden");
    }
  }catch(error){
    event.target.value="";
    toast(error.message||"Não foi possível visualizar a imagem.");
  }
});


document.addEventListener("click",event=>{
  const nav=event.target.closest("#nav [data-page]");
  const jump=event.target.closest("[data-page-jump]");
  const requestedPage=nav?.dataset.page||jump?.dataset.pageJump;

  if(requestedPage&&!canOpenPage(requestedPage)){
    event.preventDefault();
    event.stopImmediatePropagation();
    toast("Esta área é exclusiva do Proprietário e da Staff.");
    window.TeamManagerUI?.activatePage("dashboard");
  }
},true);

window.TeamManagerCanOpenPage=canOpenPage;


function applyRestrictedVisibility(){
  const allowed=editor();

  ["worldboss","purgatorio","eventos"].forEach(page=>{
    const section=byId(page);
    if(section)section.classList.toggle("hidden",!allowed);
  });

  document.querySelectorAll('[data-page="worldboss"],[data-page="purgatorio"],[data-page="eventos"]')
    .forEach(button=>button.classList.toggle("hidden",!allowed));

  document.querySelectorAll(".attendance-private")
    .forEach(element=>element.classList.toggle("hidden",!allowed));
}


function numberOrZero(value){
  const number=Number(value);
  return Number.isFinite(number)&&number>=0?number:0;
}

function currentCharacterData(){
  return state.profile?.character||{};
}

function renderCharacterProfile(){
  if(state.guest||!state.profile)return;

  const character=currentCharacterData();
  const nickname=state.profile.name||"";

  setValue("characterNickname",nickname);
  setValue("characterClass",character.className||"");
  setValue("characterPower",character.power??0);
  setValue("characterLevel",character.level??0);
  setValue("characterCodex",character.codex??0);
  setValue("characterMandalla",character.mandalla??0);
  setValue("characterChi1",character.chi1??0);
  setValue("characterChi2",character.chi2??0);
  setValue("characterChi3",character.chi3??0);
  setValue("characterFrogPosture",character.frogPosture??0);
  setValue("characterConstitution",character.constitution??0);
  setValue("characterWildernessTraining",character.wildernessTraining??0);
}

function characterRowsData(){
  return state.users
    .filter(user=>user.status==="approved"||user.active===true)
    .map(user=>({
      id:user.id,
      nickname:user.name||"—",
      character:user.character||{}
    }));
}

function renderCharactersTable(){
  const tbody=byId("charactersRows");
  if(!tbody)return;

  const search=String(byId("characterSearch")?.value||"").trim().toLowerCase();

  const rows=characterRowsData().filter(item=>{
    const character=item.character;
    return !search
      || item.nickname.toLowerCase().includes(search)
      || String(character.className||"").toLowerCase().includes(search);
  });

  tbody.innerHTML=rows.map(item=>{
    const c=item.character;
    return `<tr>
      <td><strong>${item.nickname}</strong></td>
      <td>${c.className||"—"}</td>
      <td>${c.power??0}</td>
      <td>${c.level??0}</td>
      <td>${c.codex??0}</td>
      <td>${c.mandalla??0}</td>
      <td>${c.chi1??0}</td>
      <td>${c.chi2??0}</td>
      <td>${c.chi3??0}</td>
      <td>${c.frogPosture??0}</td>
      <td>${c.constitution??0}</td>
      <td>${c.wildernessTraining??0}</td>
    </tr>`;
  }).join("")||'<tr><td colspan="12">Nenhum personagem cadastrado.</td></tr>';
}

on("characterForm","submit",async event=>{
  event.preventDefault();

  if(!state.user||state.guest)return;

  const character={
    className:String(byId("characterClass")?.value||"").trim(),
    power:numberOrZero(byId("characterPower")?.value),
    level:numberOrZero(byId("characterLevel")?.value),
    codex:numberOrZero(byId("characterCodex")?.value),
    mandalla:numberOrZero(byId("characterMandalla")?.value),
    chi1:numberOrZero(byId("characterChi1")?.value),
    chi2:numberOrZero(byId("characterChi2")?.value),
    chi3:numberOrZero(byId("characterChi3")?.value),
    frogPosture:numberOrZero(byId("characterFrogPosture")?.value),
    constitution:numberOrZero(byId("characterConstitution")?.value),
    wildernessTraining:numberOrZero(byId("characterWildernessTraining")?.value)
  };

  if(!character.className){
    toast("Informe a classe do personagem.");
    return;
  }

  try{
    await updateDoc(
      doc(db,"users",state.user.uid),
      {
        character,
        characterUpdatedAt:serverTimestamp()
      }
    );

    state.profile.character=character;
    renderCharacterProfile();
    renderCharactersTable();
    toast("Informações do personagem salvas.");
  }catch(error){
    toast(error.message||"Não foi possível salvar o personagem.");
  }
});

on("characterSearch","input",renderCharactersTable);
