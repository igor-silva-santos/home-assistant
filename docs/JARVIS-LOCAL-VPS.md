# J.A.R.V.I.S local + Home Assistant na VPS

Cenário recomendado para você: **HA/Frigate na VPS** e **J.A.R.V.I.S no PC de casa**.

## Por que essa divisão faz sentido

| Onde | O quê |
|------|--------|
| **VPS** | Home Assistant, Frigate, câmeras RTSP, automações 24/7 |
| **PC local** | J.A.R.V.I.S (LLM, voz, visão pesada, GPU) |

A casa continua funcionando se o PC desligar. O J.A.R.V.I.S **reconecta** quando você ligar o computador.

## Fluxo de rede (recomendado)

```
┌─────────────────┐         HTTPS / WSS (saída)          ┌──────────────────┐
│  PC — J.A.R.V.I.S │ ─────────────────────────────────► │  VPS — HA :443   │
│  (sua máquina)    │ ◄── eventos WebSocket + REST API ── │  Traefik + TLS   │
└─────────────────┘                                      └──────────────────┘
```

**Regra de ouro:** o J.A.R.V.I.S **inicia a conexão** com a VPS (pull). Você **não precisa** abrir porta na sua rede doméstica.

### Comandos (local → VPS)

Use a API oficial com token de longa duração:

- `POST https://homeassistant.seudominio.com/api/services/light/turn_on`
- Header: `Authorization: Bearer SEU_TOKEN`

Ou webhooks (sem token no URL, mas URL secreta):

- `POST https://homeassistant.seudominio.com/api/webhook/jarvis_comando`

### Eventos (VPS → local)

**Opção A — WebSocket (preferida)**  
O cliente em `jarvis-local/` conecta em `wss://homeassistant.seudominio.com/api/websocket`, autentica com o token e assina `state_changed` / eventos customizados. Funciona de qualquer lugar com internet.

**Opção B — Push HTTP (opcional)**  
Se quiser que a VPS **empurre** eventos (ex.: campainha instantânea), use **Tailscale** (ou Cloudflare Tunnel) no PC e configure no HA:

- **Config → J.A.R.V.I.S → URL de callback** (`input_text.jarvis_callback_url`)
- Exemplo: `http://100.x.y.z:8765/ha-events` (IP Tailscale do seu PC)

**Não exponha Redis (6379) nem a porta 8090 do bridge na internet pública.**

## O que rodar na VPS

```bash
docker compose up -d homeassistant db frigate redis
# jarvis-bridge é OPCIONAL — só se quiser Redis interno na VPS para debug/Grafana
```

No `.env` da VPS:

```env
HA_DOMAIN=homeassistant.seudominio.com
HA_LONG_LIVED_TOKEN=   # só se usar jarvis-bridge na VPS; o token principal fica no PC
```

`jarvis-bridge` com `ports: 127.0.0.1:8090:8090` — acesso apenas no servidor.

## O que rodar no PC local

1. Clone o repositório (ou só a pasta `jarvis-local/`).
2. Crie `.env.local`:

```env
HA_URL=https://homeassistant.seudominio.com
HA_TOKEN=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
# Opcional: servidor que recebe push da VPS (com Tailscale)
JARVIS_LISTEN_HOST=0.0.0.0
JARVIS_LISTEN_PORT=8765
```

3. Instale e execute o cliente base:

```bash
cd jarvis-local
python3 -m venv .venv && source .venv/bin/activate
pip install -r requirements.txt
python client.py
```

4. Integre `client.py` no seu projeto J.A.R.V.I.S (substitua o `print` pelo seu handler de LLM/ferramentas).

## Token de acesso

Gere **no HA da VPS** (Perfil → Token de longa duração) e guarde **apenas no PC** (variável de ambiente, cofre, `.env` local — nunca no Git).

Permissões: use um usuário dedicado `jarvis` com o mínimo necessário, se possível.

## Frigate e câmeras

As câmeras apontam RTSP para a **VPS** (ou VPN até a casa). O J.A.R.V.I.S analisa imagens via:

- `GET /api/camera_proxy/camera.camera_01` (com token), ou
- snapshot salvo pelas automações (`script.jarvis_atender_interfone`), ou
- API do Frigate na VPS (rede interna Docker / túnel admin).

## Checklist rápido

- [ ] HA com HTTPS (Traefik/Let's Encrypt) na VPS
- [ ] Token long-lived só no PC do J.A.R.V.I.S
- [ ] Cliente WebSocket `jarvis-local/client.py` conectando
- [ ] Webhooks `local_only: false` (já no repo) para comandos remotos
- [ ] Redis **não** publicado na WAN
- [ ] (Opcional) Tailscale + URL de callback no HA para push

## Próximo passo no seu J.A.R.V.I.S

Mapear **ferramentas** (tools) da IA para:

- `call_service(domain, service, entity_id, data)`
- `run_script("jarvis_atender_interfone", abrir_porteira=False)`
- `run_script("jarvis_criar_rotina_rapida", modo="Noturno")`

O cliente base já mostra como escutar eventos e chamar serviços.
