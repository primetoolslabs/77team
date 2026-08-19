import { firebaseConfig, FIREBASE_VERSION, firebaseConfigured } from './firebase-config.js';

const $ = (s) => document.querySelector(s);
const $$ = (s) => [...document.querySelectorAll(s)];
const state = { user:null, profile:null, users:[], members:[], unsubs:[] };
const SDK = `https://www.gstatic.com/firebasejs/${FIREBASE_VERSION}`;

function toast(message, type='info'){
  const el=$('#toast'); el.textContent=message; el.dataset.type=type; el.classList.add('show');
  clearTimeout(toast.t); toast.t=setTimeout(()=>el.classList.remove('show'),3500);
}
function showScreen(id){ $$('.screen').forEach(x=>x.classList.toggle('hidden',x.id!==id)); }
function nav(page){ $$('.page').forEach(x=>x.classList.toggle('active',x.id===page)); $$('.nav-btn').forEach(x=>x.classList.toggle('active',x.dataset.page===page)); }
function normalizeRole(v){
  v=String(v||'member').toLowerCase();
  if(v==='dev')return 'dev'; if(['leadership','liderança','lideranca'].includes(v))return 'leadership'; if(v==='staff')return 'staff'; return 'member';
}
function roleLabel(v){ return ({dev:'DEV',leadership:'Liderança',staff:'Staff',member:'Membro'})[normalizeRole(v)]; }
function canApprove(){ return ['dev','leadership','staff'].includes(normalizeRole(state.profile?.accessRole)); }
function canApproveRole(requested){
  const me=normalizeRole(state.profile?.accessRole), target=normalizeRole(requested);
  if(me==='dev') return true;
  if(me==='leadership') return ['staff','member'].includes(target);
  if(me==='staff') return target==='member';
  return false;
}
function esc(v){return String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));}
function err(e){
  const map={
    'auth/invalid-credential':'E-mail ou senha incorretos.',
    'auth/email-already-in-use':'Este e-mail já possui cadastro.',
    'auth/weak-password':'A senha deve ter pelo menos 6 caracteres.',
    'auth/invalid-email':'Informe um e-mail válido.',
    'auth/operation-not-allowed':'Ative E-mail/Senha no Firebase Authentication.',
    'permission-denied':'O Firestore bloqueou esta operação. Publique o firestore.rules da V24.'
  };
  return map[e?.code] || `${e?.code||'erro'}: ${e?.message||'Falha inesperada'}`;
}

if(!firebaseConfigured()){
  showScreen('setupScreen');
  $('#setupProjectId').textContent=firebaseConfig.projectId;
  throw new Error('Firebase não configurado. Edite js/firebase-config.js');
}

const { initializeApp } = await import(`${SDK}/firebase-app.js`);
const { getAuth, onAuthStateChanged, signInWithEmailAndPassword, createUserWithEmailAndPassword, signOut } = await import(`${SDK}/firebase-auth.js`);
const { getFirestore, doc, setDoc, getDoc, updateDoc, collection, query, where, onSnapshot, serverTimestamp, writeBatch } = await import(`${SDK}/firebase-firestore.js`);

const app=initializeApp(firebaseConfig);
const auth=getAuth(app);
const db=getFirestore(app);

function clearSubs(){ state.unsubs.splice(0).forEach(fn=>{try{fn()}catch{}}); }

async function loadProfile(uid){
  const snap=await getDoc(doc(db,'users',uid));
  return snap.exists()?{id:snap.id,...snap.data()}:null;
}
function renderIdentity(){
  const p=state.profile;
  $('#whoName').textContent=p?.name||state.user?.email||'Visitante';
  $('#whoRole').textContent=p?roleLabel(p.accessRole):'Visitante';
  $('#logoutBtn').classList.toggle('hidden',!state.user);
  $('#loginBtn').classList.toggle('hidden',!!state.user);
  $('#requestsNav').classList.toggle('hidden',!canApprove());
  $('#membersNav').classList.toggle('hidden',!state.user);
}
function bindRealtime(){
  clearSubs();
  state.unsubs.push(onSnapshot(collection(db,'members'),snap=>{
    state.members=snap.docs.map(d=>({id:d.id,...d.data()})); renderHome(); renderMembers();
  },()=>{}));
  if(canApprove()){
    const q=query(collection(db,'users'),where('status','==','pending'));
    state.unsubs.push(onSnapshot(q,snap=>{
      state.users=snap.docs.map(d=>({id:d.id,...d.data()})); renderRequests(); renderHome();
    },e=>toast(err(e),'error')));
  }
}
function renderHome(){
  $('#memberCount').textContent=state.members.length;
  $('#pendingCount').textContent=canApprove()?state.users.length:'—';
  $('#sessionStatus').textContent=state.user?'Conectado':'Visitante';
  $('#homeMessage').textContent=state.user
    ? `Bem-vindo, ${state.profile?.name||state.user.email}. Seu acesso é ${roleLabel(state.profile?.accessRole)}.`
    : 'Consulte as informações públicas. Entre ou solicite acesso para usar as áreas internas.';
}
function renderMembers(){
  const body=$('#memberRows');
  body.innerHTML=state.members.length?state.members.map(m=>`<tr><td>${esc(m.name)}</td><td>${esc(m.clan||'—')}</td><td>${esc(m.memberRole||'Membro')}</td><td><span class="status ok">Ativo</span></td></tr>`).join(''):'<tr><td colspan="4" class="empty">Nenhum membro cadastrado.</td></tr>';
}
function renderRequests(){
  const body=$('#requestRows');
  const rows=state.users.filter(u=>canApproveRole(u.requestedAccessRole||'member'));
  body.innerHTML=rows.length?rows.map(u=>`<tr><td>${esc(u.name)}</td><td>${esc(u.email)}</td><td>${esc(roleLabel(u.requestedAccessRole))}</td><td>${esc(u.clan||'—')}</td><td><button class="btn small approve" data-uid="${u.id}">Aprovar</button><button class="btn small danger reject" data-uid="${u.id}">Rejeitar</button></td></tr>`).join(''):'<tr><td colspan="5" class="empty">Nenhuma solicitação pendente para o seu cargo.</td></tr>';
}

