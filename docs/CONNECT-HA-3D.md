# Conectar dashboard + planta 3D ao Home Assistant

Guia prático para sair do template e ter controle real (2D + 3D), alinhado ao que a publicação do **House Control** mostra — mas usando **Home Assistant como hub** e **NextFloor** para o 3D dentro do HA.

## Visão geral

```text
Dispositivos (Tuya/Hue/ESPHome…)
        ↓ integrações HA
   entity_id (light.*, switch.*, climate.*)
        ↓
  Lovelace (room-card, cenas)  +  NextFloor (planta 3D)
```

## Passo 1 — Subir o stack

```bash
cp .env.example .env   # ajuste TZ, senhas DB se usar Postgres
docker compose up -d homeassistant
```

Ou no servidor existente:

```bash
bash scripts/setup.sh
```

O pacote **`packages/`** cria entidades **demo** para testar cards sem hardware. Mapa completo: [`ENTITY-MAP.md`](./ENTITY-MAP.md).

## Passo 2 — HACS (obrigatório para o dashboard atual)

Instale via HACS → Frontend:

| Componente | Uso |
|------------|-----|
| Mushroom | Cards da home / alertas |
| Card Mod | Estilos futuristas |
| Layout Card | Grid na view Home |
| Mini Graph Card | Energia |
| ApexCharts Card | Relatórios |

Descomente os recursos correspondentes em `configuration.yaml` → `lovelace.resources` após instalar.

## Passo 3 — NextFloor (planta 3D)

1. HACS → ⋮ → **Repositórios personalizados** → adicionar  
   `https://github.com/therealMRBK/NextFloor` como **Integração**.
2. Instalar **NextFloor** → reiniciar o HA.
3. **Configurações → Dispositivos e serviços → Adicionar integração → NextFloor**.
4. Abrir **NextFloor** na barra lateral → **Editor** → desenhar cômodos.
5. Em cada lâmpada/AC no plano, vincular ao `entity_id` (demo ou real).

Views já incluídas no projeto:

| Aba | Arquivo | Uso |
|-----|---------|-----|
| Planta 3D | `lovelace/views/planta3d.yaml` | Card 3D + cenas + toggles demo |
| Kiosk | `lovelace/views/kiosk.yaml` | Tablet (`panel: true`, `fill: true`, `quality: low`) |

Documentação upstream: [NextFloor README](https://github.com/therealMRBK/NextFloor).

### Cenas (estilo publicação)

Cenas em `packages/demo_cenas.yaml`: **Brilho**, **Aconchego**, **Filme**, **Noite**.  
Botões na aba Planta 3D chamam `scene.turn_on`.

## Passo 4 — Integrar dispositivos reais (contornando riscos)

### Smart Life / Tuya

- Preferir **Home Assistant → Tuya** (ou LocalTuya onde possível).
- Controle sempre via entidades HA; o Lovelace **não** fala com a nuvem Tuya direto.
- Ao adicionar um dispositivo, renomeie o `entity_id` para bater com o YAML **ou** edite `lovelace/views/comodos.yaml`.

### Philips Hue

- Integração nativa Hue → mapear `light.*` nos room-cards e no editor NextFloor.

### Performance em tablet

- Use a aba **Kiosk** só com NextFloor (`quality: low`).
- Mantenha a **Home** 2D sem abrir 3D na mesma view.
- Reduza animações `card-mod` se o tablet for antigo.

## Passo 5 — Validar entidades

```bash
python3 scripts/validate_lovelace_entities.py
```

Compare com [`ENTITY-MAP.md`](./ENTITY-MAP.md).

## Passo 6 — Testes manuais (demo)

1. **Cômodos** → togglar `light.sala_principal` (deve acender tile no room-card).
2. **Planta 3D** → ligar `input_boolean.demo_campainha` → alerta na Home (automação campainha).
3. **Home** → **Abrir Porteira** → `lock.porteira` desbloqueia (demo).
4. Após NextFloor: tocar lâmpada no 3D → mesma entidade muda no HA.

## Passo 7 — Produção (desligar demo)

1. Comente `homeassistant.packages` em `configuration.yaml`.
2. Mapeie cada linha de [`ENTITY-MAP.md`](./ENTITY-MAP.md) para entidades reais.
3. Regenerar demo no futuro: `python3 scripts/generate_demo_casa.py`.

## App Android estilo publicação (opcional)

O projeto [house-control-android](https://github.com/0xProbabillity/house-control-android) é **app separado** que também consome HA via token. Pode conviver com este dashboard; não substitui os custom cards do repo.

## Troubleshooting

| Sintoma | Causa provável | Ação |
|---------|----------------|------|
| Card “custom element doesn't exist” | HACS / JS não instalado | Instalar card ou registrar em `lovelace.resources` |
| Entidade unavailable | Demo desligado ou ID errado | Ativar packages ou corrigir YAML |
| NextFloor vazio | Plano não desenhado | Editor NextFloor |
| Cena não muda luz | entity_id diferente | Ajustar `demo_cenas.yaml` ou nomes das luzes |

---

## Tablet kiosk

Ver [`KIOSK-TABLET.md`](./KIOSK-TABLET.md): usuário dedicado, Fully Kiosk, URL `/lovelace/kiosk`.

Próximo passo recomendado no servidor: **HACS + NextFloor + reinício**, depois [`DEPLOY-CHECKLIST.md`](./DEPLOY-CHECKLIST.md).
