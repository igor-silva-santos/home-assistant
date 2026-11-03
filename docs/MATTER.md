# Matter — novos dispositivos (guia prático)

Reduz dependência de nuvem Tuya/Smart Life ao comprar hardware **Matter** compatível com Home Assistant.

## Por que Matter neste projeto

| | Tuya cloud | Matter + HA local |
|---|------------|-------------------|
| Latência | Variável | Local |
| Mesmo Lovelace | `light.*` / `switch.*` | Idem |
| NextFloor / room-card | Vincula entity_id | Idem |

## 1. Preparar o Home Assistant

1. Atualize o HA (2024.1+; versões recentes melhoram Matter).
2. **Configurações → Dispositivos e serviços → Matter**.
3. Thread border router se o dispositivo exigir (HomePod, Nest Hub, OTBR…).

Doc: [integração Matter](https://www.home-assistant.io/integrations/matter/).

## 2. Comissionar

1. **Matter → Adicionar dispositivo** (QR ou código).
2. Atribua **Área** (alimenta aba **Por área**, PR #6).
3. Renomeie `entity_id` ou use só a aba automática.

## 3. Dashboard

1. Atualize [`ENTITY-MAP.md`](./ENTITY-MAP.md).
2. Vincule no NextFloor.
3. Remova entradas demo em `packages/` quando tudo for real.

## 4. Compras

- **Novos:** preferir Matter ou Zigbee local (ZHA/Z2M).
- **Tuya existente:** integrar só via HA.
- **Energia:** plugs Matter/Shelly → [`ENERGY-DASHBOARD.md`](./ENERGY-DASHBOARD.md) (PR #10).

## Referências

- [`SETUP.md`](./SETUP.md) · [`ENTITY-MAP.md`](./ENTITY-MAP.md) · [`producao.yaml.example`](../packages/producao.yaml.example)
