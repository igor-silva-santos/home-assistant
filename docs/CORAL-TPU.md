# Google Coral USB TPU no Frigate

Acelera detecção de objetos (pessoa, carro…) e reduz CPU quando o Frigate roda com várias câmeras.

## Hardware

- **Google Coral USB Accelerator** (Edge TPU)
- Porta USB 3.0 no servidor (evite hub fraco)

## 1. Verificar no host Linux

```bash
lsusb | grep -i coral
# ou: Google Inc. Edge TPU
```

Se não aparecer, teste outro cabo/porta USB.

## 2. Docker Compose

O serviço `frigate` já expõe USB:

```yaml
devices:
  - /dev/bus/usb:/dev/bus/usb
```

Em **Linux VPS**, isso costuma bastar. No **Windows/Mac** Docker Desktop, TPU USB frequentemente **não passa** — rode Frigate em Linux bare metal ou VM com USB passthrough.

Opcional: fixar dispositivo (evita troca de `/dev/bus/usb/00X`):

```yaml
# devices:
#   - /dev/apex_0:/dev/apex_0
```

Descubra o nó após plugar o Coral (`dmesg | tail`).

## 3. Config Frigate

Use [`config-examples/frigate-config-coral.example.yml`](../config-examples/frigate-config-coral.example.yml) como base:

```yaml
detectors:
  coral:
    type: edgetpu
    device: usb
```

Copie para `frigate/config.yml` (gitignored) e reinicie:

```bash
docker compose restart frigate
```

Logs: `docker compose logs frigate | grep -i edgetpu`

## 4. Validar

1. Frigate UI → **System** → detector `coral` ativo
2. FPS de detecção sobe; CPU do host cai
3. Integração HA (`FRIGATE-PRODUCTION.md`) recebe eventos normalmente

## 5. Fallback CPU

Se o Coral falhar, Frigate usa detector `cpu` (já no exemplo). Remova bloco `coral` temporariamente.

## Troubleshooting

| Erro | Ação |
|------|------|
| `No EdgeTPU device found` | USB não visível no container; `privileged: true` + devices |
| Coral quente / reset | Alimentação USB adequada; porta USB3 direta |
| Múltiplos Corals | `device: usb:0` / `usb:1` na doc Frigate |

Referências: [Frigate Edge TPU](https://docs.frigate.video/configuration/object_detectors/) · [`FRIGATE-PRODUCTION.md`](./FRIGATE-PRODUCTION.md)
