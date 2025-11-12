
## Diffie-Hellman

O **Diffie-Hellman** é um **algoritmo de criptografia fundamental** que marcou o início da era moderna da segurança digital. Ele permite que duas partes estabeleçam **uma chave secreta compartilhada** mesmo através de um canal inseguro, sem que terceiros consigam interceptá-la ou descobri-la.

Criado em **1976** por **Whitfield Diffie** e **Martin Hellman**, foi apresentado no artigo clássico _"New Directions in Cryptography"_. Antes do Diffie-Hellman, não havia métodos confiáveis para trocar **chaves criptográficas** de forma segura através de canais vulneráveis, como a internet.

Em termos simples, o algoritmo permite que duas pessoas combinem informações públicas para gerar **uma chave secreta única**, que depois pode ser usada para **criptografar mensagens** de forma segura, garantindo confidencialidade mesmo em redes potencialmente perigosas.

### Como Funciona

O **Diffie-Hellman Key Exchange** não é usado para encriptar dados diretamente; ele serve para que duas partes gerem **uma chave secreta comum**. Essa chave pode depois ser usada com um algoritmo simétrico (como AES).

O princípio baseia-se em propriedades da **aritmética modular** e na **dificuldade do problema do logaritmo discreto**.

### Diagrama Visual do Processo

![IMAGE](./assets/asset-criptomoedas.png)

### Passos Simplificados

1. Ambos os utilizadores concordam publicamente em dois números:
   - Um número primo grande **p**
   - Uma base **g** (gerador)

2. Cada um escolhe um **segredo privado**:
   - Ana escolhe **a**
   - Berto escolhe **b**

3. Cada um calcula um **valor público**:
   - Ana envia: `A = g^a mod p`
   - Berto envia: `B = g^b mod p`

4. Cada um calcula a **chave secreta partilhada**:
   - Ana: `K = B^a mod p`
   - Berto: `K = A^b mod p`

5. O resultado é o mesmo: `K = g^(ab) mod p`

---

## Exemplo com Números

### Configuração

- Número primo: **p = 11**
- Base: **g = 2**
- Segredo de Ana: **a = 3**
- Segredo de Berto: **b = 7**

### 1. Cálculo das Chaves Públicas

**Ana:**
```
A = g^a mod p = 2^3 mod 11
2^3 = 8
8 mod 11 = 8
```
Ana envia **8** para Berto.

**Berto:**
```
B = g^b mod p = 2^7 mod 11

Passo a passo:
2^1 = 2 mod 11 = 2
2^2 = 4 mod 11 = 4
2^4 = (2^2)^2 = 4^2 = 16 mod 11 = 5
2^7 = 2^4 × 2^2 × 2^1 = 5 × 4 × 2 = 40 mod 11 = 40 - 33 = 7
```
Berto envia **7** para Ana.

### 2. Cálculo do Segredo Partilhado

**Ana:**
```
S = B^a mod p = 7^3 mod 11

7^2 = 49 mod 11 = 49 - 44 = 5
7^3 = 7^2 × 7 = 5 × 7 = 35 mod 11 = 35 - 33 = 2
```

**Berto:**
```
S = A^b mod p = 8^7 mod 11

Passo a passo:
8^2 = 64 mod 11 = 64 - 55 = 9
8^4 = 9^2 = 81 mod 11 = 81 - 77 = 4
8^7 = 8^4 × 8^2 × 8 = 4 × 9 × 8 = 288 mod 11 = 288 - 286 = 2
```

### Resultado Final

O segredo partilhado entre Ana e Berto é **2**.

---

## Estado Atual do Diffie-Hellman

Atualmente, o algoritmo **Diffie-Hellman** clássico caiu em desuso devido às suas vulnerabilidades a ataques **"Man-in-the-Middle" (MiTM)** e à facilidade de quebrar chaves quando **números primos pequenos eram utilizados**.

Apesar disso, continua a ser extremamente útil para ensinar os **princípios fundamentais da criptografia** e da **troca segura de chaves**.

Hoje em dia, existe uma versão aprimorada do **Diffie-Hellman**, baseada em **curvas elípticas** (conhecida como **Elliptic Curve Diffie-Hellman - ECDH**), que oferece maior segurança com chaves menores e é **amplamente utilizada** em **protocolos modernos de comunicação segura**, como **TLS/HTTPS** e **criptomoedas**.
