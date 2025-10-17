#!/bin/bash
set -e
# setup_tls_server_dns.sh
# Uso: ./setup_tls_server_dns.sh <hostname> <ip>
# Gera certificado "certificado" para www.antixerox.com e IP 10.9.0.43 e arranca servidor TLS

if [ -z "$1" ] || [ -z "$2" ]; then
    echo "Usage: $0 <hostname> <ip> (ex: www.antixerox.com 10.9.0.43)"
    exit 1
fi

HOST="$1"
IP="$2"
WORKDIR="$(pwd)"

echo "[*] Limpando artefatos antigos..."
rm -f certificado.key certificado.crt server_chain.pem
rm -rf demoCA
mkdir -p demoCA/newcerts demoCA/private demoCA/certs
touch demoCA/index.txt
echo 1000 > demoCA/serial

# Criar CA se não existir
if [ ! -f ca.key ] || [ ! -f ca.crt ]; then
    echo "[*] Criando CA..."
    openssl req -x509 -newkey rsa:2048 -days 3650 -nodes \
        -keyout ca.key -out ca.crt \
        -subj "/C=PT/O=AntixeroxLab/CN=AntixeroxLab-CA"
else
    echo "[*] CA já existe (ca.key, ca.crt)"
fi

# Criar arquivo OpenSSL para CSR com SAN
cat > certificado_openssl.cnf <<EOF
[ req ]
prompt = no
distinguished_name = req_distinguished_name
req_extensions = req_ext

[ req_distinguished_name ]
C = PT
O = AntixeroxLab
CN = ${HOST}

[ req_ext ]
subjectAltName = @alt_names

[ alt_names ]
DNS.1 = ${HOST}
DNS.2 = localhost
IP.1  = ${IP}
IP.2  = 127.0.0.1
EOF

echo "[*] Gerando chave e CSR do servidor..."
openssl req -newkey rsa:2048 -nodes -keyout certificado.key -out certificado.csr -config certificado_openssl.cnf

echo "[*] Assinando CSR com a CA..."
openssl x509 -req -in certificado.csr -CA ca.crt -CAkey ca.key -CAcreateserial -out certificado.crt -days 3650 -sha256 -extensions req_ext -extfile certificado_openssl.cnf

echo "[*] Criando server_chain.pem..."
cat certificado.crt ca.crt > server_chain.pem

# Criar servidor Python TLS simples
cat > server_run.py <<PY
#!/usr/bin/env python3
import socket, ssl

HOST = '0.0.0.0'
PORT = 4433
html = b"""
HTTP/1.1 200 OK
Content-Type: text/html

<!DOCTYPE html>
<html lang='pt-BR'>
<head>
<meta charset='UTF-8'>
<title>Antixerox Criptografia</title>
<style>
    body {
        margin: 0;
        padding: 0;
        height: 100vh;
        display: flex;
        justify-content: center;
        align-items: center;
        background: linear-gradient(135deg, #0f2027, #203a43, #2c5364);
        font-family: 'Courier New', Courier, monospace;
        color: #00ffcc;
    }
    h1 {
        font-size: 3em;
        text-transform: uppercase;
        text-shadow:
            0 0 5px #00ffcc,
            0 0 10px #00ffcc,
            0 0 20px #00ffcc,
            0 0 40px #00ffcc;
        animation: glow 1.5s infinite alternate;
    }
    @keyframes glow {
        from { text-shadow: 0 0 5px #00ffcc, 0 0 10px #00ffcc; }
        to   { text-shadow: 0 0 20px #00ffcc, 0 0 40px #00ffcc; }
    }
</style>
</head>
<body>
    <h1>Antixerox Criptografia</h1>
</body>
</html>
"""

context = ssl.SSLContext(ssl.PROTOCOL_TLS_SERVER)
context.load_cert_chain(certfile="server_chain.pem", keyfile="certificado.key")

with socket.socket(socket.AF_INET, socket.SOCK_STREAM) as sock:
    sock.bind((HOST, PORT))
    sock.listen(5)
    print(f"[*] TLS server listening on {HOST}:{PORT}")
    while True:
        newsock, addr = sock.accept()
        try:
            with context.wrap_socket(newsock, server_side=True) as ssock:
                print("[*] Conexão TLS de", addr)
                data = ssock.recv(4096)
                ssock.sendall(html)
        except Exception as e:
            print("[!] Conexão falhou:", e)
PY

chmod +x server_run.py

echo "[*] Adicione a linha no /etc/hosts se necessário:"
echo "   ${IP} ${HOST}"

echo "[*] Iniciando servidor TLS na porta 4433..."
python3 server_run.py
