#!/usr/bin/env bash
# script.sh - automatiza o lab TLS + MITM (Antixerox)
# Execute como: sudo ./script.sh
set -euo pipefail
IFS=$'\n\t'

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
log() { echo "[*] $*"; }
err() { echo "[!] $*" >&2; }

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
    err "Cria o docker-compose.yml primeiro."
    exit 1
fi

# --- 1) Limpar e recriar volumes/ do zero ---
log "Limpando volumes/ anterior..."
if [ -d "$VOLUMES_DIR" ]; then
    rm -rf "$VOLUMES_DIR"
    log "✓ Pasta volumes/ removida"
fi

mkdir -p "$VOLUMES_DIR"/{ca,server-certs,client-certs}
log "✓ Pasta volumes/ criada do zero"

# --- 2) Garantir ficheiros python em volumes/ ---
log "Escrevendo/garantindo scripts em $VOLUMES_DIR ..."
# server.py
cat > "$VOLUMES_DIR/server.py" <<'PY'
#!/usr/bin/env python3
import socket, ssl, sys

html = """HTTP/1.1 200 OK\r\nContent-Type: text/html\r\n\r\n
<!DOCTYPE html><html><body><h1>This is Bank32.com!</h1></body></html>
"""

print("[server] Starting...", flush=True)

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
    print("[server] ✓ Listening on 0.0.0.0:443", flush=True)
    
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
PY
chmod +x "$VOLUMES_DIR/server.py" || true

# proxy.py
cat > "$VOLUMES_DIR/proxy.py" <<'PY'
#!/usr/bin/env python3
import socket, ssl, threading, sys

print("[proxy] Starting...", flush=True)

def process_request(ssock_for_browser):
    hostname = "www.antixerox.com"
    try:
        context_client = ssl.SSLContext(ssl.PROTOCOL_TLS_CLIENT)
        cadir = './client-certs'
        context_client.load_verify_locations(capath=cadir)
        context_client.verify_mode = ssl.CERT_REQUIRED
        context_client.check_hostname = True
        
        print(f"[proxy] Connecting to real server {hostname}:443...", flush=True)
        sock_for_server = socket.create_connection((hostname, 443))
        ssock_for_server = context_client.wrap_socket(sock_for_server, server_hostname=hostname, do_handshake_on_connect=False)
        ssock_for_server.do_handshake()
        print("[proxy] ✓ Connected to real server", flush=True)
        
        request = ssock_for_browser.recv(8192)
        if request:
            request_preview = request[:100]
            print(f"[proxy] Forwarding request: {request_preview}", flush=True)
            ssock_for_server.sendall(request)
            
            while True:
                response = ssock_for_server.recv(8192)
                if not response:
                    break
                response = response.replace(b"Bank32", b"antixerox")
                ssock_for_browser.sendall(response)
            print("[proxy] ✓ Response forwarded (Bank32 -> antixerox)", flush=True)
    except Exception as e:
        print(f"[proxy] Processing failed: {e}", flush=True)
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
    
    print(f"[proxy] Loading cert from {SERVER_CERT}", flush=True)
    context = ssl.SSLContext(ssl.PROTOCOL_TLS_SERVER)
    context.load_cert_chain(SERVER_CERT, SERVER_PRIVATE)
    
    sock = socket.socket(socket.AF_INET, socket.SOCK_STREAM, 0)
    sock.setsockopt(socket.SOL_SOCKET, socket.SO_REUSEADDR, 1)
    sock.bind(('0.0.0.0', 443))
    sock.listen(5)
    print("[proxy] ✓ Listening on 0.0.0.0:443 (MITM proxy)", flush=True)
    
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
PY
chmod +x "$VOLUMES_DIR/proxy.py" || true

# handshake.py
cat > "$VOLUMES_DIR/handshake.py" <<'PY'
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
PY
chmod +x "$VOLUMES_DIR/handshake.py" || true

