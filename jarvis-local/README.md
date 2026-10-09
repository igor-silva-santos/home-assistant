# J.A.R.V.I.S — cliente local (HA na VPS)

Rode **somente no seu PC**, apontando para o Home Assistant na VPS.

```bash
cp .env.example .env   # edite HA_URL e HA_TOKEN
python3 -m venv .venv && source .venv/bin/activate
pip install -r requirements.txt
python client.py
```

Documentação completa: [`docs/JARVIS-LOCAL-VPS.md`](../docs/JARVIS-LOCAL-VPS.md)
