(function(){
  const { utils, api, storage } = window.LogKiller || {};

  function initChatWidget({contextProvider, welcomeText}){
    const toggleBtn = document.getElementById('reportChatToggle');
    const panel = document.getElementById('reportChatPanel');
    const closeBtn = document.getElementById('reportChatClose');
    const bodyEl = document.getElementById('reportChatBody');
    const inputEl = document.getElementById('reportChatInput');
    const sendBtn = document.getElementById('reportChatSend');
    if (!toggleBtn || !panel || !bodyEl || !inputEl || !sendBtn) return;

    function append(role, text, typing=false){
      const wrap = document.createElement('div');
      wrap.className = `msg ${role}`;
      const bubble = document.createElement('div');
      bubble.className = 'bubble' + (typing ? ' report-chat-typing' : '');
      bubble.innerHTML = utils.escapeHtml(String(text)).replace(/\n/g,'<br/>');
      wrap.appendChild(bubble);
      bodyEl.appendChild(wrap);
      bodyEl.scrollTop = bodyEl.scrollHeight;
      return wrap;
    }

    function openPanel(){
      panel.classList.add('open'); panel.setAttribute('aria-hidden','false');
      if (bodyEl.childElementCount === 0) {
        append('bot', welcomeText || 'Olá! Como posso ajudar?');
      }
      setTimeout(()=> inputEl && inputEl.focus(), 50);
    }
    function closePanel(){ panel.classList.remove('open'); panel.setAttribute('aria-hidden','true'); }

    async function send(){
      const text = (inputEl.value||'').trim(); if (!text) return;
      append('user', text); inputEl.value=''; sendBtn.disabled = true;
      const typing = append('bot','Digitando...', true);
      try{
        const context = (typeof contextProvider === 'function') ? (contextProvider()||{}) : {};
        const data = await api.chat(text, context);
        bodyEl.removeChild(typing);
        append('bot', (data && data.reply) || 'Sem resposta.');
      }catch(e){ bodyEl.removeChild(typing); append('bot','Erro ao conectar ao servidor.'); }
      finally { sendBtn.disabled = false; }
    }

    toggleBtn.addEventListener('click', openPanel);
    closeBtn && closeBtn.addEventListener('click', closePanel);
    sendBtn.addEventListener('click', send);
    inputEl.addEventListener('keydown', (e)=>{ if(e.key==='Enter' && !e.shiftKey){ e.preventDefault(); send(); } });

    // Chips
    document.querySelectorAll('.report-chat-chips .chip').forEach(chip => chip.addEventListener('click', ()=>{
      inputEl.value = chip.getAttribute('data-q')||''; send();
    }));
  }

  document.addEventListener('DOMContentLoaded', function(){
    // Detect page by presence of report data or known elements
    const isReportPage = !!document.querySelector('#threatType') || !!document.querySelector('#reportChatPanel.report');

    if (isReportPage) {
      // Context from localStorage
      initChatWidget({
        contextProvider: function(){ return storage.get('report', {}); },
        welcomeText: 'Olá! Posso explicar os resultados deste relatório. Pergunte sobre severidade, IoCs ou ações recomendadas.'
      });
    } else {
      // Index/help context
      initChatWidget({
        contextProvider: function(){ return { page: 'index' }; },
        welcomeText: 'Olá! Posso ajudar você a usar o LogKiller. Faça uma pergunta ou toque em um atalho acima.'
      });
    }
  });
})();
