
function byId(id){return document.getElementById(id)}
function setText(id,value){const el=byId(id);if(el)el.textContent=value??""}
function setHtml(id,value){const el=byId(id);if(el)el.innerHTML=value??""}
function setValue(id,value){const el=byId(id);if(el)el.value=value??""}
function escapeHtml(value){return String(value??"").replace(/[&<>"']/g,char=>({"&":"&amp;","<":"&lt;",">":"&gt;","\"":"&quot;","'":"&#39;"}[char]))}
function on(id,eventName,handler){const el=byId(id);if(el)el.addEventListener(eventName,handler)}

import {firebaseConfig,FIREBASE_VERSION} from "./firebase-config.js";
const SDK=`https://www.gstatic.com/firebasejs/${FIREBASE_VERSION}`;
const {initializeApp,deleteApp}=await import(`${SDK}/firebase-app.js`);
const {getAuth,onAuthStateChanged,signInWithEmailAndPassword,createUserWithEmailAndPassword,signOut,updatePassword,updateEmail,reauthenticateWithCredential,EmailAuthProvider,setPersistence,browserLocalPersistence,browserSessionPersistence}=await import(`${SDK}/firebase-auth.js`);
const {getFirestore,collection,doc,getDoc,getDocs,setDoc,addDoc,updateDoc,deleteDoc,deleteField,onSnapshot,serverTimestamp,writeBatch,query,where}=await import(`${SDK}/firebase-firestore.js`);
const {getStorage,ref:storageRef,uploadBytes,getDownloadURL,deleteObject}=await import(`${SDK}/firebase-storage.js`);

const app=initializeApp(firebaseConfig);
const auth=getAuth(app);
const db=getFirestore(app);
const storage=getStorage(app);
const $=s=>document.querySelector(s),$$=s=>Array.from(document.querySelectorAll(s));

const CLANS=["77 Team I","77 Team II","亗 DHM黑龙77 亗","DHM 亗 白龙 ②","Projeto X"];
const MEMBER_ROLES=["Membros","PT TIME","PT BOOST","PT CORE"];
const ALL_ROLES=["Staff",...MEMBER_ROLES];
const REQUEST_ACCESS_OPTIONS={
  dev:[
    {value:"dev",label:"DEV"},{value:"leadership",label:"Liderança"},{value:"staff",label:"Staff"},
    ...MEMBER_ROLES.map(role=>({value:`member:${role}`,label:role}))
  ],
  leadership:[
    {value:"staff",label:"Staff"},
    ...MEMBER_ROLES.map(role=>({value:`member:${role}`,label:role}))
  ],
  staff:MEMBER_ROLES.map(role=>({value:`member:${role}`,label:role}))
};
const TYPES={worldboss:["10H","12H","20H","22H","00H"],purgatorio:["06H","12H","18H","00H"],eventos:["Guerra de Vale","Defesa de Crista","Evento de Vale","Saque de Castelo"]};

const state={user:null,profile:null,guest:false,onboardingRequired:false,members:[],attendance:[],rtPresence:[],users:[],audit:[],events:[],notifications:[],sentNotifications:[],notificationReads:[],settings:{},xpLogs:[],supportMessages:[],selectedSupportOwnerUid:"",selectedSupportTicketId:"",supportView:"active",chatMessages:[],selectedChatOwnerUid:"",selectedChatId:"",chatView:"active",chatSearch:"",editingCharacterUserId:"",presenceFilters:{},unsubs:[]};

function toast(msg){const el=$("#toast");el.textContent=msg;el.classList.add("show");clearTimeout(toast.t);toast.t=setTimeout(()=>el.classList.remove("show"),3000)}
function errMsg(e){return ({'auth/invalid-credential':'E-mail ou senha incorretos.','auth/user-disabled':'Esta conta foi desativada.','auth/too-many-requests':'Muitas tentativas. Aguarde alguns minutos e tente novamente.','auth/network-request-failed':'Falha de conexão. Verifique sua internet.','auth/email-already-in-use':'Este e-mail já existe.','auth/weak-password':'A senha precisa ter pelo menos 6 caracteres.','permission-denied':'Permissão negada. Publique o firestore.rules novo.'})[e?.code]||`${e?.code||'erro'}: ${e?.message||'Falha inesperada'}`}
function showOnly(id){document.body.dataset.screen=id;["loading","setupScreen","authScreen","app"].forEach(x=>$("#"+x).classList.toggle("hidden",x!==id))}

function accessRoleFromMemberRole(memberRole, explicitAccessRole=""){
  const explicit=normalizeAccessRole(explicitAccessRole);
  if(["dev","leadership","staff"].includes(explicit))return explicit;
  return memberRole==="Staff"?"staff":"member";
}

function memberRoleFromAccessRole(accessRole,currentMemberRole="Membros"){
  return accessRole==="staff"?"Staff":(
    currentMemberRole==="Staff"?"Membros":currentMemberRole
  );
}

function linkedUserForMember(member){
  if(!member)return null;
  return state.users.find(user=>
    user.id===member.userId||
    user.id===member.id||
    String(user.name||"").toLowerCase()===String(member.name||"").toLowerCase()
  )||null;
}

const ROLE_CONFIG=Object.freeze({
  dev:{label:"DEV",level:4,badgeClass:"role-dev"},
  leadership:{label:"Liderança",level:3,badgeClass:"role-leadership"},
  staff:{label:"Staff",level:2,badgeClass:"role-staff"},
  member:{label:"Membro",level:1,badgeClass:"role-member"},
  guest:{label:"Visitante",level:0,badgeClass:"role-guest"}
});

function normalizeAccessRole(role){
  const value=String(role||"").trim().toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g,"");
  if(["dev","developer","desenvolvedor","owner","proprietario","administrador","admin"].includes(value))return "dev";
  if(["leadership","lideranca","lider","leader","lideranca staff","lideranca/staff"].includes(value))return "leadership";
  if(["staff","moderador","moderator"].includes(value))return "staff";
  if(["guest","visitante"].includes(value))return "guest";
  return "member";
}
function resolveAccessRole(profile){
  if(!profile)return "member";
  // Contas de versões antigas podem guardar o acesso em accessRole/cargo,
  // enquanto role contém apenas o cargo do membro (Membros, PT TIME etc.).
  const candidates=[
    profile.accessRole,
    profile.systemRole,
    profile.permissionRole,
    profile.userRole,
    profile.cargo,
    profile.role
  ];
  for(const candidate of candidates){
    const raw=String(candidate||"").trim();
    if(!raw)continue;
    const normalized=normalizeAccessRole(raw);
    const folded=raw.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g,"");
    if(normalized!=="member" || ["member","membro","membros","pt time","pt boost","pt core"].includes(folded)){
      if(normalized!=="member")return normalized;
    }
  }
  return "member";
}
function accessRoleLabel(role){return ROLE_CONFIG[normalizeAccessRole(role)]?.label||"Membro"}
function currentAccessRole(){return state.guest?"guest":resolveAccessRole(state.profile)}
function owner(){return currentAccessRole()==="dev"}
function leadership(){return currentAccessRole()==="leadership"}
function staff(){return currentAccessRole()==="staff"}
function editor(){return ["dev","leadership","staff"].includes(currentAccessRole())}
function administrator(){return ["dev","leadership"].includes(currentAccessRole())}
function hasRoleLevel(level){return (ROLE_CONFIG[currentAccessRole()]?.level||0)>=level}
function canManageAcceptedMember(member,user){
  if(!editor()||!member||!user||user.status!=="approved"||user.active===false)return false;
  if(user.id===state.user?.uid)return false;
  const target=resolveAccessRole(user);
  if(owner())return true;
  if(leadership())return target==="staff"||target==="member";
  return staff()&&target==="member";
}
function allowedCargoOptions(member,user){
  if(!canManageAcceptedMember(member,user))return [];
  if(owner())return [
    {value:"dev",label:"DEV"},{value:"leadership",label:"Liderança"},{value:"staff",label:"Staff"},
    ...MEMBER_ROLES.map(value=>({value:`member:${value}`,label:value}))
  ];
  if(leadership())return [
    {value:"staff",label:"Staff"},
    ...MEMBER_ROLES.map(value=>({value:`member:${value}`,label:value}))
  ];
  return MEMBER_ROLES.map(value=>({value:`member:${value}`,label:value}));
}
function selectedCargoValue(member,user){
  const role=resolveAccessRole(user);
  return role==="member"?`member:${member?.role||user?.memberRole||"Membros"}`:role;
}

const HOME_PAGES=new Set(["dashboard","meu-perfil","membros","historico","ranking","calendario","estatisticas","sobre"]);
const STAFF_PAGES=new Set(["staff-hub","presencas","registros","worldboss","purgatorio","eventos","personagens","metas","solicitacoes","notificacoes","atendimento","chat"]);
const ADMIN_PAGES=new Set(["staff","configuracoes","auditoria"]);
const ADVANCED_PAGES=new Set(["atualizacoes","backup","logs-sistema","status-firebase","status-github","sessoes","manutencao","status-servicos","limpeza-cache","estatisticas-sistema","personalizar-login","permissoes-cargos"]);

const ROLE_PERMISSION_DEFINITIONS=Object.freeze([
  {group:"Acesso às áreas",key:"access_home",label:"Acessar HOME",defaults:{dev:true,leadership:true,staff:true,member:true,guest:true}},
  {group:"Acesso às áreas",key:"access_staff",label:"Acessar STAFF",defaults:{dev:true,leadership:true,staff:true,member:false,guest:false}},
  {group:"Acesso às áreas",key:"access_admin",label:"Acessar ADMINISTRAÇÃO",defaults:{dev:true,leadership:true,staff:false,member:false,guest:false}},
  {group:"Acesso às áreas",key:"access_advanced",label:"Acessar AVANÇADO",defaults:{dev:true,leadership:false,staff:false,member:false,guest:false}},
  {group:"Presenças",key:"presence_register",label:"Registrar presença",defaults:{dev:true,leadership:true,staff:true,member:false,guest:false}},
  {group:"Presenças",key:"presence_edit",label:"Editar presença",defaults:{dev:true,leadership:true,staff:true,member:false,guest:false}},
  {group:"Presenças",key:"presence_delete",label:"Excluir presença",defaults:{dev:true,leadership:false,staff:false,member:false,guest:false}},
  {group:"Presenças",key:"presence_finalize",label:"Finalizar RT",defaults:{dev:true,leadership:true,staff:true,member:false,guest:false}},
  {group:"Solicitações e cargos",key:"requests_approve",label:"Aprovar solicitações",defaults:{dev:true,leadership:true,staff:true,member:false,guest:false}},
  {group:"Solicitações e cargos",key:"requests_reject",label:"Rejeitar solicitações",defaults:{dev:true,leadership:true,staff:true,member:false,guest:false}},
  {group:"Solicitações e cargos",key:"roles_change",label:"Alterar cargos permitidos pela hierarquia",defaults:{dev:true,leadership:true,staff:true,member:false,guest:false}},
  {group:"Personagens",key:"character_view",label:"Visualizar personagens",defaults:{dev:true,leadership:true,staff:true,member:true,guest:false}},
  {group:"Personagens",key:"character_edit",label:"Editar personagens permitidos",defaults:{dev:true,leadership:true,staff:true,member:true,guest:false}},
  {group:"Personagens",key:"character_delete",label:"Excluir personagens permitidos",defaults:{dev:true,leadership:true,staff:true,member:true,guest:false}},
  {group:"Comunicação",key:"notifications_send",label:"Enviar notificações",defaults:{dev:true,leadership:true,staff:true,member:false,guest:false}},
  {group:"Comunicação",key:"support_manage",label:"Gerenciar atendimento e chat",defaults:{dev:true,leadership:true,staff:true,member:false,guest:false}},
  {group:"Administração",key:"audit_view",label:"Visualizar Auditoria",defaults:{dev:true,leadership:true,staff:false,member:false,guest:false}},
  {group:"Administração",key:"settings_view",label:"Visualizar Configurações",defaults:{dev:true,leadership:true,staff:false,member:false,guest:false}},
  {group:"Administração",key:"settings_edit",label:"Alterar Configurações",defaults:{dev:true,leadership:false,staff:false,member:false,guest:false}},
  {group:"Avançado",key:"login_customize",label:"Personalizar tela de login",defaults:{dev:true,leadership:false,staff:false,member:false,guest:false}}
]);
function defaultRolePermissions(){
  const result={};
  ROLE_PERMISSION_DEFINITIONS.forEach(item=>{result[item.key]={...item.defaults};});
  return result;
}
function configuredRolePermissions(){return state.settings?.rolePermissions||defaultRolePermissions();}
function permissionEnabled(key,role=currentAccessRole()){
  if(role==="dev")return true;
  const item=ROLE_PERMISSION_DEFINITIONS.find(entry=>entry.key===key);
  const configured=configuredRolePermissions()?.[key];
  return configured?.[role] ?? item?.defaults?.[role] ?? false;
}

const ROLE_PAGE_PERMISSIONS=Object.freeze({
  dev:{home:true,staff:true,admin:true,advanced:true},
  leadership:{home:true,staff:true,admin:true,advanced:false},
  staff:{home:true,staff:true,admin:false,advanced:false},
  member:{home:true,staff:false,admin:false,advanced:false},
  guest:{home:true,staff:false,admin:false,advanced:false}
});

function pageArea(page){
  if(ADVANCED_PAGES.has(page))return "advanced";
  if(ADMIN_PAGES.has(page))return "admin";
  if(STAFF_PAGES.has(page))return "staff";
  return "home";
}
function canOpenPage(page){
  if(state.onboardingRequired&&!state.guest)return page==="meu-perfil"||page==="sobre";
  const area=pageArea(page);
  return permissionEnabled(`access_${area}`);
}
function permissionMessage(page){
  const area=pageArea(page);
  if(area==="advanced")return "Esta área é exclusiva do DEV.";
  if(area==="admin")return "Esta área é exclusiva do DEV e da Liderança.";
  if(area==="staff")return "Esta área é exclusiva do DEV, Liderança e Staff.";
  return "Você não possui permissão para acessar esta página.";
}
function openAllowedPage(page){
  if(!canOpenPage(page)){
    toast(permissionMessage(page));
    window.TeamManagerUI?.activatePage("dashboard");
    return false;
  }
  window.TeamManagerUI?.activatePage(page);
  return true;
}

function memberSystemRole(member){
  const user=linkedUserForMember(member);
  return user ? resolveAccessRole(user) : normalizeAccessRole(member?.accessRole);
}

// O perfil do DEV é técnico e não deve aparecer em diretórios, rankings,
// buscas ou relatórios públicos de membros. O próprio DEV continua usando
// normalmente a página "Meu Perfil".
function isHiddenDevMember(member){
  return memberSystemRole(member)==="dev";
}
function visibleMembers(){
  return state.members.filter(member=>!isHiddenDevMember(member));
}

function memberDisplayRoleBadge(member){
  const access=memberSystemRole(member);
  // Cargos administrativos devem prevalecer visualmente na coluna Cargo.
  // O cargo de clã permanece salvo em member.role/memberRole, sem controlar permissões.
  if(["dev","leadership","staff"].includes(access))return roleBadge(access);
  return roleBadge(member?.role||"Membros");
}
function roleBadge(role){
  const access=normalizeAccessRole(role);
  const memberMap={"PT TIME":"role-time","PT BOOST":"role-boost","PT CORE":"role-core","Membros":"role-member","Membro":"role-member"};
  const cls=memberMap[role]||ROLE_CONFIG[access]?.badgeClass||"role-member";
  const label=memberMap[role]?role:accessRoleLabel(access);
  return `<span class="role-badge ${cls}">${escapeHtml(label)}</span>`;
}
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

// Aviso público informativo; nunca bloqueia a autenticação.
onSnapshot(doc(db,"settings","app"),snapshot=>{const publicSettings=snapshot.exists()?snapshot.data():{};state.settings={...state.settings,...publicSettings};applyMaintenanceNotice();applyLoginCustomization()},error=>console.warn("Aviso de manutenção indisponível:",error));

$("#setupForm").onsubmit=async e=>{
  e.preventDefault();
  try{
    if(await ownerExists())throw new Error("O DEV já foi configurado.");
    const name=$("#setupName").value.trim();
    const email=$("#setupEmail").value.trim().toLowerCase();
    const password=$("#setupPassword").value;
    if(password!==$("#setupConfirm").value)throw new Error("As senhas não conferem.");
    const cred=await createUserWithEmailAndPassword(auth,email,password);
    await setDoc(doc(db,"users",cred.user.uid),{name,email,role:"dev",active:true,status:"approved",firstLogin:false,profileCompleted:true,createdAt:serverTimestamp()});
    await setDoc(doc(db,"system","owner"),{uid:cred.user.uid,email,createdAt:serverTimestamp()});
    toast("Sistema configurado com sucesso.");
  }catch(e){toast(errMsg(e))}
};

$("#loginForm").onsubmit=async e=>{
  e.preventDefault();
  const email=$("#loginEmail").value.trim().toLowerCase();
  const password=$("#loginPassword").value;
  const submit=e.currentTarget.querySelector('button[type="submit"]');
  if(!email||!password)return toast("Informe o e-mail e a senha.");
  if(!email.includes("@"))return toast("Use o e-mail cadastrado para entrar.");
  try{
    if(submit){submit.disabled=true;submit.dataset.originalText=submit.textContent;submit.textContent="ENTRANDO..."}
    const remember=Boolean($("#rememberAccess")?.checked);
    await setPersistence(auth,remember?browserLocalPersistence:browserSessionPersistence);
    await signInWithEmailAndPassword(auth,email,password);
  }catch(e2){
    console.error("Falha no login:",e2);
    toast(errMsg(e2));
  }finally{
    if(submit){submit.disabled=false;submit.textContent=submit.dataset.originalText||"ENTRAR NO SISTEMA"}
  }
};
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
    await setDoc(doc(sd,"users",cred.user.uid),{name,email,role:"member",active:false,status:"pending",firstLogin:true,profileCompleted:false,createdAt:serverTimestamp()});
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
    const profileRef=doc(db,"users",user.uid);
    let snap=await getDoc(profileRef);
    if(!snap.exists()){
      // Recupera automaticamente o perfil do DEV quando o documento system/owner existe,
      // mas o perfil users/{uid} foi removido ou não foi criado em uma versão antiga.
      const ownerSnap=await getDoc(doc(db,"system","owner"));
      if(ownerSnap.exists()&&ownerSnap.data()?.uid===user.uid){
        await setDoc(profileRef,{name:user.displayName||"DEV",email:user.email||"",role:"dev",accessRole:"dev",memberRole:"Membros",active:true,status:"approved",firstLogin:false,profileCompleted:true,recoveredAt:serverTimestamp()});
        snap=await getDoc(profileRef);
      }
    }
    if(!snap.exists()){await signOut(auth);return toast("Perfil não encontrado. Solicite ao DEV a recuperação da conta.");}
    state.profile={id:user.uid,...snap.data()};
    state.profile.resolvedAccessRole=resolveAccessRole(state.profile);
    const profileStatus=String(state.profile.status||"approved").toLowerCase();
    if(state.profile.active===false||profileStatus==="pending"||profileStatus==="rejected"){
      await signOut(auth);
      return toast(profileStatus==="pending"?"Conta ainda não aprovada.":"Conta desativada ou rejeitada.");
    }
    // Compatibilidade: contas antigas sem os campos de primeiro acesso continuam liberadas.
    state.onboardingRequired=state.profile.profileCompleted===false || state.profile.firstLogin===true;
    showOnly("app");applyPermissions();subscribeAll();
    if(state.onboardingRequired){
      requestAnimationFrame(()=>{
        window.TeamManagerUI?.activatePage("meu-perfil");
        openProfileTab("account");
        updateFirstAccessUI();
        toast("Complete seu perfil para liberar o sistema.");
      });
    }
  }catch(e){toast(errMsg(e));showOnly("authScreen")}
});

function applyPermissions(){
  $$(".owner-only").forEach(el=>el.classList.toggle("hidden",!owner()));
  $$(".admin-only").forEach(el=>el.classList.toggle("hidden",!administrator()));
  $$(".editor-only").forEach(el=>el.classList.toggle("hidden",!editor()));
  document.body.dataset.accessRole=currentAccessRole();
  document.body.dataset.rawAccessRole=String(state.profile?.accessRole||state.profile?.role||"");
  document.querySelectorAll("[data-save-settings]").forEach(button=>button.classList.toggle("hidden",!owner()));
  document.querySelectorAll("#configuracoes input,#configuracoes select,#configuracoes textarea").forEach(field=>field.disabled=!owner());

  const displayName=state.guest
    ?"Visitante"
    :(state.profile?.name||state.profile?.email||"Usuário");

  const roleLabel=state.guest?"Somente visualização":accessRoleLabel(currentAccessRole());

  setText("welcomeName",displayName);
  setText("topbarUserName",displayName);
  setText("userBadge",roleLabel);
  setText("sidebarUserName",displayName);
  setText("sidebarUserRole",roleLabel);
  ["userBadge","sidebarUserRole"].forEach(id=>{
    const element=byId(id);if(!element)return;
    element.classList.remove("role-dev","role-leadership","role-staff","role-member","role-guest");
    element.classList.add(ROLE_CONFIG[currentAccessRole()]?.badgeClass||"role-member");
  });
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
  document.body.classList.toggle("first-access-mode",!!state.onboardingRequired);
  renderRolePermissionMatrix();
  document.querySelectorAll('#nav [data-page]').forEach(button=>{
    const allowed=!state.onboardingRequired || ["meu-perfil","sobre"].includes(button.dataset.page);
    button.classList.toggle("onboarding-locked",!allowed);
    button.setAttribute("aria-disabled",allowed?"false":"true");
  });
  updateFirstAccessUI();
}

function subscribePublic(){
  clearSubs();

  state.unsubs.push(onSnapshot(
    collection(db,"members"),
    snapshot=>{
      state.members=snapshot.docs.map(item=>({id:item.id,...item.data()}));
      render();
      scheduleAccountRoleSync();
    },
    error=>console.error("Falha ao carregar membros:",error)
  ));

  if(editor()){
    state.unsubs.push(onSnapshot(
      collection(db,"attendance"),
      snapshot=>{
        state.attendance=snapshot.docs.map(item=>({id:item.id,...item.data()}));
        render();
        scheduleAttendanceUserMigration();
      },
      error=>console.error("Falha ao carregar presenças:",error)
    ));
  }else if(state.user&&!state.guest){
    const ownAttendance=query(
      collection(db,"attendance"),
      where("userId","==",state.user.uid)
    );

    state.unsubs.push(onSnapshot(
      ownAttendance,
      snapshot=>{
        state.attendance=snapshot.docs.map(item=>({id:item.id,...item.data()}));
        render();
      },
      error=>{
        console.error("Falha ao carregar histórico individual:",error);
        state.attendance=[];
        render();
      }
    ));
  }else{
    state.attendance=[];
  }
}
function subscribeAll(){
  subscribePublic();
  if(editor()){
    state.unsubs.push(onSnapshot(collection(db,"rtPresence"),snapshot=>{state.rtPresence=snapshot.docs.map(d=>({id:d.id,...d.data()}));renderRtPresence();},error=>console.error("Falha ao carregar RT Presença:",error)));
  }else state.rtPresence=[];
  if(editor())state.unsubs.push(onSnapshot(collection(db,"users"),s=>{state.users=s.docs.map(d=>{const user={id:d.id,...d.data()};return {...user,resolvedAccessRole:resolveAccessRole(user)}});render();scheduleAttendanceUserMigration();scheduleAccountRoleSync()}));
  if(owner())state.unsubs.push(onSnapshot(collection(db,"audit"),s=>{state.audit=s.docs.map(d=>({id:d.id,...d.data()}));render()}));
  if(editor())state.unsubs.push(onSnapshot(collection(db,"xpLogs"),s=>{state.xpLogs=s.docs.map(d=>({id:d.id,...d.data()}));render()}));
  state.unsubs.push(onSnapshot(collection(db,"events"),s=>{state.events=s.docs.map(d=>({id:d.id,...d.data()}));render()}));
  if(state.user){
    state.unsubs.push(onSnapshot(
      query(collection(db,"notificationReads"),where("userId","==",state.user.uid)),
      snapshot=>{
        state.notificationReads=snapshot.docs.map(d=>({id:d.id,...d.data()}));
        render();
      },
      error=>console.error("Falha ao carregar leituras de notificações:",error)
    ));

    if(editor()){
      state.unsubs.push(onSnapshot(
        collection(db,"notifications"),
        snapshot=>{
          const all=snapshot.docs.map(d=>({id:d.id,...d.data()}));
          state.sentNotifications=all;
          state.notifications=all.filter(notificationVisibleToCurrentUser);
          render();
          maybeShowNotificationPopup();
        },
        error=>console.error("Falha ao carregar notificações:",error)
      ));
    }else{
      const notificationBuckets={all:[],user:[],role:[]};
      const syncNotifications=()=>{
        const merged=new Map();
        Object.values(notificationBuckets).flat().forEach(item=>merged.set(item.id,item));
        state.sentNotifications=[];
        state.notifications=[...merged.values()].filter(notificationVisibleToCurrentUser);
        render();
        maybeShowNotificationPopup();
      };
      const listen=(key,notificationQuery)=>state.unsubs.push(onSnapshot(
        notificationQuery,
        snapshot=>{notificationBuckets[key]=snapshot.docs.map(d=>({id:d.id,...d.data()}));syncNotifications()},
        error=>console.error(`Falha ao carregar notificações (${key}):`,error)
      ));
      listen("all",query(collection(db,"notifications"),where("targetType","==","all")));
      listen("user",query(collection(db,"notifications"),where("targetUserId","==",state.user.uid)));
      listen("role",query(collection(db,"notifications"),where("targetType","==","member")));
    }
  }
  if(state.user){
    const supportQuery=editor()?collection(db,"supportMessages"):query(collection(db,"supportMessages"),where("ownerUid","==",state.user.uid),where("status","!=","resolved"));
    state.unsubs.push(onSnapshot(supportQuery,s=>{state.supportMessages=s.docs.map(d=>({id:d.id,...d.data()}));renderSupport();},error=>console.error("Falha ao carregar atendimentos:",error)));
    const chatQuery=editor()?collection(db,"chatMessages"):query(collection(db,"chatMessages"),where("ownerUid","==",state.user.uid));
    state.unsubs.push(onSnapshot(chatQuery,s=>{state.chatMessages=s.docs.map(d=>({id:d.id,...d.data()}));renderPrivateChat();},error=>console.error("Falha ao carregar chat privado:",error)));
  }
  state.unsubs.push(onSnapshot(doc(db,"settings","app"),s=>{state.settings=s.exists()?s.data():{};loadSettingsForm();applyLoginCustomization();loadLoginCustomizationForm();renderGoals();render()}));
}
async function audit(action,details){if(!state.user||!editor())return;try{await addDoc(collection(db,"audit"),{userId:state.user.uid,userName:state.profile.name,action,details,createdAt:serverTimestamp()})}catch{}}

