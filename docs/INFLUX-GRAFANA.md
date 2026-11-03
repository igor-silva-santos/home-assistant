# InfluxDB + Grafana — energia e métricas reais

Ative quando o `docker compose` já estiver estável e você quiser histórico além do **demo** (`demo_energia`).

## 1. Variáveis de ambiente

No `.env` (a partir de `.env.example`):

```bash
INFLUX_PASSWORD=...
INFLUX_TOKEN=...          # openssl rand -base64 32
GRAFANA_PASSWORD=...
```

## 2. Subir serviços

```bash
docker compose up -d influxdb grafana
docker compose ps
```

- InfluxDB: `http://localhost:8086`
- Grafana: `http://localhost:3001` (admin / senha do `.env`)

## 3. Home Assistant → InfluxDB

Copie o trecho de [`config-examples/influx-ha.yaml`](../config-examples/influx-ha.yaml) para `secrets.yaml`:

```yaml
influx_token: "SEU_TOKEN"
```

No `configuration.yaml`, descomente o bloco `influxdb:` (ou inclua o exemplo) e ajuste o **host**:

| Onde roda o HA | `host` no influxdb: |
|----------------|---------------------|
| Container no mesmo compose | `influxdb` |
| HA OS / host | `localhost` ou IP do servidor |

Reinicie o HA. Confirme em **Configurações → Sistema → Reparos** que não há erro de Influx.

Entidades já filtradas no exemplo: `sensor.consumo_*`, `sensor.temperatura_*`, etc.

## 4. Grafana — datasource

1. Grafana → **Connections → Data sources → Add InfluxDB**
2. Query language: **Flux**
3. URL: `http://influxdb:8086` (de dentro do Docker) ou `http://localhost:8086` (browser no host)
4. Organization: `homeassistant`
5. Token: o mesmo `INFLUX_TOKEN`

Provisioning opcional (se existir pasta `grafana/provisioning/` no repo): reinicie Grafana após editar token no YAML.

## 5. Dashboards

- Importe dashboard community **Home Assistant** / **InfluxDB 2.x** (ID variável no grafana.com)
- Ou use o painel nativo **Energia** do HA para consumo diário

## 6. Desligar demo de energia

Quando sensores reais alimentarem Influx:

1. Remova ou comente `packages/demo_energia.yaml`
2. Aponte `lovelace/views/energia.yaml` para sensores reais (`ENTITY-MAP.md`)

## Troubleshooting

| Problema | Solução |
|----------|---------|
| HA não envia métricas | Token/org/bucket errados; ver logs `homeassistant` |
| Grafana sem dados | Bucket `ha_metrics`, range de tempo, entidade com `state_class` |
| Senha Influx perdida | Reset via volume `influxdb_data` (apaga histórico) |

Ver também: [`DOCKER-VPS.md`](./DOCKER-VPS.md)