# --- 3) Gerar CA e server cert (SEMPRE do zero) ---
CA_CRT="$VOLUMES_DIR/ca/ca.crt"
CA_KEY="$VOLUMES_DIR/ca/ca.key"
SERVER_CRT_SRC="$VOLUMES_DIR/server-certs/server.crt"
SERVER_KEY_SRC="$VOLUMES_DIR/server-certs/server.key"
CSR_TMP="$VOLUMES_DIR/server.csr"

log "Gerando CA nova..."
openssl genrsa -out "$CA_KEY" 2048 2>/dev/null
openssl req -x509 -new -nodes -key "$CA_KEY" -sha256 -days 3650 -out "$CA_CRT" \
    -subj "/C=PT/ST=Lab/L=Lab/O=AntixeroxCA/OU=Lab/CN=Antixerox Root CA" 2>/dev/null
log "✓ CA criada: $CA_CRT"

log "Gerando certificado do servidor para ${HOSTNAME}..."
openssl genrsa -out "$SERVER_KEY_SRC" 2048 2>/dev/null
openssl req -new -key "$SERVER_KEY_SRC" -out "$CSR_TMP" \
    -subj "/C=PT/ST=Lab/L=Lab/O=Antixerox/OU=Lab/CN=${HOSTNAME}" 2>/dev/null
openssl x509 -req -in "$CSR_TMP" -CA "$CA_CRT" -CAkey "$CA_KEY" -CAcreateserial \
    -out "$SERVER_CRT_SRC" -days 365 -sha256 2>/dev/null
rm -f "$CSR_TMP"
log "✓ Server cert criado: $SERVER_CRT_SRC"

# Fix permissions
chmod 644 "$CA_CRT" "$SERVER_CRT_SRC" 2>/dev/null || true
chmod 600 "$CA_KEY" "$SERVER_KEY_SRC" 2>/dev/null || true

# --- 4) Copiar CA para client-certs ---
log "Preparando CA para client-certs com hash correto..."
if command -v c_rehash >/dev/null 2>&1; then
    cp -f "$CA_CRT" "$VOLUMES_DIR/client-certs/"
    c_rehash "$VOLUMES_DIR/client-certs/" >/dev/null 2>&1
    log "c_rehash executado em client-certs/"
else
    HASH_NAME="$(openssl x509 -in "$CA_CRT" -noout -subject_hash).0"
    cp -f "$CA_CRT" "$VOLUMES_DIR/client-certs/${HASH_NAME}"
    log "CA copiada para client-certs/${HASH_NAME}"
fi

# --- 5) Levantar containers ---
log "Parando containers antigos (se existirem)..."
docker-compose -f "$COMPOSE_FILE" down 2>/dev/null || true

log "Levantando containers via docker-compose..."
docker-compose -f "$COMPOSE_FILE" up -d

log "Aguardando containers iniciarem..."
sleep 5

# Verify containers are running
log "Verificando se containers estão a correr..."
for container in "$SERVER_SERVICE_NAME" "$PROXY_SERVICE_NAME" "$CLIENT_SERVICE_NAME"; do
    if ! docker ps | grep -q "$container"; then
        err "ERRO: Container $container não está a correr!"
        docker ps -a | grep "$container"
        exit 1
    fi
    log "✓ Container $container está a correr"
done

# Check if python3 exists in containers
log "Verificando se python3 está disponível..."
for container in "$SERVER_SERVICE_NAME" "$PROXY_SERVICE_NAME"; do
    if ! docker exec "$container" which python3 >/dev/null 2>&1; then
        err "ERRO: python3 não encontrado em $container!"
        err "A imagem Docker precisa ter python3 instalado."
        exit 1
    fi
    log "✓ python3 disponível em $container"
done

# Check if volumes are mounted
log "Verificando se volumes estão montados..."
for container in "$SERVER_SERVICE_NAME" "$PROXY_SERVICE_NAME"; do
    if ! docker exec "$container" test -f /volumes/server.py; then
        err "ERRO: /volumes não está montado corretamente em $container!"
        err "Verifica o docker-compose.yml - volumes: ${VOLUMES_DIR}:/volumes"
        exit 1
    fi
    log "✓ Volumes montados em $container"
done

