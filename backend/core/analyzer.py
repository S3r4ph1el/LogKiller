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
        "Analise os seguintes logs e responda apenas em JSON válido com o seguinte formato: \n"
        "{\n"
        "  \"tipo_ameaca\": \"\",\n"
        "  \"iocs\": [],\n"
        "  \"contexto\": \"\",\n"
        "  \"recomendacoes\": []\n"
        "}\n\n"
        "Logs:\n" + processed_logs
    )

    try:
        response = client.responses.create(
            model="o4-mini-2025-04-16",
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
                            "iocs": {"type": "array", "items": {"type": "string"}},
                            "contexto": {"type": "string"},
                            "recomendacoes": {"type": "array", "items": {"type": "string"}}
                        },
                        "required": ["tipo_ameaca", "iocs", "contexto", "recomendacoes"],
                        "additionalProperties": False
                    }
                }
            },
            max_output_tokens=2500,
        )

        content = response.output_text
        return json.loads(content)
    except Exception as e:
        # Fallback robusto caso o parser falhe ou a chamada dê erro
        try:
            # Tenta extrair texto mesmo quando estrutura falha
            raw = response.output_text  # type: ignore[name-defined]
        except Exception:
            raw = str(e)
        return "Houve um erro ao analisar os logs. Resposta bruta: " + raw