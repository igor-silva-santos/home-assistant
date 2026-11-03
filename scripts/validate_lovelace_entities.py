#!/usr/bin/env python3
"""Lista entity_id referenciados no Lovelace e indica se estão documentados no mapa demo."""

from __future__ import annotations

import re
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
LOVELACE = ROOT / "lovelace"
AUTO = ROOT / "automations.yaml"
MAP = ROOT / "docs" / "ENTITY-MAP.md"

ENTITY_RE = re.compile(
    r"(?:entity(?:_id)?:\s+|entities:\s*\n(?:\s+-\s+)?)([a-z_]+\.[a-z0-9_]+)",
    re.MULTILINE,
)


def collect_paths() -> list[Path]:
    files = list(LOVELACE.rglob("*.yaml"))
    files.append(AUTO)
    return files


def main() -> int:
    refs: set[str] = set()
    for path in collect_paths():
        text = path.read_text(encoding="utf-8")
        refs.update(ENTITY_RE.findall(text))
        refs.update(re.findall(r"states\(['\"]([a-z_]+\.[a-z0-9_]+)['\"]\)", text))

    map_text = MAP.read_text(encoding="utf-8") if MAP.exists() else ""
    missing_doc = sorted(e for e in refs if e not in map_text and not e.startswith("automation."))

    print(f"Referências únicas: {len(refs)}")
    if missing_doc:
        print("\nNão listadas em docs/ENTITY-MAP.md (revisar ao migrar do demo):")
        for e in missing_doc:
            print(f"  - {e}")

    optional_prefixes = (
        "sensor.huawei_",
        "binary_sensor.frigate_",
        "camera.",
        "media_player.echo",
        "calendar.",
        "weather.",
        "notify.",
        "frontend.",
    )
    optional = sorted(
        e
        for e in refs
        if any(e.startswith(p) for p in optional_prefixes)
    )
    if optional:
        print("\nEntidades opcionais (integrações externas):")
        for e in optional:
            print(f"  - {e}")

    return 0


if __name__ == "__main__":
    sys.exit(main())
