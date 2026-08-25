(()=>{
  if(window.__lifeosInboxDeleteInstalled)return;
  window.__lifeosInboxDeleteInstalled=true;
  const KEY='lifeos_v1';
  const read=()=>{try{return JSON.parse(localStorage.getItem(KEY)||'{}')}catch(e){return{}}};
  const write=s=>{
    const json=JSON.stringify(s);
    localStorage.setItem(KEY,json);
    try{window.AndroidBridge?.saveStateJson(json)}catch(e){}
  };

  function attach(){
    const panel=document.querySelector('[data-p="inbox"]');
    if(!panel||!panel.classList.contains('on'))return;
    const cards=panel.querySelectorAll('.card.half');
    const right=cards[1];
    if(!right)return;
    const state=read();
    const pending=(state.tasks||[]).filter(t=>!t.done);
    const items=[...right.querySelectorAll('.item')].filter(item=>item.querySelector('.taskmeta'));
    items.forEach((item,i)=>{
      const task=pending[i];
      if(!task||item.querySelector('[data-inbox-delete]'))return;
      const btn=document.createElement('button');
      btn.type='button';
      btn.className='danger smallbtn';
      btn.dataset.inboxDelete=task.id;
      btn.textContent='削除';
      const meta=item.querySelector('.taskmeta');
      if(meta){
        const row=document.createElement('div');
        row.style.marginTop='7px';
        row.appendChild(btn);
        item.appendChild(row);
      }
    });
  }

  document.addEventListener('click',e=>{
    const btn=e.target.closest('[data-inbox-delete]');
    if(!btn)return;
    e.preventDefault();e.stopPropagation();
    const state=read();
    const task=(state.tasks||[]).find(t=>t.id===btn.dataset.inboxDelete);
    if(!task)return;
    if(!confirm(`未完了タスク「${task.text}」を削除しますか？`))return;
    state.tasks=(state.tasks||[]).filter(t=>t.id!==task.id);
    write(state);
    location.reload();
  },true);

  const observer=new MutationObserver(()=>requestAnimationFrame(attach));
  observer.observe(document.body,{childList:true,subtree:true,attributes:true,attributeFilter:['class']});
  document.addEventListener('click',e=>{if(e.target.closest('[data-tab="inbox"]'))setTimeout(attach,10)},true);
  setTimeout(attach,0);
})();
