(function(){
  window.LogKiller = window.LogKiller || {};
  const { utils } = window.LogKiller;

  async function handleJson(res){
    const data = await (utils?.safeJson ? utils.safeJson(res) : res.json().catch(()=>null));
    if (!res.ok) {
      const message = (data && (data.error || data.message)) || `HTTP ${res.status}`;
      const err = new Error(message);
      err.status = res.status;
      err.payload = data;
      throw err;
    }
    return data;
  }

  const api = {
    async getStats(){
      const res = await fetch('/stats');
      return handleJson(res);
    },
    async listReports(limit=8){
      const res = await fetch(`/reports?limit=${encodeURIComponent(limit)}`);
      return handleJson(res);
    },
    async getReport(id){
      const res = await fetch(`/reports/${encodeURIComponent(id)}`);
      return handleJson(res);
    },
    async deleteReport(id){
      let res = await fetch(`/reports/${encodeURIComponent(id)}`, { method: 'DELETE' });
      if (!res.ok) {
        // Fallback to POST endpoint
        res = await fetch(`/reports/${encodeURIComponent(id)}/delete`, { method: 'POST' });
      }
      return handleJson(res);
    },
    async resetDatabase(){
      let res = await fetch('/admin/reset', { method: 'DELETE' });
      if (!res.ok) {
        // Fall back to POST
        res = await fetch('/admin/reset', { method: 'POST' });
        if (!res.ok) {
          // Final fallback: GET with confirm
          res = await fetch('/admin/reset?confirm=true', { method: 'GET' });
        }
      }
      return handleJson(res);
    },
    async analyzeFile(file, { prompt } = {}){
      const formData = new FormData();
      formData.append('file', file);
      if (prompt && String(prompt).trim().length > 0) formData.append('prompt', String(prompt).trim());
      const res = await fetch('/analyze', { method:'POST', body: formData });
      return handleJson(res);
    },
    async chat(message, context){
      const res = await fetch('/chat', {
        method:'POST',
        headers:{ 'Content-Type':'application/json' },
        body: JSON.stringify({ message, context })
      });
      return handleJson(res);
    }
  };

  window.LogKiller.api = api;
})();
