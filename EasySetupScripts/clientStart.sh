#!/bin/bash
set -e

# Configurações
HOST="xerox.lab"
PORT=443
CADIR="./clientCerts"

# Verifica se a pasta de certificados existe
if [[ ! -d "$CADIR" ]]; then
    echo "[!] Pasta de certificados do cliente não encontrada."
    echo "    Por favor corre primeiro ./serverSetup.sh para criar clientCerts"
    exit 1
fi

echo "[+] Iniciando TLS client..."
echo "    Host: $HOST"
echo "    Port: $PORT"
echo "    CA Dir: $CADIR"
echo

# Executa o client.py
python3 client.py --host "$HOST" --port "$PORT" --cadir "$CADIR"
