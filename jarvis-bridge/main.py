#!/usr/bin/env python3
"""
Ponte J.A.R.V.I.S ↔ Home Assistant
- POST /events — recebe eventos do HA (rest_command) e publica no Redis
- GET /health — healthcheck
- POST /command — encaminha comando ao HA (token long-lived)
- WebSocket opcional: espelha eventos do HA para Redis channel jarvis:ha_events
"""

import asyncio
import json
import logging
import os
from datetime import datetime, timezone

import aiohttp
import redis.asyncio as redis
from aiohttp import web

logging.basicConfig(level=logging.INFO)
log = logging.getLogger("jarvis-bridge")

HA_URL = os.environ.get("HA_URL", "http://homeassistant:8123").rstrip("/")
HA_TOKEN = os.environ.get("HA_TOKEN", "")
REDIS_URL = os.environ.get("REDIS_URL", "redis://:redis_password@redis:6379/0")
CHANNEL = os.environ.get("JARVIS_REDIS_CHANNEL", "jarvis:events")


async def publish_redis(r: redis.Redis, payload: dict) -> None:
    payload.setdefault("ts", datetime.now(timezone.utc).isoformat())
    await r.publish(CHANNEL, json.dumps(payload, ensure_ascii=False))


async def ha_call_service(session: aiohttp.ClientSession, domain: str, service: str, data: dict) -> dict:
    if not HA_TOKEN:
        raise web.HTTPServiceUnavailable(text="HA_TOKEN não configurado")
    url = f"{HA_URL}/api/services/{domain}/{service}"
    headers = {"Authorization": f"Bearer {HA_TOKEN}", "Content-Type": "application/json"}
    async with session.post(url, json=data, headers=headers, timeout=30) as resp:
        body = await resp.text()
        if resp.status >= 400:
            raise web.HTTPBadRequest(text=body)
        try:
            return json.loads(body) if body else {}
        except json.JSONDecodeError:
            return {"raw": body}


async def handle_health(_request: web.Request) -> web.Response:
    return web.json_response({"status": "ok", "ha_url": HA_URL, "channel": CHANNEL})


async def handle_events(request: web.Request) -> web.Response:
    r: redis.Redis = request.app["redis"]
    try:
        payload = await request.json()
    except json.JSONDecodeError:
        raise web.HTTPBadRequest(text="JSON inválido")
    await publish_redis(r, {"source": "home_assistant", **payload})
    log.info("evento: %s", payload.get("type", payload.get("message", "?")))
    return web.json_response({"ok": True})


async def handle_command(request: web.Request) -> web.Response:
    session: aiohttp.ClientSession = request.app["session"]
    r: redis.Redis = request.app["redis"]
    body = await request.json()
    action = body.get("action")
    entity_id = body.get("entity_id")
    domain = body.get("domain")
    service = body.get("service")
    data = body.get("data") or {}

    if action and entity_id and not (domain and service):
        # atalho: action turn_on / turn_off / toggle
        domain = entity_id.split(".")[0]
        service = action
    if not domain or not service:
        raise web.HTTPBadRequest(text="Informe domain+service ou action+entity_id")

    if entity_id:
        data.setdefault("entity_id", entity_id)

    result = await ha_call_service(session, domain, service, data)
    await publish_redis(
        r,
        {
            "source": "jarvis_bridge",
            "type": "command_result",
            "domain": domain,
            "service": service,
            "entity_id": entity_id,
        },
    )
    return web.json_response({"ok": True, "result": result})


async def ha_ws_mirror(app: web.Application) -> None:
    """Espelha eventos state_changed relevantes para Redis (se token presente)."""
    if not HA_TOKEN:
        log.warning("HA_TOKEN ausente — WebSocket mirror desativado")
        return

    r = app["redis"]
    session = app["session"]
    url = HA_URL.replace("http", "ws") + "/api/websocket"

    while True:
        try:
            async with session.ws_connect(url, heartbeat=30) as ws:
                await ws.send_json({"type": "auth", "access_token": HA_TOKEN})
                auth = await ws.receive_json()
                if auth.get("type") != "auth_ok":
                    log.error("auth falhou: %s", auth)
                    await asyncio.sleep(10)
                    continue
                await ws.send_json({"id": 1, "type": "subscribe_events", "event_type": "state_changed"})
                log.info("WebSocket HA conectado")
                async for msg in ws:
                    if msg.type != aiohttp.WSMsgType.TEXT:
                        continue
                    data = json.loads(msg.data)
                    if data.get("type") != "event":
                        continue
                    ev = data.get("event", {})
                    ent = ev.get("data", {}).get("entity_id", "")
                    if not ent:
                        continue
                    prefixes = ("switch.", "light.", "lock.", "binary_sensor.frigate_", "binary_sensor.campainha")
                    if not any(ent.startswith(p) for p in prefixes):
                        continue
                    await publish_redis(
                        r,
                        {
                            "source": "ha_websocket",
                            "type": "state_changed",
                            "entity_id": ent,
                            "new_state": ev.get("data", {}).get("new_state", {}).get("state"),
                        },
                    )
        except Exception as exc:
            log.exception("ws reconnect: %s", exc)
            await asyncio.sleep(5)


async def on_startup(app: web.Application) -> None:
    app["redis"] = redis.from_url(REDIS_URL, decode_responses=True)
    app["session"] = aiohttp.ClientSession()
    app["ws_task"] = asyncio.create_task(ha_ws_mirror(app))


async def on_cleanup(app: web.Application) -> None:
    app["ws_task"].cancel()
    await app["session"].close()
    await app["redis"].aclose()


def main() -> None:
    app = web.Application()
    app.router.add_get("/health", handle_health)
    app.router.add_post("/events", handle_events)
    app.router.add_post("/command", handle_command)
    app.on_startup.append(on_startup)
    app.on_cleanup.append(on_cleanup)
    port = int(os.environ.get("PORT", "8090"))
    web.run_app(app, host="0.0.0.0", port=port)


if __name__ == "__main__":
    main()
