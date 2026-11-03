# Home Assistant — automação residencial

Setup de Home Assistant com Docker, dashboards Lovelace, Frigate e monitoramento.

**Código:** https://github.com/igor-silva-santos/home-assistant

> **Privacidade:** este repositório é um *template/showcase*. Não versiona `.env`, tokens, senhas nem IPs reais da rede doméstica. Use `.env.example` e `!secret` no HA. Screenshots abaixo (se presentes em `docs/`) devem estar sem dados pessoais.

## Stack

| Peça | Tecnologia |
|------|------------|
| Núcleo | Home Assistant (YAML + Lovelace) |
| Runtime | Docker Compose |
| Visão | Frigate |
| Métricas | InfluxDB + Grafana |
| Cache | Redis |

## Visão do dashboard

- Home com atalhos e clima
- Cômodos com controle por ambiente
- Energia e consumo
- Automações
- Segurança / câmeras (Frigate)

## Setup rápido

1. Clone o repositório no servidor
2. Copie `.env.example` → `.env` e preencha secrets
3. `docker compose up -d`
4. Instale custom cards via HACS (ver `docs/CUSTOM-CARDS.md`)
5. Ative o tema desejado no perfil

Detalhes: [`docs/SETUP.md`](./docs/SETUP.md) · [`docs/CONNECT-HA-3D.md`](./docs/CONNECT-HA-3D.md) · [`docs/DOCKER-VPS.md`](./docs/DOCKER-VPS.md)

## Roadmap

- [x] Pacote demo + mapa de entidades (`packages/`, `docs/ENTITY-MAP.md`)
- [x] Views Planta 3D (NextFloor) e Kiosk
- [ ] Aceleração Coral TPU no Frigate
- [ ] Energy Dashboard nativo
- [ ] Mais dispositivos Matter
- [ ] Modo kiosk para tablet de parede

---

Desenvolvido por [Igor Santos](https://github.com/igor-silva-santos)
