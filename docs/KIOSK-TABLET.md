# Tablet de parede (modo Kiosk)

Configurar um tablet fixo com a aba **Kiosk** (NextFloor fullscreen) ou o dashboard completo.

## 1. View no projeto

Já incluída em `ui-lovelace.yaml`:

| Aba | Path | Uso |
|-----|------|-----|
| **Kiosk** | `/lovelace/kiosk` | 3D fullscreen, `quality: low` |
| **Planta 3D** | `/lovelace/planta3d` | 3D + cenas |

URL direta (substitua host):

```text
https://homeassistant.seudominio.com/lovelace/kiosk
```

## 2. Usuário dedicado (recomendado)

1. **Configurações → Pessoas → Adicionar usuário** (ex.: `tablet`)
2. Sem admin; só dashboards necessários
3. **Perfil** → tema **futuristic_dark**
4. **Configurações → Painéis de controle** → definir **Kiosk** como painel padrão desse usuário

Opcional: copie [`packages/kiosk_tablet.yaml.example`](../packages/kiosk_tablet.yaml.example) → `packages/kiosk_tablet.yaml` para script de atalho.

## 3. Fully Kiosk Browser (Android)

1. Instale [Fully Kiosk](https://www.fully-kiosk.com/) no tablet
2. **Start URL:** URL do `/lovelace/kiosk` acima
3. **Web content settings:** permitir autoplay, manter tela ligada
4. **Motion detection / screensaver:** desligar ou alinhar com `idle_return` do NextFloor
5. **Kiosk mode:** PIN de saída para manutenção

Credenciais: salve login HA no Fully (modo seguro) ou use [Trusted Networks](https://www.home-assistant.io/docs/authentication/#trusted-networks) só na VLAN do tablet.

## 4. Home Assistant Companion

- App oficial → abrir bookmark `/lovelace/kiosk`
- Android: **Settings → Companion app → Full screen** / pinar app

## 5. Ajustes visuais

- NextFloor: [`NEXTFLOOR-THEME.md`](./NEXTFLOOR-THEME.md) (PR #4) — accent `#00d4ff`, `quality: low`
- Brilho noturno: view kiosk usa `night: sun` (NextFloor escurece ao pôr do sol)

## 6. Checklist rápido

- [ ] Tablet na Wi-Fi da casa (mesma VLAN do HA)
- [ ] Usuário `tablet` sem privilégios admin
- [ ] Painel padrão = **Kiosk**
- [ ] NextFloor instalado e plano desenhado
- [ ] Teste toque: lâmpada 3D ↔ entidade real

Atalho no dashboard: aba **Config** → botão **Modo Kiosk**.

## Troubleshooting

| Problema | Ação |
|----------|------|
| Tela branca | NextFloor não instalado; instale integração HACS |
| Logout constante | Trusted networks ou salvar sessão no Fully |
| Lento | `quality: low` em `kiosk.yaml`; tablet mais recente |

Ver também: [`CONNECT-HA-3D.md`](./CONNECT-HA-3D.md) · [`DEPLOY-CHECKLIST.md`](./DEPLOY-CHECKLIST.md)
