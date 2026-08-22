import assert from "node:assert/strict";
import {readFileSync} from "node:fs";
import {execFileSync} from "node:child_process";
import {fileURLToPath} from "node:url";

const root=new URL("../",import.meta.url);
const read=file=>readFileSync(new URL(file,root),"utf8");
const main=read("js/main.js"),ui=read("js/ui.js"),rules=read("firestore.rules"),html=read("index.html");
const pdfGenerator=read("js/pdf-generator.js");
const firebase=JSON.parse(read("firebase.json")),manifest=JSON.parse(read("manifest.json")),indexes=JSON.parse(read("firestore.indexes.json"));

execFileSync(process.execPath,["--check",fileURLToPath(new URL("js/main.js",root))],{stdio:"pipe"});
execFileSync(process.execPath,["--check",fileURLToPath(new URL("js/pdf-generator.js",root))],{stdio:"pipe"});
assert.equal(manifest.version,"22.9.32");
assert.equal(firebase.firestore.indexes,"firestore.indexes.json");
assert.ok(firebase.emulators?.firestore?.port);
assert.ok(indexes.indexes.some(index=>index.collectionGroup==="supportMessages"));

const legacyComment=main.indexOf("/* Relatório legado");
const activeDateFormatter=main.indexOf("function formatHistoryDate");
assert.ok(activeDateFormatter>=0&&activeDateFormatter<legacyComment,"formatHistoryDate precisa estar em código ativo");
assert.ok(!/\bdev\(\)/.test(main),"Use owner() no cliente; dev() não existe");
assert.ok(!main.includes("applyAccessControl("),"applyAccessControl não existe");
assert.ok(main.includes("applyPermissions();"));
assert.ok(!html.includes('id="setupScreen"'));
assert.ok(!html.includes('id="openFirstDevSetup"'));
assert.ok(!main.includes('"first-dev-"+Date.now()'));
assert.ok(!main.includes('"setupScreen"'));
assert.ok(main.includes("deleteUser(cred.user)"));
assert.ok(main.includes('createError?.code!=="auth/email-already-in-use"'));
assert.ok(main.includes('await cred.user.getIdToken(true)'));
assert.ok(main.includes('accessRole:"member",memberRole:"Membros"'));
assert.ok(rules.includes("request.resource.data.email == request.auth.token.email"));
assert.ok(html.includes('id="publicHomeBanner"'));
assert.ok(html.includes('id="publicLoginButton"'));
assert.ok(main.includes("function showPublicHome"));
assert.ok(main.includes('if(!state.user)return page==="dashboard"||page==="sobre"'));
assert.ok(main.includes('document.body.dataset.publicView="true"'));
assert.ok(main.includes("updateConversationMessages"));
assert.ok(!main.includes("Atendimento muito longo para finalização atômica"));
assert.ok(main.includes("window.TeamManagerState=state"));
assert.ok(ui.includes("window.TeamManagerState||{}"));
assert.ok(ui.includes("window.TeamManagerIsOwner"));

assert.ok(main.includes("persistentLocalCache"));
assert.ok(main.includes("controlledPresenceRestore"));
assert.ok(main.includes("executePersistentRollback"));
assert.ok(main.includes("O backup não contém a conta DEV autenticada"));
assert.ok(main.includes("Totais divergentes no backup semanal"));
assert.ok(main.includes("ID duplicado em"));
assert.ok(main.includes("avatar inválido ou acima do limite"));
assert.ok(main.includes("Arquivo acima do limite seguro de 200 MB"));
assert.ok(main.includes("O backup excede o limite seguro de 200 MB"));
assert.ok(!main.includes("limite seguro de 50 MB"));
assert.ok(main.includes("updateEmail(auth.currentUser,previousEmail)"));
assert.ok(main.includes('doc(db,"settings","private")'));
assert.ok(main.includes("csvSafe("));
assert.ok(main.includes("safeExternalUrl("));
assert.ok(main.includes("rememberLoginV222"));
assert.ok(!main.includes('byId("rememberAccess")'));

