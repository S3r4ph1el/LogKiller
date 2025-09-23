from flask import Blueprint, request, jsonify, send_from_directory
from pathlib import Path
from core.cleaner import process_logs
from core.analyzer import analyze_logs
from core.storage import save_report, get_stats, list_reports, get_report, delete_report, reset_database
import tiktoken

logs_bp = Blueprint("logs", __name__)


# GET para servir a página de upload/análise
@logs_bp.route("/index.html", methods=["GET"])
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
    # Persist report
    meta = save_report(result if isinstance(result, dict) else {"raw": str(result)})
    return jsonify({"analysis": result, "meta": meta})

# Servir report.html (inclui alias)
@logs_bp.route("/report.html", methods=["GET"])
def serve_report_html():
    project_root = Path(__file__).resolve().parents[2]
    frontend_dir = project_root / "frontend"
    return send_from_directory(str(frontend_dir), "report.html")

# Stats and reports APIs for index.html
@logs_bp.route("/stats", methods=["GET"])
def stats():
    return jsonify(get_stats())

@logs_bp.route("/reports", methods=["GET"])
def reports():
    try:
        limit = int(request.args.get("limit", "10"))
    except Exception:
        limit = 10
    return jsonify({"items": list_reports(limit=limit)})

@logs_bp.route("/reports/<report_id>", methods=["GET"])
def report_detail(report_id: str):
    data = get_report(report_id)
    if data is None:
        return jsonify({"error": "Not found"}), 404
    return jsonify(data)


# DELETE a specific report
@logs_bp.route("/reports/<report_id>", methods=["DELETE"])
def report_delete(report_id: str):
    ok = delete_report(report_id)
    if not ok:
        return jsonify({"error": "Not found"}), 404
    return jsonify({"status": "deleted", "id": report_id})


# Fallback POST to delete when DELETE is not available
@logs_bp.route("/reports/<report_id>/delete", methods=["POST"])
def report_delete_post(report_id: str):
    ok = delete_report(report_id)
    if not ok:
        return jsonify({"error": "Not found"}), 404
    return jsonify({"status": "deleted", "id": report_id})


# DELETE/POST/GET all reports and reset summary
@logs_bp.route("/admin/reset", methods=["DELETE", "POST", "GET"])
def admin_reset():
    # If GET, require an explicit confirm
    if request.method == "GET":
        if request.args.get("confirm") not in ("1", "true", "yes"):  # simple guard
            return jsonify({"error": "Confirmation required: add ?confirm=true"}), 400
    result = reset_database()
    return jsonify({"status": "ok", **result})
