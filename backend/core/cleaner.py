def process_logs(raw_logs: str) -> str:
    lines = [line.strip() for line in raw_logs.splitlines() if line.strip()]
    return "\n".join(lines)