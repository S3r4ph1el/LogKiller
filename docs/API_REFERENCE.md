# API Reference

Backend base: Flask, respostas em JSON. Persistência baseada em arquivos (backend/data).

Autenticação: não há (uso local). Segurança mínima — não exponha publicamente sem camadas extras.

## Sumário de endpoints

- Páginas e estáticos
	- GET `/` → index.html
	- GET `/index.html` → index.html
	- GET `/report.html` → report.html
	- GET `/assets/<path>` → ícones/imagens
	- GET `/favicon.ico`

- Análise
	- POST `/analyze` → executa análise de logs e salva relatório

- Estatísticas e relatórios
	- GET `/stats` → contadores agregados
	- GET `/reports?limit=<n>` → lista recente
	- GET `/reports/<id>` → relatório completo
	- DELETE `/reports/<id>` → exclui relatório
	- POST `/reports/<id>/delete` → fallback de exclusão
	- DELETE `/admin/reset` → apaga todos os relatórios e zera summary
	- POST `/admin/reset` → fallback
	- GET `/admin/reset?confirm=true` → fallback (requer confirm)

- Chat
	- POST `/chat` → assistente (usa OpenAI se chave presente; caso contrário, fallback offline)

---

## Detalhes

### POST /analyze

Multipart form-data
- file: arquivo de logs (qualquer extensão, lido como texto)
- prompt (opcional): string

Resposta 200
```
{
	"analysis": { ... },
	"meta": {
		"id": "20250922T215138-5d4ceabd",
		"tipo_ameaca": "...",
		"severidade": "...",
		"iocs_count": 3,
		"data_analise": "..."
	}
}
```

Erros comuns
- 400: sem arquivo, arquivo vazio ou erro de leitura

### GET /stats

Resposta 200
```
{ "totalAnalyzed": 12, "threatsDetected": 5 }
```

### GET /reports?limit=n

Resposta 200
```
{
	"items": [
		{
			"id": "20250922T215138-5d4ceabd",
			"tipo_ameaca": "...",
			"severidade": "...",
			"iocs_count": 3,
			"data_analise": "2025-09-22"
		},
		...
	]
}
```

### GET /reports/<id>

Resposta 200: JSON completo do relatório

Resposta 404: `{ "error": "Not found" }`

### DELETE /reports/<id>

Exclui um relatório. Fallback: `POST /reports/<id>/delete` quando DELETE não está disponível.

Resposta 200
```
{ "status": "deleted", "id": "..." }
```

Resposta 404: `{ "error": "Not found" }`

### DELETE /admin/reset

Remove todos os relatórios e zera `summary.json`.

Fallbacks:
- `POST /admin/reset`
- `GET /admin/reset?confirm=true`

Resposta 200
```
{ "status": "ok", "deletedReports": 10, "summaryReset": true }
```

### POST /chat

Body (JSON)
```
{ "message": "texto da pergunta", "context": { ...relatório opcional... } }
```

Resposta 200
```
{ "reply": "texto", "source": "openai" | "offline" }
```

Resposta 400: `{ "error": "Mensagem vazia" }`

---

## Observações de persistência

- Relatórios: `backend/data/reports/<id>.json`
- Sumário: `backend/data/summary.json` com `{ totalAnalyzed, threatsDetected }`
