#!/bin/bash
set -e

# Paths
CERT="./serverCerts/server.crt"
KEY="./serverCerts/server.key"
PORT=443

# Verifica se os certificados existem
if [[ ! -f "$CERT" || ! -f "$KEY" ]]; then
    echo "[!] Certificado ou chave não encontrados."
    echo "    Por favor corre primeiro ./serverSetup.sh"
    exit 1
fi

echo "[+] Iniciando TLS server..."
echo "    Cert: $CERT"
echo "    Key:  $KEY"
echo "    Port: $PORT"
echo

# Arranca o servidor com sudo (necessário para portas <1024)
python3 server.py --cert "$CERT" --key "$KEY" --port "$PORT"
