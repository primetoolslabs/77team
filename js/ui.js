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