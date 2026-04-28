/**
 * ╔══════════════════════════════════════════════════════════╗
 * ║  ORBE CARD — Lançamentos da Semana                       ║
 * ║  Versão: 2.0  |  Home Assistant Custom Card              ║
 * ║  Web Component: <orbe-card>                              ║
 * ╚══════════════════════════════════════════════════════════╝
 *
 * Configuração YAML:
 *   type: custom:orbe-card
 *   title: "Lançamentos da Semana"
 *   api_url: "https://api.orbe.com/lancamentos"
 *   api_key: "SUA_CHAVE"           # opcional
 *   refresh_interval: 21600        # segundos (padrão: 6h)
 *   categorias:                    # filtrar categorias
 *     - jogo
 *     - serie
 *     - filme
 *     - anime
 *   max_items: 10
 */

// ── Dados Mock (fallback quando API indisponível) ─────────────
const MOCK_LANCAMENTOS = [
  {
    titulo: "GTA VI",
    categoria: "jogo",
    data: "2026-05-15",
    descricao: "O aguardado retorno à Vice City",
    plataforma: "PS5, Xbox, PC",
    poster: "https://via.placeholder.com/180x260/070b14/00d4ff?text=GTA+VI",
    rating: 9.8,
  },
  {
    titulo: "The Last of Us — Temporada 3",
    categoria: "serie",
    data: "2026-05-12",
    descricao: "A jornada de Ellie continua",
    plataforma: "HBO Max",
    poster: "https://via.placeholder.com/180x260/070b14/7b2fff?text=TLOU+S3",
    rating: 9.2,
  },
  {
    titulo: "Duna: Messiah",
    categoria: "filme",
    data: "2026-05-20",
    descricao: "A saga de Paul Atreides continua",
    plataforma: "Cinema",
    poster: "https://via.placeholder.com/180x260/070b14/ffd700?text=Duna+3",
    rating: 9.0,
  },
  {
    titulo: "Demon Slayer — Arco Final",
    categoria: "anime",
    data: "2026-05-10",
    descricao: "O confronto definitivo",
    plataforma: "Crunchyroll",
    poster: "https://via.placeholder.com/180x260/070b14/ff3366?text=Kimetsu",
    rating: 9.5,
  },
  {
    titulo: "Elden Ring 2",
    categoria: "jogo",
    data: "2026-05-28",
    descricao: "Um novo lands entre",
    plataforma: "PS5, Xbox, PC",
    poster: "https://via.placeholder.com/180x260/070b14/00ff88?text=Elden+Ring+2",
    rating: 9.7,
  },
  {
    titulo: "Severance — Temporada 3",
    categoria: "serie",
    data: "2026-05-08",
    descricao: "O mundo de Lumon se expande",
    plataforma: "Apple TV+",
    poster: "https://via.placeholder.com/180x260/070b14/00d4ff?text=Severance",
    rating: 9.3,
  },
];

const CATEGORIA_CONFIG = {
  jogo:   { label: "🎮 Jogo",   color: "#00d4ff", bg: "rgba(0,212,255,0.15)" },
  serie:  { label: "📺 Série",  color: "#7b2fff", bg: "rgba(123,47,255,0.15)" },
  filme:  { label: "🎬 Filme",  color: "#ffd700", bg: "rgba(255,215,0,0.15)" },
  anime:  { label: "🎌 Anime",  color: "#ff3366", bg: "rgba(255,51,102,0.15)" },
};

class OrbeCard extends HTMLElement {
  constructor() {
    super();
    this.attachShadow({ mode: "open" });
    this._config = {};
    this._lancamentos = [];
    this._loading = true;
    this._error = null;
    this._currentIndex = 0;
    this._refreshTimer = null;
    this._autoScrollTimer = null;
    this._cache = { data: null, timestamp: 0 };
  }

  // ── Configuração via HA ─────────────────────────────────────
  setConfig(config) {
    this._config = {
      title: config.title || "🚀 Lançamentos da Semana",
      api_url: config.api_url || "https://api.orbe.com/lancamentos",
      api_key: config.api_key || "",
      refresh_interval: (config.refresh_interval || 21600) * 1000,
      categorias: config.categorias || ["jogo", "serie", "filme", "anime"],
      max_items: config.max_items || 10,
    };
    this._fetchData();
    this._startRefreshTimer();
  }

