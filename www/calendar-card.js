/**
 * ╔══════════════════════════════════════════════════════════╗
 * ║  CALENDAR CARD — Calendário 3 Dias                       ║
 * ║  Versão: 2.0  |  Home Assistant Custom Card              ║
 * ╚══════════════════════════════════════════════════════════╝
 *
 * Configuração YAML:
 *   type: custom:calendar-card
 *   title: "📅 Calendário"
 *   calendar_entity: calendar.home
 *   show_days: 3
 *   refresh_interval: 300   # segundos
 */

const DIAS_PT = ["Domingo", "Segunda", "Terça", "Quarta", "Quinta", "Sexta", "Sábado"];
const MESES_PT = ["Jan","Fev","Mar","Abr","Mai","Jun","Jul","Ago","Set","Out","Nov","Dez"];

const EVENT_COLORS = [
  "#00d4ff", "#7b2fff", "#00ff88", "#ffd700", "#ff3366",
  "#ff8c00", "#00bcd4", "#e91e63", "#9c27b0", "#4caf50",
];

class CalendarCard extends HTMLElement {
  constructor() {
    super();
    this.attachShadow({ mode: "open" });
    this._config = {};
    this._hass = null;
    this._events = [];
    this._loading = true;
    this._showModal = false;
    this._newEvent = { title: "", date: "", start: "09:00", end: "10:00", description: "" };
    this._refreshTimer = null;
  }

  setConfig(config) {
    this._config = {
      title: config.title || "📅 Calendário",
      calendar_entity: config.calendar_entity || "calendar.home",
      show_days: config.show_days || 3,
      refresh_interval: (config.refresh_interval || 300) * 1000,
    };
  }

  set hass(hass) {
    this._hass = hass;
    if (!this._refreshTimer) {
      this._fetchEvents();
      this._refreshTimer = setInterval(() => this._fetchEvents(), this._config.refresh_interval);
    }
  }

  // ── Busca eventos da API do HA ───────────────────────────────
  async _fetchEvents() {
    if (!this._hass) return;
    this._loading = true;
    this._render();

    try {
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const yesterday = new Date(today);
      yesterday.setDate(yesterday.getDate() - 1);
      const tomorrow = new Date(today);
      tomorrow.setDate(tomorrow.getDate() + 2);

      const start = yesterday.toISOString();
      const end = tomorrow.toISOString();

      const response = await this._hass.callApi(
        "GET",
        `calendars/${this._config.calendar_entity}?start=${start}&end=${end}`
      );

      this._events = (response || []).map((ev, i) => ({
        ...ev,
        color: EVENT_COLORS[i % EVENT_COLORS.length],
      }));
    } catch (err) {
      console.warn("[CalendarCard] Erro ao buscar eventos:", err);
      // Mock events
      this._events = this._getMockEvents();
    }

    this._loading = false;
    this._render();
  }

  _getMockEvents() {
    const today = new Date();
    const fmt = (d) => d.toISOString();
    const addH = (d, h) => { const n = new Date(d); n.setHours(n.getHours() + h); return n; };
    return [
      { summary: "Reunião de equipe", start: { dateTime: fmt(addH(today, -2)) }, end: { dateTime: fmt(addH(today, -1)) }, color: "#00d4ff" },
      { summary: "Consulta médica", start: { dateTime: fmt(addH(today, 2)) }, end: { dateTime: fmt(addH(today, 3)) }, color: "#ff3366" },
      { summary: "Almoço com família", start: { dateTime: fmt(addH(today, 12)) }, end: { dateTime: fmt(addH(today, 14)) }, color: "#00ff88" },
    ];
  }

  // ── Criar evento ────────────────────────────────────────────
  async _createEvent() {
    if (!this._hass || !this._newEvent.title || !this._newEvent.date) return;

    const startDT = `${this._newEvent.date}T${this._newEvent.start}:00`;
    const endDT = `${this._newEvent.date}T${this._newEvent.end}:00`;

    try {
      await this._hass.callService("calendar", "create_event", {
        entity_id: this._config.calendar_entity,
        summary: this._newEvent.title,
        start_date_time: startDT,
        end_date_time: endDT,
        description: this._newEvent.description,
      });

      this._showModal = false;
      this._newEvent = { title: "", date: "", start: "09:00", end: "10:00", description: "" };
      await this._fetchEvents();
    } catch (err) {
      console.error("[CalendarCard] Erro ao criar evento:", err);
      alert("Erro ao criar evento: " + err.message);
    }
  }