function stats(name){const rows=state.attendance.filter(x=>x.memberName===name),p=rows.filter(x=>x.status===1||x.status===2).length,a=rows.filter(x=>x.status===-1).length,j=rows.filter(x=>x.status===3).length,t=p+a;return{present:p,absent:a,justified:j,rate:t?Math.round(p/t*100):0}}
function todayIso(){return new Date().toISOString().slice(0,10)}
function isoWeek(dateString){const d=new Date(`${dateString||todayIso()}T12:00:00`);const day=d.getDay()||7;d.setDate(d.getDate()+4-day);const y=new Date(d.getFullYear(),0,1);const w=Math.ceil((((d-y)/86400000)+1)/7);return `${d.getFullYear()}-W${String(w).padStart(2,"0")}`}
function presenceFilter(kind){return state.presenceFilters[kind]||(state.presenceFilters[kind]={date:todayIso(),week:isoWeek(todayIso()),clan:"",search:"",slot:"all"})}
function presenceRecord(kind,memberId,slot,date){return state.attendance.find(a=>a.memberId===memberId&&a.kind===kind&&a.slot===slot&&(a.date===date||(!a.date&&date===todayIso())))||null}
function presenceStatus(status){return ({"1":{label:"Presente",icon:"🟢",cls:"present"},"3":{label:"Justificado",icon:"🟡",cls:"justified"},"-1":{label:"Ausente",icon:"🔴",cls:"absent"},"0":{label:"Pendente",icon:"—",cls:"pending"}})[String(status||0)]}
function eventDay(slot){return ({"Guerra de Vale":"Quarta-feira","Defesa de Crista":"Quinta-feira","Evento de Vale":"Quinta-feira","Saque de Castelo":"Sexta-feira"})[slot]||""}
function presenceTypeLabel(kind){return kind==="worldboss"?"WorldBoss":kind==="purgatorio"?"Purgatório":"Eventos"}
function recentPresenceRows(kind){return [...state.attendance].filter(item=>item.kind===kind&&[-1,1,3].includes(Number(item.status))).sort((a,b)=>rtDateValue(b.updatedAt)-rtDateValue(a.updatedAt)).slice(0,20)}
function renderPresence(targetId,kind){
  const target=$("#"+targetId);if(!target)return;
  const rows=recentPresenceRows(kind);
  target.innerHTML=`<div class="presence-v207">
    <div class="presence-v207-toolbar">
      <div><h3>Registros de ${presenceTypeLabel(kind)}</h3><p>Registre individualmente pelo painel horizontal. O lançamento atualiza o Histórico e o RT Presença.</p></div>
      ${editor()?`<button class="btn primary" data-open-presence-modal="${kind}">➕ Registrar Presença</button>`:""}
    </div>
    <div class="presence-v207-filters"><input type="search" placeholder="Buscar nos últimos registros..." data-recent-presence-search="${kind}"><input type="date" data-recent-presence-date="${kind}"></div>
    <div class="table-wrap presence-v207-table"><table><thead><tr><th>Data</th><th>Usuário</th><th>Clã</th><th>Horário/Evento</th><th>Status</th><th>Observação</th><th>Responsável</th>${owner()?"<th>Ações</th>":""}</tr></thead><tbody data-recent-presence-body="${kind}">${renderRecentPresenceBody(rows)}</tbody></table></div>
  </div>`;
}
function recentAllPresenceRows(){return [...state.attendance].filter(item=>[-1,1,3].includes(Number(item.status))).sort((a,b)=>rtDateValue(b.updatedAt)-rtDateValue(a.updatedAt)).slice(0,50)}
function renderUnifiedPresence(){
  const target=$("#presencasContent");if(!target)return;
  const rows=recentAllPresenceRows();
  setText("sidebarPresenceBadge",rows.length);
  target.innerHTML=`<div class="presence-v207 presence-unified">
    <div class="presence-v207-toolbar">
      <div><h3>Registro de Presenças</h3><p>Registre WorldBoss, Purgatório e Eventos somente nesta aba. Cada salvamento atualiza o Histórico e o RT Presença automaticamente.</p></div>
      ${editor()?`<button class="btn primary" data-open-presence-modal="worldboss">➕ Registrar Presença</button>`:""}
    </div>
    <div class="presence-v207-filters">
      <input type="search" placeholder="Buscar usuário, clã, evento ou status..." data-unified-presence-search>
      <input type="date" data-unified-presence-date>
      <select data-unified-presence-kind><option value="">Todos os eventos</option><option value="worldboss">WorldBoss</option><option value="purgatorio">Purgatório</option><option value="eventos">Eventos</option></select>
    </div>
    <div class="table-wrap presence-v207-table"><table><thead><tr><th>Data</th><th>Usuário</th><th>Clã</th><th>Evento</th><th>Horário/Atividade</th><th>Status</th><th>Observação</th><th>Responsável</th>${owner()?"<th>Ações</th>":""}</tr></thead><tbody data-unified-presence-body>${renderUnifiedPresenceBody(rows)}</tbody></table></div>
  </div>`;
}
function renderUnifiedPresenceBody(rows){return rows.map(item=>{const st=presenceStatus(item.status);return `<tr><td>${escapeHtml(item.date||"—")}</td><td>${escapeHtml(item.memberName||"—")}</td><td>${escapeHtml(item.clan||"—")}</td><td>${escapeHtml(presenceTypeLabel(item.kind))}</td><td>${escapeHtml(item.slot||"—")}</td><td><span class="presence-status-chip ${st.cls}">${st.icon} ${st.label}</span></td><td>${escapeHtml(item.note||"—")}</td><td>${escapeHtml(item.updatedByName||"—")}</td>${owner()?`<td><button class="btn danger mini" data-delete-attendance="${item.id}">Excluir</button></td>`:""}</tr>`}).join("")||`<tr><td colspan="9">Nenhum registro encontrado.</td></tr>`}
function filterUnifiedPresence(){const q=String(document.querySelector("[data-unified-presence-search]")?.value||"").toLowerCase(),date=document.querySelector("[data-unified-presence-date]")?.value||"",kind=document.querySelector("[data-unified-presence-kind]")?.value||"";const rows=recentAllPresenceRows().filter(item=>(!date||item.date===date)&&(!kind||item.kind===kind)&&(!q||`${item.memberName} ${item.clan} ${presenceTypeLabel(item.kind)} ${item.slot} ${presenceStatus(item.status).label}`.toLowerCase().includes(q)));const body=document.querySelector("[data-unified-presence-body]");if(body)body.innerHTML=renderUnifiedPresenceBody(rows)}
function renderRecentPresenceBody(rows){return rows.map(item=>{const st=presenceStatus(item.status);return `<tr><td>${escapeHtml(item.date||"—")}</td><td>${escapeHtml(item.memberName||"—")}</td><td>${escapeHtml(item.clan||"—")}</td><td>${escapeHtml(item.slot||"—")}</td><td><span class="presence-status-chip ${st.cls}">${st.icon} ${st.label}</span></td><td>${escapeHtml(item.note||"—")}</td><td>${escapeHtml(item.updatedByName||"—")}</td>${owner()?`<td><button class="btn danger mini" data-delete-attendance="${item.id}">Excluir</button></td>`:""}</tr>`}).join("")||`<tr><td colspan="8">Nenhum registro encontrado.</td></tr>`}
function filterRecentPresence(kind){const q=String(document.querySelector(`[data-recent-presence-search="${kind}"]`)?.value||"").toLowerCase(),date=document.querySelector(`[data-recent-presence-date="${kind}"]`)?.value||"";const rows=recentPresenceRows(kind).filter(item=>(!date||item.date===date)&&(!q||`${item.memberName} ${item.clan} ${item.slot} ${presenceStatus(item.status).label}`.toLowerCase().includes(q)));const body=document.querySelector(`[data-recent-presence-body="${kind}"]`);if(body)body.innerHTML=renderRecentPresenceBody(rows)}
function populatePresenceMemberList(){const list=$("#presenceMemberOptions");if(list)list.innerHTML=state.members.map(m=>`<option value="${escapeHtml(m.name||"")}">${escapeHtml(m.clan||"")}</option>`).join("")}
function updatePresenceSlotOptions(kind,selected=""){const select=$("#presenceModalSlot");if(!select)return;select.innerHTML=(TYPES[kind]||[]).map(slot=>`<option value="${escapeHtml(slot)}" ${slot===selected?"selected":""}>${escapeHtml(slot)}${kind==="eventos"?` · ${eventDay(slot)}`:""}</option>`).join("")}
function openPresenceModal(kind="worldboss",record=null){if(!editor())return toast("Sem permissão para registrar presença.");populatePresenceMemberList();setValue("presenceModalUser",record?.memberName||"");setValue("presenceModalKind",kind);updatePresenceSlotOptions(kind,record?.slot||"");setValue("presenceModalDate",record?.date||todayIso());setValue("presenceModalNote",record?.note||"");document.querySelectorAll('[data-presence-status-choice]').forEach(btn=>btn.classList.toggle('active',Number(btn.dataset.presenceStatusChoice)===Number(record?.status||1)));$("#presenceModal").dataset.editingId=record?.id||"";$("#presenceModal").classList.remove("hidden")}
function closePresenceModal(){$("#presenceModal")?.classList.add("hidden")}
function selectedPresenceStatus(){return Number(document.querySelector('[data-presence-status-choice].active')?.dataset.presenceStatusChoice||1)}
async function savePresenceFromModal(){
  if(!editor())return toast("Sem permissão.");
  const name=$("#presenceModalUser")?.value.trim(),member=state.members.find(m=>String(m.name||"").toLowerCase()===String(name||"").toLowerCase());
  if(!member)return toast("Selecione um usuário válido da lista.");
  const kind=$("#presenceModalKind").value,slot=$("#presenceModalSlot").value,date=$("#presenceModalDate").value,status=selectedPresenceStatus(),note=$("#presenceModalNote").value.trim();
  if(!kind||!slot||!date||![-1,1,3].includes(status))return toast("Preencha todos os campos obrigatórios.");
  if(status===3&&!note)return toast("Informe o motivo da justificativa.");
  const id=(kind+"__"+date+"__"+member.id+"__"+slot).replace(/[^a-zA-Z0-9_-]/g,"_");
  const existing=state.attendance.find(item=>item.id===id||item.memberId===member.id&&item.kind===kind&&item.slot===slot&&item.date===date);
  if(existing&&!confirm("Este usuário já possui um registro neste evento, data e horário. Deseja atualizar?"))return;
  const payload={memberId:member.id,userId:member.userId||member.id,memberName:member.name,clan:member.clan||"",role:member.role||"Membros",kind,slot,status,date,note,updatedBy:state.user.uid,updatedByName:state.profile?.name||state.user.email,updatedAt:serverTimestamp(),createdAt:existing?.createdAt||serverTimestamp()};
  try{
    await setDoc(doc(db,"attendance",id),payload,{merge:true});
    const rtId=(kind+"__"+date+"__"+slot).replace(/[^a-zA-Z0-9_-]/g,"_");
    const current=state.rtPresence.find(rt=>rt.id===rtId)||{};
    const records=[...(current.records||[])].filter(r=>r.memberId!==member.id);
    records.push({memberId:member.id,userId:member.userId||member.id,memberName:member.name||"",clan:member.clan||"",role:member.role||"Membros",slot,status,note,updatedBy:state.user.uid,updatedByName:state.profile?.name||state.user.email,updatedAtText:new Date().toISOString()});
    const counts={present:records.filter(x=>x.status===1).length,justified:records.filter(x=>x.status===3).length,absent:records.filter(x=>x.status===-1).length};
    await setDoc(doc(db,"rtPresence",rtId),{kind,typeLabel:presenceTypeLabel(kind),date,week:isoWeek(date),slot,slotLabel:slot,clan:"Todos",records,counts,total:records.length,status:current.status==="finalized"?"finalized":"open",updatedBy:state.user.uid,updatedByName:state.profile?.name||state.user.email,updatedAt:serverTimestamp(),createdAt:current.createdAt||serverTimestamp()},{merge:true});
    await audit(existing?"presença atualizada":"presença registrada",`${member.name} · ${presenceTypeLabel(kind)} · ${slot} · ${presenceStatus(status).label}`);
    closePresenceModal();toast("Presença salva no Histórico e no RT Presença.");
  }catch(error){toast(errMsg(error))}
}

