# 🛠️ Guia de Instalação — Dashboard Futurista HA

## Pré-requisitos

- Home Assistant 2024.1+
- HACS instalado
- Conta Google (para Google Calendar — opcional)
- Amazon Echo/Alexa (para integração — opcional)
- Câmeras RTSP (para aba Segurança — opcional)
- Roteador Huawei (para monitoramento de rede — opcional)

---

## Passo 1 — Instalar Home Assistant

### Opção A: Raspberry Pi / Mini PC (recomendado para iniciantes)
1. Baixe o [Home Assistant OS](https://www.home-assistant.io/installation/raspberrypi)
2. Flash no cartão SD com [Balena Etcher](https://www.balena.io/etcher/)
3. Conecte o Pi à rede via cabo ethernet
4. Acesse `http://homeassistant.local:8123`

### Opção B: VPS / Servidor com Docker
Veja `docs/DOCKER-VPS.md` para o guia completo de deploy.

### Opção C: Proxmox (máquina virtual)
1. Baixe a imagem `haos_ova-*.qcow2`
2. Importe no Proxmox como VM
3. Configure 4GB RAM, 32GB disco

---

## Passo 2 — Instalar HACS

```bash
# Via SSH no HA OS / Supervised:
wget -O - https://get.hacs.xyz | bash -

# Após instalar, reinicie o HA e adicione a integração HACS
# HA → Configurações → Integrações → Adicionar → HACS
```

Ou via [tutorial oficial](https://hacs.xyz/docs/setup/download).

---

## Passo 3 — Instalar Custom Cards via HACS

No HA → HACS → Frontend → buscar e instalar:

| Card | Função |
|------|--------|
| **Mushroom** | Cards modernos e bonitos |
| **ApexCharts Card** | Gráficos avançados (energia, rede) |
| **Layout Card** | Layout grid customizável |
| **Card Mod** | CSS customizado nos cards |
| **Mini Graph Card** | Sparklines (minigráficos) |
| **Tabbed Card** | Abas dentro de cards |
| **Frigate Card** | Viewer para câmeras Frigate |

Após instalar cada um, adicione ao `configuration.yaml` → `lovelace.resources` (já feito no arquivo do projeto).

---

## Passo 4 — Copiar arquivos do projeto

### Automático (recomendado):
```bash
bash scripts/setup.sh
```

### Manual:
```bash
cp themes/futuristic-dark.yaml /config/themes/
cp www/*.js /config/www/
cp -r lovelace/ /config/
cp configuration.yaml /config/   # ⚠️ Faça backup antes!
cp ui-lovelace.yaml /config/
cp automations.yaml /config/
```

---

## Passo 5 — Configurar entidades

Edite `configuration.yaml` e substitua os placeholders pelas suas entidades reais:

```yaml
# Exemplos de entidades para substituir:
light.sala_principal      → sua entidade de luz da sala
sensor.temperatura_sala   → seu sensor de temperatura
binary_sensor.campainha   → seu sensor de campainha
lock.porteira             → sua entidade de fechadura
camera.camera_01          → sua câmera RTSP
```

### Criar entidades obrigatórias (Helpers):

HA → Configurações → Helpers → Criar:

- `input_boolean.alarme_ativo`
- `input_boolean.alerta_campainha`
- `input_boolean.modo_noturno`
- `input_select.modo_casa`
- `input_number.tarifa_kwh`
- `input_text.tarefas_json`
- `input_text.lembretes_json`
- `input_text.compras_json`

Todos já declarados em `configuration.yaml` — reiniciar o HA os cria automaticamente.

---

## Passo 6 — Aplicar o tema

HA → Perfil do usuário → Tema → Selecionar **futuristic_dark**

Ou via automação (já incluída):
```yaml
service: frontend.set_theme
data:
  name: futuristic_dark
  mode: dark
```

---

## Configuração das câmeras RTSP (Aba Segurança)

### Adicionar câmera ao HA

No `configuration.yaml`:
```yaml
camera:
  - platform: generic
    name: "Câmera Entrada"
    still_image_url: "http://IP_CAMERA/snapshot.jpg"
    stream_source: "rtsp://usuario:senha@IP_CAMERA:554/stream1"
    verify_ssl: false
```

Ou use a integração nativa de câmeras ONVIF:
HA → Integrações → Adicionar → **ONVIF**

### Instalar Frigate NVR

Veja `docs/DOCKER-VPS.md` para instalação via Docker.

Após instalar, adicione ao `configuration.yaml`:
```yaml
# Integração Frigate (HACS)
frigate:
  host: localhost
  port: 5000
```

Entidades geradas pelo Frigate:
- `binary_sensor.frigate_camera_01_motion`
- `binary_sensor.frigate_camera_01_person`
- `camera.frigate_camera_01`
- `sensor.frigate_person_count`

---

## Configuração do Huawei Router (Aba Relatórios → Rede)

1. HACS → Integrações → buscar: **Huawei LTE**
2. Instalar e reiniciar o HA
3. HA → Configurações → Integrações → **Huawei LTE**
4. Informar IP do roteador (ex: `192.168.3.1`), usuário `admin` e senha

Entidades esperadas pelo dashboard:
```
sensor.huawei_download_speed        # Mbps download atual
sensor.huawei_upload_speed          # Mbps upload atual
sensor.huawei_connected_devices     # Número de dispositivos
binary_sensor.huawei_node_principal # Status nó principal
binary_sensor.huawei_node_satelite_1
binary_sensor.huawei_node_satelite_2
sensor.huawei_top1_device           # Top consumidor de banda
```

Se os nomes forem diferentes na sua integração, ajuste em `lovelace/views/relatorios.yaml`.

---

## Configuração do sensor de campainha

O card de alerta usa `binary_sensor.campainha`. Configure conforme seu hardware:

**Campainha Zigbee (ex: Sonoff SNZB-01):**
```yaml
# Adicionado automaticamente via Zigbee2MQTT ou ZHA
# A entidade é criada como binary_sensor.campainha_*
```

**Campainha via ESPHome (DIY):**
```yaml
binary_sensor:
  - platform: gpio
    pin: GPIO4
    name: "Campainha"
    device_class: occupancy
```

**Campainha via Shelly (i4):**
Adicione via integração Shelly — a entidade `binary_sensor.shelly_campainha` é criada automaticamente.

---

## Passo Final — Reiniciar e verificar

```bash
# HA OS:
ha core restart

# Docker:
docker compose restart homeassistant
```

Acesse `http://homeassistant.local:8123` → o dashboard deve estar funcional!

Se algum card mostrar erro, verifique:
1. O card HACS está instalado?
2. O recurso JS está registrado em `configuration.yaml`?
3. A entidade existe no HA?