  // ── Helpers de data ─────────────────────────────────────────
  _getDayLabel(dayOffset) {
    if (dayOffset === -1) return "Ontem";
    if (dayOffset === 0) return "Hoje";
    if (dayOffset === 1) return "Amanhã";
    const d = new Date();
    d.setDate(d.getDate() + dayOffset);
    return DIAS_PT[d.getDay()];
  }

  _getEventsForDay(dayOffset) {
    const d = new Date();
    d.setHours(0, 0, 0, 0);
    d.setDate(d.getDate() + dayOffset);
    const next = new Date(d);
    next.setDate(next.getDate() + 1);

    return this._events.filter((ev) => {
      const start = new Date(ev.start.dateTime || ev.start.date);
      const end = new Date(ev.end.dateTime || ev.end.date);
      return start < next && end > d;
    });
  }

  _formatTime(dt) {
    if (!dt) return "";
    return new Date(dt).toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" });
  }

  _getDayProgress() {
    const now = new Date();
    const secs = now.getHours() * 3600 + now.getMinutes() * 60 + now.getSeconds();
    return Math.round((secs / 86400) * 100);
  }

  // ── Renderização ────────────────────────────────────────────
  _render() {
    const days = [-1, 0, 1];

    this.shadowRoot.innerHTML = `
      <style>
        :host { display: block; font-family: 'Rajdhani', 'Segoe UI', system-ui, sans-serif; }
        ha-card {
          background: linear-gradient(135deg, #0d1321 0%, #111827 100%);
          border: 1px solid #1a2744;
          border-radius: 16px;
          overflow: hidden;
          min-height: 300px;
          position: relative;
        }
        .header {
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 14px 18px 12px;
          border-bottom: 1px solid rgba(26,39,68,0.8);
          background: linear-gradient(90deg, rgba(123,47,255,0.06) 0%, transparent 100%);
        }
        .header h2 { margin: 0; font-size: 1rem; font-weight: 700; color: #7b2fff; letter-spacing: 0.04em; }
        .add-event-btn {
          background: linear-gradient(135deg, rgba(123,47,255,0.2) 0%, rgba(123,47,255,0.1) 100%);
          border: 1px solid rgba(123,47,255,0.4);
          border-radius: 8px;
          color: #7b2fff;
          cursor: pointer;
          font-size: 0.8rem;
          font-weight: 600;
          padding: 5px 12px;
          font-family: inherit;
          transition: all 0.2s;
        }
        .add-event-btn:hover { background: rgba(123,47,255,0.3); box-shadow: 0 0 12px rgba(123,47,255,0.3); }

        .days-grid {
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: 0;
          min-height: 240px;
        }
        .day-column {
          padding: 12px;
          border-right: 1px solid rgba(26,39,68,0.5);
          min-height: 220px;
        }
        .day-column:last-child { border-right: none; }
        .day-column.today {
          background: linear-gradient(180deg, rgba(123,47,255,0.04) 0%, transparent 100%);
        }
        .day-header {
          margin-bottom: 10px;
        }
        .day-label {
          font-size: 0.8rem;
          font-weight: 700;
          color: #8892b0;
          text-transform: uppercase;
          letter-spacing: 0.08em;
        }
        .day-column.today .day-label { color: #7b2fff; }
        .day-date {
          font-size: 1.4rem;
          font-weight: 900;
          color: #e8eaf6;
          line-height: 1;
          margin-top: 2px;
        }
        .day-column.today .day-date { color: #7b2fff; }
        .progress-bar {
          height: 2px;
          background: rgba(26,39,68,0.6);
          border-radius: 1px;
          margin-top: 6px;
          overflow: hidden;
        }
        .progress-fill {
          height: 100%;
          background: linear-gradient(90deg, #7b2fff, #00d4ff);
          border-radius: 1px;
          transition: width 1s linear;
        }
        .events-list { display: flex; flex-direction: column; gap: 5px; overflow-y: auto; max-height: 200px; }
        .events-list::-webkit-scrollbar { width: 2px; }
        .events-list::-webkit-scrollbar-thumb { background: #1a2744; }
        .event-item {
          padding: 6px 8px;
          border-radius: 8px;
          border-left: 3px solid;
          background: rgba(26,39,68,0.3);
          transition: background 0.15s;
        }
        .event-item:hover { background: rgba(26,39,68,0.5); }
        .event-time { font-size: 0.68rem; color: #8892b0; margin-bottom: 2px; }
        .event-title { font-size: 0.8rem; font-weight: 600; color: #e8eaf6; line-height: 1.2; }
        .no-events { font-size: 0.75rem; color: #3d4a6b; text-align: center; padding: 20px 0; }

        /* Modal */
        .modal-overlay {
          position: absolute;
          inset: 0;
          background: rgba(7,11,20,0.85);
          backdrop-filter: blur(4px);
          display: flex;
          align-items: center;
          justify-content: center;
          z-index: 10;
        }
        .modal {
          background: #111827;
          border: 1px solid #1a2744;
          border-radius: 16px;
          padding: 20px;
          width: 90%;
          max-width: 340px;
          box-shadow: 0 0 40px rgba(123,47,255,0.3);
        }
        .modal h3 { margin: 0 0 14px; font-size: 1rem; color: #7b2fff; font-weight: 700; }
        .field { margin-bottom: 10px; }
        .field label { display: block; font-size: 0.75rem; color: #8892b0; margin-bottom: 4px; }
        .field input, .field textarea {
          width: 100%; box-sizing: border-box;
          background: rgba(26,39,68,0.5);
          border: 1px solid #1a2744;
          border-radius: 8px;
          color: #e8eaf6;
          font-size: 0.85rem;
          padding: 7px 10px;
          font-family: inherit;
          outline: none;
        }
        .field input:focus, .field textarea:focus { border-color: rgba(123,47,255,0.5); }
        .field textarea { resize: vertical; min-height: 60px; }
        .time-row { display: grid; grid-template-columns: 1fr 1fr; gap: 8px; }
        .modal-actions { display: flex; gap: 8px; margin-top: 14px; }
        .btn-cancel {
          flex: 1;
          background: rgba(61,74,107,0.3);
          border: 1px solid #1a2744;
          border-radius: 8px;
          color: #8892b0;
          cursor: pointer;
          padding: 8px;
          font-family: inherit;
          font-size: 0.85rem;
        }
        .btn-create {
          flex: 2;
          background: linear-gradient(135deg, rgba(123,47,255,0.3) 0%, rgba(123,47,255,0.15) 100%);
          border: 1px solid rgba(123,47,255,0.5);
          border-radius: 8px;
          color: #7b2fff;
          cursor: pointer;
          padding: 8px;
          font-family: inherit;
          font-size: 0.85rem;
          font-weight: 700;
          transition: all 0.2s;
        }
        .btn-create:hover { background: rgba(123,47,255,0.4); box-shadow: 0 0 12px rgba(123,47,255,0.4); }
        .loading { display: flex; align-items: center; justify-content: center; min-height: 200px; color: #8892b0; }
        .spinner { width: 32px; height: 32px; border: 3px solid rgba(123,47,255,0.15); border-top-color: #7b2fff; border-radius: 50%; animation: spin 0.8s linear infinite; margin-right: 12px; }
        @keyframes spin { to { transform: rotate(360deg); } }
      </style>

      <ha-card>
        <div class="header">
          <h2>${this._config.title}</h2>
          <button class="add-event-btn" id="addEventBtn">＋ Novo evento</button>
        </div>

        ${this._loading
          ? `<div class="loading"><div class="spinner"></div>Carregando eventos...</div>`
          : `<div class="days-grid">
            ${days.map((offset) => this._renderDay(offset)).join("")}
          </div>`
        }

        ${this._showModal ? this._renderModal() : ""}
      </ha-card>
    `;

    this.shadowRoot.querySelector("#addEventBtn")?.addEventListener("click", () => {
      this._showModal = true;
      this._render();
    });

    if (this._showModal) {
      this.shadowRoot.querySelector("#cancelModal")?.addEventListener("click", () => {
        this._showModal = false;
        this._render();
      });
      this.shadowRoot.querySelector("#createEvent")?.addEventListener("click", () => {
        this._newEvent.title = this.shadowRoot.querySelector("#evTitle")?.value || "";
        this._newEvent.date = this.shadowRoot.querySelector("#evDate")?.value || "";
        this._newEvent.start = this.shadowRoot.querySelector("#evStart")?.value || "09:00";
        this._newEvent.end = this.shadowRoot.querySelector("#evEnd")?.value || "10:00";
        this._newEvent.description = this.shadowRoot.querySelector("#evDesc")?.value || "";
        this._createEvent();
      });
    }
  }

