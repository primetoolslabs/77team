import {firebaseConfig,FIREBASE_VERSION} from "./firebase-config.js";
import {authError} from "./auth.js";
import {CLANS,MEMBER_ROLES,ALL_ROLES} from "./roles.js";
import {state,canEdit,isOwner} from "./store.js";
import {renderAll,applyPermissions} from "./render.js";

const SDK=`https://www.gstatic.com/firebasejs/${FIREBASE_VERSION}`;
const {initializeApp,deleteApp}=await import(`${SDK}/firebase-app.js`);
const {getAuth,onAuthStateChanged,signInWithEmailAndPassword,createUserWithEmailAndPassword,signOut}=await import(`${SDK}/firebase-auth.js`);
const {getFirestore,collection,doc,getDoc,setDoc,addDoc,updateDoc,deleteDoc,onSnapshot,serverTimestamp,writeBatch}=await import(`${SDK}/firebase-firestore.js`);

const app=initializeApp(firebaseConfig);
const auth=getAuth(app);
const db=getFirestore(app);
const $=s=>document.querySelector(s);

function toast(msg){const el=$("#toast");el.textContent=msg;el.classList.add("show");setTimeout(()=>el.classList.remove("show"),3000)}
function showAuth(){$("#bootScreen").classList.add("hidden");$("#app").classList.add("hidden");$("#authScreen").classList.remove("hidden")}
function showApp(){$("#bootScreen").classList.add("hidden");$("#authScreen").classList.add("hidden");$("#app").classList.remove("hidden")}
function fillSelects(){
  $("#memberRole").innerHTML=ALL_ROLES.map(x=>`<option>${x}</option>`).join("");
  $("#memberClan").innerHTML='<option value="">Selecione o clã</option>'+CLANS.map(x=>`<option>${x}</option>`).join("");
}
fillSelects();

async function ownerExists(){try{return (await getDoc(doc(db,"system","owner"))).exists()}catch{return false}}
ownerExists().then(exists=>$("#toggleBootstrap").classList.toggle("hidden",exists));

$("#toggleSignup").onclick=()=>$("#signupBox").classList.toggle("hidden");
$("#toggleBootstrap").onclick=()=>$("#bootstrapBox").classList.toggle("hidden");

$("#loginForm").onsubmit=async e=>{e.preventDefault();try{await signInWithEmailAndPassword(auth,$("#loginEmail").value,$("#loginPassword").value)}catch(err){toast(authError(err))}};
$("#guestButton").onclick=()=>{state.guest=true;state.profile={role:"guest",name:"Visitante"};showApp();applyPermissions();subscribePublic()};

$("#bootstrapForm").onsubmit=async e=>{
  e.preventDefault();
  try{
    if(await ownerExists())throw new Error("Proprietário já configurado.");
    const email=$("#bootstrapEmail").value.trim().toLowerCase();
    const pass=$("#bootstrapPassword").value;
    if(pass!==$("#bootstrapConfirm").value)throw new Error("As senhas não conferem.");
    const cred=await createUserWithEmailAndPassword(auth,email,pass);
    await setDoc(doc(db,"users",cred.user.uid),{name:email.split("@")[0],email,role:"owner",active:true,status:"approved",createdAt:serverTimestamp()});
    await setDoc(doc(db,"system","owner"),{uid:cred.user.uid,email,createdAt:serverTimestamp()});
    toast("Proprietário criado.");
  }catch(err){toast(authError(err))}
};

$("#signupForm").onsubmit=async e=>{
  e.preventDefault();
  let secondary;
  try{
    secondary=initializeApp(firebaseConfig,"signup-"+Date.now());
    const secondaryAuth=getAuth(secondary);
    const secondaryDb=getFirestore(secondary);
    const name=$("#signupName").value.trim(),email=$("#signupEmail").value.trim().toLowerCase(),pass=$("#signupPassword").value;
    const cred=await createUserWithEmailAndPassword(secondaryAuth,email,pass);
    await setDoc(doc(secondaryDb,"users",cred.user.uid),{name,email,role:"member",active:false,status:"pending",createdAt:serverTimestamp()});
    await signOut(secondaryAuth);await deleteApp(secondary);
    toast("Cadastro enviado.");
    e.target.reset();
  }catch(err){if(secondary)try{await deleteApp(secondary)}catch{};toast(authError(err))}
};

$("#logoutButton").onclick=async()=>{if(state.guest){state.guest=false;showAuth()}else await signOut(auth)};

onAuthStateChanged(auth,async user=>{
  if(state.guest)return;
  state.user=user;
  if(!user){showAuth();return}
  try{
    const snap=await getDoc(doc(db,"users",user.uid));
    if(!snap.exists()){await signOut(auth);return toast("Perfil não encontrado.");}
    state.profile={id:user.uid,...snap.data()};
    if(state.profile.active===false||state.profile.status==="pending"){await signOut(auth);return toast("Conta ainda não aprovada.");}
    showApp();applyPermissions();subscribeAll();
  }catch(err){toast(authError(err));showAuth()}
});