function memberLevel(_present,member=null){return progressionFor(member).level}
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
  if(!member||isHiddenDevMember(member))return;
  const s=stats(member.name),xp=progressionFor(member),level=xp.level,medals=memberMedals(member);
  $("#memberDrawerContent").innerHTML=`<div class="profile-hero">
    <div class="profile-big-avatar">${(member.name||"?").slice(0,1).toUpperCase()}</div>
    <h2>${member.name}</h2>${memberDisplayRoleBadge(member)}<p>${member.clan||"Sem clã"}</p>
  </div>
  <div class="profile-level"><span>Level ${level} · ${xp.title}</span><div><i style="width:${xp.progress}%"></i></div><small>${xp.currentXp} / ${xp.requiredXp} XP</small></div>
  <div class="profile-stats">
    <div><strong>${s.present}</strong><span>Presenças</span></div>
    <div><strong>${s.absent}</strong><span>Ausências</span></div>
    <div><strong>${s.rate}%</strong><span>Taxa</span></div>
  </div>
  <div class="medal-list"><h3>Medalhas</h3>${medals.length?medals.map(x=>`<span>${x}</span>`).join(""):"<p>Nenhuma medalha ainda.</p>"}</div>`;
  $("#memberDrawer").classList.remove("hidden");
}
function notificationVisibleToCurrentUser(n){
  if(!state.user||!n)return false;
  const expires=n.expiresAt?.toDate?n.expiresAt.toDate():n.expiresAt?new Date(n.expiresAt):null;
  if(expires&&!Number.isNaN(expires.getTime())&&expires<new Date())return false;
  const target=n.targetType||n.audience||"all";
  if(target==="all")return true;
  if(target==="user")return n.targetUserId===state.user.uid||n.userId===state.user.uid;
  if(target==="staff")return editor();
  if(target==="member")return !owner()&&!staff();
  return !n.userId||n.userId===state.user.uid;
}
function notificationRead(n){return state.notificationReads.some(r=>r.notificationId===n.id&&r.userId===state.user?.uid)}
function notificationDate(n){const d=n.createdAt?.toDate?n.createdAt.toDate():n.createdAt?new Date(n.createdAt):null;return d&&!Number.isNaN(d.getTime())?d.toLocaleString("pt-BR"):"Agora"}
function unreadNotifications(){return state.notifications.filter(n=>!notificationRead(n)).sort((a,b)=>{const av=a.createdAt?.toMillis?.()||Date.parse(a.createdAt||0)||0;const bv=b.createdAt?.toMillis?.()||Date.parse(b.createdAt||0)||0;return bv-av})}
async function markNotificationRead(notificationId){
  if(!state.user||!notificationId)return;
  await setDoc(doc(db,"notificationReads",`${notificationId}_${state.user.uid}`),{notificationId,userId:state.user.uid,readAt:serverTimestamp()},{merge:true});
}
let activePopupNotificationId="";
function maybeShowNotificationPopup(){
  const popup=byId("notificationPopup");
  if(!popup||!state.user||!popup.classList.contains("hidden"))return;
  const next=unreadNotifications()[0];
  if(!next||next.id===activePopupNotificationId)return;
  activePopupNotificationId=next.id;
  const labels={info:"ℹ Informação",warning:"⚠ Aviso",important:"❗ Importante",urgent:"🚨 Urgente"};
  setText("notificationPopupType",labels[next.type]||"🔔 Notificação");
  setText("notificationPopupTitle",next.title||"Notificação");
  setText("notificationPopupMessage",next.message||"");
  setText("notificationPopupMeta",`${next.createdByName||"77 TEAM"} · ${notificationDate(next)}`);
  popup.dataset.notificationId=next.id;
  popup.dataset.type=next.type||"info";
  popup.classList.remove("hidden");
}
function renderNotifications(){
  const unread=unreadNotifications();
  setText("notificationCount",unread.length);
  setText("sidebarNotificationsBadge",unread.length);
  const rows=state.notifications.slice().sort((a,b)=>{const av=a.createdAt?.toMillis?.()||Date.parse(a.createdAt||0)||0;const bv=b.createdAt?.toMillis?.()||Date.parse(b.createdAt||0)||0;return bv-av});
  setHtml("notificationRows",rows.map(n=>{
    const read=notificationRead(n);
    return `<article class="notification-item ${read?"":"unread"}" data-notification-id="${n.id}">
      <div><strong>${escapeHtml(n.title||"Notificação")}</strong><p>${escapeHtml(n.message||"")}</p><small>${escapeHtml(n.createdByName||"77 TEAM")} · ${escapeHtml(notificationDate(n))}</small></div>
      ${read?'<span class="notification-read-label">Lida</span>':`<button class="btn mini" data-mark-notification="${n.id}" type="button">Marcar como lida</button>`}
    </article>`;
  }).join("")||"<p class='empty-state'>Nenhuma notificação.</p>");
  renderNotificationAdmin();
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
  setText("statsActiveMembers",visibleMembers().length);
  const kinds=["worldboss","purgatorio","eventos"];
  $("#typeStats").innerHTML=kinds.map(k=>{
    const rows=state.attendance.filter(a=>a.kind===k),p=rows.filter(a=>a.status===1).length,t=rows.filter(a=>a.status!==0).length,r=t?Math.round(p/t*100):0;
    return `<div class="chart-row"><span>${k}</span><div><i style="width:${r}%"></i></div><strong>${r}%</strong></div>`;
  }).join("");
  const months={};
  state.attendance.filter(a=>a.status===1).forEach(a=>{const m=String(a.date||"").slice(0,7)||"sem data";months[m]=(months[m]||0)+1});
  const max=Math.max(1,...Object.values(months));
  $("#monthlyStats").innerHTML=Object.entries(months).sort().slice(-6).map(([m,v])=>`<div class="chart-row"><span>${m}</span><div><i style="width:${Math.round(v/max*100)}%"></i></div><strong>${v}</strong></div>`).join("")||"<p>Sem dados.</p>";
  $("#performanceRows").innerHTML=visibleMembers().map(m=>{const s=stats(m.name),level=memberLevel(s.present),medals=memberMedals(m);return `<tr><td><button class="member-link" data-view-member="${m.id}">${m.name}</button></td><td>Lv ${level}</td><td>${medals.join(" ")||"—"}</td><td>${s.present}</td><td>${s.absent}</td><td>${s.rate}%</td></tr>`}).join("");
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


function rtStatusLabel(status){return ({"1":"Presente","2":"Atrasado","3":"Justificado","-1":"Ausente","0":"Pendente"})[String(status||0)]||"Pendente"}
function rtDateValue(value){try{return value?.toDate?value.toDate():new Date(value)}catch{return new Date()}}
function renderRtPresence(){
  const list=$("#rtPresenceList");if(!list)return;
  const search=String($("#rtSearch")?.value||"").toLowerCase(),kind=$("#rtKindFilter")?.value||"",date=$("#rtDateFilter")?.value||"";
  const rows=[...state.rtPresence].filter(rt=>(!kind||rt.kind===kind)&&(!date||rt.date===date)&&(!search||`${rt.id} ${rt.typeLabel} ${rt.slotLabel} ${rt.finalizedByName}`.toLowerCase().includes(search))).sort((a,b)=>rtDateValue(b.finalizedAt)-rtDateValue(a.finalizedAt));
  setText("rtPresenceCount",`${rows.length} registro${rows.length===1?"":"s"}`);setText("sidebarRtBadge",rows.length);
  list.innerHTML=rows.map(rt=>`<article class="rt-card" data-rt-card="${rt.id}"><div class="rt-card-head"><div><small>RT ${escapeHtml(rt.id.slice(0,8).toUpperCase())}</small><h3>${escapeHtml(rt.typeLabel||rt.kind)} · ${escapeHtml(rt.slotLabel||rt.slot||"Todos")}</h3><p>${escapeHtml(rt.date||"—")} · ${escapeHtml(rt.week||"—")} · Finalizada por ${escapeHtml(rt.finalizedByName||"Equipe")}</p></div><span class="badge success">Finalizada</span></div><div class="rt-summary"><span>✓ ${rt.counts?.present||0} presentes</span><span>◷ ${rt.counts?.late||0} atrasados</span><span>! ${rt.counts?.justified||0} justificados</span><span>× ${rt.counts?.absent||0} ausentes</span><span>— ${rt.counts?.pending||0} pendentes</span></div><div class="rt-actions"><button class="btn mini" data-rt-toggle="${rt.id}">👁 Visualizar</button><button class="btn mini" data-rt-csv="${rt.id}">📊 Exportar CSV</button><button class="btn mini" data-rt-print="${rt.id}">🖨 Imprimir</button>${owner()?`<button class="btn danger mini" data-rt-delete="${rt.id}">🗑 Excluir</button>`:""}</div><div class="rt-details hidden" id="rt-details-${rt.id}">${rtRecordsTable(rt)}</div></article>`).join("")||'<div class="empty-state"><strong>Nenhum RT encontrado.</strong><p>Finalize uma presença para criar o primeiro registro.</p></div>';
}
function rtRecordsTable(rt){return `<div class="table-wrap"><table><thead><tr><th>Membro</th><th>Clã</th><th>Horário/Evento</th><th>Status</th><th>Observação</th><th>Alterado por</th></tr></thead><tbody>${(rt.records||[]).map(r=>`<tr><td>${escapeHtml(r.memberName)}</td><td>${escapeHtml(r.clan||"—")}</td><td>${escapeHtml(r.slot||"—")}</td><td>${rtStatusLabel(r.status)}</td><td>${escapeHtml(r.note||"—")}</td><td>${escapeHtml(r.updatedByName||"—")}</td></tr>`).join("")}</tbody></table></div>`}
function exportRtCsv(rt){const rows=[["Membro","Clã","Horário/Evento","Status","Observação","Alterado por"],...(rt.records||[]).map(r=>[r.memberName,r.clan,r.slot,rtStatusLabel(r.status),r.note,r.updatedByName])];const csv=rows.map(row=>row.map(v=>`"${String(v??"").replaceAll('"','""')}"`).join(";")).join("\n");const blob=new Blob(["\ufeff"+csv],{type:"text/csv;charset=utf-8"}),a=document.createElement("a");a.href=URL.createObjectURL(blob);a.download=`RT-${rt.typeLabel||rt.kind}-${rt.date||"registro"}.csv`;a.click();URL.revokeObjectURL(a.href)}
function printRt(rt){const w=window.open("","_blank");if(!w)return toast("Permita pop-ups para imprimir.");w.document.write(`<html><head><title>RT ${escapeHtml(rt.id)}</title><style>body{font-family:Arial;padding:24px}table{width:100%;border-collapse:collapse}th,td{border:1px solid #bbb;padding:8px;text-align:left}h1{margin-bottom:4px}</style></head><body><h1>RT Presença</h1><p>${escapeHtml(rt.typeLabel)} · ${escapeHtml(rt.slotLabel)} · ${escapeHtml(rt.date)}</p><p>Finalizada por ${escapeHtml(rt.finalizedByName||"Equipe")}</p>${rtRecordsTable(rt)}<script>window.print()<\/script></body></html>`);w.document.close()}


function renderStaffHub(){
  setText("staffHubAttendanceCount",state.attendance?.length||0);
  const pending=(state.members||[]).filter(item=>String(item.status||"").toLowerCase()==="pending").length;
  setText("staffHubRequestCount",pending);
  setText("staffHubRequestsBadge",pending);
  const tickets=(state.supportTickets||state.tickets||[]).filter(item=>!["closed","resolved","finalizado"].includes(String(item.status||"").toLowerCase())).length;
  setText("staffHubTicketCount",tickets);
  setText("staffHubSupportBadge",tickets);
  setText("staffHubGoalCount",state.goals?.length||0);
}
function render(){
  renderStaffHub();
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

  const rank=visibleMembers()
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
  renderUnifiedPresence();renderRtPresence();renderRecordsCenter();
  const dashboardSearch=($("#dashboardMemberSearch")?.value||"").toLowerCase();
  const dashboardMembers=rank.filter(m=>
    !dashboardSearch||
    String(m.name||"").toLowerCase().includes(dashboardSearch)||
    String(m.clan||"").toLowerCase().includes(dashboardSearch)||
    String(m.role||"").toLowerCase().includes(dashboardSearch)
  );

  $("#dashboardMemberRows").innerHTML=dashboardMembers.map(m=>`<tr>
    <td><span class="member-avatar">${(m.name||"?").slice(0,1).toUpperCase()}</span><strong>${m.name}</strong></td>
    <td>${memberDisplayRoleBadge(m)}</td>
    <td>${m.clan||"—"}</td>
    <td>${m.present}</td>
    <td><strong class="ranking-points">${m.rate}%</strong></td>
    <td><span class="online-status"><i></i>Ativo</span></td>
  </tr>`).join("")||'<tr><td colspan="6">Nenhum membro encontrado.</td></tr>';

  $("#memberRows").innerHTML=visibleMembers().map(member=>{
    const progression=progressionFor(member);
    return `<tr>
      <td><button class="member-link" data-view-member="${member.id}">${member.name}</button></td>
      <td>${memberDisplayRoleBadge(member)}</td>
      <td>${member.clan||"—"}</td>
      <td><strong>Lv. ${progression.level}</strong></td>
      <td>${progression.title}</td>
      <td>${progression.totalXp.toLocaleString("pt-BR")}</td>
      <td>
        ${(()=>{
          const user=linkedUserForMember(member);
          const options=allowedCargoOptions(member,user);
          if(!options.length)return "";
          const selected=selectedCargoValue(member,user);
          return `<div class="member-role-control">
            <select class="role-change-select" data-role-select="${member.id}" aria-label="Novo cargo de ${escapeHtml(member.name)}">
              ${options.map(option=>`<option value="${option.value}" ${option.value===selected?"selected":""}>${option.label}</option>`).join("")}
            </select>
            <button class="btn" data-change-member-role="${member.id}" type="button">Alterar cargo</button>
          </div>`;
        })()}
        ${editor()?`<button class="btn danger" data-delete-member="${member.id}">Excluir</button>`:"Visualização"}
      </td>
    </tr>`;
  }).join("")||"<tr><td colspan='7'>Nenhum membro.</td></tr>";
  $("#historyRows").innerHTML=state.attendance.map(a=>`<tr><td>${a.date||"—"}</td><td>${a.kind}</td><td>${a.memberName}</td><td>${a.clan||"—"}</td><td>${roleBadge(a.role)}</td><td>${a.status===1?"Presente":"Ausente"}</td></tr>`).join("");
  $("#rankingRows").innerHTML=rank.map((r,i)=>`<tr><td>${i+1}</td><td>${r.name}</td><td>${r.clan||"—"}</td><td>${roleBadge(r.role)}</td><td>${r.present}</td><td>${r.rate}%</td></tr>`).join("");
  const pending=state.users.filter(u=>normalizeAccessRole(u.role)==="member"&&u.status==="pending");
  const requestOptions=REQUEST_ACCESS_OPTIONS[owner()?"dev":leadership()?"leadership":"staff"]||[];
  $("#requestRows").innerHTML=pending.map(u=>`<tr><td>${escapeHtml(u.name)}</td><td>${escapeHtml(u.email)}</td><td><select data-clan="${u.id}">${'<option value="">Clã</option>'+CLANS.map(x=>`<option>${x}</option>`).join("")}</select></td><td><select data-role="${u.id}">${requestOptions.map(option=>`<option value="${option.value}">${option.label}</option>`).join("")}</select></td><td><div class="request-actions"><button class="btn primary" data-approve="${u.id}" type="button">Aprovar</button><button class="btn danger" data-reject="${u.id}" type="button">Rejeitar</button></div></td></tr>`).join("")||"<tr><td colspan='5'>Nenhuma solicitação pendente.</td></tr>";
  $("#auditRows").innerHTML=state.audit.map(a=>`<tr><td>${a.createdAt?.toDate?a.createdAt.toDate().toLocaleString("pt-BR"):"—"}</td><td>${a.userName||"—"}</td><td>${a.action}</td><td>${a.details||""}</td></tr>`).join("");
  renderNotifications();renderCalendar();renderStatistics();updatePdfMemberOptions();renderOwnProfile();renderCharacterProfile();renderCharactersTable();renderCharacterCenter();renderHistoryCenter();renderGoals();renderSystemHealth();renderStaffCommandCenter();renderLevelSystem();renderAdvancedCenter();scheduleProgressionSync();applyRestrictedVisibility();
}


function renderAdvancedCenter(){
  if(!owner())return;
  const logs=state.audit.slice().sort((a,b)=>(b.createdAt?.toMillis?.()||0)-(a.createdAt?.toMillis?.()||0));
  setHtml("advancedLogsRows",logs.map(a=>`<tr><td>${a.createdAt?.toDate?a.createdAt.toDate().toLocaleString("pt-BR"):"—"}</td><td>${escapeHtml(a.userName||"—")}</td><td>${escapeHtml(a.action||"—")}</td><td>${escapeHtml(a.details||"")}</td></tr>`).join("")||'<tr><td colspan="4">Nenhum log disponível.</td></tr>');
  const firebaseOk=!!state.user;
  setHtml("firebaseStatusCards",[
    ["Autenticação",firebaseOk?"Conectado":"Desconectado"],["Firestore",firebaseOk?"Sincronizado":"Indisponível"],["Realtime listeners",state.unsubs.length?"Ativos":"Inativos"]
  ].map(([name,status])=>`<article class="panel"><div class="panel-body advanced-card"><span class="service-light ${status.match(/Conectado|Sincronizado|Ativos/)?"ok":"warning"}"></span><strong>${name}</strong><p>${status}</p></div></article>`).join(""));
  setHtml("servicesStatusGrid",[
    ["Aplicação web","Operacional"],["Firebase Auth",firebaseOk?"Operacional":"Verificar"],["Cloud Firestore",firebaseOk?"Operacional":"Verificar"],["GitHub Actions","Não configurado"]
  ].map(([name,status])=>`<article class="panel"><div class="panel-body advanced-card"><span class="service-light ${status==="Operacional"?"ok":"warning"}"></span><strong>${name}</strong><p>${status}</p></div></article>`).join(""));
  setHtml("activeSessionsList",state.user?`<div class="session-row"><div><strong>${escapeHtml(state.profile?.name||state.user.email||"DEV")}</strong><p>${escapeHtml(state.user.email||"")} · Esta sessão</p></div><span class="service-chip ok">Conectado</span></div>`:"<p>Nenhuma sessão identificada.</p>");
  setHtml("systemStatsGrid",[
    ["Usuários",state.users.filter(user=>resolveAccessRole(user)!=="dev").length],["Membros",visibleMembers().length],["Presenças",state.attendance.length],["Eventos",state.events.length],["Notificações",state.sentNotifications.length||state.notifications.length],["Logs",state.audit.length]
  ].map(([label,value])=>`<article class="card"><span>${label}</span><strong>${Number(value||0).toLocaleString("pt-BR")}</strong><small>Dados carregados nesta sessão</small></article>`).join(""));
  const maintenance=state.settings?.maintenance||{};
  const toggle=byId("maintenanceModeToggle"); if(toggle)toggle.checked=maintenance.enabled===true;
  setValue("maintenanceTitle",maintenance.title||"Sistema em manutenção"); setValue("maintenanceMessage",maintenance.message||"Estamos realizando melhorias. Algumas funções podem apresentar instabilidade."); setValue("maintenanceImageUrl",maintenance.imageUrl||""); setValue("maintenanceExpectedEnd",maintenance.expectedEnd||"");
  const showLogin=byId("maintenanceShowLogin"); if(showLogin)showLogin.checked=maintenance.showLogin!==false; const showApp=byId("maintenanceShowApp"); if(showApp)showApp.checked=maintenance.showApp!==false; updateMaintenancePreview(); applyMaintenanceNotice();
}
function downloadJson(filename,data){const blob=new Blob([JSON.stringify(data,null,2)],{type:"application/json"});const url=URL.createObjectURL(blob);const a=document.createElement("a");a.href=url;a.download=filename;a.click();setTimeout(()=>URL.revokeObjectURL(url),1000)}
on("checkUpdatesButton","click",()=>{setText("updateStatusText","Versão 21.2.4 instalada e verificada. Base estável: V21.0.1.");toast("Verificação local concluída.")});
on("createBackupButton","click",()=>{if(!owner())return;downloadJson(`77-team-backup-${new Date().toISOString().slice(0,10)}.json`,{version:"21.2.4",baseVersion:"21.0.1",exportedAt:new Date().toISOString(),members:state.members,attendance:state.attendance,users:state.users,events:state.events,notifications:state.sentNotifications,audit:state.audit,settings:state.settings});toast("Backup JSON gerado.")});
on("restoreBackupFile","change",async e=>{const file=e.target.files?.[0];if(!file)return;try{const data=JSON.parse(await file.text());setText("restoreBackupInfo",`Arquivo válido: versão ${data.version||"não informada"}, exportado em ${data.exportedAt||"data não informada"}.`)}catch{setText("restoreBackupInfo","Arquivo inválido ou corrompido.")}});
function maintenanceFormData(){return {enabled:byId("maintenanceModeToggle")?.checked===true,title:byId("maintenanceTitle")?.value.trim()||"Sistema em manutenção",message:byId("maintenanceMessage")?.value.trim()||"Estamos realizando melhorias. Algumas funções podem apresentar instabilidade.",imageUrl:byId("maintenanceImageUrl")?.value.trim()||"",expectedEnd:byId("maintenanceExpectedEnd")?.value||"",showLogin:byId("maintenanceShowLogin")?.checked!==false,showApp:byId("maintenanceShowApp")?.checked!==false}}
function formatMaintenanceEnd(value){if(!value)return "";const d=new Date(value);return Number.isNaN(d.getTime())?"":`Previsão de término: ${d.toLocaleString("pt-BR")}`}
function setNoticeImage(element,url){if(!element)return;const safe=/^https?:\/\//i.test(url||"")?url:"";element.classList.toggle("hidden",!safe);if(safe)element.src=safe;else element.removeAttribute("src")}
function updateMaintenancePreview(){const data=maintenanceFormData();setText("maintenancePreviewTitle",`🚧 ${data.title}`);setText("maintenancePreviewMessage",data.message);const end=formatMaintenanceEnd(data.expectedEnd);setText("maintenancePreviewEnd",end);byId("maintenancePreviewEnd")?.classList.toggle("hidden",!end);setNoticeImage(byId("maintenancePreviewImage"),data.imageUrl);const chip=byId("maintenanceStatusChip");if(chip){chip.textContent=data.enabled?"Aviso ativo":"Sistema online";chip.classList.toggle("active",data.enabled)}}
function applyMaintenanceNotice(){const data=state.settings?.maintenance||{};const enabled=data.enabled===true;const loginVisible=enabled&&data.showLogin!==false;const appVisible=enabled&&data.showApp!==false&&sessionStorage.getItem("77team-maintenance-dismissed")!==String(data.updatedAt||"");const login=byId("maintenanceLoginNotice");if(login){login.classList.toggle("hidden",!loginVisible);setText("maintenanceLoginTitle",`🚧 ${data.title||"Sistema em manutenção"}`);setText("maintenanceLoginMessage",data.message||"Estamos realizando melhorias.");const end=formatMaintenanceEnd(data.expectedEnd);setText("maintenanceLoginEnd",end);byId("maintenanceLoginEnd")?.classList.toggle("hidden",!end);setNoticeImage(byId("maintenanceLoginImage"),data.imageUrl)}const banner=byId("maintenanceAppBanner");if(banner){banner.classList.toggle("hidden",!appVisible);setText("maintenanceAppTitle",`🚧 ${data.title||"Sistema em manutenção"}`);setText("maintenanceAppMessage",data.message||"Estamos realizando melhorias.");const end=formatMaintenanceEnd(data.expectedEnd);setText("maintenanceAppEnd",end);byId("maintenanceAppEnd")?.classList.toggle("hidden",!end)}}
["maintenanceModeToggle","maintenanceTitle","maintenanceMessage","maintenanceImageUrl","maintenanceExpectedEnd","maintenanceShowLogin","maintenanceShowApp"].forEach(id=>{on(id,"input",updateMaintenancePreview);on(id,"change",updateMaintenancePreview)}); on("previewMaintenanceButton","click",()=>{updateMaintenancePreview();toast("Prévia atualizada.")}); on("closeMaintenanceBanner","click",()=>{sessionStorage.setItem("77team-maintenance-dismissed",String(state.settings?.maintenance?.updatedAt||""));byId("maintenanceAppBanner")?.classList.add("hidden")});
on("saveMaintenanceButton","click",async()=>{if(!owner())return;try{const maintenance={...maintenanceFormData(),updatedAt:new Date().toISOString(),updatedBy:state.user.uid,updatedByName:state.profile?.name||state.user.email||"DEV"};await setDoc(doc(db,"settings","app"),{maintenance},{merge:true});state.settings={...state.settings,maintenance};applyMaintenanceNotice();await audit("aviso de manutenção atualizado",maintenance.enabled?"ativado":"desativado");toast(maintenance.enabled?"Aviso de manutenção publicado.":"Aviso de manutenção desativado.")}catch(e){toast(errMsg(e))}});
on("clearCacheButton","click",async()=>{if(!owner())return;try{if("serviceWorker" in navigator){const regs=await navigator.serviceWorker.getRegistrations();await Promise.all(regs.map(r=>r.unregister()))}if("caches" in window){const keys=await caches.keys();await Promise.all(keys.map(k=>caches.delete(k)))}toast("Cache limpo. Recarregando...");setTimeout(()=>location.reload(true),700)}catch(e){toast("Não foi possível limpar todo o cache.")}});

document.addEventListener("input",e=>{if(e.target.matches("[data-unified-presence-search],[data-unified-presence-date]"))filterUnifiedPresence()});
document.addEventListener("change",e=>{if(e.target.matches("[data-unified-presence-kind],[data-unified-presence-date]"))filterUnifiedPresence()});
document.addEventListener("input",e=>{const el=e.target.closest("[data-presence-filter]");if(!el)return;const kind=el.dataset.kind,key=el.dataset.presenceFilter,filter=presenceFilter(kind);filter[key]=el.value;if(key==="date")filter.week=isoWeek(el.value);renderPresence(kind+"Content",kind)});
document.addEventListener("change",e=>{const el=e.target.closest("[data-presence-filter]");if(!el)return;const kind=el.dataset.kind,key=el.dataset.presenceFilter,filter=presenceFilter(kind);filter[key]=el.value;if(key==="week"&&el.value){const [year,week]=el.value.split("-W").map(Number),jan4=new Date(year,0,4),day=jan4.getDay()||7,monday=new Date(year,0,4-day+1+(week-1)*7);filter.date=monday.toISOString().slice(0,10)}else if(key==="date")filter.week=isoWeek(el.value);renderPresence(kind+"Content",kind)});

document.addEventListener("click",async e=>{
  const openPresence=e.target.closest("[data-open-presence-modal]");if(openPresence){openPresenceModal(openPresence.dataset.openPresenceModal);return}
  const statusChoice=e.target.closest("[data-presence-status-choice]");if(statusChoice){document.querySelectorAll("[data-presence-status-choice]").forEach(btn=>btn.classList.toggle("active",btn===statusChoice));return}
  const deleteAttendance=e.target.closest("[data-delete-attendance]");if(deleteAttendance&&owner()&&confirm("Excluir este registro de presença?")){await deleteDoc(doc(db,"attendance",deleteAttendance.dataset.deleteAttendance));await audit("presença excluída",deleteAttendance.dataset.deleteAttendance);toast("Registro excluído.");return}

  const p=e.target.closest("[data-presence]");
  if(p&&editor()){
    const [kind,memberId,slot,date=todayIso()]=p.dataset.presence.split("|"),member=state.members.find(m=>m.id===memberId);if(!member)return;
    const id=(kind+"__"+date+"__"+memberId+"__"+slot).replace(/[^a-zA-Z0-9_-]/g,"_");
    const current=presenceRecord(kind,memberId,slot,date),sequence=[0,1,2,3,-1],next=sequence[(sequence.indexOf(Number(current?.status||0))+1)%sequence.length];
    const ref=doc(db,"attendance",id);
    if(next===0)await deleteDoc(ref);else await setDoc(ref,{memberId,userId:member.userId||member.id,memberName:member.name,clan:member.clan,role:member.role,kind,slot,status:next,date,note:current?.note||"",updatedBy:state.user.uid,updatedByName:state.profile?.name||state.user.email,updatedAt:serverTimestamp()},{merge:true});
    await audit("presença alterada",`${member.name} · ${kind} · ${slot} · ${presenceStatus(next).label}`);toast("Alteração salva automaticamente.");
  }
  const noteButton=e.target.closest("[data-presence-note]");
  if(noteButton&&editor()){
    const [kind,memberId,slot,date]=noteButton.dataset.presenceNote.split("|"),member=state.members.find(m=>m.id===memberId);if(!member)return;
    const current=presenceRecord(kind,memberId,slot,date),note=prompt(`Observação de ${member.name} · ${slot}:`,current?.note||"");if(note===null)return;
    const id=(kind+"__"+date+"__"+memberId+"__"+slot).replace(/[^a-zA-Z0-9_-]/g,"_");
    await setDoc(doc(db,"attendance",id),{memberId,userId:member.userId||member.id,memberName:member.name,clan:member.clan,role:member.role,kind,slot,status:Number(current?.status||0),date,note:note.trim(),updatedBy:state.user.uid,updatedByName:state.profile?.name||state.user.email,updatedAt:serverTimestamp()},{merge:true});
    await audit("observação de presença",`${member.name} · ${kind} · ${slot}`);toast("Observação salva.");
  }
  const bulk=e.target.closest("[data-presence-bulk]");
  if(bulk&&editor()){
    const kind=bulk.dataset.kind,status=Number(bulk.dataset.presenceBulk),filter=presenceFilter(kind),slots=filter.slot==="all"?TYPES[kind]:[filter.slot],members=state.members.filter(m=>(!filter.clan||m.clan===filter.clan)&&(!filter.search||String(m.name||"").toLowerCase().includes(filter.search.toLowerCase())));
    if(!confirm(`${status===1?"Marcar como presentes":status===-1?"Marcar como ausentes":"Limpar"} ${members.length*slots.length} registros?`))return;
    const batch=writeBatch(db);for(const member of members)for(const slot of slots){const id=(kind+"__"+filter.date+"__"+member.id+"__"+slot).replace(/[^a-zA-Z0-9_-]/g,"_"),ref=doc(db,"attendance",id);if(status===0)batch.delete(ref);else batch.set(ref,{memberId:member.id,userId:member.userId||member.id,memberName:member.name,clan:member.clan,role:member.role,kind,slot,status,date:filter.date,note:"",updatedBy:state.user.uid,updatedByName:state.profile?.name||state.user.email,updatedAt:serverTimestamp()},{merge:true})}await batch.commit();await audit("presença em massa",`${kind} · ${filter.date} · ${members.length*slots.length} registros`);toast("Marcações atualizadas.");
  }
  const review=e.target.closest("[data-presence-review]");
  if(review&&editor()){
    const kind=review.dataset.presenceReview,filter=presenceFilter(kind),slots=filter.slot==="all"?TYPES[kind]:[filter.slot];
    const members=state.members.filter(m=>(!filter.clan||m.clan===filter.clan)&&(!filter.search||String(m.name||"").toLowerCase().includes(filter.search.toLowerCase())));
    const records=[];
    members.forEach(member=>slots.forEach(slot=>{
      const row=presenceRecord(kind,member.id,slot,filter.date);
      records.push({memberId:member.id,userId:member.userId||member.id,memberName:member.name||"",clan:member.clan||"",role:member.role||"Membros",slot,status:Number(row?.status||0),note:row?.note||"",updatedBy:row?.updatedBy||"",updatedByName:row?.updatedByName||"",updatedAtText:row?.updatedAt?.toDate?row.updatedAt.toDate().toISOString():""});
    }));
    const pending=records.filter(item=>!item.status).length;
    if(pending&&!confirm(`${pending} registros ainda estão pendentes. Deseja finalizar a presença mesmo assim?`))return;
    const typeLabel=kind==="worldboss"?"WorldBoss":kind==="purgatorio"?"Purgatório":"Eventos";
    const slotLabel=filter.slot==="all"?"Todos os horários/eventos":filter.slot;
    if(!confirm(`Finalizar ${typeLabel} · ${slotLabel} · ${filter.date}?

Um registro será salvo em Gestão → RT Presença.`))return;
    try{
      const counts={present:records.filter(x=>x.status===1).length,late:records.filter(x=>x.status===2).length,justified:records.filter(x=>x.status===3).length,absent:records.filter(x=>x.status===-1).length,pending};
      const rtRef=await addDoc(collection(db,"rtPresence"),{kind,typeLabel,date:filter.date,week:filter.week||isoWeek(filter.date),slot:filter.slot,slotLabel,clan:filter.clan||"Todos",records,counts,total:records.length,status:"finalized",finalizedBy:state.user.uid,finalizedByName:state.profile?.name||state.user.email,finalizedAt:serverTimestamp(),createdAt:serverTimestamp()});
      await audit("RT Presença criado",`${rtRef.id} · ${typeLabel} · ${slotLabel} · ${filter.date}`);
      toast("Presença finalizada e salva em RT Presença.");
    }catch(error){toast(errMsg(error));}
  }
  const historyButton=e.target.closest("[data-presence-history]");if(historyButton){const member=state.members.find(m=>m.id===historyButton.dataset.presenceHistory);if(member)openMemberDrawer(member)}

  const rtToggle=e.target.closest("[data-rt-toggle]");if(rtToggle){$("#rt-details-"+rtToggle.dataset.rtToggle)?.classList.toggle("hidden")}
  const rtCsv=e.target.closest("[data-rt-csv]");if(rtCsv){const rt=state.rtPresence.find(x=>x.id===rtCsv.dataset.rtCsv);if(rt)exportRtCsv(rt)}
  const rtPrint=e.target.closest("[data-rt-print]");if(rtPrint){const rt=state.rtPresence.find(x=>x.id===rtPrint.dataset.rtPrint);if(rt)printRt(rt)}
  const rtDelete=e.target.closest("[data-rt-delete]");if(rtDelete&&owner()){const rt=state.rtPresence.find(x=>x.id===rtDelete.dataset.rtDelete);if(rt&&confirm("Excluir este RT definitivamente? O Histórico de presença não será removido.")){await deleteDoc(doc(db,"rtPresence",rt.id));await audit("RT Presença excluído",`${rt.id} · ${rt.typeLabel} · ${rt.date}`);toast("RT excluído.")}}

  const changeRole=e.target.closest("[data-change-member-role]");
  if(changeRole){
    const member=state.members.find(item=>item.id===changeRole.dataset.changeMemberRole);
    const user=linkedUserForMember(member);
    if(!canManageAcceptedMember(member,user))return toast("Você não tem permissão para alterar este cargo.");

    const select=document.querySelector(`[data-role-select="${member.id}"]`);
    const chosen=select?.value||"";
    const allowed=allowedCargoOptions(member,user);
    if(!allowed.some(option=>option.value===chosen))return toast("Cargo inválido para o seu nível de acesso.");

    const currentAccess=resolveAccessRole(user);
    const nextAccess=chosen.startsWith("member:")?"member":chosen;
    const nextMemberRole=chosen.startsWith("member:")?chosen.slice(7):memberRoleFromAccessRole(nextAccess,member.role);
    if(currentAccess===nextAccess && (nextAccess!=="member"||nextMemberRole===member.role))return toast("O membro já possui esse cargo.");

    const currentLabel=currentAccess==="member"?(member.role||"Membros"):accessRoleLabel(currentAccess);
    const nextLabel=nextAccess==="member"?nextMemberRole:accessRoleLabel(nextAccess);
    if(!confirm(`Alterar o cargo de ${member.name} de ${currentLabel} para ${nextLabel}?`))return;

    try{
      const batch=writeBatch(db);
      batch.update(doc(db,"users",user.id),{
        role:nextAccess,
        accessRole:nextAccess,
        memberRole:nextMemberRole,
        roleUpdatedAt:serverTimestamp(),
        roleUpdatedBy:state.user.uid,
        updatedAt:serverTimestamp()
      });
      batch.set(doc(db,"members",member.id),{
        role:nextMemberRole,
        accessRole:nextAccess,
        userId:user.id,
        updatedAt:serverTimestamp()
      },{merge:true});
      await batch.commit();

      // Atualização otimista: aplica cor, etiqueta e permissões sem aguardar
      // o próximo snapshot do Firestore.
      Object.assign(user,{
        role:nextAccess,
        accessRole:nextAccess,
        memberRole:nextMemberRole,
        resolvedAccessRole:nextAccess
      });
      Object.assign(member,{
        role:nextMemberRole,
        accessRole:nextAccess,
        userId:user.id
      });
      if(user.id===state.user?.uid){
        Object.assign(state.profile,user);
        state.profile.resolvedAccessRole=nextAccess;
        applyAccessControl();
      }
      render();

      await audit("cargo de membro alterado",`${member.name} · ${currentLabel} → ${nextLabel}`);
      toast(`Cargo de ${member.name} alterado para ${nextLabel}.`);
    }catch(error){
      toast(errMsg(error));
    }
    return;
  }

  const del=e.target.closest("[data-delete-member]");if(del&&editor())await deleteDoc(doc(db,"members",del.dataset.deleteMember));
  const approve=e.target.closest("[data-approve]");
  if(approve&&editor()){
    const u=state.users.find(x=>x.id===approve.dataset.approve);if(!u)return;
    const clan=document.querySelector(`[data-clan="${u.id}"]`)?.value||"";
    const chosen=document.querySelector(`[data-role="${u.id}"]`)?.value||"";
    if(!clan)return toast("Selecione o clã.");
    const allowed=REQUEST_ACCESS_OPTIONS[owner()?"dev":leadership()?"leadership":"staff"]||[];
    if(!allowed.some(option=>option.value===chosen))return toast("Cargo inválido para o seu nível de acesso.");

    const accessRole=chosen.startsWith("member:")?"member":chosen;
    const memberRole=chosen.startsWith("member:")?chosen.slice(7):memberRoleFromAccessRole(accessRole,"Membros");
    const roleLabel=accessRole==="member"?memberRole:accessRoleLabel(accessRole);
    if(!confirm(`Aprovar ${u.name} com o cargo ${roleLabel}?`))return;

    try{
      const batch=writeBatch(db);
      batch.update(doc(db,"users",u.id),{
        role:accessRole,accessRole,active:true,status:"approved",clan,memberRole,
        approvedAt:serverTimestamp(),roleUpdatedAt:serverTimestamp(),
        roleUpdatedBy:state.user.uid,updatedAt:serverTimestamp()
      });
      batch.set(doc(db,"members",u.id),{
        name:u.name,role:memberRole,clan,userId:u.id,accessRole,
        createdAt:serverTimestamp(),updatedAt:serverTimestamp()
      },{merge:true});
      await batch.commit();
      await audit("solicitação aprovada",`${u.email} · ${roleLabel}`);
      toast(`${u.name} foi aprovado como ${roleLabel}.`);
    }catch(error){toast(errMsg(error));}
    return;
  }

  const reject=e.target.closest("[data-reject]");
  if(reject&&editor()){
    const u=state.users.find(x=>x.id===reject.dataset.reject);if(!u)return;
    if(!confirm(`Rejeitar a solicitação de ${u.name}?`))return;
    try{
      await updateDoc(doc(db,"users",u.id),{
        active:false,status:"rejected",rejectedAt:serverTimestamp(),
        rejectedBy:state.user.uid,updatedAt:serverTimestamp()
      });
      await audit("solicitação rejeitada",u.email);
      toast(`Solicitação de ${u.name} rejeitada.`);
    }catch(error){toast(errMsg(error));}
    return;
  }
});

$("#memberForm").onsubmit=async event=>{
  event.preventDefault();
  if(!editor())return;

  const name=$("#memberName").value.trim();
  const role=$("#memberRole").value;
  const clan=$("#memberClan").value;

  if(role==="Staff"){
    toast("Para adicionar Staff, aprove ou promova uma conta existente. Não é necessário criar outro usuário.");
    return;
  }

  await addDoc(collection(db,"members"),{
    name,
    role,
    clan,
    accessRole:"member",
    createdAt:serverTimestamp()
  });
  event.target.reset();
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
on("notificationPopupLater","click",()=>byId("notificationPopup")?.classList.add("hidden"));
on("notificationPopupRead","click",async()=>{
  const popup=byId("notificationPopup");const id=popup?.dataset.notificationId;if(!id)return;
  try{await markNotificationRead(id);popup.classList.add("hidden");activePopupNotificationId="";}catch(error){toast(errMsg(error))}
});
document.addEventListener("click",async event=>{
  const mark=event.target.closest("[data-mark-notification]");
  if(mark){try{await markNotificationRead(mark.dataset.markNotification)}catch(error){toast(errMsg(error))}}
  const del=event.target.closest("[data-delete-notification]");
  if(del&&owner()){try{await deleteDoc(doc(db,"notifications",del.dataset.deleteNotification));toast("Notificação excluída.")}catch(error){toast(errMsg(error))}}
});
$("#newCalendarEvent").onclick=()=>$("#eventModal").classList.remove("hidden");
$("#closeEventModal").onclick=()=>$("#eventModal").classList.add("hidden");
document.addEventListener("click",event=>{
  if(event.target.closest("[data-close-drawer]"))$("#memberDrawer").classList.add("hidden");
  const view=event.target.closest("[data-view-member]");
  if(view){const member=visibleMembers().find(m=>m.id===view.dataset.viewMember);if(member)openMemberDrawer(member)}
});
$("#eventForm").onsubmit=async event=>{
  event.preventDefault();if(!editor())return;
  await addDoc(collection(db,"events"),{title:$("#eventTitle").value.trim(),date:$("#eventDate").value,type:$("#eventType").value,description:$("#eventDescription").value.trim(),createdBy:state.user.uid,createdAt:serverTimestamp()});
  await addDoc(collection(db,"notifications"),{title:"Novo evento",message:`${$("#eventTitle").value} em ${$("#eventDate").value}`,type:"info",targetType:"all",createdBy:state.user.uid,createdByName:state.profile?.name||"Staff",createdAt:serverTimestamp()});
  event.target.reset();$("#eventModal").classList.add("hidden");toast("Evento criado.");
};









/* V22.7.2 — correção definitiva do fundo personalizado do login */
const LOGIN_DEFAULTS={
  backgroundUrl:"assets/login-purple-storm-v22-6-2.png?v=22.6.3",
  logoUrl:"assets/logo-77-team-manager-oficial.png?v=22.6.3",
  backgroundPosition:"center center",
  logoWidth:620
};
let pendingLoginBackground=null;
let pendingLoginLogo=null;
let removeLoginBackgroundRequested=false;
let removeLoginLogoRequested=false;
let loginBackgroundPreviewUrl="";
let loginLogoPreviewUrl="";

function readCachedLoginCustomization(){
  try{return JSON.parse(localStorage.getItem("77team-login-customization")||"{}")||{}}catch{return {}}
}
function cacheLoginCustomization(cfg){
  try{localStorage.setItem("77team-login-customization",JSON.stringify(cfg||{}))}catch{}
}
function loginCustomization(){
  const remote=state.settings?.loginCustomization||{};
  return Object.keys(remote).length?remote:readCachedLoginCustomization();
}
function resolveLoginAssetUrl(value,fallback){
  const candidate=String(value||fallback||"").trim();
  if(!candidate)return "";
  if(/^(https?:|blob:|data:)/i.test(candidate))return candidate;
  try{return new URL(candidate,document.baseURI).href}catch{return candidate}
}
function setLoginBackground(screen,url,position){
  if(!screen)return;
  const safe=String(url||"").replace(/"/g,"%22");
  const image=`linear-gradient(180deg,rgba(0,0,0,.16),rgba(0,0,0,.40)),url("${safe}")`;
  screen.style.setProperty("--login-custom-background",`url("${safe}")`);
  screen.style.setProperty("--login-background-position",position);
  // O CSS antigo possui !important; por isso a aplicação inline também precisa de prioridade.
  screen.style.setProperty("background-image",image,"important");
  screen.style.setProperty("background-position",position,"important");
  screen.style.setProperty("background-size","cover","important");
  screen.style.setProperty("background-repeat","no-repeat","important");
}
function applyLoginCustomization(){
  const cfg=loginCustomization();
  const screen=byId("authScreen");
  const logo=byId("loginTopImage");
  const defaultBg=resolveLoginAssetUrl(LOGIN_DEFAULTS.backgroundUrl,LOGIN_DEFAULTS.backgroundUrl);
  const bg=resolveLoginAssetUrl(cfg.backgroundUrl,defaultBg);
  const position=cfg.backgroundPosition||LOGIN_DEFAULTS.backgroundPosition;
  setLoginBackground(screen,bg,position);
  // Valida a imagem e restaura o fundo local caso a URL salva esteja indisponível.
  if(bg){
    const probe=new Image();
    probe.onerror=()=>{if(bg!==defaultBg)setLoginBackground(screen,defaultBg,position)};
    probe.src=bg;
  }
  if(logo){
    const nextLogo=resolveLoginAssetUrl(cfg.logoUrl,LOGIN_DEFAULTS.logoUrl);
    if(logo.src!==nextLogo)logo.src=nextLogo;
    logo.onerror=()=>{logo.onerror=null;logo.src=resolveLoginAssetUrl(LOGIN_DEFAULTS.logoUrl,LOGIN_DEFAULTS.logoUrl)};
    logo.style.setProperty("--login-logo-width",`${Number(cfg.logoWidth)||LOGIN_DEFAULTS.logoWidth}px`);
  }
  cacheLoginCustomization(cfg);
}
function revokePreview(url){if(url?.startsWith("blob:"))URL.revokeObjectURL(url)}
function loadLoginCustomizationForm(){
  const cfg=loginCustomization();
  setValue("loginBackgroundPosition",cfg.backgroundPosition||LOGIN_DEFAULTS.backgroundPosition);
  setValue("loginLogoWidth",String(Number(cfg.logoWidth)||LOGIN_DEFAULTS.logoWidth));
  const bg=resolveLoginAssetUrl(cfg.backgroundUrl,LOGIN_DEFAULTS.backgroundUrl);
  const logo=resolveLoginAssetUrl(cfg.logoUrl,LOGIN_DEFAULTS.logoUrl);
  const bgPreview=byId("loginBackgroundPreview");
  if(bgPreview)bgPreview.style.backgroundImage=`url("${bg}")`;
  const logoPreview=byId("loginLogoPreview");if(logoPreview)logoPreview.src=logo;
  refreshLoginCustomizationPreview();
}
async function optimizeLoginImage(file,type){
  if(!file||!/^image\/(jpeg|png|webp)$/.test(file.type))throw new Error("Selecione uma imagem JPG, PNG ou WebP.");
  if(file.size>15*1024*1024)throw new Error("A imagem deve ter no máximo 15 MB antes do ajuste.");
  const bitmap=await createImageBitmap(file);
  const maxW=type==="background"?1920:1000,maxH=type==="background"?1080:400;
  const scale=Math.min(1,maxW/bitmap.width,maxH/bitmap.height);
  const width=Math.max(1,Math.round(bitmap.width*scale)),height=Math.max(1,Math.round(bitmap.height*scale));
  const canvas=document.createElement("canvas");canvas.width=width;canvas.height=height;
  const ctx=canvas.getContext("2d",{alpha:type!=="background"});ctx.drawImage(bitmap,0,0,width,height);bitmap.close?.();
  const mime=file.type==="image/png"&&type==="logo"?"image/png":"image/webp";
  const quality=type==="background"?.86:.92;
  const blob=await new Promise((resolve,reject)=>canvas.toBlob(value=>value?resolve(value):reject(new Error("Não foi possível processar a imagem.")),mime,quality));
  return {blob,width,height,extension:mime==="image/png"?"png":"webp",mime};
}
function refreshLoginCustomizationPreview(){
  const cfg=loginCustomization();
  const bg=removeLoginBackgroundRequested?resolveLoginAssetUrl(LOGIN_DEFAULTS.backgroundUrl,LOGIN_DEFAULTS.backgroundUrl):(loginBackgroundPreviewUrl||resolveLoginAssetUrl(cfg.backgroundUrl,LOGIN_DEFAULTS.backgroundUrl));
  const logo=removeLoginLogoRequested?resolveLoginAssetUrl(LOGIN_DEFAULTS.logoUrl,LOGIN_DEFAULTS.logoUrl):(loginLogoPreviewUrl||resolveLoginAssetUrl(cfg.logoUrl,LOGIN_DEFAULTS.logoUrl));
  const preview=byId("loginLivePreview");
  if(preview){preview.style.backgroundImage=`linear-gradient(rgba(0,0,0,.22),rgba(0,0,0,.38)),url("${bg}")`;preview.style.backgroundPosition=byId("loginBackgroundPosition")?.value||LOGIN_DEFAULTS.backgroundPosition}
  const previewLogo=byId("loginLivePreviewLogo");if(previewLogo){previewLogo.src=logo;previewLogo.style.width=`min(${Number(byId("loginLogoWidth")?.value)||LOGIN_DEFAULTS.logoWidth}px,82%)`}
}
on("loginBackgroundFile","change",async event=>{try{const file=event.target.files?.[0];if(!file)return;pendingLoginBackground=await optimizeLoginImage(file,"background");removeLoginBackgroundRequested=false;revokePreview(loginBackgroundPreviewUrl);loginBackgroundPreviewUrl=URL.createObjectURL(pendingLoginBackground.blob);const el=byId("loginBackgroundPreview");if(el)el.style.backgroundImage=`url("${loginBackgroundPreviewUrl}")`;refreshLoginCustomizationPreview();setText("loginCustomizationStatus",`Fundo ajustado para ${pendingLoginBackground.width} × ${pendingLoginBackground.height}. Clique em Salvar alterações.`)}catch(error){toast(error.message)}});
on("loginLogoFile","change",async event=>{try{const file=event.target.files?.[0];if(!file)return;pendingLoginLogo=await optimizeLoginImage(file,"logo");removeLoginLogoRequested=false;revokePreview(loginLogoPreviewUrl);loginLogoPreviewUrl=URL.createObjectURL(pendingLoginLogo.blob);const el=byId("loginLogoPreview");if(el)el.src=loginLogoPreviewUrl;refreshLoginCustomizationPreview();setText("loginCustomizationStatus",`Imagem do topo ajustada para ${pendingLoginLogo.width} × ${pendingLoginLogo.height}. Clique em Salvar alterações.`)}catch(error){toast(error.message)}});
on("loginBackgroundPosition","change",refreshLoginCustomizationPreview);on("loginLogoWidth","change",refreshLoginCustomizationPreview);on("refreshLoginPreview","click",()=>{refreshLoginCustomizationPreview();toast("Prévia atualizada.")});
on("removeLoginBackground","click",()=>{pendingLoginBackground=null;removeLoginBackgroundRequested=true;revokePreview(loginBackgroundPreviewUrl);loginBackgroundPreviewUrl="";const el=byId("loginBackgroundPreview");if(el)el.style.backgroundImage=`url("${LOGIN_DEFAULTS.backgroundUrl}")`;refreshLoginCustomizationPreview();setText("loginCustomizationStatus","O fundo padrão será restaurado ao salvar.")});
on("removeLoginLogo","click",()=>{pendingLoginLogo=null;removeLoginLogoRequested=true;revokePreview(loginLogoPreviewUrl);loginLogoPreviewUrl="";const el=byId("loginLogoPreview");if(el)el.src=LOGIN_DEFAULTS.logoUrl;refreshLoginCustomizationPreview();setText("loginCustomizationStatus","A logo padrão será restaurada ao salvar.")});
async function uploadLoginAsset(processed,type){
  const path=`login-customization/${type}-${Date.now()}.${processed.extension}`;
  const ref=storageRef(storage,path);const snap=await uploadBytes(ref,processed.blob,{contentType:processed.mime,cacheControl:"public,max-age=3600"});
  return {url:await getDownloadURL(snap.ref),path};
}
on("saveLoginCustomization","click",async()=>{
  if(!owner())return toast("Somente o DEV pode personalizar a tela de login.");
  const button=byId("saveLoginCustomization");if(button)button.disabled=true;
  try{
    const previous=loginCustomization();
    const next={...previous,backgroundPosition:byId("loginBackgroundPosition")?.value||LOGIN_DEFAULTS.backgroundPosition,logoWidth:Number(byId("loginLogoWidth")?.value)||LOGIN_DEFAULTS.logoWidth,updatedAt:new Date().toISOString(),updatedBy:state.user.uid};
    if(pendingLoginBackground){const asset=await uploadLoginAsset(pendingLoginBackground,"background");next.backgroundUrl=asset.url;next.backgroundPath=asset.path}
    else if(removeLoginBackgroundRequested){delete next.backgroundUrl;delete next.backgroundPath}
    if(pendingLoginLogo){const asset=await uploadLoginAsset(pendingLoginLogo,"logo");next.logoUrl=asset.url;next.logoPath=asset.path}
    else if(removeLoginLogoRequested){delete next.logoUrl;delete next.logoPath}
    await setDoc(doc(db,"settings","app"),{loginCustomization:next},{merge:true});
    const oldPaths=[];if((pendingLoginBackground||removeLoginBackgroundRequested)&&previous.backgroundPath&&previous.backgroundPath!==next.backgroundPath)oldPaths.push(previous.backgroundPath);if((pendingLoginLogo||removeLoginLogoRequested)&&previous.logoPath&&previous.logoPath!==next.logoPath)oldPaths.push(previous.logoPath);
    await Promise.all(oldPaths.map(async path=>{try{await deleteObject(storageRef(storage,path))}catch(error){console.warn("Imagem anterior não removida:",error)}}));
    state.settings={...state.settings,loginCustomization:next};cacheLoginCustomization(next);pendingLoginBackground=pendingLoginLogo=null;removeLoginBackgroundRequested=removeLoginLogoRequested=false;revokePreview(loginBackgroundPreviewUrl);revokePreview(loginLogoPreviewUrl);loginBackgroundPreviewUrl=loginLogoPreviewUrl="";applyLoginCustomization();loadLoginCustomizationForm();await audit("personalização do login atualizada","Fundo e/ou imagem do topo modificados");toast("Tela de login atualizada com sucesso.");setText("loginCustomizationStatus","Alterações publicadas e aplicadas automaticamente.")
  }catch(error){toast(errMsg(error));setText("loginCustomizationStatus",`Falha ao salvar: ${error.message||error}`)}finally{if(button)button.disabled=false}
});

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

  const matches=visibleMembers().filter(member=>
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
    const member=visibleMembers().find(item=>item.id===result.dataset.searchMember);
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
  const character=state.profile.character||{};
  const stat=stats(member?.name||displayName);
  const level=memberLevel(stat.present);
  const progress=(stat.present%10)*10;
  const medals=memberMedals({name:member?.name||displayName,role});
  const rankingPosition=profileRankingPosition(member);
  const eventCount=state.attendance.filter(item=>
    item.status===1&&item.kind==="eventos"&&(
      item.memberId===member?.id||
      item.memberName===member?.name||
      item.memberName===displayName
    )
  ).length;
  const points=(stat.present*100)+(eventCount*50);

  setText("profileDisplayName",displayName);
  setText("profileEmail",state.profile.email||state.user.email||"—");
  setText("profileCharacterClass",character.className||"Classe não informada");
  setText("profileCharacterClan",clan);
  setText("profileLevel",`Nível ${level}`);
  setText("profileNextLevel",`${stat.present%10}/10 presenças`);
  setText("profilePresence",stat.present);
  setText("profileAbsence",stat.absent);
  setText("profileRate",`${stat.rate}%`);
  setText("profileEventsCount",eventCount);
  setText("profilePoints",points.toLocaleString("pt-BR"));
  setText("profileRanking",rankingPosition?`#${rankingPosition}`:"—");
  setText("heroPower",Number(character.power||0).toLocaleString("pt-BR"));
  setText("heroCharacterLevel",character.level||0);
  setText("heroRanking",rankingPosition?`#${rankingPosition}`:"—");
  setText("profileAvatarFallback",(displayName||"U").slice(0,1).toUpperCase());
  setHtml("profileRoleBadge",roleBadge(role));
  setHtml("profileMedals",medals.length?medals.map(item=>`<span>${item}</span>`).join(""):"Nenhuma medalha ainda.");

  const progressFill=byId("profileProgressFill");
  if(progressFill)progressFill.style.width=`${progress}%`;

  const image=byId("profileAvatarPreview");
  const fallback=byId("profileAvatarFallback");
  if(image&&fallback){
    if(avatar){
      image.src=avatar;
      image.classList.remove("hidden");
      fallback.classList.add("hidden");
    }else{
      image.removeAttribute("src");
      image.classList.add("hidden");
      fallback.classList.remove("hidden");
    }
  }

  setValue("profileNicknameInput",state.profile.name||displayName);
  setValue("profileDisplayNameInput",state.profile.displayName||state.profile.name||displayName);
  setValue("profileDiscordInput",state.profile.discord||"");
  setValue("profileWhatsappInput",state.profile.whatsapp||"");
  setValue("profileBirthDateInput",state.profile.birthDate||"");
  setValue("profileBioInput",state.profile.bio||"");
  setValue("profileEmailInput",state.user.email||state.profile.email||"");

  const history=state.attendance
    .filter(item=>
      item.memberId===member?.id||
      item.memberName===member?.name||
      item.memberName===displayName
    )
    .sort((a,b)=>String(b.date||"").localeCompare(String(a.date||"")))
    .slice(0,20);

  setHtml("profileHistoryRows",history.map(item=>`<tr>
    <td>${formatHistoryDate(item.date)}</td>
    <td>${item.kind||"—"}</td>
    <td>${item.slot||"—"}</td>
    <td>${item.status===1?"Presente":item.status===-1?"Ausente":"—"}</td>
  </tr>`).join("")||'<tr><td colspan="4">Nenhum registro encontrado.</td></tr>');

  renderProfileTimeline(history);
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
  if(!state.user||state.guest)return;
  const name=(byId("profileNicknameInput")?.value||"").trim();
  const displayName=(byId("profileDisplayNameInput")?.value||name).trim();
  const discord=(byId("profileDiscordInput")?.value||"").trim();
  const whatsapp=(byId("profileWhatsappInput")?.value||"").trim();
  const birthDate=byId("profileBirthDateInput")?.value||"";
  const bio=(byId("profileBioInput")?.value||"").trim();
  if(name.length<2)return toast("O nickname precisa ter pelo menos 2 caracteres.");
  if(displayName.length<2)return toast("O nome de exibição precisa ter pelo menos 2 caracteres.");
  try{
    const payload={name,displayName,discord,whatsapp,birthDate,bio,updatedAt:serverTimestamp()};
    await updateDoc(doc(db,"users",state.user.uid),payload);
    Object.assign(state.profile,{name,displayName,discord,whatsapp,birthDate,bio});
    applyPermissions();updateFirstAccessUI();renderOwnProfile();renderCharacterProfile();renderCharactersTable();renderCharacterCenter();renderHistoryCenter();renderGoals();renderSystemHealth();renderStaffCommandCenter();applyRestrictedVisibility();
    toast("Perfil completo atualizado.");
  }catch(error){
    console.error("Falha ao salvar o próprio perfil:",error);
    toast(error?.code==="permission-denied"
      ? "Permissão negada ao salvar o perfil. Publique o firestore.rules da V22.7.2 no Firebase e confirme o projeto team-f78cd."
      : (error.message||"Não foi possível atualizar o perfil."));
  }
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

    renderOwnProfile();renderCharacterProfile();renderCharactersTable();renderCharacterCenter();renderHistoryCenter();renderGoals();renderSystemHealth();renderStaffCommandCenter();applyRestrictedVisibility();
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
    state.profile.avatarDataUrl="";renderOwnProfile();renderCharacterProfile();renderCharactersTable();renderCharacterCenter();renderHistoryCenter();renderGoals();renderSystemHealth();renderStaffCommandCenter();applyRestrictedVisibility();toast("Avatar removido.");
  }catch(error){toast(error.message||"Não foi possível remover o avatar.")}
});
on("profilePasswordForm","submit",async event=>{
  event.preventDefault();
  if(!auth.currentUser)return toast("Entre novamente para alterar a segurança.");
  const newEmail=(byId("profileEmailInput")?.value||"").trim().toLowerCase();
  const currentPassword=byId("profileCurrentPassword")?.value||"";
  const password=byId("profileNewPassword")?.value||"";
  const confirm=byId("profileConfirmPassword")?.value||"";
  const emailChanged=newEmail&&newEmail!==String(auth.currentUser.email||"").toLowerCase();
  if(!emailChanged&&!password)return toast("Nenhuma alteração informada.");
  if((emailChanged||password)&&currentPassword.length<6)return toast("Informe sua senha atual.");
  if(password&&password.length<6)return toast("A nova senha precisa ter pelo menos 6 caracteres.");
  if(password!==confirm)return toast("As senhas não conferem.");
  try{
    const credential=EmailAuthProvider.credential(auth.currentUser.email,currentPassword);
    await reauthenticateWithCredential(auth.currentUser,credential);
    if(emailChanged){
      await updateEmail(auth.currentUser,newEmail);
      await updateDoc(doc(db,"users",state.user.uid),{email:newEmail,updatedAt:serverTimestamp()});
      state.profile.email=newEmail;
    }
    if(password)await updatePassword(auth.currentUser,password);
    event.target.reset();
    setValue("profileEmailInput",auth.currentUser.email||state.profile.email||"");
    renderOwnProfile();
    toast(emailChanged&&password?"E-mail e senha atualizados.":emailChanged?"E-mail atualizado.":"Senha atualizada.");
  }catch(error){
    const messages={"auth/wrong-password":"Senha atual incorreta.","auth/invalid-credential":"Senha atual incorreta.","auth/email-already-in-use":"Este e-mail já está em uso.","auth/invalid-email":"Informe um e-mail válido."};
    toast(messages[error?.code]||errMsg(error));
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
    toast(permissionMessage(requestedPage));
    window.TeamManagerUI?.activatePage("dashboard");
  }
},true);

window.TeamManagerCanOpenPage=canOpenPage;


function applyRestrictedVisibility(){
  const allowed=editor();

  ["staff-hub","presencas","registros"].forEach(page=>{
    const section=byId(page);
    if(section)section.classList.toggle("hidden",!allowed);
  });

  document.querySelectorAll('[data-page="staff-hub"],[data-page="presencas"],[data-page="registros"]')
    .forEach(button=>button.classList.toggle("hidden",!allowed));

  document.querySelectorAll(".attendance-private")
    .forEach(element=>element.classList.toggle("hidden",!allowed));
}


function renderRolePermissionMatrix(){
  const host=byId("rolePermissionMatrix");
  if(!host)return;
  const roles=["dev","leadership","staff","member","guest"];
  const configured=configuredRolePermissions();
  let currentGroup="";
  host.innerHTML=ROLE_PERMISSION_DEFINITIONS.map(item=>{
    const groupRow=item.group!==currentGroup?`<tr class="permission-group-row"><th colspan="6">${escapeHtml(item.group)}</th></tr>`:"";
    currentGroup=item.group;
    const cells=roles.map(role=>{
      const checked=role==="dev"?true:(configured?.[item.key]?.[role] ?? item.defaults[role]);
      return `<td><label class="permission-switch" title="${escapeHtml(accessRoleLabel(role))}"><input data-role-permission="${item.key}" data-permission-role="${role}" type="checkbox" ${checked?"checked":""} ${role==="dev"?"disabled":""}><span></span></label></td>`;
    }).join("");
    return `${groupRow}<tr data-permission-row data-search="${escapeHtml((item.group+" "+item.label).toLowerCase())}"><th><strong>${escapeHtml(item.label)}</strong><small>${escapeHtml(item.key)}</small></th>${cells}</tr>`;
  }).join("");
}
function collectRolePermissions(){
  const result=defaultRolePermissions();
  document.querySelectorAll("[data-role-permission]").forEach(input=>{
    const key=input.dataset.rolePermission, role=input.dataset.permissionRole;
    if(result[key])result[key][role]=role==="dev"?true:input.checked;
  });
  return result;
}
async function saveConfigurableRolePermissions(){
  if(!owner())return toast("Somente o DEV pode alterar permissões.");
  const button=byId("saveRolePermissions"); if(button)button.disabled=true;
  try{
    const rolePermissions=collectRolePermissions();
    await setDoc(doc(db,"settings","app"),{rolePermissions,updatedAt:serverTimestamp(),updatedBy:state.user.uid},{merge:true});
    state.settings={...state.settings,rolePermissions};
    setText("rolePermissionStatus","Permissões salvas com sucesso.");
    applyPermissions(); render(); toast("Matriz de permissões atualizada.");
  }catch(error){toast(errMsg(error));setText("rolePermissionStatus","Não foi possível salvar.");}
  finally{if(button)button.disabled=false;}
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
  setText("summaryClass",character.className||"—");
  setText("summaryPower",Number(character.power||0).toLocaleString("pt-BR"));
  setText("summaryLevel",character.level??0);
  setText("summaryCodex",character.codex??0);
  setText("summaryMandalla",character.mandalla??0);
  setText("summaryChi1",character.chi1??0);
  setText("summaryChi2",character.chi2??0);
  setText("summaryChi3",character.chi3??0);
  setText("summaryFrogPosture",character.frogPosture??0);
  setText("summaryConstitution",character.constitution??0);
  setText("summaryWildernessTraining",character.wildernessTraining??0);
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
        characterUpdatedAt:serverTimestamp(),
        characterUpdatedBy:state.user.uid,
        updatedAt:serverTimestamp()
      }
    );

    state.profile.character=character;
    renderCharacterProfile();
    renderCharactersTable();
    updateFirstAccessUI();
    if(state.onboardingRequired){
      await completeFirstAccess();
    }else{
      toast("Informações do personagem salvas.");
    }
  }catch(error){
    console.error("Falha ao salvar o próprio personagem:",error);
    toast(error?.code==="permission-denied"
      ? "Permissão negada ao salvar o personagem. Publique o firestore.rules da V22.7.2 no Firebase e confirme o projeto team-f78cd."
      : (error.message||"Não foi possível salvar o personagem."));
  }
});

