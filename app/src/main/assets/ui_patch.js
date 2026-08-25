(()=>{
  const STORAGE_KEY='lifeos_v1';

  function loadState(){
    try{return JSON.parse(localStorage.getItem(STORAGE_KEY))||null}catch(e){return null}
  }
  function saveState(s){localStorage.setItem(STORAGE_KEY,JSON.stringify(s))}
  function clickTab(name){
    const b=document.querySelector(`[data-tab="${name}"]`);
    if(b)b.click(); else location.reload();
  }

  const style=document.createElement('style');
  style.textContent=`
    .app{padding-top:30px!important}
    .lifeos-delete-btn{min-height:34px!important;padding:5px 10px!important;font-size:13px!important}
    .lifeos-manage-row{display:flex;align-items:center;justify-content:space-between;gap:10px;padding:9px 0;border-top:1px solid #eee}
    .lifeos-manage-row:first-child{border-top:0}
    .lifeos-delete-area{margin-top:16px;padding-top:12px;border-top:1px solid #ded9cf}
  `;
  document.head.appendChild(style);

  function patchLife(){
    const panel=document.querySelector('[data-p="habits"]');
    if(!panel||!panel.classList.contains('on'))return;
    const state=loadState();
    if(!state||!Array.isArray(state.habits))return;
    const items=[...panel.querySelectorAll('.card.half:first-child .item')];
    items.forEach((item,index)=>{
      if(item.querySelector('.lifeos-delete-btn'))return;
      const habit=state.habits[index];
      if(!habit)return;
      const btn=document.createElement('button');
      btn.type='button';
      btn.className='lifeos-delete-btn';
      btn.textContent='削除';
      btn.style.marginTop='7px';
      btn.addEventListener('click',()=>{
        const current=loadState();
        if(!current||!Array.isArray(current.habits))return;
        const target=current.habits.find(h=>h.id===habit.id);
        if(!target)return;
        if(!confirm(`習慣「${target.name}」を削除しますか？\nこれまでの実行記録も削除されます。`))return;
        current.habits=current.habits.filter(h=>h.id!==habit.id);
        saveState(current);
        clickTab('habits');
      });
      item.appendChild(btn);
    });
  }

  function patchWorks(){
    const panel=document.querySelector('[data-p="projects"]');
    if(!panel||!panel.classList.contains('on'))return;
    const state=loadState();
    if(!state||!Array.isArray(state.projects))return;
    const left=panel.querySelector('.card.half');
    if(!left)return;
    const old=left.querySelector('#lifeos-work-delete-area');
    if(old)old.remove();
    if(!state.projects.length)return;

    const area=document.createElement('div');
    area.id='lifeos-work-delete-area';
    area.className='lifeos-delete-area';
    const title=document.createElement('h3');
    title.textContent='プロジェクト管理';
    area.appendChild(title);
    const note=document.createElement('div');
    note.className='muted';
    note.textContent='削除すると、そのプロジェクトの思考履歴も削除されます。';
    area.appendChild(note);

    state.projects.forEach(project=>{
      const row=document.createElement('div');
      row.className='lifeos-manage-row';
      const name=document.createElement('span');
      name.textContent=project.name||'名称なし';
      const btn=document.createElement('button');
      btn.type='button';
      btn.className='lifeos-delete-btn';
      btn.textContent='削除';
      btn.addEventListener('click',()=>{
        const current=loadState();
        if(!current||!Array.isArray(current.projects))return;
        const target=current.projects.find(p=>p.id===project.id);
        if(!target)return;
        if(!confirm(`Works「${target.name}」を削除しますか？\nこれまでの思考履歴・作業記録も削除されます。`))return;
        current.projects=current.projects.filter(p=>p.id!==project.id);
        saveState(current);
        clickTab('projects');
      });
      row.append(name,btn);
      area.appendChild(row);
    });
    left.appendChild(area);
  }

  let scheduled=false;
  function patch(){
    if(scheduled)return;
    scheduled=true;
    requestAnimationFrame(()=>{
      scheduled=false;
      patchLife();
      patchWorks();
    });
  }

  const observer=new MutationObserver(patch);
  observer.observe(document.body,{childList:true,subtree:true,attributes:true,attributeFilter:['class']});
  document.addEventListener('click',()=>setTimeout(patch,0),true);
  patch();
})();
