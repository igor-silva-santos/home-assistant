# 🐳 Deploy Docker & VPS — Home Assistant Futuristic Dashboard

Guia completo para rodar o dashboard em produção num VPS com Docker, banco de dados real, InfluxDB, Grafana e Frigate NVR.

---

## Pré-requisitos

**VPS Mínimo:**
- Ubuntu 22.04 LTS (recomendado)
- 2 vCPUs, 4 GB RAM, 40 GB SSD
- IP público ou domínio apontado para o servidor

**Portas a liberar no firewall:**
- 80/tcp (HTTP → redirect para HTTPS)
- 443/tcp (HTTPS)
- 8123/tcp (HA — se expor diretamente)
- 5000/tcp (Frigate UI — opcional, mantenha interno)

---

## 1. Instalar Docker + Docker Compose

```bash
# Atualizar sistema
sudo apt update && sudo apt upgrade -y

# Instalar dependências
sudo apt install -y curl git ca-certificates gnupg

# Instalar Docker (script oficial)
curl -fsSL https://get.docker.com | sudo sh

# Adicionar usuário ao grupo docker
sudo usermod -aG docker $USER
newgrp docker

# Verificar instalação
docker --version
docker compose version
```

---

## 2. Clonar o projeto

```bash
git clone https://github.com/seu-usuario/ha-futuristic-dashboard.git
cd ha-futuristic-dashboard
```

Ou copie manualmente os arquivos para `/opt/homeassistant/`.

---

## 3. Configurar variáveis de ambiente

```bash
# Copiar template
cp .env.example .env

# Editar com suas senhas REAIS
nano .env
```

Preencha OBRIGATORIAMENTE:
- `DB_PASSWORD` — senha forte para o PostgreSQL
- `INFLUX_PASSWORD` — senha do InfluxDB
- `INFLUX_TOKEN` — gere com: `openssl rand -base64 32`
- `GRAFANA_PASSWORD` — senha do Grafana
- `REDIS_PASSWORD` — senha do Redis
- `HA_DOMAIN` — seu domínio (ex: `ha.seudominio.com`)

Gere senhas seguras com:
```bash
openssl rand -base64 32
```

---

## 4. Configurar Frigate NVR

Crie o arquivo de configuração das câmeras:

```bash
mkdir -p frigate
cat > frigate/config.yml << 'EOF'
mqtt:
  host: localhost
  port: 1883

cameras:
  camera_01:
    ffmpeg:
      inputs:
        - path: rtsp://usuario:senha@IP_CAMERA_01:554/stream
          roles:
            - detect
            - rtmp
    detect:
      width: 1280
      height: 720
      fps: 5
    objects:
      track:
        - person
        - car
        - dog
        - cat

  camera_02:
    ffmpeg:
      inputs:
        - path: rtsp://usuario:senha@IP_CAMERA_02:554/stream
          roles:
            - detect
            - rtmp
    detect:
      width: 1280
      height: 720
      fps: 5
    objects:
      track:
        - person
        - car

detectors:
  cpu1:
    type: cpu
    num_threads: 3
  # Se tiver Coral USB TPU:
  # coral:
  #   type: edgetpu
  #   device: usb

record:
  enabled: true
  retain:
    days: 7
    mode: motion

snapshots:
  enabled: true
  retain:
    default: 10

birdseye:
  enabled: true
  width: 1280
  height: 720
  quality: 8
  mode: motion
EOF
```

---

## 5. Subir a stack

```bash
# Build e iniciar todos os serviços
docker compose up -d

# Acompanhar logs
docker compose logs -f homeassistant

# Verificar status
docker compose ps
```

Aguarde ~2 minutos para o HA inicializar. Acesse em `http://SEU_IP:8123`.

---

## 6. Deploy com Coolify

