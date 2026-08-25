(()=>{
  if(window.__lifeosTodayDueHighlightInstalled)return;
  window.__lifeosTodayDueHighlightInstalled=true;

  const pad=n=>String(n).padStart(2,'0');
  const todayKey=()=>{const d=new Date();return `${d.getFullYear()}-${pad(d.getMonth()+1)}-${pad(d.getDate())}`};

  const style=document.createElement('style');
  style.textContent=`
    [data-p="today"] #tasks .item.lifeos-due-today{
      background:#fff0f0;
      border-left:4px solid #b3261e;
      border-top-color:#e7b9b6;
      padding-left:10px;
      border-radius:8px;
    }
    [data-p="today"] #tasks .item.lifeos-due-today b{
      color:#b3261e;
    }
    [data-p="today"] #tasks .item.lifeos-due-today .taskmeta .pill:last-child{
      color:#b3261e;
      background:#ffe0de;
      font-weight:700;
    }
  `;
  document.head.appendChild(style);

  function apply(){
    const today=todayKey();
    document.querySelectorAll('[data-p="today"] #tasks .item').forEach(item=>{
      const due=[...item.querySelectorAll('.taskmeta .pill')].find(p=>p.textContent.trim().startsWith('期限 '));
      const isToday=!!due && due.textContent.trim()===`期限 ${today}`;
      item.classList.toggle('lifeos-due-today',isToday);
    });
  }

  let scheduled=false;
  const schedule=()=>{
    if(scheduled)return;
    scheduled=true;
    requestAnimationFrame(()=>{scheduled=false;apply()});
  };
  const observer=new MutationObserver(schedule);
  observer.observe(document.body,{childList:true,subtree:true});
  document.addEventListener('click',e=>{if(e.target.closest('[data-tab="today"]'))setTimeout(apply,0)},true);
  apply();
})();
