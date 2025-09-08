# Estrutura do Projeto

```plaintext
LogKiller/
├── backend/
│   ├── app.py                 # Flask principal (entrypoint)
│   ├── config.py              # Configurações (chaves API, paths, etc.)
│   ├── requirements.txt       # Dependências do backend
│   ├── core/
│   │   ├── __init__.py
│   │   ├── cleaner.py         # Filtro, limpeza, normalização dos logs, anonimização
│   │   └── analyzer.py        # Envio para OpenAI API e análise de ameaças
│   ├── routes/
│   │   ├── __init__.py
│   │   ├── logs.py            # Endpoints para upload e processamento de logs
│   │   ├── chatbot.py         # Endpoints do chatbot
│   │   └── reports.py         # Endpoints para gerar e servir relatórios HTML
│   ├── utils/
│   │   ├── helpers.py         # Funções auxiliares
│   │   ├── validators.py      # Validação de entradas
│   │   └── mitre_links.py     # Geração automática de links úteis (MITRE, VT, CVE)
│   └── tests/
│       ├── test_logs.py       # Testes unitários processamento de logs
│       ├── test_chatbot.py    # Testes do chatbot
│       └── test_reports.py    # Testes relatórios
├── frontend/
│   ├── index.html             # Interface principal
│   ├── report.html            # Template do relatório interativo
│   ├── chatbot.html           # UI do chatbot
│   ├── static/
│   │   ├── css/
│   │   │   └── style.css
│   │   └── js/
│   │       ├── main.js
│   │       ├── report.js
│   │       └── chatbot.js
│   └── assets/
│       ├── icons/             # Ícones usados no dashboard/chatbot
│       └── img/               # Logos e imagens
├── docs/
│   ├── API_REFERENCE.md       # Endpoints do backend
│   └── STRUCTURE.md           # Estrutura do projeto
├── docker-compose.yml
├── Dockerfile
└── .gitignore
```
