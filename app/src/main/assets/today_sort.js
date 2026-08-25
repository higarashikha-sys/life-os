(()=>{
  if(window.__lifeosTodaySortInstalled)return;
  window.__lifeosTodaySortInstalled=true;
  const KEY='lifeos_v1';
  const read=()=>{try{return JSON.parse(localStorage.getItem(KEY)||'{}')}catch(e){return{}}};

  function rank(t){
    if(!t?.due)return [1,'9999-99-99'];
    return [0,String(t.due)];
  }

  function sortToday(){
    const panel=document.querySelector('[data-p="today"]');
    if(!panel||!panel.classList.contains('on'))return;
    const box=panel.querySelector('#tasks');
    if(!box)return;
    const state=read();
    const tasks=new Map((state.tasks||[]).filter(t=>!t.done).map(t=>[String(t.id),t]));
    const items=[...box.querySelectorAll(':scope > .item')].filter(el=>el.querySelector('[data-complete]'));
    items.sort((a,b)=>{
      const ta=tasks.get(a.querySelector('[data-complete]')?.dataset.complete||'');
      const tb=tasks.get(b.querySelector('[data-complete]')?.dataset.complete||'');
      const ra=rank(ta), rb=rank(tb);
      if(ra[0]!==rb[0])return ra[0]-rb[0];
      const dc=ra[1].localeCompare(rb[1]);
      if(dc!==0)return dc;
      return String(ta?.createdAt||'').localeCompare(String(tb?.createdAt||''));
    });
    items.forEach(el=>box.appendChild(el));
  }

  let queued=false;
  const schedule=()=>{
    if(queued)return;
    queued=true;
    requestAnimationFrame(()=>{queued=false;sortToday()});
  };
  const observer=new MutationObserver(schedule);
  observer.observe(document.body,{childList:true,subtree:true,attributes:true,attributeFilter:['class']});
  document.addEventListener('click',schedule,true);
  window.addEventListener('storage',schedule);
  setTimeout(sortToday,0);
})();
