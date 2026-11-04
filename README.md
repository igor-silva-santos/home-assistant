# Home Assistant — automação residencial

Setup de Home Assistant com Docker, dashboards Lovelace, Frigate e monitoramento.

**Código:** https://github.com/igor-silva-santos/home-assistant

> **Privacidade:** template/showcase — sem secrets no git. Use `.env.example` e `secrets.yaml` no servidor.

## Stack

| Peça | Tecnologia |
|------|------------|
| Núcleo | Home Assistant (YAML + Lovelace) |
| Runtime | Docker Compose |
| Visão | Frigate |
| Métricas | InfluxDB + Grafana |
| Cache | Redis |

## Dashboard

| Aba | Função |
|-----|--------|
| Home | Cenas, cômodos, clima |
| Planta 3D / Kiosk | NextFloor |
| Cômodos / Por área | room-card ou auto-entities |
| Energia · Relatórios · Segurança | Monitoramento |

## Setup rápido

1. Clone → `.env` a partir de `.env.example`
2. `docker compose up -d` (ou `bash scripts/setup.sh`)
3. HACS + integração NextFloor — ver checklist
4. Tema **futuristic_dark** no perfil

**Documentação completa:** [`docs/README.md`](./docs/README.md)

Atalhos: [Setup](./docs/SETUP.md) · [Conectar HA + 3D](./docs/CONNECT-HA-3D.md) · [Checklist deploy](./docs/DEPLOY-CHECKLIST.md) · [Mapa entidades](./docs/ENTITY-MAP.md)

## Roadmap (repo)

- [x] Demo HA + Lovelace + cenas + climate no room-card
- [x] Planta 3D / NextFloor (views + docs)
- [x] Pacotes demo + migração produção (`ENTITY-MAP`, `producao.yaml.example`)
- [x] Guias em PRs: Segurança, Relatórios, Influx, Matter, Kiosk, Coral, … — ver [`docs/README.md`](./docs/README.md)

---

Desenvolvido por [Igor Santos](https://github.com/igor-silva-santos)