  set hass(hass) {
    this._hass = hass;
  }

  // ── Busca dados da API ──────────────────────────────────────
  async _fetchData() {
    const now = Date.now();
    if (this._cache.data && now - this._cache.timestamp < this._config.refresh_interval) {
      this._lancamentos = this._cache.data;
      this._loading = false;
      this._render();
      return;
    }

    this._loading = true;
    this._render();

    try {
      const headers = { "Content-Type": "application/json" };
      if (this._config.api_key) {
        headers["Authorization"] = `Bearer ${this._config.api_key}`;
      }

      const url = `${this._config.api_url}?semana=atual&limit=${this._config.max_items}`;
      const response = await fetch(url, { headers, signal: AbortSignal.timeout(8000) });

      if (!response.ok) throw new Error(`HTTP ${response.status}`);

      const data = await response.json();
      const items = (data.lancamentos || data.results || data || [])
        .filter((l) => !this._config.categorias.length || this._config.categorias.includes(l.categoria))
        .slice(0, this._config.max_items);

      this._lancamentos = items;
      this._cache = { data: items, timestamp: now };
      this._error = null;
    } catch (err) {
      console.warn("[OrbeCard] API offline, usando dados mock:", err.message);
      this._lancamentos = MOCK_LANCAMENTOS.filter((l) =>
        this._config.categorias.includes(l.categoria)
      ).slice(0, this._config.max_items);
      this._error = "⚠️ Dados simulados (API offline)";
    }

    this._loading = false;
    this._render();
    this._startAutoScroll();
  }

  _startRefreshTimer() {
    if (this._refreshTimer) clearInterval(this._refreshTimer);
    this._refreshTimer = setInterval(() => this._fetchData(), this._config.refresh_interval);
  }

  _startAutoScroll() {
    if (this._autoScrollTimer) clearInterval(this._autoScrollTimer);
    this._autoScrollTimer = setInterval(() => {
      if (this._lancamentos.length > 1) {
        this._currentIndex = (this._currentIndex + 1) % this._lancamentos.length;
        this._scrollToCard(this._currentIndex);
      }
    }, 5000);
  }

  _scrollToCard(index) {
    const container = this.shadowRoot.querySelector(".carousel-track");
    if (!container) return;
    const card = container.children[index];
    if (card) card.scrollIntoView({ behavior: "smooth", inline: "center", block: "nearest" });
  }