[Coolify](https://coolify.io) é uma plataforma self-hosted de PaaS — alternativa ao Heroku/Vercel.

### Instalação do Coolify

```bash
# Instalar Coolify no VPS
curl -fsSL https://cdn.coollabs.io/coolify/install.sh | bash
```

### Deploy do projeto

1. Acesse `http://SEU_IP:8000` (painel do Coolify)
2. **New Project** → **New Resource** → **Docker Compose**
3. Aponte para o repositório Git do projeto
4. Configure as variáveis de ambiente (`.env`) no painel
5. Configure os domínios com SSL automático (Let's Encrypt)
6. Clique em **Deploy**

O Coolify lê o `.coolify.yml` para configurações avançadas.

---

## 7. Configurar PostgreSQL no HA

Após o PostgreSQL estar rodando, edite `configuration.yaml`:

```yaml
recorder:
  db_url: !secret db_url
  purge_keep_days: 30
```

Em `secrets.yaml`:
```yaml
db_url: "postgresql://hauser:SUA_SENHA@localhost/homeassistant"
```

Reinicie o HA:
```bash
docker compose restart homeassistant
```

---

## 8. Configurar InfluxDB no HA

Obtenha o token de acesso:
```bash
docker exec ha-influxdb influx auth list
```

Edite `configuration.yaml` — descomente a seção `influxdb:` e adicione ao `secrets.yaml`:
```yaml
influx_token: "seu-token-aqui"
```

---

## 9. Integrar Huawei Router (HACS)

Para monitorar a rede Huawei Mesh:

1. No HA → **HACS** → **Integrações** → buscar: `Huawei LTE`
2. Instalar `Huawei LTE` 
3. HA → **Configurações** → **Integrações** → Adicionar `Huawei LTE`
4. Informar IP do roteador, usuário e senha

Entidades geradas automaticamente:
- `sensor.huawei_download_speed`
- `sensor.huawei_upload_speed`
- `sensor.huawei_connected_devices`
- `binary_sensor.huawei_node_principal`

Para Huawei Mesh com múltiplos nós, instale também: **Huawei Mesh** via HACS.

---

## 10. Backup automático

### Backup PostgreSQL

```bash
# Criar script de backup
cat > /opt/backup-ha.sh << 'EOF'
#!/bin/bash
DATE=$(date +%Y%m%d_%H%M%S)
BACKUP_DIR="/opt/backups/ha"
mkdir -p "$BACKUP_DIR"

# Backup PostgreSQL
docker exec ha-postgres pg_dump -U hauser homeassistant | \
  gzip > "$BACKUP_DIR/postgres_$DATE.sql.gz"

# Backup InfluxDB
docker exec ha-influxdb influx backup /tmp/influx-backup
docker cp ha-influxdb:/tmp/influx-backup "$BACKUP_DIR/influx_$DATE"

# Manter apenas os últimos 7 dias
find "$BACKUP_DIR" -name "postgres_*.sql.gz" -mtime +7 -delete
find "$BACKUP_DIR" -name "influx_*" -type d -mtime +7 -exec rm -rf {} +

echo "✅ Backup concluído: $DATE"
EOF

chmod +x /opt/backup-ha.sh

# Agendar via cron (diariamente às 3h)
(crontab -l 2>/dev/null; echo "0 3 * * * /opt/backup-ha.sh >> /var/log/ha-backup.log 2>&1") | crontab -
```

---

## 11. Nginx + SSL com Let's Encrypt (manual)

Se não usar Coolify/Traefik:

```bash
sudo apt install -y nginx certbot python3-certbot-nginx

# Configurar virtual host
sudo cat > /etc/nginx/sites-available/homeassistant << 'EOF'
server {
    listen 80;
    server_name ha.seudominio.com;

    location / {
        proxy_pass http://localhost:8123;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
    }
}
EOF

sudo ln -s /etc/nginx/sites-available/homeassistant /etc/nginx/sites-enabled/
sudo nginx -t && sudo systemctl reload nginx

# Emitir certificado SSL
sudo certbot --nginx -d ha.seudominio.com -d grafana.seudominio.com \
  --email igordasilvasantos38@gmail.com --agree-tos --non-interactive
```

---

## Troubleshooting

**HA não inicia:**
```bash
docker compose logs homeassistant | tail -50
```

**PostgreSQL sem conexão:**
```bash
docker compose logs db
docker exec ha-postgres psql -U hauser -c "\l"
```

**Frigate sem câmera:**
```bash
docker compose logs frigate | grep -i error
# Verifique o RTSP URL da câmera com ffprobe
```

**Reiniciar serviço específico:**
```bash
docker compose restart homeassistant
docker compose restart frigate
```
