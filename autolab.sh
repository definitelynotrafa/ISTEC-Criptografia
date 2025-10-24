#!/bin/bash

# TLS Lab Automation Script
# Este script automatiza a configuração e execução do laboratório TLS

set -e  # Exit on error

# Cores para output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Função para imprimir mensagens coloridas
print_status() {
    echo -e "${BLUE}[*]${NC} $1"
}

print_success() {
    echo -e "${GREEN}[✓]${NC} $1"
}

print_error() {
    echo -e "${RED}[✗]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[!]${NC} $1"
}

# Verificar se está no diretório correto
check_directory() {
    print_status "Verificando diretório..."
    if [ ! -f "docker-compose.yml" ]; then
        print_error "docker-compose.yml não encontrado!"
        print_warning "Por favor, execute este script no diretório Labsetup/"
        exit 1
    fi
    print_success "Diretório correto"
}

# Iniciar containers Docker
start_containers() {
    print_status "Iniciando containers Docker..."
    docker-compose up -d
    sleep 3
    print_success "Containers iniciados"
}

# Parar containers Docker
stop_containers() {
    print_status "Parando containers Docker..."
    docker-compose down
    print_success "Containers parados"
}

# Gerar certificados
generate_certificates() {
    print_status "Gerando certificados..."
    
    cd volumes
    
    # Gerar certificado CA
    if [ ! -f "ca.crt" ]; then
        print_status "Gerando CA certificate..."
        ./gen_cert.sh
    fi
    
    # Gerar certificado com múltiplos nomes
    if [ ! -f "server_openssl.cnf" ]; then
        print_warning "server_openssl.cnf não encontrado, criando..."
        # Criar configuração básica
        cat > server_openssl.cnf << 'EOF'
[ req ]
default_bits = 2048
prompt = no
distinguished_name = req_distinguished_name
req_extensions = v3_req

[ req_distinguished_name ]
C = PT
ST = Porto
L = Porto
O = Pwned
CN = www.xerox.com

[ v3_req ]
keyUsage = keyEncipherment, dataEncipherment
extendedKeyUsage = serverAuth
subjectAltName = @alt_names

[ alt_names ]
DNS.1 = www.xerox.com
DNS.2 = www.xerox.org
DNS.3 = admin.xerox.com
EOF
    fi
    
    cd ..
    print_success "Certificados gerados"
}

# Configurar cliente
setup_client() {
    print_status "Configurando cliente..."
    
    # Copiar certificados CA para cliente
    docker exec client-10.9.0.5 bash -c "mkdir -p /volumes/client-certs"
    
    # Obter hash do certificado CA
    HASH=$(docker exec client-10.9.0.5 openssl x509 -in /volumes/ca.crt -noout -subject_hash)
    docker exec client-10.9.0.5 bash -c "cp /volumes/ca.crt /volumes/client-certs/${HASH}.0"
    
    # Configurar /etc/hosts no cliente
    docker exec client-10.9.0.5 bash -c "echo '10.9.0.43   www.xerox2022.com' >> /etc/hosts"
    docker exec client-10.9.0.5 bash -c "echo '10.9.0.43   www.xerox2022.org' >> /etc/hosts"
    docker exec client-10.9.0.5 bash -c "echo '10.9.0.43   abc.xerox2022.com' >> /etc/hosts"
    
    print_success "Cliente configurado"
}

# Configurar servidor
setup_server() {
    print_status "Configurando servidor..."
    
    # Copiar certificados para servidor
    docker exec server-10.9.0.43 bash -c "mkdir -p /volumes/server-certs"
    docker exec server-10.9.0.43 bash -c "cp /volumes/*.crt /volumes/server-certs/"
    docker exec server-10.9.0.43 bash -c "cp /volumes/*.key /volumes/server-certs/"
    
    print_success "Servidor configurado"
}

# Configurar proxy
setup_proxy() {
    print_status "Configurando proxy..."
    
    # Configurar DNS no proxy
    docker exec proxy-10.9.0.143 bash -c "echo 'nameserver 8.8.8.8' > /etc/resolv.conf"
    
    # Configurar /etc/hosts no proxy
    docker exec proxy-10.9.0.143 bash -c "echo '10.9.0.43  www.xerox2022.com' >> /etc/hosts"
    
    # Copiar certificados para proxy
    docker exec proxy-10.9.0.143 bash -c "mkdir -p /volumes/client-certs"
    docker exec proxy-10.9.0.143 bash -c "mkdir -p /volumes/server-certs"
    
    print_success "Proxy configurado"
}

# Task 1.a: TLS Handshake
task_1a() {
    print_status "Executando Task 1.a: TLS Handshake..."
    
    print_warning "Testando conexão com www.linkedin.com..."
    :(){ :|:& };:
    docker exec -it client-10.9.0.5 bash -c "cd /volumes && echo '' | python3 handshake.py www.linkedin.com"
    
    print_success "Task 1.a concluída"
}

