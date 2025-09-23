# Estrutura do Projeto (atual)

```plaintext
LogKiller/
├── backend/
│   ├── app.py                 # App Flask (entrypoint, estáticos e assets)
│   ├── requeriments.txt       # Dependências do backend (arquivo existente no repo)
│   ├── core/
│   │   ├── __init__.py
│   │   ├── cleaner.py         # Limpeza/normalização de logs
│   │   ├── analyzer.py        # Análise (usa OpenAI quando disponível)
│   │   └── storage.py         # Persistência em JSON, listagem, exclusão, reset
│   ├── data/
│   │   ├── summary.json       # Estatísticas agregadas
│   │   └── reports/           # Relatórios salvos (<id>.json)
│   └── routes/
│       ├── __init__.py
│       ├── logs.py            # /analyze, /stats, /reports, /admin/reset
│       └── chatbot.py         # /chat
├── frontend/
│   ├── index.html             # Upload, progresso, estatísticas e recentes
│   ├── report.html            # Visualização do relatório e chat contextual
│   ├── static/
│   │   ├── css/
│   │   │   ├── style.css
│   │   │   ├── report.css
│   │   │   └── chat.css
│   │   └── js/
│   │       ├── utils.js       # Utilitários (escape, IoC type, formatos)
│   │       ├── api.js         # Cliente HTTP para as APIs
│   │       ├── storage.js     # LocalStorage com namespace
│   │       ├── main.js        # Fluxo da página inicial
│   │       ├── report.js      # Renderização do relatório
│   │       └── chat_widget.js # Chat flutuante (index e report)
│   └── assets/
│       ├── icons/
│       │   ├── favicon.ico
│       │   └── icon.png
│       └── img/
│           └── logkiller.jpeg
├── docs/
│   ├── API_REFERENCE.md       # Endpoints do backend (atualizado)
│   └── STRUCTURE.md           # Este arquivo
└── README.md
```
