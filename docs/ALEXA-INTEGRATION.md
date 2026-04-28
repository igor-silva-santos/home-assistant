# 🎙️ Integração com Amazon Alexa

## Métodos disponíveis

Existem duas abordagens principais para integrar Alexa ao Home Assistant:

### Opção 1 — Alexa Media Player (HACS) ← Recomendado

Controla os dispositivos Echo como entidades de mídia. Permite TTS (texto para fala), anúncios, sincronização de listas de compras.

### Opção 2 — Nabu Casa + Alexa Smart Home

Expõe dispositivos HA para a Alexa como dispositivos smart home. Requer assinatura Nabu Casa (~$6.50/mês) ou configuração manual de servidor.

---

## Instalação: Alexa Media Player (HACS)

### 1. Instalar via HACS

HA → HACS → Integrações → Buscar: **Alexa Media Player** → Instalar → Reiniciar

### 2. Configurar

HA → Configurações → Integrações → Adicionar → **Alexa Media Player**

Faça login com sua conta Amazon quando solicitado.

### 3. Entidades geradas

Cada dispositivo Echo se torna uma entidade `media_player.*`:
- `media_player.echo_sala`
- `media_player.echo_quarto`
- `media_player.echo_escritorio`

### 4. Usar TTS / Anúncios

```yaml
# Em automations.yaml:
service: notify.alexa_media
data:
  target: media_player.echo_sala
  message: "Olá! Sua mensagem aqui."
  data:
    type: announce  # anuncia em todos os Echos
    method: all     # ou "speak" para TTS normal
```

### 5. Anunciar em múltiplos dispositivos

```yaml
service: notify.alexa_media
data:
  target:
    - media_player.echo_sala
    - media_player.echo_quarto
  message: "Alguém está na porta!"
  data:
    type: announce
```

---

## Sincronização da Lista de Compras

O `reminder-card.js` salva itens em `shopping_list` do HA. Para sincronizar com a lista da Alexa:

### Via Alexa Media Player

```yaml
# Automação: quando a lista muda, anuncia no Echo
automation:
  - alias: "Sync Lista Compras → Alexa"
    trigger:
      platform: event
      event_type: shopping_list_updated
    action:
      service: notify.alexa_media
      data:
        target: media_player.echo_cozinha
        message: "Lista de compras atualizada."
        data:
          type: tts
```

### Via IFTTT (alternativa)

1. Crie uma Applet IFTTT: "Webhook → Add to Alexa Shopping List"
2. No HA, use o serviço `rest_command` para chamar o webhook IFTTT

---

## Criar Rotinas na Alexa que Triggeram Automações HA

### Método: HA como Action

1. Na app Alexa → Mais → Rotinas → ＋ Nova Rotina
2. Quando: "Quando digo 'Alexa, modo noturno'"
3. Ação: Smart Home → selecione um interruptor virtual do HA

### Criar interruptores virtuais (helpers)

```yaml
# No configuration.yaml:
input_boolean:
  alexa_modo_noturno:
    name: "Alexa Modo Noturno"
    icon: mdi:moon
```

Na Alexa, controle `input_boolean.alexa_modo_noturno`. No HA, crie uma automação que reage quando esse boolean muda.

---

## Comandos de voz úteis

| Comando | Ação |
|---------|------|
| "Alexa, modo noturno" | Ativa automação de modo noturno |
| "Alexa, apaga a luz da sala" | Controla `light.sala_principal` |
| "Alexa, temperatura da sala" | Lê `sensor.temperatura_sala` |
| "Alexa, adicione leite à lista" | Adiciona à lista de compras |

---

## Nabu Casa — Acesso Remoto Seguro

[Nabu Casa](https://www.nabucasa.com) (~$6.50/mês) oferece:
- Acesso remoto sem configurar port forwarding
- Integração oficial com Alexa e Google Assistant
- Certificado SSL automático
- Backup na nuvem

### Ativar

HA → Configurações → Home Assistant Cloud → Criar conta

Após ativar, em Alexa: "Alexa, descubra dispositivos" — todos os dispositivos HA aparecem automaticamente.
