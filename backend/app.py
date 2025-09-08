from flask import Flask, jsonify
from routes.logs import logs_bp

app = Flask(__name__, static_folder="../frontend/static")

app.register_blueprint(logs_bp, url_prefix="/")

@app.route("/", methods=["GET"])
def home():
    return jsonify({"message": "LogKiller API is running. Use /analyze to analyze logs."})

if __name__ == "__main__":
    app.run(debug=True)