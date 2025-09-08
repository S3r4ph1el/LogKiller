from flask import Blueprint, request, jsonify, send_from_directory
from pathlib import Path
from core.cleaner import process_logs
from core.analyzer import analyze_logs

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

    # multipart/form-data
    if request.files.get("file"):
        file = request.files["file"]
        raw_logs = file.read().decode("utf-8", errors="ignore")
        prompt = request.form.get("prompt")
    else:
        # JSON body
        try:
            data = request.get_json(silent=True) or {}
        except Exception:
            data = {}
        raw_logs = data.get("logs")
        prompt = data.get("prompt")

    if not raw_logs:
        return jsonify({"error": "Nenhum log fornecido"}), 400

    processed = process_logs(raw_logs)
    result = analyze_logs(processed, prompt=prompt)
    return jsonify({"analysis": result})