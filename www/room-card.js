/**
 * ╔══════════════════════════════════════════════════════════╗
 * ║  ROOM CARD — Card Modular de Cômodo                      ║
 * ║  Versão: 2.0  |  Home Assistant Custom Card              ║
 * ╚══════════════════════════════════════════════════════════╝
 *
 * Configuração YAML:
 *   type: custom:room-card
 *   room: sala
 *   name: "Sala de Estar"
 *   icon: mdi:sofa
 *   entities:
 *     - entity: light.sala_principal
 *       name: "Luz Principal"
 *       show_brightness: true
 *     - entity: switch.tv_sala
 *       name: "TV"
 *       show_power: true
 *     - entity: sensor.temperatura_sala
 *       name: "Temperatura"
 *   navigate_to: /lovelace/comodos
 */

class RoomCard extends HTMLElement {
  constructor() {
    super();
    this.attachShadow({ mode: "open" });
    this._config = {};
    this._hass = null;
  }

  setConfig(config) {
    this._config = {
      name: config.name || "Cômodo",
      room: config.room || "room",
      icon: config.icon || "mdi:home",
      entities: config.entities || [],
      navigate_to: config.navigate_to || null,
      show_header: config.show_header !== false,
      layout: config.layout || "compact",
    };
  }

  set hass(hass) {
    this._hass = hass;
    this._render();
  }

  _getState(entityId) {
    return this._hass?.states[entityId];
  }

  _isOn(entityId) {
    const state = this._getState(entityId);
    return state && (state.state === "on" || state.state === "unlocked" || state.state === "open");
  }

  _getActiveCount() {
    return this._config.entities.filter((e) => {
      const domain = e.entity.split(".")[0];
      return ["light", "switch", "media_player", "fan", "climate"].includes(domain) && this._isOn(e.entity);
    }).length;
  }

  _toggleEntity(entityId) {
    const domain = entityId.split(".")[0];
    const serviceMap = {
      light: "toggle",
      switch: "toggle",
      fan: "toggle",
      media_player: this._isOn(entityId) ? "turn_off" : "turn_on",
    };
    const service = serviceMap[domain] || "toggle";
    this._hass?.callService(domain, service, { entity_id: entityId });
  }

  _setBrightness(entityId, brightness) {
    this._hass?.callService("light", "turn_on", { entity_id: entityId, brightness: Math.round(brightness * 2.55) });
  }

