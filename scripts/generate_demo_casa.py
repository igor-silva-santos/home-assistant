#!/usr/bin/env python3
"""Gera packages/demo_casa.yaml — entidades simuladas alinhadas ao Lovelace."""

from __future__ import annotations

from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
OUT = ROOT / "packages" / "demo_casa.yaml"

LIGHTS = [
    "sala_principal",
    "sala_abajur",
    "quarto_principal",
    "quarto_bedside",
    "cozinha",
    "banheiro",
    "escritorio",
    "escritorio_mesa",
    "area_externa",
    "portao_luz",
]

SWITCHES = {
    "tv_sala": "TV Sala",
    "som_sala": "Som Sala",
    "ar_condicionado_quarto": "Ar Condicionado Quarto",
    "geladeira": "Geladeira",
    "microondas": "Microondas",
    "lava_loucas": "Lava Loucas",
    "aquecedor_banheiro": "Aquecedor Banheiro",
    "computador": "Computador",
    "monitor_extra": "Monitor Extra",
    "irrigacao": "Irrigacao",
}

LIGHT_TITLES = {
    "sala_principal": "Sala Principal",
    "sala_abajur": "Sala Abajur",
    "quarto_principal": "Quarto Principal",
    "quarto_bedside": "Quarto Bedside",
    "cozinha": "Cozinha",
    "banheiro": "Banheiro",
    "escritorio": "Escritorio",
    "escritorio_mesa": "Escritorio Mesa",
    "area_externa": "Area Externa",
    "portao_luz": "Portao Luz",
}

TEMP_SENSORS = {
    "temperatura_sala": 24.5,
    "temperatura_quarto": 22.0,
    "temperatura_cozinha": 25.0,
    "temperatura_banheiro": 23.0,
    "temperatura_escritorio": 23.5,
    "temperatura_externa": 28.0,
}


