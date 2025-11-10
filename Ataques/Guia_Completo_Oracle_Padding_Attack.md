# Relatório: Laboratório de Ataque Padding Oracle

## Exercício 1: Compreender o Mecanismo de Padding

### Objectivo
Perceber como funciona o padding PKCS#5 em cifras de bloco que operam no modo CBC (Cipher Block Chaining).

### Procedimento Experimental

Criamos 3 ficheiros diferentes:

```bash
$ echo -n "12345" > ficheiro1.txt
$ echo -n "1234512345" > ficheiro2.txt  
$ echo -n "1234512345123456" > ficheiro3.txt
```

### Análise do Primeiro Ficheiro (5 bytes)

Ciframos o ficheiro utilizando AES-128-CBC:

```bash
$ openssl enc -aes-128-cbc -e -p -in ficheiro1.txt -out ficheiro1_cifrado.txt \
-K 00112233445566778889aabbccddeeff \
-iv 0102030405060708
```

**Observação importante**: O ficheiro cifrado resultou em 16 bytes. Isto acontece porque o AES-128 trabalha com blocos fixos de 16 bytes.

Para visualizar o padding aplicado, decifrei sem remover o padding automaticamente:

```bash
$ openssl enc -aes-128-cbc -d -nopad -p -in ficheiro1_cifrado.txt -out ficheiro1_decifrado.txt \
-K 00112233445566778889aabbccddeeff \
-iv 0102030405060708

$ hexdump -C ficheiro1_decifrado.txt
00000000  31 32 33 34 35 0b 0b 0b  0b 0b 0b 0b 0b 0b 0b 0b  |12345...........|
```

**Análise**: Como o conteúdo original tinha 5 bytes e o bloco precisa de ter 16 bytes, foram adicionados 11 bytes com valor `0x0b` (representação hexadecimal de 11).

### Padrão Identificado no PKCS#5

Após repetir o processo com os outros ficheiros, identificamos o seguinte padrão:

- **Ficheiro de 10 bytes**: Recebeu 6 bytes de padding com valor `0x06`
- **Ficheiro de 16 bytes**: Recebeu um bloco completo (16 bytes) de padding com valor `0x10`

**Conclusão**: A regra do PKCS#5 é: se faltam N bytes para completar o bloco, adicionam-se N bytes com valor N. Quando o tamanho já é múltiplo do bloco, adiciona-se um bloco inteiro de padding para evitar ambiguidade na decifragem.

### O Papel do Vetor de Inicialização (IV)

O modo CBC requer um IV para garantir que textos idênticos produzam cifrados diferentes. Isto é crítico para a segurança, pois impede que um atacante identifique padrões ao comparar cifrados.

## Exercício 2: Exploração do Oracle Padding

### Contextualização do Ataque

O servidor oracle possui uma mensagem secreta e fornece-nos:
- O texto cifrado (ciphertext)
- O Vetor de Inicialização (IV)

Podemos enviar combinações de IV e ciphertext, e o oracle informa-nos apenas se o padding está válido ou não. Esta informação aparentemente simples é suficiente para recuperarmos o texto original.

### Fundamentos Teóricos da Exploração

No modo CBC, a decifragem funciona da seguinte forma:

```
Plaintext = CiphertextAnterior ⊕ Decrypt(CiphertextAtual)
```

Vou focar-me no último bloco. Consideremos:
- `C1` e `C2`: primeiro e segundo blocos do ciphertext
- `D2`: saída da decifragem do bloco `C2`
- `P2`: plaintext do segundo bloco

A relação é: `P2 = C1 ⊕ D2`

### Estratégia de Ataque

Se conseguirmos descobrir `D2`, poderemos calcular `P2`. A ideia é manipular `C1` (vou chamar à versão manipulada `CC1`) e observar quando o padding fica válido.

#### Descobrir o Último Byte

Começo por assumir que quero um padding válido de `0x01`:

