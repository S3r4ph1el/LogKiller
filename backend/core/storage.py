from __future__ import annotations

from pathlib import Path
import json
import time
import uuid
from typing import Dict, Any, List, Tuple
import os


def _project_root() -> Path:
    # backend/core/storage.py -> parents[1] == backend, parents[2] == project root
    return Path(__file__).resolve().parents[2]


def _data_dirs() -> Tuple[Path, Path]:
    root = _project_root()
    data_dir = root / "backend" / "data"
    reports_dir = data_dir / "reports"
    reports_dir.mkdir(parents=True, exist_ok=True)
    return data_dir, reports_dir


def _summary_path() -> Path:
    data_dir, _ = _data_dirs()
    return data_dir / "summary.json"


def save_report(report: Dict[str, Any]) -> Dict[str, Any]:
    """
    Persist a report as a JSON file and update summary stats.

    Returns a metadata dict with id and basic info.
    """
    _, reports_dir = _data_dirs()

    # Generate an ID: time-based + short uuid
    ts = time.strftime("%Y%m%dT%H%M%S")
    rid = f"{ts}-{uuid.uuid4().hex[:8]}"
    file_path = reports_dir / f"{rid}.json"

    # Normalize minimal fields used in summaries
    iocs = report.get("iocs") or []
    if not isinstance(iocs, list):
        iocs = []
    tipo = report.get("tipo_ameaca") or report.get("threatType") or "Não identificado"
    sev = report.get("severidade") or report.get("severity") or "Não especificado"
    date = report.get("data_analise") or report.get("data")

    with file_path.open("w", encoding="utf-8") as f:
        json.dump(report, f, ensure_ascii=False, indent=2)

    # Update summary
    _update_summary(iocs_count=len(iocs), has_threat=len(iocs) > 0)

    return {
        "id": rid,
        "path": str(file_path),
        "tipo_ameaca": tipo,
        "severidade": sev,
        "iocs_count": len(iocs),
        "data_analise": date,
    }


def _update_summary(iocs_count: int, has_threat: bool) -> None:
    summary = {
        "totalAnalyzed": 0,
        "threatsDetected": 0,
    }
    spath = _summary_path()
    if spath.exists():
        try:
            with spath.open("r", encoding="utf-8") as f:
                data = json.load(f)
                if isinstance(data, dict):
                    summary.update({
                        k: int(data.get(k, 0)) for k in ("totalAnalyzed", "threatsDetected")
                    })
        except Exception:
            pass

    summary["totalAnalyzed"] += 1
    if has_threat:
        summary["threatsDetected"] += 1

    spath.parent.mkdir(parents=True, exist_ok=True)
    with spath.open("w", encoding="utf-8") as f:
        json.dump(summary, f, ensure_ascii=False, indent=2)


def get_stats() -> Dict[str, int]:
    spath = _summary_path()
    if spath.exists():
        try:
            with spath.open("r", encoding="utf-8") as f:
                data = json.load(f)
                return {
                    "totalAnalyzed": int(data.get("totalAnalyzed", 0)),
                    "threatsDetected": int(data.get("threatsDetected", 0)),
                }
        except Exception:
            pass
    return {"totalAnalyzed": 0, "threatsDetected": 0}


def list_reports(limit: int | None = 10) -> List[Dict[str, Any]]:
    _, reports_dir = _data_dirs()
    items: List[Dict[str, Any]] = []
    for fp in sorted(reports_dir.glob("*.json"), reverse=True):
        try:
            with fp.open("r", encoding="utf-8") as f:
                data = json.load(f)
            iocs = data.get("iocs") or []
            if not isinstance(iocs, list):
                iocs = []
            items.append({
                "id": fp.stem,
                "tipo_ameaca": data.get("tipo_ameaca") or "Não identificado",
                "severidade": data.get("severidade") or "Não especificado",
                "iocs_count": len(iocs),
                "data_analise": data.get("data_analise"),
            })
        except Exception:
            # Skip corrupt entries
            continue

    return items[:limit] if isinstance(limit, int) and limit > 0 else items


def get_report(report_id: str) -> Dict[str, Any] | None:
    _, reports_dir = _data_dirs()
    fp = reports_dir / f"{report_id}.json"
    if not fp.exists():
        return None
    try:
        with fp.open("r", encoding="utf-8") as f:
            return json.load(f)
    except Exception:
        return None


def _recompute_summary() -> Dict[str, int]:
    """Recalcula summary.json com base nos arquivos existentes."""
    data_dir, reports_dir = _data_dirs()
    total = 0
    threats = 0
    for fp in reports_dir.glob("*.json"):
        try:
            with fp.open("r", encoding="utf-8") as f:
                data = json.load(f)
            total += 1
            iocs = data.get("iocs") or []
            if isinstance(iocs, list) and len(iocs) > 0:
                threats += 1
        except Exception:
            # Skip corrupt
            continue

    summary = {"totalAnalyzed": total, "threatsDetected": threats}
    spath = _summary_path()
    spath.parent.mkdir(parents=True, exist_ok=True)
    with spath.open("w", encoding="utf-8") as f:
        json.dump(summary, f, ensure_ascii=False, indent=2)
    return summary


def delete_report(report_id: str) -> bool:
    """Exclui um relatório específico e atualiza o summary."""
    _, reports_dir = _data_dirs()
    fp = reports_dir / f"{report_id}.json"
    if not fp.exists():
        return False
    try:
        fp.unlink()
    except Exception:
        return False
    _recompute_summary()
    return True


def reset_database() -> Dict[str, Any]:
    """Remove todos os relatórios e o summary.json."""
    data_dir, reports_dir = _data_dirs()
    deleted = 0
    for fp in reports_dir.glob("*.json"):
        try:
            fp.unlink()
            deleted += 1
        except Exception:
            continue
    # Remove summary
    spath = _summary_path()
    try:
        if spath.exists():
            spath.unlink()
    except Exception:
        pass
    # Garante diretórios
    reports_dir.mkdir(parents=True, exist_ok=True)
    data_dir.mkdir(parents=True, exist_ok=True)
    return {"deletedReports": deleted, "summaryReset": True}
