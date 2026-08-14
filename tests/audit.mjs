import assert from "node:assert/strict";
import {readFileSync} from "node:fs";
import {execFileSync} from "node:child_process";

const root=new URL("../",import.meta.url);
const read=file=>readFileSync(new URL(file,root),"utf8");
const main=read("js/main.js"),ui=read("js/ui.js"),rules=read("firestore.rules"),html=read("index.html");
const firebase=JSON.parse(read("firebase.json")),manifest=JSON.parse(read("manifest.json")),indexes=JSON.parse(read("firestore.indexes.json"));

execFileSync(process.execPath,["--check",new URL("js/main.js",root).pathname],{stdio:"pipe"});
assert.equal(manifest.version,"22.9.19");
assert.equal(firebase.firestore.indexes,"firestore.indexes.json");
assert.ok(firebase.emulators?.firestore?.port);
assert.ok(indexes.indexes.some(index=>index.collectionGroup==="supportMessages"));

const legacyComment=main.indexOf("/* Relatório legado");
const activeDateFormatter=main.indexOf("function formatHistoryDate");
assert.ok(activeDateFormatter>=0&&activeDateFormatter<legacyComment,"formatHistoryDate precisa estar em código ativo");
assert.ok(!/\bdev\(\)/.test(main),"Use owner() no cliente; dev() não existe");
assert.ok(!main.includes("applyAccessControl("),"applyAccessControl não existe");
assert.ok(main.includes("applyPermissions();"));
assert.ok(main.includes('"first-dev-"+Date.now()'));
assert.ok(main.includes("deleteUser(cred.user)"));
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
assert.ok(rules.includes("allow create: if dev() || (editor() && request.resource.data.keys().hasOnly(['title','date','time','type','description','createdBy','createdAt'])"));
assert.ok(rules.includes("allow create: if dev() || (permission('presence_reset', false)"));
assert.ok(rules.includes("allow create: if dev() || (editor() && permission('xp_manage', true)"));
assert.ok(rules.includes("!request.resource.data.diff(resource.data).affectedKeys().hasAny(['rolePermissions','security','maintenance','advanced','loginCustomization'])"));
assert.ok(rules.includes("allow update, delete: if dev();"));

const knownIds=new Set([...html.matchAll(/\bid=["']([^"']+)["']/g),...main.matchAll(/\bid=["']([^"'${}]+)["']/g)].map(match=>match[1]));
const missingDirectIds=[...main.matchAll(/\$\(["']#([^"']+)["']\)(?!\?)/g)].map(match=>match[1]).filter(id=>!knownIds.has(id));
assert.deepEqual(missingDirectIds,[],`IDs obrigatórios ausentes: ${missingDirectIds.join(", ")}`);
const pageIds=new Set([...html.matchAll(/<section[^>]*\bid="([^"]+)"[^>]*class="[^"]*page|<section[^>]*class="[^"]*page[^>]*\bid="([^"]+)"/g)].map(match=>match[1]||match[2]));
const pageTargets=[...html.matchAll(/data-page(?:-jump)?="([^"]+)"/g),...ui.matchAll(/\["([a-z0-9-]+)","[^"\n]+","[^"\n]+"\]/g)].map(match=>match[1]);
assert.deepEqual([...new Set(pageTargets.filter(id=>!pageIds.has(id)))],[],"Menu contém destino sem página");
assert.ok(!html.includes("</input>"));
assert.ok(!html.includes("App Check"));
console.log("Auditoria estática V22.9.19 Stable: OK");