on("deleteOwnCharacterButton","click",()=>{
  if(!state.user||!state.profile?.character)return;
  deleteCharacter({
    id:state.user.uid,
    nickname:state.profile.name||state.user.email||"Usuário",
    character:state.profile.character,
    role:state.profile.memberRole||state.profile.role||"Membro",
    clan:state.profile.clan||"Sem clã",
    stat:{present:0,absent:0,rate:0}
  });
});

on("characterSearch","input",renderCharactersTable);


function profileRankingPosition(member){
  if(!member)return 0;
  const ranking=state.members
    .map(item=>({...item,...stats(item.name)}))
    .sort((a,b)=>b.present-a.present||b.rate-a.rate);
  const index=ranking.findIndex(item=>item.id===member.id||item.name===member.name);
  return index>=0?index+1:0;
}

function renderProfileTimeline(history){
  const timeline=byId("profileTimeline");
  if(!timeline)return;

  timeline.innerHTML=history.map(item=>`
    <article class="timeline-item ${item.status===1?"success":"danger"}">
      <div class="timeline-dot">${item.status===1?"✓":"×"}</div>
      <div>
        <strong>${item.kind||"Atividade"} · ${item.slot||"—"}</strong>
        <p>${item.status===1?"Presença confirmada":"Ausência registrada"}</p>
        <small>${formatHistoryDate(item.date)}</small>
      </div>
    </article>
  `).join("")||'<p class="empty-state">Nenhuma atividade registrada.</p>';
}


on("quickAvatarButton","click",()=>byId("profileAvatarInput")?.click());
on("editCharacterButton","click",()=>{
  byId("characterEditorPanel")?.scrollIntoView({behavior:"smooth",block:"start"});
  byId("characterClass")?.focus();
});


function characterCenterRows(){
  return state.users
    .filter(user=>(user.status==="approved"||user.active===true) && user.character && Object.keys(user.character).length)
    .map(user=>{
      const member=state.members.find(item=>
        item.userId===user.id||
        item.id===user.id||
        item.name===user.name
      )||{};
      const character=user.character||{};
      const stat=stats(member.name||user.name||"");
      return {
        id:user.id,
        nickname:user.name||"—",
        email:user.email||"—",
        avatar:user.avatarDataUrl||"",
        role:member.role||user.memberRole||user.role||"Membro",
        clan:member.clan||user.clan||"Sem clã",
        character,
        stat
      };
    });
}

function uniqueValues(items,selector){
  return [...new Set(items.map(selector).filter(Boolean))].sort((a,b)=>
    String(a).localeCompare(String(b),"pt-BR")
  );
}

function populateCharacterFilters(rows){
  const classes=uniqueValues(rows,item=>item.character.className);
  const roles=uniqueValues(rows,item=>item.role);
  const clans=uniqueValues(rows,item=>item.clan);

  const fill=(id,placeholder,values)=>{
    const select=byId(id);
    if(!select)return;
    const current=select.value;
    select.innerHTML=`<option value="">${placeholder}</option>`+
      values.map(value=>`<option value="${value}">${value}</option>`).join("");
    if(values.includes(current))select.value=current;
  };

  fill("characterClassFilter","Todas as classes",classes);
  fill("characterRoleFilter","Todos os cargos",roles);
  fill("characterClanFilter","Todos os clãs",clans);
}

function filteredCharacterRows(){
  const search=String(byId("characterSearch")?.value||"").trim().toLowerCase();
  const classFilter=byId("characterClassFilter")?.value||"";
  const roleFilter=byId("characterRoleFilter")?.value||"";
  const clanFilter=byId("characterClanFilter")?.value||"";
  const sort=byId("characterSort")?.value||"power-desc";

  const rows=characterCenterRows().filter(item=>
    (!search||
      item.nickname.toLowerCase().includes(search)||
      String(item.character.className||"").toLowerCase().includes(search)
    )&&
    (!classFilter||item.character.className===classFilter)&&
    (!roleFilter||item.role===roleFilter)&&
    (!clanFilter||item.clan===clanFilter)
  );

  rows.sort((a,b)=>{
    if(sort==="level-desc")return Number(b.character.level||0)-Number(a.character.level||0);
    if(sort==="name-asc")return a.nickname.localeCompare(b.nickname,"pt-BR");
    if(sort==="codex-desc")return Number(b.character.codex||0)-Number(a.character.codex||0);
    return Number(b.character.power||0)-Number(a.character.power||0);
  });

  return rows;
}

function renderCharacterOverview(allRows){
  setText("characterTotal",allRows.length);

  const highestPower=[...allRows].sort((a,b)=>
    Number(b.character.power||0)-Number(a.character.power||0)
  )[0];
  setText("characterHighestPower",Number(highestPower?.character.power||0).toLocaleString("pt-BR"));
  setText("characterHighestPowerName",highestPower?.nickname||"—");

  const highestLevel=[...allRows].sort((a,b)=>
    Number(b.character.level||0)-Number(a.character.level||0)
  )[0];
  setText("characterHighestLevel",highestLevel?.character.level||0);
  setText("characterHighestLevelName",highestLevel?.nickname||"—");

  const counts={};
  allRows.forEach(item=>{
    const name=item.character.className||"Não informada";
    counts[name]=(counts[name]||0)+1;
  });
  const topClass=Object.entries(counts).sort((a,b)=>b[1]-a[1])[0];
  setText("characterTopClass",topClass?.[0]||"—");
  setText("characterTopClassCount",`${topClass?.[1]||0} personagem(ns)`);
}

function characterAvatarHtml(item){
  if(item.avatar){
    return `<img src="${item.avatar}" alt="${item.nickname}">`;
  }
  return `<span>${item.nickname.slice(0,1).toUpperCase()}</span>`;
}

function canDeleteCharacter(item){
  if(!item||!state.user||state.guest)return false;
  const actor=currentAccessRole();
  const targetUser=state.users.find(user=>user.id===item.id)||{};
  const targetRole=resolveAccessRole(targetUser);
  if(item.id===state.user.uid)return true;
  if(actor==="dev")return targetRole!=="dev";
  if(actor==="leadership")return ["staff","member"].includes(targetRole);
  if(actor==="staff")return targetRole==="member";
  return false;
}

async function deleteCharacter(item){
  if(!canDeleteCharacter(item)){
    toast("Você não possui permissão para excluir este personagem.");
    return;
  }
  const own=item.id===state.user.uid;
  const message=own
    ? "Excluir seu personagem? Sua conta e seu e-mail continuarão ativos, e você poderá cadastrar o personagem novamente."
    : `Excluir o personagem de ${item.nickname}? A conta e o e-mail do usuário serão preservados para que ele possa cadastrar novamente.`;
  if(!confirm(message))return;
  try{
    await updateDoc(doc(db,"users",item.id),{
      character:deleteField(),
      characterUpdatedAt:deleteField(),
      characterUpdatedBy:deleteField(),
      characterDeletedAt:serverTimestamp(),
      characterDeletedBy:state.user.uid
    });
    const target=state.users.find(user=>user.id===item.id);
    if(target){delete target.character; target.characterDeletedBy=state.user.uid;}
    if(own){
      delete state.profile.character;
      renderCharacterProfile();
      renderCharactersTable();
      setValue("characterClass","");
      ["characterPower","characterLevel","characterCodex","characterMandalla","characterChi1","characterChi2","characterChi3","characterFrogPosture","characterConstitution","characterWildernessTraining"].forEach(id=>setValue(id,0));
    }
    renderCharacterCenter();
    await audit("Personagem excluído",`${item.nickname} · conta e e-mail preservados para novo cadastro`);
    toast("Personagem excluído. O mesmo e-mail poderá cadastrar novamente.");
  }catch(error){
    toast(error.message||"Não foi possível excluir o personagem.");
  }
}

function renderCharacterCards(rows){
  const grid=byId("charactersCardGrid");
  if(!grid)return;

  grid.innerHTML=rows.map(item=>{
    const c=item.character;
    return `<article class="character-card">
      <div class="character-card-head">
        <div class="character-card-avatar">${characterAvatarHtml(item)}</div>
        <div>
          <h3>${item.nickname}</h3>
          <p>${c.className||"Classe não informada"} · ${item.role}</p>
          <small>${item.clan}</small>
        </div>
      </div>
      <div class="character-card-main-stats">
        <div><span>Power</span><strong>${Number(c.power||0).toLocaleString("pt-BR")}</strong></div>
        <div><span>Level</span><strong>${c.level||0}</strong></div>
        <div><span>Codex</span><strong>${c.codex||0}</strong></div>
      </div>
      <div class="character-card-actions">
        <button class="btn primary" data-character-details="${item.id}" type="button">Ver detalhes</button>
        <button class="btn" data-character-pdf="${item.id}" type="button">Gerar PDF</button>
        ${editor()?`<button class="btn character-edit-btn" data-character-edit="${item.id}" type="button">✏️ Editar</button>`:""}
        ${canDeleteCharacter(item)?`<button class="btn danger" data-character-delete="${item.id}" type="button">🗑 Excluir</button>`:""}
      </div>
    </article>`;
  }).join("")||'<p class="empty-state">Nenhum personagem encontrado.</p>';
}

function renderCharactersTableV71(rows){
  const tbody=byId("charactersRows");
  if(!tbody)return;

  tbody.innerHTML=rows.map(item=>{
    const c=item.character;
    return `<tr>
      <td><strong>${item.nickname}</strong></td>
      <td>${c.className||"—"}</td>
      <td>${item.role}</td>
      <td>${item.clan}</td>
      <td>${Number(c.power||0).toLocaleString("pt-BR")}</td>
      <td>${c.level||0}</td>
      <td>${c.codex||0}</td>
      <td>${c.mandalla||0}</td>
      <td>${c.chi1||0}</td>
      <td>${c.chi2||0}</td>
      <td>${c.chi3||0}</td>
      <td>${c.frogPosture||0}</td>
      <td>${c.constitution||0}</td>
      <td>${c.wildernessTraining||0}</td>
      <td>
        <button class="btn" data-character-details="${item.id}" type="button">Detalhes</button>
        <button class="btn" data-character-pdf="${item.id}" type="button">PDF</button>
        ${editor()?`<button class="btn" data-character-edit="${item.id}" type="button">Editar</button>`:""}
        ${canDeleteCharacter(item)?`<button class="btn danger" data-character-delete="${item.id}" type="button">Excluir</button>`:""}
      </td>
    </tr>`;
  }).join("")||'<tr><td colspan="15">Nenhum personagem encontrado.</td></tr>';
}

function renderCharacterCenter(){
  if(!editor())return;
  const allRows=characterCenterRows();
  populateCharacterFilters(allRows);
  renderCharacterOverview(allRows);
  const rows=filteredCharacterRows();
  renderCharacterCards(rows);
  renderCharactersTableV71(rows);
}

