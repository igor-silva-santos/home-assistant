# Energy Dashboard nativo (Home Assistant)

Substitui gradualmente sensores **demo** (`demo_energia`) por medição real no painel **Energia** do HA.

## Pré-requisitos

- Medidor ou plugs com **energia** (`device_class: energy`, `state_class: total_increasing`)
- Home Assistant 2023.9+

## 1. Configurar no HA

**Configurações → Painel de energia** (Energy):

1. **Consumo da rede** — entidade kWh total (concessionária, shelly 3EM, etc.)
2. **Produção solar** — se houver
3. **Dispositivos individuais** — plugs Tuya/Shelly/ESPHome com energia

## 2. YAML opcional (legado)

Copie trechos de [`config-examples/energy-dashboard.yaml`](../config-examples/energy-dashboard.yaml) se usar `utility_meter` ou sensores template derivados.

## 3. Ligar ao Lovelace deste projeto

| View | Ação |
|------|------|
| **Energia** | Troque `sensor.consumo_*` demo por entidades reais ou Energy Dashboard em iframe |
| **Relatórios** | Alimente gráficos ApexCharts com sensores reais |
| **Home** | `sensor.consumo_diario_kwh` → template somando `sensor.*_energy` |

Exemplo template diário:

```yaml
template:
  - sensor:
      - name: "consumo_diario_kwh"
        unit_of_measurement: kWh
        device_class: energy
        state: "{{ states('sensor.rede_energy') | float(0) }}"
```

(Ajuste `sensor.rede_energy` ao seu medidor.)

## 4. Desligar demo

Remova `packages/demo_energia.yaml` quando sensores reais existirem.

## 5. Influx / Grafana

Histórico longo: [`INFLUX-GRAFANA.md`](./INFLUX-GRAFANA.md) (PR #5).

## Integrações comuns no Brasil

| Hardware | Integração HA |
|----------|----------------|
| Shelly EM / 3EM | Shelly nativo |
| Tuya plug com energia | Tuya / LocalTuya |
| ESPHome | `platform: energy` |
| Huawei SUN2000 | Integração community |

Mapa de IDs: [`ENTITY-MAP.md`](./ENTITY-MAP.md).
