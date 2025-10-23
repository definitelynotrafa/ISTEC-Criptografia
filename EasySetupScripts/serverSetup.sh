#!/bin/bash
set -e

# === CONFIGURAÇÕES ===
HOSTNAME_FQDN="xerox.lab"
ALT_NAMES="DNS:xerox.lab,DNS:www.xerox.lab,DNS:admin.xerox.lab"
ORG="XeroxLab"
COUNTRY="PT"
STATE="Porto"
CITY="Porto"
DAYS_CA=3650
DAYS_SERVER=365

# === PASTAS ===
mkdir -p serverCerts clientCerts

echo "[+] A criar CA..."
openssl genrsa -out serverCerts/ca.key 4096
openssl req -x509 -new -nodes -key serverCerts/ca.key -sha256 -days $DAYS_CA \
  -out serverCerts/ca.crt -subj "/C=$COUNTRY/ST=$STATE/L=$CITY/O=$ORG/CN=LabCA"

echo "[+] A criar chave privada e CSR do servidor..."
cat > serverCerts/server_openssl.cnf <<EOF
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

[alt_names]
DNS.1 = xerox.lab
DNS.2 = www.xerox.lab
DNS.3 = admin.xerox.lab
EOF

openssl req -newkey rsa:2048 -nodes -keyout serverCerts/server.key \
  -out serverCerts/server.csr -config serverCerts/server_openssl.cnf

echo "[+] A assinar CSR com a CA (gerar server.crt)..."
echo "subjectAltName=$ALT_NAMES" > serverCerts/san.txt
openssl x509 -req -in serverCerts/server.csr -CA serverCerts/ca.crt \
  -CAkey serverCerts/ca.key -CAcreateserial -out serverCerts/server.crt \
  -days $DAYS_SERVER -sha256 -extfile serverCerts/san.txt

echo "[+] Verificação rápida do certificado:"
openssl x509 -in serverCerts/server.crt -noout -subject -issuer
openssl x509 -in serverCerts/server.crt -noout -text | grep -A1 "Subject Alternative Name"

echo "[+] A preparar CA para o cliente..."
cp serverCerts/ca.crt clientCerts/
HASH=$(openssl x509 -in clientCerts/ca.crt -noout -subject_hash)
ln -sf ca.crt clientCerts/${HASH}.0

echo
echo "✅ Tudo pronto!"
echo
echo "Pastas criadas:"
echo "  serverCerts/ → contém ca.crt, ca.key, server.crt, server.key"
echo "  clientCerts/ → contém ca.crt e ${HASH}.0"
echo
echo "Para arrancar o servidor (dentro do container):"
echo "  python3 server.py --cert ./serverCerts/server.crt --key ./serverCerts/server.key --port 443"
echo
echo "Para testar no cliente:"
echo "  python3 client.py --host xerox.lab --cadir ./clientCerts"
