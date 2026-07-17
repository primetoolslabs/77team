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
(function installSidebarV13(){
  if(window.__sidebarV13Installed)return;window.__sidebarV13Installed=true;
  const sidebar=document.getElementById("sidebar"),collapseButton=document.getElementById("collapseSidebarButton");
  function setCollapsed(v){document.body.classList.toggle("sidebar-collapsed",v);sidebar?.classList.toggle("collapsed",v);if(collapseButton){collapseButton.textContent=v?"≫":"≪";collapseButton.setAttribute("aria-label",v?"Expandir menu":"Recolher menu");}try{localStorage.setItem("77team-sidebar-collapsed",v?"1":"0")}catch(e){}}
  function updateBadges(){try{const set=(id,v)=>{const e=document.getElementById(id);if(e)e.textContent=String(v)};set("sidebarMembersBadge",state?.members?.length||0);set("sidebarEventsBadge",state?.events?.length||0);set("sidebarRequestsBadge",state?.users?.filter(u=>u.status==="pending").length||0);set("sidebarPurgatorioBadge",state?.attendance?.filter(a=>a.kind==="purgatorio"&&a.status!==0).length||0);const live=document.getElementById("sidebarWorldbossBadge"),on=state?.attendance?.some(a=>a.kind==="worldboss"&&a.status===1&&a.date===new Date().toISOString().slice(0,10));if(live){live.textContent=on?"AO VIVO":"—";live.classList.toggle("live",!!on)}const p=typeof progressionForCurrentUser==="function"?progressionForCurrentUser():null,x=document.getElementById("sidebarXpProgress");if(x&&p)x.style.width=`${p.progress||0}%`;}catch(e){console.error("Falha ao atualizar menu lateral:",e)}}
  collapseButton?.addEventListener("click",()=>setCollapsed(!document.body.classList.contains("sidebar-collapsed")));
  document.getElementById("sidebarMenuButton")?.addEventListener("click",()=>sidebar?.classList.toggle("open"));
  document.getElementById("sidebarUserToggle")?.addEventListener("click",()=>document.querySelector(".sidebar-user-card-v13")?.classList.toggle("expanded"));
  document.addEventListener("DOMContentLoaded",()=>{try{setCollapsed(localStorage.getItem("77team-sidebar-collapsed")==="1")}catch(e){setCollapsed(false)}updateBadges()});
  const originalRender=typeof render==="function"?render:null;if(originalRender){render=function(){originalRender();updateBadges();}}
  window.SidebarV13={setCollapsed,updateBadges};
})();

/* V14 — categorias expansíveis do menu */
(()=>{
  if(window.__sidebarV14CategoriesInstalled)return;
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
