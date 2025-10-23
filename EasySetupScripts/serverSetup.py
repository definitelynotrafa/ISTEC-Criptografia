#!/bin/bash
set -e

# === CONFIGURAÇÕES ===
HOSTNAME_FQDN="xerox.lab"
ALT_NAMES="DNS:xerox.lab,DNS:www.xerox.lab"
ORG="XeroxLab"
COUNTRY="PT"
STATE="Lisbon"
CITY="Lisbon"
DAYS_CA=3650
DAYS_SERVER=365

# === PASTAS ===
mkdir -p server-certs client-certs

echo "[+] A criar CA..."
openssl genrsa -out server-certs/ca.key 4096
openssl req -x509 -new -nodes -key server-certs/ca.key -sha256 -days $DAYS_CA \
  -out server-certs/ca.crt -subj "/C=$COUNTRY/ST=$STATE/L=$CITY/O=$ORG/CN=LabCA"

echo "[+] A criar chave privada e CSR do servidor..."
cat > server-certs/server_openssl.cnf <<EOF
[ req ]
prompt = no
distinguished_name = req_distinguished_name
req_extensions = req_ext

[ req_distinguished_name ]
C = $COUNTRY
ST = $STATE
L = $CITY
O = $ORG
CN = $HOSTNAME_FQDN

[ req_ext ]
subjectAltName = @alt_names

[ alt_names ]
DNS.1 = xerox.lab
DNS.2 = www.xerox.lab
EOF

openssl req -newkey rsa:2048 -nodes -keyout server-certs/server.key \
  -out server-certs/server.csr -config server-certs/server_openssl.cnf

echo "[+] A assinar CSR com a CA (gerar server.crt)..."
echo "subjectAltName=$ALT_NAMES" > server-certs/san.txt
openssl x509 -req -in server-certs/server.csr -CA server-certs/ca.crt \
  -CAkey server-certs/ca.key -CAcreateserial -out server-certs/server.crt \
  -days $DAYS_SERVER -sha256 -extfile server-certs/san.txt

echo "[+] Verificação rápida do certificado:"
openssl x509 -in server-certs/server.crt -noout -subject -issuer
openssl x509 -in server-certs/server.crt -noout -text | grep -A1 "Subject Alternative Name"

echo "[+] A preparar CA para o cliente..."
cp server-certs/ca.crt client-certs/
HASH=$(openssl x509 -in client-certs/ca.crt -noout -subject_hash)
ln -sf ca.crt client-certs/${HASH}.0

echo
echo "✅ Tudo pronto!"
echo
echo "Pastas criadas:"
echo "  server-certs/ → contém ca.crt, ca.key, server.crt, server.key"
echo "  client-certs/ → contém ca.crt e ${HASH}.0"
echo
echo "Para arrancar o servidor (dentro do container):"
echo "  python3 server.py --cert ./server-certs/server.crt --key ./server-certs/server.key --port 443"
echo
echo "Para testar no cliente:"
echo "  python3 client.py --host xerox.lab --cadir ./client-certs"
