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

echo "-- Generating server key and CSR ..."
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
    echo "-- Installing Apache2 and OpenSSL ..."
    apt update -y && apt install -y apache2 openssl
fi

echo "-- Copying certificates to /etc/ssl/antixerox ..."
mkdir -p /etc/ssl/antixerox
cp server.crt /etc/ssl/antixerox/
cp server.key /etc/ssl/antixerox/
cp ca.crt /etc/ssl/antixerox/

echo "-- Creating site ${SERVER_CN} ..."
mkdir -p /var/www/${SERVER_CN}

cat > /var/www/${SERVER_CN}/index.html <<'EOF'
<!DOCTYPE html>
<html lang="pt">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Antixerox 2025 HTTPS</title>
    <style>
        @import url('https://fonts.googleapis.com/css2?family=Roboto:wght@400;700&display=swap');
        * { margin: 0; padding: 0; box-sizing: border-box; font-family: 'Roboto', sans-serif; }
        body {
            background: linear-gradient(135deg, #1a1a2e, #162447);
            color: #ffffff;
            min-height: 100vh;
            display: flex;
            justify-content: center;
            align-items: center;
            flex-direction: column;
            text-align: center;
            padding: 20px;
        }
        h1 { font-size: 3em; margin-bottom: 20px; color: #e94560; text-shadow: 2px 2px #0f3460; }
        p { font-size: 1.2em; margin-bottom: 30px; color: #ffffffcc; }
        .button {
            background-color: #e94560;
            color: #fff;
            padding: 12px 25px;
            border: none;
            border-radius: 8px;
            font-size: 1em;
            cursor: pointer;
            text-decoration: none;
            transition: 0.3s;
        }
        .button:hover { background-color: #d63356; transform: scale(1.05); }
        footer { position: absolute; bottom: 15px; font-size: 0.9em; color: #ffffff66; }
    </style>
</head>
<body>
    <h1>Antixerox 2025</h1>
    <p>Servidor HTTPS ativo 🔒</p>
    <a class="button" href="https://www.antixerox2025/" target="_blank">Recarregar Página</a>
    <footer>Certificado funcional</footer>
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

echo "=== Done! Testa com: curl -vk https://${SERVER_CN}/ ==="
echo "FORA DO DOCKER: adicionar 10.9.0.80 www.antixerox2025 ao /etc/hosts"
