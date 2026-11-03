# House Control for Android (complemento)

App open source parecido com a publicação da **Liga do LoL**: planta 3D no celular/tablet Android, cenas e controle de luz/AC.

- Repositório: [0xProbabillity/house-control-android](https://github.com/0xProbabillity/house-control-android)
- Licença: MIT

## Como convive com este projeto

| | **Este repo (Lovelace + NextFloor)** | **House Control Android** |
|---|--------------------------------------|---------------------------|
| Onde roda | Browser / tablet no HA | App nativo Android |
| 3D | NextFloor no HA | Plano JSON próprio no app |
| Backend | Home Assistant | HA + token long-lived (opcional Tuya/Hue direto) |
| UI custom | `room-card`, tema futuristic | UI do app |

Recomendação: **uma fonte de verdade** — Home Assistant. Configure o app com o mesmo HA que alimenta o dashboard.

## Conectar ao seu Home Assistant

1. Instale o app (release ou build do GitHub).
2. No HA: **Perfil → Segurança → Tokens de longa duração** → criar token.
3. No app: URL `http://homeassistant.local:8123` (ou HTTPS público) + colar token.
4. Mapeie lâmpadas (`light.*`) e ACs (`climate.*`) no editor de planta do app.

Dispositivos controlados pelo app aparecem no HA como estados normais; o Lovelace e o NextFloor continuam refletindo as mesmas entidades.

## Quando usar cada um

- **Tablet na parede** → aba **Kiosk** / NextFloor neste dashboard ([`NEXTFLOOR-THEME.md`](./NEXTFLOOR-THEME.md) no PR #4).
- **Celular no bolso, UX da publicação** → House Control Android.
- **Automações, energia, Frigate** → permanecem no HA + views deste repo.

## Smart Life / Tuya

O app pode integrar Tuya via QR; no nosso stack preferimos **Tuya → HA → dashboard**. Evite controlar o mesmo dispositivo por dois caminhos conflitantes.

## Referências

- Setup HA + 3D no browser: [`CONNECT-HA-3D.md`](./CONNECT-HA-3D.md)
- Mapa de entidades: [`ENTITY-MAP.md`](./ENTITY-MAP.md)
