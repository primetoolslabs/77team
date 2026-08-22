
function byId(id){return document.getElementById(id)}
function setText(id,value){const el=byId(id);if(el)el.textContent=value??""}
function setHtml(id,value){const el=byId(id);if(el)el.innerHTML=value??""}
function setValue(id,value){const el=byId(id);if(el)el.value=value??""}
function escapeHtml(value){return String(value??"").replace(/[&<>"']/g,char=>({"&":"&amp;","<":"&lt;",">":"&gt;","\"":"&quot;","'":"&#39;"}[char]))}
function safeImageUrl(value){const url=String(value||"").trim();return /^(https:\/\/|data:image\/(?:png|jpeg|webp);base64,)/i.test(url)?url:""}
function safeExternalUrl(value){const url=String(value||"").trim();return /^https:\/\/[a-z0-9.-]+(?::\d+)?(?:[/?#]|$)/i.test(url)?url:""}
function csvSafe(value){const text=String(value??"");return /^[=+\-@]/.test(text.trimStart())?`'${text}`:text}
function on(id,eventName,handler){const el=byId(id);if(el)el.addEventListener(eventName,handler)}
function finalizePrintWindow(printWindow,autoPrint=true){
  printWindow.document.close();
  printWindow.document.querySelector("[data-popup-print]")?.addEventListener("click",()=>printWindow.print());
  if(autoPrint)setTimeout(()=>{try{printWindow.focus();printWindow.print()}catch{}},300);
}

import {firebaseConfig,FIREBASE_VERSION} from "./firebase-config.js";
import {asciiPdfText,createTextPdf} from "./pdf-generator.js";
const SDK=`https://www.gstatic.com/firebasejs/${FIREBASE_VERSION}`;
const {initializeApp,deleteApp}=await import(`${SDK}/firebase-app.js`);
const {getAuth,onAuthStateChanged,signInWithEmailAndPassword,createUserWithEmailAndPassword,signOut,updatePassword,updateEmail,reauthenticateWithCredential,EmailAuthProvider,setPersistence,browserLocalPersistence,browserSessionPersistence,deleteUser,sendPasswordResetEmail,sendEmailVerification}=await import(`${SDK}/firebase-auth.js`);
const {getFirestore,initializeFirestore,persistentLocalCache,persistentMultipleTabManager,collection,doc,getDoc,getDocs,setDoc,addDoc,updateDoc,deleteDoc,deleteField,onSnapshot,serverTimestamp,writeBatch,runTransaction,query,where,Timestamp}=await import(`${SDK}/firebase-firestore.js`);
const {getStorage,ref:storageRef,uploadBytes,getDownloadURL,deleteObject}=await import(`${SDK}/firebase-storage.js`);

const app=initializeApp(firebaseConfig);
const auth=getAuth(app);
const db=initializeFirestore(app,{localCache:persistentLocalCache({tabManager:persistentMultipleTabManager()})});
const storage=getStorage(app);
const $=s=>document.querySelector(s),$$=s=>Array.from(document.querySelectorAll(s));

const CLANS=["77 Team I","77 Team II","77 Team III","Projeto X"];
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
function configuredPresenceSlots(kind){
  const attendance=state.settings?.attendance||{},key=kind==="worldboss"?"worldbossSchedule":kind==="purgatorio"?"purgatorioSchedule":"eventsSchedule";
  const rows=String(attendance[key]||"").split(",").map(item=>item.trim()).filter(Boolean).slice(0,30);
  return rows.length?rows:TYPES[kind]||[];
}
function configuredEventEnabled(kind){const cfg=state.settings?.events||{};return kind==="worldboss"?cfg.worldbossEnabled!==false:kind==="purgatorio"?cfg.purgatorioEnabled!==false:cfg.customEventsEnabled!==false}

const state={user:null,profile:null,onboardingRequired:false,members:[],membersLoaded:false,attendance:[],attendanceLoaded:false,rtPresence:[],users:[],usersLoaded:false,audit:[],events:[],eventsLoaded:false,notifications:[],sentNotifications:[],notificationReads:[],settings:{},publicHome:null,xpLogs:[],payments:[],supportMessages:[],selectedSupportOwnerUid:"",selectedSupportTicketId:"",supportView:"active",chatMessages:[],selectedChatOwnerUid:"",selectedChatId:"",chatView:"active",chatSearch:"",editingCharacterUserId:"",presenceFilters:{},presenceBackups:[],sessions:[],unsubs:[]};
let rolePermissionsDirty=false;
let subscribedPermissionSignature="";
let permissionResubscribeTimer=null;

function toast(msg){const el=$("#toast");el.textContent=msg;el.classList.add("show");clearTimeout(toast.t);toast.t=setTimeout(()=>el.classList.remove("show"),3000)}
function errMsg(e){return ({'auth/invalid-credential':'E-mail ou senha incorretos.','auth/user-disabled':'Esta conta foi desativada.','auth/too-many-requests':'Muitas tentativas. Aguarde alguns minutos e tente novamente.','auth/network-request-failed':'Falha de conexão. Verifique sua internet.','auth/email-already-in-use':'Este e-mail já possui uma conta. Use a mesma senha para recuperar o cadastro pendente.','auth/operation-not-allowed':'Ative o provedor E-mail/Senha em Firebase Authentication.','auth/invalid-email':'Informe um endereço de e-mail válido.','auth/weak-password':'A senha precisa ter pelo menos 8 caracteres.','permission-denied':'Permissão negada pelo Firebase para esta ação. Confira a aba Cargos e Permissões; se a permissão estiver ativa, atualize a página para sincronizar a matriz.'})[e?.code]||`${e?.code||'erro'}: ${e?.message||'Falha inesperada'}`}
function showOnly(id){document.body.dataset.screen=id;["loading","authScreen","app"].forEach(x=>$("#"+x).classList.toggle("hidden",x!==id))}

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

// Alterações administrativas nunca vinculam contas apenas por nome.
function linkedUserByUidForMember(member){
  if(!member)return null;
  const uid=String(member.userId||member.id||"").trim();
  return uid?state.users.find(user=>user.id===uid)||null:null;
}

const ROLE_CONFIG=Object.freeze({
  dev:{label:"DEV",level:4,badgeClass:"role-dev"},
  leadership:{label:"Liderança",level:3,badgeClass:"role-leadership"},
  staff:{label:"Staff",level:2,badgeClass:"role-staff"},
  member:{label:"Membro",level:1,badgeClass:"role-member"}
});

function normalizeAccessRole(role){
  const value=String(role||"").trim().toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g,"");
  if(["dev","developer","desenvolvedor","owner","proprietario"].includes(value))return "dev";
  if(["administrador","admin"].includes(value))return "leadership";
  if(["leadership","lideranca","lider","leader","lideranca staff","lideranca/staff"].includes(value))return "leadership";
  if(["staff","moderador","moderator"].includes(value))return "staff";
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
    profile.role,
    profile.memberRole
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
function currentAccessRole(){return resolveAccessRole(state.profile)}
function owner(){return currentAccessRole()==="dev"}
function leadership(){return currentAccessRole()==="leadership"}
function staff(){return currentAccessRole()==="staff"}
function editor(){return ["dev","leadership","staff"].includes(currentAccessRole())}
function administrator(){return ["dev","leadership"].includes(currentAccessRole())}
window.TeamManagerState=state;
window.TeamManagerIsOwner=owner;
window.TeamManagerIsAdministrator=administrator;
window.TeamManagerIsEditor=editor;
window.TeamManagerProgressionForCurrentUser=()=>progressionForCurrentUser();
function hasRoleLevel(level){return (ROLE_CONFIG[currentAccessRole()]?.level||0)>=level}
function canManageAcceptedMember(member,user){
  if(!permissionEnabled("roles_change")||!member||!user||user.status!=="approved"||user.active===false)return false;
  if(user.id===state.user?.uid)return false;
  const target=resolveAccessRole(user);
  if(owner())return true;
  if(leadership())return target==="staff"||target==="member";
  return false;
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

function characterEditorCargoOptions(item){
  if(!item||!state.user)return [];
  const user=state.users.find(row=>row.id===item.id);
  const member=state.members.find(row=>row.userId===item.id||row.id===item.id||row.name===item.nickname)||{};
  // Na edição de Personagem o DEV pode alterar qualquer cargo, inclusive o próprio.
  if(currentAccessRole()==="dev")return [
    {value:"dev",label:"DEV"},{value:"leadership",label:"Liderança"},{value:"staff",label:"Staff"},
    ...MEMBER_ROLES.map(value=>({value:`member:${value}`,label:value}))
  ];
  if(!permissionEnabled("roles_change")||!user)return [];
  return allowedCargoOptions(member,user);
}
function characterEditorSelectedCargo(item){
  const user=state.users.find(row=>row.id===item?.id)||{};
  const member=state.members.find(row=>row.userId===item?.id||row.id===item?.id||row.name===item?.nickname)||{};
  const access=resolveAccessRole(user);
  return access==="member"?`member:${member.role||user.memberRole||"Membros"}`:access;
}

const HOME_PAGES=new Set(["dashboard","meu-perfil","membros","historico","ranking","calendario","estatisticas","sobre"]);
const STAFF_PAGES=new Set(["staff-hub","presencas","rt-presenca","registros","pagamentos","worldboss","purgatorio","eventos","personagens","metas","solicitacoes","notificacoes","atendimento","chat"]);
const ADMIN_PAGES=new Set(["staff","configuracoes","backup-central","auditoria"]);
const ADVANCED_PAGES=new Set(["atualizacoes","backup","logs-sistema","status-firebase","status-github","sessoes","manutencao","status-servicos","limpeza-cache","estatisticas-sistema","personalizar-login","permissoes-cargos"]);

const ROLE_PERMISSION_DEFINITIONS=Object.freeze([
  {group:"Acesso às áreas",key:"access_home",label:"Acessar HOME",defaults:{dev:true,leadership:true,staff:true,member:true}},
  {group:"Acesso às áreas",key:"access_staff",label:"Acessar STAFF",defaults:{dev:true,leadership:true,staff:true,member:false}},
  {group:"Acesso às áreas",key:"access_admin",label:"Acessar ADMINISTRAÇÃO",defaults:{dev:true,leadership:true,staff:false,member:false}},
  {group:"Acesso às áreas",key:"access_advanced",label:"Acessar AVANÇADO",defaults:{dev:true,leadership:false,staff:false,member:false}},
  {group:"Presenças",key:"presence_register",label:"Registrar presença",defaults:{dev:true,leadership:true,staff:true,member:false}},
  {group:"Presenças",key:"presence_edit",label:"Editar presença",defaults:{dev:true,leadership:true,staff:true,member:false}},
  {group:"Presenças",key:"presence_delete",label:"Excluir presença",defaults:{dev:true,leadership:false,staff:false,member:false}},
  {group:"Presenças",key:"presence_finalize",label:"Finalizar RT",defaults:{dev:true,leadership:true,staff:true,member:false}},
  {group:"Presenças",key:"presence_reset",label:"Resetar ciclo semanal",defaults:{dev:true,leadership:true,staff:false,member:false}},
  {group:"Solicitações e cargos",key:"requests_approve",label:"Aprovar solicitações",defaults:{dev:true,leadership:true,staff:true,member:false}},
  {group:"Solicitações e cargos",key:"requests_reject",label:"Rejeitar solicitações",defaults:{dev:true,leadership:true,staff:true,member:false}},
  {group:"Solicitações e cargos",key:"roles_change",label:"Alterar cargos permitidos pela hierarquia",defaults:{dev:true,leadership:true,staff:false,member:false}},
  {group:"Membros",key:"members_delete",label:"Excluir membros",defaults:{dev:true,leadership:true,staff:true,member:false}},
  {group:"Membros",key:"members_clan_change",label:"Alterar clã dos membros",defaults:{dev:true,leadership:true,staff:true,member:false}},
  {group:"Membros",key:"members_edit",label:"Editar e cadastrar membros",defaults:{dev:true,leadership:true,staff:true,member:false}},
  {group:"Personagens",key:"character_view",label:"Visualizar personagens",defaults:{dev:true,leadership:true,staff:true,member:true}},
  {group:"Personagens",key:"character_edit",label:"Editar personagens permitidos",defaults:{dev:true,leadership:true,staff:true,member:true}},
  {group:"Personagens",key:"character_delete",label:"Excluir personagens permitidos",defaults:{dev:true,leadership:true,staff:true,member:true}},
  {group:"Comunicação",key:"notifications_send",label:"Enviar notificações",defaults:{dev:true,leadership:true,staff:true,member:false}},
  {group:"Comunicação",key:"support_manage",label:"Gerenciar atendimento e chat",defaults:{dev:true,leadership:true,staff:true,member:false}},
  {group:"Financeiro",key:"payments_manage",label:"Registrar e consultar pagamentos",defaults:{dev:true,leadership:true,staff:true,member:false}},
  {group:"Administração",key:"audit_view",label:"Visualizar Auditoria",defaults:{dev:true,leadership:true,staff:false,member:false}},
  {group:"Administração",key:"settings_view",label:"Visualizar Configurações",defaults:{dev:true,leadership:true,staff:false,member:false}},
  {group:"Administração",key:"settings_edit",label:"Alterar Configurações",defaults:{dev:true,leadership:false,staff:false,member:false}},
  {group:"Avançado",key:"login_customize",label:"Personalizar tela de login",defaults:{dev:true,leadership:false,staff:false,member:false}},
  {group:"Progressão",key:"xp_manage",label:"Gerenciar XP dos membros",defaults:{dev:true,leadership:true,staff:true,member:false}}
  ,{group:"Gestão",key:"goals_manage",label:"Criar e remover metas",defaults:{dev:true,leadership:true,staff:true,member:false}}
  ,{group:"Eventos",key:"events_manage",label:"Criar, editar e excluir eventos",defaults:{dev:true,leadership:true,staff:true,member:false}}
  ,{group:"Abas · HOME",key:"page_dashboard",label:"Abrir Visão Geral",defaults:{dev:true,leadership:true,staff:true,member:true}}
  ,{group:"Abas · HOME",key:"page_meu_perfil",label:"Abrir Meu Perfil",defaults:{dev:true,leadership:true,staff:true,member:true}}
  ,{group:"Abas · HOME",key:"page_membros",label:"Abrir Membros",defaults:{dev:true,leadership:true,staff:true,member:true}}
  ,{group:"Abas · HOME",key:"page_historico",label:"Abrir Histórico",defaults:{dev:true,leadership:true,staff:true,member:true}}
  ,{group:"Abas · HOME",key:"page_ranking",label:"Abrir Ranking",defaults:{dev:true,leadership:true,staff:true,member:true}}
  ,{group:"Abas · HOME",key:"page_calendario",label:"Abrir Calendário",defaults:{dev:true,leadership:true,staff:true,member:true}}
  ,{group:"Abas · HOME",key:"page_estatisticas",label:"Abrir Estatísticas",defaults:{dev:true,leadership:true,staff:true,member:true}}
  ,{group:"Abas · HOME",key:"page_sobre",label:"Abrir Sobre",defaults:{dev:true,leadership:true,staff:true,member:true}}
  ,{group:"Abas · STAFF",key:"page_staff_hub",label:"Abrir painel STAFF",defaults:{dev:true,leadership:true,staff:true,member:false}}
  ,{group:"Abas · STAFF",key:"page_presencas",label:"Abrir Presenças",defaults:{dev:true,leadership:true,staff:true,member:false}}
  ,{group:"Abas · STAFF",key:"page_rt_presenca",label:"Abrir RT Presença",defaults:{dev:true,leadership:true,staff:true,member:false}}
  ,{group:"Abas · STAFF",key:"page_registros",label:"Abrir Registros",defaults:{dev:true,leadership:true,staff:true,member:false}}
  ,{group:"Abas · STAFF",key:"page_pagamentos",label:"Abrir Pagamentos",defaults:{dev:true,leadership:true,staff:true,member:false}}
  ,{group:"Abas · STAFF",key:"page_personagens",label:"Abrir Personagens",defaults:{dev:true,leadership:true,staff:true,member:false}}
  ,{group:"Abas · STAFF",key:"page_metas",label:"Abrir Metas",defaults:{dev:true,leadership:true,staff:true,member:false}}
  ,{group:"Abas · STAFF",key:"page_solicitacoes",label:"Abrir Solicitações",defaults:{dev:true,leadership:true,staff:true,member:false}}
  ,{group:"Abas · STAFF",key:"page_notificacoes",label:"Abrir Notificações",defaults:{dev:true,leadership:true,staff:true,member:false}}
  ,{group:"Abas · STAFF",key:"page_atendimento",label:"Abrir Atendimento",defaults:{dev:true,leadership:true,staff:true,member:false}}
  ,{group:"Abas · STAFF",key:"page_chat",label:"Abrir Chat",defaults:{dev:true,leadership:true,staff:true,member:false}}
  ,{group:"Abas · ADMIN",key:"page_staff",label:"Abrir Gestão STAFF",defaults:{dev:true,leadership:true,staff:false,member:false}}
  ,{group:"Abas · ADMIN",key:"page_configuracoes",label:"Abrir Configurações",defaults:{dev:true,leadership:true,staff:false,member:false}}
  ,{group:"Abas · ADMIN",key:"page_backup_central",label:"Abrir Backup Central",defaults:{dev:true,leadership:true,staff:false,member:false}}
  ,{group:"Abas · ADMIN",key:"page_auditoria",label:"Abrir Auditoria",defaults:{dev:true,leadership:true,staff:false,member:false}}
  ,{group:"Abas · AVANÇADO",key:"page_atualizacoes",label:"Abrir Atualizações",defaults:{dev:true,leadership:false,staff:false,member:false}}
  ,{group:"Abas · AVANÇADO",key:"page_backup",label:"Abrir Backup avançado",defaults:{dev:true,leadership:false,staff:false,member:false}}
  ,{group:"Abas · AVANÇADO",key:"page_logs_sistema",label:"Abrir Logs do Sistema",defaults:{dev:true,leadership:false,staff:false,member:false}}
  ,{group:"Abas · AVANÇADO",key:"page_status_firebase",label:"Abrir Status Firebase",defaults:{dev:true,leadership:false,staff:false,member:false}}
  ,{group:"Abas · AVANÇADO",key:"page_status_github",label:"Abrir Status GitHub",defaults:{dev:true,leadership:false,staff:false,member:false}}
  ,{group:"Abas · AVANÇADO",key:"page_sessoes",label:"Abrir Sessões",defaults:{dev:true,leadership:false,staff:false,member:false}}
  ,{group:"Abas · AVANÇADO",key:"page_manutencao",label:"Abrir Manutenção",defaults:{dev:true,leadership:false,staff:false,member:false}}
  ,{group:"Abas · AVANÇADO",key:"page_status_servicos",label:"Abrir Status de Serviços",defaults:{dev:true,leadership:false,staff:false,member:false}}
  ,{group:"Abas · AVANÇADO",key:"page_limpeza_cache",label:"Abrir Limpeza de Cache",defaults:{dev:true,leadership:false,staff:false,member:false}}
  ,{group:"Abas · AVANÇADO",key:"page_estatisticas_sistema",label:"Abrir Estatísticas do Sistema",defaults:{dev:true,leadership:false,staff:false,member:false}}
  ,{group:"Abas · AVANÇADO",key:"page_personalizar_login",label:"Abrir Personalizar Login",defaults:{dev:true,leadership:false,staff:false,member:false}}
  ,{group:"Abas · AVANÇADO",key:"page_permissoes_cargos",label:"Abrir Cargos e Permissões",defaults:{dev:true,leadership:false,staff:false,member:false}}
]);
function defaultRolePermissions(){
  const result={};
  ROLE_PERMISSION_DEFINITIONS.forEach(item=>{result[item.key]={...item.defaults};});
  return result;
}
function configuredRolePermissions(){return state.settings?.rolePermissions||defaultRolePermissions();}
const PERMISSION_ALLOWED_ROLES=Object.freeze({
  access_home:["dev","leadership","staff","member"],
  access_staff:["dev","leadership","staff"],
  access_admin:["dev","leadership"],access_advanced:["dev"],
  presence_register:["dev","leadership","staff"],presence_edit:["dev","leadership","staff"],
  presence_delete:["dev","leadership","staff"],presence_finalize:["dev","leadership","staff"],presence_reset:["dev","leadership","staff"],
  requests_approve:["dev","leadership","staff"],requests_reject:["dev","leadership","staff"],roles_change:["dev","leadership"],
  members_delete:["dev","leadership","staff"],members_clan_change:["dev","leadership","staff"],members_edit:["dev","leadership","staff"],
  character_view:["dev","leadership","staff","member"],character_edit:["dev","leadership","staff","member"],character_delete:["dev","leadership","staff","member"],
  notifications_send:["dev","leadership","staff"],support_manage:["dev","leadership","staff"],payments_manage:["dev","leadership","staff"],
  audit_view:["dev","leadership"],settings_view:["dev","leadership"],settings_edit:["dev"],login_customize:["dev"],
  xp_manage:["dev","leadership","staff"],goals_manage:["dev","leadership","staff"],events_manage:["dev","leadership","staff"]
});
function permissionRoleAllowed(key,role){
  if(role==="dev")return true;
  const explicit=PERMISSION_ALLOWED_ROLES[key];
  if(explicit)return explicit.includes(role);
  const item=ROLE_PERMISSION_DEFINITIONS.find(entry=>entry.key===key);
  if(item?.group?.startsWith("Abas ·"))return item.defaults?.[role]===true;
  return ["leadership","staff","member"].includes(role);
}
function permissionRequired(key,role){return role==="dev"||key==="access_home"}
function permissionEnabled(key,role=currentAccessRole()){
  if(role==="dev")return true;
  if(!permissionRoleAllowed(key,role))return false;
  if(permissionRequired(key,role))return true;
  const item=ROLE_PERMISSION_DEFINITIONS.find(entry=>entry.key===key);
  const configured=configuredRolePermissions()?.[key];
  return configured?.[role] ?? item?.defaults?.[role] ?? false;
}
function permissionRuntimeSignature(){
  return JSON.stringify({role:currentAccessRole(),permissions:configuredRolePermissions()});
}
function schedulePermissionRuntimeRefresh(){
  clearTimeout(permissionResubscribeTimer);
  permissionResubscribeTimer=setTimeout(()=>{
    if(!state.user)return;
    const signature=permissionRuntimeSignature();
    applyPermissions();
    render();
    if(signature!==subscribedPermissionSignature)subscribeAll();
  },80);
}
function canDeleteMemberRecord(member){
  if(!member||!permissionEnabled("members_delete"))return false;
  const linkedUser=linkedUserForMember(member),targetRole=linkedUser?resolveAccessRole(linkedUser):normalizeAccessRole(member.accessRole||member.role);
  if(targetRole==="dev"||member.userId===state.user?.uid)return false;
  return currentAccessRole()!=="staff"||targetRole==="member";
}
function canChangeMemberClan(member){
  if(!member||!permissionEnabled("members_clan_change"))return false;
  if(currentAccessRole()!=="staff")return true;
  const linkedUser=linkedUserForMember(member),targetRole=linkedUser?resolveAccessRole(linkedUser):normalizeAccessRole(member.accessRole||member.role);
  return targetRole==="member";
}

const ROLE_PAGE_PERMISSIONS=Object.freeze({
  dev:{home:true,staff:true,admin:true,advanced:true},
  leadership:{home:true,staff:true,admin:true,advanced:false},
  staff:{home:true,staff:true,admin:false,advanced:false},
  member:{home:true,staff:false,admin:false,advanced:false}
});

function pageArea(page){
  if(ADVANCED_PAGES.has(page))return "advanced";
  if(ADMIN_PAGES.has(page))return "admin";
  if(STAFF_PAGES.has(page))return "staff";
  return "home";
}
function pagePermissionKey(page){return `page_${String(page||"").replace(/-/g,"_")}`;}
function pagePermissionEnabled(page){
  const key=pagePermissionKey(page);
  return ROLE_PERMISSION_DEFINITIONS.some(item=>item.key===key)?permissionEnabled(key):true;
}
function canOpenPage(page){
  if(!state.user)return page==="dashboard"||page==="sobre";
  if(state.onboardingRequired)return (page==="meu-perfil"||page==="sobre")&&pagePermissionEnabled(page);
  if(!pagePermissionEnabled(page))return false;
  if(page==="personagens")return permissionEnabled("access_staff")&&permissionEnabled("character_view");
  if(page==="solicitacoes")return permissionEnabled("access_staff")&&(permissionEnabled("requests_approve")||permissionEnabled("requests_reject"));
  if(page==="notificacoes")return permissionEnabled("access_staff")&&permissionEnabled("notifications_send");
  if(page==="atendimento"||page==="chat")return permissionEnabled("access_staff")&&permissionEnabled("support_manage");
  if(page==="pagamentos")return permissionEnabled("access_staff")&&permissionEnabled("payments_manage");
  if(page==="metas")return permissionEnabled("access_staff")&&permissionEnabled("goals_manage");
  if(page==="configuracoes")return permissionEnabled("access_admin")&&permissionEnabled("settings_view");
  if(page==="auditoria"||page==="logs-sistema")return permissionEnabled(page==="auditoria"?"access_admin":"access_advanced")&&permissionEnabled("audit_view");
  const area=pageArea(page);
  return permissionEnabled(`access_${area}`);
}
function permissionMessage(page){
  if(!state.user)return "Para acessar esta área, crie uma conta e faça login.";
  if(["personagens","solicitacoes","notificacoes","atendimento","chat","pagamentos","metas","rt-presenca"].includes(page))return "Seu cargo não possui a permissão necessária para este módulo.";
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
  return state.members.filter(member=>member.active!==false&&!isHiddenDevMember(member));
}
function homeAttendanceRecords(){
  return state.attendance.filter(item=>Boolean(memberForAttendance(item)));
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
async function ownerExists(){try{return (await getDoc(doc(db,"system","owner"))).exists()}catch(e){return true}}

function fillSelects(){
  $("#memberRole").innerHTML=ALL_ROLES.map(x=>`<option>${x}</option>`).join("");
  $("#memberClan").innerHTML='<option value="">Selecione o clã</option>'+CLANS.map(x=>`<option>${x}</option>`).join("");
}
fillSelects();

async function decideInitialScreen(){
  showPublicHome();
}
function showPublicHome(){
  clearSubs();state.user=null;state.onboardingRequired=false;
  state.members=[];state.attendance=[];state.events=[];state.publicHome=null;
  state.membersLoaded=false;state.attendanceLoaded=false;state.eventsLoaded=false;
  state.profile={name:"Visitante",displayName:"Visitante",role:"member",accessRole:"member",active:false,status:"public"};
  document.body.dataset.publicView="true";showOnly("app");applyPermissions();
  setText("welcomeName","Visitante");setText("topbarUserName","Visitante");setText("userBadge","Visualização");
  byId("publicHomeBanner")?.classList.remove("hidden");
  const logoutLabel=byId("sidebarLogout")?.querySelector(".menu-label");if(logoutLabel)logoutLabel.textContent="Entrar / Cadastrar";
  window.TeamManagerUI?.activatePage("dashboard");window.syncModuleNavigation?.("dashboard");
  renderPublicHomeLoading();
  subscribePublicHome();
}
decideInitialScreen();

// Aviso público informativo; nunca bloqueia a autenticação.
onSnapshot(doc(db,"settings","app"),snapshot=>{const publicSettings=snapshot.exists()?snapshot.data():{};state.settings={...state.settings,...publicSettings};applyMaintenanceNotice();applyLoginCustomization()},error=>console.warn("Aviso de manutenção indisponível:",error));

$("#loginForm").onsubmit=async e=>{
  e.preventDefault();
  const email=$("#loginEmail").value.trim().toLowerCase();
  const password=$("#loginPassword").value;
  const submit=e.currentTarget.querySelector('button[type="submit"]');
  if(!email||!password)return toast("Informe o e-mail e a senha.");
  if(!email.includes("@"))return toast("Use o e-mail cadastrado para entrar.");
  try{
    if(submit){submit.disabled=true;submit.dataset.originalText=submit.textContent;submit.textContent="ENTRANDO..."}
    const remember=Boolean($("#rememberLoginV222")?.checked);
    await setPersistence(auth,remember?browserLocalPersistence:browserSessionPersistence);
    await signInWithEmailAndPassword(auth,email,password);
  }catch(e2){
    console.error("Falha no login:",e2);
    toast(errMsg(e2));
  }finally{
    if(submit){submit.disabled=false;submit.textContent=submit.dataset.originalText||"ENTRAR NO SISTEMA"}
  }
};
on("forgotPasswordButton","click",async()=>{
  const email=String(byId("loginEmail")?.value||"").trim().toLowerCase();
  if(!email||!email.includes("@"))return toast("Informe seu e-mail no campo de login para recuperar a senha.");
  const button=byId("forgotPasswordButton");
  try{
    if(button){button.disabled=true;button.dataset.originalText=button.textContent;button.textContent="ENVIANDO..."}
    await sendPasswordResetEmail(auth,email);
    toast("Se o e-mail estiver cadastrado, enviaremos um link para redefinir a senha.");
  }catch(error){
    console.error("Falha ao solicitar redefinição de senha:",error);
    // Mantém resposta neutra para não revelar se um e-mail existe no sistema.
    if(error?.code==="auth/invalid-email")toast("Informe um endereço de e-mail válido.");
    else toast("Não foi possível enviar agora. Verifique sua conexão e tente novamente.");
  }finally{if(button){button.disabled=false;button.textContent=button.dataset.originalText||"Esqueci minha senha"}}
});
$("#toggleSignup").onclick=()=>$("#signupBox").classList.toggle("hidden");

$("#signupForm").onsubmit=async e=>{
  e.preventDefault();
  let secondary,signupAuth,cred,createdNow=false;
  const submit=e.currentTarget.querySelector('button[type="submit"]');
  try{
    if(submit){submit.disabled=true;submit.dataset.originalText=submit.textContent;submit.textContent="CRIANDO CONTA..."}
    secondary=initializeApp(firebaseConfig,"signup-"+Date.now());
    signupAuth=getAuth(secondary);const sd=getFirestore(secondary);
    const name=$("#signupName").value.trim(),email=$("#signupEmail").value.trim().toLowerCase(),password=$("#signupPassword").value;
    const nicknameError=nicknameValidationError(name);if(nicknameError)throw new Error(nicknameError);
    if(password.length<8)throw new Error("A senha precisa ter pelo menos 8 caracteres.");
    let existingProfile=null;
    try{cred=await createUserWithEmailAndPassword(signupAuth,email,password);createdNow=true}
    catch(createError){
      if(createError?.code!=="auth/email-already-in-use")throw createError;
      cred=await signInWithEmailAndPassword(signupAuth,email,password);
      const existingSnap=await getDoc(doc(sd,"users",cred.user.uid));
      if(existingSnap.exists())existingProfile={id:cred.user.uid,...existingSnap.data()};
    }
    await cred.user.getIdToken(true);
    const profileRef=doc(sd,"users",cred.user.uid);
    if(existingProfile){
      const currentStatus=String(existingProfile.status||"").toLowerCase();
      if(currentStatus==="rejected"){
        await updateDoc(profileRef,{status:"pending",active:false,rejectedAt:deleteField(),rejectedBy:deleteField(),rejectionReason:deleteField(),requestedAt:serverTimestamp(),updatedAt:serverTimestamp()});
        try{if(!cred.user.emailVerified)await sendEmailVerification(cred.user)}catch(error){console.warn("Verificação de e-mail não enviada:",error)}
        await signOut(signupAuth);await deleteApp(secondary);secondary=null;e.target.reset();return toast("Solicitação reenviada para análise.");
      }
      if(currentStatus==="pending"||existingProfile.active===false){
        await signOut(signupAuth);await deleteApp(secondary);secondary=null;return toast("Sua solicitação já está aguardando aprovação.");
      }
      await signOut(signupAuth);await deleteApp(secondary);secondary=null;return toast("Esta conta já está ativa. Entre pelo formulário de login.");
    }
    const profile={name,email,role:"member",accessRole:"member",memberRole:"Membros",clan:"",active:false,status:"pending",firstLogin:true,profileCompleted:false,requestedAt:serverTimestamp(),createdAt:serverTimestamp(),updatedAt:serverTimestamp()};
    await setDoc(profileRef,profile);
    try{if(!cred.user.emailVerified)await sendEmailVerification(cred.user)}catch(error){console.warn("Verificação de e-mail não enviada:",error)}
    await signOut(signupAuth);await deleteApp(secondary);secondary=null;e.target.reset();toast("Cadastro enviado para aprovação. Confira seu e-mail para a mensagem de verificação.");
  }catch(e2){if(createdNow&&cred?.user)try{await deleteUser(cred.user)}catch{};if(secondary)try{await deleteApp(secondary)}catch{};toast(errMsg(e2))}
  finally{if(submit){submit.disabled=false;submit.textContent=submit.dataset.originalText||"Enviar cadastro"}}
};

$("#sidebarLogout").onclick=()=>{if(!state.user)return showOnly("authScreen");$("#logoutButton").click()};
$("#publicLoginButton").onclick=()=>showOnly("authScreen");
$("#logoutButton").onclick=async()=>{if(!state.user)return showOnly("authScreen");await writeSessionHeartbeat(false);clearInterval(sessionHeartbeatTimer);clearSubs();await signOut(auth)};

onAuthStateChanged(auth,async user=>{
  state.user=user;
  if(!user){showPublicHome();return}
  try{
    const profileRef=doc(db,"users",user.uid);
    let snap=await getDoc(profileRef);
    let recoveredDevProfile=false;
    if(!snap.exists()){
      // Recupera automaticamente o perfil do DEV quando o documento system/owner existe,
      // mas o perfil users/{uid} foi removido ou não foi criado em uma versão antiga.
      const ownerSnap=await getDoc(doc(db,"system","owner"));
      if(ownerSnap.exists()&&ownerSnap.data()?.uid===user.uid){
        await setDoc(profileRef,{name:user.displayName||"PrimeTools Labs",displayName:user.displayName||"PrimeTools Labs",email:user.email||ownerSnap.data()?.email||"",role:"dev",accessRole:"dev",memberRole:"Membros",clan:"",active:true,status:"approved",firstLogin:false,profileCompleted:true,recoveredFromOwner:true,recoveredAt:serverTimestamp(),updatedAt:serverTimestamp()});
        snap=await getDoc(profileRef);
        recoveredDevProfile=true;
      }
    }
    if(!snap.exists()){await signOut(auth);return toast("Perfil não encontrado. Solicite ao DEV a recuperação da conta.");}
    state.profile={id:user.uid,...snap.data()};
    state.profile.resolvedAccessRole=resolveAccessRole(state.profile);
    const profileStatus=String(state.profile.status||"").toLowerCase();
    if(state.profile.active!==true||profileStatus!=="approved"){
      await signOut(auth);
      if(profileStatus==="pending")return toast("Conta ainda não aprovada.");
      if(profileStatus==="rejected")return toast("Conta rejeitada. Você pode reenviar a solicitação em Criar conta de membro.");
      return toast("Conta não está ativa e aprovada. Solicite ao DEV ou Staff a regularização do cadastro.");
    }
    // Compatibilidade: contas antigas sem os campos de primeiro acesso continuam liberadas.
    state.onboardingRequired=state.profile.profileCompleted===false || state.profile.firstLogin===true;
    document.body.dataset.publicView="false";byId("publicHomeBanner")?.classList.add("hidden");const logoutLabel=byId("sidebarLogout")?.querySelector(".menu-label");if(logoutLabel)logoutLabel.textContent="Sair";
    showOnly("app");applyPermissions();subscribeAll();startSessionHeartbeat();if(owner())setTimeout(runFirebaseDiagnostics,900);
    if(owner())setTimeout(recoverInterruptedRestoreJobs,1200);
    if(recoveredDevProfile){
      toast("Perfil DEV recuperado e criado em Firestore → users.");
      setTimeout(()=>audit("perfil DEV recuperado",`users/${user.uid} recriado a partir de system/owner`),500);
    }
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
  $$(".admin-only").forEach(el=>el.classList.toggle("hidden",!permissionEnabled("access_admin")));
  $$(".editor-only").forEach(el=>el.classList.toggle("hidden",!editor()));
  document.querySelectorAll('[data-category="staff"]').forEach(el=>el.classList.toggle("hidden",!permissionEnabled("access_staff")));
  byId("memberForm")?.classList.toggle("hidden",!permissionEnabled("members_edit"));
  document.body.dataset.accessRole=currentAccessRole();
  document.body.dataset.rawAccessRole=String(state.profile?.accessRole||state.profile?.role||"");
  document.querySelectorAll("[data-save-settings]").forEach(button=>button.classList.toggle("hidden",!permissionEnabled("settings_edit")));
  document.querySelectorAll("#configuracoes input,#configuracoes select,#configuracoes textarea").forEach(field=>field.disabled=!permissionEnabled("settings_edit"));
  byId("configuracoes")?.classList.toggle("hidden",!permissionEnabled("settings_view"));
  byId("auditoria")?.classList.toggle("hidden",!(permissionEnabled("access_admin")&&permissionEnabled("audit_view")));
  document.querySelectorAll('[data-page="configuracoes"]').forEach(button=>button.classList.toggle("hidden",!permissionEnabled("settings_view")));
  document.querySelectorAll('[data-page="auditoria"]').forEach(button=>button.classList.toggle("hidden",!(permissionEnabled("access_admin")&&permissionEnabled("audit_view"))));
  ["personagens","solicitacoes","notificacoes","atendimento","chat","metas","rt-presenca"].forEach(page=>{
    const allowed=canOpenPage(page);byId(page)?.classList.toggle("hidden",!allowed);document.querySelectorAll(`[data-page="${page}"],[data-page-jump="${page}"]`).forEach(button=>button.classList.toggle("hidden",!allowed));
  });
  byId("profileNicknameForm")?.classList.toggle("policy-disabled",state.settings?.team?.allowNickname===false);
  byId("profileAvatarForm")?.classList.toggle("policy-disabled",state.settings?.team?.allowAvatar===false);
  byId("profilePasswordForm")?.classList.toggle("policy-disabled",state.settings?.team?.allowPassword===false);
  byId("staffNoticeForm")?.classList.toggle("hidden",!permissionEnabled("notifications_send"));
  byId("newCalendarEvent")?.classList.toggle("hidden",!permissionEnabled("events_manage"));
  byId("xpAdjustmentForm")?.classList.toggle("hidden",!permissionEnabled("xp_manage"));

  const displayName=state.profile?.name||state.profile?.email||"Usuário";
  const roleLabel=accessRoleLabel(currentAccessRole());

  setText("welcomeName",displayName);
  setText("topbarUserName",displayName);
  setText("userBadge",roleLabel);
  ["userBadge"].forEach(id=>{
    const element=byId(id);if(!element)return;
    element.classList.remove("role-dev","role-leadership","role-staff","role-member");
    element.classList.add(ROLE_CONFIG[currentAccessRole()]?.badgeClass||"role-member");
  });
  const currentActivePage=document.querySelector(".page.active")?.id;
  if(currentActivePage&&!canOpenPage(currentActivePage)){
    window.TeamManagerUI?.activatePage("dashboard");
  }
  const avatarData=safeImageUrl(state.profile?.avatarDataUrl);
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
      state.membersLoaded=true;
      render();
      scheduleAccountRoleSync();
      scheduleNicknameClaimMigration();
    },
    error=>console.error("Falha ao carregar membros:",error)
  ));

  if(state.user){
    state.unsubs.push(onSnapshot(
      collection(db,"attendance"),
      snapshot=>{
        state.attendance=snapshot.docs.map(item=>({id:item.id,...item.data()}));
        state.attendanceLoaded=true;
        render();
        if(permissionEnabled("members_edit"))scheduleAttendanceUserMigration();
      },
      error=>{
        console.error("Falha ao carregar presenças:",error);
        state.attendance=[];
        state.attendanceLoaded=true;
        render();
      }
    ));
  }else{
    state.attendance=[];
    state.attendanceLoaded=false;
  }
}
function subscribeAll(){
  subscribePublic();
  subscribedPermissionSignature=permissionRuntimeSignature();
  if(state.user){
    state.unsubs.push(onSnapshot(doc(db,"users",state.user.uid),snapshot=>{
      if(!snapshot.exists())return;
      const nextProfile={id:snapshot.id,...snapshot.data()};
      const status=String(nextProfile.status||"").toLowerCase();
      if(nextProfile.active!==true||status!=="approved"){
        signOut(auth).catch(()=>{});
        return;
      }
      nextProfile.resolvedAccessRole=resolveAccessRole(nextProfile);
      state.profile=nextProfile;
      state.onboardingRequired=state.profile.profileCompleted===false||state.profile.firstLogin===true;
      schedulePermissionRuntimeRefresh();
    },error=>console.error("Falha ao sincronizar cargo/perfil atual:",error)));
  }
  if(permissionEnabled("access_staff")){
    state.unsubs.push(onSnapshot(collection(db,"rtPresence"),snapshot=>{state.rtPresence=snapshot.docs.map(d=>({id:d.id,...d.data()}));renderRtPresence();},error=>console.error("Falha ao carregar RT Presença:",error)));
    state.unsubs.push(onSnapshot(collection(db,"presenceBackups"),snapshot=>{state.presenceBackups=snapshot.docs.map(d=>({id:d.id,...d.data()})).sort((a,b)=>rtDateValue(b.createdAt)-rtDateValue(a.createdAt));renderPresenceBackups();renderBackupCenter();},error=>console.error("Falha ao carregar backups de presença:",error)));
  }else{state.rtPresence=[];state.presenceBackups=[];}
  if(permissionEnabled("access_staff")||permissionEnabled("access_admin"))state.unsubs.push(onSnapshot(collection(db,"users"),s=>{state.users=s.docs.map(d=>{const user={id:d.id,...d.data()};return {...user,resolvedAccessRole:resolveAccessRole(user)}});state.usersLoaded=true;render();if(permissionEnabled("members_edit"))scheduleAttendanceUserMigration();scheduleAccountRoleSync();scheduleNicknameClaimMigration()},error=>console.error("Falha ao carregar usuários:",error)));else{state.users=[];state.usersLoaded=false;}
  if(permissionEnabled("access_admin")&&permissionEnabled("audit_view"))state.unsubs.push(onSnapshot(collection(db,"audit"),s=>{state.audit=s.docs.map(d=>({id:d.id,...d.data()}));render()},error=>console.error("Falha ao carregar auditoria:",error)));else state.audit=[];
  if(permissionEnabled("access_staff")&&permissionEnabled("xp_manage"))state.unsubs.push(onSnapshot(collection(db,"xpLogs"),s=>{state.xpLogs=s.docs.map(d=>({id:d.id,...d.data()}));render()},error=>console.error("Falha ao carregar XP:",error)));else state.xpLogs=[];
  if(permissionEnabled("access_staff")&&permissionEnabled("payments_manage"))state.unsubs.push(onSnapshot(collection(db,"payments"),s=>{state.payments=s.docs.map(d=>({id:d.id,...d.data()}));renderPayments()},error=>console.error("Falha ao carregar pagamentos:",error)));else state.payments=[];
  state.unsubs.push(onSnapshot(collection(db,"events"),s=>{state.events=s.docs.map(d=>({id:d.id,...d.data()}));state.eventsLoaded=true;render()},error=>{console.error("Falha ao carregar eventos:",error);state.eventsLoaded=true;render()}));
  if(state.user){
    state.unsubs.push(onSnapshot(
      query(collection(db,"notificationReads"),where("userId","==",state.user.uid)),
      snapshot=>{
        state.notificationReads=snapshot.docs.map(d=>({id:d.id,...d.data()}));
        render();
      },
      error=>console.error("Falha ao carregar leituras de notificações:",error)
    ));

    if(permissionEnabled("access_staff")&&permissionEnabled("notifications_send")){
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
    const supportAdmin=permissionEnabled("access_staff")&&permissionEnabled("support_manage");
    const supportQuery=supportAdmin?collection(db,"supportMessages"):query(collection(db,"supportMessages"),where("ownerUid","==",state.user.uid),where("status","!=","resolved"));
    state.unsubs.push(onSnapshot(supportQuery,s=>{state.supportMessages=s.docs.map(d=>({id:d.id,...d.data()}));renderSupport();},error=>console.error("Falha ao carregar atendimentos:",error)));
    const chatQuery=supportAdmin?collection(db,"chatMessages"):query(collection(db,"chatMessages"),where("ownerUid","==",state.user.uid));
    state.unsubs.push(onSnapshot(chatQuery,s=>{state.chatMessages=s.docs.map(d=>({id:d.id,...d.data()}));renderPrivateChat();},error=>console.error("Falha ao carregar chat privado:",error)));
  }
  state.unsubs.push(onSnapshot(doc(db,"settings","app"),s=>{
    state.settings=s.exists()?s.data():{};
    loadSettingsForm();applyLoginCustomization();loadLoginCustomizationForm();renderGoals();
    applyPermissions();render();
    if(permissionRuntimeSignature()!==subscribedPermissionSignature)schedulePermissionRuntimeRefresh();
  }));
  if(owner())state.unsubs.push(onSnapshot(collection(db,"sessions"),snapshot=>{state.sessions=snapshot.docs.map(item=>({id:item.id,...item.data()}));renderAdvancedCenter()},error=>console.error("Falha ao carregar sessões:",error)));
  if(owner()) state.unsubs.push(onSnapshot(doc(db,"settings","private"),s=>{
    const privateSettings=s.exists()?s.data():{};
    if(privateSettings.notificationsPrivate){state.settings.notifications={...(state.settings.notifications||{}),...privateSettings.notificationsPrivate};loadSettingsForm();}
  },error=>console.warn("Configurações privadas indisponíveis:",error)));
}
async function audit(action,details){if(!state.user||!editor())return;const label=String(action||"");const critical=/dev|cargo|permiss|restaur|rollback|exclu|senha|seguran|login|sessão|backup/i.test(label);if(state.settings?.security?.auditChanges===false&&!critical)return;try{await addDoc(collection(db,"audit"),{userId:state.user.uid,userName:state.profile?.name||state.profile?.email||"Usuário",action:label.slice(0,160),details:String(details||"").slice(0,2000),createdAt:serverTimestamp()})}catch{}}

const PAYMENT_TYPES=Object.freeze(["Pedra Mística","Pedra Obscura","Aço Negro","Payout","Criação de Item","Adiantamento"]);
function paymentDate(value){const date=value?.toDate?.()||new Date(value||0);return Number.isNaN(date.getTime())?"Processando...":date.toLocaleString("pt-BR",{dateStyle:"short",timeStyle:"medium"})}
function normalizedPaymentQuantity(value){
  const numeric=Number(value);
  if(!Number.isSafeInteger(numeric)||numeric<1)return 0;
  return numeric<=99?numeric*1000000:numeric;
}
function parsePaymentQuantity(value){
  const digits=String(value??"").replace(/\D/g,"");
  if(!digits)return 0;
  return normalizedPaymentQuantity(Number(digits));
}
function formatPaymentQuantity(value){
  const quantity=normalizedPaymentQuantity(value);
  return quantity>=1000000&&quantity<=99000000?quantity.toLocaleString("pt-BR"):"—";
}
function renderPayments(){
  const rowsHost=byId("paymentRows");if(!rowsHost)return;
  if(byId("paymentExportWeek")&&!byId("paymentExportWeek").value)byId("paymentExportWeek").value=isoWeek(todayIso());
  if(byId("paymentExportMonth")&&!byId("paymentExportMonth").value)byId("paymentExportMonth").value=todayIso().slice(0,7);
  const options=byId("paymentNicknameOptions");if(options)options.innerHTML=visibleMembers().slice().sort((a,b)=>String(a.name||"").localeCompare(String(b.name||""))).map(member=>`<option value="${escapeHtml(member.name||"")}"></option>`).join("");
  const search=String(byId("paymentSearch")?.value||"").trim().toLowerCase();
  const rows=state.payments.slice().sort((a,b)=>sessionTime(b.createdAt)-sessionTime(a.createdAt)).filter(item=>!search||`${item.nickname||""} ${item.paymentType||""} ${item.quantity||""} ${item.responsibleNick||""} ${item.observation||""}`.toLowerCase().includes(search));
  setText("paymentsCount",`${rows.length} pagamento${rows.length===1?"":"s"}`);
  rowsHost.innerHTML=rows.map(item=>`<tr><td>${escapeHtml(paymentDate(item.createdAt))}</td><td><strong>${escapeHtml(item.nickname||"—")}</strong></td><td>${escapeHtml(item.paymentType||"—")}</td><td>${escapeHtml(formatPaymentQuantity(item.quantity))}</td><td>${escapeHtml(item.responsibleNick||"—")}</td><td class="payment-observation">${escapeHtml(item.observation||"—")}</td><td>${owner()?`<button class="btn danger mini" data-delete-payment="${escapeHtml(item.id)}" type="button">Excluir</button>`:"—"}</td></tr>`).join("")||'<tr><td colspan="7">Nenhum pagamento registrado.</td></tr>';
}
function paymentLocalDate(item){const date=item?.createdAt?.toDate?.()||new Date(item?.createdAt||0);return Number.isNaN(date.getTime())?null:date}
function paymentPdfText(value){
  return asciiPdfText(value);
}
function paymentPdfCell(value,width){
  const text=paymentPdfText(value);
  return (text.length>width?`${text.slice(0,Math.max(0,width-1))}~`:text).padEnd(width," ");
}
function createPaymentPdf(rows,periodLabel){
  const ordered=rows.slice().sort((a,b)=>sessionTime(a.createdAt)-sessionTime(b.createdAt));
  const header=[paymentPdfCell("Data/Hora",16),paymentPdfCell("Nickname",15),paymentPdfCell("Pagamento",16),paymentPdfCell("Quantidade",13),paymentPdfCell("Responsavel",16),paymentPdfCell("Observacao",28)].join(" | ");
  const separator="-".repeat(header.length);
  const records=ordered.map(item=>[
    paymentPdfCell(paymentDate(item.createdAt),16),paymentPdfCell(item.nickname||"-",15),paymentPdfCell(item.paymentType||"-",16),paymentPdfCell(formatPaymentQuantity(item.quantity),13),paymentPdfCell(item.responsibleNick||"-",16),paymentPdfCell(item.observation||"-",28)
  ].join(" | "));
  const chunks=[];for(let index=0;index<records.length;index+=38)chunks.push(records.slice(index,index+38));
  const pages=chunks.map((chunk,pageIndex)=>["77 TEAM MANAGER",`Historico de pagamentos - ${periodLabel}`,`Gerado em ${new Date().toLocaleString("pt-BR")} - ${ordered.length} pagamento(s) - Pagina ${pageIndex+1}/${chunks.length}`,"",header,separator,...chunk]);
  return createTextPdf(pages);
}
function downloadPaymentHistory(rows,label,periodLabel){
  if(!rows.length)return toast("Não existem pagamentos no período selecionado.");
  const blob=createPaymentPdf(rows,periodLabel),url=URL.createObjectURL(blob),link=document.createElement("a");
  link.href=url;link.download=`77-team-pagamentos-${label}.pdf`;document.body.append(link);link.click();link.remove();setTimeout(()=>URL.revokeObjectURL(url),3000);
  toast("PDF de pagamentos gerado com sucesso.");
}
on("downloadPaymentWeek","click",()=>{const week=byId("paymentExportWeek")?.value;if(!week)return toast("Selecione uma semana.");downloadPaymentHistory(state.payments.filter(item=>{const date=paymentLocalDate(item);return date&&isoWeek(localIsoDate(date))===week}),week,`Semana ${week}`)});
on("downloadPaymentMonth","click",()=>{const month=byId("paymentExportMonth")?.value;if(!month)return toast("Selecione um mês.");downloadPaymentHistory(state.payments.filter(item=>{const date=paymentLocalDate(item);return date&&localIsoDate(date).slice(0,7)===month}),month,`Mês ${month}`)});
on("paymentSearch","input",renderPayments);
on("paymentQuantity","input",event=>{
  const digits=String(event.target.value||"").replace(/\D/g,"").slice(0,8);
  if(!digits){event.target.value="";return}
  const raw=Number(digits),quantity=raw<=99?raw*1000000:raw;
  event.target.value=quantity<=99000000?quantity.toLocaleString("pt-BR"):"99.000.000";
});
on("paymentForm","submit",async event=>{
  event.preventDefault();if(!canOpenPage("pagamentos")||!permissionEnabled("payments_manage"))return toast("Seu cargo não possui permissão para registrar pagamentos.");
  const nickname=String(byId("paymentNickname")?.value||"").trim(),paymentType=String(byId("paymentType")?.value||""),quantity=parsePaymentQuantity(byId("paymentQuantity")?.value),observation=String(byId("paymentObservation")?.value||"").trim();
  if(nickname.length<2||nickname.length>120)return toast("Informe um nickname válido.");
  if(!PAYMENT_TYPES.includes(paymentType))return toast("Selecione um tipo de pagamento válido.");
  if(!Number.isSafeInteger(quantity)||quantity<1000000||quantity>99000000)return toast("Informe uma quantidade entre 1 e 99 milhões.");
  if(observation.length>500)return toast("A observação deve ter no máximo 500 caracteres.");
  const button=byId("confirmPayment");if(button)button.disabled=true;
  try{
    const responsibleNick=String(state.profile?.name||state.profile?.displayName||state.user?.email||"Responsável").slice(0,120);
    await addDoc(collection(db,"payments"),{nickname,paymentType,quantity,observation,responsibleUid:state.user.uid,responsibleNick,createdAt:serverTimestamp()});
    await audit("pagamento registrado",`${nickname} · ${paymentType} · quantidade ${quantity}${observation?` · observação: ${observation}`:""}`);event.target.reset();toast("Pagamento confirmado e registrado.");
  }catch(error){
    if(error?.code==="permission-denied"){
      const role=currentAccessRole(), open=pagePermissionEnabled("pagamentos"), area=permissionEnabled("access_staff"), manage=permissionEnabled("payments_manage");
      console.error("Pagamento negado pelo Firestore",{role,page_pagamentos:open,access_staff:area,payments_manage:manage,profile:state.profile});
      toast(`Pagamento negado pelo Firebase · cargo=${accessRoleLabel(role)} · abrir aba=${open?"SIM":"NÃO"} · acesso STAFF=${area?"SIM":"NÃO"} · registrar=${manage?"SIM":"NÃO"} · regra esperada=paymentsMatrixPermission direta.`);
    }else toast(errMsg(error));
  }finally{if(button)button.disabled=false}
});
document.addEventListener("click",async event=>{
  const button=event.target.closest("[data-delete-payment]");if(!button||!owner())return;
  const item=state.payments.find(row=>row.id===button.dataset.deletePayment);if(!item)return;
  if(!confirm(`Excluir o pagamento de ${item.nickname}?`))return;
  button.disabled=true;
  try{await deleteDoc(doc(db,"payments",item.id));await audit("pagamento excluído",`${item.nickname} · ${item.paymentType} · quantidade ${item.quantity||"não informada"}`);toast("Registro de pagamento excluído.")}catch(error){button.disabled=false;toast(errMsg(error))}
});
on("clearPaymentHistory","click",async()=>{
  if(!owner()||!state.payments.length)return;
  if(!confirm(`Apagar definitivamente todo o histórico com ${state.payments.length} pagamento(s)?`))return;
  const button=byId("clearPaymentHistory");if(button)button.disabled=true;
  try{
    const rows=state.payments.slice();for(let index=0;index<rows.length;index+=400){const batch=writeBatch(db);rows.slice(index,index+400).forEach(item=>batch.delete(doc(db,"payments",item.id)));await batch.commit()}
    await audit("histórico de pagamentos apagado",`${rows.length} registro(s) removido(s)`);toast("Todo o histórico de pagamentos foi apagado.");
  }catch(error){toast(errMsg(error))}finally{if(button)button.disabled=false}
});

let sessionHeartbeatTimer=null;
let sessionHeartbeatCreated=false;
let lastUserActivity=Date.now();
function browserSessionId(){
  let id=sessionStorage.getItem("77team-session-id");
  if(!id){id=(crypto.randomUUID?.()||`${Date.now()}-${Math.random()}`).replace(/[^A-Za-z0-9-]/g,"");sessionStorage.setItem("77team-session-id",id)}
  return id.slice(0,80);
}
async function writeSessionHeartbeat(online=true){
  if(!state.user||!state.profile)return;
  const sessionId=browserSessionId(),ref=doc(db,"sessions",`${state.user.uid}_${sessionId}`);
  const payload={userId:state.user.uid,userName:String(state.profile.name||state.profile.email||"Usuário").slice(0,120),email:String(state.user.email||"").slice(0,254),accessRole:currentAccessRole(),sessionId,online,device:String(navigator.userAgent||"Navegador").slice(0,300),lastSeen:serverTimestamp(),updatedAt:serverTimestamp()};
  if(!sessionHeartbeatCreated)payload.createdAt=serverTimestamp();
  try{await setDoc(ref,payload,{merge:true});sessionHeartbeatCreated=true}catch(error){console.warn("Sessão não registrada:",error)}
}
function startSessionHeartbeat(){
  clearInterval(sessionHeartbeatTimer);writeSessionHeartbeat(true);
  sessionHeartbeatTimer=setInterval(async()=>{const limit=Math.max(15,Math.min(1440,Number(state.settings?.security?.sessionMinutes||480)))*60000;if(Date.now()-lastUserActivity>limit){toast("Sessão encerrada por inatividade.");await writeSessionHeartbeat(false);clearSubs();await signOut(auth);return}writeSessionHeartbeat(document.visibilityState!=="hidden")},45000);
}
['pointerdown','keydown','touchstart','scroll'].forEach(name=>window.addEventListener(name,()=>{lastUserActivity=Date.now()},{passive:true}));
document.addEventListener("visibilitychange",()=>{if(state.user)writeSessionHeartbeat(document.visibilityState!=="hidden")});

function memberIdentityIds(member){return new Set([member?.id,member?.userId].filter(Boolean).map(String))}
function attendanceMatchesMember(item,member){
  if(!item||!member)return false;
  const ids=memberIdentityIds(member),recordIds=[item.memberId,item.userId].filter(Boolean).map(String);
  if(recordIds.length)return recordIds.some(id=>ids.has(id));
  // Compatibilidade exclusiva com históricos antigos que ainda não possuem UID.
  const legacyName=String(item.memberName||"").toLowerCase(),memberName=String(member.name||"").toLowerCase();
  if(!legacyName||legacyName!==memberName)return false;
  return visibleMembers().filter(candidate=>String(candidate.name||"").toLowerCase()===legacyName).length===1;
}
function memberForAttendance(item){return visibleMembers().find(member=>attendanceMatchesMember(item,member))||null}
function attendanceTime(item){
  const timestamp=item?.updatedAt||item?.createdAt;
  if(timestamp?.toMillis)return timestamp.toMillis();
  if(timestamp?.toDate)return timestamp.toDate().getTime();
  const parsed=Date.parse(timestamp||`${item?.date||"1970-01-01"}T00:00:00`);
  return Number.isNaN(parsed)?0:parsed;
}
function monthlyEventKeys(month){
  const scheduled=state.events.filter(item=>String(item.date||"").startsWith(month));
  const keys=new Set(scheduled.map(item=>`calendar:${item.id||item.date+"|"+item.title}`));
  state.attendance.filter(item=>item.kind==="eventos"&&String(item.date||"").startsWith(month)&&memberForAttendance(item))
    .forEach(item=>{
      const attendanceKind=normalizedEventKind(item.slot||item.kind);
      const alreadyScheduled=scheduled.some(event=>event.date===item.date&&[event.title,event.type].some(value=>normalizedEventKind(value)===attendanceKind));
      if(!alreadyScheduled)keys.add(`attendance:${item.date}|${attendanceKind}`);
    });
  return keys;
}
function stats(member){
  const resolved=typeof member==="string"?visibleMembers().find(item=>item.name===member):member;
  const rows=resolved?state.attendance.filter(item=>attendanceMatchesMember(item,resolved)):[];
  const p=rows.filter(x=>x.status===1||x.status===2).length,a=rows.filter(x=>x.status===-1).length,j=rows.filter(x=>x.status===3).length,t=p+a;
  return{present:p,absent:a,justified:j,rate:t?Math.round(p/t*100):0};
}
function todayIso(){return localIsoDate()}
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
      ${permissionEnabled("presence_register")?`<button class="btn primary" data-open-presence-modal="${kind}">➕ Registrar Presença</button>`:""}
    </div>
    <div class="presence-v207-filters"><input type="search" placeholder="Buscar nos últimos registros..." data-recent-presence-search="${kind}"><input type="date" data-recent-presence-date="${kind}"></div>
    <div class="table-wrap presence-v207-table"><table><thead><tr><th>Data</th><th>Usuário</th><th>Clã</th><th>Horário/Evento</th><th>Status</th><th>Observação</th><th>Responsável</th>${permissionEnabled("presence_delete")?"<th>Ações</th>":""}</tr></thead><tbody data-recent-presence-body="${kind}">${renderRecentPresenceBody(rows)}</tbody></table></div>
  </div>`;
}
function recentAllPresenceRows(){return [...state.attendance].filter(item=>[-1,1,3].includes(Number(item.status))).sort((a,b)=>rtDateValue(b.updatedAt)-rtDateValue(a.updatedAt)).slice(0,50)}
function renderUnifiedPresence(){
  const target=$("#presencasContent");if(!target)return;
  const rows=recentAllPresenceRows();
  target.innerHTML=`<div class="presence-v207 presence-unified">
    <div class="presence-v207-toolbar">
      <div><h3>Registro de Presenças</h3><p>Registre WorldBoss, Purgatório e Eventos somente nesta aba. Cada salvamento atualiza o Histórico e o RT Presença automaticamente.</p></div>
      ${permissionEnabled("presence_register")?`<div class="presence-action-group"><button class="btn primary" data-open-presence-modal="worldboss">➕ Registrar Presença</button><button class="btn" data-backup-presence>💾 Backup Presença</button>${permissionEnabled("presence_reset")?`<button class="btn danger" data-reset-presence>🔄 Resetar Presença</button>`:""}</div>`:""}
    </div>
    <div class="presence-v207-filters">
      <input type="search" placeholder="Buscar usuário, clã, evento ou status..." data-unified-presence-search>
      <input type="date" data-unified-presence-date>
      <select data-unified-presence-kind><option value="">Todos os eventos</option><option value="worldboss">WorldBoss</option><option value="purgatorio">Purgatório</option><option value="eventos">Eventos</option></select>
    </div>
    <div class="table-wrap presence-v207-table"><table><thead><tr><th>Data</th><th>Usuário</th><th>Clã</th><th>Evento</th><th>Horário/Atividade</th><th>Status</th><th>Observação</th><th>Responsável</th>${permissionEnabled("presence_delete")?"<th>Ações</th>":""}</tr></thead><tbody data-unified-presence-body>${renderUnifiedPresenceBody(rows)}</tbody></table></div>
    <section class="presence-backup-panel"><div class="presence-backup-head"><div><h3>📚 Histórico de backups</h3><p>Os fechamentos ficam guardados por semana e podem ser consultados sem alterar o Histórico existente.</p></div><span class="badge" id="presenceBackupCount">${state.presenceBackups.length} backups</span></div><div class="presence-backup-list" id="presenceBackupList"></div></section>
  </div>`;
  renderPresenceBackups();
}

function presenceBackupDate(value){
  const ms=rtDateValue(value);if(!ms)return "—";
  return new Date(ms).toLocaleString("pt-BR");
}
function presenceBackupCounts(records=[]){return{present:records.filter(x=>Number(x.status)===1).length,justified:records.filter(x=>Number(x.status)===3).length,absent:records.filter(x=>Number(x.status)===-1).length}}
function renderPresenceBackups(){
  const list=$("#presenceBackupList");if(!list)return;
  setText("presenceBackupCount",`${state.presenceBackups.length} backup${state.presenceBackups.length===1?"":"s"}`);
  list.innerHTML=state.presenceBackups.map(item=>{const counts=item.counts||presenceBackupCounts(item.records||[]);return `<article class="presence-backup-card"><div><strong>📅 ${escapeHtml(item.week||"Semana não informada")}</strong><span>${escapeHtml(presenceBackupDate(item.createdAt))}</span></div><div class="presence-backup-metrics"><span>🟢 ${Number(counts.present||0)}</span><span>🟡 ${Number(counts.justified||0)}</span><span>🔴 ${Number(counts.absent||0)}</span><span>📋 ${Number(item.total||item.records?.length||0)}</span><span>🧾 ${Number(item.rtTotal||item.rtRecords?.length||0)} RTs</span></div><div><small>Responsável</small><b>${escapeHtml(item.createdByName||"—")}</b></div><button class="btn mini" data-download-presence-backup="${escapeHtml(item.id)}">Baixar JSON</button></article>`}).join("")||`<div class="empty-state">Nenhum backup de presença foi criado.</div>`;
}
async function writeBackupSubcollection(backupId,name,rows){
  for(let start=0;start<rows.length;start+=400){
    const batch=writeBatch(db);
    rows.slice(start,start+400).forEach((record,index)=>{
      const originalId=record.originalId||record.id||`${name}-${start+index}`;
      const {id,...data}=record;
      batch.set(doc(db,"presenceBackups",backupId,name,String(originalId)),{...data,originalId:String(originalId)});
    });
    await batch.commit();
  }
}
async function loadPresenceBackupData(item){
  if(!item)return {records:[],rtRecords:[]};
  if(Array.isArray(item.records)||Array.isArray(item.rtRecords))return {records:item.records||[],rtRecords:item.rtRecords||[]};
  const [attendanceSnap,rtSnap]=await Promise.all([
    getDocs(collection(db,"presenceBackups",item.id,"attendance")),
    getDocs(collection(db,"presenceBackups",item.id,"rt"))
  ]);
  return {records:attendanceSnap.docs.map(d=>({id:d.id,...d.data()})),rtRecords:rtSnap.docs.map(d=>({id:d.id,...d.data()}))};
}
async function createPresenceBackup({automatic=false}={}){
  if(!permissionEnabled("presence_register"))return toast("Sem permissão para criar backup.");
  const records=state.attendance.filter(item=>[-1,1,3].includes(Number(item.status))).map(item=>({...item,originalId:item.id}));
  const rtRecords=state.rtPresence.map(item=>({...item,originalId:item.id}));
  if(!records.length&&!rtRecords.length){toast("Não existem dados de presença para salvar.");return null}
  const now=new Date(),week=isoWeek(todayIso()),counts=presenceBackupCounts(records),id=`${week}__${now.toISOString().replace(/[^0-9]/g,"").slice(0,14)}`;
  const payload={week,counts,total:records.length,rtTotal:rtRecords.length,automatic,backupSchema:2,status:"writing",createdBy:state.user.uid,createdByName:state.profile?.name||state.user.email,createdAt:serverTimestamp(),createdAtText:now.toISOString(),sourceVersion:"22.9.32"};
  const backupRef=doc(db,"presenceBackups",id);
  await setDoc(backupRef,payload);
  try{
    await writeBackupSubcollection(id,"attendance",records);
    await writeBackupSubcollection(id,"rt",rtRecords);
    await updateDoc(backupRef,{status:"completed",completedAt:serverTimestamp(),updatedAt:serverTimestamp()});
  }catch(error){
    try{await updateDoc(backupRef,{status:"failed",errorMessage:String(error?.message||error).slice(0,500),updatedAt:serverTimestamp()})}catch{}
    throw error;
  }
  await audit(automatic?"backup automático da presença":"backup da presença",`${week} · ${records.length} presenças · ${rtRecords.length} RTs · schema 2`);
  toast(`Backup salvo: ${records.length} presenças e ${rtRecords.length} RTs.`);return{id,...payload,status:"completed",records,rtRecords,createdAt:now};
}
function clearPresenceClientCache(){
  state.presenceFilters={};
  try{
    [localStorage,sessionStorage].forEach(storage=>{
      for(let i=storage.length-1;i>=0;i--){
        const key=storage.key(i)||"";
        if(/presence|presenca|attendance|rtpresence|registro-presenca/i.test(key))storage.removeItem(key);
      }
    });
  }catch(error){console.warn("Não foi possível limpar todo o cache local da presença.",error)}
}
async function deleteDocsInChunks(collectionName,rows){
  for(let start=0;start<rows.length;start+=400){
    const batch=writeBatch(db);
    rows.slice(start,start+400).forEach(item=>batch.delete(doc(db,...collectionName.split("/"),item.originalId||item.id)));
    await batch.commit();
  }
}
async function resetPresenceWithBackup(){
  if(!permissionEnabled("presence_reset"))return toast("Sem permissão para resetar a presença.");
  const attendanceRows=state.attendance.filter(item=>[-1,1,3].includes(Number(item.status)));
  const rtRows=[...state.rtPresence];
  if(!attendanceRows.length&&!rtRows.length)return toast("Não existem dados de presença para resetar.");
  const confirmation=prompt(`ATENÇÃO: o reset encerrará a semana atual e limpará Presenças, RT Presença, Consultar Registros, indicadores, ranking e estatísticas derivados desses dados.\n\nSerá criado um backup automático com ${attendanceRows.length} presenças e ${rtRows.length} RTs.\n\nDigite RESET para confirmar:`);
  if(String(confirmation||"").trim().toUpperCase()!=="RESET")return toast("Reset cancelado.");
  const jobId=`reset__${Date.now()}__${state.user.uid.slice(0,8)}`;
  let backup=null;
  try{
    await setDoc(doc(db,"resetJobs",jobId),{status:"preparing",week:isoWeek(todayIso()),createdBy:state.user.uid,createdByName:state.profile?.name||state.user.email,attendanceTotal:attendanceRows.length,rtTotal:rtRows.length,createdAt:serverTimestamp(),updatedAt:serverTimestamp()});
    backup=await createPresenceBackup({automatic:true});if(!backup)return;
    await updateDoc(doc(db,"resetJobs",jobId),{status:"backup_created",backupId:backup.id,updatedAt:serverTimestamp()});
    await updateDoc(doc(db,"resetJobs",jobId),{status:"deleting_attendance",updatedAt:serverTimestamp()});
    await deleteDocsInChunks("attendance",attendanceRows);
    await updateDoc(doc(db,"resetJobs",jobId),{status:"deleting_rt",updatedAt:serverTimestamp()});
    await deleteDocsInChunks("rtPresence",rtRows);
    clearPresenceClientCache();
    await updateDoc(doc(db,"resetJobs",jobId),{status:"completed",completedAt:serverTimestamp(),updatedAt:serverTimestamp()});
    await audit("reset global de presença",`${backup.week} · ${attendanceRows.length} presenças · ${rtRows.length} RTs removidos · backup ${backup.id} · job ${jobId}`);
    toast("Reset global concluído. Todas as abas de presença foram reiniciadas.");
  }catch(error){
    console.error(error);
    try{
      if(backup){
        await updateDoc(doc(db,"resetJobs",jobId),{status:"rolling_back",updatedAt:serverTimestamp()});
        await restorePresenceRows(backup.records,backup.rtRecords);
        await updateDoc(doc(db,"resetJobs",jobId),{status:"rolled_back",rolledBackAt:serverTimestamp(),errorCode:error?.code||"error",errorMessage:String(error?.message||error).slice(0,500),updatedAt:serverTimestamp()});
        return toast("Reset interrompido e revertido automaticamente. Nenhum registro foi perdido.");
      }
      await setDoc(doc(db,"resetJobs",jobId),{status:"failed",errorCode:error?.code||"error",errorMessage:String(error?.message||error).slice(0,500),updatedAt:serverTimestamp()},{merge:true});
    }catch(rollbackError){
      try{await setDoc(doc(db,"resetJobs",jobId),{status:"rollback_failed",errorCode:error?.code||"error",errorMessage:String(error?.message||error).slice(0,500),rollbackError:String(rollbackError?.message||rollbackError).slice(0,500),updatedAt:serverTimestamp()},{merge:true})}catch{}
    }
    toast("Reset interrompido. O backup e o registro de recuperação foram preservados.");
  }
}
async function downloadPresenceBackup(id){const item=state.presenceBackups.find(row=>row.id===id);if(!item)return toast("Backup não encontrado.");const data=await loadPresenceBackupData(item);downloadJson(`presenca-${item.week||id}.json`,{version:"22.9.32",exportedAt:new Date().toISOString(),backup:{...item,...data}});}


function backupCenterDateValue(item){return rtDateValue(item?.createdAt)||Date.parse(item?.createdAtText||0)||0}
function backupCenterFiltered(){
  const term=(byId("backupCenterSearch")?.value||"").trim().toLowerCase();
  const type=byId("backupCenterType")?.value||"all";
  return [...state.presenceBackups].filter(item=>!item.status||item.status==="completed").sort((a,b)=>backupCenterDateValue(b)-backupCenterDateValue(a)).filter(item=>{
    if(type!=="all"&&type!=="presence")return false;
    if(!term)return true;
    return [item.week,item.createdByName,item.createdAtText,"presença",item.automatic?"automático":"manual"].some(value=>String(value||"").toLowerCase().includes(term));
  });
}
function renderBackupCenter(){
  const list=byId("backupCenterList");if(!list)return;
  const rows=backupCenterFiltered(),latest=rows[0]||state.presenceBackups[0];
  setText("backupCenterTotal",String(state.presenceBackups.length));
  setText("backupCenterLatest",latest?presenceBackupDate(latest.createdAt||latest.createdAtText):"Nunca");
  setText("backupCenterResponsible",latest?.createdByName||"—");
  list.innerHTML=rows.map(item=>{const counts=item.counts||presenceBackupCounts(item.records||[]);return `<article class="backup-center-card"><div class="backup-center-main"><span class="backup-kind">💾 Backup de Presença</span><strong>${escapeHtml(item.week||"Semana não informada")}</strong><small>${escapeHtml(presenceBackupDate(item.createdAt||item.createdAtText))} · ${item.automatic?"Automático":"Manual"}</small></div><div class="backup-center-stats"><span>🟢 ${Number(counts.present||0)}</span><span>🟡 ${Number(counts.justified||0)}</span><span>🔴 ${Number(counts.absent||0)}</span><span>📋 ${Number(item.total||item.records?.length||0)}</span><span>🧾 ${Number(item.rtTotal||item.rtRecords?.length||0)} RTs</span></div><div class="backup-center-owner"><small>Responsável</small><b>${escapeHtml(item.createdByName||"—")}</b></div><div class="backup-center-actions"><button class="btn mini" data-view-center-backup="${escapeHtml(item.id)}">👁 Visualizar</button><button class="btn mini" data-download-presence-backup="${escapeHtml(item.id)}">JSON</button><button class="btn mini" data-export-center-excel="${escapeHtml(item.id)}">Excel</button>${owner()?`<button class="btn mini" data-restore-center-backup="${escapeHtml(item.id)}">♻ Restaurar</button><button class="btn danger mini" data-delete-center-backup="${escapeHtml(item.id)}">🗑 Excluir</button>`:""}</div></article>`}).join("")||`<div class="empty-state">Nenhum backup encontrado.</div>`;
}
async function viewCenterBackup(id){
  const item=state.presenceBackups.find(row=>row.id===id);if(!item)return toast("Backup não encontrado.");
  const data=await loadPresenceBackupData(item);
  const counts=item.counts||presenceBackupCounts(data.records);
  alert(`Backup de Presença\n\nSemana: ${item.week||"—"}\nData: ${presenceBackupDate(item.createdAt||item.createdAtText)}\nResponsável: ${item.createdByName||"—"}\nTotal: ${item.total||item.records?.length||0}\nPresentes: ${counts.present||0}\nJustificados: ${counts.justified||0}\nAusentes: ${counts.absent||0}`);
}
async function exportCenterBackupExcel(id){
  const item=state.presenceBackups.find(row=>row.id===id);if(!item)return toast("Backup não encontrado.");
  const data=await loadPresenceBackupData(item);
  const headers=["Data","Membro","Clã","Tipo","Horário/Atividade","Status","Observação","Responsável"];
  const rows=data.records.map(r=>[r.date||"",r.memberName||"",r.clan||"",presenceTypeLabel(r.kind),r.slot||"",presenceStatus(r.status).label,r.note||"",r.updatedByName||item.createdByName||""]);
  const html=`<html><head><meta charset="utf-8"></head><body><h2>Backup ${escapeHtml(item.week||"")}</h2><table border="1"><tr>${headers.map(h=>`<th>${escapeHtml(h)}</th>`).join("")}</tr>${rows.map(row=>`<tr>${row.map(v=>`<td>${escapeHtml(v)}</td>`).join("")}</tr>`).join("")}</table></body></html>`;
  const blob=new Blob(["\ufeff"+html],{type:"application/vnd.ms-excel"}),a=document.createElement("a");a.href=URL.createObjectURL(blob);a.download=`backup-presenca-${item.week||id}.xls`;a.click();URL.revokeObjectURL(a.href);audit("download de backup",`${item.week||id} · Excel`);
}
async function restoreCenterBackup(id){
  if(!owner())return toast("Somente o DEV pode restaurar backups.");
  const item=state.presenceBackups.find(row=>row.id===id);if(!item)return toast("Backup não encontrado.");
  const data=await loadPresenceBackupData(item);
  const records=data.records,rtRecords=data.rtRecords;
  if(!confirm(`Restaurar o backup ${item.week||id}? Serão restauradas ${records.length} presenças e ${rtRecords.length} RTs usando os IDs originais, evitando duplicações.`))return;
  try{
    await controlledPresenceRestore(id,records,rtRecords);
    await audit("backup restaurado",`${item.week||id} · ${records.length} presenças · ${rtRecords.length} RTs`);toast(`Backup restaurado: ${records.length} presenças e ${rtRecords.length} RTs.`);
  }catch(error){console.error(error);toast(errMsg(error))}
}

async function restorePresenceRows(records=[],rtRecords=[]){
  for(const [name,rows] of [["attendance",records],["rtPresence",rtRecords]])for(let start=0;start<rows.length;start+=400){
    const batch=writeBatch(db);rows.slice(start,start+400).forEach(record=>{const {id:legacyId,originalId,...data}=record;const targetId=originalId||legacyId;delete data.restoredFromBackup;delete data.restoredAt;delete data.restoredBy;delete data.restoredByName;if(targetId)batch.set(doc(db,name,String(targetId)),data)});await batch.commit();
  }
}

async function controlledPresenceRestore(backupId,records=[],rtRecords=[]){
  const jobId=`restore_presence__${Date.now()}__${state.user.uid.slice(0,8)}`,jobRef=doc(db,"restoreJobs",jobId);let sequence=0;
  await setDoc(jobRef,{status:"validated",restoreType:"presence",backupId,createdBy:state.user.uid,createdAt:serverTimestamp(),updatedAt:serverTimestamp()});
  try{
    for(const [name,rows] of [["attendance",records],["rtPresence",rtRecords]])for(let start=0;start<rows.length;start+=180){
      const group=rows.slice(start,start+180),refs=group.map(record=>doc(db,name,String(record.originalId||record.id))),snapshots=await Promise.all(refs.map(ref=>getDoc(ref))),batch=writeBatch(db);
      snapshots.forEach((snapshot,index)=>{batch.set(doc(db,"restoreJobs",jobId,"rollback",String(sequence).padStart(9,"0")),{sequence,path:refs[index].path.split("/"),existed:snapshot.exists(),data:snapshot.exists()?snapshot.data():null,capturedAt:serverTimestamp()});const {id,originalId,...data}=group[index];batch.set(refs[index],{...data,restoredFromBackup:backupId,restoredAt:serverTimestamp(),restoredBy:state.user.uid,restoredByName:state.profile?.name||state.user.email});sequence++});
      await batch.commit();await updateDoc(jobRef,{status:"restoring",currentCollection:name,processed:Math.min(start+group.length,rows.length),updatedAt:serverTimestamp()});
    }
    await updateDoc(jobRef,{status:"completed",completedAt:serverTimestamp(),updatedAt:serverTimestamp()});cleanupPersistentRollback(jobId).catch(()=>{});return jobId;
  }catch(error){await executePersistentRollback(jobRef,error);throw error}
}
async function deleteCenterBackup(id){
  if(!owner())return toast("Somente DEV pode excluir backups.");
  const item=state.presenceBackups.find(row=>row.id===id);if(!item)return toast("Backup não encontrado.");
  if(!confirm(`Excluir permanentemente o backup ${item.week||id}?`))return;
  try{const data=await loadPresenceBackupData(item);await deleteDocsInChunks(`presenceBackups/${id}/attendance`,data.records);await deleteDocsInChunks(`presenceBackups/${id}/rt`,data.rtRecords);await deleteDoc(doc(db,"presenceBackups",id));await audit("backup excluído",`${item.week||id} · ${item.total||item.records?.length||0} registros`);toast("Backup excluído.")}catch(error){console.error(error);toast(errMsg(error))}
}
on("backupCenterSearch","input",renderBackupCenter);
on("backupCenterType","change",renderBackupCenter);

function renderUnifiedPresenceBody(rows){return rows.map(item=>{const st=presenceStatus(item.status);return `<tr><td>${escapeHtml(item.date||"—")}</td><td>${escapeHtml(item.memberName||"—")}</td><td>${escapeHtml(item.clan||"—")}</td><td>${escapeHtml(presenceTypeLabel(item.kind))}</td><td>${escapeHtml(item.slot||"—")}</td><td><span class="presence-status-chip ${st.cls}">${st.icon} ${st.label}</span></td><td>${escapeHtml(item.note||"—")}</td><td>${escapeHtml(item.updatedByName||"—")}</td>${permissionEnabled("presence_delete")?`<td><button class="btn danger mini" data-delete-attendance="${escapeHtml(item.id)}">Excluir</button></td>`:""}</tr>`}).join("")||`<tr><td colspan="9">Nenhum registro encontrado.</td></tr>`}
function filterUnifiedPresence(){const q=String(document.querySelector("[data-unified-presence-search]")?.value||"").toLowerCase(),date=document.querySelector("[data-unified-presence-date]")?.value||"",kind=document.querySelector("[data-unified-presence-kind]")?.value||"";const rows=recentAllPresenceRows().filter(item=>(!date||item.date===date)&&(!kind||item.kind===kind)&&(!q||`${item.memberName} ${item.clan} ${presenceTypeLabel(item.kind)} ${item.slot} ${presenceStatus(item.status).label}`.toLowerCase().includes(q)));const body=document.querySelector("[data-unified-presence-body]");if(body)body.innerHTML=renderUnifiedPresenceBody(rows)}
function renderRecentPresenceBody(rows){return rows.map(item=>{const st=presenceStatus(item.status);return `<tr><td>${escapeHtml(item.date||"—")}</td><td>${escapeHtml(item.memberName||"—")}</td><td>${escapeHtml(item.clan||"—")}</td><td>${escapeHtml(item.slot||"—")}</td><td><span class="presence-status-chip ${st.cls}">${st.icon} ${st.label}</span></td><td>${escapeHtml(item.note||"—")}</td><td>${escapeHtml(item.updatedByName||"—")}</td>${permissionEnabled("presence_delete")?`<td><button class="btn danger mini" data-delete-attendance="${escapeHtml(item.id)}">Excluir</button></td>`:""}</tr>`}).join("")||`<tr><td colspan="8">Nenhum registro encontrado.</td></tr>`}
function filterRecentPresence(kind){const q=String(document.querySelector(`[data-recent-presence-search="${kind}"]`)?.value||"").toLowerCase(),date=document.querySelector(`[data-recent-presence-date="${kind}"]`)?.value||"";const rows=recentPresenceRows(kind).filter(item=>(!date||item.date===date)&&(!q||`${item.memberName} ${item.clan} ${item.slot} ${presenceStatus(item.status).label}`.toLowerCase().includes(q)));const body=document.querySelector(`[data-recent-presence-body="${kind}"]`);if(body)body.innerHTML=renderRecentPresenceBody(rows)}
function populatePresenceMemberList(){const list=$("#presenceMemberOptions");if(list)list.innerHTML=state.members.map(m=>`<option value="${escapeHtml(m.name||"")}">${escapeHtml(m.clan||"")}</option>`).join("")}
function updatePresenceSlotOptions(kind,selected=""){const select=$("#presenceModalSlot");if(!select)return;select.innerHTML=configuredPresenceSlots(kind).map(slot=>`<option value="${escapeHtml(slot)}" ${slot===selected?"selected":""}>${escapeHtml(slot)}${kind==="eventos"?` · ${eventDay(slot)}`:""}</option>`).join("")}
function openPresenceModal(kind="worldboss",record=null){if(!configuredEventEnabled(kind))return toast("Este tipo de evento foi desativado nas Configurações.");if(!(record?permissionEnabled("presence_edit"):permissionEnabled("presence_register")))return toast("Sem permissão para registrar ou editar presença.");populatePresenceMemberList();setValue("presenceModalUser",record?.memberName||"");setValue("presenceModalKind",kind);updatePresenceSlotOptions(kind,record?.slot||"");setValue("presenceModalDate",record?.date||todayIso());setValue("presenceModalNote",record?.note||"");document.querySelectorAll('[data-presence-status-choice]').forEach(btn=>btn.classList.toggle('active',Number(btn.dataset.presenceStatusChoice)===Number(record?.status||1)));$("#presenceModal").dataset.editingId=record?.id||"";$("#presenceModal").classList.remove("hidden")}
function closePresenceModal(){$("#presenceModal")?.classList.add("hidden")}
function selectedPresenceStatus(){return Number(document.querySelector('[data-presence-status-choice].active')?.dataset.presenceStatusChoice||1)}
async function savePresenceFromModal(){
  if(!permissionEnabled("presence_register")&&!permissionEnabled("presence_edit"))return toast("Sem permissão.");
  const name=$("#presenceModalUser")?.value.trim(),member=state.members.find(m=>String(m.name||"").toLowerCase()===String(name||"").toLowerCase());
  if(!member)return toast("Selecione um usuário válido da lista.");
  const kind=$("#presenceModalKind").value,slot=$("#presenceModalSlot").value,date=$("#presenceModalDate").value,status=selectedPresenceStatus(),note=$("#presenceModalNote").value.trim();
  if(!configuredEventEnabled(kind))return toast("Este tipo de evento foi desativado nas Configurações.");
  if(!kind||!slot||!date||![-1,1,3].includes(status))return toast("Preencha todos os campos obrigatórios.");
  if(status===3&&!note)return toast("Informe o motivo da justificativa.");
  if(status===-1&&state.settings?.attendance?.requireAbsenceReason===true&&!note)return toast("As Configurações exigem uma observação para registrar ausência.");
  const id=(kind+"__"+date+"__"+member.id+"__"+slot).replace(/[^a-zA-Z0-9_-]/g,"_");
  const existing=state.attendance.find(item=>item.id===id||item.memberId===member.id&&item.kind===kind&&item.slot===slot&&item.date===date);
  if(existing&&!permissionEnabled("presence_edit"))return toast("Sem permissão para editar uma presença existente.");
  if(!existing&&!permissionEnabled("presence_register"))return toast("Sem permissão para registrar presença.");
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

function memberLevel(member){return progressionFor(member).level}
function memberMedals(member){
  const s=stats(member);
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
  const s=stats(member),xp=progressionFor(member),level=xp.level,medals=memberMedals(member);
  $("#memberDrawerContent").innerHTML=`<div class="profile-hero">
    <div class="profile-big-avatar">${escapeHtml((member.name||"?").slice(0,1).toUpperCase())}</div>
    <h2>${escapeHtml(member.name)}</h2>${memberDisplayRoleBadge(member)}<p>${escapeHtml(member.clan||"Sem clã")}</p>
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
  const rows=state.notifications.slice().sort((a,b)=>{const av=a.createdAt?.toMillis?.()||Date.parse(a.createdAt||0)||0;const bv=b.createdAt?.toMillis?.()||Date.parse(b.createdAt||0)||0;return bv-av});
  setHtml("notificationRows",rows.map(n=>{
    const read=notificationRead(n);
    return `<article class="notification-item ${read?"":"unread"}" data-notification-id="${escapeHtml(n.id)}">
      <div><strong>${escapeHtml(n.title||"Notificação")}</strong><p>${escapeHtml(n.message||"")}</p><small>${escapeHtml(n.createdByName||"77 TEAM")} · ${escapeHtml(notificationDate(n))}</small></div>
      ${read?'<span class="notification-read-label">Lida</span>':`<button class="btn mini" data-mark-notification="${escapeHtml(n.id)}" type="button">Marcar como lida</button>`}
    </article>`;
  }).join("")||"<p class='empty-state'>Nenhuma notificação.</p>");
  renderNotificationAdmin();
}
function localIsoDate(date=new Date()){
  const year=date.getFullYear(),month=String(date.getMonth()+1).padStart(2,"0"),day=String(date.getDate()).padStart(2,"0");
  return `${year}-${month}-${day}`;
}
function attendanceStatusLabel(status){return ({"1":"Presente","2":"Atrasado","3":"Justificado","-1":"Ausente","0":"Pendente"})[String(status)]||"Pendente"}
function attendanceStatusClass(status){return status===1||status===2?"success":status===3?"warning":status===-1?"danger":"pending"}
function attendanceStatusIcon(status){return status===1?"✓":status===2?"◷":status===3?"!":status===-1?"×":"—"}
function normalizedEventKind(value){return String(value||"evento").normalize("NFD").replace(/[\u0300-\u036f]/g,"").toLowerCase().replace(/\s+/g,"")}
let calendarCursor=new Date(new Date().getFullYear(),new Date().getMonth(),1);
let editingCalendarEventId="";
function renderCalendar(){
  const today=new Date(),year=calendarCursor.getFullYear(),month=calendarCursor.getMonth();
  const first=new Date(year,month,1),days=new Date(year,month+1,0).getDate();
  const cells=[];
  setText("calendarMonthLabel",new Intl.DateTimeFormat("pt-BR",{month:"long",year:"numeric"}).format(first));
  for(let i=0;i<first.getDay();i++)cells.push('<div class="calendar-day empty"></div>');
  for(let d=1;d<=days;d++){
    const iso=`${year}-${String(month+1).padStart(2,"0")}-${String(d).padStart(2,"0")}`;
    const evs=state.events.filter(e=>e.date===iso);
    cells.push(`<div class="calendar-day ${iso===localIsoDate(today)?"today":""}">
      <strong>${d}</strong>${evs.map(e=>`<button class="calendar-event" data-calendar-event="${escapeHtml(e.id)}" type="button" title="${escapeHtml(e.description||e.title||"")}">${e.time?`<b>${escapeHtml(e.time)}</b> `:""}${escapeHtml(e.title)}</button>`).join("")}
    </div>`);
  }
  $("#calendarGrid").innerHTML=`<div class="calendar-week">DOM</div><div class="calendar-week">SEG</div><div class="calendar-week">TER</div><div class="calendar-week">QUA</div><div class="calendar-week">QUI</div><div class="calendar-week">SEX</div><div class="calendar-week">SÁB</div>${cells.join("")}`;
}
function renderStatistics(){
  const attendance=homeAttendanceRecords();
  const present=attendance.filter(a=>a.status===1||a.status===2).length;
  const absent=attendance.filter(a=>a.status===-1).length;
  const total=present+absent;
  setText("statsPresenceTotal",present);
  setText("statsAbsenceTotal",absent);
  setText("statsGeneralRate",(total?Math.round(present/total*100):0)+"%");
  setText("statsActiveMembers",visibleMembers().length);
  const kinds=["worldboss","purgatorio","eventos"];
  $("#typeStats").innerHTML=kinds.map(k=>{
    const rows=attendance.filter(a=>a.kind===k),p=rows.filter(a=>a.status===1||a.status===2).length,t=rows.filter(a=>a.status===1||a.status===2||a.status===-1).length,r=t?Math.round(p/t*100):0;
    return `<div class="chart-row"><span>${escapeHtml(presenceTypeLabel(k))}</span><div><i style="width:${r}%"></i></div><strong>${r}%</strong></div>`;
  }).join("");
  const months={};
  attendance.filter(a=>a.status===1||a.status===2).forEach(a=>{const m=String(a.date||"").slice(0,7)||"sem data";months[m]=(months[m]||0)+1});
  const max=Math.max(1,...Object.values(months));
  $("#monthlyStats").innerHTML=Object.entries(months).sort().slice(-6).map(([m,v])=>`<div class="chart-row"><span>${m}</span><div><i style="width:${Math.round(v/max*100)}%"></i></div><strong>${v}</strong></div>`).join("")||"<p>Sem dados.</p>";
  $("#performanceRows").innerHTML=visibleMembers().map(m=>{const s=stats(m),level=memberLevel(m),medals=memberMedals(m);return `<tr><td><button class="member-link" data-view-member="${escapeHtml(m.id)}">${escapeHtml(m.name)}</button></td><td>Lv ${level}</td><td>${escapeHtml(medals.join(" ")||"—")}</td><td>${s.present}</td><td>${s.absent}</td><td>${s.rate}%</td></tr>`}).join("")||'<tr><td colspan="6">Nenhum membro ativo.</td></tr>';
}


function formatHistoryDate(value){
  if(!value)return "—";
  const match=String(value).match(/^(\d{4})-(\d{2})-(\d{2})$/);
  return match?`${match[3]}/${match[2]}/${match[1]}`:String(value);
}

/* Relatório legado removido na V22.9.17.
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
      attendanceStatusLabel(item.status)
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
    <button data-popup-print>Salvar como PDF</button>
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
</body>
</html>`);
  finalizePrintWindow(popup);
} */

function rtStatusLabel(status){return ({"1":"Presente","2":"Atrasado","3":"Justificado","-1":"Ausente","0":"Pendente"})[String(status||0)]||"Pendente"}
function rtDateValue(value){try{return value?.toDate?value.toDate():new Date(value)}catch{return new Date()}}
function renderRtPresence(){
  const list=$("#rtPresenceList");if(!list)return;
  const search=String($("#rtSearch")?.value||"").toLowerCase(),kind=$("#rtKindFilter")?.value||"",date=$("#rtDateFilter")?.value||"";
  const rows=[...state.rtPresence].filter(rt=>rt.status==="finalized").filter(rt=>(!kind||rt.kind===kind)&&(!date||rt.date===date)&&(!search||`${rt.id||""} ${rt.typeLabel||""} ${rt.slotLabel||""} ${rt.finalizedByName||""}`.toLowerCase().includes(search))).sort((a,b)=>rtDateValue(b.finalizedAt)-rtDateValue(a.finalizedAt));
  setText("rtPresenceCount",`${rows.length} registro${rows.length===1?"":"s"}`);
  list.innerHTML=rows.map(rt=>`<article class="rt-card" data-rt-card="${escapeHtml(rt.id)}"><div class="rt-card-head"><div><small>RT ${escapeHtml(rt.id.slice(0,8).toUpperCase())}</small><h3>${escapeHtml(rt.typeLabel||rt.kind)} · ${escapeHtml(rt.slotLabel||rt.slot||"Todos")}</h3><p>${escapeHtml(rt.date||"—")} · ${escapeHtml(rt.week||"—")} · Finalizada por ${escapeHtml(rt.finalizedByName||"Equipe")}</p></div><span class="badge success">Finalizada</span></div><div class="rt-summary"><span>✓ ${rt.counts?.present||0} presentes</span><span>◷ ${rt.counts?.late||0} atrasados</span><span>! ${rt.counts?.justified||0} justificados</span><span>× ${rt.counts?.absent||0} ausentes</span><span>— ${rt.counts?.pending||0} pendentes</span></div><div class="rt-actions"><button class="btn mini" data-rt-toggle="${escapeHtml(rt.id)}">👁 Visualizar</button><button class="btn mini" data-rt-csv="${escapeHtml(rt.id)}">📊 Exportar CSV</button><button class="btn mini" data-rt-print="${escapeHtml(rt.id)}">🖨 Imprimir</button>${owner()?`<button class="btn danger mini" data-rt-delete="${escapeHtml(rt.id)}">🗑 Excluir</button>`:""}</div><div class="rt-details hidden" id="rt-details-${escapeHtml(rt.id)}">${rtRecordsTable(rt)}</div></article>`).join("")||'<div class="empty-state"><strong>Nenhum RT encontrado.</strong><p>Finalize uma presença para criar o primeiro registro.</p></div>';
}
function rtRecordsTable(rt){return `<div class="table-wrap"><table><thead><tr><th>Membro</th><th>Clã</th><th>Horário/Evento</th><th>Status</th><th>Observação</th><th>Alterado por</th></tr></thead><tbody>${(rt.records||[]).map(r=>`<tr><td>${escapeHtml(r.memberName)}</td><td>${escapeHtml(r.clan||"—")}</td><td>${escapeHtml(r.slot||"—")}</td><td>${rtStatusLabel(r.status)}</td><td>${escapeHtml(r.note||"—")}</td><td>${escapeHtml(r.updatedByName||"—")}</td></tr>`).join("")}</tbody></table></div>`}
function exportRtCsv(rt){const rows=[["Membro","Clã","Horário/Evento","Status","Observação","Alterado por"],...(rt.records||[]).map(r=>[r.memberName,r.clan,r.slot,rtStatusLabel(r.status),r.note,r.updatedByName])];const csv=rows.map(row=>row.map(v=>`"${csvSafe(v).replaceAll('"','""')}"`).join(";")).join("\n");const blob=new Blob(["\ufeff"+csv],{type:"text/csv;charset=utf-8"}),a=document.createElement("a");a.href=URL.createObjectURL(blob);a.download=`RT-${rt.typeLabel||rt.kind}-${rt.date||"registro"}.csv`;a.click();URL.revokeObjectURL(a.href)}
function printRt(rt){const w=window.open("","_blank");if(!w)return toast("Permita pop-ups para imprimir.");w.document.write(`<html><head><title>RT ${escapeHtml(rt.id)}</title><style>body{font-family:Arial;padding:24px}table{width:100%;border-collapse:collapse}th,td{border:1px solid #bbb;padding:8px;text-align:left}h1{margin-bottom:4px}</style></head><body><h1>RT Presença</h1><p>${escapeHtml(rt.typeLabel)} · ${escapeHtml(rt.slotLabel)} · ${escapeHtml(rt.date)}</p><p>Finalizada por ${escapeHtml(rt.finalizedByName||"Equipe")}</p>${rtRecordsTable(rt)}</body></html>`);finalizePrintWindow(w)}


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
  const todayIso=localIsoDate();
  const monthIso=todayIso.slice(0,7);
  animateNumber("kMembers",visibleMembers().length);

  const todayPresent=homeAttendanceRecords().filter(x=>(x.status===1||x.status===2)&&x.date===todayIso).length;
  animateNumber("kPresence",todayPresent);

  const monthEvents=monthlyEventKeys(monthIso).size;
  animateNumber("kMonthEvents",monthEvents);

  const rank=visibleMembers()
    .map(m=>({...m,...stats(m)}))
    .sort((a,b)=>b.present-a.present||b.rate-a.rate);
  const pointsRank=visibleMembers().slice().sort((a,b)=>progressionFor(b).totalXp-progressionFor(a).totalXp||String(a.name).localeCompare(String(b.name),"pt-BR"));

  setText("kBest",pointsRank[0]?.name||"—");
  $("#kBestPoints").textContent=`${pointsRank[0]?progressionFor(pointsRank[0]).totalXp.toLocaleString("pt-BR"):0} pontos`;

  const recent=state.attendance
    .filter(item=>memberForAttendance(item))
    .filter(x=>x.status===1||x.status===2)
    .sort((a,b)=>attendanceTime(b)-attendanceTime(a))
    .slice(0,5);

  $("#recentPresenceRows").innerHTML=recent.map(a=>{const currentMember=memberForAttendance(a);return `<tr>
    <td><span class="member-avatar">${escapeHtml((currentMember?.name||"?").slice(0,1).toUpperCase())}</span>${escapeHtml(currentMember?.name||"—")}</td>
    <td>${currentMember?memberDisplayRoleBadge(currentMember):roleBadge(a.role)}</td>
    <td>${escapeHtml(a.date||"—")}</td>
    <td>${escapeHtml(a.slot||a.kind||"—")}</td>
    <td><span class="badge ${attendanceStatusClass(a.status)}">${attendanceStatusLabel(a.status)}</span></td>
  </tr>`}).join("")||`<tr><td colspan="5">${state.attendanceLoaded?"Nenhuma presença registrada ainda.":"Carregando presenças..."}</td></tr>`;

  $("#topFiveRows").innerHTML=pointsRank.slice(0,5).map((r,i)=>`<tr>
    <td><span class="rank-position rank-${i+1}">${i<3?["🥇","🥈","🥉"][i]:i+1}</span></td>
    <td><span class="member-avatar">${escapeHtml((r.name||"?").slice(0,1).toUpperCase())}</span>${escapeHtml(r.name)}</td>
    <td>${memberDisplayRoleBadge(r)}</td>
    <td><strong class="ranking-points">${progressionFor(r).totalXp.toLocaleString("pt-BR")}</strong></td>
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
    <td><span class="member-avatar">${escapeHtml((m.name||"?").slice(0,1).toUpperCase())}</span><strong>${escapeHtml(m.name)}</strong></td>
    <td>${memberDisplayRoleBadge(m)}</td>
    <td>${escapeHtml(m.clan||"—")}</td>
    <td>Lv. ${progressionFor(m).level}</td>
    <td>${progressionFor(m).totalXp.toLocaleString("pt-BR")}</td>
    <td>${m.present}</td>
    <td><strong class="ranking-points">${m.rate}%</strong></td>
    <td><span class="online-status"><i></i>Ativo</span></td>
    <td><button class="btn mini" data-view-member="${escapeHtml(m.id)}" type="button">Ver perfil</button></td>
  </tr>`).join("")||'<tr><td colspan="9">Nenhum membro encontrado.</td></tr>';

  $("#memberRows").innerHTML=visibleMembers().map(member=>{
    const progression=progressionFor(member);
    return `<tr>
      <td><button class="member-link" data-view-member="${escapeHtml(member.id)}">${escapeHtml(member.name)}</button></td>
      <td>${memberDisplayRoleBadge(member)}</td>
      <td>${escapeHtml(member.clan||"—")}</td>
      <td><strong>Lv. ${progression.level}</strong></td>
      <td>${escapeHtml(progression.title)}</td>
      <td>${progression.totalXp.toLocaleString("pt-BR")}</td>
      <td>
        ${(()=>{
          const user=linkedUserForMember(member);
          const options=allowedCargoOptions(member,user);
          if(!options.length)return "";
          const selected=selectedCargoValue(member,user);
          return `<div class="member-role-control">
            <select class="role-change-select" data-role-select="${escapeHtml(member.id)}" aria-label="Novo cargo de ${escapeHtml(member.name)}">
              ${options.map(option=>`<option value="${option.value}" ${option.value===selected?"selected":""}>${option.label}</option>`).join("")}
            </select>
            <button class="btn" data-change-member-role="${escapeHtml(member.id)}" type="button">Alterar cargo</button>
          </div>`;
        })()}
        ${canChangeMemberClan(member)?`<div class="member-role-control">
          <select class="role-change-select" data-clan-select="${escapeHtml(member.id)}" aria-label="Novo clã de ${escapeHtml(member.name)}">
            <option value="">Sem clã</option>${CLANS.map(clan=>`<option value="${escapeHtml(clan)}" ${clan===member.clan?"selected":""}>${escapeHtml(clan)}</option>`).join("")}
          </select>
          <button class="btn" data-change-member-clan="${escapeHtml(member.id)}" type="button">Alterar clã</button>
        </div>`:""}
        ${canDeleteMemberRecord(member)?`<button class="btn danger" data-delete-member="${escapeHtml(member.id)}">Excluir</button>`:"Visualização"}
      </td>
    </tr>`;
  }).join("")||"<tr><td colspan='7'>Nenhum membro.</td></tr>";
  $("#historyRows").innerHTML=state.attendance.map(a=>`<tr><td>${escapeHtml(a.date||"—")}</td><td>${escapeHtml(a.kind)}</td><td>${escapeHtml(a.memberName)}</td><td>${escapeHtml(a.clan||"—")}</td><td>${roleBadge(a.role)}</td><td>${attendanceStatusLabel(a.status)}</td></tr>`).join("");
  $("#rankingRows").innerHTML=pointsRank.map((r,i)=>{const progression=progressionFor(r);return `<tr><td>${i+1}</td><td>${escapeHtml(r.name)}</td><td>${escapeHtml(r.clan||"—")}</td><td>${memberDisplayRoleBadge(r)}</td><td>Lv. ${progression.level}</td><td><strong class="ranking-points">${progression.totalXp.toLocaleString("pt-BR")}</strong></td></tr>`}).join("")||'<tr><td colspan="6">Sem dados de ranking.</td></tr>';
  const pending=state.users.filter(u=>normalizeAccessRole(u.role)==="member"&&u.status==="pending");
  const requestOptions=REQUEST_ACCESS_OPTIONS[owner()?"dev":leadership()?"leadership":"staff"]||[];
  $("#requestRows").innerHTML=pending.map(u=>`<tr><td>${escapeHtml(u.name)}</td><td>${escapeHtml(u.email)}</td><td><select data-clan="${escapeHtml(u.id)}">${'<option value="">Clã</option>'+CLANS.map(x=>`<option>${x}</option>`).join("")}</select></td><td><select data-role="${escapeHtml(u.id)}">${requestOptions.map(option=>`<option value="${option.value}">${option.label}</option>`).join("")}</select></td><td><div class="request-actions">${permissionEnabled("requests_approve")?`<button class="btn primary" data-approve="${escapeHtml(u.id)}" type="button">Aprovar</button>`:""}${permissionEnabled("requests_reject")?`<button class="btn danger" data-reject="${escapeHtml(u.id)}" type="button">Rejeitar</button>`:""}</div></td></tr>`).join("")||"<tr><td colspan='5'>Nenhuma solicitação pendente.</td></tr>";
  renderAuditTable();renderPayments();
  renderNotifications();renderCalendar();renderStatistics();renderOwnProfile();renderCharacterProfile();renderCharactersTable();renderCharacterCenter();renderHistoryCenter();renderGoals();renderSystemHealth();renderStaffCommandCenter();renderLevelSystem();renderAdvancedCenter();scheduleProgressionSync();applyRestrictedVisibility();
  window.SidebarV13?.updateBadges();
}


let maintenanceFormDirty=false;
let validatedAdvancedBackup=null;
let advancedDiagnostics={auth:{ok:false,text:"Aguardando teste"},firestore:{ok:false,text:"Aguardando teste"},listeners:{ok:false,text:"Aguardando teste"},pwa:{ok:false,text:"Aguardando teste"},testedAt:""};
let githubDiagnostics={ok:false,configured:false,repository:"",text:"Nenhum repositório configurado",workflows:"—",release:"—",testedAt:""};
function diagnosticCard(name,result){return `<article class="panel"><div class="panel-body advanced-card"><span class="service-light ${result.ok?"ok":"warning"}"></span><strong>${escapeHtml(name)}</strong><p>${escapeHtml(result.text||"—")}</p></div></article>`}
function sessionTime(value){const date=value?.toDate?.()||new Date(value||0);return Number.isNaN(date.getTime())?0:date.getTime()}
function renderSessions(){
  const host=byId("activeSessionsList");if(!host)return;
  const now=Date.now(),rows=state.sessions.slice().sort((a,b)=>sessionTime(b.lastSeen)-sessionTime(a.lastSeen));
  host.innerHTML=rows.map(item=>{const active=item.online!==false&&now-sessionTime(item.lastSeen)<120000;return `<div class="session-row"><div><strong>${escapeHtml(item.userName||item.email||"Usuário")}</strong><p>${escapeHtml(item.email||"")} · ${escapeHtml(accessRoleLabel(resolveAccessRole(item)))} · ${escapeHtml(item.device||"Navegador")}</p><small>Último sinal: ${sessionTime(item.lastSeen)?new Date(sessionTime(item.lastSeen)).toLocaleString("pt-BR"):"aguardando"}</small></div><span class="service-chip ${active?"ok":"warning"}">${active?"Conectado":"Inativo"}</span></div>`}).join("")||"<p>Nenhuma sessão registrada. Publique o novo firestore.rules e entre novamente.</p>";
}
function renderGithubStatus(){
  const host=byId("githubStatusCards");if(!host)return;
  host.innerHTML=[diagnosticCard("Repositório",{ok:githubDiagnostics.ok,text:githubDiagnostics.text}),diagnosticCard("Workflows",{ok:githubDiagnostics.ok,text:githubDiagnostics.workflows}),diagnosticCard("Última versão",{ok:githubDiagnostics.ok,text:githubDiagnostics.release})].join("");
}
function renderAdvancedCenter(){
  if(!owner())return;
  const logs=state.audit.slice().sort((a,b)=>(b.createdAt?.toMillis?.()||0)-(a.createdAt?.toMillis?.()||0));
  setHtml("advancedLogsRows",logs.map(a=>`<tr><td>${a.createdAt?.toDate?a.createdAt.toDate().toLocaleString("pt-BR"):"—"}</td><td>${escapeHtml(a.userName||"—")}</td><td>${escapeHtml(a.action||"—")}</td><td>${escapeHtml(a.details||"")}</td></tr>`).join("")||'<tr><td colspan="4">Nenhum log disponível.</td></tr>');
  setHtml("firebaseStatusCards",[diagnosticCard("Autenticação",advancedDiagnostics.auth),diagnosticCard("Cloud Firestore",advancedDiagnostics.firestore),diagnosticCard("Listeners em tempo real",advancedDiagnostics.listeners)].join(""));
  setHtml("servicesStatusGrid",[diagnosticCard("Aplicação web",{ok:true,text:`V22.9.32 carregada · ${location.protocol==="https:"?"HTTPS":"ambiente local"}`}),diagnosticCard("Firebase Auth",advancedDiagnostics.auth),diagnosticCard("Cloud Firestore",advancedDiagnostics.firestore),diagnosticCard("PWA / Service Worker",advancedDiagnostics.pwa),diagnosticCard("GitHub",{ok:githubDiagnostics.ok,text:githubDiagnostics.text})].join(""));
  renderSessions();renderGithubStatus();
  setHtml("systemStatsGrid",[
    ["Usuários",state.users.filter(user=>resolveAccessRole(user)!=="dev").length],["Membros",visibleMembers().length],["Presenças",state.attendance.length],["Eventos",state.events.length],["Notificações",state.sentNotifications.length||state.notifications.length],["Logs",state.audit.length]
  ].map(([label,value])=>`<article class="card"><span>${label}</span><strong>${Number(value||0).toLocaleString("pt-BR")}</strong><small>Dados carregados nesta sessão</small></article>`).join(""));
  const repository=state.settings?.advanced?.githubRepository||"";if(byId("githubRepository")&&document.activeElement!==byId("githubRepository"))setValue("githubRepository",repository);
  const maintenance=state.settings?.maintenance||{};
  if(!maintenanceFormDirty){const toggle=byId("maintenanceModeToggle");if(toggle)toggle.checked=maintenance.enabled===true;setValue("maintenanceTitle",maintenance.title||"Sistema em manutenção");setValue("maintenanceMessage",maintenance.message||"Estamos realizando melhorias. Algumas funções podem apresentar instabilidade.");setValue("maintenanceImageUrl",maintenance.imageUrl||"");setValue("maintenanceExpectedEnd",maintenance.expectedEnd||"");const showLogin=byId("maintenanceShowLogin");if(showLogin)showLogin.checked=maintenance.showLogin!==false;const showApp=byId("maintenanceShowApp");if(showApp)showApp.checked=maintenance.showApp!==false;updateMaintenancePreview()}
  applyMaintenanceNotice();
}
function filteredAuditRows(){const term=String(byId("auditSearch")?.value||"").trim().toLowerCase();return state.audit.slice().sort((a,b)=>(b.createdAt?.toMillis?.()||0)-(a.createdAt?.toMillis?.()||0)).filter(item=>!term||`${item.userName||""} ${item.action||""} ${item.details||""}`.toLowerCase().includes(term))}
function renderAuditTable(){const host=byId("auditRows");if(!host)return;host.innerHTML=filteredAuditRows().map(a=>`<tr><td>${a.createdAt?.toDate?a.createdAt.toDate().toLocaleString("pt-BR"):"—"}</td><td>${escapeHtml(a.userName||"—")}</td><td>${escapeHtml(a.action||"—")}</td><td>${escapeHtml(a.details||"")}</td></tr>`).join("")||'<tr><td colspan="4">Nenhum registro encontrado.</td></tr>'}
on("auditSearch","input",renderAuditTable);
on("exportAuditCsv","click",()=>{const rows=[["Data","Usuário","Ação","Detalhes"],...filteredAuditRows().map(item=>[item.createdAt?.toDate?item.createdAt.toDate().toLocaleString("pt-BR"):"",item.userName||"",item.action||"",item.details||""])],csv=rows.map(row=>row.map(value=>`"${csvSafe(value).replaceAll('"','""')}"`).join(";")).join("\n"),blob=new Blob(["\ufeff"+csv],{type:"text/csv;charset=utf-8"}),url=URL.createObjectURL(blob),link=document.createElement("a");link.href=url;link.download=`auditoria-77-team-${todayIso()}.csv`;link.click();URL.revokeObjectURL(url)});
function downloadJson(filename,data){const blob=new Blob([JSON.stringify(data,null,2)],{type:"application/json"});const url=URL.createObjectURL(blob);const a=document.createElement("a");a.href=url;a.download=filename;a.click();setTimeout(()=>URL.revokeObjectURL(url),1000)}
async function runFirebaseDiagnostics(){
  const started=performance.now();advancedDiagnostics.auth={ok:!!auth.currentUser,text:auth.currentUser?`Autenticado como ${auth.currentUser.email||auth.currentUser.uid}`:"Sem usuário autenticado"};
  try{const snap=await getDoc(doc(db,"settings","app"));advancedDiagnostics.firestore={ok:true,text:`Leitura confirmada em ${Math.round(performance.now()-started)} ms · settings/app ${snap.exists()?"encontrado":"ainda não criado"}`}}catch(error){advancedDiagnostics.firestore={ok:false,text:errMsg(error)}}
  advancedDiagnostics.listeners={ok:state.unsubs.length>0,text:`${state.unsubs.length} listener(s) registrado(s)`};advancedDiagnostics.pwa={ok:"serviceWorker" in navigator&&!!navigator.serviceWorker.controller,text:"serviceWorker" in navigator?(navigator.serviceWorker.controller?"Service Worker controlando esta página":"Disponível; recarregue para assumir o controle"):"Não suportado pelo navegador"};advancedDiagnostics.testedAt=new Date().toISOString();renderAdvancedCenter();return advancedDiagnostics;
}
async function checkGithub(){
  const repository=String(byId("githubRepository")?.value||state.settings?.advanced?.githubRepository||"").trim();
  if(!/^[A-Za-z0-9_.-]+\/[A-Za-z0-9_.-]+$/.test(repository)){githubDiagnostics={ok:false,configured:false,repository,text:"Informe no formato organizacao/repositorio",workflows:"Não consultado",release:"Não consultada"};renderAdvancedCenter();return false}
  setText("githubUpdateStatus","Consultando GitHub...");
  try{const [repoResponse,runsResponse,releaseResponse]=await Promise.all([fetch(`https://api.github.com/repos/${repository}`,{headers:{Accept:"application/vnd.github+json"}}),fetch(`https://api.github.com/repos/${repository}/actions/runs?per_page=1`,{headers:{Accept:"application/vnd.github+json"}}),fetch(`https://api.github.com/repos/${repository}/releases/latest`,{headers:{Accept:"application/vnd.github+json"}})]);if(!repoResponse.ok)throw new Error(`Repositório indisponível (${repoResponse.status})`);const repo=await repoResponse.json(),runs=runsResponse.ok?await runsResponse.json():null,release=releaseResponse.ok?await releaseResponse.json():null,lastRun=runs?.workflow_runs?.[0];githubDiagnostics={ok:true,configured:true,repository,text:`${repo.full_name} · branch ${repo.default_branch} · atualizado ${new Date(repo.updated_at).toLocaleString("pt-BR")}`,workflows:lastRun?`${lastRun.name}: ${lastRun.conclusion||lastRun.status}`:"Nenhuma execução pública",release:release?.tag_name||"Nenhuma release publicada",testedAt:new Date().toISOString()};setText("githubUpdateStatus","Consulta concluída com sucesso.");renderAdvancedCenter();return true}catch(error){githubDiagnostics={ok:false,configured:true,repository,text:error.message||"Falha ao consultar GitHub",workflows:"Indisponível",release:"Indisponível"};setText("githubUpdateStatus",githubDiagnostics.text);renderAdvancedCenter();return false}
}
on("checkUpdatesButton","click",async()=>{const button=byId("checkUpdatesButton");if(button)button.disabled=true;try{const response=await fetch(`manifest.json?check=${Date.now()}`,{cache:"no-store"});if(!response.ok)throw new Error("Manifesto indisponível");const manifest=await response.json(),repository=state.settings?.advanced?.githubRepository||"";let message=`Versão publicada: ${manifest.version_name||manifest.version||"não informada"}. Versão carregada: 22.9.32.`;if(repository){await checkGithub();if(githubDiagnostics.release!=="Nenhuma release publicada"&&githubDiagnostics.release!=="Indisponível")message+=` GitHub: ${githubDiagnostics.release}.`}setText("updateStatusText",message);toast("Verificação concluída.")}catch(error){setText("updateStatusText",`Falha na verificação: ${error.message}`)}finally{if(button)button.disabled=false}});
on("createBackupButton","click",async()=>{if(!owner())return;try{downloadJson(`77-team-backup-${localIsoDate()}.json`,await completeBackupPayload());toast("Backup completo do Firestore e seguro gerado.")}catch(error){toast(error.message||errMsg(error))}});
on("restoreBackupFile","change",async e=>{const file=e.target.files?.[0],button=byId("restoreAdvancedBackup");validatedAdvancedBackup=null;if(button)button.disabled=true;if(!file)return;if(file.size>200*1024*1024)return setText("restoreBackupInfo","Arquivo acima do limite seguro de 200 MB.");try{const data=JSON.parse(await file.text());validateBackupPayload(data);validatedAdvancedBackup=data;if(button)button.disabled=false;setText("restoreBackupInfo",`✓ Backup validado: V${data.version}, projeto ${data.projectId}, schema ${data.backupSchema}, gerado em ${new Date(data.generatedAt).toLocaleString("pt-BR")}.`)}catch(error){setText("restoreBackupInfo",`✕ Backup recusado: ${error.message||"arquivo inválido"}`)}});
on("restoreAdvancedBackup","click",async()=>{if(!owner()||!validatedAdvancedBackup)return;if(!confirm("Restaurar este backup validado? Um restoreJob persistente fará rollback automático em caso de falha."))return;const button=byId("restoreAdvancedBackup");button.disabled=true;setText("restoreBackupInfo","Restauração controlada em andamento. Não feche esta página...");try{const jobId=await restoreBackupPayload(validatedAdvancedBackup);setText("restoreBackupInfo",`✓ Restauração concluída. restoreJob: ${jobId}`);validatedAdvancedBackup=null;toast("Backup restaurado com rollback protegido.")}catch(error){setText("restoreBackupInfo",`✕ Restauração revertida: ${error.message||error}`);button.disabled=false}});
function maintenanceFormData(){const rawImage=byId("maintenanceImageUrl")?.value.trim()||"";return {enabled:byId("maintenanceModeToggle")?.checked===true,title:byId("maintenanceTitle")?.value.trim()||"Sistema em manutenção",message:byId("maintenanceMessage")?.value.trim()||"Estamos realizando melhorias. Algumas funções podem apresentar instabilidade.",imageUrl:rawImage?safeExternalUrl(rawImage):"",expectedEnd:byId("maintenanceExpectedEnd")?.value||"",showLogin:byId("maintenanceShowLogin")?.checked!==false,showApp:byId("maintenanceShowApp")?.checked!==false}}
function formatMaintenanceEnd(value){if(!value)return "";const d=new Date(value);return Number.isNaN(d.getTime())?"":`Previsão de término: ${d.toLocaleString("pt-BR")}`}
function setNoticeImage(element,url){if(!element)return;const safe=safeExternalUrl(url);element.classList.toggle("hidden",!safe);if(safe)element.src=safe;else element.removeAttribute("src")}
function updateMaintenancePreview(){const data=maintenanceFormData();setText("maintenancePreviewTitle",`🚧 ${data.title}`);setText("maintenancePreviewMessage",data.message);const end=formatMaintenanceEnd(data.expectedEnd);setText("maintenancePreviewEnd",end);byId("maintenancePreviewEnd")?.classList.toggle("hidden",!end);setNoticeImage(byId("maintenancePreviewImage"),data.imageUrl);const chip=byId("maintenanceStatusChip");if(chip){chip.textContent=data.enabled?"Aviso ativo":"Sistema online";chip.classList.toggle("active",data.enabled)}}
function applyMaintenanceNotice(){const data=state.settings?.maintenance||{};const enabled=data.enabled===true;const loginVisible=enabled&&data.showLogin!==false;const appVisible=enabled&&data.showApp!==false&&sessionStorage.getItem("77team-maintenance-dismissed")!==String(data.updatedAt||"");const login=byId("maintenanceLoginNotice");if(login){login.classList.toggle("hidden",!loginVisible);setText("maintenanceLoginTitle",`🚧 ${data.title||"Sistema em manutenção"}`);setText("maintenanceLoginMessage",data.message||"Estamos realizando melhorias.");const end=formatMaintenanceEnd(data.expectedEnd);setText("maintenanceLoginEnd",end);byId("maintenanceLoginEnd")?.classList.toggle("hidden",!end);setNoticeImage(byId("maintenanceLoginImage"),data.imageUrl)}const banner=byId("maintenanceAppBanner");if(banner){banner.classList.toggle("hidden",!appVisible);setText("maintenanceAppTitle",`🚧 ${data.title||"Sistema em manutenção"}`);setText("maintenanceAppMessage",data.message||"Estamos realizando melhorias.");const end=formatMaintenanceEnd(data.expectedEnd);setText("maintenanceAppEnd",end);byId("maintenanceAppEnd")?.classList.toggle("hidden",!end)}}
["maintenanceModeToggle","maintenanceTitle","maintenanceMessage","maintenanceImageUrl","maintenanceExpectedEnd","maintenanceShowLogin","maintenanceShowApp"].forEach(id=>{on(id,"input",()=>{maintenanceFormDirty=true;updateMaintenancePreview()});on(id,"change",()=>{maintenanceFormDirty=true;updateMaintenancePreview()})}); on("previewMaintenanceButton","click",()=>{updateMaintenancePreview();toast("Prévia atualizada.")}); on("closeMaintenanceBanner","click",()=>{sessionStorage.setItem("77team-maintenance-dismissed",String(state.settings?.maintenance?.updatedAt||""));byId("maintenanceAppBanner")?.classList.add("hidden")});
on("saveMaintenanceButton","click",async()=>{if(!owner())return;const rawImage=byId("maintenanceImageUrl")?.value.trim()||"";if(rawImage&&!safeExternalUrl(rawImage))return toast("A imagem do aviso precisa usar uma URL HTTPS válida.");try{const maintenance={...maintenanceFormData(),updatedAt:new Date().toISOString(),updatedBy:state.user.uid,updatedByName:state.profile?.name||state.user.email||"DEV"};await setDoc(doc(db,"settings","app"),{maintenance},{merge:true});state.settings={...state.settings,maintenance};maintenanceFormDirty=false;applyMaintenanceNotice();await audit("aviso de manutenção atualizado",maintenance.enabled?"ativado":"desativado");toast(maintenance.enabled?"Aviso de manutenção publicado.":"Aviso de manutenção desativado.")}catch(e){toast(errMsg(e))}});
on("refreshFirebaseStatus","click",runFirebaseDiagnostics);on("refreshServicesStatus","click",async()=>{await runFirebaseDiagnostics();if(state.settings?.advanced?.githubRepository)await checkGithub();toast("Diagnóstico dos serviços concluído.")});
on("checkGithubButton","click",checkGithub);on("refreshGithubStatus","click",checkGithub);
on("clearInactiveSessions","click",async()=>{if(!owner())return;const cutoff=Date.now()-24*60*60*1000,stale=state.sessions.filter(item=>sessionTime(item.lastSeen)<cutoff);if(!stale.length)return toast("Nenhuma sessão inativa há mais de 24 horas.");if(!confirm(`Remover ${stale.length} sessão(ões) inativa(s)?`))return;try{for(let index=0;index<stale.length;index+=400){const batch=writeBatch(db);stale.slice(index,index+400).forEach(item=>batch.delete(doc(db,"sessions",item.id)));await batch.commit()}await audit("sessões inativas removidas",`${stale.length} registro(s)`);toast("Sessões inativas removidas.")}catch(error){toast(errMsg(error))}});
on("saveGithubRepository","click",async()=>{if(!owner())return;const repository=String(byId("githubRepository")?.value||"").trim();if(repository&&!/^[A-Za-z0-9_.-]+\/[A-Za-z0-9_.-]+$/.test(repository))return toast("Use o formato organizacao/repositorio.");try{const advanced={...(state.settings?.advanced||{}),githubRepository:repository};await setDoc(doc(db,"settings","app"),{advanced},{merge:true});state.settings={...state.settings,advanced};await audit("repositório GitHub atualizado",repository||"removido");toast(repository?"Repositório salvo.":"Repositório removido.");if(repository)await checkGithub()}catch(error){toast(errMsg(error))}});
on("clearCacheButton","click",async()=>{if(!owner())return;try{if("serviceWorker" in navigator){const regs=await navigator.serviceWorker.getRegistrations();await Promise.all(regs.map(r=>r.unregister()))}if("caches" in window){const keys=await caches.keys();await Promise.all(keys.map(k=>caches.delete(k)))}toast("Cache limpo. Recarregando...");setTimeout(()=>location.reload(true),700)}catch(e){toast("Não foi possível limpar todo o cache.")}});

document.addEventListener("input",e=>{if(e.target.matches("[data-unified-presence-search],[data-unified-presence-date]"))filterUnifiedPresence()});
document.addEventListener("change",e=>{if(e.target.matches("[data-unified-presence-kind],[data-unified-presence-date]"))filterUnifiedPresence()});
document.addEventListener("input",e=>{const el=e.target.closest("[data-presence-filter]");if(!el)return;const kind=el.dataset.kind,key=el.dataset.presenceFilter,filter=presenceFilter(kind);filter[key]=el.value;if(key==="date")filter.week=isoWeek(el.value);renderPresence(kind+"Content",kind)});
document.addEventListener("change",e=>{const el=e.target.closest("[data-presence-filter]");if(!el)return;const kind=el.dataset.kind,key=el.dataset.presenceFilter,filter=presenceFilter(kind);filter[key]=el.value;if(key==="week"&&el.value){const [year,week]=el.value.split("-W").map(Number),jan4=new Date(year,0,4),day=jan4.getDay()||7,monday=new Date(year,0,4-day+1+(week-1)*7);filter.date=monday.toISOString().slice(0,10)}else if(key==="date")filter.week=isoWeek(el.value);renderPresence(kind+"Content",kind)});

document.addEventListener("click",async e=>{
  const openPresence=e.target.closest("[data-open-presence-modal]");if(openPresence){openPresenceModal(openPresence.dataset.openPresenceModal);return}
  const backupPresence=e.target.closest("[data-backup-presence]");if(backupPresence){try{await createPresenceBackup()}catch(error){console.error(error);toast(errMsg(error))}return}
  const resetPresence=e.target.closest("[data-reset-presence]");if(resetPresence){await resetPresenceWithBackup();return}
  const downloadBackup=e.target.closest("[data-download-presence-backup]");if(downloadBackup){await downloadPresenceBackup(downloadBackup.dataset.downloadPresenceBackup);return}
  const viewCenter=e.target.closest("[data-view-center-backup]");if(viewCenter){await viewCenterBackup(viewCenter.dataset.viewCenterBackup);return}
  const excelCenter=e.target.closest("[data-export-center-excel]");if(excelCenter){await exportCenterBackupExcel(excelCenter.dataset.exportCenterExcel);return}
  const restoreCenter=e.target.closest("[data-restore-center-backup]");if(restoreCenter){await restoreCenterBackup(restoreCenter.dataset.restoreCenterBackup);return}
  const deleteCenter=e.target.closest("[data-delete-center-backup]");if(deleteCenter){await deleteCenterBackup(deleteCenter.dataset.deleteCenterBackup);return}
  const statusChoice=e.target.closest("[data-presence-status-choice]");if(statusChoice){document.querySelectorAll("[data-presence-status-choice]").forEach(btn=>btn.classList.toggle("active",btn===statusChoice));return}
  const deleteAttendance=e.target.closest("[data-delete-attendance]");if(deleteAttendance&&permissionEnabled("presence_delete")&&confirm("Excluir este registro de presença?")){await deleteDoc(doc(db,"attendance",deleteAttendance.dataset.deleteAttendance));await audit("presença excluída",deleteAttendance.dataset.deleteAttendance);toast("Registro excluído.");return}

  const p=e.target.closest("[data-presence]");
  if(p&&permissionEnabled("presence_edit")){
    const [kind,memberId,slot,date=todayIso()]=p.dataset.presence.split("|"),member=state.members.find(m=>m.id===memberId);if(!member)return;
    const id=(kind+"__"+date+"__"+memberId+"__"+slot).replace(/[^a-zA-Z0-9_-]/g,"_");
    const current=presenceRecord(kind,memberId,slot,date),sequence=[0,1,2,3,-1],next=sequence[(sequence.indexOf(Number(current?.status||0))+1)%sequence.length];
    const ref=doc(db,"attendance",id);
    if(next===0)await deleteDoc(ref);else await setDoc(ref,{memberId,userId:member.userId||member.id,memberName:member.name,clan:member.clan,role:member.role,kind,slot,status:next,date,note:current?.note||"",updatedBy:state.user.uid,updatedByName:state.profile?.name||state.user.email,updatedAt:serverTimestamp()},{merge:true});
    await audit("presença alterada",`${member.name} · ${kind} · ${slot} · ${presenceStatus(next).label}`);toast("Alteração salva automaticamente.");
  }
  const noteButton=e.target.closest("[data-presence-note]");
  if(noteButton&&permissionEnabled("presence_edit")){
    const [kind,memberId,slot,date]=noteButton.dataset.presenceNote.split("|"),member=state.members.find(m=>m.id===memberId);if(!member)return;
    const current=presenceRecord(kind,memberId,slot,date),note=prompt(`Observação de ${member.name} · ${slot}:`,current?.note||"");if(note===null)return;
    const id=(kind+"__"+date+"__"+memberId+"__"+slot).replace(/[^a-zA-Z0-9_-]/g,"_");
    await setDoc(doc(db,"attendance",id),{memberId,userId:member.userId||member.id,memberName:member.name,clan:member.clan,role:member.role,kind,slot,status:Number(current?.status||0),date,note:note.trim(),updatedBy:state.user.uid,updatedByName:state.profile?.name||state.user.email,updatedAt:serverTimestamp()},{merge:true});
    await audit("observação de presença",`${member.name} · ${kind} · ${slot}`);toast("Observação salva.");
  }
  const bulk=e.target.closest("[data-presence-bulk]");
  if(bulk&&permissionEnabled("presence_edit")){
    const kind=bulk.dataset.kind,status=Number(bulk.dataset.presenceBulk),filter=presenceFilter(kind),slots=filter.slot==="all"?configuredPresenceSlots(kind):[filter.slot],members=state.members.filter(m=>(!filter.clan||m.clan===filter.clan)&&(!filter.search||String(m.name||"").toLowerCase().includes(filter.search.toLowerCase())));
    if(!confirm(`${status===1?"Marcar como presentes":status===-1?"Marcar como ausentes":"Limpar"} ${members.length*slots.length} registros?`))return;
    const batch=writeBatch(db);for(const member of members)for(const slot of slots){const id=(kind+"__"+filter.date+"__"+member.id+"__"+slot).replace(/[^a-zA-Z0-9_-]/g,"_"),ref=doc(db,"attendance",id);if(status===0)batch.delete(ref);else batch.set(ref,{memberId:member.id,userId:member.userId||member.id,memberName:member.name,clan:member.clan,role:member.role,kind,slot,status,date:filter.date,note:"",updatedBy:state.user.uid,updatedByName:state.profile?.name||state.user.email,updatedAt:serverTimestamp()},{merge:true})}await batch.commit();await audit("presença em massa",`${kind} · ${filter.date} · ${members.length*slots.length} registros`);toast("Marcações atualizadas.");
  }
  const review=e.target.closest("[data-presence-review]");
  if(review&&permissionEnabled("presence_finalize")){
    const kind=review.dataset.presenceReview,filter=presenceFilter(kind),slots=filter.slot==="all"?configuredPresenceSlots(kind):[filter.slot];
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
  const rtDelete=e.target.closest("[data-rt-delete]");if(rtDelete&&owner()){const rt=state.rtPresence.find(x=>x.id===rtDelete.dataset.rtDelete);if(rt&&confirm("Excluir este RT definitivamente? O Histórico de presença não será removido.")){await deleteDoc(doc(db,"rtPresence",rt.id));await audit("RT Presença excluído",`${escapeHtml(rt.id)} · ${rt.typeLabel} · ${rt.date}`);toast("RT excluído.")}}

  const changeClan=e.target.closest("[data-change-member-clan]");
  if(changeClan){
    const member=state.members.find(item=>item.id===changeClan.dataset.changeMemberClan);if(!member)return;
    if(!canChangeMemberClan(member))return toast("O STAFF só pode alterar o clã de jogadores do cargo Membro.");
    const select=document.querySelector(`[data-clan-select="${CSS.escape(member.id)}"]`),nextClan=select?.value||"";
    if(nextClan&&!CLANS.includes(nextClan))return toast("Clã inválido.");
    if((member.clan||"")===nextClan)return toast("O membro já está neste clã.");
    if(!confirm(`Alterar o clã de ${member.name} para ${nextClan||"Sem clã"}?`))return;
    try{
      const user=linkedUserByUidForMember(member),payload={clan:nextClan,clanUpdatedAt:serverTimestamp(),clanUpdatedBy:state.user.uid,updatedAt:serverTimestamp()};
      await updateDoc(doc(db,"members",member.id),payload);member.clan=nextClan;
      let accountSynced=false;
      if(user)try{await updateDoc(doc(db,"users",user.id),payload);user.clan=nextClan;accountSynced=true}catch(syncError){console.warn("Clã alterado no membro, mas a conta vinculada não foi sincronizada:",syncError)}
      render();
      await audit("clã de membro alterado",`${member.name} → ${nextClan||"Sem clã"}${accountSynced?" · conta sincronizada por UID":user?" · sincronização da conta pendente":" · membro sem conta vinculada"}`);
      toast(accountSynced?"Clã atualizado no membro e na conta.":user?"Clã atualizado no membro. A sincronização da conta ficou pendente.":"Clã atualizado no membro.");
    }catch(error){
      if(error?.code==="permission-denied"){
        const allowed=permissionEnabled("members_clan_change");
        console.error("Alteração de clã negada pelo Firestore",{role:currentAccessRole(),members_clan_change:allowed,member});
        toast(`Alteração de clã negada pelo Firebase · cargo=${accessRoleLabel(currentAccessRole())} · alterar clã=${allowed?"SIM":"NÃO"}.`);
      }else toast(errMsg(error));
    }
    return;
  }

  const changeRole=e.target.closest("[data-change-member-role]");
  if(changeRole){
    const member=state.members.find(item=>item.id===changeRole.dataset.changeMemberRole);
    const user=linkedUserForMember(member);
    if(!canManageAcceptedMember(member,user))return toast("Você não tem permissão para alterar este cargo.");

    const select=document.querySelector(`[data-role-select="${CSS.escape(member.id)}"]`);
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
        applyPermissions();
      }
      render();

      await audit("cargo de membro alterado",`${member.name} · ${currentLabel} → ${nextLabel}`);
      toast(`Cargo de ${member.name} alterado para ${nextLabel}.`);
    }catch(error){
      toast(errMsg(error));
    }
    return;
  }

  const del=e.target.closest("[data-delete-member]");if(del){
    const member=state.members.find(item=>item.id===del.dataset.deleteMember);
    if(!canDeleteMemberRecord(member))return toast("Seu cargo não pode excluir este membro.");
    if(confirm(`Excluir o membro ${member.name||"selecionado"}?`))try{await deleteDoc(doc(db,"members",member.id));await audit("membro excluído",`${member.name||member.id} · por ${currentAccessRole()}`);toast("Membro excluído.")}catch(error){toast(errMsg(error))}
    return;
  }
  const approve=e.target.closest("[data-approve]");
  if(approve&&permissionEnabled("requests_approve")){
    const u=state.users.find(x=>x.id===approve.dataset.approve);if(!u)return;
    if(state.members.some(member=>member.id!==u.id&&String(member.name||"").trim().toLowerCase()===String(u.name||"").trim().toLowerCase()))return toast("Já existe um membro usando este nickname. Altere o nickname da solicitação antes de aprovar.");
    const clan=document.querySelector(`[data-clan="${escapeHtml(u.id)}"]`)?.value||"";
    const chosen=document.querySelector(`[data-role="${escapeHtml(u.id)}"]`)?.value||"";
    if(!clan)return toast("Selecione o clã.");
    const allowed=REQUEST_ACCESS_OPTIONS[owner()?"dev":leadership()?"leadership":"staff"]||[];
    if(!allowed.some(option=>option.value===chosen))return toast("Cargo inválido para o seu nível de acesso.");

    const accessRole=chosen.startsWith("member:")?"member":chosen;
    const memberRole=chosen.startsWith("member:")?chosen.slice(7):memberRoleFromAccessRole(accessRole,"Membros");
    const roleLabel=accessRole==="member"?memberRole:accessRoleLabel(accessRole);
    if(!confirm(`Aprovar ${u.name} com o cargo ${roleLabel}?`))return;

    try{
      const key=nicknameClaimKey(u.name),claimRef=doc(db,"nicknameClaims",key);
      await runTransaction(db,async transaction=>{
        const claim=await transaction.get(claimRef);
        if(claim.exists()&&claim.data()?.active!==false&&claim.data()?.uid!==u.id)throw new Error("Este nickname já está reservado por outra conta.");
        transaction.update(doc(db,"users",u.id),{
          role:accessRole,accessRole,active:true,status:"approved",clan,memberRole,nicknameClaimKey:key,memberDocumentId:u.id,
          approvedAt:serverTimestamp(),roleUpdatedAt:serverTimestamp(),
          roleUpdatedBy:state.user.uid,updatedAt:serverTimestamp()
        });
        transaction.set(doc(db,"members",u.id),{
          name:u.name,role:memberRole,clan,userId:u.id,accessRole,
          createdAt:serverTimestamp(),updatedAt:serverTimestamp()
        },{merge:true});
        const claimAlreadyCurrent=claim.exists()&&claim.data()?.active!==false&&claim.data()?.uid===u.id&&nicknameClaimKey(claim.data()?.name)===key;
        if(!claimAlreadyCurrent)transaction.set(claimRef,{uid:u.id,memberId:u.id,name:u.name,normalizedKey:key,active:true,updatedAt:serverTimestamp()});
      });
      await audit("solicitação aprovada",`${u.email} · ${roleLabel}`);
      toast(`${u.name} foi aprovado como ${roleLabel}.`);
    }catch(error){
      if(error?.code==="permission-denied"){
        const approveAllowed=permissionEnabled("requests_approve"),areaAllowed=permissionEnabled("access_staff");
        console.error("Aprovação negada pelo Firestore",{role:currentAccessRole(),access_staff:areaAllowed,requests_approve:approveAllowed,target:u});
        toast(`Aprovação negada pelo Firebase · cargo=${accessRoleLabel(currentAccessRole())} · acesso STAFF=${areaAllowed?"SIM":"NÃO"} · aprovar=${approveAllowed?"SIM":"NÃO"}.`);
      }else toast(errMsg(error));
    }
    return;
  }

  const reject=e.target.closest("[data-reject]");
  if(reject&&permissionEnabled("requests_reject")){
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
  if(!permissionEnabled("members_edit"))return toast("Sem permissão para editar membros.");

  const name=$("#memberName").value.trim();
  const role=$("#memberRole").value;
  const clan=$("#memberClan").value;

  if(role==="Staff"){
    toast("Para adicionar Staff, aprove ou promova uma conta existente. Não é necessário criar outro usuário.");
    return;
  }
  const nicknameError=nicknameValidationError(name);if(nicknameError)return toast(nicknameError);
  if(state.members.some(item=>String(item.name||"").trim().toLowerCase()===name.toLowerCase()))return toast("Este nickname já está sendo usado por outro membro.");
  try{
    await addDoc(collection(db,"members"),{
      name,
      role,
      clan,
      accessRole:"member",
      active:true,
      createdAt:serverTimestamp(),
      updatedAt:serverTimestamp()
    });
    event.target.reset();
    toast("Membro adicionado.");
  }catch(error){toast(errMsg(error))}
};


$("#dashboardMemberSearch")?.addEventListener("input",render);



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
function closeCalendarEventModal(){editingCalendarEventId="";$("#eventForm")?.reset();$("#eventModal")?.classList.add("hidden")}
function openCalendarEventModal(item=null){
  if(!permissionEnabled("events_manage"))return toast("Sem permissão para gerenciar eventos.");
  if(state.settings?.events?.customEventsEnabled===false)return toast("A criação de eventos foi desativada nas Configurações.");
  editingCalendarEventId=item?.id||"";
  setText("eventModalTitle",item?"Editar evento":"Novo evento");
  setValue("eventTitle",item?.title||"");setValue("eventDate",item?.date||localIsoDate());setValue("eventTime",item?.time||"");setValue("eventType",item?.type||"Evento");setValue("eventDescription",item?.description||"");
  byId("deleteCalendarEvent")?.classList.toggle("hidden",!item);
  $("#eventModal")?.classList.remove("hidden");
}
$("#newCalendarEvent").onclick=()=>openCalendarEventModal();
$("#closeEventModal").onclick=closeCalendarEventModal;
on("calendarPreviousMonth","click",()=>{calendarCursor=new Date(calendarCursor.getFullYear(),calendarCursor.getMonth()-1,1);renderCalendar()});
on("calendarNextMonth","click",()=>{calendarCursor=new Date(calendarCursor.getFullYear(),calendarCursor.getMonth()+1,1);renderCalendar()});
on("calendarCurrentMonth","click",()=>{calendarCursor=new Date(new Date().getFullYear(),new Date().getMonth(),1);renderCalendar()});
document.addEventListener("click",event=>{
  if(event.target.closest("[data-close-drawer]"))$("#memberDrawer").classList.add("hidden");
  const view=event.target.closest("[data-view-member]");
  if(view){const member=visibleMembers().find(m=>m.id===view.dataset.viewMember);if(member)openMemberDrawer(member)}
  const calendarEvent=event.target.closest("[data-calendar-event]");
  if(calendarEvent){const item=state.events.find(entry=>entry.id===calendarEvent.dataset.calendarEvent);if(item)permissionEnabled("events_manage")?openCalendarEventModal(item):toast(`${item.title}${item.time?` · ${item.time}`:""}${item.description?` · ${item.description}`:""}`)}
});
$("#eventForm").onsubmit=async event=>{
  event.preventDefault();if(!permissionEnabled("events_manage"))return toast("Sem permissão para gerenciar eventos.");
  if(state.settings?.events?.customEventsEnabled===false)return toast("A criação de eventos foi desativada nas Configurações.");
  const submitButton=event.submitter||event.currentTarget.querySelector('[type="submit"]');
  if(submitButton?.disabled)return;
  const month=String($("#eventDate").value||"").slice(0,7),limit=Math.max(1,Number(state.settings?.events?.maxMonthlyEvents||20));
  if(state.events.filter(item=>item.id!==editingCalendarEventId&&String(item.date||"").startsWith(month)).length>=limit)return toast(`Limite de ${limit} eventos no mês atingido.`);
  const title=$("#eventTitle").value.trim(),description=$("#eventDescription").value.trim();
  if(!title)return toast("Informe o título do evento.");
  if(title.length>120)return toast("O título do evento deve ter no máximo 120 caracteres.");
  if(description.length>1000)return toast("A descrição do evento deve ter no máximo 1.000 caracteres.");
  const payload={title,date:$("#eventDate").value,time:$("#eventTime").value||"",type:$("#eventType").value,description};
  if(submitButton)submitButton.disabled=true;
  try{
    if(editingCalendarEventId){
      await updateDoc(doc(db,"events",editingCalendarEventId),{...payload,updatedBy:state.user.uid,updatedAt:serverTimestamp()});
      closeCalendarEventModal();toast("Evento atualizado.");
      audit("evento atualizado",`${payload.title} · ${payload.date}`).catch(error=>console.warn("Auditoria do evento indisponível:",error));return;
    }
    const batch=writeBatch(db),eventRef=doc(collection(db,"events"));
    batch.set(eventRef,{...payload,createdBy:state.user.uid,createdAt:serverTimestamp()});
    if(state.settings?.notifications?.event!==false&&permissionEnabled("notifications_send")){
      const notificationRef=doc(collection(db,"notifications"));
      batch.set(notificationRef,{title:"Novo evento",message:`${payload.title} em ${payload.date}${payload.time?` às ${payload.time}`:""}`,type:"info",targetType:"all",createdBy:state.user.uid,createdByName:state.profile?.name||"Staff",createdAt:serverTimestamp()});
    }
    await batch.commit();
    closeCalendarEventModal();toast("Evento criado.");
  }catch(error){
    toast(errMsg(error));
  }finally{
    if(submitButton)submitButton.disabled=false;
  }
};
on("deleteCalendarEvent","click",async()=>{const item=state.events.find(entry=>entry.id===editingCalendarEventId);if(!item||!permissionEnabled("events_manage"))return;if(!confirm(`Excluir o evento ${item.title}?`))return;try{await deleteDoc(doc(db,"events",item.id));await audit("evento excluído",`${item.title} · ${item.date}`);closeCalendarEventModal();toast("Evento excluído.")}catch(error){toast(errMsg(error))}});









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
let loginCustomizationDirty=false;

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
  if(candidate.startsWith("blob:"))return candidate;
  if(candidate.startsWith("data:"))return safeImageUrl(candidate);
  if(/^https:/i.test(candidate))return safeExternalUrl(candidate);
  if(/^[a-z][a-z0-9+.-]*:/i.test(candidate))return "";
  try{const resolved=new URL(candidate,document.baseURI);return resolved.origin===location.origin?resolved.href:""}catch{return ""}
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
function loadLoginCustomizationForm(force=false){
  if(loginCustomizationDirty&&!force)return;
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
on("loginBackgroundFile","change",async event=>{try{const file=event.target.files?.[0];if(!file)return;pendingLoginBackground=await optimizeLoginImage(file,"background");loginCustomizationDirty=true;removeLoginBackgroundRequested=false;revokePreview(loginBackgroundPreviewUrl);loginBackgroundPreviewUrl=URL.createObjectURL(pendingLoginBackground.blob);const el=byId("loginBackgroundPreview");if(el)el.style.backgroundImage=`url("${loginBackgroundPreviewUrl}")`;refreshLoginCustomizationPreview();setText("loginCustomizationStatus",`Fundo ajustado para ${pendingLoginBackground.width} × ${pendingLoginBackground.height}. Clique em Salvar alterações.`)}catch(error){toast(error.message)}});
on("loginLogoFile","change",async event=>{try{const file=event.target.files?.[0];if(!file)return;pendingLoginLogo=await optimizeLoginImage(file,"logo");loginCustomizationDirty=true;removeLoginLogoRequested=false;revokePreview(loginLogoPreviewUrl);loginLogoPreviewUrl=URL.createObjectURL(pendingLoginLogo.blob);const el=byId("loginLogoPreview");if(el)el.src=loginLogoPreviewUrl;refreshLoginCustomizationPreview();setText("loginCustomizationStatus",`Imagem do topo ajustada para ${pendingLoginLogo.width} × ${pendingLoginLogo.height}. Clique em Salvar alterações.`)}catch(error){toast(error.message)}});
on("loginBackgroundPosition","change",()=>{loginCustomizationDirty=true;refreshLoginCustomizationPreview()});on("loginLogoWidth","change",()=>{loginCustomizationDirty=true;refreshLoginCustomizationPreview()});on("refreshLoginPreview","click",()=>{refreshLoginCustomizationPreview();toast("Prévia atualizada.")});
on("removeLoginBackground","click",()=>{pendingLoginBackground=null;loginCustomizationDirty=true;removeLoginBackgroundRequested=true;revokePreview(loginBackgroundPreviewUrl);loginBackgroundPreviewUrl="";const el=byId("loginBackgroundPreview");if(el)el.style.backgroundImage=`url("${LOGIN_DEFAULTS.backgroundUrl}")`;refreshLoginCustomizationPreview();setText("loginCustomizationStatus","O fundo padrão será restaurado ao salvar.")});
on("removeLoginLogo","click",()=>{pendingLoginLogo=null;loginCustomizationDirty=true;removeLoginLogoRequested=true;revokePreview(loginLogoPreviewUrl);loginLogoPreviewUrl="";const el=byId("loginLogoPreview");if(el)el.src=LOGIN_DEFAULTS.logoUrl;refreshLoginCustomizationPreview();setText("loginCustomizationStatus","A logo padrão será restaurada ao salvar.")});
async function uploadLoginAsset(processed,type){
  const path=`login-customization/${type}-${Date.now()}.${processed.extension}`;
  const ref=storageRef(storage,path);const snap=await uploadBytes(ref,processed.blob,{contentType:processed.mime,cacheControl:"public,max-age=3600"});
  return {url:await getDownloadURL(snap.ref),path};
}
on("saveLoginCustomization","click",async()=>{
  if(!permissionEnabled("login_customize"))return toast("Sem permissão para personalizar a tela de login.");
  const button=byId("saveLoginCustomization");if(button)button.disabled=true;
  const uploadedPaths=[];
  try{
    const previous=loginCustomization();
    const next={...previous,backgroundPosition:byId("loginBackgroundPosition")?.value||LOGIN_DEFAULTS.backgroundPosition,logoWidth:Number(byId("loginLogoWidth")?.value)||LOGIN_DEFAULTS.logoWidth,updatedAt:new Date().toISOString(),updatedBy:state.user.uid};
    if(pendingLoginBackground){const asset=await uploadLoginAsset(pendingLoginBackground,"background");uploadedPaths.push(asset.path);next.backgroundUrl=asset.url;next.backgroundPath=asset.path}
    else if(removeLoginBackgroundRequested){delete next.backgroundUrl;delete next.backgroundPath}
    if(pendingLoginLogo){const asset=await uploadLoginAsset(pendingLoginLogo,"logo");uploadedPaths.push(asset.path);next.logoUrl=asset.url;next.logoPath=asset.path}
    else if(removeLoginLogoRequested){delete next.logoUrl;delete next.logoPath}
    await setDoc(doc(db,"settings","app"),{loginCustomization:next},{merge:true});
    const oldPaths=[];if((pendingLoginBackground||removeLoginBackgroundRequested)&&previous.backgroundPath&&previous.backgroundPath!==next.backgroundPath)oldPaths.push(previous.backgroundPath);if((pendingLoginLogo||removeLoginLogoRequested)&&previous.logoPath&&previous.logoPath!==next.logoPath)oldPaths.push(previous.logoPath);
    await Promise.all(oldPaths.map(async path=>{try{await deleteObject(storageRef(storage,path))}catch(error){console.warn("Imagem anterior não removida:",error)}}));
    state.settings={...state.settings,loginCustomization:next};cacheLoginCustomization(next);pendingLoginBackground=pendingLoginLogo=null;removeLoginBackgroundRequested=removeLoginLogoRequested=false;loginCustomizationDirty=false;revokePreview(loginBackgroundPreviewUrl);revokePreview(loginLogoPreviewUrl);loginBackgroundPreviewUrl=loginLogoPreviewUrl="";applyLoginCustomization();loadLoginCustomizationForm(true);await audit("personalização do login atualizada","Fundo e/ou imagem do topo modificados");toast("Tela de login atualizada com sucesso.");setText("loginCustomizationStatus","Alterações publicadas e aplicadas automaticamente.")
  }catch(error){await Promise.all(uploadedPaths.map(async path=>{try{await deleteObject(storageRef(storage,path))}catch{}}));toast(errMsg(error));setText("loginCustomizationStatus",`Falha ao salvar: ${error.message||error}`)}finally{if(button)button.disabled=false}
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

async function ensureCurrentAppShell(){
  const marker="77team-app-shell-version";
  const current="22.9.32-profilev6";
  try{
    const previous=localStorage.getItem(marker);
    if(previous===current)return;
    if("caches" in window){
      const keys=await caches.keys();
      await Promise.all(keys.filter(k=>k.startsWith("77-team-manager-")).map(k=>caches.delete(k)));
    }
    localStorage.setItem(marker,current);
  }catch(_error){}
}

ensureCurrentAppShell();
if("serviceWorker" in navigator)window.addEventListener("load",()=>navigator.serviceWorker.register("./service-worker.js?v=22.9.32-profilev6").catch(error=>console.warn("Service Worker indisponível:",error)));

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
    ?matches.map(member=>`<button type="button" data-search-member="${escapeHtml(member.id)}">
        <span class="member-avatar">${escapeHtml((member.name||"?").slice(0,1).toUpperCase())}</span>
        <span><strong>${escapeHtml(member.name)}</strong><small>${escapeHtml(member.role||"Membro")} · ${escapeHtml(member.clan||"Sem clã")}</small></span>
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


function nicknameClaimKey(value){
  return String(value||"").trim().toLowerCase();
}
function nicknameValidationError(value){
  const name=String(value||"").trim();
  if(name.length<2||name.length>30)return "O nickname precisa ter entre 2 e 30 caracteres.";
  if(name.includes("/")||name==="."||name==="..")return "O nickname contém um caractere não permitido.";
  return "";
}
let nicknameClaimMigrationTimer=null,nicknameClaimMigrationRunning=false,nicknameClaimMigrationCompleted=false;
function scheduleNicknameClaimMigration(){
  if(!owner()||nicknameClaimMigrationCompleted)return;
  clearTimeout(nicknameClaimMigrationTimer);
  nicknameClaimMigrationTimer=setTimeout(migrateExistingNicknameClaims,900);
}
async function migrateExistingNicknameClaims(){
  if(!owner()||nicknameClaimMigrationRunning||nicknameClaimMigrationCompleted||!state.usersLoaded||!state.membersLoaded)return;
  nicknameClaimMigrationRunning=true;
  let migrated=0,conflicts=0,removed=0;
  try{
    const existingClaims=await getDocs(collection(db,"nicknameClaims"));
    const expectedKeys=new Map(state.users.filter(user=>user.active===true&&String(user.status||"approved")==="approved"&&!nicknameValidationError(user.name)).map(user=>[user.id,nicknameClaimKey(user.name)]));
    const staleClaims=existingClaims.docs.filter(item=>item.data()?.active===false||expectedKeys.get(item.data()?.uid)!==item.id||item.data()?.normalizedKey!==item.id||nicknameClaimKey(item.data()?.name)!==item.id);
    for(let index=0;index<staleClaims.length;index+=350){const batch=writeBatch(db);staleClaims.slice(index,index+350).forEach(item=>batch.delete(item.ref));await batch.commit();removed+=Math.min(350,staleClaims.length-index)}
    for(const user of state.users){
      const name=String(user.name||"").trim(),key=nicknameClaimKey(name);
      if(user.active!==true||String(user.status||"approved")!=="approved"||nicknameValidationError(name))continue;
      const member=state.members.find(item=>item.userId===user.id||item.id===user.id)||null;
      try{
        await runTransaction(db,async transaction=>{
          const claimRef=doc(db,"nicknameClaims",key),claim=await transaction.get(claimRef);
          if(claim.exists()&&claim.data()?.active!==false&&claim.data()?.uid!==user.id)throw new Error("nickname-conflict");
          const memberDocumentId=member?.id||"";
          const claimData=claim.data()||{};
          const claimCurrent=claim.exists()&&claimData.active!==false&&claimData.uid===user.id&&claimData.memberId===memberDocumentId&&claimData.name===name&&claimData.normalizedKey===key;
          if(!claimCurrent)transaction.set(claimRef,{uid:user.id,memberId:memberDocumentId,name,normalizedKey:key,active:true,updatedAt:serverTimestamp()},{merge:true});
          if(user.nicknameClaimKey!==key||String(user.memberDocumentId||"")!==memberDocumentId)transaction.update(doc(db,"users",user.id),{nicknameClaimKey:key,memberDocumentId,updatedAt:serverTimestamp()});
        });
        migrated++;
      }catch(error){if(error?.message==="nickname-conflict")conflicts++;else throw error}
    }
    nicknameClaimMigrationCompleted=conflicts===0;
    if(migrated||conflicts||removed)await audit("reservas de nickname migradas",`${migrated} vinculadas · ${removed} inválida(s) removida(s) · ${conflicts} conflito(s)`);
    if(conflicts)toast(`${conflicts} nickname(s) duplicado(s) precisam ser alterados. As demais reservas foram reconciliadas.`);
  }catch(error){console.error("Falha ao migrar reservas de nickname:",error)}
  finally{nicknameClaimMigrationRunning=false}
}
function currentMemberRecord(){
  if(!state.user)return null;
  const linked=state.members.find(member=>member.userId===state.user.uid||member.id===state.user.uid);
  if(linked)return linked;
  const profileName=String(state.profile?.name||"").trim().toLowerCase();
  if(!profileName)return null;
  const legacyMatches=state.members.filter(member=>String(member.name||"").trim().toLowerCase()===profileName);
  return legacyMatches.length===1?legacyMatches[0]:null;
}
function renderOwnProfile(){
  if(!state.user||!state.profile)return;

  const member=currentMemberRecord();
  const displayName=state.profile.name||member?.name||state.profile.email||"Usuário";
  const role=member?.role||state.profile.memberRole||state.profile.role||"Membro";
  const accessRole=resolveAccessRole(state.profile);
  const clan=member?.clan||state.profile.clan||"Sem clã";
  const avatar=safeImageUrl(state.profile.avatarDataUrl);
  const character=state.profile.character||{};
  const stat=stats(member);
  const progression=progressionFor(member,state.profile);
  const medals=member?memberMedals(member):[];
  const rankingPosition=profileRankingPosition(member);
  const eventCount=member?state.attendance.filter(item=>(item.status===1||item.status===2)&&item.kind==="eventos"&&attendanceMatchesMember(item,member)).length:0;
  const points=progression.totalXp;

  setText("profileDisplayName",displayName);
  setText("profileEmail",state.profile.email||state.user.email||"—");
  setText("profileCharacterClass",character.className||"Classe não informada");
  setText("profileCharacterClan",clan);
  setText("profileLevel",`Nível ${progression.level}`);
  setText("profileNextLevel",`${progression.currentXp}/${progression.requiredXp} XP`);
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
  setHtml("profileRoleBadge",roleBadge(["dev","leadership","staff"].includes(accessRole)?accessRole:role));
  setHtml("profileMedals",medals.length?medals.map(item=>`<span>${item}</span>`).join(""):"Nenhuma medalha ainda.");

  const progressFill=byId("profileProgressFill");
  if(progressFill)progressFill.style.width=`${progression.progress}%`;

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
    .filter(item=>member&&attendanceMatchesMember(item,member))
    .sort((a,b)=>String(b.date||"").localeCompare(String(a.date||"")))
    .slice(0,20);

  setHtml("profileHistoryRows",history.map(item=>`<tr>
    <td>${escapeHtml(formatHistoryDate(item.date))}</td>
    <td>${escapeHtml(presenceTypeLabel(item.kind))}</td>
    <td>${escapeHtml(item.slot||"—")}</td>
    <td>${attendanceStatusLabel(item.status)}</td>
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
  if(!state.user)return;
  if(state.settings?.team?.allowNickname===false)return toast("A alteração de perfil foi desativada pelo DEV.");
  const name=(byId("profileNicknameInput")?.value||"").trim();
  const displayName=(byId("profileDisplayNameInput")?.value||name).trim();
  const discord=(byId("profileDiscordInput")?.value||"").trim();
  const whatsapp=(byId("profileWhatsappInput")?.value||"").trim();
  const birthDate=byId("profileBirthDateInput")?.value||"";
  const bio=(byId("profileBioInput")?.value||"").trim();
  const nicknameError=nicknameValidationError(name);if(nicknameError)return toast(nicknameError);
  if(displayName.length<2)return toast("O nome de exibição precisa ter pelo menos 2 caracteres.");
  const member=currentMemberRecord();
  if(visibleMembers().some(item=>item.id!==member?.id&&String(item.name||"").toLowerCase()===name.toLowerCase()))return toast("Este nickname já está sendo usado por outro membro.");
  try{
    const memberDocumentId=member?.id||String(state.profile?.memberDocumentId||"");
    const payload={name,displayName,discord,whatsapp,birthDate,bio,nicknameClaimKey:nicknameClaimKey(name),memberDocumentId,updatedAt:serverTimestamp()};
    const newClaimKey=nicknameClaimKey(name),oldClaimKey=nicknameClaimKey(state.profile?.name||"");
    await runTransaction(db,async transaction=>{
      const claimRef=doc(db,"nicknameClaims",newClaimKey);
      const oldClaimRef=oldClaimKey&&oldClaimKey!==newClaimKey?doc(db,"nicknameClaims",oldClaimKey):null;
      const oldClaimSnapshot=oldClaimRef?await transaction.get(oldClaimRef):null;
      const claimSnapshot=await transaction.get(claimRef);
      if(claimSnapshot.exists()&&claimSnapshot.data()?.active!==false&&claimSnapshot.data()?.uid!==state.user.uid)throw new Error("Este nickname já está sendo usado por outro membro.");
      const claimAlreadyCurrent=claimSnapshot.exists()&&claimSnapshot.data()?.active!==false&&claimSnapshot.data()?.uid===state.user.uid&&nicknameClaimKey(claimSnapshot.data()?.name)===newClaimKey;
      if(!claimAlreadyCurrent)transaction.set(claimRef,{uid:state.user.uid,memberId:memberDocumentId,name,normalizedKey:newClaimKey,active:true,updatedAt:serverTimestamp()});
      if(oldClaimRef&&oldClaimSnapshot?.exists()&&oldClaimSnapshot.data()?.active!==false&&oldClaimSnapshot.data()?.uid===state.user.uid)transaction.update(oldClaimRef,{active:false,updatedAt:serverTimestamp()});
      transaction.update(doc(db,"users",state.user.uid),payload);
      if(member)transaction.update(doc(db,"members",member.id),{name,updatedAt:serverTimestamp()});
    });
    Object.assign(state.profile,{name,displayName,discord,whatsapp,birthDate,bio,nicknameClaimKey:newClaimKey,memberDocumentId});
    if(member)member.name=name;
    applyPermissions();updateFirstAccessUI();renderOwnProfile();renderCharacterProfile();renderCharactersTable();renderCharacterCenter();renderHistoryCenter();renderGoals();renderSystemHealth();renderStaffCommandCenter();applyRestrictedVisibility();
    toast("Perfil completo atualizado.");
  }catch(error){
    console.error("Falha ao salvar o próprio perfil:",error);
    toast(error?.code==="permission-denied"
      ? "Permissão negada ao salvar o perfil. Confira Cargos e Permissões e a sessão atual do usuário."
      : (error.message||"Não foi possível atualizar o perfil."));
  }
});
on("profileAvatarForm","submit",async event=>{
  event.preventDefault();
  if(state.settings?.team?.allowAvatar===false)return toast("A troca de avatar foi desativada pelo DEV.");

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
  if(state.settings?.team?.allowAvatar===false)return toast("A troca de avatar foi desativada pelo DEV.");
  try{
    await updateDoc(doc(db,"users",state.user.uid),{avatarDataUrl:"",updatedAt:serverTimestamp()});
    state.profile.avatarDataUrl="";renderOwnProfile();renderCharacterProfile();renderCharactersTable();renderCharacterCenter();renderHistoryCenter();renderGoals();renderSystemHealth();renderStaffCommandCenter();applyRestrictedVisibility();toast("Avatar removido.");
  }catch(error){toast(error.message||"Não foi possível remover o avatar.")}
});
on("profilePasswordForm","submit",async event=>{
  event.preventDefault();
  if(state.settings?.team?.allowPassword===false)return toast("A alteração de e-mail e senha foi desativada pelo DEV.");
  if(!auth.currentUser)return toast("Entre novamente para alterar a segurança.");
  const newEmail=(byId("profileEmailInput")?.value||"").trim().toLowerCase();
  const currentPassword=byId("profileCurrentPassword")?.value||"";
  const password=byId("profileNewPassword")?.value||"";
  const confirm=byId("profileConfirmPassword")?.value||"";
  const emailChanged=newEmail&&newEmail!==String(auth.currentUser.email||"").toLowerCase();
  const previousEmail=String(auth.currentUser.email||"").toLowerCase();
  if(!emailChanged&&!password)return toast("Nenhuma alteração informada.");
  if((emailChanged||password)&&currentPassword.length<6)return toast("Informe sua senha atual.");
  if(password&&password.length<8)return toast("A nova senha precisa ter pelo menos 8 caracteres.");
  if(password!==confirm)return toast("As senhas não conferem.");
  let emailCommitted=false;
  try{
    const credential=EmailAuthProvider.credential(auth.currentUser.email,currentPassword);
    await reauthenticateWithCredential(auth.currentUser,credential);
    if(emailChanged){
      await updateEmail(auth.currentUser,newEmail);
      try{await updateDoc(doc(db,"users",state.user.uid),{email:newEmail,updatedAt:serverTimestamp()})}
      catch(error){try{await updateEmail(auth.currentUser,previousEmail)}catch{}throw error}
      state.profile.email=newEmail;
      emailCommitted=true;
    }
    if(password)await updatePassword(auth.currentUser,password);
    event.target.reset();
    setValue("profileEmailInput",auth.currentUser.email||state.profile.email||"");
    renderOwnProfile();
    toast(emailChanged&&password?"E-mail e senha atualizados.":emailChanged?"E-mail atualizado.":"Senha atualizada.");
  }catch(error){
    const messages={"auth/wrong-password":"Senha atual incorreta.","auth/invalid-credential":"Senha atual incorreta.","auth/email-already-in-use":"Este e-mail já está em uso.","auth/invalid-email":"Informe um e-mail válido."};
    toast(emailCommitted?`O e-mail foi atualizado, mas a senha não pôde ser alterada: ${messages[error?.code]||errMsg(error)}`:messages[error?.code]||errMsg(error));
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
  STAFF_PAGES.forEach(page=>{
    const allowed=canOpenPage(page);
    const section=byId(page);
    if(section)section.classList.toggle("hidden",!allowed);
    document.querySelectorAll(`[data-page="${page}"],[data-page-jump="${page}"]`)
      .forEach(button=>button.classList.toggle("hidden",!allowed));
  });
  const staffAreaAllowed=permissionEnabled("access_staff");
  document.querySelectorAll('[data-category="staff"]').forEach(button=>button.classList.toggle("hidden",!staffAreaAllowed));
  document.querySelectorAll(".attendance-private")
    .forEach(element=>element.classList.toggle("hidden",!staffAreaAllowed));
}


function renderRolePermissionMatrix(){
  const host=byId("rolePermissionMatrix");
  if(!host)return;
  if(rolePermissionsDirty&&host.children.length){updateRolePermissionSummary();return;}
  const roles=["dev","leadership","staff","member"];
  const configured=configuredRolePermissions();
  let currentGroup="";
  host.innerHTML=ROLE_PERMISSION_DEFINITIONS.map(item=>{
    const groupRow=item.group!==currentGroup?`<tr class="permission-group-row"><th colspan="5"><span>${escapeHtml(item.group)}</span><span class="permission-group-actions"><button class="btn mini" data-permission-group-all="${escapeHtml(item.group)}" type="button">Marcar grupo</button><button class="btn mini" data-permission-group-none="${escapeHtml(item.group)}" type="button">Limpar grupo</button></span></th></tr>`:"";
    currentGroup=item.group;
    const cells=roles.map(role=>{
      const allowed=permissionRoleAllowed(item.key,role),required=permissionRequired(item.key,role),checked=required?true:(allowed&&(configured?.[item.key]?.[role] ?? item.defaults[role]));
      const title=!allowed?`${accessRoleLabel(role)}: bloqueado pela hierarquia`:required?`${accessRoleLabel(role)}: acesso mínimo obrigatório`:accessRoleLabel(role);
      return `<td><label class="permission-switch" title="${escapeHtml(title)}"><input data-role-permission="${item.key}" data-permission-role="${role}" type="checkbox" ${checked?"checked":""} ${required||!allowed?"disabled":""}><span></span></label></td>`;
    }).join("");
    const locked=roles.slice(1).every(role=>!permissionRoleAllowed(item.key,role));
    return `${groupRow}<tr class="${locked?"permission-locked":""}" data-permission-row data-search="${escapeHtml((item.group+" "+item.label+" "+item.key).toLowerCase())}" data-permission-group="${escapeHtml(item.group)}"><th><strong>${escapeHtml(item.label)}</strong><small>${escapeHtml(item.key)}</small></th>${cells}</tr>`;
  }).join("");
  updateRolePermissionSummary();
  updateRolePermissionControls();
}
function updateRolePermissionSummary(){
  const host=byId("rolePermissionSummary");if(!host)return;
  const roles=["dev","leadership","staff","member"];
  host.innerHTML=roles.map(role=>{const inputs=[...document.querySelectorAll(`[data-permission-role="${role}"]`)],enabled=role==="dev"?ROLE_PERMISSION_DEFINITIONS.length:inputs.filter(input=>input.checked&&!input.disabled).length,available=role==="dev"?ROLE_PERMISSION_DEFINITIONS.length:inputs.filter(input=>!input.disabled).length;return `<article><strong>${escapeHtml(accessRoleLabel(role))}</strong><span>${enabled} de ${available} permissões ativas</span></article>`}).join("");
}
function updateRolePermissionControls(){const button=byId("saveRolePermissions");if(button)button.disabled=!rolePermissionsDirty}
function markRolePermissionsDirty(){rolePermissionsDirty=true;const status=byId("rolePermissionStatus");if(status){status.textContent="Alterações pendentes. Clique em Salvar permissões.";status.classList.add("permission-status-dirty");status.classList.remove("permission-status-saved")}updateRolePermissionSummary();updateRolePermissionControls()}
function collectRolePermissions(){
  const result=defaultRolePermissions();
  document.querySelectorAll("[data-role-permission]").forEach(input=>{
    const key=input.dataset.rolePermission, role=input.dataset.permissionRole;
    if(result[key])result[key][role]=permissionRequired(key,role)|| (permissionRoleAllowed(key,role)&&input.checked);
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
    setText("rolePermissionStatus","Salvo no Firebase · aplicado em tempo real.");
    byId("rolePermissionStatus")?.classList.remove("permission-status-dirty");byId("rolePermissionStatus")?.classList.add("permission-status-saved");
    rolePermissionsDirty=false;
    await audit("permissões de cargos atualizadas",`${Object.values(rolePermissions).reduce((sum,roles)=>sum+Object.values(roles).filter(Boolean).length,0)} permissões ativas`);
    applyPermissions();render();schedulePermissionRuntimeRefresh();
    toast("Matriz salva no Firebase e aplicada em tempo real para todos os cargos.");
  }catch(error){toast(errMsg(error));setText("rolePermissionStatus","Não foi possível salvar.");}
  finally{updateRolePermissionControls();}
}

function numberOrZero(value){
  const number=Number(value);
  return Number.isFinite(number)&&number>=0?number:0;
}
function validateConfiguredCharacter(character){
  const cfg=state.settings?.characters||{},classes=(cfg.classes||[]).map(item=>String(item).trim().toLowerCase()).filter(Boolean);
  if(classes.length&&!classes.includes(String(character.className||"").toLowerCase()))return `Classe não permitida. Use: ${(cfg.classes||[]).join(", ")}.`;
  const limits={power:Number(cfg.maxPower??999999999),level:Number(cfg.maxLevel??999),codex:Number(cfg.maxCodex??9999),mandalla:Number(cfg.maxMandalla??9999),chi1:Number(cfg.maxChi??9999),chi2:Number(cfg.maxChi??9999),chi3:Number(cfg.maxChi??9999),wildernessTraining:Number(cfg.maxWilderness??9999)};
  for(const [field,limit] of Object.entries(limits))if(Number(character[field]||0)>limit)return `${field} excede o limite configurado (${limit}).`;
  return "";
}

function currentCharacterData(){
  return state.profile?.character||{};
}

function renderCharacterProfile(){
  if(!state.profile)return;

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
      <td><strong>${escapeHtml(item.nickname)}</strong></td>
      <td>${escapeHtml(c.className||"—")}</td>
      <td>${escapeHtml(c.power?? 0)}</td>
      <td>${escapeHtml(c.level?? 0)}</td>
      <td>${escapeHtml(c.codex?? 0)}</td>
      <td>${escapeHtml(c.mandalla?? 0)}</td>
      <td>${escapeHtml(c.chi1?? 0)}</td>
      <td>${escapeHtml(c.chi2?? 0)}</td>
      <td>${escapeHtml(c.chi3?? 0)}</td>
      <td>${escapeHtml(c.frogPosture?? 0)}</td>
      <td>${escapeHtml(c.constitution?? 0)}</td>
      <td>${escapeHtml(c.wildernessTraining?? 0)}</td>
    </tr>`;
  }).join("")||'<tr><td colspan="12">Nenhum personagem cadastrado.</td></tr>';
}

on("characterForm","submit",async event=>{
  event.preventDefault();

  if(!state.user)return;

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
  const characterError=validateConfiguredCharacter(character);if(characterError)return toast(characterError);

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
      ? "Permissão negada ao salvar o personagem. Confira Cargos e Permissões e a sessão atual do usuário."
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
  const ranking=visibleMembers()
    .slice()
    .sort((a,b)=>progressionFor(b).totalXp-progressionFor(a).totalXp||String(a.name||"").localeCompare(String(b.name||""),"pt-BR"));
  const index=ranking.findIndex(item=>item.id===member.id);
  return index>=0?index+1:0;
}

function renderProfileTimeline(history){
  const timeline=byId("profileTimeline");
  if(!timeline)return;

  timeline.innerHTML=history.map(item=>`
    <article class="timeline-item ${attendanceStatusClass(item.status)}">
      <div class="timeline-dot">${attendanceStatusIcon(item.status)}</div>
      <div>
        <strong>${escapeHtml(item.kind||"Atividade")} · ${escapeHtml(item.slot||"—")}</strong>
        <p>${attendanceStatusLabel(item.status)}</p>
        <small>${escapeHtml(formatHistoryDate(item.date))}</small>
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
      const stat=stats(member);
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
    select.innerHTML=`<option value="">${escapeHtml(placeholder)}</option>`+
      values.map(value=>`<option value="${escapeHtml(value)}">${escapeHtml(value)}</option>`).join("");
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
  const avatar=safeImageUrl(item.avatar);
  if(avatar){
    return `<img src="${escapeHtml(avatar)}" alt="${escapeHtml(item.nickname)}">`;
  }
  return `<span>${escapeHtml(item.nickname.slice(0,1).toUpperCase())}</span>`;
}

function canDeleteCharacter(item){
  if(!item||!state.user||!permissionEnabled("character_delete"))return false;
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
          <h3>${escapeHtml(item.nickname)}</h3>
          <p>${escapeHtml(c.className||"Classe não informada")} · ${escapeHtml(item.role)}</p>
          <small>${escapeHtml(item.clan)}</small>
        </div>
      </div>
      <div class="character-card-main-stats">
        <div><span>Power</span><strong>${Number(c.power||0).toLocaleString("pt-BR")}</strong></div>
        <div><span>Level</span><strong>${escapeHtml(c.level|| 0)}</strong></div>
        <div><span>Codex</span><strong>${escapeHtml(c.codex|| 0)}</strong></div>
      </div>
      <div class="character-card-actions">
        <button class="btn primary" data-character-details="${escapeHtml(item.id)}" type="button">Ver detalhes</button>
        <button class="btn" data-character-pdf="${escapeHtml(item.id)}" type="button">Gerar PDF</button>
        ${permissionEnabled("character_edit")?`<button class="btn character-edit-btn" data-character-edit="${escapeHtml(item.id)}" type="button">✏️ Editar</button>`:""}
        ${canDeleteCharacter(item)?`<button class="btn danger" data-character-delete="${escapeHtml(item.id)}" type="button">🗑 Excluir</button>`:""}
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
      <td><strong>${escapeHtml(item.nickname)}</strong></td>
      <td>${escapeHtml(c.className||"—")}</td>
      <td>${escapeHtml(item.role)}</td>
      <td>${escapeHtml(item.clan)}</td>
      <td>${Number(c.power||0).toLocaleString("pt-BR")}</td>
      <td>${escapeHtml(c.level|| 0)}</td>
      <td>${escapeHtml(c.codex|| 0)}</td>
      <td>${escapeHtml(c.mandalla|| 0)}</td>
      <td>${escapeHtml(c.chi1|| 0)}</td>
      <td>${escapeHtml(c.chi2|| 0)}</td>
      <td>${escapeHtml(c.chi3|| 0)}</td>
      <td>${escapeHtml(c.frogPosture|| 0)}</td>
      <td>${escapeHtml(c.constitution|| 0)}</td>
      <td>${escapeHtml(c.wildernessTraining|| 0)}</td>
      <td>
        <button class="btn" data-character-details="${escapeHtml(item.id)}" type="button">Detalhes</button>
        <button class="btn" data-character-pdf="${escapeHtml(item.id)}" type="button">PDF</button>
        ${permissionEnabled("character_edit")?`<button class="btn" data-character-edit="${escapeHtml(item.id)}" type="button">Editar</button>`:""}
        ${canDeleteCharacter(item)?`<button class="btn danger" data-character-delete="${escapeHtml(item.id)}" type="button">Excluir</button>`:""}
      </td>
    </tr>`;
  }).join("")||'<tr><td colspan="15">Nenhum personagem encontrado.</td></tr>';
}

function renderCharacterCenter(){
  if(!permissionEnabled("character_view"))return;
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
    <h2>${escapeHtml(item.nickname)}</h2>
    <p>${escapeHtml(c.className||"Classe não informada")} · ${escapeHtml(item.role)}</p>
    <small>${escapeHtml(item.clan)}</small>
  </div>
  <div class="character-drawer-highlight">
    <div><span>Power</span><strong>${Number(c.power||0).toLocaleString("pt-BR")}</strong></div>
    <div><span>Level</span><strong>${escapeHtml(c.level|| 0)}</strong></div>
    <div><span>Taxa</span><strong>${escapeHtml(item.stat.rate|| 0)}%</strong></div>
  </div>
  <div class="character-drawer-grid">
    <div><span>Codex</span><strong>${escapeHtml(c.codex|| 0)}</strong></div>
    <div><span>Mandalla</span><strong>${escapeHtml(c.mandalla|| 0)}</strong></div>
    <div><span>Chi 1</span><strong>${escapeHtml(c.chi1|| 0)}</strong></div>
    <div><span>Chi 2</span><strong>${escapeHtml(c.chi2|| 0)}</strong></div>
    <div><span>Chi 3</span><strong>${escapeHtml(c.chi3|| 0)}</strong></div>
    <div><span>Postura do Sapo</span><strong>${escapeHtml(c.frogPosture|| 0)}</strong></div>
    <div><span>Constituição</span><strong>${escapeHtml(c.constitution|| 0)}</strong></div>
    <div><span>Treino Ermo</span><strong>${escapeHtml(c.wildernessTraining|| 0)}</strong></div>
    <div><span>Presenças</span><strong>${escapeHtml(item.stat.present|| 0)}</strong></div>
    <div><span>Ausências</span><strong>${escapeHtml(item.stat.absent|| 0)}</strong></div>
  </div>
  <button class="btn primary full" data-character-pdf="${escapeHtml(item.id)}" type="button">Gerar PDF individual</button>`;

  byId("characterDetailsDrawer")?.classList.remove("hidden");
}

function openResponsibleCharacterEditor(item){
  if(!permissionEnabled("character_edit")||!item)return;
  state.editingCharacterUserId=item.id;
  const c=item.character||{};
  setText("responsibleCharacterName",item.nickname||"Personagem");
  const roleSelect=byId("responsibleCharacterRole");
  const roleOptions=characterEditorCargoOptions(item);
  if(roleSelect){
    const currentCargo=characterEditorSelectedCargo(item);
    roleSelect.innerHTML=(roleOptions.length?roleOptions:[{value:currentCargo,label:item.role||accessRoleLabel(resolveAccessRole(state.users.find(row=>row.id===item.id)||{}))}])
      .map(option=>`<option value="${escapeHtml(option.value)}">${escapeHtml(option.label)}</option>`).join("");
    roleSelect.value=currentCargo;
    roleSelect.disabled=!roleOptions.length;
    roleSelect.title=roleOptions.length?"Alterar cargo":"Seu cargo não possui permissão para alterar cargos";
  }
  const clanSelect=byId("responsibleCharacterClan");
  if(clanSelect){
    const currentClan=item.clan==="Sem clã"?"":item.clan||"";
    clanSelect.innerHTML=`<option value="">Sem clã</option>${CLANS.map(clan=>`<option value="${escapeHtml(clan)}">${escapeHtml(clan)}</option>`).join("")}`;
    clanSelect.value=currentClan;
    const targetUser=state.users.find(row=>row.id===item.id);
    const targetMember=state.members.find(row=>row.userId===item.id||row.id===item.id||row.name===item.nickname)||{accessRole:targetUser?.accessRole,role:targetUser?.memberRole,userId:item.id};
    const canClan=currentAccessRole()==="dev"||canChangeMemberClan(targetMember);
    clanSelect.disabled=!canClan;
    clanSelect.title=canClan?"Alterar clã":"Seu cargo não possui permissão para alterar o clã deste personagem";
  }
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
  if(!permissionEnabled("character_edit")||!state.editingCharacterUserId)return;
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
  const characterError=validateConfiguredCharacter(character);if(characterError)return toast(characterError);
  if(!character.className){toast("Informe a classe do personagem.");return;}
  const user=state.users.find(item=>item.id===target.id);
  if(!user)return toast("Conta vinculada ao personagem não encontrada.");
  const member=state.members.find(item=>item.userId===target.id||item.id===target.id||item.name===target.nickname);
  const roleSelect=byId("responsibleCharacterRole");
  const clanSelect=byId("responsibleCharacterClan");
  const currentAccess=resolveAccessRole(user);
  const currentMemberRole=member?.role||user.memberRole||"Membros";
  const selectedRole=roleSelect?.disabled?characterEditorSelectedCargo(target):String(roleSelect?.value||characterEditorSelectedCargo(target));
  const nextAccess=selectedRole.startsWith("member:")?"member":selectedRole;
  const nextMemberRole=selectedRole.startsWith("member:")?selectedRole.slice(7):memberRoleFromAccessRole(nextAccess,currentMemberRole);
  const nextClan=clanSelect?.disabled?(member?.clan||user.clan||""):String(clanSelect?.value||"");
  if(nextClan&&!CLANS.includes(nextClan))return toast("Clã inválido.");
  const roleChanged=currentAccess!==nextAccess||(nextAccess==="member"&&currentMemberRole!==nextMemberRole);
  const clanChanged=(member?.clan||user.clan||"")!==nextClan;
  if(roleChanged&&!characterEditorCargoOptions(target).some(option=>option.value===selectedRole))return toast("Cargo inválido para o seu nível de acesso.");
  if(!confirm(`Salvar as alterações do personagem de ${target.nickname}?`))return;
  try{
    // Salva personagem e clã antes do cargo. Isso mantém o fluxo seguro inclusive
    // quando o DEV altera o próprio cargo e deixa de ser DEV ao final da operação.
    await updateDoc(doc(db,"users",target.id),{
      character,
      characterUpdatedAt:serverTimestamp(),
      characterUpdatedBy:state.user.uid
    });
    user.character=character;
    if(clanChanged){
      const clanPayload={clan:nextClan,clanUpdatedAt:serverTimestamp(),clanUpdatedBy:state.user.uid,updatedAt:serverTimestamp()};
      await updateDoc(doc(db,"users",target.id),clanPayload);
      user.clan=nextClan;
      if(member){await updateDoc(doc(db,"members",member.id),clanPayload);member.clan=nextClan;}
    }
    if(roleChanged){
      const rolePayload={role:nextAccess,accessRole:nextAccess,memberRole:nextMemberRole,roleUpdatedAt:serverTimestamp(),roleUpdatedBy:state.user.uid,updatedAt:serverTimestamp()};
      const batch=writeBatch(db);
      batch.update(doc(db,"users",target.id),rolePayload);
      if(member)batch.set(doc(db,"members",member.id),{role:nextMemberRole,accessRole:nextAccess,memberRole:nextMemberRole,userId:target.id,updatedAt:serverTimestamp()},{merge:true});
      await batch.commit();
      Object.assign(user,rolePayload,{resolvedAccessRole:nextAccess});
      if(member)Object.assign(member,{role:nextMemberRole,accessRole:nextAccess,memberRole:nextMemberRole,userId:target.id});
    }
    if(target.id===state.user?.uid){
      Object.assign(state.profile,user);
      state.profile.character=character;
      state.profile.clan=nextClan;
      state.profile.resolvedAccessRole=nextAccess;
      applyPermissions();
      renderCharacterProfile();
    }
    renderCharacterCenter();
    renderCharactersTable();
    render();
    const changes=["personagem",roleChanged?`cargo → ${nextAccess==="member"?nextMemberRole:accessRoleLabel(nextAccess)}`:"",clanChanged?`clã → ${nextClan||"Sem clã"}`:""].filter(Boolean).join(" · ");
    await audit("Personagem editado por responsável",`${target.nickname} · ${changes}`);
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
      <td>${escapeHtml(item.nickname)}</td>
      <td>${escapeHtml(c.className||"—")}</td>
      <td>${escapeHtml(item.role)}</td>
      <td>${escapeHtml(item.clan)}</td>
      <td>${Number(c.power||0).toLocaleString("pt-BR")}</td>
      <td>${escapeHtml(c.level|| 0)}</td>
      <td>${escapeHtml(c.codex|| 0)}</td>
      <td>${escapeHtml(c.mandalla|| 0)}</td>
      <td>${escapeHtml(c.chi1|| 0)}</td>
      <td>${escapeHtml(c.chi2|| 0)}</td>
      <td>${escapeHtml(c.chi3|| 0)}</td>
      <td>${escapeHtml(c.frogPosture|| 0)}</td>
      <td>${escapeHtml(c.constitution|| 0)}</td>
      <td>${escapeHtml(c.wildernessTraining|| 0)}</td>
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
  <div class="actions"><button data-popup-print>Salvar como PDF</button></div>
  <div class="meta">Gerado em ${new Date().toLocaleString("pt-BR")} · ${rows.length} personagem(ns)</div>
  <table><thead><tr>
    <th>Nickname</th><th>Classe</th><th>Cargo</th><th>Clã</th><th>Power</th><th>Level</th>
    <th>Codex</th><th>Mandalla</th><th>Chi 1</th><th>Chi 2</th><th>Chi 3</th>
    <th>Postura</th><th>Constituição</th><th>Treino Ermo</th>
  </tr></thead><tbody>${body}</tbody></table>
  
  </body></html>`);
  finalizePrintWindow(popup);
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
  <title>Ficha - ${escapeHtml(item.nickname)}</title>
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
  <header><strong>77 TEAM MANAGER</strong><div class="name">${escapeHtml(item.nickname)}</div>
  <div class="subtitle">${escapeHtml(c.className||"Classe não informada")} · ${escapeHtml(item.role)} · ${escapeHtml(item.clan)}</div></header>
  <div class="actions"><button data-popup-print>Salvar como PDF</button></div>
  <div class="grid">
    <div class="box"><span>Power</span><strong>${Number(c.power||0).toLocaleString("pt-BR")}</strong></div>
    <div class="box"><span>Level</span><strong>${escapeHtml(c.level|| 0)}</strong></div>
    <div class="box"><span>Codex</span><strong>${escapeHtml(c.codex|| 0)}</strong></div>
    <div class="box"><span>Mandalla</span><strong>${escapeHtml(c.mandalla|| 0)}</strong></div>
    <div class="box"><span>Chi 1</span><strong>${escapeHtml(c.chi1|| 0)}</strong></div>
    <div class="box"><span>Chi 2</span><strong>${escapeHtml(c.chi2|| 0)}</strong></div>
    <div class="box"><span>Chi 3</span><strong>${escapeHtml(c.chi3|| 0)}</strong></div>
    <div class="box"><span>Postura do Sapo</span><strong>${escapeHtml(c.frogPosture|| 0)}</strong></div>
    <div class="box"><span>Constituição</span><strong>${escapeHtml(c.constitution|| 0)}</strong></div>
    <div class="box"><span>Treino Ermo</span><strong>${escapeHtml(c.wildernessTraining|| 0)}</strong></div>
    <div class="box"><span>Presenças</span><strong>${escapeHtml(item.stat.present|| 0)}</strong></div>
    <div class="box"><span>Taxa</span><strong>${escapeHtml(item.stat.rate|| 0)}%</strong></div>
  </div>
  <div class="signature">Assinatura da Staff</div>
  
  </body></html>`);
  finalizePrintWindow(popup);
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
    .filter(item=>Boolean(memberForAttendance(item)))
    .map(item=>{
      const member=memberForAttendance(item);
      return {
        id:item.id,
        activeMember:Boolean(member),
        date:item.date||"",
        memberId:member?.id||item.memberId||item.userId||"",
        memberName:member?.name||item.memberName||"—",
        role:member?.role||item.role||"Membro",
        clan:member?.clan||item.clan||"Sem clã",
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
      .map(value=>`<option value="${escapeHtml(value)}">${escapeHtml(value)}</option>`).join("");
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
      members.map(item=>`<option value="${escapeHtml(item.id)}">${escapeHtml(item.name)}</option>`).join("");
    if(members.some(item=>item.id===current))memberSelect.value=current;
  }
}

function renderHistoryOverview(allRows){
  const today=localIsoDate();
  const weekDate=new Date();weekDate.setDate(weekDate.getDate()-6);
  const weekAgo=localIsoDate(weekDate);
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
      <h4>${escapeHtml(formatHistoryDate(date))}</h4>
      ${items.map(item=>`
        <article class="history-entry ${attendanceStatusClass(item.status)}" data-history-details="${escapeHtml(item.id)}">
          <div class="history-entry-icon">${attendanceStatusIcon(item.status)}</div>
          <div>
            <strong>${escapeHtml(item.memberName)}</strong>
            <p>${escapeHtml(presenceTypeLabel(item.kind))} · ${escapeHtml(item.slot)}</p>
            <small>${escapeHtml(item.role)} · ${escapeHtml(item.clan)}</small>
          </div>
          <span>${attendanceStatusLabel(item.status)}</span>
        </article>
      `).join("")}
    </section>
  `).join("")||'<p class="empty-state">Nenhum registro encontrado.</p>';
}

function renderHistoryTableV72(rows){
  const tbody=byId("historyRows");if(!tbody)return;
  tbody.innerHTML=rows.map(item=>`<tr>
    <td>${escapeHtml(formatHistoryDate(item.date))}</td>
    <td><strong>${escapeHtml(item.memberName)}</strong></td>
    <td>${roleBadge(item.role)}</td>
    <td>${escapeHtml(item.clan)}</td>
    <td>${escapeHtml(presenceTypeLabel(item.kind))}</td>
    <td>${escapeHtml(item.slot)}</td>
    <td>${attendanceStatusLabel(item.status)}</td>
    <td><button class="btn" data-history-details="${escapeHtml(item.id)}" type="button">Detalhes</button></td>
  </tr>`).join("")||'<tr><td colspan="8">Nenhum registro encontrado.</td></tr>';
}

function renderHistoryCharts(rows){
  const typeCounts={};
  rows.forEach(item=>typeCounts[item.kind]=(typeCounts[item.kind]||0)+1);
  const maxType=Math.max(1,...Object.values(typeCounts));
  setHtml("historyTypeBars",Object.entries(typeCounts).map(([name,value])=>`
    <div class="history-bar-row"><span>${escapeHtml(presenceTypeLabel(name))}</span><div><i style="width:${Math.round(value/maxType*100)}%"></i></div><strong>${value}</strong></div>
  `).join("")||"<p>Sem dados.</p>");

  const memberCounts={};
  rows.filter(item=>item.activeMember&&(item.status===1||item.status===2)).forEach(item=>memberCounts[item.memberName]=(memberCounts[item.memberName]||0)+1);
  const top=Object.entries(memberCounts).sort((a,b)=>b[1]-a[1]).slice(0,5);
  const maxMember=Math.max(1,...top.map(item=>item[1]));
  setHtml("historyTopMembers",top.map(([name,value])=>`
    <div class="history-bar-row"><span>${escapeHtml(name)}</span><div><i style="width:${Math.round(value/maxMember*100)}%"></i></div><strong>${value}</strong></div>
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
    <div class="history-detail-hero ${attendanceStatusClass(item.status)}">
      <div>${attendanceStatusIcon(item.status)}</div>
      <h2>${escapeHtml(item.memberName)}</h2>
      <p>${attendanceStatusLabel(item.status)}</p>
    </div>
    <div class="history-detail-grid">
      <div><span>Data</span><strong>${escapeHtml(formatHistoryDate(item.date))}</strong></div>
      <div><span>Tipo</span><strong>${escapeHtml(presenceTypeLabel(item.kind))}</strong></div>
      <div><span>Horário/Evento</span><strong>${escapeHtml(item.slot)}</strong></div>
      <div><span>Cargo</span><strong>${escapeHtml(item.role)}</strong></div>
      <div><span>Clã</span><strong>${escapeHtml(item.clan)}</strong></div>
      <div><span>Status</span><strong>${attendanceStatusLabel(item.status)}</strong></div>
    </div>
  `);
  byId("historyDetailsDrawer")?.classList.remove("hidden");
}

function printHistoryRows(rows,title){
  if(!rows.length)return toast("Não existem registros para gerar o PDF.");
  const popup=window.open("","_blank");
  if(!popup||!popup.document)return toast("Permita pop-ups para gerar o PDF.");

  const body=rows.map(item=>`<tr>
    <td>${escapeHtml(formatHistoryDate(item.date))}</td><td>${escapeHtml(item.memberName)}</td><td>${escapeHtml(item.role)}</td>
    <td>${escapeHtml(item.clan)}</td><td>${escapeHtml(presenceTypeLabel(item.kind))}</td><td>${escapeHtml(item.slot)}</td>
    <td>${attendanceStatusLabel(item.status)}</td>
  </tr>`).join("");

  popup.document.write(`<!doctype html><html lang="pt-BR"><head><meta charset="utf-8"><title>${escapeHtml(title)}</title>
  <style>@page{size:A4 landscape;margin:10mm}body{font-family:Arial;color:#17131c}header{padding:15px;color:#fff;background:#251133;border-bottom:4px solid #a83cff}header strong{color:#d277ff;font-size:20px}h1{font-size:16px}.actions{text-align:right;margin:10px 0}.actions button{padding:9px 14px;background:#8e24cf;color:#fff;border:0;border-radius:6px}table{width:100%;border-collapse:collapse;font-size:9px}th{background:#2c123c;color:#fff;padding:7px;border:1px solid #7e4597}td{padding:6px;border:1px solid #d5c7dc}tbody tr:nth-child(even){background:#f8f2fb}@media print{.actions{display:none}}</style>
  </head><body><header><strong>77 TEAM MANAGER</strong><h1>${escapeHtml(title)}</h1></header>
  <div class="actions"><button data-popup-print>Salvar como PDF</button></div>
  <p>Gerado em ${new Date().toLocaleString("pt-BR")} · ${rows.length} registro(s)</p>
  <table><thead><tr><th>Data</th><th>Jogador</th><th>Cargo</th><th>Clã</th><th>Tipo</th><th>Horário/Evento</th><th>Status</th></tr></thead><tbody>${body}</tbody></table>
  </body></html>`);
  finalizePrintWindow(popup);
}

function downloadHistoryCsvFile(rows){
  if(!rows.length)return toast("Não existem registros para exportar.");
  const headers=["Data","Jogador","Cargo","Clã","Tipo","Horário/Evento","Status"];
  const lines=[headers,...rows.map(item=>[
    formatHistoryDate(item.date),item.memberName,item.role,item.clan,item.kind,item.slot,attendanceStatusLabel(item.status)
  ])];
  const csv=lines.map(row=>row.map(value=>`"${csvSafe(value).replace(/"/g,'""')}"`).join(";")).join("\n");
  const blob=new Blob(["\ufeff"+csv],{type:"text/csv;charset=utf-8"});
  const url=URL.createObjectURL(blob);
  const link=document.createElement("a");
  link.href=url;link.download=`historico-77-team-${localIsoDate()}.csv`;
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
      manualApproval:true,
      allowNickname:cfgValue("cfgAllowNickname"),
      allowAvatar:cfgValue("cfgAllowAvatar"),
      allowPassword:cfgValue("cfgAllowPassword")
    }),
    attendance:()=>({
      worldbossSchedule:cfgValue("cfgWorldbossSchedule"),
      purgatorioSchedule:cfgValue("cfgPurgatorioSchedule"),
      eventsSchedule:cfgValue("cfgEventsSchedule"),
      requireAbsenceReason:cfgValue("cfgAbsenceReason")
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
      event:cfgValue("cfgNotifyEvent")
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
      auditChanges:cfgValue("cfgAuditChanges")
    })
  };

  return maps[section]?.()||{};
}

async function saveSettingsSection(section){
  if(!permissionEnabled("settings_edit"))return toast("Sem permissão para alterar configurações.");

  try{
    const payload=settingsPayload(section);
    if(section==="notifications"){
      if(owner()){
        const batch=writeBatch(db),notificationsPrivate={discordWebhook:String(cfgValue("cfgDiscordWebhook")||"").trim()};
        batch.set(doc(db,"settings","app"),{notifications:payload,updatedAt:serverTimestamp(),updatedBy:state.user.uid},{merge:true});
        batch.set(doc(db,"settings","private"),{notificationsPrivate,updatedAt:serverTimestamp(),updatedBy:state.user.uid},{merge:true});
        await batch.commit();state.settings={...state.settings,notifications:{...payload,...notificationsPrivate}};
      }else{
        await setDoc(doc(db,"settings","app"),{notifications:payload,updatedAt:serverTimestamp(),updatedBy:state.user.uid},{merge:true});
        state.settings={...state.settings,notifications:{...(state.settings?.notifications||{}),...payload}};
      }
    }else{
      await setDoc(doc(db,"settings","app"),{[section]:payload,updatedAt:serverTimestamp(),updatedBy:state.user.uid},{merge:true});
      state.settings={...state.settings,[section]:payload};
    }
    if(section==="appearance")applyEnterpriseAppearance();
    if(section==="general")renderSettingsPreview();
    settingsFormDirty=false;
    await audit("configurações atualizadas",section);
    toast("Configurações salvas.");
  }catch(error){
    toast(errMsg(error));
  }
}

/* Matriz legada removida; Cargos e Permissões usa rolePermissions.
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
    ${["owner","staff","member"].map(role=>{
      const checked=(configured[role]||[]).includes(module);
      const locked=role==="owner";
      return `<td><input id="perm-${role}-${module}" type="checkbox" ${checked?"checked":""} ${locked?"disabled":""}></td>`;
    }).join("")}
  </tr>`).join("");
} */

let settingsFormDirty=false;
function loadSettingsForm(force=false){
  if(settingsFormDirty&&!force)return;
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

function serializeBackupValue(value){
  if(value?.toDate instanceof Function)return {__type:"firestore_timestamp",iso:value.toDate().toISOString()};
  if(Array.isArray(value))return value.map(serializeBackupValue);
  if(value&&typeof value==="object")return Object.fromEntries(Object.entries(value).map(([key,item])=>[key,serializeBackupValue(item)]));
  return value;
}
function deserializeBackupValue(value){
  if(value?.__type==="firestore_timestamp"&&value.iso)return Timestamp.fromDate(new Date(value.iso));
  if(Array.isArray(value))return value.map(deserializeBackupValue);
  if(value&&typeof value==="object")return Object.fromEntries(Object.entries(value).map(([key,item])=>[key,deserializeBackupValue(item)]));
  return value;
}
function publicSettingsForBackup(){
  const settings={...(state.settings||{}),notifications:{...(state.settings?.notifications||{})}};
  if(settings.notifications)delete settings.notifications.discordWebhook;
  delete settings.notificationsPrivate;
  return settings;
}
function privateSettingsForBackup(){
  // Segredos nunca são exportados para arquivos baixáveis.
  return {};
}
function backupPayload(){
  return serializeBackupValue({
    format:"77-team-manager-backup",
    backupSchema:3,
    version:"22.9.32",
    generatedAt:new Date().toISOString(),
    projectId:firebaseConfig.projectId,
    collections:{
      users:state.users,
      members:state.members,
      nicknameClaims:[],
      attendance:state.attendance,
      events:state.events,
      notifications:state.notifications,
      notificationReads:state.notificationReads,
      rtPresence:state.rtPresence,
      presenceBackups:state.presenceBackups.filter(item=>!item.status||item.status==="completed").map(({records,rtRecords,...item})=>item),
      xpLogs:state.xpLogs,
      payments:state.payments,
      audit:state.audit,
      supportMessages:state.supportMessages,
      chatMessages:state.chatMessages
    },
    settings:{public:publicSettingsForBackup(),private:privateSettingsForBackup()}
  });
}

async function completeBackupPayload(){
  if(!owner())throw new Error("Somente o DEV pode gerar o backup completo do Firestore.");
  const payload=backupPayload();
  const reads=await getDocs(collection(db,"notificationReads"));
  const resetJobs=await getDocs(collection(db,"resetJobs"));
  const nicknameClaims=await getDocs(collection(db,"nicknameClaims"));
  payload.collections.notifications=serializeBackupValue(state.sentNotifications||state.notifications);
  payload.collections.notificationReads=serializeBackupValue(reads.docs.map(item=>({id:item.id,...item.data()})));
  payload.collections.resetJobs=serializeBackupValue(resetJobs.docs.map(item=>({id:item.id,...item.data()})));
  payload.collections.nicknameClaims=serializeBackupValue(nicknameClaims.docs.map(item=>({id:item.id,...item.data()})).filter(item=>item.active!==false&&item.id===nicknameClaimKey(item.name)).map(item=>({...item,active:true})));
  payload.subcollections={presenceBackups:{}};
  for(const backup of state.presenceBackups.filter(item=>!item.status||item.status==="completed")){
    const data=await loadPresenceBackupData(backup);
    payload.subcollections.presenceBackups[backup.id]={
      attendance:serializeBackupValue(data.records),
      rt:serializeBackupValue(data.rtRecords)
    };
  }
  payload.summary={
    collections:Object.fromEntries(Object.entries(payload.collections).map(([name,rows])=>[name,Array.isArray(rows)?rows.length:0])),
    presenceBackupSubcollections:Object.keys(payload.subcollections.presenceBackups).length
  };
  return payload;
}

function validBackupDocumentId(value){return typeof value==="string"&&value.length>=1&&value.length<=500&&value!=="."&&value!==".."&&!/[\/\u0000-\u001F\u007F]/.test(value)}
function validateBackupValue(value,depth=0){
  if(depth>20)throw new Error("Backup excede a profundidade permitida.");
  if(typeof value==="string"&&value.length>800000)throw new Error("Backup contém texto acima do limite seguro.");
  if(Array.isArray(value)){value.forEach(item=>validateBackupValue(item,depth+1));return}
  if(value&&typeof value==="object")for(const [key,item] of Object.entries(value)){
    if(["__proto__","prototype","constructor"].includes(key))throw new Error("Backup contém uma chave não permitida.");
    validateBackupValue(item,depth+1);
  }
}
function optionalText(item,key,max=2000){return item[key]===undefined||(typeof item[key]==="string"&&item[key].length<=max)}
function optionalBoolean(item,key){return item[key]===undefined||typeof item[key]==="boolean"}
function optionalFinite(item,key){return item[key]===undefined||(typeof item[key]==="number"&&Number.isFinite(item[key]))}
function validateBackupDocument(name,item){
  const invalid=message=>{throw new Error(`Documento inválido em ${name}: ${message}.`)};
  if(name==="users"){
    if(!optionalText(item,"name",120)||!optionalText(item,"email",254)||!optionalText(item,"role",40)||!optionalText(item,"accessRole",40)||!optionalText(item,"memberDocumentId",500)||!optionalBoolean(item,"active"))invalid("perfil ou tipos incompatíveis");
    if(item.avatarDataUrl!==undefined&&(typeof item.avatarDataUrl!=="string"||item.avatarDataUrl.length>700000||(item.avatarDataUrl!==""&&!safeImageUrl(item.avatarDataUrl))))invalid("avatar inválido ou acima do limite");
    if(item.status!==undefined&&!["pending","approved","rejected"].includes(item.status))invalid("status desconhecido");
  }else if(name==="members"){
    if(typeof item.name!=="string"||!item.name.trim()||item.name.length>120||!optionalText(item,"clan",80)||!optionalText(item,"userId",128)||!optionalText(item,"role",40))invalid("campos do membro incompatíveis");
  }else if(name==="nicknameClaims"){
    if(typeof item.uid!=="string"||!item.uid||item.uid.length>128||!optionalText(item,"memberId",500)||typeof item.name!=="string"||item.name.length<2||item.name.length>30||item.normalizedKey!==item.id||item.name.trim().toLowerCase()!==item.id||item.active!==true)invalid("reserva de nickname incompatível");
  }else if(name==="attendance"){
    if(!optionalText(item,"memberId",500)||!optionalText(item,"userId",128)||!optionalText(item,"memberName",120)||!optionalText(item,"note",1000))invalid("campos da presença incompatíveis");
    if(item.kind!==undefined&&!["worldboss","purgatorio","eventos"].includes(item.kind))invalid("tipo de presença desconhecido");
    if(item.status!==undefined&&![-1,0,1,2,3].includes(Number(item.status)))invalid("status de presença desconhecido");
  }else if(name==="events"){
    if(!optionalText(item,"title",120)||!optionalText(item,"description",1000)||!optionalText(item,"date",30)||!optionalText(item,"type",80))invalid("campos do evento incompatíveis");
  }else if(name==="notifications"){
    if(!optionalText(item,"title",160)||!optionalText(item,"message",4000)||!optionalText(item,"targetUserId",128))invalid("notificação acima do limite");
    if(item.targetType!==undefined&&!["all","user","member","staff"].includes(item.targetType))invalid("destino de notificação desconhecido");
  }else if(name==="notificationReads"){
    if(!optionalText(item,"userId",128)||!optionalText(item,"notificationId",500))invalid("leitura de notificação incompatível");
  }else if(name==="rtPresence"){
    if(!Array.isArray(item.records)||item.records.length>5000||!optionalText(item,"kind",30)||!optionalFinite(item,"total"))invalid("estrutura do RT incompatível");
  }else if(name==="presenceBackups"){
    if(!optionalText(item,"week",30)||!optionalFinite(item,"total")||!optionalFinite(item,"rtTotal"))invalid("metadados semanais incompatíveis");
  }else if(name==="resetJobs"){
    if(!optionalText(item,"createdBy",128)||!optionalText(item,"status",40))invalid("resetJob incompatível");
  }else if(name==="xpLogs"){
    if(!optionalFinite(item,"amount")||!optionalText(item,"reason",500)||!optionalText(item,"staffId",128))invalid("log de XP incompatível");
  }else if(name==="payments"){
    if(!optionalText(item,"nickname",120)||!optionalText(item,"responsibleUid",128)||!optionalText(item,"responsibleNick",120)||!["Pedra Mística","Pedra Obscura","Aço Negro","Payout","Criação de Item","Adiantamento"].includes(item.paymentType)||!optionalFinite(item,"quantity")||(item.quantity!==undefined&&(!Number.isSafeInteger(item.quantity)||item.quantity<1||item.quantity>1000000000)))invalid("pagamento incompatível");
  }else if(name==="audit"){
    if(!optionalText(item,"userId",128)||!optionalText(item,"userName",120)||!optionalText(item,"action",160)||!optionalText(item,"details",2000))invalid("registro de auditoria incompatível");
  }else if(name==="supportMessages"||name==="chatMessages"){
    if(!optionalText(item,"ownerUid",128)||!optionalText(item,"senderUid",128)||!optionalText(item,"text",2000)||!optionalText(item,"link",2048)||!optionalText(item,"imageUrl",4096))invalid("mensagem incompatível");
  }
}
function validateBackupPayload(payload){
  validateBackupValue(payload);
  if(!payload||payload.format!=="77-team-manager-backup")throw new Error("Formato de backup incompatível.");
  if(payload.projectId!==firebaseConfig.projectId)throw new Error("Este backup pertence a outro projeto Firebase.");
  if(Number(payload.backupSchema||0)!==3)throw new Error("Schema de backup incompatível. Use um backup completo do Firestore V22.8.5 a V22.9.32 com schema 3.");
  if(!["22.8.5","22.8.6","22.8.7","22.8.8","22.8.9","22.9.0","22.9.1","22.9.2","22.9.3","22.9.4","22.9.5","22.9.6","22.9.7","22.9.8","22.9.9","22.9.10","22.9.11","22.9.12","22.9.13","22.9.14","22.9.15","22.9.16","22.9.17","22.9.18","22.9.19","22.9.20","22.9.21","22.9.22","22.9.23","22.9.24","22.9.25","22.9.26","22.9.27","22.9.28","22.9.29","22.9.30","22.9.31","22.9.32"].includes(String(payload.version||"")))throw new Error("Versão de backup incompatível.");
  if(!payload.collections||typeof payload.collections!=="object"||Array.isArray(payload.collections))throw new Error("Coleções do backup ausentes.");
  const allowed=["users","members","nicknameClaims","attendance","events","notifications","notificationReads","rtPresence","presenceBackups","resetJobs","xpLogs","payments","audit","supportMessages","chatMessages"];
  if(!Array.isArray(payload.collections.nicknameClaims))payload.collections.nicknameClaims=[];
  if(!Array.isArray(payload.collections.payments)&&!["22.9.23","22.9.24","22.9.25","22.9.26","22.9.27","22.9.28","22.9.29","22.9.30","22.9.31","22.9.32"].includes(String(payload.version||"")))payload.collections.payments=[];
  for(const name of allowed)if(!Array.isArray(payload.collections[name]))throw new Error(`Coleção obrigatória ausente: ${name}.`);
  for(const [name,rows] of Object.entries(payload.collections)){
    if(!allowed.includes(name))throw new Error(`Coleção não permitida: ${name}.`);
    if(!Array.isArray(rows)||rows.length>50000)throw new Error(`Coleção inválida ou excessiva: ${name}.`);
    rows.forEach(item=>{if(!item||!validBackupDocumentId(item.id))throw new Error(`Documento inválido em ${name}.`);validateBackupDocument(name,item)});
  }
  if(["22.9.23","22.9.24","22.9.25","22.9.26","22.9.27","22.9.28","22.9.29","22.9.30","22.9.31","22.9.32"].includes(String(payload.version||""))&&payload.collections.payments.some(item=>!Number.isSafeInteger(item.quantity)||item.quantity<1||item.quantity>99000000))throw new Error("Pagamento sem quantidade válida no backup.");
  const backupUsers=new Map(payload.collections.users.map(item=>[item.id,item]));
  const backupMembers=new Map(payload.collections.members.map(item=>[item.id,item]));
  const claimedUids=new Set();
  for(const claim of payload.collections.nicknameClaims){
    const user=backupUsers.get(claim.uid),member=claim.memberId?backupMembers.get(claim.memberId):null;
    if(!user||String(user.name||"").trim().toLowerCase()!==claim.id)throw new Error(`Reserva de nickname sem usuário correspondente: ${claim.id}.`);
    if(user.active!==true||String(user.status||"approved")!=="approved")throw new Error(`Reserva de nickname vinculada a usuário inativo: ${claim.id}.`);
    if(user.nicknameClaimKey!==undefined&&user.nicknameClaimKey!==claim.id)throw new Error(`Vínculo de nickname divergente no usuário ${claim.uid}.`);
    if(["22.9.12","22.9.13","22.9.14","22.9.15","22.9.16","22.9.17","22.9.18","22.9.19","22.9.20","22.9.21","22.9.22","22.9.23","22.9.24","22.9.25","22.9.26","22.9.27","22.9.28","22.9.29","22.9.30","22.9.31","22.9.32"].includes(String(payload.version||""))&&String(user.memberDocumentId||"")!==String(claim.memberId||""))throw new Error(`Documento de membro divergente na reserva ${claim.id}.`);
    if(["22.9.12","22.9.13","22.9.14","22.9.15","22.9.16","22.9.17","22.9.18","22.9.19","22.9.20","22.9.21","22.9.22","22.9.23","22.9.24","22.9.25","22.9.26","22.9.27","22.9.28","22.9.29","22.9.30","22.9.31","22.9.32"].includes(String(payload.version||""))&&normalizeAccessRole(user.accessRole||user.role)!=="dev"&&!claim.memberId)throw new Error(`Reserva sem membro vinculado: ${claim.id}.`);
    if(claim.memberId&&(!member||(member.userId!==claim.uid&&member.id!==claim.uid)||String(member.name||"").trim().toLowerCase()!==claim.id))throw new Error(`Reserva de nickname sem membro correspondente: ${claim.id}.`);
    if(claimedUids.has(claim.uid))throw new Error(`O usuário ${claim.uid} possui mais de uma reserva de nickname.`);
    claimedUids.add(claim.uid);
  }
  if(["22.9.11","22.9.12","22.9.13","22.9.14","22.9.15","22.9.16","22.9.17","22.9.18","22.9.19","22.9.20","22.9.21","22.9.22","22.9.23","22.9.24","22.9.25","22.9.26","22.9.27","22.9.28","22.9.29","22.9.30","22.9.31","22.9.32"].includes(String(payload.version||"")))for(const user of payload.collections.users){
    if(user.active===true&&String(user.status||"approved")==="approved"&&normalizeAccessRole(user.accessRole||user.role)!=="dev"&&!claimedUids.has(user.id))throw new Error(`Usuário ativo sem reserva de nickname: ${user.id}.`);
  }
  const ownerRow=payload.collections.users.find(item=>item.id===state.user?.uid);
  if(!ownerRow)throw new Error("O backup não contém a conta DEV autenticada.");
  if(normalizeAccessRole(ownerRow.accessRole||ownerRow.role)!=="dev"||ownerRow.active!==true||ownerRow.status!=="approved")throw new Error("O backup tenta remover a autorização da conta DEV atual.");
  const groups=payload.subcollections?.presenceBackups;
  if(!groups||typeof groups!=="object"||Array.isArray(groups))throw new Error("Subcoleções dos backups semanais ausentes.");
  const backupParents=new Map(payload.collections.presenceBackups.map(item=>[item.id,item]));
  const groupIds=Object.keys(groups);
  if(groupIds.length!==backupParents.size||groupIds.some(id=>!backupParents.has(id)))throw new Error("Metadados e subcoleções dos backups semanais estão divergentes.");
  for(const [backupId,data] of Object.entries(groups)){
    if(!validBackupDocumentId(backupId)||!Array.isArray(data?.attendance)||!Array.isArray(data?.rt))throw new Error("Subcoleção semanal inválida.");
    if(data.attendance.length>50000||data.rt.length>10000)throw new Error("Subcoleção semanal excede o limite seguro.");
    const parent=backupParents.get(backupId);
    if(["22.9.17","22.9.18","22.9.19","22.9.20","22.9.21","22.9.22","22.9.23","22.9.24","22.9.25","22.9.26","22.9.27","22.9.28","22.9.29","22.9.30","22.9.31","22.9.32"].includes(String(payload.version))&&parent.status!=="completed")throw new Error(`Backup semanal incompleto: ${backupId}.`);
    if(Number(parent.total)!==data.attendance.length||Number(parent.rtTotal)!==data.rt.length)throw new Error(`Totais divergentes no backup semanal ${backupId}.`);
    for(const [name,rows] of Object.entries({attendance:data.attendance,rt:data.rt})){
      const ids=new Set();
      rows.forEach(item=>{const id=item?.originalId||item?.id;if(!item||!validBackupDocumentId(id))throw new Error(`Registro inválido no backup ${backupId}.`);if(ids.has(id))throw new Error(`ID duplicado em ${backupId}/${name}: ${id}.`);ids.add(id)});
    }
  }
  if(!payload.settings||typeof payload.settings.public!=="object"||Array.isArray(payload.settings.public))throw new Error("Configurações públicas do backup ausentes.");
  if(!payload.generatedAt||Number.isNaN(Date.parse(payload.generatedAt)))throw new Error("Data de geração do backup inválida.");
  if(Date.parse(payload.generatedAt)>Date.now()+300000)throw new Error("Data de geração do backup está no futuro.");
  if(payload.settings.public.notificationsPrivate!==undefined)throw new Error("Backup público contém configurações privadas.");
  const color=payload.settings.public.appearance?.primaryColor;if(color!==undefined&&(typeof color!=="string"||!/^#[0-9a-fA-F]{6}$/.test(color)))throw new Error("Cor principal inválida nas configurações.");
  if(payload.summary?.collections)for(const name of allowed)if(name!=="nicknameClaims"||payload.summary.collections[name]!==undefined){if(Number(payload.summary.collections[name])!==payload.collections[name].length)throw new Error(`Resumo divergente na coleção ${name}.`);}
  if(payload.summary?.presenceBackupSubcollections!==undefined&&Number(payload.summary.presenceBackupSubcollections)!==Object.keys(groups).length)throw new Error("Resumo divergente nas subcoleções semanais.");
  return allowed;
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

const RESTORE_GROUP_SIZE=180;

async function storedRollbackRows(jobId){
  const snapshot=await getDocs(collection(db,"restoreJobs",jobId,"rollback"));
  return snapshot.docs.map(item=>({snapshotRef:item.ref,...item.data()})).sort((a,b)=>Number(b.sequence||0)-Number(a.sequence||0));
}

async function executePersistentRollback(jobRef,originalError=null){
  const rows=await storedRollbackRows(jobRef.id);
  await updateDoc(jobRef,{status:"rolling_back",rollbackTotal:rows.length,errorCode:originalError?.code||"interrupted",errorMessage:String(originalError?.message||originalError||"Restauração interrompida; rollback automático iniciado.").slice(0,500),updatedAt:serverTimestamp()});
  let processed=0;
  for(let index=0;index<rows.length;index+=RESTORE_GROUP_SIZE){
    const group=rows.slice(index,index+RESTORE_GROUP_SIZE),batch=writeBatch(db);
    group.forEach(item=>{
      const target=doc(db,...item.path);
      item.existed?batch.set(target,item.data||{}):batch.delete(target);
      batch.delete(item.snapshotRef);
    });
    await batch.commit();processed+=group.length;
    await updateDoc(jobRef,{rollbackProcessed:processed,updatedAt:serverTimestamp()});
  }
  await updateDoc(jobRef,{status:"rolled_back",rolledBackAt:serverTimestamp(),updatedAt:serverTimestamp()});
}

async function cleanupPersistentRollback(jobId){
  const rows=await storedRollbackRows(jobId);
  for(let index=0;index<rows.length;index+=350){
    const batch=writeBatch(db);rows.slice(index,index+350).forEach(item=>batch.delete(item.snapshotRef));await batch.commit();
  }
}

async function recoverInterruptedRestoreJobs(){
  if(!owner()||!state.user)return;
  try{
    const jobs=await getDocs(collection(db,"restoreJobs"));
    const unfinished=jobs.docs.filter(item=>item.data().createdBy===state.user.uid&&["validated","restoring","restoring_subcollections","rolling_back","rollback_failed"].includes(item.data().status));
    for(const item of unfinished){
      try{await executePersistentRollback(item.ref,new Error("Restauração interrompida em sessão anterior."));await audit("rollback de restauração retomado",item.id)}
      catch(error){await updateDoc(item.ref,{status:"rollback_failed",rollbackError:String(error?.message||error).slice(0,500),updatedAt:serverTimestamp()})}
    }
    const completed=jobs.docs.filter(item=>item.data().createdBy===state.user.uid&&item.data().status==="completed");
    for(const item of completed)try{await cleanupPersistentRollback(item.id)}catch(error){console.warn("Limpeza de rollback será retomada no próximo acesso:",error)}
    if(unfinished.length)toast(`${unfinished.length} restauração(ões) interrompida(s) foram revertidas.`);
  }catch(error){console.error("Falha ao recuperar restoreJobs:",error)}
}

async function restoreBackupPayload(payload){
  if(!owner())throw new Error("Somente o DEV pode restaurar backups completos.");
  const allowed=validateBackupPayload(payload),collections=payload.collections||{};
  const jobId=`restore__${Date.now()}__${state.user.uid.slice(0,8)}`,jobRef=doc(db,"restoreJobs",jobId);
  await setDoc(jobRef,{status:"validated",sourceVersion:payload.version,backupSchema:payload.backupSchema,projectId:payload.projectId,createdBy:state.user.uid,createdAt:serverTimestamp(),updatedAt:serverTimestamp()});
  let sequence=0;
  async function restoreGroup(refs,items,prepare){
    const snapshots=await Promise.all(refs.map(ref=>getDoc(ref))),batch=writeBatch(db);
    snapshots.forEach((snapshot,index)=>{
      const snapshotRef=doc(db,"restoreJobs",jobId,"rollback",String(sequence).padStart(9,"0"));
      batch.set(snapshotRef,{sequence,path:refs[index].path.split("/"),existed:snapshot.exists(),data:snapshot.exists()?snapshot.data():null,capturedAt:serverTimestamp()});
      batch.set(refs[index],prepare(items[index]));sequence++;
    });
    await batch.commit();
  }
  async function deleteCollectionRowsMissingFromBackup(collectionRef,rows){
    const targetIds=new Set(rows.map(item=>item.id));
    const current=await getDocs(collectionRef);
    const extras=current.docs.filter(item=>!targetIds.has(item.id));
    for(let index=0;index<extras.length;index+=RESTORE_GROUP_SIZE){
      const group=extras.slice(index,index+RESTORE_GROUP_SIZE),batch=writeBatch(db);
      group.forEach(item=>{
        const snapshotRef=doc(db,"restoreJobs",jobId,"rollback",String(sequence).padStart(9,"0"));
        batch.set(snapshotRef,{sequence,path:item.ref.path.split("/"),existed:true,data:item.data(),capturedAt:serverTimestamp()});
        batch.delete(item.ref);sequence++;
      });
      await batch.commit();
    }
  }
  try{
    for(const collectionName of allowed){
      const rows=collections[collectionName]||[];
      await updateDoc(jobRef,{status:"restoring",currentCollection:collectionName,total:rows.length,updatedAt:serverTimestamp()});
      if(collectionName==="presenceBackups"){
        const targetIds=new Set(rows.map(item=>item.id)),currentParents=await getDocs(collection(db,"presenceBackups"));
        for(const parent of currentParents.docs.filter(item=>!targetIds.has(item.id))){
          await deleteCollectionRowsMissingFromBackup(collection(db,"presenceBackups",parent.id,"attendance"),[]);
          await deleteCollectionRowsMissingFromBackup(collection(db,"presenceBackups",parent.id,"rt"),[]);
        }
      }
      await deleteCollectionRowsMissingFromBackup(collection(db,collectionName),rows);
      for(let index=0;index<rows.length;index+=RESTORE_GROUP_SIZE){
        const group=rows.slice(index,index+RESTORE_GROUP_SIZE),refs=group.map(item=>doc(db,collectionName,item.id));
        await restoreGroup(refs,group,item=>{const data=deserializeBackupValue({...item});delete data.id;if(collectionName!=="nicknameClaims"){data.restoredBy=state.user.uid;data.restoredAt=serverTimestamp()}return data});
        await updateDoc(jobRef,{processed:Math.min(index+group.length,rows.length),updatedAt:serverTimestamp()});
      }
    }
    for(const [backupId,data] of Object.entries(payload.subcollections.presenceBackups)){
      for(const [subcollection,rows] of Object.entries({attendance:data.attendance,rt:data.rt})){
        await updateDoc(jobRef,{status:"restoring_subcollections",currentCollection:`presenceBackups/${backupId}/${subcollection}`,total:rows.length,updatedAt:serverTimestamp()});
        await deleteCollectionRowsMissingFromBackup(collection(db,"presenceBackups",backupId,subcollection),rows.map(item=>({...item,id:item.originalId||item.id})));
        for(let index=0;index<rows.length;index+=RESTORE_GROUP_SIZE){
          const group=rows.slice(index,index+RESTORE_GROUP_SIZE),refs=group.map(item=>doc(db,"presenceBackups",backupId,subcollection,item.originalId||item.id));
          await restoreGroup(refs,group,item=>{const data=deserializeBackupValue({...item}),id=item.originalId||item.id;delete data.id;data.originalId=id;data.restoredBy=state.user.uid;data.restoredAt=serverTimestamp();return data});
        }
      }
    }
    const publicSettings=deserializeBackupValue(payload.settings?.public||{});if(publicSettings?.notifications)delete publicSettings.notifications.discordWebhook;delete publicSettings?.notificationsPrivate;
    const settingsRef=doc(db,"settings","app");
    await restoreGroup([settingsRef],[publicSettings||{}],item=>item);
    await updateDoc(jobRef,{status:"completed",completedAt:serverTimestamp(),updatedAt:serverTimestamp()});
    nicknameClaimMigrationCompleted=false;
    nicknameClaimMigrationRunning=false;
    clearTimeout(nicknameClaimMigrationTimer);
    nicknameClaimMigrationTimer=setTimeout(scheduleNicknameClaimMigration,1200);
    cleanupPersistentRollback(jobId).catch(error=>console.warn("Snapshots de rollback mantidos para limpeza posterior:",error));
    await audit("backup completo do Firestore restaurado",`${jobId} · schema ${payload.backupSchema}`);
    return jobId;
  }catch(error){
    try{await executePersistentRollback(jobRef,error)}catch(rollbackError){
      try{await updateDoc(jobRef,{status:"rollback_failed",errorCode:error?.code||"error",errorMessage:String(error?.message||error).slice(0,500),rollbackError:String(rollbackError?.message||rollbackError).slice(0,500),failedAt:serverTimestamp(),updatedAt:serverTimestamp()})}catch{}
    }
    throw error;
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
      <div class="goal-item-head"><div><strong>${escapeHtml(goal.title)}</strong><small>${goal.deadline?`Prazo: ${escapeHtml(formatHistoryDate(goal.deadline))}`:"Sem prazo"}</small></div><span>${goal.progress}%</span></div>
      <div class="goal-progress"><i style="width:${goal.progress}%"></i></div>
      <p>${goal.current.toLocaleString("pt-BR")} de ${Number(goal.target).toLocaleString("pt-BR")}</p>
      ${permissionEnabled("goals_manage")?`<button class="btn danger" data-delete-goal="${escapeHtml(goal.id)}" type="button">Remover</button>`:""}
    </article>
  `).join("")||'<p class="empty-state">Nenhuma meta cadastrada.</p>');
}

on("settingsSearch","input",event=>filterSettingsTabs(event.target.value));
on("refreshSystemHealth","click",renderSystemHealth);
on("exportCompleteBackup","click",async()=>{
  if(!owner())return toast("Somente o DEV pode gerar o backup completo do Firestore.");
  try{
    const now=localIsoDate();downloadJsonFile(`backup-77-team-${now}.json`,await completeBackupPayload());
    const stamp=new Date().toLocaleString("pt-BR");localStorage.setItem("77team-last-backup",stamp);setText("systemLastBackup",stamp);toast("Backup completo do Firestore gerado.");
  }catch(error){toast(error.message||errMsg(error))}
});
on("restoreCompleteBackup","click",async()=>{
  const file=byId("importBackupFile")?.files?.[0];
  if(!file)return toast("Selecione um arquivo JSON.");
  if(file.size>200*1024*1024)return toast("O backup excede o limite seguro de 200 MB.");
  if(!confirm("Restaurar este backup validado? Um restoreJob persistente fará rollback automático em caso de falha."))return;
  try{
    const payload=JSON.parse(await file.text());
    await restoreBackupPayload(payload);
    toast("Backup restaurado com rollback protegido. Atualize a página.");
  }catch(error){
    toast(error.message||"Falha ao restaurar backup.");
  }
});

on("goalForm","submit",async event=>{
  event.preventDefault();
  if(!permissionEnabled("goals_manage"))return toast("Sem permissão para gerenciar metas.");
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
    settingsFormDirty=true;
    const theme=themeButton.dataset.themeChoice;
    setCfgValue("cfgThemeName",theme);
    setCfgValue("cfgPrimaryColor",THEME_COLORS[theme]);
    document.querySelectorAll("[data-theme-choice]").forEach(button=>button.classList.toggle("active",button===themeButton));
    document.documentElement.style.setProperty("--pro-accent",THEME_COLORS[theme]);
  }

  const deleteGoal=event.target.closest("[data-delete-goal]");
  if(deleteGoal&&permissionEnabled("goals_manage")){
    const goals=(activeSettings().goals||[]).filter(goal=>goal.id!==deleteGoal.dataset.deleteGoal);
    await setDoc(doc(db,"settings","app"),{goals,updatedAt:serverTimestamp()},{merge:true});
    state.settings={...state.settings,goals};
    renderGoals();
  }
});

document.addEventListener("input",event=>{if(event.target.closest("#configuracoes")&&!event.target.matches("#settingsSearch"))settingsFormDirty=true});
document.addEventListener("change",event=>{if(event.target.closest("#configuracoes"))settingsFormDirty=true});

["cfgTeamName","cfgDescription"].forEach(id=>on(id,"input",renderSettingsPreview));


function staffRows(){
  return state.users
    .filter(user=>["dev","leadership","staff"].includes(resolveAccessRole(user))&&user.status!=="pending"&&user.active!==false)
    .map(user=>{
      const member=state.members.find(item=>
        item.userId===user.id||
        item.id===user.id||
        item.name===user.name
      )||{};
      const stat=stats(member);
      return {
        id:user.id,
        name:user.name||user.email||"Staff",
        email:user.email||"—",
        role:resolveAccessRole(user),
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
    ?`<img src="${escapeHtml(safeImageUrl(item.avatar))}" alt="${escapeHtml(item.name)}">`
    :`<span>${escapeHtml(item.name.slice(0,1).toUpperCase())}</span>`;
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
  const today=localIsoDate();
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
        <h3>${escapeHtml(item.name)}</h3>
        <p>${escapeHtml(accessRoleLabel(item.role))} · ${escapeHtml(item.clan)}</p>
        <small>${escapeHtml(item.email)}</small>
      </div>
      <div class="staff-card-stats">
        <div><span>Presenças</span><strong>${item.stat.present}</strong></div>
        <div><span>Taxa</span><strong>${item.stat.rate}%</strong></div>
        <div><span>Level</span><strong>${progressionFor(state.members.find(member=>member.name===item.name)).level}</strong></div>
      </div>
      <button class="btn primary full" data-staff-details="${escapeHtml(item.id)}" type="button">Ver perfil</button>
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
      <div><span>${escapeHtml(item.type)}</span><strong>${escapeHtml(item.title)}</strong><p>${escapeHtml(item.description)}</p></div>
      <button class="btn" data-page-jump="${item.page}" type="button">Abrir</button>
    </article>
  `).join("")||'<p class="empty-state">Nenhuma pendência.</p>';
}

function renderStaffAgenda(){
  const list=byId("staffAgendaList");
  if(!list)return;

  const today=localIsoDate();
  const events=[...state.events]
    .filter(event=>!event.date||event.date>=today)
    .sort((a,b)=>String(a.date||"").localeCompare(String(b.date||"")))
    .slice(0,8);

  list.innerHTML=events.map(event=>`
    <article class="staff-agenda-item">
      <div class="staff-agenda-date">${escapeHtml(event.date?formatHistoryDate(event.date):"—")}</div>
      <div><strong>${escapeHtml(event.title||event.type||"Evento")}</strong><p>${escapeHtml(event.type||"Agenda")} · ${escapeHtml(event.description||"Sem descrição")}</p></div>
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
      <div><strong>${escapeHtml(goal.title)}</strong><span>${progress}%</span></div>
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
      <span>${escapeHtml(label)}</span>
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
      <span>${escapeHtml(item.category||"observacao")}</span>
      <strong>${escapeHtml(item.authorName||"Staff")}</strong>
      <p>${escapeHtml(item.text)}</p>
      <small>${new Date(item.createdAt).toLocaleString("pt-BR")}</small>
    </article>
  `).join("")||'<p class="empty-state">Nenhuma anotação registrada.</p>';
}

function openStaffDetails(item){
  if(!item)return;
  setHtml("staffDetailsContent",`
    <div class="staff-drawer-hero">
      <div class="staff-drawer-avatar">${staffAvatarHtml(item)}</div>
      <h2>${escapeHtml(item.name)}</h2>
      <p>${escapeHtml(accessRoleLabel(item.role))} · ${escapeHtml(item.clan)}</p>
      <small>${escapeHtml(item.email)}</small>
    </div>
    <div class="staff-drawer-grid">
      <div><span>Presenças</span><strong>${item.stat.present}</strong></div>
      <div><span>Ausências</span><strong>${item.stat.absent}</strong></div>
      <div><span>Taxa</span><strong>${item.stat.rate}%</strong></div>
      <div><span>Power</span><strong>${Number(item.character.power||0).toLocaleString("pt-BR")}</strong></div>
      <div><span>Classe</span><strong>${escapeHtml(item.character.className||"—")}</strong></div>
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
    <td>${escapeHtml(item.name)}</td><td>${escapeHtml(accessRoleLabel(item.role))}</td>
    <td>${escapeHtml(item.clan)}</td><td>${item.stat.present}</td><td>${item.stat.rate}%</td>
    <td>${escapeHtml(item.character.className||"—")}</td><td>${Number(item.character.power||0).toLocaleString("pt-BR")}</td>
  </tr>`).join("");

  popup.document.write(`<!doctype html><html lang="pt-BR"><head><meta charset="utf-8"><title>Relatório da Staff</title>
  <style>@page{size:A4 landscape;margin:10mm}body{font-family:Arial;color:#17131c}header{padding:15px;color:#fff;background:#251133;border-bottom:4px solid #a83cff}header strong{color:#d277ff;font-size:20px}.actions{text-align:right;margin:10px 0}.actions button{padding:9px 14px;background:#8e24cf;color:#fff;border:0;border-radius:6px}table{width:100%;border-collapse:collapse;font-size:9px}th{background:#2c123c;color:#fff;padding:7px;border:1px solid #7e4597}td{padding:6px;border:1px solid #d5c7dc}@media print{.actions{display:none}}</style>
  </head><body><header><strong>77 TEAM MANAGER</strong><h1>Relatório da equipe Staff</h1></header>
  <div class="actions"><button data-popup-print>Salvar como PDF</button></div>
  <p>Gerado em ${new Date().toLocaleString("pt-BR")} · ${rows.length} integrante(s)</p>
  <table><thead><tr><th>Nome</th><th>Cargo</th><th>Clã</th><th>Presenças</th><th>Taxa</th><th>Classe</th><th>Power</th></tr></thead><tbody>${body}</tbody></table>
  </body></html>`);
  finalizePrintWindow(popup);
}

function downloadStaffCsvFile(){
  const rows=staffRows();
  if(!rows.length)return toast("Não há dados da Staff para exportar.");

  const lines=[
    ["Nome","Cargo","Clã","E-mail","Presenças","Ausências","Taxa","Classe","Power"],
    ...rows.map(item=>[
      item.name,
      accessRoleLabel(item.role),
      item.clan,
      item.email,
      item.stat.present,
      item.stat.absent,
      `${item.stat.rate}%`,
      item.character.className||"",
      item.character.power||0
    ])
  ];

  const csv=lines.map(row=>row.map(value=>`"${csvSafe(value).replace(/"/g,'""')}"`).join(";")).join("\n");
  const blob=new Blob(["\ufeff"+csv],{type:"text/csv;charset=utf-8"});
  const url=URL.createObjectURL(blob);
  const link=document.createElement("a");
  link.href=url;
  link.download=`staff-77-team-${localIsoDate()}.csv`;
  document.body.appendChild(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(url);
}

function renderStaffCommandCenter(){
  if(!permissionEnabled("access_staff"))return;
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
  select.innerHTML='<option value="">Selecione um usuário</option>'+users.map(u=>`<option value="${escapeHtml(u.id)}">${escapeHtml(u.name||u.email)} · ${u.role==="owner"?"Liderança":u.role==="staff"?"Staff":"Membro"}</option>`).join("");
  if(users.some(u=>u.id===current))select.value=current;
}
function renderNotificationAdmin(){
  populateNotificationUsers();
  const list=byId("notificationSentRows");if(!list)return;
  const sent=(state.sentNotifications||[]).filter(n=>n.createdBy===state.user?.uid||owner()).slice().sort((a,b)=>{const av=a.createdAt?.toMillis?.()||Date.parse(a.createdAt||0)||0;const bv=b.createdAt?.toMillis?.()||Date.parse(b.createdAt||0)||0;return bv-av});
  setText("notificationSentCount",sent.length);
  list.innerHTML=sent.map(n=>`<article class="notification-sent-item type-${["info","warning","important","urgent"].includes(n.type)?n.type:"info"}">
    <div><strong>${escapeHtml(n.title||"Notificação")}</strong><p>${escapeHtml(n.message||"")}</p><small>${n.targetType==="user"?`Individual: ${escapeHtml(n.targetUserName||"Usuário")}`:"Todos os usuários"} · ${escapeHtml(notificationDate(n))}</small></div>
    ${owner()?`<button class="btn danger mini" data-delete-notification="${escapeHtml(n.id)}" type="button">Excluir</button>`:""}
  </article>`).join("")||'<p class="empty-state">Nenhuma notificação enviada.</p>';
}
on("notificationTargetMode","change",()=>{
  const individual=byId("notificationTargetMode")?.value==="user";
  byId("notificationTargetUserWrap")?.classList.toggle("hidden",!individual);
  if(!individual&&byId("notificationTargetUser"))byId("notificationTargetUser").value="";
});
on("notificationAdminForm","submit",async event=>{
  event.preventDefault();if(!permissionEnabled("notifications_send"))return toast("Sem permissão para enviar notificações.");
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
  if(!permissionEnabled("notifications_send"))return toast("Sem permissão para publicar avisos.");
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
  if(!owner())return toast("O backup completo do Firestore é exclusivo do DEV. Use Backup de Presença para o fechamento semanal.");
  byId("exportCompleteBackup")?.click();
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
    .filter(item=>attendanceMatchesMember(item,member))
    .reduce((total,item)=>{
      if(item.status===1||item.status===2){
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
  const profile=user||userForMember(member)||member||{};
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
  if(!permissionEnabled("xp_manage")||progressionSyncRunning)return;
  clearTimeout(progressionSyncTimer);
  progressionSyncTimer=setTimeout(syncMemberProgressions,500);
}

async function syncMemberProgressions(){
  if(!permissionEnabled("xp_manage")||progressionSyncRunning)return;
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
      const memberCurrent=member.progression||{};

      if(
        Number(current.automaticXp||0)===automaticXp &&
        Number(current.totalXp||0)===calculated.totalXp &&
        Number(current.level||1)===calculated.level &&
        current.title===title &&
        Number(memberCurrent.automaticXp||0)===automaticXp &&
        Number(memberCurrent.manualXp||0)===manualXp &&
        Number(memberCurrent.totalXp||0)===calculated.totalXp &&
        Number(memberCurrent.level||1)===calculated.level &&
        memberCurrent.title===title
      )continue;

      const progression={
          automaticXp,
          manualXp,
          totalXp:calculated.totalXp,
          level:calculated.level,
          title,
          currentXp:calculated.currentXp,
          requiredXp:calculated.requiredXp,
          progress:calculated.progress,
          recalculatedAt:new Date().toISOString()
      };
      const batch=writeBatch(db);
      batch.update(doc(db,"users",user.id),{progression,progressionUpdatedAt:serverTimestamp()});
      batch.set(doc(db,"members",member.id),{progression,progressionUpdatedAt:serverTimestamp()},{merge:true});
      await batch.commit();
      member.progression=progression;
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
      .map(member=>`<option value="${escapeHtml(member.id)}">${escapeHtml(member.name)}</option>`)
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
        <strong>${escapeHtml(item.memberName||"Membro")}</strong>
        <p>${escapeHtml(item.reason||"Ajuste manual")}</p>
        <small>${escapeHtml(item.staffName||"Staff")} · ${item.createdAt?.toDate?item.createdAt.toDate().toLocaleString("pt-BR"):""}</small>
      </div>
      <span>${Number(item.amount)>=0?"+":""}${Number(item.amount||0)} XP</span>
    </article>
  `).join("")||'<p class="empty-state">Nenhum ajuste manual registrado.</p>';
}

function renderLevelSystem(){
  populateXpMemberSelect();
  renderXpAdjustmentHistory();

  if(state.user){
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
  if(!permissionEnabled("xp_manage"))return toast("Permissão negada.");

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

    const progression={
        automaticXp,
        manualXp:newManual,
        totalXp:calculated.totalXp,
        level:calculated.level,
        title,
        currentXp:calculated.currentXp,
        requiredXp:calculated.requiredXp,
        progress:calculated.progress,
        recalculatedAt:new Date().toISOString()
      };
    batch.update(doc(db,"users",user.id),{
      progression,
      progressionUpdatedAt:serverTimestamp()
    });
    batch.update(doc(db,"members",member.id),{
      progression,
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




/* HOME PÚBLICA — snapshot sanitizado para visitantes, sem expor coleções privadas */
let publicHomePublishTimer=null;
let lastPublicHomeSignature="";

function publicHomeDateValue(value){
  const date=value?.toDate?.()||new Date(value||0);
  return Number.isNaN(date.getTime())?null:date;
}

function renderPublicHomeLoading(){
  if(state.user)return;
  setText("homeLiveUser","Visitante");
  setText("homeWelcomeTitle","Bem-vindo à 77 TEAM");
  setText("homeUserMeta","Visualização pública");
  setText("homeMyRole","Entre para visualizar");setText("homeMyClan","—");setText("homeMyPoints","—");setText("homeMyPresence","—");
  setText("homeNextEvent","Carregando...");
  setText("homeUnreadNotifications","Somente membros");
  setText("homeLastSync","Conectando...");
  setText("homeLiveSubtitle","Carregando as informações públicas reais da 77 TEAM...");
  setText("kMembers","—");setText("kPresence","—");setText("kMonthEvents","—");setText("kBest","—");setText("kBestPoints","— pontos");
  setText("dashboardMemberTrend","—");setText("dashboardPresenceTrend","—");setText("dashboardEventTrend","—");
  setHtml("recentPresenceRows",'<tr><td colspan="5">Carregando informações públicas...</td></tr>');
  setHtml("topFiveRows",'<tr><td colspan="4">Carregando ranking...</td></tr>');
  setHtml("dashboardTodayEvents",'<p class="empty-state">Carregando eventos...</p>');
  setHtml("dashboardWeeklyChart",'<p class="empty-state">Carregando presenças...</p>');
  setHtml("dashboardClanPoints",'<p class="empty-state">Carregando clãs...</p>');
  setHtml("dashboardRecentActivity",'<p class="empty-state">Carregando atividades...</p>');
  setHtml("dashboardMemberRows",'<tr><td colspan="9">Carregando membros...</td></tr>');
}

function subscribePublicHome(){
  state.unsubs.push(onSnapshot(doc(db,"public","home"),snapshot=>{
    if(state.user)return;
    if(!snapshot.exists()){
      state.publicHome=null;
      setText("homeNextEvent","Nenhum dado publicado");
      setText("homeLastSync","Aguardando publicação");
      setText("homeLiveSubtitle","A HOME pública ainda não recebeu o primeiro resumo. Entre como administrador uma vez após esta atualização para publicar os dados atuais.");
      setText("kMembers","0");setText("kPresence","0");setText("kMonthEvents","0");setText("kBest","—");setText("kBestPoints","0 pontos");
      setHtml("recentPresenceRows",'<tr><td colspan="5">Nenhuma informação pública publicada ainda.</td></tr>');
      setHtml("topFiveRows",'<tr><td colspan="4">Nenhum ranking publicado ainda.</td></tr>');
      setHtml("dashboardTodayEvents",'<p class="empty-state">Nenhum evento público publicado ainda.</p>');
      setHtml("dashboardWeeklyChart",'<p class="empty-state">Sem dados públicos de presença.</p>');
      setHtml("dashboardClanPoints",'<p class="empty-state">Sem dados públicos de clãs.</p>');
      setHtml("dashboardRecentActivity",'<p class="empty-state">Sem atividade pública publicada.</p>');
      setHtml("dashboardMemberRows",'<tr><td colspan="9">Nenhum membro publicado ainda.</td></tr>');
      return;
    }
    state.publicHome={id:snapshot.id,...snapshot.data()};
    renderPublicHomeSnapshot(state.publicHome);
  },error=>{
    console.error("Falha ao carregar HOME pública:",error);
    setText("homeLastSync","Indisponível");
    setText("homeLiveSubtitle","Não foi possível carregar as informações públicas. Verifique a publicação das regras do Firestore.");
  }));
}

function renderPublicHomeWeekly(days=[]){
  const container=byId("dashboardWeeklyChart");if(!container)return;
  if(!days.length){container.innerHTML='<p class="empty-state">Sem dados de presença nos últimos 7 dias.</p>';return;}
  const max=Math.max(1,...days.map(day=>Number(day.value||0)));
  const points=days.map((day,index)=>{const x=days.length===1?50:index/(days.length-1)*100;const y=92-(Number(day.value||0)/max*72);return `${x},${y}`}).join(" ");
  container.innerHTML=`<div class="weekly-chart-scale"><span>${max}</span><span>${Math.round(max/2)}</span><span>0</span></div><svg viewBox="0 0 100 100" preserveAspectRatio="none" aria-label="Gráfico semanal"><polygon points="0,100 ${points} 100,100" fill="url(#weeklyArea)"></polygon><polyline points="${points}" fill="none" stroke="currentColor" stroke-width="1.6" vector-effect="non-scaling-stroke"></polyline>${days.map((day,index)=>{const x=days.length===1?50:index/(days.length-1)*100;const y=92-(Number(day.value||0)/max*72);return `<circle cx="${x}" cy="${y}" r="1.7" fill="currentColor"></circle>`}).join("")}</svg><div class="weekly-chart-labels">${days.map(day=>`<span><b>${Number(day.value||0)}</b>${escapeHtml(day.label||"")}</span>`).join("")}</div>`;
}

function renderPublicHomeSnapshot(data){
  if(state.user||!data)return;
  setText("homeLiveUser","Visitante");
  setText("homeNextEvent",data.nextEvent?.label||"Nenhum agendado");
  setText("homeUnreadNotifications","Somente membros");
  const syncDate=publicHomeDateValue(data.generatedAt);
  setText("homeLastSync",syncDate?new Intl.DateTimeFormat("pt-BR",{dateStyle:"short",timeStyle:"short"}).format(syncDate):"Atualizado");
  setText("homeLiveSubtitle","Dados públicos reais da 77 TEAM. Este painel é atualizado automaticamente quando a equipe registra novas informações.");

  setText("kMembers",Number(data.membersCount||0));
  setText("kPresence",Number(data.todayPresence||0));
  setText("kMonthEvents",Number(data.monthEvents||0));
  setText("dashboardMemberTrend",data.memberTrend||"0%");
  setText("dashboardPresenceTrend",data.presenceTrend||"0%");
  setText("dashboardEventTrend",data.eventTrend||"0%");
  const top=(data.top5||[])[0];
  setText("kBest",top?.name||"—");setText("kBestPoints",`${Number(top?.points||0).toLocaleString("pt-BR")} pontos`);

  setHtml("recentPresenceRows",(data.recentPresence||[]).map(item=>`<tr><td><span class="member-avatar">${escapeHtml((item.name||"?").slice(0,1).toUpperCase())}</span>${escapeHtml(item.name||"—")}</td><td>${roleBadge(item.role||"Membros")}</td><td>${escapeHtml(item.date||"—")}</td><td>${escapeHtml(item.event||"—")}</td><td><span class="badge ${attendanceStatusClass(Number(item.status))}">${attendanceStatusLabel(Number(item.status))}</span></td></tr>`).join("")||'<tr><td colspan="5">Nenhuma presença recente.</td></tr>');
  setHtml("topFiveRows",(data.top5||[]).map((item,index)=>`<tr><td><span class="rank-position rank-${index+1}">${index<3?["🥇","🥈","🥉"][index]:index+1}</span></td><td><span class="member-avatar">${escapeHtml((item.name||"?").slice(0,1).toUpperCase())}</span>${escapeHtml(item.name||"—")}</td><td>${roleBadge(item.role||"Membros")}</td><td><strong class="ranking-points">${Number(item.points||0).toLocaleString("pt-BR")}</strong></td></tr>`).join("")||'<tr><td colspan="4">Sem dados de ranking.</td></tr>');
  setHtml("dashboardTodayEvents",(data.todayEvents||[]).map(item=>`<article class="today-event-item"><div class="today-event-icon">${item.kind==="worldboss"?"⚔":item.kind==="purgatorio"?"♨":"▣"}</div><div><strong>${escapeHtml(item.title||"Evento")}</strong><small>${escapeHtml(item.time||"—")}</small></div><span class="${item.status==="Em andamento"?"running":"scheduled"}">${escapeHtml(item.status||"Agendado")}</span></article>`).join("")||'<p class="empty-state">Nenhum evento programado para hoje.</p>');
  renderPublicHomeWeekly(data.weekly||[]);
  const clans=data.clans||[],clanMax=Math.max(1,...clans.map(item=>Number(item.points||0)));
  setHtml("dashboardClanPoints",clans.map((item,index)=>`<div class="clan-points-row"><span>${index+1}</span><strong>${escapeHtml(item.name||"Sem clã")}</strong><div><i style="width:${Math.round(Number(item.points||0)/clanMax*100)}%"></i></div><b>${Number(item.points||0)}</b></div>`).join("")||'<p class="empty-state">Nenhum clã com pontos.</p>');
  const rate=Math.max(0,Math.min(100,Number(data.generalRate||0))),gauge=byId("dashboardRateGauge");if(gauge)gauge.style.setProperty("--rate",rate);
  setText("dashboardGeneralRate",`${rate}%`);setText("dashboardRateLabel",rate>=90?"Excelente!":rate>=70?"Muito bom":rate>=50?"Regular":rate?"Atenção":"Sem dados");setText("dashboardActiveSummary",`${Number(data.membersCount||0)} membros ativos`);
  setHtml("dashboardRecentActivity",(data.activities||[]).map(item=>`<article class="recent-activity-item"><span>${escapeHtml(item.icon||"•")}</span><div><strong>${escapeHtml(item.title||"")}</strong><small>${escapeHtml(item.time||"")}</small></div></article>`).join("")||'<p class="empty-state">Nenhuma atividade recente.</p>');
  setHtml("dashboardMemberRows",(data.members||[]).map(item=>`<tr><td><span class="member-avatar">${escapeHtml((item.name||"?").slice(0,1).toUpperCase())}</span><strong>${escapeHtml(item.name||"—")}</strong></td><td>${roleBadge(item.role||"Membros")}</td><td>${escapeHtml(item.clan||"—")}</td><td>Lv. ${Number(item.level||1)}</td><td>${Number(item.points||0).toLocaleString("pt-BR")}</td><td>${Number(item.present||0)}</td><td><strong class="ranking-points">${Number(item.rate||0)}%</strong></td><td><span class="online-status"><i></i>Ativo</span></td><td><span class="badge">Público</span></td></tr>`).join("")||'<tr><td colspan="9">Nenhum membro ativo publicado.</td></tr>');
}

function buildPublicHomePayload(){
  const today=dashboardDateOffset(0),yesterday=dashboardDateOffset(-1),month=today.slice(0,7);
  const previousMonthDate=new Date();previousMonthDate.setMonth(previousMonthDate.getMonth()-1);const previousMonth=`${previousMonthDate.getFullYear()}-${String(previousMonthDate.getMonth()+1).padStart(2,"0")}`;
  const members=visibleMembers(),attendance=homeAttendanceRecords();
  const todayPresence=attendance.filter(item=>(item.status===1||item.status===2)&&item.date===today).length;
  const yesterdayPresence=attendance.filter(item=>(item.status===1||item.status===2)&&item.date===yesterday).length;
  const monthEvents=monthlyEventKeys(month).size,previousMonthEvents=monthlyEventKeys(previousMonth).size;
  const joinedThisMonth=members.filter(member=>memberCreatedMonth(member)===month).length,joinedPreviousMonth=members.filter(member=>memberCreatedMonth(member)===previousMonth).length;
  const pointsRank=members.slice().sort((a,b)=>progressionFor(b).totalXp-progressionFor(a).totalXp||String(a.name).localeCompare(String(b.name),"pt-BR"));
  const top5=pointsRank.slice(0,5).map(member=>({name:String(member.name||"Membro").slice(0,80),role:String(member.role||member.memberRole||"Membros").slice(0,40),points:progressionFor(member).totalXp}));
  const recentPresence=attendance.filter(item=>memberForAttendance(item)&&(item.status===1||item.status===2)).sort((a,b)=>attendanceTime(b)-attendanceTime(a)).slice(0,5).map(item=>{const member=memberForAttendance(item);return{name:String(member?.name||"Membro").slice(0,80),role:String(member?.role||member?.memberRole||"Membros").slice(0,40),date:String(item.date||""),event:String(item.slot||item.kind||"Evento").slice(0,80),status:Number(item.status||0)}});
  const scheduled=state.events.filter(event=>event.date===today).map(event=>({title:String(event.title||event.type||"Evento").slice(0,100),time:String(event.time||"Horário não informado").slice(0,40),status:"Agendado",kind:normalizedEventKind(event.type)}));
  const attendanceEvents=[...new Map(attendance.filter(item=>item.date===today&&(item.status===1||item.status===2)).map(item=>[`${item.kind}|${item.slot}`,{title:item.kind==="worldboss"?"WorldBoss":item.kind==="purgatorio"?"Purgatório":String(item.slot||"Evento").slice(0,100),time:String(item.slot||"—").slice(0,40),status:"Em andamento",kind:item.kind}])).values()];
  const todayEvents=[...scheduled,...attendanceEvents].filter((item,index,array)=>array.findIndex(other=>other.title===item.title&&other.time===item.time)===index).slice(0,5);
  const labels=["Dom","Seg","Ter","Qua","Qui","Sex","Sáb"],weekly=[];for(let offset=-6;offset<=0;offset++){const date=new Date();date.setDate(date.getDate()+offset);const iso=localIsoDate(date);weekly.push({label:labels[date.getDay()],value:attendance.filter(item=>(item.status===1||item.status===2)&&item.date===iso).length})}
  const clanMap={};members.forEach(member=>{const clan=String(member.clan||"Sem clã").slice(0,60);clanMap[clan]=(clanMap[clan]||0)+stats(member).present});const clans=Object.entries(clanMap).sort((a,b)=>b[1]-a[1]).slice(0,5).map(([name,points])=>({name,points}));
  const present=attendance.filter(item=>item.status===1||item.status===2).length,marked=attendance.filter(item=>item.status===1||item.status===2||item.status===-1).length,generalRate=marked?Math.round(present/marked*100):0;
  const presenceActivities=attendance.filter(item=>memberForAttendance(item)).sort((a,b)=>attendanceTime(b)-attendanceTime(a)).slice(0,4).map(item=>{const member=memberForAttendance(item);return{icon:String(member?.name||"?").slice(0,1).toUpperCase(),title:`${String(member?.name||"Membro").slice(0,70)} ${{"1":"registrou presença","2":"chegou atrasado","3":"justificou a ausência","-1":"teve ausência","0":"está pendente"}[String(item.status)]||"teve o registro atualizado"} em ${String(item.slot||item.kind||"evento").slice(0,60)}`,time:formatHistoryDate(item.date)}});
  const memberActivities=members.slice().sort((a,b)=>memberCreatedTime(b)-memberCreatedTime(a)).slice(0,2).map(item=>({icon:String(item.name||"?").slice(0,1).toUpperCase(),title:`${String(item.name||"Membro").slice(0,70)} entrou para a equipe`,time:memberCreatedTime(item)?new Date(memberCreatedTime(item)).toLocaleDateString("pt-BR"):"Cadastro recente"}));
  const publicMembers=pointsRank.slice(0,100).map(member=>{const memberStats=stats(member),progression=progressionFor(member);return{name:String(member.name||"Membro").slice(0,80),role:String(member.role||member.memberRole||"Membros").slice(0,40),clan:String(member.clan||"").slice(0,60),level:progression.level,points:progression.totalXp,present:memberStats.present,rate:memberStats.rate}});
  const upcoming=[...state.events].filter(event=>String(event.date||"")>=today).sort((a,b)=>`${a.date||""} ${a.time||""}`.localeCompare(`${b.date||""} ${b.time||""}`))[0];
  return{version:1,membersCount:members.length,todayPresence,monthEvents,memberTrend:dashboardPercentChange(joinedThisMonth,joinedPreviousMonth),presenceTrend:dashboardPercentChange(todayPresence,yesterdayPresence),eventTrend:dashboardPercentChange(monthEvents,previousMonthEvents),top5,recentPresence,todayEvents,weekly,clans,generalRate,activities:[...presenceActivities,...memberActivities].slice(0,6),members:publicMembers,nextEvent:upcoming?{label:`${String(upcoming.title||upcoming.type||"Evento").slice(0,100)}${upcoming.date?` · ${formatHistoryDate(upcoming.date)}`:""}${upcoming.time?` ${String(upcoming.time).slice(0,20)}`:""}`}:{label:"Nenhum agendado"}};
}

function schedulePublicHomePublish(){
  if(!state.user||!editor()||!state.membersLoaded||!state.attendanceLoaded||!state.eventsLoaded)return;
  clearTimeout(publicHomePublishTimer);
  publicHomePublishTimer=setTimeout(async()=>{
    try{
      const payload=buildPublicHomePayload();
      const signature=JSON.stringify(payload);if(signature===lastPublicHomeSignature)return;
      await setDoc(doc(db,"public","home"),{...payload,generatedAt:serverTimestamp(),updatedBy:state.user.uid},{merge:false});
      lastPublicHomeSignature=signature;
    }catch(error){console.error("Falha ao publicar resumo da HOME pública:",error)}
  },700);
}


/* V12.1 — Dashboard Enterprise isolado */
/* HOME — resumo vivo com dados reais já carregados do Firebase */
function homeTimestampValue(value){
  const date=value?.toDate?.()||new Date(value||0);
  return Number.isNaN(date.getTime())?0:date.getTime();
}
function renderHomeLiveStrip(){
  const publicView=!state.user;
  const userName=publicView?"Visitante":(state.profile?.name||state.profile?.displayName||state.profile?.email||"Usuário");
  setText("homeLiveUser",userName);

  const today=localIsoDate();
  const upcoming=[...state.events]
    .filter(event=>String(event.date||"")>=today)
    .sort((a,b)=>`${a.date||""} ${a.time||""}`.localeCompare(`${b.date||""} ${b.time||""}`))[0];
  setText("homeNextEvent",upcoming?`${upcoming.title||upcoming.type||"Evento"}${upcoming.date?` · ${formatHistoryDate(upcoming.date)}`:""}${upcoming.time?` ${upcoming.time}`:""}`:(state.eventsLoaded?"Nenhum agendado":"Carregando..."));

  if(publicView){
    setText("homeUnreadNotifications","Entre para ver");
    setText("homeLastSync","Área pública");
    setText("homeLiveSubtitle","Entre na sua conta para visualizar membros, presenças, ranking, eventos e atividades reais da equipe.");
    return;
  }

  const readIds=new Set((state.notificationReads||[]).map(item=>item.notificationId||item.id));
  const unread=(state.notifications||[]).filter(item=>!readIds.has(item.id)).length;
  setText("homeUnreadNotifications",unread);

  const times=[
    ...state.attendance.map(item=>homeTimestampValue(item.updatedAt||item.createdAt)),
    ...state.events.map(item=>homeTimestampValue(item.updatedAt||item.createdAt)),
    ...state.members.map(item=>homeTimestampValue(item.updatedAt||item.createdAt))
  ].filter(Boolean);
  const latest=times.length?new Date(Math.max(...times)):new Date();
  setText("homeLastSync",new Intl.DateTimeFormat("pt-BR",{hour:"2-digit",minute:"2-digit"}).format(latest));
  setText("homeLiveSubtitle","Membros, presenças, eventos, ranking e atividades são preenchidos automaticamente com os registros reais do sistema.");
}


function renderHomeExecutiveSummary(){
  const publicView=!state.user;
  const profile=state.profile||{};
  const role=publicView?"Visitante":accessRoleLabel(currentAccessRole());
  const clan=publicView?"—":String(profile.clan||profile.cla||profile.memberClan||"—");
  const uid=state.user?.uid||"";
  const ownMember=(state.members||[]).find(item=>String(item.uid||item.userId||item.ownerUid||"")===uid)
    || (state.members||[]).find(item=>String(item.email||"").toLowerCase()===String(profile.email||state.user?.email||"").toLowerCase());
  const ownAttendance=ownMember?(state.attendance||[]).filter(item=>String(item.memberId||item.member||item.memberUid||"")===String(ownMember.id||ownMember.uid||"")):[];
  setText("homeWelcomeTitle",publicView?"Bem-vindo à 77 TEAM":`Bem-vindo, ${profile.name||profile.displayName||profile.nickname||"membro"}`);
  setText("homeUserMeta",publicView?"Visualização pública":`${role}${clan&&clan!=="—"?` · ${clan}`:""}`);
  setText("homeMyRole",publicView?"Entre para visualizar":role);
  setText("homeMyClan",publicView?"—":(ownMember?.clan||clan||"—"));
  setText("homeMyPoints",publicView?"—":Number(ownMember?.points||ownMember?.xp||0).toLocaleString("pt-BR"));
  setText("homeMyPresence",publicView?"—":ownAttendance.filter(item=>item.status===1||item.status===2).length);
  setText("homePendingRequests",(state.users||[]).filter(item=>item.status==="pending").length);
  setText("homeOpenTickets",(state.tickets||state.supportTickets||[]).filter(item=>!["closed","resolved","finalizado"].includes(String(item.status||"").toLowerCase())).length);
  setText("homeOpenPresence",(state.attendance||[]).filter(item=>item.status===0).length);
}

function renderEnterpriseDashboard(){
  renderHomeLiveStrip();
  renderHomeExecutiveSummary();
  const today=dashboardDateOffset(0);
  const yesterday=dashboardDateOffset(-1);
  const currentMonth=today.slice(0,7);

  const previousMonthDate=new Date();
  previousMonthDate.setMonth(previousMonthDate.getMonth()-1);
  const previousMonth=`${previousMonthDate.getFullYear()}-${String(previousMonthDate.getMonth()+1).padStart(2,"0")}`;

  const attendance=homeAttendanceRecords();
  const todayPresence=attendance.filter(item=>(item.status===1||item.status===2)&&item.date===today).length;
  const yesterdayPresence=attendance.filter(item=>(item.status===1||item.status===2)&&item.date===yesterday).length;
  setText("dashboardPresenceTrend",dashboardPercentChange(todayPresence,yesterdayPresence));

  const monthEvents=monthlyEventKeys(currentMonth).size;
  const previousMonthEvents=monthlyEventKeys(previousMonth).size;
  setText("dashboardEventTrend",dashboardPercentChange(monthEvents,previousMonthEvents));

  const joinedThisMonth=visibleMembers().filter(member=>memberCreatedMonth(member)===currentMonth).length;
  const joinedPreviousMonth=visibleMembers().filter(member=>memberCreatedMonth(member)===previousMonth).length;
  setText("dashboardMemberTrend",dashboardPercentChange(joinedThisMonth,joinedPreviousMonth));

  renderDashboardTodayEvents(today);
  renderDashboardWeeklyChart();
  renderDashboardClanPoints();
  renderDashboardPresenceRate();
  renderDashboardRecentActivity();
  renderDashboardServerStatus();
  schedulePublicHomePublish();
}

function dashboardDateOffset(days){
  const date=new Date();
  date.setDate(date.getDate()+days);
  return localIsoDate(date);
}

function memberCreatedTime(member){
  const raw=member?.createdAt;
  const date=raw?.toDate?raw.toDate():new Date(raw||0);
  return Number.isNaN(date.getTime())?0:date.getTime();
}

function memberCreatedMonth(member){
  const raw=member?.createdAt;
  if(typeof raw==="string"&&/^\d{4}-\d{2}/.test(raw))return raw.slice(0,7);
  const time=memberCreatedTime(member);
  return time?localIsoDate(new Date(time)).slice(0,7):"";
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
      kind:normalizedEventKind(event.type)
    }));

  const attendanceEvents=[...new Map(
    homeAttendanceRecords()
      .filter(item=>item.date===today&&(item.status===1||item.status===2))
      .map(item=>[
        `${item.kind}|${item.slot}`,
        {
          title:item.kind==="worldboss"?"WorldBoss":item.kind==="purgatorio"?"Purgatório":item.slot||"Evento",
          time:item.slot||"—",
          status:item.status===1||item.status===2?"Em andamento":"Agendado",
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
      <div><strong>${escapeHtml(item.title)}</strong><small>${escapeHtml(item.time)}</small></div>
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
    const iso=localIsoDate(date);
    days.push({
      iso,
      label:labels[date.getDay()],
      value:homeAttendanceRecords().filter(item=>(item.status===1||item.status===2)&&item.date===iso).length
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
  visibleMembers().forEach(member=>{
    const clan=member.clan||"Sem clã";
    clans[clan]=(clans[clan]||0)+stats(member).present;
  });

  const rows=Object.entries(clans).sort((a,b)=>b[1]-a[1]).slice(0,5);
  const max=Math.max(1,...rows.map(row=>row[1]));

  container.innerHTML=rows.map(([clan,points],index)=>`
    <div class="clan-points-row">
      <span>${index+1}</span>
      <strong>${escapeHtml(clan)}</strong>
      <div><i style="width:${Math.round(points/max*100)}%"></i></div>
      <b>${points}</b>
    </div>
  `).join("")||'<p class="empty-state">Nenhum clã com pontos.</p>';
}

function renderDashboardPresenceRate(){
  const attendance=homeAttendanceRecords();
  const present=attendance.filter(item=>item.status===1||item.status===2).length;
  const marked=attendance.filter(item=>item.status===1||item.status===2||item.status===-1).length;
  const rate=marked?Math.round(present/marked*100):0;
  const gauge=byId("dashboardRateGauge");

  if(gauge)gauge.style.setProperty("--rate",rate);
  setText("dashboardGeneralRate",`${rate}%`);
  setText("dashboardRateLabel",rate>=90?"Excelente!":rate>=70?"Muito bom":rate>=50?"Regular":"Atenção");
  setText("dashboardActiveSummary",`${visibleMembers().length} membros ativos`);
}

function renderDashboardRecentActivity(){
  const container=byId("dashboardRecentActivity");
  if(!container)return;

  const presenceActivities=state.attendance
    .filter(item=>memberForAttendance(item))
    .sort((a,b)=>attendanceTime(b)-attendanceTime(a))
    .slice(0,4)
    .map(item=>{
      const member=memberForAttendance(item);
      return {
        icon:(member?.name||"?").slice(0,1).toUpperCase(),
        title:`${member?.name||"Membro"} ${{"1":"registrou presença","2":"chegou atrasado","3":"justificou a ausência","-1":"teve ausência","0":"está pendente"}[String(item.status)]||"teve o registro atualizado"} em ${item.slot||item.kind}`,
        time:formatHistoryDate(item.date)
      };
    });

  const memberActivities=visibleMembers()
    .slice()
    .sort((a,b)=>memberCreatedTime(b)-memberCreatedTime(a))
    .slice(0,2)
    .map(item=>({
      icon:(item.name||"?").slice(0,1).toUpperCase(),
      title:`${item.name} entrou para a equipe`,
      time:memberCreatedTime(item)?new Date(memberCreatedTime(item)).toLocaleDateString("pt-BR"):"Cadastro recente"
    }));

  container.innerHTML=[...presenceActivities,...memberActivities].slice(0,6).map(item=>`
    <article class="recent-activity-item">
      <span>${escapeHtml(item.icon)}</span>
      <div><strong>${escapeHtml(item.title)}</strong><small>${escapeHtml(item.time)}</small></div>
    </article>
  `).join("")||'<p class="empty-state">Nenhuma atividade recente.</p>';
}

function renderDashboardServerStatus(){
  setText("dashboardServerUsers",visibleMembers().length);
  setText("dashboardServerRecords",homeAttendanceRecords().length);
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
function previousField(item,key){return Object.prototype.hasOwnProperty.call(item,key)?item[key]:deleteField()}
async function updateConversationMessages(messages,collectionName,nextData,rollbackData){
  const committed=[];
  try{
    for(let start=0;start<messages.length;start+=400){
      const group=messages.slice(start,start+400),batch=writeBatch(db);
      group.forEach(message=>batch.update(doc(db,collectionName,message.id),nextData(message)));
      await batch.commit();committed.push(group);
    }
  }catch(error){
    for(const group of committed.reverse()){
      const batch=writeBatch(db);group.forEach(message=>batch.update(doc(db,collectionName,message.id),rollbackData(message)));await batch.commit();
    }
    throw error;
  }
}
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
  const imageUrl=safeImageUrl(m.imageUrl);const image=imageUrl?`<a href="${escapeHtml(imageUrl)}" target="_blank" rel="noopener"><img class="support-image" src="${escapeHtml(imageUrl)}" alt="Imagem anexada"></a>`:"";
  const linkUrl=safeExternalUrl(m.link);const link=linkUrl?`<a class="support-link" href="${escapeHtml(linkUrl)}" target="_blank" rel="noopener noreferrer">🔗 Abrir link</a>`:"";
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
  setText("supportOpenCount",`${activeTickets.length} abertos`);
  if(!permissionEnabled("support_manage")){scrollSupportChats();return}
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
  if(byId("supportDeleteBtn"))byId("supportDeleteBtn").classList.toggle("hidden",!selected||selected.status!=="resolved"||!owner());
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
  if(normalizedLink&&!safeExternalUrl(normalizedLink))throw new Error("Informe um link HTTPS válido.");
  let currentTicket=ticketId;
  if(!currentTicket){const active=activeSupportTicketFor(ownerUid);currentTicket=active?.ticketId||newSupportTicketId(ownerUid)}
  const image=await uploadSupportImage(file,ownerUid,currentTicket);
  try{await addDoc(collection(db,"supportMessages"),{ticketId:currentTicket,ownerUid,ownerName,senderUid:state.user.uid,senderName:state.profile?.name||state.user.email,senderRole:currentAccessRole(),text:cleanText,link:normalizedLink,imageUrl:image.url,imagePath:image.path,status:permissionEnabled("support_manage")?"waiting_user":"open",createdAt:serverTimestamp()})}catch(error){if(image.path)try{await deleteObject(storageRef(storage,image.path))}catch{}throw error}
}
on("profileSupportForm","submit",async e=>{e.preventDefault();try{await sendSupportMessage({ownerUid:state.user.uid,ownerName:state.profile?.name||state.user.email,text:byId("profileSupportText").value,link:byId("profileSupportLink").value,file:byId("profileSupportImage").files?.[0]});e.target.reset();byId("profileSupportText")?.focus();toast("Mensagem enviada aos responsáveis.");}catch(error){toast(error.message||errMsg(error))}});
on("supportAdminForm","submit",async e=>{e.preventDefault();if(!permissionEnabled("support_manage")||!state.selectedSupportTicketId)return;const selected=supportTickets().find(t=>t.ticketId===state.selectedSupportTicketId);if(!selected||selected.status==="resolved")return;try{await sendSupportMessage({ownerUid:selected.ownerUid,ownerName:selected.ownerName,text:byId("supportAdminText").value,link:byId("supportAdminLink").value,file:byId("supportAdminImage").files?.[0],ticketId:selected.ticketId});e.target.reset();byId("supportAdminText")?.focus();await audit("Resposta de atendimento",`Resposta enviada em ${selected.ticketId} para ${selected.ownerName}`);toast("Resposta enviada.");}catch(error){toast(error.message||errMsg(error))}});
on("supportStatusSelect","change",async e=>{if(!permissionEnabled("support_manage")||!state.selectedSupportTicketId)return;const selected=supportTickets().find(t=>t.ticketId===state.selectedSupportTicketId);if(!selected)return;try{await updateConversationMessages(selected.msgs,"supportMessages",()=>({status:e.target.value,statusUpdatedAt:serverTimestamp(),statusUpdatedBy:state.user.uid}),m=>({status:m.status,statusUpdatedAt:previousField(m,"statusUpdatedAt"),statusUpdatedBy:previousField(m,"statusUpdatedBy")}));await audit("Status de atendimento",`${selected.ticketId}: ${supportStatusLabel(e.target.value)}`);if(e.target.value==="resolved"){state.supportView="finished";toast("Atendimento finalizado e movido para Finalizados.")}else toast("Status atualizado.");renderSupport();}catch(error){toast(errMsg(error))}});
on("supportSearch","input",renderSupport);
on("supportDeleteBtn","click",async()=>{if(!owner()||!state.selectedSupportTicketId)return;const selected=supportTickets().find(t=>t.ticketId===state.selectedSupportTicketId);if(!selected||selected.status!=="resolved")return;if(!confirm(`Excluir definitivamente ${selected.ticketId}? Esta ação não pode ser desfeita.`))return;try{for(const m of selected.msgs){if(m.imagePath){try{await deleteObject(storageRef(storage,m.imagePath))}catch(err){console.warn("Anexo não removido:",err)}}await deleteDoc(doc(db,"supportMessages",m.id))}await audit("Atendimento excluído",`${selected.ticketId} de ${selected.ownerName}`);state.selectedSupportTicketId="";state.selectedSupportOwnerUid="";toast("Atendimento excluído definitivamente.");}catch(error){toast(errMsg(error))}});
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
  const imageUrl=safeImageUrl(m.imageUrl);const image=imageUrl?`<a href="${escapeHtml(imageUrl)}" target="_blank" rel="noopener"><img class="support-image" src="${escapeHtml(imageUrl)}" alt="Imagem enviada no chat"></a>`:"";
  const linkUrl=safeExternalUrl(m.link);const link=linkUrl?`<a class="support-link" href="${escapeHtml(linkUrl)}" target="_blank" rel="noopener noreferrer">🔗 Abrir link</a>`:"";
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
  if(!permissionEnabled("support_manage"))return;

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
  if(byId("chatDeleteBtn"))byId("chatDeleteBtn").classList.toggle("hidden",!session||!finalized||!owner());
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
  if(normalizedLink&&!safeExternalUrl(normalizedLink))throw new Error("Informe um link HTTPS válido.");
  let current=chatId?chatSessions().find(s=>s.chatId===chatId&&s.ownerUid===ownerUid):activeChatFor(ownerUid);
  if(current?.status==="finalized")throw new Error("Este chat foi finalizado. Inicie uma nova conversa.");
  const currentChatId=current?.chatId||newPrivateChatId(ownerUid);
  const image=await uploadChatImage(file,ownerUid,currentChatId);
  try{await addDoc(collection(db,"chatMessages"),{chatId:currentChatId,chatStatus:"active",ownerUid,ownerName,senderUid:state.user.uid,senderName:state.profile?.name||state.user.email,senderRole:currentAccessRole(),text:cleanText,link:normalizedLink,imageUrl:image.url,imagePath:image.path,createdAt:serverTimestamp()})}catch(error){if(image.path)try{await deleteObject(storageRef(storage,image.path))}catch{}throw error}
  state.selectedChatId=currentChatId;
}
on("profileChatForm","submit",async e=>{e.preventDefault();try{await sendPrivateChat({ownerUid:state.user.uid,ownerName:state.profile?.name||state.user.email,text:byId("profileChatText").value,link:byId("profileChatLink").value,file:byId("profileChatImage").files?.[0]});e.target.reset();byId("profileChatText")?.focus();toast("Mensagem enviada no chat privado.");}catch(error){toast(error.message||errMsg(error))}});
on("chatAdminForm","submit",async e=>{e.preventDefault();if(!permissionEnabled("support_manage")||!state.selectedChatOwnerUid)return;const user=state.users.find(u=>u.id===state.selectedChatOwnerUid);try{await sendPrivateChat({ownerUid:state.selectedChatOwnerUid,ownerName:user?.name||user?.email||"Usuário",text:byId("chatAdminText").value,link:byId("chatAdminLink").value,file:byId("chatAdminImage").files?.[0],chatId:state.selectedChatId});e.target.reset();byId("chatAdminText")?.focus();await audit("Chat privado",`Mensagem enviada para ${user?.name||user?.email||state.selectedChatOwnerUid}`);toast("Mensagem enviada.");}catch(error){toast(error.message||errMsg(error))}});
on("chatFinishBtn","click",async()=>{if(!permissionEnabled("support_manage"))return;const session=selectedChatSession()||activeChatFor(state.selectedChatOwnerUid);if(!session||session.status==="finalized")return;if(!confirm(`Finalizar o chat ${session.chatId} com ${session.ownerName}? A conversa ficará somente para consulta dos responsáveis.`))return;try{await updateConversationMessages(session.msgs,"chatMessages",()=>({chatStatus:"finalized",finalizedAt:serverTimestamp(),finalizedBy:state.user.uid}),m=>({chatStatus:m.chatStatus||"active",finalizedAt:previousField(m,"finalizedAt"),finalizedBy:previousField(m,"finalizedBy")}));await audit("Chat privado finalizado",`${session.chatId} com ${session.ownerName}`);state.chatView="finished";toast("Chat finalizado e movido para Finalizados.");renderPrivateChat()}catch(error){toast(errMsg(error))}});
on("chatDeleteBtn","click",async()=>{if(!owner())return;const session=selectedChatSession();if(!session||session.status!=="finalized")return;if(!confirm(`Excluir definitivamente o chat ${session.chatId}?`))return;try{for(const message of session.msgs){if(message.imagePath)try{await deleteObject(storageRef(storage,message.imagePath))}catch{}await deleteDoc(doc(db,"chatMessages",message.id))}await audit("Chat privado excluído",`${session.chatId} com ${session.ownerName}`);state.selectedChatId="";state.selectedChatOwnerUid="";toast("Chat excluído definitivamente.")}catch(error){toast(errMsg(error))}});
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
  try{await addDoc(collection(db,"audit"),{userId:state.user.uid,userName:state.profile?.name||state.profile?.email||"Usuário",action:"Primeiro acesso concluído",details:"Perfil e personagem configurados pelo usuário.",createdAt:serverTimestamp()})}catch(error){console.warn("Auditoria do primeiro acesso não registrada:",error)}
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
  if(!permissionEnabled("access_staff"))return;const root=byId("registros");if(!root)return;populateRecordsFilters();
  const rows=recordsFilteredRows();setText("recordsResultCount",`${rows.length} registro${rows.length===1?"":"s"}`);setText("recordsTotal",rows.length);setText("recordsPresent",rows.filter(x=>Number(x.status)===1).length);setText("recordsJustified",rows.filter(x=>Number(x.status)===3).length);setText("recordsAbsent",rows.filter(x=>Number(x.status)===-1).length);setText("recordsPanelTitle",recordsMode==="individual"?"Consulta Individual":"Consulta Geral");setHtml("recordsRows",recordsRowsHtml(rows));
  document.querySelectorAll("[data-record-mode]").forEach(btn=>btn.classList.toggle("primary",btn.dataset.recordMode===recordsMode));
  const member=byId("recordsMember");if(member){member.disabled=false;member.querySelector('option[value=""]')?.replaceChildren(document.createTextNode(recordsMode==="individual"?"Selecione um membro":"Todos os membros"));}
}
function recordsExportMatrix(){return [["Data","Membro","Clã","Evento","Horário/Atividade","Status","Observação","Responsável","Atualização"],...recordsFilteredRows().map(i=>[i.date||"",i.memberName||"",i.clan||"",presenceTypeLabel(i.kind),i.slot||"",presenceStatus(i.status).label,i.note||"",i.updatedByName||"",recordTimestamp(i)])]}
function downloadRecordsCsv(){const matrix=recordsExportMatrix(),csv=matrix.map(row=>row.map(v=>`"${csvSafe(v).replaceAll('"','""')}"`).join(";")).join("\n"),blob=new Blob(["\ufeff"+csv],{type:"text/csv;charset=utf-8"}),a=document.createElement("a");a.href=URL.createObjectURL(blob);a.download=`77-team-registros-${recordsMode}-${todayIso()}.csv`;a.click();URL.revokeObjectURL(a.href)}
function downloadRecordsExcel(){const matrix=recordsExportMatrix(),html=`<html><head><meta charset="utf-8"></head><body><table border="1">${matrix.map((row,index)=>`<tr>${row.map(v=>index?`<td>${escapeHtml(v)}</td>`:`<th>${escapeHtml(v)}</th>`).join("")}</tr>`).join("")}</table></body></html>`,blob=new Blob(["\ufeff"+html],{type:"application/vnd.ms-excel"}),a=document.createElement("a");a.href=URL.createObjectURL(blob);a.download=`77-team-registros-${recordsMode}-${todayIso()}.xls`;a.click();URL.revokeObjectURL(a.href)}
function printRecords(autoPrint=true){const rows=recordsFilteredRows(),memberName=recordsMode==="individual"?(state.members.find(m=>m.id===byId("recordsMember")?.value)?.name||"Membro não selecionado"):"Todos os membros",w=window.open("","_blank");if(!w)return toast("Permita pop-ups para gerar o relatório.");w.document.write(`<html><head><meta charset="utf-8"><title>77 TEAM - Registros</title><style>body{font-family:Arial;padding:26px;color:#151515}h1{margin:0}p{color:#555}table{width:100%;border-collapse:collapse;font-size:12px;margin-top:20px}th,td{border:1px solid #bbb;padding:7px;text-align:left}th{background:#eee}.summary{display:flex;gap:18px;margin:18px 0}.summary b{font-size:20px;display:block}</style></head><body><h1>77 TEAM Manager</h1><p>${recordsMode==="individual"?`Registro Individual — ${escapeHtml(memberName)}`:"Registro Geral de Presenças"}</p><div class="summary"><span><b>${rows.length}</b>Total</span><span><b>${rows.filter(x=>x.status===1).length}</b>Presentes</span><span><b>${rows.filter(x=>x.status===3).length}</b>Justificados</span><span><b>${rows.filter(x=>x.status===-1).length}</b>Ausentes</span></div><table><thead><tr><th>Data</th><th>Membro</th><th>Clã</th><th>Evento</th><th>Horário</th><th>Status</th><th>Observação</th><th>Responsável</th></tr></thead><tbody>${rows.map(i=>`<tr><td>${escapeHtml(i.date||"—")}</td><td>${escapeHtml(i.memberName||"—")}</td><td>${escapeHtml(i.clan||"—")}</td><td>${escapeHtml(presenceTypeLabel(i.kind))}</td><td>${escapeHtml(i.slot||"—")}</td><td>${escapeHtml(presenceStatus(i.status).label)}</td><td>${escapeHtml(i.note||"—")}</td><td>${escapeHtml(i.updatedByName||"—")}</td></tr>`).join("")}</tbody></table></body></html>`);finalizePrintWindow(w,autoPrint)}
document.addEventListener("click",event=>{const mode=event.target.closest("[data-record-mode]");if(mode){recordsMode=mode.dataset.recordMode;renderRecordsCenter();return}});
["recordsSearch"].forEach(id=>on(id,"input",renderRecordsCenter));["recordsMember","recordsDateFrom","recordsDateTo","recordsKind","recordsSlot","recordsStatus","recordsClan"].forEach(id=>on(id,"change",renderRecordsCenter));
on("recordsClear","click",()=>{["recordsSearch","recordsMember","recordsDateFrom","recordsDateTo","recordsKind","recordsSlot","recordsStatus","recordsClan"].forEach(id=>setValue(id,""));renderRecordsCenter()});on("recordsCsv","click",downloadRecordsCsv);on("recordsExcel","click",downloadRecordsExcel);on("recordsPrint","click",()=>printRecords(true));on("recordsPdf","click",()=>printRecords(true));

// V20.9 — Hub STAFF integrado ao menu e aos módulos operacionais.

// V22.7.2 — matriz configurável de permissões preservada
on("saveRolePermissions","click",saveConfigurableRolePermissions);
on("resetRolePermissions","click",()=>{
  if(!owner())return toast("Somente o DEV pode alterar permissões.");
  if(!confirm("Restaurar todas as permissões para o padrão seguro? As alterações só serão publicadas após clicar em Salvar permissões."))return;
  rolePermissionsDirty=false;
  state.settings={...state.settings,rolePermissions:defaultRolePermissions()};
  renderRolePermissionMatrix();
  markRolePermissionsDirty();
  setText("rolePermissionStatus","Padrão seguro carregado. Clique em Salvar permissões.");
});
on("rolePermissionSearch","input",event=>{
  const term=String(event.target.value||"").trim().toLowerCase();
  document.querySelectorAll("[data-permission-row]").forEach(row=>row.classList.toggle("hidden",term&&!row.dataset.search.includes(term)));
  document.querySelectorAll(".permission-group-row").forEach(group=>{let next=group.nextElementSibling,visible=false;while(next&&!next.classList.contains("permission-group-row")){if(next.matches("[data-permission-row]")&&!next.classList.contains("hidden"))visible=true;next=next.nextElementSibling}group.classList.toggle("hidden",!visible)});
});
document.addEventListener("change",event=>{if(event.target.matches("[data-role-permission]"))markRolePermissionsDirty()});
document.addEventListener("click",event=>{
  const all=event.target.closest("[data-permission-role-all]"),none=event.target.closest("[data-permission-role-none]");
  const groupAll=event.target.closest("[data-permission-group-all]"),groupNone=event.target.closest("[data-permission-group-none]");
  if(!all&&!none&&!groupAll&&!groupNone)return;
  if(!owner())return toast("Somente o DEV pode alterar permissões.");
  if(groupAll||groupNone){
    const group=(groupAll||groupNone).dataset.permissionGroupAll||(groupAll||groupNone).dataset.permissionGroupNone;
    document.querySelectorAll(`[data-permission-row][data-permission-group="${CSS.escape(group)}"] input[data-role-permission]`).forEach(input=>{if(!input.disabled)input.checked=Boolean(groupAll)});
    markRolePermissionsDirty();return;
  }
  const role=(all||none).dataset.permissionRoleAll||(all||none).dataset.permissionRoleNone,checked=Boolean(all);
  document.querySelectorAll(`[data-permission-role="${role}"]`).forEach(input=>{if(!input.disabled)input.checked=checked});
  markRolePermissionsDirty();
});
window.addEventListener("beforeunload",event=>{if(!rolePermissionsDirty&&!maintenanceFormDirty&&!loginCustomizationDirty&&!settingsFormDirty)return;event.preventDefault();event.returnValue=""});
