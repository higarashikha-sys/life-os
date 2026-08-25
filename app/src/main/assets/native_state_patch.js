(()=>{
  if(window.__lifeosNativeStateInstalled)return;
  window.__lifeosNativeStateInstalled=true;
  const KEY='lifeos_v1';
  const bridge=window.AndroidBridge;
  if(!bridge)return;

  const validJson=s=>{
    if(!s)return false;
    try{const o=JSON.parse(s);return !!o&&typeof o==='object'}catch(e){return false}
  };

  let local=localStorage.getItem(KEY)||'';
  let native='';
  try{native=bridge.getStateJson()||''}catch(e){}

  // Androidのバックアップから復元された状態があれば、それをWebViewへ戻す。
  if(validJson(native)&&native!==local&&sessionStorage.getItem('__lifeos_native_restored')!=='1'){
    localStorage.setItem(KEY,native);
    sessionStorage.setItem('__lifeos_native_restored','1');
    location.reload();
    return;
  }

  // 既存ユーザーは、現在のlocalStorageを初回だけAndroid側へ移行する。
  if(!validJson(native)&&validJson(local)){
    try{bridge.saveStateJson(local)}catch(e){}
  }

  // 以後の保存はlocalStorageとAndroid SharedPreferencesの双方へ複製する。
  const originalSetItem=Storage.prototype.setItem;
  if(!Storage.prototype.__lifeosWrapped){
    Storage.prototype.setItem=function(key,value){
      const result=originalSetItem.call(this,key,value);
      if(this===localStorage&&key===KEY){
        try{bridge.saveStateJson(String(value))}catch(e){}
      }
      return result;
    };
    Storage.prototype.__lifeosWrapped=true;
  }

  // 注入前に保存された最新版も同期する。
  local=localStorage.getItem(KEY)||'';
  if(validJson(local)){
    try{bridge.saveStateJson(local)}catch(e){}
  }
})();
