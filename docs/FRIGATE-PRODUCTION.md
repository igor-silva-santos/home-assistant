# Frigate NVR — produção (substituir demo)

Use este guia quando tiver **câmeras RTSP** e quiser trocar o pacote `demo_seguranca` (PR #3) por Frigate real.

## Arquitetura

```text
Câmeras RTSP → Frigate (Docker) → integração HA → aba Segurança
```

Stack prevista em `docker-compose.yml` (serviço `frigate`, porta 5000).

## 1. Configurar Frigate

1. Copie `config-examples/frigate-config.example.yml` → `frigate/config.yml`
2. Ajuste URLs RTSP e senhas
3. `docker compose up -d frigate`
4. UI: `http://<servidor>:5000`

## 2. Home Assistant

1. HACS → integração **Frigate**
2. Copie `config-examples/frigate-ha.yaml` para `configuration.yaml`
3. Reinicie o HA

## 3. Mapeamento Lovelace

| Placeholder (`seguranca.yaml`) | Entidade real típica |
|--------------------------------|----------------------|
| `camera.camera_01` | `camera.entrada` |
| `binary_sensor.frigate_camera_01_motion` | `binary_sensor.entrada_motion` |
| `binary_sensor.frigate_camera_01_person` | `binary_sensor.entrada_person` |

Renomeie IDs no HA ou edite o YAML.

## 4. Desativar demo

Remova `packages/demo_seguranca.yaml` do carregamento e reinicie.

## 5. Coral TPU

Ver `docker-compose.yml` (USB) e docs Frigate — item no README roadmap.

Detalhes de deploy: [`DOCKER-VPS.md`](./DOCKER-VPS.md).
