(function(){
  const $=s=>document.querySelector(s),$$=s=>Array.from(document.querySelectorAll(s));
  document.addEventListener("click",e=>{
    const nav=e.target.closest("#nav [data-page]");
    if(nav){
      $$("#nav [data-page]").forEach(b=>b.classList.remove("active"));
      nav.classList.add("active");
      $$(".page").forEach(p=>p.classList.remove("active"));
      $("#"+nav.dataset.page)?.classList.add("active");
      $("#pageTitle").textContent=nav.textContent.trim();
      $("#sidebar").classList.remove("open");
    }
    if(e.target.closest("#menuButton"))$("#sidebar").classList.toggle("open");
  });
})();