/**
 * ╔══════════════════════════════════════════════════════════╗
 * ║  REMINDER CARD — Lembretes, Tarefas & Lista de Compras   ║
 * ║  Versão: 2.0  |  Home Assistant Custom Card              ║
 * ╚══════════════════════════════════════════════════════════╝
 *
 * Configuração YAML:
 *   type: custom:reminder-card
 *   title: "Lembretes & Tarefas"
 *   storage_entity_tarefas: input_text.tarefas_json
 *   storage_entity_lembretes: input_text.lembretes_json
 *   storage_entity_compras: input_text.compras_json
 *   notify_service: notify.alexa_media
 *   alexa_entity: media_player.echo_sala
 *   shopping_list_integration: true
 */

class ReminderCard extends HTMLElement {
  constructor() {
    super();
    this.attachShadow({ mode: "open" });
    this._config = {};
    this._hass = null;
    this._activeTab = "tarefas";
    this._data = {
      tarefas: [],
      lembretes: [],
      compras: [],
      importante: [],
    };
    this._editingId = null;
    this._newItemText = "";
    this._newItemTime = "";
    this._dragSrc = null;
    this._loaded = false;
  }

  setConfig(config) {
    this._config = {
      title: config.title || "📋 Lembretes & Tarefas",
      storage_entity_tarefas: config.storage_entity_tarefas || "input_text.tarefas_json",
      storage_entity_lembretes: config.storage_entity_lembretes || "input_text.lembretes_json",
      storage_entity_compras: config.storage_entity_compras || "input_text.compras_json",
      notify_service: config.notify_service || "",
      alexa_entity: config.alexa_entity || "",
      shopping_list_integration: config.shopping_list_integration !== false,
    };
  }

  set hass(hass) {
    this._hass = hass;
    if (!this._loaded) {
      this._loadFromStorage();
      this._loaded = true;
    }
  }

  // ── Persistência ────────────────────────────────────────────
  _loadFromStorage() {
    // Tenta carregar do HA input_text, fallback para localStorage
    const keys = ["tarefas", "lembretes", "compras"];
    keys.forEach((key) => {
      const stored = localStorage.getItem(`reminder_card_${key}`);
      if (stored) {
        try { this._data[key] = JSON.parse(stored); } catch (e) {}
      }
    });

    // Carrega "importante" filtrando das tarefas
    this._data.importante = [
      ...this._data.tarefas.filter((t) => t.prioridade === "alta"),
      ...this._data.lembretes.filter((l) => l.prioridade === "alta"),
    ];

    this._render();
  }

  _saveToStorage(key) {
    localStorage.setItem(`reminder_card_${key}`, JSON.stringify(this._data[key]));

    // Tenta salvar no HA se entity disponível
    const entityKey = `storage_entity_${key}`;
    const entity = this._config[entityKey];
    if (this._hass && entity) {
      const json = JSON.stringify(this._data[key]).slice(0, 255);
      this._hass.callService("input_text", "set_value", {
        entity_id: entity,
        value: json,
      }).catch(() => {});
    }
  }

  // ── CRUD ───────────────────────────────────────────────────
  _addItem(tab) {
    const input = this.shadowRoot.querySelector(`#newItem_${tab}`);
    const timeInput = this.shadowRoot.querySelector(`#newTime_${tab}`);
    const text = input?.value?.trim();
    if (!text) return;

    const item = {
      id: Date.now().toString(36),
      texto: text,
      concluido: false,
      prioridade: "normal",
      criadoEm: new Date().toISOString(),
      horario: timeInput?.value || null,
    };

    this._data[tab].unshift(item);
    this._saveToStorage(tab);

    if (tab === "compras" && this._config.shopping_list_integration && this._hass) {
      this._hass.callService("shopping_list", "add_item", { name: text }).catch(() => {});
    }

    if (tab === "lembretes" && item.horario) {
      this._scheduleReminder(item);
    }

    input.value = "";
    if (timeInput) timeInput.value = "";
    this._render();
  }

  _toggleItem(tab, id) {
    const item = this._data[tab].find((i) => i.id === id);
    if (item) {
      item.concluido = !item.concluido;
      item.concluidoEm = item.concluido ? new Date().toISOString() : null;
      this._saveToStorage(tab);
      this._render();
    }
  }