assert.ok(rules.includes("validOptionalHttps"));
assert.ok(rules.includes("request.resource.data.senderRole == roleKey()"));
assert.ok(rules.includes("request.resource.data.chatStatus in ['active','finalized']"));
assert.ok(rules.includes("allow create: if dev() || (active() && permission('events_manage') && request.resource.data.keys().hasOnly(['title','date','time','type','description','createdBy','createdAt'])"));
assert.ok(rules.includes("allow create: if dev() || (staffAccess() && permission('presence_reset')"));
assert.ok(rules.includes("allow create: if dev() || (staffAccess() && permission('xp_manage')"));
assert.ok(rules.includes("!request.resource.data.diff(resource.data).affectedKeys().hasAny(['rolePermissions','security','maintenance','advanced','loginCustomization'])"));
assert.ok(rules.includes("allow update, delete: if dev();"));
assert.ok(main.includes('key:"members_delete",label:"Excluir membros",defaults:{dev:true,leadership:true,staff:true,member:false}'));
assert.ok(main.includes('function permissionRequired(key,role){return role==="dev"||key==="access_home"}'));
assert.ok(!main.includes('role==="staff"&&["requests_approve","members_delete","members_clan_change"].includes(key)'));
assert.ok(main.includes("function canDeleteMemberRecord"));
assert.ok(rules.includes("staff() && permission('members_delete') && isMemberRole(accessRoleOf(resource.data))"));
assert.ok(main.includes('key:"members_clan_change",label:"Alterar clã dos membros",defaults:{dev:true,leadership:true,staff:true,member:false}'));
assert.ok(main.includes('permissionEnabled("members_clan_change")'));
assert.ok(main.includes("function canChangeMemberClan"));
assert.ok(rules.includes("staffClanChangePermission() && isMemberRole(accessRoleOf(resource.data))"));
assert.ok(main.includes('await updateDoc(doc(db,"members",member.id),payload)'));
assert.ok(html.includes('id="pagamentos"'));
assert.ok(html.includes('id="paymentForm"'));
assert.ok(ui.includes('["pagamentos","💰","Pagamentos"]'));
assert.ok(main.includes('collection(db,"payments")'));
assert.ok(main.includes('payments:state.payments'));
assert.ok(rules.includes("match /payments/{id}"));
assert.ok(html.includes('id="paymentQuantity"'));
assert.ok(html.includes('id="clearPaymentHistory"'));
assert.ok(main.includes('data-delete-payment'));
assert.ok(main.includes('quantity,observation,responsibleUid'));

assert.ok(html.includes('placeholder="Ex.: 20 = 20.000.000"'));
assert.ok(main.includes("function parsePaymentQuantity"));
assert.ok(main.includes("numeric<=99?numeric*1000000:numeric"));
assert.ok(main.includes('quantity>99000000'));

assert.ok(html.includes('id="paymentExportWeek"'));
assert.ok(html.includes('id="paymentExportMonth"'));
assert.ok(html.includes('id="downloadPaymentWeek"'));
assert.ok(html.includes('id="downloadPaymentMonth"'));
assert.ok(main.includes('function downloadPaymentHistory'));
assert.ok(main.includes("Historico de pagamentos -"));
assert.ok(html.includes("Baixar semana em PDF"));
assert.ok(html.includes("Baixar mês em PDF"));
assert.ok(main.includes("Salvar como PDF"));
assert.ok(html.includes("Quantidade (1 a 99.000.000)"));
assert.ok(main.includes("function createPaymentPdf"));
assert.ok(pdfGenerator.includes('type:"application/pdf"'));
assert.ok(main.includes('link.download=`77-team-pagamentos-${label}.pdf`'));

const {createTextPdf}=await import(new URL("js/pdf-generator.js",root));
const samplePdf=createTextPdf([["77 TEAM MANAGER","Nickname | Quantidade","Teste | 20.000.000"]]);
const sampleBytes=Buffer.from(await samplePdf.arrayBuffer());
assert.equal(samplePdf.type,"application/pdf");
assert.ok(sampleBytes.subarray(0,8).toString("ascii").startsWith("%PDF-1.4"));
assert.ok(sampleBytes.toString("ascii").includes("Teste | 20.000.000"));
assert.ok(sampleBytes.toString("ascii").endsWith("%%EOF"));

