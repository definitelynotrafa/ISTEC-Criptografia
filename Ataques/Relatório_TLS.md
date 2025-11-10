# Transport Layer Security (TLS) Lab - Relatório

## Índice
1. [Introdução](#introdução)
2. [Ambiente do Lab](#ambiente-do-lab)
3. [Task 1: TLS Client](#task-1-tls-client)
4. [Task 2: TLS Server](#task-2-tls-server)
5. [Task 3: HTTPS Proxy (MITM Attack)](#task-3-https-proxy-mitm-attack)
6. [Conclusões](#conclusões)

---

## Introdução

Este lab explora o protocolo **Transport Layer Security (TLS)**, utilizado para proteger comunicações na Internet (HTTPS). O objetivo é compreender:

- Como funciona o handshake TLS
- Public Key Infrastructure (PKI) e certificados
- Implementação de clientes e servidores TLS
- Vulnerabilidades quando a PKI é comprometida (ataques MITM)

O script na pasta scripts do gtihub automatiza todo o processo de configuração e demonstração do lab, incluindo:
- Criação de uma Certificate Authority (CA)
- Geração de certificados para servidor
- Implementação de servidor HTTPS (Bank32)
- Implementação de proxy MITM (Antixerox)
- Demonstração do ataque Man-In-The-Middle

Todos os diagramas e esquemas foram gerados pelo GPT, assim evitamos perdas de tempos e poupamos trabalho.

---

### Arquitetura da rede

O lab utiliza três containers Docker com a seguinte topologia:

```
┌─────────────────┐         ┌─────────────────┐         ┌─────────────────┐
│  Client         │         │  MITM Proxy     │         │  Server         │
│  10.9.0.5       │◄───────►│  10.9.0.143     │◄───────►│  10.9.0.43      │
└─────────────────┘         └─────────────────┘         └─────────────────┘
```

### Componentes Principais

1. **Server (10.9.0.43)**: Servidor HTTPS legítimo "Bank32"
2. **Proxy (10.9.0.143)**: Atacante que realiza MITM
3. **Client (10.9.0.5)**: Cliente/vítima
4. **Host VM**: Browser usado para testes

### Certificados e PKI

O script cria a seguinte estrutura de certificados:

```
volumes/
├── ca/
│   ├── ca.crt          # Certificado da CA (público)
│   └── ca.key          # Chave privada da CA
├── server-certs/
│   ├── server.crt      # Certificado do servidor
│   └── server.key      # Chave privada do servidor
└── client-certs/
    └── ca.crt          # CA para validação pelo cliente
```

---

## Task 1: TLS Client

### Task 1.a: TLS Handshake

#### Código Implementado

O script cria `handshake.py` que demonstra o processo de handshake TLS:

```python
context = ssl.SSLContext(ssl.PROTOCOL_TLS_CLIENT)
context.load_verify_locations(capath=cadir)
context.verify_mode = ssl.CERT_REQUIRED
context.check_hostname = True

sock = socket.socket(socket.AF_INET, socket.SOCK_STREAM)
sock.connect((hostname, port))
ssock = context.wrap_socket(sock, server_hostname=hostname)
ssock.do_handshake()
```

#### Questões Respondidas

**1. Qual o cipher usado entre cliente e servidor?**

O cipher utilizado pode ser obtido com `ssock.cipher()`. Tipicamente, será algo como:
```
('ECDHE-RSA-AES128-GCM-SHA256', 'TLSv1.3', 128)
```

Isto indica:
- **ECDHE**: Elliptic Curve Diffie-Hellman Ephemeral (troca de chaves)
- **RSA**: Algoritmo de assinatura
- **AES128-GCM**: Cifra simétrica (Advanced Encryption Standard, 128 bits, Galois/Counter Mode)
- **SHA256**: Função hash para integridade

**2. Imprimir o certificado do servidor**

O certificado é obtido com `ssock.getpeercert()` e contém:
- `subject`: Informação sobre o proprietário
- `issuer`: CA que emitiu o certificado
- `version`: Versão X.509
- `notBefore`/`notAfter`: Validade temporal
- `subjectAltName`: Nomes alternativos (SAN)

**3. Propósito de `/etc/ssl/certs`**

Este diretório contém os certificados das **Certificate Authorities (CAs) confiáveis** do sistema. Durante o handshake TLS:
1. Servidor envia o certificado
2. Cliente verifica se foi assinado por uma CA em `/etc/ssl/certs`
3. Se válido, a conexão é estabelecida
4. Se inválido, conexão é rejeitada

**Relação TCP/TLS**:
- `sock.connect()` → Triggers TCP handshake
- `ssock.do_handshake()` → Triggers TLS handshake
- TLS é uma camada **sobre** TCP (daí "Transport Layer Security")

### Task 1.b: Certificado da CA

#### Problema

Ao usar `cadir = './client-certs'` (pasta vazia), o cliente **falha** porque não encontra o certificado da CA para validar o servidor.

#### Solução

1. Identificar qual CA assinou o certificado:
```bash
openssl x509 -in server.crt -noout -issuer
```

2. Copiar o certificado da CA:
```bash
cp /etc/ssl/certs/DigiCert_Global_Root_CA.pem ./client-certs/
```

3. Criar symbolic link com hash:
```bash
openssl x509 -in DigiCert_Global_Root_CA.pem -noout -subject_hash
# Output: 3513523f
ln -s DigiCert_Global_Root_CA.pem 3513523f.0
```

Ou usar `c_rehash`:
```bash
c_rehash ./client-certs/
```

#### Por que o hash?

O OpenSSL procura certificados com o formato: `<hash>.0`, `<hash>.1`, etc.
O hash é calculado do campo **subject** da CA, e isso permite lookup rápido.

### Task 1.c: Hostname Check

#### Experiência

```python
# Adicionar em /etc/hosts:
93.184.216.34 www.example2020.com

# Teste 1: check_hostname = True
context.check_hostname = True
# Resultado: ERRO - Certificate hostname mismatch

# Teste 2: check_hostname = False  
context.check_hostname = False
# Resultado: SUCESSO - Conexão estabelecida
```

#### Importância do Hostname Check

**Sem hostname verification**, um atacante pode:
1. Obter certificado válido para `attacker.com`
2. Redirecionar tráfego de `bank.com` para o próprio servidor
3. Apresentar certificado de `attacker.com`
4. Cliente aceita (certificado válido, mas nome errado!)
5. Atacante intercepta comunicação

**Com hostname verification**, o cliente verifica se:
```
Certificate CN/SAN == Hostname no URL
```

Se não coincidir → **Rejeita conexão** → Protege contra MITM

### Task 1.d: Enviar e Receber Dados

#### Código

```python
# Enviar HTTP Request
request = b"GET / HTTP/1.0\r\nHost: " + hostname.encode('utf-8') + b"\r\n\r\n"
ssock.sendall(request)

# Receber resposta
response = ssock.recv(2048)
while response:
    print(response.decode('utf-8'))
    response = ssock.recv(2048)
```

#### Fetching de Imagem

```python
request = b"GET /image.jpg HTTP/1.0\r\nHost: example.com\r\n\r\n"
ssock.sendall(request)

# Receber headers + body
full_response = b''
while True:
    chunk = ssock.recv(8192)
    if not chunk:
        break
    full_response += chunk

# Separar headers e body
headers, body = full_response.split(b'\r\n\r\n', 1)

# Guardar imagem
with open('image.jpg', 'wb') as f:
    f.write(body)
```

---

## Task 2: TLS Server

### Task 2.a: Servidor TLS Simples

#### Implementação

O script cria `server.py` com um servidor HTTPS completo:

```python
SERVER_CERT = './server-certs/server.crt'
SERVER_PRIVATE = './server-certs/server.key'

context = ssl.SSLContext(ssl.PROTOCOL_TLS_SERVER)
context.load_cert_chain(SERVER_CERT, SERVER_PRIVATE)

sock = socket.socket(socket.AF_INET, socket.SOCK_STREAM, 0)
sock.setsockopt(socket.SOL_SOCKET, socket.SO_REUSEADDR, 1)
sock.bind(('0.0.0.0', 443))
sock.listen(5)

while True:
    newsock, fromaddr = sock.accept()
    ssock = context.wrap_socket(newsock, server_side=True)
    data = ssock.recv(1024)
    ssock.sendall(html.encode('utf-8'))
    ssock.shutdown(socket.SHUT_RDWR)
    ssock.close()
```

#### Geração de Certificados

```bash
# 1. Criar CA
openssl genrsa -out ca.key 2048
openssl req -x509 -new -nodes -key ca.key -sha256 -days 3650 -out ca.crt \
    -subj "/C=PT/ST=Lab/O=AntixeroxCA/CN=Antixerox Root CA"

# 2. Criar chave do servidor
openssl genrsa -out server.key 2048

# 3. Criar CSR (Certificate Signing Request)
openssl req -new -key server.key -out server.csr \
    -subj "/C=PT/O=Antixerox/CN=www.antixerox.com"

# 4. CA assina o certificado
openssl x509 -req -in server.csr -CA ca.crt -CAkey ca.key \
    -CAcreateserial -out server.crt -days 365 -sha256
```

#### Teste com Cliente

**Com `/etc/ssl/certs`**: FALHA
- CA não está no sistema
- Cliente não confia no servidor

**Usando `./client-certs` com CA**: SUCESSO
- CA copiada para pasta
- `c_rehash` executado
- Cliente valida certificado

### Task 2.b: Teste com Browser

#### Processo

1. **Sem CA instalada**: Browser mostra aviso de segurança
   ```
   ⚠️ Your connection is not secure
   SEC_ERROR_UNKNOWN_ISSUER
   ```

2. **Instalar CA no Firefox**:
   - `about:preferences#privacy`
   - Certificates → View Certificates
   - Authorities → Import
   - Selecionar `ca.crt`
   - ✓ Trust this CA to identify websites

3. **Após instalação**: Browser aceita conexão
   - Cadeado verde aparece
   - Página "Bank32" é exibida corretamente

#### HTML Servido

O servidor retorna uma página HTML responsiva com:
- Informação sobre segurança SSL/TLS
- Badge "SSL/TLS Protected"

### Task 2.c: Certificados com Múltiplos Nomes (SAN)

#### Configuração OpenSSL

```ini
# server_openssl.cnf
[ req ]
prompt = no
distinguished_name = req_distinguished_name
req_extensions = req_ext

[ req_distinguished_name ]
C = PT
O = Antixerox
CN = www.antixerox.com

[ req_ext ]
subjectAltName = @alt_names

[alt_names]
DNS.1 = www.antixerox.com
DNS.2 = antixerox.com
DNS.3 = *.antixerox.com
DNS.4 = bank32.com
```

#### Geração

```bash
# Gerar CSR com SAN
openssl req -newkey rsa:2048 -config server_openssl.cnf \
    -sha256 -keyout server.key -out server.csr

# Assinar (com copy_extensions = copy)
openssl ca -md sha256 -days 3650 -config myopenssl.cnf \
    -in server.csr -out server.crt -cert ca.crt -keyfile ca.key
```

#### Verificação

```bash
openssl x509 -in server.crt -noout -text | grep -A 5 "Subject Alternative"
```

Output:
```
X509v3 Subject Alternative Name:
    DNS:www.antixerox.com
    DNS:antixerox.com
    DNS:*.antixerox.com
    DNS:bank32.com
```

Agora o servidor aceita conexões para **todos estes nomes**!

---

## Task 3: HTTPS Proxy (MITM Attack)

### Objetivo

Demonstrar um ataque **Man-In-The-Middle** quando a PKI é comprometida.

### Cenário do Ataque

```
Browser → [pensa que fala com Bank32]
    ↓
Proxy MITM (10.9.0.143)
    ↓ [usa certificado falso mas assinado pela CA comprometida]
Browser aceita conexão
    ↓
Proxy modifica conteúdo: "Bank32" → "antixerox"
    ↓
Browser recebe conteúdo alterado
```

### Implementação do Proxy

#### Estrutura

```python
def process_request(ssock_for_browser):
    # 1. Receber pedido do browser
    request = ssock_for_browser.recv(8192)
    
    # 2. Conectar ao servidor real
    context_client = ssl.SSLContext(ssl.PROTOCOL_TLS_CLIENT)
    context_client.load_verify_locations(capath='./client-certs')
    context_client.verify_mode = ssl.CERT_REQUIRED
    
    sock_for_server = socket.create_connection(('www.antixerox.com', 443))
    ssock_for_server = context_client.wrap_socket(sock_for_server, 
                                                   server_hostname='www.antixerox.com')
    
    # 3. Forward request
    ssock_for_server.sendall(request)
    
    # 4. Receber resposta
    full_response = b''
    while True:
        chunk = ssock_for_server.recv(8192)
        if not chunk:
            break
        full_response += chunk
        if b'</html>' in full_response.lower():
            break
    
    # 5. MODIFICAR RESPOSTA (ATAQUE!)
    modified = full_response.replace(b"Bank32", b"antixerox")
    modified = modified.replace(b"bank32", b"antixerox")
    
    # 6. Enviar resposta modificada para browser
    ssock_for_browser.sendall(modified)
```

#### Servidor do Proxy

```python
# Proxy age como servidor para o browser
SERVER_CERT = './server-certs/server.crt'
SERVER_PRIVATE = './server-certs/server.key'

context = ssl.SSLContext(ssl.PROTOCOL_TLS_SERVER)
context.load_cert_chain(SERVER_CERT, SERVER_PRIVATE)

sock = socket.socket(socket.AF_INET, socket.SOCK_STREAM, 0)
sock.bind(('0.0.0.0', 443))
sock.listen(5)

while True:
    sock_for_browser, fromaddr = sock.accept()
    ssock_for_browser = context.wrap_socket(sock_for_browser, server_side=True)
    
    # Threading para múltiplos pedidos
    t = threading.Thread(target=process_request, args=(ssock_for_browser,))
    t.daemon = True
    t.start()
```

### Configuração do Ataque

#### 1. Redirecionamento DNS

```bash
# Em /etc/hosts da vítima (host VM)
10.9.0.143 www.antixerox.com
```

Isto simula um ataque de DNS poisoning ou BGP hijacking.

#### 2. Configuração do Proxy

No container do proxy, usar DNS externo para alcançar servidor real:

```bash
# Em /etc/resolv.conf do proxy
nameserver 8.8.8.8
```

Ou no `docker-compose.yml`:
```yaml
dns:
  - 8.8.8.8
```

### Demonstração do Ataque

#### Fase 1: Servidor Legítimo

```
Browser (com CA instalada)
    ↓
https://www.antixerox.com → 10.9.0.43 (servidor real)
    ↓
Página exibida: "Welcome to Bank32"
✓ Cadeado verde (conexão segura)
```

#### Fase 2: MITM Ativo

```bash
# Script altera /etc/hosts
10.9.0.143 www.antixerox.com  # agora aponta para proxy
```

```
Browser (CTRL+SHIFT+R para reload)
    ↓
https://www.antixerox.com → 10.9.0.143 (PROXY!)
    ↓
Proxy apresenta certificado válido (assinado pela CA comprometida)
    ↓
Browser ACEITA (CA é confiável!)
    ↓
Proxy modifica resposta: Bank32 → antixerox
    ↓
Página exibida: "Welcome to antixerox"
✓ Cadeado verde (mas conteúdo alterado!)
```

### Logs do Ataque

**Server log** (`/tmp/server.log`):
```
[server] Starting Bank32 HTTPS Server...
[server] ✓ Bank32 listening on 0.0.0.0:443
```

**Proxy log** (`/tmp/proxy.log`):
```
[proxy] Starting MITM Proxy...
[proxy] ✓ MITM Proxy listening on 0.0.0.0:443
[proxy] ✓ Response modified (Bank32 -> antixerox)
```

### Por que o Ataque Funciona?

1. **CA Comprometida**: Atacante tem `ca.key`
2. **Certificado Válido**: Proxy usa certificado assinado pela CA
3. **Browser Confia**: CA está na lista de confiáveis
4. **Hostname Match**: Certificado tem CN correto
5. **TLS Estabelecido**: Cadeado verde aparece
6. **Vítima Não Suspeita**: Tudo parece legítimo

#### O que TLS Protege

- **Confidencialidade**: Dados cifrados
- **Integridade**: Detecção de modificação
- **Autenticação**: Verificação de identidade (se PKI íntegra)

#### O que TLS NÃO Protege

- **CA Compromise**: Todo o sistema é comprometido
- **Stolen Private Keys**: Atacante pode se passar por servidor
- **Phishing**: Atacantes podem ter certificados válidos para domínios similares
- **Malware no endpoint**: TLS protege em trânsito, não endpoints

### Importância do Hostname Check

**NUNCA desabilitar** `check_hostname`!

```python
# PERIGOSO
context.check_hostname = False

# SEGURO
context.check_hostname = True
```

Sem hostname check, qualquer certificado válido é aceite → MITM trivial.

### Verificação de Certificados

Um certificado deve ser validado em múltiplas dimensões:

```
1. Assinatura válida? (CA check)
2. CA confiável? (in /etc/ssl/certs)
3. Hostname match? (CN/SAN == URL)
4. Temporalmente válido? (notBefore < now < notAfter)
5. Não revogado? (CRL/OCSP check)
```

**TODOS** os checks devem passar!