1. Modifico apenas o último byte de `CC1`, testamos valores de 0 a 255
2. Para cada valor, envio `IV + CC1 + C2` ao oracle
3. Quando o oracle retorna "válido", sei que `CC1[15] ⊕ D2[15] = 0x01`
4. Logo: `D2[15] = CC1[15] ⊕ 0x01`

#### Descobrir os Bytes Subsequentes

Para o penúltimo byte, preciso de padding `0x02 0x02`:

1. Primeiro, ajusto `CC1[15]` para que produza `0x02`: `CC1[15] = D2[15] ⊕ 0x02`
2. Depois testo valores para `CC1[14]` até obter padding válido
3. Quando válido: `D2[14] = CC1[14] ⊕ 0x02`

Este processo repete-se para todos os 16 bytes.

### Execução Manual (Primeiros 6 Bytes)

Dados obtidos do oráculo:
```
C1 = a9b2554b0944118061212098f2f238cd
C2 = 779ea0aae3d9d020f3677bfcb3cda9ce
```

**Byte 16 (último byte)**
- Valor encontrado: `CC1[15] = 0xcf`
- Cálculo: `D2[15] = 0x01 ⊕ 0xcf = 0xce`
- Plaintext: `P2[15] = 0xcd ⊕ 0xce = 0x03`

**Byte 15**
- Ajuste do byte 16: `CC1[15] = 0xce ⊕ 0x02 = 0xcc`
- Valor encontrado: `CC1[14] = 0x39`
- Cálculo: `D2[14] = 0x02 ⊕ 0x39 = 0x3b`
- Plaintext: `P2[14] = 0xf2 ⊕ 0x3b = 0x03`

**Byte 14**
- Ajustes: `CC1[15] = 0xcd`, `CC1[14] = 0x38`
- Valor encontrado: `CC1[13] = 0xf2`
- Cálculo: `D2[13] = 0x03 ⊕ 0xf2 = 0xf1`
- Plaintext: `P2[13] = 0xf2 ⊕ 0xf1 = 0x03`

**Byte 13**
- Valor encontrado: `CC1[12] = 0x18`
- Cálculo: `D2[12] = 0x04 ⊕ 0x18 = 0x1c`
- Plaintext: `P2[12] = 0x98 ⊕ 0x1c = 0xee`

**Byte 12**
- Valor encontrado: `CC1[11] = 0x40`
- Cálculo: `D2[11] = 0x05 ⊕ 0x40 = 0x45`
- Plaintext: `P2[11] = 0x20 ⊕ 0x45 = 0xdd`

**Byte 11**
- Valor encontrado: `CC1[10] = 0xea`
- Cálculo: `D2[10] = 0x06 ⊕ 0xea = 0xec`
- Plaintext: `P2[10] = 0x21 ⊕ 0xec = 0xcc`

**Resultado parcial**: `0xccddee030303`

Os últimos 3 bytes (`0x03`) representam o padding válido.

### Automatização com Python

Script para automatizar o processo:

