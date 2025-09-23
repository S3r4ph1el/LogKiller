document.addEventListener('DOMContentLoaded', function() {
    const { utils, api, storage } = window.LogKiller || {};
    const qs = (sel) => document.querySelector(sel);
    const qsid = (id) => document.getElementById(id);

    const dropZone = qsid('dropZone');
    const fileInput = qsid('fileInput');
    const browseBtn = qsid('browseBtn');
    const analyzeBtn = qsid('analyzeBtn');
    const clearBtn = qsid('clearBtn');
    const fileInfo = qsid('fileInfo');
    const progressBar = qsid('progressBar');
    const statusMessage = qsid('statusMessage');
    const promptInput = qsid('promptInput');

    let currentFile = null;

    // Drag & drop setup
    ['dragenter', 'dragover', 'dragleave', 'drop'].forEach(evt => {
        dropZone.addEventListener(evt, (e)=>{ e.preventDefault(); e.stopPropagation(); }, false);
    });

    ['dragenter','dragover'].forEach(evt=>{
        dropZone.addEventListener(evt, ()=>{
            dropZone.style.borderColor = '#3498db';
            dropZone.style.backgroundColor = 'rgba(52, 152, 219, 0.1)';
        }, false);
    });
    ['dragleave','drop'].forEach(evt=>{
        dropZone.addEventListener(evt, ()=>{
            dropZone.style.borderColor = '#7f8c8d';
            dropZone.style.backgroundColor = 'transparent';
        }, false);
    });
    dropZone.addEventListener('drop', (e)=>{
        const files = e.dataTransfer.files; handleFiles(files);
    }, false);

    // Stats
    async function loadStats(){
        const totalAnalyzed = qsid('totalAnalyzed');
        const threatsDetected = qsid('threatsDetected');
        try{
            const s = await api.getStats();
            if (totalAnalyzed) totalAnalyzed.textContent = s.totalAnalyzed ?? 0;
            if (threatsDetected) threatsDetected.textContent = s.threatsDetected ?? 0;
        }catch{
            if (totalAnalyzed) totalAnalyzed.textContent = Number(storage.getRaw('total_analyzed', 0));
        }
    }
    loadStats();

    // Recent reports
    async function loadRecent(){
        const container = qsid('recentReports'); if (!container) return;
        try{
            const data = await api.listReports(8);
            const items = Array.isArray(data.items) ? data.items : [];
            if (items.length === 0){ container.innerHTML = '<div class="no-data">Nenhum relatório salvo ainda.</div>'; return; }
            container.innerHTML = '';
            const list = document.createElement('div'); list.className = 'stats-grid';
            items.forEach((it)=>{
                    const card = document.createElement('div'); card.className = 'stat-card'; card.style.cursor='pointer'; card.style.position='relative';
                    card.innerHTML = `
                    <div style="font-weight:700;">${utils.escapeHtml(it.tipo_ameaca || 'Relatório')}</div>
                    <div style="font-size:0.95rem; opacity:0.85;">Severidade: ${utils.escapeHtml(it.severidade || '-')}</div>
                    <div style="font-size:0.9rem; opacity:0.7;">IoCs: ${Number(it.iocs_count || 0)}</div>
                        <div style=\"font-size:0.85rem; opacity:0.6;\">${utils.escapeHtml(it.data_analise || '')}</div>
                        <button class=\"del-report-btn\" title=\"Excluir\" aria-label=\"Excluir relatório\" style=\"position:absolute; top:8px; right:8px; background:#e74c3c; color:#fff; border:none; border-radius:4px; padding:4px 6px; font-size:12px; cursor:pointer;\"><i class=\"fas fa-trash\"></i></button>`;
                card.addEventListener('click', async ()=>{
                    try{
                        const full = await api.getReport(it.id);
                            storage.set('report', { ...full, _id: it.id });
                        window.location.href = '/report.html';
                    }catch{}
                });
                    const delBtn = card.querySelector('.del-report-btn');
                    delBtn.addEventListener('click', async (ev)=>{
                        ev.stopPropagation();
                        const confirmDel = window.confirm('Excluir este relatório? Esta ação não pode ser desfeita.');
                        if (!confirmDel) return;
                        try{
                            await api.deleteReport(it.id);
                            card.remove();
                            // If list now empty, show placeholder
                            if (!list.querySelector('.stat-card')){
                                container.innerHTML = '<div class="no-data">Nenhum relatório salvo ainda.</div>';
                            }
                            await loadStats();
                        }catch(e){
                            alert('Falha ao excluir: ' + (e?.message || 'erro desconhecido'));
                        }
                    });
                list.appendChild(card);
            });
            container.appendChild(list);
        }catch{
            container.innerHTML = '<div class="no-data">Não foi possível carregar os relatórios recentes.</div>';
        }
    }
    loadRecent();

    // File browse
    browseBtn.addEventListener('click', ()=> fileInput.click());
    fileInput.addEventListener('change', ()=> handleFiles(fileInput.files));

    function handleFiles(files){
        if (!files || files.length === 0) return;
        const file = files[0]; currentFile = file;
        fileInfo.innerHTML = `
            <strong>Arquivo:</strong> ${utils.escapeHtml(file.name)}<br>
            <strong>Tipo:</strong> ${utils.escapeHtml(file.type || 'Não especificado')}<br>
            <strong>Tamanho:</strong> ${utils.escapeHtml(utils.formatFileSize(file.size))}`;
            analyzeBtn.disabled = false;
            statusMessage.textContent = 'Arquivo pronto para análise';
            statusMessage.className = 'status success';
    }

    // Clear
    clearBtn.addEventListener('click', ()=>{
        fileInput.value=''; currentFile=null; analyzeBtn.disabled=true;
        fileInfo.textContent = 'Nenhum arquivo selecionado';
        progressBar.style.width = '0%';
        statusMessage.textContent = 'Pronto para analisar';
            statusMessage.className = 'status ready';
        const analysisResult = qsid('analysisResult');
        const noAnalysis = qsid('noAnalysis');
        if (analysisResult) analysisResult.classList.remove('visible');
        if (noAnalysis) noAnalysis.classList.remove('hidden');
    });

    // Analyze
    analyzeBtn.addEventListener('click', async ()=>{ if (currentFile) await analyzeFile(currentFile); });

    async function analyzeFile(file){
        analyzeBtn.disabled = true;
        statusMessage.textContent = 'Analisando arquivo...';
        statusMessage.className = 'status info';

        let progress = 0; const tick = setInterval(()=>{
            progress = Math.min(progress + Math.random()*7, 95);
            progressBar.style.width = progress + '%';
        }, 200);
        try{
            const data = await api.analyzeFile(file, { prompt: promptInput && promptInput.value });
            const analysis = (data && data.analysis) ? data.analysis : {};
            const id = data && data.meta && data.meta.id;
            progressBar.style.width = '100%';
            statusMessage.textContent = 'Análise concluída com sucesso!';
            statusMessage.className = 'status success';
            storage.set('report', id ? { ...analysis, _id: id } : analysis);
            try { await loadStats(); } catch {}
            window.location.href = '/report.html';
        }catch(e){
            statusMessage.textContent = `Falha na análise: ${e.message || e}`;
            statusMessage.className = 'status error';
        }finally{
            clearInterval(tick);
            analyzeBtn.disabled = false;
        }

    }

    // Admin: reset database (attach on page load)
    const resetBtn = qsid('resetDbBtn');
    if (resetBtn){
        resetBtn.addEventListener('click', async ()=>{
            const confirmReset = window.confirm('Excluir TODOS os relatórios e zerar estatísticas?');
            if (!confirmReset) return;
            try{
                await api.resetDatabase();
                await loadStats();
                const container = qsid('recentReports');
                if (container) container.innerHTML = '<div class="no-data">Nenhum relatório salvo ainda.</div>';
                const status = qsid('statusMessage');
                if (status){ status.textContent = 'Banco de dados limpo.'; status.className = 'status success'; }
            }catch(e){
                alert('Falha ao limpar: ' + (e?.message || 'erro desconhecido'));
            }
        });
    }
});