(function(){
  "use strict";
  function $(s){return document.querySelector(s)}
  function $$(s){return Array.prototype.slice.call(document.querySelectorAll(s))}
  function closeMenu(){
    var side=$("#sidebar"),back=$("#backdrop");
    if(side)side.classList.remove("open");
    if(back)back.classList.remove("show");
    document.body.style.overflow="";
  }
  function openMenu(){
    var side=$("#sidebar"),back=$("#backdrop");
    if(side)side.classList.add("open");
    if(back)back.classList.add("show");
    document.body.style.overflow="hidden";
  }
  document.addEventListener("click",function(event){
    var nav=event.target.closest?event.target.closest("#nav [data-page]"):null;
    if(nav){
      event.preventDefault();
      $$("#nav [data-page]").forEach(function(btn){btn.classList.remove("active")});
      nav.classList.add("active");
      $$(".page").forEach(function(page){page.classList.remove("active")});
      var target=$("#"+nav.getAttribute("data-page"));
      if(target)target.classList.add("active");
      var title=$("#pageTitle");
      if(title)title.textContent=nav.textContent.trim();
      closeMenu();
      return;
    }
    if(event.target.closest&&event.target.closest("#openMenu"))openMenu();
    if(event.target.closest&&(event.target.closest("#closeMenu")||event.target.closest("#backdrop")))closeMenu();
  });
  window.addEventListener("resize",function(){if(window.innerWidth>760)closeMenu()});
  window.addEventListener("error",function(event){console.error("77 TEAM UI:",event.error||event.message)});
  window.Team77UI={openMenu:openMenu,closeMenu:closeMenu};
})();