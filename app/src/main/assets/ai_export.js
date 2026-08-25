(()=>{
  if(window.__lifeosAiExportInstalled)return;
  window.__lifeosAiExportInstalled=true;
  const KEY='lifeos_v1';
  const pad=n=>String(n).padStart(2,'0');
  const localDate=d=>`${d.getFullYear()}-${pad(d.getMonth()+1)}-${pad(d.getDate())}`;
  const today=()=>localDate(new Date());
  const isoDay=v=>{const d=new Date(v);return Number.isNaN(d.getTime())?String(v||'').slice(0,10):localDate(d)};
  function readState(){try{return JSON.parse(localStorage.getItem(KEY)||'{}')}catch(e){return{}}}
  function rangeStart(days){if(days==='all')return '0000-01-01';const d=new Date();d.setHours(0,0,0,0);d.setDate(d.getDate()-(+days-1));return localDate(d)}
  function placeLabel(v){return v==='out'?'外出時':'家にいる時'}

  function buildMarkdown(days){
    const S=readState(),from=rangeStart(days),to=today();
    const tasks=(S.tasks||[]).filter(t=>{const d=isoDay(t.doneAt||t.createdAt);return d>=from&&d<=to});
    const journal=(S.journal||[]).filter(j=>j.date>=from&&j.date<=to).sort((a,b)=>a.date.localeCompare(b.date));
    const projects=(S.projects||[]).map(p=>({...p,sessions:(p.sessions||[]).filter(s=>{const d=isoDay(s.at);return d>=from&&d<=to}).sort((a,b)=>a.at.localeCompare(b.at))})).filter(p=>p.sessions.length);
    const habits=(S.habits||[]).map(h=>({name:h.name,target:h.target,dates:Object.keys(h.logs||{}).filter(d=>d>=from&&d<=to).sort()}));
    const inbox=(S.inbox||[]).map(x=>typeof x==='string'?x:x.text).filter(Boolean);
    let out=[];
    out.push('# Life OS export for ChatGPT');
    out.push('');
    out.push(`- Exported: ${new Date().toLocaleString('ja-JP')}`);
    out.push(`- Period: ${days==='all'?'all records':from+' to '+to}`);
    out.push('- Purpose: ChatGPTに生活履歴を読ませ、生活パターン、停滞要因、習慣、研究・読書の継続状況を分析するためのデータ。');
    out.push('');
    out.push('## Analysis request');
    out.push('この記録を事実と推測を分けて分析してください。反復パターン、生活上の障害、うまくいっている条件、先延ばしの条件、研究・読書の継続性、未処理タスクの偏りを検討し、根拠のある改善案だけを提示してください。不明な点は不明としてください。');
    out.push('');
    out.push('## Summary counts');
    out.push(`- Tasks in period: ${tasks.length}`);
    out.push(`- Completed tasks in period: ${tasks.filter(t=>t.done).length}`);
    out.push(`- Diary days: ${journal.length}`);
    out.push(`- Works sessions: ${projects.reduce((n,p)=>n+p.sessions.length,0)}`);
    out.push(`- Works minutes: ${projects.reduce((n,p)=>n+p.sessions.reduce((m,s)=>m+(+s.minutes||0),0),0)}`);
    out.push('');
    out.push('## Diary');
    if(!journal.length)out.push('_No diary entries._');
    journal.forEach(j=>{out.push(`### ${j.date}`);if(j.done)out.push(`- やったこと: ${j.done}`);if(j.state)out.push(`- 気分・疲労・集中: ${j.state}`);if(j.note)out.push(`- 気づき・考え: ${j.note}`);if(j.next)out.push(`- 次の一手: ${j.next}`);out.push('')});
    out.push('## Works');
    if(!projects.length)out.push('_No work sessions._');
    projects.forEach(p=>{out.push(`### ${p.name}`);p.sessions.forEach(s=>{out.push(`#### ${new Date(s.at).toLocaleString('ja-JP')} (${+s.minutes||0} min)`);if(s.done)out.push(`- やったこと: ${s.done}`);if(s.thinking)out.push(`- 考えていたこと: ${s.thinking}`);if(s.next)out.push(`- 次の一手: ${s.next}`);out.push('')})});
    out.push('## Habits');
    if(!habits.length)out.push('_No habits._');
    habits.forEach(h=>{out.push(`### ${h.name}`);out.push(`- 週目標: ${h.target||0}回`);out.push(`- 実行日: ${h.dates.length?h.dates.join(', '):'なし'}`);out.push(`- 期間内実行回数: ${h.dates.length}`);out.push('')});
    out.push('## Tasks');
    if(!tasks.length)out.push('_No tasks._');
    tasks.sort((a,b)=>isoDay(a.createdAt).localeCompare(isoDay(b.createdAt))).forEach(t=>{out.push(`- [${t.done?'x':' '}] ${t.text}`);out.push(`  - created: ${isoDay(t.createdAt)}`);if(t.doneAt)out.push(`  - completed: ${isoDay(t.doneAt)}`);if(t.minutes)out.push(`  - minutes: ${t.minutes}`);out.push(`  - place: ${placeLabel(t.focus)}`);if(t.category)out.push(`  - category: ${t.category}`);if(t.due)out.push(`  - due: ${t.due}`)});
    out.push('');
    out.push('## Inbox');
    if(!inbox.length)out.push('_Empty._');else inbox.forEach(x=>out.push(`- ${x}`));
    out.push('');
    return out.join('\n');
  }

  function attach(){
    const panel=document.querySelector('[data-p="settings"]');
    if(!panel||panel.querySelector('#aiExportBox'))return;
    const box=document.createElement('div');box.id='aiExportBox';box.className='card';box.style.marginTop='12px';
    box.innerHTML=`<h2>ChatGPT用エクスポート</h2><p class="muted">生活履歴をMarkdownにまとめます。ファイルをChatGPTへ添付して分析に使えます。</p><div class="row"><select id="aiRange"><option value="7">直近7日</option><option value="30" selected>直近30日</option><option value="90">直近90日</option><option value="all">全期間</option></select><button id="aiExport" class="primary">Markdownを書き出す</button></div><div class="item"><b>含まれる内容</b><div class="muted">Diary全文、Worksの思考履歴と作業時間、Lifeの習慣実行日、Taskの完了/未完了・所要時間・家/外出・期限、Inbox。</div></div>`;
    panel.appendChild(box);
    box.querySelector('#aiExport').addEventListener('click',()=>{const text=buildMarkdown(box.querySelector('#aiRange').value);if(window.AndroidBridge?.exportForAI)AndroidBridge.exportForAI(text);else alert('この機能はAPK版で利用できます。')});
  }
  document.addEventListener('click',e=>{const b=e.target.closest('[data-tab="settings"]');if(b)setTimeout(attach,20)});
  setTimeout(()=>{const p=document.querySelector('[data-p="settings"].on');if(p)attach()},200);
})();