# --- 6) Atualizar /etc/hosts DENTRO dos containers ---
log "Atualizando /etc/hosts DENTRO dos containers..."
for c in "$CLIENT_SERVICE_NAME" "$PROXY_SERVICE_NAME"; do
    docker exec "$c" sh -c "sed -i '/[[:space:]]${HOSTNAME}\$/d' /etc/hosts 2>/dev/null || true"
    docker exec "$c" sh -c "echo '${SERVER_IP} ${HOSTNAME}' >> /etc/hosts"
    log "✓ Container $c: /etc/hosts atualizado"
done

# --- 7) Iniciar server.py ---
log "Verificando estrutura de ficheiros dentro do container..."
docker exec "$SERVER_SERVICE_NAME" ls -la /volumes/server-certs/ || {
    err "ERRO: Não consigo aceder a /volumes/server-certs/"
    exit 1
}

log "Limpando processos Python antigos no servidor..."
docker exec "$SERVER_SERVICE_NAME" sh -c "pkill -9 python3 2>/dev/null || true"
sleep 2

# Check if port 443 is free
if docker exec "$SERVER_SERVICE_NAME" netstat -tln 2>/dev/null | grep -q ':443'; then
    err "AVISO: Porta 443 ainda ocupada, tentando limpar..."
    docker exec "$SERVER_SERVICE_NAME" sh -c "lsof -ti:443 | xargs kill -9 2>/dev/null || true"
    sleep 2
fi

log "Iniciando server.py dentro do container $SERVER_SERVICE_NAME..."
docker exec -d "$SERVER_SERVICE_NAME" sh -c "cd /volumes && exec python3 -u server.py 2>&1 | tee /tmp/server.log"

sleep 3

# Check if server.py is running
log "Verificando se server.py está a executar..."
if docker exec "$SERVER_SERVICE_NAME" pgrep -f server.py >/dev/null 2>&1; then
    log "✓ server.py está a executar (PID: $(docker exec "$SERVER_SERVICE_NAME" pgrep -f server.py))"
else
    err "ERRO: server.py não está a executar!"
    err "Logs do script (stdout/stderr):"
    docker exec "$SERVER_SERVICE_NAME" cat /tmp/server.log 2>&1 || echo "Sem logs"
    err "Logs do container:"
    docker logs "$SERVER_SERVICE_NAME" 2>&1 | tail -20
    err "Tentando executar em foreground para debug:"
    timeout 5 docker exec "$SERVER_SERVICE_NAME" sh -c "cd /volumes && python3 server.py" 2>&1 || true
    exit 1
fi

# Wait for port 443
log "Esperando porta 443 no servidor..."
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
    err "ERRO: timeout esperando server:443"
    err "Logs do servidor:"
    docker logs "$SERVER_SERVICE_NAME" 2>&1 | tail -20
    err "Processos no container:"
    docker exec "$SERVER_SERVICE_NAME" ps aux 2>&1 | grep -i python
    exit 1
fi

# Test connectivity
log "Testando conectividade do host para ${SERVER_IP}:443..."
if timeout 3 bash -c "echo > /dev/tcp/${SERVER_IP}/443" 2>/dev/null; then
    log "✓ Host consegue conectar ao server"
else
    err "✗ Host NÃO consegue conectar ao server!"
    err "Verifica firewall e configuração de rede"
fi

# --- 8) Update /etc/hosts DO HOST ---
HOST_HOSTS="/etc/hosts"
BACKUP_HOSTS="/etc/hosts.lab-backup.$(date +%s)"
cp -f "$HOST_HOSTS" "$BACKUP_HOSTS"
log "Backup de /etc/hosts: $BACKUP_HOSTS"

sed -i "/[[:space:]]${HOSTNAME//./\\.}\$/d" "$HOST_HOSTS" || true
echo "${SERVER_IP} ${HOSTNAME}" >> "$HOST_HOSTS"
log "✓ /etc/hosts do host: ${HOSTNAME} -> ${SERVER_IP}"

