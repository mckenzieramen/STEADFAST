(() => {
  const modal=document.getElementById("sfStoreGate");
  if(!modal)return;
  const open=()=>{modal.hidden=false;document.body.classList.add("modal-open");};
  const close=()=>{modal.hidden=true;document.body.classList.remove("modal-open");};
  document.querySelectorAll("[data-store-gate]").forEach(a=>a.addEventListener("click",e=>{e.preventDefault();open();}));
  modal.addEventListener("click",e=>{if(e.target.closest("[data-close-store-gate]"))close();});
  document.addEventListener("keydown",e=>{if(e.key==="Escape"&&!modal.hidden)close();});
})();