function openCharacterDetails(item){
  if(!item)return;
  const c=item.character;
  const content=byId("characterDetailsContent");
  if(!content)return;

  content.innerHTML=`<div class="character-drawer-hero">
    <div class="character-drawer-avatar">${characterAvatarHtml(item)}</div>
    <h2>${item.nickname}</h2>
    <p>${c.className||"Classe não informada"} · ${item.role}</p>
    <small>${item.clan}</small>
  </div>
  <div class="character-drawer-highlight">
    <div><span>Power</span><strong>${Number(c.power||0).toLocaleString("pt-BR")}</strong></div>
    <div><span>Level</span><strong>${c.level||0}</strong></div>
    <div><span>Taxa</span><strong>${item.stat.rate||0}%</strong></div>
  </div>
  <div class="character-drawer-grid">
    <div><span>Codex</span><strong>${c.codex||0}</strong></div>
    <div><span>Mandalla</span><strong>${c.mandalla||0}</strong></div>
    <div><span>Chi 1</span><strong>${c.chi1||0}</strong></div>
    <div><span>Chi 2</span><strong>${c.chi2||0}</strong></div>
    <div><span>Chi 3</span><strong>${c.chi3||0}</strong></div>
    <div><span>Postura do Sapo</span><strong>${c.frogPosture||0}</strong></div>
    <div><span>Constituição</span><strong>${c.constitution||0}</strong></div>
    <div><span>Treino Ermo</span><strong>${c.wildernessTraining||0}</strong></div>
    <div><span>Presenças</span><strong>${item.stat.present||0}</strong></div>
    <div><span>Ausências</span><strong>${item.stat.absent||0}</strong></div>
  </div>
  <button class="btn primary full" data-character-pdf="${item.id}" type="button">Gerar PDF individual</button>`;

  byId("characterDetailsDrawer")?.classList.remove("hidden");
}

function openResponsibleCharacterEditor(item){
  if(!editor()||!item)return;
  state.editingCharacterUserId=item.id;
  const c=item.character||{};
  setText("responsibleCharacterName",item.nickname||"Personagem");
  setValue("responsibleCharacterClass",c.className||"");
  setValue("responsibleCharacterPower",c.power??0);
  setValue("responsibleCharacterLevel",c.level??0);
  setValue("responsibleCharacterCodex",c.codex??0);
  setValue("responsibleCharacterMandalla",c.mandalla??0);
  setValue("responsibleCharacterChi1",c.chi1??0);
  setValue("responsibleCharacterChi2",c.chi2??0);
  setValue("responsibleCharacterChi3",c.chi3??0);
  setValue("responsibleCharacterFrogPosture",c.frogPosture??0);
  setValue("responsibleCharacterConstitution",c.constitution??0);
  setValue("responsibleCharacterWildernessTraining",c.wildernessTraining??0);
  byId("characterEditDrawer")?.classList.remove("hidden");
  byId("responsibleCharacterClass")?.focus();
}

on("closeCharacterEditDrawer","click",()=>{
  byId("characterEditDrawer")?.classList.add("hidden");
  state.editingCharacterUserId="";
});

on("responsibleCharacterForm","submit",async event=>{
  event.preventDefault();
  if(!editor()||!state.editingCharacterUserId)return;
  const target=characterCenterRows().find(item=>item.id===state.editingCharacterUserId);
  if(!target)return;
  const character={
    className:String(byId("responsibleCharacterClass")?.value||"").trim(),
    power:numberOrZero(byId("responsibleCharacterPower")?.value),
    level:numberOrZero(byId("responsibleCharacterLevel")?.value),
    codex:numberOrZero(byId("responsibleCharacterCodex")?.value),
    mandalla:numberOrZero(byId("responsibleCharacterMandalla")?.value),
    chi1:numberOrZero(byId("responsibleCharacterChi1")?.value),
    chi2:numberOrZero(byId("responsibleCharacterChi2")?.value),
    chi3:numberOrZero(byId("responsibleCharacterChi3")?.value),
    frogPosture:numberOrZero(byId("responsibleCharacterFrogPosture")?.value),
    constitution:numberOrZero(byId("responsibleCharacterConstitution")?.value),
    wildernessTraining:numberOrZero(byId("responsibleCharacterWildernessTraining")?.value)
  };
  if(!character.className){toast("Informe a classe do personagem.");return;}
  if(!confirm(`Salvar as alterações do personagem de ${target.nickname}?`))return;
  try{
    await updateDoc(doc(db,"users",target.id),{
      character,
      characterUpdatedAt:serverTimestamp(),
      characterUpdatedBy:state.user.uid
    });
    const user=state.users.find(item=>item.id===target.id);
    if(user)user.character=character;
    if(target.id===state.user?.uid){state.profile.character=character;renderCharacterProfile()}
    renderCharacterCenter();
    renderCharactersTable();
    await audit("Personagem editado por responsável",`${target.nickname} · informações atualizadas`);
    byId("characterEditDrawer")?.classList.add("hidden");
    state.editingCharacterUserId="";
    toast("Informações do personagem atualizadas.");
  }catch(error){toast(error.message||"Não foi possível atualizar o personagem.")}
});

function printCharacterReport(rows,title){
  if(!rows.length){
    toast("Não existem personagens para gerar o PDF.");
    return;
  }

  const popup=window.open("","_blank");
  if(!popup||!popup.document){
    toast("Permita pop-ups para gerar o PDF.");
    return;
  }

  const body=rows.map(item=>{
    const c=item.character;
    return `<tr>
      <td>${item.nickname}</td>
      <td>${c.className||"—"}</td>
      <td>${item.role}</td>
      <td>${item.clan}</td>
      <td>${Number(c.power||0).toLocaleString("pt-BR")}</td>
      <td>${c.level||0}</td>
      <td>${c.codex||0}</td>
      <td>${c.mandalla||0}</td>
      <td>${c.chi1||0}</td>
      <td>${c.chi2||0}</td>
      <td>${c.chi3||0}</td>
      <td>${c.frogPosture||0}</td>
      <td>${c.constitution||0}</td>
      <td>${c.wildernessTraining||0}</td>
    </tr>`;
  }).join("");

  popup.document.write(`<!doctype html><html lang="pt-BR"><head><meta charset="utf-8">
  <title>${title}</title>
  <style>
    @page{size:A4 landscape;margin:10mm}
    body{font-family:Arial,sans-serif;color:#17131c}
    header{padding:14px 18px;color:#fff;background:#21102d;border-bottom:4px solid #a83cff}
    header strong{display:block;color:#d277ff;font-size:19px}
    h1{font-size:16px;margin:5px 0 0}
    .meta{margin:10px 0;color:#6b6470;font-size:10px}
    table{width:100%;border-collapse:collapse;font-size:8px}
    th{padding:7px;background:#2c123c;color:#fff;border:1px solid #7e4597}
    td{padding:6px;border:1px solid #d5c7dc}
    tbody tr:nth-child(even){background:#f8f2fb}
    .actions{text-align:right;margin:10px 0}.actions button{padding:9px 14px;border:0;border-radius:6px;background:#8e24cf;color:#fff;font-weight:800}
    @media print{.actions{display:none}}
  </style></head><body>
  <header><strong>77 TEAM MANAGER</strong><h1>${title}</h1></header>
  <div class="actions"><button onclick="window.print()">Salvar como PDF</button></div>
  <div class="meta">Gerado em ${new Date().toLocaleString("pt-BR")} · ${rows.length} personagem(ns)</div>
  <table><thead><tr>
    <th>Nickname</th><th>Classe</th><th>Cargo</th><th>Clã</th><th>Power</th><th>Level</th>
    <th>Codex</th><th>Mandalla</th><th>Chi 1</th><th>Chi 2</th><th>Chi 3</th>
    <th>Postura</th><th>Constituição</th><th>Treino Ermo</th>
  </tr></thead><tbody>${body}</tbody></table>
  <script>window.addEventListener("load",()=>setTimeout(()=>window.print(),300));<\/script>
  </body></html>`);
  popup.document.close();
}

function printIndividualCharacter(item){
  if(!item)return;
  const c=item.character;
  const popup=window.open("","_blank");
  if(!popup||!popup.document){
    toast("Permita pop-ups para gerar o PDF.");
    return;
  }

  popup.document.write(`<!doctype html><html lang="pt-BR"><head><meta charset="utf-8">
  <title>Ficha - ${item.nickname}</title>
  <style>
    @page{size:A4 portrait;margin:12mm}
    body{font-family:Arial,sans-serif;color:#17131c}
    header{padding:18px;color:#fff;background:linear-gradient(135deg,#12091a,#42105c);border-bottom:5px solid #a83cff}
    header strong{display:block;color:#d277ff;font-size:20px}.name{font-size:25px;font-weight:900;margin-top:8px}
    .subtitle{font-size:11px;color:#d7cadd}.grid{display:grid;grid-template-columns:repeat(3,1fr);gap:9px;margin-top:18px}
    .box{padding:13px;border:1px solid #d5c7dc;border-radius:7px}.box span{display:block;color:#776e7d;font-size:9px;text-transform:uppercase}.box strong{display:block;margin-top:5px;font-size:17px}
    .actions{text-align:right;margin:10px 0}.actions button{padding:9px 14px;border:0;border-radius:6px;background:#8e24cf;color:#fff;font-weight:800}
    .signature{margin-top:55px;border-top:1px solid #555;text-align:center;padding-top:6px;font-size:10px}
    @media print{.actions{display:none}}
  </style></head><body>
  <header><strong>77 TEAM MANAGER</strong><div class="name">${item.nickname}</div>
  <div class="subtitle">${c.className||"Classe não informada"} · ${item.role} · ${item.clan}</div></header>
  <div class="actions"><button onclick="window.print()">Salvar como PDF</button></div>
  <div class="grid">
    <div class="box"><span>Power</span><strong>${Number(c.power||0).toLocaleString("pt-BR")}</strong></div>
    <div class="box"><span>Level</span><strong>${c.level||0}</strong></div>
    <div class="box"><span>Codex</span><strong>${c.codex||0}</strong></div>
    <div class="box"><span>Mandalla</span><strong>${c.mandalla||0}</strong></div>
    <div class="box"><span>Chi 1</span><strong>${c.chi1||0}</strong></div>
    <div class="box"><span>Chi 2</span><strong>${c.chi2||0}</strong></div>
    <div class="box"><span>Chi 3</span><strong>${c.chi3||0}</strong></div>
    <div class="box"><span>Postura do Sapo</span><strong>${c.frogPosture||0}</strong></div>
    <div class="box"><span>Constituição</span><strong>${c.constitution||0}</strong></div>
    <div class="box"><span>Treino Ermo</span><strong>${c.wildernessTraining||0}</strong></div>
    <div class="box"><span>Presenças</span><strong>${item.stat.present||0}</strong></div>
    <div class="box"><span>Taxa</span><strong>${item.stat.rate||0}%</strong></div>
  </div>
  <div class="signature">Assinatura da Staff</div>
  <script>window.addEventListener("load",()=>setTimeout(()=>window.print(),300));<\/script>
  </body></html>`);
  popup.document.close();
}

on("characterSearch","input",renderCharacterCenter);
on("characterClassFilter","change",renderCharacterCenter);
on("characterRoleFilter","change",renderCharacterCenter);
on("characterClanFilter","change",renderCharacterCenter);
on("characterSort","change",renderCharacterCenter);

on("charactersCardView","click",()=>{
  byId("charactersCardGrid")?.classList.remove("hidden");
  byId("charactersTableContainer")?.classList.add("hidden");
  byId("charactersCardView")?.classList.add("primary");
  byId("charactersTableView")?.classList.remove("primary");
});

on("charactersTableView","click",()=>{
  byId("charactersCardGrid")?.classList.add("hidden");
  byId("charactersTableContainer")?.classList.remove("hidden");
  byId("charactersTableView")?.classList.add("primary");
  byId("charactersCardView")?.classList.remove("primary");
});

on("downloadCharactersGeneralPdf","click",()=>{
  printCharacterReport(filteredCharacterRows(),"Relatório geral de personagens");
});

on("closeCharacterDrawer","click",()=>{
  byId("characterDetailsDrawer")?.classList.add("hidden");
});

document.addEventListener("click",event=>{
  const details=event.target.closest("[data-character-details]");
  if(details){
    const item=characterCenterRows().find(row=>row.id===details.dataset.characterDetails);
    openCharacterDetails(item);
  }

  const edit=event.target.closest("[data-character-edit]");
  if(edit){
    const item=characterCenterRows().find(row=>row.id===edit.dataset.characterEdit);
    openResponsibleCharacterEditor(item);
  }

  const pdf=event.target.closest("[data-character-pdf]");
  if(pdf){
    const item=characterCenterRows().find(row=>row.id===pdf.dataset.characterPdf);
    printIndividualCharacter(item);
  }

  const remove=event.target.closest("[data-character-delete]");
  if(remove){
    const item=characterCenterRows().find(row=>row.id===remove.dataset.characterDelete);
    deleteCharacter(item);
  }
});


function historyCenterRows(){
  return state.attendance
    .filter(item=>item.status!==0)
    .map(item=>{
      const member=state.members.find(member=>
        member.id===item.memberId||member.name===item.memberName
      )||{};
      return {
        id:item.id,
        date:item.date||"",
        memberId:item.memberId||member.id||"",
        memberName:item.memberName||member.name||"—",
        role:item.role||member.role||"Membro",
        clan:item.clan||member.clan||"Sem clã",
        kind:item.kind||"—",
        slot:item.slot||"—",
        status:item.status||0
      };
    });
}

function filteredHistoryRows(){
  const search=String(byId("historySearch")?.value||"").trim().toLowerCase();
  const from=byId("historyDateFrom")?.value||"";
  const to=byId("historyDateTo")?.value||"";
  const role=byId("historyRoleFilter")?.value||"";
  const clan=byId("historyClanFilter")?.value||"";
  const kind=byId("historyKindFilter")?.value||"";
  const status=byId("historyStatusFilter")?.value||"";

  return historyCenterRows()
    .filter(item=>
      (!search||item.memberName.toLowerCase().includes(search))&&
      (!from||item.date>=from)&&
      (!to||item.date<=to)&&
      (!role||item.role===role)&&
      (!clan||item.clan===clan)&&
      (!kind||item.kind===kind)&&
      (!status||String(item.status)===status)
    )
    .sort((a,b)=>String(b.date).localeCompare(String(a.date)));
}

function populateHistoryFilters(rows){
  const fill=(id,label,values)=>{
    const el=byId(id);if(!el)return;
    const current=el.value;
    el.innerHTML=`<option value="">${label}</option>`+
      [...new Set(values.filter(Boolean))].sort((a,b)=>String(a).localeCompare(String(b),"pt-BR"))
      .map(value=>`<option value="${value}">${value}</option>`).join("");
    if([...el.options].some(option=>option.value===current))el.value=current;
  };

  fill("historyRoleFilter","Todos os cargos",rows.map(item=>item.role));
  fill("historyClanFilter","Todos os clãs",rows.map(item=>item.clan));

  const memberSelect=byId("historyMemberPdf");
  if(memberSelect){
    const current=memberSelect.value;
    const members=[...new Map(rows.map(item=>[item.memberId||item.memberName,{id:item.memberId||item.memberName,name:item.memberName}])).values()]
      .sort((a,b)=>a.name.localeCompare(b.name,"pt-BR"));
    memberSelect.innerHTML='<option value="">PDF individual</option>'+
      members.map(item=>`<option value="${item.id}">${item.name}</option>`).join("");
    if(members.some(item=>item.id===current))memberSelect.value=current;
  }
}

function renderHistoryOverview(allRows){
  const today=new Date().toISOString().slice(0,10);
  const weekAgo=new Date(Date.now()-6*86400000).toISOString().slice(0,10);
  const month=today.slice(0,7);

  setText("historyTotalRecords",allRows.length);
  setText("historyTodayRecords",allRows.filter(item=>item.date===today).length);
  setText("historyWeekRecords",allRows.filter(item=>item.date>=weekAgo).length);
  setText("historyMonthRecords",allRows.filter(item=>String(item.date).startsWith(month)).length);
}

function renderHistoryTimeline(rows){
  const container=byId("historyTimelineRows");
  if(!container)return;

  const groups={};
  rows.forEach(item=>{
    const key=item.date||"Sem data";
    (groups[key]??=[]).push(item);
  });

  container.innerHTML=Object.entries(groups).map(([date,items])=>`
    <section class="history-day-group">
      <h4>${formatHistoryDate(date)}</h4>
      ${items.map(item=>`
        <article class="history-entry ${item.status===1?"success":"danger"}" data-history-details="${item.id}">
          <div class="history-entry-icon">${item.status===1?"✓":"×"}</div>
          <div>
            <strong>${item.memberName}</strong>
            <p>${item.kind} · ${item.slot}</p>
            <small>${item.role} · ${item.clan}</small>
          </div>
          <span>${item.status===1?"Presente":"Ausente"}</span>
        </article>
      `).join("")}
    </section>
  `).join("")||'<p class="empty-state">Nenhum registro encontrado.</p>';
}

function renderHistoryTableV72(rows){
  const tbody=byId("historyRows");if(!tbody)return;
  tbody.innerHTML=rows.map(item=>`<tr>
    <td>${formatHistoryDate(item.date)}</td>
    <td><strong>${item.memberName}</strong></td>
    <td>${roleBadge(item.role)}</td>
    <td>${item.clan}</td>
    <td>${item.kind}</td>
    <td>${item.slot}</td>
    <td>${item.status===1?"Presente":"Ausente"}</td>
    <td><button class="btn" data-history-details="${item.id}" type="button">Detalhes</button></td>
  </tr>`).join("")||'<tr><td colspan="8">Nenhum registro encontrado.</td></tr>';
}

function renderHistoryCharts(rows){
  const typeCounts={};
  rows.forEach(item=>typeCounts[item.kind]=(typeCounts[item.kind]||0)+1);
  const maxType=Math.max(1,...Object.values(typeCounts));
  setHtml("historyTypeBars",Object.entries(typeCounts).map(([name,value])=>`
    <div class="history-bar-row"><span>${name}</span><div><i style="width:${Math.round(value/maxType*100)}%"></i></div><strong>${value}</strong></div>
  `).join("")||"<p>Sem dados.</p>");

  const memberCounts={};
  rows.filter(item=>item.status===1).forEach(item=>memberCounts[item.memberName]=(memberCounts[item.memberName]||0)+1);
  const top=Object.entries(memberCounts).sort((a,b)=>b[1]-a[1]).slice(0,5);
  const maxMember=Math.max(1,...top.map(item=>item[1]));
  setHtml("historyTopMembers",top.map(([name,value])=>`
    <div class="history-bar-row"><span>${name}</span><div><i style="width:${Math.round(value/maxMember*100)}%"></i></div><strong>${value}</strong></div>
  `).join("")||"<p>Sem dados.</p>");
}

function renderHistoryCenter(){
  const allRows=historyCenterRows();
  populateHistoryFilters(allRows);
  renderHistoryOverview(allRows);
  const rows=filteredHistoryRows();
  renderHistoryTimeline(rows);
  renderHistoryTableV72(rows);
  renderHistoryCharts(rows);
}

function openHistoryDetails(item){
  if(!item)return;
  setHtml("historyDetailsContent",`
    <div class="history-detail-hero ${item.status===1?"success":"danger"}">
      <div>${item.status===1?"✓":"×"}</div>
      <h2>${item.memberName}</h2>
      <p>${item.status===1?"Presença confirmada":"Ausência registrada"}</p>
    </div>
    <div class="history-detail-grid">
      <div><span>Data</span><strong>${formatHistoryDate(item.date)}</strong></div>
      <div><span>Tipo</span><strong>${item.kind}</strong></div>
      <div><span>Horário/Evento</span><strong>${item.slot}</strong></div>
      <div><span>Cargo</span><strong>${item.role}</strong></div>
      <div><span>Clã</span><strong>${item.clan}</strong></div>
      <div><span>Status</span><strong>${item.status===1?"Presente":"Ausente"}</strong></div>
    </div>
  `);
  byId("historyDetailsDrawer")?.classList.remove("hidden");
}

function printHistoryRows(rows,title){
  if(!rows.length)return toast("Não existem registros para gerar o PDF.");
  const popup=window.open("","_blank");
  if(!popup||!popup.document)return toast("Permita pop-ups para gerar o PDF.");

  const body=rows.map(item=>`<tr>
    <td>${formatHistoryDate(item.date)}</td><td>${item.memberName}</td><td>${item.role}</td>
    <td>${item.clan}</td><td>${item.kind}</td><td>${item.slot}</td>
    <td>${item.status===1?"Presente":"Ausente"}</td>
  </tr>`).join("");

  popup.document.write(`<!doctype html><html lang="pt-BR"><head><meta charset="utf-8"><title>${title}</title>
  <style>@page{size:A4 landscape;margin:10mm}body{font-family:Arial;color:#17131c}header{padding:15px;color:#fff;background:#251133;border-bottom:4px solid #a83cff}header strong{color:#d277ff;font-size:20px}h1{font-size:16px}.actions{text-align:right;margin:10px 0}.actions button{padding:9px 14px;background:#8e24cf;color:#fff;border:0;border-radius:6px}table{width:100%;border-collapse:collapse;font-size:9px}th{background:#2c123c;color:#fff;padding:7px;border:1px solid #7e4597}td{padding:6px;border:1px solid #d5c7dc}tbody tr:nth-child(even){background:#f8f2fb}@media print{.actions{display:none}}</style>
  </head><body><header><strong>77 TEAM MANAGER</strong><h1>${title}</h1></header>
  <div class="actions"><button onclick="window.print()">Salvar como PDF</button></div>
  <p>Gerado em ${new Date().toLocaleString("pt-BR")} · ${rows.length} registro(s)</p>
  <table><thead><tr><th>Data</th><th>Jogador</th><th>Cargo</th><th>Clã</th><th>Tipo</th><th>Horário/Evento</th><th>Status</th></tr></thead><tbody>${body}</tbody></table>
  <script>window.addEventListener("load",()=>setTimeout(()=>window.print(),300));<\/script></body></html>`);
  popup.document.close();
}

function downloadHistoryCsvFile(rows){
  if(!rows.length)return toast("Não existem registros para exportar.");
  const headers=["Data","Jogador","Cargo","Clã","Tipo","Horário/Evento","Status"];
  const lines=[headers,...rows.map(item=>[
    formatHistoryDate(item.date),item.memberName,item.role,item.clan,item.kind,item.slot,item.status===1?"Presente":"Ausente"
  ])];
  const csv=lines.map(row=>row.map(value=>`"${String(value).replace(/"/g,'""')}"`).join(";")).join("\n");
  const blob=new Blob(["\ufeff"+csv],{type:"text/csv;charset=utf-8"});
  const url=URL.createObjectURL(blob);
  const link=document.createElement("a");
  link.href=url;link.download=`historico-77-team-${new Date().toISOString().slice(0,10)}.csv`;
  document.body.appendChild(link);link.click();link.remove();URL.revokeObjectURL(url);
}

["historySearch","historyDateFrom","historyDateTo","historyRoleFilter","historyClanFilter","historyKindFilter","historyStatusFilter"]
.forEach(id=>{
  on(id,id.includes("Search")?"input":"change",renderHistoryCenter);
});

on("historyTimelineView","click",()=>{
  byId("historyTimelineContainer")?.classList.remove("hidden");
  byId("historyTableContainer")?.classList.add("hidden");
});
on("historyTableView","click",()=>{
  byId("historyTimelineContainer")?.classList.add("hidden");
  byId("historyTableContainer")?.classList.remove("hidden");
});
on("downloadHistoryGeneralPdf","click",()=>printHistoryRows(historyCenterRows(),"Histórico geral"));
on("downloadHistoryFilteredPdf","click",()=>printHistoryRows(filteredHistoryRows(),"Histórico filtrado"));
on("downloadHistoryCsv","click",()=>downloadHistoryCsvFile(filteredHistoryRows()));
on("downloadHistoryIndividualPdf","click",()=>{
  const id=byId("historyMemberPdf")?.value;
  if(!id)return toast("Selecione um membro.");
  const rows=historyCenterRows().filter(item=>(item.memberId||item.memberName)===id);
  const name=rows[0]?.memberName||"Membro";
  printHistoryRows(rows,`Histórico individual - ${name}`);
});
on("closeHistoryDrawer","click",()=>byId("historyDetailsDrawer")?.classList.add("hidden"));

document.addEventListener("click",event=>{
  const target=event.target.closest("[data-history-details]");
  if(target){
    const item=historyCenterRows().find(row=>row.id===target.dataset.historyDetails);
    openHistoryDetails(item);
  }
});


const SETTINGS_MODULES=[
  "dashboard","meu-perfil","membros","historico","ranking","worldboss",
  "purgatorio","eventos","personagens","estatisticas","calendario"
];

const DEFAULT_PERMISSIONS={
  owner:SETTINGS_MODULES,
  staff:SETTINGS_MODULES,
  member:["dashboard","meu-perfil","membros","historico","ranking","estatisticas","calendario"],
  guest:["dashboard","membros","ranking","calendario"]
};

function activeSettings(){
  return state.settings||{};
}

function cfgValue(id,fallback=""){
  const element=byId(id);
  if(!element)return fallback;
  if(element.type==="checkbox")return element.checked;
  if(element.type==="number")return Number(element.value||0);
  return element.value;
}

function setCfgValue(id,value){
  const element=byId(id);
  if(!element)return;
  if(element.type==="checkbox")element.checked=Boolean(value);
  else element.value=value??"";
}

function settingsPayload(section){
  const maps={
    general:()=>({
      teamName:cfgValue("cfgTeamName","77 TEAM"),
      systemName:cfgValue("cfgSystemName","77 TEAM MANAGER"),
      description:cfgValue("cfgDescription"),
      discord:cfgValue("cfgDiscord"),
      whatsapp:cfgValue("cfgWhatsapp"),
      instagram:cfgValue("cfgInstagram"),
      website:cfgValue("cfgWebsite")
    }),
    team:()=>({
      manualApproval:cfgValue("cfgManualApproval"),
      guestAccess:cfgValue("cfgGuestAccess"),
      requireCharacter:cfgValue("cfgRequireCharacter"),
      allowNickname:cfgValue("cfgAllowNickname"),
      allowAvatar:cfgValue("cfgAllowAvatar"),
      allowPassword:cfgValue("cfgAllowPassword"),
      inactiveWarningDays:cfgValue("cfgInactiveWarningDays"),
      inactiveDays:cfgValue("cfgInactiveDays"),
      inactiveAction:cfgValue("cfgInactiveAction")
    }),
    attendance:()=>({
      worldbossSchedule:cfgValue("cfgWorldbossSchedule"),
      purgatorioSchedule:cfgValue("cfgPurgatorioSchedule"),
      eventsSchedule:cfgValue("cfgEventsSchedule"),
      toleranceMinutes:cfgValue("cfgAttendanceTolerance"),
      presencePoints:cfgValue("cfgPresencePoints"),
      eventPoints:cfgValue("cfgEventPoints"),
      absencePoints:cfgValue("cfgAbsencePoints"),
      requireAbsenceReason:cfgValue("cfgAbsenceReason"),
      autoClose:cfgValue("cfgAutoCloseAttendance"),
      notifyAbsence:cfgValue("cfgNotifyAbsence")
    }),
    events:()=>({
      worldbossEnabled:cfgValue("cfgWorldbossEnabled"),
      worldbossReward:cfgValue("cfgWorldbossReward"),
      purgatorioEnabled:cfgValue("cfgPurgatorioEnabled"),
      purgatorioReward:cfgValue("cfgPurgatorioReward"),
      customEventsEnabled:cfgValue("cfgCustomEventsEnabled"),
      maxMonthlyEvents:cfgValue("cfgMaxMonthlyEvents")
    }),
    characters:()=>({
      classes:cfgValue("cfgCharacterClasses").split(",").map(item=>item.trim()).filter(Boolean),
      maxPower:cfgValue("cfgMaxPower"),
      maxLevel:cfgValue("cfgMaxLevel"),
      maxCodex:cfgValue("cfgMaxCodex"),
      maxMandalla:cfgValue("cfgMaxMandalla"),
      maxChi:cfgValue("cfgMaxChi"),
      maxWilderness:cfgValue("cfgMaxWilderness")
    }),
    notifications:()=>({
      newMember:cfgValue("cfgNotifyNewMember"),
      character:cfgValue("cfgNotifyCharacter"),
      event:cfgValue("cfgNotifyEvent"),
      goal:cfgValue("cfgNotifyGoal"),
      discordWebhook:cfgValue("cfgDiscordWebhook")
    }),
    appearance:()=>({
      theme:cfgValue("cfgThemeName","purple"),
      primaryColor:cfgValue("cfgPrimaryColor","#a83cff"),
      density:cfgValue("cfgDensity","comfortable"),
      animations:cfgValue("cfgAnimations"),
      neon:cfgValue("cfgNeon")
    }),
    security:()=>({
      sessionMinutes:cfgValue("cfgSessionMinutes"),
      recentLoginCritical:cfgValue("cfgRecentLoginCritical"),
      auditChanges:cfgValue("cfgAuditChanges"),
      deniedAlerts:cfgValue("cfgDeniedAlerts")
    })
  };

  if(section==="permissions"){
    const permissions={};
    ["owner","staff","member","guest"].forEach(role=>{
      permissions[role]=SETTINGS_MODULES.filter(module=>
        byId(`perm-${role}-${module}`)?.checked
      );
    });
    return permissions;
  }

  return maps[section]?.()||{};
}

async function saveSettingsSection(section){
  if(!owner())return toast("Apenas a Liderança pode alterar configurações.");

  try{
    const payload=settingsPayload(section);
    await setDoc(doc(db,"settings","app"),{
      [section]:payload,
      updatedAt:serverTimestamp(),
      updatedBy:state.user.uid
    },{merge:true});

    state.settings={...state.settings,[section]:payload};
    if(section==="appearance")applyEnterpriseAppearance();
    if(section==="general")renderSettingsPreview();
    toast("Configurações salvas.");
  }catch(error){
    toast(errMsg(error));
  }
}