```python
#!/usr/bin/python3
import socket
from binascii import hexlify, unhexlify

def xor(first, second):
    return bytearray(x^y for x,y in zip(first, second))

class PaddingOracle:
    def __init__(self, host, port):
        self.s = socket.socket(socket.AF_INET, socket.SOCK_STREAM)
        self.s.connect((host, port))
        ciphertext = self.s.recv(4096).decode().strip()
        self.ctext = unhexlify(ciphertext)

    def decrypt(self, ctext: bytes):
        self._send(hexlify(ctext))
        return self._recv()

    def _recv(self):
        return self.s.recv(4096).decode().strip()

    def _send(self, hexstr: bytes):
        self.s.send(hexstr + b'\n')

    def __del__(self):
        self.s.close()

def decryptBlock(K, current_padding, CC1, D2, C2):
    if K > 16:
        return CC1, D2

    for i in range(256):
        CC1[16 - K] = i
        status = oracle.decrypt(IV + CC1 + C2)
        CC1_backup = CC1.copy()
        D2_backup = D2.copy()

        if status == "Valid":
            # Descobrimos o byte correto
            aux = hex(i)[2:].zfill(2)
            D2[16 - K] = int(xor(bytearray.fromhex(current_padding), 
                                 bytearray.fromhex(aux)).hex(), base=16)
            
            # Atualizar padding para próxima iteração
            current_padding = hex(int(current_padding, base=16) + 1)[2:].zfill(2)
            
            # Ajustar bytes já descobertos para novo padding
            for x in range(1, K + 1):
                auxD2 = hex(D2[16 - x])[2:].zfill(2)
                CC1[16 - x] = int(xor(bytearray.fromhex(current_padding), 
                                     bytearray.fromhex(auxD2)).hex(), base=16)

            print(f"Encontrado: byte = 0x{i:02x}")
            print(f"CC1: {CC1.hex()}")

            # Recursão para próximo byte
            CC1, D2 = decryptBlock(K + 1, current_padding, CC1, D2, C2)
            if CC1 != [] and D2 != []:
                return CC1, D2

        # Backtracking se necessário
        CC1 = CC1_backup
        D2 = D2_backup

    return [], []

if __name__ == "__main__":
    oracle = PaddingOracle('10.9.0.80', 5000)

    iv_and_ctext = bytearray(oracle.ctext)
    IV = iv_and_ctext[0:16]
    C1 = iv_and_ctext[16:32]
    C2 = iv_and_ctext[32:48]

    print(f"C1: {C1.hex()}")
    print(f"C2: {C2.hex()}")

    # Inicializar estruturas
    D2 = bytearray(16)
    CC1 = bytearray(16)

    # Executar ataque
    current_padding = "01"
    CC1, D2 = decryptBlock(1, current_padding, CC1, D2, C2)

    # Recuperar plaintext
    P2 = xor(C1, D2)
    print(f"P2: {P2.hex()}")
```

### Resultado Final

Ao executar o script:

```
C1: a9b2554b0944118061212098f2f238cd
C2: 779ea0aae3d9d020f3677bfcb3cda9ce
[... iterações ...]
P2: 1122334455667788aabbccddee030303
```

Mensagem recuperada do segundo bloco: `1122334455667788aabbccddee` (mais 3 bytes de padding).

## Exercício 3: Ataque Completo Automatizado

### Nova Configuração

O servidor na porta 6000 fornece:
- 16 bytes de IV
- 48 bytes de ciphertext (3 blocos de 16 bytes cada)

Objectivo: recuperar todos os blocos automaticamente.

### Estratégia Modificada

A abordagem é processar os blocos de trás para frente:

1. **Bloco 3**: Usar o Bloco 2 como "IV modificável" para descobrir D3, depois calcular P3
2. **Bloco 2**: Usar o Bloco 1 como "IV modificável" para descobrir D2, depois calcular P2
3. **Bloco 1**: Usar o IV real para descobrir D1, depois calcular P1

### Implementação Completa

