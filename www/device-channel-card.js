/**
 * ╔══════════════════════════════════════════════════════════╗
 * ║  DEVICE CHANNEL CARD — Canal de Logs & Telemetria          ║
 * ║  Offline, tempo ligado, consumo (W/kWh)                   ║
 * ╚══════════════════════════════════════════════════════════╝
 *
 * type: custom:device-channel-card
 * title: "Canal de Logs"
 * devices:
 *   - entity: switch.tv_sala
 *     name: "TV Sala"
 *     power_entity: sensor.consumo_tv_sala
 *   - entity: light.sala_principal
 *     name: "Luz Sala"
 * max_events: 50
 * refresh_seconds: 5
 */

class DeviceChannelCard extends HTMLElement {
  static getStubConfig() {
    return {
      title: "Canal de Logs",
      devices: [
        { entity: "switch.tv_sala", name: "TV Sala", power_entity: "sensor.consumo_tv_sala" },
      ],
      max_events: 40,
      refresh_seconds: 5,
    };
  }

  constructor() {
    super();
    this.attachShadow({ mode: "open" });
    this._config = {};
    this._hass = null;
    this._tick = null;
  }

  connectedCallback() {
    this._startTick();
  }

  disconnectedCallback() {
    if (this._tick) clearInterval(this._tick);
  }

  setConfig(config) {
    if (!config.devices || !config.devices.length) {
      throw new Error("device-channel-card: informe ao menos um device em `devices`");
    }
    this._config = {
      title: config.title || "Canal de Logs",
      devices: config.devices,
      max_events: config.max_events ?? 40,
      refresh_seconds: config.refresh_seconds ?? 5,
      show_energy: config.show_energy !== false,
    };
  }

  set hass(hass) {
    this._hass = hass;
    this._render();
  }

  getCardSize() {
    return 6;
  }

  _startTick() {
    if (this._tick) clearInterval(this._tick);
    const sec = this._config.refresh_seconds || 5;
    this._tick = setInterval(() => this._render(), sec * 1000);
  }

  _state(entityId) {
    return this._hass?.states[entityId];
  }

  _fmtDuration(ms) {
    if (!ms || ms < 0) return "—";
    const s = Math.floor(ms / 1000);
    const d = Math.floor(s / 86400);
    const h = Math.floor((s % 86400) / 3600);
    const m = Math.floor((s % 3600) / 60);
    const sec = s % 60;
    if (d > 0) return `${d}d ${h}h`;
    if (h > 0) return `${h}h ${m}min`;
    if (m > 0) return `${m}min ${sec}s`;
    return `${sec}s`;
  }

  _relative(iso) {
    if (!iso) return "—";
    const t = new Date(iso).getTime();
    const diff = Date.now() - t;
    return this._fmtDuration(diff) + " atrás";
  }

  _isActive(domain, state) {
    if (!state) return false;
    if (state === "unavailable" || state === "unknown") return false;
    if (domain === "light" || domain === "switch" || domain === "fan") return state === "on";
    if (domain === "lock") return state === "unlocked";
    if (domain === "cover") return state === "open";
    return state === "on";
  }

  _powerReading(powerEntity) {
    if (!powerEntity) return null;
    const st = this._state(powerEntity);
    if (!st) return null;
    const v = parseFloat(st.state);
    if (Number.isNaN(v)) return null;
    const unit = st.attributes.unit_of_measurement || "W";
    return { value: v, unit, entity: powerEntity };
  }

  _buildRows() {
    const now = Date.now();
    return this._config.devices.map((dev) => {
      const st = this._state(dev.entity);
      const domain = dev.entity.split(".")[0];
      const unavailable = !st || st.state === "unavailable" || st.state === "unknown";
      const active = !unavailable && this._isActive(domain, st.state);
      const changed = st?.last_changed ? new Date(st.last_changed).getTime() : now;
      const durationMs = now - changed;
      const power = this._powerReading(dev.power_entity);
      let statusClass = "online";
      let statusLabel = active ? "Ligado" : "Desligado";
      if (unavailable) {
        statusClass = "offline";
        statusLabel = "Offline";
      } else if (active) {
        statusClass = "on";
      }

      return {
        name: dev.name || st?.attributes?.friendly_name || dev.entity,
        entity: dev.entity,
        statusClass,
        statusLabel,
        state: st?.state ?? "?",
        duration: unavailable
          ? `Offline há ${this._fmtDuration(durationMs)}`
          : active
            ? `Ligado há ${this._fmtDuration(durationMs)}`
            : `Desligado há ${this._fmtDuration(durationMs)}`,
        power,
        lastChanged: st?.last_changed,
      };
    });
  }

  _collectLogEvents() {
    const events = [];
    const logbook = this._hass?.logbookEntries;
    if (logbook && Array.isArray(logbook)) {
      logbook.slice(0, this._config.max_events).forEach((e) => {
        events.push({
          when: e.when,
          name: e.name,
          message: e.message,
          entity_id: e.entity_id,
        });
      });
    }
    this._config.devices.forEach((dev) => {
      const st = this._state(dev.entity);
      if (st?.last_changed) {
        events.push({
          when: st.last_changed,
          name: dev.name || dev.entity,
          message: `Estado: ${st.state}`,
          entity_id: dev.entity,
        });
      }
    });
    events.sort((a, b) => new Date(b.when) - new Date(a.when));
    return events.slice(0, this._config.max_events);
  }