  _render() {
    const activeCount = this._getActiveCount();
    const totalDevices = this._config.entities.filter((e) => {
      const domain = e.entity.split(".")[0];
      return ["light", "switch", "media_player", "fan"].includes(domain);
    }).length;

    const roomActive = activeCount > 0;

    this.shadowRoot.innerHTML = `
      <style>
        :host { display: block; font-family: 'Rajdhani', 'Segoe UI', system-ui, sans-serif; }

        ha-card {
          background: linear-gradient(135deg, #0d1321 0%, #111827 100%);
          border: 1px solid ${roomActive ? "rgba(0,212,255,0.3)" : "#1a2744"};
          border-radius: 16px;
          overflow: hidden;
          transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
          box-shadow: ${roomActive ? "0 0 20px rgba(0,212,255,0.1)" : "0 4px 16px rgba(0,0,0,0.3)"};
        }
        ha-card:hover {
          box-shadow: ${roomActive ? "0 0 30px rgba(0,212,255,0.2)" : "0 8px 24px rgba(0,0,0,0.4)"};
          transform: translateY(-2px);
        }

        .room-header {
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 14px 16px 10px;
          cursor: ${this._config.navigate_to ? "pointer" : "default"};
          background: linear-gradient(90deg,
            ${roomActive ? "rgba(0,212,255,0.06)" : "transparent"} 0%, transparent 100%);
        }
        .room-left { display: flex; align-items: center; gap: 10px; }
        .room-icon {
          width: 40px; height: 40px;
          background: ${roomActive ? "linear-gradient(135deg, rgba(0,212,255,0.2), rgba(0,212,255,0.05))" : "rgba(26,39,68,0.5)"};
          border: 1px solid ${roomActive ? "rgba(0,212,255,0.4)" : "#1a2744"};
          border-radius: 12px;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 1.2rem;
          transition: all 0.3s;
          box-shadow: ${roomActive ? "0 0 12px rgba(0,212,255,0.3)" : "none"};
        }
        .room-name {
          font-size: 1rem;
          font-weight: 700;
          color: ${roomActive ? "#e8eaf6" : "#8892b0"};
          transition: color 0.3s;
        }
        .room-status {
          font-size: 0.72rem;
          color: ${roomActive ? "#00d4ff" : "#3d4a6b"};
          margin-top: 1px;
        }
        .master-toggle {
          width: 44px; height: 24px;
          background: ${roomActive ? "rgba(0,212,255,0.2)" : "rgba(26,39,68,0.4)"};
          border: 1px solid ${roomActive ? "rgba(0,212,255,0.5)" : "#1a2744"};
          border-radius: 12px;
          position: relative;
          cursor: pointer;
          transition: all 0.3s;
          flex-shrink: 0;
        }
        .master-toggle::after {
          content: "";
          position: absolute;
          width: 18px; height: 18px;
          border-radius: 50%;
          background: ${roomActive ? "#00d4ff" : "#3d4a6b"};
          top: 2px;
          left: ${roomActive ? "22px" : "2px"};
          transition: all 0.3s;
          box-shadow: ${roomActive ? "0 0 8px rgba(0,212,255,0.6)" : "none"};
        }
        .master-toggle:hover { border-color: rgba(0,212,255,0.6); }

        .devices-grid {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(100px, 1fr));
          gap: 8px;
          padding: 8px 14px 14px;
        }
        .device-tile {
          background: ${this._hass ? "rgba(26,39,68,0.3)" : "#1a2744"};
          border-radius: 12px;
          padding: 10px 8px;
          cursor: pointer;
          text-align: center;
          transition: all 0.25s;
          border: 1px solid rgba(26,39,68,0.6);
          position: relative;
          overflow: hidden;
        }
        .device-tile:hover { transform: translateY(-2px); }
        .device-tile.active {
          background: linear-gradient(135deg, rgba(0,212,255,0.12), rgba(0,212,255,0.04));
          border-color: rgba(0,212,255,0.3);
          box-shadow: 0 0 12px rgba(0,212,255,0.15);
        }
        .device-tile.sensor {
          cursor: default;
          border-style: dashed;
          border-color: rgba(26,39,68,0.4);
        }
        .device-tile.sensor:hover { transform: none; }
        .device-icon {
          font-size: 1.4rem;
          margin-bottom: 4px;
          display: block;
          transition: all 0.3s;
        }
        .device-tile.active .device-icon {
          filter: drop-shadow(0 0 6px rgba(0,212,255,0.8));
          animation: glow-pulse 2s ease-in-out infinite;
        }
        @keyframes glow-pulse {
          0%, 100% { filter: drop-shadow(0 0 4px rgba(0,212,255,0.6)); }
          50% { filter: drop-shadow(0 0 10px rgba(0,212,255,1)); }
        }
        .device-name {
          font-size: 0.68rem;
          font-weight: 600;
          color: #8892b0;
          line-height: 1.2;
          margin-bottom: 3px;
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
        }
        .device-state {
          font-size: 0.7rem;
          color: ${roomActive ? "#00d4ff" : "#3d4a6b"};
        }
        .device-tile.active .device-state { color: #00d4ff; }
        .slider-container {
          margin-top: 5px;
          padding: 0 2px;
        }
        input[type="range"] {
          -webkit-appearance: none;
          width: 100%;
          height: 3px;
          background: linear-gradient(90deg, #00d4ff var(--val, 50%), #1a2744 var(--val, 50%));
          border-radius: 2px;
          cursor: pointer;
          outline: none;
        }
        input[type="range"]::-webkit-slider-thumb {
          -webkit-appearance: none;
          width: 12px; height: 12px;
          border-radius: 50%;
          background: #00d4ff;
          box-shadow: 0 0 6px rgba(0,212,255,0.6);
          cursor: pointer;
        }
        .sensor-value {
          font-size: 0.85rem;
          font-weight: 700;
          color: #e8eaf6;
        }
        .divider { height: 1px; background: rgba(26,39,68,0.4); margin: 0 14px; }
      </style>

      <ha-card>
        <div class="room-header" id="roomHeader">
          <div class="room-left">
            <div class="room-icon">
              <ha-icon icon="${this._config.icon}"></ha-icon>
            </div>
            <div>
              <div class="room-name">${this._config.name}</div>
              <div class="room-status">
                ${roomActive ? `${activeCount}/${totalDevices} ligados` : "Tudo desligado"}
              </div>
            </div>
          </div>
          <div class="master-toggle" id="masterToggle" title="${roomActive ? "Desligar tudo" : "Ligar tudo"}"></div>
        </div>

        <div class="divider"></div>

        <div class="devices-grid">
          ${this._config.entities.map((e) => this._renderDevice(e)).join("")}
        </div>
      </ha-card>
    `;

    // Master toggle
    this.shadowRoot.querySelector("#masterToggle")?.addEventListener("click", (ev) => {
      ev.stopPropagation();
      const service = roomActive ? "turn_off" : "turn_on";
      this._config.entities.forEach((e) => {
        const domain = e.entity.split(".")[0];
        if (["light", "switch", "fan", "media_player"].includes(domain)) {
          this._hass?.callService(domain, service, { entity_id: e.entity });
        }
      });
    });

    // Navigate on header tap
    if (this._config.navigate_to) {
      this.shadowRoot.querySelector("#roomHeader")?.addEventListener("click", (ev) => {
        if (ev.target.closest("#masterToggle")) return;
        this.dispatchEvent(new CustomEvent("hass-more-info", { detail: {}, bubbles: true, composed: true }));
        history.pushState(null, "", this._config.navigate_to);
        window.dispatchEvent(new PopStateEvent("popstate"));
      });
    }

    // Device toggles
    this.shadowRoot.querySelectorAll("[data-entity]").forEach((el) => {
      el.addEventListener("click", () => this._toggleEntity(el.dataset.entity));
    });

    // Sliders
    this.shadowRoot.querySelectorAll("input[type=range]").forEach((slider) => {
      slider.addEventListener("change", (e) => {
        this._setBrightness(e.target.dataset.entity, parseInt(e.target.value));
        e.target.style.setProperty("--val", `${e.target.value}%`);
      });
      slider.addEventListener("input", (e) => {
        e.target.style.setProperty("--val", `${e.target.value}%`);
      });
    });
  }

