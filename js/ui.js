(function(){
  const $=selector=>document.querySelector(selector);
  const $$=selector=>Array.from(document.querySelectorAll(selector));

  function activatePage(page){
    if(!page)return;

    if(
      typeof window.TeamManagerCanOpenPage==="function" &&
      !window.TeamManagerCanOpenPage(page)
    ){
      page="dashboard";
    }

    $$("#nav [data-page]").forEach(button=>{
      button.classList.toggle("active",button.dataset.page===page);
    });

    $$(".page").forEach(section=>{
      const isActive=section.id===page;
      section.classList.toggle("active",isActive);

      if(isActive){
        section.classList.remove("page-enter");
        requestAnimationFrame(()=>section.classList.add("page-enter"));
      }
    });

    const navButton=$(`#nav [data-page="${page}"]`);
    const title=$("#pageTitle");

    if(title&&navButton){
      title.textContent=navButton.textContent.trim();
    }

    const sidebar=$("#sidebar");
    if(sidebar)sidebar.classList.remove("open");

    if(typeof window.syncModuleNavigation==="function"){
      window.syncModuleNavigation(page);
    }

    if(page==="configuracoes"){
      requestAnimationFrame(()=>activateSettingsTab(
        $("#settingsNav [data-settings-tab].active")?.dataset.settingsTab || "general"
      ));
    }
  }

  function activateSettingsTab(tab){
    if(!tab)return false;

    const buttons=$$("#settingsNav [data-settings-tab]");
    const panels=$$("[data-settings-panel]");
    const target=panels.find(panel=>panel.dataset.settingsPanel===tab);

    if(!target)return false;

    buttons.forEach(button=>{
      const active=button.dataset.settingsTab===tab;
      button.classList.toggle("active",active);
      button.setAttribute("aria-selected",active?"true":"false");
    });

    panels.forEach(panel=>{
      const active=panel.dataset.settingsPanel===tab;
      panel.classList.toggle("active",active);
      panel.hidden=!active;
    });

    const content=$(".settings-content");
    if(content)content.scrollTop=0;

    try{
      sessionStorage.setItem("77team-settings-tab",tab);
    }catch(_error){}

    return true;
  }

  function filterSettings(query){
    const term=String(query||"").trim().toLocaleLowerCase("pt-BR");
    const buttons=$$("#settingsNav [data-settings-tab]");

    buttons.forEach(button=>{
      const matches=!term||
        button.textContent.toLocaleLowerCase("pt-BR").includes(term);
      button.classList.toggle("hidden",!matches);
    });

    if(term){
      const firstVisible=buttons.find(button=>!button.classList.contains("hidden"));
      const active=$("#settingsNav [data-settings-tab].active");

      if(firstVisible && (!active||active.classList.contains("hidden"))){
        activateSettingsTab(firstVisible.dataset.settingsTab);
      }
    }
  }

  document.addEventListener("click",event=>{
    const settingsButton=event.target.closest("#settingsNav [data-settings-tab]");

    if(settingsButton){
      event.preventDefault();
      event.stopPropagation();
      activateSettingsTab(settingsButton.dataset.settingsTab);
      return;
    }

    const nav=event.target.closest("#nav [data-page]");
    if(nav){
      activatePage(nav.dataset.page);
      return;
    }

    const jump=event.target.closest("[data-page-jump]");
    if(jump){
      activatePage(jump.dataset.pageJump);
      return;
    }

    if(event.target.closest("#menuButton")){
      const sidebar=$("#sidebar");
      if(sidebar)sidebar.classList.toggle("open");
    }
  });

  document.addEventListener("input",event=>{
    if(event.target.matches("#settingsSearch")){
      filterSettings(event.target.value);
    }
  });

  document.addEventListener("DOMContentLoaded",()=>{
    $$("#settingsNav [data-settings-tab]").forEach(button=>{
      button.setAttribute("role","tab");
      button.setAttribute(
        "aria-controls",
        `settings-panel-${button.dataset.settingsTab}`
      );
    });

    $$("[data-settings-panel]").forEach(panel=>{
      panel.id=`settings-panel-${panel.dataset.settingsPanel}`;
      panel.setAttribute("role","tabpanel");
    });

    let initial="general";
    try{
      initial=sessionStorage.getItem("77team-settings-tab")||"general";
    }catch(_error){}

    activateSettingsTab(initial);
  });

  window.TeamManagerUI={
    activatePage,
    activateSettingsTab,
    filterSettings
  };
})();