let unsubs=[];
function clearSubs(){unsubs.forEach(fn=>fn());unsubs=[]}
function subscribePublic(){
  clearSubs();
  unsubs.push(onSnapshot(collection(db,"members"),s=>{state.members=s.docs.map(d=>({id:d.id,...d.data()}));render()}));
  unsubs.push(onSnapshot(collection(db,"attendance"),s=>{state.attendance=s.docs.map(d=>({id:d.id,...d.data()}));render()}));
}
function subscribeAll(){
  subscribePublic();
  if(canEdit())unsubs.push(onSnapshot(collection(db,"users"),s=>{state.users=s.docs.map(d=>({id:d.id,...d.data()}));render()}));
  if(isOwner())unsubs.push(onSnapshot(collection(db,"audit"),s=>{state.audit=s.docs.map(d=>({id:d.id,...d.data()}));render()}));
}
function render(){
  renderAll(handlePresence);
  document.querySelectorAll("[data-clan]").forEach(sel=>sel.innerHTML='<option value="">Clã</option>'+CLANS.map(x=>`<option>${x}</option>`).join(""));
  document.querySelectorAll("[data-role]").forEach(sel=>sel.innerHTML=MEMBER_ROLES.map(x=>`<option>${x}</option>`).join(""));
}
async function audit(action,details){if(!state.user||!canEdit())return;try{await addDoc(collection(db,"audit"),{userId:state.user.uid,userName:state.profile.name,action,details,createdAt:serverTimestamp()})}catch{}}

async function handlePresence(payload){
  if(!canEdit())return;
  const [kind,memberId,slot]=payload.split("|");
  const member=state.members.find(m=>m.id===memberId);if(!member)return;
  const id=(kind+"__"+memberId+"__"+slot).replace(/[^a-zA-Z0-9_-]/g,"_");
  const ref=doc(db,"attendance",id);
  const current=state.attendance.find(a=>a.id===id)?.status||0;
  const next=current===0?1:current===1?-1:0;
  if(next===0)await deleteDoc(ref);
  else await setDoc(ref,{memberId,memberName:member.name,clan:member.clan,role:member.role,kind,slot,status:next,date:new Date().toISOString().slice(0,10),updatedByName:state.profile.name,updatedAt:serverTimestamp()});
  await audit("presença alterada",`${member.name} · ${kind} · ${slot}`);
}

$("#memberForm").onsubmit=async e=>{e.preventDefault();if(!canEdit())return;await addDoc(collection(db,"members"),{name:$("#memberName").value.trim(),role:$("#memberRole").value,clan:$("#memberClan").value,createdAt:serverTimestamp()});e.target.reset()};
document.addEventListener("click",async e=>{
  const del=e.target.closest("[data-delete-member]");
  if(del&&canEdit())await deleteDoc(doc(db,"members",del.dataset.deleteMember));
  const approve=e.target.closest("[data-approve]");
  if(approve&&canEdit()){
    const u=state.users.find(x=>x.id===approve.dataset.approve);if(!u)return;
    const clan=document.querySelector(`[data-clan="${u.id}"]`).value;
    const role=document.querySelector(`[data-role="${u.id}"]`).value;
    if(!clan)return toast("Selecione o clã.");
    const batch=writeBatch(db);
    batch.update(doc(db,"users",u.id),{active:true,status:"approved",clan,memberRole:role,approvedAt:serverTimestamp()});
    batch.set(doc(db,"members",u.id),{name:u.name,role,clan,userId:u.id,createdAt:serverTimestamp()});
    await batch.commit();await audit("membro aprovado",u.email);
  }
});

$("#staffForm").onsubmit=async e=>{
  e.preventDefault();if(!isOwner())return;
  let secondary;
  try{
    secondary=initializeApp(firebaseConfig,"staff-"+Date.now());
    const sa=getAuth(secondary),sd=getFirestore(secondary);
    const name=$("#staffName").value.trim(),email=$("#staffEmail").value.trim().toLowerCase(),pass=$("#staffPassword").value;
    const cred=await createUserWithEmailAndPassword(sa,email,pass);
    await setDoc(doc(sd,"users",cred.user.uid),{name,email,role:"staff",active:true,status:"approved",createdAt:serverTimestamp()});
    await signOut(sa);await deleteApp(secondary);e.target.reset();toast("Staff criado.");
  }catch(err){if(secondary)try{await deleteApp(secondary)}catch{};toast(authError(err))}
};

$("#today").textContent=new Intl.DateTimeFormat("pt-BR",{dateStyle:"full"}).format(new Date());