  _deleteItem(tab, id) {
    this._data[tab] = this._data[tab].filter((i) => i.id !== id);
    this._saveToStorage(tab);
    this._render();
  }

  _setPriority(tab, id, priority) {
    const item = this._data[tab].find((i) => i.id === id);
    if (item) {
      item.prioridade = priority;
      this._saveToStorage(tab);
      this._render();
    }
  }

  _scheduleReminder(item) {
    if (!item.horario || !this._hass) return;
    const [h, m] = item.horario.split(":").map(Number);
    const now = new Date();
    const trigger = new Date();
    trigger.setHours(h, m, 0, 0);
    if (trigger <= now) trigger.setDate(trigger.getDate() + 1);

    const msUntil = trigger - now;
    setTimeout(() => {
      if (this._config.notify_service && this._hass) {
        this._hass.callService("notify", this._config.notify_service.split(".")[1], {
          title: "⏰ Lembrete",
          message: item.texto,
          data: { entity_id: this._config.alexa_entity },
        }).catch(() => {});
      }
    }, msUntil);
  }

  // ── Renderização ───────────────────────────────────────────
  _render() {
    const tabs = [
      { key: "tarefas",    label: "📋 Tarefas",   count: this._data.tarefas.filter(i => !i.concluido).length },
      { key: "lembretes",  label: "⏰ Lembretes",  count: this._data.lembretes.filter(i => !i.concluido).length },
      { key: "compras",    label: "🛒 Compras",    count: this._data.compras.filter(i => !i.concluido).length },
      { key: "importante", label: "❗ Importante", count: [...this._data.tarefas, ...this._data.lembretes].filter(i => i.prioridade === "alta" && !i.concluido).length },
    ];

    this.shadowRoot.innerHTML = `
      <style>
        :host { display: block; font-family: 'Rajdhani', 'Segoe UI', system-ui, sans-serif; }
        ha-card {
          background: linear-gradient(135deg, #0d1321 0%, #111827 100%);
          border: 1px solid #1a2744;
          border-radius: 16px;
          overflow: hidden;
          min-height: 300px;
        }
        .header {
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 14px 18px 0;
        }
        .header h2 {
          margin: 0;
          font-size: 1rem;
          font-weight: 700;
          color: #00d4ff;
          letter-spacing: 0.04em;
        }
        .tabs {
          display: flex;
          border-bottom: 1px solid #1a2744;
          margin-top: 10px;
          overflow-x: auto;
          scrollbar-width: none;
        }
        .tabs::-webkit-scrollbar { display: none; }
        .tab {
          flex: 0 0 auto;
          padding: 8px 14px;
          cursor: pointer;
          font-size: 0.78rem;
          font-weight: 600;
          color: #8892b0;
          border-bottom: 2px solid transparent;
          transition: all 0.2s;
          white-space: nowrap;
          position: relative;
        }
        .tab.active {
          color: #00d4ff;
          border-bottom-color: #00d4ff;
        }
        .tab:hover { color: #e8eaf6; }
        .tab-count {
          display: inline-flex;
          align-items: center;
          justify-content: center;
          background: rgba(0,212,255,0.15);
          color: #00d4ff;
          border-radius: 9999px;
          font-size: 0.65rem;
          min-width: 18px;
          height: 18px;
          padding: 0 5px;
          margin-left: 5px;
        }
        .tab-content { padding: 12px 16px; }
        .add-bar {
          display: flex;
          gap: 8px;
          margin-bottom: 12px;
        }
        .add-input {
          flex: 1;
          background: rgba(26,39,68,0.6);
          border: 1px solid #1a2744;
          border-radius: 8px;
          color: #e8eaf6;
          font-size: 0.85rem;
          padding: 7px 10px;
          font-family: inherit;
          outline: none;
          transition: border-color 0.2s;
        }
        .add-input:focus { border-color: rgba(0,212,255,0.5); }
        .add-input::placeholder { color: #3d4a6b; }
        .time-input {
          width: 90px;
          background: rgba(26,39,68,0.6);
          border: 1px solid #1a2744;
          border-radius: 8px;
          color: #e8eaf6;
          font-size: 0.85rem;
          padding: 7px 8px;
          font-family: inherit;
          outline: none;
          transition: border-color 0.2s;
        }
        .time-input:focus { border-color: rgba(0,212,255,0.5); }
        .add-btn {
          background: linear-gradient(135deg, rgba(0,212,255,0.2) 0%, rgba(0,212,255,0.1) 100%);
          border: 1px solid rgba(0,212,255,0.4);
          border-radius: 8px;
          color: #00d4ff;
          cursor: pointer;
          font-size: 1.1rem;
          padding: 0 12px;
          transition: all 0.2s;
          font-family: inherit;
        }
        .add-btn:hover { background: rgba(0,212,255,0.25); box-shadow: 0 0 12px rgba(0,212,255,0.3); }
        .item-list { display: flex; flex-direction: column; gap: 6px; max-height: 260px; overflow-y: auto; }
        .item-list::-webkit-scrollbar { width: 3px; }
        .item-list::-webkit-scrollbar-track { background: transparent; }
        .item-list::-webkit-scrollbar-thumb { background: #1a2744; border-radius: 3px; }
        .item {
          display: flex;
          align-items: center;
          gap: 8px;
          padding: 8px 10px;
          background: rgba(26,39,68,0.3);
          border: 1px solid rgba(26,39,68,0.6);
          border-radius: 10px;
          transition: all 0.2s;
          cursor: grab;
          position: relative;
        }
        .item:hover { background: rgba(26,39,68,0.5); border-color: rgba(0,212,255,0.2); }
        .item.concluido { opacity: 0.5; }
        .item.prioridade-alta { border-left: 3px solid #ff3366; }
        .checkbox {
          width: 18px; height: 18px;
          border-radius: 5px;
          border: 2px solid #1a2744;
          cursor: pointer;
          flex-shrink: 0;
          display: flex;
          align-items: center;
          justify-content: center;
          transition: all 0.2s;
          background: transparent;
        }
        .checkbox.checked {
          background: linear-gradient(135deg, #00d4ff, #7b2fff);
          border-color: transparent;
        }
        .checkbox.checked::after { content: "✓"; color: white; font-size: 11px; font-weight: 700; }
        .item-text {
          flex: 1;
          font-size: 0.87rem;
          color: #e8eaf6;
          transition: all 0.2s;
        }
        .item-text.riscado {
          text-decoration: line-through;
          color: #3d4a6b;
        }
        .item-time {
          font-size: 0.7rem;
          color: #00d4ff;
          background: rgba(0,212,255,0.1);
          border-radius: 4px;
          padding: 2px 5px;
        }
        .item-actions {
          display: flex;
          gap: 4px;
          opacity: 0;
          transition: opacity 0.15s;
        }
        .item:hover .item-actions { opacity: 1; }
        .action-btn {
          background: none;
          border: none;
          cursor: pointer;
          font-size: 0.85rem;
          padding: 2px 4px;
          border-radius: 4px;
          transition: background 0.15s;
          color: #8892b0;
        }
        .action-btn:hover { background: rgba(255,51,102,0.15); color: #ff3366; }
        .action-btn.prio { color: #ffd700; }
        .action-btn.prio:hover { background: rgba(255,215,0,0.1); }
        .empty-state {
          text-align: center;
          padding: 30px 20px;
          color: #3d4a6b;
          font-size: 0.85rem;
        }
        .empty-state div { font-size: 2rem; margin-bottom: 8px; }
      </style>

      <ha-card>
        <div class="header">
          <h2>${this._config.title}</h2>
        </div>
        <div class="tabs">
          ${tabs.map((t) => `
            <div class="tab${this._activeTab === t.key ? " active" : ""}" data-tab="${t.key}">
              ${t.label}
              ${t.count > 0 ? `<span class="tab-count">${t.count}</span>` : ""}
            </div>
          `).join("")}
        </div>
        <div class="tab-content">
          ${this._renderTabContent(this._activeTab)}
        </div>
      </ha-card>
    `;

    // Event listeners — tabs
    this.shadowRoot.querySelectorAll(".tab").forEach((tab) => {
      tab.addEventListener("click", (e) => {
        this._activeTab = e.currentTarget.dataset.tab;
        this._render();
      });
    });

    // Add item buttons
    ["tarefas", "lembretes", "compras"].forEach((tab) => {
      const btn = this.shadowRoot.querySelector(`#addBtn_${tab}`);
      const input = this.shadowRoot.querySelector(`#newItem_${tab}`);
      if (btn) btn.addEventListener("click", () => this._addItem(tab));
      if (input) {
        input.addEventListener("keydown", (e) => {
          if (e.key === "Enter") this._addItem(tab);
        });
      }
    });

    // Checkbox & delete actions
    this.shadowRoot.querySelectorAll("[data-action]").forEach((el) => {
      el.addEventListener("click", (e) => {
        const { action, id, tab } = e.currentTarget.dataset;
        if (action === "toggle") this._toggleItem(tab, id);
        if (action === "delete") this._deleteItem(tab, id);
        if (action === "priority") this._setPriority(tab, id, "alta");
      });
    });
  }