  _render() {
    if (!this._config.devices) return;
    const rows = this._buildRows();
    const offline = rows.filter((r) => r.statusClass === "offline").length;
    const on = rows.filter((r) => r.statusClass === "on").length;
    const events = this._collectLogEvents();

    this.shadowRoot.innerHTML = `
      <style>
        :host { display: block; }
        * { box-sizing: border-box; }
        .wrap {
          font-family: system-ui, -apple-system, Segoe UI, Roboto, sans-serif;
          background: linear-gradient(135deg, #0d1321 0%, #111827 100%);
          border: 1px solid #1a2744;
          border-radius: 16px;
          padding: 16px;
          color: #e8eaf6;
        }
        .head {
          display: flex;
          flex-wrap: wrap;
          justify-content: space-between;
          align-items: center;
          gap: 8px;
          margin-bottom: 12px;
          border-bottom: 2px solid #ff5000;
          padding-bottom: 10px;
        }
        .head h2 { margin: 0; font-size: 1.1rem; font-weight: 800; }
        .kpis { display: flex; flex-wrap: wrap; gap: 8px; }
        .kpi {
          font-size: 0.7rem;
          text-transform: uppercase;
          letter-spacing: 0.05em;
          padding: 4px 10px;
          border-radius: 999px;
          border: 1px solid #1a2744;
          background: #070b14;
          color: #8892b0;
        }
        .kpi strong { color: #00d4ff; margin-right: 4px; }
        table { width: 100%; border-collapse: collapse; font-size: 0.85rem; }
        th, td { text-align: left; padding: 8px 6px; border-bottom: 1px solid #1a2744; vertical-align: top; }
        th {
          font-size: 0.65rem;
          text-transform: uppercase;
          letter-spacing: 0.04em;
          color: #8892b0;
        }
        .pill {
          display: inline-block;
          padding: 2px 8px;
          border-radius: 6px;
          font-size: 0.75rem;
          font-weight: 700;
        }
        .pill.offline { background: rgba(255,51,102,0.2); color: #ff3366; }
        .pill.on { background: rgba(0,255,136,0.15); color: #00ff88; }
        .pill.online { background: rgba(61,74,107,0.4); color: #8892b0; }
        .energy { color: #ffd700; font-variant-numeric: tabular-nums; }
        .log {
          margin-top: 16px;
          max-height: 220px;
          overflow-y: auto;
          border-top: 1px solid #1a2744;
          padding-top: 10px;
        }
        .log h3 { margin: 0 0 8px; font-size: 0.8rem; color: #8892b0; text-transform: uppercase; }
        .log-item {
          font-size: 0.78rem;
          padding: 6px 0;
          border-bottom: 1px dashed rgba(26,39,68,0.8);
          display: grid;
          grid-template-columns: minmax(72px, auto) 1fr;
          gap: 8px;
        }
        .log-time { color: #3d4a6b; white-space: nowrap; }
        @media (max-width: 600px) {
          table, thead, tbody, th, td, tr { display: block; }
          thead { display: none; }
          tr {
            margin-bottom: 12px;
            border: 1px solid #1a2744;
            border-radius: 12px;
            padding: 8px;
          }
          td { border: none; padding: 4px 0; }
          td::before {
            content: attr(data-label);
            font-weight: 700;
            color: #8892b0;
            display: block;
            font-size: 0.65rem;
            text-transform: uppercase;
          }
        }
      </style>
      <div class="wrap">
        <div class="head">
          <h2>📡 ${this._config.title}</h2>
          <div class="kpis">
            <span class="kpi"><strong>${rows.length}</strong> dispositivos</span>
            <span class="kpi"><strong>${on}</strong> ligados</span>
            <span class="kpi"><strong>${offline}</strong> offline</span>
          </div>
        </div>
        <table>
          <thead>
            <tr>
              <th>Dispositivo</th>
              <th>Status</th>
              <th>Tempo no estado</th>
              ${this._config.show_energy ? "<th>Energia</th>" : ""}
            </tr>
          </thead>
          <tbody>
            ${rows
              .map(
                (r) => `
              <tr>
                <td data-label="Dispositivo">${r.name}</td>
                <td data-label="Status"><span class="pill ${r.statusClass}">${r.statusLabel}</span></td>
                <td data-label="Tempo">${r.duration}</td>
                ${
                  this._config.show_energy
                    ? `<td data-label="Energia" class="energy">${
                        r.power
                          ? `${r.power.value} ${r.power.unit}${r.statusClass === "on" ? " (ativo)" : " (repouso)"}`
                          : "—"
                      }</td>`
                    : ""
                }
              </tr>`
              )
              .join("")}
          </tbody>
        </table>
        <div class="log">
          <h3>Eventos recentes</h3>
          ${
            events.length
              ? events
                  .map(
                    (e) => `
            <div class="log-item">
              <span class="log-time">${this._relative(e.when)}</span>
              <span><strong>${e.name}</strong> — ${e.message}</span>
            </div>`
                  )
                  .join("")
              : "<p style='color:#8892b0;font-size:0.8rem'>Nenhum evento recente no canal.</p>"
          }
        </div>
      </div>
    `;
  }
}

customElements.define("device-channel-card", DeviceChannelCard);
window.customCards = window.customCards || [];
window.customCards.push({
  type: "device-channel-card",
  name: "Device Channel Card",
  description: "Canal de logs: offline, tempo ligado e energia",
  preview: true,
});
