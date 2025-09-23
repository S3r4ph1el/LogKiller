from flask import Flask, jsonify, send_from_directory
from pathlib import Path
from routes.logs import logs_bp
from routes.chatbot import chatbot_bp

app = Flask(__name__, static_folder="../frontend/static")

app.register_blueprint(logs_bp, url_prefix="/")
app.register_blueprint(chatbot_bp, url_prefix="/")

@app.route("/", methods=["GET"])
def home():
    return send_from_directory("../frontend", "index.html")

# Serve assets (icons/images) from /frontend/assets
@app.route("/assets/<path:filename>", methods=["GET"])
def serve_assets(filename: str):
    project_root = Path(__file__).resolve().parents[1]
    assets_dir = project_root / "frontend" / "assets"
    return send_from_directory(str(assets_dir), filename)

# Fallback for browsers that request /favicon.ico
@app.route("/favicon.ico", methods=["GET"])
def favicon():
    project_root = Path(__file__).resolve().parents[1]
    assets_dir = project_root / "frontend" / "assets" / "icons"
    return send_from_directory(str(assets_dir), "favicon.ico")

if __name__ == "__main__":
    app.run(debug=True)