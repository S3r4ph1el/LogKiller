from openai import OpenAI
from dotenv import load_dotenv
import os, json

load_dotenv()

client = OpenAI(api_key=os.getenv("OPENAI_API_KEY"))

def analyze_logs(processed_logs: str, prompt: str | None = None) -> dict:

    # Instruções de sistema (especialista) + tarefa específica no input
    base_instructions = (
        "Você é um especialista em cibersegurança com domínio de SIEM, logs, ferramentas e TTPs. "
        "Analise evidências com precisão, cite IOCs e recomende ações práticas."
    )

    user_directive = prompt.strip() + "\n\n" if isinstance(prompt, str) and prompt.strip() else ""

    input_prompt = (
        user_directive +
        "Analise os seguintes logs e responda apenas em JSON válido com o seguinte formato (português):\n"
        "{\n"
        "  \"tipo_ameaca\": \"\",\n"
        "  \"severidade\": \"Alta|Média|Baixa\",\n"
        "  \"data_analise\": \"YYYY-MM-DD\",\n"
        "  \"iocs\": [],\n"
        "  \"contexto\": \"\",\n"
        "  \"recomendacoes\": []\n"
        "}\n\n"
        "Logs:\n" + processed_logs
    )

    try:
        response = client.responses.create(
            model="gpt-4.1-mini-2025-04-14",
            input=[
                {"role": "system", "content": base_instructions},
                {"role": "user", "content": input_prompt}
            ],
            text={
                "format": {
                    "type": "json_schema",
                    "name": "log_analysis",
                    "strict": True,
                    "schema": {
                        "type": "object",
                        "properties": {
                            "tipo_ameaca": {"type": "string"},
                            "severidade": {"type": "string", "enum": ["Alta", "Média", "Baixa", "Crítica", "Critica", "High", "Medium", "Low"]},
                            "data_analise": {"type": "string"},
                            "iocs": {"type": "array", "items": {"type": "string"}},
                            "contexto": {"type": "string"},
                            "recomendacoes": {"type": "array", "items": {"type": "string"}}
                        },
                        "required": ["tipo_ameaca", "severidade", "data_analise", "iocs", "contexto", "recomendacoes"],
                        "additionalProperties": False
                    }
                }
            },
            max_output_tokens=2500,
        )

        content = response.output_text
        result = json.loads(content)

        # Fallbacks de robustez
        if not result.get("severidade"):
            # Heurística simples baseada em quantidade de IoCs
            iocs = result.get("iocs") or []
            count = len(iocs) if isinstance(iocs, list) else 0
            if count >= 10:
                result["severidade"] = "Alta"
            elif count >= 1:
                result["severidade"] = "Média"
            else:
                result["severidade"] = "Baixa"

        if not result.get("data_analise"):
            from datetime import date
            result["data_analise"] = date.today().isoformat()

        return result
    except Exception as e:
        # Fallback robusto caso o parser falhe ou a chamada dê erro
        try:
            # Tenta extrair texto mesmo quando estrutura falha
            raw = response.output_text  # type: ignore[name-defined]
        except Exception:
            raw = str(e)
        return "Houve um erro ao analisar os logs. Resposta bruta: " + raw