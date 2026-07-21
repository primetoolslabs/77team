import { APP_CONFIG } from '../core/config.js';

const $ = (id) => document.getElementById(id);
const qa = (selector) => [...document.querySelectorAll(selector)];

const commands = [
  ['dashboard','🏠','Visão Geral','Resumo estratégico da comunidade'],
  ['membros','👥','Membros','Consultar e gerenciar membros'],
  ['personagens','⚔️','Personagens','Abrir o centro de personagens'],
  ['presencas','📅','Presenças','Registrar WorldBoss, Purgatório e Eventos'],
  ['historico','📋','Histórico','Consultar registros de presença'],
  ['ranking','🏆','Ranking','Ver classificação e participação'],
  ['calendario','🗓️','Calendário','Visualizar agenda e eventos'],
  ['notificacoes','🔔','Notificações','Abrir a central de avisos'],
  ['atendimento','💬','Atendimento','Acompanhar conversas e solicitações'],
  ['configuracoes','⚙️','Configurações','Ajustar o sistema'],
  ['sobre','ℹ️','Sobre','Informações da versão instalada']
];

function jump(page){
  const trigger=document.querySelector(`[data-page-jump="${page}"]`) || document.querySelector(`[data-page="${page}"]`);
  trigger?.click();
}

function setVersion(){
  const badge=$('systemVersion');
  if(badge) badge.textContent=`V${APP_CONFIG.version.replace(/\.0$/,'')}`;
  document.documentElement.dataset.release='next-generation';
}

function setupTheme(){
  const button=$('themeToggleButton');
  const saved=localStorage.getItem('77team-theme') || 'dark';
  document.documentElement.dataset.theme=saved;
  if(button) button.textContent=saved==='light'?'☀':'☾';
  button?.addEventListener('click',()=>{
    const next=document.documentElement.dataset.theme==='light'?'dark':'light';
    document.documentElement.dataset.theme=next;
    localStorage.setItem('77team-theme',next);
    button.textContent=next==='light'?'☀':'☾';
  });
}

function setupProfile(){
  const menu=$('nextProfileMenu');
  const button=$('profileMenuButton');
  button?.addEventListener('click',(event)=>{event.stopPropagation();menu?.classList.toggle('hidden')});
  document.addEventListener('click',(event)=>{if(menu && !menu.contains(event.target) && event.target!==button) menu.classList.add('hidden')});
  $('nextProfileLogout')?.addEventListener('click',()=>$('sidebarLogout')?.click());
  const sync=()=>{
    const name=$('topbarUserName')?.textContent?.trim() || 'Visitante';
    const role=$('userBadge')?.textContent?.trim() || 'Visitante';
    if($('nextProfileName')) $('nextProfileName').textContent=name;
    if($('nextProfileRole')) $('nextProfileRole').textContent=role;
  };
  sync();
  const target=$('topbarUserName');
  if(target) new MutationObserver(sync).observe(target,{childList:true,subtree:true,characterData:true});
}

function setupPalette(){
  const palette=$('nextCommandPalette');
  const input=$('nextCommandInput');
  const results=$('nextCommandResults');
  const render=(term='')=>{
    const q=term.toLocaleLowerCase('pt-BR').trim();
    const filtered=commands.filter(([, ,title,desc])=>`${title} ${desc}`.toLocaleLowerCase('pt-BR').includes(q));
    results.innerHTML=filtered.map(([page,icon,title,desc])=>`<button type="button" data-next-command="${page}"><span>${icon}</span><div><strong>${title}</strong><small>${desc}</small></div><kbd>↵</kbd></button>`).join('') || '<p class="next-command-empty">Nenhum módulo encontrado.</p>';
    qa('[data-next-command]').forEach(btn=>btn.addEventListener('click',()=>{jump(btn.dataset.nextCommand);close()}));
  };
  const open=()=>{palette?.classList.remove('hidden');render('');setTimeout(()=>input?.focus(),20)};
  const close=()=>{palette?.classList.add('hidden');if(input) input.value=''};
  $('commandPaletteButton')?.addEventListener('click',open);
  input?.addEventListener('input',()=>render(input.value));
  palette?.addEventListener('click',(e)=>{if(e.target===palette)close()});
  document.addEventListener('keydown',(e)=>{
    if((e.ctrlKey||e.metaKey)&&e.key.toLowerCase()==='k'){e.preventDefault();open()}
    if(e.key==='Escape')close();
    if(e.key==='Enter'&&!palette?.classList.contains('hidden')) results?.querySelector('button')?.click();
  });
}

function setupMobile(){
  $('nextMobileMore')?.addEventListener('click',()=>$('menuButton')?.click());
  qa('#nextMobileNav [data-page-jump]').forEach(btn=>btn.addEventListener('click',()=>{
    qa('#nextMobileNav button').forEach(item=>item.classList.remove('active'));
    btn.classList.add('active');
  }));
}

setVersion();
setupTheme();
setupProfile();
setupPalette();
setupMobile();
