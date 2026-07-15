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

const state={user:null,profile:null,guest:false,members:[],attendance:[],users:[],audit:[],unsubs:[]};

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
}
async function audit(action,details){if(!state.user||!editor())return;try{await addDoc(collection(db,"audit"),{userId:state.user.uid,userName:state.profile.name,action,details,createdAt:serverTimestamp()})}catch{}}

function stats(name){const rows=state.attendance.filter(x=>x.memberName===name),p=rows.filter(x=>x.status===1).length,a=rows.filter(x=>x.status===-1).length,t=p+a;return{present:p,absent:a,rate:t?Math.round(p/t*100):0}}
function renderPresence(targetId,kind){
  const target=$("#"+targetId),slots=TYPES[kind];
  target.innerHTML=`<div class="presence-grid"><table><thead><tr><th>Jogador</th>${slots.map(x=>`<th>${x}</th>`).join("")}</tr></thead><tbody>${state.members.map(m=>`<tr><td>${m.name}</td>${slots.map(slot=>{const row=state.attendance.find(a=>a.memberId===m.id&&a.kind===kind&&a.slot===slot),status=row?.status||0;return `<td><button ${editor()?"":"disabled"} class="presence-btn ${status===1?"present":status===-1?"absent":""}" data-presence="${kind}|${m.id}|${slot}">${status===1?"✓":status===-1?"×":"—"}</button></td>`}).join("")}</tr>`).join("")}</tbody></table></div>`;
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

  $("#memberRows").innerHTML=state.members.map(m=>`<tr><td>${m.name}</td><td>${roleBadge(m.role)}</td><td>${m.clan||"—"}</td><td>${editor()?`<button class="btn danger" data-delete-member="${m.id}">Excluir</button>`:"Visualização"}</td></tr>`).join("");
  $("#historyRows").innerHTML=state.attendance.map(a=>`<tr><td>${a.date||"—"}</td><td>${a.kind}</td><td>${a.memberName}</td><td>${a.clan||"—"}</td><td>${roleBadge(a.role)}</td><td>${a.status===1?"Presente":"Ausente"}</td></tr>`).join("");
  $("#rankingRows").innerHTML=rank.map((r,i)=>`<tr><td>${i+1}</td><td>${r.name}</td><td>${r.clan||"—"}</td><td>${roleBadge(r.role)}</td><td>${r.present}</td><td>${r.rate}%</td></tr>`).join("");
  const pending=state.users.filter(u=>u.role==="member"&&u.status==="pending");
  $("#requestRows").innerHTML=pending.map(u=>`<tr><td>${u.name}</td><td>${u.email}</td><td><select data-clan="${u.id}">${'<option value="">Clã</option>'+CLANS.map(x=>`<option>${x}</option>`).join("")}</select></td><td><select data-role="${u.id}">${MEMBER_ROLES.map(x=>`<option>${x}</option>`).join("")}</select></td><td><button class="btn primary" data-approve="${u.id}">Aprovar</button></td></tr>`).join("");
  $("#staffRows").innerHTML=state.users.filter(u=>u.role==="staff").map(u=>`<tr><td>${u.name}</td><td>${u.email}</td><td>${u.active===false?"Bloqueado":"Ativo"}</td></tr>`).join("");
  $("#auditRows").innerHTML=state.audit.map(a=>`<tr><td>${a.createdAt?.toDate?a.createdAt.toDate().toLocaleString("pt-BR"):"—"}</td><td>${a.userName||"—"}</td><td>${a.action}</td><td>${a.details||""}</td></tr>`).join("");
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