  _renderDevice(entityConfig) {
    const { entity, name, show_brightness, show_power, type: devType } = entityConfig;
    const state = this._getState(entity);
    const domain = entity.split(".")[0];
    const isSensor = domain === "sensor" || domain === "binary_sensor" || devType === "sensor";
    const active = !isSensor && this._isOn(entity);

    const iconMap = {
      "light": active ? "💡" : "🔦",
      "switch": active ? "🔌" : "⚡",
      "media_player": active ? "📺" : "📺",
      "fan": active ? "🌀" : "💨",
      "sensor": "🌡️",
      "binary_sensor": state?.state === "on" ? "🔴" : "🟢",
      "climate": "❄️",
    };
    const icon = entityConfig.icon ? `<ha-icon icon="${entityConfig.icon}" style="--mdc-icon-size:1.4rem"></ha-icon>` : (iconMap[domain] || "🔧");

    let brightnessSlider = "";
    if (show_brightness && domain === "light" && active) {
      const bri = state?.attributes?.brightness;
      const val = bri ? Math.round(bri / 2.55) : 100;
      brightnessSlider = `
        <div class="slider-container">
          <input type="range" min="1" max="100" value="${val}"
            style="--val:${val}%"
            data-entity="${entity}" />
        </div>
      `;
    }

    let stateText = "";
    if (isSensor) {
      const val = state?.state || "—";
      const unit = state?.attributes?.unit_of_measurement || "";
      stateText = `<div class="sensor-value">${val} ${unit}</div>`;
    } else {
      stateText = `<div class="device-state">${active ? "Ligado" : "Desligado"}</div>`;
      if (show_power && state?.attributes?.watt) {
        stateText += `<div class="device-state" style="color:#ffd700">${state.attributes.watt}W</div>`;
      }
    }

    return `
      <div class="device-tile${active ? " active" : ""}${isSensor ? " sensor" : ""}"
        ${!isSensor ? `data-entity="${entity}"` : ""}>
        <span class="device-icon">${icon}</span>
        <div class="device-name">${name || entity.split(".")[1]}</div>
        ${stateText}
        ${brightnessSlider}
      </div>
    `;
  }

  static getStubConfig() {
    return {
      name: "Sala",
      room: "sala",
      icon: "mdi:sofa",
      entities: [
        { entity: "light.sala_principal", name: "Luz", show_brightness: true },
        { entity: "switch.tv_sala", name: "TV" },
        { entity: "sensor.temperatura_sala", name: "Temperatura" },
      ],
    };
  }

  getCardSize() { return 3; }
}

customElements.define("room-card", RoomCard);
window.customCards = window.customCards || [];
window.customCards.push({
  type: "room-card",
  name: "Room Card — Cômodo Modular",
  description: "Card modular de cômodo com grid de dispositivos, toggle master, brilho e sensores.",
  preview: true,
});
