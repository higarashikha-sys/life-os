(()=>{
  if(window.__lifeosWhatNextInstalled)return;
  window.__lifeosWhatNextInstalled=true;
  const KEY='lifeos_v1';
  const read=()=>{try{return JSON.parse(localStorage.getItem(KEY)||'{}')}catch(e){return{}}};
  const pad=n=>String(n).padStart(2,'0');
  const todayKey=()=>{const d=new Date();return `${d.getFullYear()}-${pad(d.getMonth()+1)}-${pad(d.getDate())}`};
  const taskContext=t=>t.focus==='out'?'out':'home';
  const label=v=>v==='out'?'外出時':'家にいる時';

  function scoreTask(t){
    const today=todayKey();
    let score=0;
    if(t.due){
      if(t.due<today)score+=10000;
      else if(t.due===today)score+=8000;
      else score+=Math.max(0,4000-Math.floor((new Date(t.due)-new Date(today))/86400000)*100);
    }
    const age=t.createdAt?Math.max(0,Math.floor((Date.now()-new Date(t.createdAt).getTime())/86400000)):0;
    score+=Math.min(age,60)*10;
    score-=Math.min(+t.minutes||20,180);
    return score;
  }

  function choose(minutes,context){
    const state=read();
    const pending=(state.tasks||[]).filter(t=>!t.done&&taskContext(t)===context);
    const fits=pending.filter(t=>(+t.minutes||20)<=minutes);
    const pool=fits.length?fits:[];
    pool.sort((a,b)=>scoreTask(b)-scoreTask(a));
    return {task:pool[0]||null,pending};
  }

  function attach(){
    const panel=document.querySelector('[data-p="today"]');
    if(!panel||!panel.classList.contains('on'))return;
    const grid=panel.querySelector('.grid');
    if(!grid||grid.querySelector('#lifeosWhatNext'))return;

    const card=document.createElement('div');
    card.id='lifeosWhatNext';
    card.className='card';
    card.innerHTML=`
      <h2>今から何する？</h2>
      <p class="muted">今いる場所と空き時間から、未完了タスクを1つに絞ります。</p>
      <div class="row">
        <select id="wnPlace" aria-label="今いる場所">
          <option value="home">家にいる時</option>
          <option value="out">外出時</option>
        </select>
        <select id="wnMinutes" aria-label="空き時間">
          <option value="10">10分</option>
          <option value="20" selected>20分</option>
          <option value="30">30分</option>
          <option value="60">60分</option>
          <option value="90">90分</option>
        </select>
        <button id="wnGo" class="primary">今から何する？</button>
      </div>
      <div id="wnResult" style="margin-top:10px"></div>`;
    grid.insertBefore(card,grid.firstChild);

    card.querySelector('#wnGo').addEventListener('click',()=>{
      const minutes=+card.querySelector('#wnMinutes').value;
      const context=card.querySelector('#wnPlace').value;
      const result=choose(minutes,context);
      const box=card.querySelector('#wnResult');
      if(result.task){
        const t=result.task;
        box.innerHTML=`<div class="resume"><b>${escapeHtml(t.text)}</b><div class="taskmeta"><span class="pill">${+t.minutes||20}分</span><span class="pill">${label(context)}</span>${t.category?`<span class="pill">${escapeHtml(t.category)}</span>`:''}${t.due?`<span class="pill">期限 ${escapeHtml(t.due)}</span>`:''}</div><div class="muted" style="margin-top:7px">期限が近いもの・長く残っているものを優先して選択しています。</div></div>`;
      }else if(result.pending.length){
        const shortest=[...result.pending].sort((a,b)=>(+a.minutes||20)-(+b.minutes||20))[0];
        box.innerHTML=`<div class="resume">${label(context)}のタスクはありますが、${minutes}分以内で終わるものがありません。<div class="muted" style="margin-top:6px">最短: ${escapeHtml(shortest.text)}（${+shortest.minutes||20}分）</div></div>`;
      }else{
        box.innerHTML=`<div class="resume">${label(context)}に設定された未完了タスクはありません。</div>`;
      }
    });
  }

  function escapeHtml(s){return String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]))}

  const observer=new MutationObserver(()=>requestAnimationFrame(attach));
  observer.observe(document.body,{childList:true,subtree:true,attributes:true,attributeFilter:['class']});
  document.addEventListener('click',e=>{if(e.target.closest('[data-tab="today"]'))setTimeout(attach,10)},true);
  setTimeout(attach,0);
})();