  // ── Renderização ───────────────────────────────────────────
  _render() {
    const { title } = this._config;

    this.shadowRoot.innerHTML = `
      <style>
        :host {
          display: block;
          font-family: 'Rajdhani', 'Segoe UI', system-ui, sans-serif;
        }
        ha-card {
          background: linear-gradient(135deg, #0d1321 0%, #111827 100%);
          border: 1px solid #1a2744;
          border-radius: 16px;
          overflow: hidden;
          padding: 0;
          min-height: 300px;
        }
        .header {
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 14px 18px 10px;
          background: linear-gradient(90deg, rgba(0,212,255,0.06) 0%, transparent 100%);
          border-bottom: 1px solid rgba(26,39,68,0.8);
        }
        .header h2 {
          margin: 0;
          font-size: 1rem;
          font-weight: 700;
          color: #00d4ff;
          letter-spacing: 0.05em;
        }
        .refresh-btn {
          background: none;
          border: 1px solid rgba(0,212,255,0.3);
          border-radius: 8px;
          color: #00d4ff;
          cursor: pointer;
          padding: 4px 10px;
          font-size: 0.75rem;
          transition: all 0.2s;
        }
        .refresh-btn:hover { background: rgba(0,212,255,0.1); }
        .error-badge {
          font-size: 0.7rem;
          color: #ffd700;
          padding: 0 18px 6px;
          display: block;
        }
        .loading {
          display: flex;
          align-items: center;
          justify-content: center;
          height: 200px;
          color: #8892b0;
          flex-direction: column;
          gap: 12px;
        }
        .spinner {
          width: 36px; height: 36px;
          border: 3px solid rgba(0,212,255,0.15);
          border-top-color: #00d4ff;
          border-radius: 50%;
          animation: spin 0.8s linear infinite;
        }
        @keyframes spin { to { transform: rotate(360deg); } }

        /* Carrossel */
        .carousel-wrapper {
          position: relative;
          overflow: hidden;
          padding: 16px 0 12px;
        }
        .carousel-track {
          display: flex;
          gap: 14px;
          padding: 0 18px;
          overflow-x: auto;
          scroll-snap-type: x mandatory;
          scrollbar-width: none;
          -ms-overflow-style: none;
          -webkit-overflow-scrolling: touch;
        }
        .carousel-track::-webkit-scrollbar { display: none; }

        .item-card {
          flex: 0 0 160px;
          scroll-snap-align: start;
          border-radius: 14px;
          overflow: hidden;
          position: relative;
          cursor: pointer;
          border: 1px solid rgba(26,39,68,0.8);
          transition: transform 0.25s ease, box-shadow 0.25s ease;
          animation: slideIn 0.4s ease both;
        }
        .item-card:hover {
          transform: translateY(-4px) scale(1.03);
          box-shadow: 0 8px 32px rgba(0,0,0,0.5);
        }
        @keyframes slideIn {
          from { opacity: 0; transform: translateX(30px); }
          to   { opacity: 1; transform: translateX(0); }
        }

        .poster {
          width: 100%;
          height: 220px;
          object-fit: cover;
          display: block;
          background: #111827;
        }
        .poster-placeholder {
          width: 100%;
          height: 220px;
          background: linear-gradient(135deg, #0d1321, #1a2744);
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 2.5rem;
        }
        .overlay {
          position: absolute;
          bottom: 0; left: 0; right: 0;
          background: linear-gradient(to top, rgba(7,11,20,0.97) 0%, rgba(7,11,20,0.7) 60%, transparent 100%);
          padding: 36px 10px 10px;
        }
        .categoria-badge {
          display: inline-block;
          font-size: 0.65rem;
          font-weight: 700;
          padding: 2px 7px;
          border-radius: 9999px;
          margin-bottom: 5px;
          letter-spacing: 0.05em;
          text-transform: uppercase;
        }
        .titulo {
          font-size: 0.85rem;
          font-weight: 700;
          color: #e8eaf6;
          line-height: 1.2;
          margin-bottom: 3px;
          display: -webkit-box;
          -webkit-line-clamp: 2;
          -webkit-box-orient: vertical;
          overflow: hidden;
        }
        .data-estreia {
          font-size: 0.7rem;
          color: #8892b0;
        }
        .rating {
          position: absolute;
          top: 8px; right: 8px;
          background: rgba(7,11,20,0.9);
          border: 1px solid rgba(255,215,0,0.4);
          border-radius: 8px;
          padding: 2px 6px;
          font-size: 0.7rem;
          font-weight: 700;
          color: #ffd700;
        }

        /* Dots de navegação */
        .dots {
          display: flex;
          justify-content: center;
          gap: 6px;
          padding: 8px 0 4px;
        }
        .dot {
          width: 6px; height: 6px;
          border-radius: 50%;
          background: #1a2744;
          cursor: pointer;
          transition: all 0.3s;
        }
        .dot.active {
          background: #00d4ff;
          width: 18px;
          border-radius: 3px;
          box-shadow: 0 0 8px rgba(0,212,255,0.6);
        }
        .empty {
          text-align: center;
          padding: 40px 20px;
          color: #8892b0;
          font-size: 0.9rem;
        }
      </style>

      <ha-card>
        <div class="header">
          <h2>${title}</h2>
          <button class="refresh-btn" id="refreshBtn">↻ Atualizar</button>
        </div>
        ${this._error ? `<span class="error-badge">${this._error}</span>` : ""}

        ${this._loading
          ? `<div class="loading"><div class="spinner"></div><span>Buscando lançamentos...</span></div>`
          : this._lancamentos.length === 0
          ? `<div class="empty">😕 Nenhum lançamento encontrado para esta semana.</div>`
          : `
          <div class="carousel-wrapper">
            <div class="carousel-track" id="carouselTrack">
              ${this._lancamentos.map((l, i) => this._renderItem(l, i)).join("")}
            </div>
          </div>
          <div class="dots" id="dots">
            ${this._lancamentos.map((_, i) => `<div class="dot${i === this._currentIndex ? " active" : ""}" data-index="${i}"></div>`).join("")}
          </div>
        `}
      </ha-card>
    `;

    // Event listeners
    this.shadowRoot.querySelector("#refreshBtn")?.addEventListener("click", () => {
      this._cache = { data: null, timestamp: 0 };
      this._fetchData();
    });

    this.shadowRoot.querySelectorAll(".dot").forEach((dot) => {
      dot.addEventListener("click", (e) => {
        const idx = parseInt(e.target.dataset.index);
        this._currentIndex = idx;
        this._scrollToCard(idx);
        this._updateDots();
      });
    });

    const track = this.shadowRoot.querySelector("#carouselTrack");
    if (track) {
      track.addEventListener("scroll", () => {
        const cardWidth = 174; // 160 + 14 gap
        this._currentIndex = Math.round(track.scrollLeft / cardWidth);
        this._updateDots();
      });
    }
  }