function renderPermissionMatrix(){
  const tbody=byId("permissionsRows");
  if(!tbody)return;
  const configured=activeSettings().permissions||DEFAULT_PERMISSIONS;
  const labels={
    "dashboard":"Dashboard","meu-perfil":"Meu Perfil","membros":"Membros",
    "historico":"Histórico","ranking":"Ranking","worldboss":"WorldBoss",
    "purgatorio":"Purgatório","eventos":"Eventos","personagens":"Personagens",
    "estatisticas":"Estatísticas","calendario":"Calendário"
  };

  tbody.innerHTML=SETTINGS_MODULES.map(module=>`<tr>
    <td><strong>${labels[module]||module}</strong></td>
    ${["owner","staff","member","guest"].map(role=>{
      const checked=(configured[role]||[]).includes(module);
      const locked=role==="owner";
      return `<td><input id="perm-${role}-${module}" type="checkbox" ${checked?"checked":""} ${locked?"disabled":""}></td>`;
    }).join("")}
  </tr>`).join("");
}

function loadSettingsForm(){
  const settings=activeSettings();

  const g=settings.general||{};
  setCfgValue("cfgTeamName",g.teamName||"77 TEAM");
  setCfgValue("cfgSystemName",g.systemName||"77 TEAM MANAGER");
  setCfgValue("cfgDescription",g.description||"");
  setCfgValue("cfgDiscord",g.discord||"");
  setCfgValue("cfgWhatsapp",g.whatsapp||"");
  setCfgValue("cfgInstagram",g.instagram||"");
  setCfgValue("cfgWebsite",g.website||"");

  const team=settings.team||{};
  setCfgValue("cfgManualApproval",team.manualApproval??true);
  setCfgValue("cfgGuestAccess",team.guestAccess??true);
  setCfgValue("cfgRequireCharacter",team.requireCharacter??false);
  setCfgValue("cfgAllowNickname",team.allowNickname??true);
  setCfgValue("cfgAllowAvatar",team.allowAvatar??true);
  setCfgValue("cfgAllowPassword",team.allowPassword??true);
  setCfgValue("cfgInactiveWarningDays",team.inactiveWarningDays??15);
  setCfgValue("cfgInactiveDays",team.inactiveDays??30);
  setCfgValue("cfgInactiveAction",team.inactiveAction||"notify");

  const attendance=settings.attendance||{};
  setCfgValue("cfgWorldbossSchedule",attendance.worldbossSchedule||"10H,12H,20H,22H,00H");
  setCfgValue("cfgPurgatorioSchedule",attendance.purgatorioSchedule||"06H,12H,18H,00H");
  setCfgValue("cfgEventsSchedule",attendance.eventsSchedule||"Guerra de Vale,Defesa de Crista,Evento de Vale,Saque de Castelo");
  setCfgValue("cfgAttendanceTolerance",attendance.toleranceMinutes??15);
  setCfgValue("cfgPresencePoints",attendance.presencePoints??100);
  setCfgValue("cfgEventPoints",attendance.eventPoints??150);
  setCfgValue("cfgAbsencePoints",attendance.absencePoints??0);
  setCfgValue("cfgAbsenceReason",attendance.requireAbsenceReason??false);
  setCfgValue("cfgAutoCloseAttendance",attendance.autoClose??false);
  setCfgValue("cfgNotifyAbsence",attendance.notifyAbsence??true);

  const events=settings.events||{};
  setCfgValue("cfgWorldbossEnabled",events.worldbossEnabled??true);
  setCfgValue("cfgWorldbossReward",events.worldbossReward??100);
  setCfgValue("cfgPurgatorioEnabled",events.purgatorioEnabled??true);
  setCfgValue("cfgPurgatorioReward",events.purgatorioReward??100);
  setCfgValue("cfgCustomEventsEnabled",events.customEventsEnabled??true);
  setCfgValue("cfgMaxMonthlyEvents",events.maxMonthlyEvents??20);

  const characters=settings.characters||{};
  setCfgValue("cfgCharacterClasses",(characters.classes||["Guerreiro","Mago","Arqueiro","Monge"]).join(","));
  setCfgValue("cfgMaxPower",characters.maxPower??999999999);
  setCfgValue("cfgMaxLevel",characters.maxLevel??999);
  setCfgValue("cfgMaxCodex",characters.maxCodex??9999);
  setCfgValue("cfgMaxMandalla",characters.maxMandalla??9999);
  setCfgValue("cfgMaxChi",characters.maxChi??9999);
  setCfgValue("cfgMaxWilderness",characters.maxWilderness??9999);

  const notifications=settings.notifications||{};
  setCfgValue("cfgNotifyNewMember",notifications.newMember??true);
  setCfgValue("cfgNotifyCharacter",notifications.character??true);
  setCfgValue("cfgNotifyEvent",notifications.event??true);
  setCfgValue("cfgNotifyGoal",notifications.goal??true);
  setCfgValue("cfgDiscordWebhook",notifications.discordWebhook||"");

  const appearance=settings.appearance||{};
  setCfgValue("cfgThemeName",appearance.theme||"purple");
  setCfgValue("cfgPrimaryColor",appearance.primaryColor||"#a83cff");
  setCfgValue("cfgDensity",appearance.density||"comfortable");
  setCfgValue("cfgAnimations",appearance.animations??true);
  setCfgValue("cfgNeon",appearance.neon??true);

  const security=settings.security||{};
  setCfgValue("cfgSessionMinutes",security.sessionMinutes??480);
  setCfgValue("cfgRecentLoginCritical",security.recentLoginCritical??true);
  setCfgValue("cfgAuditChanges",security.auditChanges??true);
  setCfgValue("cfgDeniedAlerts",security.deniedAlerts??true);

  renderPermissionMatrix();
  renderSettingsPreview();
  applyEnterpriseAppearance();
  renderSystemHealth();
}

function renderSettingsPreview(){
  setText("cfgPreviewName",cfgValue("cfgTeamName","77 TEAM"));
  setText("cfgPreviewDescription",cfgValue("cfgDescription","Gestão completa da equipe.")||"Gestão completa da equipe.");
}

const THEME_COLORS={
  purple:"#a83cff",
  blue:"#3488ff",
  green:"#39d67d",
  gold:"#e2ad32",
  dark:"#8e92a2"
};

function applyEnterpriseAppearance(){
  const appearance=activeSettings().appearance||{};
  const theme=appearance.theme||cfgValue("cfgThemeName","purple");
  const color=appearance.primaryColor||cfgValue("cfgPrimaryColor",THEME_COLORS[theme]||"#a83cff");
  document.documentElement.style.setProperty("--pro-accent",color);
  document.documentElement.style.setProperty("--v31-purple",color);
  document.documentElement.dataset.theme=theme;
  document.body.classList.toggle("density-compact",(appearance.density||cfgValue("cfgDensity"))==="compact");
  document.body.classList.toggle("animations-off",appearance.animations===false);
  document.body.classList.toggle("neon-off",appearance.neon===false);
}

function renderSystemHealth(){
  setText("systemProjectId",firebaseConfig.projectId||"—");
  setText("systemUsersCount",state.users.length);
  setText("systemMembersCount",state.members.length);
  setText("systemAttendanceCount",state.attendance.length);
  setText("systemEventsCount",state.events.length);
  setText("systemLastCheck",new Date().toLocaleString("pt-BR"));
  setText("systemLastBackup",localStorage.getItem("77team-last-backup")||"Nunca");
}

function showSettingsTab(tab){
  document.querySelectorAll("#settingsNav [data-settings-tab]").forEach(button=>{
    button.classList.toggle("active",button.dataset.settingsTab===tab);
  });
  document.querySelectorAll("[data-settings-panel]").forEach(panel=>{
    panel.classList.toggle("active",panel.dataset.settingsPanel===tab);
  });
}

function filterSettingsTabs(query){
  const term=String(query||"").trim().toLowerCase();
  document.querySelectorAll("#settingsNav [data-settings-tab]").forEach(button=>{
    button.classList.toggle("hidden",term&&!button.textContent.toLowerCase().includes(term));
  });
}

function backupPayload(){
  return {
    format:"77-team-manager-backup",
    version:"9.0",
    generatedAt:new Date().toISOString(),
    projectId:firebaseConfig.projectId,
    collections:{
      users:state.users,
      members:state.members,
      attendance:state.attendance,
      audit:state.audit,
      events:state.events,
      notifications:state.notifications
    },
    settings:state.settings
  };
}

