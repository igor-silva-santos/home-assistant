# Áreas do Home Assistant no dashboard

## Aba **Por área** (nova)

View `lovelace/views/comodos-auto.yaml` — requer **HACS → auto-entities**.

1. Instale **Auto Entities** (JohannesFirmann)
2. Descomente em `configuration.yaml`:
   ```yaml
   # - url: /hacsfiles/auto-entities/auto-entities.js
   ```
3. Crie áreas no HA com os **mesmos nomes** usados no YAML (`Sala`, `Quarto`, …) ou edite o YAML
4. Atribua cada dispositivo à área (**Configurações → Dispositivos → Área**)

Abra a aba **Por área** no dashboard. Novos dispositivos aparecem sozinhos quando têm área definida.

## Aba **Cômodos** (room-card)

Controle visual (sliders, botão 3D) — lista manual em `comodos.yaml`.  
Use quando quiser layout fixo ou modo demo.

## Migrar do demo para produção

| Fase | O que fazer |
|------|-------------|
| Demo | Pacotes `demo_*`; room-card com IDs placeholder |
| Híbrido | Áreas reais + aba **Por área**; room-card só nos cômodos principais |
| Produção | Desativar `packages/demo_*`; renomear entidades ou editar YAML |

Mapa de IDs: [`ENTITY-MAP.md`](./ENTITY-MAP.md).

## NextFloor

Vincule entidades do plano 3D aos mesmos `entity_id` das áreas.  
Tema/kiosk: ver [`NEXTFLOOR-THEME.md`](./NEXTFLOOR-THEME.md) (PR #4) ou [`CONNECT-HA-3D.md`](./CONNECT-HA-3D.md).
