(()=>{
  if(window.__lifeosHabitTargetPatchInstalled)return;
  window.__lifeosHabitTargetPatchInstalled=true;

  function patch(){
    const select=document.getElementById('ht');
    if(!select)return;
    const current=String(select.value||'5');
    const expected=['1','2','3','4','5','6','7'];
    const values=[...select.options].map(o=>o.value);
    if(values.length===7&&expected.every((v,i)=>values[i]===v))return;
    select.innerHTML=expected.map(v=>`<option value="${v}">週${v}回</option>`).join('');
    select.value=expected.includes(current)?current:'5';
  }

  const observer=new MutationObserver(()=>requestAnimationFrame(patch));
  observer.observe(document.body,{childList:true,subtree:true});
  document.addEventListener('click',e=>{
    if(e.target.closest('[data-tab="habits"]'))setTimeout(patch,0);
  },true);
  setTimeout(patch,0);
})();
