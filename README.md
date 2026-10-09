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
- **Canal de Logs** (offline, tempo ligado, energia)
- **J.A.R.V.I.S** (webhooks, Redis, bridge HTTP)

## Setup rápido

1. Clone o repositório no servidor
2. Copie `.env.example` → `.env` e preencha secrets
3. `docker compose up -d`
4. Instale custom cards via HACS (ver `docs/CUSTOM-CARDS.md`)
5. Ative o tema desejado no perfil

Detalhes: [`docs/SETUP.md`](./docs/SETUP.md) · [`docs/DOCKER-VPS.md`](./docs/DOCKER-VPS.md) · [`docs/JARVIS-INTEGRATION.md`](./docs/JARVIS-INTEGRATION.md)

## Roadmap

- [x] Canal de logs (offline / acionamento / energia)
- [x] Layout responsivo (celular, tablet, desktop)
- [x] Alertas por zona Frigate + push
- [x] Ponte J.A.R.V.I.S (webhook + Redis + REST)
- [ ] Aceleração Coral TPU no Frigate
- [ ] Energy Dashboard nativo
- [ ] Mais dispositivos Matter
- [ ] Modo kiosk para tablet de parede

---

Desenvolvido por [Igor Santos](https://github.com/igor-silva-santos)