/* V21.0 — navegação unificada em menu suspenso lateral */
(function installUnifiedModuleNavigation(){
  const categories={
    home:{title:"HOME",icon:"🏠",defaultPage:"dashboard",items:[
      ["dashboard","📊","Visão Geral"],["meu-perfil","👤","Meu Perfil"],["membros","👥","Membros"],["historico","📜","Histórico"],["ranking","📈","Ranking"],["calendario","📅","Calendário"],["estatisticas","📊","Estatísticas"]
    ]},
    staff:{title:"STAFF",icon:"👥",defaultPage:"presencas",role:"editor",items:[
      ["presencas","📅","Presenças"],["rt-presenca","📋","RT Presença"],["personagens","⚔️","Personagens"],["solicitacoes","📥","Solicitações"],["notificacoes","🔔","Notificações"],["atendimento","🎧","Atendimento"],["chat","💬","Chat Privado"],["registros","📁","Consultar Registros"],["pagamentos","💰","Pagamentos"],["metas","🎯","Metas"]
    ]},
    administracao:{title:"ADMINISTRAÇÃO",icon:"🛡️",defaultPage:"staff",role:"administrator",items:[
      ["staff","👥","Staff"],["configuracoes","⚙️","Configurações"],["backup-central","💾","Backup"],["auditoria","📜","Auditoria"]
    ]},
    avancado:{title:"AVANÇADO",icon:"🚀",defaultPage:"atualizacoes",role:"owner",items:[
      ["atualizacoes","🚀","Atualizações"],["backup","💾","Backup e restauração"],["logs-sistema","📋","Logs do sistema"],["status-firebase","🔥","Status do Firebase"],["status-github","🌐","Status do GitHub"],["sessoes","👥","Sessões conectadas"],["manutencao","🚧","Modo manutenção"],["status-servicos","🟢","Status dos serviços"],["limpeza-cache","🧹","Limpeza de cache"],["estatisticas-sistema","📈","Estatísticas do sistema"],["personalizar-login","🎨","Personalizar Login"],["permissoes-cargos","🔐","Cargos e permissões"]
    ]},
    sobre:{title:"SOBRE",icon:"ℹ️",defaultPage:"sobre",items:[["sobre","ℹ️","Sobre"]]}
  };
  const pageCategory={};
  Object.entries(categories).forEach(([key,category])=>category.items.forEach(item=>pageCategory[item[0]]=key));
  const nav=document.getElementById("nav");

  function allowedCategory(key){
    const category=categories[key];
    if(!category)return false;
    if(category.role==="owner" && typeof window.TeamManagerIsOwner==="function")return window.TeamManagerIsOwner();
    if(category.role==="administrator" && typeof window.TeamManagerIsAdministrator==="function")return window.TeamManagerIsAdministrator();
    if(category.role==="editor" && typeof window.TeamManagerIsEditor==="function")return window.TeamManagerIsEditor();
    return true;
  }

  function itemAllowed(id){
    return typeof window.TeamManagerCanOpenPage!=="function" || window.TeamManagerCanOpenPage(id);
  }

  function buildDropdowns(){
    if(!nav)return;
    nav.querySelectorAll("[data-category]").forEach(button=>{
      const key=button.dataset.category;
      const category=categories[key];
      if(!category)return;
      let host=button.nextElementSibling;
      if(!host || !host.classList.contains("main-category-submenu")){
        host=document.createElement("div");
        host.className="main-category-submenu";
        host.dataset.submenu=key;
        button.insertAdjacentElement("afterend",host);
      }
      host.innerHTML=category.items.filter(([id])=>itemAllowed(id)).map(([id,itemIcon,label])=>
        `<button type="button" class="main-submenu-link" data-page-jump="${id}" data-submenu-page="${id}"><span>${itemIcon}</span><span>${label}</span></button>`
      ).join("");
      button.setAttribute("aria-haspopup","true");
    });
  }

  function closeAll(exceptKey=""){
    if(!nav)return;
    nav.querySelectorAll("[data-category]").forEach(button=>{
      const open=button.dataset.category===exceptKey;
      button.classList.toggle("submenu-open",open);
      button.setAttribute("aria-expanded",open?"true":"false");
      const arrow=button.querySelector(".category-arrow");
      if(arrow)arrow.textContent=open?"⌄":"›";
      const submenu=nav.querySelector(`[data-submenu="${button.dataset.category}"]`);
      if(submenu)submenu.classList.toggle("open",open);
    });
  }

  function toggleCategory(key){
    if(!nav||!allowedCategory(key))return;
    const button=nav.querySelector(`[data-category="${key}"]`);
    const submenu=nav.querySelector(`[data-submenu="${key}"]`);
    if(!button||!submenu)return;
    const open=submenu.classList.contains("open");
    closeAll(open?"":key);
    try{
      if(!open)localStorage.setItem("77team-open-category",key);
      else localStorage.removeItem("77team-open-category");
    }catch(_error){}
  }

  function sync(page){
    const key=pageCategory[page]||"home";
    const category=categories[key];
    if(!category)return;
    buildDropdowns();

    const breadcrumb=document.getElementById("moduleBreadcrumb");
    const current=category.items.find(item=>item[0]===page);
    if(breadcrumb)breadcrumb.textContent=`${category.title} > ${current?.[2]||category.title}`;

    if(nav){
      nav.querySelectorAll("[data-category]").forEach(button=>{
        const active=button.dataset.category===key;
        button.classList.toggle("active",active);
        button.setAttribute("aria-current",active?"page":"false");
      });
      nav.querySelectorAll("[data-submenu-page]").forEach(button=>{
        const active=button.dataset.submenuPage===page;
        button.classList.toggle("active",active);
        button.setAttribute("aria-current",active?"page":"false");
      });
      if(allowedCategory(key))closeAll(key);
    }

    const moduleNav=document.getElementById("moduleNavigation");
    if(moduleNav)moduleNav.classList.add("dropdown-menu-replaced");
  }

  if(nav){
    nav.addEventListener("click",event=>{
      const categoryButton=event.target.closest("#nav [data-category]");
      if(categoryButton){
        event.preventDefault();
        event.stopPropagation();
        toggleCategory(categoryButton.dataset.category);
      }
    },true);
  }

  window.syncModuleNavigation=sync;
  window.TeamManagerSidebarDropdowns={buildDropdowns,toggleCategory,sync};
  document.addEventListener("DOMContentLoaded",()=>{
    buildDropdowns();
    const page=document.querySelector(".page.active")?.id||"dashboard";
    sync(page);
  });
})();


