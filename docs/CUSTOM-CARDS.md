# 🃏 Documentação dos Custom Cards

## orbe-card.js — Lançamentos da Semana

Carrossel horizontal de lançamentos de jogos, séries, filmes e animes.

### Configuração YAML

```yaml
type: custom:orbe-card
title: "🚀 Lançamentos da Semana"
api_url: "https://api.orbe.com/lancamentos"
api_key: !secret orbe_api_key     # opcional
refresh_interval: 21600            # segundos (padrão: 6h)
categorias:
  - jogo
  - serie
  - filme
  - anime
max_items: 10
```

### Propriedades

| Propriedade | Tipo | Padrão | Descrição |
|------------|------|--------|-----------|
| `title` | string | "Lançamentos da Semana" | Título do card |
| `api_url` | string | obrigatório | URL da API de lançamentos |
| `api_key` | string | vazio | Token Bearer da API |
| `refresh_interval` | number | 21600 | Intervalo de atualização em segundos |
| `categorias` | list | todos | Filtro: jogo, serie, filme, anime |
| `max_items` | number | 10 | Máximo de itens no carrossel |

### Formato da API esperado

```json
{
  "lancamentos": [
    {
      "titulo": "GTA VI",
      "categoria": "jogo",
      "data": "2026-05-15",
      "poster": "https://url-do-poster.jpg",
      "descricao": "O retorno à Vice City",
      "plataforma": "PS5, Xbox, PC",
      "rating": 9.8
    }
  ]
}
```

Se a API estiver offline, usa dados mock embutidos automaticamente.

---

## reminder-card.js — Lembretes & Tarefas

Card com 4 abas: Tarefas, Lembretes, Compras, Importante.

### Configuração YAML

```yaml
type: custom:reminder-card
title: "📋 Lembretes & Tarefas"
storage_entity_tarefas: input_text.tarefas_json
storage_entity_lembretes: input_text.lembretes_json
storage_entity_compras: input_text.compras_json
notify_service: notify.alexa_media
alexa_entity: media_player.echo_sala
shopping_list_integration: true
```

### Propriedades

| Propriedade | Tipo | Padrão | Descrição |
|------------|------|--------|-----------|
| `storage_entity_tarefas` | entity | — | input_text para persistir tarefas |
| `storage_entity_lembretes` | entity | — | input_text para persistir lembretes |
| `storage_entity_compras` | entity | — | input_text para persistir compras |
| `notify_service` | string | vazio | Serviço para notificações de lembrete |
| `alexa_entity` | entity | vazio | Dispositivo Alexa para anúncios |
| `shopping_list_integration` | bool | true | Sincroniza com shopping_list do HA |

### Funcionalidades

- Adicionar, editar, excluir, marcar como concluído
- Reordenar por arrastar (drag & drop)
- Marcar como importante (⭐ → aparece na aba Importante)
- Lembretes com horário disparam notificação
- Itens concluídos ficam riscados com animação
- Persistência automática em localStorage + input_text HA

---

## calendar-card.js — Calendário 3 Dias

Exibe ontem, hoje e amanhã com eventos do calendário HA.

### Configuração YAML

```yaml
type: custom:calendar-card
title: "📅 Calendário"
calendar_entity: calendar.home
show_days: 3
refresh_interval: 300
```

### Propriedades

| Propriedade | Tipo | Padrão | Descrição |
|------------|------|--------|-----------|
| `calendar_entity` | entity | calendar.home | Entidade de calendário HA |
| `show_days` | number | 3 | Número de dias (centrado em hoje) |
| `refresh_interval` | number | 300 | Atualização em segundos |

### Criar evento

Clique no botão **＋ Novo evento** para abrir o modal de criação. O card chama `calendar.create_event` com os dados preenchidos.

---

## room-card.js — Card Modular de Cômodo

Card visual de ambiente com grid de dispositivos, toggle master e sensores.

### Configuração YAML

```yaml
type: custom:room-card
room: sala
name: "Sala de Estar"
icon: mdi:sofa
navigate_to: /lovelace/comodos   # opcional
entities:
  - entity: light.sala_principal
    name: "Luz Principal"
    show_brightness: true        # slider de brilho
  - entity: switch.tv_sala
    name: "TV 65\""
    show_power: true             # mostra wattagem se disponível
  - entity: sensor.temperatura_sala
    name: "Temperatura"
    icon: mdi:thermometer        # ícone customizado
```

### Propriedades

| Propriedade | Tipo | Padrão | Descrição |
|------------|------|--------|-----------|
| `name` | string | "Cômodo" | Nome do ambiente |
| `room` | string | "room" | ID interno (para referência) |
| `icon` | string | mdi:home | Ícone MDI do cômodo |
| `navigate_to` | string | null | URL para navegar ao tocar no cabeçalho |
| `entities` | list | [] | Lista de entidades do cômodo |

### Configuração de entidade

```yaml
entities:
  - entity: light.minha_luz       # entity_id obrigatório
    name: "Minha Luz"             # nome exibido
    icon: mdi:ceiling-light       # ícone personalizado
    show_brightness: true         # mostra slider de brilho (lights)
    show_power: true              # mostra consumo em watts
    type: sensor                  # forçar como sensor (não togglável)
```

### Comportamento visual

- Dispositivo LIGADO: fundo ciano, ícone com glow pulsante
- Dispositivo DESLIGADO: fundo cinza escuro
- Toggle master: liga/desliga todos os dispositivos controláveis do cômodo
- Card brilha com glow ciano quando há dispositivos ligados
