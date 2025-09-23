document.addEventListener('DOMContentLoaded', function() {
  const { utils, storage } = window.LogKiller || {};
  const report = storage.get('report', {});

  const threatTypeElement = document.getElementById('threatType');
  if (threatTypeElement) threatTypeElement.textContent = report.tipo_ameaca || report.threatType || 'Não identificado';

  const severityLevelElement = document.getElementById('severityLevel');
  const severityText = report.severidade || report.severity || 'Não especificado';
  function applySeverityStyle(element, severity){
    if (!severity || !element) return;
    const s = String(severity).toLowerCase();
    element.classList.remove('severity-high','severity-medium','severity-low');
    if (s.includes('alta') || s.includes('high') || s.includes('crític')) element.classList.add('severity-high');
    else if (s.includes('média') || s.includes('medio') || s.includes('medium')) element.classList.add('severity-medium');
    else if (s.includes('baixa') || s.includes('low')) element.classList.add('severity-low');
  }
  if (severityLevelElement){
    severityLevelElement.textContent = severityText;
    applySeverityStyle(severityLevelElement, severityText);
  }

  const pointer = document.getElementById('severityPointer');
  if (pointer){
    const sev = String(severityText||'').toLowerCase();
    let pos = 0; if (sev.includes('méd') || sev.includes('medio') || sev.includes('medium')) pos = 50; if (sev.includes('alta') || sev.includes('high') || sev.includes('crít')) pos = 100;
    pointer.style.left = `calc(${pos}% - 7px)`;
  }

  const analysisDateElement = document.getElementById('analysisDate');
  if (analysisDateElement) analysisDateElement.textContent = report.data_analise || new Date().toLocaleDateString('pt-BR');

  const threatContextElement = document.getElementById('threatContext');
  const contextText = report.contexto || report.context || '';
  if (threatContextElement && contextText && contextText !== '-') {
    threatContextElement.innerHTML = `<p>${utils.escapeHtml(contextText)}</p>`;
  }

  const iocsList = document.getElementById('iocsList');
  const iocs = Array.isArray(report.iocs) ? report.iocs : [];
  if (iocsList && iocs.length > 0){
    iocsList.innerHTML = '';
    iocs.forEach((item)=>{
      let value = '', type = '';
      if (typeof item === 'string'){ value = item; type = window.LogKiller.utils.guessIocType(item); }
      else if (item && typeof item === 'object'){ value = item.value || item.valor || item.ioc || ''; type = item.type || item.tipo || window.LogKiller.utils.guessIocType(value); }
      if (!value) return;
      const iocItem = document.createElement('div'); iocItem.className = 'ioc-item';
      const valueSpan = `<span class="ioc-value" title="${utils.escapeHtml(value)}">${utils.escapeHtml(value)}</span>`;
      iocItem.innerHTML = `${valueSpan} <span class="ioc-type">${utils.escapeHtml(type || 'IOC')}</span>`;
      iocsList.appendChild(iocItem);
    });
  }

  const recommendationsElement = document.getElementById('recommendations');
  const recommendationsArr = report.recomendacoes || report.recommendations || [];
  if (recommendationsElement && Array.isArray(recommendationsArr) && recommendationsArr.length > 0){
    recommendationsElement.innerHTML = '';
    recommendationsArr.forEach((rec)=>{
      const text = typeof rec === 'string' ? rec : (rec && (rec.text || rec.descricao || rec.description)) || '';
      if (!text) return;
      const recElement = document.createElement('div');
      recElement.className = 'recommendation';
      recElement.innerHTML = `<i class="fas fa-check-circle"></i> <p>${utils.escapeHtml(text)}</p>`;
      recommendationsElement.appendChild(recElement);
    });
  }
});
