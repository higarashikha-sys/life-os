(()=>{
  if(window.__lifeosContextPatchInstalled)return;
  window.__lifeosContextPatchInstalled=true;
  const KEY='lifeos_v1';
  const read=()=>{try{return JSON.parse(localStorage.getItem(KEY)||'{}')}catch(e){return{}}};
  const write=s=>localStorage.setItem(KEY,JSON.stringify(s));

  // 旧「集中度」データは、未指定として家に寄せる。新規は home / out の2択。
  const s=read();
  let changed=false;
  (s.tasks||[]).forEach(t=>{
    if(t.focus==='home'||t.focus==='out')return;
    if(!t.focus){t.focus='home';changed=true;return;}
    if(['low','mid','high'].includes(t.focus)){t.focus='home';changed=true;}
  });
  if(changed)write(s);

  function label(v){return v==='out'?'外出時':'家にいる時'}

  function patchSelect(id){
    const el=document.getElementById(id);
    if(!el||el.dataset.lifeosContext==='1')return;
    const current=el.value;
    el.innerHTML='<option value="home">家にいる時</option><option value="out">外出時</option>';
    el.value=(current==='out')?'out':'home';
    el.dataset.lifeosContext='1';
  }

  function patchTaskBadges(){
    const state=read();
    const pending=(state.tasks||[]).filter(t=>!t.done);

    const todayItems=[...document.querySelectorAll('[data-p="today"] #tasks .item')];
    todayItems.forEach((item,i)=>{
      const t=pending[i],pill=item.querySelector('.taskmeta .pill:nth-child(2)');
      if(t&&pill)pill.textContent=label(t.focus);
    });

    const inboxPanel=document.querySelector('[data-p="inbox"]');
    if(inboxPanel&&inboxPanel.classList.contains('on')){
      const cards=[...inboxPanel.querySelectorAll('.card.half')];
      const right=cards[1];
      if(right){
        const items=[...right.querySelectorAll('.item')];
        items.slice(-pending.length).forEach((item,i)=>{
          const t=pending[i],pill=item.querySelector('.taskmeta .pill:nth-child(2)');
          if(t&&pill)pill.textContent=label(t.focus);
        });
      }
    }
  }

  function patch(){
    patchSelect('focus');
    patchSelect('dtFocus');
    patchTaskBadges();
  }

  const observer=new MutationObserver(()=>requestAnimationFrame(patch));
  observer.observe(document.body,{childList:true,subtree:true,attributes:true,attributeFilter:['class']});
  document.addEventListener('click',()=>setTimeout(patch,0),true);
  setTimeout(patch,0);
})();
