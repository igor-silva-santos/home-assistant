#!/bin/bash
# ══════════════════════════════════════════════════════════════
#  setup.sh — Script de Instalação Automática
#  Dashboard Futurista Home Assistant
# ══════════════════════════════════════════════════════════════

set -euo pipefail

# Cores
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
CYAN='\033[0;36m'
BOLD='\033[1m'
RESET='\033[0m'

# Banner
echo ""
echo -e "${CYAN}${BOLD}"
echo "  ╔═══════════════════════════════════════╗"
echo "  ║   🏠 HA Futuristic Dashboard Setup    ║"
echo "  ║        Versão 2.0 — Igor Silva        ║"
echo "  ╚═══════════════════════════════════════╝"
echo -e "${RESET}"

# ── Detecção do diretório config do HA ────────────────────────
HA_CONFIG_DIR=""
POSSIBLE_DIRS=(
  "/config"                          # Docker / Home Assistant OS
  "/homeassistant"                   # HA supervised
  "$HOME/.homeassistant"             # HA core manual
  "/usr/share/hassio/homeassistant"  # Addon
)

for dir in "${POSSIBLE_DIRS[@]}"; do
  if [ -f "$dir/configuration.yaml" ]; then
    HA_CONFIG_DIR="$dir"
    break
  fi
done

if [ -z "$HA_CONFIG_DIR" ]; then
  echo -e "${YELLOW}⚠️  Não encontrei o diretório de configuração automaticamente.${RESET}"
  read -p "   Informe o caminho completo do config do HA: " HA_CONFIG_DIR
fi

echo -e "${GREEN}✅ Diretório HA Config: ${CYAN}$HA_CONFIG_DIR${RESET}"

# Diretório do projeto (onde este script está)
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_DIR="$(dirname "$SCRIPT_DIR")"

echo -e "${GREEN}✅ Diretório do Projeto: ${CYAN}$PROJECT_DIR${RESET}"
echo ""

# ── Backup do config existente ────────────────────────────────
BACKUP_DIR="$HA_CONFIG_DIR/backup_$(date +%Y%m%d_%H%M%S)"
echo -e "${YELLOW}📦 Criando backup em: $BACKUP_DIR${RESET}"
mkdir -p "$BACKUP_DIR"
for file in configuration.yaml ui-lovelace.yaml automations.yaml; do
  [ -f "$HA_CONFIG_DIR/$file" ] && cp "$HA_CONFIG_DIR/$file" "$BACKUP_DIR/" && echo "   backed up: $file"
done
echo -e "${GREEN}✅ Backup criado!${RESET}"
echo ""

# ── Copiar arquivos ───────────────────────────────────────────
echo -e "${CYAN}📋 Copiando arquivos de configuração...${RESET}"

# Criar diretórios destino
mkdir -p "$HA_CONFIG_DIR/themes"
mkdir -p "$HA_CONFIG_DIR/www"
mkdir -p "$HA_CONFIG_DIR/lovelace/views"
mkdir -p "$HA_CONFIG_DIR/lovelace/cards"
mkdir -p "$HA_CONFIG_DIR/docs"

# Copiar themes
cp "$PROJECT_DIR/themes/"*.yaml "$HA_CONFIG_DIR/themes/" 2>/dev/null && \
  echo -e "   ${GREEN}✅ Tema futuristic-dark.yaml copiado${RESET}"

# Copiar custom cards JS
cp "$PROJECT_DIR/www/"*.js "$HA_CONFIG_DIR/www/" 2>/dev/null && \
  echo -e "   ${GREEN}✅ Custom cards JS copiados (orbe, reminder, calendar, room)${RESET}"

# Copiar views Lovelace
cp "$PROJECT_DIR/lovelace/views/"*.yaml "$HA_CONFIG_DIR/lovelace/views/" 2>/dev/null && \
  echo -e "   ${GREEN}✅ Views Lovelace copiadas (home, comodos, energia, relatorios, automacoes, seguranca, config)${RESET}"

# Copiar cards YAML
cp "$PROJECT_DIR/lovelace/cards/"*.yaml "$HA_CONFIG_DIR/lovelace/cards/" 2>/dev/null && \
  echo -e "   ${GREEN}✅ Cards YAML copiados (device-tile, energy-chart, stats-bar)${RESET}"