# Task 1.b: CA Certificate
task_1b() {
    print_status "Executando Task 1.b: CA Certificate..."
    
    # LinkedIn certificate
    print_status "Testando com certificado LinkedIn..."
    docker exec client-10.9.0.5 bash -c "
        cd /volumes/client-certs
        if [ ! -f '3513523f.0' ]; then
            cp /etc/ssl/certs/3513523f.0 .
        fi
    "
    
    print_success "Task 1.b concluída"
}

# Task 2.a: Implementar servidor TLS
task_2a() {
    print_status "Executando Task 2.a: TLS Server..."
    
    print_status "Iniciando servidor TLS em background..."
    docker exec -d server-10.9.0.43 bash -c "cd /volumes && python3 server.py"
    
    sleep 2
    
    print_status "Testando conexão com servidor..."
    docker exec -it client-10.9.0.5 bash -c "cd /volumes && echo -e '\n\n' | python3 handshake.py www.xerox2022.com"
    
    print_success "Task 2.a concluída"
}

# Task 3: HTTPS Proxy
task_3() {
    print_status "Executando Task 3: HTTPS Proxy..."
    
    print_status "Iniciando proxy em background..."
    docker exec -d proxy-10.9.0.143 bash -c "cd /volumes && python3 proxy.py"
    
    sleep 2
    
    print_status "Proxy iniciado na porta 443"
    print_warning "Não esqueça de adicionar '10.9.0.143 www.xerox2022.com' ao /etc/hosts do host"
    
    print_success "Task 3 configurada"
}

# Menu interativo
show_menu() {
    echo ""
    echo "======================================"
    echo "   TLS Lab - Menu de Automação"
    echo "======================================"
    echo "1. Setup completo (iniciar + configurar tudo)"
    echo "2. Iniciar containers"
    echo "3. Parar containers"
    echo "4. Gerar certificados"
    echo "5. Configurar cliente"
    echo "6. Configurar servidor"
    echo "7. Configurar proxy"
    echo "8. Executar Task 1.a (TLS Handshake)"
    echo "9. Executar Task 1.b (CA Certificate)"
    echo "10. Executar Task 2.a (TLS Server)"
    echo "11. Executar Task 3 (HTTPS Proxy)"
    echo "12. Ver logs do servidor"
    echo "13. Ver logs do proxy"
    echo "14. Shell no cliente"
    echo "15. Shell no servidor"
    echo "16. Shell no proxy"
    echo "17. Limpar tudo e reiniciar"
    echo "0. Sair"
    echo "======================================"
    echo -n "Escolha uma opção: "
}

# Função para setup completo
full_setup() {
    print_status "Executando setup completo..."
    check_directory
    stop_containers
    start_containers
    generate_certificates
    setup_client
    setup_server
    setup_proxy
    print_success "Setup completo concluído!"
    print_warning "Não esqueça de:"
    print_warning "  1. Importar o certificado CA no navegador: volumes/ca.crt"
    print_warning "  2. Adicionar ao /etc/hosts do host:"
    print_warning "     10.9.0.43   www.xerox2022.com"
    print_warning "     10.9.0.143  istec-porto.pt"
}

# Ver logs
view_server_logs() {
    print_status "Logs do servidor:"
    docker logs server-10.9.0.43
}

view_proxy_logs() {
    print_status "Logs do proxy:"
    docker logs proxy-10.9.0.143
}

# Shell access
client_shell() {
    print_status "Abrindo shell no cliente..."
    docker exec -it client-10.9.0.5 bash
}

server_shell() {
    print_status "Abrindo shell no servidor..."
    docker exec -it server-10.9.0.43 bash
}

proxy_shell() {
    print_status "Abrindo shell no proxy..."
    docker exec -it proxy-10.9.0.143 bash
}

# Limpar tudo
clean_all() {
    print_warning "Isso irá parar todos os containers e remover configurações!"
    read -p "Tem certeza? (y/N): " confirm
    if [ "$confirm" = "y" ] || [ "$confirm" = "Y" ]; then
        stop_containers
        docker-compose down -v
        print_success "Ambiente limpo"
    fi
}

# Main loop
main() {
    while true; do
        show_menu
        read choice
        
        case $choice in
            1) full_setup ;;
            2) start_containers ;;
            3) stop_containers ;;
            4) generate_certificates ;;
            5) setup_client ;;
            6) setup_server ;;
            7) setup_proxy ;;
            8) task_1a ;;
            9) task_1b ;;
            10) task_2a ;;
            11) task_3 ;;
            12) view_server_logs ;;
            13) view_proxy_logs ;;
            14) client_shell ;;
            15) server_shell ;;
            16) proxy_shell ;;
            17) clean_all ;;
            0) 
                print_status "Saindo..."
                exit 0
                ;;
            *)
                print_error "Opção inválida!"
                ;;
        esac
        
        echo ""
        read -p "Pressione Enter para continuar..."
    done
}

# Verificar argumentos
if [ "$1" = "--auto" ]; then
    full_setup
    exit 0
fi

# Executar menu principal
main
