# Estrutura do Projeto

log-killer/
│── backend/
│   │── app.py                 # Flask principal (entrypoint)
│   │── config.py              # Configurações (chaves API, paths, etc.)
│   │── requirements.txt       # Dependências do backend
│   │
│   ├── core/
│   │   │── __init__.py
│   │   │── log_processor.py   # Filtro, limpeza, normalização dos logs
│   │   │── anonymizer.py      # Funções para anonimizar dados sensíveis
│   │   │── analyzer.py        # Envio para OpenAI API e análise de ameaças
│   │   │── grouper.py         # Agrupamento de eventos/sessões
│   │
│   ├── routes/
│   │   │── __init__.py
│   │   │── logs.py            # Endpoints para upload e processamento de logs
│   │   │── chatbot.py         # Endpoints do chatbot
│   │   │── reports.py         # Endpoints para gerar e servir relatórios HTML
│   │
│   ├── utils/
│   │   │── helpers.py         # Funções auxiliares
│   │   │── validators.py      # Validação de entradas
│   │   │── mitre_links.py     # Geração automática de links úteis (MITRE, VT, CVE)
│   │
│   ├── tests/
│   │   │── test_logs.py       # Testes unitários processamento de logs
│   │   │── test_chatbot.py    # Testes do chatbot
│   │   │── test_reports.py    # Testes relatórios
│
│── frontend/
│   │── index.html             # Interface principal
│   │── report.html            # Template do relatório interativo
│   │── chatbot.html           # UI do chatbot
│   │
│   ├── static/
│   │   │── css/
│   │   │   │── style.css
│   │   │── js/
│   │   │   │── main.js
│   │   │   │── report.js
│   │   │   │── chatbot.js
│   │
│   ├── assets/
│       │── icons/             # Ícones usados no dashboard/chatbot
│       │── img/               # Logos e imagens
│
│── docs/
│   │── README.md              # Documentação inicial
│   │── API_REFERENCE.md       # Endpoints do backend
│   │── DEPLOY.md              # Como rodar com Docker
│   │── TEST_PLAN.md           # Casos de teste
│
│── docker-compose.yml
│── Dockerfile
│── .gitignore