# Perguntar antes de sobrescrever arquivos principais
for file in configuration.yaml ui-lovelace.yaml automations.yaml; do
  if [ -f "$HA_CONFIG_DIR/$file" ]; then
    read -p "⚠️  $file já existe. Sobrescrever? [s/N] " response
    if [[ "$response" =~ ^[Ss]$ ]]; then
      cp "$PROJECT_DIR/$file" "$HA_CONFIG_DIR/"
      echo -e "   ${GREEN}✅ $file atualizado${RESET}"
    else
      echo -e "   ${YELLOW}⏭️  $file mantido (sem alterações)${RESET}"
    fi
  else
    cp "$PROJECT_DIR/$file" "$HA_CONFIG_DIR/"
    echo -e "   ${GREEN}✅ $file copiado${RESET}"
  fi
done

echo ""

# ── Verificar HACS ────────────────────────────────────────────
echo -e "${CYAN}🔍 Verificando HACS...${RESET}"
if [ -d "$HA_CONFIG_DIR/custom_components/hacs" ]; then
  echo -e "   ${GREEN}✅ HACS instalado${RESET}"
else
  echo -e "   ${YELLOW}⚠️  HACS não encontrado.${RESET}"
  echo -e "   ${YELLOW}   Instale em: https://hacs.xyz/docs/setup/download${RESET}"
fi

# ── Verificar custom cards HACS ───────────────────────────────
echo ""
echo -e "${CYAN}🔍 Verificando custom cards necessários...${RESET}"

CARDS_DIR="$HA_CONFIG_DIR/www/community"
declare -A REQUIRED_CARDS=(
  ["mushroom"]="Mushroom — https://github.com/piitaya/lovelace-mushroom"
  ["apexcharts-card"]="ApexCharts Card — https://github.com/RomRider/apexcharts-card"
  ["layout-card"]="Layout Card — https://github.com/thomasloven/lovelace-layout-card"
  ["card-mod"]="Card Mod — https://github.com/thomasloven/lovelace-card-mod"
  ["mini-graph-card"]="Mini Graph Card — https://github.com/kalkih/mini-graph-card"
)

ALL_CARDS_OK=true
for card in "${!REQUIRED_CARDS[@]}"; do
  if [ -d "$CARDS_DIR/$card" ] || find "$HA_CONFIG_DIR/www" -name "${card}*" 2>/dev/null | grep -q .; then
    echo -e "   ${GREEN}✅ $card${RESET}"
  else
    echo -e "   ${RED}❌ $card não encontrado${RESET}"
    echo -e "      ${YELLOW}→ Instale via HACS: ${REQUIRED_CARDS[$card]}${RESET}"
    ALL_CARDS_OK=false
  fi
done

echo ""

# ── Permissões ────────────────────────────────────────────────
echo -e "${CYAN}🔐 Ajustando permissões...${RESET}"
chmod -R 755 "$HA_CONFIG_DIR/themes/" "$HA_CONFIG_DIR/www/" "$HA_CONFIG_DIR/lovelace/" 2>/dev/null
echo -e "   ${GREEN}✅ Permissões ajustadas${RESET}"

echo ""

# ── Resumo final ──────────────────────────────────────────────
echo -e "${CYAN}${BOLD}═══════════════════════════════════════════${RESET}"
echo -e "${GREEN}${BOLD}  ✅ Instalação concluída!${RESET}"
echo ""
echo -e "${BOLD}  Próximos passos:${RESET}"
echo -e "  1. Reinicie o Home Assistant"
echo -e "     ${CYAN}ha core restart${RESET} (HA OS)"
echo -e "     ${CYAN}docker compose restart homeassistant${RESET} (Docker)"
echo ""
echo -e "  2. Acesse o HA → Configurações → Temas"
echo -e "     → Selecione: ${CYAN}futuristic_dark${RESET}"
echo ""
if [ "$ALL_CARDS_OK" = false ]; then
  echo -e "  3. ${YELLOW}⚠️  Instale os custom cards faltantes via HACS${RESET}"
  echo -e "     ${CYAN}docs/SETUP.md${RESET} tem o guia completo"
fi
echo -e "${CYAN}${BOLD}═══════════════════════════════════════════${RESET}"
echo ""
