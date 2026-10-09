# Integração J.A.R.V.I.S ↔ Home Assistant

Esta stack expõe a casa para sua IA de forma **segura e auditável**: webhooks, scripts, Redis e REST.

## Arquitetura

```
Home Assistant ──rest_command──► jarvis-bridge:8090/events ──► Redis (jarvis:events)
       ▲                              │
       │                              └── WebSocket (state_changed espelhado)
       └── POST /api/services/... ◄── sua IA (token long-lived)
```

## 1. Token de acesso (obrigatório)

1. No HA: **Perfil** → **Tokens de acesso de longa duração**
2. Copie o token para `.env`:

```env
HA_LONG_LIVED_TOKEN=eyJ...
```

3. `docker compose up -d --build jarvis-bridge`

## 2. Webhooks (comandos da IA → HA)

Após reiniciar o HA, os IDs ficam em **Configurações → Automações → Webhooks** ou via URL:

| Webhook | URL | Corpo JSON (exemplo) |
|---------|-----|----------------------|
| Comando | `POST https://SEU_HA/api/webhook/jarvis_comando` | `{"action":"turn_on","entity_id":"light.sala_principal"}` |
| Interfone | `POST .../api/webhook/jarvis_interfone` | `{"abrir_porteira": false}` |

Também é possível chamar scripts:

```json
{"script": "jarvis_criar_rotina_rapida", "data": {"modo": "Noturno"}}
```

## 3. Scripts prontos para a IA

| Script | Uso |
|--------|-----|
| `script.jarvis_executar_servico` | `domain`, `service`, `entity_id`, `data` |
| `script.jarvis_criar_rotina_rapida` | `modo`: Normal, Noturno, Ausente, Cinema… |
| `script.jarvis_atender_interfone` | Snapshot + push; `abrir_porteira` opcional |
| `script.jarvis_publicar_evento` | Envia evento ao bridge Redis |

## 4. Consumir eventos na sua IA (Redis)

Canal padrão: `jarvis:events`

Tipos comuns:

- `device_offline` / `device_online`
- `device_state_change`
- `motion_zone` / `intrusion_alert`
- `doorbell`
- `state_changed` (via WebSocket mirror)

Exemplo Python:

```python
import redis, json
r = redis.Redis(host="localhost", port=6379, password="SENHA", decode_responses=True)
p = r.pubsub()
p.subscribe("jarvis:events")
for msg in p.listen():
    if msg["type"] == "message":
        print(json.loads(msg["data"]))
```

## 5. Bridge HTTP direto

`POST http://localhost:8090/command`

```json
{
  "action": "turn_on",
  "entity_id": "switch.tv_sala"
}
```

Requer `HA_LONG_LIVED_TOKEN` no container.

## 6. Câmeras e zonas (Frigate)

1. Copie [`docs/FRIGATE-ZONES-EXAMPLE.yml`](./FRIGATE-ZONES-EXAMPLE.yml) → `frigate/config.yml`
2. Desenhe zonas no Frigate UI
3. Entidades `binary_sensor.frigate_<camera>_<zona>` alimentam automações de alerta

Ative **J.A.R.V.I.S — Vigilância por câmera** em Config.

## 7. Canal de Logs no dashboard

Aba **Logs**: card `device-channel-card` com offline, tempo no estado e potência.

## 8. Responsividade

- CSS global: `www/responsive-dashboard.css` (carregado automaticamente)
- Tablet/celular: stacks viram coluna &lt; 600px
- Modo parede: `https://SEU_HA/?kiosk=1`

## Segurança

- Não exponha webhooks publicamente sem reverse proxy + TLS
- Use token só no backend da IA, nunca no app mobile
- Restrinja `local_only: true` nos webhooks se a IA rodar na mesma rede