echo ""
echo "=========================================================================="
echo "PASSO 1: IMPORTAR CERTIFICADO CA NO BROWSER"
echo "=========================================================================="
echo ""
echo "Ficheiro CA: $CA_CRT"
echo ""
echo "Firefox:"
echo "  1. about:preferences#privacy"
echo "  2. Certificates > View Certificates"
echo "  3. Authorities > Import"
echo "  4. Seleciona: $CA_CRT"
echo "  5. ✓ Trust this CA to identify websites"
echo ""
echo "Chrome:"
echo "  1. chrome://settings/certificates"
echo "  2. Authorities > Import"
echo "  3. Seleciona: $CA_CRT"
echo ""
echo "=========================================================================="
echo "PASSO 2: TESTAR SITE ORIGINAL"
echo "=========================================================================="
echo ""
echo "Abre: https://${HOSTNAME}"
echo "Deves ver: 'This is Bank32.com!' (sem avisos de segurança)"
echo ""
read -p "Quando vires o site ORIGINAL funcionando, press ENTER para MITM..."

# --- 9) Iniciar proxy ---
log "Matando processos antigos no proxy..."
docker exec "$PROXY_SERVICE_NAME" pkill -9 -f proxy.py 2>/dev/null || true
docker exec "$PROXY_SERVICE_NAME" pkill -9 -f server.py 2>/dev/null || true
docker exec "$PROXY_SERVICE_NAME" fuser -k 443/tcp 2>/dev/null || true
sleep 2

log "Iniciando proxy.py dentro do container $PROXY_SERVICE_NAME..."
docker exec -d "$PROXY_SERVICE_NAME" sh -c "cd /volumes && python3 -u proxy.py > /tmp/proxy.log 2>&1"

sleep 2

# Check if proxy.py is running
log "Verificando se proxy.py está a executar..."
if docker exec "$PROXY_SERVICE_NAME" pgrep -f proxy.py >/dev/null 2>&1; then
    log "✓ proxy.py está a executar"
else
    err "AVISO: proxy.py pode não estar a executar"
fi

# Wait for proxy port
log "Esperando proxy estar pronto (porta 443)..."
ready=0
for i in $(seq 1 30); do
    if docker exec "$PROXY_SERVICE_NAME" netstat -tln 2>/dev/null | grep -q ':443'; then
        ready=1
        log "✓ Proxy pronto após ${i}s"
        break
    fi
    sleep 1
done

if [ "$ready" -ne 1 ]; then
    err "AVISO: timeout esperando proxy:443"
    docker logs "$PROXY_SERVICE_NAME" 2>&1 | tail -20
fi

# Update /etc/hosts to proxy
sed -i "/[[:space:]]${HOSTNAME//./\\.}\$/d" "$HOST_HOSTS" || true
echo "${PROXY_IP} ${HOSTNAME}" >> "$HOST_HOSTS"
log "✓ /etc/hosts do host: ${HOSTNAME} -> ${PROXY_IP} (MITM)"

echo ""
echo "=========================================================================="
echo "MITM ATIVO!"
echo "=========================================================================="
echo ""
echo "Recarrega o browser (CTRL+SHIFT+R para limpar cache)"
echo "Deves ver: 'This is antixerox.com!' (Bank32 substituído)"
echo ""
echo "Se o site não carregar:"
echo "  - Verifica os logs: docker logs $PROXY_SERVICE_NAME"
echo "  - Limpa a cache do browser completamente"
echo "  - Fecha e reabre o browser"
echo ""
read -p "Quando tiveres visto a versão MITM, press ENTER para limpar..."

# --- 10) Cleanup ---
log "Repondo /etc/hosts..."
mv -f "$BACKUP_HOSTS" "$HOST_HOSTS" || true
log "✓ /etc/hosts reposto"

echo ""
echo "=========================================================================="
log "Lab concluído!"
echo "=========================================================================="
log "CA: $CA_CRT"
log "Parar containers: docker-compose -f \"$COMPOSE_FILE\" down"
log "Ver logs server: docker logs $SERVER_SERVICE_NAME"
log "Ver logs proxy: docker logs $PROXY_SERVICE_NAME"
echo "=========================================================================="

exit 0