  _renderTabContent(tab) {
    if (tab === "importante") {
      const items = [
        ...this._data.tarefas.filter((i) => i.prioridade === "alta").map((i) => ({ ...i, _tab: "tarefas" })),
        ...this._data.lembretes.filter((i) => i.prioridade === "alta").map((i) => ({ ...i, _tab: "lembretes" })),
      ];
      return `
        <div class="item-list">
          ${items.length === 0 ? `<div class="empty-state"><div>⭐</div>Nenhum item marcado como importante</div>` : ""}
          ${items.map((item) => this._renderItem(item, item._tab)).join("")}
        </div>
      `;
    }

    const showTimeInput = tab === "lembretes";
    const items = this._data[tab] || [];
    const pendentes = items.filter((i) => !i.concluido);
    const concluidos = items.filter((i) => i.concluido);

    return `
      <div class="add-bar">
        <input class="add-input" id="newItem_${tab}"
          type="text"
          placeholder="${tab === "compras" ? "Adicionar item..." : tab === "lembretes" ? "Novo lembrete..." : "Nova tarefa..."}"
          autocomplete="off"
        />
        ${showTimeInput ? `<input class="time-input" id="newTime_${tab}" type="time" />` : ""}
        <button class="add-btn" id="addBtn_${tab}">＋</button>
      </div>
      <div class="item-list">
        ${pendentes.length === 0 && concluidos.length === 0
          ? `<div class="empty-state"><div>✨</div>Nenhum item ainda. Adicione um acima!</div>`
          : ""}
        ${pendentes.map((item) => this._renderItem(item, tab)).join("")}
        ${concluidos.length > 0 ? `<div style="font-size:0.72rem;color:#3d4a6b;padding:6px 2px">✓ Concluídos (${concluidos.length})</div>` : ""}
        ${concluidos.map((item) => this._renderItem(item, tab)).join("")}
      </div>
    `;
  }

