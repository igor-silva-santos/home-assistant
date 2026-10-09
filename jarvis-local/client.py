#!/usr/bin/env python3
"""
Cliente J.A.R.V.I.S (máquina local) → Home Assistant (VPS).

- Conexão WebSocket de saída (não precisa abrir porta em casa)
- Comandos via REST API
- Servidor HTTP opcional para push da VPS (Tailscale + input_text.jarvis_callback_url)
"""

import asyncio
import json
import logging
import os
from aiohttp import web, ClientSession, WSMsgType

logging.basicConfig(level=logging.INFO)
log = logging.getLogger("jarvis-local")

HA_URL = os.environ.get("HA_URL", "https://homeassistant.seudominio.com").rstrip("/")
HA_TOKEN = os.environ.get("HA_TOKEN", "")
LISTEN_HOST = os.environ.get("JARVIS_LISTEN_HOST", "127.0.0.1")
LISTEN_PORT = int(os.environ.get("JARVIS_LISTEN_PORT", "8765"))

# Prefixos de entidades que o J.A.R.V.I.S deve observar
WATCH_PREFIXES = (
    "switch.",
    "light.",
    "lock.",
    "binary_sensor.frigate_",
    "binary_sensor.campainha",
    "input_boolean.alerta_campainha",
    "input_text.jarvis_",
)


def ws_url() -> str:
    return HA_URL.replace("https://", "wss://").replace("http://", "ws://") + "/api/websocket"


async def ha_call_service(session: ClientSession, domain: str, service: str, data: dict) -> dict:
    headers = {"Authorization": f"Bearer {HA_TOKEN}", "Content-Type": "application/json"}
    url = f"{HA_URL}/api/services/{domain}/{service}"
    async with session.post(url, json=data, headers=headers, timeout=30) as resp:
        text = await resp.text()
        if resp.status >= 400:
            raise RuntimeError(f"HA API {resp.status}: {text}")
        return json.loads(text) if text else {}


def should_watch(entity_id: str) -> bool:
    return any(entity_id.startswith(p) for p in WATCH_PREFIXES)


async def on_ha_event(event: dict) -> None:
    """Substitua por seu pipeline J.A.R.V.I.S (LLM, fila, voz, etc.)."""
    data = event.get("data", {})
    entity_id = data.get("entity_id", "")
    if not entity_id or not should_watch(entity_id):
        return
    new_state = data.get("new_state") or {}
    old_state = data.get("old_state") or {}
    payload = {
        "type": "state_changed",
        "entity_id": entity_id,
        "old": old_state.get("state"),
        "new": new_state.get("state"),
        "attributes": new_state.get("attributes"),
    }
    log.info("evento HA: %s", json.dumps(payload, ensure_ascii=False))


async def ha_websocket_loop(session: ClientSession) -> None:
    if not HA_TOKEN:
        log.error("Defina HA_TOKEN no ambiente")
        return

    msg_id = 1
    while True:
        try:
            async with session.ws_connect(ws_url(), heartbeat=30) as ws:
                await ws.receive_json()  # auth_required
                await ws.send_json({"type": "auth", "access_token": HA_TOKEN})
                auth = await ws.receive_json()
                if auth.get("type") != "auth_ok":
                    log.error("autenticação falhou: %s", auth)
                    await asyncio.sleep(10)
                    continue

                await ws.send_json({"id": msg_id, "type": "subscribe_events", "event_type": "state_changed"})
                msg_id += 1
                sub = await ws.receive_json()
                log.info("WebSocket HA conectado (VPS): %s", sub.get("success"))

                async for msg in ws:
                    if msg.type != WSMsgType.TEXT:
                        continue
                    packet = json.loads(msg.data)
                    if packet.get("type") == "event":
                        await on_ha_event(packet.get("event", {}))
        except Exception as exc:
            log.exception("WebSocket reconectando em 5s: %s", exc)
            await asyncio.sleep(5)


async def handle_push(request: web.Request) -> web.Response:
    """Recebe POST da VPS (rest_command → jarvis_callback_url)."""
    try:
        body = await request.json()
    except json.JSONDecodeError:
        return web.Response(status=400, text="JSON inválido")
    log.info("push VPS: %s", body)
    await on_ha_event({"data": {"entity_id": body.get("entity_id", ""), "new_state": {"state": body.get("type")}}})
    return web.json_response({"ok": True})


async def start_push_server() -> web.AppRunner:
    app = web.Application()
    app.router.add_post("/ha-events", handle_push)
    app.router.add_get("/health", lambda _: web.json_response({"status": "ok"}))
    runner = web.AppRunner(app)
    await runner.setup()
    site = web.TCPSite(runner, LISTEN_HOST, LISTEN_PORT)
    await site.start()
    log.info("Push listener em http://%s:%s/ha-events", LISTEN_HOST, LISTEN_PORT)
    return runner


async def main() -> None:
    async with ClientSession() as session:
        runner = await start_push_server()
        try:
            await ha_websocket_loop(session)
        finally:
            await runner.cleanup()


if __name__ == "__main__":
    asyncio.run(main())
