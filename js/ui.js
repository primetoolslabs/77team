(function(){
  const $=selector=>document.querySelector(selector);
  const $$=selector=>Array.from(document.querySelectorAll(selector));

  function activatePage(page){
    if(!page)return;

    $$("#nav [data-page]").forEach(button=>{
      button.classList.toggle("active",button.dataset.page===page);
    });

    $$(".page").forEach(section=>{
      section.classList.toggle("active",section.id===page);
    });

    const navButton=$(`#nav [data-page="${page}"]`);
    const title=$("#pageTitle");
    if(title&&navButton)title.textContent=navButton.textContent.trim();

    const sidebar=$("#sidebar");
    if(sidebar)sidebar.classList.remove("open");
  }

  document.addEventListener("click",event=>{
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

  window.TeamManagerUI={activatePage};
})();