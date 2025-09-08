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
            model="gpt-4o-mini",
            reasoning={"effort": "medium"},
            instructions=base_instructions,
            input=input_prompt,
            response_format={"type": "json_schema"},
            max_output_tokens=500,
        )

        content = response.output_text
        return json.loads(content)
    except Exception as e:
        # Fallback robusto caso o parser falhe ou a chamada dê erro
        raw = None
        try:
            # Tenta extrair texto mesmo quando estrutura falha
            raw = response.output_text  # type: ignore[name-defined]
        except Exception:
            raw = str(e)
        return {
            "tipo_ameaca": "",
            "iocs": [],
            "contexto": "",
            "recomendacoes": [],
            "_raw": raw,
        }