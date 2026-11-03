# NextFloor — tema e tablet (kiosk)

Alinhar o visual 3D ao dashboard **futuristic_dark**.

## Cores

No card NextFloor (view **Planta 3D** ou **Kiosk**):

```yaml
type: custom:nextfloor-card
theme: neon
accent: "#00d4ff"   # mesmo ciano do tema futuristic-dark
quality: auto       # tablet fraco → low
```

No **NextFloor → Extensions / Aparência**, escolha look *Neon* se disponível.

## View Kiosk

- Aba **Kiosk** (`panel: true`, `fill: true`)
- Usuário HA dedicado (opcional) com dashboard padrão = Kiosk
- Browser: [Fully Kiosk Browser](https://www.fully-kiosk.com/) ou Chrome em tela cheia
- `idle_return` + `night: sun` já configurados em `lovelace/views/kiosk.yaml`

## Performance

| Tablet | `quality` | Dica |
|--------|-----------|------|
| Fire HD 8/10 antigo | `low` | Só aba Kiosk aberta |
| Android recente | `auto` | Planta 3D + cenas OK |
| Wall panel | `high` | Energia/weather off (`energy: false`) |

## Vínculo com room-card

Botão **3D** nos cards da aba **Cômodos** → `/lovelace/planta3d`.  
Detalhes de áreas: [`AREAS.md`](./AREAS.md).

Guia completo de instalação: [`CONNECT-HA-3D.md`](./CONNECT-HA-3D.md).
