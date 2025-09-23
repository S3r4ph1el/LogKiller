(function(){
  window.LogKiller = window.LogKiller || {};
  const NS = 'logkiller_';
  const storage = {
    set(key, value){
      try { localStorage.setItem(NS + key, JSON.stringify(value)); } catch {}
    },
    get(key, fallback = null){
      try {
        const v = localStorage.getItem(NS + key);
        return v ? JSON.parse(v) : fallback;
      } catch { return fallback; }
    },
    setRaw(key, value){
      try { localStorage.setItem(NS + key, String(value)); } catch {}
    },
    getRaw(key, fallback=''){ try { return localStorage.getItem(NS + key) ?? fallback; } catch { return fallback; } },
    remove(key){ try { localStorage.removeItem(NS + key); } catch {} }
  };
  window.LogKiller.storage = storage;
})();
