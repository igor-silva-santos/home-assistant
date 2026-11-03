# Checklist pós-deploy

Use após `scripts/setup.sh` ou `docker compose up` e reinício do HA.

## Infra

- [ ] HA responde em `http://<host>:8123`
- [ ] Tema **futuristic_dark** aplicado no perfil
- [ ] `homeassistant.packages` ativo (demo) **ou** `producao.yaml` configurado

## HACS (Frontend)

- [ ] Mushroom
- [ ] Card Mod
- [ ] Layout Card
- [ ] Mini Graph Card
- [ ] ApexCharts Card (aba Relatórios / Energia)

Descomente entradas em `configuration.yaml` → `lovelace.resources` após instalar.

## Integração 3D

- [ ] NextFloor instalado (HACS → Integração)
- [ ] Integração NextFloor adicionada em Dispositivos e serviços
- [ ] Pelo menos um cômodo desenhado e **uma lâmpada vinculada** a `light.sala_principal`

## Smoke test (modo demo)

- [ ] **Home** → botões **Brilho / Filme** alteram luzes
- [ ] **Cômodos** → `light.sala_principal` liga/desliga no room-card
- [ ] **Cômodos** → botão **3D** abre Planta 3D
- [ ] **Cômodos** → **Quarto** → slider do **Ar Condicionado** (climate) muda alvo °C
- [ ] **Planta 3D** → card NextFloor carrega (não “custom element missing”)
- [ ] **Planta 3D** → `Simular campainha` acende alerta na Home

## Validação automática

```bash
python3 scripts/validate_lovelace_entities.py
```

Revise entidades “opcionais” (Frigate, Huawei) se ainda não instaladas.

## Ir para produção

1. Preencher [`ENTITY-MAP.md`](./ENTITY-MAP.md) → **Minhas entidades**
2. Copiar `packages/producao.yaml.example` → `packages/producao.yaml` (opcional)
3. Comentar `packages: !include_dir_named packages` **ou** remover `demo_*.yaml`
4. Reiniciar HA e repetir smoke test com hardware real

## Tablet kiosk

- [ ] Usuário dedicado no HA (opcional)
- [ ] Abrir aba **Kiosk** (`panel: true`)
- [ ] Modo kiosk do browser / Fully Kiosk Browser
