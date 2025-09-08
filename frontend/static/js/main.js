document.addEventListener('DOMContentLoaded', function() {
    const dropZone = document.getElementById('dropZone');
    const fileInput = document.getElementById('fileInput');
    const browseBtn = document.getElementById('browseBtn');
    const analyzeBtn = document.getElementById('analyzeBtn');
    const clearBtn = document.getElementById('clearBtn');
    const fileInfo = document.getElementById('fileInfo');
    const progressBar = document.getElementById('progressBar');
    const statusMessage = document.getElementById('statusMessage');
    const analysisResult = document.getElementById('analysisResult');
    const noAnalysis = document.getElementById('noAnalysis');
    // Campo de prompt é opcional; se não existir, seguimos sem ele
    const promptInput = document.getElementById('promptInput');
    
    let currentFile = null;
    
    // Configurar a zona de drop
    ['dragenter', 'dragover', 'dragleave', 'drop'].forEach(eventName => {
        dropZone.addEventListener(eventName, preventDefaults, false);
    });
    
    function preventDefaults(e) {
        e.preventDefault();
        e.stopPropagation();
    }
    
    // Efeitos visuais para drag and drop
    ['dragenter', 'dragover'].forEach(eventName => {
        dropZone.addEventListener(eventName, highlight, false);
    });
    
    ['dragleave', 'drop'].forEach(eventName => {
        dropZone.addEventListener(eventName, unhighlight, false);
    });
    
    function highlight() {
        dropZone.style.borderColor = '#3498db';
        dropZone.style.backgroundColor = 'rgba(52, 152, 219, 0.1)';
    }
    
    function unhighlight() {
        dropZone.style.borderColor = '#7f8c8d';
        dropZone.style.backgroundColor = 'transparent';
    }
    
    // Manipular o drop de arquivos
    dropZone.addEventListener('drop', handleDrop, false);
    
    function handleDrop(e) {
        const dt = e.dataTransfer;
        const files = dt.files;
        handleFiles(files);
    }
    
    // Botão de procurar arquivo
    browseBtn.addEventListener('click', () => {
        fileInput.click();
    });
    
    fileInput.addEventListener('change', () => {
        handleFiles(fileInput.files);
    });
    
    function handleFiles(files) {
        if (files.length > 0) {
            const file = files[0];
            currentFile = file;
            
            // Atualizar informações do arquivo
            fileInfo.innerHTML = `
                <strong>Arquivo:</strong> ${file.name}<br>
                <strong>Tipo:</strong> ${file.type || 'Não especificado'}<br>
                <strong>Tamanho:</strong> ${formatFileSize(file.size)}
            `;
            
            // Habilitar botão de análise
            analyzeBtn.disabled = false;
            
            // Atualizar status
            statusMessage.textContent = 'Arquivo pronto para análise';
            statusMessage.className = 'status success';
        }
    }
    
    // Formatar tamanho do arquivo
    function formatFileSize(bytes) {
        if (bytes === 0) return '0 Bytes';
        const k = 1024;
        const sizes = ['Bytes', 'KB', 'MB', 'GB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
    }
    
    // Botão de limpar
    clearBtn.addEventListener('click', () => {
        fileInput.value = '';
        currentFile = null;
        fileInfo.textContent = 'Nenhum arquivo selecionado';
        analyzeBtn.disabled = true;
        progressBar.style.width = '0%';
        statusMessage.textContent = 'Pronto para analisar';
        statusMessage.className = 'status info';
        
        // Esconder resultados
        analysisResult.classList.remove('visible');
        noAnalysis.classList.remove('hidden');
    });
    
    // Botão de análise
    analyzeBtn.addEventListener('click', async () => {
        if (!currentFile) return;
        await analyzeFile(currentFile);
    });

    async function analyzeFile(file) {
        // Desabilitar botão durante a análise
        analyzeBtn.disabled = true;

        statusMessage.textContent = 'Analisando arquivo...';
        statusMessage.className = 'status info';

        // Simulação leve de progresso enquanto aguardamos o backend
        let progress = 0;
        const tick = setInterval(() => {
            progress = Math.min(progress + Math.random() * 7, 95);
            progressBar.style.width = progress + '%';
        }, 200);

        try {
            const formData = new FormData();
            formData.append('file', file);
            if (promptInput && promptInput.value && promptInput.value.trim().length > 0) {
                formData.append('prompt', promptInput.value.trim());
            }

            const res = await fetch('/analyze', {
                method: 'POST',
                body: formData
            });

            if (!res.ok) {
                const err = await safeJson(res);
                throw new Error(err && err.error ? err.error : `Erro ${res.status}`);
            }

            const data = await res.json();
            const analysis = data && data.analysis ? data.analysis : {};

            // Renderizar resultados
            renderAnalysis(analysis);

            // Finalizar progresso
            progressBar.style.width = '100%';
            statusMessage.textContent = 'Análise concluída com sucesso!';
            statusMessage.className = 'status success';

            analysisResult.classList.add('visible');
            noAnalysis.classList.add('hidden');
        } catch (e) {
            statusMessage.textContent = `Falha na análise: ${e.message || e}`;
            statusMessage.className = 'status error';
        } finally {
            clearInterval(tick);
            analyzeBtn.disabled = false;
        }
    }

    function renderAnalysis(analysis) {
        const threatType = analysis.tipo_ameaca || analysis.threatType || '-';
        const context = analysis.contexto || analysis.context || '-';
        const recommendationsArr = analysis.recomendacoes || analysis.recommendations || [];

        // Severidade pode não vir do backend; deixa em '-' se ausente
        const severity = analysis.severidade || analysis.severity || '-';

        document.getElementById('threatType').textContent = threatType || '-';
        document.getElementById('severityLevel').textContent = severity || '-';
        document.getElementById('threatContext').textContent = context || '-';

        const iocsList = document.getElementById('iocsList');
        iocsList.innerHTML = '';

        const iocs = Array.isArray(analysis.iocs) ? analysis.iocs : [];
        if (iocs.length > 0) {
            iocs.forEach((item) => {
                // Normalizar IOC: strings ou objetos
                let value = '';
                let type = '';
                if (typeof item === 'string') {
                    value = item;
                    type = guessIocType(item);
                } else if (item && typeof item === 'object') {
                    value = item.value || item.valor || item.ioc || '';
                    type = item.type || item.tipo || guessIocType(value);
                }

                if (!value) return;
                const iocItem = document.createElement('div');
                iocItem.className = 'ioc-item';
                iocItem.innerHTML = `
                    <span>${escapeHtml(value)}</span>
                    <span class="ioc-type">${escapeHtml(type || 'IOC')}</span>
                `;
                iocsList.appendChild(iocItem);
            });
        } else {
            iocsList.innerHTML = '<p>Nenhum IOC detectado.</p>';
        }

        const recommendations = document.getElementById('recommendations');
        recommendations.innerHTML = '';
        if (Array.isArray(recommendationsArr) && recommendationsArr.length > 0) {
            recommendationsArr.forEach((rec) => {
                const text = typeof rec === 'string' ? rec : (rec && rec.text) || '';
                if (!text) return;
                const recElement = document.createElement('div');
                recElement.className = 'recommendation';
                recElement.innerHTML = `
                    <i class="fas fa-check-circle"></i>
                    <p>${escapeHtml(text)}</p>
                `;
                recommendations.appendChild(recElement);
            });
        } else {
            recommendations.innerHTML = '<p>Nenhuma recomendação específica.</p>';
        }
    }

    function guessIocType(value) {
        if (!value || typeof value !== 'string') return 'IOC';
        const urlPattern = /^https?:\/\/|^ftp:\/\//i;
        const ipPattern = /^(25[0-5]|2[0-4]\d|[01]?\d\d?)\.(25[0-5]|2[0-4]\d|[01]?\d\d?)\.(25[0-5]|2[0-4]\d|[01]?\d\d?)\.(25[0-5]|2[0-4]\d|[01]?\d\d?)$/;
        const hashPattern = /^[A-Fa-f0-9]{32}$|^[A-Fa-f0-9]{40}$|^[A-Fa-f0-9]{64}$/; // MD5/SHA1/SHA256
        const domainPattern = /^(?!-)[A-Za-z0-9-]{1,63}(?<!-)\.(?:[A-Za-z]{2,})(?:\.[A-Za-z]{2,})*$/;
        if (ipPattern.test(value)) return 'IP';
        if (urlPattern.test(value)) return 'URL';
        if (hashPattern.test(value)) return 'Hash';
        if (domainPattern.test(value)) return 'Domínio';
        if (/\\|\//.test(value)) return 'Arquivo';
        return 'IOC';
    }

    function escapeHtml(str) {
        return String(str)
            .replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;')
            .replace(/"/g, '&quot;')
            .replace(/'/g, '&#039;');
    }

    async function safeJson(res) {
        try { return await res.json(); } catch { return null; }
    }
});