  _renderItem(item, tab) {
    const isAlta = item.prioridade === "alta";
    return `
      <div class="item${item.concluido ? " concluido" : ""}${isAlta ? " prioridade-alta" : ""}"
           draggable="true" data-id="${item.id}" data-tab="${tab}">
        <div class="checkbox${item.concluido ? " checked" : ""}"
             data-action="toggle" data-id="${item.id}" data-tab="${tab}"></div>
        <span class="item-text${item.concluido ? " riscado" : ""}">${item.texto}</span>
        ${item.horario ? `<span class="item-time">⏰ ${item.horario}</span>` : ""}
        <div class="item-actions">
          <button class="action-btn prio" data-action="priority" data-id="${item.id}" data-tab="${tab}"
            title="Marcar como importante">★</button>
          <button class="action-btn" data-action="delete" data-id="${item.id}" data-tab="${tab}"
            title="Excluir">✕</button>
        </div>
      </div>
    `;
  }

  static getStubConfig() {
    return {
      title: "📋 Lembretes & Tarefas",
      storage_entity_tarefas: "input_text.tarefas_json",
      storage_entity_lembretes: "input_text.lembretes_json",
      storage_entity_compras: "input_text.compras_json",
      shopping_list_integration: true,
    };
  }

  getCardSize() { return 4; }
}

customElements.define("reminder-card", ReminderCard);
window.customCards = window.customCards || [];
window.customCards.push({
  type: "reminder-card",
  name: "Reminder Card — Tarefas & Lembretes",
  description: "Gerencia tarefas, lembretes, lista de compras e itens importantes com sincronização HA.",
  preview: true,
});
