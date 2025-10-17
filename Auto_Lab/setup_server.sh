#!/bin/bash
set -e
# setup_server.sh
# Uso: ./setup_server.sh <hostname>  (ex: ./setup_server.sh www.antixerox.com)
# Gera CA (se não existir), gera server key/CSR+cert com SAN (hostname), cria server_chain.pem e arranca servidor TLS simples.

if [ -z "$1" ]; then
  echo "Usage: $0 <hostname> (ex: www.antixerox.com or admin.antixerox2025)"
  exit 1
fi
HOST="$1"
WORKDIR="$(pwd)"

echo "[*] Cleaning old artifacts..."
rm -f server.key server.csr server.crt server_chain.pem
rm -f server_www.key server_www.csr server_www.crt
rm -rf demoCA
mkdir -p demoCA/newcerts demoCA/certs demoCA/crl demoCA/private client-certs server-certs

touch demoCA/index.txt
echo 1000 > demoCA/serial

# Create CA if not exists
if [ ! -f ca.key ] || [ ! -f ca.crt ]; then
  echo "[*] Creating CA..."
  openssl req -x509 -newkey rsa:2048 -days 3650 -nodes \
    -keyout ca.key -out ca.crt \
    -subj "/C=PT/O=AntixeroxLab/CN=AntixeroxLab-CA"
else
  echo "[*] CA already exists (ca.key, ca.crt)"
fi

# Create server_openssl.cnf for SAN including HOST and localhost
cat > server_openssl.cnf <<EOF
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
IP.1  = 127.0.0.1
EOF

echo "[*] Generating server key and CSR for ${HOST}..."
openssl req -newkey rsa:2048 -nodes -keyout server.key -out server.csr -config server_openssl.cnf

# Prepare myopenssl.cnf: copy system and enable copy_extensions; set CA dirs
cp /etc/ssl/openssl.cnf myopenssl.cnf || true
# ensure copy_extensions enabled
sed -i 's/^# *copy_extensions = copy/copy_extensions = copy/' myopenssl.cnf || true

# Append CA_default settings if not present (keeps simple)
cat >> myopenssl.cnf <<EOF

[ CA_default ]
dir               = ${WORKDIR}/demoCA
new_certs_dir     = \$dir/newcerts
database          = \$dir/index.txt
serial            = \$dir/serial
private_key       = ${WORKDIR}/ca.key
certificate       = ${WORKDIR}/ca.crt
default_days      = 3650
default_md        = sha256
policy            = policy_any
copy_extensions   = copy

[ policy_any ]
countryName             = optional
stateOrProvinceName     = optional
organizationName        = optional
organizationalUnitName  = optional
commonName              = supplied
emailAddress            = optional
EOF

echo "[*] Signing CSR with CA (this may print warnings about missing fields — OK for lab)..."
openssl ca -config ./myopenssl.cnf -batch -in server.csr -out server.crt -cert ca.crt -keyfile ca.key || \
  { echo "[!] openssl ca failed — attempting fallback signing with x509"; openssl x509 -req -in server.csr -CA ca.crt -CAkey ca.key -CAcreateserial -out server.crt -days 3650 -sha256; }

echo "[*] Building server_chain.pem..."
cat server.crt ca.crt > server_chain.pem

# Create client-certs trust dir with hashed symlink
mkdir -p client-certs
cp ca.crt client-certs/ca_cert.pem
HASH=$(openssl x509 -in client-certs/ca_cert.pem -noout -subject_hash 2>/dev/null | head -n1)
ln -sf ca_cert.pem client-certs/${HASH}.0

echo "[*] Starting simple TLS test server on port 4433 (foreground). Ctrl-C to stop."
cat > server_run.py <<'PY'
#!/usr/bin/env python3
import socket, ssl, pprint
html = b"HTTP/1.1 200 OK\r\nContent-Type: text/html\r\n\r\n<h1>Antixerox TLS server for: %s</h1>" % b"${HOST}"
context = ssl.SSLContext(ssl.PROTOCOL_TLS_SERVER)
context.load_cert_chain(certfile="server_chain.pem", keyfile="server.key")
sock = socket.socket(socket.AF_INET, socket.SOCK_STREAM)
sock.bind(('0.0.0.0', 4433))
sock.listen(5)
print("[*] TLS server listening on 0.0.0.0:4433")
while True:
    newsock, addr = sock.accept()
    try:
        ssock = context.wrap_socket(newsock, server_side=True)
        print("[*] TLS connection from", addr)
        data = ssock.recv(4096)
        pprint.pprint(data)
        ssock.sendall(html)
        ssock.shutdown(socket.SHUT_RDWR)
        ssock.close()
    except Exception as e:
        print("[!] Connection failed:", e)
PY

python3 server_run.py