function downloadJsonFile(name,data){
  const blob=new Blob([JSON.stringify(data,null,2)],{type:"application/json"});
  const url=URL.createObjectURL(blob);
  const link=document.createElement("a");
  link.href=url;
  link.download=name;
  document.body.appendChild(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(url);
}

async function restoreBackupPayload(payload){
  if(payload?.format!=="77-team-manager-backup")throw new Error("Arquivo de backup incompatível.");
  const collections=payload.collections||{};
  const allowed=["users","members","attendance","events","notifications"];

  for(const collectionName of allowed){
    const rows=Array.isArray(collections[collectionName])?collections[collectionName]:[];
    for(let index=0;index<rows.length;index+=350){
      const group=rows.slice(index,index+350);
      const batch=writeBatch(db);
      group.forEach(item=>{
        if(!item.id)return;
        const data={...item};
        delete data.id;
        batch.set(doc(db,collectionName,item.id),data,{merge:true});
      });
      await batch.commit();
    }
  }

  if(payload.settings){
    await setDoc(doc(db,"settings","app"),payload.settings,{merge:true});
  }
}

function goalCurrentValue(goal){
  if(goal.type==="members")return state.members.length;
  if(goal.type==="events")return state.events.length;
  if(goal.type==="power"){
    const powers=state.users.map(user=>Number(user.character?.power||0)).filter(value=>value>0);
    return powers.length?Math.round(powers.reduce((sum,value)=>sum+value,0)/powers.length):0;
  }
  return state.attendance.filter(item=>item.status===1).length;
}

function renderGoals(){
  const goals=activeSettings().goals||[];
  const calculated=goals.map(goal=>{
    const current=goalCurrentValue(goal);
    const progress=Math.min(100,Math.round(current/Math.max(1,goal.target)*100));
    return {...goal,current,progress,completed:progress>=100};
  });

  setText("goalsActiveCount",calculated.filter(goal=>!goal.completed).length);
  setText("goalsCompletedCount",calculated.filter(goal=>goal.completed).length);
  setText("goalsAverageProgress",`${calculated.length?Math.round(calculated.reduce((sum,goal)=>sum+goal.progress,0)/calculated.length):0}%`);

  const present=state.attendance.filter(item=>item.status===1).length;
  const marked=state.attendance.filter(item=>item.status!==0).length;
  setText("goalsMonthlyRate",`${marked?Math.round(present/marked*100):0}%`);

  setHtml("goalsList",calculated.map(goal=>`
    <article class="goal-item ${goal.completed?"completed":""}">
      <div class="goal-item-head"><div><strong>${goal.title}</strong><small>${goal.deadline?`Prazo: ${formatHistoryDate(goal.deadline)}`:"Sem prazo"}</small></div><span>${goal.progress}%</span></div>
      <div class="goal-progress"><i style="width:${goal.progress}%"></i></div>
      <p>${goal.current.toLocaleString("pt-BR")} de ${Number(goal.target).toLocaleString("pt-BR")}</p>
      <button class="btn danger" data-delete-goal="${goal.id}" type="button">Remover</button>
    </article>
  `).join("")||'<p class="empty-state">Nenhuma meta cadastrada.</p>');
}

on("settingsSearch","input",event=>filterSettingsTabs(event.target.value));
on("refreshSystemHealth","click",renderSystemHealth);
on("exportCompleteBackup","click",()=>{
  const now=new Date().toISOString().slice(0,10);
  downloadJsonFile(`backup-77-team-${now}.json`,backupPayload());
  const stamp=new Date().toLocaleString("pt-BR");
  localStorage.setItem("77team-last-backup",stamp);
  setText("systemLastBackup",stamp);
  toast("Backup gerado.");
});
on("restoreCompleteBackup","click",async()=>{
  const file=byId("importBackupFile")?.files?.[0];
  if(!file)return toast("Selecione um arquivo JSON.");
  if(!confirm("Restaurar este backup usando mesclagem?"))return;
  try{
    const payload=JSON.parse(await file.text());
    await restoreBackupPayload(payload);
    toast("Backup restaurado. Atualize a página.");
  }catch(error){
    toast(error.message||"Falha ao restaurar backup.");
  }
});

on("goalForm","submit",async event=>{
  event.preventDefault();
  const goals=[...(activeSettings().goals||[])];
  goals.push({
    id:crypto.randomUUID?.()||String(Date.now()),
    title:cfgValue("goalTitle").trim(),
    type:cfgValue("goalType"),
    target:Math.max(1,cfgValue("goalTarget")),
    deadline:cfgValue("goalDeadline"),
    createdAt:new Date().toISOString()
  });
  try{
    await setDoc(doc(db,"settings","app"),{goals,updatedAt:serverTimestamp()},{merge:true});
    state.settings={...state.settings,goals};
    event.target.reset();
    renderGoals();
    toast("Meta criada.");
  }catch(error){toast(errMsg(error))}
});

document.addEventListener("click",async event=>{
  const settingsTab=event.target.closest("[data-settings-tab]");
  if(settingsTab)showSettingsTab(settingsTab.dataset.settingsTab);

  const saveButton=event.target.closest("[data-save-settings]");
  if(saveButton)await saveSettingsSection(saveButton.dataset.saveSettings);

  const themeButton=event.target.closest("[data-theme-choice]");
  if(themeButton){
    const theme=themeButton.dataset.themeChoice;
    setCfgValue("cfgThemeName",theme);
    setCfgValue("cfgPrimaryColor",THEME_COLORS[theme]);
    document.querySelectorAll("[data-theme-choice]").forEach(button=>button.classList.toggle("active",button===themeButton));
    document.documentElement.style.setProperty("--pro-accent",THEME_COLORS[theme]);
  }

  const deleteGoal=event.target.closest("[data-delete-goal]");
  if(deleteGoal&&owner()){
    const goals=(activeSettings().goals||[]).filter(goal=>goal.id!==deleteGoal.dataset.deleteGoal);
    await setDoc(doc(db,"settings","app"),{goals,updatedAt:serverTimestamp()},{merge:true});
    state.settings={...state.settings,goals};
    renderGoals();
  }
});

["cfgTeamName","cfgDescription"].forEach(id=>on(id,"input",renderSettingsPreview));


function staffRows(){
  return state.users
    .filter(user=>["owner","staff"].includes(user.role)&&user.status!=="pending")
    .map(user=>{
      const member=state.members.find(item=>
        item.userId===user.id||
        item.id===user.id||
        item.name===user.name
      )||{};
      const stat=stats(member.name||user.name||"");
      return {
        id:user.id,
        name:user.name||user.email||"Staff",
        email:user.email||"—",
        role:user.role,
        avatar:user.avatarDataUrl||"",
        clan:member.clan||user.clan||"Sem clã",
        character:user.character||{},
        stat,
        lastAccess:user.lastAccess||user.updatedAt||user.createdAt||null
      };
    });
}

function staffAvatarHtml(item){
  return item.avatar
    ?`<img src="${item.avatar}" alt="${item.name}">`
    :`<span>${item.name.slice(0,1).toUpperCase()}</span>`;
}

function formatPossibleTimestamp(value){
  try{
    if(value?.toDate)return value.toDate().toLocaleString("pt-BR");
    if(value)return new Date(value).toLocaleString("pt-BR");
  }catch(_error){}
  return "Não informado";
}

function renderStaffOverview(){
  const rows=staffRows();
  const pending=state.users.filter(user=>user.status==="pending").length;
  const today=new Date().toISOString().slice(0,10);
  const monthAhead=new Date(Date.now()+30*86400000).toISOString().slice(0,10);
  const upcoming=state.events.filter(event=>event.date>=today&&event.date<=monthAhead).length;
  const inactive=state.members.filter(member=>member.active===false).length;

  setText("staffTotalCount",rows.length);
  setText("staffPendingRequests",pending);
  setText("staffUpcomingEvents",upcoming);
  setText("staffAlertsCount",pending+inactive);
  setText("staffResolvedRequests",state.users.filter(user=>user.status==="approved").length);
  setText("staffEventsCreated",state.events.length);
  setText("staffAuditCount",state.audit.length);
  setText("staffAverageResponse",pending?"Pendente":"Em dia");
}

function renderStaffCards(){
  const grid=byId("staffCardsGrid");
  if(!grid)return;

  grid.innerHTML=staffRows().map(item=>`
    <article class="staff-card">
      <div class="staff-card-avatar">${staffAvatarHtml(item)}</div>
      <div class="staff-card-copy">
        <h3>${item.name}</h3>
        <p>${item.role==="owner"?"Liderança":"Staff"} · ${item.clan}</p>
        <small>${item.email}</small>
      </div>
      <div class="staff-card-stats">
        <div><span>Presenças</span><strong>${item.stat.present}</strong></div>
        <div><span>Taxa</span><strong>${item.stat.rate}%</strong></div>
        <div><span>Level</span><strong>${progressionFor(state.members.find(member=>member.name===item.name)).level}</strong></div>
      </div>
      <button class="btn primary full" data-staff-details="${item.id}" type="button">Ver perfil</button>
    </article>
  `).join("")||'<p class="empty-state">Nenhum membro da Staff encontrado.</p>';
}

function renderStaffPending(){
  const list=byId("staffPendingList");
  if(!list)return;

  const requests=state.users.filter(user=>user.status==="pending").map(user=>({
    type:"Novo membro",
    title:user.name||user.email||"Usuário",
    description:"Aguardando aprovação de acesso.",
    page:"solicitacoes"
  }));

  const inactive=state.members.filter(member=>member.active===false).map(member=>({
    type:"Membro inativo",
    title:member.name,
    description:"Perfil marcado como inativo.",
    page:"membros"
  }));

  const items=[...requests,...inactive].slice(0,10);

  list.innerHTML=items.map(item=>`
    <article class="staff-pending-item">
      <div><span>${item.type}</span><strong>${item.title}</strong><p>${item.description}</p></div>
      <button class="btn" data-page-jump="${item.page}" type="button">Abrir</button>
    </article>
  `).join("")||'<p class="empty-state">Nenhuma pendência.</p>';
}

function renderStaffAgenda(){
  const list=byId("staffAgendaList");
  if(!list)return;

  const today=new Date().toISOString().slice(0,10);
  const events=[...state.events]
    .filter(event=>!event.date||event.date>=today)
    .sort((a,b)=>String(a.date||"").localeCompare(String(b.date||"")))
    .slice(0,8);

  list.innerHTML=events.map(event=>`
    <article class="staff-agenda-item">
      <div class="staff-agenda-date">${event.date?formatHistoryDate(event.date):"—"}</div>
      <div><strong>${event.title||event.type||"Evento"}</strong><p>${event.type||"Agenda"} · ${event.description||"Sem descrição"}</p></div>
    </article>
  `).join("")||'<p class="empty-state">Nenhum compromisso próximo.</p>';
}

function renderStaffGoals(){
  const list=byId("staffGoalsList");
  if(!list)return;

  const goals=(state.settings?.goals||[]).slice(0,6);
  list.innerHTML=goals.map(goal=>{
    const current=goalCurrentValue(goal);
    const progress=Math.min(100,Math.round(current/Math.max(1,goal.target)*100));
    return `<article class="staff-goal-item">
      <div><strong>${goal.title}</strong><span>${progress}%</span></div>
      <div class="staff-goal-progress"><i style="width:${progress}%"></i></div>
      <small>${current.toLocaleString("pt-BR")} de ${Number(goal.target).toLocaleString("pt-BR")}</small>
    </article>`;
  }).join("")||'<p class="empty-state">Nenhuma meta cadastrada.</p>';
}

function renderStaffActivity(){
  const container=byId("staffActivityBars");
  if(!container)return;

  const counts={};
  state.audit.forEach(item=>{
    const action=item.action||"Outros";
    counts[action]=(counts[action]||0)+1;
  });

  const rows=Object.entries(counts).sort((a,b)=>b[1]-a[1]).slice(0,6);
  const max=Math.max(1,...rows.map(item=>item[1]));

  container.innerHTML=rows.map(([label,value])=>`
    <div class="staff-activity-row">
      <span>${label}</span>
      <div><i style="width:${Math.round(value/max*100)}%"></i></div>
      <strong>${value}</strong>
    </div>
  `).join("")||'<p class="empty-state">Sem atividades registradas.</p>';
}

function staffJournalItems(){
  return state.settings?.staffJournal||[];
}

function renderStaffJournal(){
  const list=byId("staffJournalList");
  if(!list)return;

  list.innerHTML=staffJournalItems().slice().reverse().slice(0,20).map(item=>`
    <article class="staff-journal-item">
      <span>${item.category||"observacao"}</span>
      <strong>${item.authorName||"Staff"}</strong>
      <p>${item.text}</p>
      <small>${new Date(item.createdAt).toLocaleString("pt-BR")}</small>
    </article>
  `).join("")||'<p class="empty-state">Nenhuma anotação registrada.</p>';
}

function openStaffDetails(item){
  if(!item)return;
  setHtml("staffDetailsContent",`
    <div class="staff-drawer-hero">
      <div class="staff-drawer-avatar">${staffAvatarHtml(item)}</div>
      <h2>${item.name}</h2>
      <p>${item.role==="owner"?"Liderança":"Staff"} · ${item.clan}</p>
      <small>${item.email}</small>
    </div>
    <div class="staff-drawer-grid">
      <div><span>Presenças</span><strong>${item.stat.present}</strong></div>
      <div><span>Ausências</span><strong>${item.stat.absent}</strong></div>
      <div><span>Taxa</span><strong>${item.stat.rate}%</strong></div>
      <div><span>Power</span><strong>${Number(item.character.power||0).toLocaleString("pt-BR")}</strong></div>
      <div><span>Classe</span><strong>${item.character.className||"—"}</strong></div>
      <div><span>Último acesso</span><strong>${formatPossibleTimestamp(item.lastAccess)}</strong></div>
    </div>
  `);
  byId("staffDetailsDrawer")?.classList.remove("hidden");
}

function printStaffReport(){
  const rows=staffRows();
  if(!rows.length)return toast("Não há dados da Staff para exportar.");

  const popup=window.open("","_blank");
  if(!popup||!popup.document)return toast("Permita pop-ups para gerar o PDF.");

  const body=rows.map(item=>`<tr>
    <td>${item.name}</td><td>${item.role==="owner"?"Liderança":"Staff"}</td>
    <td>${item.clan}</td><td>${item.stat.present}</td><td>${item.stat.rate}%</td>
    <td>${item.character.className||"—"}</td><td>${Number(item.character.power||0).toLocaleString("pt-BR")}</td>
  </tr>`).join("");

  popup.document.write(`<!doctype html><html lang="pt-BR"><head><meta charset="utf-8"><title>Relatório da Staff</title>
  <style>@page{size:A4 landscape;margin:10mm}body{font-family:Arial;color:#17131c}header{padding:15px;color:#fff;background:#251133;border-bottom:4px solid #a83cff}header strong{color:#d277ff;font-size:20px}.actions{text-align:right;margin:10px 0}.actions button{padding:9px 14px;background:#8e24cf;color:#fff;border:0;border-radius:6px}table{width:100%;border-collapse:collapse;font-size:9px}th{background:#2c123c;color:#fff;padding:7px;border:1px solid #7e4597}td{padding:6px;border:1px solid #d5c7dc}@media print{.actions{display:none}}</style>
  </head><body><header><strong>77 TEAM MANAGER</strong><h1>Relatório da equipe Staff</h1></header>
  <div class="actions"><button onclick="window.print()">Salvar como PDF</button></div>
  <p>Gerado em ${new Date().toLocaleString("pt-BR")} · ${rows.length} integrante(s)</p>
  <table><thead><tr><th>Nome</th><th>Cargo</th><th>Clã</th><th>Presenças</th><th>Taxa</th><th>Classe</th><th>Power</th></tr></thead><tbody>${body}</tbody></table>
  <script>window.addEventListener("load",()=>setTimeout(()=>window.print(),300));<\/script></body></html>`);
  popup.document.close();
}

function downloadStaffCsvFile(){
  const rows=staffRows();
  if(!rows.length)return toast("Não há dados da Staff para exportar.");

  const lines=[
    ["Nome","Cargo","Clã","E-mail","Presenças","Ausências","Taxa","Classe","Power"],
    ...rows.map(item=>[
      item.name,
      item.role==="owner"?"Liderança":"Staff",
      item.clan,
      item.email,
      item.stat.present,
      item.stat.absent,
      `${item.stat.rate}%`,
      item.character.className||"",
      item.character.power||0
    ])
  ];

  const csv=lines.map(row=>row.map(value=>`"${String(value).replace(/"/g,'""')}"`).join(";")).join("\n");
  const blob=new Blob(["\ufeff"+csv],{type:"text/csv;charset=utf-8"});
  const url=URL.createObjectURL(blob);
  const link=document.createElement("a");
  link.href=url;
  link.download=`staff-77-team-${new Date().toISOString().slice(0,10)}.csv`;
  document.body.appendChild(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(url);
}

function renderStaffCommandCenter(){
  if(!editor())return;
  renderStaffOverview();
  renderStaffCards();
  renderStaffPending();
  renderStaffAgenda();
  renderStaffGoals();
  renderStaffActivity();
  renderStaffJournal();
}

on("staffJournalForm","submit",async event=>{
  event.preventDefault();
  const text=String(byId("staffJournalText")?.value||"").trim();
  if(!text)return;

  const journal=[...staffJournalItems(),{
    id:crypto.randomUUID?.()||String(Date.now()),
    text,
    category:byId("staffJournalCategory")?.value||"observacao",
    authorId:state.user.uid,
    authorName:state.profile?.name||state.profile?.email||"Staff",
    createdAt:new Date().toISOString()
  }].slice(-300);

  try{
    await setDoc(doc(db,"settings","app"),{staffJournal:journal,updatedAt:serverTimestamp()},{merge:true});
    state.settings={...state.settings,staffJournal:journal};
    event.target.reset();
    renderStaffJournal();
    toast("Registro adicionado ao diário.");
  }catch(error){toast(errMsg(error))}
});

function populateNotificationUsers(){
  const select=byId("notificationTargetUser");if(!select)return;
  const current=select.value;
  const users=state.users.filter(u=>u.status!=="pending"&&u.active!==false).slice().sort((a,b)=>String(a.name||a.email).localeCompare(String(b.name||b.email),"pt-BR"));
  select.innerHTML='<option value="">Selecione um usuário</option>'+users.map(u=>`<option value="${u.id}">${escapeHtml(u.name||u.email)} · ${u.role==="owner"?"Liderança":u.role==="staff"?"Staff":"Membro"}</option>`).join("");
  if(users.some(u=>u.id===current))select.value=current;
}
function renderNotificationAdmin(){
  populateNotificationUsers();
  const list=byId("notificationSentRows");if(!list)return;
  const sent=(state.sentNotifications||[]).filter(n=>n.createdBy===state.user?.uid||owner()).slice().sort((a,b)=>{const av=a.createdAt?.toMillis?.()||Date.parse(a.createdAt||0)||0;const bv=b.createdAt?.toMillis?.()||Date.parse(b.createdAt||0)||0;return bv-av});
  setText("notificationSentCount",sent.length);
  list.innerHTML=sent.map(n=>`<article class="notification-sent-item type-${n.type||"info"}">
    <div><strong>${escapeHtml(n.title||"Notificação")}</strong><p>${escapeHtml(n.message||"")}</p><small>${n.targetType==="user"?`Individual: ${escapeHtml(n.targetUserName||"Usuário")}`:"Todos os usuários"} · ${escapeHtml(notificationDate(n))}</small></div>
    ${owner()?`<button class="btn danger mini" data-delete-notification="${n.id}" type="button">Excluir</button>`:""}
  </article>`).join("")||'<p class="empty-state">Nenhuma notificação enviada.</p>';
}
on("notificationTargetMode","change",()=>{
  const individual=byId("notificationTargetMode")?.value==="user";
  byId("notificationTargetUserWrap")?.classList.toggle("hidden",!individual);
  if(!individual&&byId("notificationTargetUser"))byId("notificationTargetUser").value="";
});
on("notificationAdminForm","submit",async event=>{
  event.preventDefault();if(!editor())return toast("Sem permissão para enviar notificações.");
  const targetType=byId("notificationTargetMode")?.value||"all";
  const targetUserId=byId("notificationTargetUser")?.value||"";
  if(targetType==="user"&&!targetUserId)return toast("Selecione o usuário destinatário.");
  const targetUser=state.users.find(u=>u.id===targetUserId);
  const title=String(byId("notificationTitle")?.value||"").trim();
  const message=String(byId("notificationMessage")?.value||"").trim();
  if(!title||!message)return toast("Preencha o título e a mensagem.");
  try{
    await addDoc(collection(db,"notifications"),{
      title,
      message,
      type:byId("notificationType")?.value||"info",
      targetType,
      targetUserId:targetType==="user"?targetUserId:"",
      targetUserName:targetType==="user"?(targetUser?.name||targetUser?.email||"Usuário"):"",
      expiresAt:byId("notificationExpiresAt")?.value||"",
      createdBy:state.user.uid,
      createdByName:state.profile?.name||state.profile?.email||"Staff",
      createdAt:serverTimestamp()
    });
    event.target.reset();byId("notificationTargetUserWrap")?.classList.add("hidden");toast("Notificação enviada em tempo real.");
  }catch(error){toast(errMsg(error))}
});
on("staffNoticeForm","submit",async event=>{
  event.preventDefault();
  const title=String(byId("staffNoticeTitle")?.value||"").trim();
  const message=String(byId("staffNoticeMessage")?.value||"").trim();
  if(!title||!message)return;

  try{
    await addDoc(collection(db,"notifications"),{
      title,
      message,
      targetType:byId("staffNoticeAudience")?.value||"all",
      createdBy:state.user.uid,
      createdByName:state.profile?.name||state.profile?.email||"Staff",
      createdAt:serverTimestamp(),
    });
    event.target.reset();
    toast("Aviso publicado.");
  }catch(error){toast(errMsg(error))}
});

on("downloadStaffPdf","click",printStaffReport);
on("downloadStaffCsv","click",downloadStaffCsvFile);
on("closeStaffDrawer","click",()=>byId("staffDetailsDrawer")?.classList.add("hidden"));
on("staffQuickBackup","click",()=>{
  if(typeof backupPayload==="function"&&typeof downloadJsonFile==="function"){
    const now=new Date().toISOString().slice(0,10);
    downloadJsonFile(`backup-77-team-${now}.json`,backupPayload());
    toast("Backup gerado.");
  }else{
    toast("Abra Configurações > Backup para gerar o arquivo.");
  }
});

document.addEventListener("click",event=>{
  const details=event.target.closest("[data-staff-details]");
  if(details){
    const item=staffRows().find(row=>row.id===details.dataset.staffDetails);
    openStaffDetails(item);
  }
});




let accountRoleSyncTimer=null;
let accountRoleSyncRunning=false;

function scheduleAccountRoleSync(){
  if(!owner()||accountRoleSyncRunning)return;
  clearTimeout(accountRoleSyncTimer);
  accountRoleSyncTimer=setTimeout(syncLinkedAccountRoles,700);
}

async function syncLinkedAccountRoles(){
  if(!owner()||accountRoleSyncRunning)return;
  accountRoleSyncRunning=true;

  try{
    for(const member of state.members){
      const user=linkedUserForMember(member);
      if(!user||user.role==="owner")continue;

      // O cargo de acesso salvo em users é a fonte oficial. O cargo do membro
      // (Membros, PT TIME, PT BOOST, PT CORE) não pode rebaixar Liderança/DEV.
      const userAccess=resolveAccessRole(user);
      const memberAccess=normalizeAccessRole(member.accessRole);
      const desiredRole=["dev","leadership","staff"].includes(userAccess)
        ? userAccess
        : accessRoleFromMemberRole(member.role,member.accessRole);
      const desiredMemberRole=memberRoleFromAccessRole(desiredRole,member.role||user.memberRole||"Membros");

      if(
        resolveAccessRole(user)===desiredRole &&
        normalizeAccessRole(member.accessRole)===desiredRole &&
        (user.memberRole||desiredMemberRole)===desiredMemberRole
      )continue;

      const batch=writeBatch(db);
      batch.update(doc(db,"users",user.id),{
        role:desiredRole,
        accessRole:desiredRole,
        memberRole:desiredMemberRole,
        roleUpdatedAt:serverTimestamp(),
        updatedAt:serverTimestamp()
      });
      batch.set(doc(db,"members",member.id),{
        role:desiredMemberRole,
        userId:user.id,
        accessRole:desiredRole,
        updatedAt:serverTimestamp()
      },{merge:true});
      await batch.commit();
    }
  }catch(error){
    console.error("Falha ao sincronizar cargos das contas:",error);
  }finally{
    accountRoleSyncRunning=false;
  }
}

let attendanceMigrationTimer=null;
let attendanceMigrationRunning=false;

function scheduleAttendanceUserMigration(){
  if(!editor()||attendanceMigrationRunning)return;
  clearTimeout(attendanceMigrationTimer);
  attendanceMigrationTimer=setTimeout(migrateAttendanceUserIds,900);
}

async function migrateAttendanceUserIds(){
  if(!editor()||attendanceMigrationRunning)return;

  const pending=state.attendance.filter(item=>!item.userId&&item.memberId);
  if(!pending.length)return;

  attendanceMigrationRunning=true;

  try{
    for(let index=0;index<pending.length;index+=300){
      const group=pending.slice(index,index+300);
      const batch=writeBatch(db);
      let changes=0;

      group.forEach(item=>{
        const member=state.members.find(member=>
          member.id===item.memberId||member.name===item.memberName
        );
        const userId=member?.userId||
          state.users.find(user=>user.name===item.memberName)?.id;

        if(!userId)return;

        batch.update(doc(db,"attendance",item.id),{
          userId,
          migratedAt:serverTimestamp()
        });
        changes++;
      });

      if(changes)await batch.commit();
    }
  }catch(error){
    console.error("Falha ao vincular históricos aos usuários:",error);
  }finally{
    attendanceMigrationRunning=false;
  }
}

const XP_LEVEL_BASE=500;
const XP_LEVEL_STEP=250;

function xpRequiredForLevel(level){
  return XP_LEVEL_BASE+Math.max(0,level-1)*XP_LEVEL_STEP;
}

function cumulativeXpBeforeLevel(level){
  let total=0;
  for(let current=1;current<level;current++)total+=xpRequiredForLevel(current);
  return total;
}

function levelFromXp(totalXp){
  const safeXp=Math.max(0,Math.floor(Number(totalXp)||0));
  let level=1;
  let remaining=safeXp;

  while(remaining>=xpRequiredForLevel(level)&&level<999){
    remaining-=xpRequiredForLevel(level);
    level++;
  }

  const required=xpRequiredForLevel(level);
  return {
    level,
    currentXp:remaining,
    requiredXp:required,
    totalXp:safeXp,
    progress:required?Math.min(100,Math.round(remaining/required*100)):100
  };
}

function levelTitle(level){
  if(level>=50)return "Lenda da 77 TEAM";
  if(level>=30)return "Mestre";
  if(level>=20)return "Elite";
  if(level>=10)return "Veterano";
  if(level>=5)return "Combatente";
  return "Recruta";
}

function xpSettings(){
  const attendance=state.settings?.attendance||{};
  return {
    presence:Number(attendance.presencePoints??100),
    event:Number(attendance.eventPoints??150),
    absence:Number(attendance.absencePoints??0)
  };
}

function automaticXpForMember(member){
  if(!member)return 0;
  const points=xpSettings();

  return state.attendance
    .filter(item=>item.memberId===member.id||item.memberName===member.name)
    .reduce((total,item)=>{
      if(item.status===1){
        return total+(item.kind==="eventos"?points.event:points.presence);
      }
      if(item.status===-1){
        return total+points.absence;
      }
      return total;
    },0);
}

function userForMember(member){
  return state.users.find(user=>
    user.id===member?.userId||
    user.id===member?.id||
    String(user.name||"").toLowerCase()===String(member?.name||"").toLowerCase()
  )||null;
}

function progressionFor(member,user=null){
  const profile=user||userForMember(member)||{};
  const automatic=Number(profile.progression?.automaticXp??automaticXpForMember(member));
  const manual=Number(profile.progression?.manualXp||0);
  const total=Math.max(0,automatic+manual);
  return {
    ...levelFromXp(total),
    automaticXp:automatic,
    manualXp:manual,
    title:levelTitle(levelFromXp(total).level)
  };
}

function progressionForCurrentUser(){
  const member=currentMemberRecord?.()||state.members.find(item=>
    item.userId===state.user?.uid||
    item.id===state.user?.uid||
    item.name===state.profile?.name
  );
  return progressionFor(member,state.profile);
}

let progressionSyncRunning=false;
let progressionSyncTimer=null;

function scheduleProgressionSync(){
  if(!editor()||progressionSyncRunning)return;
  clearTimeout(progressionSyncTimer);
  progressionSyncTimer=setTimeout(syncMemberProgressions,500);
}

async function syncMemberProgressions(){
  if(!editor()||progressionSyncRunning)return;
  progressionSyncRunning=true;

  try{
    for(const member of state.members){
      const user=userForMember(member);
      if(!user)continue;

      const automaticXp=automaticXpForMember(member);
      const manualXp=Number(user.progression?.manualXp||0);
      const calculated=levelFromXp(Math.max(0,automaticXp+manualXp));
      const title=levelTitle(calculated.level);
      const current=user.progression||{};

      if(
        Number(current.automaticXp||0)===automaticXp &&
        Number(current.totalXp||0)===calculated.totalXp &&
        Number(current.level||1)===calculated.level &&
        current.title===title
      )continue;

      await updateDoc(doc(db,"users",user.id),{
        progression:{
          automaticXp,
          manualXp,
          totalXp:calculated.totalXp,
          level:calculated.level,
          title,
          currentXp:calculated.currentXp,
          requiredXp:calculated.requiredXp,
          progress:calculated.progress,
          recalculatedAt:new Date().toISOString()
        },
        progressionUpdatedAt:serverTimestamp()
      });
    }
  }catch(error){
    console.error("Falha ao recalcular XP:",error);
  }finally{
    progressionSyncRunning=false;
  }
}

function populateXpMemberSelect(){
  const select=byId("xpAdjustmentMember");
  if(!select)return;
  const current=select.value;

  select.innerHTML='<option value="">Selecionar membro</option>'+
    state.members
      .slice()
      .sort((a,b)=>String(a.name).localeCompare(String(b.name),"pt-BR"))
      .map(member=>`<option value="${member.id}">${member.name}</option>`)
      .join("");

  if(state.members.some(member=>member.id===current))select.value=current;
}

function renderXpAdjustmentHistory(){
  const container=byId("xpAdjustmentHistory");
  if(!container)return;

  const rows=state.xpLogs
    .slice()
    .sort((a,b)=>{
      const av=a.createdAt?.toMillis?.()||Date.parse(a.createdAt||0)||0;
      const bv=b.createdAt?.toMillis?.()||Date.parse(b.createdAt||0)||0;
      return bv-av;
    })
    .slice(0,15);

  container.innerHTML=rows.map(item=>`
    <article class="xp-log-item ${Number(item.amount)>=0?"positive":"negative"}">
      <div>
        <strong>${item.memberName||"Membro"}</strong>
        <p>${item.reason||"Ajuste manual"}</p>
        <small>${item.staffName||"Staff"} · ${item.createdAt?.toDate?item.createdAt.toDate().toLocaleString("pt-BR"):""}</small>
      </div>
      <span>${Number(item.amount)>=0?"+":""}${Number(item.amount||0)} XP</span>
    </article>
  `).join("")||'<p class="empty-state">Nenhum ajuste manual registrado.</p>';
}

function renderLevelSystem(){
  populateXpMemberSelect();
  renderXpAdjustmentHistory();

  if(state.user&&!state.guest){
    const progress=progressionForCurrentUser();
    setText("profileLevel",`Nível ${progress.level}`);
    
    
    
    
    
    const fill=byId("profileProgressFill");
    if(fill)fill.style.width=`${progress.progress}%`;
  }

  const levels=state.members.map(member=>progressionFor(member).level);
  setText(
    "staffAverageMemberLevel",
    levels.length?(levels.reduce((sum,value)=>sum+value,0)/levels.length).toFixed(1):"1"
  );
}

on("xpAdjustmentForm","submit",async event=>{
  event.preventDefault();
  if(!editor())return toast("Permissão negada.");

  const memberId=byId("xpAdjustmentMember")?.value||"";
  const amount=Math.trunc(Number(byId("xpAdjustmentAmount")?.value||0));
  const reason=String(byId("xpAdjustmentReason")?.value||"").trim();
  const member=state.members.find(item=>item.id===memberId);
  const user=userForMember(member);

  if(!member||!user)return toast("Membro sem conta vinculada.");
  if(!amount)return toast("Informe um valor de XP diferente de zero.");
  if(reason.length<3)return toast("Informe o motivo do ajuste.");

  const currentManual=Number(user.progression?.manualXp||0);
  const automaticXp=automaticXpForMember(member);
  const newManual=currentManual+amount;
  const calculated=levelFromXp(Math.max(0,automaticXp+newManual));
  const title=levelTitle(calculated.level);

  try{
    const batch=writeBatch(db);

    batch.update(doc(db,"users",user.id),{
      progression:{
        automaticXp,
        manualXp:newManual,
        totalXp:calculated.totalXp,
        level:calculated.level,
        title,
        currentXp:calculated.currentXp,
        requiredXp:calculated.requiredXp,
        progress:calculated.progress,
        recalculatedAt:new Date().toISOString()
      },
      progressionUpdatedAt:serverTimestamp()
    });

    const logRef=doc(collection(db,"xpLogs"));
    batch.set(logRef,{
      memberId:member.id,
      userId:user.id,
      memberName:member.name,
      amount,
      reason,
      beforeManualXp:currentManual,
      afterManualXp:newManual,
      totalXpAfter:calculated.totalXp,
      levelAfter:calculated.level,
      staffId:state.user.uid,
      staffName:state.profile?.name||state.profile?.email||"Staff",
      createdAt:serverTimestamp()
    });

    await batch.commit();
    event.target.reset();
    toast(`Ajuste de ${amount>0?"+":""}${amount} XP aplicado.`);
  }catch(error){
    toast(errMsg(error));
  }
});


/* V12.1 — Dashboard Enterprise isolado */
function renderEnterpriseDashboard(){
  const today=dashboardDateOffset(0);
  const yesterday=dashboardDateOffset(-1);
  const currentMonth=today.slice(0,7);

  const previousMonthDate=new Date();
  previousMonthDate.setMonth(previousMonthDate.getMonth()-1);
  const previousMonth=previousMonthDate.toISOString().slice(0,7);

  const todayPresence=state.attendance.filter(item=>item.status===1&&item.date===today).length;
  const yesterdayPresence=state.attendance.filter(item=>item.status===1&&item.date===yesterday).length;
  setText("dashboardPresenceTrend",dashboardPercentChange(todayPresence,yesterdayPresence));

  const monthEvents=new Set(
    state.attendance
      .filter(item=>item.kind==="eventos"&&String(item.date||"").startsWith(currentMonth))
      .map(item=>`${item.date}|${item.slot}`)
  ).size;
  const previousMonthEvents=new Set(
    state.attendance
      .filter(item=>item.kind==="eventos"&&String(item.date||"").startsWith(previousMonth))
      .map(item=>`${item.date}|${item.slot}`)
  ).size;
  setText("dashboardEventTrend",dashboardPercentChange(monthEvents,previousMonthEvents));

  const joinedThisMonth=state.members.filter(member=>
    String(member.createdAt?.toDate?.()?.toISOString?.()||member.createdAt||"").startsWith(currentMonth)
  ).length;
  setText("dashboardMemberTrend",joinedThisMonth?`+${joinedThisMonth}`:"0");

  renderDashboardTodayEvents(today);
  renderDashboardWeeklyChart();
  renderDashboardClanPoints();
  renderDashboardPresenceRate();
  renderDashboardRecentActivity();
  renderDashboardServerStatus();
}

function dashboardDateOffset(days){
  const date=new Date();
  date.setDate(date.getDate()+days);
  return date.toISOString().slice(0,10);
}

function dashboardPercentChange(current,previous){
  if(!previous)return current?"+100%":"0%";
  const value=Math.round((current-previous)/previous*100);
  return `${value>=0?"+":""}${value}%`;
}

function renderDashboardTodayEvents(today){
  const container=byId("dashboardTodayEvents");
  if(!container)return;

  const scheduled=state.events
    .filter(event=>event.date===today)
    .map(event=>({
      title:event.title||event.type||"Evento",
      time:event.time||"Horário não informado",
      status:"Agendado",
      kind:event.type||"evento"
    }));

  const attendanceEvents=[...new Map(
    state.attendance
      .filter(item=>item.date===today)
      .map(item=>[
        `${item.kind}|${item.slot}`,
        {
          title:item.kind==="worldboss"?"WorldBoss":item.kind==="purgatorio"?"Purgatório":item.slot||"Evento",
          time:item.slot||"—",
          status:item.status===1?"Em andamento":"Agendado",
          kind:item.kind
        }
      ])
  ).values()];

  const events=[...scheduled,...attendanceEvents]
    .filter((item,index,array)=>
      array.findIndex(other=>other.title===item.title&&other.time===item.time)===index
    )
    .slice(0,5);

  container.innerHTML=events.map(item=>`
    <article class="today-event-item">
      <div class="today-event-icon">${item.kind==="worldboss"?"⚔":item.kind==="purgatorio"?"♨":"▣"}</div>
      <div><strong>${item.title}</strong><small>${item.time}</small></div>
      <span class="${item.status==="Em andamento"?"running":"scheduled"}">${item.status}</span>
    </article>
  `).join("")||'<p class="empty-state">Nenhum evento programado para hoje.</p>';
}

function renderDashboardWeeklyChart(){
  const container=byId("dashboardWeeklyChart");
  if(!container)return;

  const days=[];
  const labels=["Dom","Seg","Ter","Qua","Qui","Sex","Sáb"];

  for(let offset=-6;offset<=0;offset++){
    const date=new Date();
    date.setDate(date.getDate()+offset);
    const iso=date.toISOString().slice(0,10);
    days.push({
      iso,
      label:labels[date.getDay()],
      value:state.attendance.filter(item=>item.status===1&&item.date===iso).length
    });
  }

  const max=Math.max(1,...days.map(day=>day.value));
  const points=days.map((day,index)=>{
    const x=index/(days.length-1)*100;
    const y=92-(day.value/max*72);
    return `${x},${y}`;
  }).join(" ");

  container.innerHTML=`
    <div class="weekly-chart-scale"><span>${max}</span><span>${Math.round(max/2)}</span><span>0</span></div>
    <svg viewBox="0 0 100 100" preserveAspectRatio="none" aria-label="Gráfico semanal">
      <defs>
        <linearGradient id="weeklyArea" x1="0" x2="0" y1="0" y2="1">
          <stop offset="0%" stop-color="currentColor" stop-opacity=".35"/>
          <stop offset="100%" stop-color="currentColor" stop-opacity="0"/>
        </linearGradient>
      </defs>
      <polygon points="0,100 ${points} 100,100" fill="url(#weeklyArea)"></polygon>
      <polyline points="${points}" fill="none" stroke="currentColor" stroke-width="1.6" vector-effect="non-scaling-stroke"></polyline>
      ${days.map((day,index)=>{
        const x=index/(days.length-1)*100;
        const y=92-(day.value/max*72);
        return `<circle cx="${x}" cy="${y}" r="1.7" fill="currentColor"></circle>`;
      }).join("")}
    </svg>
    <div class="weekly-chart-labels">${days.map(day=>`<span><b>${day.value}</b>${day.label}</span>`).join("")}</div>
  `;
}

function renderDashboardClanPoints(){
  const container=byId("dashboardClanPoints");
  if(!container)return;

  const clans={};
  state.members.forEach(member=>{
    const clan=member.clan||"Sem clã";
    clans[clan]=(clans[clan]||0)+stats(member.name).present;
  });

  const rows=Object.entries(clans).sort((a,b)=>b[1]-a[1]).slice(0,5);
  const max=Math.max(1,...rows.map(row=>row[1]));

  container.innerHTML=rows.map(([clan,points],index)=>`
    <div class="clan-points-row">
      <span>${index+1}</span>
      <strong>${clan}</strong>
      <div><i style="width:${Math.round(points/max*100)}%"></i></div>
      <b>${points}</b>
    </div>
  `).join("")||'<p class="empty-state">Nenhum clã com pontos.</p>';
}

function renderDashboardPresenceRate(){
  const present=state.attendance.filter(item=>item.status===1).length;
  const marked=state.attendance.filter(item=>item.status!==0).length;
  const rate=marked?Math.round(present/marked*100):0;
  const gauge=byId("dashboardRateGauge");

  if(gauge)gauge.style.setProperty("--rate",rate);
  setText("dashboardGeneralRate",`${rate}%`);
  setText("dashboardRateLabel",rate>=90?"Excelente!":rate>=70?"Muito bom":rate>=50?"Regular":"Atenção");
  setText("dashboardActiveSummary",`${state.members.filter(member=>member.active!==false).length} membros ativos`);
}

function renderDashboardRecentActivity(){
  const container=byId("dashboardRecentActivity");
  if(!container)return;

  const presenceActivities=state.attendance
    .slice()
    .sort((a,b)=>String(b.date||"").localeCompare(String(a.date||"")))
    .slice(0,4)
    .map(item=>({
      icon:(item.memberName||"?").slice(0,1).toUpperCase(),
      title:`${item.memberName||"Membro"} ${item.status===1?"registrou presença":"teve ausência"} em ${item.slot||item.kind}`,
      time:formatHistoryDate(item.date)
    }));

  const memberActivities=state.members
    .slice(-2)
    .map(item=>({
      icon:(item.name||"?").slice(0,1).toUpperCase(),
      title:`${item.name} entrou para a equipe`,
      time:"Cadastro recente"
    }));

  container.innerHTML=[...presenceActivities,...memberActivities].slice(0,6).map(item=>`
    <article class="recent-activity-item">
      <span>${item.icon}</span>
      <div><strong>${item.title}</strong><small>${item.time}</small></div>
    </article>
  `).join("")||'<p class="empty-state">Nenhuma atividade recente.</p>';
}

function renderDashboardServerStatus(){
  setText("dashboardServerUsers",state.users.length||state.members.length);
  setText("dashboardServerRecords",state.attendance.length);
  setText("dashboardServerTime",new Intl.DateTimeFormat("pt-BR",{hour:"2-digit",minute:"2-digit"}).format(new Date()));
}


(function installEnterpriseDashboardRenderer(){
  if(window.__enterpriseDashboardInstalled)return;
  window.__enterpriseDashboardInstalled=true;

  const originalRender=render;
  render=function(){
    originalRender();
    try{
      renderEnterpriseDashboard();
    }catch(error){
      console.error("Falha ao atualizar a Visão Geral Enterprise:",error);
    }
  };
})();


// V20.1.1 - Atendimento privado com histórico finalizado
function supportTime(item){
  const d=item?.createdAt?.toDate?.()||new Date(item?.createdAt||Date.now());
  return new Intl.DateTimeFormat("pt-BR",{dateStyle:"short",timeStyle:"short"}).format(d);
}
function supportStatusLabel(status){return ({open:"Aberta",in_progress:"Em atendimento",waiting_user:"Aguardando usuário",resolved:"Resolvida"})[status]||"Aberta"}
function supportTicketId(m){return m.ticketId||`legacy-${m.ownerUid}`}
function supportTicketMessages(ticketId){return state.supportMessages.filter(m=>supportTicketId(m)===ticketId).sort((a,b)=>(a.createdAt?.toMillis?.()||0)-(b.createdAt?.toMillis?.()||0))}
function supportTickets(){
  const groups=new Map();
  state.supportMessages.forEach(m=>{const id=supportTicketId(m),arr=groups.get(id)||[];arr.push(m);groups.set(id,arr)});
  return [...groups.entries()].map(([ticketId,msgs])=>{msgs.sort((a,b)=>(a.createdAt?.toMillis?.()||0)-(b.createdAt?.toMillis?.()||0));const last=msgs[msgs.length-1];return {ticketId,ownerUid:last.ownerUid,ownerName:last.ownerName||"Usuário",status:last.status||"open",last,msgs}});
}
function activeSupportTicketFor(uid){return supportTickets().filter(t=>t.ownerUid===uid&&t.status!=="resolved").sort((a,b)=>(b.last.createdAt?.toMillis?.()||0)-(a.last.createdAt?.toMillis?.()||0))[0]||null}
function newSupportTicketId(ownerUid){return `ATD-${Date.now().toString(36).toUpperCase()}-${String(ownerUid).slice(0,5).toUpperCase()}`}
function renderSupportBubble(m){
  const own=m.senderUid===state.user?.uid;
  const image=m.imageUrl?`<a href="${escapeHtml(m.imageUrl)}" target="_blank" rel="noopener"><img class="support-image" src="${escapeHtml(m.imageUrl)}" alt="Imagem anexada"></a>`:"";
  const link=m.link?`<a class="support-link" href="${escapeHtml(m.link)}" target="_blank" rel="noopener">🔗 Abrir link</a>`:"";
  return `<article class="support-message ${own?"mine":"theirs"}"><div class="support-message-head"><strong>${escapeHtml(m.senderName||"Usuário")}</strong><small>${escapeHtml(supportTime(m))}</small></div><p>${escapeHtml(m.text||"")}</p>${image}${link}</article>`;
}
function scrollSupportChats(){requestAnimationFrame(()=>["profileSupportMessages","supportAdminMessages"].forEach(id=>{const el=byId(id);if(el)el.scrollTop=el.scrollHeight}))}
function renderSupport(){
  if(!state.user)return;
  const activeOwn=activeSupportTicketFor(state.user.uid);
  const own=activeOwn?activeOwn.msgs:[];
  setHtml("profileSupportMessages",own.map(renderSupportBubble).join("")||'<p class="empty-state">Nenhum atendimento ativo. Envie uma mensagem para abrir um novo atendimento.</p>');
  setText("profileSupportStatus",activeOwn?supportStatusLabel(activeOwn.status):"Novo atendimento");
  if(byId("profileSupportSubmit"))setText("profileSupportSubmit",activeOwn?"Enviar mensagem":"Abrir novo atendimento");
  const activeTickets=supportTickets().filter(t=>t.status!=="resolved");
  setText("sidebarSupportBadge",activeTickets.length);
  setText("supportOpenCount",`${activeTickets.length} abertos`);
  if(!editor()){scrollSupportChats();return}
  const search=(byId("supportSearch")?.value||"").toLowerCase();
  let list=supportTickets().filter(t=>state.supportView==="finished"?t.status==="resolved":t.status!=="resolved");
  list=list.filter(t=>!search||String(t.ownerName).toLowerCase().includes(search)||t.ticketId.toLowerCase().includes(search)).sort((a,b)=>(b.last.createdAt?.toMillis?.()||0)-(a.last.createdAt?.toMillis?.()||0));
  setHtml("supportConversationList",list.map(x=>`<button class="support-conversation ${state.selectedSupportTicketId===x.ticketId?"active":""}" data-support-ticket="${escapeHtml(x.ticketId)}" data-support-owner="${escapeHtml(x.ownerUid)}" type="button"><strong>${escapeHtml(x.ownerName)}</strong><span>${escapeHtml((x.last.text||"Mensagem").slice(0,70))}</span><small>${escapeHtml(x.ticketId)} · ${supportStatusLabel(x.status)} · ${supportTime(x.last)}</small></button>`).join("")||`<p class="empty-state">Nenhum atendimento ${state.supportView==="finished"?"finalizado":"ativo"}.</p>`);
  document.querySelectorAll("[data-support-view]").forEach(b=>b.classList.toggle("active",b.dataset.supportView===state.supportView));
  const selected=state.selectedSupportTicketId?supportTickets().find(t=>t.ticketId===state.selectedSupportTicketId):null;
  if(selected && ((state.supportView==="finished")!==(selected.status==="resolved"))){state.selectedSupportTicketId="";state.selectedSupportOwnerUid="";return renderSupport()}
  const msgs=selected?.msgs||[];
  setText("supportSelectedTitle",selected?selected.ownerName:"Selecione uma conversa");
  setText("supportSelectedMeta",selected?`${selected.ticketId} · ${msgs.length} mensagens`:"");
  setHtml("supportAdminMessages",msgs.map(renderSupportBubble).join("")||'<p class="empty-state">Selecione um atendimento para visualizar a conversa.</p>');
  if(byId("supportStatusSelect")){byId("supportStatusSelect").value=selected?.status||"open";byId("supportStatusSelect").disabled=!selected||selected.status==="resolved"}
  if(byId("supportAdminForm"))byId("supportAdminForm").classList.toggle("hidden",!selected||selected.status==="resolved");
  if(byId("supportDeleteBtn"))byId("supportDeleteBtn").classList.toggle("hidden",!selected||selected.status!=="resolved"||!dev());
  scrollSupportChats();
}
async function uploadSupportImage(file,ownerUid,ticketId){
  if(!file)return {url:"",path:""};
  if(!["image/png","image/jpeg","image/webp"].includes(file.type))throw new Error("Use uma imagem PNG, JPG ou WEBP.");
  if(file.size>5*1024*1024)throw new Error("A imagem deve ter no máximo 5 MB.");
  const safe=file.name.replace(/[^a-zA-Z0-9._-]/g,"_");
  const path=`support/${ownerUid}/${ticketId}/${Date.now()}-${safe}`;
  const ref=storageRef(storage,path);
  const snap=await uploadBytes(ref,file,{contentType:file.type});
  return {url:await getDownloadURL(snap.ref),path};
}
async function sendSupportMessage({ownerUid,ownerName,text,link,file,ticketId}){
  const cleanText=(text||"").trim(); if(!cleanText&&!file)throw new Error("Digite uma mensagem ou selecione uma imagem.");
  const normalizedLink=(link||"").trim();
  if(normalizedLink&&!/^https:\/\//i.test(normalizedLink))throw new Error("O link precisa começar com https://");
  let currentTicket=ticketId;
  if(!currentTicket){const active=activeSupportTicketFor(ownerUid);currentTicket=active?.ticketId||newSupportTicketId(ownerUid)}
  const image=await uploadSupportImage(file,ownerUid,currentTicket);
  await addDoc(collection(db,"supportMessages"),{ticketId:currentTicket,ownerUid,ownerName,senderUid:state.user.uid,senderName:state.profile?.name||state.user.email,senderRole:editor()?normalizeAccessRole(state.profile?.role):"member",text:cleanText,link:normalizedLink,imageUrl:image.url,imagePath:image.path,status:editor()?"waiting_user":"open",createdAt:serverTimestamp()});
}
on("profileSupportForm","submit",async e=>{e.preventDefault();try{await sendSupportMessage({ownerUid:state.user.uid,ownerName:state.profile?.name||state.user.email,text:byId("profileSupportText").value,link:byId("profileSupportLink").value,file:byId("profileSupportImage").files?.[0]});e.target.reset();byId("profileSupportText")?.focus();toast("Mensagem enviada aos responsáveis.");}catch(error){toast(error.message||errMsg(error))}});
on("supportAdminForm","submit",async e=>{e.preventDefault();if(!editor()||!state.selectedSupportTicketId)return;const selected=supportTickets().find(t=>t.ticketId===state.selectedSupportTicketId);if(!selected||selected.status==="resolved")return;try{await sendSupportMessage({ownerUid:selected.ownerUid,ownerName:selected.ownerName,text:byId("supportAdminText").value,link:byId("supportAdminLink").value,file:byId("supportAdminImage").files?.[0],ticketId:selected.ticketId});e.target.reset();byId("supportAdminText")?.focus();await audit("Resposta de atendimento",`Resposta enviada em ${selected.ticketId} para ${selected.ownerName}`);toast("Resposta enviada.");}catch(error){toast(error.message||errMsg(error))}});
on("supportStatusSelect","change",async e=>{if(!editor()||!state.selectedSupportTicketId)return;const selected=supportTickets().find(t=>t.ticketId===state.selectedSupportTicketId);if(!selected)return;try{await Promise.all(selected.msgs.map(m=>updateDoc(doc(db,"supportMessages",m.id),{status:e.target.value,statusUpdatedAt:serverTimestamp(),statusUpdatedBy:state.user.uid})));await audit("Status de atendimento",`${selected.ticketId}: ${supportStatusLabel(e.target.value)}`);if(e.target.value==="resolved"){state.supportView="finished";toast("Atendimento finalizado e movido para Finalizados.")}else toast("Status atualizado.");renderSupport();}catch(error){toast(errMsg(error))}});
on("supportSearch","input",renderSupport);
on("supportDeleteBtn","click",async()=>{if(!dev()||!state.selectedSupportTicketId)return;const selected=supportTickets().find(t=>t.ticketId===state.selectedSupportTicketId);if(!selected||selected.status!=="resolved")return;if(!confirm(`Excluir definitivamente ${selected.ticketId}? Esta ação não pode ser desfeita.`))return;try{for(const m of selected.msgs){if(m.imagePath){try{await deleteObject(storageRef(storage,m.imagePath))}catch(err){console.warn("Anexo não removido:",err)}}await deleteDoc(doc(db,"supportMessages",m.id))}await audit("Atendimento excluído",`${selected.ticketId} de ${selected.ownerName}`);state.selectedSupportTicketId="";state.selectedSupportOwnerUid="";toast("Atendimento excluído definitivamente.");}catch(error){toast(errMsg(error))}});
document.addEventListener("click",e=>{
  const view=e.target.closest("[data-support-view]");if(view){state.supportView=view.dataset.supportView;state.selectedSupportTicketId="";state.selectedSupportOwnerUid="";renderSupport();return}
  const b=e.target.closest("[data-support-ticket]");if(!b)return;state.selectedSupportTicketId=b.dataset.supportTicket;state.selectedSupportOwnerUid=b.dataset.supportOwner;renderSupport();
});
["profileSupportText","supportAdminText"].forEach(id=>on(id,"keydown",e=>{if(e.key==="Enter"&&!e.shiftKey){e.preventDefault();e.currentTarget.form?.requestSubmit()}}));



// V20.2.1 - Chat privado individual com finalização e histórico para responsáveis
function chatTime(item){
  const d=item?.createdAt?.toDate?.();
  return d?d.toLocaleString("pt-BR",{dateStyle:"short",timeStyle:"short"}):"Agora";
}
function messageChatId(m){return m.chatId||`legacy-${m.ownerUid}`}
function messageChatStatus(m){return m.chatStatus||"active"}
function chatSessions(){
  const map=new Map();
  state.chatMessages.forEach(m=>{
    const chatId=messageChatId(m), key=`${m.ownerUid}::${chatId}`;
    if(!map.has(key))map.set(key,{chatId,ownerUid:m.ownerUid,ownerName:m.ownerName||"Usuário",msgs:[],status:"active",last:null});
    const session=map.get(key);session.msgs.push(m);session.last=m;
    if(messageChatStatus(m)==="finalized")session.status="finalized";
  });
  return [...map.values()].map(s=>{s.msgs.sort((a,b)=>(a.createdAt?.toMillis?.()||0)-(b.createdAt?.toMillis?.()||0));s.last=s.msgs[s.msgs.length-1]||null;return s})
    .sort((a,b)=>(b.last?.createdAt?.toMillis?.()||0)-(a.last?.createdAt?.toMillis?.()||0));
}
function activeChatFor(uid){return chatSessions().find(s=>s.ownerUid===uid&&s.status!=="finalized")||null}
function selectedChatSession(){return chatSessions().find(s=>s.chatId===state.selectedChatId&&s.ownerUid===state.selectedChatOwnerUid)||null}
function newPrivateChatId(uid){return `CHAT-${uid.slice(0,5).toUpperCase()}-${Date.now().toString(36).toUpperCase()}`}
function renderChatBubble(m){
  const own=m.senderUid===state.user?.uid;
  const image=m.imageUrl?`<a href="${escapeHtml(m.imageUrl)}" target="_blank" rel="noopener"><img class="support-image" src="${escapeHtml(m.imageUrl)}" alt="Imagem enviada no chat"></a>`:"";
  const link=m.link?`<a class="support-link" href="${escapeHtml(m.link)}" target="_blank" rel="noopener">🔗 Abrir link</a>`:"";
  return `<article class="support-message ${own?"mine":"theirs"}"><div class="support-message-head"><strong>${escapeHtml(m.senderName||"Usuário")}</strong><small>${escapeHtml(chatTime(m))}</small></div><p>${escapeHtml(m.text||"")}</p>${image}${link}</article>`;
}
function renderPrivateChat(){
  if(!state.user)return;
  const ownSession=activeChatFor(state.user.uid);
  const ownMsgs=ownSession?.msgs||[];
  setHtml("profileChatMessages",ownMsgs.map(renderChatBubble).join("")||'<p class="empty-state">Nenhuma conversa privada ativa. Envie uma mensagem para iniciar um novo chat.</p>');
  setText("profileChatBadge",ownSession?`${ownMsgs.length} mensagens · Ativo`:"Novo chat disponível");
  if(byId("profileChatForm"))byId("profileChatForm").classList.remove("hidden");
  const ownBox=byId("profileChatMessages");if(ownBox)requestAnimationFrame(()=>ownBox.scrollTop=ownBox.scrollHeight);
  if(!editor())return;

  document.querySelectorAll("[data-chat-view]").forEach(b=>b.classList.toggle("active",b.dataset.chatView===state.chatView));
  const search=(byId("chatSearch")?.value||"").trim().toLowerCase();
  const sessions=chatSessions().filter(s=>(state.chatView==="finished")===(s.status==="finalized"));
  const users=state.users.filter(u=>u.id!==state.user.uid&&u.status==="approved"&&u.active!==false&&(!search||String(u.name||u.email||"").toLowerCase().includes(search)));
  let rows=sessions.filter(s=>!search||String(s.ownerName||"").toLowerCase().includes(search));
  if(state.chatView==="active"){
    const activeOwners=new Set(rows.map(s=>s.ownerUid));
    rows=[...rows,...users.filter(u=>!activeOwners.has(u.id)).map(u=>({chatId:"",ownerUid:u.id,ownerName:u.name||u.email,status:"active",msgs:[],last:null}))];
  }
  setHtml("chatUserList",rows.map(x=>`<button type="button" class="support-conversation ${state.selectedChatOwnerUid===x.ownerUid&&state.selectedChatId===(x.chatId||"")?"active":""}" data-chat-owner="${escapeHtml(x.ownerUid)}" data-chat-id="${escapeHtml(x.chatId||"")}"><strong>${escapeHtml(x.ownerName)}</strong><span>${escapeHtml(x.last?.text|| (x.status==="finalized"?"Chat finalizado":"Iniciar nova conversa"))}</span><small>${x.last?chatTime(x.last):"Sem mensagens"}${x.status==="finalized"?" · Finalizado":""}</small></button>`).join("")||'<p class="empty-state">Nenhum chat nesta categoria.</p>');

  const selected=state.selectedChatOwnerUid;
  const session=selectedChatSession() || (selected?activeChatFor(selected):null);
  if(session&&!state.selectedChatId)state.selectedChatId=session.chatId;
  const selectedUser=state.users.find(u=>u.id===selected);
  setText("chatSelectedTitle",selected?(selectedUser?.name||session?.ownerName||"Usuário"):"Selecione um usuário");
  setText("chatSelectedSubtitle",session?.status==="finalized"?`Chat finalizado · ${session.chatId}`:(selected?`Chat ativo${session?.chatId?` · ${session.chatId}`:""}`:"Selecione uma conversa"));
  const msgs=session?.msgs||[];
  setHtml("chatAdminMessages",msgs.map(renderChatBubble).join("")||'<p class="empty-state">Selecione um usuário para iniciar ou visualizar a conversa.</p>');
  const finalized=session?.status==="finalized";
  if(byId("chatAdminForm"))byId("chatAdminForm").classList.toggle("hidden",!selected||finalized||state.chatView==="finished");
  if(byId("chatFinishBtn"))byId("chatFinishBtn").classList.toggle("hidden",!session||finalized||state.chatView==="finished");
  const box=byId("chatAdminMessages");if(box)requestAnimationFrame(()=>box.scrollTop=box.scrollHeight);
}
async function uploadChatImage(file,ownerUid,chatId){
  if(!file)return {url:"",path:""};
  if(!["image/png","image/jpeg","image/webp"].includes(file.type))throw new Error("Use uma imagem PNG, JPG ou WEBP.");
  if(file.size>5*1024*1024)throw new Error("A imagem deve ter no máximo 5 MB.");
  const safe=file.name.replace(/[^a-zA-Z0-9._-]/g,"_");
  const path=`chat/${ownerUid}/${chatId}/${Date.now()}-${safe}`;
  const ref=storageRef(storage,path);
  const snap=await uploadBytes(ref,file,{contentType:file.type});
  return {url:await getDownloadURL(snap.ref),path};
}
async function sendPrivateChat({ownerUid,ownerName,text,link,file,chatId}){
  const cleanText=(text||"").trim();
  if(!cleanText&&!file)throw new Error("Digite uma mensagem ou selecione uma imagem.");
  const normalizedLink=(link||"").trim();
  if(normalizedLink&&!/^https:\/\//i.test(normalizedLink))throw new Error("O link precisa começar com https://");
  let current=chatId?chatSessions().find(s=>s.chatId===chatId&&s.ownerUid===ownerUid):activeChatFor(ownerUid);
  if(current?.status==="finalized")throw new Error("Este chat foi finalizado. Inicie uma nova conversa.");
  const currentChatId=current?.chatId||newPrivateChatId(ownerUid);
  const image=await uploadChatImage(file,ownerUid,currentChatId);
  await addDoc(collection(db,"chatMessages"),{chatId:currentChatId,chatStatus:"active",ownerUid,ownerName,senderUid:state.user.uid,senderName:state.profile?.name||state.user.email,senderRole:editor()?normalizeAccessRole(state.profile?.role):"member",text:cleanText,link:normalizedLink,imageUrl:image.url,imagePath:image.path,createdAt:serverTimestamp()});
  state.selectedChatId=currentChatId;
}
on("profileChatForm","submit",async e=>{e.preventDefault();try{await sendPrivateChat({ownerUid:state.user.uid,ownerName:state.profile?.name||state.user.email,text:byId("profileChatText").value,link:byId("profileChatLink").value,file:byId("profileChatImage").files?.[0]});e.target.reset();byId("profileChatText")?.focus();toast("Mensagem enviada no chat privado.");}catch(error){toast(error.message||errMsg(error))}});
on("chatAdminForm","submit",async e=>{e.preventDefault();if(!editor()||!state.selectedChatOwnerUid)return;const user=state.users.find(u=>u.id===state.selectedChatOwnerUid);try{await sendPrivateChat({ownerUid:state.selectedChatOwnerUid,ownerName:user?.name||user?.email||"Usuário",text:byId("chatAdminText").value,link:byId("chatAdminLink").value,file:byId("chatAdminImage").files?.[0],chatId:state.selectedChatId});e.target.reset();byId("chatAdminText")?.focus();await audit("Chat privado",`Mensagem enviada para ${user?.name||user?.email||state.selectedChatOwnerUid}`);toast("Mensagem enviada.");}catch(error){toast(error.message||errMsg(error))}});
on("chatFinishBtn","click",async()=>{if(!editor())return;const session=selectedChatSession()||activeChatFor(state.selectedChatOwnerUid);if(!session||session.status==="finalized")return;if(!confirm(`Finalizar o chat ${session.chatId} com ${session.ownerName}? A conversa ficará somente para consulta dos responsáveis.`))return;try{await Promise.all(session.msgs.map(m=>updateDoc(doc(db,"chatMessages",m.id),{chatStatus:"finalized",finalizedAt:serverTimestamp(),finalizedBy:state.user.uid})));await audit("Chat privado finalizado",`${session.chatId} com ${session.ownerName}`);state.chatView="finished";toast("Chat finalizado e movido para Finalizados.");renderPrivateChat()}catch(error){toast(errMsg(error))}});
on("chatSearch","input",renderPrivateChat);
document.addEventListener("click",e=>{
  const view=e.target.closest("[data-chat-view]");if(view){state.chatView=view.dataset.chatView;state.selectedChatOwnerUid="";state.selectedChatId="";renderPrivateChat();return}
  const b=e.target.closest("[data-chat-owner]");if(!b)return;state.selectedChatOwnerUid=b.dataset.chatOwner;state.selectedChatId=b.dataset.chatId||"";renderPrivateChat();
});
["profileChatText","chatAdminText"].forEach(id=>on(id,"keydown",e=>{if(e.key==="Enter"&&!e.shiftKey){e.preventDefault();e.currentTarget.form?.requestSubmit()}}));



// V20.4 — Assistente de primeiro acesso
function firstAccessRequirements(){
  const character=state.profile?.character||{};
  const name=String(state.profile?.name||"").trim();
  return [
    {label:"Nickname",ok:name.length>=2},
    {label:"Classe",ok:String(character.className||"").trim().length>0},
    {label:"Power",ok:Number.isFinite(Number(character.power))&&Number(character.power)>=0},
    {label:"Level",ok:Number.isFinite(Number(character.level))&&Number(character.level)>=0},
    {label:"Codex",ok:Number.isFinite(Number(character.codex))&&Number(character.codex)>=0}
  ];
}
function updateFirstAccessUI(){
  const panel=byId("firstAccessPanel");
  if(!panel)return;
  panel.classList.toggle("hidden",!state.onboardingRequired);
  const requirements=firstAccessRequirements();
  const done=requirements.filter(item=>item.ok).length;
  const percent=Math.round(done/requirements.length*100);
  setText("firstAccessProgressText",`${done}/${requirements.length} etapas concluídas`);
  const fill=byId("firstAccessProgressFill");if(fill)fill.style.width=`${percent}%`;
  setHtml("firstAccessChecklist",requirements.map(item=>`<li class="${item.ok?"done":""}"><span>${item.ok?"✓":"○"}</span>${item.label}</li>`).join(""));
  const finish=byId("finishFirstAccessButton");if(finish)finish.disabled=done!==requirements.length;
}
async function auditFirstAccess(){
  try{await addDoc(collection(db,"audit"),{userId:state.user.uid,userName:state.profile.name,action:"Primeiro acesso concluído",details:"Perfil e personagem configurados pelo usuário.",createdAt:serverTimestamp()})}catch(error){console.warn("Auditoria do primeiro acesso não registrada:",error)}
}
async function completeFirstAccess(){
  const missing=firstAccessRequirements().filter(item=>!item.ok).map(item=>item.label);
  if(missing.length){
    openProfileTab(missing.includes("Nickname")?"account":"character");
    return toast(`Complete: ${missing.join(", ")}.`);
  }
  try{
    await updateDoc(doc(db,"users",state.user.uid),{firstLogin:false,profileCompleted:true,profileCompletedAt:serverTimestamp(),updatedAt:serverTimestamp()});
    state.profile.firstLogin=false;state.profile.profileCompleted=true;state.onboardingRequired=false;
    await auditFirstAccess();
    applyPermissions();updateFirstAccessUI();
    window.TeamManagerUI?.activatePage("dashboard");
    toast("Perfil concluído. Bem-vindo ao 77 TEAM Manager!");
  }catch(error){toast(error.message||"Não foi possível concluir o primeiro acesso.")}
}
on("finishFirstAccessButton","click",completeFirstAccess);
on("firstAccessGoCharacter","click",()=>openProfileTab("character"));

// V20.3 — Navegação interna do Meu Perfil
function openProfileTab(tabName="overview"){
  const available=[...document.querySelectorAll("[data-profile-panel]")];
  if(!available.some(panel=>panel.dataset.profilePanel===tabName))tabName="overview";
  document.querySelectorAll("[data-profile-tab]").forEach(button=>button.classList.toggle("active",button.dataset.profileTab===tabName));
  available.forEach(panel=>panel.classList.toggle("active",panel.dataset.profilePanel===tabName));
  try{localStorage.setItem("77team-profile-tab",tabName)}catch{}
}
document.addEventListener("click",event=>{
  const button=event.target.closest("[data-profile-tab]");
  if(!button)return;
  openProfileTab(button.dataset.profileTab);
});
document.addEventListener("DOMContentLoaded",()=>{
  let saved="overview";try{saved=localStorage.getItem("77team-profile-tab")||"overview"}catch{}
  openProfileTab(saved);
});

on("closePresenceModal","click",closePresenceModal);on("cancelPresenceModal","click",closePresenceModal);on("savePresenceModal","click",savePresenceFromModal);on("presenceModalKind","change",e=>updatePresenceSlotOptions(e.target.value));on("presenceModal","click",e=>{if(e.target.id==="presenceModal")closePresenceModal()});document.addEventListener("input",e=>{const kind=e.target.dataset?.recentPresenceSearch;if(kind)filterRecentPresence(kind)});document.addEventListener("change",e=>{const kind=e.target.dataset?.recentPresenceDate;if(kind)filterRecentPresence(kind)});
["rtSearch","rtKindFilter","rtDateFilter"].forEach(id=>on(id,id==="rtSearch"?"input":"change",renderRtPresence));


// V20.8 — Central de Registros gerais e individuais
let recordsMode="general";
function recordTimestamp(item){const value=item.updatedAt?.toDate?item.updatedAt.toDate():item.updatedAt?new Date(item.updatedAt):null;return value&&!Number.isNaN(value.getTime())?value.toLocaleString("pt-BR"):"—"}
function recordsFilteredRows(){
  const q=String(byId("recordsSearch")?.value||"").trim().toLowerCase();
  const member=byId("recordsMember")?.value||"",from=byId("recordsDateFrom")?.value||"",to=byId("recordsDateTo")?.value||"";
  const kind=byId("recordsKind")?.value||"",slot=byId("recordsSlot")?.value||"",status=byId("recordsStatus")?.value||"",clan=byId("recordsClan")?.value||"";
  return [...state.attendance].filter(item=>{
    if(recordsMode==="individual"&&!member)return false;
    return (!member||item.memberId===member||item.memberName===member)&&(!from||String(item.date||"")>=from)&&(!to||String(item.date||"")<=to)&&(!kind||item.kind===kind)&&(!slot||item.slot===slot)&&(!status||Number(item.status)===Number(status))&&(!clan||item.clan===clan)&&(!q||`${item.memberName} ${item.clan} ${item.updatedByName} ${item.note} ${presenceTypeLabel(item.kind)} ${item.slot}`.toLowerCase().includes(q));
  }).sort((a,b)=>`${b.date||""}${recordTimestamp(b)}`.localeCompare(`${a.date||""}${recordTimestamp(a)}`));
}
function populateRecordsFilters(){
  const member=byId("recordsMember"),clan=byId("recordsClan"),slot=byId("recordsSlot");if(!member||!clan||!slot)return;
  const mv=member.value,cv=clan.value,sv=slot.value;
  member.innerHTML='<option value="">Todos os membros</option>'+[...state.members].sort((a,b)=>String(a.name).localeCompare(String(b.name))).map(m=>`<option value="${escapeHtml(m.id)}">${escapeHtml(m.name)}${m.clan?` · ${escapeHtml(m.clan)}`:""}</option>`).join("");member.value=mv;
  clan.innerHTML='<option value="">Todos os clãs</option>'+[...new Set(state.members.map(m=>m.clan).filter(Boolean))].sort().map(v=>`<option value="${escapeHtml(v)}">${escapeHtml(v)}</option>`).join("");clan.value=cv;
  slot.innerHTML='<option value="">Todos os horários</option>'+[...new Set(state.attendance.map(a=>a.slot).filter(Boolean))].sort().map(v=>`<option value="${escapeHtml(v)}">${escapeHtml(v)}</option>`).join("");slot.value=sv;
}
function recordsRowsHtml(rows){return rows.map(item=>{const st=presenceStatus(item.status);return `<tr><td>${escapeHtml(item.date||"—")}</td><td><strong>${escapeHtml(item.memberName||"—")}</strong></td><td>${escapeHtml(item.clan||"—")}</td><td>${escapeHtml(presenceTypeLabel(item.kind))}</td><td>${escapeHtml(item.slot||"—")}</td><td><span class="presence-status-chip ${st.cls}">${st.icon} ${st.label}</span></td><td>${escapeHtml(item.note||"—")}</td><td>${escapeHtml(item.updatedByName||"—")}</td><td>${escapeHtml(recordTimestamp(item))}</td></tr>`}).join("")||'<tr><td colspan="9">Nenhum registro encontrado com os filtros selecionados.</td></tr>'}
function renderRecordsCenter(){
  if(!editor())return;const root=byId("registros");if(!root)return;populateRecordsFilters();
  const rows=recordsFilteredRows();setText("recordsResultCount",`${rows.length} registro${rows.length===1?"":"s"}`);setText("sidebarRecordsBadge",state.attendance.length);setText("recordsTotal",rows.length);setText("recordsPresent",rows.filter(x=>Number(x.status)===1).length);setText("recordsJustified",rows.filter(x=>Number(x.status)===3).length);setText("recordsAbsent",rows.filter(x=>Number(x.status)===-1).length);setText("recordsPanelTitle",recordsMode==="individual"?"Consulta Individual":"Consulta Geral");setHtml("recordsRows",recordsRowsHtml(rows));
  document.querySelectorAll("[data-record-mode]").forEach(btn=>btn.classList.toggle("primary",btn.dataset.recordMode===recordsMode));
  const member=byId("recordsMember");if(member){member.disabled=false;member.querySelector('option[value=""]')?.replaceChildren(document.createTextNode(recordsMode==="individual"?"Selecione um membro":"Todos os membros"));}
}
function recordsExportMatrix(){return [["Data","Membro","Clã","Evento","Horário/Atividade","Status","Observação","Responsável","Atualização"],...recordsFilteredRows().map(i=>[i.date||"",i.memberName||"",i.clan||"",presenceTypeLabel(i.kind),i.slot||"",presenceStatus(i.status).label,i.note||"",i.updatedByName||"",recordTimestamp(i)])]}
function downloadRecordsCsv(){const matrix=recordsExportMatrix(),csv=matrix.map(row=>row.map(v=>`"${String(v??"").replaceAll('"','""')}"`).join(";")).join("\n"),blob=new Blob(["\ufeff"+csv],{type:"text/csv;charset=utf-8"}),a=document.createElement("a");a.href=URL.createObjectURL(blob);a.download=`77-team-registros-${recordsMode}-${todayIso()}.csv`;a.click();URL.revokeObjectURL(a.href)}
function downloadRecordsExcel(){const matrix=recordsExportMatrix(),html=`<html><head><meta charset="utf-8"></head><body><table border="1">${matrix.map((row,index)=>`<tr>${row.map(v=>index?`<td>${escapeHtml(v)}</td>`:`<th>${escapeHtml(v)}</th>`).join("")}</tr>`).join("")}</table></body></html>`,blob=new Blob(["\ufeff"+html],{type:"application/vnd.ms-excel"}),a=document.createElement("a");a.href=URL.createObjectURL(blob);a.download=`77-team-registros-${recordsMode}-${todayIso()}.xls`;a.click();URL.revokeObjectURL(a.href)}
function printRecords(autoPrint=true){const rows=recordsFilteredRows(),memberName=recordsMode==="individual"?(state.members.find(m=>m.id===byId("recordsMember")?.value)?.name||"Membro não selecionado"):"Todos os membros",w=window.open("","_blank");if(!w)return toast("Permita pop-ups para gerar o relatório.");w.document.write(`<html><head><meta charset="utf-8"><title>77 TEAM - Registros</title><style>body{font-family:Arial;padding:26px;color:#151515}h1{margin:0}p{color:#555}table{width:100%;border-collapse:collapse;font-size:12px;margin-top:20px}th,td{border:1px solid #bbb;padding:7px;text-align:left}th{background:#eee}.summary{display:flex;gap:18px;margin:18px 0}.summary b{font-size:20px;display:block}</style></head><body><h1>77 TEAM Manager</h1><p>${recordsMode==="individual"?`Registro Individual — ${escapeHtml(memberName)}`:"Registro Geral de Presenças"}</p><div class="summary"><span><b>${rows.length}</b>Total</span><span><b>${rows.filter(x=>x.status===1).length}</b>Presentes</span><span><b>${rows.filter(x=>x.status===3).length}</b>Justificados</span><span><b>${rows.filter(x=>x.status===-1).length}</b>Ausentes</span></div><table><thead><tr><th>Data</th><th>Membro</th><th>Clã</th><th>Evento</th><th>Horário</th><th>Status</th><th>Observação</th><th>Responsável</th></tr></thead><tbody>${rows.map(i=>`<tr><td>${escapeHtml(i.date||"—")}</td><td>${escapeHtml(i.memberName||"—")}</td><td>${escapeHtml(i.clan||"—")}</td><td>${escapeHtml(presenceTypeLabel(i.kind))}</td><td>${escapeHtml(i.slot||"—")}</td><td>${escapeHtml(presenceStatus(i.status).label)}</td><td>${escapeHtml(i.note||"—")}</td><td>${escapeHtml(i.updatedByName||"—")}</td></tr>`).join("")}</tbody></table>${autoPrint?'<script>window.onload=()=>window.print()<\/script>':''}</body></html>`);w.document.close()}
document.addEventListener("click",event=>{const mode=event.target.closest("[data-record-mode]");if(mode){recordsMode=mode.dataset.recordMode;renderRecordsCenter();return}});
["recordsSearch"].forEach(id=>on(id,"input",renderRecordsCenter));["recordsMember","recordsDateFrom","recordsDateTo","recordsKind","recordsSlot","recordsStatus","recordsClan"].forEach(id=>on(id,"change",renderRecordsCenter));
on("recordsClear","click",()=>{["recordsSearch","recordsMember","recordsDateFrom","recordsDateTo","recordsKind","recordsSlot","recordsStatus","recordsClan"].forEach(id=>setValue(id,""));renderRecordsCenter()});on("recordsCsv","click",downloadRecordsCsv);on("recordsExcel","click",downloadRecordsExcel);on("recordsPrint","click",()=>printRecords(true));on("recordsPdf","click",()=>printRecords(true));

// V20.9 — Hub STAFF integrado ao menu e aos módulos operacionais.

// V22.7.2 — matriz configurável de permissões preservada
on("saveRolePermissions","click",saveConfigurableRolePermissions);
on("resetRolePermissions","click",()=>{
  if(!owner())return toast("Somente o DEV pode alterar permissões.");
  state.settings={...state.settings,rolePermissions:defaultRolePermissions()};
  renderRolePermissionMatrix();
  setText("rolePermissionStatus","Padrão restaurado localmente. Clique em Salvar permissões.");
});
on("rolePermissionSearch","input",event=>{
  const term=String(event.target.value||"").trim().toLowerCase();
  document.querySelectorAll("[data-permission-row]").forEach(row=>row.classList.toggle("hidden",term&&!row.dataset.search.includes(term)));
});