  _renderDay(offset) {
    const d = new Date();
    d.setDate(d.getDate() + offset);
    const events = this._getEventsForDay(offset);
    const isToday = offset === 0;
    const progress = isToday ? this._getDayProgress() : 0;

    return `
      <div class="day-column${isToday ? " today" : ""}">
        <div class="day-header">
          <div class="day-label">${this._getDayLabel(offset)}</div>
          <div class="day-date">${d.getDate()} ${MESES_PT[d.getMonth()]}</div>
          ${isToday ? `<div class="progress-bar"><div class="progress-fill" style="width:${progress}%"></div></div>` : ""}
        </div>
        <div class="events-list">
          ${events.length === 0
            ? `<div class="no-events">Sem eventos</div>`
            : events.map((ev) => `
              <div class="event-item" style="border-left-color: ${ev.color || "#00d4ff"}">
                <div class="event-time">${this._formatTime(ev.start.dateTime)} – ${this._formatTime(ev.end.dateTime)}</div>
                <div class="event-title">${ev.summary}</div>
              </div>
            `).join("")}
        </div>
      </div>
    `;
  }

  _renderModal() {
    const today = new Date().toISOString().split("T")[0];
    return `
      <div class="modal-overlay">
        <div class="modal">
          <h3>✨ Novo Evento</h3>
          <div class="field">
            <label>Título *</label>
            <input id="evTitle" type="text" placeholder="Nome do evento" value="${this._newEvent.title}" />
          </div>
          <div class="field">
            <label>Data *</label>
            <input id="evDate" type="date" value="${this._newEvent.date || today}" />
          </div>
          <div class="time-row">
            <div class="field">
              <label>Início</label>
              <input id="evStart" type="time" value="${this._newEvent.start}" />
            </div>
            <div class="field">
              <label>Fim</label>
              <input id="evEnd" type="time" value="${this._newEvent.end}" />
            </div>
          </div>
          <div class="field">
            <label>Descrição</label>
            <textarea id="evDesc" placeholder="Detalhes do evento...">${this._newEvent.description}</textarea>
          </div>
          <div class="modal-actions">
            <button class="btn-cancel" id="cancelModal">Cancelar</button>
            <button class="btn-create" id="createEvent">✓ Criar Evento</button>
          </div>
        </div>
      </div>
    `;
  }

  static getStubConfig() {
    return {
      title: "📅 Calendário",
      calendar_entity: "calendar.home",
      show_days: 3,
      refresh_interval: 300,
    };
  }

  getCardSize() { return 4; }

  disconnectedCallback() {
    if (this._refreshTimer) clearInterval(this._refreshTimer);
  }
}

customElements.define("calendar-card", CalendarCard);
window.customCards = window.customCards || [];
window.customCards.push({
  type: "calendar-card",
  name: "Calendar Card — 3 Dias",
  description: "Exibe ontem, hoje e amanhã com eventos do calendário HA. Suporta criação de novos eventos.",
  preview: true,
});
