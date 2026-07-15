import {firebaseConfig,FIREBASE_VERSION} from "./firebase-config.js";
const SDK=`https://www.gstatic.com/firebasejs/${FIREBASE_VERSION}`;
const {initializeApp,deleteApp}=await import(`${SDK}/firebase-app.js`);
const {getAuth,onAuthStateChanged,signInWithEmailAndPassword,createUserWithEmailAndPassword,signOut}=await import(`${SDK}/firebase-auth.js`);
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
  const displayName=state.guest?"Visitante":(state.profile?.name||state.profile?.email||"Usuário");
  const roleLabel=state.guest?"Somente visualização":state.profile?.role==="owner"?"Proprietário":state.profile?.role==="staff"?"Staff":"Membro";
  $("#welcomeName").textContent=displayName;
  $("#topbarUserName").textContent=displayName;
  $("#userBadge").textContent=roleLabel;
  $("#sidebarUserName").textContent=displayName;
  $("#sidebarUserRole").textContent=roleLabel;
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
  $("#notificationCount").textContent=state.notifications.filter(n=>!n.read).length;
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
  $("#statsPresenceTotal").textContent=present;
  $("#statsAbsenceTotal").textContent=absent;
  $("#statsGeneralRate").textContent=(total?Math.round(present/total*100):0)+"%";
  $("#statsActiveMembers").textContent=state.members.length;
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

function createHistoryPdf({memberId="",fileName,title}){
  const jsPDFClass=window.jspdf?.jsPDF;
  if(!jsPDFClass||typeof jsPDFClass!=="function"){
    toast("Biblioteca de PDF não carregada. Verifique a conexão.");
    return;
  }

  const rows=historyPdfRows(memberId);
  if(!rows.length){
    toast("Não existem registros para gerar este PDF.");
    return;
  }

  const selected=memberId
    ? state.members.find(member=>member.id===memberId)
    : null;

  const doc=new jsPDFClass({
    orientation:"landscape",
    unit:"mm",
    format:"a4"
  });

  const pageWidth=doc.internal.pageSize.getWidth();

  doc.setFillColor(8,8,14);
  doc.rect(0,0,pageWidth,30,"F");

  doc.setTextColor(177,60,255);
  doc.setFont("helvetica","bold");
  doc.setFontSize(18);
  doc.text("77 TEAM MANAGER",14,13);

  doc.setTextColor(255,255,255);
  doc.setFontSize(13);
  doc.text(pdfSafe(title),14,22);

  doc.setTextColor(90,90,100);
  doc.setFont("helvetica","normal");
  doc.setFontSize(9);
  doc.text(
    `Gerado em ${new Date().toLocaleString("pt-BR")} | ${rows.length} registro(s)`,
    pageWidth-14,
    22,
    {align:"right"}
  );

  if(selected){
    doc.setTextColor(70,70,78);
    doc.text(
      `Membro: ${pdfSafe(selected.name)} | Cargo: ${pdfSafe(selected.role)} | Cla: ${pdfSafe(selected.clan)}`,
      14,
      28
    );
  }

  doc.autoTable({
    startY:selected?33:32,
    head:[["Data","Tipo","Horario/Evento","Membro","Cla","Cargo","Status"]],
    body:rows,
    theme:"grid",
    styles:{
      font:"helvetica",
      fontSize:8,
      cellPadding:3,
      textColor:[30,30,34],
      lineColor:[205,180,220],
      lineWidth:.15,
      overflow:"linebreak"
    },
    headStyles:{
      fillColor:[44,18,61],
      textColor:[255,255,255],
      fontStyle:"bold"
    },
    alternateRowStyles:{
      fillColor:[248,243,252]
    },
    columnStyles:{
      0:{cellWidth:24},
      1:{cellWidth:30},
      2:{cellWidth:34},
      3:{cellWidth:44},
      4:{cellWidth:40},
      5:{cellWidth:30},
      6:{cellWidth:26}
    },
    didDrawPage:()=>{
      const height=doc.internal.pageSize.getHeight();
      doc.setTextColor(110,100,118);
      doc.setFontSize(8);
      doc.text(
        `77 TEAM Manager - Pagina ${doc.internal.getNumberOfPages()}`,
        pageWidth/2,
        height-6,
        {align:"center"}
      );
    }
  });

  doc.save(fileName);
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
  $("#kMembers").textContent=state.members.length;

  const todayPresent=state.attendance.filter(x=>x.status===1&&x.date===todayIso).length;
  $("#kPresence").textContent=todayPresent;

  const monthEvents=new Set(
    state.attendance
      .filter(x=>x.kind==="eventos"&&String(x.date||"").startsWith(monthIso))
      .map(x=>`${x.date}|${x.slot}`)
  ).size;
  $("#kMonthEvents").textContent=monthEvents;

  const rank=state.members
    .map(m=>({...m,...stats(m.name)}))
    .sort((a,b)=>b.present-a.present||b.rate-a.rate);

  $("#kBest").textContent=rank[0]?.name||"—";
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
  renderNotifications();renderCalendar();renderStatistics();updatePdfMemberOptions();
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

$("#today").textContent=new Intl.DateTimeFormat("pt-BR",{dateStyle:"full"}).format(new Date());


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
