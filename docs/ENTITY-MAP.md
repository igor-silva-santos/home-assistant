# Mapa de entidades — Dashboard Futurista

Use esta tabela ao sair do **modo demo** (`packages/`) e conectar dispositivos reais (Tuya, Hue, ESPHome, etc.).

## Como mapear

1. HA → **Configurações → Dispositivos e serviços** → integração (ex.: Tuya).
2. Anote o `entity_id` real em **Ferramentas de desenvolvedor → Estados**.
3. Substitua no YAML do Lovelace **ou** crie **alias** (Configurações → Entidades → Renomear ID).
4. Rode `python3 scripts/validate_lovelace_entities.py` para ver referências ainda não documentadas aqui.

## Modo demo (já incluído no repo)

Com `homeassistant.packages` ativo, estas entidades existem via templates:

| entity_id | Origem demo | Teste rápido |
|-----------|-------------|--------------|
| light.sala_principal | template + helper | Aba Cômodos / room-card |
| light.sala_abajur | template + helper | idem |
| light.quarto_principal | template + helper | idem |
| light.quarto_bedside | template + helper | idem |
| light.cozinha | template + helper | idem |
| light.banheiro | template + helper | idem |
| light.escritorio | template + helper | idem |
| light.escritorio_mesa | template + helper | idem |
| light.area_externa | template + helper | idem |
| light.portao_luz | template + helper | idem |
| switch.tv_sala | template + helper | Toggle no room-card |
| switch.som_sala | template + helper | idem |
| switch.ar_condicionado_quarto | template + helper | idem |
| switch.geladeira | template + helper | idem |
| switch.microondas | template + helper | idem |
| switch.lava_loucas | template + helper | idem |
| switch.aquecedor_banheiro | template + helper | idem |
| switch.computador | template + helper | idem |
| switch.monitor_extra | template + helper | idem |
| switch.irrigacao | template + helper | idem |
| sensor.temperatura_sala | template estático | Valor fixo demo |
| sensor.temperatura_quarto | template estático | idem |
| sensor.temperatura_cozinha | template estático | idem |
| sensor.temperatura_banheiro | template estático | idem |
| sensor.temperatura_escritorio | template estático | idem |
| sensor.temperatura_externa | template estático | idem |
| sensor.umidade_quarto | template estático | idem |
| sensor.umidade_banheiro | template estático | idem |
| sensor.co2_escritorio | template estático | idem |
| sensor.chuva | template estático | idem |
| binary_sensor.movimento_sala | template + helper | Ligar `input_boolean.demo_movimento_sala` |
| binary_sensor.movimento_quarto | template + helper | helper demo |
| binary_sensor.movimento_banheiro | template + helper | helper demo |
| binary_sensor.movimento_externo | template + helper | helper demo |
| binary_sensor.fumaca_cozinha | template + helper | helper demo |
| binary_sensor.campainha | template + helper | `input_boolean.demo_campainha` |
| lock.porteira | template lock | Home → abrir porteira |
| sensor.consumo_diario_kwh | demo_energia | Sobe com luzes ligadas |
| sensor.consumo_mes_kwh | demo_energia | Derivado |
| sensor.consumo_dispositivo_1 | demo_energia | Energia home |
| sensor.consumo_dispositivo_2 | demo_energia | idem |
| sensor.consumo_dispositivo_3 | demo_energia | idem |
| sensor.custo_mes_estimado | configuration.yaml | Usa consumo_mes |
| sensor.dispositivos_ligados | configuration.yaml | Conta luzes/switches |
| sensor.saudacao | configuration.yaml | Template hora |
| scene.brilho | demo_cenas | Planta 3D → botões |
| scene.acconchego | demo_cenas | idem |
| scene.filme | demo_cenas | idem |
| scene.noite | demo_cenas | idem |
| input_boolean.alerta_campainha | configuration.yaml | Alerta home |
| input_boolean.alarme_ativo | configuration.yaml | Segurança |
| input_boolean.modo_noturno | configuration.yaml | Automações |
| input_select.modo_casa | configuration.yaml | Modos |
| input_number.tarifa_kwh | configuration.yaml | Energia |
| climate.ar_condicionado_quarto | demo_casa (template) | Cômodos → slider °C |

## Minhas entidades (produção)

Preencha com os IDs reais da sua instância (Developer Tools → Estados).  
Depois renomeie entidades no HA **ou** edite os arquivos YAML indicados.

| Uso no dashboard | entity_id real (preencher) | Onde editar se não renomear |
|------------------|----------------------------|-----------------------------|
| Luz sala | `light.________________` | `lovelace/views/comodos.yaml`, `home.yaml` |
| Luz abajur | `light.________________` | idem |
| AC quarto | `climate.________________` | `comodos.yaml` (show_temperature) |
| TV sala | `switch.________________` | idem |
| Porteira | `lock.________________` | `home.yaml`, `seguranca.yaml` |
| Campainha | `binary_sensor.________________` | `automations.yaml` |
| Clima (meteo) | `weather.________________` | `home.yaml` weather-forecast |
| Calendário | `calendar.________________` | `home.yaml` calendar-card |

Template pronto para copiar: [`packages/producao.yaml.example`](../packages/producao.yaml.example).

Checklist completo: [`DEPLOY-CHECKLIST.md`](./DEPLOY-CHECKLIST.md).

## Substituir por hardware real (exemplos)

| Placeholder Lovelace | Integração típica | Ação |
|---------------------|-------------------|------|
| light.sala_principal | Tuya / Hue / ESPHome | Renomear entidade real para este ID **ou** editar YAML |
| switch.tv_sala | Broadlink / Harmony / smart plug | idem |
| climate.ar_condicionado_quarto | Tuya / ESPHome / Daikin | idem |
| lock.porteira | Shelly / Tuya lock | idem |
| binary_sensor.campainha | Zigbee / Shelly i4 | idem |
| App 3D Android | House Control + token HA | [`HOUSE-CONTROL-ANDROID.md`](./HOUSE-CONTROL-ANDROID.md) |
| weather.home | Met.no / OpenWeatherMap | Ajustar `entity` em home.yaml |
| calendar.home | Google / Local Calendar | Configurar integração |
| media_player.echo_sala | Alexa Media Player (HACS) | Opcional |

## Desativar demo

Em `configuration.yaml`, comente:

```yaml
homeassistant:
  packages: !include_dir_named packages
```

Reinicie o HA e garanta que cada `entity_id` do Lovelace exista na instância.
