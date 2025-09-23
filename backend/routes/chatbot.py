from flask import Blueprint, request, jsonify
from dotenv import load_dotenv
from openai import OpenAI
import os

load_dotenv()

chatbot_bp = Blueprint("chatbot_api", __name__)


def _get_client() -> OpenAI | None:
	api_key = os.getenv("OPENAI_API_KEY")
	if not api_key:
		return None
	return OpenAI(api_key=api_key)


@chatbot_bp.route("/chat", methods=["POST"])
def chat_with_bot():
	data = request.get_json(silent=True) or {}
	message = (data.get("message") or "").strip()
	context = data.get("context") or {}
	if not message:
		return jsonify({"error": "Mensagem vazia"}), 400

	context_text = _context_to_text(context)
	client = _get_client()
	if client is None:
		reply = _offline_answer(message, context)
		return jsonify({"reply": reply, "source": "offline"})

	# Ajusta o tom conforme origem (ex.: página index sem relatório)
	origin = (context or {}).get("page") if isinstance(context, dict) else None
	if origin == "index":
		system_prompt = (
			"Você é um assistente do produto LogKiller. Ajude o usuário a usar a aplicação, "
			"explicando formatos aceitos, fluxo de análise e leitura do relatório de forma simples. Responda em PT-BR."
		)
	else:
		system_prompt = (
			"Você é um assistente técnico que explica resultados de uma análise de logs em linguagem simples, "
			"com precisão e concisão. Responda em PT-BR. Se não souber, diga que não está no relatório."
		)

	user_prompt = (
		("Contexto do relatório:\n" + context_text + "\n\n" if context_text != "(sem contexto)" else "") +
		"Pergunta do usuário: " + message + "\n\n"
		"Responda em texto corrido (sem JSON)."
	)

	try:
		response = client.responses.create(
			model="gpt-4.1-mini-2025-04-14",
			input=[
				{"role": "system", "content": system_prompt},
				{"role": "user", "content": user_prompt},
			],
			max_output_tokens=500,
		)
		text = response.output_text
		return jsonify({"reply": text, "source": "openai"})
	except Exception as e:
		reply = _offline_answer(message, context)
		return jsonify({"reply": reply, "source": "offline", "note": str(e)}), 200


def _context_to_text(ctx: dict) -> str:
	try:
		if not isinstance(ctx, dict) or not ctx:
			return "(sem contexto)"
		parts = []
		for key in ("tipo_ameaca", "severidade", "data_analise", "contexto"):
			if ctx.get(key):
				label = {
					"tipo_ameaca": "Tipo de ameaça",
					"severidade": "Severidade",
					"data_analise": "Data",
					"contexto": "Contexto",
				}[key]
				parts.append(f"{label}: {ctx[key]}")
		iocs = ctx.get("iocs") or []
		if isinstance(iocs, list) and iocs:
			shown = ", ".join(map(str, iocs[:10]))
			more = "" if len(iocs) <= 10 else f" (+{len(iocs) - 10} mais)"
			parts.append(f"IoCs: {shown}{more}")
		recs = ctx.get("recomendacoes") or []
		if isinstance(recs, list) and recs:
			shown = "; ".join(map(str, recs[:5]))
			more = "" if len(recs) <= 5 else f" (+{len(recs) - 5} mais)"
			parts.append(f"Recomendações: {shown}{more}")
		return "\n".join(parts) or "(sem contexto)"
	except Exception:
		return "(sem contexto)"


def _offline_answer(message: str, ctx: dict) -> str:
	msg = message.lower()
	if isinstance(ctx, dict) and ctx.get("page") == "index":
		if "formato" in msg or "arquivo" in msg:
			return "Aceitamos .json, .txt, .log, .csv, .xml, .pcap e .pcapng. Arraste o arquivo ou use o botão Procurar."
		if "relat" in msg or "resultado" in msg:
			return "Após a análise, você verá tipo de ameaça, severidade, IoCs principais e recomendações práticas."
		return "Posso ajudar com o uso do LogKiller: como enviar arquivos, quais formatos e o que o relatório apresenta."

	if "ioc" in msg:
		iocs = ctx.get("iocs") if isinstance(ctx, dict) else None
		if iocs:
			sample = ", ".join(map(str, (iocs[:5] if isinstance(iocs, list) else [])))
			return f"Foram identificados IoCs como: {sample}. Use ferramentas como VirusTotal para verificar reputação."
		return "O relatório não lista IoCs específicos."
	if "sever" in msg or "risco" in msg:
		sev = ctx.get("severidade") if isinstance(ctx, dict) else None
		if sev:
			return f"A severidade indicada é {sev}. Priorize conforme o apetite de risco da sua organização."
		return "A severidade não está clara no relatório."
	if "recomenda" in msg or "mitig" in msg:
		recs = ctx.get("recomendacoes") if isinstance(ctx, dict) else None
		if recs:
			return "Recomendações: " + "; ".join(map(str, recs[:5]))
		return "Não há recomendações específicas no relatório."
	if "tipo" in msg or "ameaça" in msg or "ameaca" in msg:
		t = ctx.get("tipo_ameaca") if isinstance(ctx, dict) else None
		if t:
			return f"O tipo de ameaça sugerido é: {t}."
		return "O tipo de ameaça não foi explicitado."
	return "Posso ajudar a explicar os resultados do relatório, como severidade, IoCs e recomendações. Faça uma pergunta específica."

