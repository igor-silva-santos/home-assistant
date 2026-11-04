# Documentação — Dashboard Futurista HA

Índice central. Comece por **[DEPLOY-CHECKLIST.md](./DEPLOY-CHECKLIST.md)** após instalar o stack.

## Primeiros passos

| Guia | Quando usar |
|------|-------------|
| [SETUP.md](./SETUP.md) | Instalação HA, HACS, custom cards |
| [DOCKER-VPS.md](./DOCKER-VPS.md) | Deploy Docker / Coolify / VPS |
| [CONNECT-HA-3D.md](./CONNECT-HA-3D.md) | Ligar dashboard + NextFloor |
| [DEPLOY-CHECKLIST.md](./DEPLOY-CHECKLIST.md) | Smoke test pós-deploy |
| [ENTITY-MAP.md](./ENTITY-MAP.md) | Demo → entidades reais |

## Dashboard e UI

| Guia | Quando usar |
|------|-------------|
| [CUSTOM-CARDS.md](./CUSTOM-CARDS.md) | orbe, reminder, calendar, room-card |
| [AREAS.md](./AREAS.md) | Áreas HA + aba **Por área** (PR #6) |
| [NEXTFLOOR-THEME.md](./NEXTFLOOR-THEME.md) | Tema 3D + tablet (PR #4) |
| [KIOSK-TABLET.md](./KIOSK-TABLET.md) | Tablet de parede / Fully (PR #12) |

## Dispositivos e integrações

| Guia | Quando usar |
|------|-------------|
| [MATTER.md](./MATTER.md) | Novos dispositivos Matter (PR #11) |
| [ALEXA-INTEGRATION.md](./ALEXA-INTEGRATION.md) | Alexa / notify |
| [HOUSE-CONTROL-ANDROID.md](./HOUSE-CONTROL-ANDROID.md) | App Android 3D (PR #8) |

## Energia e métricas

| Guia | Quando usar |
|------|-------------|
| [ENERGY-DASHBOARD.md](./ENERGY-DASHBOARD.md) | Painel Energia nativo HA (PR #10) |
| [INFLUX-GRAFANA.md](./INFLUX-GRAFANA.md) | Histórico longo Influx + Grafana (PR #5) |

## Segurança e câmeras

| Guia | Quando usar |
|------|-------------|
| [FRIGATE-PRODUCTION.md](./FRIGATE-PRODUCTION.md) | Frigate + RTSP real (PR #7) |
| [CORAL-TPU.md](./CORAL-TPU.md) | Google Coral USB no Frigate (PR #13) |

## Pacotes demo (`packages/`)

| Pacote | Função |
|--------|--------|
| `demo_casa.yaml` | Luzes, switches, climate, campainha |
| `demo_cenas.yaml` | Cenas Brilho, Filme, … |
| `demo_energia.yaml` | Sensores consumo |
| `demo_seguranca.yaml` | Câmeras / Frigate simulado (PR #3) |
| `demo_relatorios.yaml` | Rede Huawei simulada (PR #9) |
| `producao.yaml.example` | Template migração produção |

Desativar demo: comentar `homeassistant.packages` em `configuration.yaml`.

## Ordem sugerida de merge (PRs)

```text
#2 connect HA + 3D
  → #3 demo Segurança · #4 nav 3D · #5 Influx · #6 Por área
  → #7 Frigate · #8 Android · #9 Relatórios demo
  → #10 Energy · #11 Matter · #12 Kiosk · #13 Coral
  → #14 índice docs (este arquivo)
```

Links: [Pull requests abertos](https://github.com/igor-silva-santos/home-assistant/pulls) no GitHub.

## Config examples

Pasta [`../config-examples/`](../config-examples/) — trechos para copiar (`influx-ha`, `frigate-ha`, `energy-dashboard`, etc.).
