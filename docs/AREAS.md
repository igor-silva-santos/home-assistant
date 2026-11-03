# Áreas do Home Assistant no dashboard

O Lovelace deste projeto lista entidades **por cômodo no YAML** (`room-card` + `entities:`).  
Migrar para **Áreas nativas do HA** reduz manutenção quando você adiciona dispositivos.

## Passo 1 — Criar áreas

1. **Configurações → Áreas, rótulos e zonas → Áreas**
2. Crie: Sala, Quarto, Cozinha, Banheiro, Escritório, Área externa (ou equivalente)
3. Em cada **Dispositivo**, atribua a área correta

## Passo 2 — Conferir entidades

**Ferramentas de desenvolvedor → Estados** → filtre por área (ou use a UI de entidades).

Anote os `entity_id` por ambiente e preencha [`ENTITY-MAP.md`](./ENTITY-MAP.md).

## Passo 3 — Estratégias de migração

| Estratégia | Quando usar |
|------------|-------------|
| **Renomear entity_id** | Poucos dispositivos; quer manter YAML atual |
| **Editar `comodos.yaml`** | Nomes Tuya/Hue diferentes dos placeholders |
| **Auto-entities (HACS)** | Card `custom:auto-entities` filtrando `area: sala` |
| **Manter room-card** | Controle visual fino (ícones, sliders) — atualize só a lista `entities` |

Exemplo **auto-entities** (requer HACS):

```yaml
type: custom:auto-entities
filter:
  include:
    - area: sala
      domain: light
    - area: sala
      domain: switch
card:
  type: entities
  title: Sala
```

## Passo 4 — Planta 3D (NextFloor)

No editor NextFloor, vincule cada lâmpada/AC ao **mesmo** `entity_id` usado no `room-card`.

No `room-card` da aba **Cômodos**:

```yaml
navigate_to_3d: /lovelace/planta3d
nextfloor_room: room_xxxxxxxx   # ID copiado do editor NextFloor (opcional)
```

O botão **3D** no card grava `nextfloor_start_room` no `sessionStorage` antes de abrir a aba (hook reservado para integrações futuras; o card NextFloor usa sobretudo o `room:` no YAML da view).

## Passo 5 — Produção

Desative pacotes demo quando todas as entidades reais existirem — ver [`ENTITY-MAP.md`](./ENTITY-MAP.md).