  _renderItem(lancamento, index) {
    const cat = CATEGORIA_CONFIG[lancamento.categoria] || CATEGORIA_CONFIG.filme;
    const dataBR = lancamento.data
      ? new Date(lancamento.data + "T12:00:00").toLocaleDateString("pt-BR", { day: "2-digit", month: "short" })
      : "";
    const emojiBycat = { jogo: "🎮", serie: "📺", filme: "🎬", anime: "🎌" };

    return `
      <div class="item-card" style="border-color: ${cat.color}22; animation-delay: ${index * 0.06}s">
        ${lancamento.poster
          ? `<img class="poster" src="${lancamento.poster}" alt="${lancamento.titulo}" loading="lazy" onerror="this.style.display='none';this.nextElementSibling.style.display='flex'">`
          : ""}
        <div class="poster-placeholder" style="${lancamento.poster ? "display:none" : ""}">
          ${emojiBycat[lancamento.categoria] || "🎬"}
        </div>
        ${lancamento.rating ? `<div class="rating">⭐ ${lancamento.rating}</div>` : ""}
        <div class="overlay">
          <span class="categoria-badge" style="background:${cat.bg};color:${cat.color};border:1px solid ${cat.color}44">
            ${cat.label}
          </span>
          <div class="titulo">${lancamento.titulo}</div>
          ${dataBR ? `<div class="data-estreia">📅 ${dataBR}</div>` : ""}
        </div>
      </div>
    `;
  }

  _updateDots() {
    this.shadowRoot.querySelectorAll(".dot").forEach((dot, i) => {
      dot.classList.toggle("active", i === this._currentIndex);
    });
  }

  // ── HA Editor config ────────────────────────────────────────
  static getConfigElement() {
    return document.createElement("orbe-card-editor");
  }

  static getStubConfig() {
    return {
      title: "🚀 Lançamentos da Semana",
      api_url: "https://api.orbe.com/lancamentos",
      refresh_interval: 21600,
      categorias: ["jogo", "serie", "filme", "anime"],
      max_items: 10,
    };
  }

  getCardSize() { return 4; }

  disconnectedCallback() {
    if (this._refreshTimer) clearInterval(this._refreshTimer);
    if (this._autoScrollTimer) clearInterval(this._autoScrollTimer);
  }
}

customElements.define("orbe-card", OrbeCard);
window.customCards = window.customCards || [];
window.customCards.push({
  type: "orbe-card",
  name: "Orbe Card — Lançamentos da Semana",
  description: "Exibe os lançamentos de jogos, séries, filmes e animes da semana em carrossel com poster.",
  preview: true,
  documentationURL: "https://github.com/seu-usuario/ha-futuristic-dashboard#orbe-card",
});