(function installSidebarV13(){
  if(window.__sidebarV13Installed)return;window.__sidebarV13Installed=true;
  const sidebar=document.getElementById("sidebar"),collapseButton=document.getElementById("collapseSidebarButton");
  function setCollapsed(v){document.body.classList.toggle("sidebar-collapsed",v);sidebar?.classList.toggle("collapsed",v);if(collapseButton){collapseButton.textContent=v?"≫":"≪";collapseButton.setAttribute("aria-label",v?"Expandir menu":"Recolher menu");}try{localStorage.setItem("77team-sidebar-collapsed",v?"1":"0")}catch(e){}}
  function updateBadges(){try{const state=window.TeamManagerState||{},set=(id,v)=>{const e=document.getElementById(id);if(e)e.textContent=String(v)};set("sidebarMembersBadge",state.members?.length||0);set("sidebarEventsBadge",state.events?.length||0);set("sidebarRequestsBadge",state.users?.filter(u=>u.status==="pending").length||0);set("sidebarPurgatorioBadge",state.attendance?.filter(a=>a.kind==="purgatorio"&&a.status!==0).length||0);const live=document.getElementById("sidebarWorldbossBadge"),on=state.attendance?.some(a=>a.kind==="worldboss"&&a.status===1&&a.date===new Date().toISOString().slice(0,10));if(live){live.textContent=on?"AO VIVO":"—";live.classList.toggle("live",!!on)}const p=typeof window.TeamManagerProgressionForCurrentUser==="function"?window.TeamManagerProgressionForCurrentUser():null,x=document.getElementById("sidebarXpProgress");if(x&&p)x.style.width=`${p.progress||0}%`;}catch(e){console.error("Falha ao atualizar menu lateral:",e)}}
  collapseButton?.addEventListener("click",()=>setCollapsed(!document.body.classList.contains("sidebar-collapsed")));
  document.getElementById("sidebarMenuButton")?.addEventListener("click",()=>sidebar?.classList.toggle("open"));
  document.getElementById("sidebarUserToggle")?.addEventListener("click",()=>document.querySelector(".sidebar-user-card-v13")?.classList.toggle("expanded"));
  document.addEventListener("DOMContentLoaded",()=>{try{setCollapsed(localStorage.getItem("77team-sidebar-collapsed")==="1")}catch(e){setCollapsed(false)}updateBadges()});
  window.SidebarV13={setCollapsed,updateBadges};
})();