```python
#!/usr/bin/python3
import socket
from binascii import hexlify, unhexlify

def xor(first, second):
    return bytearray(x^y for x,y in zip(first, second))

class PaddingOracle:
    def __init__(self, host, port):
        self.s = socket.socket(socket.AF_INET, socket.SOCK_STREAM)
        self.s.connect((host, port))
        ciphertext = self.s.recv(4096).decode().strip()
        self.ctext = unhexlify(ciphertext)

    def decrypt(self, ctext: bytes):
        self._send(hexlify(ctext))
        return self._recv()

    def _recv(self):
        return self.s.recv(4096).decode().strip()

    def _send(self, hexstr: bytes):
        self.s.send(hexstr + b'\n')

    def __del__(self):
        self.s.close()

def decryptBlock(K, current_padding, CC1, D2, C2):
    if K > 16:
        return CC1, D2

    for i in range(256):
        CC1[16 - K] = i
        status = oracle.decrypt(IV + CC1 + C2)
        CC1_backup = CC1.copy()
        D2_backup = D2.copy()

        if status == "Valid":
            aux = hex(i)[2:].zfill(2)
            D2[16 - K] = int(xor(bytearray.fromhex(current_padding), 
                                 bytearray.fromhex(aux)).hex(), base=16)
            current_padding = hex(int(current_padding, base=16) + 1)[2:].zfill(2)
            
            for x in range(1, K + 1):
                auxD2 = hex(D2[16 - x])[2:].zfill(2)
                CC1[16 - x] = int(xor(bytearray.fromhex(current_padding), 
                                     bytearray.fromhex(auxD2)).hex(), base=16)

            print(f"Encontrado: byte = 0x{i:02x}")
            print(f"CC1: {CC1.hex()}")

            CC1, D2 = decryptBlock(K + 1, current_padding, CC1, D2, C2)
            if CC1 != [] and D2 != []:
                return CC1, D2

        CC1 = CC1_backup
        D2 = D2_backup

    return [], []

if __name__ == "__main__":
    oracle = PaddingOracle('10.9.0.80', 6000)
    BLOCK_SIZE = 16

    iv_and_ctext = bytearray(oracle.ctext)
    num_blocks = int((len(iv_and_ctext) - BLOCK_SIZE) / BLOCK_SIZE)
    IV = iv_and_ctext[0:BLOCK_SIZE]

    mensagem_completa = ""
    bloco_atual = num_blocks

    # Processar blocos do último para o primeiro (exceto o primeiro)
    for idx in range(num_blocks - 1):
        inicio_bloco_anterior = (num_blocks - idx - 2) * BLOCK_SIZE
        inicio_bloco_atual = (num_blocks - idx - 1) * BLOCK_SIZE
        
        bloco_anterior = iv_and_ctext[inicio_bloco_anterior:inicio_bloco_anterior + BLOCK_SIZE]
        bloco_atual = iv_and_ctext[inicio_bloco_atual:inicio_bloco_atual + BLOCK_SIZE]
        
        print(f"\n{'='*60}")
        print(f"Processando Bloco {bloco_atual}")
        print(f"Bloco Anterior: {bloco_anterior.hex()}")
        print(f"Bloco Atual: {bloco_atual.hex()}")
        print(f"{'='*60}\n")

        # Inicializar
        D = bytearray(16)
        CC = bytearray(16)

        # Executar ataque
        current_padding = "01"
        CC, D = decryptBlock(1, current_padding, CC, D, bloco_atual)

        # Recuperar plaintext
        P = xor(bloco_anterior, D)
        print(f"\n>>> Bloco {bloco_atual} decifrado: {P.hex()}")
        mensagem_completa = P.hex() + mensagem_completa
        bloco_atual -= 1

    # Processar primeiro bloco (caso especial - usa IV)
    print(f"\n{'='*60}")
    print(f"Processando Bloco 1 (com IV)")
    print(f"{'='*60}\n")
    
    CC = bytearray(16)
    D = bytearray(16)
    current_padding = "01"
    CC, D = decryptBlock(1, current_padding, CC, D, iv_and_ctext[16:32])
    P = xor(D, IV)
    
    print(f"\n>>> Bloco 1 decifrado: {P.hex()}")
    mensagem_completa = P.hex() + mensagem_completa

    print(f"\n{'='*60}")
    print(f"MENSAGEM COMPLETA")
    print(f"{'='*60}")
    print(f"HEX: {mensagem_completa}")
    print(f"ASCII: {bytes.fromhex(mensagem_completa).decode('unicode_escape')}")
```

### Resultado da Execução

```
[... processamento dos blocos ...]

============================================================
MENSAGEM COMPLETA
============================================================
HEX: 285e5f5e29285e5f5e29205468652053454544204c616273206172652067726561742120285e5f5e29285e5f5e290202
ASCII: (^_^)(^_^) The SEED Labs are great! (^_^)(^_^)
```
