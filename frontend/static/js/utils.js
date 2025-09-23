(function(){
  window.LogKiller = window.LogKiller || {};
  const utils = {
    escapeHtml(str){
      return String(str ?? '')
        .replace(/&/g,'&amp;')
        .replace(/</g,'&lt;')
        .replace(/>/g,'&gt;')
        .replace(/"/g,'&quot;')
        .replace(/'/g,'&#039;');
    },
    guessIocType(value){
      if (!value || typeof value !== 'string') return 'IOC';
      const urlPattern = /^(?:https?:\/\/|ftp:\/\/)/i;
      const ipPattern = /^(25[0-5]|2[0-4]\d|[01]?\d\d?)\.(25[0-5]|2[0-4]\d|[01]?\d\d?)\.(25[0-5]|2[0-4]\d|[01]?\d\d?)\.(25[0-5]|2[0-4]\d|[01]?\d\d?)$/;
      const hashPattern = /^[A-Fa-f0-9]{32}$|^[A-Fa-f0-9]{40}$|^[A-Fa-f0-9]{64}$/; // MD5/SHA1/SHA256
      const domainPattern = /^(?!-)[A-Za-z0-9-]{1,63}(?<!-)\.(?:[A-Za-z]{2,})(?:\.[A-Za-z]{2,})*$/;
      if (ipPattern.test(value)) return 'IP';
      if (urlPattern.test(value)) return 'URL';
      if (hashPattern.test(value)) return 'Hash';
      if (domainPattern.test(value)) return 'Domínio';
      if (/\\|\//.test(value)) return 'Arquivo';
      return 'IOC';
    },
    formatFileSize(bytes){
      if (!Number.isFinite(bytes) || bytes <= 0) return '0 Bytes';
      const k = 1024;
      const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
      const i = Math.min(Math.floor(Math.log(bytes) / Math.log(k)), sizes.length - 1);
      return `${parseFloat((bytes / Math.pow(k, i)).toFixed(2))} ${sizes[i]}`;
    },
    async safeJson(res){
      try { return await res.json(); } catch { return null; }
    }
  };
  window.LogKiller.utils = utils;
})();