/* V14 — categorias expansíveis do menu */
(()=>{
  if(true)return;
  window.__sidebarV14CategoriesInstalled=true;
  const nav=document.getElementById("nav");
  if(!nav)return;
  const groups=()=>Array.from(nav.querySelectorAll(".nav-group[data-nav-group]"));
  function setOpen(group,open,save=true){
    groups().forEach(item=>{
      const shouldOpen=item===group&&open;
      item.classList.toggle("nav-group-open",shouldOpen);
      const toggle=item.querySelector(".nav-group-toggle");
      const arrow=item.querySelector(".category-arrow");
      toggle?.setAttribute("aria-expanded",shouldOpen?"true":"false");
      if(arrow)arrow.textContent=shouldOpen?"⌄":"›";
    });
    if(save&&group&&open){try{localStorage.setItem("77team-v14-open-group",group.dataset.navGroup)}catch(e){}}
  }
  function openForPage(page){
    const button=nav.querySelector(`[data-page="${page}"]`);
    const group=button?.closest(".nav-group");
    if(group&&!group.classList.contains("hidden"))setOpen(group,true);
  }
  nav.addEventListener("click",event=>{
    const toggle=event.target.closest(".nav-group-toggle");
    if(toggle){
      const group=toggle.closest(".nav-group");
      const already=group.classList.contains("nav-group-open");
      setOpen(group,!already);
      return;
    }
    const pageButton=event.target.closest("[data-page]");
    if(pageButton)openForPage(pageButton.dataset.page);
  });
  document.addEventListener("DOMContentLoaded",()=>{
    const active=nav.querySelector("[data-page].active");
    if(active)return openForPage(active.dataset.page);
    let saved="home";try{saved=localStorage.getItem("77team-v14-open-group")||"home"}catch(e){}
    const group=nav.querySelector(`[data-nav-group="${saved}"]`)||nav.querySelector('[data-nav-group="home"]');
    if(group&&!group.classList.contains("hidden"))setOpen(group,true,false);
  });
  /* Não observar todas as mudanças de classe: isso reabria HOME imediatamente
     quando outra categoria era clicada. A abertura da categoria ativa já é
     tratada no clique dos itens e na inicialização. */
})();

/* Meu Perfil V4 helper visual — otimizado */
(function(){
  const sourceIds=["profileDisplayName","profileCharacterClass","profileRoleBadge","profileCharacterClan"];
  function value(id){return document.getElementById(id)?.textContent?.trim()||"—";}
  function setIfChanged(id,value){
    const el=document.getElementById(id);
    if(el && el.textContent!==value) el.textContent=value;
  }
  function sync(){
    setIfChanged("rpgInfoName",value("profileDisplayName"));
    setIfChanged("rpgInfoClass",value("profileCharacterClass"));
    setIfChanged("rpgInfoRole",value("profileRoleBadge"));
    setIfChanged("rpgInfoClan",value("profileCharacterClan"));
  }
  document.addEventListener("click",event=>{
    const jump=event.target.closest("[data-profile-tab-jump]");
    if(jump){
      document.querySelector(`[data-profile-tab="${jump.dataset.profileTabJump}"]`)?.click();
      return;
    }
  });
  document.addEventListener("DOMContentLoaded",()=>{
    sync();
    sourceIds.forEach(id=>{
      const el=document.getElementById(id);
      if(el)new MutationObserver(sync).observe(el,{subtree:true,childList:true,characterData:true});
    });
  });
})();
