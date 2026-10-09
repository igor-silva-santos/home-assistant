# ══════════════════════════════════════════════════════════════
#  Dockerfile — Home Assistant Futuristic Dashboard
#  Base: ghcr.io/home-assistant/home-assistant:stable
# ══════════════════════════════════════════════════════════════

FROM ghcr.io/home-assistant/home-assistant:stable

# Labels
LABEL maintainer="Igor Silva <igordasilvasantos38@gmail.com>"
LABEL description="Home Assistant com Dashboard Futurista"
LABEL version="2.0"

# Copia todas as configurações customizadas para /config
COPY ./themes       /config/themes
COPY ./www          /config/www
COPY ./lovelace     /config/lovelace
COPY ./packages     /config/packages
COPY ./docs         /config/docs

# Arquivos de configuração principais
COPY configuration.yaml   /config/configuration.yaml
COPY ui-lovelace.yaml     /config/ui-lovelace.yaml
COPY automations.yaml     /config/automations.yaml

# Scripts utilitários
COPY scripts/setup.sh /config/setup.sh
COPY scripts/jarvis.yaml /config/scripts/jarvis.yaml
RUN chmod +x /config/setup.sh

# Volumes — dados persistentes ficam fora da imagem
# Mapeados no docker-compose.yml
VOLUME ["/config"]

# Porta padrão do HA
EXPOSE 8123

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=60s --retries=3 \
  CMD curl -f http://localhost:8123/api/ || exit 1