$('#loginForm').addEventListener('submit',async e=>{
  e.preventDefault(); const email=$('#loginEmail').value.trim(), password=$('#loginPassword').value;
  try{ await signInWithEmailAndPassword(auth,email,password); }
  catch(ex){ toast(err(ex),'error'); }
});
$('#registerForm').addEventListener('submit',async e=>{
  e.preventDefault();
  const name=$('#regName').value.trim(), email=$('#regEmail').value.trim(), password=$('#regPassword').value, clan=$('#regClan').value, requestedAccessRole=$('#regRole').value;
  if(!name||!clan){toast('Preencha nome e clã.','error');return;}
  try{
    const cred=await createUserWithEmailAndPassword(auth,email,password);
    await setDoc(doc(db,'users',cred.user.uid),{
      name,email,clan,requestedAccessRole,accessRole:'member',memberRole:'Membros',status:'pending',active:false,createdAt:serverTimestamp(),updatedAt:serverTimestamp()
    });
    toast('Solicitação enviada. Aguarde a aprovação.','ok');
    await signOut(auth); $('#registerForm').reset();
  }catch(ex){toast(err(ex),'error');}
});
$('#logoutBtn').addEventListener('click',()=>signOut(auth));
$('#loginBtn').addEventListener('click',()=>$('#authModal').showModal());
$('#openRegister').addEventListener('click',()=>{ $('#authModal').close(); $('#registerModal').showModal(); });
$$('[data-close]').forEach(b=>b.addEventListener('click',()=>b.closest('dialog').close()));
$$('.nav-btn').forEach(b=>b.addEventListener('click',()=>nav(b.dataset.page)));

$('#requestRows').addEventListener('click',async e=>{
  const btn=e.target.closest('button[data-uid]'); if(!btn)return;
  const u=state.users.find(x=>x.id===btn.dataset.uid); if(!u)return;
  if(!canApproveRole(u.requestedAccessRole||'member')){toast('Seu cargo não pode aprovar esta solicitação.','error');return;}
  try{
    if(btn.classList.contains('approve')){
      const accessRole=normalizeRole(u.requestedAccessRole||'member');
      const memberRole=accessRole==='staff'?'Staff':'Membros';
      const batch=writeBatch(db);
      batch.update(doc(db,'users',u.id),{status:'approved',active:true,accessRole,memberRole,approvedAt:serverTimestamp(),approvedBy:state.user.uid,updatedAt:serverTimestamp()});
      batch.set(doc(db,'members',u.id),{userId:u.id,name:u.name,email:u.email,clan:u.clan||'',accessRole,memberRole,active:true,createdAt:serverTimestamp(),updatedAt:serverTimestamp()},{merge:true});
      await batch.commit(); toast(`${u.name} aprovado.`, 'ok');
    }else{
      await updateDoc(doc(db,'users',u.id),{status:'rejected',active:false,rejectedAt:serverTimestamp(),rejectedBy:state.user.uid,updatedAt:serverTimestamp()});
      toast(`${u.name} rejeitado.`,'ok');
    }
  }catch(ex){ toast(err(ex),'error'); }
});

onAuthStateChanged(auth,async user=>{
  state.user=user; state.profile=null; clearSubs();
  if(!user){ renderIdentity(); renderHome(); nav('home'); return; }
  try{
    const profile=await loadProfile(user.uid);
    if(!profile){ toast('Conta sem perfil no Firestore.','error'); await signOut(auth); return; }
    if(profile.status!=='approved' || profile.active!==true){
      toast(profile.status==='pending'?'Sua solicitação ainda está pendente.':'Sua conta não está liberada.','error'); await signOut(auth); return;
    }
    state.profile=profile; renderIdentity(); bindRealtime(); renderHome(); nav('home');
  }catch(ex){toast(err(ex),'error'); await signOut(auth);}
});

renderIdentity(); renderHome();