def main() -> None:
    lines: list[str] = [
        "# ══════════════════════════════════════════════════════════════",
        "#  Pacote demo_casa — entidades simuladas (gerado automaticamente)",
        "#  Regenerar: python3 scripts/generate_demo_casa.py",
        "# ══════════════════════════════════════════════════════════════",
        "",
        "input_boolean:",
    ]

    for slug in LIGHTS:
        lines.append(f"  demo_luz_{slug}:")
        lines.append(f'    name: "Demo luz {LIGHT_TITLES[slug]}"')
    for slug in SWITCHES:
        lines.append(f"  demo_sw_{slug}:")
        lines.append(f'    name: "Demo switch {SWITCHES[slug]}"')
    for extra in (
        "demo_porteira_trancada",
        "demo_campainha",
        "demo_movimento_sala",
        "demo_movimento_quarto",
        "demo_movimento_banheiro",
        "demo_movimento_externo",
        "demo_fumaca_cozinha",
    ):
        lines.append(f"  {extra}:")
        lines.append(f'    name: "Demo {extra.replace("demo_", "").replace("_", " ")}"')

    lines.extend(["", "input_number:"])
    for slug in LIGHTS:
        lines.extend(
            [
                f"  demo_brilho_{slug}:",
                f'    name: "Demo brilho {LIGHT_TITLES[slug]}"',
                "    min: 0",
                "    max: 100",
                "    step: 1",
                "    initial: 70",
                '    unit_of_measurement: "%"',
            ]
        )

    lines.extend(["", "template:", "  - light:"])
    for slug in LIGHTS:
        title = LIGHT_TITLES[slug]
        ib = f"demo_luz_{slug}"
        inn = f"demo_brilho_{slug}"
        lines.extend(
            [
                f'      - name: "{title}"',
                f"        unique_id: demo_light_{slug}",
                f"        state: \"{{{{ is_state('input_boolean.{ib}', 'on') }}}}\"",
                f"        brightness: \"{{{{ (states('input_number.{inn}') | float(70) * 2.55) | int }}}}\"",
                "        turn_on:",
                "          - service: input_boolean.turn_on",
                "            target:",
                f"              entity_id: input_boolean.{ib}",
                "        turn_off:",
                "          - service: input_boolean.turn_off",
                "            target:",
                f"              entity_id: input_boolean.{ib}",
                "        set_level:",
                "          - service: input_number.set_value",
                "            target:",
                f"              entity_id: input_number.{inn}",
                "            data:",
                '              value: "{{ (brightness / 255 * 100) | round(0) }}"',
            ]
        )

    lines.extend(["", "  - switch:"])
    for slug, title in SWITCHES.items():
        ib = f"demo_sw_{slug}"
        lines.extend(
            [
                f'      - name: "{title}"',
                f"        unique_id: demo_switch_{slug}",
                f"        state: \"{{{{ is_state('input_boolean.{ib}', 'on') }}}}\"",
                "        turn_on:",
                "          - service: input_boolean.turn_on",
                "            target:",
                f"              entity_id: input_boolean.{ib}",
                "        turn_off:",
                "          - service: input_boolean.turn_off",
                "            target:",
                f"              entity_id: input_boolean.{ib}",
            ]
        )

    lines.extend(
        [
            "",
            "  - lock:",
            '      - name: "Porteira"',
            "        unique_id: demo_lock_porteira",
            "        state: \"{{ 'locked' if is_state('input_boolean.demo_porteira_trancada', 'on') else 'unlocked' }}\"",
            "        lock:",
            "          - service: input_boolean.turn_on",
            "            target:",
            "              entity_id: input_boolean.demo_porteira_trancada",
            "        unlock:",
            "          - service: input_boolean.turn_off",
            "            target:",
            "              entity_id: input_boolean.demo_porteira_trancada",
            "",
            "  - binary_sensor:",
            '      - name: "Campainha"',
            "        unique_id: demo_binary_campainha",
            "        device_class: occupancy",
            "        state: \"{{ is_state('input_boolean.demo_campainha', 'on') }}\"",
            '      - name: "Movimento Sala"',
            "        unique_id: demo_movimento_sala",
            "        device_class: motion",
            "        state: \"{{ is_state('input_boolean.demo_movimento_sala', 'on') }}\"",
            '      - name: "Movimento Quarto"',
            "        unique_id: demo_movimento_quarto",
            "        device_class: motion",
            "        state: \"{{ is_state('input_boolean.demo_movimento_quarto', 'on') }}\"",
            '      - name: "Movimento Banheiro"',
            "        unique_id: demo_movimento_banheiro",
            "        device_class: motion",
            "        state: \"{{ is_state('input_boolean.demo_movimento_banheiro', 'on') }}\"",
            '      - name: "Movimento Externo"',
            "        unique_id: demo_movimento_externo",
            "        device_class: motion",
            "        state: \"{{ is_state('input_boolean.demo_movimento_externo', 'on') }}\"",
            '      - name: "Fumaca Cozinha"',
            "        unique_id: demo_fumaca_cozinha",
            "        device_class: smoke",
            "        state: \"{{ is_state('input_boolean.demo_fumaca_cozinha', 'on') }}\"",
            "",
            "  - sensor:",
        ]
    )

    for slug, value in TEMP_SENSORS.items():
        title = slug.replace("_", " ").title()
        lines.extend(
            [
                f'      - name: "{title}"',
                f"        unique_id: demo_{slug}",
                '        unit_of_measurement: "°C"',
                "        device_class: temperature",
                f'        state: "{value}"',
            ]
        )

    lines.extend(
        [
            '      - name: "Umidade Quarto"',
            "        unique_id: demo_umidade_quarto",
            '        unit_of_measurement: "%"',
            '        state: "58"',
            '      - name: "Umidade Banheiro"',
            "        unique_id: demo_umidade_banheiro",
            '        unit_of_measurement: "%"',
            '        state: "72"',
            '      - name: "Co2 Escritorio"',
            "        unique_id: demo_co2_escritorio",
            '        unit_of_measurement: "ppm"',
            "        device_class: carbon_dioxide",
            '        state: "620"',
            '      - name: "Chuva"',
            "        unique_id: demo_chuva",
            '        unit_of_measurement: "mm"',
            '        state: "0"',
            "",
            "automation:",
            "  - id: demo_campainha_auto_off",
            '    alias: "Demo — Campainha auto reset"',
            "    trigger:",
            "      - platform: state",
            "        entity_id: input_boolean.demo_campainha",
            '        to: "on"',
            "        for:",
            "          seconds: 8",
            "    action:",
            "      - service: input_boolean.turn_off",
            "        target:",
            "          entity_id: input_boolean.demo_campainha",
            "    mode: single",
            "",
        ]
    )

    OUT.parent.mkdir(parents=True, exist_ok=True)
    OUT.write_text("\n".join(lines), encoding="utf-8")
    print(f"Wrote {OUT}")


if __name__ == "__main__":
    main()
