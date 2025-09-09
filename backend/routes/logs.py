from flask import Blueprint, request, jsonify, send_from_directory
from pathlib import Path
from core.cleaner import process_logs
from core.analyzer import analyze_logs
import tiktoken

logs_bp = Blueprint("logs", __name__)


# GET para servir a página de upload/análise
@logs_bp.route("/", methods=["GET"])
def index():
    # Caminho absoluto para o diretório do frontend (raiz do projeto /frontend)
    project_root = Path(__file__).resolve().parents[2]
    frontend_dir = project_root / "frontend"
    return send_from_directory(str(frontend_dir), "index.html")

# POST para realizar a análise
@logs_bp.route("/analyze", methods=["POST"])
def analyze():
    prompt = None
    raw_logs = None

    file = request.files.get("file")
    if not file:
        return jsonify({"error": "Nenhum log fornecido"}), 400

    # Lê o conteúdo do arquivo de log (todos os tipos de arquivo são aceitos)
    try:
        raw_logs = file.read().decode("utf-8", errors="ignore")
    except Exception as e:
        return jsonify({"error": f"Erro ao ler o arquivo: {str(e)}"}), 400

    if not raw_logs.strip():
        return jsonify({"error": "O arquivo de log está vazio"}), 400

    enc = tiktoken.encoding_for_model("gpt-5-nano-2025-08-07")
    n_tokens = len(enc.encode(raw_logs))

    processed = process_logs(raw_logs)
    result = analyze_logs(processed, prompt=prompt)
    print(f"Resultado da análise: {result}")
    return jsonify({"analysis": result})

@logs_bp.route("/report", methods=["GET"])
def serve_report_html():
    project_root = Path(__file__).resolve().parents[2]
    frontend_dir = project_root / "frontend"
    return send_from_directory(str(frontend_dir), "report.html")