const knownIds=new Set([...html.matchAll(/\bid=["']([^"']+)["']/g),...main.matchAll(/\bid=["']([^"'${}]+)["']/g)].map(match=>match[1]));
const missingDirectIds=[...main.matchAll(/\$\(["']#([^"']+)["']\)(?!\?)/g)].map(match=>match[1]).filter(id=>!knownIds.has(id));
assert.deepEqual(missingDirectIds,[],`IDs obrigatórios ausentes: ${missingDirectIds.join(", ")}`);
const pageIds=new Set([...html.matchAll(/<section[^>]*\bid="([^"]+)"[^>]*class="[^"]*page|<section[^>]*class="[^"]*page[^>]*\bid="([^"]+)"/g)].map(match=>match[1]||match[2]));
const pageTargets=[...html.matchAll(/data-page(?:-jump)?="([^"]+)"/g),...ui.matchAll(/\["([a-z0-9-]+)","[^"\n]+","[^"\n]+"\]/g)].map(match=>match[1]);
assert.deepEqual([...new Set(pageTargets.filter(id=>!pageIds.has(id)))],[],"Menu contém destino sem página");
assert.ok(!html.includes("</input>"));
assert.ok(!html.includes("App Check"));
// Auth regression checks — cadastro/login/recuperação.
assert.ok(main.includes('sendPasswordResetEmail'));
assert.ok(main.includes('sendEmailVerification'));
assert.ok(main.includes('state.profile.active!==true||profileStatus!=="approved"'));
assert.ok(main.includes('currentStatus==="rejected"'));
assert.ok(main.includes('status:"pending",active:false,rejectedAt:deleteField()'));
assert.ok(html.includes('id="forgotPasswordButton"'));
assert.ok(html.includes('id="signupPassword" minlength="8"'));
assert.ok(rules.includes("resource.data.status == 'rejected' && resource.data.active == false"));
assert.ok(rules.includes("function leadershipCanApprovePendingMember"));
assert.ok(rules.includes("request.resource.data.keys().hasOnly(["));
assert.ok(main.includes('serviceWorker.register("./service-worker.js?v=22.9.32-homefinal1")'));
assert.ok(html.includes('js/main.js?v=22.9.32-homefinal1'));


// Permissões dinâmicas: Firebase e interface devem compartilhar a mesma matriz em tempo real.
assert.ok(main.includes('function permissionRuntimeSignature()'));
assert.ok(main.includes('schedulePermissionRuntimeRefresh'));
assert.ok(main.includes('onSnapshot(doc(db,"users",state.user.uid)'));
assert.ok(main.includes('Matriz salva no Firebase e aplicada em tempo real para todos os cargos.'));
assert.ok(rules.includes("permission('requests_approve')"));
assert.ok(rules.includes("permission('members_delete')"));
assert.ok(rules.includes("permission('members_clan_change')"));
assert.ok(rules.includes("function staffAccess(){return active() && permission('access_staff');}"));
assert.ok(rules.includes("function adminAccess(){return active() && permission('access_admin');}"));
assert.ok(html.includes('salvas no Firebase e entram em vigor em tempo real'));

// Fonte única de verdade para permissões: interface, Firestore e Storage usam settings/app.rolePermissions.
assert.ok(main.includes('key:"page_pagamentos",label:"Abrir Pagamentos"'));
assert.ok(main.includes('function pagePermissionEnabled(page)'));
assert.ok(main.includes('key:"events_manage",label:"Criar, editar e excluir eventos"'));
assert.ok(rules.includes("function defaultPermission(key)"));

assert.ok(!rules.includes("permission('payments_manage', true)"));
const storageRules=read("storage.rules");
assert.ok(storageRules.includes("rolePermissions"));
assert.ok(storageRules.includes("supportManager()"));
assert.ok(storageRules.includes("permission('support_manage')"));
assert.ok(storageRules.includes("permission('login_customize')"));

// A mensagem de sucesso fica no fim para não mascarar falhas nas verificações de Auth.
console.log("Auditoria estática V22.9.32: OK");

// Auditoria ampliada das abas/módulos — toda navegação deve apontar para uma página real.
const pageSectionIds=new Set([...html.matchAll(/<section\b[^>]*\bclass="[^"]*\bpage\b[^"]*"[^>]*\bid="([^"]+)"|<section\b[^>]*\bid="([^"]+)"[^>]*\bclass="[^"]*\bpage\b[^"]*"/g)].map(m=>m[1]||m[2]));
const unifiedNavIds=new Set([...ui.matchAll(/\["([a-z0-9-]+)","[^"\n]+","[^"\n]+"\]/g)].map(m=>m[1]));
for(const target of unifiedNavIds)assert.ok(pageSectionIds.has(target),`Aba do menu sem página: ${target}`);
assert.ok(unifiedNavIds.has("rt-presenca"),"RT Presença precisa estar acessível pelo menu STAFF");
assert.ok(main.includes('"rt-presenca"'),"RT Presença precisa participar do controle de acesso");
assert.ok(main.includes('filter(rt=>rt.status==="finalized")'),"RT Presença deve listar somente RTs finalizados");

// Todas as abas internas de Configurações e Meu Perfil precisam ter painel correspondente.
const settingsTabs=new Set([...html.matchAll(/data-settings-tab="([^"]+)"/g)].map(m=>m[1]));
const settingsPanels=new Set([...html.matchAll(/data-settings-panel="([^"]+)"/g)].map(m=>m[1]));
assert.deepEqual([...settingsTabs].sort(),[...settingsPanels].sort(),"Configurações possui aba sem painel ou painel órfão");
const profileTabs=new Set([...html.matchAll(/data-profile-tab="([^"]+)"/g)].map(m=>m[1]));
const profilePanels=new Set([...html.matchAll(/data-profile-panel="([^"]+)"/g)].map(m=>m[1]));
assert.deepEqual([...profileTabs].sort(),[...profilePanels].sort(),"Meu Perfil possui aba sem painel ou painel órfão");

// IDs usados pelos helpers de eventos devem existir no HTML.
const eventIds=new Set([...main.matchAll(/\bon\(["']([^"']+)["']/g)].map(m=>m[1]));
const htmlIds=new Set([...html.matchAll(/\bid=["']([^"']+)["']/g)].map(m=>m[1]));
assert.deepEqual([...eventIds].filter(id=>!htmlIds.has(id)),[],"Handler registrado para elemento inexistente");

// Toda coleção raiz utilizada pelo cliente precisa ter bloco de regras correspondente.
const clientCollections=new Set([...main.matchAll(/collection\(db,["']([^"']+)["']/g)].map(m=>m[1]));
for(const name of clientCollections)assert.ok(rules.includes(`match /${name}/{`),`Coleção sem regra explícita: ${name}`);

// Storage precisa obedecer à mesma matriz dinâmica usada no projeto.
assert.ok(storageRules.includes("function permission(key)"));
assert.ok(storageRules.includes("permission('support_manage')"));
assert.ok(storageRules.includes("permission('login_customize')"));
assert.ok(storageRules.includes("function supportManager()"));

// Cache/versionamento deve apontar para a mesma revisão das abas.
assert.ok(main.includes('service-worker.js?v=22.9.32-homefinal1'));
assert.ok(html.includes('js/main.js?v=22.9.32-homefinal1'));
const serviceWorker=read("service-worker.js");
assert.ok(serviceWorker.includes('77-team-manager-v22.9.32-homefinal1'));
assert.ok(serviceWorker.includes('js/main.js?v=22.9.32-homefinal1'));
assert.ok(rules.includes("function paymentsMatrixPermission()"));
assert.ok(rules.includes("rolePermissions.payments_manage.staff == true"));

assert.ok(html.includes('id="paymentObservation"'));
assert.ok(main.includes("observation=String(byId(\"paymentObservation\")"));
assert.ok(main.includes("quantity,observation,responsibleUid"));
assert.ok(main.includes("item.observation||\"—\""));
assert.ok(rules.includes("function staffRequestsApprovePermission()"));
assert.ok(rules.includes("rolePermissions.requests_approve.staff == true"));
assert.ok(rules.includes("function staffClanChangePermission()"));
assert.ok(rules.includes("rolePermissions.members_clan_change.staff == true"));
assert.ok(rules.includes("staffClanChangePermission() && isMemberRole(accessRoleOf(resource.data))"));