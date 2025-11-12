# Criptomoedas

A Criptomoeda é uma moeda digital **descentralizada**, que utiliza a **tecnologia "blockchain"** para garantir segurança, transparência e confiança nas transações.

Em vez de ser controlada por bancos ou governos, a criptomoeda funciona através de uma rede global de computadores que valida e regista todas as operações num **livro público imutável**. Cada transação é protegida por **"criptografia"**, impedindo falsificações ou alterações.

O **Bitcoin** foi a primeira criptomoeda, criada em 2009, e continua a ser a mais conhecida. Desde então, surgiram muitas outras, como **Ethereum**, **Cardano** e **Solana**, que introduzem novas funcionalidades, como os **contratos inteligentes**.

Em termos simples, as criptomoedas permitem enviar e receber valor pela internet de forma rápida, segura e sem intermediários — embora o seu valor de mercado seja altamente **volátil**.

---

## Smart Contract

Um **"Smart Contract"** (ou contrato inteligente) é um programa digital que **executa automaticamente regras** e **condições pré-definidas** dentro de uma **blockchain**, sem necessidade de intermediários.

É muito utilizado na rede **"Ethereum"**, onde permite **realizar transações seguras** e automáticas entre partes que **não se conhecem ou não confiam uma na outra**.

De forma simples, um **"Smart Contract"** funciona como um **contrato tradicional**, mas em vez de estar **escrito em papel**, está codificado num **sistema informático**. Quando as condições definidas são cumpridas, o contrato **executa-se sozinho**.

### Exemplo Prático

Imaginemos que quer emprestar 5 moedas **"Ethereum"** a alguém, mas não confia totalmente que essa pessoa as devolva. Pode então criar um **"Smart Contract"** que define as regras: _se o valor não for devolvido até uma data específica, o contrato reverte automaticamente a transação e o dinheiro regressa à sua conta_.

Assim, os **"Smart Contracts"** garantem **transparência**, **segurança** e **autonomia**, eliminando a necessidade de **confiar em terceiros** ou **depender de intermediários** como bancos ou advogados.

---

## Diffie-Hellman

O **Diffie-Hellman** é um **algoritmo de criptografia fundamental** que marcou o início da era moderna da segurança digital. Ele permite que duas partes estabeleçam **uma chave secreta compartilhada** mesmo através de um canal inseguro, sem que terceiros consigam interceptá-la ou descobri-la.

Criado em **1976** por **Whitfield Diffie** e **Martin Hellman**, foi apresentado no artigo clássico _"New Directions in Cryptography"_. Antes do Diffie-Hellman, não havia métodos confiáveis para trocar **chaves criptográficas** de forma segura através de canais vulneráveis, como a internet.

Em termos simples, o algoritmo permite que duas pessoas combinem informações públicas para gerar **uma chave secreta única**, que depois pode ser usada para **criptografar mensagens** de forma segura, garantindo confidencialidade mesmo em redes potencialmente perigosas.

### Como Funciona

O **Diffie-Hellman Key Exchange** não é usado para encriptar dados diretamente; ele serve para que duas partes gerem **uma chave secreta comum**. Essa chave pode depois ser usada com um algoritmo simétrico (como AES).

O princípio baseia-se em propriedades da **aritmética modular** e na **dificuldade do problema do logaritmo discreto**.

### Diagrama Visual do Processo

IMAGEM AQUI RAFA

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
